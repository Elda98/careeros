## CareerOS — common development commands.
## Run from the repository root.

.PHONY: up down build logs migrate test-backend test-ai test-frontend lint-frontend verify-e2e

up:
	docker compose -f docker/docker-compose.yml up --build

down:
	docker compose -f docker/docker-compose.yml down

build:
	docker compose -f docker/docker-compose.yml build

logs:
	docker compose -f docker/docker-compose.yml logs -f

migrate:
	docker compose -f docker/docker-compose.yml exec backend alembic upgrade head

test-backend:
	cd backend && pytest tests/

test-ai:
	cd ai && pytest tests/

test-frontend:
	cd frontend && npm run test:e2e

lint-frontend:
	cd frontend && npm run lint

verify-e2e:
	docker compose -f docker/docker-compose.yml exec backend python -m scripts.verify_e2e
