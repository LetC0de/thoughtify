"""add_purpose_to_otp_and_password_reset_tokens

Revision ID: 09bf29a79844
Revises: 41bcc020e510
Create Date: 2026-07-27 21:44:11.815561

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '09bf29a79844'
down_revision: Union[str, Sequence[str], None] = '41bcc020e510'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add purpose column to existing otp table
    op.add_column('email_verifications', sa.Column('purpose', sa.String(), server_default='REGISTER', nullable=False))

    # Create password_reset_tokens table
    op.create_table('password_reset_tokens',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False, index=True),
        sa.Column('token_hash', sa.String(), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('used', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id', name=op.f('password_reset_tokens_pkey')),
    )
    op.create_index(op.f('ix_password_reset_tokens_user_id'), 'password_reset_tokens', ['user_id'], unique=False)

    # Drop old status column that was removed from the model
    op.drop_column('users', 'status')


def downgrade() -> None:
    """Downgrade schema."""
    op.add_column('users', sa.Column('status', sa.VARCHAR(), autoincrement=False, nullable=True))
    op.drop_table('password_reset_tokens')
    op.drop_column('email_verifications', 'purpose')
