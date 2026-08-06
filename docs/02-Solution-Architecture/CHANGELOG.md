# SAS Changelog

All notable revisions to the CareerOS Solution Architecture Specification are recorded here, grouped by milestone.

## Part I — System Architecture (Sections 1–7) — Approved

- **Section 1 — System Architecture Philosophy.** Established the five-layer model (Knowledge, Intelligence, Interaction, Presentation, Governance), the sequential-vs-cross-cutting distinction, and the mapping of PRD §47's six Platform Assumptions onto architectural consequences.
- **Section 2 — High-Level System Architecture.** Defined the system boundary, external actors, internal components, information flow, and how PRD Modules (§16), the Career Knowledge Graph (§24), the Agent Ecosystem (§25), Capabilities (§26), and AI Workflows (§27) each map onto the architecture.
- **Section 3 — Knowledge Layer Architecture.** Full specification of the Career Knowledge Graph as the Knowledge Layer: entities, boundaries, ownership, single source of truth, and why Intelligence can never become a source of truth.
- **Section 4 — Intelligence Layer Architecture.** Full specification of the Phase 0 agent roster as the Intelligence Layer: why Capabilities and Workflows are not Agents, mediated-only agent communication, and why Coordination is not another Agent.
- **Section 5 — Interaction Layer Architecture.** Full specification of the human-AI interaction rules as their own layer: why Interaction is neither Intelligence nor Presentation, and how human-in-the-loop is an emergent property of the layer's position.
- **Section 6 — Presentation Layer Architecture.** Full specification of the Presentation Layer: why it never originates business logic, reasoning, or policy, and how it expresses — never defines — the Interaction Layer.
- **Section 7 — Governance Layer Architecture.** Full specification of the cross-cutting Governance Layer: why it is not sequential, never reasons, never owns data, and never presents information directly. Completed Part I.

## Part II — Interface & Contract Architecture (Sections 8–12) — Approved

- **Section 8 — Contract Architecture Philosophy.** Established what a "Contract" means at the interface level and the Five Dimensions every contract is specified along: Information, Responsibility, Ownership, Operations, Constraints. Traces to PRD §§21, 23, 25, 26, 28, 29 and SAS Part I.
- **Section 9 — Presentation ↔ Interaction Contract.** Full specification of the boundary where Interaction's governed rules become perceivable to a human: what crosses (Render/Request/Acknowledge), the responsibility split, and why raw Knowledge data must never reach Presentation directly.
- **Section 10 — Interaction ↔ Intelligence Contract.** Full specification of the boundary between producing an output and governing how it is engaged with: what crosses (Produce/Explain-request/Trigger), and why Interaction can never originate confidence or explanation content itself.
- **Section 11 — Intelligence ↔ Knowledge Contract.** Full specification of the read-shared/write-exclusive boundary (Read/Write/Version-compare) that makes the Knowledge Layer's single source of truth enforceable — identified as the single most safety-critical checkpoint in the architecture.
- **Section 12 — Governance Checkpoints & Contract Extensibility.** Restated Governance as a condition on every crossing, not a fourth hop; named the three checkpoints explicitly; established that contracts apply identically across all modules, present and future. Completed Part II with full traceability table and Principal Product Manager Review (Final Verdict: APPROVED).

Part II introduces no new product behavior, feature, business rule, or requirement beyond what the PRD and SAS Part I already establish.

## Part III — Module Architecture (Sections 13–16) — Approved

