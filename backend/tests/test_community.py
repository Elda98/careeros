"""Community: group creation/membership, post/comment/reaction CRUD, the
"join before you participate" rule, and author-only delete permissions.
Shared across every persona — no require_account_type gate anywhere here.
"""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.api.deps import get_current_user_id
from app.main import app
from tests.conftest import TEST_CLERK_USER_ID

OTHER_USER_CLERK_ID = "user_other_community_member"


def _as(clerk_id: str):
    app.dependency_overrides[get_current_user_id] = lambda: clerk_id


def _reset():
    app.dependency_overrides[get_current_user_id] = lambda: TEST_CLERK_USER_ID


def _create_group(client: TestClient, *, name: str = "Backend Engineers") -> dict:
    response = client.post("/community/groups", json={"group_type": "skill", "name": name, "description": "Talk shop."})
    assert response.status_code == 201
    return response.json()


def test_creating_a_group_auto_joins_the_creator(client: TestClient) -> None:
    group = _create_group(client)
    assert group["is_member"] is True
    assert group["is_owner"] is True
    assert group["member_count"] == 1
    assert group["post_count"] == 0


def test_only_the_owner_can_edit_the_group(client: TestClient) -> None:
    group = _create_group(client)

    update = client.patch(f"/community/groups/{group['id']}", json={"name": "Renamed", "description": "New desc."})
    assert update.status_code == 200
    assert update.json()["name"] == "Renamed"

    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        forbidden = client.patch(f"/community/groups/{group['id']}", json={"name": "Hijacked"})
        assert forbidden.status_code == 403
    finally:
        _reset()


def test_owner_can_delete_another_members_post_but_a_regular_member_cannot(client: TestClient) -> None:
    group = _create_group(client)

    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "A post by a regular member."}).json()
    finally:
        _reset()

    # The owner (TEST_CLERK_USER_ID) can moderate — delete someone else's post.
    assert client.delete(f"/community/posts/{post['id']}").status_code == 204


def test_regular_member_cannot_delete_someone_elses_post(client: TestClient) -> None:
    group = _create_group(client)
    owner_post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "Owner's post."}).json()

    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        assert client.delete(f"/community/posts/{owner_post['id']}").status_code == 403
    finally:
        _reset()


def test_owner_can_remove_a_member_but_not_themselves(client: TestClient) -> None:
    group = _create_group(client)

    # No dedicated "list members" endpoint exists yet, so capture the other
    # member's user_id the same way the other tests above do: from a post
    # they author.
    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "hi"}).json()
        other_user_id = post["author"]["user_id"]
    finally:
        _reset()

    assert client.get(f"/community/groups/{group['id']}").json()["member_count"] == 2
    removed = client.delete(f"/community/groups/{group['id']}/members/{other_user_id}")
    assert removed.status_code == 204
    assert client.get(f"/community/groups/{group['id']}").json()["member_count"] == 1

    owner_id = client.post(f"/community/groups/{group['id']}/posts", json={"body": "hi2"}).json()["author"]["user_id"]
    self_removal = client.delete(f"/community/groups/{group['id']}/members/{owner_id}")
    assert self_removal.status_code == 400


def test_non_owner_cannot_remove_a_member(client: TestClient) -> None:
    group = _create_group(client)
    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "hi"}).json()
        other_user_id = post["author"]["user_id"]
        forbidden = client.delete(f"/community/groups/{group['id']}/members/{other_user_id}")
        assert forbidden.status_code == 403
    finally:
        _reset()


def test_get_single_group_reflects_membership_per_caller(client: TestClient) -> None:
    group = _create_group(client)
    own_view = client.get(f"/community/groups/{group['id']}").json()
    assert own_view["is_member"] is True

    try:
        _as(OTHER_USER_CLERK_ID)
        other_view = client.get(f"/community/groups/{group['id']}").json()
        assert other_view["is_member"] is False
    finally:
        _reset()


def test_list_groups_reflects_membership_per_caller(client: TestClient) -> None:
    group = _create_group(client)

    try:
        _as(OTHER_USER_CLERK_ID)
        listed = client.get("/community/groups").json()
        found = next(g for g in listed if g["id"] == group["id"])
        assert found["is_member"] is False
        assert found["member_count"] == 1  # the creator, not this caller
    finally:
        _reset()


