# Section 2 — High-Level System Architecture

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 2.1 Purpose of the High-Level Architecture
Section 1 established the philosophy and the five-layer model in the abstract. This section gives the complete high-level structural view — what sits at the system's boundary, what the internal components are, and how they relate — so every later SAS section, each of which will take one layer and go deeper, works from the same shared map. This section is deliberately wide, not deep.

## 2.2 Relationship to the PRD
Every claim here traces to a PRD section. This is the wide-angle version of what §16 and §24–§27 already established module-by-module and layer-by-layer; nothing here is a new product decision.

## 2.3 System Boundary
Something sits inside the system boundary if it is one of the five layers defined in §1.4, or an entity, agent, capability, or workflow the PRD already defines as belonging to CareerOS. Something sits outside the boundary if it is a human actor engaging with the system (§2.4), or — per §46 — an external data source that may feed information in but never becomes an authoritative part of the system itself. The boundary is not a technical perimeter; it is the same product/execution line §0.1 already drew for the PRD as a whole, restated structurally.

## 2.4 External Actors
Every actor below is already approved in the PRD, either as an active Phase 0 segment or as a documented future-phase segment — none is introduced here for the first time.

- **Student / Graduate** — the Phase 0 active segment (§8, §9); the only actors currently engaging the system within approved scope (§13).
- **Company (Self-Serve Job Posting)** — the Phase 2 actor (§8), engaging once Jobs & Internships is reached.
- **Service Provider** — the Unscheduled actor (§8, §16 Services Marketplace), engaging once that module is introduced.
- **Future institutional actors** — the existing Phase 4 institutional Universities and Companies rows (§8, §9), engaging once University/Company Admin (§16) is reached.

The architecture accommodates all four structurally, now; phase-gating (§13, §47 PC-1/PC-2) still governs when each actually engages the system.

## 2.5 Internal Architectural Components
The five layers from §1.4, restated as the system's internal components:

- **Presentation Layer** — the surfaces a user perceives.
- **Interaction Layer** — the governed rules of human-AI engagement.
- **Intelligence Layer** — the specialized reasoning acting on the user's data.
- **Knowledge Layer** — the single persistent representation of a user's career state.
- **Governance Layer** — the policy constraints every other layer satisfies simultaneously.

## 2.6 Relationship Between Structural Layers

```
                    ┌─────────────────────────────────────────┐
                    │            Governance Layer                │
                    │   (constrains every layer, at all times)   │
  External Actors   │                                             │
      (§2.4)        │   Presentation Layer                        │
         │          │          ↕                                  │
         └─────────▶│   Interaction Layer                         │
                    │          ↕                                  │
                    │   Intelligence Layer                        │
                    │          ↕                                  │
                    │   Knowledge Layer                           │
                    │                                             │
                    └─────────────────────────────────────────┘
```

Presentation, Interaction, Intelligence, and Knowledge form a sequential chain, each depending on the one before it (§1.5). Governance is not a fifth link — it encloses all four simultaneously, exactly as §21, §29, and §43–§47 apply across the entire PRD rather than at one stage of it.

## 2.7 Information Flow Across the System
An External Actor engages the Presentation Layer, which expresses the Interaction Layer's governed rules, which invoke the Intelligence Layer, which reads and writes the Knowledge Layer; results flow back outward through the same chain until they are visible to the Actor again. This is not abstract: the First Skill-Gap Analysis workflow (§27.3) is one concrete instance — a Student reaches Onboarding (Presentation), the Interaction Layer governs how that moment is experienced (§28.4), the Skill-Gap Analysis Agent (Intelligence) reads Profile and Goal and writes a new Analysis (Knowledge), and the result flows back to the Skill-Gap Analysis screen (Presentation). Every one of §27's eight workflows is a specific, already-approved instance of this same general flow.

## 2.8 Relationship to Platform Modules (§16)
A Module is not a sixth layer. It is a vertical slice cutting across all five layers at once — its own Knowledge entities, its own Intelligence agents where relevant, its own Interaction and Presentation surfaces, all governed by the same Governance layer as every other module. AI Career Center (Phase 0) is the first such slice. Learning Hub, Portfolio, Jobs & Internships, Services Marketplace, Community, and University/Company Admin (§16) are each a future slice occupying the same five-layer structure once scoped — none requires a structure of its own.

