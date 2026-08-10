"""Skill-Gap Analysis Agent (PRD §25.4, §27.3).

Single responsibility: compare Profile and active Goal to produce a
skill-gap assessment. Owns (writes) exactly one entity: Skill-Gap Analysis.
Reads: Profile, active Goal, its own previous Analysis version (SAS §25.4).

Internally implements a ReAct (Reason + Act) loop: the LLM is bound to real
tools (`careeros_ai.tools`) and can call them to ground its reasoning in
computed facts (canonical skill names, role-relevance, gap coverage) before
committing to a final structured answer, rather than answering from a single
unexamined prompt. This is the flagship agent for tool calling and explicit
reasoning in this codebase — the other two agents (Roadmap, CV Feedback)
stay on the simpler generate->finalize shape deliberately, since spreading
the same pattern thin across all three would not make any of them more real.
"""

from __future__ import annotations

from typing import Annotated, ClassVar, TypedDict

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages
from pydantic import BaseModel

from careeros_ai.agents.base import BaseAgent, GenerationFailed
from careeros_ai.capabilities.confidence import calibrate_profile_completeness, min_confidence
from careeros_ai.capabilities.grounding import format_grounding_refs, require_nonempty_grounding
from careeros_ai.capabilities.language import language_instruction
from careeros_ai.knowledge.contracts import (
    ConfidenceLevel,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)
from careeros_ai.llm import default_llm
from careeros_ai.observability import log_event
from careeros_ai.tools import ALL_TOOLS

_SYSTEM_PROMPT = (
    "You are the Skill-Gap Analysis capability of CareerOS. Compare the user's profile "
    "against their stated goal and identify specific, named missing or underdeveloped "
    "skills or experience — never only an aggregate score (PRD FR-AICC-2). Be concrete: "
    "each gap must be something the user could act on. Do not recommend actions — that is "
    "a separate agent's responsibility (BR-AI-1: advisory, not action-taking).\n\n"
    "You have tools available to ground your assessment in real reference data: "
    "normalize_skill (canonical names + related skills), assess_role_relevance (is a "
    "skill actually core to this role?), and compute_gap_coverage (have you covered the "
    "role's core reference skills?). Use them where they would sharpen a judgment you'd "
    "otherwise be guessing at — you do not need to call every tool for every gap. When "
    "you are done reasoning, respond with plain text summarizing your conclusion (no more "
    "tool calls) so the next step can turn it into the final structured analysis."
)

_TOOLS_BY_NAME = {t.name: t for t in ALL_TOOLS}

# Two fixed-shape fallback strings this agent builds directly (never
# through the LLM) for the retry-exhaustion edge case — same reasoning as
# capabilities/confidence.py's own local template dict: this needs its own
# tiny translation, not the LLM-prompt-level language_instruction().
_RETRY_EXHAUSTED_SUFFIX = {
    "en": " Additionally, the analysis did not pass content validation after {retries} retries.",
    "ar": " كذلك، لم يجتز التحليل التحقق من المحتوى بعد {retries} محاولات إعادة.",
}
_UNRELIABLE_SUMMARY_FALLBACK = {
    "en": "Unable to produce a reliable summary after retrying.",
    "ar": "تعذّر إنتاج ملخص موثوق بعد إعادة المحاولة.",
}

# Bounds that make this a real, terminating loop rather than an accidental
# infinite one — both are shared graph state, not hardcoded into a single
# node, so future nodes can see how much of the budget has been spent.
MAX_TOOL_ROUNDS = 4
MAX_RETRIES = 2


class _GapsResponse(BaseModel):
    """Structured-output schema the LLM call is constrained to."""

    gaps: list[SkillGap]
    summary: str


class _State(TypedDict):
    input: SkillGapAnalysisInput
    messages: Annotated[list[BaseMessage], add_messages]
    tool_rounds: int
    retry_count: int
    llm_gaps: list[SkillGap]
    llm_summary: str
    grounded_on: list[str]
    output: SkillGapAnalysisOutput | None


