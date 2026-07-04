import logging

from app.db.session import SessionLocal
from app.repositories.news import NewsRepository, TaxonomyRepository
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion.scoring import LIVE_CATEGORIES

logger = logging.getLogger(__name__)


async def seed_categories() -> None:
    try:
        async with SessionLocal() as session:
            await TaxonomyRepository(session).seed_default_categories(LIVE_CATEGORIES.values())
    except Exception:
        logger.exception("failed to seed default categories")


async def run_ingestion_cycle() -> int:
    """Fetch, rank, categorize, score, and persist articles. Never raises.

    Called by the APScheduler interval job in app.main and by the manual
    POST /ingestion/refresh endpoint. Never called from a user-facing read path.
    """
    await seed_categories()

    pipeline = IngestionPipeline()
    try:
        articles = await pipeline.run()
    except Exception:
        logger.exception("ingestion cycle failed while collecting/ranking/scoring articles")
        return 0

    if not articles:
        logger.warning("ingestion cycle collected 0 articles to persist this run")
        return 0

    try:
        async with SessionLocal() as session:
            repository = NewsRepository(session)
            await repository.upsert_articles(articles)
    except Exception:
        logger.exception("ingestion cycle failed while persisting articles to the database")
        return 0

    logger.info("ingestion cycle persisted %d articles", len(articles))
    return len(articles)
