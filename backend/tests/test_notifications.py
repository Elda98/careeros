from fastapi.testclient import TestClient


def _complete_onboarding_bar(client: TestClient) -> None:
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})


def test_notifications_empty_initially(client: TestClient) -> None:
    response = client.get("/notifications")
    assert response.status_code == 200
    assert response.json() == []


def test_skill_gap_refresh_creates_analysis_and_roadmap_notifications(client: TestClient) -> None:
    """BR-NOTIF-1(a): a requested analysis completes. FR-NOTIF-4: the
    cascaded roadmap regeneration is a system-initiated consequence, not a
    direct request, and must notify too — SAS Part IV §19.3's material-change
    scenario names exactly this distinction."""
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")

    notifications = client.get("/notifications").json()
    categories = {n["category"] for n in notifications}
    assert "analysis_complete" in categories
    assert "roadmap_updated" in categories
    assert all(n["is_read"] is False for n in notifications)


def test_cv_feedback_creates_notification(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/cv-feedback", json={"document_text": "My CV"})

    notifications = client.get("/notifications").json()
    assert any(n["category"] == "cv_feedback_complete" for n in notifications)


def test_mark_notification_read(client: TestClient) -> None:
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    notification_id = client.get("/notifications").json()[0]["id"]

    response = client.patch(f"/notifications/{notification_id}/read")
    assert response.status_code == 200
    assert response.json()["is_read"] is True

    notifications = client.get("/notifications").json()
    marked = next(n for n in notifications if n["id"] == notification_id)
    assert marked["is_read"] is True


def test_mark_unknown_notification_read_404s(client: TestClient) -> None:
    response = client.patch("/notifications/00000000-0000-0000-0000-000000000000/read")
    assert response.status_code == 404
