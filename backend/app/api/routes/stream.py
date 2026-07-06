import asyncio

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.services.events import news_events

router = APIRouter(prefix="/stream")

# How often to send a keep-alive comment when there's no real event, so
# intermediary proxies/load balancers don't time out the idle connection.
KEEPALIVE_SECONDS = 15


@router.get("/latest")
async def stream_latest(request: Request) -> StreamingResponse:
    queue = news_events.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=KEEPALIVE_SECONDS)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            news_events.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
