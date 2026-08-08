"""Shared test fixtures.

Uses SQLite in-memory (via the portable GUID type, app/db/types.py) instead
of a live Postgres — fast, no external service required. Every real
Intelligence Layer agent dependency is overridden with a fake (see
`fake_agents.py`) so tests never call a live LLM or require GROQ_API_KEY.
"""

from __future__ import annotations

from collections.abc import AsyncGenerator, Iterator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.api.deps import (
    get_career_supervisor,
    get_clerk_admin_client,
    get_current_user_id,
    get_cv_feedback_agent,
    get_db,
    get_explainability_llm,
    get_roadmap_agent,
    get_skill_gap_analysis_agent,
)
from app.core.rate_limit import career_plan_start_limiter, cv_feedback_submit_limiter, skill_gap_refresh_limiter
from app.db import models  # noqa: F401 — import registers every table on Base.metadata
from app.db.base import Base
from app.main import app
from tests.fake_agents import (
    FakeCareerSupervisor,
    FakeClerkAdminClient,
    FakeCVFeedbackAgent,
    FakeExplainabilityLLM,
    FakeRoadmapAgent,
    FakeSkillGapAnalysisAgent,
)

TEST_CLERK_USER_ID = "user_test123"


@pytest.fixture
async def session_maker() -> AsyncGenerator[async_sessionmaker[AsyncSession], None]:
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield async_sessionmaker(engine, expire_on_commit=False)
    await engine.dispose()


@pytest.fixture
def client(session_maker: async_sessionmaker[AsyncSession]) -> Iterator[TestClient]:
    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        async with session_maker() as session:
            yield session

    app.dependency_overrides[get_db] = _override_get_db
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID
    app.dependency_overrides[get_skill_gap_analysis_agent] = lambda: FakeSkillGapAnalysisAgent()
    app.dependency_overrides[get_roadmap_agent] = lambda: FakeRoadmapAgent()
    app.dependency_overrides[get_cv_feedback_agent] = lambda: FakeCVFeedbackAgent()
    app.dependency_overrides[get_explainability_llm] = lambda: FakeExplainabilityLLM()
    app.dependency_overrides[get_clerk_admin_client] = lambda: FakeClerkAdminClient()
    # One instance reused across every request in a test — its in-memory
    # `_threads` state must survive between a /career-plan/start call and
    # the /career-plan/approve|reject call that follows it, same as the
    # real CareerSupervisor's checkpointer-backed state does across requests.
    fake_supervisor = FakeCareerSupervisor()
    app.dependency_overrides[get_career_supervisor] = lambda: fake_supervisor
    # Real rate limiting hits Redis; the hermetic suite shouldn't depend on
    # (or pay the latency of) a real external call for something orthogonal
    # to what each test is actually verifying — same reasoning as every
    # other fake above.
    app.dependency_overrides[skill_gap_refresh_limiter] = lambda: None
    app.dependency_overrides[career_plan_start_limiter] = lambda: None
    app.dependency_overrides[cv_feedback_submit_limiter] = lambda: None

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
