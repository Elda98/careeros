"""Interview Coach Agent.

Single responsibility: run one Interview Preparation session's live
question/follow-up/next-question turn logic, and separately synthesize a
final coaching report from a completed transcript. Owns (writes) exactly
one entity — the interview session's questions, answers, per-answer
feedback, and report — read by nothing else. Reads Profile, Goal, and the
candidate's latest CV/Profile Feedback Round document text (never writes
to any of those).

Two small StateGraphs, not one: `run_turn` is invoked once per HTTP
request (question asked -> user answers -> analyze -> decide -> next
question/follow-up/conclude), matching how every other agent in this
package is invoked — stateless per call, with the backend persisting the
running transcript between calls (the same pattern the Skill-Gap/Roadmap/
CV-Feedback agents already use, not a deviation). `run_report` is a
separate, later call over the full persisted transcript. Neither needs
LangGraph's interrupt/resume checkpointing (CareerSupervisor's mechanism,
`orchestration/supervisor.py`) — that machinery exists for a single
pause-for-approval gate, not a bounded multi-turn conversation, and reusing
it here would be complexity without benefit.
"""

from __future__ import annotations

from typing import ClassVar, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_groq import ChatGroq
from langgraph.graph import END, StateGraph
from pydantic import BaseModel

from careeros_ai.agents.base import BaseAgent, GenerationFailed
from careeros_ai.capabilities.grounding import require_nonempty_grounding
from careeros_ai.knowledge.contracts import (
    AnswerFeedback,
    ConfidenceLevel,
    InterviewQuestionCategory,
    InterviewReportInput,
    InterviewReportOutput,
    InterviewTurnInput,
    InterviewTurnOutput,
)
from careeros_ai.llm import default_llm

# Bounds the loop concretely — mirrors SkillGapAnalysisAgent's
# MAX_TOOL_ROUNDS/MAX_RETRIES: a real, terminating loop, not an accidental
# infinite one. At most one follow-up per main question (enforced in
# `_decide_next` by never following up on an already-follow-up question),
# and at most MAX_MAIN_QUESTIONS main questions per session.
MAX_MAIN_QUESTIONS = 6

_TURN_SYSTEM_PROMPT = (
    "You are the Interview Coach capability of CareerOS, running a live mock interview. "
    "Ask focused, realistic interview questions and grade answers honestly — never inflate "
    "a weak answer's scores. Ground every question in the candidate's real target role, "
    "level, and (where relevant) their actual skills or CV content — never a generic "
    "question bank unrelated to this specific candidate."
)

_REPORT_SYSTEM_PROMPT = (
    "You are the Interview Coach capability of CareerOS, writing a final coaching report "
    "for a completed mock interview. Be specific and honest — cite what the candidate "
    "actually said, not generic interview advice. Never claim to know the candidate's "
    "emotional state or personality; comment only on the content and structure of their "
    "answers."
)


class _NextQuestionResponse(BaseModel):
    question: str
    category: InterviewQuestionCategory


class _FollowUpResponse(BaseModel):
    question: str


class _ReportBody(BaseModel):
    summary: str
    strengths: list[str]
    areas_to_improve: list[str]
    recommended_practice: list[str]
    next_interview_recommendation: str
    technical_readiness: int


class _TurnState(TypedDict):
    input: InterviewTurnInput
    answer_feedback: AnswerFeedback | None
    action: str
    next_question: str
    next_question_category: str | None
    output: InterviewTurnOutput | None


