import hashlib
from datetime import UTC, datetime
from uuid import UUID, uuid5

from slugify import slugify

from app.schemas.news import (
    ArticleDetail,
    ArticleListItem,
    CategoryRead,
    ImpactScoreRead,
    PaginatedArticles,
    SourceRead,
    SummaryRead,
)
from app.core.config import settings
from app.services.images import generate_story_image_data_uri
from app.services.ingestion.orchestrator import IngestionOrchestrator
from app.services.ingestion.providers import GitHubProvider, HackerNewsProvider, RSSProvider, RedditProvider
from app.services.ranking import EngineeringSignalRanker


NAMESPACE = UUID("11111111-1111-1111-1111-111111111111")

SOURCE_DISPLAY_NAMES = {
    "openai-com": "OpenAI",
    "simonwillison-net": "Simon Willison",
    "huggingface-co": "Hugging Face",
    "www-anthropic-com": "Anthropic",
    "www-latent-space": "Latent Space",
    "blog-cloudflare-com": "Cloudflare",
    "aws-amazon-com": "AWS",
    "netflixtechblog-com": "Netflix Engineering",
    "www-uber-com": "Uber Engineering",
    "vercel-com": "Vercel",
    "react-dev": "React",
    "www-docker-com": "Docker",
    "news-ycombinator-com": "Hacker News",
    "feed-infoq-com": "InfoQ",
    "krebsonsecurity-com": "KrebsOnSecurity",
    "snyk-io": "Snyk",
    "feeds-feedburner-com": "The Hacker News",
    "kubernetes-io": "Kubernetes",
    "fireship": "Fireship",
    "theo-t3-gg": "Theo - t3.gg",
    "theprimeagen": "ThePrimeagen",
    "hitesh-choudhary": "Hitesh Choudhary",
    "freecodecamp-org": "freeCodeCamp",
    "codewithharry": "CodeWithHarry",
    "harkirat-singh": "Harkirat Singh",
    "hacker-news": "Hacker News",
    "github": "GitHub",
}

SOURCE_TRUST = {
    "OpenAI": 9.6,
    "Simon Willison": 9.4,
    "Hugging Face": 9.2,
    "Anthropic": 9.5,
    "Latent Space": 8.7,
    "Cloudflare": 9.1,
    "AWS": 9.0,
    "Netflix Engineering": 9.0,
    "Uber Engineering": 8.8,
    "Vercel": 8.9,
    "React": 9.3,
    "Docker": 8.8,
    "InfoQ": 8.8,
    "KrebsOnSecurity": 9.5,
    "Snyk": 8.9,
    "The Hacker News": 8.6,
    "Kubernetes": 9.0,
    "Fireship": 7.9,
    "Theo - t3.gg": 7.4,
    "ThePrimeagen": 7.3,
    "Hitesh Choudhary": 6.5,
    "freeCodeCamp": 6.8,
    "CodeWithHarry": 6.2,
    "Harkirat Singh": 6.8,
    "Hacker News": 8.1,
    "GitHub": 7.8,
}

LIVE_CATEGORIES: dict[str, CategoryRead] = {
    "AI": CategoryRead(
        id=uuid5(NAMESPACE, "category-ai"),
        name="AI",
        slug="ai",
        description="AI models, agents, inference, and model platform changes.",
    ),
    "Security": CategoryRead(
        id=uuid5(NAMESPACE, "category-security"),
        name="Security",
        slug="security",
        description="Incidents, advisories, CVEs, and supply-chain attacks.",
    ),
    "Cloud": CategoryRead(
        id=uuid5(NAMESPACE, "category-cloud"),
        name="Cloud",
        slug="cloud",
        description="Cloud platform, outages, and infra control plane changes.",
    ),
    "OSS": CategoryRead(
        id=uuid5(NAMESPACE, "category-oss"),
        name="OSS",
        slug="oss",
        description="Open-source releases, maintainership, and ecosystem changes.",
    ),
    "Tooling": CategoryRead(
        id=uuid5(NAMESPACE, "category-tooling"),
        name="Tooling",
        slug="tooling",
        description="Developer tooling, compilers, runtimes, and frameworks.",
    ),
    "Research": CategoryRead(
        id=uuid5(NAMESPACE, "category-research"),
        name="Research",
        slug="research",
        description="Research and system breakthroughs.",
    ),
    "Infra": CategoryRead(
        id=uuid5(NAMESPACE, "category-infra"),
        name="Infra",
        slug="infra",
        description="Infrastructure and platform engineering changes.",
    ),
    "Supply Chain": CategoryRead(
        id=uuid5(NAMESPACE, "category-supply-chain"),
        name="Supply Chain",
        slug="supply-chain",
        description="Package, CI/CD, and dependency ecosystem risk.",
    ),
}


