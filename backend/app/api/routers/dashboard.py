"""Dashboard module (PRD FR-DASH, SAS §14.9, §18.3, §19.5).

Explicitly invokes no agent — Dashboard "has no agent of its own" (PRD
§25.5) and instead reads the Roadmap Agent's own item-level output. This is
the SAS's own worked example of a fully valid scenario with zero
Intelligence Layer participation (SAS Part IV §18.3/§19.5).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.db.models import Roadmap, RoadmapItem, RoadmapItemStatus, SkillGapAnalysis, User

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    """FR-DASH-1/2/3/4: single snapshot, single next action, reason inline,
    no further navigation required."""
    roadmap_result = await db.execute(
        select(Roadmap)
        .options(selectinload(Roadmap.items))
        .where(Roadmap.user_id == user.id)
        .order_by(Roadmap.version.desc())
        .limit(1)
    )
    roadmap = roadmap_result.scalar_one_or_none()

    analysis_result = await db.execute(
        select(SkillGapAnalysis)
        .where(SkillGapAnalysis.user_id == user.id)
        .order_by(SkillGapAnalysis.version.desc())
        .limit(1)
    )
    analysis = analysis_result.scalar_one_or_none()

    next_item: RoadmapItem | None = None
    if roadmap:
        next_item = next(
            (i for i in roadmap.items if i.status == RoadmapItemStatus.NOT_STARTED), None
        )

    return {
        "next_action": (
            {
                "roadmap_item_id": str(next_item.id),
                "title": next_item.title,
                "reason": f"Addresses: {next_item.addresses_gap}",
            }
            if next_item
            else None
        ),
        "current_confidence": analysis.confidence if analysis else None,
    }
