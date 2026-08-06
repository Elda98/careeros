"""Default LLM client factory.

CareerOS uses Groq exclusively for LLM inference (LangChain's `ChatGroq`),
reading `GROQ_API_KEY` from the environment — `langchain-groq`'s own
default lookup, no code here needs to pass it explicitly. One factory
function means the default model name is changed in exactly one place
rather than three (one per agent).
"""

from __future__ import annotations

import os

from langchain_groq import ChatGroq

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"


def default_llm() -> ChatGroq:
    return ChatGroq(model=os.environ.get("GROQ_MODEL", DEFAULT_GROQ_MODEL))
