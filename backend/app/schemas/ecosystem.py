"""Schemas for the ecosystem personas' MVP features (job postings,
applications) — distinct from app/schemas/account.py, which owns the two
personas' own identity profiles (CompanyProfile, ServiceProviderProfile).
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.db.models import ApplicationStatus, ConfidenceLevel, OpportunityStatus, OpportunityType, ServiceListingStatus


class CandidateReadinessRead(BaseModel):
    """Phase 7's "safe public-facing candidate readiness" representation —
    the only view of a candidate's Career Knowledge Graph a Company is ever
    allowed to see. Deliberately excludes the raw Profile text (background/
    education/experience) and the Skill-Gap Analysis's private reasoning
    (summary, confidence_reason, grounded_on, individual gaps): those stay
    inside the candidate's own AI Career Center. Only what the candidate has
    already chosen to declare (target role/field, skills) plus a single
    top-line confidence signal, mirroring what the candidate's own Dashboard
    shows them (see app/api/routers/dashboard.py's current_confidence)."""

    target_role: str | None = None
    target_field: str | None = None
    confidence: ConfidenceLevel | None = None
    skills: list[str] = []


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
    """A company's view of an applicant: identity (user_id, email) plus the
    safe CandidateReadinessRead snapshot — never the candidate's raw Profile
    or Skill-Gap Analysis reasoning directly (see CandidateReadinessRead's
    own docstring)."""

    user_id: UUID
    email: str
    readiness: CandidateReadinessRead


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


class ServiceListingCreate(BaseModel):
    title: str
    description: str = ""
    category: str = ""


class ServiceListingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    status: ServiceListingStatus | None = None


class ServiceListingRead(BaseModel):
    id: UUID
    title: str
    description: str
    category: str
    status: ServiceListingStatus
    created_at: datetime

    model_config = {"from_attributes": True}


class ServiceListingWithProviderRead(ServiceListingRead):
    """The discovery-facing shape — includes the provider's public
    identity, same reasoning as JobOpportunityWithCompanyRead."""

    provider_title: str
    provider_expertise: list[str]
    provider_contact_info: str
