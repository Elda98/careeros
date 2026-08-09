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
from app.db.models import AccountType, ServiceListing, ServiceListingStatus, User
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


@router.get("/services", response_model=list[ServiceListingWithProviderRead])
async def browse_services(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    result = await db.execute(
        select(ServiceListing)
        .where(ServiceListing.status == ServiceListingStatus.ACTIVE)
        .options(selectinload(ServiceListing.provider_profile))
        .order_by(ServiceListing.created_at.desc())
    )
    listings = result.scalars().all()
    out = []
    for listing in listings:
        provider = listing.provider_profile
        out.append(
            {
                **ServiceListingRead.model_validate(listing).model_dump(),
                "provider_title": provider.professional_title,
                "provider_expertise": provider.expertise,
                "provider_contact_info": provider.contact_info,
            }
        )
    return out


router.include_router(provider_router)
