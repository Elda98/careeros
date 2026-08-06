"""Authentication module (PRD FR-AUTH, SAS §14.9 — Authentication owns
identity/session, read only by other modules to anchor their own entities to
a user; it never becomes part of the Career Knowledge Graph, SAS §3.5).

Verifies a Clerk session JWT and exposes the authenticated user's Clerk user
ID as `current_user_id`. All activity is associated with this identity
(FR-AUTH-4).
"""

from __future__ import annotations

from functools import lru_cache

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError

from app.core.config import Settings, get_settings

_bearer_scheme = HTTPBearer(auto_error=False)


@lru_cache
def _jwks(clerk_issuer: str) -> dict:
    """Clerk exposes a JWKS endpoint at `<issuer>/.well-known/jwks.json`.
    Cached per-issuer for the process lifetime; acceptable for a capstone
    deployment, revisit with TTL-based invalidation for production."""
    response = httpx.get(f"{clerk_issuer}/.well-known/jwks.json", timeout=5.0)
    response.raise_for_status()
    return response.json()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    settings: Settings = Depends(get_settings),
) -> str:
    """FastAPI dependency: verifies the bearer token issued by Clerk and
    returns the Clerk user ID. Raises 401 on any verification failure —
    never silently treats an invalid token as anonymous (BR-CONST-3: no
    action bypasses user awareness or consent)."""
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    try:
        unverified = jwt.get_unverified_claims(credentials.credentials)
        issuer = unverified.get("iss")
        if not issuer:
            raise JWTError("Token has no issuer claim")

        jwks = _jwks(issuer)
        claims = jwt.decode(
            credentials.credentials,
            jwks,
            algorithms=["RS256"],
            issuer=issuer,
            options={"verify_aud": False},
        )
    except (JWTError, httpx.HTTPError) as exc:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid session token") from exc

    user_id = claims.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject claim")
    return user_id
