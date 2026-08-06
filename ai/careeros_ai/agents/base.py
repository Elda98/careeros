"""Shared agent scaffolding.

Every agent in this package:
- Declares exactly which single Knowledge Layer entity it owns (`owns`) and
  which entities it is permitted to read (`reads`) — SAS §25.8, §4.9.
- Returns a DTO (careeros_ai.knowledge.contracts) rather than writing to
  storage itself — persistence belongs to `backend`, never to `ai`
  (SAS §3.12: Intelligence never becomes a source of truth). The caller
  (backend service layer) is responsible for writing the returned DTO only
  into the table this agent is declared to own.
- Raises `GenerationFailed` rather than returning a low-confidence,
  unflagged result when it cannot produce a reliable output (BR-AI-5,
  SAS §4.18, §21.2 in the SAS's own Failure During AI Processing scenario).
"""

from __future__ import annotations

from typing import ClassVar


class GenerationFailed(Exception):
    """Raised when an agent cannot produce a reliable output. The caller
    must perform no write and leave the entity's prior valid state
    untouched (SAS §4.18, §11.6 — a write must never partially complete)."""


class BaseAgent:
    owns: ClassVar[str]
    reads: ClassVar[list[str]]
