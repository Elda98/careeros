"""Pure-logic tests for shared capabilities — no LLM/API key required.
Run with: pytest ai/tests
"""

from uuid import uuid4

from careeros_ai.capabilities.confidence import calibrate_profile_completeness, min_confidence
from careeros_ai.capabilities.grounding import format_grounding_refs, require_nonempty_grounding
from careeros_ai.knowledge.contracts import ConfidenceLevel, ProfileSnapshot


def test_complete_profile_yields_high_confidence():
    profile = ProfileSnapshot(
        user_id=uuid4(),
        background="BSc Computer Science",
        education="King Saud University",
        experience="6-month internship",
        skills=["Python", "SQL"],
    )
    level, _ = calibrate_profile_completeness(profile)
    assert level == ConfidenceLevel.HIGH


def test_incomplete_profile_yields_reduced_confidence():
    profile = ProfileSnapshot(user_id=uuid4(), background="BSc Computer Science")
    level, reason = calibrate_profile_completeness(profile)
    assert level in (ConfidenceLevel.MEDIUM, ConfidenceLevel.LOW)
    assert "missing" in reason.lower()


def test_min_confidence_takes_the_lower_bound():
    assert min_confidence(ConfidenceLevel.HIGH, ConfidenceLevel.LOW) == ConfidenceLevel.LOW
    assert min_confidence(ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH) == ConfidenceLevel.MEDIUM


def test_grounding_refs_are_explicit_not_inferred():
    refs = format_grounding_refs(profile_fields=["skills"], goal_field=True)
    assert refs == ["profile.skills", "goal.target_role"]


def test_empty_grounding_is_rejected():
    try:
        require_nonempty_grounding([])
        assert False, "expected ValueError"
    except ValueError:
        pass
