"""Pydantic DTOs for what crosses the Intelligence <-> Knowledge boundary.

Mirrors SAS Part II, Section 11 (Intelligence <-> Knowledge Contract):
- Knowledge -> Intelligence: a read of specific entities an agent is permitted
  to read (SAS §11.2, §25.4-25.6).
- Intelligence -> Knowledge: a write scoped exclusively to the entity an agent
  owns (SAS §11.2, §25.8).

These are intentionally decoupled from the backend's SQLAlchemy models
(backend/app/db/models.py) — the Knowledge Layer's persistence is owned by
`backend`, never by `ai` (SAS §3.12: Intelligence never becomes a source of
truth). `ai` only ever sees these DTOs, assembled by the caller from the
Knowledge Layer's current state.
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    """BR-AI-4 / FR-AICC-3: confidence must be presented wherever reduced."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


# --- Read-only reference entities (never written by any agent) -------------


class ProfileSnapshot(BaseModel):
    """Owned and written exclusively by the User Profiles module (SAS §14.3)."""

    user_id: UUID
    background: str = ""
    education: str = ""
    experience: str = ""
    skills: list[str] = Field(default_factory=list)


class GoalSnapshot(BaseModel):
    """Owned and written exclusively by the User Profiles module (SAS §14.3)."""

    user_id: UUID
    target_role: str
    target_field: str = ""


# --- Skill-Gap Analysis (owned by the Skill-Gap Analysis Agent) ------------


class SkillGap(BaseModel):
    skill: str
    description: str
    severity: ConfidenceLevel = ConfidenceLevel.MEDIUM


class SkillGapAnalysisInput(BaseModel):
    profile: ProfileSnapshot
    goal: GoalSnapshot
    previous_version: SkillGapAnalysisOutput | None = None


class SkillGapAnalysisOutput(BaseModel):
    """FR-AICC-1/2/3/6: specific gaps, never only an aggregate score;
    confidence exposed whenever meaningfully uncertain; changed-from-previous
    is a separate Change Awareness step (SAS §26.3), not part of this shape.
    """

    gaps: list[SkillGap]
    summary: str
    confidence: ConfidenceLevel
    confidence_reason: str = ""
    grounded_on: list[str] = Field(
        default_factory=list,
        description="Which specific Profile/Goal fields this output is grounded in (PRD §26.3 Grounding).",
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- Roadmap (owned by the Roadmap Agent) -----------------------------------


class RoadmapItemContent(BaseModel):
    """Agent-written content only — status is exclusively user-controlled
    (SAS §25.8, demonstrated in SAS Part IV §21.3: a Roadmap Item's status
    field is never in the Roadmap Agent's write-ownership)."""

    title: str
    description: str
    addresses_gap: str


class RoadmapInput(BaseModel):
    analysis: SkillGapAnalysisOutput
    previous_version: RoadmapOutput | None = None


class RoadmapOutput(BaseModel):
    items: list[RoadmapItemContent]
    confidence: ConfidenceLevel
    grounded_on: list[str] = Field(default_factory=list)
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# --- CV / Profile Feedback (owned by the CV/Profile Feedback Agent) --------


class CVFeedbackItem(BaseModel):
    """FR-AICC-15: distinguish factual/structural issues from judgment calls.

    `category` is a real Literal, not a loose `str` — the backend's DB
    column (`CVFeedbackCategory`, a strict SQLAlchemy Enum,
    `backend/app/db/models.py`) only accepts these two exact values.
    Before this was a Literal, a hallucinated category string from the
    LLM would pass straight through Pydantic (nothing constrained it),
    the agent's own try/except (the failure happens later, at DB commit
    — after the agent call has already returned successfully), and only
    surface as an unhandled 500 at `db.commit()` time. As a Literal,
    LangChain's structured-output parsing rejects an invalid value
    immediately, which the existing `except Exception: raise
    GenerationFailed(...)` in `agents/cv_feedback.py` already converts
    into the same controlled 502 every other agent failure produces."""

    category: Literal["factual_structural", "judgment_call"]
    note: str
    relevance_to_goal: str


class CVFeedbackInput(BaseModel):
    """Reads only the active Goal and the submitted document — explicitly
    independent of Skill-Gap Analysis and Roadmap (PRD §25.6)."""

    goal: GoalSnapshot
    document_text: str


class CVFeedbackOutput(BaseModel):
    items: list[CVFeedbackItem]
    confidence: ConfidenceLevel
    generated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


SkillGapAnalysisInput.model_rebuild()
RoadmapInput.model_rebuild()
