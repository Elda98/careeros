# Section 19 — Core AI Loop Scenarios

*Part IV — Cross-Layer System Scenarios · Solution Architecture Specification (SAS) · CareerOS*

## 19.1 Purpose
This section covers the four scenarios that make up the ongoing, repeatable core of the AI Career Center — the mechanism §14's Core Loop describes in the abstract, now traced layer by layer.

## 19.2 Scenario: Roadmap Generation
**Trigger:** A Skill-Gap Analysis version has just been produced with no existing Roadmap yet (§27.4) — the direct cascade from §18.5, or the first cascade following any later re-analysis where no Roadmap exists (not applicable after Phase 0's first pass, included here for completeness of the workflow's own trigger condition).
**Participating Module(s):** AI Career Center only.
**Participating Layers:**
- *Presentation:* Roadmap screen (§22 screen 8).
- *Interaction:* Roadmap Generation workflow (§27.4) — automatic, cascading immediately, a visible consequence of the Analysis that produced it (§10.6).
- *Intelligence:* Roadmap Agent — reads the current Skill-Gap Analysis only.
- *Knowledge:* Write first Roadmap version and its Roadmap Items.
**Knowledge Operations:** Read current Skill-Gap Analysis (own module); write Roadmap and Roadmap Items (own module) — no read into Profile or Goal directly, per §25.5's reads list.
**Intelligence Operations:** Derive an ordered, actionable roadmap from the Analysis (FR-AICC-7); each item specific enough to act on without further clarification (FR-AICC-8).
**Interaction Responsibilities:** Present the cascade as automatic-but-visible (§27.13); make on-request explanation available per item (FR-AICC-11).
**Presentation Responsibilities:** Render the ordered plan; make each item's status controls available for the user to mark complete, in progress, or skipped (FR-AICC-9).
**Governance Constraints:** BR-ROAD-1 (a Roadmap only ever exists derived from a current Analysis — never independently created); RAI-4 (explainability per item).
**Completion Condition:** A Roadmap with ordered items is written and visible, and Dashboard's next-action read (§18.3) now has a current item to surface.
**Properties Preserved:** *Single Source of Truth* — exactly one current Roadmap version exists; prior versions, once regeneration occurs, are retained as history (BR-ROAD-3) rather than competing with the current one. *One Coherent Intelligence* — the Roadmap Agent's output presents as a continuation of the same Analysis the user just saw, not a second, separately-branded system.
**Boundary Integrity:** The Roadmap Agent reads only the Skill-Gap Analysis Agent's output, never Profile or Goal directly (§25.5) — the handoff is agent-to-agent through the Knowledge Layer (§11), never a direct call, satisfying HR-2's "always the current version" rule (§25.10).

