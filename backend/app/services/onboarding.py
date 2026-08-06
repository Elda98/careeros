"""Onboarding completeness rules (PRD FR-ONBOARD-1, BR-GAP-1/2/5).

FR-ONBOARD-1 requires the system to define and communicate the minimum
profile information required before a first analysis can run. This module
is that definition — one place, reused by the onboarding-status endpoint
(FR-PROF-4: indicate what's missing) and by the Skill-Gap Analysis refresh
endpoint's gate (BR-GAP-1/2), so the two can never silently drift apart.

Two tiers, per BR-GAP-1 vs. BR-GAP-5:
- **Hard bar** (BR-GAP-1/2): below this, analysis does not run at all.
- **Quality fields** (BR-GAP-5): above the hard bar but still incomplete,
  analysis runs but confidence is reduced — enforced in `careeros_ai`, not
  here; this module only computes what's missing for FR-PROF-4's message.
"""

from __future__ import annotations

from dataclasses import dataclass

from app.db.models import Goal, Profile

_HARD_BAR_FIELDS = ("background", "skills")
_QUALITY_FIELDS = ("background", "education", "experience", "skills")


@dataclass
class OnboardingStatus:
    profile_exists: bool
    goal_set: bool
    missing_hard_bar_fields: list[str]
    missing_quality_fields: list[str]

    @property
    def meets_hard_bar(self) -> bool:
        return self.profile_exists and self.goal_set and not self.missing_hard_bar_fields

    @property
    def is_complete(self) -> bool:
        return self.meets_hard_bar and not self.missing_quality_fields


def evaluate(profile: Profile | None, active_goal: Goal | None) -> OnboardingStatus:
    missing_hard: list[str] = []
    missing_quality: list[str] = []

    if profile is None:
        missing_hard = list(_HARD_BAR_FIELDS)
        missing_quality = list(_QUALITY_FIELDS)
    else:
        for field in _HARD_BAR_FIELDS:
            value = getattr(profile, field)
            if not value:
                missing_hard.append(field)
        for field in _QUALITY_FIELDS:
            value = getattr(profile, field)
            if not value:
                missing_quality.append(field)

    return OnboardingStatus(
        profile_exists=profile is not None,
        goal_set=active_goal is not None,
        missing_hard_bar_fields=missing_hard,
        missing_quality_fields=missing_quality,
    )
