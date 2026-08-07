# Orbit (CareerOS)

**Your AI Career Operating System.**

Orbit is the public, user-facing brand name for **CareerOS**, an AI-native platform that gives students and fresh graduates a single, persistent system for managing and growing a career: a continuously updated model of a person's goals and skills, worked on by a coordinated set of AI agents that identify gaps, build a roadmap, and give feedback on career materials. "Orbit" is a presentation-layer name only — the backend, database, and every architecture document still refer to the project as CareerOS, which is why the repository, code, and this document use both names depending on context.

> Built as an SDAIA Academy capstone project.

---

## Table of contents

- [Problem statement](#problem-statement)
- [Solution](#solution)
- [Features](#features)
- [AI architecture](#ai-architecture)
- [Multi-agent overview](#multi-agent-overview)
- [Tech stack](#tech-stack)
- [System architecture](#system-architecture)
- [Folder structure](#folder-structure)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Docker instructions](#docker-instructions)
- [Local development](#local-development)
- [Screenshots](#screenshots)
- [Presentation](#presentation)
- [Deployment status](#deployment-status)
- [Known limitations](#known-limitations)
- [Future work](#future-work)
- [Testing](#testing)
- [Documentation](#documentation)
- [SDAIA Academy attribution](#sdaia-academy-attribution)
- [License](#license)

---

## Problem statement

Career development for students and fresh graduates is fragmented and reactive. Career guidance is generic (one-size-fits-all advice, not tied to a person's actual skills or goal), fragmented across disconnected tools (a resume reviewer here, a course catalogue there, a job board somewhere else), and static — nothing tracks whether a person is actually closing the gap between where they are and where they want to be, or updates its advice as they change.

## Solution

Orbit gives each user one continuously-updated model of themselves — their background, their goal, their skills — and a small set of specialized AI agents that work against that model:

1. **Understand the gap.** Compare the user's current skills against what their chosen goal requires, and explain the gap in plain language, with a calibrated confidence level rather than false certainty.
2. **Build a plan.** Turn that gap into a concrete, ordered roadmap of steps, generated automatically whenever the analysis changes.
3. **Improve the materials.** Give structured, grounded feedback on a CV or career document against the user's actual goal.

Every AI output is explainable on request (what it's grounded on), calibrated (confidence level + reason, never a false 100%), and owned by exactly one agent — no two agents ever write the same data, so there's always one clear source of truth for any given piece of a user's Career Knowledge Graph.

## Features

- **Authentication** — Clerk-based sign up / sign in, JWT session verification, full account deletion (local data + the real upstream Clerk identity)
- **Onboarding** — a four-step guided wizard (background → goal → skills → first AI analysis) that a completed account never re-enters
- **Profile & Goals** — editable profile, one active goal at a time, goal history and reactivation, a completeness checklist showing exactly what's missing for a better analysis
- **Skill-Gap Analysis** — AI-generated gap analysis against the user's active goal, versioned, with an on-request plain-language explanation of what it's grounded on
- **Roadmap** — an ordered set of steps auto-generated from the current analysis, with per-item status tracking (the AI owns the content, the user owns the status)
- **CV / Career-Document Feedback** — submit text, get feedback split into factual/structural findings vs. judgment calls, each item tagged with its relevance to the active goal
- **Dashboard** — an at-a-glance summary of the user's current analysis, roadmap progress, and recent activity
- **Notifications** — an activity timeline for analysis, roadmap, and feedback completions, with per-category muting
- **Settings** — account, subscription (view/cancel with reason, renewal recap), notification preferences, theme + language, data export/deletion, and account deletion
- **Progress** — career-readiness snapshot, the AI's own summary, a skill-improvement timeline across analysis versions, and a milestones timeline
- **Accessibility & i18n** — full English/Arabic bilingual support with real RTL layout (not machine-translated filler), dark/light theme, and a WCAG-AA-verified color system
- **Explainability everywhere** — every AI-generated output (analysis, roadmap, feedback) can be explained on request: what data it used and why it reached its conclusion
- **Supervised career-plan flow** (`POST /ai-career-center/career-plan/*`) — an alternative to the direct Skill-Gap Analysis endpoint that runs both agents through an explicit coordinator, pauses for a human approve/reject decision before the roadmap becomes real, and survives a backend restart mid-approval (see [Multi-agent overview](#multi-agent-overview))

## AI architecture

The Intelligence Layer (`ai/careeros_ai`) is a separate top-level Python package, imported by the backend rather than folded into it — the codebase keeps "reasoning" (`ai/`) and "persistence + HTTP" (`backend/`) as distinct layers on purpose. No agent ever writes to the database directly: every agent returns a typed data-transfer object, and the backend's service layer is the only thing that persists it — into the one table that specific agent is declared to own.

| Principle | What it means here |
|---|---|
| **Single LLM provider** | Every agent runs on **Groq** (`langchain-groq`), one place (`ai/careeros_ai/llm.py`) decides the model — no per-agent provider sprawl |
| **Write ownership** | Each agent owns exactly one entity; no two agents ever write the same table (see the table below) |
| **Fail loud, never degrade silently** | An agent that can't produce a trustworthy result raises rather than returning a low-confidence, unflagged answer — the prior valid state is left untouched |
| **Calibrated confidence** | Every AI output ships a confidence level *and* the reason for it, derived from real signals (e.g. profile completeness), never a hardcoded "high" |
| **Grounded explainability** | Every output can be explained on request — what data it was grounded on — computed from the real inputs, not an afterthought summary |
| **Persistent state** | The supervised career-plan flow's state (including a paused human-in-the-loop approval) is checkpointed to Postgres — a process restart never loses an in-flight run |
| **Guarded inputs/outputs** | Free-text user input is screened for prompt-injection patterns before it reaches a prompt; agent output goes through a real content-validation gate with a bounded retry loop before being accepted |

## Multi-agent overview

Three specialized agents, plus an explicit coordinator over two of them:

```
SkillGapAnalysisAgent   assemble_context → [reason ⇄ execute_tools] → generate → validate → calibrate
RoadmapAgent            generate → finalize
CVFeedbackAgent         generate → finalize
CareerSupervisor        run_skill_gap_agent → run_roadmap_agent → await_roadmap_approval → finalize | rejected
```

| Agent | Owns (writes) | Reads |
|---|---|---|
| `SkillGapAnalysisAgent` | `skill_gap_analysis` | profile, goal, its own previous version |
| `RoadmapAgent` | `roadmap` (item *content* only, never status) | current skill-gap analysis, its own previous version |
| `CVFeedbackAgent` | `cv_feedback_round` | goal, the submitted document — nothing else |
| `CareerSupervisor` | *(coordinates only — never writes directly)* | dispatches to `SkillGapAnalysisAgent` and `RoadmapAgent`, gates on a human decision |

`RoadmapAgent` and `CVFeedbackAgent` stay on a deliberately simple generate→finalize shape — every agent doing everything (tools, retries, multi-step reasoning) would make none of them a clear example of anything. `SkillGapAnalysisAgent` is the flagship for tool calling and explicit reasoning (below); `CareerSupervisor` (`ai/careeros_ai/orchestration/supervisor.py`) is the flagship for multi-agent coordination and human-in-the-loop, and is what backs the `/ai-career-center/career-plan/*` endpoints — a coordinator-driven alternative to calling `SkillGapAnalysisAgent`/`RoadmapAgent` directly (the original `/skill-gap-analysis/refresh` endpoint, still present and unchanged, calls them directly with no supervisor and no approval gate — both flows are real, live options, not one replacing the other).

### Tool calling

`ai/careeros_ai/tools.py` defines three real, callable tools, bound to the LLM via LangChain's tool-calling interface (`llm.bind_tools(...)`) — the model decides when to call one and with what arguments; the computation itself is genuine Python execution against small, explicit, inspectable reference tables (a skill-name taxonomy, per-role core-skill lists, gap-coverage math), not a canned string returned regardless of input:

| Tool | What it actually computes |
|---|---|
| `normalize_skill` | Canonical name + related skills for a given skill string, from a real taxonomy dict |
| `assess_role_relevance` | Whether a skill is a core reference requirement for the stated target role |
| `compute_gap_coverage` | What fraction of a role's core reference skills the identified gaps actually cover |

Verified against a real Groq call: for one test profile/goal pair, the agent made 11 real tool calls in a single reasoning round before producing its final analysis, whose gaps matched the reference core-skill list for the stated role — grounding that's checkable, not asserted.

### Reasoning pattern: ReAct

`SkillGapAnalysisAgent` implements an explicit **ReAct** (Reason + Act) loop, not a single prompt-response call:

1. **Reason** — the LLM sees the running transcript (original profile/goal + any tool results so far) and either requests a tool call or signals it's ready to answer.
2. **Act** — if a tool was requested, it's actually executed and the real result is appended as an observation; control returns to Reason. Bounded at 4 rounds (`MAX_TOOL_ROUNDS`) so this is a real, terminating loop, not an accidental infinite one.
3. Once reasoning concludes, a structured final answer is generated from the *entire* transcript — the tool-grounded reasoning genuinely informs the output, it isn't discarded.
4. A **content-validation gate** checks the answer isn't empty/inconsistent (e.g. no gaps found but the summary doesn't say so); a real failure here loops back to Reason (up to `MAX_RETRIES = 2`) with the failure surfaced to the model, rather than crashing the whole request.

### Human-in-the-loop

`CareerSupervisor` pauses (`langgraph.types.interrupt`) after producing a roadmap draft and waits for an explicit approve/reject decision — the draft is never persisted as a real `Roadmap` row until approved. Because the pause is checkpointed to Postgres (below), approval can come from a *different process* than the one that started the run — verified by starting a run, discarding that Python process's supervisor object entirely, and resuming the same `thread_id` from a brand-new one, which produced the correct persisted roadmap.

### Multi-agent coordination

`CareerSupervisor` is an explicit coordinator, not two agents calling each other directly: it holds shared graph state, dispatches to `SkillGapAnalysisAgent` first, passes that agent's *typed output DTO* directly into `RoadmapAgent`'s typed input (structured hand-off, never a raw string), and conditionally routes to either a `finalize` or `rejected` terminal node based on the human decision.

### Persistent checkpointing

`ai/careeros_ai/orchestration/checkpointer.py` wires up `langgraph-checkpoint-postgres`'s `PostgresSaver` against the app's own database — a dependency that was declared from the start of this project (`ai/requirements.txt`) but not actually used in code until this phase. The checkpointer connects lazily, on first real request to a `/career-plan/*` endpoint, not at process startup — so every other route (and the entire hermetic test suite) pays no Postgres cost for a feature it doesn't use.

### Agent workflow diagrams

`SkillGapAnalysisAgent`'s ReAct loop:

```mermaid
flowchart LR
    A[assemble_context] --> R[reason]
    R -->|tool call requested\nand rounds < 4| T[execute_tools]
    T --> R
    R -->|no more tool calls,\nor round budget spent| G[generate]
    G --> V{validate}
    V -->|empty/inconsistent,\nretries < 2| Y[retry] --> R
    V -->|valid, or retries\nexhausted| C[calibrate] --> E[END]
```

`CareerSupervisor`'s coordination + human-in-the-loop flow:

```mermaid
flowchart LR
    S([start]) --> SG[run_skill_gap_agent]
    SG -->|typed SkillGapAnalysisOutput| RM[run_roadmap_agent]
    RM -->|typed RoadmapOutput draft| AW[await_roadmap_approval]
    AW -.->|interrupt: persisted\nto Postgres checkpoint| H{{human decision}}
    H -->|approved| F[finalize] --> E1([roadmap persisted])
    H -->|rejected| RJ[rejected] --> E2([no roadmap written])
```

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, shadcn/ui + Radix primitives |
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async) |
| AI orchestration | LangGraph (StateGraph, tool calling, persistent checkpointing), LangChain, **Groq** (`langchain-groq`) |
| Database | PostgreSQL — application tables + LangGraph checkpoint tables in the same database |
| Auth | Clerk |
| File storage | Supabase Storage (declared, not yet wired to a real upload flow — see [Known limitations](#known-limitations)) |
| Cache / rate limiting | Redis (`redis.asyncio`) — a real fixed-window rate limiter on the AI-generation endpoints |
| Containerization | Docker + Docker Compose (local dev), Docker on Render (production) |
| Security | Prompt-injection detection, input length/control-char validation, PII redaction in logs (`backend/app/core/security.py`) |
| Observability | LangSmith tracing, structured JSON logging, in-process metrics (`GET /metrics`), OpenTelemetry |
| Testing | Pytest (`ai/`, `backend/`), Playwright (`frontend/`) |

## System architecture

```mermaid
flowchart TB
    subgraph Client["Browser"]
        UI["Orbit UI — Next.js App Router\n(EN/AR, light/dark)"]
    end

    subgraph Presentation["Presentation Layer — frontend/"]
        UI
    end

    subgraph Interaction["Interaction Layer — backend/app"]
        API["FastAPI routers\nauth · profiles · ai-career-center · dashboard · notifications · settings"]
        SVC["Services\n(onboarding completeness, cross-cutting rules)"]
    end

    subgraph Intelligence["Intelligence Layer — ai/careeros_ai"]
        SGA["SkillGapAnalysisAgent"]
        RM["RoadmapAgent"]
        CVF["CVFeedbackAgent"]
        LG["LangGraph StateGraph\nassemble_context -> generate -> calibrate"]
    end

    subgraph Knowledge["Knowledge Layer"]
        PG[("PostgreSQL\nCareer Knowledge Graph")]
        RD[("Redis\ncache")]
    end

    subgraph External["External services"]
        CLERK["Clerk\nauthentication"]
        GROQ["Groq\nLLM inference"]
    end

    UI -- "HTTPS + Clerk JWT" --> API
    API --> SVC
    SVC --> SGA
    SVC --> RM
    SVC --> CVF
    SGA --> LG
    RM --> LG
    CVF --> LG
    LG -- "inference" --> GROQ
    SVC -- "reads/writes" --> PG
    API -- "cache" --> RD
    UI -- "session" --> CLERK
    API -- "verify JWT (JWKS)" --> CLERK
```

Layer boundaries are enforced by write-ownership, not just convention: the Presentation layer never computes business logic or confidence — it only renders what the Interaction layer already decided; the Intelligence layer never touches Postgres directly — it only returns typed DTOs for the Interaction layer's service layer to persist.

## Folder structure

```
CareerOS/
├── frontend/            # Next.js 15 app (Presentation Layer) — see frontend/README.md
├── backend/              # FastAPI app (Interaction Layer + Knowledge persistence) — see backend/README.md
│   ├── app/
│   │   ├── core/         # settings, Clerk JWT verification
│   │   ├── db/            # SQLAlchemy models, async session
│   │   ├── services/      # cross-cutting business rules
│   │   ├── schemas/        # Pydantic request/response models
│   │   └── api/routers/    # one router per product module
│   ├── migrations/        # Alembic
│   └── tests/              # pytest, hermetic (SQLite + fake agents)
├── ai/                    # LangGraph/LangChain agents (Intelligence Layer) — see ai/README.md
│   └── careeros_ai/
│       ├── agents/         # SkillGapAnalysisAgent, RoadmapAgent, CVFeedbackAgent
│       ├── capabilities/    # explainability, confidence calibration, grounding
│       └── knowledge/       # DTO contracts crossing Intelligence <-> Knowledge
├── docker/                # docker-compose.yml + Dockerfiles for local dev
├── Dockerfile              # Production copy of docker/backend.Dockerfile, for hosts that
│                           # require a root-level Dockerfile (e.g. Render's Docker runtime)
├── infrastructure/         # Postgres bootstrap, env templates
├── docs/                   # PRD, Solution Architecture Specification, ADRs
├── scripts/                # native (non-Docker) dev-workflow scripts
└── Makefile                # make up / make migrate / make test-backend, etc.
```

## Installation

Prerequisites: **Docker Desktop** (recommended path) or **Node.js 20+** and **Python 3.12+** for a native setup, plus API keys for Clerk and Groq.

```bash
git clone <this-repository-url>
cd CareerOS
cp .env.example .env   # fill in CLERK_*, GROQ_API_KEY (see below)
```

## Environment variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env` (already covered by `.gitignore`).

| Variable | Required for | Notes |
|---|---|---|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Local Docker Postgres | Defaults work out of the box for local dev |
| `DATABASE_URL` | Backend | `postgresql+asyncpg://...` — SQLAlchemy async driver scheme required |
| `REDIS_URL` | Backend | `redis://...` |
| `CLERK_SECRET_KEY` | Backend | Server-side Clerk key; also required for real account deletion |
| `CLERK_PUBLISHABLE_KEY` / `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Frontend | Clerk publishable key (same value, two names for server/client contexts) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_STORAGE_BUCKET` | Backend (future) | Not required today — file upload isn't wired to Supabase Storage yet |
| `GROQ_API_KEY` | AI agents | Required for every real Skill-Gap Analysis / Roadmap / CV Feedback generation |
| `LANGCHAIN_TRACING_V2` / `LANGCHAIN_API_KEY` / `LANGCHAIN_PROJECT` | Observability (optional) | Enables LangSmith tracing |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Observability (optional) | OpenTelemetry export target |
| `CORS_ALLOWED_ORIGINS` | Backend | Comma-separated frontend origin(s) allowed to call the API |
| `NEXT_PUBLIC_API_URL` | Frontend | Browser-reachable backend URL |
| `API_URL` | Frontend (Docker only) | Container-network backend address (`http://backend:8000`); leave unset outside Docker Compose |
| `BACKEND_PORT` / `FRONTEND_PORT` | Docker Compose | Local port mapping |
| `ENVIRONMENT` | Backend | `development` / `production` |

## Docker instructions

The full stack (Postgres, Redis, backend, frontend) via Docker Compose:

```bash
cp .env.example .env   # fill in Clerk + Groq keys first
make up                 # or: docker compose -f docker/docker-compose.yml up --build
```

- Frontend: <http://localhost:3000>
- Backend: <http://localhost:8000> · Swagger UI: <http://localhost:8000/docs>

Apply database migrations inside the running container:

```bash
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head
```

## Local development

Without Docker, each part runs natively — see each folder's own README for the full walkthrough:

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate      # or: source .venv/bin/activate
pip install -r requirements-dev.txt
pip install -r ../ai/requirements.txt && pip install -e ../ai
alembic upgrade head
uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

See [`backend/README.md`](backend/README.md), [`ai/README.md`](ai/README.md), and [`frontend/README.md`](frontend/README.md) for testing commands, architecture detail, and each folder's own known gaps.

## Screenshots

_Screenshots are not yet included in this repository — placeholders below, to be replaced with real captures._

| Marketing site | Dashboard |
|---|---|
| _placeholder_ | _placeholder_ |

| Skill-Gap Analysis | Roadmap |
|---|---|
| _placeholder_ | _placeholder_ |

## Presentation

Project presentation: <https://orbit-slide-exact.lovable.app/>

## Deployment status

| Component | URL | Status |
|---|---|---|
| **Frontend** | <https://frontend-ten-navy-5njxz04vw1.vercel.app> (Vercel) | Live. Marketing pages, sign-in/sign-up, and the app shell load correctly. Running with a **development-mode Clerk instance** (not a production Clerk instance) — real users can sign in through a real browser session, but the instance is not production-grade Clerk. |
| **Backend** | <https://careeros-backend-17f9.onrender.com> (Render, free tier, Docker) | Live. `/health` and `/docs` (Swagger) both return 200; CORS confirmed working from the Vercel origin; all endpoints, including the new `/ai-career-center/career-plan/*` supervisor flow, are registered and reachable. |
| **Swagger / OpenAPI** | <https://careeros-backend-17f9.onrender.com/docs> | Live, interactive. |
| **Metrics** | <https://careeros-backend-17f9.onrender.com/metrics> | Live — real in-process counters (see [Observability](#ai-architecture)). |
| **Database** | Neon Postgres (free tier) | Live. All Alembic migrations applied; all 12 application tables plus the LangGraph checkpoint tables (`checkpoints`, `checkpoint_blobs`, `checkpoint_writes`) confirmed present. Render's own free-tier Postgres was tried first and abandoned after exhaustive diagnosis of an external-connectivity issue specific to its free-tier proxy (confirmed via four independent Postgres clients across two OSes, all failing identically) — Neon's external endpoint has no such issue. |
| **Redis** | Render Key Value (free tier) | Live — reachable over Render's internal network from the backend; now actually used (the new rate limiter), not just declared. |
| **AI (Groq)** | — | Fully working in production: the ReAct tool-calling loop, the CareerSupervisor's human-in-the-loop flow, and persistent checkpointing were all verified end-to-end against this exact production database before this section was written. |

**Deployment architecture:**

```mermaid
flowchart LR
    U[Browser] -->|HTTPS| FE[Vercel\nNext.js frontend]
    FE -->|HTTPS + Clerk JWT| BE[Render Docker\nFastAPI backend]
    BE -->|internal network| RD[(Render Key Value\nRedis)]
    BE -->|external TLS| PG[(Neon Postgres\napp tables + LangGraph checkpoints)]
    BE -->|HTTPS| GROQ[Groq API]
    FE -.->|session| CLERK[Clerk]
    BE -.->|verify JWT via JWKS| CLERK
```

Every one of these is a **free tier** — no paid plan was used anywhere in this deployment.

**Known, honest gap**: the Clerk instance backing both frontend and backend is a *development* instance, not a production one — setting up production Clerk requires a domain the project doesn't own, DNS control, and real OAuth provider credentials, none of which are available in this environment. Real users can still sign up and sign in through an actual browser session against the dev instance; it just isn't the production-grade configuration a real launch would use.

## Known limitations

Tracked in detail, feature-by-feature, against the PRD in [`PHASE0-AUDIT.md`](PHASE0-AUDIT.md) (method: every row checked against actual code, not assumed). Headline items:

- **Clerk is a development instance, not production**, on both frontend and backend (see [Deployment status](#deployment-status)) — a real launch would need a domain, DNS control, and real OAuth credentials this environment doesn't have.
- **File upload for CV/Profile Feedback isn't wired to real storage.** The feature accepts pasted/typed text (a real, complete pipeline — generation, explanation, deletion) rather than a file upload through Supabase Storage; the schema field for a storage path exists for when that's built.
- **No automatic material-change detection.** Skill-Gap Analysis can be refreshed on request (a real, working button), but nothing yet auto-triggers a refresh when a qualifying profile edit happens.
- **No roadmap version history or change-diffing.** Only the current roadmap is queryable; there's no "what changed between version N and N+1" view yet.
- **No payment processor.** Subscription/renewal data is real, computed on demand — there's no actual billing-cycle integration (e.g. Stripe) behind it.
- **Live Clerk account deletion is code-complete but not exercised end-to-end** in every environment — it correctly fails closed (a 502, not a silent no-op) whenever `CLERK_SECRET_KEY` is unset, rather than pretending to succeed.
- **`RoadmapAgent` and `CVFeedbackAgent` don't have their own tool-calling/ReAct loop.** Deliberate scope choice — see [Multi-agent overview](#multi-agent-overview) — `SkillGapAnalysisAgent` and `CareerSupervisor` are the flagships for those patterns rather than spreading them thin across every agent.
- **In-process metrics (`/metrics`) reset on restart** and aren't aggregated across multiple instances — real, but not a substitute for a real metrics backend under production concurrency; documented as such in `careeros_ai/observability.py`.

## Future work

- Production Clerk instance (needs a real domain + DNS + OAuth credentials).
- Real file upload for CV/Profile Feedback via Supabase Storage.
- Automatic material-change detection to auto-trigger analysis refreshes.
- Roadmap version history and cross-version change explanations ("what changed and why").
- A real payment processor integration behind Settings' subscription/renewal views.
- Extend the ReAct/tool-calling pattern to `RoadmapAgent` and `CVFeedbackAgent` if their outputs would genuinely benefit from grounded tool lookups, rather than by default.
- A real metrics backend (Prometheus/Grafana or similar) once `/metrics`' in-process counters stop being enough.
- Expansion beyond the AI Career Center module (Learning Hub, Jobs & Internships, Community, Portfolio) per the long-term product vision in the PRD — deliberately out of scope for this phase.

## Testing

```bash
# Backend — 63 tests, hermetic (SQLite in-memory, fake AI/supervisor/rate-limiter, no live Postgres/Redis/Groq needed)
cd backend && pytest tests/

# ai package — 5 tests, pure logic, no API key needed
cd ai && pytest tests/

# Real end-to-end verification against live Postgres + live Groq
cd backend && python -m scripts.verify_e2e   # or: make verify-e2e
```

68/68 hermetic tests passing as of the last full run (runs in ~7s — every external call, including the new CareerSupervisor and rate limiter, is faked the same way the LLM agents always have been). The end-to-end script additionally walks the complete real product flow (profile → goal → analysis → roadmap → CV feedback → notifications → settings) against a live database and live Groq calls, with results independently confirmed via direct `psql` queries. The ReAct tool-calling loop and the CareerSupervisor's human-in-the-loop flow (including a resume from a different process than the one that started it) were additionally verified live against production Neon Postgres + Groq during this phase.

## Documentation

- [Product Requirements Document](docs/01-Product/PRD.md) — what CareerOS is and why every decision exists
- [Solution Architecture Specification](docs/02-Solution-Architecture/SAS.md) — the structural shape: layers, boundaries, contracts
- [`PHASE0-AUDIT.md`](PHASE0-AUDIT.md) — the feature-by-feature completion matrix, checked against actual code
- [`CHANGELOG.md`](CHANGELOG.md) — session-by-session implementation history
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — repository governance and contribution rules

## SDAIA Academy attribution

This project was completed as the capstone for **SDAIA Academy**'s **Advanced Agentic AI Systems Engineering** training program — a 5-day advanced capstone, delivered on-site via Learning Space, 30 training hours.

> Cohort/session dates: _not yet filled in — add the specific dates for the cohort this was completed under before final submission._

See [SDAIA Academy on GitHub](https://github.com/SDAIAAcademy) and the official rubric this project was evaluated against: [`docs/SDAIA_CAPSTONE_RUBRIC.md`](docs/SDAIA_CAPSTONE_RUBRIC.md).

## License

Released under the [MIT License](LICENSE).
