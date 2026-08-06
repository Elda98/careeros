# CareerOS

**Your AI Career Operating System**

CareerOS is an AI-native platform that gives students, graduates, and — over time — a wider career ecosystem a single, persistent system for managing and growing a career: a continuously updated model of a person's goals and skills, worked on by a coordinated set of AI agents that identify gaps, adjust plans, improve materials, and surface opportunities.

This repository is the living source of truth for CareerOS's product definition, architecture, and (as they are written) implementation.

## Repository structure

```
CareerOS/
├── docs/
│   ├── 00-Architecture-Decisions/ # Architecture Decision Records (ADRs) — open architectural questions
│   ├── 01-Product/                # Product Requirements Document (PRD) — what & why
│   ├── 02-Solution-Architecture/  # Solution Architecture Specification (SAS) — structural shape
│   ├── 03-Technical-Architecture/ # Reserved — see "Implementation phase" below
│   ├── 04-Database-Design/        # Reserved
│   ├── 05-API-Specification/      # Reserved
│   ├── 06-UX/                     # Reserved
│   ├── 07-UI/                     # Reserved
│   ├── 08-AI/                     # Reserved
│   ├── 09-Deployment/             # Reserved
│   ├── 10-Testing/                # Reserved
│   └── 11-Research/               # Reserved
├── frontend/                      # Next.js 15 + React + TypeScript + Tailwind + shadcn/ui (SAS Presentation Layer)
├── backend/                       # FastAPI + Python 3.12 (SAS Interaction Layer's API surface + Knowledge Layer persistence)
├── ai/                            # LangGraph + LangChain agents (SAS Intelligence Layer, PRD §25 agent roster)
├── infrastructure/                # Postgres bootstrap, env templates
├── docker/                        # docker-compose.yml + Dockerfiles (local dev)
├── scripts/                       # dev-workflow scripts (native, non-Docker setup)
├── Makefile                       # `make up`, `make migrate`, `make test-backend`, etc.
└── .github/                       # Not yet started (CI)
```

## Documentation chain

CareerOS's documentation follows a deliberate sequence, where each document constrains the ones that follow it without making their decisions for them:

```
PRD  →  SAS  →  UX / UI Design  →  Database Design  →  API Design  →  Technical Architecture  →  Development
```

| Document | Status | Answers |
|---|---|---|
| [Product Requirements Document](docs/01-Product/PRD.md) | **Complete** (§0–§59) | What is CareerOS, and why does every decision exist? |
| [Solution Architecture Specification](docs/02-Solution-Architecture/SAS.md) | **Complete** (all six Parts, §1–§27) | What is CareerOS structurally — its layers, boundaries, relationships, contracts, modules, real end-to-end scenarios, and future-phase extensibility — independent of any implementation technology? |

Every downstream document must trace its decisions back to the PRD and the SAS, and may never contradict them without an explicit, recorded decision (PRD §53, Decision Framework). Open architectural questions surfaced but not yet resolved are tracked as [Architecture Decision Records](docs/00-Architecture-Decisions/) — see [ADR-001](docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md) for the one currently open.

## Implementation phase

As of this point, the PRD and SAS are considered sufficient for implementation, and project priority has shifted from documentation to building. **Database Design, API Specification, Technical Architecture, and AI Architecture are no longer produced as standalone upfront documents.** Instead:
- Implementation proceeds incrementally against the approved PRD and SAS.
- Whenever a database schema, API contract, or architectural decision is actually needed, it is documented in minimal form alongside the code it governs (e.g., a migration's schema comment, an endpoint's contract doc, a component-level README) — not compiled into a separate specification first.
- Documentation is kept synchronized with the implementation as it lands, not maintained ahead of it.
- The `docs/03`–`docs/11` numbered folders remain reserved for reference material or retrospective documentation if genuinely needed, but are not the default location for new implementation-adjacent docs going forward.

### Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.12, FastAPI, Pydantic |
| AI orchestration | LangGraph, LangChain (Groq) |
| Database | PostgreSQL + pgvector |
| Auth | Clerk |
| File storage | Supabase Storage |
| Cache | Redis |
| Deployment (local) | Docker + Docker Compose |
| Observability | LangSmith, OpenTelemetry |
| Testing | Pytest (`ai/`, `backend/`), Playwright (`frontend/`) |

