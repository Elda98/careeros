from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id
from app.main import app
from tests.conftest import TEST_CLERK_USER_ID


def _complete_onboarding_bar(client: TestClient) -> None:
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})


def test_refresh_below_hard_bar_returns_400_with_missing_fields(client: TestClient) -> None:
    response = client.post("/ai-career-center/skill-gap-analysis/refresh")
    assert response.status_code == 400
    assert "missing_hard_bar_fields" in response.json()["detail"]


def test_refresh_generates_analysis_and_cascades_to_roadmap(client: TestClient) -> None:
    """SAS Part IV §18.5 (First Skill-Gap Analysis) cascading into §19.2
    (Roadmap Generation) — one endpoint call, two owned entities written."""
    _complete_onboarding_bar(client)

    analysis_response = client.post("/ai-career-center/skill-gap-analysis/refresh")
    assert analysis_response.status_code == 200
    analysis = analysis_response.json()
    assert analysis["version"] == 1
    assert analysis["gaps"][0]["skill"] == "SQL"

    roadmap_response = client.get("/ai-career-center/roadmap/current")
    assert roadmap_response.status_code == 200
    roadmap = roadmap_response.json()
    assert roadmap["version"] == 1
    assert roadmap["items"][0]["title"] == "Learn SQL basics"
    assert roadmap["items"][0]["status"] == "not_started"


