"""Skill-Gap Analysis Agent (PRD §25.4, §27.3).

Single responsibility: compare Profile and active Goal to produce a
skill-gap assessment. Owns (writes) exactly one entity: Skill-Gap Analysis.
Reads: Profile, active Goal, its own previous Analysis version (SAS §25.4).
"""

from __future__ import annotations

from typing import Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import BaseModel

from careeros_ai.agents.base import BaseAgent, GenerationFailed
from careeros_ai.capabilities.confidence import calibrate_profile_completeness, min_confidence
from careeros_ai.capabilities.grounding import format_grounding_refs, require_nonempty_grounding
from careeros_ai.knowledge.contracts import (
    ConfidenceLevel,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)
from careeros_ai.llm import default_llm

_SYSTEM_PROMPT = (
    "You are the Skill-Gap Analysis capability of CareerOS. Compare the user's profile "
    "against their stated goal and identify specific, named missing or underdeveloped "
    "skills or experience — never only an aggregate score (PRD FR-AICC-2). Be concrete: "
    "each gap must be something the user could act on. Do not recommend actions — that is "
    "a separate agent's responsibility (BR-AI-1: advisory, not action-taking)."
)


class _GapsResponse(BaseModel):
    """Structured-output schema the LLM call is constrained to."""

    gaps: list[SkillGap]
    summary: str


class _State(TypedDict):
    input: SkillGapAnalysisInput
    llm_gaps: list[SkillGap]
    llm_summary: str
    grounded_on: list[str]
    output: Optional[SkillGapAnalysisOutput]


def _assemble_context(state: _State) -> _State:
    # Explicit no-op node: context is already assembled by the caller into
    # `input` (SAS §11.2 — the Knowledge -> Intelligence read happens before
    # this graph runs). Kept as its own step so future context-enrichment
    # logic (e.g., reading additional signals) has an obvious home.
    return state


def _generate(state: _State, llm: ChatGroq) -> _State:
    inp = state["input"]
    grounded_on = format_grounding_refs(
        profile_fields=["background", "education", "experience", "skills"],
        goal_field=True,
        prior_version=inp.previous_version is not None,
    )
    require_nonempty_grounding(grounded_on)

    structured_llm = llm.with_structured_output(_GapsResponse)
    prompt = (
        f"Profile: background={inp.profile.background!r}, education={inp.profile.education!r}, "
        f"experience={inp.profile.experience!r}, skills={inp.profile.skills!r}\n"
        f"Goal: target_role={inp.goal.target_role!r}, target_field={inp.goal.target_field!r}\n"
    )
    try:
        result: _GapsResponse = structured_llm.invoke(
            [SystemMessage(content=_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:  # noqa: BLE001 — any LLM failure is an honest
        # generation failure (BR-AI-5), never a partial or degraded result.
        raise GenerationFailed(f"Skill-Gap Analysis generation failed: {exc}") from exc

    state["llm_gaps"] = result.gaps
    state["llm_summary"] = result.summary
    state["grounded_on"] = grounded_on
    return state


def _calibrate(state: _State) -> _State:
    inp = state["input"]
    base_confidence, reason = calibrate_profile_completeness(inp.profile)
    llm_confidence = ConfidenceLevel.HIGH if state["llm_gaps"] else ConfidenceLevel.MEDIUM
    confidence = min_confidence(base_confidence, llm_confidence)

    state["output"] = SkillGapAnalysisOutput(
        gaps=state["llm_gaps"],
        summary=state["llm_summary"],
        confidence=confidence,
        confidence_reason=reason,
        grounded_on=state["grounded_on"],
    )
    return state


def build_graph(llm: ChatGroq):
    graph = StateGraph(_State)
    graph.add_node("assemble_context", _assemble_context)
    graph.add_node("generate", lambda s: _generate(s, llm))
    graph.add_node("calibrate", _calibrate)
    graph.set_entry_point("assemble_context")
    graph.add_edge("assemble_context", "generate")
    graph.add_edge("generate", "calibrate")
    graph.add_edge("calibrate", END)
    return graph.compile()


class SkillGapAnalysisAgent(BaseAgent):
    owns = "skill_gap_analysis"
    reads = ["profile", "goal", "skill_gap_analysis.previous_version"]

    def __init__(self, llm: ChatGroq | None = None):
        self._llm = llm or default_llm()
        self._graph = build_graph(self._llm)

    def run(self, inp: SkillGapAnalysisInput) -> SkillGapAnalysisOutput:
        result_state = self._graph.invoke(
            {"input": inp, "llm_gaps": [], "llm_summary": "", "grounded_on": [], "output": None}
        )
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("Skill-Gap Analysis Agent produced no output.")
        return output
