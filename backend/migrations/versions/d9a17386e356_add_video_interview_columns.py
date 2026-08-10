"""add video interview columns

Revision ID: d9a17386e356
Revises: b192831432f0
Create Date: 2026-08-10 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd9a17386e356'
down_revision = 'b192831432f0'
branch_labels = None
depends_on = None

# Hand-written, same reason as b192831432f0 (no network path to the live
# database from this environment). `mode` is a bare ADD COLUMN with a new
# enum type, which — unlike CREATE TABLE — does not implicitly create the
# Postgres enum type, so it's created explicitly first (the same lesson
# from 64476d721698's account_type column). interview_sessions has no
# production rows yet (this migration ships alongside b192831432f0, before
# either has been applied to production), so a NOT NULL column with a
# server_default is safe without a separate backfill step.


def upgrade() -> None:
    interview_session_mode = sa.Enum('TEXT', 'VIDEO', name='interviewsessionmode')
    interview_session_mode.create(op.get_bind(), checkfirst=True)
    op.add_column(
        'interview_sessions',
        sa.Column(
            'mode',
            sa.Enum('TEXT', 'VIDEO', name='interviewsessionmode', create_type=False),
            server_default='TEXT',
            nullable=False,
        ),
    )

    op.add_column('interview_answers', sa.Column('speech_rate_wpm', sa.Float(), nullable=True))
    op.add_column('interview_answers', sa.Column('pause_count', sa.Integer(), nullable=True))
    op.add_column('interview_answers', sa.Column('filler_word_count', sa.Integer(), nullable=True))
    op.add_column('interview_answers', sa.Column('avg_volume_level', sa.Float(), nullable=True))
    op.add_column('interview_answers', sa.Column('movement_level', sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column('interview_answers', 'movement_level')
    op.drop_column('interview_answers', 'avg_volume_level')
    op.drop_column('interview_answers', 'filler_word_count')
    op.drop_column('interview_answers', 'pause_count')
    op.drop_column('interview_answers', 'speech_rate_wpm')
    op.drop_column('interview_sessions', 'mode')
    sa.Enum(name='interviewsessionmode').drop(op.get_bind(), checkfirst=True)
