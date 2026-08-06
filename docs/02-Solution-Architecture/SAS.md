# CareerOS — Solution Architecture Specification (SAS)

**Status:** Living document · Part I complete (Sections 1–7) · Approved
**Predecessor document:** [Product Requirements Document](../01-Product/PRD.md)
**Scope note:** This document defines the technology-agnostic structural architecture of CareerOS — what the system is structurally, not how it is implemented. It is the bridge between the PRD and later discipline-specific documents (UX/UI Design, Database Design, API Design, Technical Architecture, Development). No programming language, framework, database engine, API protocol, cloud provider, or infrastructure choice is made anywhere in this document. Every architectural statement traces to a specific section of the approved PRD.

Individual section files, identical in content to what appears below, are maintained under [`sections/`](sections/) for granular reference and change tracking.

---

# Part I — System Architecture

Part I establishes the architectural philosophy (Section 1), the complete high-level structural view (Section 2), and a full architectural specification of each of the five structural layers introduced in Section 1: the Knowledge Layer (Section 3), the Intelligence Layer (Section 4), the Interaction Layer (Section 5), the Presentation Layer (Section 6), and the Governance Layer (Section 7).

---

## Section 1 — System Architecture Philosophy

### 1.1 Purpose of the Solution Architecture Specification
The PRD (§§0–59) defines what CareerOS is and why every decision within it was made. It deliberately stops short of defining structure — §0.1 explicitly excludes technical architecture, database design, API contracts, and UI specification from its own scope, stating that those are written separately, later, by the relevant discipline, and must not contradict the PRD without a recorded decision. The Solution Architecture Specification is that separate, later document — the first one written after the PRD, and the one every subsequent discipline-specific document will be built against. Its purpose is to translate the PRD's product decisions into a structural shape precise enough that those later documents have no ambiguity about what they're building toward, while making none of their decisions for them.

### 1.2 Relationship to the PRD
Every structural claim in the SAS must trace to a PRD section — this document introduces no new product decision, only the structural consequences of decisions already made. Where the PRD already described something in structural terms without naming it architecture — the Career Knowledge Graph (§24), the Agent Ecosystem (§25), the Capability Map (§26), AI Workflows (§27), and the Platform Constraints & Assumptions (§47) — the SAS's task is substantially to formalize and connect that material into one coherent architectural picture, not to invent a second one beside it.

### 1.3 What "Architecture" Means at This Level
At the level this document operates, architecture means three things, and only three: identifying the system's structural layers, identifying the boundaries and entities within and between them, and identifying the relationships and dependencies those layers have on one another. It does not mean selecting a technology to realize any of them. That distinction is what separates this document from a Technical Architecture document, and it is maintained deliberately throughout.

### 1.4 The Structural Layers of CareerOS
Five structural layers are already implied by the PRD's own organization, restated here explicitly, as an architectural model, for the first time:

- **Knowledge Layer** — the single, persistent representation of a user's career state (§24, the Career Knowledge Graph).
- **Intelligence Layer** — the specialized reasoning that acts on that representation (§25 agents, §26 capabilities, §27 workflows).
- **Interaction Layer** — the governed pattern by which a human and the Intelligence Layer engage with one another (§23, §28).
- **Presentation Layer** — the surfaces through which the Interaction Layer becomes visible and usable (§22 screens, §31 UX principles, §34 design system).
- **Governance Layer** — the policy constraints every other layer must satisfy simultaneously (§21 Business Rules, §29 Responsible AI, §43–§45 consolidated requirements, §53 Decision Framework).

Interaction and Presentation are kept distinct deliberately: the Interaction Layer is the *rule* of engagement — request-based explanation, honest confidence, unconditional override; the Presentation Layer is the *surface* that rule appears on. A future channel could, in principle, present the same Interaction Layer differently without changing the rule itself — which is exactly why the two are not collapsed into one.

### 1.5 Sequential Layers vs. Cross-Cutting Governance
Four of these layers — Knowledge, Intelligence, Interaction, Presentation — form a sequential chain: each depends on the one before it, and information flows from Knowledge outward to Presentation. The Governance Layer is not a fifth link in that chain. It is a constraint every other layer must satisfy simultaneously, at every point, not a stage information passes through on its way to the user. This mirrors exactly how the PRD itself was structured: Parts II–VI define the sequential product, while §21, §29, §43–§47, and §53 define requirements that apply across all of it at once, never in sequence.

### 1.6 Architectural Philosophy — One System, Structurally Expressed
§47 already states CareerOS's core product assumptions — PA-1 through PA-6: one graph, one coherent intelligence, one interaction philosophy, one design system, one source of truth, one Core Loop. This section states their architectural consequence directly: each maps to exactly one layer in §1.4, and the "one" in each assumption is a structural requirement on that layer, not a stylistic preference.

| Product Assumption (§47) | Architectural Consequence |
|---|---|
| PA-1: One graph | The Knowledge Layer has exactly one instance of itself per user — never a parallel or competing one. |
| PA-2: One coherent intelligence | The Intelligence Layer presents one behavioral surface, regardless of how many agents compose it internally. |
| PA-3: One interaction philosophy | The Interaction Layer applies identically across every module and phase. |
| PA-4: One design system | The Presentation Layer reuses structural patterns rather than duplicating them. |
| PA-5: One source of truth | No layer maintains a value the Knowledge Layer disagrees with. |
| PA-6: One Core Loop | Every layer, at every phase, exists to serve the same loop (§14) — never a competing one. |

### 1.7 Boundary of This Document
Consistent with the instruction governing this specification, the SAS does not select or discuss programming languages, frameworks, cloud providers, databases, APIs, deployment models, authentication technologies, infrastructure, security implementation, or performance engineering. Where a later document — Database Design, API Design, Technical Architecture — must make one of these choices, this document's job is to have already made that choice unambiguous in shape, never to have made it directly.

### 1.8 Relationship to the Decision Framework (§53)
Every structural decision in the SAS is evaluated against §53.7's hierarchy — Vision, Principles, Strategy, Core Loop, Phase Structure, Features, Implementation — exactly as any PRD-level decision was. The SAS does not introduce a parallel governance mechanism; it operates entirely within the one the PRD already established. A structural choice that would require violating a layer's assumption (§1.6) fails this test regardless of how convenient it might make a later implementation decision.

### 1.9 How the SAS Bridges to Later Design Stages
The chain — PRD → UX/UI Design → Database Design → API Design → Technical Architecture → Development — depends on each stage inheriting an unambiguous structural shape from the one before it. The test for whether a given SAS section is doing its job is not whether it answers every question a later stage will have; it is whether that discipline, reading this document, would need to ask *what* the system's shape is, rather than decide *how* to realize it. A UX designer should be able to identify every layer in §1.4 without inventing one; a database designer should be able to identify the Knowledge Layer's boundary without inventing what belongs inside it. §24 through §27 already supply that detail for the Knowledge and Intelligence Layers; later SAS sections supply it for the rest.

### 1.10 Constraints for Future SAS Sections
Every future SAS section must trace to a specific PRD section, must respect the five-layer structure and the sequential/cross-cutting distinction established here, must preserve every PA in §47 without exception, and must never cross into the boundary excluded in §1.7. Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 2 — High-Level System Architecture

### 2.1 Purpose of the High-Level Architecture
Section 1 established the philosophy and the five-layer model in the abstract. This section gives the complete high-level structural view — what sits at the system's boundary, what the internal components are, and how they relate — so every later SAS section, each of which will take one layer and go deeper, works from the same shared map. This section is deliberately wide, not deep.

### 2.2 Relationship to the PRD
Every claim here traces to a PRD section. This is the wide-angle version of what §16 and §24–§27 already established module-by-module and layer-by-layer; nothing here is a new product decision.

### 2.3 System Boundary
Something sits inside the system boundary if it is one of the five layers defined in §1.4, or an entity, agent, capability, or workflow the PRD already defines as belonging to CareerOS. Something sits outside the boundary if it is a human actor engaging with the system (§2.4), or — per §46 — an external data source that may feed information in but never becomes an authoritative part of the system itself. The boundary is not a technical perimeter; it is the same product/execution line §0.1 already drew for the PRD as a whole, restated structurally.

### 2.4 External Actors
Every actor below is already approved in the PRD, either as an active Phase 0 segment or as a documented future-phase segment — none is introduced here for the first time.

- **Student / Graduate** — the Phase 0 active segment (§8, §9); the only actors currently engaging the system within approved scope (§13).
- **Company (Self-Serve Job Posting)** — the Phase 2 actor (§8), engaging once Jobs & Internships is reached.
- **Service Provider** — the Unscheduled actor (§8, §16 Services Marketplace), engaging once that module is introduced.
- **Future institutional actors** — the existing Phase 4 institutional Universities and Companies rows (§8, §9), engaging once University/Company Admin (§16) is reached.

The architecture accommodates all four structurally, now; phase-gating (§13, §47 PC-1/PC-2) still governs when each actually engages the system.

### 2.5 Internal Architectural Components
The five layers from §1.4, restated as the system's internal components:

- **Presentation Layer** — the surfaces a user perceives.
- **Interaction Layer** — the governed rules of human-AI engagement.
- **Intelligence Layer** — the specialized reasoning acting on the user's data.
- **Knowledge Layer** — the single persistent representation of a user's career state.
- **Governance Layer** — the policy constraints every other layer satisfies simultaneously.

### 2.6 Relationship Between Structural Layers

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

### 2.7 Information Flow Across the System
An External Actor engages the Presentation Layer, which expresses the Interaction Layer's governed rules, which invoke the Intelligence Layer, which reads and writes the Knowledge Layer; results flow back outward through the same chain until they are visible to the Actor again. This is not abstract: the First Skill-Gap Analysis workflow (§27.3) is one concrete instance — a Student reaches Onboarding (Presentation), the Interaction Layer governs how that moment is experienced (§28.4), the Skill-Gap Analysis Agent (Intelligence) reads Profile and Goal and writes a new Analysis (Knowledge), and the result flows back to the Skill-Gap Analysis screen (Presentation). Every one of §27's eight workflows is a specific, already-approved instance of this same general flow.

### 2.8 Relationship to Platform Modules (§16)
A Module is not a sixth layer. It is a vertical slice cutting across all five layers at once — its own Knowledge entities, its own Intelligence agents where relevant, its own Interaction and Presentation surfaces, all governed by the same Governance layer as every other module. AI Career Center (Phase 0) is the first such slice. Learning Hub, Portfolio, Jobs & Internships, Services Marketplace, Community, and University/Company Admin (§16) are each a future slice occupying the same five-layer structure once scoped — none requires a structure of its own.

### 2.9 Relationship to the Career Knowledge Graph (§24)
The Career Knowledge Graph *is* the Knowledge Layer — a direct, one-to-one mapping, not an analogy. Its entities (Profile, Goal, Skill-Gap Analysis, Roadmap, CV/Profile Feedback, derived signals — §24.3) are what the Knowledge Layer holds; its constraints (§24.7 single source of truth, §24.12 scope discipline and extensibility) are the Knowledge Layer's own architectural constraints, not a separate set.

### 2.10 Relationship to the Agent Ecosystem (§25)
Agents are the primary occupants of the Intelligence Layer. For Phase 0, that means exactly three — Skill-Gap Analysis, Roadmap, and CV/Profile Feedback (§25.3) — each with exclusive write-ownership of one Knowledge Layer entity (§25.8). The Intelligence Layer's boundary rules (single responsibility, shared ground truth, §25.9) are what make it present as "one coherent intelligence" (§1.6, PA-2) at the architectural level, regardless of how many agents occupy it.

### 2.11 Relationship to AI Capabilities (§26)
Capabilities are not a layer or a component of their own — they are the reusable abilities the Intelligence Layer's agents draw on (§26.2), sitting within that layer, shared across whichever agents use them, never a separate architectural tier. The Intelligence Layer's internal richness (Analysis/Comparison, Planning, Critique/Evaluation, Explainability, Confidence Calibration, Change Awareness, Grounding — §26.3) is what capabilities describe; the layer itself remains singular.

### 2.12 Relationship to AI Workflows (§27)
A Workflow is a specific, traced instance of the general flow described in §2.7 — not a separate structural concept. §27's eight named workflows are the complete, already-approved set of paths currently defined through the architecture; a future workflow (introduced under §27.15's constraints) would be a new instance of the same general flow, never a new kind of flow.

### 2.13 Architectural Support for Future Evolution
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

### 2.14 Architectural Integrity Constraints
Every future SAS section must preserve: the five-layer structure (§2.5), the sequential/cross-cutting distinction (§2.6), modules as vertical slices rather than a sixth layer (§2.8), and every Platform Assumption in §47 without exception. No future architectural section may cross into the implementation boundary excluded in §1.7. Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 3 — Knowledge Layer Architecture

### 3.1 Purpose of the Knowledge Layer
The Knowledge Layer realizes §1.4's definition and §1.6's PA-1 (one graph). Its architectural responsibility is singular: hold the one authoritative representation of a user's career state that every other layer depends on. Nothing in Interaction, Intelligence, Presentation, or Governance reasons, presents, or constrains anything without ultimately depending on what this layer holds.

### 3.2 Relationship to the PRD
Every claim in this section traces to the PRD — primarily §24, with supporting material from §25 (ownership), §26 (grounding), §27 (workflow read/write patterns), §30 (memory), §43–§45 (consolidated requirements), and §47 (Platform Assumptions). This section formalizes what those sections already established; it introduces nothing new.

### 3.3 Relationship to the Career Knowledge Graph
The Knowledge Layer *is* the Career Knowledge Graph — not an analogy, not something built on top of it. §24.1's definition, §24.3's entity catalog, and §24.12's constraints are this layer's architectural specification in full.

### 3.4 What Belongs Inside the Knowledge Layer
Exactly, and only, §24.3's entities: Profile, Goal (current and history), Skill-Gap Analysis (versioned), Roadmap (versioned, composed of Items), CV/Profile Feedback Rounds, and the derived signals computed from them.

### 3.5 What Explicitly Does Not Belong Inside It
- **Account-level data** — identity, billing/subscription state, notification preferences — exists alongside the Knowledge Layer, never inside it (§24.1, §24.12).
- **Progress** is not a stored entity — it is a read pattern across the entities in §3.4, exactly as §24.3 already establishes.
- **An agent's transient reasoning** during a single invocation does not belong here — that is Short-Term Memory (§30.4), and it enters the Knowledge Layer only if and when an agent's defined write commits it (§30.12).

### 3.6 Architectural Boundaries
An entity is inside the Knowledge Layer if and only if it is one of §3.4's defined entities, or a future entity added under §3.16's extensibility rule. This boundary is definitional, not physical — it is §24.12's scope discipline stated as an architectural test rather than a product constraint.

### 3.7 Knowledge Ownership
The user owns the data the Knowledge Layer holds (§21 BR-DATA-1, §30.6); the layer holds it in service of that user and never repurposes it across users by default (§23.3, §23.8, §29 RAI-13). This is a distinct concept from write-ownership (§3.10) — this section addresses who the data belongs to; §3.10 addresses which agent is permitted to write it.

### 3.8 Single Source of Truth
For any fact about a user's career state, exactly one current value exists at any time (§24.7, §47 PA-5). This is what makes every other layer's behavior deterministic: the Intelligence Layer never reconciles disagreeing inputs, and the Presentation Layer never chooses between two candidate values. Single source of truth is not a data-integrity nicety — it is what keeps the rest of the architecture simple (§0.4 Principle 7), by removing an entire category of problem the other four layers would otherwise have to solve independently.

### 3.9 Entity Relationships

```
Profile ──┐
          ├──▶ Skill-Gap Analysis ──▶ Roadmap ──▶ Roadmap Items
Goal ─────┘         (versioned)      (versioned)

CV/Profile Feedback Round
  (evaluated against Goal directly — not derived from Analysis or Roadmap)

Derived Signals (Readiness, Career Score, Career Health)
  (read across all of the above — do not feed back into them)
```

This is §24.4's relationship structure, restated as the Knowledge Layer's formal internal shape. Profile and Goal are inputs to Analysis; Analysis produces Roadmap; Roadmap Items carry agent-written content alongside user-controlled status (§25.5). CV/Profile Feedback stands apart, evaluated against Goal directly. Derived signals are read-only computations over the rest.

### 3.10 Read vs. Write Ownership
Many agents may read a given entity; exactly one agent writes it (§25.8). This is not merely a policy — it is the architectural mechanism that makes "no duplicate state" and "no competing knowledge store" structurally true rather than aspirationally true. §47 PC-5 ("no parallel data ownership exists anywhere in the system") is enforced precisely because this rule leaves no entity with two possible writers to disagree.

### 3.11 Shared State Across Agents
Every occupant of the Intelligence Layer reads the same Knowledge Layer; none maintains a private copy (§25.9). This is the architectural precondition for coherent multi-agent reasoning: because there is only one place any agent's reasoning can be grounded, disagreement between agents about what is currently true is not merely discouraged — it is structurally impossible, since there is no second record for them to disagree against.

### 3.12 Why Intelligence Can Never Become the Source of Truth
The Intelligence Layer's entire architectural role (§25) is to read and, for entities it owns, write the Knowledge Layer — never to hold an independent record that the Knowledge Layer would need to reconcile against. If an agent's reasoning were itself treated as authoritative apart from what it writes back, §3.8's single-source-of-truth guarantee would already be broken: two records of the same fact would exist, one in the graph and one in an agent's working state, with no rule for which governs. This is not a minor technical risk — it is the precise mechanism by which §4's root diagnosis of existing tools (fragmentation across systems each holding a partial, disagreeing picture of the user) would re-enter CareerOS internally. The Knowledge Layer is the source of truth *because* nothing else is permitted to be.

### 3.13 Relationship to Memory
§30.5 already establishes that Long-Term Memory *is* the Career Knowledge Graph — not a companion structure beside it. §30.4 establishes that Short-Term Memory is the context an agent holds for one Intelligence Layer invocation, discarded unless explicitly committed (§30.12: "what isn't written doesn't persist"). This is the architectural answer to why Memory is not a sixth layer: Long-Term Memory is fully absorbed into the Knowledge Layer, and Short-Term Memory is fully absorbed into the Intelligence Layer's transient working state. Introducing a separate Memory layer would duplicate a concept that already has two precise homes.

