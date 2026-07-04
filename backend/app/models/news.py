import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Numeric, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow
    )


class User(TimestampMixin, Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    display_name: Mapped[str] = mapped_column(String(120))
    theme: Mapped[str] = mapped_column(String(20), default="dark")

    bookmarks: Mapped[list["Bookmark"]] = relationship(back_populates="user")


class Source(TimestampMixin, Base):
    __tablename__ = "sources"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(180))
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    source_type: Mapped[str] = mapped_column(String(50))
    homepage_url: Mapped[str | None] = mapped_column(Text())
    feed_url: Mapped[str | None] = mapped_column(Text())
    trust_score: Mapped[float] = mapped_column(Numeric(4, 2), default=5.0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    articles: Mapped[list["Article"]] = relationship(back_populates="source")


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    articles: Mapped[list["Article"]] = relationship(back_populates="category")


class Tag(Base):
    __tablename__ = "tags"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class Article(TimestampMixin, Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sources.id"), index=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), index=True)
    title: Mapped[str] = mapped_column(Text())
    slug: Mapped[str] = mapped_column(String(240), unique=True, index=True)
    canonical_url: Mapped[str] = mapped_column(Text(), unique=True)
    author: Mapped[str | None] = mapped_column(String(180))
    excerpt: Mapped[str | None] = mapped_column(Text())
    content: Mapped[str | None] = mapped_column(Text())
    image_url: Mapped[str | None] = mapped_column(Text())
    discussion_url: Mapped[str | None] = mapped_column(Text())
    normalized_url: Mapped[str] = mapped_column(Text(), index=True)
    dedupe_key: Mapped[str | None] = mapped_column(String(255))
    urgency: Mapped[str] = mapped_column(String(20), default="medium", index=True)
    impact_score: Mapped[float] = mapped_column(Numeric(4, 2), default=0)
    published_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    ingested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict)

    source: Mapped["Source"] = relationship(back_populates="articles")
    category: Mapped["Category | None"] = relationship(back_populates="articles")
    summary: Mapped["Summary | None"] = relationship(back_populates="article", uselist=False)
    impact: Mapped["ImpactScore | None"] = relationship(back_populates="article", uselist=False)
    bookmarks: Mapped[list["Bookmark"]] = relationship(back_populates="article")


class Summary(TimestampMixin, Base):
    __tablename__ = "summaries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("articles.id"), unique=True)
    model_provider: Mapped[str] = mapped_column(String(50))
    model_name: Mapped[str] = mapped_column(String(120))
    what_happened: Mapped[str] = mapped_column(Text())
    why_it_matters: Mapped[str] = mapped_column(Text())
    who_is_affected: Mapped[str] = mapped_column(Text())
    immediate_risks: Mapped[str] = mapped_column(Text())
    long_term_implications: Mapped[str] = mapped_column(Text())

    article: Mapped["Article"] = relationship(back_populates="summary")


class ImpactScore(TimestampMixin, Base):
    __tablename__ = "impact_scores"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("articles.id"), unique=True)
    ecosystem_reach: Mapped[float] = mapped_column(Numeric(4, 2))
    security_severity: Mapped[float] = mapped_column(Numeric(4, 2))
    developer_impact: Mapped[float] = mapped_column(Numeric(4, 2))
    infra_relevance: Mapped[float] = mapped_column(Numeric(4, 2))
    enterprise_relevance: Mapped[float] = mapped_column(Numeric(4, 2))
    urgency_score: Mapped[float] = mapped_column(Numeric(4, 2))
    novelty: Mapped[float] = mapped_column(Numeric(4, 2))
    ai_ecosystem_importance: Mapped[float] = mapped_column(Numeric(4, 2))
    downstream_dependency_risk: Mapped[float] = mapped_column(Numeric(4, 2))
    impact_score: Mapped[float] = mapped_column(Numeric(4, 2), index=True)
    why_it_matters: Mapped[str] = mapped_column(Text())
    affected_roles: Mapped[list[str]] = mapped_column(JSONB, default=list)

    article: Mapped["Article"] = relationship(back_populates="impact")


class Bookmark(Base):
    __tablename__ = "bookmarks"
    __table_args__ = (UniqueConstraint("user_id", "article_id", name="uq_bookmarks_user_article"),)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), primary_key=True)
    article_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("articles.id"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="bookmarks")
    article: Mapped["Article"] = relationship(back_populates="bookmarks")
