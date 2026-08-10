"""Interview Preparation module — the Interview Coach Agent's HTTP surface.

An Individual (Student/Graduate) feature: a candidate configures a mock
interview (target role/level/type/company), answers questions one at a
time, gets graded per-answer, and receives a final coaching report. Reuses
the candidate's own Profile/Goal/latest CV Feedback text as grounding —
never collects a duplicate copy of any of it (AI Career Engine principle).

Server-side role enforcement on session creation only (`require_account_type`
— SDAIA rubric Phase 9 pattern, same as opportunities.py/services.py);
every other endpoint here scopes by session ownership, which already implies
the creator was a Student/Graduate at creation time.
"""

from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import get_current_user, get_db, get_explainability_llm, get_interview_coach_agent, require_account_type
from app.core.rate_limit import interview_turn_limiter
from app.core.security import PromptInjectionDetected, sanitize_free_text
from app.db.models import (
    AccountType,
    CVFeedbackRound,
    InterviewAnswer,
    InterviewQuestion,
    InterviewSession,
    InterviewSessionMode,
    InterviewSessionStatus,
    User,
)
from app.schemas.ai_career_center import ExplanationRead
from app.schemas.interview import (
    InterviewAnswerSubmit,
    InterviewSessionCreate,
    InterviewSessionDetailRead,
    InterviewSessionRead,
    InterviewSessionReportRead,
    InterviewTurnRead,
)
from app.services.notifications import notify

from careeros_ai.agents.base import GenerationFailed
from careeros_ai.agents.interview import InterviewCoachAgent
from careeros_ai.capabilities.explainability import explain_output
from careeros_ai.capabilities.transcription import TranscriptionFailed, transcribe_audio
from careeros_ai.capabilities.voice_signals import compute_pause_count, compute_speech_rate_wpm, count_filler_words
from careeros_ai.knowledge.contracts import (
    AnswerFeedback,
    GoalSnapshot,
    InterviewConfig,
    InterviewExchange,
    InterviewReportInput,
    InterviewTurnInput,
    ProfileSnapshot,
)

router = APIRouter(prefix="/interview", tags=["interview"])

_SESSION_WITH_QUESTIONS = selectinload(InterviewSession.questions).selectinload(InterviewQuestion.answer)

# Generous for a several-minute spoken answer, well short of an abuse-sized
# upload — same "real, explicit bound" discipline as app/core/security.py's
# free-text length cap.
_MAX_AUDIO_BYTES = 15 * 1024 * 1024

_VOICE_SIGNALS_DISCLAIMER = (
    "These are observed speech and motion signals computed directly from your recording "
    "(pacing, pauses, filler words, relative volume, and amount of movement) — not a "
    "psychological or emotional diagnosis, and not a measurement of eye contact or facial "
    "expression, which this version does not analyze."
)


async def _owned_session(
    db: AsyncSession, user: User, session_id: UUID, *, with_questions: bool = True
) -> InterviewSession:
    options = [_SESSION_WITH_QUESTIONS] if with_questions else []
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.id == session_id, InterviewSession.user_id == user.id)
        .options(*options)
    )
    session = result.scalar_one_or_none()
    if session is None:
        # Same IDOR-safe convention as opportunities.py/services.py: a
        # session that exists but belongs to someone else 404s exactly
        # like one that doesn't exist.
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Interview session not found")
    return session


