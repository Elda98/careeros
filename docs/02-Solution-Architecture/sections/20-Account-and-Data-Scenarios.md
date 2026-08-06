# Section 20 — Account & Data Scenarios

*Part IV — Cross-Layer System Scenarios · Solution Architecture Specification (SAS) · CareerOS*

## 20.1 Purpose
This section covers the three scenarios governing a user's account and data outside the AI Career Center's own core loop — all Settings-module scenarios, notable architecturally for what they demonstrate about a scenario that involves little or no Intelligence Layer participation while still being fully governed.

## 20.2 Scenario: Subscription Lifecycle (Upgrade, Renewal, Cancellation)
As established in §17.10, this scenario covers three PRD-supported sub-cases under one architectural shape: Upgrade (covered generally by FR-SET-1's subscription management, with no dedicated rule of its own), Renewal (FR-RENEW-1–2, BR-SUB-3, specifically defined), and Cancellation (FR-SET-4, BR-SUB-1–2/4–5, specifically defined).
**Trigger:** The user opens subscription management (any sub-case); a renewal charge approaches (Renewal); the user requests to cancel (Cancellation).
**Participating Module(s):** Settings only — no AI Career Center participation in any sub-case.
**Participating Layers:**
- *Presentation:* Settings — Subscription & Billing (§22 screen 14).
- *Interaction:* Governs subscription state changes as always user-initiated (FR-SET-4 — cancel "directly, without contacting support") or, for Renewal, an automatic-but-visible prompt ahead of a charge (BR-SUB-3).
- *Intelligence:* **None invoked in any sub-case.** No agent reasons about subscription state; this scenario is Governance- and Interaction-heavy, Intelligence-empty by design.
- *Knowledge:* Subscription/billing state is account-level data, explicitly outside the Career Knowledge Graph's scope (§24.12's scope discipline) — reads and writes here touch account state, not graph entities.
**Knowledge Operations:** Read current subscription tier and billing state; write updated tier/cancellation state; read Roadmap/Analysis/Feedback history only to compose the Renewal progress recap (BR-SUB-3), never to modify it.
**Intelligence Operations:** None.
**Interaction Responsibilities:** For Renewal, assemble the recap from "actual, verifiable history," never marketing content (BR-SUB-3); for Cancellation, offer an optional, non-blocking reason prompt (FR-RENEW-2) without making it a condition of completing cancellation.
**Presentation Responsibilities:** Present cancellation as directly actionable, not requiring support contact; present the Renewal recap inline with the pending charge, not buried elsewhere.
**Governance Constraints:** BR-SUB-2 (cancellation takes effect end of billing period, not immediately, unless §39 states otherwise); BR-SUB-4/5 (cancellation retains data and does not delete the account — distinct from §20.4's deletion scenario); §29's rejection of dark patterns, artificial urgency, and forced upgrades (no sub-case of this scenario may pressure a decision).
**Completion Condition:** Subscription state is updated (upgraded, renewed, or scheduled for cancellation) and reflected in Settings; for Cancellation, the account remains fully intact under free-tier terms.
**Properties Preserved:** *User Control* — every sub-case is either directly user-initiated or, for Renewal, a visible prompt the user can act on, never a silent charge. *Responsible AI* — trivially but importantly satisfied by the total absence of AI involvement in a decision with real financial consequence; §29's guardrails apply to *whether* AI participates at all, and here the correct answer is that it does not.
**Boundary Integrity:** This scenario never reads or writes any Career Knowledge Graph entity except to compose the Renewal recap (a read-only composition, §24.12) — it demonstrates that a fully valid, fully governed scenario can exist entirely outside the AI Career Center module and without invoking any agent.

## 20.3 Scenario: Data Access Request (View Stored Data)
Named per §17.10's scope note — the PRD supports viewing stored data, not a formatted export artifact.
**Trigger:** The user requests to see what CareerOS has stored about them (FR-SET-2).
**Participating Module(s):** Settings, reading across the entire Career Knowledge Graph plus account-level data.
**Participating Layers:**
- *Presentation:* Settings — AI & Memory Controls (§22 screen 15).
- *Interaction:* A direct, user-initiated request — no automatic case exists for this scenario.
- *Intelligence:* **None invoked** — this is a read/display path, structurally identical to Dashboard's (§18.3, §19.5) but scoped to the full graph rather than one summary view.
- *Knowledge:* Read every entity the graph holds for the requesting user — Profile, Goal (current and previous), Skill-Gap Analysis (all versions), Roadmap (all versions), CV/Profile Feedback (all rounds) — plus account-level preference data.
**Knowledge Operations:** Read-only, across the full graph scoped to one user; no write occurs.
**Intelligence Operations:** None.
**Interaction Responsibilities:** Ensure nothing used to personalize the user's experience is withheld from this view (BR-DATA-6, DPR-14) — completeness is the defining requirement of this scenario.
**Presentation Responsibilities:** Present stored data comprehensibly; this scenario does not require presenting it in any particular downloadable format, consistent with §17.10's scope note.
**Governance Constraints:** BR-DATA-2 (view at any time); DPR-3 (view at any time); DPR-8 (grounded only in this user's own data — no cross-user leakage risk in what this view can show).
**Completion Condition:** The user has visibility into every piece of stored data describing them.
**Properties Preserved:** *Single Source of Truth* — because the graph holds exactly one current value per fact (§24.7), this view never needs to reconcile disagreeing copies; it reads the same authoritative state every other scenario in this Part reads. *Responsible AI* — DPR-14's "nothing hidden" is this scenario's entire purpose.
**Boundary Integrity:** A read-only crossing of every module's Knowledge Layer boundary at once, permitted because §11.4's shared-read rule places no limit on how many readers an entity may have — only on how many writers.

## 20.4 Scenario: Data Deletion Request
**Trigger:** The user requests deletion of specific stored data (FR-SET-3), independent of full account deletion (FR-AUTH-5, governed separately by BR-DATA-5 and out of this scenario's scope).
**Participating Module(s):** Settings, writing (deleting) into whichever module's entity the user selects.
**Participating Layers:**
- *Presentation:* Settings — AI & Memory Controls (§22 screen 15), same surface as §20.3.
- *Interaction:* Direct, user-initiated request; requires the user to select specific data, not an all-or-nothing action (that case is FR-AUTH-5, a distinct scenario this Part does not need to separately trace, being account-level rather than cross-layer in the same sense).
- *Intelligence:* **None invoked** — deletion is a Knowledge Layer operation the user directs; no agent reasons about what to delete.
- *Knowledge:* Delete the specified entity or field; explicitly do **not** retroactively remove historical AI outputs already generated using it (BR-DATA-4) unless full history deletion is separately requested.
**Knowledge Operations:** Delete a specific stored field or entity, owned by whichever module holds it; leave historical entries generated from it, prior to deletion, intact (BR-DATA-4, DPR-16).
**Intelligence Operations:** None.
**Interaction Responsibilities:** Make clear, before the deletion completes, what will and will not be affected — specifically that historical outputs are not retroactively invalidated (BR-DATA-4) — so the user's consent is informed (DPR-5).
**Presentation Responsibilities:** Confirm the deletion and its scope explicitly, not with an ambiguous "data deleted" message that could be read as covering history it does not cover.
**Governance Constraints:** BR-DATA-3 (delete independent of account); BR-DATA-4 (no retroactive history removal without separate request); DPR-15 (historical entries are not rewritten — only removed by explicit user-initiated deletion, which this scenario is one instance of); DPR-17 (a failed deletion never leaves prior valid state degraded — partial deletion is not a valid outcome).
**Completion Condition:** The specified data is removed from current state; historical records that depended on it, generated before deletion, remain visible and intact unless separately, explicitly also deleted.
**Properties Preserved:** *Human-in-the-Loop* — deletion is exclusively user-initiated; no automatic or system-triggered deletion exists anywhere in the PRD. *Single Source of Truth* — after deletion, the graph still holds exactly one current value for every remaining fact; the deleted fact simply no longer has one, which is the correct and only valid post-deletion state.
**Boundary Integrity:** This is the one scenario in this Part where a user action results in something being *removed* from a module's owned entity rather than added — still performed exclusively by the owning module (deleting a Profile field is still a User Profiles-module operation, deleting a stored Analysis field a AI Career Center-module operation), preserving §11.6's exclusive-write checkpoint even in the deletion direction.

---
*Part of the SAS, Part IV. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§11.4, 11.6, 17.8–17.10, 24.7, 24.12; PRD §§19 FR-SET-1–4, FR-RENEW-1–2; §21 BR-SUB-1–5, BR-DATA-2–6; §29, §39, §44 DPR-3, DPR-5, DPR-8, DPR-14–17.*