### 3.14 Relationship to AI Workflows
Every workflow's Reads and Writes columns (§27.3–§27.10) are Knowledge Layer operations by definition. The Knowledge Layer is also what makes the Handoff Rules (§25.10) enforceable in the first place — "act on current input, never a stale one" (HR-2) is only a meaningful instruction because §3.8 guarantees there is exactly one current value to check against.

### 3.15 Relationship to Future Modules
Consistent with §2.8's "modules as vertical slices," a future module — Learning Hub, Jobs & Internships, Services Marketplace, or any other named in §16 — adds new entities to this same Knowledge Layer. It never introduces a second Knowledge Layer or a competing store (§24.8, §24.12).

### 3.16 Extensibility Without Redesign
A new entity can reference existing ones — a future Learning Hub entity reading Skill-Gap Analysis, for instance — without those existing entities changing, because read access is already unrestricted (§3.10) while write access remains exclusively scoped to whichever new agent or module owns the new entity. Extensibility is not a separate property engineered on top of this layer; it is a direct consequence of §3.9's relationships already being additive and §3.10's ownership rule already being exclusive per entity, exactly as §24.12 and §47's NFR-SCALE-1 already state.

### 3.17 Constraints
- Exactly one Knowledge Layer exists.
- Every module reads from it; no module maintains a private store (§24.2, PA-1).
- Every agent reasons from it; no agent holds private long-term memory (§25.9, §30.11).
- Every workflow's reads and writes are Knowledge Layer operations (§27, §3.14).
- No duplicate or competing knowledge store may ever exist (§24.7, PC-5).
- Future entities extend it without redesign (§3.16).
- Future modules extend it without replacing it (§3.15).
- The Intelligence Layer never becomes a source of truth (§3.12).
- Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 4 — Intelligence Layer Architecture

### 4.1 Purpose of the Intelligence Layer
The Intelligence Layer realizes §1.4's definition and §1.6's PA-2 (one coherent intelligence). Its responsibility is the specialized reasoning that acts on the Knowledge Layer, producing the artifacts and recommendations the rest of the system presents and governs. It exists because the Knowledge Layer, alone, is inert — it can hold a user's career state, but the promise that state implies, a system that works *for* the user (§1), requires something to do the working. The Intelligence Layer is that something.

### 4.2 Relationship to the PRD
Traces to §25 (Agent Ecosystem), §26 (Capability Map), §27 (AI Workflows), §30 (Memory — the short-term portion), §47 (Platform Assumptions), §53 (Decision Framework). This section formalizes what those sections already established.

### 4.3 Relationship to the Knowledge Layer
The Intelligence Layer reads from, and for entities it owns writes to, the Knowledge Layer — and does nothing else with respect to state. §3.12 already establishes it may never become an independent source of truth; every subsequent rule in this section is built on that constraint holding.

### 4.4 Relationship to Agents
Agents (§25) are the Intelligence Layer's primary occupants. For Phase 0, exactly three: Skill-Gap Analysis, Roadmap, and CV/Profile Feedback (§25.3), each with exclusive write-ownership of one Knowledge Layer entity (§25.8, §3.10).

### 4.5 Relationship to Capabilities — Why Capabilities Are Not Agents
An Agent is a bounded responsibility holding exclusive write-ownership; a Capability is a reusable ability an agent draws on to fulfill that responsibility (§26.2). A capability holds neither a responsibility nor any write-ownership, so it cannot be an agent by definition, not merely by convention. Explainability, Confidence Calibration, and Grounding are shared across all three Phase 0 agents (§26.4–26.5) precisely because they are capabilities: if they were agents, each would need an entity to own, and none exists for them to own.

### 4.6 Relationship to AI Workflows — Why Workflows Are Not Agents
A Workflow (§27) is a named path from a trigger to an outcome — it describes a sequence, not a responsibility. An agent is defined by what it owns; a workflow is defined by what it connects. A workflow can span zero agents entirely — Dashboard Next Action (§27.9) and Change Explanation (§27.10) invoke none — which is only coherent because a workflow is a categorically different kind of thing from an agent, not a variant of one.

### 4.7 Relationship to Memory
What an Intelligence Layer occupant holds during a single invocation is Short-Term Memory (§30.4) — entirely internal to that momentary operation, never itself part of the architecture's persistent state. Nothing about an agent's reasoning survives past its own invocation except what it explicitly writes to the Knowledge Layer (§30.12).

### 4.8 Relationship to Human Interaction
Every Intelligence Layer output is advisory (§23.4, §29 RAI-1); the Interaction Layer is where a human reviews, questions, and acts on it. This is the Intelligence Layer's own constraint, not one imposed on it from outside — an agent capable of acting without this boundary would be architecturally indistinguishable from unsupervised execution, which §23.4 already forecloses entirely.

### 4.9 Agent Responsibilities and Boundaries
Each agent's boundary is exactly the entity it writes plus whatever it is permitted to read (§25.4–25.6). No agent's boundary overlaps another's write-ownership (§25.8) — this is enumerated in full in §3.9 and §3.10 and is not restated here beyond this reference.

### 4.10 Agent Communication — Mediated, Never Direct
Agents do not communicate with one another directly; no channel exists between them. All coordination happens through the Knowledge Layer — one agent writes an entity, and a workflow's trigger condition (§27) determines whether and when another agent subsequently reads it. This is deliberate, not a gap: a direct channel would let one agent "know" something the Knowledge Layer doesn't yet, or never will, reflect — breaking §24.7's single source of truth from the inside. Mediated-only communication is what keeps §4.11's shared-state guarantee intact under multi-agent operation.

### 4.11 Shared State
Every agent's reasoning is grounded in the same Knowledge Layer; none holds a private, competing record (§25.9). This is what "shared ground truth" means architecturally, and it is the precondition for §4.10's communication rule making sense at all.

### 4.12 Read/Write Rules
Many agents may read a given entity; exactly one writes it (§25.8, §3.10). Applied here, this is what prevents two agents from ever producing conflicting outputs about the same fact (§25.12).

### 4.13 Agent Coordination — Why Coordination Is Not Another Agent
Coordination between agents is not a reasoning task requiring judgment — it is a fixed property of how a workflow is specified (§27's trigger and cascade conditions, §25.10's Handoff Rules). Whether the Roadmap Agent runs after the Skill-Gap Analysis Agent is not decided dynamically by an interpreting intelligence each time; it is determined by an already-approved rule (§21 BR-ROAD-2). Because the decision is fixed rather than judged, it does not meet §25.3's actual definition of a responsibility — introducing a coordinating agent would assign it a job that isn't a reasoning job, and would also require a direct channel to the agents it coordinated, violating §4.10.

### 4.14 Agent Delegation
The handoff mechanism (§25.10, §4.13) is the current expression of what a future explicit delegation pattern would extend. Today, delegation is workflow-defined sequencing: one agent's output becomes another's input because a rule says so, not because the first agent requested it. This is structurally compatible with a future pattern where an agent's own reasoning determines that another agent's capability is needed — such a pattern would still route through the Knowledge Layer (§4.10) and would still require the receiving agent to satisfy its own boundaries (§4.9). It extends the existing mechanism; it does not require a different one.

### 4.15 Reasoning Ownership
Each agent owns the reasoning behind its own output, and no one else's (§25.3, §25.8). No agent second-guesses or silently overrides another's conclusion; where an output built on another's work needs to change because that input changed, this is handled through regeneration (§27.5–27.6), never through one agent overruling another directly.

### 4.16 Reasoning Patterns as Occupants, Not Layers
Analysis/Comparison, Planning, Critique/Evaluation, and the shared Explainability, Confidence Calibration, Change Awareness, and Grounding (§26.3) are occupants within the Intelligence Layer, not layers of their own. A reasoning pattern never becomes a layer because it has no boundary of its own to defend — it exists only in service of whichever agent's responsibility it supports, exactly as §26.2 already distinguishes an agent (a *who*) from a capability (a *how-able*).

### 4.17 One Coherent Intelligence
Despite holding multiple agents, the Intelligence Layer presents as one coherent intelligence (§25.9, §1.6 PA-2) through three guarantees operating together: shared state (§4.11) means no agent can contradict another about a fact; mediated-only communication (§4.10) means there is no hidden coordination the user could be inconsistently exposed to; invisible seams (§25.9) means the user experiences a result, not a sequence of named participants. Coherence is a structural consequence of how this layer is built, not a presentation-level polish added afterward.

### 4.18 Failure Handling (Architectural)
When an agent cannot produce a reliable output, it says so rather than writing a plausible-but-wrong result (§23.10, §21 BR-AI-5, §29 RAI-7). Architecturally, this means a failed operation performs no write at all — the Knowledge Layer's prior valid state remains current, untouched (§21 BR-ROAD-3, §29 RAI-8), and §3.8's single-source-of-truth guarantee holds through failure exactly as it does through success. This is also what makes retry safe to introduce later without redesign: because a failed attempt is guaranteed to leave no partial write behind, re-attempting an operation can never compound onto corrupted state.

### 4.19 Future Agent Extensibility
A future agent (§25.13) must satisfy every constraint already established here — single responsibility, exclusive write-ownership limited to what it's assigned, mediated-only communication, advisory-only output — before it may be added. Because coordination is workflow-defined rather than agent-defined (§4.13), adding a new agent means adding new trigger conditions to §27's catalog, not modifying how existing agents already coordinate.

**Agentic AI compatibility, stated honestly:**

| Concept | Architectural home | Status |
|---|---|---|
| Multi-Agent Systems | §4.4, §4.17 | Present (three agents) |
| Graph-based orchestration | §4.13's trigger/cascade rules, §27 | Present |
| Shared State | §4.11 | Present |
| Planning | §26.3 Planning capability | Present (Roadmap Agent) |
| Conditional execution | §27.5–27.7's cascade conditions | Present |
| Human-in-the-loop | §4.8, §23.4, §28 | Present |
| Long-running workflows | §27's structure, §3.8's persistence | Present |
| Delegation | §4.14's handoff mechanism | Present in current, workflow-defined form; extensible to agent-initiated form |
| Tool-enabled agents | Capability catalog slot (§26, §26.6) | Anticipated, not yet populated — no Phase 0 agent has anything external to call |
| Reflection | Capability catalog slot (§26.6) | Anticipated, not yet populated — failure-honesty currently met by Confidence Calibration alone |
| Retry | §4.18's no-partial-write guarantee | Precondition present; retry itself unscoped |
| Future tools / future agents | §4.19, §25.13, §26.10 | Anticipated by extensibility rule |

### 4.20 Constraints
- Exactly one Intelligence Layer exists, however many agents occupy it.
- No agent communicates with another directly; all coordination is mediated through the Knowledge Layer (§4.10).
- No two agents may write the same entity (§4.12).
- No capability, workflow, or coordination mechanism may become an agent without meeting §25.3's actual definition of one (§4.5, §4.6, §4.13).
- Every output remains advisory; the Intelligence Layer never bypasses the Interaction Layer (§4.8).
- Failure never leaves a partial write (§4.18).
- Future agents extend this structure without requiring existing agents to change (§4.19).
- Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 5 — Interaction Layer Architecture

### 5.1 Purpose of the Interaction Layer
The Interaction Layer realizes §1.4's definition and §1.6's PA-3 (one interaction philosophy). Its responsibility: govern how a human engages with whatever the Intelligence Layer produces, applying the same rules regardless of which agent, capability, or workflow produced the output. It exists because reasoning alone does not guarantee trustworthy engagement — §23.11 already establishes that trust depends on how an output is delivered and how much control the user retains, not only on whether the output itself is correct.

### 5.2 Relationship to the PRD
Traces to §23 (AI Product Philosophy), §28 (Human-AI Interaction Model), §29 (Responsible AI), the interaction-relevant portions of §31, §45 (Trust & Safety), §47, and §53.

### 5.3 Relationship to the Intelligence Layer — Why Interaction Is Not Intelligence
The Intelligence Layer's job is to produce an output; the Interaction Layer's job is to govern how that output is engaged with by a human — different concerns applied to different objects. §28.11 requires this governance to apply identically across every Intelligence Layer occupant, regardless of which agent or capability produced a given output. Folding interaction rules into Intelligence would require each of the three agents to separately implement explainability, confidence presentation, and advisory framing — risking exactly the drift §25.9's "invisible seams" and §28.11's "one interaction pattern" exist to prevent. Interaction is separate specifically because it must normalize across an Intelligence Layer that is, by design, not uniform (§26.4 — different agents use different capabilities).

### 5.4 Relationship to the Presentation Layer — Why Interaction Is Not Presentation
Interaction defines the rule of engagement; Presentation defines the surface that rule appears on (§1.4). The rule — explanation available on request, confidence shown at the point of output, override always possible — governs *whether* trust can be earned; the surface governs only *where* that governance becomes visible. Collapsing the two would make it impossible to reason about interaction consistency (§5.16) independently of any particular surface, exactly the independence §31.7 and §33.13 already require when they hold UX and voice consistent regardless of which module a user is in.

### 5.5 Relationship to Human Users
The Interaction Layer is the only layer with a human user as one of its two direct participants. The Intelligence Layer engages the Knowledge Layer; the Presentation Layer renders for a human but does not itself decide how; the Governance Layer constrains everything without directly engaging anyone. The Interaction Layer is where CareerOS and a person actually meet.

### 5.6 What Belongs Inside the Interaction Layer
The rules already established in §28: structured, not conversational, interaction (§28.2); the human/AI responsibility split (§28.3); the user-initiated-or-visible-consequence rule (§28.4); the visibility guarantee (§28.5); the explanation request pattern (§28.6, §28.8); confidence presentation (§28.7); user control and override (§28.9); the advisory framing of every recommendation (§28.10); consistency across agents (§28.11); error and uncertainty communication (§28.12); and the trust-building behaviors that follow from all of these together (§28.13).

### 5.7 What Never Belongs Inside It
Reasoning itself (Intelligence Layer, §4). Visual or structural rendering (Presentation Layer, out of scope for this SAS). Data persistence (Knowledge Layer, §3). Policy authorship — the Interaction Layer applies Governance Layer rules (§21, §29), it does not write them.

### 5.8 Human–AI Collaboration
Within any single interaction, the system's part is to present an artifact and, on request, its reasoning; the human's part is to read, question, act, or override (§23.4, §28.3). The Interaction Layer is the architectural embodiment of this split — the boundary at which the system's turn ends and the human's begins.

### 5.9 The Human Decision Boundary
The system owns analysis, synthesis, and recommendation; the human owns judgment and action (§23.4). This is enforced architecturally at the Interaction Layer specifically: every Intelligence Layer output must pass through it before having any real-world consequence, and its defining rule is that this passage never itself constitutes the consequence.

### 5.10 User Control
A human may act against or independent of any Intelligence Layer output at any time, without first accepting or acknowledging it (§28.9). This is not a Presentation Layer affordance that happens to exist — it is an Interaction Layer guarantee that any Presentation Layer must express, not one it independently decides to offer.

### 5.11 Explainability — Why It Lives Here, Not in Intelligence
Explainability is a capability the Intelligence Layer's agents possess (§26.3) — but the rule that an explanation must be available, and how it is requested, is an Interaction Layer concern. The Intelligence Layer is responsible for an explanation being *possible*, grounded in real data (§26.3, Grounding); the Interaction Layer is responsible for that explanation being *accessible* — on request, or inline for the single highest-stakes case (§28.6). An agent that could explain itself but wasn't required to make that explanation reachable would satisfy Intelligence's requirement while failing Interaction's entirely — which is exactly why the two sit in different layers.

### 5.12 Confidence Communication
Confidence Calibration is likewise an Intelligence Layer capability (§26.3); its presentation — at the point of output, never behind a separate action (§28.7) — is an Interaction Layer rule. The same split as §5.11: Intelligence makes confidence *true*; Interaction makes it *seen*.

### 5.13 Failure Communication
When the Intelligence Layer cannot produce a reliable output (§4.18), the Interaction Layer is responsible for communicating that failure specifically — never as a generic error, and never in a way a human could mistake for a finding about themselves (§28.12, §3 "Guidance, not gatekeeping"). Failure communication is an Interaction Layer responsibility precisely because the Intelligence Layer's job ends at declining to produce an unreliable output — someone still has to tell the human what happened, and that telling is governed here.

### 5.14 Transparency
Every Intelligence Layer-initiated change is visible immediately or via notification and history, never silent (§29 RAI-11). This is enforced at the Interaction Layer, since visibility is fundamentally about what a human can perceive — this layer's domain.

### 5.15 Trust Preservation
§23.11, §28.13, §45.3, and §45.7 each independently establish that trust depends on explainability, honest confidence, full visibility, and consistent behavior across the whole system. The Interaction Layer is where all four converge into what a human actually experiences — it is the layer trust is preserved or lost at, even though the underlying guarantees originate across §23, §26, and §29.

### 5.16 Interaction Consistency Across Modules
§28.11 and §31.7 require the same interaction pattern regardless of module. Architecturally, the Interaction Layer's rule set (§5.6) applies uniformly to every Intelligence Layer occupant, present or future, and every Presentation Layer surface built on top of it — a future module's interaction never diverges from §5.6, since divergence would violate PA-3 (§1.6) directly.

### 5.17 Human-in-the-Loop as an Emergent Property
Human-in-the-loop is not a separate feature added to this architecture — it is what results from correctly positioning a layer with §5.6's rule set between Intelligence and Presentation. Because every Intelligence Layer output must pass through a layer whose defining rule is "advisory, reviewable, overridable, before any consequence" (§5.9, §5.10), human oversight is structurally guaranteed by the layer's position and rules, not by a checklist item added to each agent individually.

### 5.18 Relationship to AI Workflows
Each workflow's Intelligence Layer steps — its reads and writes (§27.3–27.10) — are governed by §4. What happens next: how the result is explained, and whether it's visible immediately or via notification, is governed here.

### 5.19 Relationship to Future Modules and Extensibility
A future module (§16) introduces new Intelligence Layer occupants and new Presentation Layer surfaces, but never a new interaction philosophy — it reuses §5.6's rule set exactly, consistent with §31.14's and §33.18's constraints on future UX patterns and voice evolution. This is what lets the Interaction Layer scale to new modules without redesign: its content (§5.6) doesn't grow per module, only the set of outputs it's applied to.

**Agentic AI compatibility, stated honestly:**