- **Section 13 — Module Architecture Philosophy.** Defined a Module as a named, bounded unit of product capability, whose boundary is drawn exclusively by Knowledge Layer write-ownership (§13.5, §13.9) — not by which agents, workflows, or screens are associated with it. Established the five-part internal composition template (Knowledge/Intelligence/Interaction/Presentation occupants, plus Governance applicability) every module follows. Traces to PRD §16, §24.2, §24.8, §24.12 and SAS §§1.4, 1.7, 2.8, 2.13, 7.16, 8–11.
- **Section 14 — The AI Career Center as a Module.** Applied §13's template to the AI Career Center concretely: identified its three owned entities (Skill-Gap Analysis, Roadmap, CV/Profile Feedback Round), its three agents, seven workflows, and five screens; demonstrated Governance constraining Presentation → Interaction → Intelligence → Knowledge simultaneously (diagram); precisely excluded Profile & Goal, identity, Dashboard, Notifications, and Settings from the module's boundary despite IA-adjacency, resolving a latent ambiguity in the PRD's own Screen Inventory (§22) grouping.
- **Section 15 — Module Boundaries, Dependencies & Independence.** Specified what may depend on the AI Career Center (Dashboard, Notifications, future Learning Hub/Portfolio/Jobs & Internships reads) and what it may depend on (Profile, Goal, identity, AI/memory preferences) — all as Knowledge Layer reads through the Part II contracts, never direct module-to-module calls. Established why independence holds without isolation, and extended the agent-level fail-safe rule (§4.18) to module-level failure containment (§15.8).
- **Section 16 — Module Extensibility & Relationship to Future Modules.** Confirmed every future module (Learning Hub, Portfolio, Jobs & Internships, Professional Community, University/Company Admin, Services Marketplace) occupies the same structure without requiring redesign; stated what a future module may add versus what it can never redefine. Completed Part III with full traceability table, consolidated Architectural Constraints, and Principal Product Manager Review (Final Verdict: APPROVED).

Part III introduces no new product behavior, module, entity, agent, workflow, or screen beyond what the PRD and SAS Parts I–II already establish.

## Part IV — Cross-Layer System Scenarios (Sections 17–21) — Approved

