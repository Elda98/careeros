# Build context is the repository root (see docker-compose.yml), because the
# backend service imports the local `ai` package (careeros_ai) as a library —
# the Intelligence Layer's code, kept in its own top-level folder per SAS Part I/III,
# but not deployed as a separate service at this stage.
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

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
