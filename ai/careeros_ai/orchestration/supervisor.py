"""CareerSupervisor: an explicit coordinator graph over the Skill-Gap
Analysis and Roadmap agents, with a human-in-the-loop approval gate.

Structured communication between agents: the Skill-Gap Analysis agent's
typed output DTO (`SkillGapAnalysisOutput`) is placed directly into shared
graph state and handed to the Roadmap agent as its typed input — the two
agents never talk through raw strings, and the supervisor never mutates
either agent's output, only routes based on it (same write-ownership
discipline as everywhere else in this codebase: the supervisor coordinates,
it does not generate).

Human-in-the-loop: after a roadmap draft is produced, the graph interrupts
(`langgraph.types.interrupt`) and waits for an explicit approve/reject
decision before the draft is considered final. Persisted via
`orchestration.checkpointer.get_checkpointer`, so an interrupted run
survives a process restart — approve it hours later, from a different
process, and it resumes exactly where it left off.
"""

from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph
from langgraph.types import Command, interrupt

from careeros_ai.agents.roadmap import RoadmapAgent
from careeros_ai.agents.skill_gap_analysis import SkillGapAnalysisAgent
from careeros_ai.knowledge.contracts import (
    GoalSnapshot,
    ProfileSnapshot,
    RoadmapInput,
    RoadmapOutput,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)
from careeros_ai.observability import log_event


class SupervisorState(TypedDict):
    profile: ProfileSnapshot
    goal: GoalSnapshot
    previous_analysis: SkillGapAnalysisOutput | None
    previous_roadmap: RoadmapOutput | None
    analysis_output: SkillGapAnalysisOutput | None
    roadmap_draft: RoadmapOutput | None
    approval_decision: str | None
    approval_feedback: str | None
    locale: str


def _run_skill_gap_agent(state: SupervisorState, agent: SkillGapAnalysisAgent) -> SupervisorState:
    log_event("supervisor.dispatch", to_agent="SkillGapAnalysisAgent")
    output = agent.run(
        SkillGapAnalysisInput(
            profile=state["profile"],
            goal=state["goal"],
            previous_version=state["previous_analysis"],
            locale=state["locale"],
        )
    )
    return {**state, "analysis_output": output}


def _run_roadmap_agent(state: SupervisorState, agent: RoadmapAgent) -> SupervisorState:
    log_event("supervisor.dispatch", to_agent="RoadmapAgent")
    # Structured hand-off: the prior node's typed output DTO becomes this
    # agent's typed input directly — no re-serialization through strings.
    output = agent.run(
        RoadmapInput(analysis=state["analysis_output"], previous_version=state["previous_roadmap"], locale=state["locale"])
    )
    return {**state, "roadmap_draft": output}


def _await_roadmap_approval(state: SupervisorState) -> SupervisorState:
    """Human-in-the-loop gate (SDAIA rubric): pauses the graph and surfaces
    the draft roadmap for a human decision. `interrupt()` raises internally
    on first execution (caught by LangGraph, which persists the checkpoint
    and returns control to the caller); on resume, it instead returns
    whatever value the resuming `Command(resume=...)` call supplied."""
    log_event("supervisor.interrupt", reason="roadmap_approval")
    decision = interrupt(
        {
            "type": "roadmap_approval",
            "roadmap_items": [item.model_dump() for item in state["roadmap_draft"].items],
            "confidence": state["roadmap_draft"].confidence,
        }
    )
    log_event("supervisor.resume", decision=decision.get("decision"))
    return {**state, "approval_decision": decision.get("decision"), "approval_feedback": decision.get("feedback")}


def _route_after_approval(state: SupervisorState) -> str:
    return "finalize" if state.get("approval_decision") == "approved" else "rejected"


def _finalize(state: SupervisorState) -> SupervisorState:
    log_event("supervisor.finalize", outcome="approved")
    return state


def _rejected(state: SupervisorState) -> SupervisorState:
    log_event("supervisor.finalize", outcome="rejected")
    return state