async def _latest_cv_text(db: AsyncSession, user_id: UUID) -> str:
    result = await db.execute(
        select(CVFeedbackRound)
        .where(CVFeedbackRound.user_id == user_id)
        .order_by(CVFeedbackRound.round_number.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    return latest.document_text if latest else ""


def _config_from_session(session: InterviewSession) -> InterviewConfig:
    return InterviewConfig(
        target_role=session.target_role,
        target_field=session.target_field,
        experience_level=session.experience_level,
        interview_type=session.interview_type,
        target_company=session.target_company,
    )


def _profile_snapshot(user: User) -> ProfileSnapshot:
    return ProfileSnapshot(
        user_id=user.id,
        background=user.profile.background if user.profile else "",
        education=user.profile.education if user.profile else "",
        experience=user.profile.experience if user.profile else "",
        skills=user.profile.skills if user.profile else [],
    )


def _goal_snapshot(user: User, session: InterviewSession) -> GoalSnapshot:
    goal = next((g for g in user.goals if g.is_active), None)
    if goal is not None:
        return GoalSnapshot(user_id=user.id, target_role=goal.target_role, target_field=goal.target_field)
    # A session's own config always has a target_role even if the user's
    # active Goal has since changed/been cleared — degrade gracefully
    # rather than crash mid-interview.
    return GoalSnapshot(user_id=user.id, target_role=session.target_role, target_field=session.target_field)


def _history_from_session(session: InterviewSession) -> list[InterviewExchange]:
    """Only already-answered questions — the DB relationship naturally
    excludes whatever question is currently pending (it has no answer row
    yet). `warrants_follow_up`/`follow_up_reason` aren't persisted (they're
    only ever consumed within the same turn they're computed in, never
    read back from history — see InterviewCoachAgent._decide_next), so
    reconstructing them as False/"" here is exact, not an approximation."""
    exchanges = []
    for q in session.questions:
        if q.answer is None:
            continue
        exchanges.append(
            InterviewExchange(
                category=q.category,
                question=q.question_text,
                answer=q.answer.answer_text,
                feedback=AnswerFeedback(
                    quality_score=q.answer.quality_score,
                    clarity_score=q.answer.clarity_score,
                    relevance_score=q.answer.relevance_score,
                    structure_score=q.answer.structure_score,
                    feedback_note=q.answer.feedback_note,
                    example_improved_answer=q.answer.example_improved_answer,
                    warrants_follow_up=False,
                    follow_up_reason="",
                ),
            )
        )
    return exchanges


def _answer_read(answer: InterviewAnswer) -> dict:
    return {
        "id": answer.id,
        "answer_text": answer.answer_text,
        "quality_score": answer.quality_score,
        "clarity_score": answer.clarity_score,
        "relevance_score": answer.relevance_score,
        "structure_score": answer.structure_score,
        "feedback_note": answer.feedback_note,
        "example_improved_answer": answer.example_improved_answer,
        "speech_rate_wpm": answer.speech_rate_wpm,
        "pause_count": answer.pause_count,
        "filler_word_count": answer.filler_word_count,
        "avg_volume_level": answer.avg_volume_level,
        "movement_level": answer.movement_level,
        "created_at": answer.created_at,
    }


def _question_read(question: InterviewQuestion) -> dict:
    # Built by hand rather than relying on response_model's from_attributes
    # auto-mapping: `question` here is a just-constructed, not-yet-fully-
    # loaded ORM object in the same request, and touching its `.answer`
    # relationship post-commit would risk the same MissingGreenlet class of
    # bug documented in app/api/deps.py — this sidesteps it by construction,
    # same reasoning as opportunities.py's `_application_read`.
    return {
        "id": question.id,
        "order_index": question.order_index,
        "category": question.category,
        "question_text": question.question_text,
        "created_at": question.created_at,
        "answer": None,
    }


def _voice_summary(session: InterviewSession) -> dict | None:
    """Real aggregate over this video session's own answers — computed
    fresh from the persisted per-answer signals on read, not stored
    redundantly on the session row. None for a TEXT session, or a VIDEO
    session with no voice-graded answers yet (e.g. abandoned before
    finishing)."""
    if session.mode != InterviewSessionMode.VIDEO:
        return None
    graded = [q.answer for q in session.questions if q.answer is not None and q.answer.speech_rate_wpm is not None]
    if not graded:
        return None
    n = len(graded)
    return {
        "avg_speech_rate_wpm": round(sum(a.speech_rate_wpm for a in graded) / n, 1),
        "total_pause_count": sum(a.pause_count for a in graded),
        "total_filler_word_count": sum(a.filler_word_count for a in graded),
        "avg_volume_level": round(sum(a.avg_volume_level for a in graded) / n, 2),
        "avg_movement_level": round(sum(a.movement_level for a in graded) / n, 2),
        "disclaimer": _VOICE_SIGNALS_DISCLAIMER,
    }


def _report_read(session: InterviewSession, voice_summary: dict | None) -> dict:
    # session's report_* column names differ from the response schema's
    # confidence/confidence_reason/grounded_on (deliberately — the DB
    # columns are prefixed to avoid colliding with a future per-answer use
    # of the same names), so from_attributes auto-mapping can't be used
    # here either. `voice_summary` is always supplied by the caller
    # (never recomputed here) — computing it touches `session.questions`,
    # which is only safe to access right after a fresh eager-loaded query,
    # never after a `db.commit()` has expired the session's relationships
    # (see finish_session, which computes it *before* committing).
    return {
        "id": session.id,
        "status": session.status,
        "overall_score": session.overall_score or 0,
        "summary": session.summary,
        "answer_quality": session.answer_quality or 0,
        "communication": session.communication or 0,
        "structure_score": session.structure_score or 0,
        "technical_readiness": session.technical_readiness or 0,
        "strengths": session.strengths,
        "areas_to_improve": session.areas_to_improve,
        "recommended_practice": session.recommended_practice,
        "next_interview_recommendation": session.next_interview_recommendation,
        "confidence": session.report_confidence,
        "confidence_reason": session.report_confidence_reason,
        "grounded_on": session.report_grounded_on,
        "completed_at": session.completed_at,
        "voice_summary": voice_summary,
    }


@router.post("/sessions", response_model=InterviewSessionDetailRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: InterviewSessionCreate,
    user: User = Depends(require_account_type(AccountType.STUDENT, AccountType.GRADUATE)),
    db: AsyncSession = Depends(get_db),
    agent: InterviewCoachAgent = Depends(get_interview_coach_agent),
    _rate_limit: None = Depends(interview_turn_limiter),
) -> InterviewSession:
    if user.profile is None or not any(g.is_active for g in user.goals):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST, "Complete your profile and set an active goal before starting a mock interview."
        )

    try:
        target_role = sanitize_free_text(body.target_role, field_name="target_role")
        target_field = sanitize_free_text(body.target_field, field_name="target_field") if body.target_field else ""
        target_company = (
            sanitize_free_text(body.target_company, field_name="target_company") if body.target_company else ""
        )
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    session = InterviewSession(
        user_id=user.id,
        target_role=target_role,
        target_field=target_field,
        experience_level=body.experience_level,
        interview_type=body.interview_type,
        target_company=target_company,
        mode=body.mode,
    )
    db.add(session)
    await db.flush()  # assigns session.id for the first question's FK, before commit

    cv_text = await _latest_cv_text(db, user.id)
    turn_input = InterviewTurnInput(
        profile=_profile_snapshot(user),
        goal=_goal_snapshot(user, session),
        cv_text=cv_text,
        config=_config_from_session(session),
        locale=user.locale,
    )
    try:
        turn_output = agent.run_turn(turn_input)
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    db.add(
        InterviewQuestion(
            session_id=session.id,
            order_index=0,
            category=turn_output.next_question_category,
            question_text=turn_output.next_question,
        )
    )
    await db.commit()
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.id == session.id).options(_SESSION_WITH_QUESTIONS)
    )
    return result.scalar_one()


