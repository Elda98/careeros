# Phase 0 Implementation Audit

**Independent, line-by-line audit of the actual codebase against the PRD and SAS.**

Date: 2026-08-06 · Auditor: Claude (independent pass, not the implementer's own self-report) · Status: **Complete**

This document is the authoritative checklist for the remainder of Phase 0. It supersedes the completion percentages in `PHASE0-AUDIT.md`'s matrix where the two disagree — `PHASE0-AUDIT.md` is a running implementation log written session-by-session by whoever was building; this document is a from-scratch re-verification against the locked spec, performed by reading every requirement document and every line of application code independently, then cross-referencing the two.

---

## Methodology

1. Read every PRD section governing Phase 0 scope in full: §13, §15, §16, §18–§31, §36, §37, §43–§45, §58 (Product Definition, AI System Design, Experience & Design Direction, Requirements & Constraints, Traceability).
2. Read the complete Solution Architecture Specification, Parts I–IV (§1–§21) — System Architecture, Interface & Contract Architecture, Module Architecture, Cross-Layer System Scenarios. (Part V/VI, §22–§27, is Extensibility Philosophy for *future* modules and was out of scope for a Phase 0 compliance check.)
3. Independently inventoried the actual repository — every backend router, model, service, and schema; every frontend route, component, and state; every file in the `ai` package (agents, capabilities, contracts); every test file in all three — reading actual code, not comments or prior audit claims.
4. Cross-referenced every Functional Requirement (FR-), Business Rule (BR-), Responsible AI item (RAI-), Non-Functional Requirement (NFR-), Data Privacy Requirement (DPR-), and Trust & Safety item (TS-) against what the inventory found.
5. Verified `app/main.py` directly for CORS/middleware configuration (security-relevant, not covered by the routine router inventory).

No production code was modified during this audit.

**Legend:** ✅ Complete · 🟡 Partial · ❌ Missing

---

## 1. Executive Summary

Phase 0's **architectural discipline is genuinely strong** — the hardest, most safety-critical rules in the SAS (exclusive write-ownership, §11.6; mediated-only agent communication, §4.10; the Presentation/Interaction/Intelligence/Knowledge boundary, §6.11) were checked line-by-line against the actual code and **zero violations were found**. Every ID-scoped backend endpoint correctly filters by the requesting user (zero IDOR violations found across the entire API surface). CV Feedback, Profile, and Settings are complete, tested, and live-verified verticals.

Three things keep Phase 0 from being honestly declared complete:

1. **Material-change auto-regeneration (FR-AICC-10, BR-GAP-3/4, BR-ROAD-2, FR-NOTIF-4) does not exist.** A user who edits their profile or changes their goal gets no automatic re-analysis — only a manual "Refresh" button works. This is not a small gap: it is one of the PRD's four Core Loop mechanisms (§14) and one of SAS Part IV's five named scenarios (§19.3), and it is entirely unbuilt.
2. **The Progress screen (§22 screen 11) and its underlying "readiness over time" concept (FR-AICC-19/20, BR-PROG-1/2, Career Score/Readiness/Career Health derived signals) do not exist at all** — no route, no aggregation endpoint, no derived-signal computation anywhere in the codebase.
3. **Accessibility and testing are inconsistent, not absent** — three pages (CV Feedback, Profile, Settings) meet a genuinely good standard; the rest (Onboarding, Roadmap, Notifications, Skill-Gap Analysis) fall meaningfully short of it, and automated test coverage is concentrated entirely on backend business logic — the `ai` package's actual agent/LLM-calling code and every authenticated frontend page have effectively zero test coverage, which is exactly where this audit found two real confidence-calibration bugs.

**Final Phase 0 completion: 73%** (methodology and category breakdown in §20).

---

## 2. Requirement-by-Requirement Classification

### 2.1 Functional Requirements (PRD §19)

| ID | Requirement | Status | Note |
|---|---|---|---|
| FR-AUTH-1 | Create account | ✅ | Clerk sign-up, JIT-provisioned backend `User` row |
| FR-AUTH-2 | Authenticate on return | ✅ | Clerk sign-in |
| FR-AUTH-3 | Recover access if credentials lost | 🟡 | No CareerOS-owned "Account Recovery" route exists; not represented in `middleware.ts`'s public-route list at all. Presumably reachable through Clerk's hosted widget but never built or verified as a distinct screen §22 #3 requires |
| FR-AUTH-4 | Activity linked to authenticated identity | ✅ | `user_id` FK scoping throughout every table and query |
| FR-AUTH-5 | Permanently delete account | 🟡 | Fully coded (real Clerk Admin API call + ordered local cascade), tested with fakes (success + failure-ordering), but never exercised against the real Clerk API — `CLERK_SECRET_KEY` has no value in `.env` |
| FR-ONBOARD-1 | Define/communicate minimum profile bar | ✅ | `app/services/onboarding.py::evaluate()`, gates `/skill-gap-analysis/refresh` with a 400 + machine-readable missing-fields payload |
| FR-PROF-1 | Edit background/education/experience | ✅ | `PATCH /profile` + `/profile` page |
| FR-PROF-2 | State/update target role or field | ✅ | `POST /profile/goals` |
| FR-PROF-3 | Profile stored as part of graph, accessible to agents | ✅ | `ProfileSnapshot` passed to `SkillGapAnalysisAgent` |
| FR-PROF-4 | Indicate what's missing / would improve quality | 🟡 | Implemented for the onboarding gate (`missing_hard_bar_fields`/`missing_quality_fields`); **not surfaced on the standalone `/profile` edit screen** post-onboarding — a returning user editing their profile gets no "this would improve your analysis" signal at all |
| FR-AICC-1 | Generate skill-gap assessment vs. goal | ✅ | `SkillGapAnalysisAgent` |
| FR-AICC-2 | Identify specific gaps, not only a score | ✅ | `SkillGap` list with skill/description/severity |
| FR-AICC-3 | Expose reduced confidence on uncertainty | ✅ | `calibrate_profile_completeness` |
| FR-AICC-4 | Manual refresh after profile/goal update | ✅ | `POST /skill-gap-analysis/refresh`, callable any time |
| FR-AICC-5 | Explain on request why a skill was flagged | ✅ | `GET .../gaps/{id}/explain`, live-verified |
| FR-AICC-6 | Show what changed and why on a new version | ❌ | **No Change Awareness implementation exists.** `previous_version` is fetched into the agent's input DTO and its mere *presence* toggles a `"previous_version"` label in `grounded_on` — its actual content (prior gaps, prior summary) is never read, diffed, or compared anywhere in `skill_gap_analysis.py`. No frontend surfaces a diff either — the Skill-Gap Analysis screen only ever shows `/current` |
| FR-AICC-7 | Generate ordered roadmap from analysis | ✅ | `RoadmapAgent` |
| FR-AICC-8 | Each item specific enough to act on | ✅ | System prompt instructs this; structurally present |
| FR-AICC-9 | Mark items complete/in-progress/skipped, revise | ✅ | `PATCH /roadmap/items/{id}/status`, unrestricted transitions, tested |
| FR-AICC-10 | Regenerate/adjust roadmap on material change | ❌ | **No material-change detection exists anywhere in the codebase.** Editing a profile field or changing the goal never triggers regeneration — only an explicit manual refresh does. `ai_career_center.py` carries its own comment acknowledging this ("§27.5 is not implemented") |
| FR-AICC-11 | Explain why a roadmap item was recommended | ✅ | `GET .../items/{id}/explain`, live-verified |
| FR-AICC-12 | Show what changed and why on roadmap change | ❌ | Same root cause as FR-AICC-6 (no Change Awareness) — and moot in practice today, since FR-AICC-10's automatic trigger never fires to produce a "change" to show |
| FR-AICC-13 | Submit CV/profile document for review | ✅ | `POST /cv-feedback` |
| FR-AICC-14 | Specific feedback tied to target role | ✅ | `CVFeedbackAgent` prompt grounds in `goal.target_role` |
| FR-AICC-15 | Distinguish factual/structural vs. judgment-call | ✅ | `CVFeedbackCategory` enum in backend response (though see §13 for a type-safety note on the `ai` package's own DTO) |
| FR-AICC-16 | Explain why feedback matters, on request | ✅ | `GET .../items/{id}/explain`, live-verified |
| FR-AICC-17 | Request re-review after changes | ✅ | New submission creates a new round at any time |
| FR-AICC-18 | View previous feedback rounds, not just latest | ✅ | `GET /cv-feedback` returns all rounds; frontend history view |
| FR-AICC-19 | Maintain history of assessments and roadmap completion | 🟡 | `SkillGapAnalysis` history **is** retrievable (`GET .../history`); Roadmap version history is **not** — no endpoint exposes prior Roadmap versions, only `/current`. `RoadmapItemStatusChange` history rows exist in the DB but have no endpoint either |
| FR-AICC-20 | View how readiness changed since starting | ❌ | No Readiness/Career Score/Career Health derived signal is computed or stored anywhere (confirmed absent from the entire data model) |
| FR-DASH-1 | Single current snapshot, not an analytics grid | ✅ | `dashboard.py` returns exactly `next_action` + `current_confidence` |
| FR-DASH-2 | Surface single next action from active roadmap | ✅ | First `NOT_STARTED` item |
| FR-DASH-3 | No navigation required for overall status | ✅ | Single page |
| FR-DASH-4 | Next-action reason visible inline | ✅ | `reason: f"Addresses: {next_item.addresses_gap}"`, rendered inline on `/dashboard` |
| FR-NOTIF-1 | Notify when requested analysis/roadmap/feedback ready | ✅ | `notify()` called at all 3 completion sites, live-verified |
| FR-NOTIF-2 | Notify when roadmap goes stale | ❌ | No staleness detection/scheduler exists anywhere (needs infrastructure not yet in the stack — acknowledged in code comments) |
| FR-NOTIF-3 | Control notification frequency and category | 🟡 | Category muting ✅ complete and behaviorally verified (a muted category demonstrably suppresses delivery); **frequency control does not exist** — there is no delivery-frequency setting anywhere, an intentional scope decision documented in code (no delivery channel beyond in-app exists to have a frequency), but the FR text explicitly requires both |
| FR-NOTIF-4 | Notify on system-initiated regeneration, distinct from user-requested | ❌ | Moot in the current build: the only regeneration trigger that exists today is user-initiated (manual refresh); there is no system-initiated case to notify differently about |
| FR-SET-1 | View/manage subscription and billing | ✅ | `GET /settings/subscription` + cancel |
| FR-SET-2 | View what data is stored | ✅ | `GET /settings/data` |
| FR-SET-3 | Delete specific stored data, independent of full deletion | 🟡 | `DELETE /profile` (clears fields) and `DELETE /cv-feedback/{id}` (per round) both work; **there is no way to delete an individual Skill-Gap Analysis or Roadmap version** — those are only removable via full account deletion |
| FR-SET-4 | Cancel subscription directly | ✅ | `POST /settings/subscription/cancel` |
| FR-RENEW-1 | Progress summary before a renewal charge | 🟡 | Implemented as an always-available, on-demand computed recap (`GET /settings/renewal-recap`) using real data — but genuinely **not tied to or triggered by an approaching renewal charge**, because no payment processor exists in this stack to produce that event. Honestly documented in code as a workaround, not a silent gap, but the FR's literal "before a renewal charge occurs" timing requirement is unmet |
| FR-RENEW-2 | Optional, non-blocking cancellation reason | ✅ | `SubscriptionCancelRequest.reason`, optional, tested |

**FR tally: 44 requirements — 30 ✅ (68.2%), 9 🟡 (20.5%), 5 ❌ (11.4%). Weighted score (✅=1, 🟡=0.5, ❌=0): 34.5 / 44 = 78.4%.**

### 2.2 Business Rules (PRD §21)

| ID | Rule | Status | Note |
|---|---|---|---|
| BR-GOAL-1 | Exactly one active goal at a time | 🟡 | Enforced correctly at the application layer in both `create_goal` and `reactivate_goal`; **no database-level constraint** (no partial unique index) backs it — a direct write or a race between two concurrent requests could violate it, and no concurrency test exists to catch this |
| BR-GOAL-2 | New active goal archives, doesn't delete, current | ✅ | |
| BR-GOAL-3 | Goal change is a material change, triggers regeneration | ❌ | Changing the goal never triggers analysis/roadmap regeneration — confirmed: `POST /profile/goals` and `reactivate_goal` only write the `Goal` row |
| BR-GOAL-4 | Previous goals visible in history, not editable | ✅ | `GET /profile/goals` returns all; no goal-edit-by-id endpoint exists |
| BR-GOAL-5 | Reactivate a previous goal | ✅ | Implemented, tested, live-verified this session |
| BR-GAP-1 | Min info = active goal + completeness bar | ✅ | |
| BR-GAP-2 | Analysis blocked below bar, missing info communicated | ✅ | 400 + `missing_hard_bar_fields` |
| BR-GAP-3 | Definition of "material change" | ❌ | Not implemented anywhere — no code distinguishes a flagged-gap-relevant edit from an unrelated one, because no material-change detection exists at all |
| BR-GAP-4 | Auto-regenerate on material change; manual refresh always available | 🟡 | Manual path ✅ complete; automatic path ❌ entirely missing |
| BR-GAP-5 | Incomplete-but-above-bar profile reduces confidence, doesn't block | ✅ | `calibrate_profile_completeness` — see also §13 Bugs for a related confidence-honesty defect |
| BR-ROAD-1 | Roadmap only exists derived from a current analysis | ✅ | `Roadmap.analysis_id` FK, always generated as a cascade |
| BR-ROAD-2 | Roadmap regen follows same material-change trigger as analysis | 🟡 | The *cascade mechanics* work correctly — every analysis refresh (manual or, hypothetically, automatic) does regenerate the roadmap. But since the automatic trigger (BR-GAP-3/4) doesn't exist, the roadmap is only ever regenerated via the manual path |
| BR-ROAD-3 | Regeneration retains prior version as history | 🟡 | True at the DB level (new `Roadmap` row per refresh, prior rows untouched) — but **no endpoint exposes it**; a user cannot actually view an archived roadmap version |
| BR-ROAD-4 | Skipped item stays visible, counts neither for/against, un-skippable at any time | 🟡 | Skip/un-skip mechanically works via `PATCH`; the "counts neither toward nor against progress" clause is untestable because no progress metric exists at all (see FR-AICC-20) |
| BR-ROAD-5 | Completed item may be reopened any time | ✅ | Unrestricted status transitions |
| BR-ROAD-6 | Reopening preserves original completion record | ✅ | `RoadmapItemStatusChange` append-only table, confirmed |
| BR-ROAD-7 | Archived roadmap versions retained for account lifetime, viewable | 🟡 | Retained ✅; viewable ❌ (no history endpoint) |
| BR-PROG-1 | Progress = chronological record across all four entity types | ❌ | No unified Progress concept/endpoint exists |
| BR-PROG-2 | Readiness captured at each analysis event | ❌ | No readiness signal exists |
| BR-PROG-3 | Progress history visible to user by default | 🟡 | The underlying per-entity data is visible in isolation (Analysis history, CV Feedback rounds); Roadmap history isn't visible at all; nothing is aggregated |
| BR-PROG-4 | Progress history never silently altered/removed | ✅ | No auto-pruning found anywhere; only explicit user-initiated deletion |
| BR-AI-1 | AI outputs advisory, never a final verdict | ✅ | |
| BR-AI-2 | User retains final control; nothing self-executes | ✅ | `RoadmapItemContent` DTO has no `status` field — status is structurally, not just conventionally, user-only. Directly tested |
| BR-AI-3 | Every recommendation explainable on request | ✅ | All 3 explain endpoints, live-verified |
| BR-AI-4 | Confidence never presented higher than actual basis | 🟡 | **Confirmed bug**: `RoadmapAgent._finalize` copies the input Analysis's confidence verbatim, with no check on whether its own LLM call actually returned any items — an empty-roadmap result can still carry `HIGH` confidence. See §14 Bugs |
| BR-AI-5 | Say so rather than produce an unflagged low-confidence result | 🟡 | The *hard*-failure path (`GenerationFailed`, no write) is correct and tested. The *soft*-failure path — an LLM call that succeeds but returns near-empty structured output — is not handled as a flagged failure in `SkillGapAnalysisAgent` (empty gaps → `MEDIUM`, not `LOW`, with a `confidence_reason` that never mentions the empty result) or `RoadmapAgent` (see BR-AI-4) |
| BR-CV-1 | Submit at any time; volume limits are a tier matter | ✅ | No submission blocking found |
| BR-CV-2 | Each submission+feedback = one retained round | ✅ | |
| BR-CV-3 | Retained rounds let user judge if prior feedback was addressed | ✅ | |
| BR-CV-4 | New submission never overwrites a previous one | ✅ | Confirmed — every POST creates a new row |
| BR-NOTIF-1(a) | Triggers on completion | ✅ | |
| BR-NOTIF-1(b) | Triggers on regen without direct request | ❌ | Moot — no such regen exists |
| BR-NOTIF-1(c) | Triggers on staleness | ❌ | Not implemented |
| BR-NOTIF-2 | Definition of "stale" | ❌ | No staleness threshold/definition exists in code |
| BR-NOTIF-3 | Adjust frequency/category; renewal notifications exempt from full muting | 🟡 | Category ✅; frequency ❌; no renewal/subscription notification category exists at all, so the "exempt from muting" carve-out is currently moot |
| BR-NOTIF-4 | Preference changes apply prospectively only | ✅ | True by construction — `notify()` checks the mute state only at write time |
| BR-SUB-1 | Free + paid tier, split defined in §39 | ✅ | Tier enum exists; feature/usage differentiation is a separate (§39) concern, not required here |
| BR-SUB-2 | Cancel anytime without support; effect end-of-period | 🟡 | Cancel-without-support ✅; but cancellation sets status to `CANCELED` **immediately** — `current_period_end` exists as a column but is never populated or used anywhere, so "takes effect at the end of the billing period" is not actually implemented |
| BR-SUB-3 | Renewal recap from real history, not marketing | ✅ | |
| BR-SUB-4 | Cancellation retains data, distinct from deletion | ✅ | Confirmed — cancel never touches Career Knowledge Graph data |
| BR-SUB-5 | Cancellation doesn't delete account; reverts to free-tier terms | 🟡 | Doesn't delete account ✅; but **no endpoint anywhere gates any feature by subscription tier** — cancellation changes the stored `status` field but has zero actual effect on what the user can access, since nothing was ever tier-gated to begin with |
| BR-DATA-1 | Data owned by user | ✅ | |
| BR-DATA-2 | View stored data any time | ✅ | |
| BR-DATA-3 | Delete specific data independent of account | ✅ | |
| BR-DATA-4 | Deletion doesn't retroactively remove historical AI outputs | ✅ | Directly tested |
| BR-DATA-5 | Full account deletion removes/anonymizes all data | 🟡 | Same status as FR-AUTH-5 |
| BR-DATA-6 | Nothing used to personalize is hidden from the user | ✅ | `GET /settings/data` |
| BR-CONST-1–4 | Scope/process constraints | ✅ | Met by construction; no violation found |

**BR tally: 43 rules — 25 ✅ (58.1%), 13 🟡 (30.2%), 5 ❌ (11.6%). Weighted score: 31 / 43 = 72.1%.**

### 2.3 Responsible AI (PRD §29)

| ID | Item | Status | Note |
|---|---|---|---|
| RAI-1 | Human oversight before real-world consequence | ✅ | |
| RAI-2 | No AI bypasses user awareness/consent | ✅ | |
| RAI-3 | No agent acts outside CareerOS without initiation | ✅ | No external tool-calling exists anywhere |
| RAI-4 | Every output explainable on request, grounded in real data | ✅ | Confirmed — all three agents' prompts interpolate real Profile/Goal/Analysis/document data verbatim; `explain_output` is correctly invoked by the backend on request |
| RAI-5 | Dashboard next-action is the sole inline (non-request) case | ✅ | |
| RAI-6 | Confidence never inflated | 🟡 | Same `RoadmapAgent` confidence bug as BR-AI-4 |
| RAI-7 | Say so when a reliable output can't be produced | 🟡 | Same soft-failure gap as BR-AI-5 |
| RAI-8 | Failure never leaves prior state degraded | 🟡 | `refresh_skill_gap_analysis` performs **two separate commits** (Analysis, then — inside a second call — Roadmap) rather than one atomic transaction; if the Roadmap generation step fails after the Analysis commit, a new Analysis persists with no corresponding Roadmap. Not a corruption, but a real partial-cascade risk the code doesn't fully close |
| RAI-9 | Failure never mistaken for a finding about the user | ✅ | Error messages are phrased as system failures, not judgments |
| RAI-10 | User can override any AI recommendation at any time | ✅ | |
| RAI-11 | Every AI-initiated change visible immediately or via notification+history | ✅ | Every write that actually happens today is visible and notified; nothing silent was found |
| RAI-12 | Data owned by user, visible, independently deletable | ✅ | |
| RAI-13 | No capability uses one user's data to shape another's experience | ✅ | Every query is `user_id`-scoped; no cross-user aggregation found anywhere |
| RAI-14 | Every guardrail applies identically across all agents | 🟡 | **Confirmed false as implemented**: the shared `capabilities/confidence.py` module (`calibrate_profile_completeness` + `min_confidence`) is used only by `SkillGapAnalysisAgent`. `RoadmapAgent` and `CVFeedbackAgent` each implement their own separate, inconsistent inline confidence logic instead of the shared capability the package's own docstring claims is "shared by all three Phase 0 agents" |
| RAI-15 | Invisible seams ≠ concealment | ✅ | |
| RAI-16 | Future AI features must comply | N/A | Process constraint; no future feature to evaluate |

**RAI tally: 16 items — 12 ✅ (75%), 4 🟡 (25%), 0 ❌. Weighted score: 14 / 16 = 87.5%.**

### 2.4 Non-Functional, Data Privacy & Trust/Safety Requirements (§43–§45)

These three sections largely restate the same underlying content as the FR/BR/RAI items above in engineering- and compliance-testable form. Rather than re-deriving 55 more individual ratings that would mechanically mirror what's already been shown, the table below maps each cluster to its governing finding above and states only where a **new** fact (not already surfaced) applies.

| Cluster | Status | Governing finding |
|---|---|---|
| NFR-TRUST-1–5 | 🟡 | Mirrors RAI-4/6/8/11/14 |
| NFR-REL-1 | ✅ | State persists correctly across sessions (confirmed via live Postgres verification) |
| NFR-REL-2, NFR-REL-4 | 🟡 | Mirrors RAI-8 (two-commit partial-cascade risk) |
| NFR-REL-3 | 🟡 | "Exactly one current value" is true for every entity by query pattern (`/current` endpoints), but BR-GOAL-1's single-active-goal invariant has no DB-level enforcement — see §2.2 |
| NFR-CONS-1 | 🟡 | Mirrors RAI-14 |
| NFR-CONS-2 | 🟡 | UX pattern is genuinely consistent on 3 of ~10 pages; inconsistent elsewhere — see §9 Accessibility |
| NFR-CONS-3 | — | Voice/tone consistency is not independently verifiable by static code inspection; not rated |
| NFR-CONS-4 | 🟡 | shadcn/ui primitives are reused consistently, **but no shared `Dialog`/`Toast` component exists anywhere** — the one custom confirmation pattern (Settings' type-to-confirm delete) is hand-built per-page rather than as a reusable primitive, and two pages fall back to bare `window.confirm()` |
| NFR-CONS-5 | ✅ | Every module reads/writes the same graph; confirmed no per-module shadow store anywhere |
| NFR-ACC-1–5 | 🟡 | See §9 Accessibility Coverage |
| NFR-CTRL-1–6 | ✅ | Mirrors RAI-1/2/10/12 + BR-DATA-2/3, all ✅ |
| NFR-SCALE-1–5 | ✅ | Architectural extensibility properties — confirmed intact; see §19 Architecture Compliance |
| DPR-1–18 | 🟡 | Mirrors BR-DATA + RAI-4/6/11 findings; no new gap beyond what's already listed |
| TS-1–20 | 🟡 | Same underlying content as RAI+BR; no new gap beyond what's already listed |

---

## 3. Functional Coverage — **78%**

See §2.1's full FR table. Every Phase 0 feature area has at least a working baseline; the concentrated gaps are Change Awareness (FR-AICC-6/12), automatic material-change regeneration (FR-AICC-10), the Progress/readiness concept (FR-AICC-19/20), and roadmap-staleness notification (FR-NOTIF-2). No feature area is at 0% — even the weakest (Notifications, Value Recap) has a real, working partial implementation, not a stub.

## 4. Backend Coverage — **85%**

Complete REST surface for every implemented feature: 21 endpoints across 5 routers, all with real business logic (onboarding gate, goal archival, IDOR-safe ownership filtering, cascade deletion ordering respecting the FK graph). Two commits instead of one atomic transaction in the refresh-analysis cascade (§2.3 RAI-8) is the one structural weak point. The gaps that exist (no material-change endpoint, no roadmap-history endpoint, no progress-aggregation endpoint) are *missing* endpoints, not defects in what's built. `dashboard.py` and `notifications.py`'s list/read endpoint return raw `dict`s rather than a declared `response_model`, which is a minor API-contract-hygiene gap (no OpenAPI schema for those two responses).

## 5. Frontend Coverage — **75%**

11 of 13 required screens exist as a route or as a clearly-identified section within a combined route (all four Settings sub-screens live inside one `/settings` page, which is a reasonable consolidation, not a gap). Two are genuinely missing: **Account Recovery** (no route at all) and **Progress** (no route, no aggregation — see §3). Within the screens that exist, three (CV Feedback, Profile, Settings) meet a strong loading/empty/error/accessibility bar; four (Onboarding, Roadmap, Notifications, Skill-Gap Analysis) have real, specific gaps documented in §9 and §17.

## 6. AI Coverage — **65%**

All three Phase 0 agents exist, are LangGraph-based, correctly scoped to single-write-ownership with zero boundary violations found, and are correctly grounded (real Profile/Goal/Analysis/document data is verifiably interpolated into every prompt). What's missing: Change Awareness is not implemented as a capability at all (previous-version content is fetched but never used); confidence calibration is inconsistent across the three agents (only one uses the shared capability module) and contains a confirmed bug in `RoadmapAgent` (§14); the `ai` package has zero tests exercising any agent, graph, or the explainability function itself — only the two pure-helper functions in `capabilities/confidence.py`/`grounding.py` are tested.

## 7. Database Coverage — **85%**

Correct entity/relationship model matching §24.3/§24.4 exactly; correct Career-Knowledge-Graph-vs-account-level data split; correct enums; append-only status-history table implemented exactly as BR-ROAD-6 requires. Gaps: no `ondelete=CASCADE` anywhere (application-level deletion ordering is correct today but fragile against future schema drift — a new child table added later without updating `delete_account` would silently orphan rows); no DB-level partial-unique-index for BR-GOAL-1; no pagination support on any list-returning table access; `Subscription.current_period_end` column exists but is never populated or read.

## 8. API Coverage — **85%**

Comprehensive, consistent REST surface. Every ID-scoped endpoint (7 of them) correctly filters by `user_id` — a genuinely strong, zero-exceptions-found result. Missing surface: no `/roadmap/history`, no `/progress` aggregation, no per-entity deletion for Skill-Gap Analysis or Roadmap versions (only full-account deletion reaches them). Two endpoints (`GET /dashboard`, `GET /notifications`) lack a typed `response_model`.

## 9. Security Coverage — **70%**

**Strong:** IDOR protection is comprehensive and consistent — every one of the 7 ID-scoped endpoints (`reactivate_goal`, roadmap-item-status, cv-feedback-round-delete, all 3 explain endpoints, notification-mark-read) filters its query by the authenticated user's own `id`, confirmed with zero exceptions across the full router inventory.

**Confirmed gaps:**
- `app/core/auth.py` decodes the Clerk JWT with `options={"verify_aud": False}` — audience claim verification is explicitly disabled.
- `app/main.py`'s CORS middleware allows all methods and all headers (`allow_methods=["*"]`, `allow_headers=["*"]`) from a single hardcoded origin; no rate-limiting middleware exists anywhere in the app.
- No request-size/input-length limits exist on any schema field — `CVFeedbackSubmitRequest.document_text` in particular has no upper bound and is passed straight through to a paid LLM API call, a real cost-abuse vector with no guard.
- `CLERK_SECRET_KEY` has no value in `.env` — the Clerk Admin API integration (used for account deletion) cannot be exercised live in this environment.
- JIT-provisioned users get a synthetic placeholder email (`{clerk_id}@placeholder.careeros.app`) rather than their real verified email from Clerk claims — this is a data-correctness gap with a direct user-facing consequence: `GET /settings/account` (which the Settings — Account screen exists specifically to show) can display a fake email address instead of the user's real one.

## 10. Responsible AI Coverage — **72%**

See §2.3's full table. Structurally very strong (advisory-only, unconditional override, IDOR-safe on-request explainability, zero cross-user data leakage, zero write-ownership violations). The confirmed weak point is narrow but real: confidence calibration is the one guardrail that is inconsistently applied across the three agents, and the inconsistency produces an actual bug (RoadmapAgent), not just a stylistic difference.

## 11. Accessibility Coverage — **40%**

Detailed page-by-page findings in §17. Three of roughly ten interactive surfaces (CV Feedback, Profile, Settings) meet a genuinely good standard: label/htmlFor pairing, `aria-live` status regions, focus management after mutating actions, `aria-invalid`/`aria-describedby` wiring. The rest fall short in specific, confirmed ways: Onboarding and Profile both have a keyboard-inoperable custom control (a `<div onClick>` skill-removal chip with no `role`, `tabIndex`, or `onKeyDown`); Roadmap has zero `aria-live` region and no post-action success feedback; Notifications silently swallows a failed mark-as-read with no user-visible error at all; Settings has a declared-but-never-invoked focus-management ref (`deleteHeadingRef` — attached to the heading, `.focus()` never called anywhere in the file). No automated accessibility testing (axe-core or equivalent) exists anywhere, and no color-contrast audit has been performed. Per PRD §37.6, "the product's overall accessibility is gated by its weakest surface, not averaged" — by that standard this is a real, not a marginal, gap.

## 12. Testing Coverage — **55%**

52 backend+ai tests, all real assertions against real logic (SQLite-backed, only the LLM and Clerk calls are faked) — this is a genuine strength for what it covers. What it doesn't cover, concretely: only 1 of 7 ID-scoped endpoints has a cross-user (IDOR) test; zero tests exercise oversized input, malformed JSON, or wrong-typed fields; zero concurrency/race tests (relevant given BR-GOAL-1's missing DB constraint); zero migration-apply/rollback tests (the test suite bypasses Alembic entirely, building schema via `create_all`); zero tests in the `ai` package exercise any agent, graph, or LLM-calling code — only two pure helper functions are tested, which is exactly the part of the codebase where this audit found two real confidence-calibration bugs; the frontend has exactly one Playwright spec, covering only the unauthenticated landing page — zero automated coverage of any authenticated page, and zero automated accessibility testing.

## 13. Documentation Coverage — **90%**

A genuine strength. Every router, model, and non-trivial function carries a docstring tracing to a specific PRD/SAS section. `PHASE0-AUDIT.md`, `CHANGELOG.md`, and per-package `README.md`s are current and detailed. Known gaps are documented honestly in-code (e.g., the material-change and staleness-notification gaps both carry their own acknowledging comments) rather than silently present. The only real weakness: this audit found several of those self-documented "known gaps" understated the scope of what they were skipping (e.g., existing documentation frames the material-change gap as "not yet wired" without flagging that this also breaks FR-NOTIF-4 and half of BR-ROAD-2 downstream).

## 14. Production Readiness — **60%**

Would **not** be safe to declare production-ready today. Blocking items: `CLERK_SECRET_KEY` missing (account deletion cannot actually delete a Clerk identity); no rate limiting or input-size limits (unbounded LLM-cost exposure); JWT audience verification disabled; the RoadmapAgent confidence bug (a user could see a confidently-presented empty roadmap); accessibility inconsistency across roughly 60% of interactive surfaces; zero automated test coverage of any authenticated frontend flow. None of these is a large amount of *work* individually — see the roadmap in §21 — but each is a real defect a production launch would need closed first.

## 15. Technical Debt

- Duplicate logic: `_active_goal()` is defined identically in two separate router files (`profiles.py`, `ai_career_center.py`) rather than shared.
- Duplicate logic: the "deactivate all other active goals" rule (BR-GOAL-1/2) is implemented twice, differently — once as a DB query (`create_goal`) and once as in-memory iteration (`reactivate_goal`) — two code paths for one rule, a drift risk.
- Duplicate logic: the "JIT-create a default row if missing" pattern is repeated near-identically 3–4 times (`profiles.get_profile`, `settings.get_subscription`, `settings.get_notification_preferences`) with no shared helper.
- No FK `ondelete=CASCADE` anywhere — full account deletion depends entirely on a hand-maintained ordered list of `db.delete()` calls; correct today, fragile against schema growth.
- No DB-level enforcement of BR-GOAL-1 (single active goal) — application-layer only.
- No pagination anywhere — every list endpoint returns its full unbounded result set; fine at today's scale, a real scaling debt later.
- `Subscription.current_period_end` — a column that exists, is never written, and is never read; dead schema.
- No shared `Dialog`/`Toast` UI primitive on the frontend — every confirmation/success-feedback pattern is hand-built per page.

## 16. Bugs

1. **`RoadmapAgent` confidence is not calibrated against its own output** (`ai/careeros_ai/agents/roadmap.py::_finalize`) — confidence is copied verbatim from the input Skill-Gap Analysis regardless of whether the LLM call returned any roadmap items at all. An empty-roadmap result can carry `HIGH` confidence. Directly violates BR-AI-4/RAI-6.
2. **`SkillGapAnalysisAgent`'s empty-gaps case produces a misleading `confidence_reason`** — an LLM response with zero gaps still yields `MEDIUM` (not `LOW`) confidence, paired with a reason string that only describes profile completeness and never mentions that the model returned nothing.
3. **Settings page: dead focus-management code** — `deleteHeadingRef` is declared and attached to the "Delete account" heading (`tabIndex={-1}`) specifically to receive focus, but `.focus()` is never called on it anywhere in the file. The wiring exists; the behavior it exists for doesn't fire.
4. **Partial-cascade risk in analysis refresh** — `refresh_skill_gap_analysis` performs two separate `db.commit()` calls (Analysis, then Roadmap) instead of one atomic transaction; a Roadmap-generation failure after the first commit leaves a new Analysis persisted with no corresponding Roadmap.
5. **Placeholder email shown as real account data** — JIT-provisioned users get `{clerk_id}@placeholder.careeros.app` as their `User.email`; `GET /settings/account` surfaces this directly to the Settings — Account screen, which exists specifically to show real account identity.
6. **Notifications page silently swallows a failed "mark as read"** — the `catch` block reconciles state by reloading but never calls `setError`; a failed action produces zero user-visible feedback, contrary to §31.9 ("every error state tells the user what happened").
7. **`ExplainButton` discards `grounded_on` data the backend actually returns** — its local `ExplanationResponse` type only declares `{ explanation: string }`, omitting the `grounded_on: string[]` field present in the shared `ExplanationRead` type and genuinely returned by every explain endpoint. Transparency-relevant data (RAI-4/DPR-14-adjacent) is fetched and then thrown away by the frontend.
8. **`DashboardResponse` type is defined locally** in `app/dashboard/page.tsx` instead of in `lib/types.ts`, contradicting that file's own stated purpose as the single place backend/frontend type drift would be caught.

## 17. Missing Business Rules (implementation-level, beyond §2.2's per-rule table)

- BR-GOAL-3 / BR-GAP-3/4 / BR-ROAD-2 (automatic material-change regeneration) — the single largest missing rule cluster, root-causing four other partial/missing items downstream (FR-AICC-10/12, FR-NOTIF-4, BR-NOTIF-1(b)).
- BR-SUB-2's "end of billing period" timing — cancellation takes effect immediately, not at period end, because `current_period_end` is dead schema.
- BR-SUB-5's "reverts to free-tier terms" — no tier-based feature gating exists anywhere to revert *to*.
- BR-NOTIF-2's staleness definition — no threshold or detection logic exists.

## 18. Missing Edge Cases

- No handling for two concurrent requests both trying to create/reactivate a goal (BR-GOAL-1 race).
- No handling for an oversized `document_text` submission (no limit exists to trigger a graceful rejection at all — it just flows straight to the LLM).
- No handling for a Roadmap-generation failure that leaves an orphaned, roadmap-less Analysis version visible to the user with no obvious next step (see Bug 4).
- No test or visible handling for canceling an already-canceled subscription, or for any subscription action before a Profile/Goal exists.
- Cancel-subscription has **zero confirmation step** — not even `window.confirm()` — despite being framed alongside two other actions (clear-profile-data, delete-account) that both do have one; a single accidental click cancels a subscription with no chance to back out.

## 19. Missing Loading / Error / Empty States

Full detail in §11/§17. Summary: Onboarding has no loading state anywhere and no `aria-live` on its error banner (present but not announced to screen readers); Roadmap has no post-action success feedback of any kind; Notifications' mark-as-read failure is entirely invisible to the user (Bug 6); no page anywhere implements Next.js's `loading.tsx`/`error.tsx` route conventions — every loading/error state is hand-rolled per page, which is why the coverage is inconsistent rather than uniformly present or absent.

## 20. Code Duplication

Covered exhaustively in §15 (Technical Debt) — four distinct instances of the same business logic implemented more than once instead of shared, all in the backend.

## 19b. Architecture Compliance (SAS Parts I–IV) — **93%**

This is where the implementation is strongest, and it is worth stating plainly: the hardest, most safety-critical architectural guarantees in the SAS were checked line-by-line and hold with **zero confirmed violations**:

- **Exclusive write-ownership (§11.6, §25.8):** confirmed for all three agents — `SkillGapAnalysisAgent` never touches Roadmap or CV Feedback state; `RoadmapAgent`'s input/output DTOs contain no Profile, Goal, or status field; `CVFeedbackAgent`'s input DTO contains no Skill-Gap Analysis or Roadmap reference at all, matching its documented independence (§25.6) exactly.
- **Module boundary (§14.3, §14.9):** the AI Career Center module never writes Profile or Goal; the User Profiles module (`profiles.py`) is the sole writer of both, confirmed across every router.
- **Roadmap Item status vs. content split (§25.5, §25.8, §21.3):** `RoadmapItemContent` (agent-owned) structurally has no `status` field; status is a separate, user-only-writable column — enforced by DTO shape, not just convention, and directly tested (`test_roadmap_item_status_override_is_never_written_by_the_agent`).
- **Intelligence ↔ Knowledge contract (§11):** the `ai` package contains zero persistence code of any kind — every write happens in the backend, reading only DTOs the agents return. No agent reaches into the database.
- **Mediated-only agent communication (§4.10):** confirmed — no agent imports or calls another; every handoff is backend-orchestrated through the Knowledge Layer.

The one point deducted: confidence calibration (§26.3, a shared capability by design) is not actually applied uniformly across agents (§2.3 RAI-14) — an implementation inconsistency, not a boundary violation, but a real departure from "one coherent intelligence" (§1.6 PA-2) as literally built.

## 20. Final Completion Percentage — **73%**

Computed as the unweighted mean of the eleven directly-comparable coverage percentages above (Functional 78, Backend 85, Frontend 75, AI 65, Database 85, API 85, Security 70, Responsible AI 72, Accessibility 40, Testing 55, Documentation 90 → mean 72.7%, rounded to 73%). Architecture Compliance (93%) and Production Readiness (60%) are reported separately in §19b/§14 because they measure different things — architectural correctness of what exists, and launch-safety of the whole — rather than feature completeness, and are not folded into this average to avoid double-counting or diluting either signal.

**This number should not be read as "73% of the way to done" in a linear sense.** The architecture is far more complete than 73% (93%) — nothing here requires a redesign. The remaining 27% is concentrated in a small number of well-understood, well-bounded gaps (§21), not spread as thin uncertainty across the whole system.

---

## 21. Prioritized Implementation Roadmap

### Critical — blocks an honest Phase 0 "complete" declaration

1. **Fix the `RoadmapAgent` confidence bug** (Bug 1, §16). *Files:* `ai/careeros_ai/agents/roadmap.py`. *Effort:* Small (2–4 hours) — check `len(state["llm_items"])` in `_finalize` and downgrade confidence when empty, matching `CVFeedbackAgent`'s existing pattern.
2. **Fix the misleading `confidence_reason` on empty-gaps results** (Bug 2, §16). *Files:* `ai/careeros_ai/agents/skill_gap_analysis.py`. *Effort:* Small (2–4 hours).
3. **Unify confidence calibration across all three agents** through the shared `capabilities/confidence.py` module (RAI-14, §2.3). *Files:* `ai/careeros_ai/agents/roadmap.py`, `ai/careeros_ai/agents/cv_feedback.py`. *Effort:* Small–Medium (1 day) — also requires new agent-level tests, since none exist today.
4. **Write agent-level tests for all three agents** (currently zero coverage of any agent/graph/LLM-calling code — exactly where the two bugs above were found). *Files:* new `ai/tests/test_agents.py` (or per-agent files), using a fake `BaseChatModel`. *Effort:* Medium (2–3 days).
5. **Supply a real `CLERK_SECRET_KEY`** and live-verify account deletion end-to-end against a real, disposable Clerk account (FR-AUTH-5/BR-DATA-5, §2.1/§2.2). *Files:* `.env` (secret, not code). *Effort:* Small (config only, plus one supervised live test run) — **blocks nothing else, but is itself a hard Phase 0 requirement (FR-AUTH-5) that cannot be declared done while untested.**
6. **Add rate limiting and an input-size cap on `document_text` and other free-text fields** — currently an unbounded, unmetered path straight to a paid LLM API (§9 Security). *Files:* `backend/app/main.py` (rate-limit middleware), `backend/app/schemas/*.py` (`Field(max_length=...)`). *Effort:* Small–Medium (1 day).

### High — required for a genuinely complete, trustworthy Phase 0

7. **Implement material-change detection and automatic regeneration** (BR-GAP-3/4, BR-ROAD-2, FR-AICC-10, FR-NOTIF-4 — the single largest functional gap found). *Files:* new logic in `backend/app/api/routers/profiles.py` (goal/profile-edit hooks) and `backend/app/api/routers/ai_career_center.py` (trigger refresh); needs to track which Profile fields the most recent Analysis flagged, per BR-GAP-3's precise definition. *Effort:* Large (3–5 days) — this is a real feature, not a small fix, and touches the Profile module, the AI Career Center module, and Notifications.
8. **Build the Progress screen and its backing aggregation** (FR-AICC-19/20, BR-PROG-1–3, §22 screen 11) — chronological view across Goal history, Analysis versions, Roadmap history, CV Feedback rounds. *Files:* new `backend/app/api/routers/progress.py` (or extend `settings.py`'s pattern), new `frontend/app/progress/page.tsx`. *Effort:* Large (3–4 days) — requires the new `GET /roadmap/history` endpoint (item below) as a prerequisite.
9. **Add a `GET /roadmap/history` endpoint** exposing archived Roadmap versions (BR-ROAD-3/7 currently retained in the DB but unreachable). *Files:* `backend/app/api/routers/ai_career_center.py`, `backend/app/schemas/ai_career_center.py`. *Effort:* Small (half a day) — mirrors the existing `skill-gap-analysis/history` pattern exactly.
10. **Retrofit the CV-Feedback/Profile/Settings accessibility pattern onto Onboarding, Roadmap, and Notifications** (§11, §17). *Files:* `frontend/app/onboarding/page.tsx`, `frontend/app/roadmap/page.tsx`, `frontend/app/notifications/page.tsx`. *Effort:* Medium (2 days) — label pairing, `aria-live` regions, focus management, fixing the two keyboard-inoperable skill-chip controls (Onboarding + Profile).
11. **Fix the placeholder-email bug** (Bug 5) — read the real email from verified Clerk token claims during JIT provisioning instead of synthesizing one. *Files:* `backend/app/core/auth.py`, `backend/app/api/deps.py`. *Effort:* Small (few hours) — requires the JWT claims to actually carry email (may need a Clerk dashboard configuration check).
12. **Add IDOR tests for the remaining 6 of 7 ID-scoped endpoints** (only 1 has one today). *Files:* `backend/tests/test_ai_career_center.py`, `test_profiles.py`, `test_notifications.py`. *Effort:* Small (1 day) — mechanical, follows the one existing test's pattern exactly.
13. **Fix the two-commit partial-cascade risk** in `refresh_skill_gap_analysis` (Bug 4). *Files:* `backend/app/api/routers/ai_career_center.py`. *Effort:* Small (a few hours) — wrap both writes in one transaction, or explicitly roll back the Analysis commit on Roadmap-generation failure.
14. **Add a Playwright suite covering every authenticated page** (currently only the unauthenticated landing page has any frontend test). *Files:* new specs under `frontend/e2e/`, needs a Clerk test-mode auth setup first. *Effort:* Large (3–5 days, mostly the auth-setup prerequisite).
15. **Enable JWT audience verification** (`verify_aud=False` today). *Files:* `backend/app/core/auth.py`. *Effort:* Small (a few hours, plus confirming the correct audience value with Clerk's config).

### Medium — real gaps, not launch-blocking

16. Add a "Account Recovery" route/screen, or explicitly verify and document that Clerk's hosted sign-in flow's built-in recovery satisfies FR-AUTH-3 without a CareerOS-owned page. *Effort:* Small (verification) to Medium (if a dedicated page is required).
17. Surface FR-PROF-4's "what's missing / would improve quality" indicator on the standalone `/profile` edit page, not just during onboarding. *Files:* `frontend/app/profile/page.tsx`, reusing the existing `onboarding.py::evaluate()` output. *Effort:* Small (half a day).
18. Implement roadmap-staleness detection and notification (FR-NOTIF-2, BR-NOTIF-1(c)/2) — needs a scheduled/background check, genuinely new infrastructure. *Effort:* Medium–Large (2–3 days, plus deciding on a scheduler mechanism).
19. Add a delete path for individual Skill-Gap Analysis / Roadmap versions (FR-SET-3's "specific stored data," currently only Profile fields and CV Feedback rounds are independently deletable). *Effort:* Medium (1 day) — needs careful thought about what happens to a Roadmap that references a deleted Analysis.
20. Add DB-level enforcement of BR-GOAL-1 (partial unique index on `goals` for `is_active = true`). *Effort:* Small (migration + a concurrency test).
21. Add a confirmation step to Cancel Subscription, matching the pattern already used for Clear Profile Data. *Files:* `frontend/app/settings/page.tsx`. *Effort:* Trivial (under an hour).
22. Wire the never-called `deleteHeadingRef.focus()` (Bug 3). *Files:* `frontend/app/settings/page.tsx`. *Effort:* Trivial (minutes).
23. Surface `grounded_on` in `ExplainButton` (Bug 7). *Files:* `frontend/components/explain-button.tsx`. *Effort:* Trivial (under an hour).
24. Move `DashboardResponse` into `lib/types.ts` (Bug 8). *Effort:* Trivial.
25. Add a shared `Dialog`/`Toast` component and de-duplicate the backend's repeated JIT-create and goal-deactivation logic (§15 Technical Debt). *Effort:* Medium (1–2 days combined).

### Low — polish, hardening, not required for Phase 0 sign-off

26. Add `ondelete=CASCADE` to every FK as defense-in-depth alongside the existing application-level deletion ordering.
27. Add pagination to every list endpoint ahead of real scale.
28. Add typed `response_model`s to `GET /dashboard` and `GET /notifications`.
29. Add migration-apply/rollback tests.
30. Add a color-contrast audit and wire an automated accessibility check (axe-core) into CI.
31. Remove or populate `Subscription.current_period_end` (currently dead schema either way).
32. Reconcile `CVFeedbackItem.category`'s type between the `ai` package (unconstrained `str`) and the backend (proper enum) so a malformed LLM category value fails predictably rather than raising an unhandled validation error.

---

## What Must Be True Before Phase 0 Can Be Honestly Declared Complete

Every item in **Critical** (1–6) and items **7, 8, 9, 11, 13, 15** from **High** must be closed. The remaining High items (10, 12, 14) are strongly recommended before calling Phase 0 "production quality" per the standing quality bar ("every state must be handled," "no fake settings," verification must be real) but are testing/hardening work rather than missing product surface — a defensible team could ship with them tracked as immediate post-launch follow-ups if genuinely time-constrained, but not silently dropped. Medium and Low items are real, tracked gaps that do not block a Phase 0 completion declaration.
