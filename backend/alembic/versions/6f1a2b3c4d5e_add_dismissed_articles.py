"""add dismissed_articles

Revision ID: 6f1a2b3c4d5e
Revises: 0a2a73933d1a
Create Date: 2026-07-19 00:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '6f1a2b3c4d5e'
down_revision: Union[str, Sequence[str], None] = '0a2a73933d1a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('dismissed_articles',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('article_id', sa.UUID(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    sa.PrimaryKeyConstraint('user_id', 'article_id')
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('dismissed_articles')
