# Engineering Intelligence Portal

![EngIntel — Engineering Wire](docs/assets/logo-banner.png)

A news feed for people who write software, not a general-purpose news site with a "tech" tag. It watches RSS feeds, GitHub, Reddit, Hacker News, arXiv, and Hugging Face, scores everything for how much it actually matters to an engineer, and gets out of the way otherwise.

## Screenshots

| Home feed | Card grid |
| --- | --- |
| ![Home feed with critical alerts strip and front-page lead story](docs/screenshots/home-feed.png) | ![Card grid of impact-scored stories with real source imagery](docs/screenshots/news-grid.png) |

| Article detail | Papers |
| --- | --- |
| ![Article detail with AI summary, key points, and original source link](docs/screenshots/article-detail.png) | ![Papers view listing recent arXiv and Hugging Face research](docs/screenshots/papers.png) |

## Why it's built this way

The one rule that shapes most of the backend: nothing a user does should ever wait on a live fetch from GitHub, Reddit, or an RSS feed. Ingestion runs on its own schedule in the background, writes everything it finds to Postgres, and every API request just reads from that table. That's it — no request handler ever calls out to an external provider. It's also why a fresh install shows demo data for a few minutes: the first ingestion cycle hasn't landed yet, and rather than show an empty page or block on it, the API quietly serves a static fallback until real rows show up.

## Architecture

```mermaid
flowchart LR
    subgraph Sources["External sources"]
        RSS[RSS feeds]
        GH[GitHub API + Trending repos]
        RD[Reddit API]
        HN[Hacker News API]
        PAPERS[arXiv + Hugging Face papers]
    end

    subgraph Backend["FastAPI backend"]
        SCHED["APScheduler\ningestion every N min, retention daily"]
        PIPE["Ingestion pipeline\nrank -> categorize -> score -> summarize"]
        REPO[Repositories]
        EVENTS["Event broadcaster\nin-process pub/sub"]
        API["REST API\n/news /papers /repos /latest /critical /search /bookmarks"]
        SSE["SSE stream\n/stream/latest"]
        AUTH["Auth\nJWT + Google sign-in, rate-limited"]
    end

    DB[(PostgreSQL)]
    FE["React / Vite SPA\nTop Stories, Latest, Papers, Repos, Critical, Search"]
    USER((Browser))

    RSS --> SCHED
    GH --> SCHED
    RD --> SCHED
    HN --> SCHED
    PAPERS --> SCHED
    SCHED --> PIPE
    PIPE -->|upsert articles, categories, scores| REPO
    REPO <--> DB
    PIPE -.->|new articles| EVENTS
    EVENTS --> SSE
    API -->|read-only, always fast| REPO
    AUTH --- API
    FE -->|HTTPS REST + JWT| API
    FE -.->|EventSource| SSE
    USER --> FE
```

There's one small exception to "reads never call a provider live": when a new ingestion cycle finds fresh articles, it publishes a lightweight event to an in-process broadcaster, which fans out over an SSE stream to any open tabs. That's what powers the "N new stories" banner on the Latest page — the browser hears about new stories the moment they land instead of waiting for its next poll. It's a nice-to-have on top of the polling that already happens, not a replacement for it.

## Stack

- **Frontend** — React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, Framer Motion
- **Backend** — FastAPI, async SQLAlchemy, PostgreSQL
- **Scheduling** — APScheduler-driven background ingestion and retention workers, decoupled from the request path
- **Ingestion** — a provider layer for RSS, GitHub, GitHub Trending, Reddit, Hacker News, arXiv, and Hugging Face's daily papers API
- **Auth** — email/password plus Google sign-in, JWT sessions, rate-limited auth endpoints, password reset

## What it actually does

The homepage tries to answer one question: *what does a working engineer need to know today?* Everything else — categories, source trust scores, urgency bands — exists to serve that.

- A ranked feed, newest and highest-impact first, always served from a Postgres cache so page loads are never gated on a live fetch
- Background ingestion across seven-ish sources on a timer, independent of anyone actually visiting the site
- A multi-factor impact score (content signal, source trust, recency, engagement) computed once at ingestion time and logged, with a safe fallback if scoring ever throws
- Twelve categories, always seeded so filters never look broken even before the first article in a category shows up
- Dedicated Papers and Repos views — arXiv/Hugging Face papers and freshly-created, star-sorted GitHub repos, alongside the general news feed
- A live "Latest" page that polls aggressively and gets an SSE nudge the moment new stories land
- Real per-account bookmarks, persisted server-side, not localStorage
- Real per-article images pulled from the source's `og:image`, with a curated fallback so nothing repeats the same generic placeholder
- Search with autocomplete, plus category filtering from the header
- Email/password auth and Google sign-in, rate-limited login/register/reset endpoints, and a working (if not yet email-connected — see below) password reset flow

