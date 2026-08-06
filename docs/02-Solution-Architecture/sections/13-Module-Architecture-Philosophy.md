# Section 13 — Module Architecture Philosophy

*Part III — Module Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 13.1 Purpose
Part I established five structural layers. Part II established the contracts that let those layers actually exchange something at their boundaries. Neither Part answers a question a real system immediately raises: when a concrete piece of product — the AI Career Center, Learning Hub, Jobs & Internships — is built, what is it, architecturally? This section defines that unit: the Module.

## 13.2 Relationship to the PRD
Traces principally to §16 (Platform Modules), which already names every module, its phase, and its read/write relationship to the Career Knowledge Graph, and to §24.2, §24.8, §24.12, which already establish why one shared graph exists and how modules relate to it. This section formalizes what §16 and §24 already imply structurally; it introduces no module, phase, or read/write relationship that is not already there.

## 13.3 Relationship to SAS Part I
§2.8 already states the core finding this Part builds out in full: "A Module is not a sixth layer. It is a vertical slice cutting across all five layers at once." §2.13's extensibility table and §7.16's Governance-applies-automatically finding are the other two load-bearing statements from Part I that this Part now makes operational rather than summary.

## 13.4 Relationship to SAS Part II
Two modules never communicate directly. Where one module depends on another — a future module reading an entity the AI Career Center owns, Dashboard surfacing the Roadmap Agent's output — that dependency is expressed through the same three boundary contracts Part II already defines (§9–§11), never through a module-specific channel invented for the occasion. Part III does not add a fourth contract; it shows the three already defined ones operating between modules, not only within one.

## 13.5 What a Module Is Architecturally
A Module is a named, bounded unit of product capability, defined by exactly one thing: the set of Knowledge Layer entities it exclusively writes (§25.8's ownership rule, applied at module granularity). Everything else about a module — which agents it contains, which workflows it drives, which screens present it — follows from that write-ownership; none of those other things is what defines the module's boundary.

## 13.6 Why a Module Is a Vertical Slice, Not a Sixth Layer
The five layers (§1.4) are horizontal: each spans every module that exists or will exist. A module is vertical: it occupies a slice of all five layers at once, contributing its own entities to Knowledge, its own agents (where it has any) to Intelligence, its own workflows to Interaction, and its own screens to Presentation — constrained by the one Governance Layer every module shares. A module is never an alternative to the five-layer structure and never a partial instance of it; it is a full cross-section through all five, every time.

## 13.7 Module Internal Composition
Every module, present or future, is described by the same five-part template:
- **Knowledge occupants** — the entities it exclusively writes, plus the entities elsewhere in the graph it reads as reference input.
- **Intelligence occupants** — the agents (if any) whose write-ownership belongs to this module; a module may have zero dedicated agents and still be a valid module (§13.9).
- **Interaction occupants** — the named workflows (§27) that govern how a human engages this module's outputs.
- **Presentation occupants** — the screens (§22) that render this module's Interaction-governed content.
- **Governance applicability** — the same Business Rules, RAI items, and NFRs (§21, §29, §43) that apply everywhere, applied to this module's specific entities and agents.

## 13.8 Module Responsibilities
A module is responsible for the correctness and completeness of its own vertical slice — that its entities are well-formed, its agents (if any) satisfy every Intelligence Layer constraint (§4), its workflows satisfy every Interaction Layer rule (§5), and its screens satisfy every Presentation Layer constraint (§6). A module is never responsible for another module's correctness, and is never permitted to reach into another module's write-ownership to correct or complete it.

## 13.9 Module Boundary Definition
A module's boundary is drawn by a single test, applied to any candidate piece of product capability: *which entity would this write, and is that entity already owned by an existing module?* If the answer names a new entity with no existing owner, it either belongs to an existing module (if that module's already-approved scope covers it) or defines a new module. Reading an entity is never boundary-defining — many modules may read the same entity (§11.4); only write-ownership draws the line. A module with no entities of its own but that reads across the graph to compose a view — as §13.9 anticipates and §14.9 shows concretely — is still a valid module under this test, because its boundary is drawn by what it does *not* write, not only by what it does.

## 13.10 Boundary of This Section
Consistent with §1.7 and §8.7, this Part names no programming language, framework, API, database, deployment topology, or infrastructure choice anywhere. Every statement about module composition is expressed in terms of entities, agents, workflows, screens, and governance — never in terms of how any of those would be technically built or hosted.

---
*Part of the SAS, Part III. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§1.4, 1.7, 2.8, 2.13, 7.16, 8, 9–11, 25.8; PRD §§16, 24.2, 24.8, 24.12.*
