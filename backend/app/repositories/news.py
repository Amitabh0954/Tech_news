from collections.abc import Sequence

from sqlalchemy import Select, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.news import Article, Bookmark, Category, Source


class NewsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    def _base_query(self) -> Select[tuple[Article]]:
        return (
            select(Article)
            .options(
                joinedload(Article.source),
                joinedload(Article.category),
                joinedload(Article.summary),
                joinedload(Article.impact),
            )
            .order_by(desc(Article.impact_score), desc(Article.published_at))
        )

    async def list_articles(
        self,
        *,
        category: str | None = None,
        urgency: str | None = None,
        query: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[Sequence[Article], int]:
        stmt = self._base_query()
        count_stmt = select(func.count(Article.id))

        if category:
            stmt = stmt.join(Category).where(Category.slug == category)
            count_stmt = count_stmt.join(Category).where(Category.slug == category)
        if urgency:
            stmt = stmt.where(Article.urgency == urgency)
            count_stmt = count_stmt.where(Article.urgency == urgency)
        if query:
            query_filter = or_(
                Article.title.ilike(f"%{query}%"),
                Article.excerpt.ilike(f"%{query}%"),
                Article.content.ilike(f"%{query}%"),
            )
            stmt = stmt.where(query_filter)
            count_stmt = count_stmt.where(query_filter)

        stmt = stmt.limit(limit).offset(offset)
        rows = (await self.db.execute(stmt)).scalars().unique().all()
        total = (await self.db.execute(count_stmt)).scalar_one()
        return rows, total

    async def get_by_slug(self, slug: str) -> Article | None:
        stmt = self._base_query().where(Article.slug == slug)
        return (await self.db.execute(stmt)).scalars().unique().first()

    async def list_critical(self, limit: int = 10) -> Sequence[Article]:
        stmt = (
            self._base_query()
            .where(or_(Article.urgency == "critical", Article.impact_score >= 8.5))
            .limit(limit)
        )
        return (await self.db.execute(stmt)).scalars().unique().all()

    async def list_trending_topics(self) -> list[dict[str, str | int | float]]:
        return [
            {"topic": "GitHub Actions security", "mentions": 14, "momentum": 9.2},
            {"topic": "Gemma 4 inference", "mentions": 11, "momentum": 8.7},
            {"topic": "Kubernetes CVEs", "mentions": 9, "momentum": 8.3},
            {"topic": "TypeScript ecosystem", "mentions": 8, "momentum": 7.9},
        ]


class TaxonomyRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_categories(self) -> Sequence[Category]:
        return (await self.db.execute(select(Category).order_by(Category.name))).scalars().all()

    async def list_sources(self) -> Sequence[Source]:
        return (await self.db.execute(select(Source).order_by(Source.trust_score.desc()))).scalars().all()


class BookmarkRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create(self, user_id: str, article_id: str) -> Bookmark:
        bookmark = Bookmark(user_id=user_id, article_id=article_id)
        self.db.add(bookmark)
        await self.db.commit()
        await self.db.refresh(bookmark)
        return bookmark
