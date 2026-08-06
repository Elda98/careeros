"""Grounding capability (PRD §26.3): an agent's output must be derived from
specific Career Knowledge Graph data it has read, not general knowledge
unconnected to the user. Distinct from Explainability — Grounding is the
property that the output *is* based on real data; Explainability *surfaces*
that basis on request (PRD §26.3).
"""

from __future__ import annotations


def format_grounding_refs(*, profile_fields: list[str] | None = None, goal_field: bool = False,
                           prior_version: bool = False, document: bool = False) -> list[str]:
    """Build the `grounded_on` list attached to an agent output, naming exactly
    which real inputs the output is based on — never a generic justification.
    """
    refs: list[str] = []
    for field in profile_fields or []:
        refs.append(f"profile.{field}")
    if goal_field:
        refs.append("goal.target_role")
    if prior_version:
        refs.append("previous_version")
    if document:
        refs.append("submitted_document")
    return refs


def require_nonempty_grounding(grounded_on: list[str]) -> None:
    """Fails loudly rather than allowing an ungrounded output to be written —
    consistent with SAS §4.18 / BR-AI-5: if the system cannot ground an
    output, it must say so rather than produce a plausible-but-unbased one.
    """
    if not grounded_on:
        raise ValueError(
            "Refusing to produce an ungrounded output (PRD §26.3 Grounding, "
            "SAS §4.18 fail-safe rule) — no real graph data was referenced."
        )
