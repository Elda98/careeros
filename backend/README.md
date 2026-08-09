# backend — Presentation/Interaction API surface

FastAPI application implementing the REST surface for CareerOS's Phase 0 modules: Authentication (identity anchoring), User Profiles, AI Career Center, Dashboard, Notifications, and Settings (SAS Part III §14, Part IV §17-21) — plus the role-based ecosystem's Account/Role, Company (job/internship postings), and Service Provider (service listings) modules; see the root [README's Role-based ecosystem section](../README.md#role-based-ecosystem) for the full implemented-vs-vision breakdown.

## Structure

```
app/
  core/       # settings (pydantic-settings), Clerk JWT verification
  db/         # SQLAlchemy models (Career Knowledge Graph + account-level data), async session, portable GUID type
  services/   # cross-cutting rules used by more than one router (e.g. onboarding completeness)
  schemas/    # Pydantic request/response models
  api/deps.py   # shared dependencies: DB session, current user, Intelligence Layer agent providers
  api/routers/  # one router per module, matching SAS module boundaries
migrations/   # Alembic
tests/        # pytest + SQLite in-memory + fake agents (no live Postgres or LLM required)
```

Each router's docstring states which SAS module it implements and which entities it owns vs. only reads — the same write-ownership discipline as `ai/README.md`, enforced here at the persistence layer.

## Local development

```bash
python -m venv .venv && .venv\Scripts\activate   # or source .venv/bin/activate on macOS/Linux
pip install -r requirements-dev.txt
pip install -r ../ai/requirements.txt && pip install -e ../ai
cp ../.env.example ../.env   # fill in secrets
alembic upgrade head          # once a migration exists — see below
uvicorn app.main:app --reload
```

Or via Docker Compose from the repo root: `docker compose -f docker/docker-compose.yml up --build` (or `make up`).

## Migrations

The initial schema migration (`migrations/versions/3bb0f586eb34_initial_schema.py`) exists and has been applied against a live Postgres (`pgvector/pgvector:pg16`, via `docker compose up postgres`) — verified by actually running it, not just generating it. All 12 tables confirmed present via `psql \dt`, and the JIT user-provisioning + onboarding-status read path (`app/api/deps.py` → `app/services/onboarding.py`) verified end-to-end against it (insert, `selectinload` fetch, delete).

To regenerate after a model change:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Or, via Docker Compose from the repo root: `docker compose -f docker/docker-compose.yml exec backend alembic upgrade head`.

## Testing

```bash
pip install -r requirements-dev.txt
pytest tests/
```

Runs against SQLite in-memory (`app/db/types.py`'s portable `GUID` type makes this possible) with every Intelligence Layer agent dependency overridden by a fake (`tests/fake_agents.py`) — no live Postgres, Clerk, Redis, or `GROQ_API_KEY` required. Clerk's Admin API is likewise overridden by default with `FakeClerkAdminClient` (`tests/conftest.py`), so no test accidentally makes a real network call to Clerk; account-deletion tests swap in `FailingClerkAdminClient` where they need to assert the failure-ordering behavior. The `CareerSupervisor` and the AI-endpoint rate limiters are overridden the same way (`FakeCareerSupervisor`, no-op rate-limit dependencies) — a real Redis/Postgres round-trip measured ~1.4s per call inside pytest's `TestClient` context, which doesn't belong in a suite whose whole point is being hermetic and fast. **117 tests, all passing** (~6s), covering: profile/goal CRUD, BR-GOAL-1/2 (exactly one active goal) and BR-GOAL-5 (reactivating a previous goal), the onboarding-status hard-bar gate (BR-GAP-1/2), the Skill-Gap Analysis → Roadmap generation cascade (SAS Part IV §18.5/§19.2), version incrementing, the Roadmap Item status override never touching agent-owned content (SAS Part IV §21.3), CV feedback round retention and empty-text rejection (FR-AICC-18), on-request explanation for all four output types (Skill-Gap, Roadmap, CV Feedback, and the role-based ecosystem's opportunity-fit explanation) including IDOR checks (RAI-4), notification triggering and category muting (BR-NOTIF-1/4, FR-NOTIF-3), the full Settings surface (account, subscription cancel with/without a reason, renewal recap, notification preferences, data overview), account deletion's success path (Clerk deletion + full ordered local cascade) and its Clerk-failure path (local data proven untouched), specific-data deletion (FR-SET-3/BR-DATA-3/4), the supervised career-plan start→approve/reject flow, prompt-injection rejection on `PATCH /profile`, `POST /cv-feedback`, and job-opportunity creation/update, the rate limiter's own threshold/fail-open logic (`tests/test_rate_limit.py`), the security-guardrail unit tests (`tests/test_security.py`), and the role-based ecosystem's own coverage — account-type persistence and profile CRUD (`test_account.py`), job-opportunity/application ownership isolation and the candidate-readiness privacy boundary (`test_opportunities.py`), service-listing ownership isolation and gap-matched recommendations (`test_services.py`), and a consolidated cross-role authorization matrix (`test_role_authorization.py`) — see the root [README's Role-based ecosystem section](../README.md#role-based-ecosystem).

The `ai/` package additionally has 16 of its own tests (`cd ai && pytest tests/`), including two that drive the *real* LangGraph graphs (not fakes): `ai/tests/test_skill_gap_analysis_graph.py` (the ReAct loop, tool execution, and retry logic, against a scripted fake LLM) and `ai/tests/test_supervisor_graph.py` (the `CareerSupervisor` graph's interrupt/resume mechanics, against an in-memory checkpointer).

### Linting

```bash
ruff check app/ tests/ ../ai/careeros_ai/
```

Configured in `pyproject.toml`'s `[tool.ruff]` — `B008` (function-call-in-default-argument) is deliberately ignored, since FastAPI's `param: T = Depends(fn)` dependency-injection idiom requires exactly that pattern; flagging it would mean either false-positiving on ~80 correct route signatures or disabling the rule everywhere it doesn't apply. `BLE001` (blind `except Exception`) is enabled — every genuinely-needed broad catch in this codebase carries an explicit, current `# noqa: BLE001` with a stated reason (a tool failure becoming a ReAct observation, a generation failure feeding the retry loop); every other `except Exception` re-raises a specific, controlled exception and needs no suppression.

### Real end-to-end verification (live Postgres + live Groq)

`tests/` is intentionally hermetic (SQLite, fake agents) so it runs fast and without credentials. `scripts/verify_e2e.py` is the opposite: it exercises the real, unmocked dependency graph — real Postgres, real LangGraph agents making real Groq calls — with only Clerk's browser OAuth stubbed (a fixed test identity, since a script can't drive a real sign-in flow).

```bash
make verify-e2e
# or: docker compose -f docker/docker-compose.yml exec backend python -m scripts.verify_e2e
```

Creates one throwaway user with a fresh random `clerk_user_id` per run and walks the complete onboarding flow — profile, goal, Skill-Gap Analysis (+ on-request explanation), Roadmap generation (+ explanation), Roadmap Item status override, CV Feedback (+ explanation), a second CV Feedback round followed by deleting the first (BR-DATA-4 non-retroactivity), notification triggering, then the full Settings vertical (account, subscription cancel-with-reason, renewal recap, notification-preference muting proven to actually suppress a notification, data overview) and goal reactivation (BR-GOAL-5) — printing each real Groq-generated result. **Last verified passing in full** (18 steps), including all Milestone 2 additions, with independently-confirmed Postgres rows queried directly via `psql`, not just inferred from API responses. Account deletion is deliberately *not* run here — `CLERK_SECRET_KEY` has no value in this environment's `.env`, so a live run would only exercise the already-correct 502 failure path; see "Known gaps" below.

## Implemented so far

The complete Phase 0 onboarding vertical slice (Milestone 1): Authentication, Profile CRUD, Goal selection, onboarding-completeness gate, Skill-Gap Analysis, automatic Roadmap generation, Roadmap Item status override, CV/Profile Feedback, a read-only Dashboard, Settings.

Plus, from Milestone 2 (see [`PHASE0-AUDIT.md`](../PHASE0-AUDIT.md) and [`CHANGELOG.md`](../CHANGELOG.md) for full detail): on-request Explainability for all three AI output types (RAI-4), Notification triggering on Analysis/Roadmap/CV Feedback completion (BR-NOTIF-1/4), specific-data deletion for Profile and CV Feedback Round (FR-SET-3, BR-DATA-3/4), the complete CV Feedback vertical including its frontend (`frontend/README.md`), and the complete Settings vertical — real Clerk Admin API account deletion (FR-AUTH-5), subscription view/cancel-with-reason, renewal recap, working notification preferences (FR-NOTIF-3), goal reactivation (BR-GOAL-5), and their frontend (`/profile`, `/settings`).

## Supervised career-plan flow, security, and observability (Phase 2)

Three new endpoints, `POST /ai-career-center/career-plan/{start,approve,reject}`, back a coordinator-driven alternative to `POST /skill-gap-analysis/refresh` — same two agents, run through `careeros_ai.orchestration.supervisor.CareerSupervisor` instead of called directly, with a human-in-the-loop approval gate before the roadmap draft is persisted. The Skill-Gap Analysis is still persisted immediately in this flow too; only the roadmap is gated. See the root README's [Multi-agent overview](../README.md#multi-agent-overview) for the full design, and `app/api/routers/ai_career_center.py`'s comments for the exact endpoint contracts.

- **`app/core/security.py`** — real prompt-injection detection (regex patterns for classic instruction-override attempts) and length/control-character validation, applied to every free-text field that reaches an agent prompt (`PATCH /profile`'s background/education/experience, `POST /cv-feedback`'s document_text). Rejected outright (400), not silently sanitized. Also `redact_pii_for_logging`, used only when writing user text to a log line.
- **`app/core/rate_limit.py`** — a real Redis-backed fixed-window limiter (`INCR`+`EXPIRE`) on the three AI-generation endpoints (10 requests/60s per user per endpoint). `REDIS_URL` has been a declared dependency since this project's start but was unused in code until this phase. Fails open if Redis is unreachable.
- **`GET /metrics`** — real in-process counters (`careeros_ai/observability.py`), not placeholders: agent reasoning steps, tool calls, retries, HITL interrupts/resumes, guardrail rejections. JSON, not Prometheus format — no metrics backend is provisioned to scrape one.
- **`app/core/logging_config.py`** — structured JSON logging for the whole process, configured once at import time.

## Role-based ecosystem — Company & Service Provider MVPs

Three new routers, all gated server-side (never trusting a client-claimed role):

- **`app/api/routers/account.py`** — `GET/PUT /account/type` (persists `User.account_type`), `GET/PATCH /account/company-profile`, `GET/PATCH /account/service-provider-profile`.
- **`app/api/routers/opportunities.py`** — `/company/opportunities/*` (company-only CRUD + applicant review), `GET /opportunities` + `POST /opportunities/{id}/apply` (any authenticated candidate), `GET /opportunities/{id}/explain-fit` (reuses `careeros_ai.capabilities.explainability.explain_output` — no new agent).
- **`app/api/routers/services.py`** — `/provider/services/*` (provider-only CRUD), `GET /services` (public discovery), `GET /services/recommended` (keyword-matched against the caller's own current skill gaps).

`app/api/deps.py`'s `require_account_type(*allowed)` is the enforcement primitive behind all three — it reads `user.account_type` from the same JWT-verified `get_current_user` every other endpoint uses, never a header/body-supplied value. Ownership is checked separately and explicitly on every company/provider-scoped read or write, returning 404 (not 403) for a resource that exists but isn't the caller's — the same IDOR-safe pattern the AI Career Center's `/explain` endpoints established. Full design rationale and the implemented-vs-vision breakdown: root [README's Role-based ecosystem section](../README.md#role-based-ecosystem).

## Known gaps (tracked here, not in a separate spec — see `CONTRIBUTING.md` rule 8; full list in `PHASE0-AUDIT.md`)

- CV/Profile Feedback accepts pasted/typed text (`document_text`, now a proper JSON body — fixed this milestone, was previously a query parameter) rather than a real file upload through Supabase Storage. `document_storage_path` exists on the model for when that's wired up; `document_text` is what's actually persisted and used for explanation grounding today. This is a deliberate, documented interface choice, not a placeholder — the full pipeline from submission through explanation and deletion is real and complete.
- Material-change detection (BR-GAP-3) that would auto-trigger `POST /ai-career-center/skill-gap-analysis/refresh` on a qualifying Profile edit is not yet wired — the endpoint works, but only via explicit call (covers PRD §27.7 Manual Refresh; §27.5's automatic case is not yet implemented).
- Full account deletion (FR-AUTH-5) is fully implemented — real Clerk Admin API call plus an ordered local cascade, tested against both success and Clerk-failure paths — but **`CLERK_SECRET_KEY` has no value in this environment's `.env`** (the variable name exists, unset). Set it to a real Clerk secret key to exercise this live; until then, `DELETE /settings/account` will always fail with a 502 (correctly — see `ClerkAdminClient.delete_user`'s guard) rather than silently succeed without actually deleting the Clerk identity.
- No payment processor (Stripe or similar) is part of this stack, so `GET /settings/renewal-recap` (FR-RENEW-1) computes its content on demand from real data rather than being tied to an actual billing-cycle event — see `app/schemas/settings.py`'s `RenewalRecapRead` docstring.
- Roadmap-staleness notification (BR-NOTIF-1(c)) needs a scheduled/background check — distinct infrastructure from the request-triggered notifications added this milestone.
- Clerk JWKS caching has no TTL/invalidation — fine for a capstone, revisit before any real production traffic. It also does a blocking `httpx.get` inside an async dependency (`app/core/auth.py`'s `_jwks`), which stalls the event loop on first call per issuer; low-impact today since it's `lru_cache`d after the first request, but worth switching to `httpx.AsyncClient` eventually.
- Agent instances are process-wide singletons (`functools.lru_cache` in `app/api/deps.py`); fine for a single-process capstone deployment, revisit under real concurrency/scaling.
- Explanation grounding for Skill-Gap Analysis/Roadmap uses the user's *current* Profile/Goal/Analysis, not a point-in-time snapshot from when the original output was generated — documented in the explain endpoints' own docstrings (`app/api/routers/ai_career_center.py`) as an honest, intentional limitation, not a silent inaccuracy.
- Company candidate search/filtering (browsing all candidates, not only applicants to its own postings) is not implemented — PRD §16 scopes it for the Company persona; would need a much larger public-candidate-directory privacy design than the per-application `CandidateReadinessRead` snapshot built here.
- Service Provider's request/booking and post-service review steps (PRD §16's full "publish, discover, request, and review" description) are not implemented — only publish and discover exist. No payment processing exists anywhere in this stack to integrate a paid-request flow against.
- `GET /services/recommended` is plain keyword matching against the caller's own current skill-gap names, not an LLM call — a deliberate scope choice (a structural ecosystem connection, not the AI-matching capability, which is `GET /opportunities/{id}/explain-fit` instead).