## Repo layout

- `backend/` — FastAPI API, domain services, repositories, ingestion pipeline, background workers, Alembic migrations, tests
- `frontend/` — the Vite React app
- `docs/` — architecture notes, ingestion pipeline notes, prompts, schema, screenshots

## Local development

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`. Backend: `http://localhost:8000/docs`.

Both need to be running together — the frontend proxies `/api/v1` and `/health` to the backend (see `frontend/vite.config.ts`), so auth, bookmarks, and the feed itself won't work if the backend isn't up.

## Environment

The backend reads `.env` through FastAPI settings — see `backend/app/core/config.py` for the full list and defaults:

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
GOOGLE_CLIENT_ID=
```

A couple of these are worth explaining rather than just listing:

`PUBLIC_BASE_URL` needs to be the backend's real public URL whenever the frontend is hosted on a different origin (Vercel, say). It's used to build absolute URLs for the locally-served fallback images — a relative `/images/...` path would otherwise resolve against the frontend's own domain and 404.

`LLM_RELEVANCE_ENABLED` turns on an optional LLM pass that refines the heuristic impact score. It's off by default because `google/gemma-4-31B-it` wants real GPU memory, and the heuristic scorer does a perfectly reasonable job on its own. Reddit and RSS need no credentials at all.

`GOOGLE_CLIENT_ID` enables Google sign-in once you've created an OAuth client in Google Cloud Console — leave it blank and the button just says it isn't configured yet, rather than breaking anything. The frontend needs the matching `VITE_GOOGLE_CLIENT_ID` in `frontend/.env`.

## Tests

```bash
cd backend
pip install -e ".[dev]"
pytest
```

These hit a real Postgres database — the models lean on Postgres-specific types (`JSONB`, `UUID`), so SQLite can't stand in. `backend/tests/conftest.py` points at `tech_news_test` on `localhost:5432` by default; create it once with:

```sql
CREATE DATABASE tech_news_test;
```

Coverage is deliberately focused on the stuff that's easy to get subtly wrong: ingestion scoring and ranking (`test_scoring.py`), the full auth surface including Google sign-in and password reset (`test_auth.py`), and bookmarks (`test_bookmarks.py`). Tests talk to the FastAPI app in-process over `httpx.ASGITransport`, so the ingestion scheduler never actually runs during a test session — nothing here makes real network calls.

## Migrations

Schema changes go through Alembic now, not `init_db.py` or `docs/schema.sql`:

```bash
cd backend
alembic upgrade head                                       # apply pending migrations
alembic revision --autogenerate -m "describe the change"   # after editing app/models/news.py
alembic check                                               # fails if models and migrations have drifted
```

If you've got a local DB that was set up before Alembic existed (via `init_db.py`), stamp it instead of upgrading, so Alembic doesn't try to recreate tables that already exist: `alembic stamp head`.

## CI

`.github/workflows/ci.yml` runs on every push and PR: a backend job (`ruff check`, `alembic check`, `pytest`, against a `pgvector/pgvector:pg16` service container) and a frontend job (`tsc`, `eslint`, `vite build`), independently.

## Known gaps

Worth being upfront about rather than discovering the hard way:

- **Password reset doesn't send email yet.** The token lifecycle (generate, hash, expire, single-use) is real and tested, but nothing's wired up to actually deliver the link — it's logged server-side. Fine for local dev, not fine for production until a real provider (SES, Postmark, SendGrid) is plugged in.
- **The SSE broadcaster is single-process.** It's an in-memory `asyncio.Queue` per subscriber, which is exactly right for one backend instance and wrong the moment you run more than one — a second instance's ingestion cycle wouldn't notify clients connected to the first. Fine for now; would need a shared channel (Redis pub/sub, Postgres `LISTEN/NOTIFY`) to scale out.
- **`LLM_RELEVANCE_ENABLED` is off by default**, and the `torch`/`transformers` dependencies it needs are hefty. If you're not using it, they're dead weight in the Docker image — worth stripping before a real deploy.
