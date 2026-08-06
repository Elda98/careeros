# 02 — Solution Architecture Specification (SAS)

This directory contains the CareerOS Solution Architecture Specification — the technology-agnostic structural architecture that bridges the [Product Requirements Document](../01-Product/PRD.md) and the discipline-specific documents that follow it (Technical Architecture, Database Design, API Specification, UX, UI, AI).

## What this document is

The SAS describes **what CareerOS is structurally** — its layers, boundaries, entities, and the relationships between them. It does not describe **how** the system is implemented: no programming language, framework, database engine, API protocol, cloud provider, or infrastructure choice is made anywhere in this document. Every architectural statement traces back to a specific section of the approved PRD.

## What this document is not

- Not a Technical Architecture document
- Not a Software Architecture document
- Not an Infrastructure document
- Not a Security Architecture or Compliance document

## Structure

| File | Contents |
|---|---|
| [`SAS.md`](SAS.md) | The compiled specification — all parts and sections, assembled from `sections/` |
| [`sections/`](sections/) | **The source of truth.** Each approved section as its own individually editable file |
| [`CHANGELOG.md`](CHANGELOG.md) | Revision history for this document |

## Editing model (per [`CONTRIBUTING.md`](../../CONTRIBUTING.md))

**The files in `sections/` are the editable source of truth. `SAS.md` is the compiled reference, regenerated from them after every approved change.** This document already followed this pattern from Part I onward; the rule is now standing for every document in this repository.

## Status

**The Solution Architecture Specification is complete (Parts I–VI, Sections 1–27).** Per updated project direction (see root [`README.md`](../../README.md)), the SAS is now considered sufficient for implementation to begin. No further standalone architecture Parts are planned; Database Design, API Specification, Technical Architecture, and AI Architecture will each be produced in minimal form alongside the code that needs them, not as upfront documents (§27.5).

**Part I — System Architecture: Complete and approved (Sections 1–7).**
**Part II — Interface & Contract Architecture: Complete and approved (Sections 8–12).**
**Part III — Module Architecture: Complete and approved (Sections 13–16).**
**Part IV — Cross-Layer System Scenarios: Complete and approved (Sections 17–21).**
**Part V — Extensibility & Future-Phase Architecture: Complete and approved (Sections 22–26).**
**Part VI — Appendices: Complete and approved (Section 27).**

| # | Section | File |
|---|---|---|
| 1 | System Architecture Philosophy | [`sections/01-System-Architecture-Philosophy.md`](sections/01-System-Architecture-Philosophy.md) |
| 2 | High-Level System Architecture | [`sections/02-High-Level-System-Architecture.md`](sections/02-High-Level-System-Architecture.md) |
| 3 | Knowledge Layer Architecture | [`sections/03-Knowledge-Layer.md`](sections/03-Knowledge-Layer.md) |
| 4 | Intelligence Layer Architecture | [`sections/04-Intelligence-Layer.md`](sections/04-Intelligence-Layer.md) |
| 5 | Interaction Layer Architecture | [`sections/05-Interaction-Layer.md`](sections/05-Interaction-Layer.md) |
| 6 | Presentation Layer Architecture | [`sections/06-Presentation-Layer.md`](sections/06-Presentation-Layer.md) |
| 7 | Governance Layer Architecture | [`sections/07-Governance-Layer.md`](sections/07-Governance-Layer.md) |
| 8 | Contract Architecture Philosophy | [`sections/08-Contract-Architecture-Philosophy.md`](sections/08-Contract-Architecture-Philosophy.md) |
| 9 | Presentation ↔ Interaction Contract | [`sections/09-Presentation-Interaction-Contract.md`](sections/09-Presentation-Interaction-Contract.md) |
| 10 | Interaction ↔ Intelligence Contract | [`sections/10-Interaction-Intelligence-Contract.md`](sections/10-Interaction-Intelligence-Contract.md) |
| 11 | Intelligence ↔ Knowledge Contract | [`sections/11-Intelligence-Knowledge-Contract.md`](sections/11-Intelligence-Knowledge-Contract.md) |
| 12 | Governance Checkpoints & Contract Extensibility | [`sections/12-Governance-Checkpoints-and-Extensibility.md`](sections/12-Governance-Checkpoints-and-Extensibility.md) |
| 13 | Module Architecture Philosophy | [`sections/13-Module-Architecture-Philosophy.md`](sections/13-Module-Architecture-Philosophy.md) |
| 14 | The AI Career Center as a Module | [`sections/14-AI-Career-Center-as-a-Module.md`](sections/14-AI-Career-Center-as-a-Module.md) |
| 15 | Module Boundaries, Dependencies & Independence | [`sections/15-Module-Boundaries-Dependencies-and-Independence.md`](sections/15-Module-Boundaries-Dependencies-and-Independence.md) |
| 16 | Module Extensibility & Relationship to Future Modules | [`sections/16-Module-Extensibility-and-Future-Modules.md`](sections/16-Module-Extensibility-and-Future-Modules.md) |
| 17 | Cross-Layer Scenario Philosophy | [`sections/17-Cross-Layer-Scenario-Philosophy.md`](sections/17-Cross-Layer-Scenario-Philosophy.md) |
| 18 | Foundational & Onboarding Scenarios | [`sections/18-Foundational-and-Onboarding-Scenarios.md`](sections/18-Foundational-and-Onboarding-Scenarios.md) |
| 19 | Core AI Loop Scenarios | [`sections/19-Core-AI-Loop-Scenarios.md`](sections/19-Core-AI-Loop-Scenarios.md) |
| 20 | Account & Data Scenarios | [`sections/20-Account-and-Data-Scenarios.md`](sections/20-Account-and-Data-Scenarios.md) |
| 21 | Exception & Control Scenarios | [`sections/21-Exception-and-Control-Scenarios.md`](sections/21-Exception-and-Control-Scenarios.md) |
| 22 | Extensibility Philosophy & the Six Invariants | [`sections/22-Extensibility-Philosophy-and-the-Six-Invariants.md`](sections/22-Extensibility-Philosophy-and-the-Six-Invariants.md) |
| 23 | Consolidated Per-Layer Extensibility Rules | [`sections/23-Consolidated-Per-Layer-Extensibility-Rules.md`](sections/23-Consolidated-Per-Layer-Extensibility-Rules.md) |
| 24 | Worked Examples: New Consumer Modules | [`sections/24-Worked-Examples-New-Consumer-Modules.md`](sections/24-Worked-Examples-New-Consumer-Modules.md) |
| 25 | Worked Examples: New Actor Types & Capabilities | [`sections/25-Worked-Examples-New-Actor-Types-and-Capabilities.md`](sections/25-Worked-Examples-New-Actor-Types-and-Capabilities.md) |
| 26 | Invariant Preservation Summary & Part V Closing | [`sections/26-Invariant-Preservation-and-Part-V-Closing.md`](sections/26-Invariant-Preservation-and-Part-V-Closing.md) |
| 27 | Appendices | [`sections/27-Appendices.md`](sections/27-Appendices.md) |