| Concept | Architectural home | Status |
|---|---|---|
| Human approval | §5.9, §5.10 | Present |
| Human override | §5.10, §28.9 | Present |
| Clarification requests | §23.2 (ask for more information rather than proceed), §21 BR-GAP-2 | Present |
| Explainability | §5.11 | Present |
| Confidence communication | §5.12 | Present |
| Safe failure | §5.13, §4.18 | Present |
| Long-running interactions | §24.11, §30.13 persistence; §27 workflow structure | Present |
| Multi-agent systems appearing as one assistant | §5.16, §4.17 | Present |
| Future agent expansion without changing interaction behavior | §5.19 | Present |
| Human interruption | §5.10's override rule (redirect at any time) | Present in this form; not literal mid-execution interruption of a long-running process, which no Phase 0 workflow describes |
| User feedback (rating/correcting a specific output) | Request-based interaction pattern (§5.6) | Anticipated as a compatible extension; not a currently defined pattern |

### 5.20 Constraints
- Exactly one Interaction Layer, applied identically regardless of which agent, module, or phase produced a given output.
- No Intelligence Layer output reaches a human without passing through this layer's rules first.
- No output may be presented as a decision already made.
- Explanation, confidence, and failure communication follow §5.11–§5.13 without exception.
- No future module may introduce a divergent interaction pattern.
- Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 6 — Presentation Layer Architecture

### 6.1 Purpose of the Presentation Layer
The Presentation Layer realizes §1.4's definition and §1.6's PA-4 (one design system). Its responsibility: give perceivable form to whatever the Interaction Layer already governs, so a human can see, read, and act on what the system has produced. It has no responsibility beyond this — it does not decide what to show, only how the already-decided thing is made visible.

### 6.2 Relationship to the PRD
Traces to §22 (Screen Inventory), §31 (UX Principles), §33 (Brand Identity & Voice), §34 (Design System Direction), §37 (Accessibility & Inclusivity Standards), §16 (module structure), §47, §53.

### 6.3 Relationship to the Interaction Layer — Why Presentation Is Not Interaction
Interaction defines the rule of engagement — what must be explainable, when confidence must be shown, how control is guaranteed (§5.6). Presentation is the surface that rule takes shape on. A rule and its surface are architecturally distinct because a rule is stable across every place it applies, while a surface can vary — a future channel (§6.17) could render the same rule differently without the rule itself changing. If Presentation and Interaction were one layer, that independence would be lost: consistency (§5.16, §31.7) would have to be re-verified per surface rather than guaranteed once, at the rule level, and inherited by every surface built afterward.

### 6.4 Relationship to Screens (§22)
Every Phase 0 screen (§22 #1–16) is a Presentation Layer instance — each already carries a purpose, primary actions, and empty/loading/error states that are themselves expressions of the Interaction Layer's rules (§5.6, §5.13), not decisions made independently at the screen level. The Presentation Layer is not "screens" as a category — it is the architectural function screens exist to fulfill.

### 6.5 Relationship to UX Principles (§31)
§31's principles — simplicity (§31.3), progressive disclosure (§31.4), visibility of system state (§31.8), error communication (§31.9), trust through interaction (§31.10), continuity (§31.11), accessibility (§31.12), scalability (§31.13) — are the Presentation Layer's own operating principles, not imposed on it from outside. They are what this layer is architecturally required to satisfy at every surface it produces.

### 6.6 Relationship to the Design System (§34)
§34.6 establishes the design system as this architecture's visual counterpart to the Career Knowledge Graph, the Agent Ecosystem, Capability reuse, and Workflow consistency — one shared language, reused rather than reinvented per screen. The Presentation Layer is where that language is deployed; the Design System (§34) is the discipline governing how it's deployed consistently.

### 6.7 Relationship to Voice & Content (§33)
Every word the Presentation Layer displays follows §33's voice principles — plain, direct, never commanding (§33.10), calibrated to the same confidence the Interaction Layer requires (§33.11, §5.12). Voice is not a Presentation Layer decision; it is a constraint this layer inherits and must express faithfully, exactly as §33.14 already establishes for AI-generated content specifically.

### 6.8 Relationship to Accessibility (§37)
§37.6 establishes that accessibility applies equally to every touchpoint, and that the product's overall accessibility is gated by its weakest surface, not averaged across surfaces. This makes accessibility a Presentation Layer obligation at every instance it produces — no surface is exempt, since one inaccessible surface is sufficient to fail the standard for the product as a whole.

### 6.9 Architectural Boundaries — What Belongs Inside Presentation
Only the rendering of content, hierarchy, and state already determined by the Interaction Layer (§5.6), the Knowledge Layer (§3.4), and the Intelligence Layer (§4). Presentation determines *how* something is shown — its structure, hierarchy, and accessibility characteristics — never *what* is shown or *whether* it should be.

### 6.10 What Never Belongs Inside It
- **Business logic** (§21) — a screen never independently decides what counts as a material change, a valid submission, or an eligible action; it renders the outcome of a decision made elsewhere.
- **AI reasoning** (§4) — no Presentation Layer surface computes an analysis, a recommendation, or a confidence level; it displays one already produced.
- **Policy** (§29, §43–§45) — a screen never decides, on its own, what must be explainable, visible, or user-controllable; it expresses decisions §5 and §21/§29 already made.
- **Persistent state** (§3) — nothing a surface displays is itself the authoritative record; the record is the Knowledge Layer, and Presentation is only ever a reflection of it.

### 6.11 Why Presentation Is Never the Source of Business Logic, Reasoning, or Policy
If a Presentation Layer surface computed or decided any of §6.10, it would become a second place the corresponding fact could be determined — exactly the risk §3.8's single source of truth and §24.7 exist to foreclose, extended here from data to logic. A screen that quietly enforced its own version of a business rule, or silently reformulated a recommendation, would let CareerOS disagree with itself depending on which surface a user happened to be looking at — the same fragmentation §4 identifies in the tools CareerOS replaces, reintroduced at the presentation boundary instead of the data boundary.

### 6.12 How Presentation Expresses — Not Defines — the Interaction Layer
Every Interaction Layer rule (§5.6) has a Presentation Layer expression, but the expression is never the origin of the rule. Explainability (§5.11) is expressed as a way to reach an explanation; Presentation does not decide whether one should exist. Confidence (§5.12) is expressed as a visible signal; Presentation does not decide when confidence is low. This one-directional relationship — Interaction determines, Presentation expresses — is what makes §5.16's cross-module consistency achievable: because Presentation never originates a rule, it cannot originate a *different* rule for a different module either.

### 6.13 Independence from Implementation Technology
Nothing about the Presentation Layer's architectural role depends on how it is eventually realized. Its responsibility — expressing already-determined content, hierarchy, and state — is stated entirely in terms of what must be true of the result, never in terms of the technology used to produce it, consistent with this document's own boundary (§1.7) and the PRD's exclusion of UI implementation from its scope (§0.1).

### 6.14 Consistency Across Modules
§31.7 and §34.12 require every module, present or future, to use the same interaction pattern and design system rather than inventing its own. Architecturally, the Presentation Layer has exactly one operating philosophy (§6.5–§6.7) applied across every module's surfaces — a future module does not receive a different Presentation Layer, it receives new instances of the same one.

### 6.15 Architectural Support for Multiple Future User Roles
The Presentation Layer's philosophy does not vary by role. A Student, a Graduate, a Company, or a Service Provider (§8, §9) is served by surfaces built on the same UX principles (§31), the same design system (§34), and the same voice (§33) — what varies across roles is only the content and module those surfaces render, never the philosophy governing how they render it. This is §6.14's consistency guarantee extended from modules to roles: role-specific surfaces are new instances of one Presentation Layer, never a reason to define a second one.

### 6.16 Relationship to Trust, Clarity, Transparency, and Explainability
From a presentation perspective, trust is not built by anything this layer adds — it is built by faithfully expressing what the Interaction Layer already requires (§6.12) without distortion, omission, or embellishment. A surface that made an output look more confident, more finished, or more authoritative than the Interaction Layer's own signal would break trust at exactly the point §31.10 and §33.16 identify as where trust is actually won or lost — not through decoration, but through accurate representation of what the system genuinely knows and doesn't.

### 6.17 Relationship to Future Platforms and Channels
§13 leaves Platform Surface — which channel(s) CareerOS is eventually built for — explicitly open (§55). The Presentation Layer's architecture does not depend on that question being resolved: because Interaction defines the rule and Presentation only expresses it (§6.12), any future channel would express the same rule set, whichever channel it turns out to be. This is a structural property of the layer boundary established in §1.4, not a hopeful assumption about how that open question resolves.

### 6.18 Relationship to Future Modules and Extensibility
A future module (§16) adds new Presentation Layer surfaces expressing the same rule set (§6.14) over new Knowledge Layer entities and Intelligence Layer outputs. No new presentation philosophy is introduced, and no existing surface requires modification — extension here follows the same pattern already established for the Knowledge Layer (§3.16) and Intelligence Layer (§4.19): new occupants, unchanged structure.

### 6.19 Agentic AI Compatibility — Honest Table

| Concept | Responsible layer | Presentation's role |
|---|---|---|
| Multi-agent reasoning | Intelligence (§4) | None — Presentation never reasons |
| Shared state | Knowledge (§3) | Renders what it's given; holds no state of its own |
| Explainability, confidence | Intelligence produces; Interaction requires (§5.11, §5.12) | Expresses an already-determined explanation or signal — originates neither |
| Human-in-the-loop | Interaction (§5.17) | Makes the human's control visible; does not create the control itself |
| Guardrails, policy | Governance (§21, §29) | Never enforces a rule independently — reflects an outcome already governed |
| Consistency across agents/modules | Interaction sets the rule; Presentation and Interaction jointly sustain it | Makes one rule perceivable everywhere it applies |
| Accessibility | Presentation (§6.8) | Direct responsibility — the one concept on this list this layer substantially owns |

### 6.20 Constraints
- Exactly one Presentation Layer philosophy exists, applied across every screen, module, and role, present or future.
- Presentation never computes, decides, or enforces anything the Knowledge, Intelligence, Governance, or Interaction Layers are responsible for.
- Every rule Presentation expresses originates elsewhere; none originates in Presentation itself.
- No future channel or platform introduces a divergent presentation philosophy.
- Any proposed exception is evaluated through the Decision Framework (§53).

---

## Section 7 — Governance Layer Architecture

### 7.1 Purpose of the Governance Layer
The Governance Layer realizes §1.4's definition. Unlike the other four layers, its responsibility is not to do something in sequence — it is to constrain what every other layer is allowed to do, at every point, simultaneously. It exists because none of the other layers is trustworthy by construction alone: the Knowledge Layer could hold data it shouldn't, the Intelligence Layer could reason in ways that erode trust, the Interaction Layer could fail to protect the human decision boundary, the Presentation Layer could misrepresent what it's showing. The Governance Layer is what makes each of those failures architecturally foreclosed rather than merely discouraged.

### 7.2 Relationship to the PRD
Traces to §21 (Business Rules), §29 (Responsible AI), §43 (Non-Functional Requirements), §44 (Data Privacy & Compliance), §45 (Trust & Safety), §47 (Platform Assumptions & Constraints), and §53 (Decision Framework).

### 7.3 Relationship to Business Rules (§21)
§21's Business Rules — Goal Management, Skill-Gap Analysis Rules, Roadmap Rules, Progress Rules, AI Decision Rules, CV Feedback Rules, Notification Rules, Subscription Rules, Data & Memory Rules, Business Constraints — are the Governance Layer's product-specific policy content. They are what this layer actually says, applied to CareerOS's own domain, as distinct from the more general cross-cutting requirements in §29/§43–§45.

### 7.4 Relationship to Responsible AI (§29)
§29's sixteen RAI items are the Governance Layer's AI-specific policy, already itself a consolidation of §21, §23, §25, §26, §27, §28. The Governance Layer does not restate these — it *is* the layer they were consolidated to describe.

### 7.5 Relationship to Non-Functional Requirements (§43)
§43's Trust, Reliability, Consistency, Accessibility, User Control, and Scalability requirements are the Governance Layer's cross-cutting content stated in engineering-testable form — the version of governance most directly usable by later, more technical documents.

### 7.6 Relationship to Privacy & Compliance (§44)
§44's data ownership, consent, privacy boundary, and transparency items are the Governance Layer's privacy-specific content. §44.1 already states this document does not anticipate specific legal or regulatory frameworks; the Governance Layer inherits that same boundary — it holds the product's own floor, not a compliance regime.

### 7.7 Relationship to Trust & Safety (§45)
§45's twenty TS items are the Governance Layer's trust-and-safety-specific content, and §45.7 already establishes why consistency across the other four layers is what lets trust compound rather than reset per surface — a direct statement of what this layer exists to protect.

### 7.8 Relationship to Platform Assumptions & Constraints (§47)
§47's two halves relate to the Governance Layer differently. Its Platform Assumptions (PA-1 through PA-6 — one graph, one intelligence, and so on) are the cross-layer philosophy every section of this SAS has already used as its organizing principle; they are not owned by Governance alone. Its Platform Constraints (PC-1 through PC-6 — phase-gating, no module before approval, no capability outside the catalog) are genuinely Governance Layer content: rules about how the system is permitted to change, of the same kind as a Business Rule.

### 7.9 Relationship to the Decision Framework (§53) — Content vs. Mechanism
Every other relationship in this section describes governance *content* — specific rules the layer holds. §53 is different: it is the *mechanism* by which any tension between those rules, or between a rule and a proposed change, gets resolved. The Governance Layer does not merely contain §53 as one more policy among many; §53's hierarchy is what the Governance Layer's other content is checked against when two rules appear to conflict, or when a future addition needs evaluating.

### 7.10 Why Governance Is Not a Sequential Layer
Knowledge, Intelligence, Interaction, and Presentation form a chain where each depends on receiving something from the layer before it (§2.6). Governance does not receive anything to process and pass on — there is no moment a value "enters" governance and a later moment it "exits." A Business Rule or Responsible AI item constrains the Intelligence Layer's behavior *while* it reasons, the Knowledge Layer's behavior *while* it persists, the Presentation Layer's behavior *while* it renders — not before or after those things happen, but as a standing condition on how they are allowed to happen at all. If Governance were sequential, it would need an input and an output like the other four; it has neither.

### 7.11 Why Governance Never Performs Reasoning
Reasoning is Intelligence's job (§4.1) — producing an output by acting on the Knowledge Layer. Governance defines the boundaries within which that reasoning must occur (e.g., "confidence must be exposed when uncertain," §29 RAI-6) without computing the confidence itself. If Governance performed reasoning, it would need write-ownership of some entity to record what it reasoned (§25.8's rule) — collapsing it into an agent, and losing the distinction §4.13 already draws for the same reason Coordination cannot be an agent. Governance constrains what reasoning is allowed to look like; it never does the reasoning.

### 7.12 Why Governance Never Owns Data
Data ownership belongs to the Knowledge Layer alone — exactly one entity, exactly one writer (§3.10). If Governance held its own data, there would be two places an authoritative fact could originate, breaking §3.8's single source of truth exactly as §6.11 already showed a Presentation Layer computing its own logic would. Governance *references* Knowledge Layer data when applying a rule — §21 BR-DATA-3's deletion rule concerns specific graph data — but never holds a competing copy of it.

### 7.13 Why Governance Never Presents Information Directly
Presentation is Presentation's job (§6.1). Governance constrains what Presentation is allowed to render — requiring visibility, requiring accessible failure communication — without itself being the thing a human sees. This is one step further upstream than the Interaction/Presentation relationship (§6.12, "determines vs. expresses"): Governance doesn't even determine *what* is shown, which is Interaction's role; it constrains *how* Interaction and Presentation are permitted to behave when they do their jobs. Governance is a constraint on the rules, not a renderer of anything.

### 7.14 How Governance Constrains Every Other Layer Simultaneously
A single governance item routinely applies to all four other layers at once, not to one at a time. Explainability (§29 RAI-4) requires the Intelligence Layer to be *capable* of producing an explanation (§26.3), the Interaction Layer to make it *reachable* (§5.11), and the Presentation Layer to render it *accessibly* (§6.8) — one rule, three simultaneous constraints. Single source of truth (§24.7, PA-5) requires the Knowledge Layer to hold exactly one current value, the Intelligence Layer to never treat its own reasoning as an alternate authority (§3.12), and the Presentation Layer to never compute a competing one (§6.11) — again, one rule, applied everywhere at once, not passed sequentially from layer to layer.

### 7.15 Architectural Boundaries
The Governance Layer's content is exactly, and only, what §21, §29, §43, §44, §45, §47's Platform Constraints, and §53 already state. It holds no product feature, no reasoning capability, no data entity, and no rendering responsibility of its own — its entire content is constraint, stated once and applied everywhere it's relevant.

