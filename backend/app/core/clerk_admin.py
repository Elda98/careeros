"""Clerk Admin (Backend) API client — used only for account deletion (FR-AUTH-5).

Distinct from `app/core/auth.py`, which verifies a user's own session token
against Clerk's public JWKS and needs no secret. Deleting a user from Clerk
itself requires the instance's secret key and Clerk's Backend API
(`https://api.clerk.com/v1/users/{id}`), documented at
https://clerk.com/docs/reference/backend-api/tag/Users#operation/DeleteUser.
"""

from __future__ import annotations

import httpx

from app.core.config import Settings, get_settings

CLERK_API_BASE = "https://api.clerk.com/v1"


class ClerkAdminError(Exception):
    """Raised when Clerk's Backend API returns anything other than success
    for an admin operation. Callers must treat this as a hard failure —
    never silently proceed with local deletion if the Clerk-side identity
    could not be confirmed deleted (see settings.py's ordering rationale)."""


class ClerkAdminClient:
    def __init__(self, secret_key: str):
        self._secret_key = secret_key

    async def delete_user(self, clerk_user_id: str) -> None:
        if not self._secret_key:
            raise ClerkAdminError(
                "CLERK_SECRET_KEY is not configured — cannot delete the Clerk-side account. "
                "Set it in .env before account deletion can be used."
            )
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.delete(
                f"{CLERK_API_BASE}/users/{clerk_user_id}",
                headers={"Authorization": f"Bearer {self._secret_key}"},
            )
        # 404 is treated as success: the Clerk-side identity is already gone
        # (e.g. a retried request after a prior partial failure), which is
        # the same end state this call is trying to reach.
        if response.status_code not in (200, 404):
            raise ClerkAdminError(
                f"Clerk account deletion failed: {response.status_code} {response.text}"
            )


def get_clerk_admin_client(settings: Settings | None = None) -> ClerkAdminClient:
    return ClerkAdminClient((settings or get_settings()).clerk_secret_key)
