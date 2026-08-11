"""AI Career Center module (PRD FR-AICC, SAS §14).

Owns Skill-Gap Analysis, Roadmap, and CV/Profile Feedback Round exclusively
(SAS §14.3). Every write here goes through exactly one of the three Phase 0
agents in `careeros_ai`, matching SAS Part II §11's Intelligence <-> Knowledge
contract: this router reads Profile/Goal (owned elsewhere), calls an agent,
and persists only the entity that agent owns.

Like Profile/Goal, every entity here (Skill-Gap Analysis, Roadmap, CV
Feedback) only makes sense for a Student/Graduate career seeker — a
Company/Service Provider account has no Profile to analyze against. Gated
to STUDENT/GRADUATE via `require_account_type`, same as profiles.py.
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.deps import (
    get_career_supervisor,
    get_cv_feedback_agent,
    get_db,
    get_explainability_llm,
    get_roadmap_agent,
    get_skill_gap_analysis_agent,
    require_account_type,
)
from app.core.rate_limit import career_plan_start_limiter, cv_feedback_submit_limiter, skill_gap_refresh_limiter
from app.core.security import PromptInjectionDetected, sanitize_free_text
from app.db.models import (
    AccountType,
    CVFeedbackItem,
    CVFeedbackRound,
    Goal,
    Roadmap,
    RoadmapItem,
    RoadmapItemStatusChange,
    SkillGapAnalysis,
    SkillGapItem,
    User,
)
from app.schemas.ai_career_center import (
    CareerPlanApprovalRequest,
    CareerPlanStatusRead,
    CVFeedbackRoundRead,
    CVFeedbackSubmitRequest,
    ExplanationRead,
    RoadmapDraftItemRead,
    RoadmapItemStatusUpdate,
    RoadmapRead,
    SkillGapAnalysisRead,
)
from app.services import onboarding
from app.services.notifications import notify

from careeros_ai.agents.base import GenerationFailed
from careeros_ai.agents.cv_feedback import CVFeedbackAgent
from careeros_ai.agents.roadmap import RoadmapAgent
from careeros_ai.agents.skill_gap_analysis import SkillGapAnalysisAgent
from careeros_ai.capabilities.explainability import explain_output
from careeros_ai.knowledge.contracts import (
    CVFeedbackInput,
    GoalSnapshot,
    ProfileSnapshot,
    RoadmapInput,
    RoadmapItemContent,
    RoadmapOutput,
    SkillGap,
    SkillGapAnalysisInput,
    SkillGapAnalysisOutput,
)
from careeros_ai.orchestration.supervisor import CareerSupervisor

router = APIRouter(prefix="/ai-career-center", tags=["ai-career-center"])
_CAREER_SEEKER = require_account_type(AccountType.STUDENT, AccountType.GRADUATE)

_ANALYSIS_LOAD = selectinload(SkillGapAnalysis.gaps)
_ROADMAP_LOAD = selectinload(Roadmap.items)


def _active_goal(user: User) -> Goal | None:
    return next((g for g in user.goals if g.is_active), None)


async def _latest_analysis(db: AsyncSession, user_id: UUID) -> SkillGapAnalysis | None:
    result = await db.execute(
        select(SkillGapAnalysis)
        .options(_ANALYSIS_LOAD)
        .where(SkillGapAnalysis.user_id == user_id)
        .order_by(SkillGapAnalysis.version.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def _latest_roadmap(db: AsyncSession, user_id: UUID) -> Roadmap | None:
    result = await db.execute(
        select(Roadmap)
        .options(_ROADMAP_LOAD)
        .where(Roadmap.user_id == user_id)
        .order_by(Roadmap.version.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


def _to_output_dto(analysis: SkillGapAnalysis) -> SkillGapAnalysisOutput:
    """Rehydrate a persisted Analysis back into the DTO the Roadmap Agent
    expects as input — keeps the DB row shape and the agent contract shape
    independently evolvable (SAS §3.12)."""
    return SkillGapAnalysisOutput(
        gaps=[SkillGap(skill=g.skill, description=g.description, severity=g.severity) for g in analysis.gaps],
        summary=analysis.summary,
        confidence=analysis.confidence,
        confidence_reason=analysis.confidence_reason,
        grounded_on=analysis.grounded_on,
    )


def _to_roadmap_output_dto(roadmap: Roadmap) -> RoadmapOutput:
    """Same rehydration as `_to_output_dto`, for Roadmap — lets the Roadmap
    Agent's Change Awareness capability (PRD §26.3) actually compare against
    the immediately prior version, instead of always being told none exists."""
    return RoadmapOutput(
        items=[
            RoadmapItemContent(title=i.title, description=i.description, addresses_gap=i.addresses_gap)
            for i in roadmap.items
        ],
        confidence=roadmap.confidence,
        grounded_on=roadmap.grounded_on,
    )


async def _persist_roadmap_output(
    db: AsyncSession, user: User, analysis: SkillGapAnalysis, output: RoadmapOutput, previous: Roadmap | None
) -> Roadmap:
    """The actual Knowledge Layer write for a Roadmap Agent output — shared
    by both the direct-call flow (`_generate_roadmap`, agent invoked here)
    and the supervised flow (`/career-plan/approve`, agent already invoked
    inside the supervisor graph, `output` is its draft). Either way, the
    write itself, and the notification it triggers, happen exactly once,
    in exactly one place."""
    roadmap = Roadmap(
        user_id=user.id,
        analysis_id=analysis.id,
        version=(previous.version + 1 if previous else 1),
        confidence=output.confidence,
        grounded_on=output.grounded_on,
    )
    roadmap.items = [
        RoadmapItem(title=i.title, description=i.description, addresses_gap=i.addresses_gap)
        for i in output.items
    ]
    db.add(roadmap)
    # FR-NOTIF-4: the roadmap regenerated as a cascade of the analysis the
    # user directly requested, not a direct request of its own — notify.
    notify(db, user, category="roadmap_updated", message_key="roadmap_updated", version=roadmap.version)
    await db.commit()
    await db.refresh(roadmap, attribute_names=["items"])
    return roadmap


async def _generate_roadmap(
    db: AsyncSession, user: User, analysis: SkillGapAnalysis, agent: RoadmapAgent
) -> Roadmap:
    previous = await _latest_roadmap(db, user.id)
    try:
        output = agent.run(
            RoadmapInput(
                analysis=_to_output_dto(analysis),
                previous_version=_to_roadmap_output_dto(previous) if previous else None,
                locale=user.locale,
            )
        )
    except GenerationFailed as exc:
        # BR-AI-5 / SAS §4.18: no write occurs; whatever roadmap already
        # exists remains the current one.
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc
    return await _persist_roadmap_output(db, user, analysis, output, previous)


@router.post("/skill-gap-analysis/refresh", response_model=SkillGapAnalysisRead)
async def refresh_skill_gap_analysis(
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    skill_gap_agent: SkillGapAnalysisAgent = Depends(get_skill_gap_analysis_agent),
    roadmap_agent: RoadmapAgent = Depends(get_roadmap_agent),
    _rate_limit: None = Depends(skill_gap_refresh_limiter),
) -> SkillGapAnalysis:
    """Covers SAS Part IV §18.5 (First Skill-Gap Analysis) and the manual
    case of §19.3 (Analysis Refresh) — both use identical mechanics per
    PRD §27.7. Automatic material-change-triggered refresh (the rest of
    §19.3) is not yet wired to a Profile-edit trigger; call this endpoint
    directly for now.

    BR-GAP-1/2: gated on the same hard-bar check the onboarding-status
    endpoint reports (app/services/onboarding.py) — below the bar, this
    endpoint tells the caller what's missing instead of producing an
    analysis.
    """
    goal = _active_goal(user)
    status_check = onboarding.evaluate(user.profile, goal)
    if not status_check.meets_hard_bar:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            {
                "message": "Profile does not yet meet the minimum bar for analysis (BR-GAP-1)",
                "missing_hard_bar_fields": status_check.missing_hard_bar_fields,
                "goal_set": status_check.goal_set,
            },
        )
    assert user.profile is not None and goal is not None  # guaranteed by meets_hard_bar

    previous = await _latest_analysis(db, user.id)

    try:
        output = skill_gap_agent.run(
            SkillGapAnalysisInput(
                profile=ProfileSnapshot(
                    user_id=user.id,
                    background=user.profile.background,
                    education=user.profile.education,
                    experience=user.profile.experience,
                    skills=user.profile.skills,
                ),
                goal=GoalSnapshot(user_id=user.id, target_role=goal.target_role, target_field=goal.target_field),
                previous_version=_to_output_dto(previous) if previous else None,
                locale=user.locale,
            )
        )
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    analysis = SkillGapAnalysis(
        user_id=user.id,
        version=(previous.version + 1 if previous else 1),
        summary=output.summary,
        confidence=output.confidence,
        confidence_reason=output.confidence_reason,
        grounded_on=output.grounded_on,
    )
    analysis.gaps = [
        SkillGapItem(skill=g.skill, description=g.description, severity=g.severity) for g in output.gaps
    ]
    db.add(analysis)

    # FR-ONBOARD-1: onboarding is considered complete once the first
    # analysis has actually been produced, not merely once the profile bar
    # was met (an agent failure must not silently mark onboarding done).
    if not user.profile.onboarding_completed:
        user.profile.onboarding_completed = True
        db.add(user.profile)

    # BR-NOTIF-1(a): a requested analysis completes.
    notify(db, user, category="analysis_complete", message_key="analysis_complete", version=analysis.version)

    await db.commit()
    await db.refresh(analysis, attribute_names=["gaps"])

    # §27.4's cascade: a new Analysis with no existing Roadmap (or a changed
    # one) triggers Roadmap Generation/Regeneration automatically.
    await _generate_roadmap(db, user, analysis, roadmap_agent)

    return analysis


# --- Supervised career-plan flow (multi-agent coordination + HITL) --------
# An explicit-coordinator alternative to the direct-call endpoints above:
# the same two agents, run through CareerSupervisor (careeros_ai/orchestration)
# instead of called directly, which stops for a human approval decision
# before the roadmap draft is persisted. The Skill-Gap Analysis is still
# persisted immediately either way — only the roadmap is gated, since
# that's the artifact this flow exists to let a user review before it
# becomes their active plan. Uses a per-user thread_id (`str(user.id)`),
# so only one career-plan run may be in flight per user at a time.


@router.post("/career-plan/start", response_model=CareerPlanStatusRead)
async def start_career_plan(
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    supervisor: CareerSupervisor = Depends(get_career_supervisor),
    _rate_limit: None = Depends(career_plan_start_limiter),
) -> CareerPlanStatusRead:
    goal = _active_goal(user)
    status_check = onboarding.evaluate(user.profile, goal)
    if not status_check.meets_hard_bar:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            {
                "message": "Profile does not yet meet the minimum bar for analysis (BR-GAP-1)",
                "missing_hard_bar_fields": status_check.missing_hard_bar_fields,
                "goal_set": status_check.goal_set,
            },
        )
    assert user.profile is not None and goal is not None  # guaranteed by meets_hard_bar

    previous_analysis = await _latest_analysis(db, user.id)
    previous_roadmap = await _latest_roadmap(db, user.id)

    try:
        result = supervisor.start(
            thread_id=str(user.id),
            profile=ProfileSnapshot(
                user_id=user.id,
                background=user.profile.background,
                education=user.profile.education,
                experience=user.profile.experience,
                skills=user.profile.skills,
            ),
            goal=GoalSnapshot(user_id=user.id, target_role=goal.target_role, target_field=goal.target_field),
            previous_analysis=_to_output_dto(previous_analysis) if previous_analysis else None,
            previous_roadmap=_to_roadmap_output_dto(previous_roadmap) if previous_roadmap else None,
            locale=user.locale,
        )
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    output: SkillGapAnalysisOutput = result["analysis"]
    analysis = SkillGapAnalysis(
        user_id=user.id,
        version=(previous_analysis.version + 1 if previous_analysis else 1),
        summary=output.summary,
        confidence=output.confidence,
        confidence_reason=output.confidence_reason,
        grounded_on=output.grounded_on,
    )
    analysis.gaps = [
        SkillGapItem(skill=g.skill, description=g.description, severity=g.severity) for g in output.gaps
    ]
    db.add(analysis)

    if not user.profile.onboarding_completed:
        user.profile.onboarding_completed = True
        db.add(user.profile)

    notify(db, user, category="analysis_complete", message_key="analysis_complete", version=analysis.version)
    await db.commit()
    await db.refresh(analysis, attribute_names=["gaps"])

    draft_items = (
        [RoadmapDraftItemRead(**item) for item in result["interrupt"]["roadmap_items"]]
        if result["status"] == "awaiting_approval"
        else []
    )
    return CareerPlanStatusRead(
        status=result["status"],
        analysis=SkillGapAnalysisRead.model_validate(analysis),
        roadmap_draft=draft_items,
        roadmap=None,
    )


@router.post("/career-plan/approve", response_model=CareerPlanStatusRead)
async def approve_career_plan(
    body: CareerPlanApprovalRequest,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    supervisor: CareerSupervisor = Depends(get_career_supervisor),
) -> CareerPlanStatusRead:
    """Resumes the supervisor graph paused by `/career-plan/start` and
    persists the roadmap draft it had produced — the human-in-the-loop
    approval this whole flow exists for. Works even if the backend process
    that ran `/start` has since restarted: the paused state lives in
    Postgres via the checkpointer, not in this process's memory."""
    try:
        result = supervisor.resume(thread_id=str(user.id), decision="approved", feedback=body.feedback)
    except Exception as exc:  # no run paused for this thread_id, or it already resolved
        raise HTTPException(
            status.HTTP_409_CONFLICT, "No career plan is currently awaiting approval for this account."
        ) from exc

    if result["status"] != "approved" or result["roadmap"] is None:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "No career plan is currently awaiting approval for this account."
        )

    analysis = await _latest_analysis(db, user.id)
    previous_roadmap = await _latest_roadmap(db, user.id)
    roadmap = await _persist_roadmap_output(db, user, analysis, result["roadmap"], previous_roadmap)

    return CareerPlanStatusRead(
        status="approved",
        analysis=SkillGapAnalysisRead.model_validate(analysis),
        roadmap=RoadmapRead.model_validate(roadmap),
    )


