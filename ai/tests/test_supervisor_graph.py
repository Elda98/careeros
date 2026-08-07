"""Exercises the REAL CareerSupervisor graph (careeros_ai.orchestration.supervisor)
— real LangGraph nodes, real conditional edges, a real interrupt/resume —
using fake agents (no live Groq) and an in-memory checkpointer (no live
Postgres). Distinct from backend/tests, which override the supervisor
entirely with a FakeCareerSupervisor to keep the API-level test suite
hermetic and fast; this file is what actually proves the graph mechanics
themselves — routing, the interrupt, and resuming a genuinely separate
CareerSupervisor instance against the same checkpointer — work correctly.
"""

from __future__ import annotations

from uuid import uuid4

from langgraph.checkpoint.memory import InMemorySaver

from careeros_ai.knowledge.contracts import (
    ConfidenceLevel,
    GoalSnapshot,
    ProfileSnapshot,
    RoadmapInput,
    RoadmapItemContent,
    RoadmapOutput,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)
from careeros_ai.orchestration.supervisor import CareerSupervisor


class _FakeSkillGapAnalysisAgent:
    def run(self, inp: SkillGapAnalysisInput) -> SkillGapAnalysisOutput:
        return SkillGapAnalysisOutput(
            gaps=[SkillGap(skill="SQL", description="No database experience", severity=ConfidenceLevel.MEDIUM)],
            summary=f"Gap analysis for {inp.goal.target_role}",
            confidence=ConfidenceLevel.HIGH,
            confidence_reason="fake — deterministic",
            grounded_on=["profile.skills"],
        )


class _FakeRoadmapAgent:
    def run(self, inp: RoadmapInput) -> RoadmapOutput:
        return RoadmapOutput(
            items=[RoadmapItemContent(title="Learn SQL", description="Complete a course", addresses_gap="SQL")],
            confidence=inp.analysis.confidence,
            grounded_on=["skill_gap_analysis.current"],
        )


def _profile_and_goal():
    profile = ProfileSnapshot(
        user_id=uuid4(), background="CS grad", education="BSc CS", experience="intern", skills=["HTML"]
    )
    goal = GoalSnapshot(user_id=uuid4(), target_role="Data Scientist")
    return profile, goal


def test_start_dispatches_both_agents_and_pauses_for_approval():
    """Real graph routing: run_skill_gap_agent -> run_roadmap_agent ->
    await_roadmap_approval, then a genuine LangGraph interrupt — not a
    fake that skips straight to a canned "awaiting_approval" status."""
    checkpointer = InMemorySaver()
    supervisor = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)
    profile, goal = _profile_and_goal()

    result = supervisor.start(
        thread_id=str(uuid4()), profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None
    )

    assert result["status"] == "awaiting_approval"
    assert result["analysis"].summary.startswith("Gap analysis for Data Scientist")
    assert result["interrupt"]["roadmap_items"][0]["title"] == "Learn SQL"


def test_resume_approved_finalizes_with_the_real_roadmap_draft():
    checkpointer = InMemorySaver()
    thread_id = str(uuid4())
    supervisor = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)
    profile, goal = _profile_and_goal()
    supervisor.start(thread_id=thread_id, profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None)

    result = supervisor.resume(thread_id=thread_id, decision="approved")

    assert result["status"] == "approved"
    assert result["roadmap"].items[0].title == "Learn SQL"


def test_resume_rejected_produces_no_roadmap():
    checkpointer = InMemorySaver()
    thread_id = str(uuid4())
    supervisor = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)
    profile, goal = _profile_and_goal()
    supervisor.start(thread_id=thread_id, profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None)

    result = supervisor.resume(thread_id=thread_id, decision="rejected", feedback="not specific enough")

    assert result["status"] == "rejected"
    assert result["roadmap"] is None


def test_resume_works_from_a_genuinely_different_supervisor_instance():
    """The point of checkpointing: approval doesn't have to come from the
    same CareerSupervisor object (or process) that started the run — only
    the same checkpointer backend and thread_id. Mirrors the real-Postgres
    verification done manually during development, as an automated,
    permanent regression test."""
    checkpointer = InMemorySaver()
    thread_id = str(uuid4())
    profile, goal = _profile_and_goal()

    starter = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)
    starter.start(thread_id=thread_id, profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None)
    del starter  # simulate the starting process/object being gone entirely

    resumer = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)
    result = resumer.resume(thread_id=thread_id, decision="approved")

    assert result["status"] == "approved"
    assert result["roadmap"].items[0].title == "Learn SQL"


def test_two_different_threads_do_not_interfere():
    checkpointer = InMemorySaver()
    profile, goal = _profile_and_goal()
    supervisor = CareerSupervisor(_FakeSkillGapAnalysisAgent(), _FakeRoadmapAgent(), checkpointer)

    thread_a, thread_b = str(uuid4()), str(uuid4())
    supervisor.start(thread_id=thread_a, profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None)
    supervisor.start(thread_id=thread_b, profile=profile, goal=goal, previous_analysis=None, previous_roadmap=None)

    reject_a = supervisor.resume(thread_id=thread_a, decision="rejected")
    approve_b = supervisor.resume(thread_id=thread_b, decision="approved")

    assert reject_a["status"] == "rejected"
    assert approve_b["status"] == "approved"
