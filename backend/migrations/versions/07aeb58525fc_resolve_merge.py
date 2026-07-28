"""resolve-merge

Revision ID: 07aeb58525fc
Revises: 5eb4cd7c0300
Create Date: 2026-07-28 14:38:16.039896

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '07aeb58525fc'
down_revision: Union[str, Sequence[str], None] = '5eb4cd7c0300'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
