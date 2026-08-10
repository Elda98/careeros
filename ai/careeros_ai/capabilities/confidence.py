"""Confidence Calibration capability (PRD §26.3, BR-AI-4): represent the
system's actual certainty — never presented as higher than its actual basis.
BR-GAP-5: an incomplete profile above the minimum bar does not block
analysis, but the result must carry reduced confidence.
"""

from __future__ import annotations

from careeros_ai.knowledge.contracts import ConfidenceLevel, ProfileSnapshot

# Fields whose absence measurably weakens a Skill-Gap Analysis. Kept as a
# simple, explicit list rather than an inferred heuristic — confidence
# reasoning must itself be explainable (BR-AI-4).
_QUALITY_FIELDS = ("background", "education", "experience", "skills")

# This function builds its reason string directly (never through an LLM),
# so careeros_ai.capabilities.language's prompt-level instruction doesn't
# reach it — it needs its own tiny, local translation, same reasoning as
# backend/app/core/i18n.py for notifications (a separate, narrower
# mechanism, not a duplicate of it — this module must never import from
# `backend`, per this project's ai/-never-depends-on-backend/ boundary).
_REASON_TEMPLATES = {
    "complete": {
        "en": "Profile is complete across all fields used in this analysis.",
        "ar": "الملف الشخصي مكتمل في كل الحقول المستخدمة في هذا التحليل.",
    },
    "missing_one": {
        "en": "Profile is missing: {fields} — analysis may be less precise.",
        "ar": "الملف الشخصي ينقصه: {fields} — قد يكون التحليل أقل دقة.",
    },
    "missing_several": {
        "en": "Profile is missing several fields ({fields}) — treat this analysis as provisional.",
        "ar": "الملف الشخصي ينقصه عدة حقول ({fields}) — تعامل مع هذا التحليل كتحليل أولي.",
    },
}


def calibrate_profile_completeness(profile: ProfileSnapshot, locale: str = "en") -> tuple[ConfidenceLevel, str]:
    """Derive a starting confidence level from profile completeness alone.
    Agents may lower this further based on their own reasoning quality, but
    must never raise it above what this function returns (BR-AI-4: never
    presented as higher than the system's actual basis for the output).
    """
    missing = [f for f in _QUALITY_FIELDS if not getattr(profile, f, None)]
    if not missing:
        template = _REASON_TEMPLATES["complete"].get(locale, _REASON_TEMPLATES["complete"]["en"])
        return ConfidenceLevel.HIGH, template
    fields = ", ".join(missing)
    if len(missing) <= 1:
        template = _REASON_TEMPLATES["missing_one"].get(locale, _REASON_TEMPLATES["missing_one"]["en"])
        return ConfidenceLevel.MEDIUM, template.format(fields=fields)
    template = _REASON_TEMPLATES["missing_several"].get(locale, _REASON_TEMPLATES["missing_several"]["en"])
    return ConfidenceLevel.LOW, template.format(fields=fields)


def min_confidence(a: ConfidenceLevel, b: ConfidenceLevel) -> ConfidenceLevel:
    order = {ConfidenceLevel.LOW: 0, ConfidenceLevel.MEDIUM: 1, ConfidenceLevel.HIGH: 2}
    return a if order[a] <= order[b] else b
