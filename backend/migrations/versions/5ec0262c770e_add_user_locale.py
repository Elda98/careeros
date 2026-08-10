"""add user locale

Revision ID: 5ec0262c770e
Revises: d10f45d0196e
Create Date: 2026-08-11 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = '5ec0262c770e'
down_revision = 'd10f45d0196e'
branch_labels = None
depends_on = None

# Hand-written, same reason as the three migrations before it (no network
# path to the live database from this environment). Deliberately a plain
# VARCHAR, not an Enum — this project's one real migration incident
# (b192831432f0) was caused specifically by SQLAlchemy's generic Enum type
# creation behavior; a two-letter locale code gets no real DDL benefit from
# being an enum, so this sidesteps that entire risk category rather than
# re-verifying it. server_default='en' means every existing row gets a
# real, valid value in the same statement — no separate backfill needed.


def upgrade() -> None:
    op.add_column('users', sa.Column('locale', sa.String(), nullable=False, server_default='en'))


def downgrade() -> None:
    op.drop_column('users', 'locale')
