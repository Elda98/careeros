"""Company MVP (Milestone 3 of the role-based ecosystem): job/internship
posting CRUD, ownership enforcement (IDOR-safe), server-side role
enforcement (a Student cannot post a job), and the minimal candidate
browse/apply path.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id
from app.main import app
from tests.conftest import TEST_CLERK_USER_ID

OTHER_COMPANY_CLERK_ID = "user_other_company"
STUDENT_CLERK_ID = "user_student"


def _as(clerk_id: str):
    app.dependency_overrides[get_current_user_id] = lambda: clerk_id


def _reset():
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID


def _become_company(client: TestClient, *, name: str = "Acme Robotics") -> None:
    client.put("/account/type", json={"account_type": "company"})
    client.patch("/account/company-profile", json={"company_name": name})


def test_student_cannot_create_opportunity(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "student"})
    response = client.post("/company/opportunities", json={"title": "Backend Intern"})
    assert response.status_code == 403


def test_company_without_profile_cannot_post(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "company"})
    # No PATCH /account/company-profile — company_name is still "".
    response = client.post("/company/opportunities", json={"title": "Backend Intern"})
    assert response.status_code == 400


def test_company_can_create_and_list_own_opportunity(client: TestClient) -> None:
    _become_company(client)
    create = client.post(
        "/company/opportunities",
        json={"title": "Backend Intern", "opportunity_type": "internship", "required_skills": ["Python", "SQL"]},
    )
    assert create.status_code == 201
    body = create.json()
    assert body["title"] == "Backend Intern"
    assert body["status"] == "open"

    listed = client.get("/company/opportunities")
    assert listed.status_code == 200
    assert [o["title"] for o in listed.json()] == ["Backend Intern"]


def test_company_cannot_access_another_companys_opportunity(client: TestClient) -> None:
    _become_company(client, name="Acme Robotics")
    created = client.post("/company/opportunities", json={"title": "Backend Intern"})
    opportunity_id = created.json()["id"]

    try:
        _as(OTHER_COMPANY_CLERK_ID)
        _become_company(client, name="Other Corp")
        update = client.patch(f"/company/opportunities/{opportunity_id}", json={"title": "Hijacked"})
        assert update.status_code == 404
        applications = client.get(f"/company/opportunities/{opportunity_id}/applications")
        assert applications.status_code == 404
    finally:
        _reset()


def test_browse_shows_open_opportunities_with_company_name(client: TestClient) -> None:
    _become_company(client, name="Acme Robotics")
    client.post("/company/opportunities", json={"title": "Backend Intern"})
    closed = client.post("/company/opportunities", json={"title": "Closed Role"})
    client.patch(f"/company/opportunities/{closed.json()['id']}", json={"status": "closed"})

    try:
        _as(STUDENT_CLERK_ID)
        client.put("/account/type", json={"account_type": "student"})
        browse = client.get("/opportunities")
        assert browse.status_code == 200
        titles = [o["title"] for o in browse.json()]
        assert titles == ["Backend Intern"]
        assert browse.json()[0]["company_name"] == "Acme Robotics"
    finally:
        _reset()


def test_apply_then_company_sees_application_then_updates_status(client: TestClient) -> None:
    _become_company(client, name="Acme Robotics")
    created = client.post("/company/opportunities", json={"title": "Backend Intern"})
    opportunity_id = created.json()["id"]

    try:
        _as(STUDENT_CLERK_ID)
        client.put("/account/type", json={"account_type": "student"})
        apply_response = client.post(f"/opportunities/{opportunity_id}/apply")
        assert apply_response.status_code == 201
        assert apply_response.json()["status"] == "submitted"
        assert apply_response.json()["opportunity"]["title"] == "Backend Intern"

        mine = client.get("/opportunities/mine/applications")
        assert len(mine.json()) == 1
        application_id = mine.json()[0]["id"]

        # Applying twice is rejected.
        duplicate = client.post(f"/opportunities/{opportunity_id}/apply")
        assert duplicate.status_code == 409
    finally:
        _reset()

    # Back to the company: sees the applicant, no private career data leaked.
    applications = client.get(f"/company/opportunities/{opportunity_id}/applications")
    assert applications.status_code == 200
    assert len(applications.json()) == 1
    applicant = applications.json()[0]["applicant"]
    assert set(applicant.keys()) == {"user_id", "email"}

    update = client.patch(
        f"/company/opportunities/{opportunity_id}/applications/{application_id}",
        json={"status": "accepted"},
    )
    assert update.status_code == 200
    assert update.json()["status"] == "accepted"


def test_cannot_apply_to_a_closed_opportunity(client: TestClient) -> None:
    _become_company(client, name="Acme Robotics")
    created = client.post("/company/opportunities", json={"title": "Backend Intern"})
    opportunity_id = created.json()["id"]
    client.patch(f"/company/opportunities/{opportunity_id}", json={"status": "closed"})

    try:
        _as(STUDENT_CLERK_ID)
        client.put("/account/type", json={"account_type": "student"})
        response = client.post(f"/opportunities/{opportunity_id}/apply")
        assert response.status_code == 404
    finally:
        _reset()
