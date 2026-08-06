"""Settings module (PRD FR-SET, FR-RENEW, FR-AUTH-5; SAS Part IV §20.2-§20.4).

Subscription state is account-level data, explicitly outside the Career
Knowledge Graph (PRD §24.12). No agent is invoked anywhere in this router —
SAS §20.2 demonstrates this is a fully valid, fully governed scenario shape.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_clerk_admin_client, get_current_user, get_db
from app.core.clerk_admin import ClerkAdminClient, ClerkAdminError
from app.db.models import (
    CVFeedbackRound,
    NotificationPreference,
    NotificationRecord,
    Roadmap,
    RoadmapItem,
    RoadmapItemStatus,
    SkillGapAnalysis,
    Subscription,
    SubscriptionStatus,
    User,
)
from app.schemas.settings import (
    NOTIFICATION_CATEGORIES,
    AccountRead,
    DataOverviewRead,
    NotificationPreferenceRead,
    NotificationPreferenceUpdate,
    RenewalRecapRead,
    SubscriptionCancelRequest,
    SubscriptionRead,
)

router = APIRouter(prefix="/settings", tags=["settings"])


# --- Account (PRD §22 screen 13) --------------------------------------------


@router.get("/account", response_model=AccountRead)
async def get_account(user: User = Depends(get_current_user)) -> AccountRead:
    """FR-AUTH-4: identity is anchored to every request; this surfaces it."""
    return AccountRead(email=user.email, member_since=user.created_at)


@router.delete("/account", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    clerk_admin: ClerkAdminClient = Depends(get_clerk_admin_client),
) -> None:
    """FR-AUTH-5, BR-DATA-5: permanently removes the account — both the
    Clerk-side identity and every local row (SAS Part IV §11.6, §21.2 —
    honest failure, no partial state).

    Order matters twice over:
    1. Clerk is deleted FIRST. If that call fails, no local data is
       touched, so the operation is safe to retry — the alternative
       (deleting local data first) would leave a user unable to log in
       (their session token would still verify, since Clerk itself is
       untouched) while their data is already gone, which is worse.
    2. Locally, Roadmaps are deleted before Skill-Gap Analyses, because
       `Roadmap.analysis_id` is a foreign key with no `ON DELETE CASCADE`
       at the database level — deleting an Analysis that a Roadmap still
       references would fail. Everything else has no such ordering
       constraint. All local deletes are one transaction: either every
       row is gone, or (on an unexpected error) none of them are.
    """
    try:
        await clerk_admin.delete_user(user.clerk_user_id)
    except ClerkAdminError as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    roadmap_result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == user.id)
        .options(selectinload(Roadmap.items).selectinload(RoadmapItem.status_history))
    )
    for roadmap in roadmap_result.scalars().all():
        await db.delete(roadmap)

    analysis_result = await db.execute(
        select(SkillGapAnalysis).where(SkillGapAnalysis.user_id == user.id).options(selectinload(SkillGapAnalysis.gaps))
    )
    for analysis in analysis_result.scalars().all():
        await db.delete(analysis)

    cv_result = await db.execute(
        select(CVFeedbackRound).where(CVFeedbackRound.user_id == user.id).options(selectinload(CVFeedbackRound.items))
    )
    for cv_round in cv_result.scalars().all():
        await db.delete(cv_round)

    for goal in user.goals:
        await db.delete(goal)
    if user.profile is not None:
        await db.delete(user.profile)
    if user.subscription is not None:
        await db.delete(user.subscription)
    if user.notification_preference is not None:
        await db.delete(user.notification_preference)

    notification_result = await db.execute(select(NotificationRecord).where(NotificationRecord.user_id == user.id))
    for notification in notification_result.scalars().all():
        await db.delete(notification)

    await db.delete(user)
    await db.commit()


# --- Subscription & Billing (PRD §22 screen 14) -----------------------------


@router.get("/subscription", response_model=SubscriptionRead)
async def get_subscription(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> Subscription:
    """FR-SET-1."""
    if user.subscription is None:
        sub = Subscription(user_id=user.id)
        db.add(sub)
        await db.commit()
        await db.refresh(sub)
        return sub
    return user.subscription


@router.post("/subscription/cancel", response_model=SubscriptionRead)
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    body: SubscriptionCancelRequest = SubscriptionCancelRequest(),
) -> Subscription:
    """FR-SET-4: cancel directly, without contacting support. BR-SUB-2/4/5:
    takes effect end of period; retains data; does not delete the account.
    FR-RENEW-2: an optional, never-required reason."""
    sub = user.subscription
    if sub is None:
        sub = Subscription(user_id=user.id)
        db.add(sub)
    sub.status = SubscriptionStatus.CANCELED
    if body.reason:
        sub.cancellation_reason = body.reason
    db.add(sub)
    await db.commit()
    await db.refresh(sub)
    return sub


@router.get("/renewal-recap", response_model=RenewalRecapRead)
async def get_renewal_recap(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> RenewalRecapRead:
    """FR-RENEW-1. See `app/schemas/settings.py::RenewalRecapRead` for why
    this is available on demand rather than tied to an actual billing-cycle
    trigger — no payment processor is part of this stack."""
    roadmap_result = await db.execute(
        select(Roadmap)
        .where(Roadmap.user_id == user.id)
        .order_by(Roadmap.version.desc())
        .limit(1)
        .options(selectinload(Roadmap.items))
    )
    roadmap = roadmap_result.scalar_one_or_none()
    items = roadmap.items if roadmap else []
    completed = [i for i in items if i.status == RoadmapItemStatus.COMPLETED]

    cv_count_result = await db.execute(
        select(CVFeedbackRound.id).where(CVFeedbackRound.user_id == user.id)
    )
    cv_count = len(cv_count_result.all())

    return RenewalRecapRead(
        member_since=user.created_at,
        skills_addressed_count=len({i.addresses_gap for i in completed}),
        roadmap_items_completed_count=len(completed),
        roadmap_items_total_count=len(items),
        cv_feedback_rounds_count=cv_count,
    )


# --- Notification Preferences (PRD §22 screen 16) ---------------------------


@router.get("/notification-preferences", response_model=NotificationPreferenceRead)
async def get_notification_preferences(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> NotificationPreferenceRead:
    """FR-NOTIF-3."""
    if user.notification_preference is None:
        pref = NotificationPreference(user_id=user.id)
        db.add(pref)
        await db.commit()
        await db.refresh(pref)
        return NotificationPreferenceRead(muted_categories=pref.muted_categories)
    return NotificationPreferenceRead(muted_categories=user.notification_preference.muted_categories)


@router.patch("/notification-preferences", response_model=NotificationPreferenceRead)
async def update_notification_preferences(
    body: NotificationPreferenceUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NotificationPreferenceRead:
    """FR-NOTIF-3. Rejects an unknown category outright rather than
    silently storing it — a typo'd category would otherwise silently never
    match any real notification and look like a working mute that does
    nothing, the exact "fake setting" this vertical was asked not to ship."""
    unknown = set(body.muted_categories) - set(NOTIFICATION_CATEGORIES)
    if unknown:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Unknown notification categories: {sorted(unknown)}")

    pref = user.notification_preference or NotificationPreference(user_id=user.id)
    pref.muted_categories = body.muted_categories
    db.add(pref)
    await db.commit()
    await db.refresh(pref)
    return NotificationPreferenceRead(muted_categories=pref.muted_categories)


# --- AI & Memory Controls (PRD §22 screen 15) -------------------------------


@router.get("/data", response_model=DataOverviewRead)
async def view_stored_data(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> DataOverviewRead:
    """SAS Part IV §20.3 — Data Access Request (View Stored Data). BR-DATA-6 /
    DPR-14: nothing used to personalize the experience is hidden from the
    user. Full entity detail is available via /profile, /ai-career-center/*,
    /notifications — this is the summary FR-SET-2 asks for."""
    analyses_result = await db.execute(select(SkillGapAnalysis.id).where(SkillGapAnalysis.user_id == user.id))
    roadmaps_result = await db.execute(select(Roadmap.id).where(Roadmap.user_id == user.id))
    cv_result = await db.execute(select(CVFeedbackRound.id).where(CVFeedbackRound.user_id == user.id))
    notif_result = await db.execute(select(NotificationRecord.id).where(NotificationRecord.user_id == user.id))

    return DataOverviewRead(
        profile_present=user.profile is not None,
        goals_count=len(user.goals),
        skill_gap_analyses_count=len(analyses_result.all()),
        roadmaps_count=len(roadmaps_result.all()),
        cv_feedback_rounds_count=len(cv_result.all()),
        notifications_count=len(notif_result.all()),
        subscription_tier=user.subscription.tier if user.subscription else None,
    )
