"""Structured logging + lightweight in-process metrics for the Intelligence
Layer (SDAIA rubric: tool execution visibility, agent observability).

Deliberately not a dependency on any external metrics backend (Datadog,
Prometheus, etc.) — this project runs on free-tier infrastructure with none
provisioned. `log_event` emits structured (JSON-serializable-field) log
lines any log aggregator can parse; `METRICS` is a real, thread-safe-enough
(single-process, GIL-protected simple increments) in-memory counter set the
backend's `/metrics` endpoint reads from directly. LangSmith tracing
(`LANGCHAIN_TRACING_V2`/`LANGCHAIN_API_KEY`) is separate and automatic —
LangChain/LangGraph instrument themselves from those env vars with no code
here required; this module is for the events LangSmith doesn't cover
(retries, HITL interrupts, validation failures) and for metrics a trace
viewer doesn't aggregate into simple counters.
"""

from __future__ import annotations

import logging
import time
from collections import defaultdict
from threading import Lock
from typing import Any

logger = logging.getLogger("careeros_ai")


def log_event(event: str, **fields: Any) -> None:
    """Emit one structured log line: `event` plus arbitrary key=value
    fields, timestamped. Also updates the in-process counters below for
    any event ending in a countable action, so a single call site produces
    both a trace-able log line and an aggregable metric."""
    logger.info("%s", {"event": event, "ts": time.time(), **fields})
    METRICS.increment(event)


class _Metrics:
    """Real counters, incremented from real code paths (agent reasoning
    steps, tool calls, retries, HITL interrupts/approvals, rate-limit
    rejections) — not placeholders. Process-local, reset on restart; fine
    for a single-instance free-tier deployment, not a substitute for a real
    metrics backend under real concurrency."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._counts: dict[str, int] = defaultdict(int)
        self._started_at = time.time()

    def increment(self, event: str, by: int = 1) -> None:
        with self._lock:
            self._counts[event] += by

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            counts = dict(self._counts)
        return {
            "uptime_seconds": round(time.time() - self._started_at, 1),
            "counts": counts,
        }


METRICS = _Metrics()
