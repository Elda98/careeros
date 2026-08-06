# Render's Docker runtime requires a Dockerfile at the repository root, so
# this is a production copy of docker/backend.Dockerfile — which remains the
# source of truth for local `docker compose`. Keep the two in sync; the only
# intentional difference is dropping --reload below (a dev-only uvicorn flag
# that disables production correctness: single worker, file-watch overhead).
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl \
    && rm -rf /var/lib/apt/lists/*

COPY ai/requirements.txt /app/ai/requirements.txt
COPY backend/requirements.txt /app/backend/requirements.txt

RUN pip install -r /app/ai/requirements.txt \
    && pip install -r /app/backend/requirements.txt

COPY ai/ /app/ai/
COPY backend/ /app/backend/

RUN pip install -e /app/ai

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
