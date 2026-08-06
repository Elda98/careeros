"""Real end-to-end verification of the Phase 0 onboarding flow.

Unlike backend/tests/ (which intentionally uses SQLite + fake agents, so it
never needs a live database or LLM), this script exercises the REAL
dependency graph: the real Postgres database (via DATABASE_URL) and the
real LangGraph agents making real Groq API calls. The only thing stubbed is
Clerk's browser-based OAuth — FastAPI's TestClient can't drive a real
sign-in flow, so `get_current_user_id` is overridden with a fixed test
identity, exactly the way an actually-authenticated request would look to
everything downstream of it.

Run inside the backend container (recommended, so DATABASE_URL correctly
resolves to the `postgres` service and GROQ_API_KEY is loaded from the
container's environment):

    docker compose -f docker/docker-compose.yml exec backend python scripts/verify_e2e.py

Creates one throwaway user (a random clerk_user_id per run, so repeat runs
never collide) and leaves its data in place at the end so you can inspect
it — prints the user id so you know what to look for or delete.
"""

from __future__ import annotations

import sys
import uuid

from fastapi.testclient import TestClient

from app.core.auth import get_current_user_id
from app.main import app

TEST_CLERK_USER_ID = f"user_e2e_{uuid.uuid4().hex[:12]}"


def _step(name: str):
    print(f"\n{'=' * 60}\n{name}\n{'=' * 60}")


def _check(response, expected_status: int, step: str):
    if response.status_code != expected_status:
        print(f"FAILED at: {step}")
        print(f"  status: {response.status_code} (expected {expected_status})")
        print(f"  body:   {response.text}")
        sys.exit(1)
    return response.json()


def main() -> None:
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID
    # Must be used as a context manager: TestClient runs the ASGI app on a
    # single persistent event loop for the life of the `with` block. Without
    # it, each call gets its own loop while the async SQLAlchemy engine's
    # connection pool stays bound to whichever loop first touched it —
    # surfaces as "Future attached to a different loop" on the second call.
    with TestClient(app) as client:
        _run(client)


