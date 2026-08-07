import logging
from functools import lru_cache
from threading import Lock

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user_id
from app.core.clerk_admin import ClerkAdminClient
from app.core.clerk_admin import get_clerk_admin_client as _build_clerk_admin_client
from app.core.config import Settings, get_settings
from app.db.models import User
from app.db.session import get_db

from careeros_ai.agents.cv_feedback import CVFeedbackAgent
from careeros_ai.agents.roadmap import RoadmapAgent
from careeros_ai.agents.skill_gap_analysis import SkillGapAnalysisAgent
from careeros_ai.llm import default_llm
from careeros_ai.orchestration.checkpointer import get_checkpointer
from careeros_ai.orchestration.supervisor import CareerSupervisor

logger = logging.getLogger(__name__)

__all__ = [
    "get_career_supervisor",
    "get_clerk_admin_client",
    "get_current_user",
    "get_current_user_id",
    "get_cv_feedback_agent",
    "get_db",
    "get_explainability_llm",
    "get_roadmap_agent",
    "get_skill_gap_analysis_agent",
]

_USER_LOAD_OPTIONS = (
    selectinload(User.profile),
    selectinload(User.goals),
    selectinload(User.subscription),
    selectinload(User.notification_preference),
)


async def get_current_user(
    clerk_user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Just-in-time provisioning: the first authenticated request from a new
    Clerk identity creates the corresponding local User row (FR-AUTH-4 —
    every activity must be associated with the authenticated identity).

    Eagerly loads profile/goals/subscription via `selectinload` — routers
    access these as plain attributes (e.g., `user.profile`), which would
    otherwise raise `MissingGreenlet` under AsyncSession's lazy loading.
    """
    result = await db.execute(
        select(User).where(User.clerk_user_id == clerk_user_id).options(*_USER_LOAD_OPTIONS)
    )
    user = result.scalar_one_or_none()
    if user is None:
        # Clerk owns email verification; a real implementation reads the
        # verified email from the token claims rather than this placeholder.
        user = User(clerk_user_id=clerk_user_id, email=f"{clerk_user_id}@placeholder.careeros.app")
        db.add(user)
        await db.commit()
        result = await db.execute(select(User).where(User.id == user.id).options(*_USER_LOAD_OPTIONS))
        user = result.scalar_one()
    return user


# --- Intelligence Layer agent providers -------------------------------------
# Dependency-injected (rather than instantiated inline in routers) so tests
# can override them with fakes that never call a real LLM (see
# tests/conftest.py). Cached per-process since agent construction is cheap
# and stateless beyond holding an LLM client handle.


@lru_cache
def _skill_gap_analysis_agent() -> SkillGapAnalysisAgent:
    return SkillGapAnalysisAgent()


@lru_cache
def _roadmap_agent() -> RoadmapAgent:
    return RoadmapAgent()


@lru_cache
def _cv_feedback_agent() -> CVFeedbackAgent:
    return CVFeedbackAgent()


def get_skill_gap_analysis_agent() -> SkillGapAnalysisAgent:
    return _skill_gap_analysis_agent()


def get_roadmap_agent() -> RoadmapAgent:
    return _roadmap_agent()


def get_cv_feedback_agent() -> CVFeedbackAgent:
    return _cv_feedback_agent()


@lru_cache
def _explainability_llm():
    return default_llm()


def get_explainability_llm():
    """RAI-4 / FR-AICC-5,11,16: the LLM client used only for on-request
    explanations — a plain chat model, not one of the three owning agents,
    since explaining an output is not the same responsibility as producing
    it (SAS §5.11: Intelligence makes an output explainable; the explanation
    itself is generated fresh per request, not re-run through an agent)."""
    return _explainability_llm()


_checkpointer_lock = Lock()
_checkpointer_state: dict = {"cm": None, "value": None, "attempted": False}


def _get_or_open_checkpointer():
    """Lazily opens the supervisor graph's persistent Postgres checkpointer
    on first actual use, not at app startup — deliberately, so that every
    route *except* `/career-plan/*` (i.e. the entire hermetic test suite,
    and most real traffic) never pays a Postgres round-trip it doesn't
    need. Opened at most once per process and reused after that; still one
    long-lived psycopg connection, just lazily established instead of
    eagerly at startup."""
    with _checkpointer_lock:
        if _checkpointer_state["attempted"]:
            return _checkpointer_state["value"]
        _checkpointer_state["attempted"] = True
        try:
            cm = get_checkpointer(get_settings().database_url)
            _checkpointer_state["value"] = cm.__enter__()
            _checkpointer_state["cm"] = cm
        except Exception:
            logger.warning("Checkpointer unavailable — /career-plan endpoints will 503.", exc_info=True)
            _checkpointer_state["value"] = None
        return _checkpointer_state["value"]


def get_career_supervisor() -> CareerSupervisor:
    checkpointer = _get_or_open_checkpointer()
    if checkpointer is None:
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "The supervised career-plan flow is unavailable — its persistent checkpointer "
            "could not connect to the database.",
        )
    return CareerSupervisor(_skill_gap_analysis_agent(), _roadmap_agent(), checkpointer)


def get_clerk_admin_client(settings: Settings = Depends(get_settings)) -> ClerkAdminClient:
    """FR-AUTH-5: not cached like the agent providers above — reads
    `settings.clerk_secret_key` fresh each call so a key rotated into `.env`
    takes effect without a process restart."""
    return _build_clerk_admin_client(settings)
