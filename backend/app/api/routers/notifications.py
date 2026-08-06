"""Notifications module (PRD FR-NOTIF). Reads Career Knowledge Graph events
as triggers (SAS §15.2); writes nothing back into the graph itself."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_db
from app.db.models import NotificationRecord, User

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
async def list_notifications(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    result = await db.execute(
        select(NotificationRecord)
        .where(NotificationRecord.user_id == user.id)
        .order_by(NotificationRecord.created_at.desc())
    )
    return [
        {
            "id": str(n.id),
            "category": n.category,
            "message": n.message,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in result.scalars().all()
    ]


@router.patch("/{notification_id}/read")
async def mark_read(
    notification_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, bool]:
    result = await db.execute(
        select(NotificationRecord).where(
            NotificationRecord.id == notification_id, NotificationRecord.user_id == user.id
        )
    )
    notification = result.scalar_one_or_none()
    if notification is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Notification not found")
    notification.is_read = True
    db.add(notification)
    await db.commit()
    return {"is_read": True}
