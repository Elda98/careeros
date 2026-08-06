# Section 6 — Presentation Layer Architecture

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 6.1 Purpose of the Presentation Layer
The Presentation Layer realizes §1.4's definition and §1.6's PA-4 (one design system). Its responsibility: give perceivable form to whatever the Interaction Layer already governs, so a human can see, read, and act on what the system has produced. It has no responsibility beyond this — it does not decide what to show, only how the already-decided thing is made visible.

## 6.2 Relationship to the PRD
Traces to §22 (Screen Inventory), §31 (UX Principles), §33 (Brand Identity & Voice), §34 (Design System Direction), §37 (Accessibility & Inclusivity Standards), §16 (module structure), §47, §53.

## 6.3 Relationship to the Interaction Layer — Why Presentation Is Not Interaction
Interaction defines the rule of engagement — what must be explainable, when confidence must be shown, how control is guaranteed (§5.6). Presentation is the surface that rule takes shape on. A rule and its surface are architecturally distinct because a rule is stable across every place it applies, while a surface can vary — a future channel (§6.17) could render the same rule differently without the rule itself changing. If Presentation and Interaction were one layer, that independence would be lost: consistency (§5.16, §31.7) would have to be re-verified per surface rather than guaranteed once, at the rule level, and inherited by every surface built afterward.

