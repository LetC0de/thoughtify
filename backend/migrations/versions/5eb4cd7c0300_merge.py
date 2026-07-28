"""merge

Revision ID: 5eb4cd7c0300
Revises: 09bf29a79844, 0f8a2c1e4d5b
Create Date: 2026-07-28 13:05:03.529454

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5eb4cd7c0300'
down_revision: Union[str, Sequence[str], None] = ('09bf29a79844', '0f8a2c1e4d5b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