def _source(source_slug: str, source_type: str, canonical_url: str, source_name: str | None = None) -> SourceRead:
    domain = canonical_url.split("/")[2] if "://" in canonical_url else canonical_url
    name = source_name or SOURCE_DISPLAY_NAMES.get(source_slug, source_slug.replace("-", " ").title())
    return SourceRead(
        id=uuid5(NAMESPACE, f"source-{source_slug}-{domain}"),
        name=name,
        slug=source_slug,
        source_type=source_type,
        homepage_url=f"https://{domain}" if domain else None,
        trust_score=SOURCE_TRUST.get(name, 8.2),
    )

def _summary(title: str, excerpt: str, why: str, affected_roles: list[str]) -> SummaryRead:
    return SummaryRead(
        what_happened=excerpt or title,
        why_it_matters=why,
        who_is_affected=", ".join(affected_roles),
        immediate_risks="Operational changes, dependency evaluation, or response work may be required.",
        long_term_implications="This may influence tooling, platform choices, or security posture over the next few cycles.",
    )


def _impact(score: float, why: str, affected_roles: list[str]) -> ImpactScoreRead:
    return ImpactScoreRead(
        impact_score=score,
        ecosystem_reach=score,
        security_severity=score,
        developer_impact=max(score - 0.2, 0),
        infra_relevance=score,
        enterprise_relevance=max(score - 0.4, 0),
        urgency_score=score,
        novelty=max(score - 0.6, 0),
        ai_ecosystem_importance=max(score - 0.3, 0),
        downstream_dependency_risk=score,
        why_it_matters=why,
        affected_roles=affected_roles,
    )


class LiveNewsService:
    def __init__(self) -> None:
        self.ranker = EngineeringSignalRanker()
        self.orchestrator = IngestionOrchestrator(
            [RSSProvider(), HackerNewsProvider(), GitHubProvider(), RedditProvider()]
        )

    async def collect_articles(self) -> list[ArticleDetail]:
        raw_items = await self.orchestrator.collect()
        articles: list[ArticleDetail] = []
        seen_titles: set[str] = set()
        source_type_counts: dict[str, int] = {"rss": 0, "youtube": 0, "hacker-news": 0, "github": 0, "reddit": 0}
        source_type_limits: dict[str, int] = {"rss": 32, "youtube": 8, "hacker-news": 12, "github": 8, "reddit": 5}

        for item in raw_items:
            title = item.get("title", "").strip()
            if not title:
                continue
            title_key = hashlib.sha1(title.lower().encode("utf-8")).hexdigest()
            if title_key in seen_titles:
                continue

            excerpt = item.get("excerpt") or title
            canonical_url = item.get("canonical_url") or f"https://news.ycombinator.com/item?id={item.get('external_id')}"
            source_type = item.get("source_type", item.get("source_slug", "wire"))
            if source_type_counts.get(source_type, 0) >= source_type_limits.get(source_type, 999):
                continue

            source = _source(
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
            story_id = uuid5(NAMESPACE, f"story-{item.get('source_slug')}-{item.get('external_id')}")
            published_at = item.get("published_at") or datetime.now(UTC)

            articles.append(
                ArticleDetail(
                    id=story_id,
                    title=title,
                    slug=slugify(title)[:240],
                    canonical_url=canonical_url,
                    excerpt=excerpt[:500],
                    image_url=item.get("image_url")
                    or generate_story_image_data_uri(title=title, label=category.name),
                    urgency=ranked.urgency,
                    impact_score=max(ranked.impact_score, ranked.relevance_score),
                    published_at=published_at,
                    source=source,
                    category=category,
                    summary=_summary(title, excerpt, ranked.why_this_matters, ranked.affected_engineer_types),
                    ecosystem_tags=ranked.ecosystem_tags,
                    content=item.get("content"),
                    discussion_url=item.get("raw_metadata", {}).get("discussion_url"),
                    impact=_impact(
                        max(ranked.impact_score, ranked.relevance_score),
                        ranked.why_this_matters,
                        ranked.affected_engineer_types,
                    ),
                    related_story_ids=[],
                )
            )

        articles.sort(
            key=lambda article: (article.impact_score, article.source.trust_score, article.published_at),
            reverse=True,
        )
        return articles

    async def related_articles(self, slug: str, limit: int = 4) -> list[ArticleDetail]:
        items = await self.collect_articles()
        current = next((item for item in items if item.slug == slug), None)
        if not current:
            return []
        scored: list[tuple[int, ArticleDetail]] = []
        for item in items:
            if item.slug == slug:
                continue
            score = 0
            if current.category and item.category and current.category.slug == item.category.slug:
                score += 3
            score += len(set(current.ecosystem_tags).intersection(item.ecosystem_tags))
            if current.source.slug == item.source.slug:
                score += 1
            if score > 0:
                scored.append((score, item))
        scored.sort(key=lambda pair: (pair[0], pair[1].impact_score), reverse=True)
        return [item for _, item in scored[:limit]]

    async def paginated_feed(
        self,
        *,
        category: str | None = None,
        urgency: str | None = None,
        query: str | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> PaginatedArticles:
        items = await self.collect_articles()
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
        return PaginatedArticles(
            items=items[start:end],
            total=len(items),
            next_cursor=str(page + 1) if end < len(items) else None,
        )
