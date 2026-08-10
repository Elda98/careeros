"""Community module — shared across every persona (Student/Graduate/
Company/Service Provider), not scoped to one account type. Group creation
is self-serve (any authenticated user, same pattern as JobOpportunity/
ServiceListing); browsing is open to any authenticated user; posting/
commenting/reacting requires having joined the group first (an explicit,
user-initiated action — see models.py's own ADR-001 note on why this is
the safe half of "Professional Community").

Ownership/moderation model: a normal member is NOT an administrator of
the platform's Community feature, but the person who creates a specific
group IS that group's owner — the same scoped, standard pattern as a
Discord server owner or subreddit moderator, not a platform-wide admin
role (which this product has no other concept of, and inventing one for
Community alone would be out of proportion). Ownership is deliberately
*derived*, not a stored column: the owner is whichever member's
`CommunityMembership.joined_at` is earliest for that group — always the
creator, since `create_group` inserts their membership in the same
transaction as the group itself, before anyone else could possibly join.
This needed no new migration. Owners can edit their group and delete any
post/comment within it (moderation); every other member can only delete
their own content.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db
from app.db.models import (
    CommunityComment,
    CommunityGroup,
    CommunityMembership,
    CommunityPost,
    CommunityReaction,
    User,
)
from app.schemas.community import (
    CommunityCommentCreate,
    CommunityGroupCreate,
    CommunityGroupRead,
    CommunityGroupUpdate,
    CommunityPostCreate,
    CommunityPostDetailRead,
    CommunityPostRead,
    CommunityReactionToggleRead,
)

router = APIRouter(prefix="/community", tags=["community"])

_POST_LOAD = (
    selectinload(CommunityPost.author),
    selectinload(CommunityPost.comments),
    selectinload(CommunityPost.reactions),
)
_POST_WITH_COMMENT_AUTHORS_LOAD = (*_POST_LOAD, selectinload(CommunityPost.comments).selectinload(CommunityComment.author))


def _author_read(user: User) -> dict:
    # The email's local part only — never the full address/domain. Same
    # "safe public-facing identity" discipline as CandidateReadinessRead
    # (app/schemas/ecosystem.py), applied here since a User row has no
    # dedicated public display-name field.
    return {"user_id": user.id, "display_label": user.email.split("@")[0]}


def _post_read(post: CommunityPost, viewer_id: UUID) -> dict:
    return {
        "id": post.id,
        "group_id": post.group_id,
        "post_type": post.post_type,
        "title": post.title,
        "body": post.body,
        "created_at": post.created_at,
        "author": _author_read(post.author),
        "comment_count": len(post.comments),
        "reaction_count": len(post.reactions),
        "user_has_reacted": any(r.user_id == viewer_id for r in post.reactions),
    }


def _comment_read(comment: CommunityComment) -> dict:
    return {
        "id": comment.id,
        "post_id": comment.post_id,
        "body": comment.body,
        "created_at": comment.created_at,
        "author": _author_read(comment.author),
    }


async def _require_membership(db: AsyncSession, user: User, group_id: UUID) -> None:
    result = await db.execute(
        select(CommunityMembership).where(CommunityMembership.group_id == group_id, CommunityMembership.user_id == user.id)
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Join this community to participate.")


async def _get_group(db: AsyncSession, group_id: UUID) -> CommunityGroup:
    result = await db.execute(select(CommunityGroup).where(CommunityGroup.id == group_id))
    group = result.scalar_one_or_none()
    if group is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Community not found")
    return group


async def _group_owner_id(db: AsyncSession, group_id: UUID) -> UUID | None:
    result = await db.execute(
        select(CommunityMembership.user_id)
        .where(CommunityMembership.group_id == group_id)
        .order_by(CommunityMembership.joined_at.asc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _require_owner(db: AsyncSession, user: User, group_id: UUID) -> None:
    owner_id = await _group_owner_id(db, group_id)
    if owner_id != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only this community's owner can do that.")


async def _group_read(db: AsyncSession, group: CommunityGroup, viewer_id: UUID) -> dict:
    member_count = await db.execute(
        select(func.count()).select_from(CommunityMembership).where(CommunityMembership.group_id == group.id)
    )
    post_count = await db.execute(select(func.count()).select_from(CommunityPost).where(CommunityPost.group_id == group.id))
    is_member = await db.execute(
        select(CommunityMembership).where(CommunityMembership.group_id == group.id, CommunityMembership.user_id == viewer_id)
    )
    owner_id = await _group_owner_id(db, group.id)
    return {
        "id": group.id,
        "group_type": group.group_type,
        "name": group.name,
        "description": group.description,
        "created_at": group.created_at,
        "member_count": member_count.scalar_one(),
        "post_count": post_count.scalar_one(),
        "is_member": is_member.scalar_one_or_none() is not None,
        "is_owner": owner_id == viewer_id,
    }


@router.get("/groups", response_model=list[CommunityGroupRead])
async def list_groups(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> list[dict]:
    member_counts = (
        select(CommunityMembership.group_id, func.count().label("n")).group_by(CommunityMembership.group_id).subquery()
    )
    post_counts = select(CommunityPost.group_id, func.count().label("n")).group_by(CommunityPost.group_id).subquery()

    result = await db.execute(
        select(CommunityGroup, func.coalesce(member_counts.c.n, 0), func.coalesce(post_counts.c.n, 0))
        .outerjoin(member_counts, member_counts.c.group_id == CommunityGroup.id)
        .outerjoin(post_counts, post_counts.c.group_id == CommunityGroup.id)
        .order_by(CommunityGroup.created_at.desc())
    )
    rows = result.all()

    my_memberships = await db.execute(select(CommunityMembership.group_id).where(CommunityMembership.user_id == user.id))
    my_group_ids = {row[0] for row in my_memberships.all()}

    # Earliest membership per group == that group's owner (see module
    # docstring) — one query for the whole list, not N+1.
    earliest = (
        select(
            CommunityMembership.group_id,
            CommunityMembership.user_id,
            func.row_number()
            .over(partition_by=CommunityMembership.group_id, order_by=CommunityMembership.joined_at.asc())
            .label("rn"),
        ).subquery()
    )
    owners_result = await db.execute(select(earliest.c.group_id, earliest.c.user_id).where(earliest.c.rn == 1))
    owner_by_group = {row.group_id: row.user_id for row in owners_result}

    return [
        {
            "id": group.id,
            "group_type": group.group_type,
            "name": group.name,
            "description": group.description,
            "created_at": group.created_at,
            "member_count": member_count,
            "post_count": post_count,
            "is_member": group.id in my_group_ids,
            "is_owner": owner_by_group.get(group.id) == user.id,
        }
        for group, member_count, post_count in rows
    ]


@router.get("/groups/{group_id}", response_model=CommunityGroupRead)
async def get_group(group_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    group = await _get_group(db, group_id)
    return await _group_read(db, group, user.id)


@router.post("/groups", response_model=CommunityGroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: CommunityGroupCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    group = CommunityGroup(group_type=body.group_type, name=body.name, description=body.description)
    db.add(group)
    await db.flush()
    # The creator automatically joins their own group — matches every
    # other self-serve creation flow in this codebase (a company doesn't
    # need a second step to "see" its own posting).
    db.add(CommunityMembership(group_id=group.id, user_id=user.id))
    await db.commit()
    return {
        "id": group.id,
        "group_type": group.group_type,
        "name": group.name,
        "description": group.description,
        "created_at": group.created_at,
        "member_count": 1,
        "post_count": 0,
        "is_member": True,
        "is_owner": True,
    }


@router.patch("/groups/{group_id}", response_model=CommunityGroupRead)
async def update_group(
    group_id: UUID,
    body: CommunityGroupUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    group = await _get_group(db, group_id)
    await _require_owner(db, user, group_id)
    if body.name is not None:
        group.name = body.name
    if body.description is not None:
        group.description = body.description
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return await _group_read(db, group, user.id)


@router.post("/groups/{group_id}/join", status_code=status.HTTP_204_NO_CONTENT)
async def join_group(group_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    await _get_group(db, group_id)
    existing = await db.execute(
        select(CommunityMembership).where(CommunityMembership.group_id == group_id, CommunityMembership.user_id == user.id)
    )
    if existing.scalar_one_or_none() is None:
        db.add(CommunityMembership(group_id=group_id, user_id=user.id))
        await db.commit()


@router.delete("/groups/{group_id}/join", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(group_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(
        select(CommunityMembership).where(CommunityMembership.group_id == group_id, CommunityMembership.user_id == user.id)
    )
    membership = result.scalar_one_or_none()
    if membership is not None:
        await db.delete(membership)
        await db.commit()


@router.delete("/groups/{group_id}/members/{member_user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: UUID,
    member_user_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await _get_group(db, group_id)
    await _require_owner(db, user, group_id)
    if member_user_id == user.id:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "The owner can't remove themselves — leave via the normal leave action instead."
        )
    result = await db.execute(
        select(CommunityMembership).where(
            CommunityMembership.group_id == group_id, CommunityMembership.user_id == member_user_id
        )
    )
    membership = result.scalar_one_or_none()
    if membership is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "This user is not a member of this community.")
    await db.delete(membership)
    await db.commit()


@router.get("/groups/{group_id}/posts", response_model=list[CommunityPostRead])
async def list_posts(
    group_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[dict]:
    await _get_group(db, group_id)
    result = await db.execute(
        select(CommunityPost)
        .where(CommunityPost.group_id == group_id)
        .options(*_POST_LOAD)
        .order_by(CommunityPost.created_at.desc())
        .limit(50)
    )
    posts = result.scalars().all()
    return [_post_read(p, user.id) for p in posts]


@router.post("/groups/{group_id}/posts", response_model=CommunityPostRead, status_code=status.HTTP_201_CREATED)
async def create_post(
    group_id: UUID,
    body: CommunityPostCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    await _get_group(db, group_id)
    await _require_membership(db, user, group_id)

    post = CommunityPost(group_id=group_id, author_id=user.id, post_type=body.post_type, title=body.title, body=body.body)
    db.add(post)
    await db.commit()
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post.id).options(*_POST_LOAD))
    return _post_read(result.scalar_one(), user.id)


@router.get("/posts/{post_id}", response_model=CommunityPostDetailRead)
async def get_post(post_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> dict:
    result = await db.execute(
        select(CommunityPost).where(CommunityPost.id == post_id).options(*_POST_WITH_COMMENT_AUTHORS_LOAD)
    )
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    comments = sorted(post.comments, key=lambda c: c.created_at)
    return {**_post_read(post, user.id), "comments": [_comment_read(c) for c in comments]}


@router.post("/posts/{post_id}/comments", response_model=CommunityPostDetailRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    body: CommunityCommentCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    await _require_membership(db, user, post.group_id)

    db.add(CommunityComment(post_id=post_id, author_id=user.id, body=body.body))
    await db.commit()
    return await get_post(post_id, user=user, db=db)


@router.post("/posts/{post_id}/react", response_model=CommunityReactionToggleRead)
async def toggle_reaction(
    post_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    await _require_membership(db, user, post.group_id)

    existing = await db.execute(
        select(CommunityReaction).where(CommunityReaction.post_id == post_id, CommunityReaction.user_id == user.id)
    )
    reaction = existing.scalar_one_or_none()
    if reaction is not None:
        await db.delete(reaction)
        reacted = False
    else:
        db.add(CommunityReaction(post_id=post_id, user_id=user.id))
        reacted = True
    await db.commit()

    count_result = await db.execute(
        select(func.count()).select_from(CommunityReaction).where(CommunityReaction.post_id == post_id)
    )
    return {"reacted": reacted, "reaction_count": count_result.scalar_one()}


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)) -> None:
    result = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = result.scalar_one_or_none()
    if post is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Post not found")
    # A 403 here, not the IDOR-safe 404 pattern used for private
    # ownership-scoped resources elsewhere: this post's existence is
    # already public (visible to any group member via GET), so there is
    # nothing to hide — "not your post or you don't moderate this
    # community" is the honest response. Author OR the group's owner may
    # delete — moderation, not just self-service cleanup.
    if post.author_id != user.id:
        owner_id = await _group_owner_id(db, post.group_id)
        if owner_id != user.id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "You can only delete your own posts, or posts in a community you own."
            )
    await db.delete(post)
    await db.commit()


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> None:
    result = await db.execute(
        select(CommunityComment).where(CommunityComment.id == comment_id).options(selectinload(CommunityComment.post))
    )
    comment = result.scalar_one_or_none()
    if comment is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Comment not found")
    if comment.author_id != user.id:
        owner_id = await _group_owner_id(db, comment.post.group_id)
        if owner_id != user.id:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN, "You can only delete your own comments, or comments in a community you own."
            )
    await db.delete(comment)
    await db.commit()
