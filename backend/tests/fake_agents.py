"""Fakes satisfying the same interface as careeros_ai's real agents
(`.run(input) -> output`), used via FastAPI dependency overrides so router
tests never call a live LLM. Each fake still exercises the real DTO shapes
(careeros_ai.knowledge.contracts) so a schema drift between the fakes and
the real agents would be caught by type-checking, not silently masked.
"""

from __future__ import annotations

from careeros_ai.knowledge.contracts import (
    AnswerFeedback,
    ConfidenceLevel,
    CVFeedbackInput,
    CVFeedbackItem,
    CVFeedbackOutput,
    InterviewQuestionCategory,
    InterviewReportInput,
    InterviewReportOutput,
    InterviewTurnInput,
    InterviewTurnOutput,
    RoadmapInput,
    RoadmapItemContent,
    RoadmapOutput,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)


class FakeSkillGapAnalysisAgent:
    def run(self, inp: SkillGapAnalysisInput) -> SkillGapAnalysisOutput:
        return SkillGapAnalysisOutput(
            gaps=[SkillGap(skill="SQL", description="No database experience listed", severity=ConfidenceLevel.MEDIUM)],
            summary=f"Gap analysis for target role: {inp.goal.target_role}",
            confidence=ConfidenceLevel.HIGH,
            confidence_reason="fake agent — deterministic output",
            grounded_on=["profile.skills", "goal.target_role"],
        )


class FakeRoadmapAgent:
    def run(self, inp: RoadmapInput) -> RoadmapOutput:
        return RoadmapOutput(
            items=[
                RoadmapItemContent(
                    title="Learn SQL basics",
                    description="Complete a beginner SQL course",
                    addresses_gap="SQL",
                )
            ],
            confidence=inp.analysis.confidence,
            grounded_on=["skill_gap_analysis.current"],
        )


class FakeCVFeedbackAgent:
    def run(self, inp: CVFeedbackInput) -> CVFeedbackOutput:
        return CVFeedbackOutput(
            items=[
                CVFeedbackItem(
                    category="factual_structural",
                    note="Missing a summary section",
                    relevance_to_goal=inp.goal.target_role,
                )
            ],
            confidence=ConfidenceLevel.HIGH,
        )


# Deterministic bound so tests can walk a full session to conclusion in a
# small, fixed number of turns — mirrors InterviewCoachAgent's own
# MAX_MAIN_QUESTIONS, just smaller.
FAKE_INTERVIEW_MAX_QUESTIONS = 3


class FakeInterviewCoachAgent:
    """Never asks a follow-up (keeps test transcripts short and
    predictable) — concludes after FAKE_INTERVIEW_MAX_QUESTIONS main
    questions, same shape as the real agent's MAX_MAIN_QUESTIONS bound."""

    def run_turn(self, inp: InterviewTurnInput) -> InterviewTurnOutput:
        if not inp.pending_answer:
            return InterviewTurnOutput(
                action="next_question",
                next_question="Tell me about yourself.",
                next_question_category=InterviewQuestionCategory.INTRO,
                grounded_on=["goal.target_role", "profile.skills"],
            )

        feedback = AnswerFeedback(
            quality_score=75, clarity_score=80, relevance_score=70, structure_score=65,
            feedback_note="Solid answer — fake agent, deterministic output.",
            example_improved_answer="Consider adding a specific, measurable result.",
            warrants_follow_up=False,
        )
        main_questions_asked = sum(1 for h in inp.history if h.category != InterviewQuestionCategory.FOLLOW_UP) + 1
        if main_questions_asked >= FAKE_INTERVIEW_MAX_QUESTIONS:
            return InterviewTurnOutput(answer_feedback=feedback, action="conclude")
        return InterviewTurnOutput(
            answer_feedback=feedback,
            action="next_question",
            next_question=f"Fake question {main_questions_asked + 1}",
            next_question_category=InterviewQuestionCategory.BEHAVIORAL,
            grounded_on=["goal.target_role", "profile.skills"],
        )

    def run_report(self, inp: InterviewReportInput) -> InterviewReportOutput:
        graded = [h.feedback for h in inp.history if h.feedback is not None]
        answered = len(graded)
        avg_quality = round(sum(f.quality_score for f in graded) / answered) if answered else 0
        if answered >= 4:
            confidence = ConfidenceLevel.HIGH
        elif answered >= 2:
            confidence = ConfidenceLevel.MEDIUM
        else:
            confidence = ConfidenceLevel.LOW
        return InterviewReportOutput(
            overall_score=avg_quality,
            summary="Fake interview report — deterministic output for tests.",
            answer_quality=avg_quality,
            communication=avg_quality,
            structure=avg_quality,
            technical_readiness=avg_quality,
            strengths=["Clear communication"],
            areas_to_improve=["More specific examples"],
            recommended_practice=["Practice the STAR format"],
            next_interview_recommendation="Try a technical-focused round next.",
            confidence=confidence,
            confidence_reason="fake agent — deterministic output",
            grounded_on=["interview_session.transcript", "goal.target_role"],
        )


