"""Exercises the REAL InterviewCoachAgent graphs (turn routing, the
follow-up/next-question/conclude conditional edges, the MAX_MAIN_QUESTIONS
loop bound, and the report's real-averaged scoring) with a scripted fake
LLM — no live Groq call, but the actual graph code
(careeros_ai/agents/interview.py) runs unmodified.
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from careeros_ai.agents.base import GenerationFailed
from careeros_ai.agents.interview import (
    MAX_MAIN_QUESTIONS,
    InterviewCoachAgent,
    _FollowUpResponse,
    _NextQuestionResponse,
    _ReportBody,
)
from careeros_ai.knowledge.contracts import (
    AnswerFeedback,
    ConfidenceLevel,
    GoalSnapshot,
    InterviewConfig,
    InterviewExchange,
    InterviewExperienceLevel,
    InterviewQuestionCategory,
    InterviewReportInput,
    InterviewType,
    ProfileSnapshot,
    InterviewTurnInput,
)


class _FakeStructuredLLM:
    """Satisfies the one interface every node in this agent calls:
    `llm.with_structured_output(schema).invoke(messages)`. Each call
    consumes the next scripted response, regardless of which schema was
    requested — same convention as SkillGapAnalysisAgent's test fake."""

    def __init__(self, responses):
        self._responses = iter(responses)

    def with_structured_output(self, schema):
        return self

    def invoke(self, messages):
        return next(self._responses)


def _profile() -> ProfileSnapshot:
    return ProfileSnapshot(user_id=uuid4(), background="CS grad", education="BSc CS", experience="intern", skills=["Python"])


def _goal() -> GoalSnapshot:
    return GoalSnapshot(user_id=uuid4(), target_role="Backend Engineer")


def _config() -> InterviewConfig:
    return InterviewConfig(
        target_role="Backend Engineer",
        experience_level=InterviewExperienceLevel.ENTRY,
        interview_type=InterviewType.MIXED,
    )


def test_first_turn_asks_opening_question_without_analyzing_anything():
    llm = _FakeStructuredLLM(
        [_NextQuestionResponse(question="Tell me about yourself.", category=InterviewQuestionCategory.INTRO)]
    )
    agent = InterviewCoachAgent(llm=llm)

    output = agent.run_turn(InterviewTurnInput(profile=_profile(), goal=_goal(), config=_config()))

    assert output.answer_feedback is None
    assert output.action == "next_question"
    assert output.next_question == "Tell me about yourself."
    assert output.next_question_category == InterviewQuestionCategory.INTRO


def test_vague_answer_triggers_a_real_follow_up():
    llm = _FakeStructuredLLM(
        [
            AnswerFeedback(
                quality_score=40, clarity_score=35, relevance_score=50, structure_score=30,
                feedback_note="Too vague.", example_improved_answer="Be specific about your role.",
                warrants_follow_up=True, follow_up_reason="Didn't say what they actually did.",
            ),
            _FollowUpResponse(question="What specifically did you build?"),
        ]
    )
    agent = InterviewCoachAgent(llm=llm)

    output = agent.run_turn(
        InterviewTurnInput(
            profile=_profile(), goal=_goal(), config=_config(),
            pending_question="Tell me about a project.",
            pending_question_category=InterviewQuestionCategory.BEHAVIORAL,
            pending_answer="I worked on a team project.",
        )
    )

    assert output.answer_feedback.quality_score == 40
    assert output.action == "follow_up"
    assert output.next_question == "What specifically did you build?"
    assert output.next_question_category == InterviewQuestionCategory.FOLLOW_UP


