from fastapi import APIRouter, Depends

from app.api.deps import get_news_service
from app.schemas.news import ArticleListItem
from app.services.news import NewsService

router = APIRouter(prefix="/critical")


@router.get("", response_model=list[ArticleListItem])
async def list_critical(service: NewsService = Depends(get_news_service)) -> list[ArticleListItem]:
    return list(await service.list_critical())
