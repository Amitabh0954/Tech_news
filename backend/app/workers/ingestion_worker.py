from app.services.ingestion.orchestrator import IngestionOrchestrator
from app.services.ingestion.providers import GitHubProvider, HackerNewsProvider, RSSProvider, RedditProvider


async def run_ingestion_cycle() -> list[dict]:
    orchestrator = IngestionOrchestrator(
        [RSSProvider(), GitHubProvider(), RedditProvider(), HackerNewsProvider()]
    )
    return await orchestrator.collect()
