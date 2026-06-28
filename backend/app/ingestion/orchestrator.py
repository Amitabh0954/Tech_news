from __future__ import annotations

from collections.abc import Iterable
from typing import Any


class IngestionOrchestrator:
    """Coordinate incoming news collections from providers."""

    def __init__(self, providers: Iterable[Any]) -> None:
        self.providers = list(providers)

    async def collect(self) -> list[dict[str, Any]]:
        items: list[dict[str, Any]] = []
        for provider in self.providers:
            try:
                batch = await provider.fetch_items()
            except Exception:
                batch = []
            items.extend(batch)
        return items
