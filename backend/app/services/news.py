import logging

from app.repositories.news import NewsRepository, TaxonomyRepository
from app.schemas.news import ArticleSuggestion, PaginatedArticles
from app.services.demo_data import DEMO_CATEGORIES, DEMO_SOURCES, DEMO_TRENDING, get_demo_article, get_demo_feed
from app.workers.ingestion_worker import run_ingestion_cycle

logger = logging.getLogger(__name__)


class NewsService:
    """Reads are always DB-only and fast. Freshness comes from the scheduled ingestion
    worker (see app.main lifespan), not from live provider calls made during a request.
    """

    def __init__(self, repository: NewsRepository) -> None:
        self.repository = repository

    async def refresh_cache(self) -> int:
        """Explicit manual trigger (POST /ingestion/refresh) — not called from any read path."""
        return await run_ingestion_cycle()

    def _demo_feed(
        self,
        *,
        category: str | None = None,
        urgency: str | None = None,
        query: str | None = None,
        source_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedArticles:
        items = get_demo_feed().items
        if category:
            items = [item for item in items if item.category and item.category.slug == category]
        if source_type:
            items = [item for item in items if item.source.source_type == source_type]
        if urgency:
            items = [item for item in items if item.urgency == urgency]
        if query:
            needle = query.lower()
            items = [
                item
                for item in items
                if needle in item.title.lower()
                or (item.excerpt and needle in item.excerpt.lower())
                or (item.summary and needle in item.summary.what_happened.lower())
            ]
        start = (page - 1) * page_size
        end = start + page_size
        next_cursor = str(page + 1) if end < len(items) else None
        return PaginatedArticles(items=items[start:end], total=len(items), next_cursor=next_cursor)

    async def list_news(
        self,
        *,
        category: str | None = None,
        urgency: str | None = None,
        query: str | None = None,
        source_type: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedArticles:
        offset = (page - 1) * page_size
        try:
            rows, total = await self.repository.list_articles(
                category=category,
                urgency=urgency,
                query=query,
                source_type=source_type,
                limit=page_size,
                offset=offset,
            )
        except Exception:
            logger.exception("failed to read articles from the database, serving static demo feed")
            return self._demo_feed(
                category=category, urgency=urgency, query=query, source_type=source_type, page=page, page_size=page_size
            )

        if not rows:
            logger.info("no cached articles yet for this filter, serving static demo feed while ingestion catches up")
            return self._demo_feed(
                category=category, urgency=urgency, query=query, source_type=source_type, page=page, page_size=page_size
            )

        next_cursor = str(page + 1) if offset + page_size < total else None
        return PaginatedArticles(items=list(rows), total=total, next_cursor=next_cursor)

    async def suggest(self, query: str, limit: int = 6) -> list[ArticleSuggestion]:
        try:
            rows = await self.repository.suggest_articles(query, limit=limit)
        except Exception:
            logger.exception("failed to read search suggestions from the database")
            rows = []

        if not rows:
            needle = query.lower()
            rows = [
                article
                for article in get_demo_feed().items
                if needle in article.title.lower() or (article.excerpt and needle in article.excerpt.lower())
            ][:limit]

        return [
            ArticleSuggestion(
                id=article.id,
                title=article.title,
                slug=article.slug,
                category=article.category,
                urgency=article.urgency,
            )
            for article in rows
        ]

    async def get_article(self, slug: str):
        try:
            article = await self.repository.get_by_slug(slug)
        except Exception:
            logger.exception("failed to read article '%s' from the database", slug)
            return get_demo_article(slug)
        return article or get_demo_article(slug)

    async def list_critical(self):
        try:
            rows = await self.repository.list_critical()
        except Exception:
            logger.exception("failed to read critical articles from the database")
            return [article for article in get_demo_feed().items if article.urgency == "critical"]
        return rows or [article for article in get_demo_feed().items if article.urgency == "critical"]

    async def list_trending(self):
        try:
            topics = await self.repository.list_trending_topics()
        except Exception:
            logger.exception("failed to compute trending topics from the database")
            return DEMO_TRENDING
        return topics or DEMO_TRENDING


class TaxonomyService:
    def __init__(self, repository: TaxonomyRepository) -> None:
        self.repository = repository

    async def list_categories(self):
        try:
            rows = await self.repository.list_categories()
            return rows or DEMO_CATEGORIES
        except Exception:
            return DEMO_CATEGORIES

    async def list_sources(self):
        try:
            rows = await self.repository.list_sources()
            return rows or DEMO_SOURCES
        except Exception:
            return DEMO_SOURCES
