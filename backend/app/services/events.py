import asyncio
import json
from typing import Any


class EventBroadcaster:
    """In-process pub/sub for pushing server events to connected SSE clients.

    Single-process only (no Redis/pg-notify backing) — fine for this app's current
    deployment shape of one backend instance. If that ever changes, subscribers would
    need to move to a shared channel instead of per-process asyncio.Queue objects.
    """

    def __init__(self) -> None:
        self._subscribers: set[asyncio.Queue[str]] = set()

    def subscribe(self) -> asyncio.Queue[str]:
        queue: asyncio.Queue[str] = asyncio.Queue(maxsize=32)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue[str]) -> None:
        self._subscribers.discard(queue)

    def publish(self, event: dict[str, Any]) -> None:
        payload = json.dumps(event)
        for queue in list(self._subscribers):
            try:
                queue.put_nowait(payload)
            except asyncio.QueueFull:
                # A stalled/slow client shouldn't back-pressure ingestion; drop the
                # event for that one subscriber rather than block publish().
                pass


news_events = EventBroadcaster()