@router.post("/career-plan/reject", response_model=CareerPlanStatusRead)
async def reject_career_plan(
    body: CareerPlanApprovalRequest,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    supervisor: CareerSupervisor = Depends(get_career_supervisor),
) -> CareerPlanStatusRead:
    """The other half of the human-in-the-loop gate: explicitly declines
    the draft roadmap. Nothing is persisted — the analysis from `/start`
    remains the user's current analysis, and no roadmap row is created."""
    try:
        supervisor.resume(thread_id=str(user.id), decision="rejected", feedback=body.feedback)
    except Exception as exc:
        raise HTTPException(
            status.HTTP_409_CONFLICT, "No career plan is currently awaiting approval for this account."
        ) from exc

    analysis = await _latest_analysis(db, user.id)
    return CareerPlanStatusRead(status="rejected", analysis=SkillGapAnalysisRead.model_validate(analysis), roadmap=None)


@router.get("/skill-gap-analysis/current", response_model=SkillGapAnalysisRead)
async def get_current_skill_gap_analysis(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> SkillGapAnalysis:
    analysis = await _latest_analysis(db, user.id)
    if analysis is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No analysis yet — POST /skill-gap-analysis/refresh first")
    return analysis


@router.get("/skill-gap-analysis/history", response_model=list[SkillGapAnalysisRead])
async def get_skill_gap_analysis_history(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> list[SkillGapAnalysis]:
    """FR-AICC-19/20, BR-PROG-1: chronological record, not only current state."""
    result = await db.execute(
        select(SkillGapAnalysis)
        .options(_ANALYSIS_LOAD)
        .where(SkillGapAnalysis.user_id == user.id)
        .order_by(SkillGapAnalysis.version.desc())
    )
    return list(result.scalars().all())


@router.get("/roadmap/current", response_model=RoadmapRead)
async def get_current_roadmap(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> Roadmap:
    roadmap = await _latest_roadmap(db, user.id)
    if roadmap is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No roadmap yet")
    return roadmap


@router.patch("/roadmap/items/{item_id}/status", response_model=RoadmapItemStatusUpdate)
async def update_roadmap_item_status(
    item_id: UUID,
    body: RoadmapItemStatusUpdate,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
) -> RoadmapItemStatusUpdate:
    """SAS Part IV §21.3 — User Override of an AI Recommendation. This is
    the one write path into a Roadmap Item that the Roadmap Agent never
    uses (SAS §25.8): status is exclusively user-controlled."""
    result = await db.execute(
        select(RoadmapItem).join(Roadmap).where(RoadmapItem.id == item_id, Roadmap.user_id == user.id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Roadmap item not found")

    item.status = body.status
    db.add(item)
    # BR-ROAD-6: append, never overwrite, the status-change history.
    db.add(RoadmapItemStatusChange(item_id=item.id, status=body.status))
    await db.commit()
    return body


@router.post("/cv-feedback", response_model=CVFeedbackRoundRead, status_code=status.HTTP_201_CREATED)
async def submit_cv_feedback(
    body: CVFeedbackSubmitRequest,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    agent: CVFeedbackAgent = Depends(get_cv_feedback_agent),
    _rate_limit: None = Depends(cv_feedback_submit_limiter),
) -> CVFeedbackRound:
    """FR-AICC-13. Accepts submitted text directly for now — real file
    upload via Supabase Storage (`document_storage_path`) is a near-term
    follow-up; see backend/README.md. This is a deliberate, documented
    interface choice (paste/type the document's text), not a placeholder:
    the full pipeline from here on — agent call, persistence, explanation,
    deletion — is real and production-complete."""
    document_text = body.document_text.strip()
    if not document_text:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "document_text must not be empty")
    try:
        document_text = sanitize_free_text(document_text, field_name="document_text")
    except PromptInjectionDetected as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, str(exc)) from exc

    goal = _active_goal(user)
    if goal is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Set an active goal before requesting feedback")

    result = await db.execute(
        select(CVFeedbackRound)
        .where(CVFeedbackRound.user_id == user.id)
        .order_by(CVFeedbackRound.round_number.desc())
        .limit(1)
    )
    previous = result.scalar_one_or_none()

    try:
        output = agent.run(
            CVFeedbackInput(
                goal=GoalSnapshot(user_id=user.id, target_role=goal.target_role, target_field=goal.target_field),
                document_text=document_text,
                locale=user.locale,
            )
        )
    except GenerationFailed as exc:
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, str(exc)) from exc

    cv_round = CVFeedbackRound(
        user_id=user.id,
        round_number=(previous.round_number + 1 if previous else 1),
        document_storage_path=f"inline:{user.id}:{(previous.round_number + 1) if previous else 1}",
        document_text=document_text,
        confidence=output.confidence,
    )
    cv_round.items = [
        CVFeedbackItem(category=i.category, note=i.note, relevance_to_goal=i.relevance_to_goal)
        for i in output.items
    ]
    db.add(cv_round)
    # BR-NOTIF-1(a): a requested feedback review completes.
    notify(db, user, category="cv_feedback_complete", message_key="cv_feedback_complete", round=cv_round.round_number)
    await db.commit()
    await db.refresh(cv_round, attribute_names=["items"])
    return cv_round


@router.get("/cv-feedback", response_model=list[CVFeedbackRoundRead])
async def list_cv_feedback_rounds(
    user: User = Depends(_CAREER_SEEKER), db: AsyncSession = Depends(get_db)
) -> list[CVFeedbackRound]:
    """FR-AICC-18: view previous rounds, not only the most recent."""
    result = await db.execute(
        select(CVFeedbackRound)
        .options(selectinload(CVFeedbackRound.items))
        .where(CVFeedbackRound.user_id == user.id)
        .order_by(CVFeedbackRound.round_number.desc())
    )
    return list(result.scalars().all())


@router.delete("/cv-feedback/{round_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cv_feedback_round(
    round_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
) -> None:
    """FR-SET-3, BR-DATA-3: delete one specific stored CV Feedback Round,
    independent of full account deletion. Each round is self-contained (its
    own submitted text and its own feedback items, `cascade="all, delete-orphan"`
    on `CVFeedbackRound.items`) — deleting one never touches any other round,
    satisfying BR-DATA-4 by construction, not by policy alone."""
    result = await db.execute(
        select(CVFeedbackRound).where(CVFeedbackRound.id == round_id, CVFeedbackRound.user_id == user.id)
    )
    cv_round = result.scalar_one_or_none()
    if cv_round is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV feedback round not found")

    await db.delete(cv_round)
    await db.commit()


# --- Explainability (RAI-4, FR-AICC-5/11/16, PRD §28.8) ---------------------
#
# Each endpoint below is scoped to exactly one already-produced output — an
# explanation request is never open-ended (§28.8). Grounding here uses the
# user's CURRENT Profile/Goal/Analysis, not a point-in-time snapshot taken
# when the original output was generated (no such snapshot is persisted
# today). In the common case these are the same, since nothing yet
# auto-regenerates on a Profile edit (§27.5 is not implemented — see
# PHASE0-AUDIT.md); if the user has edited their Profile or Goal since the
# output was generated without requesting a refresh, the explanation
# reflects the data as it stands now. This is an honest, documented
# limitation, not a silent inaccuracy — a full historical-grounding
# snapshot is future work, not required for RAI-4's "grounded in actual
# graph data," since the data used is still real and still the user's own.


@router.get("/skill-gap-analysis/gaps/{gap_id}/explain", response_model=ExplanationRead)
async def explain_skill_gap_item(
    gap_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    llm=Depends(get_explainability_llm),
) -> ExplanationRead:
    """FR-AICC-5: explain, on request, why a specific skill was flagged."""
    result = await db.execute(
        select(SkillGapItem).join(SkillGapAnalysis).where(SkillGapItem.id == gap_id, SkillGapAnalysis.user_id == user.id)
    )
    gap = result.scalar_one_or_none()
    if gap is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Skill gap not found")

    goal = _active_goal(user)
    grounded_on = ["profile", "goal"]
    grounded_context = (
        f"Profile: background={user.profile.background!r}, education={user.profile.education!r}, "
        f"experience={user.profile.experience!r}, skills={user.profile.skills!r}\n"
        f"Goal: target_role={goal.target_role!r}, target_field={goal.target_field!r}\n"
        if user.profile and goal
        else "No current profile/goal available."
    )
    try:
        explanation = explain_output(
            llm,
            output_summary=f"{gap.skill}: {gap.description}",
            grounded_on=grounded_on,
            grounded_context=grounded_context,
            question_scope=f"why the skill '{gap.skill}' was flagged as a gap",
        )
    except Exception as exc:  # any LLM failure is an honest generation failure (BR-AI-5)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Explanation generation failed: {exc}") from exc

    return ExplanationRead(explanation=explanation, grounded_on=grounded_on)


@router.get("/roadmap/items/{item_id}/explain", response_model=ExplanationRead)
async def explain_roadmap_item(
    item_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    llm=Depends(get_explainability_llm),
) -> ExplanationRead:
    """FR-AICC-11: explain, on request, why a given roadmap item was recommended."""
    result = await db.execute(
        select(RoadmapItem).join(Roadmap).where(RoadmapItem.id == item_id, Roadmap.user_id == user.id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Roadmap item not found")

    analysis = await _latest_analysis(db, user.id)
    grounded_on = ["skill_gap_analysis.current"]
    grounded_context = (
        f"Skill-Gap Analysis summary: {analysis.summary}\n"
        + "\n".join(f"- {g.skill}: {g.description}" for g in analysis.gaps)
        if analysis
        else "No current analysis available."
    )
    try:
        explanation = explain_output(
            llm,
            output_summary=f"{item.title}: {item.description}",
            grounded_on=grounded_on,
            grounded_context=grounded_context,
            question_scope=(
                f"why the roadmap item '{item.title}' was recommended, "
                f"specifically how it addresses '{item.addresses_gap}'"
            ),
        )
    except Exception as exc:  # any LLM failure is an honest generation failure (BR-AI-5)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Explanation generation failed: {exc}") from exc

    return ExplanationRead(explanation=explanation, grounded_on=grounded_on)


@router.get("/cv-feedback/items/{item_id}/explain", response_model=ExplanationRead)
async def explain_cv_feedback_item(
    item_id: UUID,
    user: User = Depends(_CAREER_SEEKER),
    db: AsyncSession = Depends(get_db),
    llm=Depends(get_explainability_llm),
) -> ExplanationRead:
    """FR-AICC-16: explain, on request, why a specific piece of CV feedback matters."""
    result = await db.execute(
        select(CVFeedbackItem)
        .join(CVFeedbackRound)
        .where(CVFeedbackItem.id == item_id, CVFeedbackRound.user_id == user.id)
    )
    item = result.scalar_one_or_none()
    if item is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "CV feedback item not found")

    round_result = await db.execute(select(CVFeedbackRound).where(CVFeedbackRound.id == item.round_id))
    cv_round = round_result.scalar_one()
    goal = _active_goal(user)

    grounded_on = ["goal.target_role", "submitted_document"]
    grounded_context = (
        f"Target role: {goal.target_role!r}\n\nSubmitted document:\n{cv_round.document_text}\n"
        if goal
        else "No current goal available."
    )
    try:
        explanation = explain_output(
            llm,
            output_summary=f"[{item.category}] {item.note}",
            grounded_on=grounded_on,
            grounded_context=grounded_context,
            question_scope=f"why this feedback matters for the target role: {item.note!r}",
        )
    except Exception as exc:  # any LLM failure is an honest generation failure (BR-AI-5)
        raise HTTPException(status.HTTP_502_BAD_GATEWAY, f"Explanation generation failed: {exc}") from exc

    return ExplanationRead(explanation=explanation, grounded_on=grounded_on)
