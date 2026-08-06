# Section 4 — Intelligence Layer Architecture

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 4.1 Purpose of the Intelligence Layer
The Intelligence Layer realizes §1.4's definition and §1.6's PA-2 (one coherent intelligence). Its responsibility is the specialized reasoning that acts on the Knowledge Layer, producing the artifacts and recommendations the rest of the system presents and governs. It exists because the Knowledge Layer, alone, is inert — it can hold a user's career state, but the promise that state implies, a system that works *for* the user (§1), requires something to do the working. The Intelligence Layer is that something.

## 4.2 Relationship to the PRD
Traces to §25 (Agent Ecosystem), §26 (Capability Map), §27 (AI Workflows), §30 (Memory — the short-term portion), §47 (Platform Assumptions), §53 (Decision Framework). This section formalizes what those sections already established.

## 4.3 Relationship to the Knowledge Layer
The Intelligence Layer reads from, and for entities it owns writes to, the Knowledge Layer — and does nothing else with respect to state. §3.12 already establishes it may never become an independent source of truth; every subsequent rule in this section is built on that constraint holding.

## 4.4 Relationship to Agents
Agents (§25) are the Intelligence Layer's primary occupants. For Phase 0, exactly three: Skill-Gap Analysis, Roadmap, and CV/Profile Feedback (§25.3), each with exclusive write-ownership of one Knowledge Layer entity (§25.8, §3.10).

## 4.5 Relationship to Capabilities — Why Capabilities Are Not Agents
An Agent is a bounded responsibility holding exclusive write-ownership; a Capability is a reusable ability an agent draws on to fulfill that responsibility (§26.2). A capability holds neither a responsibility nor any write-ownership, so it cannot be an agent by definition, not merely by convention. Explainability, Confidence Calibration, and Grounding are shared across all three Phase 0 agents (§26.4–26.5) precisely because they are capabilities: if they were agents, each would need an entity to own, and none exists for them to own.

## 4.6 Relationship to AI Workflows — Why Workflows Are Not Agents
A Workflow (§27) is a named path from a trigger to an outcome — it describes a sequence, not a responsibility. An agent is defined by what it owns; a workflow is defined by what it connects. A workflow can span zero agents entirely — Dashboard Next Action (§27.9) and Change Explanation (§27.10) invoke none — which is only coherent because a workflow is a categorically different kind of thing from an agent, not a variant of one.

## 4.7 Relationship to Memory
What an Intelligence Layer occupant holds during a single invocation is Short-Term Memory (§30.4) — entirely internal to that momentary operation, never itself part of the architecture's persistent state. Nothing about an agent's reasoning survives past its own invocation except what it explicitly writes to the Knowledge Layer (§30.12).

## 4.8 Relationship to Human Interaction
Every Intelligence Layer output is advisory (§23.4, §29 RAI-1); the Interaction Layer is where a human reviews, questions, and acts on it. This is the Intelligence Layer's own constraint, not one imposed on it from outside — an agent capable of acting without this boundary would be architecturally indistinguishable from unsupervised execution, which §23.4 already forecloses entirely.

## 4.9 Agent Responsibilities and Boundaries
Each agent's boundary is exactly the entity it writes plus whatever it is permitted to read (§25.4–25.6). No agent's boundary overlaps another's write-ownership (§25.8) — this is enumerated in full in §3.9 and §3.10 and is not restated here beyond this reference.

## 4.10 Agent Communication — Mediated, Never Direct
Agents do not communicate with one another directly; no channel exists between them. All coordination happens through the Knowledge Layer — one agent writes an entity, and a workflow's trigger condition (§27) determines whether and when another agent subsequently reads it. This is deliberate, not a gap: a direct channel would let one agent "know" something the Knowledge Layer doesn't yet, or never will, reflect — breaking §24.7's single source of truth from the inside. Mediated-only communication is what keeps §4.11's shared-state guarantee intact under multi-agent operation.

## 4.11 Shared State
Every agent's reasoning is grounded in the same Knowledge Layer; none holds a private, competing record (§25.9). This is what "shared ground truth" means architecturally, and it is the precondition for §4.10's communication rule making sense at all.

