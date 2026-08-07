"""Schema-level guarantees on the Intelligence <-> Knowledge DTOs
(careeros_ai.knowledge.contracts) — the boundary every agent's output
crosses before the backend persists it. Complements the pure-logic tests
in test_capabilities.py with tests of the contracts themselves.
"""

import pytest
from pydantic import ValidationError

from careeros_ai.knowledge.contracts import CVFeedbackItem


def test_cv_feedback_item_accepts_the_two_real_categories():
    CVFeedbackItem(category="factual_structural", note="x", relevance_to_goal="y")
    CVFeedbackItem(category="judgment_call", note="x", relevance_to_goal="y")


def test_cv_feedback_item_rejects_a_hallucinated_category():
    """Regression test: category used to be a loose `str`, so a
    hallucinated LLM value would pass through here undetected and only
    fail much later, as an unhandled 500 at the database's strict Enum
    column (backend/app/db/models.py's CVFeedbackCategory) — well past
    the agent's own GenerationFailed error handling. Now a Literal, so
    this is caught immediately, at the actual output boundary."""
    with pytest.raises(ValidationError):
        CVFeedbackItem(category="positive_feedback", note="x", relevance_to_goal="y")
