from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.deps import get_news_service
from app.schemas.news import ArticleDetail, PaginatedArticles
from app.services.news import NewsService


router = APIRouter(prefix="/news")


@router.get("", response_model=PaginatedArticles)
async def list_news(
    category: str | None = Query(default=None),
    urgency: str | None = Query(default=None),
    q: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    service: NewsService = Depends(get_news_service),
) -> PaginatedArticles:
    return await service.list_news(
        category=category,
        urgency=urgency,
        query=q,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ArticleDetail)
async def get_article(slug: str, service: NewsService = Depends(get_news_service)) -> ArticleDetail:
    article = await service.get_article(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article
