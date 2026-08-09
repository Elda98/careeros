"""add service listings

Revision ID: 2a72b314d0d2
Revises: 7e320c40e301
Create Date: 2026-08-09 16:12:09.464874
"""
from alembic import op
import sqlalchemy as sa

revision = '2a72b314d0d2'
down_revision = '7e320c40e301'
branch_labels = None
depends_on = None

# Same autogenerate false-positive as the previous two migrations (see
# 64476d721698's comment) — checkpoint_* tables stripped out by hand.


def upgrade() -> None:
    op.create_table('service_listings',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('provider_profile_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('category', sa.String(), nullable=False),
    sa.Column('status', sa.Enum('ACTIVE', 'INACTIVE', name='servicelistingstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['provider_profile_id'], ['service_provider_profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_service_listings_provider_profile_id'), 'service_listings', ['provider_profile_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_service_listings_provider_profile_id'), table_name='service_listings')
    op.drop_table('service_listings')
    sa.Enum(name='servicelistingstatus').drop(op.get_bind(), checkfirst=True)