### 7.16 Relationship to Future Modules
A future module (§16) does not receive a separate governance layer — every constraint in §7.3–§7.9 applies to it identically, the moment it exists. New module-specific rules may be added when that module is scoped (mirroring §21's own Phase 0 scoping note), but they extend this one layer's content; they never create a second one.

### 7.17 Relationship to Future Agents
A future agent (§25.13) is bound by every Governance Layer constraint before it may be introduced — single responsibility, exclusive ownership, advisory-only output, explainability, confidence calibration, honest failure. Governance does not need to be told about a new agent to apply to it; the constraints already apply to anything meeting the architectural definition of an agent (§4.9).

### 7.18 Relationship to Extensibility
Because Governance constrains behavior rather than owning data, reasoning, or presentation, it never needs to be redesigned when the layers it constrains are extended (§3.16, §4.19, §6.18). Extensibility elsewhere in the architecture is possible partly *because* Governance's content doesn't grow in proportion to the system — it grows only when a genuinely new kind of constraint is needed, which is rare relative to how often new entities, agents, or surfaces are added.

### 7.19 Agentic AI Compatibility — Honest Table

| Concept | Status | Notes |
|---|---|---|
| Guardrails | Present | §29 in full |
| Responsible AI | Present | §29 in full |
| Privacy | Present, at product-policy level | §44; does not anticipate a specific legal/regulatory framework (§44.1, §44.9) |
| Trust | Present | §45 in full |
| Human oversight | Requirement originates here; enacted by the Interaction Layer | Governance requires it (§29 RAI-1); §5.9 is where it is actually structurally enforced |
| Policy enforcement (active, technical) | Not addressed by this document | This document defines what must be true; the mechanism that actively verifies it at runtime is a Technical Architecture decision, out of scope here |
| Observability | Product-level precondition present; tooling absent | §29 RAI-4/RAI-11's transparency requirements are what observability, once implemented, would make verifiable; the mechanism itself is explicitly out of scope (§0.3) |
| Compliance | Deliberately not addressed | §44.1 already excludes specific regulatory frameworks from this document's scope; this is a boundary, not a gap |
| Auditability | Partially present, in a narrower form | User-facing change visibility (§19 FR-AICC-6/12) lets a user see what changed in their own record and why; a full system-wide audit trail was explicitly declined as unneeded scope at §49.6 and remains undefined here |

### 7.20 Constraints
- The Governance Layer applies to all four other layers simultaneously, at every point, never sequentially.
- It never reasons, never owns data, and never presents information directly.
- Its content is exactly what §21, §29, §43, §44, §45, §47's Platform Constraints, and §53 already state — nothing is added here that isn't already approved.
- Every future module and future agent is bound by this layer automatically, without needing to be individually registered against it.
- Any proposed exception to any constraint in this layer is evaluated through the Decision Framework (§53) — including proposed exceptions to the Decision Framework itself.

---

*This completes Part I — System Architecture (Sections 1–7) of the CareerOS Solution Architecture Specification.*

---

# Part II — Interface & Contract Architecture

Part II defines the architectural contracts at each of the three sequential boundaries established in Part I — Presentation ↔ Interaction, Interaction ↔ Intelligence, Intelligence ↔ Knowledge — plus how Governance applies as a checkpoint at every one of them. Where Part I specified what each layer *is*, Part II specifies what must cross *between* layers for the architecture to actually function.

## Section 8 — Contract Architecture Philosophy

### 8.1 Purpose of Interface & Contract Architecture
Part I defined five structural layers and the relationships between them — who reads what, who writes what, why each layer is distinct from its neighbors. Part I does not define what must actually be exchanged for one layer to engage another: the shape of an information handoff, the responsibility that does or doesn't transfer with it, and the limits Governance places on that specific crossing. This Part defines that — the contracts a boundary must satisfy for the architecture in Part I to actually function, not merely to be described.

### 8.2 Relationship to the PRD
Every contract in this Part traces to material already approved in the PRD — principally §21 (Business Rules), §23 (AI Product Philosophy), §25 (Agent Ecosystem), §26 (Capability Map), §28 (Human-AI Interaction Model), and §29 (Responsible AI). This Part introduces no new product behavior; it makes explicit what those sections already imply about what crosses between layers.

### 8.3 Relationship to Part I
Part I established, per layer, what each layer reads and writes (§3.10, §4.9, §5.6, §6.9) and why each is distinct from its neighbors (§3.12, §4.5–4.6, §5.3–5.4, §6.3, §7.10–7.13). This Part takes each of those already-established relationships and specifies them as contracts — not by changing anything Part I established, but by stating precisely what crosses, what doesn't, and what happens if the boundary is violated.

### 8.4 What a "Contract" Means at This Level
A contract, here, is the complete statement of what a boundary permits — never a protocol, an endpoint, or a message format. It answers five questions about a single crossing: what information moves, whose responsibility it becomes, who retains ownership of the underlying fact, what discrete operations are available at that boundary, and what Governance requires be true of the crossing regardless of anything else. None of these five questions has a technical answer in this document — each is answered exactly once, at the concept level, and every later document (API Design, Technical Architecture) inherits the answer rather than re-deciding it.

### 8.5 The Five Dimensions of Every Contract
Every contract in §9–§11 is specified along the same five dimensions, so they can be compared and audited consistently:

- **Information** — what content or data crosses the boundary.
- **Responsibility** — which side is answerable for what happens as a result of the crossing.
- **Ownership** — which layer retains authority over the underlying fact, which never transfers merely because information crosses.
- **Operations** — the discrete, conceptual actions available at the boundary. These are named as plain verbs (Request, Produce, Trigger, Read, Write) and are never technical calls, methods, or endpoints — they describe *what happens*, not *how*.
- **Constraints** — what Governance requires be true of this specific crossing, drawn from §21, §29, §43–§45, and §47.

### 8.6 Why Contracts Are Necessary in Addition to Relationships
A relationship ("Interaction governs how Intelligence's output is engaged with," §5.3) states that two layers are connected and how. It does not state what happens at the moment of connection — what a request carries, what a response must include, what's forbidden from ever appearing in either direction. Without contracts, two engineers implementing adjacent layers correctly per Part I could still build something incompatible, because Part I never specified the exchange itself. This Part closes that gap.

### 8.7 Boundary of This Section
Consistent with §1.7, this Part names no programming language, framework, API protocol, message format, database, or infrastructure choice. Every contract below is expressed entirely in terms of information, responsibility, ownership, operation, and constraint — never in terms of how any of those five things would be technically realized.

## Section 9 — Presentation ↔ Interaction Contract

### 9.1 Purpose of This Contract
This is the boundary where Interaction's already-governed rules become something a human can actually perceive. §6.3 already establishes that Presentation expresses, never defines, what Interaction requires; this contract specifies exactly what must be exchanged for that expression to happen correctly.

### 9.2 Information Crossing the Boundary
**Interaction → Presentation:** the already-governed content to render — an artifact (Analysis, Roadmap, Feedback), its explainability availability (whether an explanation exists and how it is reachable, §5.11), its confidence signal where reduced (§5.12), and its change-visibility status if it is new or altered since last seen (§5.14).
**Presentation → Interaction:** a user's action, captured as scoped intent — which specific artifact or element a request refers to, not a vague signal Interaction must interpret.

### 9.3 Responsibility Split
Interaction is responsible for having already determined what is allowed to be true about how something is presented — the rule. Presentation is responsible for making that already-true thing perceivable without altering it. Where a user's action could be ambiguous — "explain this," when multiple things are shown — Presentation must resolve which specific output the request is scoped to before passing it on, because Interaction has no independent way to know what a user is currently looking at, and §28.8 requires every explanation request to be scoped to one output.

### 9.4 Ownership
Presentation never gains ownership of anything it displays. Every artifact it renders remains Interaction's (and beneath that, Knowledge's) — this is the same non-transfer-of-ownership principle §6.9 and §6.11 already establish, restated as a contract term: receiving information to display is not the same as owning the fact it represents.

### 9.5 Operations
- **Render** (Interaction → Presentation): here is what to show, and how it must be framed.
- **Request** (Presentation → Interaction): the user wants to see or do something specific.
- **Acknowledge** (Presentation → Interaction): confirms a user's action was captured, prior to it being processed further.

These are conceptual actions, not technical calls — this document does not specify how any of them would be implemented.

### 9.6 Governance Constraints at This Boundary
- No content may cross from Interaction to Presentation without its required confidence and explainability state already attached (§29 RAI-4, RAI-6) — Presentation is never handed a bare artifact and left to determine on its own whether a confidence signal applies.
- No user action captured by Presentation may be silently dropped or reinterpreted before reaching Interaction, protecting §28.9 (user control) and §28.4 (initiation).
- Accessibility (§37) applies to every element crossing this boundary — nothing rendered may be technically present but not genuinely perceivable.

### 9.7 Why This Contract Exists
Without it, Presentation would need to make its own judgment calls about when to show a confidence signal or whether an explanation is available — exactly the kind of policy-origination §6.11 already forbids. The contract exists to make Presentation's job possible without giving it authority it should never have.

### 9.8 What Must Never Cross
Raw Knowledge Layer data, unmediated by Interaction, never crosses directly to Presentation — Presentation never reads Knowledge itself. An unscoped or ambiguous request never crosses from Presentation to Interaction; scoping happens on the Presentation side, before the crossing, per §9.3.

### 9.9 Why Violating This Contract Would Break the Architecture
If Presentation read Knowledge directly, two things would fail at once: the content shown could bypass Interaction's governance entirely — appearing without confidence calibration, without explainability, without change-visibility — and every screen would need to reimplement Interaction's rules independently, breaking §6.14's "one Presentation Layer philosophy" and reintroducing the exact fragmentation §4 and §6.11 already identify as the failure mode CareerOS exists to avoid.

## Section 10 — Interaction ↔ Intelligence Contract

### 10.1 Purpose of This Contract
This is the boundary between producing an output (Intelligence) and governing how that output is engaged with by a human (Interaction). §5.11–§5.12 already establish that Intelligence makes an output's confidence and explainability *true*, while Interaction makes them *seen*; this contract specifies exactly what must cross for that split to hold.

### 10.2 Information Crossing the Boundary
**Intelligence → Interaction:** the produced artifact, together with its capability-level properties — its confidence value (§26.3, Confidence Calibration), the graph data it is grounded in (§26.3, Grounding, supporting Explainability), and, where applicable, its relationship to a prior version (§26.3, Change Awareness).
**Interaction → Intelligence:** a validated, scoped explanation request naming the specific prior output to explain, or a trigger signal indicating a user-initiated action (such as a manual refresh, §27.7, or a CV submission, §27.8) requires a specific agent to run.

