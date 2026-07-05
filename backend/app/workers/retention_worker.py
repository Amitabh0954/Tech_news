import logging
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.db.session import SessionLocal
from app.repositories.news import NewsRepository

logger = logging.getLogger(__name__)


async def run_retention_cleanup() -> int:
    """Prune articles older than settings.article_retention_days, but only once the
    table holds enough rows for it to matter (settings.article_retention_min_rows) —
    a small dataset is cheap to keep in full. Bookmarked articles are never deleted.
    Never raises: called from an APScheduler interval job in app.main.
    """
    try:
        async with SessionLocal() as session:
            repository = NewsRepository(session)
            total = await repository.count_articles()
            if total <= settings.article_retention_min_rows:
                logger.info(
                    "retention cleanup skipped: %d articles stored, below the %d-row threshold",
                    total,
                    settings.article_retention_min_rows,
                )
                return 0

            cutoff = datetime.now(UTC) - timedelta(days=settings.article_retention_days)
            deleted = await repository.delete_stale_articles(cutoff)
            logger.info("retention cleanup deleted %d articles older than %s", deleted, cutoff.isoformat())
            return deleted
    except Exception:
        logger.exception("retention cleanup cycle failed")
        return 0
