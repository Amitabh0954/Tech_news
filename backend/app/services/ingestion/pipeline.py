import hashlib
import logging
from datetime import UTC, datetime
from uuid import uuid5

from slugify import slugify

from app.core.config import settings
from app.schemas.news import ArticleDetail
from app.services.images import generate_story_image_data_uri, select_local_story_image
from app.services.ingestion.orchestrator import IngestionOrchestrator
from app.services.ingestion.providers import GitHubProvider, HackerNewsProvider, RedditProvider, RSSProvider
from app.services.ingestion.scoring import (
    LIVE_CATEGORIES,
    NAMESPACE,
    build_source,
    build_summary,
    maybe_apply_llm_scoring,
    score_article_impact,
    urgency_band,
)
from app.services.ranking import EngineeringSignalRanker

logger = logging.getLogger(__name__)

SOURCE_TYPE_LIMITS: dict[str, int] = {"rss": 32, "youtube": 8, "hacker-news": 12, "github": 8, "reddit": 5}


class IngestionPipeline:
    """Fetch raw items from all providers, then rank/categorize/score/summarize each one.

    This is the single place category and impact-score are computed. It is meant to run
    only from the scheduled background worker (or an explicit manual refresh), never inline
    inside a user-facing read request — results are persisted so reads are cache hits.
    """

    def __init__(self) -> None:
        self.ranker = EngineeringSignalRanker()
        self.orchestrator = IngestionOrchestrator(
            [RSSProvider(), HackerNewsProvider(), GitHubProvider(), RedditProvider()]
        )

    async def run(self) -> list[ArticleDetail]:
        raw_items = await self.orchestrator.collect()
        logger.info("ingestion pipeline fetched %d raw items from providers", len(raw_items))

        articles: list[ArticleDetail] = []
        seen_titles: set[str] = set()
        source_type_counts: dict[str, int] = {}

        for item in raw_items:
            title = (item.get("title") or "").strip()
            if not title:
                continue

            title_key = hashlib.sha1(title.lower().encode("utf-8")).hexdigest()
            if title_key in seen_titles:
                continue

            source_type = item.get("source_type", item.get("source_slug", "wire"))
            limit = SOURCE_TYPE_LIMITS.get(source_type, 999)
            if source_type_counts.get(source_type, 0) >= limit:
                continue

            excerpt = item.get("excerpt") or title
            canonical_url = (
                item.get("canonical_url") or f"https://news.ycombinator.com/item?id={item.get('external_id')}"
            )
            source = build_source(
                item.get("source_slug", "wire"),
                source_type,
                canonical_url,
                item.get("source_name"),
            )

            ranked = self.ranker.rank(title, excerpt, item.get("tags", []), source.name)
            if not ranked.keep:
                continue

            seen_titles.add(title_key)
            source_type_counts[source_type] = source_type_counts.get(source_type, 0) + 1

            category = LIVE_CATEGORIES.get(ranked.category_name, LIVE_CATEGORIES["Research"])
            published_at = item.get("published_at") or datetime.now(UTC)
            raw_metadata = item.get("raw_metadata") or {}

            impact = score_article_impact(
                ranked=ranked,
                source=source,
                published_at=published_at,
                raw_metadata=raw_metadata,
            )
            if settings.llm_relevance_enabled:
                impact = await maybe_apply_llm_scoring(item, impact)

            # Real per-article image (RSS og:image, GitHub avatar, Reddit thumbnail) wins if we
            # have one. Otherwise prefer a curated local stock/company photo over a generated
            # abstract placeholder, so the news page actually uses the real image assets.
            selected_image = (
                item.get("image_url")
                or select_local_story_image(
                    title=title,
                    excerpt=excerpt,
                    source_name=source.name,
                    category_name=category.name,
                )
                or generate_story_image_data_uri(title=title, label=category.name)
            )

            articles.append(
                ArticleDetail(
                    id=uuid5(NAMESPACE, f"story-{item.get('source_slug')}-{item.get('external_id')}"),
                    title=title,
                    slug=slugify(title)[:240],
                    canonical_url=canonical_url,
                    excerpt=excerpt[:500],
                    image_url=selected_image,
                    urgency=urgency_band(impact.impact_score),
                    impact_score=impact.impact_score,
                    published_at=published_at,
                    source=source,
                    category=category,
                    summary=build_summary(title, excerpt, ranked.why_this_matters, ranked.affected_engineer_types),
                    ecosystem_tags=ranked.ecosystem_tags,
                    content=item.get("content"),
                    discussion_url=raw_metadata.get("discussion_url"),
                    impact=impact,
                    related_story_ids=[],
                )
            )

        articles.sort(key=lambda article: article.published_at, reverse=True)
        logger.info("ingestion pipeline kept %d/%d items after ranking/dedupe", len(articles), len(raw_items))
        return articles
