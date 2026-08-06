# Section 27 — Appendices

*Part VI — Appendices · Solution Architecture Specification (SAS) · CareerOS*

## 27.1 Purpose
Part VI closes the SAS with reference material that supports Parts I–V without adding new architectural content: a glossary, a consolidated cross-reference index, and a document map. Per standing instruction, this Part is intentionally concise — the SAS is now considered sufficient for implementation to begin, and documentation effort shifts to being produced alongside code rather than as further standalone architecture Parts.

## 27.2 Glossary of Architectural Terms

| Term | Definition | Defined at |
|---|---|---|
| **Layer** | One of five horizontal architectural strata (Knowledge, Intelligence, Interaction, Presentation, Governance) spanning every module. | §1.4 |
| **Contract** | The complete statement of what a boundary between two layers permits, along five dimensions. | §8.4 |
| **Module** | A named, bounded unit of product capability, defined by which Knowledge Layer entities it exclusively writes. | §13.5 |
| **System Scenario** | A complete, traceable path through the architecture from a trigger to a completion condition, across whichever layers participate. | §17.4 |
| **AI Workflow** | The named, complete sequence connecting a trigger, the agent(s) invoked, the graph entities touched, and the outcome — a Scenario's Intelligence-Layer segment. | §17.5; PRD §27.1 |
| **Agent** | A bounded responsibility holding exclusive write-ownership of specific Knowledge Layer entities. | §4.4; PRD §25 |
| **Capability** | A reusable ability an agent draws on to fulfill its responsibility. | §4.5; PRD §26.2 |
| **Invariant** | One of six product-level guarantees (PA-1–PA-6) every extension must preserve. | §22.5 |
| **Governance Checkpoint** | A condition attached to a contract crossing itself, not a fourth layer a crossing passes through. | §12.2 |
| **Write-ownership** | The rule that many layers/modules/agents may read a given entity, but exactly one may write it. | §3.10, §13.5 |

## 27.3 Consolidated Cross-Reference Index
Every PRD prefix used across this SAS, and where it is primarily grounded:

| Prefix | PRD Meaning | Primary SAS Grounding |
|---|---|---|
| FR- | Functional Requirement | §18–§21 (Part IV scenarios); §19 PRD |
| BR- | Business Rule | §7.3, §21 (Part I–IV, throughout) |
| RAI- | Responsible AI item | §7.4, §29 PRD |
| DPR- | Data Privacy Requirement | §20.3–20.4, §44 PRD; ADR-001 |
| TS- | Trust & Safety item | §7.7, §45 PRD |
| NFR- | Non-Functional Requirement | §7.5, §43 PRD |
| PA- | Platform Assumption | §22.5 (Six Invariants), §47.3 PRD |
| PC- | Platform Constraint | §16.4, §22.4, §47.4 PRD |
| HR- | Handoff Rule | §11.6, §15.4, §25.10 PRD |

## 27.4 Document Map — Complete SAS

| Part | Sections | Title | Status |
|---|---|---|---|
| I | 1–7 | System Architecture | Complete |
| II | 8–12 | Interface & Contract Architecture | Complete |
| III | 13–16 | Module Architecture | Complete |
| IV | 17–21 | Cross-Layer System Scenarios | Complete |
| V | 22–26 | Extensibility & Future-Phase Architecture | Complete |
| VI | 27 | Appendices | Complete |

## 27.5 Relationship to Downstream Documents
Per updated project direction, Database Design, API Specification, Technical Architecture, and AI Architecture are no longer planned as standalone documents produced ahead of implementation. Instead, each is produced in the specific, minimal form implementation actually requires (a schema alongside the code that needs it, a contract alongside the endpoint that implements it, a decision alongside the component it governs), and is kept adjacent to that code rather than compiled into a separate upfront specification. Every such fragment must still trace back to this SAS and the PRD, per §53's Decision Framework — that requirement does not relax, only the delivery form changes.

## 27.6 Closing Statement
The Solution Architecture Specification (Sections 1–27, Parts I–VI) is complete. It has established: five architectural layers (Part I), the contracts between them (Part II), the module as the unit that occupies them (Part III), thirteen real end-to-end scenarios proving the architecture behaves as the PRD promises (Part IV), and a consolidated extensibility reference proving six future-phase concepts already fit without redesign (Part V). One architectural question remains explicitly open (ADR-001) and does not block Phase 0 implementation. This document is now considered sufficient for implementation to begin.

---
*Part of the SAS, Part VI. Master document: [`../SAS.md`](../SAS.md). This completes the CareerOS Solution Architecture Specification (§1–§27, Parts I–VI).*
