# Docker

Local development environment for CareerOS: PostgreSQL (with `pgvector`), Redis, the FastAPI backend, and the Next.js frontend, wired together with Docker Compose.

## Quick start

```bash
cp .env.example .env        # from the repo root — fill in real secrets
docker compose -f docker/docker-compose.yml up --build
```

- Backend: http://localhost:8000 (docs at `/docs`)
- Frontend: http://localhost:3000
- Postgres: `localhost:5432`
- Redis: `localhost:6379`

## Files

- `docker-compose.yml` — orchestrates all four services for local development.
- `backend.Dockerfile` — builds the backend image; its build context is the **repository root**, not `backend/`, because the backend imports the local `ai` package (see `ai/README.md`).
- `frontend.Dockerfile` — builds the frontend image; its build context is `frontend/`.

## Relationship to the SAS

This is a local development topology, not a statement about production deployment architecture — the SAS deliberately makes no deployment claims (SAS §1.7). `backend` and `ai` are packaged into one container here because nothing in the architecture requires them to be separate services; SAS §13.6 explicitly notes a Module is not tied to any particular deployment unit. Splitting them later (e.g., a dedicated inference/orchestration service) is a valid future implementation choice, not an architectural change.
