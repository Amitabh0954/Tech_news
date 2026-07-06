from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import Select, delete, desc, func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.news import Article, Bookmark, Category, ImpactScore, Source, Summary
from app.schemas.news import ArticleDetail


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
            .order_by(desc(Article.published_at), desc(Article.ingested_at))
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

    async def list_trending_topics(
        self, *, window_hours: int = 48, limit: int = 12
    ) -> list[dict[str, str | int | float]]:
        """Aggregate ecosystem tags (stored per-article in metadata->'ecosystem_tags')
        over a rolling window. Momentum is the share of a tag's mentions that fell in
        the more recent half of the window, scaled to 0-10 — a tag mentioned only in
        the last N/2 hours scores near 10, one that's cooled off scores near 0.
        """
        now = datetime.now(UTC)
        window_start = now - timedelta(hours=window_hours)
        midpoint = now - timedelta(hours=window_hours / 2)

        stmt = text(
            """
            SELECT tag AS topic,
                   COUNT(*) AS mentions,
                   COUNT(*) FILTER (WHERE published_at >= :midpoint) AS recent_mentions
            FROM articles,
                 LATERAL jsonb_array_elements_text(metadata -> 'ecosystem_tags') AS tag
            WHERE published_at >= :window_start
            GROUP BY tag
            ORDER BY mentions DESC, recent_mentions DESC
            LIMIT :limit
            """
        )
        rows = (
            await self.db.execute(stmt, {"window_start": window_start, "midpoint": midpoint, "limit": limit})
        ).all()
        return [
            {
                "topic": row.topic,
                "mentions": row.mentions,
                "momentum": round((row.recent_mentions / row.mentions) * 10, 1) if row.mentions else 0.0,
            }
            for row in rows
        ]

    async def suggest_articles(self, query: str, limit: int = 6) -> Sequence[Article]:
        needle = f"%{query}%"
        stmt = (
            select(Article)
            .options(joinedload(Article.category))
            .where(or_(Article.title.ilike(needle), Article.excerpt.ilike(needle)))
            .order_by(desc(Article.impact_score), desc(Article.published_at))
            .limit(limit)
        )
        return (await self.db.execute(stmt)).scalars().unique().all()

    async def count_articles(self) -> int:
        return await self.db.scalar(select(func.count(Article.id))) or 0

    async def delete_stale_articles(self, cutoff: datetime) -> int:
        """Delete articles published before cutoff, skipping any that are bookmarked.

        Dependent summary/impact rows have no cascade at the DB level, so they're
        deleted explicitly first to avoid FK violations.
        """
        stale_ids_stmt = (
            select(Article.id)
            .where(Article.published_at < cutoff)
            .where(~Article.id.in_(select(Bookmark.article_id)))
        )
        stale_ids = (await self.db.execute(stale_ids_stmt)).scalars().all()
        if not stale_ids:
            return 0

        await self.db.execute(delete(Summary).where(Summary.article_id.in_(stale_ids)))
        await self.db.execute(delete(ImpactScore).where(ImpactScore.article_id.in_(stale_ids)))
        await self.db.execute(delete(Article).where(Article.id.in_(stale_ids)))
        await self.db.commit()
        return len(stale_ids)

    async def latest_ingested_at(self) -> datetime | None:
        return await self.db.scalar(select(func.max(Article.ingested_at)))

    async def is_cache_stale(self, ttl_minutes: int = 30) -> bool:
        latest = await self.latest_ingested_at()
        if latest is None:
            return True

        if latest.tzinfo is None:
            latest = latest.replace(tzinfo=UTC)

        return latest < datetime.now(UTC) - timedelta(minutes=ttl_minutes)

    async def upsert_articles(self, articles: Sequence[ArticleDetail]) -> int:
        """Insert/update the given articles, returning how many were newly created
        (as opposed to updates to articles already on file) so callers can decide
        whether it's worth notifying live clients.
        """
        new_count = 0
        for article in articles:
            source = await self.db.scalar(select(Source).where(Source.slug == article.source.slug))
            if source is None:
                source = Source(
                    id=article.source.id,
                    name=article.source.name,
                    slug=article.source.slug,
                    source_type=article.source.source_type,
                    homepage_url=article.source.homepage_url,
                    trust_score=float(article.source.trust_score),
                    is_active=True,
                )
                self.db.add(source)
                await self.db.flush()
            else:
                source.name = article.source.name
                source.source_type = article.source.source_type
                source.homepage_url = article.source.homepage_url
                source.trust_score = float(article.source.trust_score)

            category = None
            if article.category:
                category = await self.db.scalar(select(Category).where(Category.slug == article.category.slug))
                if category is None:
                    category = Category(
                        id=article.category.id,
                        name=article.category.name,
                        slug=article.category.slug,
                        description=article.category.description,
                    )
                    self.db.add(category)
                    await self.db.flush()
                else:
                    category.name = article.category.name
                    category.description = article.category.description

            existing = await self.db.scalar(select(Article).where(Article.canonical_url == article.canonical_url))
            if existing is None:
                existing = Article(
                    id=article.id,
                    source_id=source.id,
                    category_id=category.id if category else None,
                    title=article.title,
                    slug=article.slug,
                    canonical_url=article.canonical_url,
                    author=None,
                    excerpt=article.excerpt,
                    content=article.content,
                    image_url=article.image_url,
                    discussion_url=article.discussion_url,
                    normalized_url=article.canonical_url,
                    dedupe_key=str(article.id),
                    urgency=article.urgency,
                    impact_score=float(article.impact_score),
                    published_at=article.published_at,
                    ingested_at=datetime.now(UTC),
                    metadata_json={"ecosystem_tags": article.ecosystem_tags},
                )
                self.db.add(existing)
                await self.db.flush()
                new_count += 1
            else:
                existing.title = article.title
                existing.slug = article.slug
                existing.excerpt = article.excerpt
                existing.content = article.content
                existing.image_url = article.image_url
                existing.discussion_url = article.discussion_url
                existing.urgency = article.urgency
                existing.impact_score = float(article.impact_score)
                existing.published_at = article.published_at
                existing.ingested_at = datetime.now(UTC)
                existing.source_id = source.id
                existing.category_id = category.id if category else None
                existing.metadata_json = {"ecosystem_tags": article.ecosystem_tags}

            if article.summary:
                summary = await self.db.scalar(select(Summary).where(Summary.article_id == existing.id))
                if summary is None:
                    summary = Summary(
                        article_id=existing.id,
                        model_provider="live-news",
                        model_name="signal-ranker",
                        what_happened=article.summary.what_happened,
                        why_it_matters=article.summary.why_it_matters,
                        who_is_affected=article.summary.who_is_affected,
                        immediate_risks=article.summary.immediate_risks,
                        long_term_implications=article.summary.long_term_implications,
                    )
                    self.db.add(summary)
                else:
                    summary.what_happened = article.summary.what_happened
                    summary.why_it_matters = article.summary.why_it_matters
                    summary.who_is_affected = article.summary.who_is_affected
                    summary.immediate_risks = article.summary.immediate_risks
                    summary.long_term_implications = article.summary.long_term_implications

            if article.impact:
                impact = await self.db.scalar(select(ImpactScore).where(ImpactScore.article_id == existing.id))
                if impact is None:
                    impact = ImpactScore(
                        article_id=existing.id,
                        ecosystem_reach=float(article.impact.ecosystem_reach),
                        security_severity=float(article.impact.security_severity),
                        developer_impact=float(article.impact.developer_impact),
                        infra_relevance=float(article.impact.infra_relevance),
                        enterprise_relevance=float(article.impact.enterprise_relevance),
                        urgency_score=float(article.impact.urgency_score),
                        novelty=float(article.impact.novelty),
                        ai_ecosystem_importance=float(article.impact.ai_ecosystem_importance),
                        downstream_dependency_risk=float(article.impact.downstream_dependency_risk),
                        impact_score=float(article.impact.impact_score),
                        why_it_matters=article.impact.why_it_matters,
                        affected_roles=article.impact.affected_roles,
                    )
                    self.db.add(impact)
                else:
                    impact.ecosystem_reach = float(article.impact.ecosystem_reach)
                    impact.security_severity = float(article.impact.security_severity)
                    impact.developer_impact = float(article.impact.developer_impact)
                    impact.infra_relevance = float(article.impact.infra_relevance)
                    impact.enterprise_relevance = float(article.impact.enterprise_relevance)
                    impact.urgency_score = float(article.impact.urgency_score)
                    impact.novelty = float(article.impact.novelty)
                    impact.ai_ecosystem_importance = float(article.impact.ai_ecosystem_importance)
                    impact.downstream_dependency_risk = float(article.impact.downstream_dependency_risk)
                    impact.impact_score = float(article.impact.impact_score)
                    impact.why_it_matters = article.impact.why_it_matters
                    impact.affected_roles = article.impact.affected_roles

        await self.db.commit()
        return new_count


class TaxonomyRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def list_categories(self) -> Sequence[Category]:
        return (await self.db.execute(select(Category).order_by(Category.name))).scalars().all()

    async def seed_default_categories(self, categories) -> None:
        """Ensure every canonical category exists even before an article of that
        category has been ingested, so category filters never appear incomplete."""
        changed = False
        for category in categories:
            existing = await self.db.scalar(select(Category).where(Category.slug == category.slug))
            if existing is None:
                self.db.add(
                    Category(
                        id=category.id,
                        name=category.name,
                        slug=category.slug,
                        description=category.description,
                    )
                )
                changed = True
        if changed:
            await self.db.commit()

    async def list_sources(self) -> Sequence[Source]:
        return (await self.db.execute(select(Source).order_by(Source.trust_score.desc()))).scalars().all()


class BookmarkRepository:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def create_if_missing(self, user_id: UUID, article_id: UUID) -> Bookmark:
        existing = await self.db.scalar(
            select(Bookmark).where(Bookmark.user_id == user_id, Bookmark.article_id == article_id)
        )
        if existing:
            return existing
        bookmark = Bookmark(user_id=user_id, article_id=article_id)
        self.db.add(bookmark)
        await self.db.commit()
        await self.db.refresh(bookmark)
        return bookmark

    async def delete(self, user_id: UUID, article_id: UUID) -> None:
        bookmark = await self.db.scalar(
            select(Bookmark).where(Bookmark.user_id == user_id, Bookmark.article_id == article_id)
        )
        if bookmark:
            await self.db.delete(bookmark)
            await self.db.commit()

    async def list_articles_for_user(self, user_id: UUID) -> Sequence[Article]:
        stmt = (
            select(Article)
            .join(Bookmark, Bookmark.article_id == Article.id)
            .where(Bookmark.user_id == user_id)
            .options(
                joinedload(Article.source),
                joinedload(Article.category),
                joinedload(Article.summary),
                joinedload(Article.impact),
            )
            .order_by(desc(Bookmark.created_at))
        )
        return (await self.db.execute(stmt)).scalars().unique().all()
