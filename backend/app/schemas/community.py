"""Schemas for Community — groups, posts, comments, reactions.

Real, simple length bounds (Pydantic Field constraints) on every free-text
field, since nothing here has any bound at the DB level (Text columns).
Deliberately NOT run through app/core/security.py's sanitize_free_text:
that guardrail exists specifically for text that reaches an LLM prompt
(prompt-injection detection) — Community content never does, and rejecting
a genuinely human post for containing a phrase like "ignore previous
instructions" (a normal thing to write about, e.g. discussing AI safety)
would be a real false-positive UX bug, not a safety measure.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.db.models import CommunityGroupType, CommunityPostType


class CommunityAuthorRead(BaseModel):
    """Deliberately minimal public identity — the email's local part only
    (never the full address/domain), same "safe public-facing" discipline
    as CandidateReadinessRead (app/schemas/ecosystem.py)."""

    user_id: UUID
    display_label: str


class CommunityGroupCreate(BaseModel):
    group_type: CommunityGroupType
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)


class CommunityGroupUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)


class CommunityGroupRead(BaseModel):
    id: UUID
    group_type: CommunityGroupType
    name: str
    description: str
    created_at: datetime
    member_count: int
    post_count: int
    is_member: bool
    # Derived, not stored (see community.py router's module docstring):
    # whether the current viewer is this group's owner — the earliest
    # member, always the creator.
    is_owner: bool


class CommunityPostCreate(BaseModel):
    post_type: CommunityPostType = CommunityPostType.GENERAL
    title: str = Field(default="", max_length=200)
    body: str = Field(min_length=1, max_length=5000)


class CommunityPostRead(BaseModel):
    id: UUID
    group_id: UUID
    post_type: CommunityPostType
    title: str
    body: str
    created_at: datetime
    author: CommunityAuthorRead
    comment_count: int
    reaction_count: int
    user_has_reacted: bool


class CommunityCommentCreate(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class CommunityCommentRead(BaseModel):
    id: UUID
    post_id: UUID
    body: str
    created_at: datetime
    author: CommunityAuthorRead


class CommunityPostDetailRead(CommunityPostRead):
    comments: list[CommunityCommentRead]


class CommunityReactionToggleRead(BaseModel):
    reacted: bool
    reaction_count: int
