import asyncio
import logging

from app.db.session import SessionLocal
from app.repositories.news import NewsRepository, TaxonomyRepository
from app.services.events import news_events
from app.services.ingestion.pipeline import IngestionPipeline
from app.services.ingestion.scoring import LIVE_CATEGORIES

logger = logging.getLogger(__name__)

# The scheduler (every ingestion_interval_minutes) and the manual POST /ingestion/refresh
# endpoint both call run_ingestion_cycle() but aren't otherwise coordinated. Without this
# lock, an overlapping run against the same slow upstream feeds (venturebeat, etc.) could
# race to upsert the same article with two different fetches of the same source in flight,
# and whichever write lands last silently wins — including reverting an already-fixed field
# back to a stale value with no error surfaced anywhere.
_ingestion_lock = asyncio.Lock()


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
    if _ingestion_lock.locked():
        logger.info("ingestion cycle already in progress, skipping this trigger")
        return 0

    async with _ingestion_lock:
        return await _run_ingestion_cycle_locked()


async def _run_ingestion_cycle_locked() -> int:
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
            new_count = await repository.upsert_articles(articles)
    except Exception:
        logger.exception("ingestion cycle failed while persisting articles to the database")
        return 0

    logger.info("ingestion cycle persisted %d articles (%d new)", len(articles), new_count)
    if new_count:
        news_events.publish({"type": "new_articles", "count": new_count})
    return len(articles)
