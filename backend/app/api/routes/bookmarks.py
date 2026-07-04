from uuid import UUID

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.api.routes.auth import get_current_user
from app.models.news import User
from app.repositories.news import BookmarkRepository
from app.schemas.news import ArticleListItem, BookmarkCreate

router = APIRouter(prefix="/bookmarks")


@router.get("", response_model=list[ArticleListItem])
async def list_bookmarks(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ArticleListItem]:
    repository = BookmarkRepository(db)
    return list(await repository.list_articles_for_user(user.id))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_bookmark(
    payload: BookmarkCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    repository = BookmarkRepository(db)
    await repository.create_if_missing(user.id, payload.article_id)
    return {"status": "saved"}


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bookmark(
    article_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    repository = BookmarkRepository(db)
    await repository.delete(user.id, article_id)
