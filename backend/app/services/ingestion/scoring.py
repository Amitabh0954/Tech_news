import logging
import math
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid5

from app.schemas.news import CategoryRead, ImpactScoreRead, SourceRead, SummaryRead
from app.services.ranking import RankedSignal
from app.services.scoring.impact import ImpactFactors, ImpactScoringService

logger = logging.getLogger(__name__)

NAMESPACE = UUID("11111111-1111-1111-1111-111111111111")

_impact_scorer = ImpactScoringService()

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
    "Mobile": CategoryRead(
        id=uuid5(NAMESPACE, "category-mobile"),
        name="Mobile",
        slug="mobile",
        description="iOS, Android, and cross-platform mobile development.",
    ),
    "Databases": CategoryRead(
        id=uuid5(NAMESPACE, "category-databases"),
        name="Databases",
        slug="databases",
        description="Database engines, query performance, and data durability.",
    ),
    "Web & Frontend": CategoryRead(
        id=uuid5(NAMESPACE, "category-web-frontend"),
        name="Web & Frontend",
        slug="web-frontend",
        description="Browser platform, rendering, and frontend performance changes.",
    ),
    "Data Engineering": CategoryRead(
        id=uuid5(NAMESPACE, "category-data-engineering"),
        name="Data Engineering",
        slug="data-engineering",
        description="Data pipelines, warehouses, and streaming infrastructure.",
    ),
}


def build_source(source_slug: str, source_type: str, canonical_url: str, source_name: str | None = None) -> SourceRead:
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


def build_summary(title: str, excerpt: str, why: str, affected_roles: list[str]) -> SummaryRead:
    return SummaryRead(
        what_happened=excerpt or title,
        why_it_matters=why,
        who_is_affected=", ".join(affected_roles),
        immediate_risks="Operational changes, dependency evaluation, or response work may be required.",
        long_term_implications="This may influence tooling, platform choices, or security posture over the next few cycles.",
    )


def _recency_score(published_at: datetime | None) -> float:
    """10.0 for brand-new stories, decaying to 1.0 by ~72 hours old."""
    if published_at is None:
        return 4.0
    if published_at.tzinfo is None:
        published_at = published_at.replace(tzinfo=UTC)
    hours_old = max((datetime.now(UTC) - published_at).total_seconds() / 3600, 0)
    return max(1.0, round(10.0 - min(hours_old, 72.0) / 72.0 * 9.0, 2))


def _engagement_score(raw_metadata: dict[str, Any]) -> float:
    """Log-scaled engagement signal from whatever the provider captured (HN points/comments, Reddit score, GitHub stars)."""
    raw_metadata = raw_metadata or {}
    points = raw_metadata.get("hn_score") or raw_metadata.get("score") or raw_metadata.get("stars") or 0
    comments = raw_metadata.get("hn_descendants") or raw_metadata.get("num_comments") or raw_metadata.get("watchers") or 0
    try:
        magnitude = math.log10(max(float(points), 0) + max(float(comments), 0) * 2 + 1)
    except (TypeError, ValueError):
        return 4.0
    if magnitude <= 0:
        return 4.0
    return max(1.0, min(10.0, round(magnitude * 3.2, 2)))


def urgency_band(impact_score: float) -> str:
    return _impact_scorer.urgency_band(impact_score)


def _fallback_impact(ranked: RankedSignal) -> ImpactScoreRead:
    fallback = max(ranked.impact_score, ranked.relevance_score, 1.0)
    return ImpactScoreRead(
        impact_score=fallback,
        ecosystem_reach=fallback,
        security_severity=fallback,
        developer_impact=fallback,
        infra_relevance=fallback,
        enterprise_relevance=fallback,
        urgency_score=fallback,
        novelty=fallback,
        ai_ecosystem_importance=fallback,
        downstream_dependency_risk=fallback,
        why_it_matters=ranked.why_this_matters,
        affected_roles=ranked.affected_engineer_types,
    )


