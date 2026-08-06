# Section 1 — System Architecture Philosophy

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 1.1 Purpose of the Solution Architecture Specification
The PRD (§§0–59) defines what CareerOS is and why every decision within it was made. It deliberately stops short of defining structure — §0.1 explicitly excludes technical architecture, database design, API contracts, and UI specification from its own scope, stating that those are written separately, later, by the relevant discipline, and must not contradict the PRD without a recorded decision. The Solution Architecture Specification is that separate, later document — the first one written after the PRD, and the one every subsequent discipline-specific document will be built against. Its purpose is to translate the PRD's product decisions into a structural shape precise enough that those later documents have no ambiguity about what they're building toward, while making none of their decisions for them.

## 1.2 Relationship to the PRD
Every structural claim in the SAS must trace to a PRD section — this document introduces no new product decision, only the structural consequences of decisions already made. Where the PRD already described something in structural terms without naming it architecture — the Career Knowledge Graph (§24), the Agent Ecosystem (§25), the Capability Map (§26), AI Workflows (§27), and the Platform Constraints & Assumptions (§47) — the SAS's task is substantially to formalize and connect that material into one coherent architectural picture, not to invent a second one beside it.

## 1.3 What "Architecture" Means at This Level
At the level this document operates, architecture means three things, and only three: identifying the system's structural layers, identifying the boundaries and entities within and between them, and identifying the relationships and dependencies those layers have on one another. It does not mean selecting a technology to realize any of them. That distinction is what separates this document from a Technical Architecture document, and it is maintained deliberately throughout.

## 1.4 The Structural Layers of CareerOS
Five structural layers are already implied by the PRD's own organization, restated here explicitly, as an architectural model, for the first time:

- **Knowledge Layer** — the single, persistent representation of a user's career state (§24, the Career Knowledge Graph).
- **Intelligence Layer** — the specialized reasoning that acts on that representation (§25 agents, §26 capabilities, §27 workflows).
- **Interaction Layer** — the governed pattern by which a human and the Intelligence Layer engage with one another (§23, §28).
- **Presentation Layer** — the surfaces through which the Interaction Layer becomes visible and usable (§22 screens, §31 UX principles, §34 design system).
- **Governance Layer** — the policy constraints every other layer must satisfy simultaneously (§21 Business Rules, §29 Responsible AI, §43–§45 consolidated requirements, §53 Decision Framework).

Interaction and Presentation are kept distinct deliberately: the Interaction Layer is the *rule* of engagement — request-based explanation, honest confidence, unconditional override; the Presentation Layer is the *surface* that rule appears on. A future channel could, in principle, present the same Interaction Layer differently without changing the rule itself — which is exactly why the two are not collapsed into one.

## 1.5 Sequential Layers vs. Cross-Cutting Governance
Four of these layers — Knowledge, Intelligence, Interaction, Presentation — form a sequential chain: each depends on the one before it, and information flows from Knowledge outward to Presentation. The Governance Layer is not a fifth link in that chain. It is a constraint every other layer must satisfy simultaneously, at every point, not a stage information passes through on its way to the user. This mirrors exactly how the PRD itself was structured: Parts II–VI define the sequential product, while §21, §29, §43–§47, and §53 define requirements that apply across all of it at once, never in sequence.

## 1.6 Architectural Philosophy — One System, Structurally Expressed
§47 already states CareerOS's core product assumptions — PA-1 through PA-6: one graph, one coherent intelligence, one interaction philosophy, one design system, one source of truth, one Core Loop. This section states their architectural consequence directly: each maps to exactly one layer in §1.4, and the "one" in each assumption is a structural requirement on that layer, not a stylistic preference.

| Product Assumption (§47) | Architectural Consequence |
|---|---|
| PA-1: One graph | The Knowledge Layer has exactly one instance of itself per user — never a parallel or competing one. |
| PA-2: One coherent intelligence | The Intelligence Layer presents one behavioral surface, regardless of how many agents compose it internally. |
| PA-3: One interaction philosophy | The Interaction Layer applies identically across every module and phase. |
| PA-4: One design system | The Presentation Layer reuses structural patterns rather than duplicating them. |
| PA-5: One source of truth | No layer maintains a value the Knowledge Layer disagrees with. |
| PA-6: One Core Loop | Every layer, at every phase, exists to serve the same loop (§14) — never a competing one. |

## 1.7 Boundary of This Document
Consistent with the instruction governing this specification, the SAS does not select or discuss programming languages, frameworks, cloud providers, databases, APIs, deployment models, authentication technologies, infrastructure, security implementation, or performance engineering. Where a later document — Database Design, API Design, Technical Architecture — must make one of these choices, this document's job is to have already made that choice unambiguous in shape, never to have made it directly.

## 1.8 Relationship to the Decision Framework (§53)
Every structural decision in the SAS is evaluated against §53.7's hierarchy — Vision, Principles, Strategy, Core Loop, Phase Structure, Features, Implementation — exactly as any PRD-level decision was. The SAS does not introduce a parallel governance mechanism; it operates entirely within the one the PRD already established. A structural choice that would require violating a layer's assumption (§1.6) fails this test regardless of how convenient it might make a later implementation decision.

## 1.9 How the SAS Bridges to Later Design Stages
The chain — PRD → UX/UI Design → Database Design → API Design → Technical Architecture → Development — depends on each stage inheriting an unambiguous structural shape from the one before it. The test for whether a given SAS section is doing its job is not whether it answers every question a later stage will have; it is whether that discipline, reading this document, would need to ask *what* the system's shape is, rather than decide *how* to realize it. A UX designer should be able to identify every layer in §1.4 without inventing one; a database designer should be able to identify the Knowledge Layer's boundary without inventing what belongs inside it. §24 through §27 already supply that detail for the Knowledge and Intelligence Layers; later SAS sections supply it for the rest.

## 1.10 Constraints for Future SAS Sections
Every future SAS section must trace to a specific PRD section, must respect the five-layer structure and the sequential/cross-cutting distinction established here, must preserve every PA in §47 without exception, and must never cross into the boundary excluded in §1.7. Any proposed exception is evaluated through the Decision Framework (§53).

---
*Status: Approved. Traces to PRD §§0.1, 14, 16, 21–30, 34, 43–47, 53.*
