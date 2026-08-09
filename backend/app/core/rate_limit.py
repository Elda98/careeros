"""Redis-backed rate limiting for the AI-generation endpoints (SDAIA
rubric: rate limiting where appropriate). Applied only to the routes that
actually trigger a real LLM call — every other route is unaffected.

Uses the same Redis instance already provisioned for the app (`REDIS_URL`,
declared in `ai/requirements.txt`/`.env.example` from the start of this
project but never actually used in code until now) — a real fixed-window
counter (`INCR` + `EXPIRE`), not an in-memory approximation that would be
wrong the moment there's more than one backend instance.

Opens a fresh connection per call rather than caching one client across
requests: `redis.asyncio.Redis` objects are bound to the event loop they
were created on, and this app's request-handling context (in particular
the test suite's `TestClient`) doesn't guarantee the same loop across
calls — a cached client silently breaks in that situation. A Redis
connection is cheap enough that this isn't a real cost, unlike the
Postgres checkpointer (`app/api/deps.py`), which genuinely needs to stay
long-lived.
"""

from __future__ import annotations

import logging

from fastapi import Depends, HTTPException, status
from redis.asyncio import Redis

from app.core.config import get_settings

from careeros_ai.observability import log_event

logger = logging.getLogger(__name__)

# Deliberately generous — this guards against runaway/automated abuse of
# the most expensive endpoints (each call is a real Groq inference, some
# now with multiple tool-calling rounds), not normal interactive use.
WINDOW_SECONDS = 60
MAX_REQUESTS_PER_WINDOW = 10


async def enforce_rate_limit(user_id: str, *, bucket: str) -> None:
    """Raises 429 if `user_id` has made more than `MAX_REQUESTS_PER_WINDOW`
    calls to this `bucket` in the current `WINDOW_SECONDS` window.
    Fails open (does not block the request) if Redis itself is
    unreachable — availability of the underlying feature must not depend
    on a cache being up, and an unreachable Redis is a separate, already-
    logged problem, not something a real user's request should pay for."""
    key = f"ratelimit:{bucket}:{user_id}"
    try:
        client = Redis.from_url(get_settings().redis_url, socket_connect_timeout=2, socket_timeout=2)
        try:
            count = await client.incr(key)
            if count == 1:
                await client.expire(key, WINDOW_SECONDS)
        finally:
            await client.aclose()
    except Exception:
        logger.warning("Rate limiter Redis call failed — failing open for this request.", exc_info=True)
        return
    if count > MAX_REQUESTS_PER_WINDOW:
        log_event("guardrail.rate_limit_exceeded", bucket=bucket, user_id=user_id, count=count)
        raise HTTPException(
            status.HTTP_429_TOO_MANY_REQUESTS,
            f"Rate limit exceeded for {bucket}: max {MAX_REQUESTS_PER_WINDOW} requests per {WINDOW_SECONDS}s.",
        )


def rate_limiter(bucket: str):
    """Builds a FastAPI dependency for one named bucket. A plain function
    (not a dependency) would be a fine implementation, but it can't be
    overridden per-test the way every other external call in this test
    suite is (`app.dependency_overrides` — see `tests/conftest.py`), and
    a real Redis round-trip inside pytest's async TestClient context is
    measurably slower than in a plain script — worth avoiding in the
    hermetic suite for the same reason the Postgres checkpointer's real
    connection is avoided there too. `Depends(get_current_user)` here
    reuses the same per-request cached resolution the route handler's own
    `user` parameter uses (FastAPI caches a dependency's result per
    request) — this does not add a second database query."""
    from app.api.deps import get_current_user  # local import: avoids a circular import at module load time

    async def _dependency(user=Depends(get_current_user)) -> None:
        await enforce_rate_limit(str(user.id), bucket=bucket)

    return _dependency


# Named, stable, importable dependency instances — one per rate-limited
# endpoint, so `tests/conftest.py` has a fixed reference to override with
# a no-op (`app.dependency_overrides` keys by the exact callable object;
# calling `rate_limiter(...)` inline at each route wouldn't give tests
# anything stable to target).
skill_gap_refresh_limiter = rate_limiter("skill-gap-analysis-refresh")
career_plan_start_limiter = rate_limiter("career-plan-start")
cv_feedback_submit_limiter = rate_limiter("cv-feedback-submit")
interview_turn_limiter = rate_limiter("interview-turn")
