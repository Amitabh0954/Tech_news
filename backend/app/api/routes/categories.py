from fastapi import APIRouter, Depends

from app.api.deps import get_taxonomy_service
from app.schemas.news import CategoryRead
from app.services.news import TaxonomyService


router = APIRouter(prefix="/categories")


@router.get("", response_model=list[CategoryRead])
async def list_categories(service: TaxonomyService = Depends(get_taxonomy_service)) -> list[CategoryRead]:
    return list(await service.list_categories())
