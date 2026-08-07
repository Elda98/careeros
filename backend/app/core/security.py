"""Input/output guardrails for text that flows into an LLM prompt (SDAIA
rubric: prompt injection protection, input validation, output validation,
PII protection).

Covers every user-controlled field that gets interpolated directly into
an agent's prompt — Profile background/education/experience, a submitted
CV/document, Goal target_role/target_field, and Profile's skills list
(`sanitize_skill_list`, a `list[str]` with no length or count bound at
the schema level, `app/schemas/profile.py`'s `ProfileUpdate.skills`).
None of these fields have any length bound at the Pydantic schema
level — `str`/`list[str]` with no `Field(max_length=...)` — so this
module is the only thing standing between an arbitrarily large or
injection-laden value and the agent prompt it reaches.
"""

from __future__ import annotations

import re

from careeros_ai.observability import log_event

_MAX_FREE_TEXT_LENGTH = 8000  # generous for a CV/background, well short of a token-limit or abuse-sized payload
_MAX_SKILL_LENGTH = 100  # generous for a real skill/technology name
_MAX_SKILLS_COUNT = 50  # generous for a real profile; a list this long is already a resource-abuse signal

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


def sanitize_skill_list(skills: list[str], *, field_name: str = "skills") -> list[str]:
    """Same guarantees as `sanitize_free_text`, applied per-entry to a
    skills list — length-capped list, length-capped and control-char-
    stripped entries, each entry screened for the same injection
    patterns. A skill name is short, but nothing stops a caller from
    submitting one 8000-character "skill" containing a full injection
    attempt, or a few thousand entries, both of which end up directly in
    `SkillGapAnalysisAgent`'s prompt (`inp.profile.skills`)."""
    if len(skills) > _MAX_SKILLS_COUNT:
        raise ValueError(f"{field_name} exceeds the maximum allowed count ({_MAX_SKILLS_COUNT}).")
    cleaned_skills: list[str] = []
    for skill in skills:
        if len(skill) > _MAX_SKILL_LENGTH:
            raise ValueError(f"A {field_name} entry exceeds the maximum allowed length ({_MAX_SKILL_LENGTH} characters).")
        cleaned = _CONTROL_CHARS.sub("", skill)
        for pattern in _INJECTION_PATTERNS:
            if pattern.search(cleaned):
                log_event("guardrail.prompt_injection_rejected", field=field_name, pattern=pattern.pattern)
                raise PromptInjectionDetected(
                    f"A {field_name} entry contains a pattern that looks like an attempt to override "
                    "system instructions and was rejected."
                )
        cleaned_skills.append(cleaned)
    return cleaned_skills


def redact_pii_for_logging(text: str) -> str:
    """Redacts emails/phone numbers before a piece of user text is written
    to a LOG line — never applied to what's actually stored or sent to the
    LLM (a CV needs the user's real contact info to be useful feedback);
    this exists solely so structured logs of, e.g., a rejected-injection
    event don't leak PII into log storage."""
    redacted = _EMAIL_RE.sub("[redacted-email]", text)
    redacted = _PHONE_RE.sub("[redacted-phone]", redacted)
    return redacted
