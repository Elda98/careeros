# Phase 0 (AI Career Center) — Completion Status

**This file is the official project status**, per standing instruction: progress is measured against the PRD feature inventory (the matrix in §1), not a single percentage. Updated after every closed gap. **Not a design document** — no architectural decision here overrides the SAS. Lives at the repo root because it spans `backend/`, `ai/`, and `frontend/`. Implementation history for each closed gap is in [`CHANGELOG.md`](CHANGELOG.md).

**Method:** every row was checked against actual code (`grep`/`Read`) and, where marked, live-verified against real Postgres and real Groq — not assumed.

**Legend:** ✅ Done and tested · 🟡 Partial · ❌ Missing entirely

---

## 1. Phase 0 Completion Matrix

| Area | Completion | Remaining Work | Blocking Dependencies | PRD/SAS References |
|---|---:|---|---|---|
| **Authentication** | 95% | Clerk's hosted recovery flow has never been explicitly click-verified; the real Clerk Admin API `DELETE /v1/users/{id}` call has never been exercised end-to-end against a live Clerk account (see Settings row) | `CLERK_SECRET_KEY` has no value in this environment's `.env` — set it to exercise the already-integrated Clerk Admin API live | FR-AUTH-1–5; SAS §14.9 |
| **Onboarding** | 100% | None identified against FR-ONBOARD-1 | — | FR-ONBOARD-1; SAS Part IV §18.5 |
| **Profile** | 100% | None identified against FR-PROF-1/3/4 — standalone `/profile` screen now covers edit, loading/empty/error states | — | FR-PROF-1/3/4; PRD §22 screen 6 |
| **Goals** | 100% | None identified against FR-PROF-2/BR-GOAL-1–5 — standalone goal creation and reactivation (BR-GOAL-5) both shipped, frontend and backend | — | FR-PROF-2; BR-GOAL-1–5 |
| **Skill Gap Analysis** | 75% | Manual-refresh button on the screen itself; "what changed and why" (FR-AICC-6); history view (backend `/history` endpoint exists, unused by frontend) | None technical | FR-AICC-1–6; RAI-4; SAS Part IV §18.5/§19.3 |
| **Roadmap** | 80% | Version history UI (BR-ROAD-7); "what changed and why" (FR-AICC-12) | None technical | FR-AICC-7–12; SAS Part IV §19.2 |
| **CV Feedback** | 95% | Real file upload (Supabase Storage) instead of paste-text — a deliberate, documented interface choice, not a defect | None | FR-AICC-13–18; RAI-4; SAS Part IV §19.4 |
| **Dashboard** | 85% | Loading skeleton (currently a server component with no loading state); explicit retry on fetch failure | None | FR-DASH-1–4; SAS Part IV §18.3/§19.5 |
| **Notifications** | 80% | Staleness-triggered notification (BR-NOTIF-1(c)); deep-linking from a notification to its source screen | Staleness notification needs a background scheduler — infrastructure not yet in the stack | FR-NOTIF-1–4; BR-NOTIF-1–4 |
| **Settings** | 95% | Live end-to-end verification of Clerk-side account deletion (blocked, see Authentication row) — every other Settings capability (account view, subscription view/cancel+reason, renewal recap, notification preferences, data overview, clear-profile-data) is built, wired, and live-verified | `CLERK_SECRET_KEY` value (see Authentication) | FR-SET-1–4; FR-RENEW-1–2; PRD §22 screens 13–16 |
| **Accessibility** | 30% | Systematic pass still owed on Skill-Gap Analysis, Roadmap, Notifications, Dashboard, Onboarding, Landing, Sign-in/Sign-up; color-contrast audit; manual keyboard-only pass; manual screen-reader pass | None technical — needs to be done screen by screen | §37 (all); §31.12 |
| **Testing** | 60% | Authenticated Playwright coverage; IDOR checks beyond the explain endpoints; automated accessibility testing (e.g. axe-core) | Authenticated Playwright needs a Clerk test-mode setup, not yet done | General quality bar — no single PRD section |
| **Documentation** | 90% | Keep pace each session (established practice); tighter cross-linking between `PHASE0-AUDIT.md`, `CHANGELOG.md`, and per-package READMEs | None | `CONTRIBUTING.md` rule 8 |

