from dataclasses import dataclass


@dataclass(slots=True)
class ImpactFactors:
    ecosystem_reach: float
    security_severity: float
    developer_impact: float
    infra_relevance: float
    enterprise_relevance: float
    urgency: float
    novelty: float
    ai_ecosystem_importance: float
    downstream_dependency_risk: float


class ImpactScoringService:
    # Weighted toward the factors that actually distinguish "this is a big deal" (security,
    # urgency, reach) and away from ones that regress everything toward the mean
    # (enterprise_relevance, novelty), so scores spread out instead of clustering around 6-7.
    # Sums to exactly 1.0 — see `score()` for how a per-article dominant category
    # dimension borrows weight from the two lowest-signal factors below.
    WEIGHTS = {
        "ecosystem_reach": 0.15,
        "security_severity": 0.13,
        "developer_impact": 0.11,
        "infra_relevance": 0.10,
        "enterprise_relevance": 0.05,
        "urgency": 0.20,
        "novelty": 0.05,
        "ai_ecosystem_importance": 0.11,
        "downstream_dependency_risk": 0.10,
    }

    # A story's category dimension (security/infra/AI) can be boosted to actually move the
    # final score instead of being diluted by its own small fixed weight. The extra weight
    # is borrowed from enterprise_relevance/novelty — both already near-constant across most
    # stories and previously flagged as the two factors that regress everything toward the
    # mean — so every article's weights still sum to exactly 1.0.
    DOMINANT_DIMENSIONS = frozenset({"security_severity", "infra_relevance", "ai_ecosystem_importance"})
    DONOR_DIMENSIONS = ("enterprise_relevance", "novelty")
    DOMINANT_BOOST = 0.08

    def score(self, factors: ImpactFactors, dominant: str | None = None) -> float:
        weights = dict(self.WEIGHTS)
        if dominant in self.DOMINANT_DIMENSIONS:
            donor_cut = self.DOMINANT_BOOST / len(self.DONOR_DIMENSIONS)
            for donor in self.DONOR_DIMENSIONS:
                weights[donor] -= donor_cut
            weights[dominant] += self.DOMINANT_BOOST

        total = 0.0
        for field, weight in weights.items():
            total += getattr(factors, field) * weight
        return round(total, 2)

    def urgency_band(self, impact_score: float) -> str:
        if impact_score >= 9.0:
            return "critical"
        if impact_score >= 7.0:
            return "high"
        if impact_score >= 5.0:
            return "medium"
        return "low"
