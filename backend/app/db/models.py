"""SQLAlchemy models for CareerOS's persistent state.

Two distinct categories, per SAS §3.4-3.5 / PRD §24.12:

1. **Career Knowledge Graph entities** (Profile, Goal, SkillGapAnalysis,
   Roadmap, RoadmapItem, CVFeedbackRound and their children) — exactly the
   entities PRD §24.3 names. Each is annotated with which module/agent
   exclusively writes it (SAS §13.5, §25.8) — enforce this in the service
   layer that calls these models, not only in this docstring.
2. **Account-level data** (User/Identity, NotificationRecord, Subscription)
   — exists alongside the graph, never inside it (SAS §3.5, PRD §24.12).
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.types import GUID


def _uuid_pk() -> Mapped[uuid.UUID]:
    return mapped_column(GUID(as_uuid=True), primary_key=True, default=uuid.uuid4)


def _uuid_fk(target: str, **kwargs) -> Mapped[uuid.UUID]:
    return mapped_column(GUID(as_uuid=True), ForeignKey(target), **kwargs)


class ConfidenceLevel(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class RoadmapItemStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class CVFeedbackCategory(str, enum.Enum):
    FACTUAL_STRUCTURAL = "factual_structural"
    JUDGMENT_CALL = "judgment_call"


class SubscriptionTier(str, enum.Enum):
    FREE = "free"
    PAID = "paid"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    CANCELED = "canceled"


# --- Account-level data (outside the Career Knowledge Graph, SAS §3.5) -----


class User(Base):
    """Identity (Authentication module, FR-AUTH-4). Every other table
    anchors to this via user_id; this table itself is never read by any
    Intelligence Layer agent as career substance."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = _uuid_pk()
    clerk_user_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    profile: Mapped["Profile | None"] = relationship(back_populates="user", uselist=False)
    goals: Mapped[list["Goal"]] = relationship(back_populates="user")
    subscription: Mapped["Subscription | None"] = relationship(back_populates="user", uselist=False)
    notification_preference: Mapped["NotificationPreference | None"] = relationship(
        back_populates="user", uselist=False
    )


class Subscription(Base):
    """Settings module (FR-SET-1, FR-SET-4). Account-level, explicitly
    outside the Career Knowledge Graph (PRD §24.12 scope discipline)."""

    __tablename__ = "subscriptions"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", unique=True, nullable=False)
    tier: Mapped[SubscriptionTier] = mapped_column(Enum(SubscriptionTier), default=SubscriptionTier.FREE)
    status: Mapped[SubscriptionStatus] = mapped_column(Enum(SubscriptionStatus), default=SubscriptionStatus.ACTIVE)
    current_period_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="FR-RENEW-2: optional, non-blocking — the user is never required to provide one.",
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="subscription")


class NotificationRecord(Base):
    """Notifications module (FR-NOTIF-1/2/4). Reads Career Knowledge Graph
    events as triggers (SAS §15.2); writes nothing back into the graph."""

    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", nullable=False, index=True)
    category: Mapped[str] = mapped_column(String, nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NotificationPreference(Base):
    """FR-NOTIF-3: control notification category. No delivery-frequency
    setting exists because there is no delivery channel beyond in-app
    (Platform Surface is web-only, PRD §13/§55; no email/SMS infrastructure
    is part of this stack) — muting a category is the whole of what "control"
    means until a delivery channel exists to have a frequency at all. This
    is an honest scope boundary, not an unfinished feature; see
    `backend/README.md`."""

    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", unique=True, nullable=False)
    muted_categories: Mapped[list[str]] = mapped_column(JSON, default=list)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="notification_preference")


# --- Career Knowledge Graph: User Profiles module (FR-PROF) ----------------


class Profile(Base):
    """Owned exclusively by the User Profiles module — never written by any
    AI Career Center agent (SAS §14.3, §14.9)."""

    __tablename__ = "profiles"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", unique=True, nullable=False)
    background: Mapped[str] = mapped_column(Text, default="")
    education: Mapped[str] = mapped_column(Text, default="")
    experience: Mapped[str] = mapped_column(Text, default="")
    skills: Mapped[list[str]] = mapped_column(JSON, default=list)
    onboarding_completed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        comment="Set once the first Skill-Gap Analysis succeeds (FR-ONBOARD-1's endpoint), "
        "never by a direct client write.",
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="profile")


class Goal(Base):
    """Owned exclusively by the User Profiles module (SAS §14.3). BR-GOAL-1:
    exactly one active goal at a time — enforced in the service layer, since
    a partial unique index on (user_id) WHERE is_active is a migration-level
    concern, not an ORM-level one."""

    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", nullable=False, index=True)
    target_role: Mapped[str] = mapped_column(String, nullable=False)
    target_field: Mapped[str] = mapped_column(String, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="goals")


