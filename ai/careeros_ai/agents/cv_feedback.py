"""CV/Profile Feedback Agent (PRD §25.6, §27.8).

Single responsibility: evaluate a submitted document against the active
Goal. Owns (writes) exactly one entity: CV/Profile Feedback Round. Reads
only the active Goal and the submitted document — explicitly independent of
Skill-Gap Analysis and Roadmap (PRD §25.6), demonstrated concretely in SAS
Part IV §19.4 as this architecture's clearest case of one module's agents
not depending on each other.
"""

from __future__ import annotations

from typing import ClassVar, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import BaseModel

from careeros_ai.agents.base import BaseAgent, GenerationFailed
from careeros_ai.capabilities.grounding import format_grounding_refs, require_nonempty_grounding
from careeros_ai.capabilities.language import language_instruction
from careeros_ai.knowledge.contracts import (
    ConfidenceLevel,
    CVFeedbackInput,
    CVFeedbackItem,
    CVFeedbackOutput,
)
from careeros_ai.llm import default_llm

_SYSTEM_PROMPT = (
    "You are the CV/Profile Feedback capability of CareerOS. Evaluate the submitted "
    "document against the user's stated target role. Return specific, actionable feedback "
    "(FR-AICC-14) and distinguish factual/structural issues (category='factual_structural') "
    "from judgment-call feedback (category='judgment_call') per FR-AICC-15. Do not rewrite "
    "the document — critique only what was submitted (PRD §26.3 Critique/Evaluation boundary)."
)


class _ItemsResponse(BaseModel):
    items: list[CVFeedbackItem]


class _State(TypedDict):
    input: CVFeedbackInput
    llm_items: list[CVFeedbackItem]
    grounded_on: list[str]
    output: CVFeedbackOutput | None


def _generate(state: _State, llm: ChatGroq) -> _State:
    inp = state["input"]
    grounded_on = format_grounding_refs(goal_field=True, document=True)
    require_nonempty_grounding(grounded_on)

    structured_llm = llm.with_structured_output(_ItemsResponse)
    prompt = (
        f"Target role: {inp.goal.target_role!r}\n\nSubmitted document:\n{inp.document_text}\n"
    )
    system_prompt = f"{_SYSTEM_PROMPT}\n\n{language_instruction(inp.locale)}"
    try:
        result: _ItemsResponse = structured_llm.invoke(
            [SystemMessage(content=system_prompt), HumanMessage(content=prompt)]
        )
    except Exception as exc:
        raise GenerationFailed(f"CV/Profile Feedback generation failed: {exc}") from exc

    state["llm_items"] = result.items
    state["grounded_on"] = grounded_on
    return state


def _finalize(state: _State) -> _State:
    state["output"] = CVFeedbackOutput(
        items=state["llm_items"],
        confidence=ConfidenceLevel.HIGH if state["llm_items"] else ConfidenceLevel.LOW,
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


class CVFeedbackAgent(BaseAgent):
    owns: ClassVar[str] = "cv_feedback_round"
    reads: ClassVar[list[str]] = ["goal", "submitted_document"]

    def __init__(self, llm: ChatGroq | None = None):
        self._llm = llm or default_llm()
        self._graph = build_graph(self._llm)

    def run(self, inp: CVFeedbackInput) -> CVFeedbackOutput:
        result_state = self._graph.invoke(
            {"input": inp, "llm_items": [], "grounded_on": [], "output": None}
        )
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("CV/Profile Feedback Agent produced no output.")
        return output