def test_refresh_marks_onboarding_completed(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")

    status_response = client.get("/profile/onboarding-status")
    assert status_response.json()["onboarding_completed"] is True


def test_second_refresh_increments_version(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    second = client.post("/ai-career-center/skill-gap-analysis/refresh")
    assert second.json()["version"] == 2

    history = client.get("/ai-career-center/skill-gap-analysis/history").json()
    assert [a["version"] for a in history] == [2, 1]


def test_roadmap_item_status_override_is_never_written_by_the_agent(client: TestClient) -> None:
    """SAS Part IV §21.3 — User Override of an AI Recommendation."""
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    roadmap = client.get("/ai-career-center/roadmap/current").json()
    item_id = roadmap["items"][0]["id"]

    response = client.patch(f"/ai-career-center/roadmap/items/{item_id}/status", json={"status": "completed"})
    assert response.status_code == 200

    updated_roadmap = client.get("/ai-career-center/roadmap/current").json()
    assert updated_roadmap["items"][0]["status"] == "completed"
    # Content stays exactly what the (fake) agent produced — only status changed.
    assert updated_roadmap["items"][0]["title"] == "Learn SQL basics"


def test_cv_feedback_requires_active_goal(client: TestClient) -> None:
    response = client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV content"})
    assert response.status_code == 400


def test_cv_feedback_rejects_empty_document_text(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    response = client.post("/ai-career-center/cv-feedback", json={"document_text": "   "})
    assert response.status_code == 400


def test_cv_feedback_round_created_and_retained(client: TestClient) -> None:
    _complete_onboarding_bar(client)

    first = client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV v1"})
    assert first.status_code == 201
    assert first.json()["round_number"] == 1
    # The actually-submitted text must be retrievable later (FR-AICC-18) —
    # not just the feedback generated from it.
    assert first.json()["document_text"] == "My CV v1"

    second = client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV v2"})
    assert second.json()["round_number"] == 2

    # FR-AICC-18: both rounds remain visible, not only the latest.
    rounds = client.get("/ai-career-center/cv-feedback").json()
    assert [r["round_number"] for r in rounds] == [2, 1]
    assert [r["document_text"] for r in rounds] == ["My CV v2", "My CV v1"]


# --- Explainability (RAI-4, FR-AICC-5/11/16) --------------------------------


def test_explain_skill_gap_item(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    analysis = client.post("/ai-career-center/skill-gap-analysis/refresh").json()
    gap_id = analysis["gaps"][0]["id"]

    response = client.get(f"/ai-career-center/skill-gap-analysis/gaps/{gap_id}/explain")
    assert response.status_code == 200
    body = response.json()
    assert body["explanation"]
    assert "profile" in body["grounded_on"]


def test_explain_skill_gap_item_404_for_unknown_id(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    response = client.get("/ai-career-center/skill-gap-analysis/gaps/00000000-0000-0000-0000-000000000000/explain")
    assert response.status_code == 404


def test_explain_roadmap_item(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    roadmap = client.get("/ai-career-center/roadmap/current").json()
    item_id = roadmap["items"][0]["id"]

    response = client.get(f"/ai-career-center/roadmap/items/{item_id}/explain")
    assert response.status_code == 200
    assert response.json()["explanation"]


def test_explain_cv_feedback_item(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    cv_round = client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV"}).json()
    item_id = cv_round["items"][0]["id"]

    response = client.get(f"/ai-career-center/cv-feedback/items/{item_id}/explain")
    assert response.status_code == 200
    assert response.json()["explanation"]


# --- Data deletion (FR-SET-3, BR-DATA-3/4) ----------------------------------


def test_delete_cv_feedback_round(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    first = client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV v1"}).json()
    client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV v2"})

    response = client.delete(f"/ai-career-center/cv-feedback/{first['id']}")
    assert response.status_code == 204

    remaining = client.get("/ai-career-center/cv-feedback").json()
    # BR-DATA-4: deleting one round never touches any other round.
    assert [r["round_number"] for r in remaining] == [2]


def test_delete_unknown_cv_feedback_round_404s(client: TestClient) -> None:
    response = client.delete("/ai-career-center/cv-feedback/00000000-0000-0000-0000-000000000000")
    assert response.status_code == 404


def test_cannot_explain_another_users_roadmap_item(client: TestClient) -> None:
    """IDOR check: a scoped explanation request must be scoped to the
    requesting user's own output, not merely to a valid item id (PRD §28.8,
    RAI-13)."""
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    roadmap = client.get("/ai-career-center/roadmap/current").json()
    item_id = roadmap["items"][0]["id"]

    app.dependency_overrides[get_current_user_id] = lambda: "user_someone_else"
    try:
        response = client.get(f"/ai-career-center/roadmap/items/{item_id}/explain")
    finally:
        app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID
    assert response.status_code == 404


# --- Supervised career-plan flow (CareerSupervisor + human-in-the-loop) ---


def test_career_plan_start_persists_analysis_and_awaits_approval(client: TestClient) -> None:
    """The Skill-Gap Analysis is real and persisted immediately; the
    roadmap is not — it's only a draft until /approve is called."""
    _complete_onboarding_bar(client)

    response = client.post("/ai-career-center/career-plan/start")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "awaiting_approval"
    assert body["analysis"]["version"] == 1
    assert body["roadmap_draft"][0]["title"] == "Learn SQL basics"
    assert body["roadmap"] is None

    # The analysis is real (persisted); no roadmap exists yet anywhere.
    assert client.get("/ai-career-center/skill-gap-analysis/current").status_code == 200
    assert client.get("/ai-career-center/roadmap/current").status_code == 404


def test_career_plan_approve_persists_the_roadmap(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/career-plan/start")

    response = client.post("/ai-career-center/career-plan/approve", json={})
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "approved"
    assert body["roadmap"]["items"][0]["title"] == "Learn SQL basics"

    roadmap = client.get("/ai-career-center/roadmap/current").json()
    assert roadmap["version"] == 1


def test_career_plan_reject_persists_no_roadmap(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/career-plan/start")

    response = client.post("/ai-career-center/career-plan/reject", json={"feedback": "not specific enough"})
    assert response.status_code == 200
    assert response.json()["status"] == "rejected"
    assert response.json()["roadmap"] is None

    assert client.get("/ai-career-center/roadmap/current").status_code == 404


def test_career_plan_approve_without_a_pending_run_returns_409(client: TestClient) -> None:
    response = client.post("/ai-career-center/career-plan/approve", json={})
    assert response.status_code == 409
