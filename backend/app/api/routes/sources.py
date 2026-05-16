from fastapi import APIRouter, Depends

from app.api.deps import get_taxonomy_service
from app.schemas.news import SourceRead
from app.services.news import TaxonomyService


router = APIRouter(prefix="/sources")


@router.get("", response_model=list[SourceRead])
async def list_sources(service: TaxonomyService = Depends(get_taxonomy_service)) -> list[SourceRead]:
    return list(await service.list_sources())
