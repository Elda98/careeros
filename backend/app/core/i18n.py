"""Backend-constructed, user-visible message templates — notifications and
capability-confidence reasons the backend builds itself directly (never
through an LLM, so `careeros_ai.capabilities.language`'s prompt-level
instruction doesn't reach them). A genuinely separate, small mechanism,
not a duplicate of the frontend's `lib/i18n/messages/*.json` (that covers
UI chrome the frontend renders) or the AI agents' language instruction
(that covers LLM-generated content) — this is the third, narrowest
category: fixed-shape strings the backend itself formats.
"""

from __future__ import annotations

_MESSAGES: dict[str, dict[str, str]] = {
    "roadmap_updated": {
        "en": "Your roadmap has been updated (version {version}).",
        "ar": "تم تحديث خارطة طريقك (الإصدار {version}).",
    },
    "analysis_complete": {
        "en": "Your skill-gap analysis (version {version}) is ready.",
        "ar": "تحليل فجوتك المهارية (الإصدار {version}) جاهز.",
    },
    "cv_feedback_complete": {
        "en": "Feedback for your CV (round {round}) is ready.",
        "ar": "ملاحظات سيرتك الذاتية (الجولة {round}) جاهزة.",
    },
    "interview_report_complete": {
        "en": "Your interview report for {target_role} is ready.",
        "ar": "تقرير مقابلتك لوظيفة {target_role} جاهز.",
    },
}


def localize(key: str, locale: str, **params: object) -> str:
    templates = _MESSAGES.get(key)
    if templates is None:
        raise ValueError(f"Unknown message key: {key!r}")
    template = templates.get(locale, templates["en"])
    return template.format(**params)
