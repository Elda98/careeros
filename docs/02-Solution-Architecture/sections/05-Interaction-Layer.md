# Section 5 — Interaction Layer Architecture

*Part I — System Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 5.1 Purpose of the Interaction Layer
The Interaction Layer realizes §1.4's definition and §1.6's PA-3 (one interaction philosophy). Its responsibility: govern how a human engages with whatever the Intelligence Layer produces, applying the same rules regardless of which agent, capability, or workflow produced the output. It exists because reasoning alone does not guarantee trustworthy engagement — §23.11 already establishes that trust depends on how an output is delivered and how much control the user retains, not only on whether the output itself is correct.

## 5.2 Relationship to the PRD
Traces to §23 (AI Product Philosophy), §28 (Human-AI Interaction Model), §29 (Responsible AI), the interaction-relevant portions of §31, §45 (Trust & Safety), §47, and §53.

## 5.3 Relationship to the Intelligence Layer — Why Interaction Is Not Intelligence
The Intelligence Layer's job is to produce an output; the Interaction Layer's job is to govern how that output is engaged with by a human — different concerns applied to different objects. §28.11 requires this governance to apply identically across every Intelligence Layer occupant, regardless of which agent or capability produced a given output. Folding interaction rules into Intelligence would require each of the three agents to separately implement explainability, confidence presentation, and advisory framing — risking exactly the drift §25.9's "invisible seams" and §28.11's "one interaction pattern" exist to prevent. Interaction is separate specifically because it must normalize across an Intelligence Layer that is, by design, not uniform (§26.4 — different agents use different capabilities).

## 5.4 Relationship to the Presentation Layer — Why Interaction Is Not Presentation
Interaction defines the rule of engagement; Presentation defines the surface that rule appears on (§1.4). The rule — explanation available on request, confidence shown at the point of output, override always possible — governs *whether* trust can be earned; the surface governs only *where* that governance becomes visible. Collapsing the two would make it impossible to reason about interaction consistency (§5.16) independently of any particular surface, exactly the independence §31.7 and §33.13 already require when they hold UX and voice consistent regardless of which module a user is in.

## 5.5 Relationship to Human Users
The Interaction Layer is the only layer with a human user as one of its two direct participants. The Intelligence Layer engages the Knowledge Layer; the Presentation Layer renders for a human but does not itself decide how; the Governance Layer constrains everything without directly engaging anyone. The Interaction Layer is where CareerOS and a person actually meet.

## 5.6 What Belongs Inside the Interaction Layer
The rules already established in §28: structured, not conversational, interaction (§28.2); the human/AI responsibility split (§28.3); the user-initiated-or-visible-consequence rule (§28.4); the visibility guarantee (§28.5); the explanation request pattern (§28.6, §28.8); confidence presentation (§28.7); user control and override (§28.9); the advisory framing of every recommendation (§28.10); consistency across agents (§28.11); error and uncertainty communication (§28.12); and the trust-building behaviors that follow from all of these together (§28.13).

## 5.7 What Never Belongs Inside It
Reasoning itself (Intelligence Layer, §4). Visual or structural rendering (Presentation Layer, out of scope for this SAS). Data persistence (Knowledge Layer, §3). Policy authorship — the Interaction Layer applies Governance Layer rules (§21, §29), it does not write them.

## 5.8 Human–AI Collaboration
Within any single interaction, the system's part is to present an artifact and, on request, its reasoning; the human's part is to read, question, act, or override (§23.4, §28.3). The Interaction Layer is the architectural embodiment of this split — the boundary at which the system's turn ends and the human's begins.

## 5.9 The Human Decision Boundary
The system owns analysis, synthesis, and recommendation; the human owns judgment and action (§23.4). This is enforced architecturally at the Interaction Layer specifically: every Intelligence Layer output must pass through it before having any real-world consequence, and its defining rule is that this passage never itself constitutes the consequence.

