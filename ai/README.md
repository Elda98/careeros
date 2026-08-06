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
  orchestration/    # CareerSupervisor: multi-agent coordination, HITL, persistent checkpointing
    supervisor.py    # the coordinator graph itself
    checkpointer.py  # wires up langgraph-checkpoint-postgres against the app's own database
  tools.py           # real LangChain tools (SkillGapAnalysisAgent's tool-calling loop)
  observability.py   # structured log_event() + in-process METRICS counters
  llm.py            # default_llm() — the one place the LLM provider/model is chosen
```

## Tool calling and reasoning pattern

`SkillGapAnalysisAgent` is this package's flagship for genuine tool calling and explicit reasoning (the other two agents stay on a simpler generate→finalize shape deliberately — see the root README's [Multi-agent overview](../README.md#multi-agent-overview) for why). Its internal graph implements a real **ReAct** loop:

```
assemble_context → [reason ⇄ execute_tools] (≤4 rounds) → generate → validate → [retry ⇄ reason] (≤2) → calibrate
```

- **Tools** (`tools.py`): `normalize_skill`, `assess_role_relevance`, `compute_gap_coverage` — real Python functions over small, explicit reference tables (a skill taxonomy, per-role core-skill lists), bound to the LLM via `llm.bind_tools(...)`. The model decides when to call one; the result is genuinely computed, not templated.
- **Reason/Act loop**: the `reason` node sees the running transcript and either requests a tool call or signals readiness to answer; `execute_tools` actually runs the request and appends a real observation. A conditional edge (`_route_after_reason`) routes between them, bounded at `MAX_TOOL_ROUNDS = 4` so it's a real, terminating loop.
- **Retry loop**: `validate` is a genuine content-consistency gate (not just Pydantic schema validation, which is already guaranteed) — an empty gap list whose summary doesn't actually say "no gaps" is treated as malformed and retried (`MAX_RETRIES = 2`) via a conditional edge back to `reason`, with the failure surfaced to the model. Exhausting retries doesn't crash the request — the result is accepted but forced to `ConfidenceLevel.LOW` with an honest reason, per this project's existing "never present higher confidence than the actual basis" rule (`capabilities/confidence.py`).

Verified live against Groq: one real run made 11 tool calls in a single reasoning round before answering, and the resulting gaps matched the reference core-skill list for the stated role.

## Multi-agent coordination (`orchestration/`)

`CareerSupervisor` (`orchestration/supervisor.py`) is an explicit coordinator over `SkillGapAnalysisAgent` and `RoadmapAgent` — not the two agents calling each other, and not the simpler direct-call sequence the original `refresh_skill_gap_analysis` endpoint still uses unchanged. Its graph:

```
run_skill_gap_agent → run_roadmap_agent → await_roadmap_approval → [finalize | rejected]
```

- **Structured communication**: `SkillGapAnalysisAgent`'s typed `SkillGapAnalysisOutput` is placed directly into shared graph state and handed to `RoadmapAgent` as its typed `RoadmapInput.analysis` — never serialized through a raw string.
- **Human-in-the-loop**: `await_roadmap_approval` calls `langgraph.types.interrupt(...)`, pausing the graph and surfacing the draft roadmap. A human decision resumes it via `Command(resume=...)` — approved routes to `finalize` (the caller then persists the roadmap for real), rejected routes to `rejected` (nothing is persisted).
- **Persistence** (`orchestration/checkpointer.py`): the pause above is only meaningful if it survives a restart — `PostgresSaver` (from `langgraph-checkpoint-postgres`, declared as a dependency from this project's start but unused until now) checkpoints the graph's state to the app's own Postgres database. Verified directly: started a run, discarded the Python process's `CareerSupervisor` object entirely, built a brand-new one against the same database, and resumed the same `thread_id` — it produced the correct, previously-computed roadmap.

The backend wires this up at `POST /ai-career-center/career-plan/{start,approve,reject}` (`backend/app/api/routers/ai_career_center.py`), lazily opening the checkpointer connection on first real use rather than at process startup — see that router file's comments for why.

## Observability (`observability.py`)

`log_event(event, **fields)` emits one structured (JSON-serializable) log line per call and increments an in-process counter for it; `METRICS.snapshot()` returns all counters plus process uptime, exposed at the backend's `GET /metrics`. Used throughout the ReAct loop (`agent.reason`, `agent.tool_call`, `agent.retry`) and the supervisor (`supervisor.dispatch`, `supervisor.interrupt`, `supervisor.resume`, `supervisor.finalize`) — every reasoning step, tool call, retry, and HITL transition is visible in logs and in `/metrics`, not just the final output. LangSmith tracing (`LANGCHAIN_TRACING_V2`/`LANGCHAIN_API_KEY`/`LANGCHAIN_PROJECT`, see the root `.env.example`) is separate and automatic — LangChain/LangGraph instrument themselves from those env vars with no code here required.

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
