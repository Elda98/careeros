"""Schemas for Interview Preparation (Interview Coach Agent).

Mirrors app/schemas/ai_career_center.py's conventions — Read models use
`from_attributes` to map directly off the SQLAlchemy rows they mirror.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import (
    ConfidenceLevel,
    InterviewExperienceLevel,
    InterviewQuestionCategory,
    InterviewSessionStatus,
    InterviewType,
)


class InterviewSessionCreate(BaseModel):
    target_role: str
    target_field: str = ""
    experience_level: InterviewExperienceLevel
    interview_type: InterviewType
    target_company: str = ""


class InterviewAnswerRead(BaseModel):
    id: UUID
    answer_text: str
    quality_score: int
    clarity_score: int
    relevance_score: int
    structure_score: int
    feedback_note: str
    example_improved_answer: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewQuestionRead(BaseModel):
    id: UUID
    order_index: int
    category: InterviewQuestionCategory
    question_text: str
    created_at: datetime
    answer: InterviewAnswerRead | None = None

    model_config = {"from_attributes": True}


class InterviewSessionRead(BaseModel):
    id: UUID
    target_role: str
    target_field: str
    experience_level: InterviewExperienceLevel
    interview_type: InterviewType
    target_company: str
    status: InterviewSessionStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewSessionDetailRead(InterviewSessionRead):
    questions: list[InterviewQuestionRead]


class InterviewAnswerSubmit(BaseModel):
    question_id: UUID
    answer_text: str


class InterviewTurnRead(BaseModel):
    """Response to submitting an answer: the grading of what was just
    answered (None only on the very first call, before any answer exists)
    plus what happens next — another question, a follow-up, or the signal
    that the session is ready for its final report."""

    answer_feedback: InterviewAnswerRead | None = None
    action: str
    next_question: InterviewQuestionRead | None = None


class InterviewSessionReportRead(BaseModel):
    id: UUID
    status: InterviewSessionStatus
    overall_score: int
    summary: str
    answer_quality: int
    communication: int
    structure_score: int
    technical_readiness: int
    strengths: list[str]
    areas_to_improve: list[str]
    recommended_practice: list[str]
    next_interview_recommendation: str
    confidence: ConfidenceLevel
    confidence_reason: str
    grounded_on: list[str]
    completed_at: datetime | None

    model_config = {"from_attributes": True}
