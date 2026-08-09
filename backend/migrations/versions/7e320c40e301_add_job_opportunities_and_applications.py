"""add job opportunities and applications

Revision ID: 7e320c40e301
Revises: 64476d721698
Create Date: 2026-08-09 15:49:44.838882
"""
from alembic import op
import sqlalchemy as sa

revision = '7e320c40e301'
down_revision = '64476d721698'
branch_labels = None
depends_on = None

# Same autogenerate false-positive as 64476d721698 (see that migration's
# comment): the checkpoint_* tables are owned by langgraph-checkpoint-
# postgres, not this app's SQLAlchemy models, so autogenerate proposes
# dropping them every time it runs. Stripped out by hand again.


def upgrade() -> None:
    op.create_table('job_opportunities',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('company_profile_id', sa.Uuid(), nullable=False),
    sa.Column('title', sa.String(), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('opportunity_type', sa.Enum('JOB', 'INTERNSHIP', name='opportunitytype'), nullable=False),
    sa.Column('location', sa.String(), nullable=False),
    sa.Column('required_skills', sa.JSON(), nullable=False),
    sa.Column('status', sa.Enum('OPEN', 'CLOSED', name='opportunitystatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['company_profile_id'], ['company_profiles.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_job_opportunities_company_profile_id'), 'job_opportunities', ['company_profile_id'], unique=False)
    op.create_table('applications',
    sa.Column('id', sa.Uuid(), nullable=False),
    sa.Column('opportunity_id', sa.Uuid(), nullable=False),
    sa.Column('user_id', sa.Uuid(), nullable=False),
    sa.Column('status', sa.Enum('SUBMITTED', 'REVIEWED', 'ACCEPTED', 'REJECTED', name='applicationstatus'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['opportunity_id'], ['job_opportunities.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('opportunity_id', 'user_id', name='uq_application_opportunity_user')
    )
    op.create_index(op.f('ix_applications_opportunity_id'), 'applications', ['opportunity_id'], unique=False)
    op.create_index(op.f('ix_applications_user_id'), 'applications', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_applications_user_id'), table_name='applications')
    op.drop_index(op.f('ix_applications_opportunity_id'), table_name='applications')
    op.drop_table('applications')
    op.drop_index(op.f('ix_job_opportunities_company_profile_id'), table_name='job_opportunities')
    op.drop_table('job_opportunities')
    sa.Enum(name='applicationstatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='opportunitystatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='opportunitytype').drop(op.get_bind(), checkfirst=True)
