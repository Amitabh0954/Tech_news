from fastapi import APIRouter, Query

from app.schemas.ingestion import IngestedStory
from app.services.ingestion.providers import HackerNewsProvider


router = APIRouter(prefix="/ingestion")


@router.get("/hacker-news", response_model=list[IngestedStory])
async def preview_hacker_news(
    limit: int = Query(default=10, ge=1, le=50),
) -> list[IngestedStory]:
    provider = HackerNewsProvider(story_limit=limit)
    items = await provider.fetch_items()
    return [IngestedStory(**item) for item in items]
