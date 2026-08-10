"""Language contract capability: every AI-generated output must be in the
user's actual selected UI language, not just the frontend chrome around
it. One shared instruction, appended to every agent's system prompt based
on the user's persisted `locale` (backend/app/db/models.py's `User.locale`,
threaded into each agent's Input DTO) — not a per-agent reimplementation.
"""

from __future__ import annotations

_INSTRUCTIONS = {
    "ar": (
        "Respond entirely in Modern Standard Arabic — every field, every sentence, "
        "the summary, the reasoning, all of it. The one exception: real technical "
        "terms, proper nouns, and technology/tool/company names (e.g. Python, SQL, "
        "React, LangGraph) may stay in their original Latin-script form where an "
        "Arabic translation would be unnatural or nonstandard — but the sentences "
        "around them must still be Arabic, never a mix of an English sentence with "
        "an Arabic word dropped in."
    ),
    "en": "Respond entirely in English.",
}


def language_instruction(locale: str) -> str:
    return _INSTRUCTIONS.get(locale, _INSTRUCTIONS["en"])
