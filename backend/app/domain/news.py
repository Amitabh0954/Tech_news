from __future__ import annotations

from dataclasses import dataclass
from typing import Any


@dataclass(slots=True)
class NewsArticle:
    id: str
    title: str
    excerpt: str | None = None
    source: str | None = None
    metadata: dict[str, Any] | None = None
