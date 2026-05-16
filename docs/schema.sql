CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    display_name VARCHAR(120) NOT NULL,
    theme VARCHAR(20) NOT NULL DEFAULT 'dark',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    slug VARCHAR(120) UNIQUE NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    homepage_url TEXT,
    feed_url TEXT,
    trust_score NUMERIC(4,2) NOT NULL DEFAULT 5.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY,
    name VARCHAR(80) UNIQUE NOT NULL,
    slug VARCHAR(80) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY,
    source_id UUID NOT NULL REFERENCES sources(id),
    category_id UUID REFERENCES categories(id),
    title TEXT NOT NULL,
    slug VARCHAR(240) UNIQUE NOT NULL,
    canonical_url TEXT UNIQUE NOT NULL,
    author VARCHAR(180),
    excerpt TEXT,
    content TEXT,
    image_url TEXT,
    discussion_url TEXT,
    normalized_url TEXT NOT NULL,
    dedupe_key VARCHAR(255),
    urgency VARCHAR(20) NOT NULL DEFAULT 'medium',
    impact_score NUMERIC(4,2) NOT NULL DEFAULT 0,
    published_at TIMESTAMPTZ NOT NULL,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    embedding vector(768),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS article_tags (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

CREATE TABLE IF NOT EXISTS summaries (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
    model_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(120) NOT NULL,
    what_happened TEXT NOT NULL,
    why_it_matters TEXT NOT NULL,
    who_is_affected TEXT NOT NULL,
    immediate_risks TEXT NOT NULL,
    long_term_implications TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS impact_scores (
    id UUID PRIMARY KEY,
    article_id UUID NOT NULL UNIQUE REFERENCES articles(id) ON DELETE CASCADE,
    ecosystem_reach NUMERIC(4,2) NOT NULL,
    security_severity NUMERIC(4,2) NOT NULL,
    developer_impact NUMERIC(4,2) NOT NULL,
    infra_relevance NUMERIC(4,2) NOT NULL,
    enterprise_relevance NUMERIC(4,2) NOT NULL,
    urgency_score NUMERIC(4,2) NOT NULL,
    novelty NUMERIC(4,2) NOT NULL,
    ai_ecosystem_importance NUMERIC(4,2) NOT NULL,
    downstream_dependency_risk NUMERIC(4,2) NOT NULL,
    impact_score NUMERIC(4,2) NOT NULL,
    why_it_matters TEXT NOT NULL,
    affected_roles JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category_id ON articles (category_id);
CREATE INDEX IF NOT EXISTS idx_articles_impact_score ON articles (impact_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_urgency ON articles (urgency);
CREATE INDEX IF NOT EXISTS idx_articles_normalized_url ON articles (normalized_url);
CREATE INDEX IF NOT EXISTS idx_sources_slug ON sources (slug);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories (slug);