## 6.4 Relationship to Screens (§22)
Every Phase 0 screen (§22 #1–16) is a Presentation Layer instance — each already carries a purpose, primary actions, and empty/loading/error states that are themselves expressions of the Interaction Layer's rules (§5.6, §5.13), not decisions made independently at the screen level. The Presentation Layer is not "screens" as a category — it is the architectural function screens exist to fulfill.

## 6.5 Relationship to UX Principles (§31)
§31's principles — simplicity (§31.3), progressive disclosure (§31.4), visibility of system state (§31.8), error communication (§31.9), trust through interaction (§31.10), continuity (§31.11), accessibility (§31.12), scalability (§31.13) — are the Presentation Layer's own operating principles, not imposed on it from outside. They are what this layer is architecturally required to satisfy at every surface it produces.

## 6.6 Relationship to the Design System (§34)
§34.6 establishes the design system as this architecture's visual counterpart to the Career Knowledge Graph, the Agent Ecosystem, Capability reuse, and Workflow consistency — one shared language, reused rather than reinvented per screen. The Presentation Layer is where that language is deployed; the Design System (§34) is the discipline governing how it's deployed consistently.

## 6.7 Relationship to Voice & Content (§33)
Every word the Presentation Layer displays follows §33's voice principles — plain, direct, never commanding (§33.10), calibrated to the same confidence the Interaction Layer requires (§33.11, §5.12). Voice is not a Presentation Layer decision; it is a constraint this layer inherits and must express faithfully, exactly as §33.14 already establishes for AI-generated content specifically.

## 6.8 Relationship to Accessibility (§37)
§37.6 establishes that accessibility applies equally to every touchpoint, and that the product's overall accessibility is gated by its weakest surface, not averaged across surfaces. This makes accessibility a Presentation Layer obligation at every instance it produces — no surface is exempt, since one inaccessible surface is sufficient to fail the standard for the product as a whole.

## 6.9 Architectural Boundaries — What Belongs Inside Presentation
Only the rendering of content, hierarchy, and state already determined by the Interaction Layer (§5.6), the Knowledge Layer (§3.4), and the Intelligence Layer (§4). Presentation determines *how* something is shown — its structure, hierarchy, and accessibility characteristics — never *what* is shown or *whether* it should be.

## 6.10 What Never Belongs Inside It
- **Business logic** (§21) — a screen never independently decides what counts as a material change, a valid submission, or an eligible action; it renders the outcome of a decision made elsewhere.
- **AI reasoning** (§4) — no Presentation Layer surface computes an analysis, a recommendation, or a confidence level; it displays one already produced.
- **Policy** (§29, §43–§45) — a screen never decides, on its own, what must be explainable, visible, or user-controllable; it expresses decisions §5 and §21/§29 already made.
- **Persistent state** (§3) — nothing a surface displays is itself the authoritative record; the record is the Knowledge Layer, and Presentation is only ever a reflection of it.

## 6.11 Why Presentation Is Never the Source of Business Logic, Reasoning, or Policy
If a Presentation Layer surface computed or decided any of §6.10, it would become a second place the corresponding fact could be determined — exactly the risk §3.8's single source of truth and §24.7 exist to foreclose, extended here from data to logic. A screen that quietly enforced its own version of a business rule, or silently reformulated a recommendation, would let CareerOS disagree with itself depending on which surface a user happened to be looking at — the same fragmentation §4 identifies in the tools CareerOS replaces, reintroduced at the presentation boundary instead of the data boundary.

## 6.12 How Presentation Expresses — Not Defines — the Interaction Layer
Every Interaction Layer rule (§5.6) has a Presentation Layer expression, but the expression is never the origin of the rule. Explainability (§5.11) is expressed as a way to reach an explanation; Presentation does not decide whether one should exist. Confidence (§5.12) is expressed as a visible signal; Presentation does not decide when confidence is low. This one-directional relationship — Interaction determines, Presentation expresses — is what makes §5.16's cross-module consistency achievable: because Presentation never originates a rule, it cannot originate a *different* rule for a different module either.

## 6.13 Independence from Implementation Technology
Nothing about the Presentation Layer's architectural role depends on how it is eventually realized. Its responsibility — expressing already-determined content, hierarchy, and state — is stated entirely in terms of what must be true of the result, never in terms of the technology used to produce it, consistent with this document's own boundary (§1.7) and the PRD's exclusion of UI implementation from its scope (§0.1).

## 6.14 Consistency Across Modules
§31.7 and §34.12 require every module, present or future, to use the same interaction pattern and design system rather than inventing its own. Architecturally, the Presentation Layer has exactly one operating philosophy (§6.5–§6.7) applied across every module's surfaces — a future module does not receive a different Presentation Layer, it receives new instances of the same one.

## 6.15 Architectural Support for Multiple Future User Roles
The Presentation Layer's philosophy does not vary by role. A Student, a Graduate, a Company, or a Service Provider (§8, §9) is served by surfaces built on the same UX principles (§31), the same design system (§34), and the same voice (§33) — what varies across roles is only the content and module those surfaces render, never the philosophy governing how they render it. This is §6.14's consistency guarantee extended from modules to roles: role-specific surfaces are new instances of one Presentation Layer, never a reason to define a second one.

## 6.16 Relationship to Trust, Clarity, Transparency, and Explainability
From a presentation perspective, trust is not built by anything this layer adds — it is built by faithfully expressing what the Interaction Layer already requires (§6.12) without distortion, omission, or embellishment. A surface that made an output look more confident, more finished, or more authoritative than the Interaction Layer's own signal would break trust at exactly the point §31.10 and §33.16 identify as where trust is actually won or lost — not through decoration, but through accurate representation of what the system genuinely knows and doesn't.

## 6.17 Relationship to Future Platforms and Channels
§13 leaves Platform Surface — which channel(s) CareerOS is eventually built for — explicitly open (§55). The Presentation Layer's architecture does not depend on that question being resolved: because Interaction defines the rule and Presentation only expresses it (§6.12), any future channel would express the same rule set, whichever channel it turns out to be. This is a structural property of the layer boundary established in §1.4, not a hopeful assumption about how that open question resolves.

## 6.18 Relationship to Future Modules and Extensibility
A future module (§16) adds new Presentation Layer surfaces expressing the same rule set (§6.14) over new Knowledge Layer entities and Intelligence Layer outputs. No new presentation philosophy is introduced, and no existing surface requires modification — extension here follows the same pattern already established for the Knowledge Layer (§3.16) and Intelligence Layer (§4.19): new occupants, unchanged structure.

## 6.19 Agentic AI Compatibility — Honest Table

| Concept | Responsible layer | Presentation's role |
|---|---|---|
| Multi-agent reasoning | Intelligence (§4) | None — Presentation never reasons |
| Shared state | Knowledge (§3) | Renders what it's given; holds no state of its own |
| Explainability, confidence | Intelligence produces; Interaction requires (§5.11, §5.12) | Expresses an already-determined explanation or signal — originates neither |
| Human-in-the-loop | Interaction (§5.17) | Makes the human's control visible; does not create the control itself |
| Guardrails, policy | Governance (§21, §29) | Never enforces a rule independently — reflects an outcome already governed |
| Consistency across agents/modules | Interaction sets the rule; Presentation and Interaction jointly sustain it | Makes one rule perceivable everywhere it applies |
| Accessibility | Presentation (§6.8) | Direct responsibility — the one concept on this list this layer substantially owns |

## 6.20 Constraints
- Exactly one Presentation Layer philosophy exists, applied across every screen, module, and role, present or future.
- Presentation never computes, decides, or enforces anything the Knowledge, Intelligence, Governance, or Interaction Layers are responsible for.
- Every rule Presentation expresses originates elsewhere; none originates in Presentation itself.
- No future channel or platform introduces a divergent presentation philosophy.
- Any proposed exception is evaluated through the Decision Framework (§53).

---
*Status: Approved. Traces to PRD §§0.1, 4, 8, 9, 13, 16, 21–29, 22, 31, 33, 34, 37, 43–45, 47, 53, 55.*
