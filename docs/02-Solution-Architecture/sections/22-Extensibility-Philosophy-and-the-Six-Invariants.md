# Section 22 — Extensibility Philosophy & the Six Invariants

*Part V — Extensibility & Future-Phase Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 22.1 Purpose
Parts I–IV each state, locally, how their own subject extends without redesign — §3.16 for Knowledge, §4.19 for Intelligence, §5.19 for Interaction, §6.18 for Presentation, §7.16–§7.18 for Governance, §12.6–§12.7 for contracts, §13–§16 for modules. This Part does not add a new extensibility rule; it consolidates all of them into one place (§23) and proves, through worked examples (§24–§25), that they are jointly sufficient to describe every future-phase module and capability the PRD already names.

## 22.2 Relationship to the PRD
Traces principally to §47.3–§47.7 — the six Platform Assumptions (PA-1 through PA-6) and six Platform Constraints (PC-1 through PC-6) — and to §47.5's own statement: "Extensibility elsewhere in the document is a consequence of PA-1 through PA-6 and PC-1 through PC-6 holding, not an independent feature." This Part takes that statement as its governing thesis and demonstrates it architecturally rather than restating it.

## 22.3 Relationship to SAS Parts I–IV
Every consolidated rule in §23 is a citation, not a restatement with new content — each already exists in Part I (per-layer), Part II (per-contract), or Part III (per-module). Every worked example in §24–§25 is an application of §17's scenario discipline (Part IV) to a future-phase case: what layers participate, what crosses, what's governed, traced the same way a Phase 0 scenario is traced. This Part is where all four prior Parts are shown operating together, prospectively rather than only retrospectively.

## 22.4 Why Extensibility Is a Consequence, Not a Feature
An architecture that required a special "extensibility feature" to accommodate new modules would be admitting its base structure wasn't actually sufficient — that new capability required bolting something on rather than merely adding a new instance of what already exists. §47.5 rejects this framing directly. Every extension this Part demonstrates is an addition of new occupants (entities, agents, workflows, screens) to already-existing, unchanged layers (§13.6) — never a structural change to the layers, contracts, or modules already approved. This is why Part V could be written at all without reopening Parts I–IV: nothing here required them to be revised.

## 22.5 The Six Invariants (PA-1–PA-6)
Every worked example in this Part is checked against the same six invariants, each already approved at §47.3 and already the organizing principle behind at least one SAS Part:

| Invariant | PRD Statement | Primary SAS Grounding |
|---|---|---|
| **One Graph** (PA-1) | "There is one Career Knowledge Graph." | §3.1, §3.4–§3.6 — the Knowledge Layer *is* the graph; no module holds a private store (§24.2). |
| **One Coherent Intelligence** (PA-2) | "There is one coherent intelligence." | §4.17 — shared state, mediated-only communication, and invisible seams together produce one experienced intelligence regardless of agent count. |
| **One Interaction Philosophy** (PA-3) | "There is one interaction philosophy." | §5.16, §5.19 — the Interaction Layer's rule set (§5.6) applies identically to every module, present or future, without divergence. |
| **One Design System** (PA-4) | "There is one design system." | §6.14, §6.18 — the Presentation Layer's operating philosophy is applied, never re-invented, per module. |
| **One Source of Truth** (PA-5) | "There is one source of truth." | §3.8, §11.4 — exactly one current value per fact, enforced by exclusive write-ownership, extended to module grain at §13.5. |
| **One Core Loop** (PA-6) | "There is one Core Loop." | §14 (PRD) — the Analyze → Plan → Act → Capture loop; future modules add their own loops (§14's own "additional loops... defined when scoped") without altering or duplicating this one. |

§22.6 explains why these six, and only these six, are the correct check — not an arbitrary list, but the exact set the PRD itself already designates as what future evolution must never weaken (§47.7: "Future implementation may extend the platform but may never weaken one source of truth, one coherent product... or phase sequencing").

## 22.6 Why These Six Invariants Are Sufficient
Each of the five architectural layers (Part I) maps to exactly one invariant it is structurally responsible for preserving — Knowledge → One Graph/One Source of Truth (PA-1/PA-5, the same guarantee viewed from two angles: PA-1 is the *existence* of a single graph, PA-5 is the *consequence* that every fact in it has exactly one current value), Intelligence → One Coherent Intelligence (PA-2), Interaction → One Interaction Philosophy (PA-3), Presentation → One Design System (PA-4). The sixth, One Core Loop (PA-6), is not layer-specific — it is the product-level guarantee that every layer's extension serves the same loop rather than a competing one, which is why §22.5 lists it separately rather than folding it into the Knowledge row. Because every layer already maps to an invariant it structurally guarantees, checking a worked example against all six is equivalent to checking that no layer's core guarantee was weakened by the extension — no seventh invariant is needed because no sixth layer exists to need one.

## 22.7 Scope of This Part's Worked Examples
Six worked examples are demonstrated, matching every future-phase concept the task names and already approved at PRD §16: **Learning Hub** (Phase 1), **Professional Community** (Phase 3, named "Community" in the task), **Jobs & Internships** (Phase 2, student-facing), **Company Self-Service** (Phase 2, the company-facing half of the same module), **Services Marketplace** (Unscheduled, named "Service Provider Marketplace" in the task), and **Future AI Capabilities** (per §26.10's constraints on introducing new capabilities). Each is demonstrated at the grain §17.9 already establishes for a scenario — trigger, participants, layers, operations — adapted here to a static extensibility question (what would this module's architecture look like) rather than a dynamic one (what happens when a user does X).

## 22.8 A Genuine Architectural Finding, Recorded Rather Than Resolved
While producing the Professional Community worked example, this Part identified a real tension between PRD §16's approval of Professional Community's purpose (peer connection around shared goals/field) and PRD §44's DPR-10 ("any cross-user or aggregate data use is out of scope for this document") — the matching mechanism the module's own stated purpose implies requires exactly the cross-user comparison DPR-10 declines to scope. This is not a defect in any SAS Part I–IV rule; every one of them is correctly written for single-user scope. Per this Part's own instruction, it is not silently resolved here. It is recorded as **ADR-001** (`docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md`), and §24's Professional Community worked example is scoped accordingly — modeling only what §16 unambiguously approves (storing an established connection and minimal community activity), explicitly excluding the peer-matching/discovery mechanism from architectural detail pending that ADR's resolution.

## 22.9 Boundary of This Section
Consistent with §1.7, §8.7, §13.10, and §17.11, no statement in this Part names a programming language, framework, API, database, deployment topology, or infrastructure choice. Every extensibility rule and worked example is expressed in terms of entities, agents, workflows, screens, contracts, and governance — never in terms of how any of those would be technically built.

---
*Part of the SAS, Part V. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§1.7, 3.1–3.8, 4.17, 5.16, 5.19, 6.14, 6.18, 11.4, 13.5–13.6; PRD §§14, 16, 44 DPR-8/DPR-10, 47.3–47.7.*