@router.get("/sessions", response_model=list[InterviewSessionRead])
async def list_sessions(
    user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> list[InterviewSession]:
    result = await db.execute(
        select(InterviewSession).where(InterviewSession.user_id == user.id).order_by(InterviewSession.created_at.desc())
    )
    return list(result.scalars().all())


@router.get("/sessions/{session_id}", response_model=InterviewSessionDetailRead)
async def get_session(
    session_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> InterviewSession:
    return await _owned_session(db, user, session_id)


def _validate_answerable(session: InterviewSession, question_id: UUID) -> InterviewQuestion:
    if session.status != InterviewSessionStatus.IN_PROGRESS:
        raise HTTPException(status.HTTP_409_CONFLICT, "This interview session has already been completed.")
    question = next((q for q in session.questions if q.id == question_id), None)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Question not found in this session")
    if question.answer is not None:
        raise HTTPException(status.HTTP_409_CONFLICT, "This question has already been answered.")
    return question


async def _record_answer_and_get_next(
    db: AsyncSession,
    user: User,
    session: InterviewSession,
    question: InterviewQuestion,
    answer_text: str,
    agent: InterviewCoachAgent,
    *,
    voice_metrics: dict | None = None,
) -> dict:
    """Shared by both the typed-answer and recorded-answer endpoints —
    everything from here on (grading, follow-up/next-question decision,
    persistence) is identical regardless of how the answer text was
    produced. `voice_metrics`, when given, is written onto the new
    InterviewAnswer row alongside the LLM-graded fields but never passed
    into the agent itself (see InterviewAnswer's voice-column comment in
    app/db/models.py)."""
    cv_text = await _latest_cv_text(db, user.id)
    turn_input = InterviewTurnInput(
        profile=_profile_snapshot(user),
        goal=_goal_snapshot(user, session),
        cv_text=cv_text,
        config=_config_from_session(session),
        locale=user.locale,
        history=_history_from_session(session),
        pending_question=question.question_text,
        pending_question_category=question.category,
        pending_answer=answer_text,
    )
    try:
        turn_output = agent.run_turn(turn_input)
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    fb = turn_output.answer_feedback
    assert fb is not None  # guaranteed whenever pending_answer is non-empty (InterviewCoachAgent._analyze_answer)
    answer = InterviewAnswer(
        question_id=question.id,
        answer_text=answer_text,
        quality_score=fb.quality_score,
        clarity_score=fb.clarity_score,
        relevance_score=fb.relevance_score,
        structure_score=fb.structure_score,
        feedback_note=fb.feedback_note,
        example_improved_answer=fb.example_improved_answer,
        **(voice_metrics or {}),
    )
    db.add(answer)

    next_question: InterviewQuestion | None = None
    if turn_output.action in ("follow_up", "next_question"):
        next_question = InterviewQuestion(
            session_id=session.id,
            order_index=len(session.questions),
            category=turn_output.next_question_category,
            question_text=turn_output.next_question,
        )
        db.add(next_question)

    await db.commit()
    await db.refresh(answer)
    if next_question is not None:
        await db.refresh(next_question)

    return {
        "answer_feedback": _answer_read(answer),
        "action": turn_output.action,
        "next_question": _question_read(next_question) if next_question else None,
    }


@router.post("/sessions/{session_id}/answers", response_model=InterviewTurnRead)
async def submit_answer(
    session_id: UUID,
    body: InterviewAnswerSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    agent: InterviewCoachAgent = Depends(get_interview_coach_agent),
    _rate_limit: None = Depends(interview_turn_limiter),
) -> dict:
    session = await _owned_session(db, user, session_id)
    question = _validate_answerable(session, body.question_id)

    try:
        answer_text = sanitize_free_text(body.answer_text, field_name="answer_text")
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc
    if not answer_text.strip():
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "answer_text must not be empty")

    return await _record_answer_and_get_next(db, user, session, question, answer_text, agent)


@router.post("/sessions/{session_id}/answers/media", response_model=InterviewTurnRead)
async def submit_answer_media(
    session_id: UUID,
    question_id: UUID = Form(...),
    avg_volume_level: float = Form(...),
    movement_level: float = Form(...),
    audio: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    agent: InterviewCoachAgent = Depends(get_interview_coach_agent),
    _rate_limit: None = Depends(interview_turn_limiter),
) -> dict:
    """Video Interview's answer path: `audio` is the candidate's actual
    recorded response (a webm container with an audio track — Groq's
    Whisper endpoint decodes the audio directly, no server-side video
    processing happens or is needed). `avg_volume_level`/`movement_level`
    are real signals the client already computed during recording (Web
    Audio API RMS amplitude, canvas frame-differencing) — this endpoint
    only validates and stores them, it doesn't recompute them from raw
    media (no audio/video processing library is part of this stack; see
    root README's Role-based ecosystem-style honest-scope precedent)."""
    session = await _owned_session(db, user, session_id)
    if session.mode != InterviewSessionMode.VIDEO:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "This session is not a video interview session.")
    question = _validate_answerable(session, question_id)

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No audio was received.")
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "Recording is too large (max 15 MB).")

    try:
        transcription = transcribe_audio(audio_bytes, filename=audio.filename or "answer.webm")
    except TranscriptionFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Transcription failed: {exc}") from exc

    try:
        answer_text = sanitize_free_text(transcription.text, field_name="answer_text")
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    voice_metrics = {
        "speech_rate_wpm": compute_speech_rate_wpm(transcription.text, transcription.duration_seconds),
        "pause_count": compute_pause_count(transcription.segments),
        "filler_word_count": count_filler_words(transcription.text),
        "avg_volume_level": max(0.0, min(1.0, avg_volume_level)),
        "movement_level": max(0.0, min(1.0, movement_level)),
    }
    return await _record_answer_and_get_next(
        db, user, session, question, answer_text, agent, voice_metrics=voice_metrics
    )


