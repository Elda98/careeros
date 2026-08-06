from fastapi.testclient import TestClient


def test_get_profile_creates_empty_profile_on_first_access(client: TestClient) -> None:
    response = client.get("/profile")
    assert response.status_code == 200
    body = response.json()
    assert body["background"] == ""
    assert body["skills"] == []


def test_update_profile_persists_fields(client: TestClient) -> None:
    response = client.patch(
        "/profile",
        json={"background": "BSc CS", "skills": ["Python", "SQL"]},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["background"] == "BSc CS"
    assert body["skills"] == ["Python", "SQL"]

    # FR-PROF-1: persists across requests, not just echoed back.
    refetched = client.get("/profile")
    assert refetched.json()["background"] == "BSc CS"


def test_onboarding_status_reflects_missing_fields(client: TestClient) -> None:
    response = client.get("/profile/onboarding-status")
    assert response.status_code == 200
    body = response.json()
    assert body["profile_exists"] is False
    assert body["goal_set"] is False
    assert body["meets_hard_bar"] is False
    assert "background" in body["missing_hard_bar_fields"]


def test_onboarding_status_meets_hard_bar_after_profile_and_goal(client: TestClient) -> None:
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})

    response = client.get("/profile/onboarding-status")
    body = response.json()
    assert body["goal_set"] is True
    assert body["meets_hard_bar"] is True
    assert body["onboarding_completed"] is False  # only set once an analysis actually runs


def test_goal_creation_deactivates_previous_active_goal(client: TestClient) -> None:
    first = client.post("/profile/goals", json={"target_role": "Backend Engineer"})
    assert first.json()["is_active"] is True

    second = client.post("/profile/goals", json={"target_role": "Data Engineer"})
    assert second.json()["is_active"] is True

    goals = client.get("/profile/goals").json()
    active_flags = {g["target_role"]: g["is_active"] for g in goals}
    assert active_flags == {"Backend Engineer": False, "Data Engineer": True}

    active = client.get("/profile/goals/active").json()
    assert active["target_role"] == "Data Engineer"


def test_no_active_goal_returns_404(client: TestClient) -> None:
    response = client.get("/profile/goals/active")
    assert response.status_code == 404


# --- Goal reactivation (BR-GOAL-5) -------------------------------------------


def test_reactivate_goal_makes_it_active_and_archives_current(client: TestClient) -> None:
    first = client.post("/profile/goals", json={"target_role": "Backend Engineer"}).json()
    client.post("/profile/goals", json={"target_role": "Data Engineer"})  # archives `first`

    response = client.post(f"/profile/goals/{first['id']}/reactivate")
    assert response.status_code == 200
    assert response.json()["is_active"] is True

    goals = client.get("/profile/goals").json()
    active_flags = {g["target_role"]: g["is_active"] for g in goals}
    assert active_flags == {"Backend Engineer": True, "Data Engineer": False}

    active = client.get("/profile/goals/active").json()
    assert active["target_role"] == "Backend Engineer"


def test_reactivate_already_active_goal_is_a_noop(client: TestClient) -> None:
    goal = client.post("/profile/goals", json={"target_role": "Backend Engineer"}).json()

    response = client.post(f"/profile/goals/{goal['id']}/reactivate")
    assert response.status_code == 200
    assert response.json()["is_active"] is True

    goals = client.get("/profile/goals").json()
    assert len(goals) == 1
    assert goals[0]["is_active"] is True


def test_reactivate_unknown_goal_404s(client: TestClient) -> None:
    response = client.post("/profile/goals/00000000-0000-0000-0000-000000000000/reactivate")
    assert response.status_code == 404


# --- Data deletion (FR-SET-3, BR-DATA-3/4) ----------------------------------


def test_delete_profile_data_clears_fields(client: TestClient) -> None:
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python", "SQL"]})

    response = client.delete("/profile")
    assert response.status_code == 200
    body = response.json()
    assert body["background"] == ""
    assert body["skills"] == []

    # Persisted, not just echoed.
    refetched = client.get("/profile").json()
    assert refetched["background"] == ""
    assert refetched["skills"] == []


def test_delete_profile_data_does_not_touch_existing_analyses(client: TestClient) -> None:
    """BR-DATA-4: deleting Profile data must never retroactively remove
    historical AI outputs already generated from it."""
    client.patch("/profile", json={"background": "BSc CS", "skills": ["Python"]})
    client.post("/profile/goals", json={"target_role": "Backend Engineer"})
    client.post("/ai-career-center/skill-gap-analysis/refresh")

    client.delete("/profile")

    analysis = client.get("/ai-career-center/skill-gap-analysis/current")
    assert analysis.status_code == 200
    assert analysis.json()["version"] == 1


def test_delete_profile_data_404_when_none_exists(client: TestClient) -> None:
    response = client.delete("/profile")
    assert response.status_code == 404