**Reading this matrix:** a 100% row means every requirement PRD/SAS actually places on that area is done and verified — not that the area can never grow (Onboarding, for instance, could still gain UX polish later; 100% here means it has no *outstanding requirement*, not that it's frozen).

---

## 2. This Session (Settings Vertical)

Closed **Settings** end-to-end — the largest remaining Phase 0 gap. Backend: `NotificationPreference` model + `Subscription.cancellation_reason` (migrated live); a real Clerk Admin API client (`app/core/clerk_admin.py`) for `DELETE /settings/account`, ordered so a Clerk-side failure leaves local data completely untouched; `notify()` now actually honors muted categories (previously a fake setting); goal reactivation (`POST /profile/goals/{id}/reactivate`, BR-GOAL-5, a real previously-missing capability); Renewal Recap computed on demand since no payment processor exists in this stack (honest, documented workaround). Frontend: new `/profile` (edit + goal history/reactivation) and `/settings` (account with type-to-confirm delete, subscription + cancellation reason, renewal recap, notification-preference toggles, data overview, clear-profile-data) pages, both wired into Dashboard nav. Found and fixed a real, sitewide defect along the way: the `destructive` Tailwind color was referenced on nearly every existing page but never defined, so every error message anywhere in the app was rendering colorless. 14 new backend tests; `scripts/verify_e2e.py` extended with 7 new live-verified steps (Postgres + Groq); account deletion's success path is covered by backend tests with fakes but not exercised live in this environment — `CLERK_SECRET_KEY` has no value set in `.env`. Full detail in `CHANGELOG.md`.

---

## 3. Supporting Detail

The matrix in §1 is the authoritative status. The tables below are the underlying evidence it was derived from — useful when a specific PRD/SAS clause needs tracing, not required reading to understand overall status.

### 3.1 AI Workflows (PRD §27) — 8 named workflows

| Workflow | Status | Notes |
|---|:---:|---|
| First Skill-Gap Analysis (§27.3) | ✅ | Verified live |
| Roadmap Generation (§27.4) | ✅ | Verified live — cascades automatically |
| Analysis Refresh after Material Change (§27.5) | ❌ | No Profile-edit hook detects a material change (BR-GAP-3) or triggers regeneration |
| Roadmap Regeneration (§27.6) | 🟡 | Mechanism exists; the "only if the Analysis differs" trigger condition isn't checked |
| Manual Refresh (§27.7) | ✅ | Tested |
| CV/Profile Feedback (§27.8) | ✅ | **Closed this session** — full vertical, verified live |
| Dashboard Next Action (§27.9) | ✅ | Verified — zero-agent read path |
| Change Explanation (§27.10) | 🟡 | No dedicated comparison endpoint yet, but the Roadmap Agent now receives its real previous version (fixed a leftover TODO), so Change Awareness has real data when this is built |

### 3.2 Responsible AI (PRD §29) — 16 RAI items

11/16 fully done, 2/16 partial, 0/16 missing, 3/16 N/A. Full detail preserved from the prior audit; unchanged this session except: RAI-4 explanation coverage now includes CV Feedback's frontend (was backend-only before).

### 3.3 Business Rules — selected

BR-CV-1–4 ✅ tested; BR-DATA-3/4 for CV Feedback Round ✅; **BR-GOAL-5 (goal reactivation) ✅ closed this session**, tested and live-verified. **BR-DATA-5 (full account deletion) 🟡** — code complete and real (Clerk-first-then-local ordering, FK-safe local cascade), tested against both success and Clerk-failure paths with fakes, but not yet exercised against the real Clerk API in this environment (`CLERK_SECRET_KEY` unset). BR-GAP-3 (material change detection) remains ❌ — see matrix.

### 3.4 Accessibility — what "30%" in the matrix actually means

**CV Feedback, Profile, Settings** now share the same pattern: `<label htmlFor>`/`id` pairing on every input, `aria-live="polite"` status regions announcing async state changes, focus moved to a relevant heading after a mutating action, `aria-invalid`/`aria-describedby` wiring inputs to their error messages, `aria-label` on ambiguous icon/action buttons (delete, reactivate), and — new this session — a type-to-confirm destructive-action pattern on `/settings`'s account deletion (the user must type their own email before the delete button enables) rather than a bare `window.confirm()`, and `aria-pressed` on the notification-category mute toggles. **Skill-Gap Analysis, Roadmap, Notifications** (prior session) have label pairing but no live regions or focus management. **Landing, Onboarding, Dashboard, Sign-in/Sign-up** have not been reviewed at all. No color-contrast audit or manual keyboard/screen-reader pass has been done anywhere. This session also fixed a sitewide defect that undermined every prior accessibility claim about error-state visibility: the `destructive` color was referenced everywhere but never defined, so error text had no color contrast treatment at all until now.

### 3.5 Tests

**52 total** (47 backend + 5 ai), all passing, all real assertions (no smoke-only tests) — up from 38 last session. `scripts/verify_e2e.py` now covers 18 steps end-to-end including the full Settings vertical (account, subscription lifecycle, renewal recap, notification-preference muting proven to actually suppress a notification, data overview, goal reactivation), run against live Postgres + live Groq, independently re-confirmed via direct `psql` query after every run. Account deletion's live Clerk-side call is the one exception — deliberately not exercised against a real account, see §2.

---

## 4. Priority Order for Remaining Work

1. **Accessibility systematic pass** — now the single largest completion gap (30%, full-surface requirement per §37.6: gated by the weakest screen) — Skill-Gap Analysis, Roadmap, Notifications, Dashboard, Onboarding, Landing, Sign-in/Sign-up still need the CV-Feedback/Profile/Settings pattern retrofitted.
2. **Supply a real `CLERK_SECRET_KEY` value and live-verify account deletion** — the only remaining gap in both Authentication and Settings; the integration itself is complete and tested, only the credential is missing from this environment.
3. **Progress/history screen** — no backend endpoint yet either.
4. **Material-change auto-detection (§27.5)** — the one AI workflow with zero code started.
5. **Authenticated Playwright coverage** — needs Clerk test-mode setup first.
6. **Roadmap-staleness scheduled notification** — needs new scheduler infrastructure.
7. Loading-state polish for Dashboard/Onboarding; animations.