def _assemble_context(state: _State) -> _State:
    inp = state["input"]
    prompt = (
        f"Profile: background={inp.profile.background!r}, education={inp.profile.education!r}, "
        f"experience={inp.profile.experience!r}, skills={inp.profile.skills!r}\n"
        f"Goal: target_role={inp.goal.target_role!r}, target_field={inp.goal.target_field!r}\n"
    )
    system_prompt = f"{_SYSTEM_PROMPT}\n\n{language_instruction(inp.locale)}"
    return {
        **state,
        "messages": [SystemMessage(content=system_prompt), HumanMessage(content=prompt)],
        "tool_rounds": 0,
        "retry_count": 0,
    }


def _reason(state: _State, llm: ChatGroq) -> _State:
    """The ReAct 'Reason' step: the LLM sees the full transcript so far
    (original prompt + any tool observations) and either requests another
    tool call or signals it's ready to finalize by responding without one."""
    bound_llm = llm.bind_tools(ALL_TOOLS)
    response = bound_llm.invoke(state["messages"])
    log_event(
        "agent.reason",
        agent="SkillGapAnalysisAgent",
        tool_calls=len(response.tool_calls) if isinstance(response, AIMessage) else 0,
        round=state["tool_rounds"],
    )
    return {**state, "messages": [response]}


def _execute_tools(state: _State) -> _State:
    """The ReAct 'Act' step: actually run whatever tool(s) the last message
    requested and feed real results back in as ToolMessages — genuine
    execution, not the LLM's own guess at what a tool would return."""
    last = state["messages"][-1]
    tool_messages: list[ToolMessage] = []
    for call in last.tool_calls:  # type: ignore[union-attr]
        tool_fn = _TOOLS_BY_NAME.get(call["name"])
        if tool_fn is None:
            result = f"Unknown tool '{call['name']}' — no such tool exists."
        else:
            try:
                result = tool_fn.invoke(call["args"])
            except Exception as exc:  # noqa: BLE001 — deliberately broad: a tool failure becomes an
                # observation the ReAct loop can react to, not a crash of the whole graph.
                result = f"Tool '{call['name']}' failed: {exc}"
        log_event("agent.tool_call", agent="SkillGapAnalysisAgent", tool=call["name"], args=call["args"])
        tool_messages.append(ToolMessage(content=str(result), tool_call_id=call["id"]))
    return {**state, "messages": tool_messages, "tool_rounds": state["tool_rounds"] + 1}


def _route_after_reason(state: _State) -> str:
    """Conditional edge: keep reasoning (tool calls requested, budget left),
    or move on to producing the final structured answer."""
    last = state["messages"][-1]
    has_tool_calls = isinstance(last, AIMessage) and bool(last.tool_calls)
    if has_tool_calls and state["tool_rounds"] < MAX_TOOL_ROUNDS:
        return "execute_tools"
    return "generate"


def _generate(state: _State, llm: ChatGroq) -> _State:
    inp = state["input"]
    grounded_on = format_grounding_refs(
        profile_fields=["background", "education", "experience", "skills"],
        goal_field=True,
        prior_version=inp.previous_version is not None,
    )
    require_nonempty_grounding(grounded_on)

    structured_llm = llm.with_structured_output(_GapsResponse)
    # The ReAct transcript (original prompt + tool observations + the
    # model's own reasoning) is the actual context for the final answer —
    # not a fresh, context-free prompt, so tool-grounded reasoning above
    # genuinely informs the structured output rather than being discarded.
    closing_instruction = HumanMessage(
        content="Based on the above, produce the final skill-gap analysis now."
    )
    try:
        result: _GapsResponse = structured_llm.invoke([*state["messages"], closing_instruction])
    except Exception as exc:  # noqa: BLE001 — deliberately broad: converts to an empty result that
        # the validate/retry loop below handles, rather than raising immediately and losing the
        # chance for a subsequent attempt to succeed.
        log_event("agent.generate_error", agent="SkillGapAnalysisAgent", error=str(exc))
        return {**state, "llm_gaps": [], "llm_summary": "", "grounded_on": grounded_on}

    return {**state, "llm_gaps": result.gaps, "llm_summary": result.summary, "grounded_on": grounded_on}


def _validate(state: _State) -> _State:
    """A real content-consistency gate, not just schema validation (Pydantic
    already guarantees the shape). An empty gap list with a summary that
    doesn't actually say "no gaps" is treated as a malformed answer worth
    retrying, not silently accepted."""
    summary_says_no_gaps = "no gap" in state["llm_summary"].lower() or "no significant gap" in state["llm_summary"].lower()
    is_valid = bool(state["llm_summary"].strip()) and (bool(state["llm_gaps"]) or summary_says_no_gaps)
    return {**state, "retry_count": state["retry_count"] if is_valid else state["retry_count"] + 1}