@router.post("/sessions/{session_id}/finish", response_model=InterviewSessionReportRead)
async def finish_session(
    session_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    agent: InterviewCoachAgent = Depends(get_interview_coach_agent),
    _rate_limit: None = Depends(interview_turn_limiter),
) -> dict:
    session = await _owned_session(db, user, session_id)
    if session.status == InterviewSessionStatus.COMPLETED:
        return _report_read(session, _voice_summary(session))

    history = _history_from_session(session)
    if not history:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Answer at least one question before finishing the interview.")

    report_input = InterviewReportInput(
        profile=_profile_snapshot(user),
        goal=_goal_snapshot(user, session),
        config=_config_from_session(session),
        locale=user.locale,
        history=history,
    )
    try:
        report = agent.run_report(report_input)
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    session.status = InterviewSessionStatus.COMPLETED
    session.overall_score = report.overall_score
    session.summary = report.summary
    session.answer_quality = report.answer_quality
    session.communication = report.communication
    session.structure_score = report.structure
    session.technical_readiness = report.technical_readiness
    session.strengths = report.strengths
    session.areas_to_improve = report.areas_to_improve
    session.recommended_practice = report.recommended_practice
    session.next_interview_recommendation = report.next_interview_recommendation
    session.report_confidence = report.confidence
    session.report_confidence_reason = report.confidence_reason
    session.report_grounded_on = report.grounded_on
    session.completed_at = datetime.now(timezone.utc)
    db.add(session)

    # BR-NOTIF-1(a): a requested interview report completes.
    notify(
        db, user, category="interview_report_complete",
        message_key="interview_report_complete", target_role=session.target_role,
    )

    # Computed now, before the commit below expires session.questions —
    # `db.refresh(session)` only reloads column attributes, not
    # relationships, so touching session.questions afterward would risk
    # the same MissingGreenlet class of bug documented in app/api/deps.py.
    voice_summary = _voice_summary(session)

    await db.commit()
    await db.refresh(session)
    return _report_read(session, voice_summary)


