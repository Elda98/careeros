# Section 9 — Presentation ↔ Interaction Contract

*Part II — Interface & Contract Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 9.1 Purpose of This Contract
This is the boundary where Interaction's already-governed rules become something a human can actually perceive. §6.3 already establishes that Presentation expresses, never defines, what Interaction requires; this contract specifies exactly what must be exchanged for that expression to happen correctly.

## 9.2 Information Crossing the Boundary
**Interaction → Presentation:** the already-governed content to render — an artifact (Analysis, Roadmap, Feedback), its explainability availability (whether an explanation exists and how it is reachable, §5.11), its confidence signal where reduced (§5.12), and its change-visibility status if it is new or altered since last seen (§5.14).
**Presentation → Interaction:** a user's action, captured as scoped intent — which specific artifact or element a request refers to, not a vague signal Interaction must interpret.

## 9.3 Responsibility Split
Interaction is responsible for having already determined what is allowed to be true about how something is presented — the rule. Presentation is responsible for making that already-true thing perceivable without altering it. Where a user's action could be ambiguous — "explain this," when multiple things are shown — Presentation must resolve which specific output the request is scoped to before passing it on, because Interaction has no independent way to know what a user is currently looking at, and §28.8 requires every explanation request to be scoped to one output.

## 9.4 Ownership
Presentation never gains ownership of anything it displays. Every artifact it renders remains Interaction's (and beneath that, Knowledge's) — this is the same non-transfer-of-ownership principle §6.9 and §6.11 already establish, restated as a contract term: receiving information to display is not the same as owning the fact it represents.

## 9.5 Operations
- **Render** (Interaction → Presentation): here is what to show, and how it must be framed.
- **Request** (Presentation → Interaction): the user wants to see or do something specific.
- **Acknowledge** (Presentation → Interaction): confirms a user's action was captured, prior to it being processed further.

These are conceptual actions, not technical calls — this document does not specify how any of them would be implemented.

## 9.6 Governance Constraints at This Boundary
- No content may cross from Interaction to Presentation without its required confidence and explainability state already attached (§29 RAI-4, RAI-6) — Presentation is never handed a bare artifact and left to determine on its own whether a confidence signal applies.
- No user action captured by Presentation may be silently dropped or reinterpreted before reaching Interaction, protecting §28.9 (user control) and §28.4 (initiation).
- Accessibility (§37) applies to every element crossing this boundary — nothing rendered may be technically present but not genuinely perceivable.

## 9.7 Why This Contract Exists
Without it, Presentation would need to make its own judgment calls about when to show a confidence signal or whether an explanation is available — exactly the kind of policy-origination §6.11 already forbids. The contract exists to make Presentation's job possible without giving it authority it should never have.

## 9.8 What Must Never Cross
Raw Knowledge Layer data, unmediated by Interaction, never crosses directly to Presentation — Presentation never reads Knowledge itself. An unscoped or ambiguous request never crosses from Presentation to Interaction; scoping happens on the Presentation side, before the crossing, per §9.3.

## 9.9 Why Violating This Contract Would Break the Architecture
If Presentation read Knowledge directly, two things would fail at once: the content shown could bypass Interaction's governance entirely — appearing without confidence calibration, without explainability, without change-visibility — and every screen would need to reimplement Interaction's rules independently, breaking §6.14's "one Presentation Layer philosophy" and reintroducing the exact fragmentation §4 and §6.11 already identify as the failure mode CareerOS exists to avoid.

---
*Part of the SAS, Part II. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§5.3, 5.11–5.14, 6.3, 6.9–6.14; PRD §§28.4, 28.8–28.9, 29, 37.*