def test_never_follows_up_on_an_already_follow_up_question():
    """The graph must not chain follow-ups indefinitely — even if the LLM
    flags warrants_follow_up again, a question that is ITSELF a follow-up
    routes to the next main question instead."""
    llm = _FakeStructuredLLM(
        [
            AnswerFeedback(
                quality_score=60, clarity_score=60, relevance_score=60, structure_score=60,
                feedback_note="Still vague.", example_improved_answer="...",
                warrants_follow_up=True, follow_up_reason="Still vague.",
            ),
            _NextQuestionResponse(question="What's your experience with SQL?", category=InterviewQuestionCategory.TECHNICAL),
        ]
    )
    agent = InterviewCoachAgent(llm=llm)

    output = agent.run_turn(
        InterviewTurnInput(
            profile=_profile(), goal=_goal(), config=_config(),
            pending_question="What specifically did you build?",
            pending_question_category=InterviewQuestionCategory.FOLLOW_UP,
            pending_answer="Some backend stuff.",
        )
    )

    assert output.action == "next_question"
    assert output.next_question_category == InterviewQuestionCategory.TECHNICAL


def test_max_main_questions_bound_forces_conclude_not_an_infinite_loop():
    history = [
        InterviewExchange(category=InterviewQuestionCategory.BEHAVIORAL, question=f"Q{i}", answer=f"A{i}")
        for i in range(MAX_MAIN_QUESTIONS - 1)
    ]
    llm = _FakeStructuredLLM(
        [
            AnswerFeedback(
                quality_score=80, clarity_score=80, relevance_score=80, structure_score=80,
                feedback_note="Good.", example_improved_answer="...",
                warrants_follow_up=False,
            ),
        ]
    )
    agent = InterviewCoachAgent(llm=llm)

    output = agent.run_turn(
        InterviewTurnInput(
            profile=_profile(), goal=_goal(), config=_config(),
            history=history,
            pending_question=f"Q{MAX_MAIN_QUESTIONS - 1}",
            pending_question_category=InterviewQuestionCategory.TECHNICAL,
            pending_answer="A final answer.",
        )
    )

    assert output.action == "conclude"
    assert output.next_question == ""


def test_report_overall_score_is_a_real_average_not_an_llm_invented_number():
    history = [
        InterviewExchange(
            category=InterviewQuestionCategory.BEHAVIORAL, question="Q1", answer="A1",
            feedback=AnswerFeedback(
                quality_score=80, clarity_score=90, relevance_score=85, structure_score=70,
                feedback_note="Good.", example_improved_answer="...", warrants_follow_up=False,
            ),
        ),
        InterviewExchange(
            category=InterviewQuestionCategory.TECHNICAL, question="Q2", answer="A2",
            feedback=AnswerFeedback(
                quality_score=60, clarity_score=70, relevance_score=65, structure_score=50,
                feedback_note="OK.", example_improved_answer="...", warrants_follow_up=False,
            ),
        ),
    ]
    # The fake LLM claims a wildly different technical_readiness (99) —
    # answer_quality/communication/structure must NOT come from the LLM at
    # all, only from the real per-answer averages above.
    llm = _FakeStructuredLLM(
        [
            _ReportBody(
                summary="Solid effort overall.",
                strengths=["Clear communication"],
                areas_to_improve=["More structure"],
                recommended_practice=["Practice STAR format"],
                next_interview_recommendation="Try a technical mock next.",
                technical_readiness=90,
            )
        ]
    )
    agent = InterviewCoachAgent(llm=llm)

    output = agent.run_report(InterviewReportInput(profile=_profile(), goal=_goal(), config=_config(), history=history))

    assert output.answer_quality == round((80 + 60) / 2)
    assert output.communication == round((90 + 70) / 2)
    assert output.structure == round((70 + 50) / 2)
    assert output.technical_readiness == 90
    assert output.overall_score == round((70 + 80 + 60 + 90) / 4)
    assert output.confidence == ConfidenceLevel.MEDIUM  # exactly 2 answered questions


def test_report_refuses_to_run_with_no_history():
    agent = InterviewCoachAgent(llm=_FakeStructuredLLM([]))
    with pytest.raises(GenerationFailed):
        agent.run_report(InterviewReportInput(profile=_profile(), goal=_goal(), config=_config(), history=[]))
