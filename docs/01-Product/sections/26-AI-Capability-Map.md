# 26. AI Capability Map

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 26.1 Purpose of the Capability Map
This section defines what the Phase 0 agent roster is capable of doing, at the product level: the reusable abilities beneath an agent's single responsibility, available to be shared across agents.

## 26.2 Agent vs. Capability
An **agent** is a bounded responsibility with exclusive write-ownership of specific graph entities — a *who*. A **capability** is a reusable type of ability an agent draws on to fulfill that responsibility — a *how-able*.

## 26.3 Master Capability Catalog (Phase 0)

| Capability | Product-level definition | Boundary |
|---|---|---|
| **Analysis / Comparison** | Compare two pieces of graph state and produce a structured account of the difference. | Produces an assessment only — never a self-executing action. |
| **Planning** | Produce an ordered sequence of steps toward a goal, with reasoning available on request. | Never extends to carrying out the steps it produces — governs sequencing and reasoning-visibility only. |
| **Critique / Evaluation** | Assess user-submitted material against a stated goal and produce specific, categorized feedback. | Evaluates only what the user submitted; does not generate replacement content. |
| **Explainability** | Articulate, on request, the reasoning behind a specific output, grounded in the graph state that produced it. | Must reference actual graph state — not a generic justification. |
| **Confidence Calibration** | Represent the system's actual certainty in an output. | Confidence never presented as higher than its actual basis. |
| **Change Awareness** | Compare a newly produced version of an entity against its own immediately prior version. | Applies only to versioned entities (Analysis, Roadmap) — not CV/Profile Feedback Rounds. |
| **Grounding** | An agent's output is derived from specific Career Knowledge Graph data it has read, not general knowledge unconnected to the user. | Distinct from Explainability: Grounding is the property the output *is* based on real data; Explainability is the ability to *surface* that basis. |

Multi-Agent Collaboration, Guardrails, Workflow Engineering, MCP, Monitoring, and Observability are deliberately absent from this catalog — not overlooked, but properties of the ecosystem, engineering practice, or team requirement, not agent capabilities.

## 26.4 Capabilities by Agent

| Agent | Capabilities Used |
|---|---|
| Skill-Gap Analysis Agent | Analysis/Comparison, Explainability, Confidence Calibration, Change Awareness, Grounding |
| Roadmap Agent | Planning, Explainability, Confidence Calibration, Change Awareness, Grounding |
| CV/Profile Feedback Agent | Critique/Evaluation, Explainability, Confidence Calibration, Grounding |

## 26.5 Shared Capabilities
Explainability, Confidence Calibration, and Grounding are used by all three agents. Change Awareness is shared by two of three (not CV Feedback, whose rounds are independent). Analysis/Comparison, Planning, and Critique/Evaluation are each used by exactly one agent.

## 26.6 Capabilities Not Possessed by Any Phase 0 Agent
- **Long-Term Memory, as inferential synthesis.** No Phase 0 agent forms new insight from patterns across history beyond stored facts.
- **Short-Term Memory, as multi-turn conversational context.** No Phase 0 agent conducts extended interactive dialogue.
- **Reflection / Self-Critique, as a distinct internal step.** The honesty-under-failure requirement is satisfied by Confidence Calibration alone.
- **Tool Calling.** No Phase 0 agent invokes an external capability — nothing external exists to call yet.

## 26.7 Capability Boundaries
Every capability is bounded by its own stated boundary and by every guardrail already established in §21 and §23.

## 26.8 Capability Reuse Principles
When more than one agent needs the same ability, they use the exact same capability definition — not agent-specific variations.

## 26.9 Rules Preventing Capability Overlap
Before a new capability is added, it must be checked against every existing entry; if it substantially overlaps, the existing entry is extended rather than a new, competing capability created.

## 26.10 Constraints on Introducing Future Capabilities
- A Phase 1–4 agent genuinely requires an ability not already in the catalog.
- It receives exactly one precise, implementation-independent definition.
- It does not duplicate or substantially overlap an existing capability.
- It complies fully with §23's philosophy and is bounded the same way every existing capability is.

## 26.11 Capabilities and the Career Knowledge Graph
No capability operates independently of the graph — it is what every capability in this catalog is exercised on.

## 26.12 Capabilities and the Product Principles

| Capability | Principle it most directly serves |
|---|---|
| Analysis / Comparison | §3, "Executes, not just answers" |
| Planning | §3, "Executes, not just answers"; bounded by §23.4 |
| Critique / Evaluation | §3, "Executes, not just answers" |
| Explainability | §0.4 Principle 6; §3, "Earns trust before it earns reliance" |
| Confidence Calibration | §0.4 Principle 15 |
| Change Awareness | §0.4 Principle 9 — nothing silently replaced |
| Grounding | §3, "One person, one model"; §23.7 Personalization |

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
