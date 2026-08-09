"""Service Provider MVP (service listing CRUD) and the minimal candidate-
facing discovery path. Same ownership/role-enforcement discipline as
opportunities.py: require_account_type gates every provider-only mutation,
and ownership is checked explicitly (404, never 403, on a listing that
exists but belongs to someone else)."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, require_account_type
from app.db.models import AccountType, ServiceListing, ServiceListingStatus, SkillGapAnalysis, User
from app.schemas.ecosystem import (
    ServiceListingCreate,
    ServiceListingRead,
    ServiceListingUpdate,
    ServiceListingWithProviderRead,
)

router = APIRouter(tags=["services"])
provider_router = APIRouter(prefix="/provider/services", tags=["service-provider"])


async def _owned_listing(db: AsyncSession, user: User, listing_id: UUID) -> ServiceListing:
    result = await db.execute(
        select(ServiceListing).where(
            ServiceListing.id == listing_id, ServiceListing.provider_profile_id == user.service_provider_profile.id
        )
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Service listing not found")
    return listing


@provider_router.post("", response_model=ServiceListingRead, status_code=status.HTTP_201_CREATED)
async def create_service_listing(
    body: ServiceListingCreate,
    user: User = Depends(require_account_type(AccountType.SERVICE_PROVIDER)),
    db: AsyncSession = Depends(get_db),
) -> ServiceListing:
    if user.service_provider_profile is None or not user.service_provider_profile.professional_title:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Complete your provider profile before publishing a service."
        )
    listing = ServiceListing(provider_profile_id=user.service_provider_profile.id, **body.model_dump())
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


@provider_router.get("", response_model=list[ServiceListingRead])
async def list_own_services(
    user: User = Depends(require_account_type(AccountType.SERVICE_PROVIDER)),
    db: AsyncSession = Depends(get_db),
) -> list[ServiceListing]:
    if user.service_provider_profile is None:
        return []
    result = await db.execute(
        select(ServiceListing)
        .where(ServiceListing.provider_profile_id == user.service_provider_profile.id)
        .order_by(ServiceListing.created_at.desc())
    )
    return list(result.scalars().all())


@provider_router.patch("/{listing_id}", response_model=ServiceListingRead)
async def update_service_listing(
    listing_id: UUID,
    body: ServiceListingUpdate,
    user: User = Depends(require_account_type(AccountType.SERVICE_PROVIDER)),
    db: AsyncSession = Depends(get_db),
) -> ServiceListing:
    listing = await _owned_listing(db, user, listing_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(listing, field, value)
    db.add(listing)
    await db.commit()
    await db.refresh(listing)
    return listing


def _with_provider(listing: ServiceListing) -> dict:
    provider = listing.provider_profile
    return {
        **ServiceListingRead.model_validate(listing).model_dump(),
        "provider_title": provider.professional_title,
        "provider_expertise": provider.expertise,
        "provider_contact_info": provider.contact_info,
    }


@router.get("/services", response_model=list[ServiceListingWithProviderRead])
async def browse_services(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(ServiceListing)
        .where(ServiceListing.status == ServiceListingStatus.ACTIVE)
        .options(selectinload(ServiceListing.provider_profile))
        .order_by(ServiceListing.created_at.desc())
    )
    listings = result.scalars().all()
    return [_with_provider(listing) for listing in listings]


@router.get("/services/recommended", response_model=list[ServiceListingWithProviderRead])
async def recommended_services(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    """Phase 7's Student/Graduate -> Skill Gap -> Needed Support -> Service
    Providers connection. Deliberately plain keyword matching against the
    caller's own latest Skill-Gap Analysis gap names, not an LLM call: this
    is a structural ecosystem connection (Milestone 5), not the AI-matching
    milestone (Milestone 6) — matching only ever runs against the caller's
    own gaps, so it can't leak another user's private analysis."""
    analysis_result = await db.execute(
        select(SkillGapAnalysis)
        .where(SkillGapAnalysis.user_id == user.id)
        .options(selectinload(SkillGapAnalysis.gaps))
        .order_by(SkillGapAnalysis.version.desc())
        .limit(1)
    )
    analysis = analysis_result.scalar_one_or_none()
    gap_skills = [gap.skill.lower() for gap in analysis.gaps] if analysis else []
    if not gap_skills:
        return []

    result = await db.execute(
        select(ServiceListing)
        .where(ServiceListing.status == ServiceListingStatus.ACTIVE)
        .options(selectinload(ServiceListing.provider_profile))
        .order_by(ServiceListing.created_at.desc())
    )
    listings = result.scalars().all()

    def _matches(listing: ServiceListing) -> bool:
        haystack = f"{listing.title} {listing.category} {listing.description}".lower()
        return any(skill in haystack for skill in gap_skills)

    matched = [listing for listing in listings if _matches(listing)]
    return [_with_provider(listing) for listing in matched[:5]]


router.include_router(provider_router)
