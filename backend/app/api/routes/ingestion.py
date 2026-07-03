from fastapi import APIRouter, Depends, Query

from app.api.deps import get_news_service
from app.schemas.ingestion import IngestedStory
from app.services.news import NewsService
from app.services.ingestion.providers import HackerNewsProvider


router = APIRouter(prefix="/ingestion")


@router.get("/hacker-news", response_model=list[IngestedStory])
async def preview_hacker_news(
    limit: int = Query(default=10, ge=1, le=50),
) -> list[IngestedStory]:
    provider = HackerNewsProvider(story_limit=limit)
    items = await provider.fetch_items()
    return [IngestedStory(**item) for item in items]


@router.post("/refresh")
async def refresh_news_cache(
    service: NewsService = Depends(get_news_service),
) -> dict[str, int | str]:
    await service.refresh_cache()
    latest = await service.repository.latest_ingested_at()
    return {
        "status": "ok",
        "cached_at": latest.isoformat() if latest else "",
    }
