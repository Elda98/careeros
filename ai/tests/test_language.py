"""Real verification that locale actually reaches the system prompt sent
to the LLM — not just that the Input DTOs have a `locale` field. Captures
the actual messages passed to `.invoke()` for each of the 4 agents' real
graph code (scripted fakes only stand in for the LLM response, same
pattern as every other agent test in this suite).
"""

from __future__ import annotations

from uuid import uuid4

from careeros_ai.agents.cv_feedback import CVFeedbackAgent
from careeros_ai.agents.interview import InterviewCoachAgent, _NextQuestionResponse
from careeros_ai.agents.roadmap import RoadmapAgent
from careeros_ai.agents.skill_gap_analysis import SkillGapAnalysisAgent, _GapsResponse
from careeros_ai.capabilities.language import language_instruction
from careeros_ai.knowledge.contracts import (
    CVFeedbackInput,
    CVFeedbackItem,
    GoalSnapshot,
    InterviewConfig,
    InterviewExperienceLevel,
    InterviewQuestionCategory,
    InterviewTurnInput,
    InterviewType,
    ProfileSnapshot,
    RoadmapInput,
    RoadmapItemContent,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)


def test_language_instruction_is_distinct_and_real_per_locale():
    ar = language_instruction("ar")
    en = language_instruction("en")
    assert ar != en
    assert "Arabic" in ar
    assert "English" in en
    # An unknown locale degrades to English rather than silently omitting
    # any instruction at all.
    assert language_instruction("fr") == en


class _CapturingLLM:
    """Records every message list it's ever invoked with, so a test can
    assert on the exact system prompt actually sent — not just that a
    locale field exists somewhere in the input DTO."""

    def __init__(self, response):
        self._response = response
        self.captured_messages: list[list] = []

    def bind_tools(self, tools):
        return self

    def with_structured_output(self, schema):
        return self

    def invoke(self, messages):
        self.captured_messages.append(list(messages))
        return self._response


def test_skill_gap_analysis_system_prompt_carries_the_arabic_instruction():
    class _ToolFreeAgentLLM(_CapturingLLM):
        def bind_tools(self, tools):
            self._mode = "reason"
            return self

        def with_structured_output(self, schema):
            self._mode = "structured"
            return self

        def invoke(self, messages):
            self.captured_messages.append(list(messages))
            if getattr(self, "_mode", None) == "reason":
                from langchain_core.messages import AIMessage

                return AIMessage(content="Ready.")
            return self._response

    llm = _ToolFreeAgentLLM(_GapsResponse(gaps=[SkillGap(skill="SQL", description="Missing")], summary="Missing SQL."))
    agent = SkillGapAnalysisAgent(llm=llm)

    profile = ProfileSnapshot(user_id=uuid4(), background="CS grad", education="BSc", experience="intern", skills=["HTML"])
    goal = GoalSnapshot(user_id=uuid4(), target_role="Data Scientist")
    agent.run(SkillGapAnalysisInput(profile=profile, goal=goal, locale="ar"))

    system_messages = [m.content for batch in llm.captured_messages for m in batch if m.__class__.__name__ == "SystemMessage"]
    assert any("Arabic" in content for content in system_messages)


def test_roadmap_system_prompt_carries_the_arabic_instruction():
    from careeros_ai.agents.roadmap import _ItemsResponse as RoadmapItemsResponse

    llm = _CapturingLLM(
        RoadmapItemsResponse(items=[RoadmapItemContent(title="Learn SQL", description="...", addresses_gap="SQL")])
    )
    agent = RoadmapAgent(llm=llm)

    analysis = SkillGapAnalysisOutput(
        gaps=[SkillGap(skill="SQL", description="Missing")], summary="Missing SQL.", confidence="high"
    )
    agent.run(RoadmapInput(analysis=analysis, locale="ar"))

    system_messages = [m.content for batch in llm.captured_messages for m in batch if m.__class__.__name__ == "SystemMessage"]
    assert any("Arabic" in content for content in system_messages)


def test_interview_turn_system_prompt_carries_the_arabic_instruction():
    llm = _CapturingLLM(_NextQuestionResponse(question="Tell me about yourself.", category=InterviewQuestionCategory.INTRO))
    agent = InterviewCoachAgent(llm=llm)

    profile = ProfileSnapshot(user_id=uuid4(), background="", education="", experience="", skills=[])
    goal = GoalSnapshot(user_id=uuid4(), target_role="Backend Engineer")
    config = InterviewConfig(
        target_role="Backend Engineer", experience_level=InterviewExperienceLevel.ENTRY, interview_type=InterviewType.MIXED
    )
    agent.run_turn(InterviewTurnInput(profile=profile, goal=goal, config=config, locale="ar"))

    system_messages = [m.content for batch in llm.captured_messages for m in batch if m.__class__.__name__ == "SystemMessage"]
    assert any("Arabic" in content for content in system_messages)


def test_cv_feedback_system_prompt_carries_the_arabic_instruction():
    from careeros_ai.agents.cv_feedback import _ItemsResponse as CVItemsResponse

    llm = _CapturingLLM(
        CVItemsResponse(items=[CVFeedbackItem(category="factual_structural", note="...", relevance_to_goal="...")])
    )
    agent = CVFeedbackAgent(llm=llm)

    goal = GoalSnapshot(user_id=uuid4(), target_role="Data Scientist")
    agent.run(CVFeedbackInput(goal=goal, document_text="My CV text.", locale="ar"))

    system_messages = [m.content for batch in llm.captured_messages for m in batch if m.__class__.__name__ == "SystemMessage"]
    assert any("Arabic" in content for content in system_messages)
