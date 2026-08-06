from fastapi.testclient import TestClient

from app.api.deps import get_clerk_admin_client
from app.main import app
from tests.fake_agents import FailingClerkAdminClient, FakeClerkAdminClient


def _complete_onboarding_bar(client: TestClient) -> None:
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})


# --- Account (FR-AUTH-4/5) ---------------------------------------------------


def test_get_account_returns_email_and_member_since(client: TestClient) -> None:
    response = client.get("/settings/account")
    assert response.status_code == 200
    body = response.json()
    assert body["email"]
    assert body["member_since"]


def test_delete_account_removes_clerk_identity_and_all_local_data(client: TestClient) -> None:
    """FR-AUTH-5, BR-DATA-5: both the Clerk-side identity and every local
    row must be gone — including rows that only exist because of the FK
    ordering constraint (Roadmap before SkillGapAnalysis)."""
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    client.post("/ai-career-center/cv-feedback", json={"document_text": "Some CV content here."})
    client.get("/settings/subscription")  # provisions a row
    client.get("/settings/notification-preferences")  # provisions a row

    fake_clerk = FakeClerkAdminClient()
    app.dependency_overrides[get_clerk_admin_client] = lambda: fake_clerk
    try:
        response = client.delete("/settings/account")
    finally:
        app.dependency_overrides[get_clerk_admin_client] = lambda: FakeClerkAdminClient()

    assert response.status_code == 204
    assert fake_clerk.deleted_user_ids == ["user_test123"]

    # A fresh request re-provisions a brand new user row (deps.py creates one
    # on first sight of an unrecognized Clerk id) — so the profile/goal/
    # subscription state must all read back as empty, proving the old rows
    # (and everything that referenced them) are actually gone.
    assert client.get("/profile").json()["background"] == ""
    assert client.get("/profile/goals").json() == []
    assert client.get("/settings/data").json()["skill_gap_analyses_count"] == 0
    assert client.get("/settings/data").json()["roadmaps_count"] == 0
    assert client.get("/settings/data").json()["cv_feedback_rounds_count"] == 0


def test_delete_account_leaves_local_data_untouched_when_clerk_fails(client: TestClient) -> None:
    """Ordering rationale in settings.py::delete_account — if the Clerk-side
    call fails, nothing local may be touched, so the operation stays safely
    retryable."""
    _complete_onboarding_bar(client)

    app.dependency_overrides[get_clerk_admin_client] = lambda: FailingClerkAdminClient()
    try:
        response = client.delete("/settings/account")
    finally:
        app.dependency_overrides[get_clerk_admin_client] = lambda: FakeClerkAdminClient()

    assert response.status_code == 502

    # Local data must be completely intact — same Clerk user id, so this
    # reads back the same (not a freshly re-provisioned) row.
    profile = client.get("/profile").json()
    assert profile["background"] == "BSc CS"
    goals = client.get("/profile/goals").json()
    assert len(goals) == 1


# --- Subscription & Billing (FR-SET-1, FR-SET-4, FR-RENEW-1/2) --------------


def test_get_subscription_creates_free_tier_by_default(client: TestClient) -> None:
    response = client.get("/settings/subscription")
    assert response.status_code == 200
    body = response.json()
    assert body["tier"] == "free"
    assert body["status"] == "active"
    assert body["cancellation_reason"] is None


def test_cancel_subscription(client: TestClient) -> None:
    client.get("/settings/subscription")  # provisions the row
    response = client.post("/settings/subscription/cancel")
    assert response.status_code == 200
    assert response.json()["status"] == "canceled"

    # BR-SUB-4/5: cancellation retains the row and does not delete the account.
    after = client.get("/settings/subscription").json()
    assert after["status"] == "canceled"


def test_cancel_subscription_without_body_does_not_require_one(client: TestClient) -> None:
    """FR-RENEW-2: a reason is optional — omitting the request body entirely
    (not just omitting the field) must still succeed."""
    response = client.post("/settings/subscription/cancel", content=b"")
    assert response.status_code == 200
    assert response.json()["cancellation_reason"] is None


def test_cancel_subscription_stores_optional_reason(client: TestClient) -> None:
    response = client.post("/settings/subscription/cancel", json={"reason": "Too expensive"})
    assert response.status_code == 200
    assert response.json()["cancellation_reason"] == "Too expensive"

    after = client.get("/settings/subscription").json()
    assert after["cancellation_reason"] == "Too expensive"


def test_renewal_recap_reflects_real_progress(client: TestClient) -> None:
    response = client.get("/settings/renewal-recap")
    assert response.status_code == 200
    empty = response.json()
    assert empty["roadmap_items_total_count"] == 0
    assert empty["cv_feedback_rounds_count"] == 0

    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")
    client.post("/ai-career-center/cv-feedback", json={"document_text": "Some CV content here."})

    after = client.get("/settings/renewal-recap").json()
    assert after["roadmap_items_total_count"] == 1
    assert after["cv_feedback_rounds_count"] == 1
    assert after["roadmap_items_completed_count"] == 0  # nothing marked completed yet


# --- Notification Preferences (FR-NOTIF-3) -----------------------------------


def test_get_notification_preferences_defaults_to_none_muted(client: TestClient) -> None:
    response = client.get("/settings/notification-preferences")
    assert response.status_code == 200
    body = response.json()
    assert body["muted_categories"] == []
    assert "analysis_complete" in body["available_categories"]


def test_update_notification_preferences_mutes_a_category(client: TestClient) -> None:
    response = client.patch("/settings/notification-preferences", json={"muted_categories": ["roadmap_updated"]})
    assert response.status_code == 200
    assert response.json()["muted_categories"] == ["roadmap_updated"]

    after = client.get("/settings/notification-preferences").json()
    assert after["muted_categories"] == ["roadmap_updated"]


def test_update_notification_preferences_rejects_unknown_category(client: TestClient) -> None:
    response = client.patch("/settings/notification-preferences", json={"muted_categories": ["not_a_real_category"]})
    assert response.status_code == 400
    assert "not_a_real_category" in response.json()["detail"]


def test_muted_category_actually_suppresses_the_notification(client: TestClient) -> None:
    """The behavioral proof that this isn't a fake setting: muting
    roadmap_updated must mean the notification list stays empty after an
    action that would otherwise write one."""
    client.patch("/settings/notification-preferences", json={"muted_categories": ["analysis_complete"]})
    _complete_onboarding_bar(client)
    client.post("/ai-career-center/skill-gap-analysis/refresh")

    notifications = client.get("/notifications").json()
    categories = {n["category"] for n in notifications}
    assert "analysis_complete" not in categories


# --- AI & Memory Controls / Data overview (FR-SET-2, BR-DATA-6) -------------


def test_view_stored_data_reflects_current_state(client: TestClient) -> None:
    response = client.get("/settings/data")
    assert response.status_code == 200
    body = response.json()
    assert body["profile_present"] is False
    assert body["goals_count"] == 0

    client.patch("/profile", json={"background": "BSc CS"})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})

    updated = client.get("/settings/data").json()
    assert updated["profile_present"] is True
    assert updated["goals_count"] == 1


def test_view_stored_data_includes_subscription_tier(client: TestClient) -> None:
    client.get("/settings/subscription")  # provisions the free-tier row
    body = client.get("/settings/data").json()
    assert body["subscription_tier"] == "free"
