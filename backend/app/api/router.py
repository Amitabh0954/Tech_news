from fastapi import APIRouter

from app.api.routes import (
    architecture,
    auth,
    bookmarks,
    categories,
    critical,
    ingestion,
    news,
    search,
    sources,
    stream,
    summaries,
    trending,
)

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(news.router, tags=["news"])
api_router.include_router(categories.router, tags=["categories"])
api_router.include_router(trending.router, tags=["trending"])
api_router.include_router(critical.router, tags=["critical"])
api_router.include_router(search.router, tags=["search"])
api_router.include_router(bookmarks.router, tags=["bookmarks"])
api_router.include_router(sources.router, tags=["sources"])
api_router.include_router(summaries.router, tags=["summaries"])
api_router.include_router(ingestion.router, tags=["ingestion"])
api_router.include_router(architecture.router, tags=["architecture"])
api_router.include_router(stream.router, tags=["stream"])
