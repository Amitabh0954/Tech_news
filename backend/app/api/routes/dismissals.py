from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.routes.auth import get_current_user
from app.models.news import User
from app.repositories.news import DismissedArticleRepository
from app.schemas.news import DismissalCreate

router = APIRouter(prefix="/dismissals")


@router.get("", response_model=list[UUID])
async def list_dismissals(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[UUID]:
    repository = DismissedArticleRepository(db)
    return list(await repository.list_article_ids_for_user(user.id))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_dismissal(
    payload: DismissalCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    repository = DismissedArticleRepository(db)
    await repository.create_if_missing(user.id, payload.article_id)
    return {"status": "dismissed"}


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dismissal(
    article_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repository = DismissedArticleRepository(db)
    await repository.delete(user.id, article_id)
