# Engineering Intelligence Portal

A production-oriented engineering intelligence news platform focused on high-signal software engineering, AI, infrastructure, cybersecurity, cloud, developer ecosystem, and supply-chain-impact news.

## Screenshots

| Top stories | Article detail |
| --- | --- |
| ![Top stories feed with impact-scored cards and real source imagery](docs/screenshots/home-feed.png) | ![Article detail with real source imagery, impact score, and affected roles](docs/screenshots/article-detail.png) |

| Full summary, impact score & original source link |
| --- |
| ![Article summary sections, impact score panel, and link to the original article](docs/screenshots/article-summary.png) |

*Save your own screenshots into `docs/screenshots/` using the filenames above and they'll render here automatically.*

## Architecture

```mermaid
flowchart LR
    subgraph Sources["External sources"]
        RSS[RSS feeds]
        GH[GitHub API]
        RD[Reddit API]
        HN[Hacker News API]
    end

    subgraph Backend["FastAPI backend"]
        SCHED["APScheduler\n(every N minutes)"]
        PIPE["Ingestion pipeline\nrank -> categorize -> score -> summarize"]
        REPO[Repositories]
        API["REST API\n/news /critical /search /bookmarks /categories"]
        AUTH["JWT auth"]
    end

    DB[(PostgreSQL)]
    FE["React / Vite frontend"]
    USER((Browser))

    RSS --> SCHED
    GH --> SCHED
    RD --> SCHED
    HN --> SCHED
    SCHED --> PIPE
    PIPE -->|upsert articles, categories, scores| REPO
    REPO <--> DB
    API -->|read-only, always fast| REPO
    AUTH --- API
    FE -->|HTTPS REST + JWT| API
    USER --> FE
```

The key property: ingestion is a background loop that never touches a user request. The scheduler wakes up the pipeline on an interval, the pipeline does all the expensive work (fetch, rank, categorize, score, summarize) and writes results to Postgres, and the API only ever reads from that cache — so a page load never waits on a live provider call.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, Framer Motion
- Backend: FastAPI, async SQLAlchemy, PostgreSQL (pgvector-ready)
- Scheduling: APScheduler-driven background ingestion worker, decoupled from the request path
- AI pipeline: modular LLM adapters with Gemma-first prompts and pluggable future model support
- Ingestion: modular provider layer for RSS, GitHub, Reddit, and Hacker News

## Product principle

The homepage should answer one question:

> What must a serious software engineer know today?

## Repo layout

- `backend/` FastAPI API, domain services, repositories, ingestion pipeline, background worker
- `frontend/` Vite React application
- `docs/` architecture, ingestion, prompts, schema, and screenshots

## How ingestion works

Reads never block on live provider calls. A scheduled background job (`app.workers.ingestion_worker.run_ingestion_cycle`, wired up in `app.main`'s FastAPI lifespan) runs on an interval — fetching from all providers, ranking/categorizing each story, computing a multi-factor impact score (content signal, source credibility, recency, and engagement), and upserting the results into Postgres. API requests always read from that cache and return immediately; a manual `POST /ingestion/refresh` is available for on-demand runs.

Impact scoring and category assignment happen once at ingestion time, not per request, so repeated reads are cache hits and every scoring decision is logged for auditability, with a safe non-blank fallback if scoring fails.

## Local development

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000/docs`

Both the backend and frontend dev servers need to be running together — the frontend proxies `/api/v1` and `/health` to the backend (see `frontend/vite.config.ts`), and auth/bookmarks/feed calls will fail without it.

## Environment

Backend reads `.env` through FastAPI settings (see `backend/app/core/config.py` for the full list and defaults):

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tech_news
SECRET_KEY=change-me
PUBLIC_BASE_URL=http://localhost:8000
INGESTION_INTERVAL_MINUTES=7
GITHUB_TOKEN=ghp_xxx
HUGGINGFACE_API_TOKEN=hf_xxx
GEMMA_MODEL_ID=google/gemma-4-31B-it
GEMMA_DEVICE_MAP=auto
GEMMA_MAX_NEW_TOKENS=512
LLM_RELEVANCE_ENABLED=false
HACKER_NEWS_BASE_URL=https://hacker-news.firebaseio.com/v0
HACKER_NEWS_STORY_LIMIT=20
```

`PUBLIC_BASE_URL` must be set to this backend's real public URL in any deployment where the frontend is hosted on a different origin (e.g. Vercel) — it's used to build absolute image URLs for locally-served stock/source images, which otherwise resolve against the frontend's own domain and 404.

`LLM_RELEVANCE_ENABLED` gates an optional LLM-based impact-score refinement on top of the always-on heuristic scorer; it defaults to off since `google/gemma-4-31B-it` is a large model requiring substantial GPU memory. Reddit and RSS providers use public feed/JSON endpoints and need no credentials.

## Key capabilities

- High-signal, categorized feed sorted newest-first, backed by a Postgres cache that's always fast to read
- Scheduled background ingestion across RSS, GitHub, Reddit, and Hacker News — independent of user requests
- Multi-factor impact scoring (content, source trust, recency, engagement) computed and logged at ingestion time, with a safe fallback on failure
- 12 canonical categories (AI, Security, Cloud, OSS, Tooling, Research, Infra, Supply Chain, Mobile, Databases, Web & Frontend, Data Engineering) always seeded and filterable
- Article detail view with full summary, source attribution, and a link to the original article
- Real per-account bookmarks, persisted server-side
- Real per-article source imagery (og:image extraction) with a curated stock-photo fallback, never a repeated generic logo
- Clean Helvetica/Neue-Haas-style typography and a consistent light/dark theme across every page, including login
