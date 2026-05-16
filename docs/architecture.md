# Architecture Plan

## Product shape

The portal is designed as an engineering intelligence system, not a general news site. The system is optimized for:

- signal over noise
- engineering relevance
- incident awareness
- ecosystem risk visibility
- actionable AI-assisted summaries

## System architecture

### Frontend

- React + Vite + TypeScript SPA
- TanStack Query for server state
- Zustand for local UI and personalization state
- TailwindCSS and composable UI primitives inspired by shadcn/ui
- Framer Motion for restrained motion and feed transitions

### Backend

- FastAPI with async-first route handlers
- SQLAlchemy async ORM and repository layer
- service layer for news, search, ingestion, scoring, summaries
- worker entrypoints for ingestion and enrichment jobs
- adapter-based LLM and provider abstractions

### Data flow

1. Providers ingest articles from trusted engineering-relevant sources.
2. Deduplication service clusters duplicates by normalized URL, title similarity, and embeddings.
3. Classification service assigns categories and tags.
4. Impact scoring service computes urgency and engineering relevance.
5. Summarization service generates structured engineer-focused summaries.
6. API serves ranked and filterable feeds.

## Frontend architecture

### Route structure

- `/` homepage
- `/article/:slug`
- `/search`
- `/bookmarks`
- `/critical`
- `/login`

### Homepage sections

1. Critical Alerts
2. Top Engineering Stories
3. AI & Agents
4. Security & Supply Chain
5. Cloud & Infrastructure
6. Open Source Ecosystem
7. Developer Tooling
8. Research & Breakthroughs
9. Trending Engineering Discussions

### Component hierarchy

- `AppShell`
- `TopHeader`
- `StickySidebar`
- `Homepage`
- `CriticalAlertStrip`
- `NewsSection`
- `StoryCard`
- `ImpactBadge`
- `TagPill`
- `TrendingPanel`
- `ArticleDetail`
- `RelatedStories`

## Backend architecture

### API modules

- `auth`
- `news`
- `categories`
- `trending`
- `critical`
- `search`
- `bookmarks`
- `sources`
- `summaries`

### Core services

- `NewsService`
- `SearchService`
- `BookmarkService`
- `IngestionOrchestrator`
- `DeduplicationService`
- `CategorizationService`
- `ImpactScoringService`
- `SummarizationService`

### Provider modules

- RSS provider
- GitHub provider
- Reddit provider
- Hacker News provider
- Security advisory provider
- Engineering blog provider
- AI announcements provider

## MCP integration strategy

MCP is used as a provider abstraction boundary rather than hardwiring every upstream source into the API layer.

- Each provider implements a shared `BaseProvider` contract.
- MCP clients fetch from external feeds or tools and return normalized provider payloads.
- New providers can be registered without changing orchestration logic.
- Future internal MCP servers can expose dependency graph data, semantic search, or alert workflows.

## Scaling path

- Move ingestion from API process into dedicated workers
- Add Redis for cache and job queue coordination
- Add Meilisearch or Typesense for search
- Add pgvector or external vector store for embeddings
- Add Neo4j for dependency impact and ecosystem graph traversal
