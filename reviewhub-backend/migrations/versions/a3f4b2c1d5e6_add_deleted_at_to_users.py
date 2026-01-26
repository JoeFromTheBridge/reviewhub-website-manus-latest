"""add deleted_at to users

Revision ID: a3f4b2c1d5e6
Revises: dbf5c9412799
Create Date: 2026-01-26 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a3f4b2c1d5e6'
down_revision = 'dbf5c9412799'
branch_labels = None
depends_on = None


def upgrade():
    # Add deleted_at column to user table
    op.add_column('user', sa.Column('deleted_at', sa.DateTime(), nullable=True))


def downgrade():
    # Remove deleted_at column from user table
    op.drop_column('user', 'deleted_at')