def _run(client: TestClient) -> None:
    print(f"Verification user: {TEST_CLERK_USER_ID}")

    _step("1. Create test user (JIT-provisioned on first authenticated call)")
    body = _check(client.get("/profile"), 200, "GET /profile")
    print(f"  Profile created: {body}")

    _step("2. Complete onboarding — Profile")
    body = _check(
        client.patch(
            "/profile",
            json={
                "background": "Final-year Computer Science student",
                "education": "BSc Computer Science, King Saud University",
                "experience": "3-month backend internship",
                "skills": ["Python", "Git"],
            },
        ),
        200,
        "PATCH /profile",
    )
    print(f"  Profile updated: skills={body['skills']}")

    _step("3. Complete onboarding — Goal selection")
    body = _check(
        client.post("/profile/goals", json={"target_role": "Backend Engineer", "target_field": "Fintech"}),
        201,
        "POST /profile/goals",
    )
    print(f"  Goal created: {body['target_role']} (active={body['is_active']})")

    _step("4. Confirm onboarding-status hard bar is met")
    body = _check(client.get("/profile/onboarding-status"), 200, "GET /profile/onboarding-status")
    print(f"  meets_hard_bar={body['meets_hard_bar']}  onboarding_completed={body['onboarding_completed']}")
    if not body["meets_hard_bar"]:
        print("FAILED: hard bar not met, cannot proceed to analysis")
        sys.exit(1)

    _step("5. Generate Skill-Gap Analysis (REAL Groq call via SkillGapAnalysisAgent)")
    body = _check(
        client.post("/ai-career-center/skill-gap-analysis/refresh"), 200, "POST /skill-gap-analysis/refresh"
    )
    print(f"  version={body['version']}  confidence={body['confidence']}")
    print(f"  summary: {body['summary']}")
    for gap in body["gaps"]:
        print(f"    - gap: {gap['skill']} ({gap['severity']}): {gap['description']}")
    if not body["gaps"]:
        print("WARNING: analysis produced zero gaps — check the model's output quality")
    first_gap_id = body["gaps"][0]["id"] if body["gaps"] else None

    _step("5b. Explain the first skill gap (RAI-4, FR-AICC-5, REAL Groq call)")
    if first_gap_id:
        exp = _check(
            client.get(f"/ai-career-center/skill-gap-analysis/gaps/{first_gap_id}/explain"),
            200,
            "GET /skill-gap-analysis/gaps/{id}/explain",
        )
        print(f"  explanation: {exp['explanation']}")
        if not exp["explanation"]:
            print("FAILED: empty explanation")
            sys.exit(1)
    else:
        print("  skipped (no gaps to explain)")

    _step("6. Verify Roadmap was auto-generated (cascade from step 5, REAL Groq call via RoadmapAgent)")
    body = _check(client.get("/ai-career-center/roadmap/current"), 200, "GET /roadmap/current")
    print(f"  version={body['version']}  confidence={body['confidence']}")
    for item in body["items"]:
        print(f"    - item: {item['title']} (addresses: {item['addresses_gap']}, status: {item['status']})")
    if not body["items"]:
        print("FAILED: roadmap has zero items")
        sys.exit(1)
    first_item_id = body["items"][0]["id"]

    _step("7. Exercise Roadmap Item status override (user control, never agent-written)")
    body = _check(
        client.patch(f"/ai-career-center/roadmap/items/{first_item_id}/status", json={"status": "in_progress"}),
        200,
        "PATCH /roadmap/items/{id}/status",
    )
    print(f"  status set to: {body['status']}")

    _step("7b. Explain the first roadmap item (RAI-4, FR-AICC-11, REAL Groq call)")
    exp = _check(
        client.get(f"/ai-career-center/roadmap/items/{first_item_id}/explain"),
        200,
        "GET /roadmap/items/{id}/explain",
    )
    print(f"  explanation: {exp['explanation']}")
    if not exp["explanation"]:
        print("FAILED: empty explanation")
        sys.exit(1)

    _step("8. Generate CV Feedback (REAL Groq call via CVFeedbackAgent)")
    sample_cv = (
        "Jane Doe. Final-year CS student. Built a REST API for a class project using Flask. "
        "Looking for a backend engineering role."
    )
    body = _check(
        client.post("/ai-career-center/cv-feedback", json={"document_text": sample_cv}),
        201,
        "POST /cv-feedback",
    )
    print(f"  round_number={body['round_number']}  confidence={body['confidence']}")
    for item in body["items"]:
        print(f"    - [{item['category']}] {item['note']}")
    if not body["items"]:
        print("FAILED: CV feedback has zero items")
        sys.exit(1)
    print(f"  document_text persisted: {body['document_text'] == sample_cv}")
    if body["document_text"] != sample_cv:
        print("FAILED: submitted document text was not persisted correctly")
        sys.exit(1)
    first_cv_item_id = body["items"][0]["id"]
    first_cv_round_id = body["id"]

    _step("8b. Explain the first CV feedback item (RAI-4, FR-AICC-16, REAL Groq call)")
    exp = _check(
        client.get(f"/ai-career-center/cv-feedback/items/{first_cv_item_id}/explain"),
        200,
        "GET /cv-feedback/items/{id}/explain",
    )
    print(f"  explanation: {exp['explanation']}")
    if not exp["explanation"]:
        print("FAILED: empty explanation")
        sys.exit(1)

    _step("8c. Submit a second CV, then delete the first round (FR-SET-3, BR-DATA-3/4)")
    second_cv = sample_cv + " Also familiar with PostgreSQL."
    second_round = _check(
        client.post("/ai-career-center/cv-feedback", json={"document_text": second_cv}),
        201,
        "POST /cv-feedback (second round)",
    )
    print(f"  second round created: round_number={second_round['round_number']}")

    delete_response = client.delete(f"/ai-career-center/cv-feedback/{first_cv_round_id}")
    if delete_response.status_code != 204:
        print(f"FAILED: DELETE /cv-feedback/{{id}} -> {delete_response.status_code} {delete_response.text}")
        sys.exit(1)
    remaining = _check(client.get("/ai-career-center/cv-feedback"), 200, "GET /cv-feedback (after delete)")
    remaining_ids = {r["id"] for r in remaining}
    if first_cv_round_id in remaining_ids or second_round["id"] not in remaining_ids:
        print(f"FAILED: deletion did not behave as expected — remaining rounds: {[r['round_number'] for r in remaining]}")
        sys.exit(1)
    print(f"  round {first_cv_round_id} deleted; round {second_round['round_number']} still present (BR-DATA-4)")

    _step("9. Confirm onboarding_completed flag now True")
    body = _check(client.get("/profile/onboarding-status"), 200, "GET /profile/onboarding-status (final)")
    print(f"  onboarding_completed={body['onboarding_completed']}")
    if not body["onboarding_completed"]:
        print("FAILED: onboarding_completed did not flip to True")
        sys.exit(1)

    _step("10. Dashboard read (zero-agent path, must reflect Roadmap Agent's own output)")
    body = _check(client.get("/dashboard"), 200, "GET /dashboard")
    print(f"  next_action={body['next_action']}")
    print(f"  current_confidence={body['current_confidence']}")

    _step("11. Confirm notifications were written (BR-NOTIF-1, FR-NOTIF-4)")
    notifications = _check(client.get("/notifications"), 200, "GET /notifications")
    categories = {n["category"] for n in notifications}
    for n in notifications:
        print(f"    - [{n['category']}] {n['message']}")
    expected = {"analysis_complete", "roadmap_updated", "cv_feedback_complete"}
    if not expected.issubset(categories):
        print(f"FAILED: expected categories {expected}, got {categories}")
        sys.exit(1)

    _step("12. Settings — Account information (FR-AUTH-4)")
    body = _check(client.get("/settings/account"), 200, "GET /settings/account")
    print(f"  email={body['email']}  member_since={body['member_since']}")

    _step("13. Settings — Subscription lifecycle (FR-SET-1, FR-SET-4, FR-RENEW-2)")
    body = _check(client.get("/settings/subscription"), 200, "GET /settings/subscription")
    print(f"  tier={body['tier']}  status={body['status']}")
    if body["tier"] != "free" or body["status"] != "active":
        print("FAILED: a brand-new subscription must default to free/active")
        sys.exit(1)

    body = _check(
        client.post("/settings/subscription/cancel", json={"reason": "verify_e2e run"}),
        200,
        "POST /settings/subscription/cancel",
    )
    print(f"  status={body['status']}  cancellation_reason={body['cancellation_reason']}")
    if body["status"] != "canceled" or body["cancellation_reason"] != "verify_e2e run":
        print("FAILED: cancellation status/reason not persisted correctly")
        sys.exit(1)

    body = _check(client.get("/settings/subscription"), 200, "GET /settings/subscription (after cancel)")
    if body["status"] != "canceled":
        print("FAILED: cancellation did not persist across requests (BR-SUB-4/5)")
        sys.exit(1)
    print("  cancellation persisted; account not deleted, data retained (BR-SUB-4/5)")

    _step("14. Settings — Renewal recap (FR-RENEW-1, computed on demand — see schemas/settings.py)")
    body = _check(client.get("/settings/renewal-recap"), 200, "GET /settings/renewal-recap")
    print(
        f"  roadmap_items_completed={body['roadmap_items_completed_count']}/"
        f"{body['roadmap_items_total_count']}  skills_addressed={body['skills_addressed_count']}  "
        f"cv_feedback_rounds={body['cv_feedback_rounds_count']}"
    )
    if body["roadmap_items_total_count"] == 0 or body["cv_feedback_rounds_count"] == 0:
        print("FAILED: recap should reflect the roadmap/CV feedback generated in earlier steps")
        sys.exit(1)

    _step("15. Settings — Notification preferences actually suppress notifications (FR-NOTIF-3)")
    body = _check(client.get("/settings/notification-preferences"), 200, "GET /settings/notification-preferences")
    print(f"  muted_categories={body['muted_categories']}  available={body['available_categories']}")

    reject = client.patch("/settings/notification-preferences", json={"muted_categories": ["not_a_real_category"]})
    if reject.status_code != 400:
        print(f"FAILED: unknown category should be rejected with 400, got {reject.status_code}")
        sys.exit(1)
    print("  unknown category correctly rejected with 400")

    body = _check(
        client.patch("/settings/notification-preferences", json={"muted_categories": ["roadmap_updated"]}),
        200,
        "PATCH /settings/notification-preferences",
    )
    if body["muted_categories"] != ["roadmap_updated"]:
        print("FAILED: mute update did not persist as sent")
        sys.exit(1)

    before_ids = {n["id"] for n in _check(client.get("/notifications"), 200, "GET /notifications (before)")}
    _check(
        client.patch(f"/ai-career-center/roadmap/items/{first_item_id}/status", json={"status": "completed"}),
        200,
        "PATCH /roadmap/items/{id}/status (would normally trigger roadmap_updated)",
    )
    after = _check(client.get("/notifications"), 200, "GET /notifications (after)")
    new_notifications = [n for n in after if n["id"] not in before_ids]
    if any(n["category"] == "roadmap_updated" for n in new_notifications):
        print("FAILED: muted category 'roadmap_updated' still produced a new notification")
        sys.exit(1)
    print("  muting roadmap_updated correctly suppressed the notification that status change would trigger")

    client.patch("/settings/notification-preferences", json={"muted_categories": []})  # restore for inspection

    _step("16. Settings — Data overview reflects everything generated so far (BR-DATA-6, DPR-14)")
    body = _check(client.get("/settings/data"), 200, "GET /settings/data")
    print(f"  {body}")
    if not body["profile_present"] or body["goals_count"] < 1 or body["skill_gap_analyses_count"] < 1:
        print("FAILED: data overview missing entities created earlier in this run")
        sys.exit(1)

    _step("17. Profile — Goal reactivation (BR-GOAL-5)")
    goals = _check(client.get("/profile/goals"), 200, "GET /profile/goals")
    original_goal = next(g for g in goals if g["target_role"] == "Backend Engineer")
    second_goal = _check(
        client.post("/profile/goals", json={"target_role": "Data Engineer", "target_field": ""}),
        201,
        "POST /profile/goals (second goal)",
    )
    print(f"  created second goal, active={second_goal['is_active']}")
    reactivated = _check(
        client.post(f"/profile/goals/{original_goal['id']}/reactivate"),
        200,
        "POST /profile/goals/{id}/reactivate",
    )
    if not reactivated["is_active"]:
        print("FAILED: reactivated goal should be active")
        sys.exit(1)
    active = _check(client.get("/profile/goals/active"), 200, "GET /profile/goals/active")
    if active["id"] != original_goal["id"]:
        print("FAILED: reactivation did not make the original goal the active one")
        sys.exit(1)
    print(f"  reactivated original goal '{active['target_role']}' as active again")

    _step(
        "18. Settings — Account deletion NOT exercised live (documented gap, not a placeholder — see backend/README.md)"
    )
    print(
        "  CLERK_SECRET_KEY is unset in this environment, so DELETE /settings/account would only\n"
        "  exercise its 502 failure path (Clerk call rejected before any local data is touched —\n"
        "  see settings.py::delete_account's ordering rationale). The success path (Clerk deletion\n"
        "  + ordered local cascade, including the Roadmap-before-SkillGapAnalysis FK ordering) is\n"
        "  fully covered by backend/tests/test_settings.py using FakeClerkAdminClient. This script\n"
        "  intentionally never runs a real, irreversible account deletion — set CLERK_SECRET_KEY and\n"
        "  test manually against a disposable Clerk account if the live Clerk-side call itself needs\n"
        "  verification."
    )

    print(f"\n{'=' * 60}")
    print(f"ALL STEPS PASSED. Test user: {TEST_CLERK_USER_ID}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