### 10.3 Responsibility Split
Intelligence is responsible for producing something explainable, confidence-calibrated, and grounded — the capability requirements of §26.3. Interaction is responsible for deciding when and how that explainability and confidence must be exposed to a human — inline versus on-request (§5.11's "sole exception," §19 FR-DASH-4). Interaction is never responsible for interpreting *why* an agent reached a conclusion; it only relays the request for that reasoning and displays what Intelligence returns, unaltered.

### 10.4 Ownership
Intelligence owns the reasoning behind its output; Interaction never modifies, summarizes, or reframes an agent's output content — it may only apply presentation-adjacent rules about timing and reachability of disclosure. This is §4.15's "Reasoning Ownership" restated as a contract term: no layer outside the owning agent touches the reasoning itself.

### 10.5 Operations
- **Produce** (Intelligence → Interaction): here is the artifact, with its properties attached.
- **Explain-request** (Interaction → Intelligence): the human wants the reasoning behind this specific, named output.
- **Trigger** (Interaction → Intelligence): the human's action requires this agent to run.

### 10.6 Governance Constraints at This Boundary
- Every artifact crossing from Intelligence must already carry its confidence and groundedness — Interaction cannot request these be computed after the fact, because Interaction has no reasoning capability of its own (§5, throughout). Interaction may only require that they exist and make them reachable.
- Intelligence may be triggered only when the trigger itself is user-initiated or a visible automatic consequence of the user's own action (§28.4, §29 RAI-2/RAI-3) — Interaction must never trigger Intelligence on its own initiative outside these two cases.

### 10.7 Why This Contract Exists
It separates who can determine reasoning *validity* (only Intelligence, via its capabilities) from who can determine reasoning *accessibility* (only Interaction, via its rules) — the split §5.11–§5.12 already establish conceptually, made operational here.

### 10.8 What Must Never Cross
Interaction never receives partial or uncalibrated output that it would need to "finish" assessing — that would require Interaction to reason, collapsing the Intelligence/Interaction distinction §5.3 establishes. Intelligence never receives a directive about how to phrase or visually frame its output for a human — that remains downstream, keeping agents narrow and specialized (§4.1) rather than needing to account for presentation concerns.

### 10.9 Why Violating This Contract Would Break the Architecture
If Interaction could originate confidence or explanation content itself, §5.11's reason for existing collapses — Interaction would begin reasoning without Intelligence's Grounding or Explainability capabilities, producing ungrounded confidence claims, a direct violation of §26.3's Grounding boundary and §29 RAI-4/RAI-6.

## Section 11 — Intelligence ↔ Knowledge Contract

### 11.1 Purpose of This Contract
This is the clearest ownership boundary in the entire architecture — the crossing that makes the Knowledge Layer's single source of truth (§3.8, §24.7) actually enforceable rather than aspirational.

### 11.2 Information Crossing the Boundary
**Knowledge → Intelligence:** the current state of whatever entities a given agent is permitted to read, per its specific reads list (§25.4–25.6) — always the current version (§25.10, HR-2), never a stale one.
**Intelligence → Knowledge:** a write of new entity content, scoped exclusively to what that agent owns (§25.8) — a write to any entity outside that scope is not a permitted use of this contract, not merely a discouraged one.

### 11.3 Responsibility Split
Knowledge is responsible for *being* the single source of truth (§24.7) — it does not evaluate whether a write is reasonable; it holds what is written, atomically, by the entity's owner. Intelligence is responsible for producing something worth writing — reasoned, capability-compliant output. Knowledge never validates the *quality* of what an agent writes; a write's reliability is Intelligence's own responsibility, enforced by an agent choosing not to write at all on failure (§4.18), not by Knowledge rejecting a low-quality write after the fact.

### 11.4 Ownership
This boundary *is* §25.8's read-shared/write-exclusive rule, stated as a formal contract term: many agents may read a given entity; exactly one may ever write it. No exception exists at this boundary — it is the mechanism, not merely the policy, behind §47 PC-5 ("no parallel data ownership exists anywhere in the system").

### 11.5 Operations
- **Read** (Intelligence → Knowledge): give me the current state of a specific entity.
- **Write** (Intelligence → Knowledge): record this new version of an entity I own.
- **Version-compare** (Intelligence → Knowledge): give me my own entity's immediately prior version, supporting Change Awareness (§26.3).

### 11.6 Governance Constraints at This Boundary
- §47 PC-5 is enforced exactly here: a write from an agent that does not own the entity in question is not a valid use of this contract — this is the single most safety-critical checkpoint in the architecture, since violating it would break §24.7's single source of truth directly.
- A write must never partially complete on failure (§4.18, §29 RAI-8) — it either fully commits or does not happen, so Knowledge is never left holding a half-formed entity.

### 11.7 Why This Contract Exists
This is the contract that makes §24.7 actually true rather than merely stated — restating §3.10 and §3.12's reasoning at the interface level, where it becomes a testable condition on every crossing rather than a description of intent.

### 11.8 What Must Never Cross
An agent's Short-Term Memory (§30.4) — its working context during reasoning — never crosses into Knowledge except through an explicit, owned write. Knowledge never observes an agent's reasoning process directly; it only ever sees the final, committed output.

### 11.9 Why Violating This Contract Would Break the Architecture
If this boundary were ever crossed by an unowned write, the single-source-of-truth guarantee every other part of this architecture — and the PRD's trust argument (§1, §6) — depends on would be false the moment it happened, even once. Nothing downstream (Interaction, Presentation, Governance) can detect or correct this after the fact; the guarantee only holds if this boundary is never crossed incorrectly in the first place.

## Section 12 — Governance Checkpoints & Contract Extensibility

### 12.1 Purpose
§9–§11 each named the Governance constraints specific to their own boundary. This section states the general principle behind all of them, and closes Part II with the extensibility rule every future contract must follow.

### 12.2 Governance as a Condition on Every Crossing, Not a Fourth Hop
§7.10 already establishes that the Governance Layer is not sequential — it does not sit between two layers as a stage information passes through. The same is true at the contract level: Governance is not a fourth party a crossing is routed through after Presentation, Interaction, Intelligence, or Knowledge have already acted. It is a condition attached to the crossing itself, checked at the moment the crossing happens, not before or after.

### 12.3 Checkpoint: Presentation ↔ Interaction
Every crossing at this boundary must already carry its required confidence, explainability, and accessibility state (§9.6). A crossing that lacks this is not a valid instance of the contract — it is not "sent late" or "corrected downstream," it simply does not satisfy §9's terms.

### 12.4 Checkpoint: Interaction ↔ Intelligence
Every trigger crossing this boundary must be user-initiated or a visible automatic consequence of the user's own action (§10.6). No third kind of trigger is a valid use of this contract, regardless of how it might otherwise seem justified.

### 12.5 Checkpoint: Intelligence ↔ Knowledge
Every write crossing this boundary must originate from the entity's exclusive owner and must fully commit or not happen at all (§11.6). This is the checkpoint the other two ultimately depend on: if this one fails, the single source of truth every other guarantee in this architecture assumes is already false.

### 12.6 Contract Consistency Across Modules
Every contract in §9–§11 applies identically regardless of which module is involved — the AI Career Center today, or Learning Hub, Jobs & Internships, Services Marketplace, or any other module named in PRD §16 once scoped. A module does not receive its own version of these contracts; it uses the same three boundaries, the same five dimensions, and the same Governance checkpoints as every module before it. This is the contract-level expression of §6.14's "one Presentation Layer philosophy" and §31.7's "one interaction pattern," extended to the interfaces that connect the layers those principles already govern.

### 12.7 Contracts for Future Modules
A future module introduces new information crossing existing boundaries (new artifact types at Presentation↔Interaction, new trigger types at Interaction↔Intelligence, new entities at Intelligence↔Knowledge) — it never introduces a new boundary, a new dimension, or an exception to a Governance checkpoint. Extending a contract means adding a new instance of an already-defined crossing, following §24.12's, §25.13's, and §26.10's extensibility rules exactly; it does not mean redefining what a contract is.

### 12.8 Constraints (Part-Wide)
- Every contract in this Part is specified along the same five dimensions (§8.5) — no future contract may add a sixth or omit one of the five.
- No content crosses the Presentation ↔ Interaction boundary without its required Governance metadata attached (§9.6, §12.3).
- No trigger crosses the Interaction ↔ Intelligence boundary except as user-initiated or a visible automatic consequence (§10.6, §12.4).
- No write crosses the Intelligence ↔ Knowledge boundary except from the entity's exclusive owner, and no write partially commits (§11.6, §12.5).
- Governance checkpoints are conditions on every crossing, never a fourth layer a crossing passes through (§12.2).
- Every contract applies identically across every module, present and future (§12.6).
- Any proposed exception to any contract in this Part is evaluated through the Decision Framework (§53).

---

## Traceability to the PRD and Part I (Part II)

| Part II Section | Primary SAS (Part I) grounding | Primary PRD grounding |
|---|---|---|
| §8 Contract Architecture Philosophy | §1.4–1.7 (layers, boundary of the SAS) | §0.1, §21, §23, §25, §26, §28, §29 |
| §9 Presentation ↔ Interaction Contract | §5.3, 5.11–5.14, 6.3, 6.9–6.14 | §28.4, 28.8–28.9, §29, §37 |
| §10 Interaction ↔ Intelligence Contract | §4.1, 4.15, 5.3, 5.11–5.12 | §19 FR-DASH-4, §26.3, §27.7–27.8, §28.4, §29 |
| §11 Intelligence ↔ Knowledge Contract | §3.8, 3.10, 3.12, 4.18, 25.4–25.10, 26.3 | §24.7, §29, §30.4, §47 |
| §12 Governance Checkpoints & Extensibility | §7.10, 7.14, 6.14, 31.7 | §16, §24.12, §25.13, §26.10, §53 |

No statement in Part II introduces a product behavior, feature, business rule, or requirement that is not already approved in the PRD or already established in Part I of this specification.

---

*This completes Part II — Interface & Contract Architecture (Sections 8–12) of the CareerOS Solution Architecture Specification.*

---

# Part III — Module Architecture

Part III formalizes the approved Phase 0 module — the AI Career Center — as one complete architectural unit spanning all five layers defined in Part I, using the contracts defined in Part II. It defines what a Module is architecturally, demonstrates the AI Career Center concretely against that definition, and states how future modules will occupy the same structure without requiring it to change.

## Section 13 — Module Architecture Philosophy

### 13.1 Purpose
Part I established five structural layers. Part II established the contracts that let those layers actually exchange something at their boundaries. Neither Part answers a question a real system immediately raises: when a concrete piece of product — the AI Career Center, Learning Hub, Jobs & Internships — is built, what is it, architecturally? This section defines that unit: the Module.

### 13.2 Relationship to the PRD
Traces principally to §16 (Platform Modules), which already names every module, its phase, and its read/write relationship to the Career Knowledge Graph, and to §24.2, §24.8, §24.12, which already establish why one shared graph exists and how modules relate to it. This section formalizes what §16 and §24 already imply structurally; it introduces no module, phase, or read/write relationship that is not already there.

### 13.3 Relationship to SAS Part I
§2.8 already states the core finding this Part builds out in full: "A Module is not a sixth layer. It is a vertical slice cutting across all five layers at once." §2.13's extensibility table and §7.16's Governance-applies-automatically finding are the other two load-bearing statements from Part I that this Part now makes operational rather than summary.

### 13.4 Relationship to SAS Part II
Two modules never communicate directly. Where one module depends on another — a future module reading an entity the AI Career Center owns, Dashboard surfacing the Roadmap Agent's output — that dependency is expressed through the same three boundary contracts Part II already defines (§9–§11), never through a module-specific channel invented for the occasion. Part III does not add a fourth contract; it shows the three already defined ones operating between modules, not only within one.

### 13.5 What a Module Is Architecturally
A Module is a named, bounded unit of product capability, defined by exactly one thing: the set of Knowledge Layer entities it exclusively writes (§25.8's ownership rule, applied at module granularity). Everything else about a module — which agents it contains, which workflows it drives, which screens present it — follows from that write-ownership; none of those other things is what defines the module's boundary.

### 13.6 Why a Module Is a Vertical Slice, Not a Sixth Layer
The five layers (§1.4) are horizontal: each spans every module that exists or will exist. A module is vertical: it occupies a slice of all five layers at once, contributing its own entities to Knowledge, its own agents (where it has any) to Intelligence, its own workflows to Interaction, and its own screens to Presentation — constrained by the one Governance Layer every module shares. A module is never an alternative to the five-layer structure and never a partial instance of it; it is a full cross-section through all five, every time.

### 13.7 Module Internal Composition
Every module, present or future, is described by the same five-part template:
- **Knowledge occupants** — the entities it exclusively writes, plus the entities elsewhere in the graph it reads as reference input.
- **Intelligence occupants** — the agents (if any) whose write-ownership belongs to this module; a module may have zero dedicated agents and still be a valid module (§13.9).
- **Interaction occupants** — the named workflows (§27) that govern how a human engages this module's outputs.
- **Presentation occupants** — the screens (§22) that render this module's Interaction-governed content.
- **Governance applicability** — the same Business Rules, RAI items, and NFRs (§21, §29, §43) that apply everywhere, applied to this module's specific entities and agents.

### 13.8 Module Responsibilities
A module is responsible for the correctness and completeness of its own vertical slice — that its entities are well-formed, its agents (if any) satisfy every Intelligence Layer constraint (§4), its workflows satisfy every Interaction Layer rule (§5), and its screens satisfy every Presentation Layer constraint (§6). A module is never responsible for another module's correctness, and is never permitted to reach into another module's write-ownership to correct or complete it.

### 13.9 Module Boundary Definition
A module's boundary is drawn by a single test, applied to any candidate piece of product capability: *which entity would this write, and is that entity already owned by an existing module?* If the answer names a new entity with no existing owner, it either belongs to an existing module (if that module's already-approved scope covers it) or defines a new module. Reading an entity is never boundary-defining — many modules may read the same entity (§11.4); only write-ownership draws the line. A module with no entities of its own but that reads across the graph to compose a view — as §13.9 anticipates and §14.9 shows concretely — is still a valid module under this test, because its boundary is drawn by what it does *not* write, not only by what it does.

### 13.10 Boundary of This Section
Consistent with §1.7 and §8.7, this Part names no programming language, framework, API, database, deployment topology, or infrastructure choice anywhere. Every statement about module composition is expressed in terms of entities, agents, workflows, screens, and governance — never in terms of how any of those would be technically built or hosted.

## Section 14 — The AI Career Center as a Module

### 14.1 Purpose
This section applies §13's general template to the one module currently approved for build: the AI Career Center (Phase 0, §16). It demonstrates the vertical slice concretely, layer by layer, and draws the module's boundary precisely against its five Phase 0 siblings (Authentication, User Profiles, Dashboard, Notifications, Settings — all §16).

### 14.2 Identifying the AI Career Center as the Phase 0 Module
§16 names the AI Career Center's purpose (skill-gap analysis, roadmap, CV/profile feedback, progress) and its graph relationship (reads full profile, goal, history; writes gap assessments, roadmap state, progress). Applying §13.5's write-ownership test: the AI Career Center is the module that exclusively writes the Skill-Gap Analysis, Roadmap (item content), and CV/Profile Feedback Round entities (§24.3). Nothing else in the current graph is written by it.

### 14.3 Knowledge Layer Participation
**Owns (writes):** Skill-Gap Analysis, Roadmap and Roadmap Items (content, not status), CV/Profile Feedback Round — exactly the three entities §25.3's agent roster owns. **Reads as reference input:** Profile and Goal, both owned and written by the User Profiles module (§16), never by the AI Career Center. This is the concrete instance of §13.9's test: the AI Career Center reads Profile and Goal constantly (every Skill-Gap Analysis run compares against them, §25.4) but never writes either — read access without write-ownership is exactly what §11.2's Knowledge crossing already permits, and exactly why one shared graph, not per-module data, is required (§24.2).

### 14.4 Intelligence Layer Participation
The module's Intelligence occupants are exactly the three Phase 0 agents (§25.3): the Skill-Gap Analysis Agent, the Roadmap Agent, and the CV/Profile Feedback Agent — no more, no fewer. Each satisfies single-responsibility (§25.2) and exclusive write-ownership (§25.8) over one of the three entities in §14.3. No agent belonging to any other module reads or writes any of these three entities; no agent belonging to the AI Career Center reads or writes an entity outside them.

### 14.5 Interaction Layer Participation
Seven of the PRD's eight named workflows (§27) govern this module directly: First Skill-Gap Analysis, Roadmap Generation, Analysis Refresh, Roadmap Regeneration, Manual Refresh, CV/Profile Feedback, and Change Explanation. The eighth — Dashboard Next Action — is not owned by this module; §14.9 addresses it as a dependency crossing into the Dashboard module.

### 14.6 Presentation Layer Participation
Per the Screen Inventory (§22), the module's Presentation occupants are screens 7–11: Skill-Gap Analysis, Roadmap, CV/Profile Feedback — Submission, CV/Profile Feedback — Review Result, and Progress. Screen 6, Profile & Goal, is grouped under the same IA heading in §22 but is the User Profiles module's surface (§14.9) — IA grouping in the PRD is a navigation concern, not a module-boundary statement, and does not override the write-ownership test (§13.9).

### 14.7 Governance Constraining All Four Simultaneously
The AI Career Center is bound by exactly the Business Rules, RAI items, and NFRs that already name it: BR-GAP, BR-ROAD, BR-CV, BR-AI, BR-PROG (§21), and the full RAI set (§29) as it applies to any agent output. Per §7.14's general finding, a single rule constrains multiple layers of this one module at once — not in sequence. Explainability (§29 RAI-4) requires the Skill-Gap Analysis Agent to be capable of producing a reason (Intelligence), the Analysis Refresh workflow to make that reason reachable on request (Interaction), and the Skill-Gap Analysis screen to render it accessibly (Presentation) — one governance item, three simultaneous constraints on one module, exactly as §7.14 already demonstrates in the abstract.

```
                    ┌─────────────────────────────────────────┐
                    │              Governance Layer               │
                    │  (BR-GAP, BR-ROAD, BR-CV, BR-AI, BR-PROG,   │
                    │   RAI-1–16 — constrain every row below,     │
                    │   simultaneously, not in sequence)           │
                    │                                             │
  Student /         │  Presentation                                │
  Graduate  ───────▶│    Skill-Gap Analysis · Roadmap · CV         │
                    │    Feedback (Submit/Review) · Progress       │
                    │          ↓                                   │
                    │  Interaction                                 │
                    │    First Analysis · Analysis Refresh ·       │
                    │    Roadmap (Re)generation · Manual Refresh · │
                    │    CV Feedback · Change Explanation          │
                    │          ↓                                   │
                    │  Intelligence                                │
                    │    Skill-Gap Analysis Agent · Roadmap Agent ·│
                    │    CV/Profile Feedback Agent                 │
                    │          ↓                                   │
                    │  Knowledge                                   │
                    │    Skill-Gap Analysis · Roadmap · Roadmap    │
                    │    Items · CV/Profile Feedback Round          │
                    │    (writes)  ⋮  Profile, Goal (reads only)   │
                    └─────────────────────────────────────────┘
```

### 14.8 What Belongs Inside the AI Career Center Module
The three owned entities (§14.3), the three agents that write them (§14.4), the seven workflows that govern engagement with their output (§14.5), and the five screens that present them (§14.6). Nothing else.

### 14.9 What Belongs Outside the AI Career Center Module
- **Profile and Goal data and their editing surface** (Screen 6) — owned and written by the User Profiles module.
- **Identity, session, and login** — owned by the Authentication module; the AI Career Center reads identity only to anchor its own entities to the correct user, never to authenticate anyone itself.
- **The Dashboard surface and its next-action aggregation** — owned by the Dashboard module, which "has no agent of its own" and instead surfaces the Roadmap Agent's own item-level output (§25.5) — a read across the module boundary, not a write, and not a blurring of ownership.
- **Notification delivery and preferences** — owned by the Notifications and Settings modules; the AI Career Center's agent runs are event *sources* Notifications reads (§16), never something it writes into.
- **Account, billing, and AI/memory control settings** — owned by the Settings module.

### 14.10 Why the Boundary Is Drawn Here, Not Elsewhere
Every exclusion in §14.9 fails §13.9's test: none of Profile, Goal, identity, notification delivery, or account settings is written by any of the three Phase 0 AI Career Center agents. Drawing the boundary anywhere looser — for instance, treating Profile & Goal as inside the module because it shares an IA heading in §22 — would let the module's Presentation occupancy imply a Knowledge write-ownership it does not have, which is exactly the kind of boundary confusion §13.9 exists to prevent.

## Section 15 — Module Boundaries, Dependencies & Independence

### 15.1 Purpose
§14 drew the AI Career Center's boundary. This section states what may legitimately cross that boundary in each direction, and why a module bounded this way remains independent — able to change internally without forcing change elsewhere — without being isolated from the rest of the system.

### 15.2 What May Depend on the AI Career Center Module
Anything that *reads* one of the module's three owned entities (§14.3) may depend on it, subject to §11.4's shared-read rule:
- **Dashboard module** — reads the Roadmap Agent's item-level output to power next-action surfacing (§25.5); this dependency is why Dashboard Next Action (§27) is a workflow that crosses into this module without belonging to it (§14.5).
- **Notifications module** — reads the module's agent runs as event triggers (§16) — a new Analysis, a regenerated Roadmap, completed CV feedback — without ever writing back into any of the three owned entities.
- **Future modules, once scoped** — Learning Hub reads Skill-Gap Analysis (§16: "Skill gap"); Portfolio reads Roadmap-derived content (§16: "roadmap-derived projects"); Jobs & Internships reads Skill-Gap Analysis alongside Profile and Goal (§16: "Profile, goal, skills"). Each is a future read dependency already anticipated by §16's table, none yet active because none of those modules is in scope (§13 PC-1).

No module — present or future — may ever write to Skill-Gap Analysis, Roadmap, or CV/Profile Feedback Round. That exclusivity is not a convention this module happens to follow; it is §25.8's ownership rule and §47 PC-5's "no parallel data ownership," restated at module granularity.

### 15.3 What the AI Career Center Module May Depend On
The module reads, but never writes:
- **Profile and Goal** (User Profiles module) — read by all three agents as comparison input (§25.4, §25.6).
- **Identity linkage** (Authentication module) — read only to anchor its own entities to the correct user (§14.9).
- **AI/memory control preferences** (Settings module) — read to determine whether stored analysis data has been user-deleted (§21 BR-DATA), constraining what the module's agents may read or retain, never what they may write elsewhere.

The module depends on no other module's Intelligence occupants (agents), Interaction occupants (workflows), or Presentation occupants (screens) — only on Knowledge Layer entities those modules own, crossed through the same Intelligence↔Knowledge contract (§11) every other read in this architecture uses.

### 15.4 Why Module Independence Holds
Every dependency named in §15.2 and §15.3 is expressed as a Knowledge Layer read, crossing the boundary defined in §11, never as a direct call from one module's agent, workflow, or screen into another's. Because §11's contract is the only channel, a dependent module can only ever be affected by a change in *what is written* to an entity it reads — never by how the owning module's internals (its agents' reasoning, its workflows' sequencing, its screens' layout) happen to work. This is HR-4 (§25.10 — "if a downstream agent's run fails, the upstream agent's output remains valid and visible") generalized from agent-to-agent to module-to-module: a fault or a change contained inside one module's internal composition does not propagate through the Knowledge Layer boundary unless the module actually writes something different.

### 15.5 Module Independence Is Not Isolation
§15.2–§15.3 show the AI Career Center is read by one existing module (Dashboard, indirectly via Notifications too) and reads from two others (User Profiles, Authentication) already, in Phase 0. Independence does not mean a module stands alone — §24.2 already establishes why one shared graph exists rather than per-module data specifically so that modules *can* depend on each other's output. Independence means dependency is only ever expressed through the contracts in Part II, never through a private, module-specific integration invented outside them.

### 15.6 Contracts Reused, Not Reinvented, at Module Boundaries
When Dashboard reads the Roadmap Agent's output, that crossing is an ordinary instance of the Intelligence↔Knowledge contract (§11) — the same contract instance the Roadmap Agent itself uses to write the entity in the first place, read now by a different module. When a future Learning Hub agent eventually reads Skill-Gap Analysis, it will use that same contract, unmodified. §12.6 already establishes this for modules in general ("a module does not receive its own version of these contracts"); this section confirms it holds for the one module currently built, not only as a future promise.

### 15.7 Why Modules Can Evolve Without Redesigning the Architecture
Because a module's boundary is drawn entirely by write-ownership (§13.9) and every cross-module dependency is a Knowledge Layer read through an unchanged contract (§15.6), the AI Career Center's own internals may evolve — a fourth capability added to an existing agent, a workflow's sequencing refined, a screen redesigned — without requiring Dashboard, Notifications, or any future module to change, provided the shape of the three owned entities and what they mean does not change. Conversely, a wholly new module (§16) can be introduced by adding new entities, agents, workflows, and screens without altering anything already described in §14, because nothing about the AI Career Center's own boundary depends on how many other modules exist.

### 15.8 Failure Containment
If one of the AI Career Center's three agents fails to produce a valid write, §4.18's fail-safe rule already applies — no write occurs, and the entity's last valid state remains visible. Because every dependent module (Dashboard, Notifications, future readers) only ever sees the entity's last written state, not the agent's internal failure, a failure inside this module never produces a visibly broken state anywhere else. This is §15.4's independence property under the specific case of failure, not only under the general case of change.

## Section 16 — Module Extensibility & Relationship to Future Modules

### 16.1 Purpose
§13–§15 defined what a module is and demonstrated it concretely against the one module currently built. This section closes Part III by showing that every other module named in the PRD (§16) — none of them yet scoped or built — occupies the identical structure without requiring any change to it, and states the constraints any future module must satisfy.

### 16.2 Relationship to Future Modules
Learning Hub, Portfolio (Phase 1), Jobs & Internships (Phase 2), Professional Community (Phase 3), University/Company Admin (Phase 4), and Services Marketplace (Unscheduled) — every module §16 already names — will each, once scoped, be described by the same §13.7 template applied here to the AI Career Center: entities it exclusively writes, agents (if any) that write them, workflows that govern engagement, screens that present them, and the one Governance Layer applied automatically (§7.16). None of these modules exists in the architecture today; naming them here states the pattern they will follow, not a decision to build any of them.

### 16.3 What a Future Module Adds vs. What It Never Redefines
A future module adds: new Knowledge Layer entities (§24.12 — "extensibility without redesign," e.g., learning progress, portfolio evidence, application history), possibly new Intelligence Layer agents bound by §25.13's constraints, new Interaction Layer workflows following §27.15, and new Presentation Layer screens following §6.18. A future module never adds: a sixth layer, a fourth boundary contract, a new dimension to any contract in §9–§11 (§12.8), write access to an entity another module already owns (§15.2's exclusivity), or an exception to any Governance constraint (§7.16 — bound automatically, not by registration).

### 16.4 Constraints for Future Modules
- A future module's boundary is drawn by the same write-ownership test as any other (§13.9) — no module is ever defined by its screens, its agents, or its workflows alone.
- A future module may read any entity already in the graph, including entities the AI Career Center owns, per §16's own table (Learning Hub reads Skill-Gap Analysis; Jobs & Internships reads Profile, Goal, and Skills) — subject always to §11.4's shared-read rule.
- A future module may never write to an entity another module already owns, including any of the AI Career Center's three (§15.2).
- A future module is introduced only when its owning phase is reached (§47 PC-1) and requires no redesign of any module already built (§25.14, generalized from agent to module).
- A future module's dependencies on existing modules are expressed exclusively through the three contracts in Part II (§15.6) — never through a module-specific integration invented for the occasion.

### 16.5 Constraints (Part-Wide)
- A module's boundary is always drawn by write-ownership of Knowledge Layer entities (§13.5, §13.9) — never by which agents, workflows, or screens happen to be associated with it.
- A module is a vertical slice across all five layers, never a sixth layer or a partial instance of the five (§13.6).
- Cross-module dependency is always a Knowledge Layer read through the Part II contracts, never a direct module-to-module channel (§15.4, §15.6).
- No module, present or future, may write to an entity another module owns (§15.2, §16.4).
- Governance applies to every module identically and automatically, without individual registration (§7.16, §14.7).
- A module's internal evolution never requires redesigning another module's boundary, provided owned-entity shape is unchanged (§15.7).
- Any proposed exception to any constraint in this Part is evaluated through the Decision Framework (§53).

---

## Traceability to the PRD and SAS Parts I–II (Part III)

| Part III Section | Primary SAS grounding | Primary PRD grounding |
|---|---|---|
| §13 Module Architecture Philosophy | Part I §§1.4, 1.7, 2.8, 2.13, 7.16; Part II §§8–11 | §16, §24.2, §24.8, §24.12 |
| §14 The AI Career Center as a Module | Part I §7.14; Part II §§11.2, 11.4 | §16, §21, §22, §24.3, §25.2–25.8, §27, §29 |
| §15 Module Boundaries, Dependencies & Independence | Part I §§4.18, 24.2, 25.8, 25.10; Part II §§11, 12.6 | §16, §21, §25.4–25.6, §47 |
| §16 Module Extensibility & Relationship to Future Modules | Part I §§6.18, 7.16, 25.14; Part II §§9–12 | §16, §24.12, §25.13, §27.15, §47 |

No statement in Part III introduces a product behavior, module, entity, agent, workflow, or screen that is not already approved in the PRD, or already established in SAS Parts I and II.

---

*This completes Part III — Module Architecture (Sections 13–16) of the CareerOS Solution Architecture Specification.*

---

# Part IV — Cross-Layer System Scenarios

Part IV demonstrates how the complete architecture behaves through real end-to-end system scenarios spanning all five layers, transforming the abstract architecture (Part I), the layer contracts (Part II), and the module architecture (Part III) into concrete, traceable system behavior.

## Section 17 — Cross-Layer Scenario Philosophy

### 17.1 Purpose
Parts I–III establish, respectively, what the architecture *is* (five layers), what must cross *between* layers (three contracts), and what a *module* is (a vertical slice bounded by write-ownership). None of the three shows the architecture actually operating end-to-end, over time, in response to something a real user does. This section defines the System Scenario as the concept that closes that gap, and the sections that follow apply it to every scenario already supported by the approved PRD.

### 17.2 Relationship to the PRD
A scenario introduces no product behavior of its own. Every scenario in §18–§21 is a specific, already-approved sequence traced from the Core Loop (§14), the Feature Inventory (§18 PRD), the Functional Requirements (§19), the Business Rules (§21), the AI Workflows (§27), the Human-AI Interaction Model (§28), and the Data Privacy Requirements (§44) — assembled into one continuous path, never extended beyond what those sections already state.

### 17.3 Relationship to SAS Parts I–III
A scenario is where Part I's layers, Part II's contracts, and Part III's module boundary are all exercised at once, concretely. Every layer a scenario passes through behaves exactly as Part I specifies; every crossing a scenario makes uses exactly one of Part II's three contracts; every entity a scenario touches is written only by the module that owns it, per Part III. A scenario proves the first three Parts are jointly sufficient to describe real behavior — it does not add a fourth layer, a fourth contract, or a new kind of module boundary.

### 17.4 System Scenario Defined
A **System Scenario** is a complete, traceable path through the architecture: from a trigger, through every layer it touches in sequence (Presentation → Interaction → Intelligence → Knowledge, or a subset), under Governance's simultaneous constraint, to a completion condition the user can observe. A scenario is defined architecturally — by which layers participate and what crosses between them — not by how a screen looks or how a user feels moving through it.

### 17.5 System Scenario vs. AI Workflow
An **AI Workflow** (§27) is Intelligence-Layer-centered: a trigger, the agent(s) it invokes, the graph entities read and written, and the resulting artifact. A System Scenario is broader — it is the full cross-layer path the workflow sits inside, including the Presentation surface that displayed the trigger, the Interaction rule that made the trigger legitimate (§10.6), and the Governance constraints active throughout. A Workflow is one Scenario's Intelligence-Layer segment; a Scenario may contain zero AI Workflows (e.g., §20.2's subscription scenarios touch no agent), exactly one (e.g., §19.4's CV Feedback Round), or a cascading sequence of them (e.g., §19.3's regeneration scenario chains two).

