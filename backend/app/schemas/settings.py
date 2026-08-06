from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel

from app.db.models import SubscriptionStatus, SubscriptionTier

# The complete, fixed set of categories any notification can ever be written
# with today (app/services/notifications.py's three call sites). Kept here,
# not inferred from the DB, so the frontend can render a toggle for every
# category that actually exists — including ones a user has never received
# yet — without a round trip.
NOTIFICATION_CATEGORIES: list[str] = [
    "analysis_complete",
    "roadmap_updated",
    "cv_feedback_complete",
]


class AccountRead(BaseModel):
    """PRD §22 screen 13 — Settings: Account."""

    email: str
    member_since: datetime


class SubscriptionRead(BaseModel):
    """FR-SET-1."""

    tier: SubscriptionTier
    status: SubscriptionStatus
    cancellation_reason: str | None = None


class SubscriptionCancelRequest(BaseModel):
    """FR-RENEW-2: optional, non-blocking — never required."""

    reason: str | None = None


class RenewalRecapRead(BaseModel):
    """FR-RENEW-1. No payment processor is integrated in this stack (see
    backend/README.md's Known gaps) — there is no actual billing-cycle event
    to trigger this from. This recap is instead computed on demand from the
    user's real data and available any time, which is what FR-RENEW-1's own
    content requirement ("skills closed, roadmap completed") actually is,
    independent of when it's shown."""

    member_since: datetime
    skills_addressed_count: int
    roadmap_items_completed_count: int
    roadmap_items_total_count: int
    cv_feedback_rounds_count: int


class NotificationPreferenceRead(BaseModel):
    """FR-NOTIF-3."""

    muted_categories: list[str]
    available_categories: list[str] = NOTIFICATION_CATEGORIES


class NotificationPreferenceUpdate(BaseModel):
    muted_categories: list[str]


class DataOverviewRead(BaseModel):
    """SAS Part IV §20.3 — Data Access Request. BR-DATA-6/DPR-14: nothing
    used to personalize the experience is hidden from the user."""

    profile_present: bool
    goals_count: int
    skill_gap_analyses_count: int
    roadmaps_count: int
    cv_feedback_rounds_count: int
    notifications_count: int
    subscription_tier: SubscriptionTier | None
