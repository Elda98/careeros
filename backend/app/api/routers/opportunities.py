"""Company MVP (job/internship postings) and the minimal candidate-facing
browse/apply path needed to make "view applications" mean anything.

Server-side role enforcement throughout (SDAIA rubric): every mutation
that only a company should be able to do is gated by
`require_account_type(AccountType.COMPANY)`, which reads the caller's
*persisted* account_type back from their own database row
(app/api/deps.py) — never a role claimed by the client. Ownership is
checked separately and explicitly on every company_profile-scoped read/
write (a company can list its own postings, never another company's),
returning 404 rather than 403 for a posting that exists but isn't
theirs, matching this codebase's existing IDOR-safe pattern (see
ai_career_center.py's explain endpoints).
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_account_type
from app.db.models import AccountType, Application, JobOpportunity, OpportunityStatus, User
from app.schemas.ecosystem import (
    ApplicationRead,
    ApplicationStatusUpdate,
    JobOpportunityCreate,
    JobOpportunityRead,
    JobOpportunityUpdate,
    JobOpportunityWithCompanyRead,
    MyApplicationRead,
)

router = APIRouter(tags=["opportunities"])

_OPPORTUNITY_LOAD = selectinload(JobOpportunity.company_profile)
_APPLICATIONS_LOAD = (
    selectinload(JobOpportunity.applications).selectinload(Application.applicant),
)


async def _owned_opportunity(
    db: AsyncSession, user: User, opportunity_id: UUID, *, with_applications: bool = False
) -> JobOpportunity:
    options = [*_APPLICATIONS_LOAD] if with_applications else [_OPPORTUNITY_LOAD]
    result = await db.execute(
        select(JobOpportunity)
        .where(JobOpportunity.id == opportunity_id, JobOpportunity.company_profile_id == user.company_profile.id)
        .options(*options)
    )
    opportunity = result.scalar_one_or_none()
    if opportunity is None:
        # Same instant, no-existence-leak as the IDOR-safe endpoints
        # elsewhere: a posting that exists but belongs to a different
        # company 404s exactly like one that doesn't exist at all.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")
    return opportunity


# --- Company-only: manage own postings --------------------------------------

company_router = APIRouter(prefix="/company/opportunities", tags=["company"])


@company_router.post("", response_model=JobOpportunityRead, status_code=status.HTTP_201_CREATED)
async def create_opportunity(
    body: JobOpportunityCreate,
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> JobOpportunity:
    if user.company_profile is None or not user.company_profile.company_name:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Complete your company profile before posting an opportunity."
        )
    opportunity = JobOpportunity(company_profile_id=user.company_profile.id, **body.model_dump())
    db.add(opportunity)
    await db.commit()
    await db.refresh(opportunity)
    return opportunity


@company_router.get("", response_model=list[JobOpportunityRead])
async def list_own_opportunities(
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> list[JobOpportunity]:
    if user.company_profile is None:
        return []
    result = await db.execute(
        select(JobOpportunity)
        .where(JobOpportunity.company_profile_id == user.company_profile.id)
        .order_by(JobOpportunity.created_at.desc())
    )
    return list(result.scalars().all())


@company_router.patch("/{opportunity_id}", response_model=JobOpportunityRead)
async def update_opportunity(
    opportunity_id: UUID,
    body: JobOpportunityUpdate,
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> JobOpportunity:
    opportunity = await _owned_opportunity(db, user, opportunity_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(opportunity, field, value)
    db.add(opportunity)
    await db.commit()
    await db.refresh(opportunity)
    return opportunity


def _application_read(application: Application) -> dict:
    # Built by hand rather than relying on ApplicationRead's from_attributes
    # auto-mapping: Application.applicant is a full User ORM object (id,
    # clerk_user_id, email, account_type, ...), and ApplicantRead's field
    # is named user_id, not id — a real mismatch caught by this endpoint's
    # own test (ResponseValidationError) before it shipped. Explicit here
    # both fixes that and is what actually enforces "no private user
    # fields beyond user_id/email leak to a company" (ApplicantRead's own
    # docstring) — from_attributes on the full User object would happily
    # serialize whatever ApplicantRead declares, but only because
    # ApplicantRead stays deliberately minimal, not because this call site
    # does; being explicit here removes that reliance.
    return {
        "id": application.id,
        "status": application.status,
        "created_at": application.created_at,
        "applicant": {"user_id": application.applicant.id, "email": application.applicant.email},
    }


@company_router.get("/{opportunity_id}/applications", response_model=list[ApplicationRead])
async def list_applications(
    opportunity_id: UUID,
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    opportunity = await _owned_opportunity(db, user, opportunity_id, with_applications=True)
    return [_application_read(a) for a in opportunity.applications]


@company_router.patch("/{opportunity_id}/applications/{application_id}", response_model=ApplicationRead)
async def update_application_status(
    opportunity_id: UUID,
    application_id: UUID,
    body: ApplicationStatusUpdate,
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> dict:
    # Ownership check happens via the opportunity, not the application
    # directly — an application only means anything in the context of an
    # opportunity this company actually owns.
    await _owned_opportunity(db, user, opportunity_id)
    result = await db.execute(
        select(Application)
        .where(Application.id == application_id, Application.opportunity_id == opportunity_id)
        .options(selectinload(Application.applicant))
    )
    application = result.scalar_one_or_none()
    if application is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Application not found")
    application.status = body.status
    db.add(application)
    await db.commit()
    await db.refresh(application, attribute_names=["applicant"])
    return _application_read(application)


# --- Any authenticated user: browse + apply ---------------------------------


@router.get("/opportunities", response_model=list[JobOpportunityWithCompanyRead])
async def browse_opportunities(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    result = await db.execute(
        select(JobOpportunity)
        .where(JobOpportunity.status == OpportunityStatus.OPEN)
        .options(_OPPORTUNITY_LOAD)
        .order_by(JobOpportunity.created_at.desc())
    )
    opportunities = result.scalars().all()
    return [
        {**JobOpportunityRead.model_validate(o).model_dump(), "company_name": o.company_profile.company_name}
        for o in opportunities
    ]


@router.post("/opportunities/{opportunity_id}/apply", response_model=MyApplicationRead, status_code=status.HTTP_201_CREATED)
async def apply_to_opportunity(
    opportunity_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(
        select(JobOpportunity).where(JobOpportunity.id == opportunity_id).options(_OPPORTUNITY_LOAD)
    )
    opportunity = result.scalar_one_or_none()
    if opportunity is None or opportunity.status != OpportunityStatus.OPEN:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")

    existing = await db.execute(
        select(Application).where(Application.opportunity_id == opportunity_id, Application.user_id == user.id)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already applied to this opportunity.")

    application = Application(opportunity_id=opportunity_id, user_id=user.id)
    db.add(application)
    await db.commit()
    await db.refresh(application)
    return {
        "id": application.id,
        "status": application.status,
        "created_at": application.created_at,
        "opportunity": {
            **JobOpportunityRead.model_validate(opportunity).model_dump(),
            "company_name": opportunity.company_profile.company_name,
        },
    }


@router.get("/opportunities/mine/applications", response_model=list[MyApplicationRead])
async def my_applications(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(Application)
        .where(Application.user_id == user.id)
        .options(selectinload(Application.opportunity).selectinload(JobOpportunity.company_profile))
        .order_by(Application.created_at.desc())
    )
    applications = result.scalars().all()
    return [
        {
            "id": a.id,
            "status": a.status,
            "created_at": a.created_at,
            "opportunity": {
                **JobOpportunityRead.model_validate(a.opportunity).model_dump(),
                "company_name": a.opportunity.company_profile.company_name,
            },
        }
        for a in applications
    ]


router.include_router(company_router)