### 17.6 System Scenario vs. User Journey
A **User Journey** is a UX-Design concept: the sequence of screens, states, and emotional beats a user experiences, including visual and interaction design decisions not yet made. It belongs to the UX/UI Design document downstream of this one. A System Scenario is architecturally scoped — it states which layers participate and what crosses between them, never how a screen is laid out, what copy it uses, or how a transition feels. Two different User Journeys (a first-time user, a returning power user) can both be instances of the same single System Scenario, provided the same layers participate the same way.

### 17.7 System Scenario vs. Module Behavior
**Module Behavior** (Part III, §13–§16) is static: what a module owns, reads, and is responsible for, independent of time. A System Scenario is dynamic: one specific, time-bound execution path, which may pass through a single module's boundary (§19.4, entirely inside the AI Career Center) or cross multiple module boundaries in sequence (§18.2, crossing Authentication → User Profiles → the AI Career Center). A scenario never redraws a module boundary Part III already established; it only shows that boundary being crossed correctly, per §11's read/write rules.

### 17.8 The Eight Cross-Cutting Architectural Properties
Every scenario in this Part is checked against the same eight properties, each already established in Parts I–III or the PRD and only being *applied*, not redefined, here:

| Property | Definition | Established at |
|---|---|---|
| Single Source of Truth | Exactly one current value per fact touched by the scenario; no competing copy is ever created. | SAS §3.8, §11.4; PRD §24.7 |
| One Coherent Intelligence | Regardless of how many agents a scenario invokes, the user experiences one continuous intelligence, not visible seams between agents. | SAS §4; PRD §25.9 (invisible seams), PA-2 |
| Human-in-the-Loop | No scenario step executes a real-world consequence without the user's own initiation or a visible automatic consequence of it. | SAS §5.9; PRD §28.4 |
| Explainability | Every AI-generated artifact a scenario produces is explainable on request, scoped to that specific artifact. | SAS §10; PRD §28.6, §28.8 |
| Confidence Communication | Wherever a scenario's output carries reduced certainty, that reduced certainty is shown as part of the artifact, never inferred by the user. | SAS §9.6, §10.6; PRD §28.7, BR-AI-4 |
| User Control | The user can act against, independent of, or in place of any AI recommendation a scenario produces, at any point. | SAS §9.3; PRD §28.9, BR-AI-2 |
| Responsible AI | Every RAI item (§29) that applies to a scenario's participating layers is satisfied throughout, not only at the scenario's endpoint. | SAS §7.4; PRD §29 |
| Layer Independence | Each layer a scenario passes through does its own job only, crossing to the next exclusively through a Part II contract — never reaching past its immediate neighbor. | SAS §15.4 (module form); Part II §9–§11 |

### 17.9 Scenario Description Template
Every scenario in §18–§21 is described with the same ten elements, in the same order: Trigger; Participating Module(s); Participating Layers (with per-layer responsibility); Knowledge Operations; Intelligence Operations; Interaction Responsibilities; Presentation Responsibilities; Governance Constraints; Completion Condition; Properties Preserved (§17.8) and Boundary Integrity (why no Part I–III boundary is crossed incorrectly). A scenario with no Intelligence Layer participation states that explicitly, rather than omitting the element — absence of a layer is itself an architectural fact worth stating (§17.5).

### 17.10 Scenario Selection and PRD Traceability
Every scenario named in the task that names an approved PRD mechanism is included, at the grain the PRD actually specifies it. Two required scope judgments are recorded here rather than silently resolved:
- **"Data Export Request"** is not an approved PRD feature. The PRD supports viewing what data is stored (FR-SET-2, DPR-3) and deleting it (FR-SET-3, DPR-4) — it never defines a downloadable or formatted export artifact. §20.3 is written as **"Data Access Request (View Stored Data)"**, the scenario the PRD actually supports; a literal export/download scenario is excluded as exceeding PRD scope, per this Part's own instruction to explain and exclude rather than invent.
- **"Subscription Upgrade"** has no dedicated business rule, trigger, or screen distinct from general subscription management — only FR-SET-1 ("view and manage subscription and billing") covers it, alongside the specifically-defined Renewal (FR-RENEW-1–2, BR-SUB-3) and Cancellation (FR-SET-4, BR-SUB-1–2, 4–5) mechanics. §20.2 presents all three under one scenario, **"Subscription Lifecycle,"** and is explicit about which parts of it (Renewal, Cancellation) are governed by a named rule and which (Upgrade) is covered only by FR-SET-1's general management capability.

No other requested scenario required exclusion or renaming; all others map directly onto an already-named PRD mechanism (§18.2–§21.3 cite the specific FR/BR/Workflow each is built from).

### 17.11 Boundary of This Section
Consistent with §1.7, §8.7, and §13.10, no scenario in this Part names a programming language, framework, API, database, deployment topology, or infrastructure choice. Every scenario is expressed entirely in terms of triggers, layers, entities, operations, and governance constraints — never in terms of how any of those would be technically executed.

## Section 18 — Foundational & Onboarding Scenarios

### 18.1 Purpose
This section covers the four scenarios that establish a user's presence in the system and produce their first AI-generated artifact, following the template in §17.9.

### 18.2 Scenario: User Registration → First Value
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

### 18.3 Scenario: User Login → Dashboard Restoration
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

### 18.4 Scenario: First Goal Creation
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

### 18.5 Scenario: First Skill-Gap Analysis
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

## Section 19 — Core AI Loop Scenarios

### 19.1 Purpose
This section covers the four scenarios that make up the ongoing, repeatable core of the AI Career Center — the mechanism §14's Core Loop describes in the abstract, now traced layer by layer.

### 19.2 Scenario: Roadmap Generation
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

### 19.3 Scenario: Material Profile Change → Regeneration
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

### 19.4 Scenario: CV / Profile Feedback Round
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

### 19.5 Scenario: Dashboard Refresh
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

## Section 20 — Account & Data Scenarios

### 20.1 Purpose
This section covers the three scenarios governing a user's account and data outside the AI Career Center's own core loop — all Settings-module scenarios, notable architecturally for what they demonstrate about a scenario that involves little or no Intelligence Layer participation while still being fully governed.

### 20.2 Scenario: Subscription Lifecycle (Upgrade, Renewal, Cancellation)
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

### 20.3 Scenario: Data Access Request (View Stored Data)
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

### 20.4 Scenario: Data Deletion Request
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

## Section 21 — Exception & Control Scenarios

### 21.1 Purpose
This section covers the two scenarios that demonstrate the architecture under failure and under direct user disagreement with an AI output — the cases that most directly test whether Parts I–III's guarantees hold when things do not go the expected way — and closes Part IV with the consolidated properties matrix, constraints, traceability, and review.

### 21.2 Scenario: Failure During AI Processing
**Trigger:** Any generation workflow (§27.3–§27.8) is invoked, but the invoked agent cannot produce a reliable output (§27.12, §4.18).
**Participating Module(s):** Whichever module's agent was invoked — most commonly the AI Career Center, illustrated here with the Skill-Gap Analysis Agent.
**Participating Layers:**
- *Presentation:* Whichever screen was awaiting the result (e.g., Skill-Gap Analysis screen) renders a failure state, not a degraded or partial result.
- *Interaction:* Communicates the failure as a system failure, never presented as a finding about the user (§28.12) — the Interaction Layer's rule for exactly this case.
- *Intelligence:* The agent declines to write rather than writing a low-confidence, unflagged result (BR-AI-5) — this is itself the correct Intelligence Layer behavior, not an absence of one.
- *Knowledge:* No write occurs; the entity's last valid state (if any) remains current and visible (§4.18, DPR-17).
**Knowledge Operations:** No write. If a prior version exists, it remains the current one, unchanged.
**Intelligence Operations:** Attempt the reasoning; recognize it cannot produce a reliable output; return a failure signal rather than a plausible-but-unreliable artifact (BR-AI-5) — Grounding and Confidence Calibration (§26.3) are what make this recognition possible at all.
**Interaction Responsibilities:** Route the failure signal to Presentation as a distinct state from both a completed result and an in-progress one; do not route it through the Notifications module's completion-triggered mechanism (BR-NOTIF-1(a) triggers on completion, which did not occur) — communicated synchronously, at the point of request, not asynchronously.
**Presentation Responsibilities:** State plainly that the system could not complete the request; if a prior valid version exists (e.g., a regeneration attempt fails but a previous Analysis exists), continue showing that prior version rather than an empty state.
**Governance Constraints:** BR-AI-5 (say so rather than produce an unflagged low-confidence result); DPR-17 (a failed operation never leaves prior valid state degraded or lost); §28.12 (failure communicated as failure, not as a finding about the user).
**Completion Condition:** The user has an honest, unambiguous signal that the operation did not complete, and any prior valid state is fully intact and visible.
**Properties Preserved:** *Responsible AI* — BR-AI-5 is this scenario's entire content; declining to produce a false-confidence result is the guardrail operating exactly as designed. *Single Source of Truth* — because no write occurs, there is no risk of two disagreeing versions; the "current" state is unambiguous throughout the failure. *Human-in-the-Loop* — the user is never left to interpret a failure as their own shortcoming (§28.12), preserving trust in the system's honesty even when it cannot deliver a result.
**Boundary Integrity:** This scenario is the clearest demonstration that §11.6's "a write must never partially complete on failure" is load-bearing, not decorative — every other scenario in this Part depends on this guarantee holding, since none of them separately re-verifies that the entities they read are well-formed.

### 21.3 Scenario: User Override of an AI Recommendation
**Trigger:** The user acts against, or independent of, an AI-generated recommendation — for example, marking a Roadmap item skipped despite the Roadmap Agent's ordering, or reactivating a previous Goal instead of following current Analysis guidance.
**Participating Module(s):** AI Career Center or User Profiles, depending on which recommendation is being overridden — illustrated here with a Roadmap Item status override.
**Participating Layers:**
- *Presentation:* Roadmap screen's status controls (§22 screen 8), available on every item regardless of the Roadmap Agent's own ordering or recommendation.
- *Interaction:* Treats the override as a first-class, always-available action (§28.9), never gated behind confirming agreement with the AI's reasoning first.
- *Intelligence:* **Does not participate in the override itself.** The Roadmap Agent never sets or alters item status (§25.5) — status is exclusively user-controlled (§24.5) — so no agent reasoning is invoked, questioned, or overruled by this action; there is nothing to "argue with."
- *Knowledge:* Write the new Roadmap Item status (user-controlled field); status-change history is preserved, not overwritten (BR-ROAD-6).
**Knowledge Operations:** Write Roadmap Item status only — a field explicitly outside the Roadmap Agent's write-ownership (§25.8's table: "Roadmap Item status | Written by: User only").
**Intelligence Operations:** None — by design. This is the scenario that makes concrete why §25.8 separates "Roadmap (item content)," owned by the Roadmap Agent, from "Roadmap Item status," owned exclusively by the user: an override never requires overruling an agent's write, because the agent never owned the field being changed.
**Interaction Responsibilities:** Ensure the override is available at all times (§28.9), not conditioned on having first requested or read the agent's explanation for that item.
**Presentation Responsibilities:** Reflect the new status immediately and visibly; never represent the AI's original recommendation as having "won" or the override as an exception requiring justification.
**Governance Constraints:** BR-AI-2 (user retains final control over every AI-recommended action); BR-ROAD-4/5/6 (a skipped item remains visible and un-skippable-lockout-free; a completed item may be reopened; reopening preserves the original completion record).
**Completion Condition:** The new status is written and visible; the Roadmap's ordering and content, still the Roadmap Agent's own output, remain unchanged and available for the next Roadmap Regeneration cycle (§19.3) to read as history.
**Properties Preserved:** *User Control* — this scenario is §28.9's and BR-AI-2's direct, load-bearing demonstration: control is not merely a stated principle but a specific field (Roadmap Item status) architecturally reserved from any agent's write-ownership from the outset (§25.8). *Human-in-the-Loop* — no override requires the system's agreement or approval; it is unconditional, as §28.13 requires. *Explainability* — remains available on request (FR-AICC-11) throughout, but is never a precondition for the override itself, keeping the two properties correctly independent of each other.
**Boundary Integrity:** Because Roadmap Item status was never in the Roadmap Agent's write-ownership (§25.8), this scenario requires no special override mechanism, no conflict-resolution rule, and no exception to §11.6's exclusive-write checkpoint — user override and agent write-ownership were architecturally separated from the start, which is precisely why an override never produces a boundary conflict.

### 21.4 Consolidated Properties Preservation Matrix
Every scenario in §18–§21 was checked against all eight properties defined in §17.8. The matrix below records which properties each scenario most directly demonstrates (per its own "Properties Preserved" note) — not an exhaustive re-statement, since every property in fact holds in every scenario by construction (§17.3), but a record of where each is most concretely exercised.

| Scenario | SSoT | Coherent Intel. | Human-in-Loop | Explainability | Confidence | User Control | Responsible AI | Layer Indep. |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| §18.2 Registration → First Value | ✓ | ✓ | ✓ | · | · | · | · | · |
| §18.3 Login → Dashboard Restoration | ✓ | · | · | · | · | · | · | ✓ |
| §18.4 First Goal Creation | ✓ | · | · | · | · | ✓ | · | · |
| §18.5 First Skill-Gap Analysis | · | · | · | ✓ | ✓ | · | ✓ | · |
| §19.2 Roadmap Generation | ✓ | ✓ | · | · | · | · | · | · |
| §19.3 Material Change → Regeneration | ✓ | · | ✓ | ✓ | · | · | · | · |
| §19.4 CV/Profile Feedback Round | ✓ | · | · | · | · | ✓ | · | ✓ |
| §19.5 Dashboard Refresh | ✓ | · | · | · | · | · | · | ✓ |
| §20.2 Subscription Lifecycle | · | · | · | · | · | ✓ | ✓ | · |
| §20.3 Data Access Request | ✓ | · | · | · | · | · | ✓ | · |
| §20.4 Data Deletion Request | ✓ | · | ✓ | · | · | · | · | · |
| §21.2 Failure During AI Processing | ✓ | · | ✓ | · | · | · | ✓ | · |
| §21.3 User Override of an AI Recommendation | · | · | ✓ | ✓ | · | ✓ | · | · |