## 4.12 Read/Write Rules
Many agents may read a given entity; exactly one writes it (§25.8, §3.10). Applied here, this is what prevents two agents from ever producing conflicting outputs about the same fact (§25.12).

## 4.13 Agent Coordination — Why Coordination Is Not Another Agent
Coordination between agents is not a reasoning task requiring judgment — it is a fixed property of how a workflow is specified (§27's trigger and cascade conditions, §25.10's Handoff Rules). Whether the Roadmap Agent runs after the Skill-Gap Analysis Agent is not decided dynamically by an interpreting intelligence each time; it is determined by an already-approved rule (§21 BR-ROAD-2). Because the decision is fixed rather than judged, it does not meet §25.3's actual definition of a responsibility — introducing a coordinating agent would assign it a job that isn't a reasoning job, and would also require a direct channel to the agents it coordinated, violating §4.10.

## 4.14 Agent Delegation
The handoff mechanism (§25.10, §4.13) is the current expression of what a future explicit delegation pattern would extend. Today, delegation is workflow-defined sequencing: one agent's output becomes another's input because a rule says so, not because the first agent requested it. This is structurally compatible with a future pattern where an agent's own reasoning determines that another agent's capability is needed — such a pattern would still route through the Knowledge Layer (§4.10) and would still require the receiving agent to satisfy its own boundaries (§4.9). It extends the existing mechanism; it does not require a different one.

## 4.15 Reasoning Ownership
Each agent owns the reasoning behind its own output, and no one else's (§25.3, §25.8). No agent second-guesses or silently overrides another's conclusion; where an output built on another's work needs to change because that input changed, this is handled through regeneration (§27.5–27.6), never through one agent overruling another directly.

## 4.16 Reasoning Patterns as Occupants, Not Layers
Analysis/Comparison, Planning, Critique/Evaluation, and the shared Explainability, Confidence Calibration, Change Awareness, and Grounding (§26.3) are occupants within the Intelligence Layer, not layers of their own. A reasoning pattern never becomes a layer because it has no boundary of its own to defend — it exists only in service of whichever agent's responsibility it supports, exactly as §26.2 already distinguishes an agent (a *who*) from a capability (a *how-able*).

## 4.17 One Coherent Intelligence
Despite holding multiple agents, the Intelligence Layer presents as one coherent intelligence (§25.9, §1.6 PA-2) through three guarantees operating together: shared state (§4.11) means no agent can contradict another about a fact; mediated-only communication (§4.10) means there is no hidden coordination the user could be inconsistently exposed to; invisible seams (§25.9) means the user experiences a result, not a sequence of named participants. Coherence is a structural consequence of how this layer is built, not a presentation-level polish added afterward.

## 4.18 Failure Handling (Architectural)
When an agent cannot produce a reliable output, it says so rather than writing a plausible-but-wrong result (§23.10, §21 BR-AI-5, §29 RAI-7). Architecturally, this means a failed operation performs no write at all — the Knowledge Layer's prior valid state remains current, untouched (§21 BR-ROAD-3, §29 RAI-8), and §3.8's single-source-of-truth guarantee holds through failure exactly as it does through success. This is also what makes retry safe to introduce later without redesign: because a failed attempt is guaranteed to leave no partial write behind, re-attempting an operation can never compound onto corrupted state.

## 4.19 Future Agent Extensibility
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

## 4.20 Constraints
- Exactly one Intelligence Layer exists, however many agents occupy it.
- No agent communicates with another directly; all coordination is mediated through the Knowledge Layer (§4.10).
- No two agents may write the same entity (§4.12).
- No capability, workflow, or coordination mechanism may become an agent without meeting §25.3's actual definition of one (§4.5, §4.6, §4.13).
- Every output remains advisory; the Intelligence Layer never bypasses the Interaction Layer (§4.8).
- Failure never leaves a partial write (§4.18).
- Future agents extend this structure without requiring existing agents to change (§4.19).
- Any proposed exception is evaluated through the Decision Framework (§53).

---
*Status: Approved. Traces to PRD §§1, 3, 4, 21, 23, 25–27, 29, 30, 53.*
