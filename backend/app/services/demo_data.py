from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.schemas.news import (
    ArticleDetail,
    ArticleListItem,
    CategoryRead,
    ImpactScoreRead,
    PaginatedArticles,
    SourceRead,
    SummaryRead,
)
from app.services.images import generate_story_image_data_uri


def _source(name: str, slug: str, source_type: str, homepage_url: str, trust_score: float) -> SourceRead:
    return SourceRead(
        id=uuid4(),
        name=name,
        slug=slug,
        source_type=source_type,
        homepage_url=homepage_url,
        trust_score=trust_score,
    )


def _category(name: str, slug: str, description: str) -> CategoryRead:
    return CategoryRead(id=uuid4(), name=name, slug=slug, description=description)


NOW = datetime.now(timezone.utc)

DEMO_SOURCES = [
    _source("GitHub Security Lab", "github-security", "advisory", "https://github.com/security", 9.5),
    _source("OpenAI", "openai", "company_blog", "https://openai.com", 9.4),
    _source("Kubernetes Blog", "kubernetes", "engineering_blog", "https://kubernetes.io/blog", 9.1),
    _source("AWS Health", "aws-health", "status", "https://health.aws.amazon.com", 9.2),
]

DEMO_CATEGORIES = [
    _category("AI", "ai", "AI models, agents, inference, and model platform changes."),
    _category("Security", "security", "Incidents, advisories, CVEs, and supply-chain attacks."),
    _category("Cloud", "cloud", "Platform outages, cloud changes, and infrastructure risk."),
    _category("OSS", "oss", "Open-source ecosystem maintenance and release-impact news."),
    _category("Tooling", "tooling", "Developer tooling, compiler, runtime, and framework updates."),
    _category("Research", "research", "Breakthroughs in systems, inference, and applied ML."),
    _category("Infra", "infra", "Infrastructure and platform engineering changes."),
    _category("Supply Chain", "supply-chain", "Package, CI/CD, and dependency ecosystem risk."),
]


def _summary(what: str, why: str, who: str, risks: str, long_term: str) -> SummaryRead:
    return SummaryRead(
        what_happened=what,
        why_it_matters=why,
        who_is_affected=who,
        immediate_risks=risks,
        long_term_implications=long_term,
    )


def _impact(score: float, why: str, roles: list[str]) -> ImpactScoreRead:
    return ImpactScoreRead(
        impact_score=score,
        ecosystem_reach=score,
        security_severity=min(score + 0.2, 10),
        developer_impact=score - 0.1,
        infra_relevance=score,
        enterprise_relevance=score - 0.3,
        urgency_score=score,
        novelty=score - 0.5,
        ai_ecosystem_importance=score - 0.2,
        downstream_dependency_risk=score,
        why_it_matters=why,
        affected_roles=roles,
    )