@router.get("/sessions/{session_id}/report", response_model=InterviewSessionReportRead)
async def get_report(
    session_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> dict:
    session = await _owned_session(db, user, session_id)
    if session.status != InterviewSessionStatus.COMPLETED:
        raise HTTPException(
            status.HTTP_404_NOT_FOUND, "This interview session has no report yet — finish the session first."
        )
    return _report_read(session, _voice_summary(session))


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
) -> None:
    session = await _owned_session(db, user, session_id, with_questions=False)
    await db.delete(session)
    await db.commit()


@router.get("/sessions/{session_id}/answers/{answer_id}/explain", response_model=ExplanationRead)
async def explain_answer_feedback(
    session_id: UUID,
    answer_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    llm=Depends(get_explainability_llm),
) -> ExplanationRead:
    """Third domain reusing the same on-request Explainability capability
    as the AI Career Center's /explain endpoints and opportunities.py's
    explain-fit — no new agent, no new mechanism."""
    session = await _owned_session(db, user, session_id)
    question = next((q for q in session.questions if q.answer is not None and q.answer.id == answer_id), None)
    if question is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Answer not found")
    answer = question.answer

    grounded_on = ["interview_session.question", "interview_session.answer"]
    grounded_context = (
        f"Question ({question.category.value}): {question.question_text}\n"
        f"Candidate's answer: {answer.answer_text}\n"
        f"Scores — quality {answer.quality_score}, clarity {answer.clarity_score}, "
        f"relevance {answer.relevance_score}, structure {answer.structure_score}\n"
        f"Feedback note: {answer.feedback_note}\n"
    )
    try:
        explanation = explain_output(
            llm,
            output_summary=(
                f"[{question.category.value}] quality {answer.quality_score}, clarity {answer.clarity_score}, "
                f"relevance {answer.relevance_score}, structure {answer.structure_score} — {answer.feedback_note}"
            ),
            grounded_on=grounded_on,
            grounded_context=grounded_context,
            question_scope="why this answer received these specific scores",
        )
    except Exception as exc:  # any LLM failure is an honest generation failure (BR-AI-5)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Explanation generation failed: {exc}") from exc
    return ExplanationRead(explanation=explanation, grounded_on=grounded_on)
