from fastapi import APIRouter

router = APIRouter(prefix="/architecture", tags=["architecture"])


@router.get("/health")
async def architecture_health() -> dict[str, str]:
    return {"status": "ok", "layer": "architecture-skeleton"}
