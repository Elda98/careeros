#!/usr/bin/env bash
# One-time local dev bootstrap. Does not require Docker — sets up native
# Python/Node environments for editors, debugging, and running tests without
# a container. For actually running the app, prefer `make up`.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — fill in real secrets before running the app."
fi

echo "==> ai/"
python3 -m venv ai/.venv
ai/.venv/bin/pip install -r ai/requirements.txt
ai/.venv/bin/pip install -e ai

echo "==> backend/"
python3 -m venv backend/.venv
# requirements-dev.txt pulls in requirements.txt itself, plus pytest/ruff —
# installing it alone (not requirements.txt separately) gives a fully
# working dev environment (tests + lint), matching backend/README.md.
backend/.venv/bin/pip install -r backend/requirements-dev.txt
backend/.venv/bin/pip install -e ai

echo "==> frontend/"
(cd frontend && npm install)

echo "Done. Next steps:"
echo "  1. Fill in .env (Clerk, Groq, Supabase keys)."
echo "  2. make up        # start Postgres, Redis, backend, frontend via Docker"
echo "  3. make migrate   # run Alembic migrations"