def _analyze_answer(state: _TurnState, llm: ChatGroq) -> _TurnState:
    inp = state["input"]
    if not inp.pending_answer:
        state["answer_feedback"] = None
        return state

    structured_llm = llm.with_structured_output(AnswerFeedback)
    prompt = (
        f"Target role: {inp.config.target_role!r} ({inp.config.experience_level.value} level)\n"
        f"Interview question ({inp.pending_question_category.value if inp.pending_question_category else 'unknown'}): "
        f"{inp.pending_question}\n"
        f"Candidate's answer: {inp.pending_answer}\n\n"
        "Grade this single answer. Set warrants_follow_up=true only if the answer is vague, "
        "incomplete, or begs an obvious clarifying question — not for every answer."
    )
    try:
        feedback: AnswerFeedback = structured_llm.invoke(
            [SystemMessage(content=_TURN_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:
        raise GenerationFailed(f"Interview answer analysis failed: {exc}") from exc
    state["answer_feedback"] = feedback
    return state


def _decide_next(state: _TurnState) -> _TurnState:
    inp = state["input"]
    if not inp.pending_answer:
        state["action"] = "next_question"
        return state

    fb = state["answer_feedback"]
    already_follow_up = inp.pending_question_category == InterviewQuestionCategory.FOLLOW_UP
    main_questions_asked = sum(1 for h in inp.history if h.category != InterviewQuestionCategory.FOLLOW_UP) + (
        0 if already_follow_up else 1
    )
    if fb is not None and fb.warrants_follow_up and not already_follow_up:
        state["action"] = "follow_up"
    elif main_questions_asked >= MAX_MAIN_QUESTIONS:
        state["action"] = "conclude"
    else:
        state["action"] = "next_question"
    return state


def _generate_follow_up(state: _TurnState, llm: ChatGroq) -> _TurnState:
    inp = state["input"]
    fb = state["answer_feedback"]
    structured_llm = llm.with_structured_output(_FollowUpResponse)
    prompt = (
        f"Original question: {inp.pending_question}\n"
        f"Candidate's answer: {inp.pending_answer}\n"
        f"Why a follow-up is warranted: {fb.follow_up_reason if fb else ''}\n\n"
        "Write ONE natural, specific follow-up question that probes this gap directly."
    )
    try:
        result: _FollowUpResponse = structured_llm.invoke(
            [SystemMessage(content=_TURN_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:
        raise GenerationFailed(f"Interview follow-up generation failed: {exc}") from exc
    state["next_question"] = result.question
    state["next_question_category"] = InterviewQuestionCategory.FOLLOW_UP.value
    return state


def _generate_next_question(state: _TurnState, llm: ChatGroq) -> _TurnState:
    inp = state["input"]
    asked_categories = [h.category.value for h in inp.history if h.category != InterviewQuestionCategory.FOLLOW_UP]
    if inp.pending_question and inp.pending_question_category != InterviewQuestionCategory.FOLLOW_UP:
        asked_categories.append(inp.pending_question_category.value if inp.pending_question_category else "")
    is_first = not inp.pending_question
    transcript = "\n".join(f"- ({h.category.value}) Q: {h.question}\n  A: {h.answer}" for h in inp.history)

    structured_llm = llm.with_structured_output(_NextQuestionResponse)
    prompt = (
        f"Candidate's declared skills: {inp.profile.skills}\n"
        f"Target role: {inp.config.target_role} ({inp.config.experience_level.value})\n"
        f"Target field: {inp.config.target_field or 'unspecified'}\n"
        f"Target company: {inp.config.target_company or 'unspecified'}\n"
        f"Requested interview type: {inp.config.interview_type.value}\n"
        f"CV excerpt: {inp.cv_text[:2000] if inp.cv_text else 'not provided'}\n"
        f"Question categories already asked this session: {asked_categories or 'none yet'}\n"
        f"Transcript so far:\n{transcript or '(interview just starting)'}\n\n"
        + (
            "Ask the FIRST question of the interview — a short, natural introductory question."
            if is_first
            else (
                "Ask the NEXT interview question. Choose a category that fits the requested interview "
                "type and hasn't been overused yet, and make it specific to this candidate's target "
                "role/company/CV where relevant — never a generic, interchangeable question."
            )
        )
    )
    try:
        result: _NextQuestionResponse = structured_llm.invoke(
            [SystemMessage(content=_TURN_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:
        raise GenerationFailed(f"Interview question generation failed: {exc}") from exc
    state["next_question"] = result.question
    state["next_question_category"] = result.category.value
    return state


def _conclude(state: _TurnState) -> _TurnState:
    state["next_question"] = ""
    state["next_question_category"] = None
    return state


def _finalize_turn(state: _TurnState) -> _TurnState:
    inp = state["input"]
    grounded_on: list[str] = []
    if inp.pending_answer:
        grounded_on.append("interview_session.pending_answer")
    if state["action"] in ("next_question", "follow_up"):
        grounded_on.append("goal.target_role")
        grounded_on.append("profile.skills")
        if inp.cv_text:
            grounded_on.append("cv_feedback.latest_document")
        require_nonempty_grounding(grounded_on)

    state["output"] = InterviewTurnOutput(
        answer_feedback=state["answer_feedback"],
        action=state["action"],  # type: ignore[arg-type]
        next_question=state["next_question"],
        next_question_category=(
            InterviewQuestionCategory(state["next_question_category"]) if state["next_question_category"] else None
        ),
        grounded_on=grounded_on,
    )
    return state


def build_turn_graph(llm: ChatGroq):
    graph = StateGraph(_TurnState)
    graph.add_node("analyze_answer", lambda s: _analyze_answer(s, llm))
    graph.add_node("decide_next", _decide_next)
    graph.add_node("generate_follow_up", lambda s: _generate_follow_up(s, llm))
    graph.add_node("generate_next_question", lambda s: _generate_next_question(s, llm))
    graph.add_node("conclude", _conclude)
    graph.add_node("finalize", _finalize_turn)
    graph.set_entry_point("analyze_answer")
    graph.add_edge("analyze_answer", "decide_next")
    graph.add_conditional_edges(
        "decide_next",
        lambda s: s["action"],
        {
            "follow_up": "generate_follow_up",
            "next_question": "generate_next_question",
            "conclude": "conclude",
        },
    )
    graph.add_edge("generate_follow_up", "finalize")
    graph.add_edge("generate_next_question", "finalize")
    graph.add_edge("conclude", "finalize")
    graph.add_edge("finalize", END)
    return graph.compile()


class _ReportState(TypedDict):
    input: InterviewReportInput
    body: _ReportBody | None
    output: InterviewReportOutput | None


def _synthesize_report(state: _ReportState, llm: ChatGroq) -> _ReportState:
    inp = state["input"]
    transcript_parts = []
    for h in inp.history:
        part = f"[{h.category.value}] Q: {h.question}\nA: {h.answer}\n"
        if h.feedback:
            part += (
                f"Scores — quality {h.feedback.quality_score}, clarity {h.feedback.clarity_score}, "
                f"relevance {h.feedback.relevance_score}, structure {h.feedback.structure_score}\n"
                f"Note: {h.feedback.feedback_note}"
            )
        transcript_parts.append(part)
    transcript = "\n\n".join(transcript_parts)

    structured_llm = llm.with_structured_output(_ReportBody)
    prompt = (
        f"Target role: {inp.config.target_role} ({inp.config.experience_level.value})\n"
        f"Interview type: {inp.config.interview_type.value}\n"
        f"Full transcript with per-answer scores:\n{transcript}\n\n"
        "Write the final interview coaching report body: a short overall summary, concrete "
        "strengths, concrete areas to improve, specific recommended practice items, one "
        "recommendation for the candidate's next interview attempt, and a technical_readiness "
        "score (0-100) reflecting only the technical/role-specific answers in this transcript."
    )
    try:
        body: _ReportBody = structured_llm.invoke(
            [SystemMessage(content=_REPORT_SYSTEM_PROMPT), HumanMessage(content=prompt)]
        )
    except Exception as exc:
        raise GenerationFailed(f"Interview report synthesis failed: {exc}") from exc
    state["body"] = body
    return state


def _calibrate_report(state: _ReportState) -> _ReportState:
    inp = state["input"]
    body = state["body"]
    assert body is not None  # guaranteed by _synthesize_report or the node wouldn't have been reached

    graded = [h.feedback for h in inp.history if h.feedback is not None]
    answered = len(graded)
    # Real, code-computed averages — not an LLM-invented headline number —
    # for the three scores that map directly onto a per-answer field
    # (BR-AI-4: never presented as higher than the system's actual basis).
    answer_quality = round(sum(f.quality_score for f in graded) / answered) if answered else 0
    communication = round(sum(f.clarity_score for f in graded) / answered) if answered else 0
    structure = round(sum(f.structure_score for f in graded) / answered) if answered else 0
    technical_readiness = max(0, min(100, body.technical_readiness))
    overall_score = round((answer_quality + communication + structure + technical_readiness) / 4)

    if answered >= 4:
        confidence = ConfidenceLevel.HIGH
        reason = f"Based on {answered} answered questions, a substantive sample for this session."
    elif answered >= 2:
        confidence = ConfidenceLevel.MEDIUM
        reason = f"Based on only {answered} answered questions — a fuller session would sharpen this report."
    else:
        confidence = ConfidenceLevel.LOW
        reason = f"Based on very few answered questions ({answered}) — treat this report as provisional."

    grounded_on = ["interview_session.transcript", "goal.target_role"]
    if inp.profile.skills:
        grounded_on.append("profile.skills")

    state["output"] = InterviewReportOutput(
        overall_score=overall_score,
        summary=body.summary,
        answer_quality=answer_quality,
        communication=communication,
        structure=structure,
        technical_readiness=technical_readiness,
        strengths=body.strengths,
        areas_to_improve=body.areas_to_improve,
        recommended_practice=body.recommended_practice,
        next_interview_recommendation=body.next_interview_recommendation,
        confidence=confidence,
        confidence_reason=reason,
        grounded_on=grounded_on,
    )
    return state


def build_report_graph(llm: ChatGroq):
    graph = StateGraph(_ReportState)
    graph.add_node("synthesize", lambda s: _synthesize_report(s, llm))
    graph.add_node("calibrate", _calibrate_report)
    graph.set_entry_point("synthesize")
    graph.add_edge("synthesize", "calibrate")
    graph.add_edge("calibrate", END)
    return graph.compile()


class InterviewCoachAgent(BaseAgent):
    owns: ClassVar[str] = "interview_session"
    reads: ClassVar[list[str]] = ["profile", "goal", "cv_feedback_round.latest"]

    def __init__(self, llm: ChatGroq | None = None):
        self._llm = llm or default_llm()
        self._turn_graph = build_turn_graph(self._llm)
        self._report_graph = build_report_graph(self._llm)

    def run_turn(self, inp: InterviewTurnInput) -> InterviewTurnOutput:
        result_state = self._turn_graph.invoke(
            {
                "input": inp,
                "answer_feedback": None,
                "action": "",
                "next_question": "",
                "next_question_category": None,
                "output": None,
            }
        )
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("Interview Coach Agent produced no turn output.")
        return output

    def run_report(self, inp: InterviewReportInput) -> InterviewReportOutput:
        if not inp.history:
            raise GenerationFailed("Cannot generate an interview report with no completed exchanges.")
        result_state = self._report_graph.invoke({"input": inp, "body": None, "output": None})
        output = result_state["output"]
        if output is None:
            raise GenerationFailed("Interview Coach Agent produced no report output.")
        return output
