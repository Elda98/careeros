"""User Profiles module (PRD FR-PROF, SAS §14.3, §14.9).

Owns Profile and Goal exclusively — the AI Career Center reads these but
never writes them (SAS §14.3's read-without-write pattern).

Profile/Goal are Student/Graduate concepts specifically — a Company or
Service Provider account has its own separate identity record
(CompanyProfile/ServiceProviderProfile, account.py) and no skills or
career goal. Every endpoint here is therefore gated to STUDENT/GRADUATE
via `require_account_type`, the same mechanism every other persona-owned
router (company.py, services.py, community.py's group creation) already
uses — this is what actually stops a Company account from setting a
career goal or reading a Student's-shaped profile, not merely the
frontend not offering the option."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, require_account_type
from app.core.security import PromptInjectionDetected, sanitize_free_text, sanitize_skill_list
from app.db.models import AccountType, Goal, Profile, User
from app.schemas.profile import GoalCreate, GoalRead, OnboardingStatusRead, ProfileRead, ProfileUpdate
from app.services import onboarding

router = APIRouter(prefix="/profile", tags=["profile"])
_CAREER_SEEKER = require_account_type(AccountType.STUDENT, AccountType.GRADUATE)

_FREE_TEXT_FIELDS = ("background", "education", "experience")


def _active_goal(user: User) -> Goal | None:
    return next((g for g in user.goals if g.is_active), None)


@router.get("", response_model=ProfileRead)
async def get_profile(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> Profile:
    if user.profile is None:
        profile = Profile(user_id=user.id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    return user.profile


@router.patch("", response_model=ProfileRead)
async def update_profile(
    body: ProfileUpdate,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
) -> Profile:
    """FR-PROF-1. Note: whether an edit is a *material* change (BR-GAP-3,
    triggering Skill-Gap Analysis regeneration) is decided by the AI Career
    Center module when it reads the updated Profile — this endpoint only
    performs the write it owns.

    Background/education/experience are guardrail-checked here (not only
    at the AI Career Center layer that later reads them) because rejecting
    a prompt-injection attempt at the point of write is a clearer, more
    honest signal to the user than silently sanitizing it three steps
    later when an analysis happens to run."""
    updates = body.model_dump(exclude_unset=True)
    for field in _FREE_TEXT_FIELDS:
        if updates.get(field):
            try:
                updates[field] = sanitize_free_text(updates[field], field_name=field)
            except PromptInjectionDetected as exc:
                raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
            except ValueError as exc:
                raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    if updates.get("skills"):
        try:
            updates["skills"] = sanitize_skill_list(updates["skills"])
        except PromptInjectionDetected as exc:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    profile = user.profile or Profile(user_id=user.id)
    for field, value in updates.items():
        setattr(profile, field, value)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("", response_model=ProfileRead, status_code=status.HTTP_200_OK)
async def delete_profile_data(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> Profile:
    """FR-SET-3, BR-DATA-3: delete specific stored data (here, Profile
    fields) independent of full account deletion (FR-AUTH-5, not yet
    implemented — see PHASE0-AUDIT.md).

    BR-DATA-4: does NOT retroactively remove historical AI outputs already
    generated from this data — Skill-Gap Analyses, Roadmaps, and CV Feedback
    Rounds already written are separate rows in separate tables with no
    cascade back to Profile, so they are structurally unaffected by this
    clear, not merely policy-unaffected.
    """
    if user.profile is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No profile data to delete")

    user.profile.background = ""
    user.profile.education = ""
    user.profile.experience = ""
    user.profile.skills = []
    db.add(user.profile)
    await db.commit()
    await db.refresh(user.profile)
    return user.profile


@router.get("/onboarding-status", response_model=OnboardingStatusRead)
async def get_onboarding_status(user: User = Depends(_CAREER_SEEKER)) -> OnboardingStatusRead:
    """FR-ONBOARD-1 / FR-PROF-4: tells the frontend exactly what's missing
    before a first Skill-Gap Analysis can run, and whether onboarding (the
    first analysis) has already completed — the same rule the AI Career
    Center's refresh endpoint gates on (app/services/onboarding.py), so the
    two can never silently disagree."""
    result = onboarding.evaluate(user.profile, _active_goal(user))
    return OnboardingStatusRead(
        profile_exists=result.profile_exists,
        goal_set=result.goal_set,
        meets_hard_bar=result.meets_hard_bar,
        is_complete=result.is_complete,
        missing_hard_bar_fields=result.missing_hard_bar_fields,
        missing_quality_fields=result.missing_quality_fields,
        onboarding_completed=bool(user.profile and user.profile.onboarding_completed),
    )


@router.get("/goals", response_model=list[GoalRead])
async def list_goals(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> list[Goal]:
    result = await db.execute(select(Goal).where(Goal.user_id == user.id).order_by(Goal.created_at.desc()))
    return list(result.scalars().all())


@router.post("/goals", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
async def create_goal(
    body: GoalCreate,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
) -> Goal:
    """BR-GOAL-1: exactly one active goal at a time. BR-GOAL-2: setting a new
    active goal archives the current one — it is retained, not deleted."""
    target_role = body.target_role
    target_field = body.target_field
    try:
        target_role = sanitize_free_text(target_role, field_name="target_role")
        if target_field:
            target_field = sanitize_free_text(target_field, field_name="target_field")
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    result = await db.execute(select(Goal).where(Goal.user_id == user.id, Goal.is_active.is_(True)))
    for existing in result.scalars().all():
        existing.is_active = False
        db.add(existing)

    goal = Goal(user_id=user.id, target_role=target_role, target_field=target_field, is_active=True)
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return goal


@router.get("/goals/active", response_model=GoalRead)
async def get_active_goal(user: User = Depends(_CAREER_SEEKER)) -> Goal:
    goal = _active_goal(user)
    if goal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No active goal set yet")
    return goal


@router.post("/goals/{goal_id}/reactivate", response_model=GoalRead)
async def reactivate_goal(
    goal_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
) -> Goal:
    """BR-GOAL-5: a user may reactivate a previous goal, making it active
    again — distinct from `POST /goals`, which always creates a new row.
    Reactivating an already-inactive goal still archives whichever goal is
    currently active (BR-GOAL-1/2), exactly like creating a new one."""
    result = await db.execute(select(Goal).where(Goal.id == goal_id, Goal.user_id == user.id))
    target = result.scalar_one_or_none()
    if target is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Goal not found")

    if not target.is_active:
        for existing in user.goals:
            if existing.is_active and existing.id != target.id:
                existing.is_active = False
                db.add(existing)
        target.is_active = True
        db.add(target)
        await db.commit()
        await db.refresh(target)
    return target
