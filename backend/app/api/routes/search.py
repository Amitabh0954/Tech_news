from fastapi import APIRouter, Depends, Query

from app.api.deps import get_news_service
from app.schemas.news import PaginatedArticles
from app.services.news import NewsService


router = APIRouter(prefix="/search")


@router.get("", response_model=PaginatedArticles)
async def search_news(
    q: str = Query(..., min_length=2),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    service: NewsService = Depends(get_news_service),
) -> PaginatedArticles:
    return await service.list_news(query=q, page=page, page_size=page_size)
