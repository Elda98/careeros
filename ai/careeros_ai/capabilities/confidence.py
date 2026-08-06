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


def calibrate_profile_completeness(profile: ProfileSnapshot) -> tuple[ConfidenceLevel, str]:
    """Derive a starting confidence level from profile completeness alone.
    Agents may lower this further based on their own reasoning quality, but
    must never raise it above what this function returns (BR-AI-4: never
    presented as higher than the system's actual basis for the output).
    """
    missing = [f for f in _QUALITY_FIELDS if not getattr(profile, f, None)]
    if not missing:
        return ConfidenceLevel.HIGH, "Profile is complete across all fields used in this analysis."
    if len(missing) <= 1:
        return (
            ConfidenceLevel.MEDIUM,
            f"Profile is missing: {', '.join(missing)} — analysis may be less precise.",
        )
    return (
        ConfidenceLevel.LOW,
        f"Profile is missing several fields ({', '.join(missing)}) — treat this analysis as provisional.",
    )


def min_confidence(a: ConfidenceLevel, b: ConfidenceLevel) -> ConfidenceLevel:
    order = {ConfidenceLevel.LOW: 0, ConfidenceLevel.MEDIUM: 1, ConfidenceLevel.HIGH: 2}
    return a if order[a] <= order[b] else b