- **Section 17 — Cross-Layer Scenario Philosophy.** Defined the System Scenario as a complete, traceable path through the architecture, and precisely distinguished it from an AI Workflow (§27, the Intelligence-Layer segment of a scenario), a User Journey (a UX-Design concept, out of SAS scope), and Module Behavior (Part III's static description). Established the Eight Cross-Cutting Architectural Properties every scenario is checked against, and the ten-element Scenario Description Template. Recorded two scope judgments per the task's own exclude-and-explain procedure: "Data Export Request" renamed to "Data Access Request (View Stored Data)" (the PRD supports viewing stored data, not a downloadable export artifact — FR-SET-2, DPR-3); "Subscription Upgrade" folded into a single "Subscription Lifecycle" scenario alongside Renewal and Cancellation (no dedicated rule exists for Upgrade beyond FR-SET-1's general subscription management).
- **Section 18 — Foundational & Onboarding Scenarios.** Traced User Registration → First Value, User Login → Dashboard Restoration, First Goal Creation, and First Skill-Gap Analysis — the four scenarios establishing a user's presence and first AI-generated artifact, including the three-module boundary crossing (Authentication → User Profiles → AI Career Center) in Registration → First Value.
- **Section 19 — Core AI Loop Scenarios.** Traced Roadmap Generation, Material Profile Change → Regeneration, CV/Profile Feedback Round, and Dashboard Refresh — the repeatable core of the AI Career Center's Core Loop (§14), including the CV/Profile Feedback Agent's demonstrated total independence from the other two Phase 0 agents.
- **Section 20 — Account & Data Scenarios.** Traced Subscription Lifecycle, Data Access Request, and Data Deletion Request — three scenarios with zero Intelligence Layer participation by design, demonstrating that a fully valid, fully governed scenario does not require an agent.
- **Section 21 — Exception & Control Scenarios.** Traced Failure During AI Processing and User Override of an AI Recommendation — including the finding that Roadmap Item status was never in the Roadmap Agent's write-ownership (§25.8), which is precisely why an override never produces a boundary conflict. Completed Part IV with a Consolidated Properties Preservation Matrix (13 scenarios × 8 properties), full traceability table, consolidated Architectural Constraints, and Principal Product Manager Review (Final Verdict: APPROVED). Confirmed no architectural ambiguity or contradiction requiring an ADR was discovered.

Part IV introduces no new product behavior, workflow, feature, or business rule beyond what the PRD and SAS Parts I–III already establish.

## Part V — Extensibility & Future-Phase Architecture (Sections 22–26) — Approved

- **Section 22 — Extensibility Philosophy & the Six Invariants.** Established that extensibility is a consequence of PRD §47.3–§47.7's PA-1–PA-6 and PC-1–PC-6 holding, not an independently engineered feature. Defined the Six Invariants (One Graph, One Coherent Intelligence, One Interaction Philosophy, One Design System, One Source of Truth, One Core Loop), each mapped to the SAS layer structurally responsible for preserving it. Recorded a genuine architectural finding — a tension between Professional Community's approved purpose (§16) and PRD §44's DPR-10 (cross-user data use out of scope) — as **ADR-001**, per repository governance, rather than silently resolving it.
- **Section 23 — Consolidated Per-Layer Extensibility Rules.** Gathered every extensibility rule already established across Parts I–III (Knowledge §3.16, Intelligence §4.19, Interaction §5.19, Presentation §6.18, Governance §7.16–§7.18, Contracts §12.6–§12.7, Modules §13.9/§15–§16) into one reference, plus a seven-step General Extension Procedure applicable to any future module, agent, capability, workflow, or screen.
- **Section 24 — Worked Examples: New Consumer Modules.** Applied §23's rules to Learning Hub, Professional Community (modeled portion only, per ADR-001), and Jobs & Internships (student-facing), each showing what changes, what never changes, which layer is extended, and why existing modules continue working unchanged.
- **Section 25 — Worked Examples: New Actor Types & New Capabilities.** Applied §23's rules to Company Self-Service and Services Marketplace (both introducing new external actors already anticipated at SAS §2.4 and PRD §24.12) and to Future AI Capabilities (illustrated with Reflection/Self-Critique, per §26.10's constraints), showing capability extension touches only the Intelligence Layer's internal catalog.
- **Section 26 — Invariant Preservation Summary & Part V Closing.** Consolidated all six worked examples into one Six-Invariant Preservation Matrix, honestly marking Professional Community's unmodeled matching mechanism as unresolved rather than compliant by default. Completed Part V with consolidated Architectural Constraints, full traceability table, and Principal Product Manager Review (Final Verdict: APPROVED).

Part V introduces no new product behavior beyond the single, explicitly-recorded open question in ADR-001.

## ADRs

- **ADR-001** (`docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md`) — Professional Community's peer-matching mechanism requires cross-user data use PRD §44 DPR-10 does not yet scope. Status: **Proposed, awaiting approval.** Blocks only further architectural detail on Professional Community's matching mechanism; does not affect any currently-approved (Phase 0) scope.

## Part VI — Appendices (Section 27) — Approved

- **Section 27 — Appendices.** Closed the SAS with a Glossary of Architectural Terms, a Consolidated Cross-Reference Index (every PRD prefix — FR-, BR-, RAI-, DPR-, TS-, NFR-, PA-, PC-, HR- — mapped to its primary SAS grounding), and a Document Map of all 27 sections across six Parts. Kept intentionally concise per updated project direction: the SAS is now considered sufficient for implementation, and Database Design, API Specification, Technical Architecture, and AI Architecture will be produced in minimal form alongside code rather than as further standalone documents (§27.5).

**The Solution Architecture Specification is now complete: all six Parts (Sections 1–27), approved.**

## ADRs

- **ADR-001** (`docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md`) — Professional Community's peer-matching mechanism requires cross-user data use PRD §44 DPR-10 does not yet scope. Status: **Proposed, awaiting approval.** Blocks only further architectural detail on Professional Community's matching mechanism; does not affect any currently-approved (Phase 0) scope or implementation.

## Governance confirmation

Per the repository rule established in [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (master document + `sections/` folder, always together), this document remains compliant — `sections/` has held one file per section since Section 1 was approved, and now holds Sections 1–27, its final count. No structural change was required.

## Status

Current version: **Complete. All six Parts locked (Sections 1–27).** Per updated project direction, the SAS is closed to new Parts; further Database Design, API Specification, Technical Architecture, and AI Architecture content will be produced alongside implementation and recorded in its own location, not in this document's structure. ADR-001 remains open, awaiting approval, and does not block implementation.
