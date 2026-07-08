from fastapi import APIRouter, Depends

from app.api.deps import get_news_service
from app.schemas.news import TrendingTopic
from app.services.news import NewsService

router = APIRouter(prefix="/trending")


@router.get("", response_model=list[TrendingTopic])
async def list_trending(service: NewsService = Depends(get_news_service)) -> list[TrendingTopic]:
    return list(await service.list_trending())