## 2.9 Relationship to the Career Knowledge Graph (§24)
The Career Knowledge Graph *is* the Knowledge Layer — a direct, one-to-one mapping, not an analogy. Its entities (Profile, Goal, Skill-Gap Analysis, Roadmap, CV/Profile Feedback, derived signals — §24.3) are what the Knowledge Layer holds; its constraints (§24.7 single source of truth, §24.12 scope discipline and extensibility) are the Knowledge Layer's own architectural constraints, not a separate set.

## 2.10 Relationship to the Agent Ecosystem (§25)
Agents are the primary occupants of the Intelligence Layer. For Phase 0, that means exactly three — Skill-Gap Analysis, Roadmap, and CV/Profile Feedback (§25.3) — each with exclusive write-ownership of one Knowledge Layer entity (§25.8). The Intelligence Layer's boundary rules (single responsibility, shared ground truth, §25.9) are what make it present as "one coherent intelligence" (§1.6, PA-2) at the architectural level, regardless of how many agents occupy it.

## 2.11 Relationship to AI Capabilities (§26)
Capabilities are not a layer or a component of their own — they are the reusable abilities the Intelligence Layer's agents draw on (§26.2), sitting within that layer, shared across whichever agents use them, never a separate architectural tier. The Intelligence Layer's internal richness (Analysis/Comparison, Planning, Critique/Evaluation, Explainability, Confidence Calibration, Change Awareness, Grounding — §26.3) is what capabilities describe; the layer itself remains singular.

## 2.12 Relationship to AI Workflows (§27)
A Workflow is a specific, traced instance of the general flow described in §2.7 — not a separate structural concept. §27's eight named workflows are the complete, already-approved set of paths currently defined through the architecture; a future workflow (introduced under §27.15's constraints) would be a new instance of the same general flow, never a new kind of flow.

## 2.13 Architectural Support for Future Evolution
Because modules are vertical slices (§2.8) through an already-stable five-layer structure, a new module adds new occupants to existing layers — new Knowledge entities, possibly new Intelligence agents, new Interaction and Presentation surfaces — without altering the layer structure itself or requiring change to modules already in place. This is the architectural expression of "progressive completion, not a different system" (§51.7, §52.7), grounded in §24.12, §25.13, §26.10, and §27.15's already-approved extensibility constraints.

This structure already accommodates the following, without any layer requiring redesign when each is eventually realized:

| Concept | Architectural home | PRD grounding |
|---|---|---|
| Multi-agent system | Intelligence Layer | §25 |
| Graph-based orchestration | The trigger/cascade structure already defined across Information Flow (§2.7) and Workflows (§2.12) | §25.10 (handoff rules), §27 |
| Shared state | Knowledge Layer, single source of truth | §24.7 |
| Human-in-the-loop | Interaction Layer, human/AI decision boundary | §23.4, §28 |
| Persistent user state | Knowledge Layer persistence | §24.11 |
| Tool-enabled agents | A capability category the Intelligence Layer already anticipates (§26 catalog structure); not yet populated because no Phase 0 agent has anything external to call | §26.6 |
| Guardrails | Governance Layer | §29 |
| Observability | Governance Layer's transparency requirements are the product-level precondition observability exists to make verifiable | §29 RAI-4, RAI-11; §0.3 |
| Long-term extensibility | Modules as vertical slices over a stable layer structure | §24.12, §25.13, §26.10, §27.15, §47 |

## 2.14 Architectural Integrity Constraints
Every future SAS section must preserve: the five-layer structure (§2.5), the sequential/cross-cutting distinction (§2.6), modules as vertical slices rather than a sixth layer (§2.8), and every Platform Assumption in §47 without exception. No future architectural section may cross into the implementation boundary excluded in §1.7. Any proposed exception is evaluated through the Decision Framework (§53).

---
*Status: Approved. Traces to PRD §§0.1, 5, 8, 9, 13, 14, 16, 21–30, 43–47.*