def build_graph(skill_gap_agent: SkillGapAnalysisAgent, roadmap_agent: RoadmapAgent, checkpointer):
    graph = StateGraph(SupervisorState)
    graph.add_node("run_skill_gap_agent", lambda s: _run_skill_gap_agent(s, skill_gap_agent))
    graph.add_node("run_roadmap_agent", lambda s: _run_roadmap_agent(s, roadmap_agent))
    graph.add_node("await_roadmap_approval", _await_roadmap_approval)
    graph.add_node("finalize", _finalize)
    graph.add_node("rejected", _rejected)

    graph.set_entry_point("run_skill_gap_agent")
    graph.add_edge("run_skill_gap_agent", "run_roadmap_agent")
    graph.add_edge("run_roadmap_agent", "await_roadmap_approval")
    graph.add_conditional_edges(
        "await_roadmap_approval", _route_after_approval, {"finalize": "finalize", "rejected": "rejected"}
    )
    graph.add_edge("finalize", END)
    graph.add_edge("rejected", END)
    return graph.compile(checkpointer=checkpointer)


class CareerSupervisor:
    """Thin façade over the compiled graph — construction takes the two
    agents (dependency-injected, same pattern as the agents themselves) and
    a checkpointer; callers never touch LangGraph's `Command`/`interrupt`
    machinery directly."""

    def __init__(
        self,
        skill_gap_agent: SkillGapAnalysisAgent,
        roadmap_agent: RoadmapAgent,
        checkpointer,
    ):
        self._graph = build_graph(skill_gap_agent, roadmap_agent, checkpointer)

    def start(
        self,
        *,
        thread_id: str,
        profile: ProfileSnapshot,
        goal: GoalSnapshot,
        previous_analysis: SkillGapAnalysisOutput | None,
        previous_roadmap: RoadmapOutput | None,
        locale: str = "en",
    ) -> dict:
        """Runs Skill-Gap Analysis -> Roadmap draft, then stops at the
        approval interrupt. Returns a dict with the interrupt payload
        (`awaiting_approval`) and the analysis, so the caller can persist
        the analysis immediately even though the roadmap isn't final yet."""
        config = {"configurable": {"thread_id": thread_id}}
        self._graph.invoke(
            {
                "profile": profile,
                "goal": goal,
                "previous_analysis": previous_analysis,
                "previous_roadmap": previous_roadmap,
                "analysis_output": None,
                "roadmap_draft": None,
                "approval_decision": None,
                "approval_feedback": None,
                "locale": locale,
            },
            config=config,
        )
        return self._describe(config)

    def resume(self, *, thread_id: str, decision: str, feedback: str = "") -> dict:
        """Resumes a graph previously paused at the approval interrupt.
        `decision` must be "approved" or "rejected". Works from any process
        — the checkpointer, not this object's memory, is what makes the
        paused state resumable."""
        config = {"configurable": {"thread_id": thread_id}}
        self._graph.invoke(Command(resume={"decision": decision, "feedback": feedback}), config=config)
        return self._describe(config)

    def _describe(self, config: dict) -> dict:
        """Reads the graph's actual current state (not `invoke`'s return
        value, which in this LangGraph version doesn't carry interrupt
        info) to determine whether the run is paused awaiting approval or
        has reached a real terminal node."""
        snapshot = self._graph.get_state(config)
        if snapshot.next:
            # Non-empty `.next` means at least one node is still pending —
            # the interrupt inside it hasn't been resumed yet.
            pending_task = snapshot.tasks[0]
            interrupt_value = pending_task.interrupts[0].value if pending_task.interrupts else None
            return {
                "status": "awaiting_approval",
                "interrupt": interrupt_value,
                "analysis": snapshot.values.get("analysis_output"),
            }
        values = snapshot.values
        return {
            "status": "approved" if values.get("approval_decision") == "approved" else "rejected",
            "analysis": values.get("analysis_output"),
            "roadmap": values.get("roadmap_draft") if values.get("approval_decision") == "approved" else None,
        }
