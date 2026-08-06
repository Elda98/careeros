# Section 24 — Worked Examples: New Consumer Modules

*Part V — Extensibility & Future-Phase Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 24.1 Purpose
This section applies §23's consolidated rules and §22.5's Six Invariants to three PRD-approved future modules whose primary relationship to the existing architecture is reading from it, following the §13.7 template (Knowledge/Intelligence/Interaction/Presentation occupants, Governance applicability) already used to describe the AI Career Center concretely in Part III.

## 24.2 Worked Example: Learning Hub (Phase 1)
Per §16: recommends resources tied to skill gap; tracks completion. Reads Skill Gap; writes Completed skills, learning progress.
**New Knowledge Occupants:** New entities — Learning Resource (recommended), Learning Progress (completion state) — owned exclusively by the Learning Hub module.
**New Intelligence Occupants:** A Learning Hub agent (if the module's reasoning warrants one, per §4.19's constraints) reading Skill-Gap Analysis to determine which resources address a flagged gap — a new occupant added under §4.19, not a modification of the three existing agents.
**New Interaction Occupants:** A new workflow (e.g., "Resource Recommendation"), following §5.19's rule that it reuses the existing interaction rule set exactly — explanation on request, confidence where relevant, override always available.
**New Presentation Occupants:** New screens for browsing recommendations and tracking completion, built on the existing design system (§6.18).
**Governance Applicability:** Existing RAI items (§29) and NFRs (§43) apply automatically (§7.16); if a new Business Rule is genuinely required (e.g., defining what counts as "resource completion"), it is evaluated through the Decision Framework (§53), not assumed here.
**What Changes:** Two new Knowledge Layer entities exist; a new Intelligence Layer occupant may exist; new Interaction and Presentation occupants exist.
**What Never Changes:** The Skill-Gap Analysis entity's shape and write-ownership (still the Skill-Gap Analysis Agent, exclusively); the AI Career Center's own agents, workflows, or screens; the Interaction Layer's rule set; the Presentation Layer's design system.
**Layer(s) Extended:** Knowledge (new entities), Intelligence (possible new agent), Interaction (new workflow instance), Presentation (new screens) — Governance applies without extension (§7.16).
**Why No Redesign Is Required:** Learning Hub reads Skill-Gap Analysis under the same shared-read rule (§11.4) every other reader in this architecture already uses; it writes only its own new entities, never touching the AI Career Center's write-ownership (§13.9).
**Why Existing Modules Continue Working Unchanged:** The AI Career Center's Skill-Gap Analysis Agent has no awareness that Learning Hub exists — it continues writing the same entity, under the same rules, whether or not anything downstream reads it (§15.4's independence property, applied prospectively).
**Six Invariants Check:** One Graph (✓ — new entities added to the same graph, §3.16) · One Coherent Intelligence (✓ — a new agent, if any, is mediated through the Knowledge Layer exactly as the existing three are, §4.19) · One Interaction Philosophy (✓ — §5.19) · One Design System (✓ — §6.18) · One Source of Truth (✓ — Skill-Gap Analysis remains single-writer) · One Core Loop (✓ — Learning Hub's own loop, per §14's "additional loops... defined when scoped," is additive, not a replacement for the AI Career Center's Core Loop).

## 24.3 Worked Example: Professional Community (Phase 3)
Per §16: peer connection around shared goals/field. Reads Goal/field, for relevant grouping; writes Minimal — community activity, not core career state.
**Scope note (per §22.8, ADR-001):** This example models only what §16 unambiguously approves — storing an established connection and minimal community activity. The peer-matching/discovery mechanism itself (surfacing *which* peers share a goal or field) requires cross-user data comparison that PRD §44's DPR-10 explicitly declines to scope. That mechanism is excluded from this worked example pending ADR-001's resolution; it is not silently assumed.
**New Knowledge Occupants:** A Connection entity (an accepted, established link between two users, recorded — per the reasoning in ADR-001 — as a per-user record, symmetric on each side, consistent with the Knowledge Layer's single-user-scoped design, §24.1 PRD) and minimal Community Activity entities — both owned exclusively by the Professional Community module.
**New Intelligence Occupants:** None modeled in this worked example — the matching/discovery step that would most plausibly require Intelligence Layer reasoning is exactly the excluded portion (§22.8).
**New Interaction Occupants:** A workflow governing how an already-established connection and community activity are engaged with, reusing the existing rule set (§5.19); no new interaction pattern is introduced for the (excluded) matching step.
**New Presentation Occupants:** Screens for viewing existing connections and community activity, on the existing design system (§6.18).
**Governance Applicability:** Existing RAI/NFR items apply automatically (§7.16) to the modeled portion; the excluded matching mechanism would require new Governance content (a cross-user privacy rule) that does not yet exist and is not assumed here.
**What Changes:** Two new, minimal-footprint Knowledge Layer entities exist, owned by the Professional Community module.
**What Never Changes:** Every existing entity's single-user scope (§24.1 PRD); no existing module's write-ownership; the Interaction and Presentation Layer's rule sets.
**Layer(s) Extended:** Knowledge (new, minimal entities), Interaction and Presentation (new occupants over the modeled portion only) — Intelligence and the matching-specific Governance content are explicitly not extended here, pending ADR-001.
**Why No Redesign Is Required (for the modeled portion):** A Connection entity, modeled per-user, fits §3.16's additive-entity rule exactly like any other new entity — it does not require the Knowledge Layer's single-user-scope definition to change, because each user's own record of their own connections is still, individually, that user's own career-context data.
**Why Existing Modules Continue Working Unchanged:** No existing entity, agent, workflow, or screen is read differently or written differently by Professional Community's modeled portion; the AI Career Center is entirely unaware of it.
**Six Invariants Check:** One Graph (✓, modeled portion) · One Coherent Intelligence (not applicable — no Intelligence occupant modeled) · One Interaction Philosophy (✓) · One Design System (✓) · One Source of Truth (✓, modeled portion) · One Core Loop (✓ — Professional Community's own future loop is additive) — **the matching mechanism's invariant compliance cannot be checked until ADR-001 is resolved, which is precisely why it is excluded rather than assumed compliant.**

## 24.4 Worked Example: Jobs & Internships — Student-Facing (Phase 2)
Per §16: surfaces opportunities ranked by Opportunity Score; tracks applications. Reads Profile, goal, skills; writes Application history and outcomes.
**New Knowledge Occupants:** Job/Internship Listing (read from Company Self-Service, §25.2 — not owned by this module), Application (record of a user's application and its outcome) — Application owned exclusively by Jobs & Internships.
**New Intelligence Occupants:** A Jobs & Internships agent computing Opportunity Score, reading Profile, Goal, and Skill-Gap Analysis (the existing AI Career Center entity) — a new occupant, added under §4.19, that reads across an existing module boundary exactly as the Roadmap Agent reads within one and Dashboard reads across one (§15.2's pattern, extended to a future module).
**New Interaction Occupants:** A workflow for surfacing ranked opportunities and tracking application status, with Opportunity Score explainable on request (§5.19's inherited explainability rule) exactly as every existing score or recommendation already is.
**New Presentation Occupants:** Screens for browsing opportunities and tracking applications, on the existing design system.
**Governance Applicability:** BR-AI-1 through BR-AI-5's equivalents (advisory-only, explainable, confidence-calibrated, honest failure) apply automatically to Opportunity Score exactly as they apply to Skill-Gap Analysis and Roadmap today (§7.16) — no new Governance content is required for the student-facing side.
**What Changes:** New entities (Listing-read, Application-write); a new agent reading across into the AI Career Center's Skill-Gap Analysis.
**What Never Changes:** The Skill-Gap Analysis Agent's write-ownership or behavior; the AI Career Center's own workflows and screens.
**Layer(s) Extended:** Knowledge, Intelligence, Interaction, Presentation — Governance applies without extension.
**Why No Redesign Is Required:** The Jobs & Internships agent's read of Skill-Gap Analysis is the same Intelligence↔Knowledge contract (§11) every cross-module read in this architecture already uses (§15.6) — reading across a module boundary was never restricted, only writing across one.
**Why Existing Modules Continue Working Unchanged:** The Skill-Gap Analysis Agent gains a new reader, not a new writer, a new dependency, or a new responsibility — its own operation (§25.4) is identical whether Jobs & Internships exists or not.
**Six Invariants Check:** One Graph (✓) · One Coherent Intelligence (✓ — the new agent is mediated through the Knowledge Layer, never communicating directly with the Skill-Gap Analysis Agent, §4.10's rule extended) · One Interaction Philosophy (✓) · One Design System (✓) · One Source of Truth (✓ — Skill-Gap Analysis remains single-writer even with a new reader) · One Core Loop (✓ — a new loop, additive).

---
*Part of the SAS, Part V. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§3.16, 4.10, 4.19, 5.19, 6.18, 7.16, 11, 13.7, 13.9, 15.2, 15.4, 15.6; PRD §§14, 16, 24.1, 44 DPR-10, 53; ADR-001.*
