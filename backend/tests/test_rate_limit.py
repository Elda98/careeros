"""Direct tests of `enforce_rate_limit`'s actual logic — the threshold,
the fixed-window reset, and the fail-open behavior on a Redis error.
Distinct from `conftest.py`'s override of the three named limiter
dependencies (which disables rate limiting entirely for the API-level
test suite, deliberately, for speed) — this file is what actually proves
the underlying function does the right thing, against a fake Redis client
so it stays hermetic (no live Redis required).
"""

from __future__ import annotations

from typing import ClassVar

import pytest

from app.core import rate_limit
from app.core.rate_limit import MAX_REQUESTS_PER_WINDOW, enforce_rate_limit


class _FakeRedisClient:
    """Minimal fake matching the three calls enforce_rate_limit actually
    makes (`incr`, `expire`, `aclose`) — a real in-memory counter, not a
    canned return value, so the fixed-window logic is genuinely exercised.
    Deliberately class-level (not per-instance): `enforce_rate_limit`
    constructs a fresh client per call, and the counter must still
    accumulate across those calls within one test — cross-*test* isolation
    is handled separately by the `_reset_fake_redis` autouse fixture below."""

    _counters: ClassVar[dict[str, int]] = {}

    def __init__(self, *_, **__):
        pass

    async def incr(self, key: str) -> int:
        self._counters[key] = self._counters.get(key, 0) + 1
        return self._counters[key]

    async def expire(self, key: str, seconds: int) -> None:
        pass

    async def aclose(self) -> None:
        pass

    @classmethod
    def reset(cls) -> None:
        cls._counters = {}


class _FailingRedisClient:
    def __init__(self, *_, **__):
        raise ConnectionError("simulated Redis outage")


@pytest.fixture(autouse=True)
def _reset_fake_redis():
    _FakeRedisClient.reset()
    yield


async def test_requests_under_the_limit_are_allowed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rate_limit.Redis, "from_url", lambda *a, **k: _FakeRedisClient())

    for _ in range(MAX_REQUESTS_PER_WINDOW):
        await enforce_rate_limit("user-1", bucket="test-bucket")  # must not raise


async def test_exceeding_the_limit_raises_429(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rate_limit.Redis, "from_url", lambda *a, **k: _FakeRedisClient())

    for _ in range(MAX_REQUESTS_PER_WINDOW):
        await enforce_rate_limit("user-2", bucket="test-bucket")

    with pytest.raises(Exception) as exc_info:
        await enforce_rate_limit("user-2", bucket="test-bucket")
    assert exc_info.value.status_code == 429


async def test_limit_is_scoped_per_user_and_per_bucket(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(rate_limit.Redis, "from_url", lambda *a, **k: _FakeRedisClient())

    for _ in range(MAX_REQUESTS_PER_WINDOW):
        await enforce_rate_limit("user-3", bucket="bucket-a")

    # A different user, and the same user in a different bucket, are not
    # affected by user-3's bucket-a exhaustion.
    await enforce_rate_limit("user-4", bucket="bucket-a")
    await enforce_rate_limit("user-3", bucket="bucket-b")


async def test_fails_open_when_redis_is_unreachable(monkeypatch: pytest.MonkeyPatch) -> None:
    """Availability of the feature must not depend on the rate limiter's
    own backing store — an unreachable Redis must never block a real
    request, only skip the rate-limit check for it."""
    monkeypatch.setattr(rate_limit.Redis, "from_url", lambda *a, **k: _FailingRedisClient())

    for _ in range(MAX_REQUESTS_PER_WINDOW + 5):
        await enforce_rate_limit("user-5", bucket="test-bucket")  # must never raise, even well past the limit