Platform surface is web-only (resolves PRD §13/§55's previously-open Platform Surface question for Phase 0).

### Quick start

```bash
cp .env.example .env   # fill in Clerk, Groq, and Supabase keys
make up                # Postgres (pgvector) + Redis + backend + frontend, via Docker Compose
```

- Frontend: http://localhost:3000 · Backend: http://localhost:8000/docs

Native (non-Docker) setup: `scripts/setup.sh`. See `backend/README.md`, `ai/README.md`, and `frontend/README.md` for what's implemented so far and each folder's known gaps — those READMEs, not this one, are where implementation-level detail lives (per the rule above).

### What's implemented so far

**Milestone 1 (locked, approved):** the complete Phase 0 onboarding flow, wired end-to-end and verified against real infrastructure — Postgres, Groq (via LangGraph), Docker. Sign up / Log in (Clerk) → Profile → Goal selection → Skill input → AI Skill-Gap Analysis → automatic Roadmap generation → Dashboard.

**Milestone 2 (in progress):** hardening the AI Career Center to production quality before any future module (Learning Hub, Jobs, Community, etc.) begins. Progress is tracked as a **completion matrix against the PRD feature inventory** (Authentication, Onboarding, Profile, Goals, Skill Gap Analysis, Roadmap, CV Feedback, Dashboard, Notifications, Settings, Accessibility, Testing, Documentation) — see **[`PHASE0-AUDIT.md`](PHASE0-AUDIT.md)**, the session-by-session implementation log — and **[`CHANGELOG.md`](CHANGELOG.md)** for implementation detail. Closed so far: on-request Explainability (RAI-4), Notification triggering (BR-NOTIF-1/4), the **complete CV Feedback vertical** (95%), and the **complete Settings vertical** (95% — account with real Clerk Admin API deletion, subscription + cancellation reason, renewal recap, working notification preferences, data overview, goal reactivation; all tested and live-verified except the live Clerk-side deletion call itself, which is blocked on a missing `CLERK_SECRET_KEY` value in this environment, not on missing code).

**Independent audit:** [`docs/99-Audits/PHASE0_IMPLEMENTATION_AUDIT.md`](docs/99-Audits/PHASE0_IMPLEMENTATION_AUDIT.md) is a from-scratch, line-by-line re-verification of the entire codebase against the PRD and SAS — the authoritative checklist for the remainder of Phase 0, distinct from (and superseding, where they disagree) the running self-reported log in `PHASE0-AUDIT.md`. Headline finding: architecture compliance is excellent (93% — zero write-ownership or module-boundary violations found across the whole codebase), overall Phase 0 completion is **73%**, and the largest concentrated gaps are automatic material-change regeneration (entirely unbuilt), the Progress screen and readiness-over-time concept (entirely unbuilt), and inconsistent accessibility/test coverage across the frontend.

**Execution plan:** [`docs/99-Audits/PHASE0_EXECUTION_PLAN.md`](docs/99-Audits/PHASE0_EXECUTION_PLAN.md) converts every audit finding into 18 dependency-ordered, independently-verifiable milestones across 5 execution phases — planning only, no implementation started against it yet.

**Milestone 3 (in progress, separate from the above):** a complete presentation-layer redesign — with zero backend/API/database/AI/auth changes. The product now presents as two distinct experiences: a complete public marketing site (brand: **Orbit**, "AI-Powered Career Intelligence" — presentation-layer name only, the underlying project remains CareerOS) shown before authentication, and the App Shell-based product application after. The design system's color/typography/shape tokens were rebuilt from Orbit's official logo (WCAG-AA-verified programmatically, not eyeballed), and the product now has a full dark/light theme system plus full English/Arabic bilingual support with RTL — see `frontend/README.md` for the complete brand analysis, token inventory, and language-system architecture, and `CHANGELOG.md` for session-by-session detail. Coverage so far: the marketing site, App Shell, Dashboard, Skill-Gap Analysis (including wiring its previously-unused manual refresh action, FR-AICC-4), Roadmap (a vertical status timeline replacing four always-visible per-item buttons with one status menu — no new backend wiring needed here, every roadmap endpoint was already in use), CV Feedback (exposing the previously-hidden `relevance_to_goal` field on every feedback item, and honestly reinterpreting a requested "strengths vs improvements" split as the backend's real factual/judgment-call category axis rather than fabricating praise the AI never produced), Notifications (reframed as a Today/Yesterday/Earlier activity timeline; the requested seven-category taxonomy was honestly reduced to the three categories the backend actually produces, and no "mark all as read" was built since the backend has no bulk endpoint), Settings (reframed from one long form into eight cards covering Profile & Goal, Account, Subscription, Notification Preferences, Theme/Language, Privacy & Data, Security, and a Danger Zone; found and fixed a real badge-styling bug that bypassed the design-system token system, and flagged the identical bug still present on the not-yet-migrated `/profile` page), and — new, not a migration — Progress (`/progress`, a career-readiness/skill-improvement/milestones view built entirely from existing endpoints, most notably the first-ever frontend use of `GET /skill-gap-analysis/history`; built honestly against the fact that `docs/99-Audits/PHASE0_EXECUTION_PLAN.md`'s own M8 milestone requires a `GET /roadmap/history` endpoint — M5, not built — that this pass could not add without changing backend architecture, so there is deliberately no per-version roadmap history on this page, documented rather than faked). Remaining product pages (Onboarding, Profile) follow one vertical slice at a time, per the brand direction's own "design system first, then migrate every page" sequencing — the smallest remaining list since this redesign effort began.

**Verified, not just written:** 47 backend + 5 ai tests passing; frontend type-checks (`tsc`), lints (`eslint`), and production-builds cleanly; every closed gap re-verified live against real Postgres and real Groq (`backend/scripts/verify_e2e.py`), not only unit-tested. See `backend/README.md`, `ai/README.md`, and `frontend/README.md` for exact commands and each folder's known gaps.

## Current product scope

CareerOS's MVP (Phase 0) is scoped to a single module — the **AI Career Center** — serving **Students and Fresh Graduates**, on a B2C subscription model. Community, Jobs & Internships, Learning Hub, Portfolio, a Services Marketplace, and University/Company accounts are part of the documented long-term vision but are deliberately out of scope until their respective phase is reached. See [PRD §13](docs/01-Product/PRD.md) for the full scope statement and rationale.

## Governance

This project is governed by the Decision Framework established in PRD §53: every future product, design, AI, or architectural decision is evaluated against a fixed hierarchy — Vision → Principles → Strategy → Core Loop → Phase Structure → Features → Implementation — and no decision at a lower level may contradict one already fixed at a higher level. Proposed exceptions and open questions are tracked in PRD §55.

## Repository governance

This repository — not any conversation history — is the authoritative project memory. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the standing rules governing how it's maintained, including: every major document ships as a master file **and** a `sections/` folder (the section files are the editable source of truth; the master is the compiled reference, regenerated after every change); every major document maintains its own `CHANGELOG.md`; and every task that touches the repository reports what was created, modified, and cross-referenced.