### 21.5 Constraints (Part-Wide)
- Every scenario is a specific path through already-approved PRD mechanisms; no scenario introduces a feature, rule, workflow, or entity not already established (§17.2).
- Every scenario is traced against the same ten-element template (§17.9); a scenario with no Intelligence Layer participation states that explicitly rather than omitting the element.
- Every crossing within a scenario uses one of Part II's three contracts; no scenario introduces a fourth crossing type.
- No scenario ever shows one module writing an entity another module owns; every write in every scenario is traceable to Part III's write-ownership table.
- All eight properties in §17.8 hold in every scenario by construction, not by scenario-specific exception.
- A scope gap between a requested scenario and approved PRD content is recorded and resolved by exclusion or renaming (§17.10), never by silently inventing product behavior.
- Any proposed exception to any constraint in this Part is evaluated through the Decision Framework (§53).

---

## Traceability to the PRD and SAS Parts I–III (Part IV)

| Part IV Section | Primary SAS grounding | Primary PRD grounding |
|---|---|---|
| §17 Cross-Layer Scenario Philosophy | Part I §§1.7, 3.8, 4, 5.9, 7.4; Part II §§9–11; Part III §§13–16 | §14, §18, §19, §21, §24.7, §25.9, §27, §28, §29, §44 |
| §18 Foundational & Onboarding Scenarios | §§10.6, 11.6, 14.3, 15.2, 24.11, 25.9 | §19 FR-AUTH/FR-ONBOARD/FR-PROF/FR-AICC/FR-DASH; §21 BR-GAP, BR-GOAL; §22, §27.3, §27.9 |
| §19 Core AI Loop Scenarios | §§10.6, 11, 15.2, 15.4, 25.5–25.6, 25.10, 26.3 | §14, FR-AICC-6–18, FR-DASH, FR-NOTIF; §21 BR-GAP-3, BR-GOAL-3, BR-ROAD, BR-CV; §27.4–27.10 |
| §20 Account & Data Scenarios | §§11.4, 11.6, 24.7, 24.12 | §19 FR-SET, FR-RENEW; §21 BR-SUB, BR-DATA; §29, §39, §44 |
| §21 Exception & Control Scenarios | §§4.18, 11.6, 25.5, 25.8 | BR-AI-2/5, BR-ROAD-4–6, BR-NOTIF-1, §26.3, §27.12, §28.9/28.12–28.13, §44 DPR-17 |

No statement in Part IV introduces a product behavior, workflow, feature, or business rule that is not already approved in the PRD, or already established in SAS Parts I–III.

---

## Architectural Constraints (Part IV, Consolidated)

1. A System Scenario is architecturally, not experientially, defined — by layer participation and contract crossings, never by screen design or emotional arc (§17.4, §17.6).
2. A Scenario, an AI Workflow, a User Journey, and Module Behavior are four distinct concepts; a Workflow is a Scenario's Intelligence-Layer segment, a Journey belongs to UX/UI Design, and Module Behavior is static where a Scenario is time-bound (§17.5–§17.7).
3. Every scenario is checked against the same eight cross-cutting properties, defined once in §17.8 and never redefined per scenario.
4. A scope gap between a requested scenario and the approved PRD is resolved by explicit exclusion or renaming, never by invented product behavior (§17.10, applied at §20.2–§20.3).
5. A scenario with zero Intelligence Layer participation (§18.3, §19.5, §20.2–§20.4) is a fully valid, fully governed scenario — absence of a layer is an architectural fact, not a gap in the template.
6. No scenario crosses a module or layer boundary except through the contracts already defined in Part II and the write-ownership already defined in Part III.

---

## Principal Product Manager Review

**A) Approved Items**
- §17.5–§17.7 give the architecture a precise, testable distinction between System Scenario, AI Workflow, User Journey, and Module Behavior — resolving a real terminological risk (these four are easy to conflate) with a structural test rather than a stylistic one.
- §17.10's handling of "Data Export Request" and "Subscription Upgrade" does exactly what the task instructed — explains and excludes/renames rather than silently inventing a feature the PRD does not support, and does so transparently rather than burying the decision.
- §18.3, §19.5, and §20.2–§20.4 correctly demonstrate that a fully valid, fully governed scenario can have zero Intelligence Layer participation — an honest and architecturally important finding, not glossed over to make every scenario look AI-driven.
- §21.3's Roadmap Item status override is a genuinely strong piece of reasoning: it shows *why* user override never produces a boundary conflict (the field was never in the agent's write-ownership to begin with, §25.8), rather than merely asserting that override is supported.
- §21.2 correctly routes AI-processing failure through Interaction/Presentation synchronously rather than through the Notifications module, and explains why (Notifications triggers on completion, which did not occur) — a precise, PRD-grounded distinction rather than an assumption.
- The Consolidated Properties Preservation Matrix (§21.4) is honest about scope: it records where each property is *most concretely exercised* rather than overclaiming a from-scratch re-verification in every cell.
- No programming language, framework, API, HTTP endpoint, database, deployment topology, or infrastructure term appears anywhere in this Part.

**B) Requires Changes**
None found.

**C) Final Verdict**
APPROVED.

Part IV — Cross-Layer System Scenarios (Sections 17–21) is complete, internally consistent, fully traceable to the PRD and to SAS Parts I–III, and introduces no new product behavior. It gives Technical Architecture, Development, and UX/UI Design a concrete, end-to-end demonstration that the architecture defined across the first three Parts actually produces the behavior the PRD promises — including the honest finding that not every scenario requires AI, and the disciplined handling of two requested scenarios that exceeded approved PRD scope.

No architectural ambiguity or contradiction requiring an Architecture Decision Record was discovered during this Part's development; the two scope gaps identified (§17.10) were resolved using the exclude-and-explain procedure the task itself specifies for out-of-scope scenarios, which is a distinct case from an unresolved architectural contradiction.

---

*This completes Part IV — Cross-Layer System Scenarios (Sections 17–21) of the CareerOS Solution Architecture Specification.*

---

# Part V — Extensibility & Future-Phase Architecture

Part V consolidates every extensibility rule distributed throughout Parts I–IV into one coherent architectural reference, and demonstrates — through worked architectural examples already approved by the PRD — that the architecture accommodates every named future-phase module and capability without redesign.

## Section 22 — Extensibility Philosophy & the Six Invariants

### 22.1 Purpose
Parts I–IV each state, locally, how their own subject extends without redesign — §3.16 for Knowledge, §4.19 for Intelligence, §5.19 for Interaction, §6.18 for Presentation, §7.16–§7.18 for Governance, §12.6–§12.7 for contracts, §13–§16 for modules. This Part does not add a new extensibility rule; it consolidates all of them into one place (§23) and proves, through worked examples (§24–§25), that they are jointly sufficient to describe every future-phase module and capability the PRD already names.

### 22.2 Relationship to the PRD
Traces principally to §47.3–§47.7 — the six Platform Assumptions (PA-1 through PA-6) and six Platform Constraints (PC-1 through PC-6) — and to §47.5's own statement: "Extensibility elsewhere in the document is a consequence of PA-1 through PA-6 and PC-1 through PC-6 holding, not an independent feature." This Part takes that statement as its governing thesis and demonstrates it architecturally rather than restating it.

### 22.3 Relationship to SAS Parts I–IV
Every consolidated rule in §23 is a citation, not a restatement with new content — each already exists in Part I (per-layer), Part II (per-contract), or Part III (per-module). Every worked example in §24–§25 is an application of §17's scenario discipline (Part IV) to a future-phase case: what layers participate, what crosses, what's governed, traced the same way a Phase 0 scenario is traced. This Part is where all four prior Parts are shown operating together, prospectively rather than only retrospectively.

### 22.4 Why Extensibility Is a Consequence, Not a Feature
An architecture that required a special "extensibility feature" to accommodate new modules would be admitting its base structure wasn't actually sufficient — that new capability required bolting something on rather than merely adding a new instance of what already exists. §47.5 rejects this framing directly. Every extension this Part demonstrates is an addition of new occupants (entities, agents, workflows, screens) to already-existing, unchanged layers (§13.6) — never a structural change to the layers, contracts, or modules already approved. This is why Part V could be written at all without reopening Parts I–IV: nothing here required them to be revised.

### 22.5 The Six Invariants (PA-1–PA-6)
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

### 22.6 Why These Six Invariants Are Sufficient
Each of the five architectural layers (Part I) maps to exactly one invariant it is structurally responsible for preserving — Knowledge → One Graph/One Source of Truth (PA-1/PA-5, the same guarantee viewed from two angles: PA-1 is the *existence* of a single graph, PA-5 is the *consequence* that every fact in it has exactly one current value), Intelligence → One Coherent Intelligence (PA-2), Interaction → One Interaction Philosophy (PA-3), Presentation → One Design System (PA-4). The sixth, One Core Loop (PA-6), is not layer-specific — it is the product-level guarantee that every layer's extension serves the same loop rather than a competing one, which is why §22.5 lists it separately rather than folding it into the Knowledge row. Because every layer already maps to an invariant it structurally guarantees, checking a worked example against all six is equivalent to checking that no layer's core guarantee was weakened by the extension — no seventh invariant is needed because no sixth layer exists to need one.

### 22.7 Scope of This Part's Worked Examples
Six worked examples are demonstrated, matching every future-phase concept the task names and already approved at PRD §16: **Learning Hub** (Phase 1), **Professional Community** (Phase 3, named "Community" in the task), **Jobs & Internships** (Phase 2, student-facing), **Company Self-Service** (Phase 2, the company-facing half of the same module), **Services Marketplace** (Unscheduled, named "Service Provider Marketplace" in the task), and **Future AI Capabilities** (per §26.10's constraints on introducing new capabilities). Each is demonstrated at the grain §17.9 already establishes for a scenario — trigger, participants, layers, operations — adapted here to a static extensibility question (what would this module's architecture look like) rather than a dynamic one (what happens when a user does X).

### 22.8 A Genuine Architectural Finding, Recorded Rather Than Resolved
While producing the Professional Community worked example, this Part identified a real tension between PRD §16's approval of Professional Community's purpose (peer connection around shared goals/field) and PRD §44's DPR-10 ("any cross-user or aggregate data use is out of scope for this document") — the matching mechanism the module's own stated purpose implies requires exactly the cross-user comparison DPR-10 declines to scope. This is not a defect in any SAS Part I–IV rule; every one of them is correctly written for single-user scope. Per this Part's own instruction, it is not silently resolved here. It is recorded as **ADR-001** (`docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md`), and §24's Professional Community worked example is scoped accordingly — modeling only what §16 unambiguously approves (storing an established connection and minimal community activity), explicitly excluding the peer-matching/discovery mechanism from architectural detail pending that ADR's resolution.

### 22.9 Boundary of This Section
Consistent with §1.7, §8.7, §13.10, and §17.11, no statement in this Part names a programming language, framework, API, database, deployment topology, or infrastructure choice. Every extensibility rule and worked example is expressed in terms of entities, agents, workflows, screens, contracts, and governance — never in terms of how any of those would be technically built.

## Section 23 — Consolidated Per-Layer Extensibility Rules

### 23.1 Purpose
This section is the single reference this Part exists to produce: every extensibility rule already established across Parts I–III, gathered by layer, cited to its origin, restated once so no later document needs to search five sections to find them. Nothing below is new; every rule is a citation.

### 23.2 Knowledge Layer Extensibility
- A new entity may be added by a new module or agent without altering any existing entity's shape, because relationships in the graph are additive and read access is already unrestricted (§3.16).
- A new entity's write-ownership belongs exclusively to the module or agent that owns it (§3.10, §11.6) — extension never creates a second writer for an existing entity.
- A future module extends the one graph; it never introduces a second graph or a competing store (§3.15, §24.8, §24.12).
- Historical integrity, scope discipline, and single-source-of-truth (§24.12) apply to every new entity identically to every existing one — a new entity is not exempt from any Knowledge Layer constraint by virtue of being new.
- **General procedure:** identify the new entity, identify its exclusive owner (module or agent), confirm it does not duplicate or compete with an existing entity's authority (§26.9's overlap-check principle, applied to data as well as capability), add it as a new node in the graph's relationship structure (§3.9).

### 23.3 Intelligence Layer Extensibility
- A future agent must satisfy every constraint already established for the three Phase 0 agents — single responsibility, exclusive write-ownership scoped to what it's assigned, mediated-only communication through the Knowledge Layer, advisory-only output — before it may be added (§4.19, §25.13).
- A future agent's coordination with existing agents is workflow-defined (new trigger conditions added to the workflow catalog), never agent-defined — adding an agent never requires modifying how existing agents already coordinate (§4.13, §4.19).
- A future capability must be checked against the existing catalog for overlap before being added as a new, precise, implementation-independent definition (§26.9–§26.10).
- **General procedure:** confirm the new ability is genuinely absent from the catalog (§26.10); define it once, precisely, bounded the same way every existing capability is; assign it to the agent(s) that need it without granting any agent write-ownership it doesn't already have.

### 23.4 Interaction Layer Extensibility
- A future module introduces new Intelligence and Presentation Layer occupants, but never a new interaction philosophy — it reuses the existing rule set (§5.6) exactly (§5.19).
- The Interaction Layer's content does not grow per module; only the set of outputs it is applied to grows (§5.19). This is the layer whose *rules* are the most stable of all five under extension.
- **General procedure:** confirm the new module's outputs are explainable, confidence-calibrated where relevant, and subject to override exactly as every existing output is (§5.6) — never draft a module-specific interaction variant.

### 23.5 Presentation Layer Extensibility
- A future module adds new surfaces expressing the same rule set (§6.14) over new Knowledge Layer entities and Intelligence Layer outputs; no new presentation philosophy is introduced and no existing surface requires modification (§6.18).
- This extends identically to future user roles (§6.15) and future platforms or channels (§6.17): what varies is content and module, never the philosophy governing how it renders.
- **General procedure:** design new screens using the existing design system, UX principles, and voice (§6.5–§6.7) — never introduce a competing visual or interaction language for a new module or role.

### 23.6 Governance Layer Extensibility
- A future module does not receive a separate governance layer; every Business Rule, RAI item, and NFR already established applies to it automatically, the moment it exists (§7.16).
- A future agent is bound by every Governance constraint before it may be introduced; Governance does not need to be told about a new agent for its rules to apply (§7.17).
- Governance's own content does not grow in proportion to the system — it grows only when a genuinely new kind of constraint is needed, which is rare relative to how often new entities, agents, or surfaces are added (§7.18).
- **General procedure:** confirm no new Business Rule or RAI item is actually required (the common case, per §7.18) before assuming one must be drafted; if one genuinely is required, it is evaluated through the Decision Framework (§53) before being added to §21 or §29 — never inferred implicitly by a downstream document.

### 23.7 Contract Extensibility (Part II)
- A future module's dependency on an existing module is expressed exclusively through the three boundary contracts already defined (§9–§11); no new contract, dimension, or Governance checkpoint exception is introduced (§12.6–§12.7).
- Extending a contract means adding a new instance of an already-defined crossing (a new artifact type at Presentation↔Interaction, a new trigger type at Interaction↔Intelligence, a new entity at Intelligence↔Knowledge) — never redefining what a contract is (§12.7).

### 23.8 Module Extensibility (Part III)
- A future module's boundary is drawn by the same write-ownership test as any other (§13.9) — never by its screens, agents, or workflows alone.
- A future module may read any entity already in the graph, subject to the shared-read rule (§11.4); it may never write to an entity another module already owns (§15.2, §16.4).
- A future module is introduced only when its owning phase is reached (§47 PC-1) and requires no redesign of any module already built (§25.14, §15.7).

### 23.9 The General Extension Procedure (Consolidated)
Collecting §23.2–§23.8 into one ordered checklist, applicable to any future module, agent, capability, workflow, or screen:
1. **Identify what's new** — entity, agent, capability, workflow, or screen (never a layer, contract, or invariant — those are never "new," only extended with new occupants).
2. **Identify its exclusive owner**, if it writes anything (§13.5, §13.9) — many may read; at most one may write.
3. **Check for overlap** against the existing catalog of entities (§3.16), agents (§4.19), and capabilities (§26.9) — extend an existing definition rather than create a competing one if overlap is found.
4. **Confirm Governance applies automatically** (§7.16) rather than drafting new rules by default; draft new rules only if §23.6's check finds a genuine gap, and only through the Decision Framework (§53).
5. **Confirm the crossing uses an existing contract** (§23.7) — never invent a module-specific integration.
6. **Confirm the six invariants hold** (§22.5) — the check every worked example in §24–§25 performs explicitly.
7. **Confirm the owning phase has been reached** (§47 PC-1, PC-2) before treating the extension as active rather than merely architecturally anticipated.

### 23.10 Constraints
- Every extensibility rule in this section is a citation to Parts I–III; none is newly introduced here.
- An extension is valid only if it satisfies every rule in §23.2–§23.8 for its own layer(s) — partial compliance (e.g., correct entity ownership but a divergent interaction pattern) is not a valid extension.
- The General Extension Procedure (§23.9) is the mandatory sequence for evaluating any future module, agent, capability, workflow, or screen named in this Part or added later.
- Any proposed exception to any rule in this section is evaluated through the Decision Framework (§53).

## Section 24 — Worked Examples: New Consumer Modules

### 24.1 Purpose
This section applies §23's consolidated rules and §22.5's Six Invariants to three PRD-approved future modules whose primary relationship to the existing architecture is reading from it, following the §13.7 template (Knowledge/Intelligence/Interaction/Presentation occupants, Governance applicability) already used to describe the AI Career Center concretely in Part III.

### 24.2 Worked Example: Learning Hub (Phase 1)
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

### 24.3 Worked Example: Professional Community (Phase 3)
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

### 24.4 Worked Example: Jobs & Internships — Student-Facing (Phase 2)
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

## Section 25 — Worked Examples: New Actor Types & New Capabilities

### 25.1 Purpose
This section applies §23's rules and §22.5's Six Invariants to two worked examples that introduce a genuinely new kind of external actor (Company, Service Provider — both already anticipated architecturally at SAS §2.4) and one that introduces a new Intelligence Layer capability rather than a new module at all.

