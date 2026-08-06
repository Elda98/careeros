"""Fakes satisfying the same interface as careeros_ai's real agents
(`.run(input) -> output`), used via FastAPI dependency overrides so router
tests never call a live LLM. Each fake still exercises the real DTO shapes
(careeros_ai.knowledge.contracts) so a schema drift between the fakes and
the real agents would be caught by type-checking, not silently masked.
"""

from __future__ import annotations

from careeros_ai.knowledge.contracts import (
    ConfidenceLevel,
    CVFeedbackInput,
    CVFeedbackItem,
    CVFeedbackOutput,
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
