"""add account_type and ecosystem persona profiles

Revision ID: 64476d721698
Revises: 68c38003a713
Create Date: 2026-08-09 02:17:08.585836
"""
from alembic import op
import sqlalchemy as sa

revision = '64476d721698'
down_revision = '68c38003a713'
branch_labels = None
depends_on = None

# Autogenerate also proposed dropping checkpoints/checkpoint_blobs/
# checkpoint_writes/checkpoint_migrations — those are real tables in the
# live database, but they're created and owned by
# langgraph-checkpoint-postgres's own PostgresSaver.setup()
# (ai/careeros_ai/orchestration/checkpointer.py), not by this app's
# SQLAlchemy models. Alembic's autogenerate only compares the live schema
# against Base.metadata, so anything outside our own models looks
# "removed" to it. Running that as generated would have deleted every
# in-flight human-in-the-loop approval on next deploy. Stripped out by
# hand; everything below is only the real, intended schema change.


def upgrade() -> None:
    # Postgres needs the enum TYPE to exist before a column can use it —
    # unlike a brand-new table (where CREATE TABLE's own DDL handles this
    # implicitly), a bare ADD COLUMN on an existing table does not create
    # it automatically. Explicit here rather than relying on autogenerate,
    # which didn't emit this step.
    account_type_enum = sa.Enum('STUDENT', 'GRADUATE', 'COMPANY', 'SERVICE_PROVIDER', name='accounttype')
    account_type_enum.create(op.get_bind(), checkfirst=True)

    op.create_table('company_profiles',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('company_name', sa.String(), nullable=False),
    sa.Column('industry', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('website', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.create_table('service_provider_profiles',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('professional_title', sa.String(), nullable=False),
    sa.Column('expertise', sa.JSON(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('contact_info', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('user_id')
    )
    op.add_column('users', sa.Column('account_type', account_type_enum, nullable=True))

    # Safe default for existing users (Phase 2 of the role-based ecosystem
    # rollout): every account that existed before this column was added
    # was, by construction, a Student/Graduate career-seeker — that was
    # the only persona the product had. Backfilling them to STUDENT means
    # they keep using the app exactly as before, with no forced role-
    # selection interruption. Only genuinely new sign-ups (account_type
    # IS NULL going forward — but there are none yet at migration time,
    # this UPDATE simply has no NULL rows left after it runs) see the
    # role-selection screen.
    op.execute("UPDATE users SET account_type = 'STUDENT' WHERE account_type IS NULL")


def downgrade() -> None:
    op.drop_column('users', 'account_type')
    op.drop_table('service_provider_profiles')
    op.drop_table('company_profiles')
    sa.Enum(name='accounttype').drop(op.get_bind(), checkfirst=True)
