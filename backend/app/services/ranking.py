from dataclasses import dataclass


@dataclass(slots=True)
class RankedSignal:
    relevance_score: float
    impact_score: float
    urgency: str
    affected_engineer_types: list[str]
    why_this_matters: str
    category_name: str
    ecosystem_tags: list[str]
    keep: bool


class EngineeringSignalRanker:
    KEEP_PATTERNS = {
        "production": ["production", "outage", "incident", "latency", "throughput", "scaling", "deployment"],
        "cloud": ["aws", "gcp", "azure", "cloud", "control plane", "kubernetes", "docker", "runtime", "linux"],
        "security": ["cve", "vulnerability", "exploit", "rce", "token", "compromise", "supply chain", "malware"],
        "ecosystem": ["react", "nextjs", "typescript", "javascript", "python", "rust", "golang", "framework", "sdk", "compiler"],
        "ai": ["openai", "anthropic", "deepmind", "gemma", "deepseek", "qwen", "reasoning", "agent", "inference", "model"],
        "oss": ["maintainer", "dependency", "release", "ci/cd", "github actions", "open source", "oss"],
    }

    HIGH_SIGNAL_PATTERNS = {
        "security": {
            "terms": ["cve", "vulnerability", "exploit", "rce", "token", "compromise", "supply chain", "malware"],
            "score": 3.0,
            "urgency": "critical",
            "roles": ["security", "devops", "platform"],
            "why": "Security vulnerabilities and supply-chain issues can create immediate production exposure across downstream systems.",
            "category": "Security",
        },
        "ai": {
            "terms": ["openai", "anthropic", "deepmind", "gemma", "deepseek", "qwen", "reasoning", "agent", "inference", "model release"],
            "score": 2.2,
            "urgency": "high",
            "roles": ["ml", "backend", "platform"],
            "why": "Major AI capability shifts can change application architecture, model routing, cost, and evaluation baselines.",
            "category": "AI",
        },
        "cloud": {
            "terms": ["aws", "gcp", "azure", "outage", "control plane", "kubernetes", "docker", "runtime", "linux", "infra"],
            "score": 2.4,
            "urgency": "high",
            "roles": ["devops", "sre", "platform"],
            "why": "Cloud and infrastructure changes can impact deployment reliability, incident response, and production availability.",
            "category": "Infra",
        },
        "tooling": {
            "terms": ["react", "nextjs", "typescript", "javascript", "python", "rust", "golang", "compiler", "sdk", "framework"],
            "score": 1.6,
            "urgency": "medium",
            "roles": ["frontend", "backend"],
            "why": "Developer tooling changes at ecosystem scale can create migration work, compatibility breakage, and workflow shifts.",
            "category": "Tooling",
        },
        "oss": {
            "terms": ["github", "maintainer", "open source", "oss", "repository", "dependency"],
            "score": 1.5,
            "urgency": "medium",
            "roles": ["backend", "platform"],
            "why": "Open-source ecosystem events can affect dependencies, release pipelines, and platform roadmaps.",
            "category": "OSS",
        },
    }

    DOWNRANK_TERMS = [
        "toy",
        "demo",
        "side project",
        "weekend project",
        "hobby",
        "showoff",
        "startup funding",
        "seed round",
        "launching my",
        "anime",
        "workflow pack",
    ]

    REJECT_PATTERNS = [
        "curious what people think",
        "what do you think",
        "has anyone come across",
        "i was scrolling",
        "i joined",
        "earlier this year i joined",
        "before i joined",
        "philosophical",
        "beginner question",
        "showcase",
        "personal project",
        "my project",
        "my side project",
        "opinion",
        "hot take",
    ]

    BREAKTHROUGH_TERMS = ["breakthrough", "architectural", "benchmark", "production", "scaling", "latency", "throughput"]
    TAG_HINTS = {
        "NODE": ["node", "npm"],
        "REACT": ["react"],
        "NEXTJS": ["nextjs", "vercel"],
        "TYPESCRIPT": ["typescript"],
        "JAVASCRIPT": ["javascript"],
        "PYTHON": ["python", "pypi"],
        "RUST": ["rust", "cargo"],
        "GOLANG": ["golang", "go "],
        "AWS": ["aws"],
        "GCP": ["gcp", "google cloud"],
        "AZURE": ["azure"],
        "CUDA": ["cuda", "nvidia", "gpu"],
        "PYPI": ["pypi"],
        "NPM": ["npm"],
        "KUBERNETES": ["kubernetes", "k8s"],
        "DOCKER": ["docker"],
        "CI/CD": ["github actions", "gitlab ci", "ci/cd", "pipeline"],
        "OPENAI": ["openai"],
        "ANTHROPIC": ["anthropic"],
        "GEMMA": ["gemma"],
        "QWEN": ["qwen"],
        "DEEPSEEK": ["deepseek"],
    }

    def rank(self, title: str, excerpt: str, tags: list[str], source_name: str) -> RankedSignal:
        haystack = f"{title} {excerpt} {' '.join(tags)} {source_name}".lower()

        relevance_score = 0.0
        score = 4.0
        urgency = "medium"
        roles = ["backend"]
        why = "This may matter to engineering teams if it affects real production systems or ecosystem-wide workflows."
        category_name = "Research"
        ecosystem_tags: list[str] = []

        matched_keep_dimensions = 0
        for terms in self.KEEP_PATTERNS.values():
            if any(term in haystack for term in terms):
                matched_keep_dimensions += 1
                relevance_score += 1.8

        if any(term in haystack for term in self.REJECT_PATTERNS):
            relevance_score -= 4.0

        for bucket in self.HIGH_SIGNAL_PATTERNS.values():
            if any(term in haystack for term in bucket["terms"]):
                score += bucket["score"]
                roles = list(dict.fromkeys(roles + bucket["roles"]))
                why = bucket["why"]
                category_name = bucket["category"]
                relevance_score += 1.6
                if bucket["urgency"] == "critical" or (bucket["urgency"] == "high" and urgency != "critical"):
                    urgency = bucket["urgency"]

        if any(term in haystack for term in self.BREAKTHROUGH_TERMS):
            score += 0.8
            relevance_score += 0.8

        if any(term in haystack for term in self.DOWNRANK_TERMS):
            score -= 2.5
            relevance_score -= 1.5

        if "youtube" in source_name.lower():
            score -= 0.4
            relevance_score -= 0.5
        if "reddit" in source_name.lower():
            score -= 0.2
            relevance_score -= 0.3

        if matched_keep_dimensions == 0:
            relevance_score -= 2.5

        if "discussion" in haystack and matched_keep_dimensions < 2:
            relevance_score -= 1.5

        if title.endswith("?"):
            relevance_score -= 1.2

        for tag, terms in self.TAG_HINTS.items():
            if any(term in haystack for term in terms):
                ecosystem_tags.append(tag)

        ecosystem_tags = list(dict.fromkeys(ecosystem_tags))[:6]

        relevance_score = max(0.0, min(10.0, round(relevance_score, 1)))

        score = max(1.0, min(10.0, round(score, 1)))
        keep = relevance_score >= 6.0 and score >= 5.5

        if score >= 9.0:
            urgency = "critical"
        elif score >= 7.5 and urgency != "critical":
            urgency = "high"
        elif score < 5.5:
            urgency = "low"

        if not keep:
            why = "Discarded because it looks like a personal post, discussion thread, demo, or otherwise low-impact item for production engineering."

        return RankedSignal(
            relevance_score=relevance_score,
            impact_score=score,
            urgency=urgency,
            affected_engineer_types=roles,
            why_this_matters=why,
            category_name=category_name,
            ecosystem_tags=ecosystem_tags,
            keep=keep,
        )
