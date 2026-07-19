"""add summaries.overview

Revision ID: 8b3c4d5e6f7a
Revises: 7a2b3c4d5e6f
Create Date: 2026-07-19 00:00:02.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '8b3c4d5e6f7a'
down_revision: Union[str, Sequence[str], None] = '7a2b3c4d5e6f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('summaries', sa.Column('overview', sa.Text(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('summaries', 'overview')
