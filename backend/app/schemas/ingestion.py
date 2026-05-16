from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class IngestedStory(BaseModel):
    external_id: str
    source_slug: str
    title: str
    canonical_url: str
    published_at: datetime | None = None
    author: str | None = None
    content: str | None = None
    excerpt: str | None = None
    tags: list[str] = Field(default_factory=list)
    raw_metadata: dict[str, Any] = Field(default_factory=dict)
