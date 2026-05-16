from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.repositories.news import NewsRepository, TaxonomyRepository
from app.services.news import NewsService, TaxonomyService


def get_news_service(db: AsyncSession = Depends(get_db)) -> NewsService:
    return NewsService(NewsRepository(db))


def get_taxonomy_service(db: AsyncSession = Depends(get_db)) -> TaxonomyService:
    return TaxonomyService(TaxonomyRepository(db))
