"""Notification triggering (PRD FR-NOTIF-1/4, BR-NOTIF-1).

One place that creates `NotificationRecord` rows, called from whichever
router just completed a relevant event — never a background poller, since
every trigger case implemented here is request-synchronous (BR-NOTIF-1(a):
a requested analysis/roadmap/feedback completes; BR-NOTIF-1's regeneration
case: a roadmap regenerates as a cascade of the user's own request, not a
direct one — FR-NOTIF-4).

Not yet implemented: BR-NOTIF-1(c), "the roadmap becomes stale" — that case
requires a scheduled/background check (elapsed time, not a request event),
which is a distinct piece of infrastructure from notification *writing*
itself. Tracked in PHASE0-AUDIT.md, not silently assumed done.
"""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import NotificationRecord, User


def notify(db: AsyncSession, user: User, category: str, message: str) -> None:
    """Queues a notification write on the given session — does not commit;
    the caller's own commit (already happening for the entity that triggered
    this notification) covers it, so a notification is never left dangling
    if the triggering write itself fails partway (SAS §4.18).

    FR-NOTIF-3: honors the user's muted categories — a preference that does
    nothing isn't a real setting. Requires `user.notification_preference` to
    already be loaded (it is, via `app/api/deps.py`'s eager-load options);
    a user with no preference row yet (never visited Settings) has muted
    nothing, by definition.
    """
    muted = user.notification_preference.muted_categories if user.notification_preference else []
    if category in muted:
        return
    db.add(NotificationRecord(user_id=user.id, category=category, message=message))
