# ai — Intelligence Layer

The CareerOS Intelligence Layer (SAS Part I §4): the three Phase 0 agents, their shared capabilities, and the Knowledge Layer read/write contracts they use. Imported as a local Python package (`careeros_ai`) by `backend/` — see `docker/backend.Dockerfile`.

## Why this is a separate top-level folder, not part of `backend/`

SAS §1.4 draws Intelligence and Knowledge as distinct layers; keeping agent/reasoning code in its own package (rather than mixed into `backend/app/`) makes that boundary visible in the codebase, not just in the docs. `backend` owns persistence and HTTP; `ai` owns reasoning. Nothing here writes to Postgres directly — every agent returns a DTO (`careeros_ai.knowledge.contracts`), and `backend`'s service layer is what actually persists it, into the one table that agent is declared to own.

## Structure

```
careeros_ai/
  agents/          # SkillGapAnalysisAgent, RoadmapAgent, CVFeedbackAgent (PRD §25.3)
  capabilities/     # explainability, confidence calibration, grounding (PRD §26, shared across agents)
  knowledge/
    contracts.py    # DTOs for what crosses Intelligence <-> Knowledge (SAS §11.2)
  llm.py            # default_llm() — the one place the LLM provider/model is chosen
```

## LLM Provider

CareerOS uses **Groq exclusively** (`langchain-groq`'s `ChatGroq`) for every agent's inference — no other provider is wired in anywhere in this package. Each agent accepts an optional `llm` constructor argument (any object satisfying LangChain's `BaseChatModel` interface, e.g. for tests — see `backend/tests/fake_agents.py`); when omitted, it falls back to `careeros_ai.llm.default_llm()`, which reads `GROQ_API_KEY` from the environment (`langchain-groq`'s own default lookup) and `GROQ_MODEL` for the model name, defaulting to `llama-3.3-70b-versatile`. Changing the default model is a one-line edit in `llm.py`, never per-agent. If Groq deprecates the default model, override it with `GROQ_MODEL` in `.env` rather than editing code.

## Write-ownership (SAS §25.8 — enforced by convention here, by the DB schema in `backend/`)

| Agent | Owns | Reads |
|---|---|---|
| `SkillGapAnalysisAgent` | `skill_gap_analysis` | `profile`, `goal`, own previous version |
| `RoadmapAgent` | `roadmap` (item content only, never status) | current `skill_gap_analysis`, own previous version |
| `CVFeedbackAgent` | `cv_feedback_round` | `goal`, submitted document — nothing else |

## Failure behavior

Every agent raises `careeros_ai.agents.base.GenerationFailed` rather than returning a low-confidence, unflagged result (BR-AI-5, SAS §4.18). Callers must perform no write when this is raised — the entity's prior valid state stays current, exactly as SAS Part IV §21.2 (Failure During AI Processing) requires.

## Testing

```bash
pip install -r requirements-dev.txt && pip install -e .
pytest tests/
```

`tests/test_capabilities.py` covers the pure-logic capabilities (no API key needed) — **5 tests, all passing**. Agent-level tests that exercise a real LLM require `GROQ_API_KEY` and are not yet written. `backend/tests/fake_agents.py` covers agent *usage* (the router contract) without a live LLM by substituting fakes that satisfy the same `.run(input) -> output` interface — see `backend/README.md`.

## Observability

LangSmith tracing is enabled by setting `LANGCHAIN_TRACING_V2=true` and `LANGCHAIN_API_KEY` (see `.env.example` at the repo root) — no code change required, LangChain/LangGraph pick these up from the environment.