def score_article_impact(
    *,
    ranked: RankedSignal,
    source: SourceRead,
    published_at: datetime | None,
    raw_metadata: dict[str, Any],
) -> ImpactScoreRead:
    """Multi-factor impact score: category/content signal (ranked), source credibility, recency, and engagement.

    Never raises — on any internal failure it logs and returns a non-blank fallback derived
    from the (already content-derived) ranking heuristic so a scoring bug never drops a story
    to a zero/blank score.
    """
    try:
        recency = _recency_score(published_at)
        engagement = _engagement_score(raw_metadata)
        is_security = ranked.category_name in {"Security", "Supply Chain"}
        is_infra = ranked.category_name in {"Infra", "Cloud"}
        is_ai = ranked.category_name == "AI"

        # Off-category factors get a low baseline rather than a fraction of the same
        # ranked.impact_score — fractional scaling makes every factor track one number,
        # which regresses the final weighted score toward the mean regardless of how
        # different two stories actually are. A sharp on/off contrast here is what lets
        # a genuine security incident land near 9-10 while a routine tooling post lands
        # near 4-5, instead of everything clustering in the 6-7 band.
        factors = ImpactFactors(
            ecosystem_reach=max(ranked.relevance_score, engagement),
            security_severity=ranked.impact_score if is_security else 2.0,
            developer_impact=min(10.0, round(ranked.impact_score * 0.9 + len(ranked.affected_engineer_types) * 0.3, 2)),
            infra_relevance=ranked.impact_score if is_infra else 2.5,
            enterprise_relevance=round(source.trust_score * 0.7 + ranked.impact_score * 0.3, 2),
            urgency={"critical": 10.0, "high": 7.5, "medium": 5.0, "low": 2.0}[ranked.urgency],
            novelty=recency,
            ai_ecosystem_importance=ranked.impact_score if is_ai else 1.5,
            downstream_dependency_risk=ranked.impact_score if is_security else 2.0,
        )
        impact_score = _impact_scorer.score(factors)

        logger.info(
            "impact_score computed: score=%.2f category=%s urgency=%s recency=%.2f engagement=%.2f source_trust=%.1f",
            impact_score,
            ranked.category_name,
            ranked.urgency,
            recency,
            engagement,
            source.trust_score,
        )

        return ImpactScoreRead(
            impact_score=impact_score,
            ecosystem_reach=factors.ecosystem_reach,
            security_severity=factors.security_severity,
            developer_impact=factors.developer_impact,
            infra_relevance=factors.infra_relevance,
            enterprise_relevance=factors.enterprise_relevance,
            urgency_score=factors.urgency,
            novelty=factors.novelty,
            ai_ecosystem_importance=factors.ai_ecosystem_importance,
            downstream_dependency_risk=factors.downstream_dependency_risk,
            why_it_matters=ranked.why_this_matters,
            affected_roles=ranked.affected_engineer_types,
        )
    except Exception:
        logger.exception("impact scoring failed for a story, using heuristic fallback score instead of blank/zero")
        return _fallback_impact(ranked)


async def maybe_apply_llm_scoring(item: dict[str, Any], heuristic: ImpactScoreRead) -> ImpactScoreRead:
    """Optional LLM-based refinement of the heuristic impact score, gated by settings.llm_relevance_enabled.

    Always falls back to the already-computed heuristic score on any failure (bad output,
    model unavailable, timeout, etc.) and logs why, so a broken model call never blanks a score.
    """
    try:
        from app.services.llm.providers import TransformersGemmaProvider

        provider = TransformersGemmaProvider()
        result = await provider.score_impact(
            {
                "title": item.get("title", ""),
                "excerpt": item.get("excerpt", ""),
                "content": item.get("content", ""),
            }
        )
        llm_score = float(result.get("impact_score"))
        if not (0 <= llm_score <= 10):
            raise ValueError(f"LLM returned out-of-range impact_score: {llm_score}")

        logger.info("llm impact scoring succeeded: %.2f (heuristic was %.2f)", llm_score, heuristic.impact_score)
        return heuristic.model_copy(
            update={
                "impact_score": llm_score,
                "why_it_matters": result.get("why_it_matters") or heuristic.why_it_matters,
            }
        )
    except Exception:
        logger.exception("LLM impact scoring failed, keeping heuristic score %.2f", heuristic.impact_score)
        return heuristic
