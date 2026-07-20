"""add summaries.key_points

Revision ID: 7a2b3c4d5e6f
Revises: 6f1a2b3c4d5e
Create Date: 2026-07-19 00:00:01.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '7a2b3c4d5e6f'
down_revision: Union[str, Sequence[str], None] = '6f1a2b3c4d5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('summaries', sa.Column('key_points', postgresql.JSONB(astext_type=sa.Text()), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('summaries', 'key_points')
