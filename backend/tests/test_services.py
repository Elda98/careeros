"""Service Provider MVP (Milestone 4): listing CRUD, ownership enforcement,
server-side role enforcement, and discovery."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id
from app.main import app
from tests.conftest import TEST_CLERK_USER_ID

OTHER_PROVIDER_CLERK_ID = "user_other_provider"
STUDENT_CLERK_ID = "user_student_browsing"


def _as(clerk_id: str):
    app.dependency_overrides[get_current_user_id] = lambda: clerk_id


def _reset():
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID


def _become_provider(client: TestClient, *, title: str = "Career Coach") -> None:
    client.put("/account/type", json={"account_type": "service_provider"})
    client.patch("/account/service-provider-profile", json={"professional_title": title})


def test_student_cannot_create_service_listing(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "student"})
    response = client.post("/provider/services", json={"title": "Resume Review"})
    assert response.status_code == 403


def test_provider_without_profile_cannot_publish(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "service_provider"})
    response = client.post("/provider/services", json={"title": "Resume Review"})
    assert response.status_code == 400


def test_provider_can_create_and_list_own_service(client: TestClient) -> None:
    _become_provider(client)
    created = client.post("/provider/services", json={"title": "Resume Review", "category": "Career Coaching"})
    assert created.status_code == 201
    assert created.json()["status"] == "active"

    listed = client.get("/provider/services")
    assert [s["title"] for s in listed.json()] == ["Resume Review"]


def test_provider_cannot_access_another_providers_listing(client: TestClient) -> None:
    _become_provider(client, title="Career Coach")
    created = client.post("/provider/services", json={"title": "Resume Review"})
    listing_id = created.json()["id"]

    try:
        _as(OTHER_PROVIDER_CLERK_ID)
        _become_provider(client, title="Interview Prep Pro")
        update = client.patch(f"/provider/services/{listing_id}", json={"title": "Hijacked"})
        assert update.status_code == 404
    finally:
        _reset()


def test_recommended_services_matches_current_skill_gap(client: TestClient) -> None:
    """Milestone 5 (ecosystem connection): Student/Graduate -> Skill Gap ->
    Needed Support -> Service Providers. FakeSkillGapAnalysisAgent
    (tests/fake_agents.py) always returns a gap on "SQL", so a listing about
    SQL should be recommended and an unrelated one should not."""
    _become_provider(client, title="Career Coach")
    client.post("/provider/services", json={"title": "SQL Fundamentals Tutoring", "category": "Databases"})
    client.post("/provider/services", json={"title": "Resume Review", "category": "Career Coaching"})

    try:
        _as(STUDENT_CLERK_ID)
        client.put("/account/type", json={"account_type": "student"})

        # No skill-gap analysis yet -> no recommendations (nothing to match against).
        empty = client.get("/services/recommended")
        assert empty.status_code == 200
        assert empty.json() == []

        client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
        client.post("/profile/goals", json={"target_role": "Backend Engineer"})
        client.post("/ai-career-center/skill-gap-analysis/refresh")

        recommended = client.get("/services/recommended")
        assert recommended.status_code == 200
        titles = [s["title"] for s in recommended.json()]
        assert titles == ["SQL Fundamentals Tutoring"]
    finally:
        _reset()


def test_browse_shows_only_active_listings_with_provider_identity(client: TestClient) -> None:
    _become_provider(client, title="Career Coach")
    client.post("/provider/services", json={"title": "Resume Review", "category": "Career Coaching"})
    inactive = client.post("/provider/services", json={"title": "Mock Interviews"})
    client.patch(f"/provider/services/{inactive.json()['id']}", json={"status": "inactive"})

    try:
        _as(STUDENT_CLERK_ID)
        client.put("/account/type", json={"account_type": "student"})
        browse = client.get("/services")
        assert browse.status_code == 200
        titles = [s["title"] for s in browse.json()]
        assert titles == ["Resume Review"]
        assert browse.json()[0]["provider_title"] == "Career Coach"
    finally:
        _reset()
