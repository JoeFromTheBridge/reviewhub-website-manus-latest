"""Increase user.password_hash to 256 (scrypt-compatible)

Revision ID: dbf5c9412799
Revises: 711a08fed583
Create Date: 2025-10-07 19:21:16.850725

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'dbf5c9412799'
down_revision = '711a08fed583'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        # SQLite: use batch mode so Alembic will recreate the table safely
        with op.batch_alter_table('user', schema=None) as batch_op:
            batch_op.alter_column(
                'password_hash',
                existing_type=sa.String(length=128),
                type_=sa.String(length=256),
                existing_nullable=False
            )
    else:
        # Postgres / others: simple ALTER works
        op.alter_column(
            'user',
            'password_hash',
            existing_type=sa.String(length=128),
            type_=sa.String(length=256),
            existing_nullable=False
        )




def downgrade():
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        with op.batch_alter_table('user', schema=None) as batch_op:
            batch_op.alter_column(
                'password_hash',
                existing_type=sa.String(length=256),
                type_=sa.String(length=128),
                existing_nullable=False
            )
    else:
        op.alter_column(
            'user',
            'password_hash',
            existing_type=sa.String(length=256),
            type_=sa.String(length=128),
            existing_nullable=False
        )