def _route_after_validate(state: _State) -> str:
    """Retry loop's conditional edge: loop back to reasoning (with the
    failure surfaced) while budget remains, else accept what's there rather
    than hard-failing the whole request over one malformed round."""
    summary_says_no_gaps = "no gap" in state["llm_summary"].lower() or "no significant gap" in state["llm_summary"].lower()
    is_valid = bool(state["llm_summary"].strip()) and (bool(state["llm_gaps"]) or summary_says_no_gaps)
    if is_valid or state["retry_count"] > MAX_RETRIES:
        return "calibrate"
    return "retry"


def _retry(state: _State) -> _State:
    log_event("agent.retry", agent="SkillGapAnalysisAgent", attempt=state["retry_count"])
    note = HumanMessage(
        content=(
            "Your previous answer was empty or inconsistent (an empty gap list without "
            "explicitly concluding there are no gaps). Reconsider and answer again — use a "
            "tool if it would help you decide."
        )
    )
    return {**state, "messages": [note]}


def _calibrate(state: _State) -> _State:
    inp = state["input"]
    base_confidence, reason = calibrate_profile_completeness(inp.profile, inp.locale)
    llm_confidence = ConfidenceLevel.HIGH if state["llm_gaps"] else ConfidenceLevel.MEDIUM
    confidence = min_confidence(base_confidence, llm_confidence)
    # A round that exhausted its retry budget without ever validating is
    # never presented as more certain than LOW (BR-AI-4) — reflects the
    # genuine uncertainty left by an answer the validation gate rejected.
    if state["retry_count"] > MAX_RETRIES:
        confidence = ConfidenceLevel.LOW
        suffix = _RETRY_EXHAUSTED_SUFFIX.get(inp.locale, _RETRY_EXHAUSTED_SUFFIX["en"]).format(retries=MAX_RETRIES)
        reason = f"{reason}{suffix}"

    fallback_summary = _UNRELIABLE_SUMMARY_FALLBACK.get(inp.locale, _UNRELIABLE_SUMMARY_FALLBACK["en"])
    state["output"] = SkillGapAnalysisOutput(
        gaps=state["llm_gaps"],
        summary=state["llm_summary"] or fallback_summary,
        confidence=confidence,
        confidence_reason=reason,
        grounded_on=state["grounded_on"],
    )
    return state


def build_graph(llm: ChatGroq):
    graph = StateGraph(_State)
    graph.add_node("assemble_context", _assemble_context)
    graph.add_node("reason", lambda s: _reason(s, llm))
    graph.add_node("execute_tools", _execute_tools)
    graph.add_node("generate", lambda s: _generate(s, llm))
    graph.add_node("validate", _validate)
    graph.add_node("retry", _retry)
    graph.add_node("calibrate", _calibrate)

    graph.set_entry_point("assemble_context")
    graph.add_edge("assemble_context", "reason")
    graph.add_conditional_edges(
        "reason", _route_after_reason, {"execute_tools": "execute_tools", "generate": "generate"}
    )
    graph.add_edge("execute_tools", "reason")
    graph.add_edge("generate", "validate")
    graph.add_conditional_edges("validate", _route_after_validate, {"retry": "retry", "calibrate": "calibrate"})
    graph.add_edge("retry", "reason")
    graph.add_edge("calibrate", END)
    return graph.compile()


class SkillGapAnalysisAgent(BaseAgent):
    owns: ClassVar[str] = "skill_gap_analysis"
    reads: ClassVar[list[str]] = ["profile", "goal", "skill_gap_analysis.previous_version"]

    def __init__(self, llm: ChatGroq | None = None):
        self._llm = llm or default_llm()
        self._graph = build_graph(self._llm)

    def run(self, inp: SkillGapAnalysisInput) -> SkillGapAnalysisOutput:
        result_state = self._graph.invoke(
            {
                "input": inp,
                "messages": [],
                "tool_rounds": 0,
                "retry_count": 0,
                "llm_gaps": [],
                "llm_summary": "",
                "grounded_on": [],
                "output": None,
            },
            config={"recursion_limit": 50},
        )
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("Skill-Gap Analysis Agent produced no output.")
        return output
