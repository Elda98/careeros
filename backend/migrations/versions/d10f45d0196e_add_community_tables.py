"""add community tables

Revision ID: d10f45d0196e
Revises: d9a17386e356
Create Date: 2026-08-10 15:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd10f45d0196e'
down_revision = 'd9a17386e356'
branch_labels = None
depends_on = None

# Hand-written, same reason as b192831432f0/d9a17386e356 (no network path
# to the live database from this environment). All five tables are fresh
# CREATE TABLEs — no ADD COLUMN, so no explicit enum pre-creation step is
# needed (Postgres creates the enum type implicitly as part of CREATE
# TABLE, same as every other fresh-table migration this project has run).


def upgrade() -> None:
    op.create_table('community_groups',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_type', sa.Enum('GENERAL', 'MAJOR', 'UNIVERSITY', 'COLLEGE', 'DEPARTMENT', 'SKILL', 'GOAL', 'OPPORTUNITIES_EVENTS', name='communitygrouptype'), nullable=False),
    sa.Column('name', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('community_memberships',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['group_id'], ['community_groups.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('group_id', 'user_id', name='uq_community_membership_group_user')
    )
    op.create_index(op.f('ix_community_memberships_group_id'), 'community_memberships', ['group_id'], unique=False)
    op.create_index(op.f('ix_community_memberships_user_id'), 'community_memberships', ['user_id'], unique=False)

    op.create_table('community_posts',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('group_id', sa.Uuid(), nullable=False),
    sa.Column('author_id', sa.Uuid(), nullable=False),
    sa.Column('post_type', sa.Enum('GENERAL', 'QUESTION', 'EXPERIENCE', 'PROJECT', name='communityposttype'), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['group_id'], ['community_groups.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_community_posts_author_id'), 'community_posts', ['author_id'], unique=False)
    op.create_index(op.f('ix_community_posts_group_id'), 'community_posts', ['group_id'], unique=False)

    op.create_table('community_comments',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('post_id', sa.Uuid(), nullable=False),
    sa.Column('author_id', sa.Uuid(), nullable=False),
    sa.Column('body', sa.Text(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['author_id'], ['users.id'], ),
    sa.ForeignKeyConstraint(['post_id'], ['community_posts.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_community_comments_author_id'), 'community_comments', ['author_id'], unique=False)
    op.create_index(op.f('ix_community_comments_post_id'), 'community_comments', ['post_id'], unique=False)

    op.create_table('community_reactions',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('post_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['community_posts.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('post_id', 'user_id', name='uq_community_reaction_post_user')
    )
    op.create_index(op.f('ix_community_reactions_post_id'), 'community_reactions', ['post_id'], unique=False)
    op.create_index(op.f('ix_community_reactions_user_id'), 'community_reactions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_community_reactions_user_id'), table_name='community_reactions')
    op.drop_index(op.f('ix_community_reactions_post_id'), table_name='community_reactions')
    op.drop_table('community_reactions')

    op.drop_index(op.f('ix_community_comments_post_id'), table_name='community_comments')
    op.drop_index(op.f('ix_community_comments_author_id'), table_name='community_comments')
    op.drop_table('community_comments')

    op.drop_index(op.f('ix_community_posts_group_id'), table_name='community_posts')
    op.drop_index(op.f('ix_community_posts_author_id'), table_name='community_posts')
    op.drop_table('community_posts')
    sa.Enum(name='communityposttype').drop(op.get_bind(), checkfirst=True)

    op.drop_index(op.f('ix_community_memberships_user_id'), table_name='community_memberships')
    op.drop_index(op.f('ix_community_memberships_group_id'), table_name='community_memberships')
    op.drop_table('community_memberships')

    op.drop_table('community_groups')
    sa.Enum(name='communitygrouptype').drop(op.get_bind(), checkfirst=True)
