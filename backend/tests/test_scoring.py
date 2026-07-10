from datetime import UTC, datetime, timedelta

from app.services.ingestion.scoring import build_source, score_article_impact, urgency_band
from app.services.ranking import EngineeringSignalRanker
from app.services.scoring.impact import ImpactFactors, ImpactScoringService

ranker = EngineeringSignalRanker()


def test_rank_flags_security_cve_as_critical_and_keeps_it():
    # Keep this excerpt free of other buckets' keywords (e.g. "dependency" would also
    # match the OSS bucket) — category assignment is last-match-wins across the
    # bucket iteration order, so an accidental second match would flip the category.
    ranked = ranker.rank(
        title="Critical RCE vulnerability discovered in production authentication library",
        excerpt="A CVE was disclosed enabling remote exploit and token compromise for affected systems.",
        tags=["cve"],
        source_name="The Hacker News",
    )

    assert ranked.keep is True
    assert ranked.category_name == "Security"
    assert ranked.urgency == "critical"
    assert "security" in ranked.affected_engineer_types


def test_rank_discards_personal_project_showcase():
    ranked = ranker.rank(
        title="I built my own side project this weekend, what do you think?",
        excerpt="Just showcasing my hobby project, curious what people think about it.",
        tags=[],
        source_name="Reddit",
    )

    assert ranked.keep is False
    assert ranked.relevance_score < 6.0


def test_rank_is_deterministic_for_identical_input():
    kwargs = dict(
        title="Kubernetes 1.31 released with new scheduler improvements",
        excerpt="The Kubernetes project shipped a new control plane release.",
        tags=["kubernetes", "docker"],
        source_name="Kubernetes Blog",
    )

    first = ranker.rank(**kwargs)
    second = ranker.rank(**kwargs)

    assert first == second


def test_ecosystem_tags_are_deduplicated_and_capped():
    ranked = ranker.rank(
        title="Postgres, Postgres, Postgres: pgvector meets Kubernetes and Docker",
        excerpt="postgres postgres postgres kubernetes docker aws gcp azure react typescript javascript python",
        tags=[],
        source_name="Engineering Blog",
    )

    assert len(ranked.ecosystem_tags) <= 6
    assert len(ranked.ecosystem_tags) == len(set(ranked.ecosystem_tags))


def test_impact_scoring_service_weights_sum_to_one():
    assert abs(sum(ImpactScoringService.WEIGHTS.values()) - 1.0) < 1e-9


def test_impact_scoring_service_score_is_weighted_average():
    scorer = ImpactScoringService()
    factors = ImpactFactors(
        ecosystem_reach=10.0,
        security_severity=10.0,
        developer_impact=10.0,
        infra_relevance=10.0,
        enterprise_relevance=10.0,
        urgency=10.0,
        novelty=10.0,
        ai_ecosystem_importance=10.0,
        downstream_dependency_risk=10.0,
    )

    assert scorer.score(factors) == 10.0


def test_urgency_band_thresholds():
    scorer = ImpactScoringService()
    assert scorer.urgency_band(9.5) == "critical"
    assert scorer.urgency_band(8.0) == "high"
    assert scorer.urgency_band(6.0) == "medium"
    assert scorer.urgency_band(2.0) == "low"


def test_score_article_impact_never_raises_and_stays_in_range():
    ranked = ranker.rank(
        title="Major cloud outage takes down production workloads",
        excerpt="AWS control plane incident affecting multiple regions.",
        tags=["aws", "outage"],
        source_name="AWS Blog",
    )
    source = build_source("aws-blog", "rss", "https://aws.amazon.com/blogs/aws/some-post")

    result = score_article_impact(
        ranked=ranked,
        source=source,
        published_at=datetime.now(UTC) - timedelta(hours=1),
        raw_metadata={"hn_score": 250, "hn_descendants": 80},
    )

    assert 0.0 <= result.impact_score <= 10.0
    assert result.affected_roles == ranked.affected_engineer_types


def test_score_article_impact_falls_back_on_malformed_metadata():
    ranked = ranker.rank(
        title="Routine developer tooling update",
        excerpt="A minor release of a TypeScript tool.",
        tags=["typescript"],
        source_name="Dev Blog",
    )
    source = build_source("dev-blog", "rss", "https://example.com/post")

    # raw_metadata with non-numeric values should never crash scoring — it should
    # fall back to a safe non-blank score instead of raising.
    result = score_article_impact(
        ranked=ranked,
        source=source,
        published_at=None,
        raw_metadata={"hn_score": "not-a-number"},
    )

    assert result.impact_score > 0


def test_urgency_band_helper_matches_scoring_service():
    assert urgency_band(9.2) == "critical"
    assert urgency_band(4.0) == "low"