## 19.3 Scenario: Material Profile Change → Regeneration
**Trigger:** The user edits a Profile field the most recent Analysis identified as contributing to a flagged gap, or changes the active Goal — the two cases BR-GAP-3 defines as "material."
**Participating Module(s):** User Profiles → AI Career Center, in sequence, with Notifications reading the outcome.
**Participating Layers:**
- *Presentation:* Profile & Goal screen (§22 screen 6) for the edit itself; Skill-Gap Analysis and Roadmap screens for the regenerated output; Notifications screen (§22 screen 12) for the resulting alert.
- *Interaction:* Analysis Refresh after Material Change (§27.5), cascading to Roadmap Regeneration (§27.6) if the new Analysis differs from the prior one.
- *Intelligence:* Skill-Gap Analysis Agent runs first (reads Profile, Goal, its own previous version); Roadmap Agent runs second, only if the Analysis actually changed.
- *Knowledge:* Write new Skill-Gap Analysis version (prior retained, BR-ROAD-3's analogue for Analysis); conditionally write new Roadmap version (prior retained, BR-ROAD-3).
**Knowledge Operations:** Read edited Profile field or new active Goal; read previous Analysis version (Change Awareness applies here, unlike §18.5); write new Analysis version; conditionally read previous Roadmap version and write a new one.
**Intelligence Operations:** Skill-Gap Analysis Agent re-compares Profile/Goal against itself; determines whether the new Analysis differs materially from the prior one, which is what gates the Roadmap cascade (§27.6's own trigger condition).
**Interaction Responsibilities:** Distinguish this automatic-but-visible regeneration from a user-requested one (§18's Manual Refresh is a separate, user-initiated case, not this scenario); trigger a notification as a side effect, not as agent activity (§27.5).
**Presentation Responsibilities:** Show what changed and why, not a silently replaced Analysis or Roadmap (FR-AICC-6, FR-AICC-12) — this is the scenario where Change Awareness (§26.3) becomes user-visible for the first time in this Part.
**Governance Constraints:** BR-GAP-3 (material-change definition — an edit unrelated to a flagged gap does not qualify and must not trigger this scenario); BR-GOAL-3 (goal change is always material); FR-NOTIF-4 (system-initiated regeneration must notify, distinct from a user-requested one).
**Completion Condition:** A new Analysis (and, conditionally, a new Roadmap) is written and visible, with its relationship to the prior version explainable on request (§27.10's Change Explanation workflow), and a notification has been triggered.
**Properties Preserved:** *Single Source of Truth* — exactly one current Analysis and Roadmap exist even mid-regeneration; the prior version is retained as history, never as a second live copy (BR-ROAD-3). *Human-in-the-Loop* — the regeneration is automatic only because the user's own edit made it a visible, expected consequence (§10.6); nothing regenerates from a cause the user didn't create. *Explainability* — FR-AICC-6/12's "see what changed and why" is a strict superset of FR-AICC-5/11's baseline explainability, exercised here for the first time.
**Boundary Integrity:** BR-GAP-3's precise material-change test is what prevents this scenario from over-triggering — an unrelated Profile edit correctly produces no regeneration at all, which is itself a valid (non-)instance of this scenario, not a failure of it.

## 19.4 Scenario: CV / Profile Feedback Round
**Trigger:** The user submits a CV or profile document for review (FR-AICC-13), at any time, independent of Analysis or Roadmap state.
**Participating Module(s):** AI Career Center only.
**Participating Layers:**
- *Presentation:* CV/Profile Feedback — Submission screen, then Review Result screen (§22 screens 9–10).
- *Interaction:* CV/Profile Feedback workflow (§27.8) — always user-initiated, never automatic.
- *Intelligence:* CV/Profile Feedback Agent only — reads active Goal and the submitted document; explicitly does not read Skill-Gap Analysis or Roadmap (§25.6's independence note).
- *Knowledge:* Write a new CV/Profile Feedback Round; all prior rounds retained (BR-CV-2, BR-CV-4).
**Knowledge Operations:** Read active Goal, read submitted document; write new Feedback Round — no read or write touches Analysis or Roadmap entities.
**Intelligence Operations:** Evaluate the document against the active Goal; distinguish factual/structural issues from judgment-call feedback (FR-AICC-15).
**Interaction Responsibilities:** Allow re-review requests after changes (FR-AICC-17) as a new, separate round, never an edit to a prior one; make explanation available per feedback item (FR-AICC-16).
**Presentation Responsibilities:** Present all retained rounds, not only the latest (FR-AICC-18), so the user can judge whether prior feedback was addressed (BR-CV-3).
**Governance Constraints:** BR-CV-1 (submission always available; volume limits are a subscription-tier matter, §39, not a Business Rule here); BR-CV-4 (no submission ever overwrites a prior one).
**Completion Condition:** A new Feedback Round is written and visible alongside every prior round for the same document lineage.
**Properties Preserved:** *Layer Independence* — the CV/Profile Feedback Agent's total independence from the Skill-Gap Analysis and Roadmap Agents (§25.6) is this scenario's clearest demonstration that one module's internal agents need not depend on each other to satisfy §15.4's independence property. *User Control* — every round is user-initiated; nothing about this scenario ever runs automatically. *Single Source of Truth* — every round is retained, not competing — the "current" state is the full retained set, not a single latest value, which BR-CV-2 defines precisely so this does not read as a violation of §24.7.
**Boundary Integrity:** §25.6 already establishes this agent's independence from the other two; this scenario shows that independence holding under a real trigger — nothing about a CV submission ever touches an entity another agent owns.

## 19.5 Scenario: Dashboard Refresh
**Trigger:** The user returns to Dashboard after time has passed, after a notification, or simply on next visit (§27.9) — the recurring instance of §18.3's mechanics, included here as the Core Loop's own "return to Dashboard" step (§14, loop step linking back to step 2).
**Participating Module(s):** Dashboard, reading across into the AI Career Center.
**Participating Layers:**
- *Presentation:* Dashboard (§22 screen 5).
- *Interaction:* Dashboard Next Action (§27.9) — a read/display workflow.
- *Intelligence:* **None invoked** — identical to §18.3, restated here as the loop's steady-state case rather than the first-login case.
- *Knowledge:* Read current Roadmap next item, current Analysis confidence state; write nothing.
**Knowledge Operations:** Read only — no write occurs in this scenario under any circumstance.
**Intelligence Operations:** None.
**Interaction Responsibilities:** Reflect whatever the most recent regeneration (§19.3) or generation (§19.2) produced, without staleness — always the current version (HR-2, §25.10).
**Presentation Responsibilities:** Single next action with inline reason (FR-DASH-2, FR-DASH-4); no separate navigation required (FR-DASH-3).
**Governance Constraints:** RAI-1 (no self-execution from a Dashboard view); FR-NOTIF-2's staleness definition governs whether a notification — not a Dashboard state — is also triggered, handled as a separate concern in Notifications, not by this scenario.
**Completion Condition:** Dashboard renders the current next action, correctly reflecting whichever of §19.2/§19.3's outcomes is most recent.
**Properties Preserved:** *Single Source of Truth* — Dashboard never caches or independently computes a next action; every render is a fresh read of the Roadmap Agent's current output. *Layer Independence* — repeated here specifically to show it holds under repeated invocation, not only once.
**Boundary Integrity:** Identical to §18.3's boundary reasoning — Dashboard's read of an AI Career Center-owned entity is the explicit, approved cross-module dependency named in SAS §15.2, exercised as many times as the user returns to the screen without ever becoming a write.

---
*Part of the SAS, Part IV. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§10.6, 11, 15.2, 15.4, 17.8–17.9, 25.5–25.6, 25.10, 26.3; PRD §§14, FR-AICC-6–18, FR-DASH-2–4, FR-NOTIF-2/4; §21 BR-GAP-3, BR-GOAL-3, BR-ROAD-1/3, BR-CV-1–4; §27.4–27.10.*
