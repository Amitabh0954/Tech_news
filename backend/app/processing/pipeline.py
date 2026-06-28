from __future__ import annotations

from typing import Any


class ProcessingPipeline:
    """Thin orchestration layer around enrichment services."""

    async def run(self, article: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": article.get("id"),
            "title": article.get("title"),
            "category": "AI",
            "score": 70,
            "status": "queued",
        }