class _FakeLLMResponse:
    def __init__(self, content: str):
        self.content = content


class FakeExplainabilityLLM:
    """Satisfies the one method `careeros_ai.capabilities.explainability.explain_output`
    calls (`.invoke(messages) -> object with .content`) without a live LLM."""

    def invoke(self, messages) -> _FakeLLMResponse:
        return _FakeLLMResponse("fake explanation — deterministic output for tests")


class FakeClerkAdminClient:
    """No real network call in tests — records what was deleted so a test
    can assert the Clerk-side deletion was actually invoked, not skipped."""

    def __init__(self):
        self.deleted_user_ids: list[str] = []

    async def delete_user(self, clerk_user_id: str) -> None:
        self.deleted_user_ids.append(clerk_user_id)


class FailingClerkAdminClient:
    """Simulates Clerk's API being unreachable/erroring, to test that local
    data is never touched when the Clerk-side deletion fails (see
    settings.py's `delete_account` ordering rationale)."""

    async def delete_user(self, clerk_user_id: str) -> None:
        from app.core.clerk_admin import ClerkAdminError

        raise ClerkAdminError("simulated Clerk API failure")


class FakeCareerSupervisor:
    """Satisfies the same interface as `careeros_ai.orchestration.supervisor
    .CareerSupervisor` (`.start()`/`.resume()`) without a real LangGraph
    graph, real LLM, or real checkpointer — tracks per-thread_id state in a
    plain dict, enough to exercise `/career-plan/*`'s start-then-approve or
    start-then-reject flows deterministically in tests."""

    def __init__(self):
        self._threads: dict[str, dict] = {}

    def start(self, *, thread_id, profile, goal, previous_analysis, previous_roadmap) -> dict:
        analysis = FakeSkillGapAnalysisAgent().run(
            SkillGapAnalysisInput(profile=profile, goal=goal, previous_version=previous_analysis)
        )
        roadmap_draft = FakeRoadmapAgent().run(
            RoadmapInput(analysis=analysis, previous_version=previous_roadmap)
        )
        self._threads[thread_id] = {"analysis": analysis, "roadmap_draft": roadmap_draft}
        return {
            "status": "awaiting_approval",
            "interrupt": {
                "type": "roadmap_approval",
                "roadmap_items": [item.model_dump() for item in roadmap_draft.items],
                "confidence": roadmap_draft.confidence,
            },
            "analysis": analysis,
        }

    def resume(self, *, thread_id, decision, feedback="") -> dict:
        state = self._threads.pop(thread_id, None)
        if state is None:
            raise RuntimeError(f"no career-plan run awaiting approval for thread_id={thread_id!r}")
        if decision == "approved":
            return {"status": "approved", "analysis": state["analysis"], "roadmap": state["roadmap_draft"]}
        return {"status": "rejected", "analysis": state["analysis"], "roadmap": None}
