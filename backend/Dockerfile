# Build context is the repo root (see docker-compose.yml / your platform's
# "Dockerfile path" setting) — not backend/ — because the app also needs the
# repo-root images/ folder, which lives outside the backend/ directory.
FROM python:3.12-slim

WORKDIR /app

COPY backend/pyproject.toml ./
RUN pip install --no-cache-dir uv && uv pip install --system .

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini
# app/main.py resolves this as ../images relative to app/, i.e. a sibling of /app.
COPY images /images

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