DEMO_ARTICLES = [
    ArticleDetail(
        id=uuid4(),
        title="GitHub Actions token exposure incident prompts downstream CI hardening",
        slug="github-actions-token-exposure-incident",
        canonical_url="https://github.com/security",
        excerpt="A CI credential handling incident raises immediate questions for release pipelines and package publishing flows.",
        image_url=generate_story_image_data_uri(
            title="GitHub Actions token exposure incident", label="Security"
        ),
        urgency="critical",
        impact_score=9.6,
        published_at=NOW - timedelta(hours=2),
        source=DEMO_SOURCES[0],
        category=DEMO_CATEGORIES[1],
        summary=_summary(
            "A GitHub Actions-related security incident exposed risky CI token handling patterns used in release automation.",
            "Trusted CI/CD paths sit directly in software supply chains, so compromise can propagate to packages, containers, and artifacts.",
            "Platform engineers, release managers, security teams, and maintainers shipping through GitHub-hosted automation.",
            "Credential replay, malicious release modification, and unreviewed downstream artifact consumption.",
            "More organizations will move toward short-lived credentials, hardened runners, and provenance enforcement.",
        ),
        content=None,
        discussion_url="https://news.ycombinator.com",
        impact=_impact(
            9.6,
            "Trusted CI/CD release infrastructure was exposed, increasing downstream package and artifact risk.",
            ["backend", "devops", "security", "platform"],
        ),
        related_story_ids=[],
    ),
    ArticleDetail(
        id=uuid4(),
        title="OpenAI ships a new reasoning-focused model update with better agent orchestration hooks",
        slug="openai-reasoning-model-agent-update",
        canonical_url="https://openai.com",
        excerpt="The update targets stronger multi-step tool use, structured outputs, and lower orchestration friction.",
        image_url=generate_story_image_data_uri(title="OpenAI reasoning model update", label="AI"),
        urgency="high",
        impact_score=8.9,
        published_at=NOW - timedelta(hours=4),
        source=DEMO_SOURCES[1],
        category=DEMO_CATEGORIES[0],
        summary=_summary(
            "OpenAI announced a model update focused on reasoning depth, tool use reliability, and structured agent workflows.",
            "Agent platforms depend on predictable tool execution and better long-context reasoning to move beyond demos into production.",
            "ML engineers, platform teams, product engineers building copilots, and evaluation owners.",
            "Regression risk in prompts, routing policies, latency budgets, and model-specific tool contracts.",
            "Model orchestration layers will become more strategic than single-model wrappers as teams chase reliability.",
        ),
        content=None,
        discussion_url="https://news.ycombinator.com",
        impact=_impact(
            8.9,
            "Model capability changes can materially alter agent architecture, eval baselines, and inference cost tradeoffs.",
            ["ml", "backend", "platform"],
        ),
        related_story_ids=[],
    ),
    ArticleDetail(
        id=uuid4(),
        title="Kubernetes maintainers publish guidance after high-severity cluster networking CVE",
        slug="kubernetes-cluster-networking-cve-guidance",
        canonical_url="https://kubernetes.io/blog",
        excerpt="The advisory affects common cluster networking assumptions and may require urgent patch windows.",
        image_url=generate_story_image_data_uri(title="Kubernetes cluster networking CVE", label="Infra"),
        urgency="critical",
        impact_score=9.2,
        published_at=NOW - timedelta(hours=6),
        source=DEMO_SOURCES[2],
        category=DEMO_CATEGORIES[1],
        summary=_summary(
            "Kubernetes maintainers disclosed a high-severity networking vulnerability and issued mitigation guidance.",
            "Clusters often underpin production service routing, so networking flaws can become broad availability or isolation problems.",
            "SREs, platform teams, managed Kubernetes operators, and security response teams.",
            "Lateral movement, traffic interception, or urgent maintenance events across shared clusters.",
            "Teams will tighten upgrade cadences and increase emphasis on cluster security posture observability.",
        ),
        content=None,
        discussion_url=None,
        impact=_impact(
            9.2,
            "Cluster networking vulnerabilities can affect multi-tenant isolation and production service reliability.",
            ["devops", "security", "sre", "platform"],
        ),
        related_story_ids=[],
    ),
    ArticleDetail(
        id=uuid4(),
        title="AWS control plane disruption impacts deployment automation in multiple regions",
        slug="aws-control-plane-disruption-deployments",
        canonical_url="https://health.aws.amazon.com",
        excerpt="A control plane disruption degraded deployment and infrastructure automation workflows.",
        image_url=generate_story_image_data_uri(title="AWS control plane disruption", label="Cloud"),
        urgency="high",
        impact_score=8.7,
        published_at=NOW - timedelta(hours=8),
        source=DEMO_SOURCES[3],
        category=DEMO_CATEGORIES[2],
        summary=_summary(
            "An AWS control plane event disrupted parts of deployment, provisioning, and automation activity in several regions.",
            "Infrastructure changes and rollout systems often depend on control plane availability even when workloads remain partially healthy.",
            "Platform teams, cloud infrastructure owners, SREs, and CI/CD operators.",
            "Failed deploys, stalled autoscaling actions, delayed recovery operations, and misleading health assumptions.",
            "Teams will invest more in region-aware automation design and degraded-mode operational playbooks.",
        ),
        content=None,
        discussion_url=None,
        impact=_impact(
            8.7,
            "Control plane outages can block deployment velocity and incident response even before customer traffic fails.",
            ["devops", "sre", "backend", "platform"],
        ),
        related_story_ids=[],
    ),
]


def get_demo_feed() -> PaginatedArticles:
    return PaginatedArticles(items=DEMO_ARTICLES, total=len(DEMO_ARTICLES), next_cursor=None)


def get_demo_article(slug: str) -> ArticleDetail | None:
    for article in DEMO_ARTICLES:
        if article.slug == slug:
            return article
    return None
