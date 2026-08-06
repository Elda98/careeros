# Section 15 — Module Boundaries, Dependencies & Independence

*Part III — Module Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 15.1 Purpose
§14 drew the AI Career Center's boundary. This section states what may legitimately cross that boundary in each direction, and why a module bounded this way remains independent — able to change internally without forcing change elsewhere — without being isolated from the rest of the system.

## 15.2 What May Depend on the AI Career Center Module
Anything that *reads* one of the module's three owned entities (§14.3) may depend on it, subject to §11.4's shared-read rule:
- **Dashboard module** — reads the Roadmap Agent's item-level output to power next-action surfacing (§25.5); this dependency is why Dashboard Next Action (§27) is a workflow that crosses into this module without belonging to it (§14.5).
- **Notifications module** — reads the module's agent runs as event triggers (§16) — a new Analysis, a regenerated Roadmap, completed CV feedback — without ever writing back into any of the three owned entities.
- **Future modules, once scoped** — Learning Hub reads Skill-Gap Analysis (§16: "Skill gap"); Portfolio reads Roadmap-derived content (§16: "roadmap-derived projects"); Jobs & Internships reads Skill-Gap Analysis alongside Profile and Goal (§16: "Profile, goal, skills"). Each is a future read dependency already anticipated by §16's table, none yet active because none of those modules is in scope (§13 PC-1).

No module — present or future — may ever write to Skill-Gap Analysis, Roadmap, or CV/Profile Feedback Round. That exclusivity is not a convention this module happens to follow; it is §25.8's ownership rule and §47 PC-5's "no parallel data ownership," restated at module granularity.

## 15.3 What the AI Career Center Module May Depend On
The module reads, but never writes:
- **Profile and Goal** (User Profiles module) — read by all three agents as comparison input (§25.4, §25.6).
- **Identity linkage** (Authentication module) — read only to anchor its own entities to the correct user (§14.9).
- **AI/memory control preferences** (Settings module) — read to determine whether stored analysis data has been user-deleted (§21 BR-DATA), constraining what the module's agents may read or retain, never what they may write elsewhere.

The module depends on no other module's Intelligence occupants (agents), Interaction occupants (workflows), or Presentation occupants (screens) — only on Knowledge Layer entities those modules own, crossed through the same Intelligence↔Knowledge contract (§11) every other read in this architecture uses.

## 15.4 Why Module Independence Holds
Every dependency named in §15.2 and §15.3 is expressed as a Knowledge Layer read, crossing the boundary defined in §11, never as a direct call from one module's agent, workflow, or screen into another's. Because §11's contract is the only channel, a dependent module can only ever be affected by a change in *what is written* to an entity it reads — never by how the owning module's internals (its agents' reasoning, its workflows' sequencing, its screens' layout) happen to work. This is HR-4 (§25.10 — "if a downstream agent's run fails, the upstream agent's output remains valid and visible") generalized from agent-to-agent to module-to-module: a fault or a change contained inside one module's internal composition does not propagate through the Knowledge Layer boundary unless the module actually writes something different.

## 15.5 Module Independence Is Not Isolation
§15.2–§15.3 show the AI Career Center is read by one existing module (Dashboard, indirectly via Notifications too) and reads from two others (User Profiles, Authentication) already, in Phase 0. Independence does not mean a module stands alone — §24.2 already establishes why one shared graph exists rather than per-module data specifically so that modules *can* depend on each other's output. Independence means dependency is only ever expressed through the contracts in Part II, never through a private, module-specific integration invented outside them.

## 15.6 Contracts Reused, Not Reinvented, at Module Boundaries
When Dashboard reads the Roadmap Agent's output, that crossing is an ordinary instance of the Intelligence↔Knowledge contract (§11) — the same contract instance the Roadmap Agent itself uses to write the entity in the first place, read now by a different module. When a future Learning Hub agent eventually reads Skill-Gap Analysis, it will use that same contract, unmodified. §12.6 already establishes this for modules in general ("a module does not receive its own version of these contracts"); this section confirms it holds for the one module currently built, not only as a future promise.

## 15.7 Why Modules Can Evolve Without Redesigning the Architecture
Because a module's boundary is drawn entirely by write-ownership (§13.9) and every cross-module dependency is a Knowledge Layer read through an unchanged contract (§15.6), the AI Career Center's own internals may evolve — a fourth capability added to an existing agent, a workflow's sequencing refined, a screen redesigned — without requiring Dashboard, Notifications, or any future module to change, provided the shape of the three owned entities and what they mean does not change. Conversely, a wholly new module (§16) can be introduced by adding new entities, agents, workflows, and screens without altering anything already described in §14, because nothing about the AI Career Center's own boundary depends on how many other modules exist.

## 15.8 Failure Containment
If one of the AI Career Center's three agents fails to produce a valid write, §4.18's fail-safe rule already applies — no write occurs, and the entity's last valid state remains visible. Because every dependent module (Dashboard, Notifications, future readers) only ever sees the entity's last written state, not the agent's internal failure, a failure inside this module never produces a visibly broken state anywhere else. This is §15.4's independence property under the specific case of failure, not only under the general case of change.

---
*Part of the SAS, Part III. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§4.18, 11, 12.6, 13.9, 24.2, 25.8, 25.10; PRD §§16, 21, 25.4–25.6, 47.*
