# Engineering Intelligence Portal

A production-oriented engineering intelligence news platform focused on high-signal software engineering, AI, infrastructure, cybersecurity, cloud, developer ecosystem, and supply-chain-impact news.

## Screenshots

| Top stories | Article detail |
| --- | --- |
| ![Top stories feed with impact-scored cards](docs/screenshots/home-feed.png) | ![Article hero with real source imagery](docs/screenshots/article-detail.png) |

| Summary, impact score & suggested stories | Live feed, saved & source actions |
| --- | --- |
| ![Article summary, impact score, and affected roles](docs/screenshots/article-summary.png) | ![Suggested stories with save and source links](docs/screenshots/suggested-stories.png) |

*Save your own screenshots into `docs/screenshots/` using the filenames above and they'll render here automatically.*

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

## Environment

Backend reads `.env` through FastAPI settings (see `backend/app/core/config.py` for the full list and defaults):

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/tech_news
SECRET_KEY=change-me
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

`LLM_RELEVANCE_ENABLED` gates an optional LLM-based impact-score refinement on top of the always-on heuristic scorer; it defaults to off since `google/gemma-4-31B-it` is a large model requiring substantial GPU memory. Reddit and RSS providers use public feed/JSON endpoints and need no credentials.

## Key capabilities

- High-signal, categorized feed sorted newest-first, backed by a Postgres cache that's always fast to read
- Scheduled background ingestion across RSS, GitHub, Reddit, and Hacker News — independent of user requests
- Multi-factor impact scoring (content, source trust, recency, engagement) computed and logged at ingestion time, with a safe fallback on failure
- All canonical categories (AI, Security, Cloud, OSS, Tooling, Research, Infra, Supply Chain) always seeded and filterable
- Article detail view with full summary, source attribution, and a link to the original article
- Real per-account bookmarks, persisted server-side
- Curated stock/source imagery selection with a generated-placeholder fallback of last resort
- Clean Helvetica/Neue-Haas-style typography and a consistent light/dark theme across every page, including login
