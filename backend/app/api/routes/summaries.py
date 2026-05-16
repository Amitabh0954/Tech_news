from fastapi import APIRouter


router = APIRouter(prefix="/summaries")


@router.get("/{article_id}")
async def get_summary(article_id: str) -> dict[str, str]:
    return {"article_id": article_id, "status": "not_implemented"}
