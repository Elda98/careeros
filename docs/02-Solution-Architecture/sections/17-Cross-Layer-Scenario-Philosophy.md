# Section 17 — Cross-Layer Scenario Philosophy

*Part IV — Cross-Layer System Scenarios · Solution Architecture Specification (SAS) · CareerOS*

## 17.1 Purpose
Parts I–III establish, respectively, what the architecture *is* (five layers), what must cross *between* layers (three contracts), and what a *module* is (a vertical slice bounded by write-ownership). None of the three shows the architecture actually operating end-to-end, over time, in response to something a real user does. This section defines the System Scenario as the concept that closes that gap, and the sections that follow apply it to every scenario already supported by the approved PRD.

## 17.2 Relationship to the PRD
A scenario introduces no product behavior of its own. Every scenario in §18–§21 is a specific, already-approved sequence traced from the Core Loop (§14), the Feature Inventory (§18 PRD), the Functional Requirements (§19), the Business Rules (§21), the AI Workflows (§27), the Human-AI Interaction Model (§28), and the Data Privacy Requirements (§44) — assembled into one continuous path, never extended beyond what those sections already state.

## 17.3 Relationship to SAS Parts I–III
A scenario is where Part I's layers, Part II's contracts, and Part III's module boundary are all exercised at once, concretely. Every layer a scenario passes through behaves exactly as Part I specifies; every crossing a scenario makes uses exactly one of Part II's three contracts; every entity a scenario touches is written only by the module that owns it, per Part III. A scenario proves the first three Parts are jointly sufficient to describe real behavior — it does not add a fourth layer, a fourth contract, or a new kind of module boundary.

## 17.4 System Scenario Defined
A **System Scenario** is a complete, traceable path through the architecture: from a trigger, through every layer it touches in sequence (Presentation → Interaction → Intelligence → Knowledge, or a subset), under Governance's simultaneous constraint, to a completion condition the user can observe. A scenario is defined architecturally — by which layers participate and what crosses between them — not by how a screen looks or how a user feels moving through it.

## 17.5 System Scenario vs. AI Workflow
An **AI Workflow** (§27) is Intelligence-Layer-centered: a trigger, the agent(s) it invokes, the graph entities read and written, and the resulting artifact. A System Scenario is broader — it is the full cross-layer path the workflow sits inside, including the Presentation surface that displayed the trigger, the Interaction rule that made the trigger legitimate (§10.6), and the Governance constraints active throughout. A Workflow is one Scenario's Intelligence-Layer segment; a Scenario may contain zero AI Workflows (e.g., §20.2's subscription scenarios touch no agent), exactly one (e.g., §19.4's CV Feedback Round), or a cascading sequence of them (e.g., §19.3's regeneration scenario chains two).

## 17.6 System Scenario vs. User Journey
A **User Journey** is a UX-Design concept: the sequence of screens, states, and emotional beats a user experiences, including visual and interaction design decisions not yet made. It belongs to the UX/UI Design document downstream of this one. A System Scenario is architecturally scoped — it states which layers participate and what crosses between them, never how a screen is laid out, what copy it uses, or how a transition feels. Two different User Journeys (a first-time user, a returning power user) can both be instances of the same single System Scenario, provided the same layers participate the same way.

## 17.7 System Scenario vs. Module Behavior
**Module Behavior** (Part III, §13–§16) is static: what a module owns, reads, and is responsible for, independent of time. A System Scenario is dynamic: one specific, time-bound execution path, which may pass through a single module's boundary (§19.4, entirely inside the AI Career Center) or cross multiple module boundaries in sequence (§18.2, crossing Authentication → User Profiles → the AI Career Center). A scenario never redraws a module boundary Part III already established; it only shows that boundary being crossed correctly, per §11's read/write rules.

## 17.8 The Eight Cross-Cutting Architectural Properties
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

## 17.9 Scenario Description Template
Every scenario in §18–§21 is described with the same ten elements, in the same order: Trigger; Participating Module(s); Participating Layers (with per-layer responsibility); Knowledge Operations; Intelligence Operations; Interaction Responsibilities; Presentation Responsibilities; Governance Constraints; Completion Condition; Properties Preserved (§17.8) and Boundary Integrity (why no Part I–III boundary is crossed incorrectly). A scenario with no Intelligence Layer participation states that explicitly, rather than omitting the element — absence of a layer is itself an architectural fact worth stating (§17.5).

## 17.10 Scenario Selection and PRD Traceability
Every scenario named in the task that names an approved PRD mechanism is included, at the grain the PRD actually specifies it. Two required scope judgments are recorded here rather than silently resolved:
- **"Data Export Request"** is not an approved PRD feature. The PRD supports viewing what data is stored (FR-SET-2, DPR-3) and deleting it (FR-SET-3, DPR-4) — it never defines a downloadable or formatted export artifact. §20.3 is written as **"Data Access Request (View Stored Data)"**, the scenario the PRD actually supports; a literal export/download scenario is excluded as exceeding PRD scope, per this Part's own instruction to explain and exclude rather than invent.
- **"Subscription Upgrade"** has no dedicated business rule, trigger, or screen distinct from general subscription management — only FR-SET-1 ("view and manage subscription and billing") covers it, alongside the specifically-defined Renewal (FR-RENEW-1–2, BR-SUB-3) and Cancellation (FR-SET-4, BR-SUB-1–2, 4–5) mechanics. §20.2 presents all three under one scenario, **"Subscription Lifecycle,"** and is explicit about which parts of it (Renewal, Cancellation) are governed by a named rule and which (Upgrade) is covered only by FR-SET-1's general management capability.

No other requested scenario required exclusion or renaming; all others map directly onto an already-named PRD mechanism (§18.2–§21.3 cite the specific FR/BR/Workflow each is built from).

## 17.11 Boundary of This Section
Consistent with §1.7, §8.7, and §13.10, no scenario in this Part names a programming language, framework, API, database, deployment topology, or infrastructure choice. Every scenario is expressed entirely in terms of triggers, layers, entities, operations, and governance constraints — never in terms of how any of those would be technically executed.

---
*Part of the SAS, Part IV. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§1.7, 3.8, 4, 5.9, 7.4, 9–11, 13–16; PRD §§14, 18, 19, 21, 24.7, 25.9, 27, 28, 29, 44.*
