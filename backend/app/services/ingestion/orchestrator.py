import asyncio
from collections.abc import Iterable

from app.services.ingestion.providers import BaseProvider


class IngestionOrchestrator:
    def __init__(self, providers: Iterable[BaseProvider]) -> None:
        self.providers = list(providers)

    async def collect(self) -> list[dict]:
        async def _collect(provider: BaseProvider) -> list[dict]:
            try:
                return await asyncio.wait_for(provider.fetch_items(), timeout=6.0)
            except Exception:
                return []

        batches = await asyncio.gather(*[_collect(provider) for provider in self.providers])
        items: list[dict] = []
        for batch in batches:
            items.extend(batch)
        return items
