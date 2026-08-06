from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import ConfidenceLevel, CVFeedbackCategory, RoadmapItemStatus


class SkillGapItemRead(BaseModel):
    id: UUID
    skill: str
    description: str
    severity: ConfidenceLevel

    model_config = {"from_attributes": True}


class SkillGapAnalysisRead(BaseModel):
    id: UUID
    version: int
    summary: str
    confidence: ConfidenceLevel
    confidence_reason: str
    grounded_on: list[str]
    created_at: datetime
    gaps: list[SkillGapItemRead]

    model_config = {"from_attributes": True}


class RoadmapItemRead(BaseModel):
    id: UUID
    title: str
    description: str
    addresses_gap: str
    status: RoadmapItemStatus

    model_config = {"from_attributes": True}


class RoadmapRead(BaseModel):
    id: UUID
    version: int
    confidence: ConfidenceLevel
    created_at: datetime
    items: list[RoadmapItemRead]

    model_config = {"from_attributes": True}


class RoadmapItemStatusUpdate(BaseModel):
    """BR-AI-2: the user retains final control — this is the one write path
    the Roadmap Agent never uses (SAS Part IV §21.3)."""

    status: RoadmapItemStatus


class CVFeedbackSubmitRequest(BaseModel):
    """FR-AICC-13. A JSON body, not a query parameter — a submitted
    document's text has no practical length bound suitable for a URL."""

    document_text: str


class CVFeedbackItemRead(BaseModel):
    id: UUID
    category: CVFeedbackCategory
    note: str
    relevance_to_goal: str

    model_config = {"from_attributes": True}


class CVFeedbackRoundRead(BaseModel):
    id: UUID
    round_number: int
    document_text: str
    confidence: ConfidenceLevel
    created_at: datetime
    items: list[CVFeedbackItemRead]

    model_config = {"from_attributes": True}


class ExplanationRead(BaseModel):
    """FR-AICC-5/11/16, RAI-4: an on-request, scoped explanation for one
    specific already-produced output (PRD §28.8 — never open-ended)."""

    explanation: str
    grounded_on: list[str]


class RoadmapDraftItemRead(BaseModel):
    """A roadmap item that exists only in the supervisor graph's persisted
    checkpoint state, not yet written to the `roadmaps`/`roadmap_items`
    tables — distinct from `RoadmapItemRead`, which always has a real row
    (and therefore an `id`/`status`) behind it."""

    title: str
    description: str
    addresses_gap: str


class CareerPlanStatusRead(BaseModel):
    """Response for both starting and resuming a supervised career-plan run
    (`POST .../career-plan/start|approve|reject`). `status` is one of
    "awaiting_approval" (a human decision is needed before the roadmap
    becomes real), "approved" (the roadmap below is now a persisted,
    real Roadmap), or "rejected" (no roadmap was persisted)."""

    status: str
    analysis: SkillGapAnalysisRead
    roadmap_draft: list[RoadmapDraftItemRead] = []
    roadmap: RoadmapRead | None = None


class CareerPlanApprovalRequest(BaseModel):
    feedback: str = ""
