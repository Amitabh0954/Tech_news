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

---

# Architecture

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

The platform follows an **asynchronous ingestion architecture** where external providers are completely decoupled from the request path.

- APScheduler periodically triggers ingestion jobs.
- Articles are collected from multiple providers.
- The ingestion pipeline performs normalization, categorization, ranking, impact scoring, image extraction, and summarization.
- Processed articles are persisted in PostgreSQL.
- REST endpoints never communicate directly with external providers and always serve cached data.
- Newly ingested articles are broadcast through an in-process event bus and exposed to connected clients via Server-Sent Events (SSE).

---

# Technology Stack

### Frontend

- React
- Vite
- TypeScript
- TailwindCSS
- Zustand
- TanStack Query
- Framer Motion

### Backend

- FastAPI
- Async SQLAlchemy
- PostgreSQL
- Alembic

### Background Processing

- APScheduler
- AsyncIO

### Authentication

- JWT Authentication
- Google OAuth 2.0

### Testing

- Pytest
- HTTPX
- Ruff

---

# Features

## Data Ingestion

- Asynchronous background ingestion from:
  - RSS
  - GitHub API
  - GitHub Trending
  - Reddit
  - Hacker News
  - arXiv
  - Hugging Face Papers

- Periodic scheduling using APScheduler.
- Automatic duplicate detection.
- Retry and failure isolation between providers.

## Processing Pipeline

Each article passes through a multi-stage processing pipeline:

1. Fetch
2. Normalize
3. Categorize
4. Impact Scoring
5. Image Extraction
6. LLM Summary Generation
7. Database Persistence

The impact score combines multiple signals including:

- Source credibility
- Recency
- Engagement
- Technical relevance
- Content quality

Scores are calculated once during ingestion and stored in PostgreSQL for fast retrieval.

## Backend

- Async FastAPI architecture
- Repository pattern
- SQLAlchemy ORM
- Alembic database migrations
- PostgreSQL persistence
- Background worker scheduling
- Server-Sent Events (SSE)
- RESTful API design
- Global exception handling
- Structured logging

## Frontend

- Responsive React interface
- Top Stories
- Latest Feed
- Research Papers
- GitHub Repositories
- Critical Updates
- Category Navigation
- Search with autocomplete
- Bookmark management
- Live update notifications

## Authentication

- Email & Password authentication
- Google Sign-In
- JWT Access Tokens
- Password Reset
- Rate Limiting

## User Features

- Personalized bookmarks
- Full-text search
- Category filtering
- Article summaries
- Original source links
- Impact score visualization

---

# Repository Structure

```
Engineering-Intelligence-Portal/
│
├── backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/
│   ├── screenshots/
│   └── architecture/
│
├── docker-compose.yml
└── README.md
```

---

# Local Development

Clone the repository.

```bash
git clone <repository-url>
cd Engineering-Intelligence-Portal
```

Start the application.

```bash
docker compose up --build
```

Application URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |

The frontend communicates with the backend through the configured Vite proxy.

---

# Environment Variables

Create a `.env` file inside the backend directory.

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

---

# Database Migration

Apply migrations.

```bash
cd backend

alembic upgrade head
```

Create a new migration.

```bash
alembic revision --autogenerate -m "migration description"
```

Validate migration state.

```bash
alembic check
```

---

# Testing

Install development dependencies.

```bash
cd backend

pip install -e ".[dev]"
```

Run tests.

```bash
pytest
```

Tests cover:

- Authentication
- Repository layer
- Impact scoring
- Search
- Bookmarks
- Password reset
- Google authentication

Tests execute using HTTPX ASGITransport and do not require a running backend server.

---

# Continuous Integration

GitHub Actions automatically executes:

### Backend

- Ruff
- Alembic Validation
- Pytest

### Frontend

- TypeScript Compilation
- ESLint
- Production Build

Every pull request and push is validated before merging.

---

# Performance Characteristics

- Background ingestion completely isolated from client requests.
- Database-backed caching for predictable API latency.
- Async database access using SQLAlchemy.
- Incremental ingestion with UPSERT operations.
- Event-driven updates through Server-Sent Events.
- Stateless REST API.
- Read-heavy architecture optimized for news delivery.

---

# Current Limitations

- Password reset emails are not integrated with an external email provider.
- SSE notifications use an in-memory event broadcaster and support a single backend instance.
- LLM-based relevance scoring is optional and disabled by default because it requires additional GPU resources.

---

# Future Enhancements

- Redis Pub/Sub for distributed SSE.
- pgvector-based semantic search.
- Personalized recommendation engine.
- Multi-language support.
- Advanced analytics dashboard.
- Kubernetes deployment.
- Horizontal scaling.
- Distributed ingestion workers.

---

# License

This project is intended for educational and portfolio purposes.
