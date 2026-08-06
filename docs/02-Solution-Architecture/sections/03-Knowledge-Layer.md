# Section 3 — Knowledge Layer Architecture

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 3.1 Purpose of the Knowledge Layer
The Knowledge Layer realizes §1.4's definition and §1.6's PA-1 (one graph). Its architectural responsibility is singular: hold the one authoritative representation of a user's career state that every other layer depends on. Nothing in Interaction, Intelligence, Presentation, or Governance reasons, presents, or constrains anything without ultimately depending on what this layer holds.

## 3.2 Relationship to the PRD
Every claim in this section traces to the PRD — primarily §24, with supporting material from §25 (ownership), §26 (grounding), §27 (workflow read/write patterns), §30 (memory), §43–§45 (consolidated requirements), and §47 (Platform Assumptions). This section formalizes what those sections already established; it introduces nothing new.

## 3.3 Relationship to the Career Knowledge Graph
The Knowledge Layer *is* the Career Knowledge Graph — not an analogy, not something built on top of it. §24.1's definition, §24.3's entity catalog, and §24.12's constraints are this layer's architectural specification in full.

## 3.4 What Belongs Inside the Knowledge Layer
Exactly, and only, §24.3's entities: Profile, Goal (current and history), Skill-Gap Analysis (versioned), Roadmap (versioned, composed of Items), CV/Profile Feedback Rounds, and the derived signals computed from them.

## 3.5 What Explicitly Does Not Belong Inside It
- **Account-level data** — identity, billing/subscription state, notification preferences — exists alongside the Knowledge Layer, never inside it (§24.1, §24.12).
- **Progress** is not a stored entity — it is a read pattern across the entities in §3.4, exactly as §24.3 already establishes.
- **An agent's transient reasoning** during a single invocation does not belong here — that is Short-Term Memory (§30.4), and it enters the Knowledge Layer only if and when an agent's defined write commits it (§30.12).

## 3.6 Architectural Boundaries
An entity is inside the Knowledge Layer if and only if it is one of §3.4's defined entities, or a future entity added under §3.16's extensibility rule. This boundary is definitional, not physical — it is §24.12's scope discipline stated as an architectural test rather than a product constraint.

## 3.7 Knowledge Ownership
The user owns the data the Knowledge Layer holds (§21 BR-DATA-1, §30.6); the layer holds it in service of that user and never repurposes it across users by default (§23.3, §23.8, §29 RAI-13). This is a distinct concept from write-ownership (§3.10) — this section addresses who the data belongs to; §3.10 addresses which agent is permitted to write it.

## 3.8 Single Source of Truth
For any fact about a user's career state, exactly one current value exists at any time (§24.7, §47 PA-5). This is what makes every other layer's behavior deterministic: the Intelligence Layer never reconciles disagreeing inputs, and the Presentation Layer never chooses between two candidate values. Single source of truth is not a data-integrity nicety — it is what keeps the rest of the architecture simple (§0.4 Principle 7), by removing an entire category of problem the other four layers would otherwise have to solve independently.

## 3.9 Entity Relationships

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

## 3.10 Read vs. Write Ownership
Many agents may read a given entity; exactly one agent writes it (§25.8). This is not merely a policy — it is the architectural mechanism that makes "no duplicate state" and "no competing knowledge store" structurally true rather than aspirationally true. §47 PC-5 ("no parallel data ownership exists anywhere in the system") is enforced precisely because this rule leaves no entity with two possible writers to disagree.

## 3.11 Shared State Across Agents
Every occupant of the Intelligence Layer reads the same Knowledge Layer; none maintains a private copy (§25.9). This is the architectural precondition for coherent multi-agent reasoning: because there is only one place any agent's reasoning can be grounded, disagreement between agents about what is currently true is not merely discouraged — it is structurally impossible, since there is no second record for them to disagree against.

## 3.12 Why Intelligence Can Never Become the Source of Truth
The Intelligence Layer's entire architectural role (§25) is to read and, for entities it owns, write the Knowledge Layer — never to hold an independent record that the Knowledge Layer would need to reconcile against. If an agent's reasoning were itself treated as authoritative apart from what it writes back, §3.8's single-source-of-truth guarantee would already be broken: two records of the same fact would exist, one in the graph and one in an agent's working state, with no rule for which governs. This is not a minor technical risk — it is the precise mechanism by which §4's root diagnosis of existing tools (fragmentation across systems each holding a partial, disagreeing picture of the user) would re-enter CareerOS internally. The Knowledge Layer is the source of truth *because* nothing else is permitted to be.

## 3.13 Relationship to Memory
§30.5 already establishes that Long-Term Memory *is* the Career Knowledge Graph — not a companion structure beside it. §30.4 establishes that Short-Term Memory is the context an agent holds for one Intelligence Layer invocation, discarded unless explicitly committed (§30.12: "what isn't written doesn't persist"). This is the architectural answer to why Memory is not a sixth layer: Long-Term Memory is fully absorbed into the Knowledge Layer, and Short-Term Memory is fully absorbed into the Intelligence Layer's transient working state. Introducing a separate Memory layer would duplicate a concept that already has two precise homes.

## 3.14 Relationship to AI Workflows
Every workflow's Reads and Writes columns (§27.3–§27.10) are Knowledge Layer operations by definition. The Knowledge Layer is also what makes the Handoff Rules (§25.10) enforceable in the first place — "act on current input, never a stale one" (HR-2) is only a meaningful instruction because §3.8 guarantees there is exactly one current value to check against.

## 3.15 Relationship to Future Modules
Consistent with §2.8's "modules as vertical slices," a future module — Learning Hub, Jobs & Internships, Services Marketplace, or any other named in §16 — adds new entities to this same Knowledge Layer. It never introduces a second Knowledge Layer or a competing store (§24.8, §24.12).

## 3.16 Extensibility Without Redesign
A new entity can reference existing ones — a future Learning Hub entity reading Skill-Gap Analysis, for instance — without those existing entities changing, because read access is already unrestricted (§3.10) while write access remains exclusively scoped to whichever new agent or module owns the new entity. Extensibility is not a separate property engineered on top of this layer; it is a direct consequence of §3.9's relationships already being additive and §3.10's ownership rule already being exclusive per entity, exactly as §24.12 and §47's NFR-SCALE-1 already state.

## 3.17 Constraints
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
*Status: Approved. Traces to PRD §§4, 14, 21, 23–30, 43–45, 47, 53.*
