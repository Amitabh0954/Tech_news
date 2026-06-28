from __future__ import annotations

from typing import Any


class RankingService:
    """Prototype service for computing article significance."""

    async def score(self, article: dict[str, Any]) -> dict[str, Any]:
        return {
            "impact_score": 75,
            "urgency": "medium",
            "reason": "placeholder ranking",
            "article_id": article.get("id"),
        }
