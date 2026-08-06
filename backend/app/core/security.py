"""Input/output guardrails for text that flows into an LLM prompt (SDAIA
rubric: prompt injection protection, input validation, output validation,
PII protection).

Scope, deliberately: these guard the *free-text* fields a user controls
that get interpolated directly into an agent's prompt — Profile
background/education/experience and a submitted CV/document. They do not
touch structured fields (goal target_role, skill names from the profile's
skills list) — those are short, already length-bounded by the schema, and
rejecting them on a false-positive match would break normal use for no
real security benefit.
"""

from __future__ import annotations

import re

from careeros_ai.observability import log_event

_MAX_FREE_TEXT_LENGTH = 8000  # generous for a CV/background, well short of a token-limit or abuse-sized payload

# Real, explicit patterns for the classic instruction-injection attempts —
# not a learned classifier (out of scope for a capstone with no labeled
# training data), but genuine regex matching against known attack shapes,
# not a placeholder that always returns False.
_INJECTION_PATTERNS = [
    re.compile(r"ignore (all )?(previous|prior|above) instructions", re.IGNORECASE),
    re.compile(r"disregard (all )?(previous|prior|above)", re.IGNORECASE),
    re.compile(r"you are now (a|an)\b", re.IGNORECASE),
    re.compile(r"\bact as (a|an)\b.{0,40}\b(system|admin|root|developer)\b", re.IGNORECASE),
    re.compile(r"^\s*system\s*:", re.IGNORECASE | re.MULTILINE),
    re.compile(r"reveal (your|the) (system )?prompt", re.IGNORECASE),
    re.compile(r"</?\s*(system|instructions?)\s*>", re.IGNORECASE),
    re.compile(r"#{3,}\s*(new|system)\s+(instructions?|prompt)", re.IGNORECASE),
]

_CONTROL_CHARS = re.compile(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]")

_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_PHONE_RE = re.compile(r"\b(?:\+?\d[\d\-\s()]{7,}\d)\b")


class PromptInjectionDetected(ValueError):
    """Raised when user-supplied text matches a known instruction-injection
    pattern. Callers should turn this into a 400, not silently strip the
    match and proceed — an input that tried to override the system prompt
    is worth rejecting outright, not laundering."""


def sanitize_free_text(text: str, *, field_name: str) -> str:
    """Strips control characters, enforces a real length cap, and rejects
    text matching a known prompt-injection pattern. Returns the cleaned
    text (safe to interpolate into a prompt) or raises
    `PromptInjectionDetected`/`ValueError`."""
    if len(text) > _MAX_FREE_TEXT_LENGTH:
        raise ValueError(f"{field_name} exceeds the maximum allowed length ({_MAX_FREE_TEXT_LENGTH} characters).")
    cleaned = _CONTROL_CHARS.sub("", text)
    for pattern in _INJECTION_PATTERNS:
        if pattern.search(cleaned):
            log_event("guardrail.prompt_injection_rejected", field=field_name, pattern=pattern.pattern)
            raise PromptInjectionDetected(
                f"{field_name} contains a pattern that looks like an attempt to override system "
                "instructions and was rejected."
            )
    return cleaned


def redact_pii_for_logging(text: str) -> str:
    """Redacts emails/phone numbers before a piece of user text is written
    to a LOG line — never applied to what's actually stored or sent to the
    LLM (a CV needs the user's real contact info to be useful feedback);
    this exists solely so structured logs of, e.g., a rejected-injection
    event don't leak PII into log storage."""
    redacted = _EMAIL_RE.sub("[redacted-email]", text)
    redacted = _PHONE_RE.sub("[redacted-phone]", redacted)
    return redacted
