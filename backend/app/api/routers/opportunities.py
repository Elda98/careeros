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

The reverse direction is gated too: applying to a posting and asking for
an AI fit explanation are Student/Graduate-only actions (a Company account
"applying" to another company's job makes no product sense, and a fit
explanation is grounded in the caller's own Profile/Skill-Gap Analysis,
which only a career seeker has) — `_CAREER_SEEKER` below, same mechanism.
Browsing (`GET /opportunities`) stays open to every persona; there's a
real case for a Company wanting visibility into the market.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, get_explainability_llm, require_account_type
from app.core.security import PromptInjectionDetected, sanitize_free_text, sanitize_skill_list
from app.db.models import AccountType, Application, Goal, JobOpportunity, OpportunityStatus, Profile, SkillGapAnalysis, User
from app.schemas.ai_career_center import ExplanationRead
from app.schemas.ecosystem import (
    ApplicationRead,
    ApplicationStatusUpdate,
    JobOpportunityCreate,
    JobOpportunityRead,
    JobOpportunityUpdate,
    JobOpportunityWithCompanyRead,
    MyApplicationRead,
)

from careeros_ai.capabilities.explainability import explain_output

router = APIRouter(tags=["opportunities"])
_CAREER_SEEKER = require_account_type(AccountType.STUDENT, AccountType.GRADUATE)

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


def _sanitize_opportunity_fields(data: dict) -> dict:
    """Same guardrail applied to Profile/Goal free text (app/api/routers/
    profiles.py) — now load-bearing here too, not just defense in depth:
    `explain_opportunity_fit` below interpolates title/description/
    required_skills directly into an LLM prompt for a *different* user (the
    applicant), so an unsanitized company posting is a real prompt-injection
    vector against that applicant's explanation request."""
    try:
        for field in ("title", "description"):
            if data.get(field):
                data[field] = sanitize_free_text(data[field], field_name=field)
        if data.get("required_skills"):
            data["required_skills"] = sanitize_skill_list(data["required_skills"], field_name="required_skills")
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    return data


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
    opportunity = JobOpportunity(
        company_profile_id=user.company_profile.id, **_sanitize_opportunity_fields(body.model_dump())
    )
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
    for field, value in _sanitize_opportunity_fields(body.model_dump(exclude_unset=True)).items():
        setattr(opportunity, field, value)
    db.add(opportunity)
    await db.commit()
    await db.refresh(opportunity)
    return opportunity


async def _candidate_readiness(db: AsyncSession, user_id: UUID) -> dict:
    """Builds CandidateReadinessRead's dict by hand from the candidate's own
    Career Knowledge Graph rows — never reusing the private Profile/Goal/
    SkillGapAnalysis Read schemas here, so it's structurally impossible for
    a field a company shouldn't see (background, education, experience,
    confidence_reason, grounded_on, individual gaps) to leak through this
    path."""
    goal_result = await db.execute(
        select(Goal).where(Goal.user_id == user_id, Goal.is_active.is_(True)).limit(1)
    )
    goal = goal_result.scalar_one_or_none()

    profile_result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    profile = profile_result.scalar_one_or_none()

    analysis_result = await db.execute(
        select(SkillGapAnalysis)
        .where(SkillGapAnalysis.user_id == user_id)
        .order_by(SkillGapAnalysis.version.desc())
        .limit(1)
    )
    analysis = analysis_result.scalar_one_or_none()

    return {
        "target_role": goal.target_role if goal else None,
        "target_field": goal.target_field if goal else None,
        "confidence": analysis.confidence if analysis else None,
        "skills": profile.skills if profile else [],
    }


