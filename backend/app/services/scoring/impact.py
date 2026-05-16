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
    WEIGHTS = {
        "ecosystem_reach": 0.16,
        "security_severity": 0.18,
        "developer_impact": 0.14,
        "infra_relevance": 0.12,
        "enterprise_relevance": 0.10,
        "urgency": 0.12,
        "novelty": 0.06,
        "ai_ecosystem_importance": 0.06,
        "downstream_dependency_risk": 0.06,
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
