from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import APIModel


class SourceRead(APIModel):
    id: UUID
    name: str
    slug: str
    source_type: str
    homepage_url: str | None = None
    trust_score: float


class CategoryRead(APIModel):
    id: UUID
    name: str
    slug: str
    description: str | None = None


class SummaryRead(APIModel):
    what_happened: str
    why_it_matters: str
    who_is_affected: str
    immediate_risks: str
    long_term_implications: str
    key_points: list[str] | None = None
    overview: str | None = None


class ImpactScoreRead(APIModel):
    impact_score: float
    ecosystem_reach: float
    security_severity: float
    developer_impact: float
    infra_relevance: float
    enterprise_relevance: float
    urgency_score: float
    novelty: float
    ai_ecosystem_importance: float
    downstream_dependency_risk: float
    why_it_matters: str
    affected_roles: list[str]


class ArticleListItem(APIModel):
    id: UUID
    title: str
    slug: str
    canonical_url: str
    excerpt: str | None = None
    image_url: str | None = None
    urgency: str
    impact_score: float
    published_at: datetime
    source: SourceRead
    category: CategoryRead | None = None
    summary: SummaryRead | None = None
    ecosystem_tags: list[str] = Field(default_factory=list)


class ArticleDetail(ArticleListItem):
    content: str | None = None
    discussion_url: str | None = None
    impact: ImpactScoreRead | None = None
    related_story_ids: list[UUID] = Field(default_factory=list)


class ArticleSuggestion(APIModel):
    id: UUID
    title: str
    slug: str
    category: CategoryRead | None = None
    urgency: str


class PaginatedArticles(BaseModel):
    items: list[ArticleListItem]
    next_cursor: str | None = None
    total: int


class TrendingTopic(BaseModel):
    topic: str
    mentions: int
    momentum: float


class BookmarkCreate(BaseModel):
    article_id: UUID


class DismissalCreate(BaseModel):
    article_id: UUID