### 25.2 Worked Example: Company Self-Service (Phase 2 — the Company-Facing Half of Jobs & Internships)
Per §16: company accounts create listings and review applicants; writes company-submitted job/internship listings and applicant review status. This is the same Phase 2 module as §24.4, viewed from its second, employer-facing side — separated here because it introduces a new external actor, where §24.4 did not.
**New External Actor:** Company — already named as a Phase 2 actor in SAS §2.4 ("Company (Self-Serve Job Posting) — the Phase 2 actor... engaging once Jobs & Internships is reached"), not introduced for the first time here.
**New Knowledge Occupants:** Job/Internship Listing (owned and written exclusively by Company Self-Service — the entity §24.4's student-facing side only reads) and Applicant Review Status.
**New Intelligence Occupants:** None required — listing creation and applicant review are user-directed (company-user-directed) actions, not AI-generated artifacts; this worked example, like §20.2's Subscription Lifecycle in Part IV, demonstrates a fully valid extension with no new agent.
**New Interaction Occupants:** A workflow governing listing creation and applicant review as company-user-initiated actions (§10.6's user-initiation rule, applied to a new actor exactly as it already applies to the Student/Graduate actor).
**New Presentation Occupants:** Company-facing screens (listing creation, applicant review), on the same design system — §6.15 already establishes this exact case: "a Student, a Graduate, a Company, or a Service Provider... is served by surfaces built on the same UX principles... what varies is only the content and module those surfaces render, never the philosophy."
**Governance Applicability:** Applies automatically (§7.16); the Company actor is subject to the same DPR-8-style scoping (its own data, not another company's or user's, by default) already established for the Student/Graduate actor, without requiring new Governance content.
**What Changes:** Two new Knowledge Layer entities (Listing, Applicant Review Status), owned by Company Self-Service; a new external actor engages the system.
**What Never Changes:** The five-layer structure itself; the Interaction Layer's rule set; the fact that exactly one module owns each entity — Company Self-Service does not gain write access to anything Jobs & Internships' student-facing side or the AI Career Center owns.
**Layer(s) Extended:** Knowledge, Interaction, Presentation — Intelligence is not extended (no new agent required); Governance applies without extension.
**Why No Redesign Is Required:** SAS §2.4 already lists Company as an accommodated actor before this Part was written — "the architecture accommodates all four [actor types] structurally, now; phase-gating... still governs when each actually engages the system" (§2.4). Company Self-Service activating in Phase 2 is the phase gate opening on an actor the system boundary already included, not a new boundary being drawn.
**Why Existing Modules Continue Working Unchanged:** The Student/Graduate actor's engagement with the AI Career Center, Dashboard, or any other Phase 0 module requires no awareness that a Company actor or a Listing entity exists — §24.4's Application entity reads Listings as reference data, exactly as any cross-module read already works (§11.4), without either side depending on the other's internal structure.
**Six Invariants Check:** One Graph (✓ — Listing and Applicant Review Status join the same graph) · One Coherent Intelligence (not applicable — no agent) · One Interaction Philosophy (✓ — §10.6, applied to a new actor) · One Design System (✓ — §6.15, the PRD's own stated case) · One Source of Truth (✓ — Listing has exactly one writer, Company Self-Service) · One Core Loop (✓ — a new actor's own loop is additive, per §14).

### 25.3 Worked Example: Services Marketplace (Unscheduled — "Service Provider Marketplace")
Per §16: enables students, graduates, and service providers to publish, browse, request, and review professional, educational, or career-related services. Reads Profile, skills, for relevant matching; writes Service listings, requests, reviews.
**New External Actor:** Service Provider — already named at SAS §2.4 ("Service Provider — the Unscheduled actor (§16 Services Marketplace), engaging once that module is introduced") and at PRD §24.12 ("a Service Provider profile... new entities added under this same principle when their respective phase is reached").
**New Knowledge Occupants:** Service Provider Profile (a new profile entity type, explicitly anticipated by §24.12 rather than invented here), Service Listing, Service Request, Service Review — each owned by the Services Marketplace module.
**New Intelligence Occupants:** A possible matching/ranking agent (analogous to Jobs & Internships' Opportunity Score agent, §24.4), reading Profile and skills to surface relevant listings to a Student/Graduate — a same-user-scoped read, unlike Professional Community's peer-matching case (§24.3), because it compares one user's own Profile/skills against Service Listing content, not against another individual user's private data.
**New Interaction Occupants:** Workflows for publishing, browsing, requesting, and reviewing services, each reusing the existing rule set (§5.19) — a review, for instance, follows the same user-initiated, visible, overridable pattern as a Roadmap Item status change (§21.3 in Part IV).
**New Presentation Occupants:** Screens serving both the Student/Graduate and Service Provider actors, on the same design system (§6.15).
**Governance Applicability:** Applies automatically (§7.16); §24.12's own extensibility clause already anticipates the Service Provider Profile entity, so no new Knowledge Layer scope decision is required — unlike Professional Community, this module's matching mechanism (service-to-user, not user-to-user) does not raise the DPR-10 concern ADR-001 identifies, since Service Listings are not another user's private career data.
**What Changes:** Four new entities; a new actor type; a possible new agent.
**What Never Changes:** The AI Career Center's own entities and their write-ownership; the Interaction Layer's rule set; the Presentation Layer's design system.
**Layer(s) Extended:** Knowledge, Intelligence (possible), Interaction, Presentation — Governance applies without extension.
**Why No Redesign Is Required:** §24.12 already states the Service Provider Profile entity "new entities added under this same principle when their respective phase is reached; none requires redesigning the Phase 0 Profile entity" — this Part's worked example confirms that stated extensibility holds when actually traced through all five layers, not only asserted at the entity level.
**Why Existing Modules Continue Working Unchanged:** A Student/Graduate's Profile entity (User Profiles module, §14.3) is read by the matching agent exactly as it is read by the Skill-Gap Analysis Agent today — an additional reader, never a new writer, never a change to the entity's own shape.
**Six Invariants Check:** One Graph (✓) · One Coherent Intelligence (✓, if the matching agent exists — mediated, shared-state, per §4.10–§4.11) · One Interaction Philosophy (✓) · One Design System (✓) · One Source of Truth (✓ — each new entity has exactly one owner) · One Core Loop (✓ — additive, per §14).

### 25.4 Worked Example: Future AI Capabilities
Per §26.6, four capabilities are explicitly not possessed by any Phase 0 agent: Long-Term Memory as inferential synthesis, Short-Term Memory as multi-turn conversational context, Reflection/Self-Critique as a distinct internal step, and Tool Calling. Per §26.10, a future capability may be introduced when a Phase 1–4 agent genuinely requires it, is given one precise implementation-independent definition, does not overlap an existing entry, and complies fully with §23's Responsible AI philosophy. Illustrated here with **Reflection/Self-Critique**, since §26.6 already names it as the clearest currently-unpopulated case (its function — a distinct honesty-under-failure step — is currently satisfied by Confidence Calibration alone).
**What Changes:** The Intelligence Layer's capability catalog (§26.3) gains one new entry — Reflection/Self-Critique, precisely defined, bounded the same way every existing capability is bounded (§26.7) — and whichever future agent adopts it gains a new internal reasoning step available to draw on.
**What Never Changes:** The five-layer structure; every existing agent's write-ownership and boundaries (§4.9); the three Part II contracts; every existing capability's own definition; the Governance Layer's content (RAI-7's honest-failure requirement is already satisfied by Confidence Calibration and remains satisfied — Reflection strengthens, rather than replaces, that guarantee).
**Layer(s) Extended:** Intelligence only — specifically, the capability catalog within it (§4.16: "reasoning patterns as occupants, not layers" — a new capability is a new occupant, never a new layer).
**Why No Redesign Is Required:** A capability is not a layer, an agent, or a contract (§4.5, §4.16) — it is an ability an agent draws on. Adding one changes nothing about how the Intelligence Layer crosses into Interaction (§10) or Knowledge (§11): an agent using Reflection still produces one artifact, crossing the same contract, under the same rules, whether or not it reflected internally before producing it.
**Why Existing Modules Continue Working Unchanged:** The three Phase 0 agents do not use Reflection unless individually and explicitly extended to — §26.10's constraint that a new capability serves an agent that "genuinely requires" it means adoption is per-agent, not automatic; the Skill-Gap Analysis Agent's current behavior is entirely unaffected by Reflection existing in the catalog until and unless it is specifically given to that agent.
**Six Invariants Check:** One Graph (✓ — untouched, Reflection is not a Knowledge Layer concept) · One Coherent Intelligence (✓ — a new capability shared across agents exactly as Explainability and Confidence Calibration already are, §26.5, preserves rather than fragments coherence) · One Interaction Philosophy (✓ — Reflection is internal to Intelligence; nothing about how its output is presented to a human changes, §5.11's split still holds) · One Design System (✓ — untouched) · One Source of Truth (✓ — untouched) · One Core Loop (✓ — untouched; Reflection makes an existing loop step more reliable, it does not add a new loop).

## Section 26 — Invariant Preservation Summary & Part V Closing

### 26.1 Purpose
This section consolidates §24–§25's six per-example invariant checks into one summary table, states the Architectural Constraints this Part establishes, and closes Part V with full traceability and review.

### 26.2 Consolidated Six-Invariant Preservation Matrix

| Worked Example | One Graph | One Coherent Intel. | One Interaction Phil. | One Design System | One Source of Truth | One Core Loop |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| §24.2 Learning Hub | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| §24.3 Professional Community (modeled portion) | ✓ | n/a | ✓ | ✓ | ✓ | ✓ |
| §24.4 Jobs & Internships (student-facing) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| §25.2 Company Self-Service | ✓ | n/a | ✓ | ✓ | ✓ | ✓ |
| §25.3 Services Marketplace | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| §25.4 Future AI Capabilities (Reflection) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

"n/a" marks an example with no Intelligence Layer occupant modeled — per §17.9's precedent in Part IV, an absent layer is an architectural fact stated explicitly, not a gap in compliance. Professional Community's matching mechanism remains unmodeled pending ADR-001; its invariant compliance for that specific portion is correspondingly unresolved, not assumed.

### 26.3 What This Matrix Demonstrates
Every worked example preserves all six invariants using only the extensibility rules already consolidated in §23 — none required a new rule, a new layer, a new contract, or a new module-boundary test invented for the occasion. This is the concrete proof of §22.4's thesis: extensibility is a consequence of Parts I–IV already being correctly built, not a capability that had to be separately engineered in this Part.

### 26.4 Constraints (Part-Wide)
- Every extensibility rule applied in this Part is a citation to Parts I–III (§23) — none is newly introduced.
- Every worked example is checked against all Six Invariants (§22.5); an example with an unresolved invariant (§24.3's matching mechanism) is marked as such rather than assumed compliant.
- A new module, actor, or capability is valid only if it satisfies the General Extension Procedure (§23.9) in full.
- A genuine architectural tension discovered during this Part's development is recorded as an ADR (§22.8, ADR-001), never silently resolved by inventing a Governance rule or Knowledge Layer scope decision this Part does not have the authority to make.
- No worked example activates before its owning phase is reached (§47 PC-1) — every example in §24–§25 is architectural anticipation, not a statement that any future module is now in scope for build.
- Any proposed exception to any constraint in this Part is evaluated through the Decision Framework (§53).

---

## Traceability to the PRD and SAS Parts I–IV (Part V)

| Part V Section | Primary SAS grounding | Primary PRD grounding |
|---|---|---|
| §22 Extensibility Philosophy & the Six Invariants | Part I §§3.1, 4.17, 5.16, 6.14; Part III §13 | §14, §16, §44 DPR-8/DPR-10, §47.3–47.7 |
| §23 Consolidated Per-Layer Extensibility Rules | Part I §§3.10–3.16, 4.13, 4.19, 5.19, 6.14–6.18, 7.16–7.18, 26.9–26.10; Part II §§9–12; Part III §§13–16 | §21, §24.8, §24.12, §29, §47 PC-1–PC-2, §53 |
| §24 Worked Examples: New Consumer Modules | §§3.16, 4.10, 4.19, 11.4, 13.7, 13.9, 15.2, 15.4, 15.6 | §14, §16, §24.1, §44 DPR-10; ADR-001 |
| §25 Worked Examples: New Actor Types & Capabilities | §§2.4, 4.5, 4.9–4.11, 4.16, 5.11, 6.15, 10.6, 21.3 | §14, §16, §24.12, §26.3, §26.5–26.7, §26.10 |
| §26 Invariant Preservation Summary & Closing | §22.5–22.6 (this Part) | §47.3–47.7, §53 |

No statement in Part V introduces a product behavior, module, entity, agent, capability, or business rule that is not already approved in the PRD, or already established in SAS Parts I–IV — with the single, explicitly recorded exception of the open question in ADR-001, which this Part identifies but does not resolve.

---

## Architectural Constraints (Part V, Consolidated)

1. Extensibility is a consequence of the six Platform Assumptions (PA-1–PA-6) and six Platform Constraints (PC-1–PC-6) holding, not an independently engineered feature (§22.4, §47.5).
2. Every future module, agent, capability, workflow, or screen is evaluated through the seven-step General Extension Procedure (§23.9) before being treated as architecturally valid.
3. A new entity, agent, or capability is added only after a check for overlap against the existing catalog; an overlapping candidate extends an existing definition rather than creating a competing one (§23.2–§23.3).
4. Governance applies automatically to every extension; new Governance content is drafted only when §23.6's check finds a genuine gap, and only through the Decision Framework (§53).
5. A genuine architectural tension is recorded as an ADR, never silently resolved by a downstream document exceeding its own authority (§22.8, ADR-001).
6. No worked example in this Part authorizes build of any future-phase module ahead of its approved phase (§47 PC-1).

---

## Principal Product Manager Review

**A) Approved Items**
- §22.5–§22.6 correctly derive the Six Invariants from the PRD's own PA-1–PA-6, and §22.6's mapping of each invariant to the layer structurally responsible for it is a genuine architectural insight, not a restatement — it explains *why* six invariants are the right number rather than an arbitrary checklist.
- §22.8's identification of the Professional Community / DPR-10 tension is exactly the kind of finding this Part's instructions asked for: a real gap between an approved product decision (§16) and an approved privacy boundary (§44 DPR-10), caught during architectural work rather than glossed over, and correctly routed to an ADR rather than resolved by inventing a cross-user privacy rule this document has no authority to create.
- §24.3's worked example is disciplined about its own boundary — modeling only the unambiguous portion of Professional Community and explicitly marking the matching mechanism's invariant compliance as unresolved rather than assumed, consistent with this Part's own "record, don't silently resolve" instruction.
- §25.2 and §25.3 correctly recognize that Company and Service Provider are not new actors invented by this Part — both were already named in SAS Part I (§2.4) and PRD §24.12 — and cite that prior grounding rather than re-arguing it.
- §25.4's Reflection/Self-Critique example correctly demonstrates that a capability extension touches only the Intelligence Layer's internal catalog, never a contract, a layer boundary, or another agent's behavior — a precise, minimal-blast-radius example rather than an inflated one.
- §26.2's Consolidated Matrix is honest about the one open cell (Professional Community's matching mechanism) rather than marking it compliant by default.
- No programming language, framework, API, database, deployment topology, or infrastructure term appears anywhere in this Part.

**B) Requires Changes**
None found.

**C) Final Verdict**
APPROVED.

Part V — Extensibility & Future-Phase Architecture (Sections 22–26) is complete, internally consistent, fully traceable to the PRD and to SAS Parts I–IV, and introduces no new product behavior beyond the single, explicitly-recorded open question in ADR-001. It gives Technical Architecture and Development one consolidated reference for how the system grows, and demonstrates — rather than merely asserts — that six future-phase concepts already named in the PRD fit the architecture built across Parts I–IV without requiring any of it to be redesigned.

**ADR-001** (`docs/00-Architecture-Decisions/ADR-001-professional-community-cross-user-data-scope.md`) was created during this Part's development and remains in **Proposed** status, awaiting explicit approval before Professional Community's peer-matching mechanism is architected in further detail. No other genuine architectural contradiction was discovered.

---

*This completes Part V — Extensibility & Future-Phase Architecture (Sections 22–26) of the CareerOS Solution Architecture Specification.*

---

# Part VI — Appendices

Part VI closes the SAS with reference material: a glossary, a consolidated cross-reference index, and a document map. Kept intentionally concise, per updated project direction shifting priority to implementation.

## Section 27 — Appendices

### 27.1 Purpose
Part VI closes the SAS with reference material that supports Parts I–V without adding new architectural content: a glossary, a consolidated cross-reference index, and a document map. Per standing instruction, this Part is intentionally concise — the SAS is now considered sufficient for implementation to begin, and documentation effort shifts to being produced alongside code rather than as further standalone architecture Parts.

### 27.2 Glossary of Architectural Terms

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

### 27.3 Consolidated Cross-Reference Index
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

### 27.4 Document Map — Complete SAS

| Part | Sections | Title | Status |
|---|---|---|---|
| I | 1–7 | System Architecture | Complete |
| II | 8–12 | Interface & Contract Architecture | Complete |
| III | 13–16 | Module Architecture | Complete |
| IV | 17–21 | Cross-Layer System Scenarios | Complete |
| V | 22–26 | Extensibility & Future-Phase Architecture | Complete |
| VI | 27 | Appendices | Complete |

### 27.5 Relationship to Downstream Documents
Per updated project direction, Database Design, API Specification, Technical Architecture, and AI Architecture are no longer planned as standalone documents produced ahead of implementation. Instead, each is produced in the specific, minimal form implementation actually requires (a schema alongside the code that needs it, a contract alongside the endpoint that implements it, a decision alongside the component it governs), and is kept adjacent to that code rather than compiled into a separate upfront specification. Every such fragment must still trace back to this SAS and the PRD, per §53's Decision Framework — that requirement does not relax, only the delivery form changes.

### 27.6 Closing Statement
The Solution Architecture Specification (Sections 1–27, Parts I–VI) is complete. It has established: five architectural layers (Part I), the contracts between them (Part II), the module as the unit that occupies them (Part III), thirteen real end-to-end scenarios proving the architecture behaves as the PRD promises (Part IV), and a consolidated extensibility reference proving six future-phase concepts already fit without redesign (Part V). One architectural question remains explicitly open (ADR-001) and does not block Phase 0 implementation. This document is now considered sufficient for implementation to begin.

---

*The CareerOS Solution Architecture Specification (§1–§27, Parts I–VI) is complete.*

