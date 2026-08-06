# Section 18 — Foundational & Onboarding Scenarios

*Part IV — Cross-Layer System Scenarios · Solution Architecture Specification (SAS) · CareerOS*

## 18.1 Purpose
This section covers the four scenarios that establish a user's presence in the system and produce their first AI-generated artifact, following the template in §17.9.

## 18.2 Scenario: User Registration → First Value
**Trigger:** A new user completes account creation (FR-AUTH-1) and, immediately after, Onboarding (FR-ONBOARD-1).
**Participating Module(s):** Authentication → User Profiles → AI Career Center, crossed in sequence.
**Participating Layers:**
- *Presentation:* Renders Sign Up, then Onboarding (§22 screens 1, 4), then the Skill-Gap Analysis and Roadmap screens (§22 screens 7–8) once produced.
- *Interaction:* Governs Onboarding as a required, non-skippable step (BR-GAP-2) and treats its completion as the legitimate, visible-consequence trigger (§10.6, §28.4) for what follows.
- *Intelligence:* The Skill-Gap Analysis Agent runs (§27.3), immediately cascading to the Roadmap Agent (§27.4) — the full First Skill-Gap Analysis and Roadmap Generation workflows, detailed at scenario grain in §18.5 and §19.2 rather than repeated here.
- *Knowledge:* Identity is established (Authentication); Profile and Goal are written (User Profiles); Skill-Gap Analysis and Roadmap are written (AI Career Center) — three modules, three distinct write-ownerships, one shared graph (§24.2).
**Knowledge Operations:** Write Identity; write Profile, write Goal; write first Skill-Gap Analysis version; write first Roadmap version.
**Intelligence Operations:** Skill-Gap Analysis Agent produces the first Analysis (no Change Awareness — no prior version exists, §27.3); Roadmap Agent produces the first Roadmap from it (§27.4).
**Interaction Responsibilities:** Enforce the FR-ONBOARD-1 completeness bar (BR-GAP-1) before allowing the cascade to begin; treat the cascade as automatic-but-visible, never silent (§27.13).
**Presentation Responsibilities:** Communicate that Onboarding cannot be skipped; land the user on the Skill-Gap Analysis screen with the Roadmap already available, not a blank or loading state with no explanation.
**Governance Constraints:** BR-GAP-1/2 (completeness bar gates generation); DPR-6 (automatic-but-visible initiation); RAI-4/RAI-6 (Explainability and Confidence must already be attached to the first Analysis and Roadmap the user sees).
**Completion Condition:** The user has an account, a Profile, an active Goal, a Skill-Gap Analysis, and a Roadmap, all visible — "first value" is reached at the moment the Roadmap screen renders with a next action available (feeding directly into §18.3's returning-user case and §19.5's Dashboard).
**Properties Preserved:** *One Coherent Intelligence* — the user experiences one continuous onboarding-to-roadmap flow, not two visibly separate agent runs (§17.8, §25.9). *Single Source of Truth* — Identity, Profile, Goal, Analysis, and Roadmap are each written exactly once, by exactly one owning module. *Human-in-the-Loop* — nothing beyond Onboarding's own required fields is asked of the user; every subsequent step is a visible automatic consequence, never silent.
**Boundary Integrity:** Three module boundaries are crossed (§15.2's read/write pattern applied three times) without any module writing an entity it does not own; the Authentication → User Profiles → AI Career Center sequence is exactly the module dependency chain already described in SAS §14.9 and §15.3, not a new one.

## 18.3 Scenario: User Login → Dashboard Restoration
**Trigger:** A returning, already-onboarded user authenticates (FR-AUTH-2).
**Participating Module(s):** Authentication → Dashboard, reading across into the AI Career Center and User Profiles.
**Participating Layers:**
- *Presentation:* Renders Log In (§22 screen 2), then Dashboard (§22 screen 5) on success.
- *Interaction:* Governs Dashboard Next Action (§27.9) — a pure read/display workflow, explicitly with no Intelligence participants.
- *Intelligence:* **None invoked.** No agent runs on login; Dashboard reads the current Roadmap's next incomplete item and the current Analysis's confidence state, both already written by prior scenario instances (§27.9).
- *Knowledge:* Read-only — current Roadmap Item, current Skill-Gap Analysis confidence state, current Profile/Goal summary (§24.11's continuity guarantee: the same graph state that existed when the user left).
**Knowledge Operations:** Read current Roadmap next item; read current Analysis confidence; write nothing.
**Intelligence Operations:** None — this scenario demonstrates a valid, complete cross-layer path with zero Intelligence Layer participation, exactly as §17.9 anticipates.
**Interaction Responsibilities:** Confirm identity via Authentication before any read is permitted; present the next-action reason inline (FR-DASH-4), not gated behind a separate request.
**Presentation Responsibilities:** Single, current snapshot (FR-DASH-1), no navigation required to understand status (FR-DASH-3).
**Governance Constraints:** RAI-1 (human oversight — nothing self-executes from Dashboard); §24.11 continuity (no degraded or reconstructed state).
**Completion Condition:** Dashboard renders the current snapshot and next action, matching the graph state as of the user's last session.
**Properties Preserved:** *Single Source of Truth* — Dashboard reads, never recomputes, the Roadmap Agent's own output. *Layer Independence* — Dashboard's read crosses the Intelligence↔Knowledge contract (§11) exactly as the Roadmap Agent's own write did; no separate Dashboard-specific data path exists.
**Boundary Integrity:** Dashboard module reads an AI Career Center-owned entity per §15.2's explicit allowance ("Dashboard module — reads the Roadmap Agent's item-level output"); it writes nothing, so no ownership rule is at risk.

## 18.4 Scenario: First Goal Creation
**Trigger:** During Onboarding, the user states a target role/field for the first time (FR-PROF-2).
**Participating Module(s):** User Profiles only.
**Participating Layers:**
- *Presentation:* Onboarding screen's goal-capture field (§22 screen 4).
- *Interaction:* Treats goal statement as a required Onboarding element (FR-ONBOARD-1) — user-initiated, not automatic.
- *Intelligence:* **None invoked at this step.** Goal is user-controlled content (§24.5); no agent reasons about or validates it. Its downstream consequence — triggering analysis — belongs to §18.5, not this scenario.
- *Knowledge:* Write Goal, marked active; no previous goal exists to archive (BR-GOAL-2 does not yet apply on a first goal).
**Knowledge Operations:** Write Goal (active, first instance).
**Intelligence Operations:** None.
**Interaction Responsibilities:** Ensure the goal statement is captured before Onboarding is considered complete (BR-GAP-1's precondition).
**Presentation Responsibilities:** Present goal capture as part of one continuous Onboarding step, not a separate screen requiring its own navigation.
**Governance Constraints:** BR-GOAL-1 (exactly one active goal — trivially satisfied on a first goal, but the same rule that will govern every subsequent change, §18.4 → §19.3).
**Completion Condition:** An active Goal exists on the graph, satisfying one half of BR-GAP-1's precondition for analysis (the other half being FR-ONBOARD-1's profile-completeness bar).
**Properties Preserved:** *User Control* — the goal statement is entirely user-authored; no AI involvement exists at this step to override. *Single Source of Truth* — exactly one active Goal is written, consistent with BR-GOAL-1 from the first instance onward.
**Boundary Integrity:** Written exclusively by the User Profiles module, never by the AI Career Center (§14.3) — even though the Goal is what the AI Career Center will immediately read once Onboarding completes (§18.5).

## 18.5 Scenario: First Skill-Gap Analysis
**Trigger:** Onboarding completes, meeting the BR-GAP-1 bar (§27.3) — the direct cascade from §18.4 once the profile-completeness half of the bar is also met.
**Participating Module(s):** AI Career Center only.
**Participating Layers:**
- *Presentation:* Skill-Gap Analysis screen (§22 screen 7), rendered once the write completes.
- *Interaction:* First Skill-Gap Analysis workflow (§27.3) — automatic, as a direct and visible consequence of completing Onboarding (§10.6).
- *Intelligence:* Skill-Gap Analysis Agent — reads Profile and active Goal; no prior version exists, so Change Awareness does not apply (§27.3).
- *Knowledge:* Write first Skill-Gap Analysis version.
**Knowledge Operations:** Read Profile, read active Goal (both User Profiles-owned); write first Skill-Gap Analysis version (AI Career Center-owned).
**Intelligence Operations:** Compare Profile against active Goal; identify specific missing/underdeveloped skills, not only an aggregate score (FR-AICC-2); attach confidence, reduced if the profile is incomplete above the bar (BR-GAP-5, FR-AICC-3).
**Interaction Responsibilities:** Make the result reachable with its explanation available on request (FR-AICC-5), without requiring the user to ask for the analysis to run.
**Presentation Responsibilities:** Render the analysis with its confidence indicator, if applicable (§27.3's stated outcome), and surface specific flagged gaps, not a bare score (FR-AICC-2).
**Governance Constraints:** BR-GAP-1/2 (gate); BR-GAP-5 (confidence never omitted below full completeness); RAI-4 (explainability), RAI-6 (confidence honesty).
**Completion Condition:** A first Skill-Gap Analysis version is written and visible, immediately cascading into Roadmap Generation (§19.2, per §27.3's own stated cascade) — this scenario's own completion is reached before that cascade is evaluated.
**Properties Preserved:** *Explainability* — FR-AICC-5's on-request reasoning is available from the first analysis onward, not deferred to a later maturity stage. *Confidence Communication* — BR-GAP-5 applies from the very first run. *Responsible AI* — RAI-4/RAI-6 satisfied at the first possible moment an AI artifact exists in the system.
**Boundary Integrity:** The Skill-Gap Analysis Agent reads Profile and Goal without writing either (§14.3's read-without-write pattern); it writes only the one entity it owns, satisfying §11.6's exclusive-write checkpoint from the system's very first Intelligence Layer invocation.

---
*Part of the SAS, Part IV. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§10.6, 11.6, 14.3, 15.2, 17.8–17.9, 24.11, 25.9; PRD §§19 FR-AUTH-1–2, FR-ONBOARD-1, FR-PROF-2, FR-AICC-2–5, FR-DASH-1–4; §21 BR-GAP-1–2/5, BR-GOAL-1–2; §22, §24.2, §24.5, §27.3, §27.9, §27.13.*
