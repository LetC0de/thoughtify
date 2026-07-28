"""Backfill NULL role values and make role column NOT NULL with default.

Users created before the role/last_seen migration (1029ee8458cb) have
role = NULL in the database, which caused them to be invisible to the
active-users query (NULL != "ADMIN" evaluates to NULL/falsy in SQL).

This migration:
1. Sets all existing NULL roles to "USER"
2. Makes the role column NOT NULL with a server default of "USER"

Revision ID: 0f8a2c1e4d5b
Revises: 09bf29a79844
Create Date: 2026-07-28 12:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0f8a2c1e4d5b"
down_revision: Union[str, Sequence[str], None] = "1029ee8458cb"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Backfill all existing NULL roles to "USER"
    op.execute(
        sa.text('UPDATE users SET "role" = \'USER\' WHERE "role" IS NULL')
    )
    # Now make the column NOT NULL with a server default for future rows
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        nullable=False,
        server_default="USER",
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "role",
        existing_type=sa.String(),
        server_default=None,
        nullable=True,
    )
