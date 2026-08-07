"""Exercises the REAL SkillGapAnalysisAgent graph (ReAct loop, tool
execution, the content-validation retry loop) with a scripted fake LLM —
no live Groq call, but the actual graph code (careeros_ai/agents/
skill_gap_analysis.py) runs unmodified. Complements the manual live-Groq
verification done during development (documented in the root README) with
a permanent, deterministic regression test: if a future change breaks
the tool-calling routing, the retry loop, or the round/retry bounds,
this fails instead of silently degrading.
"""

from __future__ import annotations

from uuid import uuid4

from langchain_core.messages import AIMessage

from careeros_ai.agents.skill_gap_analysis import MAX_RETRIES, MAX_TOOL_ROUNDS, SkillGapAnalysisAgent, _GapsResponse
from careeros_ai.knowledge.contracts import ConfidenceLevel, GoalSnapshot, ProfileSnapshot, SkillGap, SkillGapAnalysisInput


class _FakeToolCallingLLM:
    """Satisfies exactly the interface the real graph calls:
    `llm.bind_tools(...).invoke(messages)` for reasoning, and
    `llm.with_structured_output(...).invoke(messages)` for the final
    structured answer. Each call consumes the next scripted response."""

    def __init__(self, reason_responses, structured_responses):
        self._reason_responses = iter(reason_responses)
        self._structured_responses = iter(structured_responses)
        self._mode = None

    def bind_tools(self, tools):
        self._mode = "reason"
        return self

    def with_structured_output(self, schema):
        self._mode = "structured"
        return self

    def invoke(self, messages):
        if self._mode == "reason":
            return next(self._reason_responses)
        return next(self._structured_responses)


def _tool_call_message(tool_name: str, args: dict) -> AIMessage:
    return AIMessage(content="", tool_calls=[{"name": tool_name, "args": args, "id": "call_1", "type": "tool_call"}])


def _final_message() -> AIMessage:
    return AIMessage(content="I'm ready to answer.")


def _input() -> SkillGapAnalysisInput:
    profile = ProfileSnapshot(
        user_id=uuid4(), background="CS grad", education="BSc CS", experience="intern", skills=["HTML"]
    )
    goal = GoalSnapshot(user_id=uuid4(), target_role="Data Scientist")
    return SkillGapAnalysisInput(profile=profile, goal=goal, previous_version=None)


def test_react_loop_actually_calls_a_tool_before_answering():
    """A tool-call round genuinely happens: reason -> execute_tools ->
    reason -> generate, not skipped straight to the final answer."""
    llm = _FakeToolCallingLLM(
        reason_responses=[
            _tool_call_message("normalize_skill", {"skill_name": "Python"}),
            _final_message(),
        ],
        structured_responses=[
            _GapsResponse(gaps=[SkillGap(skill="Python", description="Missing", severity=ConfidenceLevel.HIGH)], summary="Missing Python.")
        ],
    )
    agent = SkillGapAnalysisAgent(llm=llm)

    output = agent.run(_input())

    assert output.gaps[0].skill == "Python"
    assert output.summary == "Missing Python."


def test_retry_loop_actually_fires_on_an_invalid_first_answer():
    """The first structured answer is invalid (empty gaps, summary doesn't
    say so) — the real validation gate must reject it and loop back to
    reasoning for a second attempt, not silently accept the bad answer."""
    llm = _FakeToolCallingLLM(
        reason_responses=[_final_message(), _final_message()],  # initial + one retry round
        structured_responses=[
            _GapsResponse(gaps=[], summary="Here is my analysis."),  # invalid: empty gaps, no "no gap" wording
            _GapsResponse(gaps=[SkillGap(skill="SQL", description="Missing", severity=ConfidenceLevel.MEDIUM)], summary="Missing SQL."),
        ],
    )
    agent = SkillGapAnalysisAgent(llm=llm)

    output = agent.run(_input())

    # The SECOND (valid) answer won — proving the retry genuinely re-ran
    # generation rather than keeping the first, invalid one.
    assert output.summary == "Missing SQL."
    assert output.gaps[0].skill == "SQL"
    assert output.confidence != ConfidenceLevel.LOW  # a successful retry is not penalized


def test_exhausting_retries_falls_back_to_low_confidence_not_a_crash():
    """Every attempt is invalid — MAX_RETRIES=2 more attempts are made
    (3 total), then the agent accepts what it has rather than raising,
    but honestly marks it LOW confidence with the reason stated."""
    invalid = _GapsResponse(gaps=[], summary="Inconclusive.")
    llm = _FakeToolCallingLLM(
        reason_responses=[_final_message() for _ in range(MAX_RETRIES + 2)],
        structured_responses=[invalid for _ in range(MAX_RETRIES + 2)],
    )
    agent = SkillGapAnalysisAgent(llm=llm)

    output = agent.run(_input())

    assert output.confidence == ConfidenceLevel.LOW
    assert "retr" in output.confidence_reason.lower()


def test_tool_round_budget_is_actually_enforced():
    """The LLM never stops requesting tools — the graph must still
    terminate at MAX_TOOL_ROUNDS rather than looping forever."""
    always_tool_call = [_tool_call_message("normalize_skill", {"skill_name": "Python"}) for _ in range(MAX_TOOL_ROUNDS + 3)]
    llm = _FakeToolCallingLLM(
        reason_responses=always_tool_call,
        structured_responses=[
            _GapsResponse(gaps=[SkillGap(skill="Python", description="Missing", severity=ConfidenceLevel.HIGH)], summary="Missing Python.")
        ],
    )
    agent = SkillGapAnalysisAgent(llm=llm)

    output = agent.run(_input())  # must terminate, not hang or hit LangGraph's recursion limit

    assert output.summary == "Missing Python."
