from __future__ import annotations

from typing import Any


class TrendService:
    """Prototype service for deriving topic momentum and trends."""

    async def detect(self, articles: list[dict[str, Any]]) -> list[dict[str, Any]]:
        return [
            {"topic": "AI infrastructure", "mentions": len(articles), "momentum": 8.5}
        ]