Part I establishes five structural layers — Knowledge, Intelligence, Interaction, Presentation, and Governance — and specifies each one fully: its purpose, its relationship to the PRD, what belongs and does not belong inside it, why it is distinct from every other layer, and how it remains compatible with future modules, future agents, and future agentic-AI patterns without redesign.

Part II defines the architectural contracts at each of the three sequential boundaries established in Part I — Presentation ↔ Interaction, Interaction ↔ Intelligence, Intelligence ↔ Knowledge — specified along five dimensions (Information, Responsibility, Ownership, Operations, Constraints), plus how Governance applies as a checkpoint (not a fourth hop) at every one of them.

Part III formalizes the Module as an architectural unit — a vertical slice across all five layers, bounded by Knowledge Layer write-ownership — and demonstrates it concretely against the AI Career Center, the one module currently approved for build, including precisely what belongs inside and outside its boundary and how future modules will occupy the same structure.

Part IV demonstrates the complete architecture operating end-to-end through thirteen real system scenarios (Registration, Login, Goal Creation, Skill-Gap Analysis, Roadmap Generation, Material-Change Regeneration, CV Feedback, Dashboard Refresh, Subscription Lifecycle, Data Access, Data Deletion, AI Processing Failure, and User Override), each traced through Presentation → Interaction → Intelligence → Knowledge under simultaneous Governance constraint, and distinguishes the System Scenario concept from an AI Workflow, a User Journey, and Module Behavior.

Part V consolidates every extensibility rule from Parts I–IV into one reference (§23), defines the Six Invariants every extension must preserve (One Graph, One Coherent Intelligence, One Interaction Philosophy, One Design System, One Source of Truth, One Core Loop — PA-1 through PA-6), and demonstrates them against six PRD-approved future-phase examples: Learning Hub, Professional Community, Jobs & Internships, Company Self-Service, Services Marketplace, and Future AI Capabilities. It also records **ADR-001**, a genuine tension between Professional Community's approved purpose and the PRD's current cross-user data scope, surfaced rather than silently resolved.

## Structure (Final — All Six Parts Complete)

| Part | Title | Prepares | Status |
|---|---|---|---|
| I | System Architecture | All downstream documents (foundational) | **Complete** |
| II | Interface & Contract Architecture | API Design; informs Technical Architecture, Database Design | **Complete** |
| III | Module Architecture | Technical Architecture, Development; informs UX/UI Design | **Complete** |
| IV | Cross-Layer System Scenarios | UX/UI Design, Technical Architecture, Development | **Complete** |
| V | Extensibility & Future-Phase Architecture (Consolidated) | Technical Architecture, Development; informs Database/API extensibility | **Complete** |
| VI | Appendices | All (reference material) | **Complete** |

Each Part's full purpose, section list, and rationale is recorded in [`CHANGELOG.md`](CHANGELOG.md). The SAS is now closed to new Parts — see §27.5 for how Database Design, API Specification, Technical Architecture, and AI Architecture are produced going forward (alongside implementation, not as upfront documents).

## Open Architecture Decision Records

- **[ADR-001](../00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md)** — Professional Community's peer-matching mechanism requires cross-user data use not yet scoped by PRD §44 (DPR-10). Status: Proposed, awaiting approval. Does not block any currently-approved scope (Phase 0).

## Editorial note

The content in `SAS.md` and `sections/` reflects each section's final approved architectural content. The "Principal Product Manager Review" blocks used during drafting and approval are intentionally not reproduced in these files — they were part of the approval *process*, not part of the deliverable specification itself. The review history for each section is preserved in the project conversation record.

## Governing document

Every structural decision in this specification is bound by the PRD's Decision Framework (PRD §53). No section here may contradict the Product Vision, Product Principles, Product Strategy, Core Loop, Phase Structure, or Decision Framework established in the PRD. Any proposed exception is evaluated through that same framework.
