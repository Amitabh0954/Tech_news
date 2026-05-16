# Engineering Intelligence Portal

A production-oriented engineering intelligence news platform focused on high-signal software engineering, AI, infrastructure, cybersecurity, cloud, developer ecosystem, and supply-chain-impact news.

## Stack

- Frontend: React, Vite, TypeScript, TailwindCSS, Zustand, TanStack Query, Framer Motion
- Backend: FastAPI, async SQLAlchemy, PostgreSQL
- AI pipeline: modular LLM adapters with Gemma-first prompts and pluggable future model support
- Ingestion: modular provider layer designed for RSS, APIs, GitHub, Reddit, Hacker News, advisories, and engineering blogs

## Product principle

The homepage should answer one question:

> What must a serious software engineer know today?

## Repo layout

- `backend/` FastAPI API, domain services, repositories, workers
- `frontend/` Vite React application
- `docs/` architecture, ingestion, prompts, deployment notes

## Local development

```bash
docker compose up --build
```

Frontend: `http://localhost:5173`

Backend: `http://localhost:8000/docs`

## Environment

Backend reads `.env` through FastAPI settings. For Hugging Face and Gemma, set:

```env
HUGGINGFACE_API_TOKEN=hf_xxx
GEMMA_MODEL_ID=google/gemma-4-31B-it
GEMMA_DEVICE_MAP=auto
GEMMA_MAX_NEW_TOKENS=512
GITHUB_TOKEN=ghp_xxx
REDDIT_CLIENT_ID=xxx
REDDIT_CLIENT_SECRET=xxx
HACKER_NEWS_BASE_URL=https://hacker-news.firebaseio.com/v0
HACKER_NEWS_STORY_LIMIT=20
```

Note: `google/gemma-4-31B-it` is a very large model and requires substantial GPU memory. The backend now loads it through `transformers` from FastAPI, but production deployment should use hardware sized for that model or swap the model id to a smaller Gemma variant.

## Key capabilities

- High-signal categorized feed
- Critical alerts and impact scoring
- Structured AI summaries
- Search, bookmarks, related stories, trending topics
- Future-ready ingestion and intelligence pipeline