## 5.10 User Control
A human may act against or independent of any Intelligence Layer output at any time, without first accepting or acknowledging it (§28.9). This is not a Presentation Layer affordance that happens to exist — it is an Interaction Layer guarantee that any Presentation Layer must express, not one it independently decides to offer.

## 5.11 Explainability — Why It Lives Here, Not in Intelligence
Explainability is a capability the Intelligence Layer's agents possess (§26.3) — but the rule that an explanation must be available, and how it is requested, is an Interaction Layer concern. The Intelligence Layer is responsible for an explanation being *possible*, grounded in real data (§26.3, Grounding); the Interaction Layer is responsible for that explanation being *accessible* — on request, or inline for the single highest-stakes case (§28.6). An agent that could explain itself but wasn't required to make that explanation reachable would satisfy Intelligence's requirement while failing Interaction's entirely — which is exactly why the two sit in different layers.

## 5.12 Confidence Communication
Confidence Calibration is likewise an Intelligence Layer capability (§26.3); its presentation — at the point of output, never behind a separate action (§28.7) — is an Interaction Layer rule. The same split as §5.11: Intelligence makes confidence *true*; Interaction makes it *seen*.

## 5.13 Failure Communication
When the Intelligence Layer cannot produce a reliable output (§4.18), the Interaction Layer is responsible for communicating that failure specifically — never as a generic error, and never in a way a human could mistake for a finding about themselves (§28.12, §3 "Guidance, not gatekeeping"). Failure communication is an Interaction Layer responsibility precisely because the Intelligence Layer's job ends at declining to produce an unreliable output — someone still has to tell the human what happened, and that telling is governed here.

## 5.14 Transparency
Every Intelligence Layer-initiated change is visible immediately or via notification and history, never silent (§29 RAI-11). This is enforced at the Interaction Layer, since visibility is fundamentally about what a human can perceive — this layer's domain.

## 5.15 Trust Preservation
§23.11, §28.13, §45.3, and §45.7 each independently establish that trust depends on explainability, honest confidence, full visibility, and consistent behavior across the whole system. The Interaction Layer is where all four converge into what a human actually experiences — it is the layer trust is preserved or lost at, even though the underlying guarantees originate across §23, §26, and §29.

## 5.16 Interaction Consistency Across Modules
§28.11 and §31.7 require the same interaction pattern regardless of module. Architecturally, the Interaction Layer's rule set (§5.6) applies uniformly to every Intelligence Layer occupant, present or future, and every Presentation Layer surface built on top of it — a future module's interaction never diverges from §5.6, since divergence would violate PA-3 (§1.6) directly.

## 5.17 Human-in-the-Loop as an Emergent Property
Human-in-the-loop is not a separate feature added to this architecture — it is what results from correctly positioning a layer with §5.6's rule set between Intelligence and Presentation. Because every Intelligence Layer output must pass through a layer whose defining rule is "advisory, reviewable, overridable, before any consequence" (§5.9, §5.10), human oversight is structurally guaranteed by the layer's position and rules, not by a checklist item added to each agent individually.

## 5.18 Relationship to AI Workflows
Each workflow's Intelligence Layer steps — its reads and writes (§27.3–27.10) — are governed by §4. What happens next: how the result is explained, and whether it's visible immediately or via notification, is governed here.

## 5.19 Relationship to Future Modules and Extensibility
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

## 5.20 Constraints
- Exactly one Interaction Layer, applied identically regardless of which agent, module, or phase produced a given output.
- No Intelligence Layer output reaches a human without passing through this layer's rules first.
- No output may be presented as a decision already made.
- Explanation, confidence, and failure communication follow §5.11–§5.13 without exception.
- No future module may introduce a divergent interaction pattern.
- Any proposed exception is evaluated through the Decision Framework (§53).

---
*Status: Approved. Traces to PRD §§3, 23, 25, 26, 28, 29, 31, 33, 45, 47, 53.*
