from fastapi import APIRouter


router = APIRouter(prefix="/bookmarks")


@router.get("")
async def list_bookmarks() -> dict[str, list]:
    return {"items": []}


@router.post("")
async def create_bookmark() -> dict[str, str]:
    return {"status": "queued"}
