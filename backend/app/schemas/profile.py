from __future__ import annotations

from uuid import UUID

from pydantic import BaseModel


class ProfileUpdate(BaseModel):
    """FR-PROF-1: create/edit background, education, and experience."""

    background: str | None = None
    education: str | None = None
    experience: str | None = None
    skills: list[str] | None = None


class ProfileRead(BaseModel):
    id: UUID
    background: str
    education: str
    experience: str
    skills: list[str]

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    """FR-PROF-2: state a target role or field, update at any time."""

    target_role: str
    target_field: str = ""


class GoalRead(BaseModel):
    id: UUID
    target_role: str
    target_field: str
    is_active: bool

    model_config = {"from_attributes": True}


class OnboardingStatusRead(BaseModel):
    """FR-ONBOARD-1 / FR-PROF-4: what's required before a first analysis can
    run, and what's currently missing."""

    profile_exists: bool
    goal_set: bool
    meets_hard_bar: bool
    is_complete: bool
    missing_hard_bar_fields: list[str]
    missing_quality_fields: list[str]
    onboarding_completed: bool
