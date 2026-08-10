"""Role/account architecture (Milestone 1 of the role-based ecosystem):
account_type persistence, the ecosystem personas' own profile CRUD, and
server-side role enforcement (`require_account_type`).
"""

from __future__ import annotations

from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.api.deps import require_account_type
from app.db.models import AccountType


def test_new_user_has_no_account_type(client: TestClient) -> None:
    response = client.get("/account/type")
    assert response.status_code == 200
    assert response.json()["account_type"] is None


def test_set_account_type_persists(client: TestClient) -> None:
    response = client.put("/account/type", json={"account_type": "company"})
    assert response.status_code == 200
    assert response.json()["account_type"] == "company"

    # Persisted server-side — a fresh GET (a new "request") sees it too,
    # not just the response of the call that set it.
    follow_up = client.get("/account/type")
    assert follow_up.json()["account_type"] == "company"


def test_set_account_type_rejects_unknown_value(client: TestClient) -> None:
    response = client.put("/account/type", json={"account_type": "not_a_real_role"})
    assert response.status_code == 422


def test_account_type_cannot_be_changed_once_set(client: TestClient) -> None:
    """A role is a one-time choice. Once assigned, a Student must not be
    able to become a Company (or any other role) by calling this endpoint
    again — enforced server-side, not just by the frontend no longer
    routing back to the role-selection screen."""
    first = client.put("/account/type", json={"account_type": "student"})
    assert first.status_code == 200

    second = client.put("/account/type", json={"account_type": "company"})
    assert second.status_code == 409

    # The original role is untouched.
    follow_up = client.get("/account/type")
    assert follow_up.json()["account_type"] == "student"


def test_account_type_put_is_idempotent_for_the_same_value(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "student"})
    repeat = client.put("/account/type", json={"account_type": "student"})
    assert repeat.status_code == 200
    assert repeat.json()["account_type"] == "student"


def test_company_profile_get_creates_empty_then_update_persists(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "company"})

    initial = client.get("/account/company-profile")
    assert initial.status_code == 200
    assert initial.json()["company_name"] == ""

    updated = client.patch(
        "/account/company-profile",
        json={"company_name": "Acme Robotics", "industry": "Robotics", "website": "https://acme.example"},
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["company_name"] == "Acme Robotics"
    assert body["industry"] == "Robotics"

    again = client.get("/account/company-profile")
    assert again.json()["company_name"] == "Acme Robotics"


def test_service_provider_profile_get_creates_empty_then_update_persists(client: TestClient) -> None:
    client.put("/account/type", json={"account_type": "service_provider"})

    initial = client.get("/account/service-provider-profile")
    assert initial.status_code == 200
    assert initial.json()["professional_title"] == ""

    updated = client.patch(
        "/account/service-provider-profile",
        json={
            "professional_title": "Career Coach",
            "expertise": ["Resume Review", "Mock Interviews"],
            "description": "Ten years coaching new grads.",
        },
    )
    assert updated.status_code == 200
    body = updated.json()
    assert body["professional_title"] == "Career Coach"
    assert body["expertise"] == ["Resume Review", "Mock Interviews"]

    again = client.get("/account/service-provider-profile")
    assert again.json()["professional_title"] == "Career Coach"


class TestRequireAccountType:
    """Direct unit tests of the enforcement dependency itself — the actual
    protected routes (job posting, service listing management) are added
    in later milestones, each with their own integration-level
    cross-role-denial test alongside this one."""

    async def test_allows_a_matching_role(self) -> None:
        dependency = require_account_type(AccountType.COMPANY)
        user = SimpleNamespace(account_type=AccountType.COMPANY)
        result = await dependency(user=user)
        assert result is user

    async def test_allows_any_of_multiple_roles(self) -> None:
        dependency = require_account_type(AccountType.STUDENT, AccountType.GRADUATE)
        user = SimpleNamespace(account_type=AccountType.GRADUATE)
        result = await dependency(user=user)
        assert result is user

    async def test_blocks_a_mismatched_role(self) -> None:
        dependency = require_account_type(AccountType.COMPANY)
        user = SimpleNamespace(account_type=AccountType.STUDENT)
        with pytest.raises(HTTPException) as exc_info:
            await dependency(user=user)
        assert exc_info.value.status_code == 403

    async def test_blocks_a_user_with_no_role_selected_yet(self) -> None:
        dependency = require_account_type(AccountType.COMPANY)
        user = SimpleNamespace(account_type=None)
        with pytest.raises(HTTPException) as exc_info:
            await dependency(user=user)
        assert exc_info.value.status_code == 403
