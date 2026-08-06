# Section 10 — Interaction ↔ Intelligence Contract

*Part II — Interface & Contract Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 10.1 Purpose of This Contract
This is the boundary between producing an output (Intelligence) and governing how that output is engaged with by a human (Interaction). §5.11–§5.12 already establish that Intelligence makes an output's confidence and explainability *true*, while Interaction makes them *seen*; this contract specifies exactly what must cross for that split to hold.

## 10.2 Information Crossing the Boundary
**Intelligence → Interaction:** the produced artifact, together with its capability-level properties — its confidence value (§26.3, Confidence Calibration), the graph data it is grounded in (§26.3, Grounding, supporting Explainability), and, where applicable, its relationship to a prior version (§26.3, Change Awareness).
**Interaction → Intelligence:** a validated, scoped explanation request naming the specific prior output to explain, or a trigger signal indicating a user-initiated action (such as a manual refresh, §27.7, or a CV submission, §27.8) requires a specific agent to run.

## 10.3 Responsibility Split
Intelligence is responsible for producing something explainable, confidence-calibrated, and grounded — the capability requirements of §26.3. Interaction is responsible for deciding when and how that explainability and confidence must be exposed to a human — inline versus on-request (§5.11's "sole exception," §19 FR-DASH-4). Interaction is never responsible for interpreting *why* an agent reached a conclusion; it only relays the request for that reasoning and displays what Intelligence returns, unaltered.

## 10.4 Ownership
Intelligence owns the reasoning behind its output; Interaction never modifies, summarizes, or reframes an agent's output content — it may only apply presentation-adjacent rules about timing and reachability of disclosure. This is §4.15's "Reasoning Ownership" restated as a contract term: no layer outside the owning agent touches the reasoning itself.

## 10.5 Operations
- **Produce** (Intelligence → Interaction): here is the artifact, with its properties attached.
- **Explain-request** (Interaction → Intelligence): the human wants the reasoning behind this specific, named output.
- **Trigger** (Interaction → Intelligence): the human's action requires this agent to run.

## 10.6 Governance Constraints at This Boundary
- Every artifact crossing from Intelligence must already carry its confidence and groundedness — Interaction cannot request these be computed after the fact, because Interaction has no reasoning capability of its own (§5, throughout). Interaction may only require that they exist and make them reachable.
- Intelligence may be triggered only when the trigger itself is user-initiated or a visible automatic consequence of the user's own action (§28.4, §29 RAI-2/RAI-3) — Interaction must never trigger Intelligence on its own initiative outside these two cases.

## 10.7 Why This Contract Exists
It separates who can determine reasoning *validity* (only Intelligence, via its capabilities) from who can determine reasoning *accessibility* (only Interaction, via its rules) — the split §5.11–§5.12 already establish conceptually, made operational here.

## 10.8 What Must Never Cross
Interaction never receives partial or uncalibrated output that it would need to "finish" assessing — that would require Interaction to reason, collapsing the Intelligence/Interaction distinction §5.3 establishes. Intelligence never receives a directive about how to phrase or visually frame its output for a human — that remains downstream, keeping agents narrow and specialized (§4.1) rather than needing to account for presentation concerns.

## 10.9 Why Violating This Contract Would Break the Architecture
If Interaction could originate confidence or explanation content itself, §5.11's reason for existing collapses — Interaction would begin reasoning without Intelligence's Grounding or Explainability capabilities, producing ungrounded confidence claims, a direct violation of §26.3's Grounding boundary and §29 RAI-4/RAI-6.

---
*Part of the SAS, Part II. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§4.1, 4.15, 5.3, 5.11–5.12; PRD §§19 FR-DASH-4, 26.3, 27.7–27.8, 28.4, 29.*
