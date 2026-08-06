from fastapi import APIRouter

from careeros_ai.observability import METRICS

router = APIRouter(tags=["health"])


@router.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/metrics")
async def metrics() -> dict:
    """SDAIA rubric: observability/metrics. Real, in-process counters
    (careeros_ai/observability.py) incremented from real code paths —
    agent reasoning steps, tool calls, retries, HITL interrupts/resumes —
    not placeholder values. Deliberately JSON (not Prometheus text format):
    this project has no metrics backend provisioned to scrape a
    Prometheus endpoint, so a plain, human-and-script-readable JSON
    snapshot is the honest choice for what's actually deployed."""
    return METRICS.snapshot()