async def _application_read(db: AsyncSession, application: Application) -> dict:
    # Built by hand rather than relying on ApplicationRead's from_attributes
    # auto-mapping: Application.applicant is a full User ORM object (id,
    # clerk_user_id, email, account_type, ...), and ApplicantRead's field
    # is named user_id, not id — a real mismatch caught by this endpoint's
    # own test (ResponseValidationError) before it shipped. Explicit here
    # both fixes that and is what actually enforces "no private user
    # fields beyond user_id/email/readiness leak to a company" (ApplicantRead's
    # own docstring) — from_attributes on the full User object would happily
    # serialize whatever ApplicantRead declares, but only because
    # ApplicantRead stays deliberately minimal, not because this call site
    # does; being explicit here removes that reliance.
    return {
        "id": application.id,
        "status": application.status,
        "created_at": application.created_at,
        "applicant": {
            "user_id": application.applicant.id,
            "email": application.applicant.email,
            "readiness": await _candidate_readiness(db, application.applicant.id),
        },
    }


@company_router.get("/{opportunity_id}/applications", response_model=list[ApplicationRead])
async def list_applications(
    opportunity_id: UUID,
    user: User = Depends(require_account_type(AccountType.COMPANY)),
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    opportunity = await _owned_opportunity(db, user, opportunity_id, with_applications=True)
    return [await _application_read(db, a) for a in opportunity.applications]


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
    return await _application_read(db, application)


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


@router.get("/opportunities/{opportunity_id}/explain-fit", response_model=ExplanationRead)
async def explain_opportunity_fit(
    opportunity_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    llm=Depends(get_explainability_llm),
) -> ExplanationRead:
    """Milestone 6 (Phase 8, "matching candidate skills to job
    opportunities"): reuses the exact same on-request Explainability
    capability as the AI Career Center's other /explain endpoints
    (careeros_ai.capabilities.explainability.explain_output) — no new
    agent, no new AI subsystem. Grounded only in the caller's own Profile
    and Skill-Gap Analysis plus the opportunity's own posted requirements
    — never another candidate's data, and never the company's private
    application/candidate data either."""
    result = await db.execute(
        select(JobOpportunity).where(JobOpportunity.id == opportunity_id).options(_OPPORTUNITY_LOAD)
    )
    opportunity = result.scalar_one_or_none()
    if opportunity is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Opportunity not found")

    profile_result = await db.execute(select(Profile).where(Profile.user_id == user.id))
    profile = profile_result.scalar_one_or_none()

    analysis_result = await db.execute(
        select(SkillGapAnalysis)
        .options(selectinload(SkillGapAnalysis.gaps))
        .where(SkillGapAnalysis.user_id == user.id)
        .order_by(SkillGapAnalysis.version.desc())
        .limit(1)
    )
    analysis = analysis_result.scalar_one_or_none()

    grounded_on = ["profile.skills", "opportunity.required_skills"]
    context_lines = [
        f"Candidate's current skills: {profile.skills if profile else []}",
        f"Opportunity: {opportunity.title} at {opportunity.company_profile.company_name}",
        f"Required skills: {opportunity.required_skills}",
    ]
    if analysis is not None:
        grounded_on.append("skill_gap_analysis.current")
        context_lines.append(f"Candidate's current skill-gap analysis summary: {analysis.summary}")
        context_lines.append(
            "Known skill gaps: " + "; ".join(f"{g.skill}: {g.description}" for g in analysis.gaps)
        )
    grounded_context = "\n".join(context_lines)

    try:
        explanation = explain_output(
            llm,
            output_summary=(
                f"Opportunity: {opportunity.title} "
                f"(requires: {', '.join(opportunity.required_skills) or 'unspecified skills'})"
            ),
            grounded_on=grounded_on,
            grounded_context=grounded_context,
            question_scope="how well the candidate's current skills and known gaps match this opportunity's requirements",
        )
    except Exception as exc:  # any LLM failure is an honest generation failure (BR-AI-5)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Explanation generation failed: {exc}") from exc

    return ExplanationRead(explanation=explanation, grounded_on=grounded_on)


@router.post("/opportunities/{opportunity_id}/apply", response_model=MyApplicationRead, status_code=status.HTTP_201_CREATED)
async def apply_to_opportunity(
    opportunity_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
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
