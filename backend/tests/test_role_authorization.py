"""Milestone 7 (Phase 9, SDAIA rubric): a consolidated, cross-role
authorization matrix on top of the per-milestone ownership/role tests
already in test_account.py, test_opportunities.py, and test_services.py.

Those cover "a Student is blocked" and "a Company can't touch another
Company's data" in isolation. This file specifically covers what Phase 9
calls out that nothing else does: every non-owning account type against
every role-gated action (not just the one persona each milestone's own
tests happened to use), that an unauthenticated request is rejected before
any role check even runs, and that a role can never be supplied by the
client itself — only ever read back from the caller's own persisted
account_type row.
"""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id
from app.main import app
from tests.conftest import TEST_CLERK_USER_ID

ALL_ACCOUNT_TYPES = ["student", "graduate", "company", "service_provider"]


def _reset():
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID


@pytest.mark.parametrize("account_type", ["student", "graduate", "service_provider"])
def test_only_company_can_post_an_opportunity(client: TestClient, account_type: str) -> None:
    client.put("/account/type", json={"account_type": account_type})
    response = client.post("/company/opportunities", json={"title": "Backend Intern"})
    assert response.status_code == 403


@pytest.mark.parametrize("account_type", ["student", "graduate", "company"])
def test_only_service_provider_can_post_a_listing(client: TestClient, account_type: str) -> None:
    client.put("/account/type", json={"account_type": account_type})
    response = client.post("/provider/services", json={"title": "Resume Review"})
    assert response.status_code == 403


@pytest.mark.parametrize("account_type", ALL_ACCOUNT_TYPES)
def test_company_only_endpoints_reject_every_other_role_when_listing(client: TestClient, account_type: str) -> None:
    """GET, not just POST — a read-only company endpoint is exactly as much
    a company-only endpoint as a write one; only "company" should ever see
    200 here."""
    client.put("/account/type", json={"account_type": account_type})
    response = client.get("/company/opportunities")
    assert response.status_code == (200 if account_type == "company" else 403)


@pytest.mark.parametrize("account_type", ALL_ACCOUNT_TYPES)
def test_provider_only_endpoints_reject_every_other_role_when_listing(client: TestClient, account_type: str) -> None:
    client.put("/account/type", json={"account_type": account_type})
    response = client.get("/provider/services")
    assert response.status_code == (200 if account_type == "service_provider" else 403)


def test_no_account_type_selected_yet_is_blocked_from_every_role_gated_action(client: TestClient) -> None:
    """A brand-new user who hasn't picked a persona yet (account_type is
    still null) must be blocked exactly like a mismatched role — not
    treated as an implicit default or an open door."""
    company_response = client.post("/company/opportunities", json={"title": "Backend Intern"})
    assert company_response.status_code == 403
    provider_response = client.post("/provider/services", json={"title": "Resume Review"})
    assert provider_response.status_code == 403


def test_unauthenticated_request_is_rejected_before_any_role_check(client: TestClient) -> None:
    """Removes the test suite's own auth override entirely for one request,
    so this actually exercises the real `get_current_user_id` dependency
    (app/core/auth.py) instead of the fake identity every other test relies
    on — confirming a request with no bearer token 401s outright, never
    reaching `require_account_type` at all."""
    del app.dependency_overrides[get_current_user_id]
    try:
        response = client.post("/company/opportunities", json={"title": "Backend Intern"})
        assert response.status_code == 401
    finally:
        _reset()


def test_account_type_cannot_be_spoofed_via_the_request_body(client: TestClient) -> None:
    """require_account_type reads only the caller's persisted DB row
    (app/api/deps.py) via get_current_user — it never inspects the request
    at all. Proves a client can't smuggle a privileged role through an
    endpoint's own request body: an extra "account_type": "company" field
    on a JobOpportunityCreate payload is silently ignored by Pydantic
    (JobOpportunityCreate declares no such field), and the caller's real,
    persisted role (student) is what gets enforced."""
    client.put("/account/type", json={"account_type": "student"})
    response = client.post(
        "/company/opportunities",
        json={"title": "Backend Intern", "account_type": "company", "role": "company"},
    )
    assert response.status_code == 403


def test_account_type_cannot_be_spoofed_via_a_request_header(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "student"})
    response = client.post(
        "/company/opportunities",
        json={"title": "Backend Intern"},
        headers={"X-Account-Type": "company", "X-Role": "company"},
    )
    assert response.status_code == 403


def test_switching_declared_role_immediately_changes_enforcement(client: TestClient) -> None:
    """The role check reads the DB fresh on every request — proving
    enforcement is live, not cached from account creation or a prior
    request in the session."""
    client.put("/account/type", json={"account_type": "student"})
    assert client.post("/company/opportunities", json={"title": "Backend Intern"}).status_code == 403

    client.put("/account/type", json={"account_type": "company"})
    client.patch("/account/company-profile", json={"company_name": "Acme Robotics"})
    assert client.post("/company/opportunities", json={"title": "Backend Intern"}).status_code == 201
