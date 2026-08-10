"""Account/persona module — role selection and the two ecosystem
personas' own identity profiles (Company, Service Provider).

Distinct from the User Profiles module (`profiles.py`): that module owns
the Career Knowledge Graph's Profile/Goal, used by the Student/Graduate
career-seeker personas. This module owns `User.account_type` itself, plus
`CompanyProfile`/`ServiceProviderProfile` — account-level identity data
for the two ecosystem personas, analogous to but structurally separate
from a career-seeker's Profile (a company has no skills or goal).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models import CompanyProfile, ServiceProviderProfile, User
from app.schemas.account import (
    AccountTypeRead,
    AccountTypeUpdate,
    CompanyProfileRead,
    CompanyProfileUpdate,
    LocaleRead,
    LocaleUpdate,
    ServiceProviderProfileRead,
    ServiceProviderProfileUpdate,
)

router = APIRouter(prefix="/account", tags=["account"])


@router.get("/type", response_model=AccountTypeRead)
async def get_account_type(user: User = Depends(get_current_user)) -> AccountTypeRead:
    return AccountTypeRead(account_type=user.account_type)


@router.put("/type", response_model=AccountTypeRead)
async def set_account_type(
    body: AccountTypeUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> AccountTypeRead:
    """The role-selection screen's write path. Persisted server-side,
    associated with the authenticated user's own row — never trusted from
    a client-supplied value elsewhere (see `app/api/deps.py`'s
    `require_account_type` for how every ecosystem-persona endpoint reads
    this same column back to authorize, rather than accepting a role
    claimed in a request body).

    A role is a one-time, irreversible choice: once set, this endpoint
    rejects any attempt to change it. The frontend also stops routing
    back to the role-selection screen once `account_type` is non-null, but
    that alone is only a UI convenience — this check is what actually
    keeps a Student from becoming a Company by calling the endpoint
    directly."""
    if user.account_type is not None and user.account_type != body.account_type:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Account type is already set and cannot be changed.",
        )
    user.account_type = body.account_type
    db.add(user)
    await db.commit()
    return AccountTypeRead(account_type=user.account_type)


@router.get("/locale", response_model=LocaleRead)
async def get_locale(user: User = Depends(get_current_user)) -> LocaleRead:
    return LocaleRead(locale=user.locale)  # type: ignore[arg-type]


@router.put("/locale", response_model=LocaleRead)
async def set_locale(
    body: LocaleUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> LocaleRead:
    """The frontend's language toggle writes here too (fire-and-forget,
    alongside its own cookie) — this is the only copy every AI-generating
    agent call site and every backend-constructed message (notifications,
    confidence reasons) actually reads. The frontend cookie stays the
    source of truth for the UI chrome itself; this is specifically for
    content the backend generates on the user's behalf."""
    user.locale = body.locale
    db.add(user)
    await db.commit()
    return LocaleRead(locale=user.locale)  # type: ignore[arg-type]


@router.get("/company-profile", response_model=CompanyProfileRead)
async def get_company_profile(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> CompanyProfile:
    if user.company_profile is None:
        profile = CompanyProfile(user_id=user.id, company_name="")
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    return user.company_profile


@router.patch("/company-profile", response_model=CompanyProfileRead)
async def update_company_profile(
    body: CompanyProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> CompanyProfile:
    profile = user.company_profile or CompanyProfile(user_id=user.id, company_name="")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/service-provider-profile", response_model=ServiceProviderProfileRead)
async def get_service_provider_profile(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> ServiceProviderProfile:
    if user.service_provider_profile is None:
        profile = ServiceProviderProfile(user_id=user.id, professional_title="")
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
        return profile
    return user.service_provider_profile


@router.patch("/service-provider-profile", response_model=ServiceProviderProfileRead)
async def update_service_provider_profile(
    body: ServiceProviderProfileUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ServiceProviderProfile:
    profile = user.service_provider_profile or ServiceProviderProfile(user_id=user.id, professional_title="")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile
