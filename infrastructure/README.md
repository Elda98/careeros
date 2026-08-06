# Infrastructure

Local and deployment infrastructure for CareerOS. At this stage (early implementation), this covers what `docker/docker-compose.yml` needs to bring up a full local environment — Postgres bootstrap SQL and environment templates. Cloud/deployment infrastructure (`docs/09-Deployment` equivalents) is added here as it's actually needed, per [`CONTRIBUTING.md`](../CONTRIBUTING.md) rule 8 — not produced ahead of the implementation that needs it.

## Contents

- `postgres/init/` — SQL run once, on first container start, to enable the extensions the Knowledge Layer depends on (`pgvector` for embedding similarity search, `uuid-ossp` for entity primary keys).

## Stack

- **Database:** PostgreSQL + `pgvector`
- **Cache:** Redis
- **Deployment (local):** Docker Compose (`docker/docker-compose.yml`)

## Relationship to the SAS

Nothing here names a technology the SAS didn't already anticipate at the architecture level — the Knowledge Layer (SAS §3) is technology-agnostic by design; PostgreSQL + pgvector is the implementation choice satisfying it. See `docs/02-Solution-Architecture/SAS.md` §3 for what the Knowledge Layer must guarantee regardless of storage technology, and §27.5 for why this implementation detail lives here rather than in a standalone Database Design document.
