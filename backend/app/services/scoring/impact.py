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
    WEIGHTS = {
        "ecosystem_reach": 0.17,
        "security_severity": 0.20,
        "developer_impact": 0.12,
        "infra_relevance": 0.12,
        "enterprise_relevance": 0.05,
        "urgency": 0.16,
        "novelty": 0.03,
        "ai_ecosystem_importance": 0.08,
        "downstream_dependency_risk": 0.07,
    }

    def score(self, factors: ImpactFactors) -> float:
        total = 0.0
        for field, weight in self.WEIGHTS.items():
            total += getattr(factors, field) * weight
        return round(total, 2)

    def urgency_band(self, impact_score: float) -> str:
        if impact_score >= 9.0:
            return "critical"
        if impact_score >= 7.5:
            return "high"
        if impact_score >= 5.0:
            return "medium"
        return "low"
