from app.repositories.news import NewsRepository, TaxonomyRepository
from app.services.demo_data import DEMO_CATEGORIES, DEMO_SOURCES, get_demo_article, get_demo_feed
from app.services.live_news import LiveNewsService
from app.schemas.news import PaginatedArticles


class NewsService:
    def __init__(self, repository: NewsRepository) -> None:
        self.repository = repository
        self.live_news = LiveNewsService()

    def _demo_feed(
        self,
        *,
        category: str | None = None,
        urgency: str | None = None,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedArticles:
        items = get_demo_feed().items
        if category:
            items = [item for item in items if item.category and item.category.slug == category]
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
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedArticles:
        offset = (page - 1) * page_size
        try:
            rows, total = await self.repository.list_articles(
                category=category,
                urgency=urgency,
                query=query,
                limit=page_size,
                offset=offset,
            )
            if not rows:
                live = await self.live_news.paginated_feed(
                    category=category,
                    urgency=urgency,
                    query=query,
                    page=page,
                    page_size=page_size,
                )
                return live if live.items else self._demo_feed(
                    category=category,
                    urgency=urgency,
                    query=query,
                    page=page,
                    page_size=page_size,
                )
            next_cursor = str(page + 1) if offset + page_size < total else None
            return PaginatedArticles(items=list(rows), total=total, next_cursor=next_cursor)
        except Exception:
            live = await self.live_news.paginated_feed(
                category=category,
                urgency=urgency,
                query=query,
                page=page,
                page_size=page_size,
            )
            return live if live.items else self._demo_feed(
                category=category,
                urgency=urgency,
                query=query,
                page=page,
                page_size=page_size,
            )

    async def get_article(self, slug: str):
        try:
            article = await self.repository.get_by_slug(slug)
            if article:
                return article
            live = await self.live_news.collect_articles()
            current = next((item for item in live if item.slug == slug), None)
            if current:
                related = await self.live_news.related_articles(slug)
                current.related_story_ids = [item.id for item in related]
                return current
            return get_demo_article(slug)
        except Exception:
            live = await self.live_news.collect_articles()
            current = next((item for item in live if item.slug == slug), None)
            if current:
                related = await self.live_news.related_articles(slug)
                current.related_story_ids = [item.id for item in related]
                return current
            return get_demo_article(slug)

    async def list_critical(self):
        try:
            rows = await self.repository.list_critical()
            if rows:
                return rows
            live = await self.live_news.paginated_feed(urgency="critical", page_size=10)
            return live.items or [article for article in get_demo_feed().items if article.urgency == "critical"]
        except Exception:
            live = await self.live_news.paginated_feed(urgency="critical", page_size=10)
            return live.items or [article for article in get_demo_feed().items if article.urgency == "critical"]

    async def list_trending(self):
        return await self.repository.list_trending_topics()


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
