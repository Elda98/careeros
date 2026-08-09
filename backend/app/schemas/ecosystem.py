"""Schemas for the ecosystem personas' MVP features (job postings,
applications) — distinct from app/schemas/account.py, which owns the two
personas' own identity profiles (CompanyProfile, ServiceProviderProfile).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import ApplicationStatus, OpportunityStatus, OpportunityType


class JobOpportunityCreate(BaseModel):
    title: str
    description: str = ""
    opportunity_type: OpportunityType = OpportunityType.JOB
    location: str = ""
    required_skills: list[str] = []


class JobOpportunityUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    opportunity_type: OpportunityType | None = None
    location: str | None = None
    required_skills: list[str] | None = None
    status: OpportunityStatus | None = None


class JobOpportunityRead(BaseModel):
    id: UUID
    title: str
    description: str
    opportunity_type: OpportunityType
    location: str
    required_skills: list[str]
    status: OpportunityStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class JobOpportunityWithCompanyRead(JobOpportunityRead):
    """The candidate-facing (browse/discovery) shape — includes the
    posting company's public identity, since a candidate deciding whether
    to apply needs to know who's hiring."""

    company_name: str


class ApplicationCreate(BaseModel):
    """Empty body — who's applying and to what are both already known
    (the authenticated user, the opportunity_id in the URL); nothing else
    is collected at this stage (SDAIA rubric MVP scope, not a full
    application form)."""


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class ApplicantRead(BaseModel):
    """Deliberately minimal — PRD Phase 7's "safe public-facing candidate
    readiness" representation is a richer view built in a later milestone
    (see docs/... ecosystem connection). For now, a company sees exactly
    what it needs to triage applications and nothing from the candidate's
    private Career Knowledge Graph (no Profile, no Skill-Gap Analysis)."""

    user_id: UUID
    email: str


class ApplicationRead(BaseModel):
    id: UUID
    status: ApplicationStatus
    created_at: datetime
    applicant: ApplicantRead

    model_config = {"from_attributes": True}


class MyApplicationRead(BaseModel):
    """A career-seeker's own view of an application they submitted —
    includes the opportunity they applied to, not the company's
    triage-facing applicant list."""

    id: UUID
    status: ApplicationStatus
    created_at: datetime
    opportunity: JobOpportunityWithCompanyRead

    model_config = {"from_attributes": True}
