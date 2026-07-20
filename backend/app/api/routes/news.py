import logging

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_news_service
from app.core.config import settings
from app.models.news import Summary
from app.repositories.news import NewsRepository
from app.schemas.news import ArticleDetail, PaginatedArticles, SummaryRead
from app.services.llm.providers import GroqProvider
from app.services.news import NewsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/news")


@router.get("", response_model=PaginatedArticles)
async def list_news(
    category: str | None = Query(default=None),
    urgency: str | None = Query(default=None),
    q: str | None = Query(default=None),
    source_type: str | None = Query(default=None),
    days: int | None = Query(default=None, ge=1, le=365),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=50),
    service: NewsService = Depends(get_news_service),
) -> PaginatedArticles:
    return await service.list_news(
        category=category,
        urgency=urgency,
        query=q,
        source_type=source_type,
        days=days,
        page=page,
        page_size=page_size,
    )


@router.get("/{slug}", response_model=ArticleDetail)
async def get_article(slug: str, service: NewsService = Depends(get_news_service)) -> ArticleDetail:
    article = await service.get_article(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("/{slug}/summarize", response_model=SummaryRead)
async def summarize_article(slug: str, db: AsyncSession = Depends(get_db)) -> SummaryRead:
    """Point-wise bullet summary via Groq, generated once and cached on the Summary row.

    Repeat calls for the same article are instant — they just return the already-saved
    key_points instead of calling Groq again.
    """
    repository = NewsRepository(db)
    article = await repository.get_by_slug(slug)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    if article.summary and article.summary.key_points and article.summary.overview:
        return article.summary

    if not settings.groq_api_key:
        raise HTTPException(status_code=503, detail="Summary generation is not configured (missing GROQ_API_KEY).")

    try:
        result = await GroqProvider().summarize(
            {
                "title": article.title,
                "excerpt": article.excerpt or "",
                "content": article.content or "",
                "source": article.source.name,
            }
        )
        key_points = [str(point) for point in result.get("key_points") or []]
        overview = str(result.get("overview") or "").strip()
        if not key_points or not overview:
            raise ValueError("Groq returned no key_points/overview")
    except Exception:
        logger.exception("Groq summarization failed for article '%s'", slug)
        raise HTTPException(status_code=502, detail="Failed to generate summary")

    summary = article.summary
    if summary is None:
        summary = Summary(
            article_id=article.id,
            model_provider="groq",
            model_name=settings.groq_model,
            what_happened=result.get("what_happened") or article.excerpt or article.title,
            why_it_matters=result.get("why_it_matters") or "",
            who_is_affected=result.get("who_is_affected") or "",
            immediate_risks=result.get("immediate_risks") or "",
            long_term_implications=result.get("long_term_implications") or "",
            key_points=key_points,
            overview=overview,
        )
        db.add(summary)
    else:
        summary.key_points = key_points
        summary.overview = overview
        summary.model_provider = "groq"
        summary.model_name = settings.groq_model

    await db.commit()
    await db.refresh(summary)
    return summary
