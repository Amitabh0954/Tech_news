"""
Database initialization script - creates all tables from models
Run this once after updating database credentials in .env
"""

import asyncio
import sys
from pathlib import Path

# Add the backend app to path
sys.path.insert(0, str(Path(__file__).parent))

import asyncpg

# Imported for the side effect of registering every model class on Base.metadata
# before create_all() below — without this import, metadata is empty and creates
# zero tables. Superseded by Alembic (see README) but kept for quick local setup.
import app.models.news  # noqa: F401
from app.db.base import Base


async def init_db():
    """Initialize database and create all tables."""
    print("Connecting to database...")
    
    # Connect directly with asyncpg to avoid SSL issues
    conn = await asyncpg.connect(
        host='localhost',
        port=5432,
        user='postgres',
        password='amit@0954',
        database='Tech_news'
    )
    
    try:
        # Create pgvector extension
        try:
            await conn.execute("CREATE EXTENSION IF NOT EXISTS vector;")
            print("✅ pgvector extension enabled")
        except Exception as e:
            print(f"⚠️  pgvector extension: {e}")
        
        # Get DDL from SQLAlchemy metadata
        print("Creating database tables...")
        
        # Create all tables using SQLAlchemy
        from sqlalchemy import create_engine
        
        # Create a sync engine just for metadata
        sync_engine = create_engine("postgresql+psycopg2://postgres:amit%400954@localhost:5432/Tech_news", echo=False)
        Base.metadata.create_all(sync_engine)
        sync_engine.dispose()
        
        print("✅ Database initialized successfully!")
        print("\nDatabase schema created:")
        print("  - users (user accounts)")
        print("  - articles (news articles)")
        print("  - bookmarks (user bookmarks)")
        print("  - sources (news sources)")
        print("  - categories (article categories)")
        print("  - summaries (AI summaries)")
        print("  - impact_scores (impact metrics)")
        print("  - tags (article tags)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(init_db())



