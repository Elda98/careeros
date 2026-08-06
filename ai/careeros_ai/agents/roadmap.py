"""Roadmap Agent (PRD §25.5, §27.4/§27.6).

Single responsibility: derive an ordered roadmap from the current Skill-Gap
Analysis. Owns (writes) Roadmap item *content* only — never item status,
which is exclusively user-controlled (SAS §25.8, demonstrated concretely in
SAS Part IV §21.3). Reads: current Skill-Gap Analysis, its own previous
Roadmap version — explicitly never Profile or Goal directly (PRD §25.5).
"""

from __future__ import annotations

from typing import Optional, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import BaseModel

from careeros_ai.agents.base import BaseAgent, GenerationFailed
from careeros_ai.capabilities.grounding import format_grounding_refs, require_nonempty_grounding
from careeros_ai.knowledge.contracts import (
    RoadmapInput,
    RoadmapItemContent,
    RoadmapOutput,
)
from careeros_ai.llm import default_llm

_SYSTEM_PROMPT = (
    "You are the Roadmap capability of CareerOS. Derive an ordered sequence of concrete, "
    "actionable steps that close the skill gaps in the given analysis (PRD FR-AICC-7). "
    "Each item must be specific enough to act on without further clarification "
    "(FR-AICC-8) and must reference which gap it addresses."
)


class _ItemsResponse(BaseModel):
    items: list[RoadmapItemContent]


class _State(TypedDict):
    input: RoadmapInput
    llm_items: list[RoadmapItemContent]
    grounded_on: list[str]
    output: Optional[RoadmapOutput]


def _generate(state: _State, llm: ChatGroq) -> _State:
    inp = state["input"]
    grounded_on = format_grounding_refs(prior_version=inp.previous_version is not None)
    grounded_on.append("skill_gap_analysis.current")
    require_nonempty_grounding(grounded_on)

    structured_llm = llm.with_structured_output(_ItemsResponse)
    gaps_text = "\n".join(f"- {g.skill}: {g.description}" for g in inp.analysis.gaps)
    prompt = f"Skill-Gap Analysis summary: {inp.analysis.summary}\nGaps:\n{gaps_text}\n"
    try:
        result: _ItemsResponse = structured_llm.invoke(
            [SystemMessage(content=_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:  # noqa: BLE001
        raise GenerationFailed(f"Roadmap generation failed: {exc}") from exc

    state["llm_items"] = result.items
    state["grounded_on"] = grounded_on
    return state


def _finalize(state: _State) -> _State:
    inp = state["input"]
    # Never exceeds the confidence of the Analysis it's derived from — a
    # Roadmap cannot be more certain than the assessment it's built on.
    confidence = inp.analysis.confidence
    state["output"] = RoadmapOutput(
        items=state["llm_items"],
        confidence=confidence,
        grounded_on=state["grounded_on"],
    )
    return state


def build_graph(llm: ChatGroq):
    graph = StateGraph(_State)
    graph.add_node("generate", lambda s: _generate(s, llm))
    graph.add_node("finalize", _finalize)
    graph.set_entry_point("generate")
    graph.add_edge("generate", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile()


class RoadmapAgent(BaseAgent):
    owns = "roadmap"
    reads = ["skill_gap_analysis.current", "roadmap.previous_version"]

    def __init__(self, llm: ChatGroq | None = None):
        self._llm = llm or default_llm()
        self._graph = build_graph(self._llm)

    def run(self, inp: RoadmapInput) -> RoadmapOutput:
        result_state = self._graph.invoke(
            {"input": inp, "llm_items": [], "grounded_on": [], "output": None}
        )
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("Roadmap Agent produced no output.")
        return output
