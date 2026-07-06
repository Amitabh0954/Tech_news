from fastapi import APIRouter, Depends, Query

from app.api.deps import get_news_service
from app.schemas.news import ArticleSuggestion, PaginatedArticles
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


@router.get("/suggestions", response_model=list[ArticleSuggestion])
async def search_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(default=6, ge=1, le=10),
    service: NewsService = Depends(get_news_service),
) -> list[ArticleSuggestion]:
    return await service.suggest(q, limit=limit)