# --- Career Knowledge Graph: AI Career Center module (FR-AICC) -------------
# Owned exclusively by the Skill-Gap Analysis Agent (SAS §14.3-14.4).


class SkillGapAnalysis(Base):
    __tablename__ = "skill_gap_analyses"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", nullable=False, index=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    summary: Mapped[str] = mapped_column(Text, default="")
    confidence: Mapped[ConfidenceLevel] = mapped_column(Enum(ConfidenceLevel), nullable=False)
    confidence_reason: Mapped[str] = mapped_column(Text, default="")
    grounded_on: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    gaps: Mapped[list["SkillGapItem"]] = relationship(back_populates="analysis", cascade="all, delete-orphan")


class SkillGapItem(Base):
    __tablename__ = "skill_gap_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    analysis_id: Mapped[uuid.UUID] = _uuid_fk("skill_gap_analyses.id", nullable=False)
    skill: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    severity: Mapped[ConfidenceLevel] = mapped_column(Enum(ConfidenceLevel), default=ConfidenceLevel.MEDIUM)

    analysis: Mapped["SkillGapAnalysis"] = relationship(back_populates="gaps")


# Owned exclusively by the Roadmap Agent — item *content* only; item *status*
# is exclusively user-controlled (SAS §25.8, demonstrated in SAS Part IV §21.3).


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", nullable=False, index=True)
    analysis_id: Mapped[uuid.UUID] = _uuid_fk("skill_gap_analyses.id", nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False)
    confidence: Mapped[ConfidenceLevel] = mapped_column(Enum(ConfidenceLevel), nullable=False)
    grounded_on: Mapped[list[str]] = mapped_column(JSON, default=list)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["RoadmapItem"]] = relationship(back_populates="roadmap", cascade="all, delete-orphan")


class RoadmapItem(Base):
    __tablename__ = "roadmap_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    roadmap_id: Mapped[uuid.UUID] = _uuid_fk("roadmaps.id", nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)  # agent-owned
    description: Mapped[str] = mapped_column(Text, default="")  # agent-owned
    addresses_gap: Mapped[str] = mapped_column(String, default="")  # agent-owned
    status: Mapped[RoadmapItemStatus] = mapped_column(
        Enum(RoadmapItemStatus), default=RoadmapItemStatus.NOT_STARTED
    )  # user-owned (BR-AI-2) — written only via the status-change endpoint, never by the Roadmap Agent

    roadmap: Mapped["Roadmap"] = relationship(back_populates="items")
    status_history: Mapped[list["RoadmapItemStatusChange"]] = relationship(
        back_populates="item", cascade="all, delete-orphan"
    )


class RoadmapItemStatusChange(Base):
    """BR-ROAD-6: reopening a completed item does not erase its original
    completion record — every status change is appended, never overwritten."""

    __tablename__ = "roadmap_item_status_changes"

    id: Mapped[uuid.UUID] = _uuid_pk()
    item_id: Mapped[uuid.UUID] = _uuid_fk("roadmap_items.id", nullable=False)
    status: Mapped[RoadmapItemStatus] = mapped_column(Enum(RoadmapItemStatus), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    item: Mapped["RoadmapItem"] = relationship(back_populates="status_history")


# Owned exclusively by the CV/Profile Feedback Agent — independent of
# Skill-Gap Analysis and Roadmap (PRD §25.6).


class CVFeedbackRound(Base):
    __tablename__ = "cv_feedback_rounds"

    id: Mapped[uuid.UUID] = _uuid_pk()
    user_id: Mapped[uuid.UUID] = _uuid_fk("users.id", nullable=False, index=True)
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    document_storage_path: Mapped[str] = mapped_column(
        String, nullable=False, comment="Path within Supabase Storage bucket, not the raw document bytes."
    )
    document_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="",
        comment="The actual submitted text — needed so FR-AICC-18 (view past rounds) and "
        "on-request explanation (RAI-4) can show/reground against what was actually submitted, "
        "not just a storage-path placeholder.",
    )
    confidence: Mapped[ConfidenceLevel] = mapped_column(Enum(ConfidenceLevel), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    items: Mapped[list["CVFeedbackItem"]] = relationship(back_populates="round", cascade="all, delete-orphan")


class CVFeedbackItem(Base):
    __tablename__ = "cv_feedback_items"

    id: Mapped[uuid.UUID] = _uuid_pk()
    round_id: Mapped[uuid.UUID] = _uuid_fk("cv_feedback_rounds.id", nullable=False)
    category: Mapped[CVFeedbackCategory] = mapped_column(Enum(CVFeedbackCategory), nullable=False)
    note: Mapped[str] = mapped_column(Text, nullable=False)
    relevance_to_goal: Mapped[str] = mapped_column(Text, default="")

    round: Mapped["CVFeedbackRound"] = relationship(back_populates="items")