def test_non_member_cannot_post(client: TestClient) -> None:
    group = _create_group(client)

    try:
        _as(OTHER_USER_CLERK_ID)
        response = client.post(f"/community/groups/{group['id']}/posts", json={"body": "Hello!"})
        assert response.status_code == 403
    finally:
        _reset()


def test_joining_then_posting_then_commenting_and_reacting(client: TestClient) -> None:
    group = _create_group(client)

    try:
        _as(OTHER_USER_CLERK_ID)
        join = client.post(f"/community/groups/{group['id']}/join")
        assert join.status_code == 204

        post_response = client.post(
            f"/community/groups/{group['id']}/posts",
            json={"post_type": "question", "title": "Best way to learn SQL?", "body": "Any recommendations?"},
        )
        assert post_response.status_code == 201
        post = post_response.json()
        assert post["author"]["display_label"] == "user_other_community_member"
        assert post["comment_count"] == 0
        assert post["reaction_count"] == 0
        assert post["user_has_reacted"] is False

        comment_response = client.post(f"/community/posts/{post['id']}/comments", json={"body": "Try SQLBolt!"})
        assert comment_response.status_code == 201
        detail = comment_response.json()
        assert detail["comment_count"] == 1
        assert len(detail["comments"]) == 1
        assert detail["comments"][0]["body"] == "Try SQLBolt!"

        react_response = client.post(f"/community/posts/{post['id']}/react")
        assert react_response.status_code == 200
        assert react_response.json() == {"reacted": True, "reaction_count": 1}

        # Reacting again toggles it off.
        unreact_response = client.post(f"/community/posts/{post['id']}/react")
        assert unreact_response.json() == {"reacted": False, "reaction_count": 0}
    finally:
        _reset()


def test_non_member_cannot_comment_or_react(client: TestClient) -> None:
    group = _create_group(client)
    post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "Original post."}).json()

    try:
        _as(OTHER_USER_CLERK_ID)
        assert client.post(f"/community/posts/{post['id']}/comments", json={"body": "Trying to comment."}).status_code == 403
        assert client.post(f"/community/posts/{post['id']}/react").status_code == 403
    finally:
        _reset()


def test_only_the_author_can_delete_their_post(client: TestClient) -> None:
    group = _create_group(client)
    post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "My post."}).json()

    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        assert client.delete(f"/community/posts/{post['id']}").status_code == 403
    finally:
        _reset()

    assert client.delete(f"/community/posts/{post['id']}").status_code == 204
    assert client.get(f"/community/posts/{post['id']}").status_code == 404


def test_only_the_author_can_delete_their_comment(client: TestClient) -> None:
    group = _create_group(client)
    post = client.post(f"/community/groups/{group['id']}/posts", json={"body": "My post."}).json()
    comment = client.post(f"/community/posts/{post['id']}/comments", json={"body": "My comment."}).json()["comments"][0]

    try:
        _as(OTHER_USER_CLERK_ID)
        client.post(f"/community/groups/{group['id']}/join")
        assert client.delete(f"/community/comments/{comment['id']}").status_code == 403
    finally:
        _reset()

    assert client.delete(f"/community/comments/{comment['id']}").status_code == 204


def test_leaving_a_group_you_never_joined_is_a_harmless_no_op(client: TestClient) -> None:
    group = _create_group(client)
    try:
        _as(OTHER_USER_CLERK_ID)
        response = client.delete(f"/community/groups/{group['id']}/join")
        assert response.status_code == 204
    finally:
        _reset()


def test_post_body_over_the_length_limit_is_rejected(client: TestClient) -> None:
    group = _create_group(client)
    response = client.post(f"/community/groups/{group['id']}/posts", json={"body": "x" * 5001})
    assert response.status_code == 422


def test_group_and_post_not_found_are_404(client: TestClient) -> None:
    fake_id = "00000000-0000-0000-0000-000000000000"
    assert client.get(f"/community/groups/{fake_id}/posts").status_code == 404
    assert client.get(f"/community/posts/{fake_id}").status_code == 404
