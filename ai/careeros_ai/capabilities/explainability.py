"""Explainability capability (PRD §26.3): articulate, on request, the
reasoning behind a specific output, grounded in the graph state that
produced it. PRD §28.8: an explanation request is scoped to one specific
output — never open-ended questioning.
"""

from __future__ import annotations

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage, SystemMessage

_EXPLAIN_SYSTEM_PROMPT = (
    "You explain a specific AI-generated career output to the user who received it. "
    "Reference only the grounded facts provided — never invent a justification, "
    "and never introduce new advice not already in the original output."
)


def explain_output(
    llm: BaseChatModel,
    *,
    output_summary: str,
    grounded_on: list[str],
    grounded_context: str,
    question_scope: str,
) -> str:
    """Generate a scoped, on-request explanation for one already-produced
    output. `question_scope` names exactly which part of the output the
    user is asking about (SAS §9.3: Presentation resolves scope before the
    request reaches Interaction/Intelligence).
    """
    prompt = (
        f"Original output: {output_summary}\n"
        f"Grounded on: {', '.join(grounded_on) or 'none'}\n"
        f"Grounded context:\n{grounded_context}\n\n"
        f"The user is asking specifically about: {question_scope}\n"
        "Explain why the output says what it says, referencing only the grounded context above."
    )
    response = llm.invoke(
        [SystemMessage(content=_EXPLAIN_SYSTEM_PROMPT), HumanMessage(content=prompt)]
    )
    return str(response.content)
