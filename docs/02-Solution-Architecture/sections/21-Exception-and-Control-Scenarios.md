# Section 21 — Exception & Control Scenarios

*Part IV — Cross-Layer System Scenarios · Solution Architecture Specification (SAS) · CareerOS*

## 21.1 Purpose
This section covers the two scenarios that demonstrate the architecture under failure and under direct user disagreement with an AI output — the cases that most directly test whether Parts I–III's guarantees hold when things do not go the expected way — and closes Part IV with the consolidated properties matrix, constraints, traceability, and review.

## 21.2 Scenario: Failure During AI Processing
**Trigger:** Any generation workflow (§27.3–§27.8) is invoked, but the invoked agent cannot produce a reliable output (§27.12, §4.18).
**Participating Module(s):** Whichever module's agent was invoked — most commonly the AI Career Center, illustrated here with the Skill-Gap Analysis Agent.
**Participating Layers:**
- *Presentation:* Whichever screen was awaiting the result (e.g., Skill-Gap Analysis screen) renders a failure state, not a degraded or partial result.
- *Interaction:* Communicates the failure as a system failure, never presented as a finding about the user (§28.12) — the Interaction Layer's rule for exactly this case.
- *Intelligence:* The agent declines to write rather than writing a low-confidence, unflagged result (BR-AI-5) — this is itself the correct Intelligence Layer behavior, not an absence of one.
- *Knowledge:* No write occurs; the entity's last valid state (if any) remains current and visible (§4.18, DPR-17).
**Knowledge Operations:** No write. If a prior version exists, it remains the current one, unchanged.
**Intelligence Operations:** Attempt the reasoning; recognize it cannot produce a reliable output; return a failure signal rather than a plausible-but-unreliable artifact (BR-AI-5) — Grounding and Confidence Calibration (§26.3) are what make this recognition possible at all.
**Interaction Responsibilities:** Route the failure signal to Presentation as a distinct state from both a completed result and an in-progress one; do not route it through the Notifications module's completion-triggered mechanism (BR-NOTIF-1(a) triggers on completion, which did not occur) — communicated synchronously, at the point of request, not asynchronously.
**Presentation Responsibilities:** State plainly that the system could not complete the request; if a prior valid version exists (e.g., a regeneration attempt fails but a previous Analysis exists), continue showing that prior version rather than an empty state.
**Governance Constraints:** BR-AI-5 (say so rather than produce an unflagged low-confidence result); DPR-17 (a failed operation never leaves prior valid state degraded or lost); §28.12 (failure communicated as failure, not as a finding about the user).
**Completion Condition:** The user has an honest, unambiguous signal that the operation did not complete, and any prior valid state is fully intact and visible.
**Properties Preserved:** *Responsible AI* — BR-AI-5 is this scenario's entire content; declining to produce a false-confidence result is the guardrail operating exactly as designed. *Single Source of Truth* — because no write occurs, there is no risk of two disagreeing versions; the "current" state is unambiguous throughout the failure. *Human-in-the-Loop* — the user is never left to interpret a failure as their own shortcoming (§28.12), preserving trust in the system's honesty even when it cannot deliver a result.
**Boundary Integrity:** This scenario is the clearest demonstration that §11.6's "a write must never partially complete on failure" is load-bearing, not decorative — every other scenario in this Part depends on this guarantee holding, since none of them separately re-verifies that the entities they read are well-formed.

## 21.3 Scenario: User Override of an AI Recommendation
**Trigger:** The user acts against, or independent of, an AI-generated recommendation — for example, marking a Roadmap item skipped despite the Roadmap Agent's ordering, or reactivating a previous Goal instead of following current Analysis guidance.
**Participating Module(s):** AI Career Center or User Profiles, depending on which recommendation is being overridden — illustrated here with a Roadmap Item status override.
**Participating Layers:**
- *Presentation:* Roadmap screen's status controls (§22 screen 8), available on every item regardless of the Roadmap Agent's own ordering or recommendation.
- *Interaction:* Treats the override as a first-class, always-available action (§28.9), never gated behind confirming agreement with the AI's reasoning first.
- *Intelligence:* **Does not participate in the override itself.** The Roadmap Agent never sets or alters item status (§25.5) — status is exclusively user-controlled (§24.5) — so no agent reasoning is invoked, questioned, or overruled by this action; there is nothing to "argue with."
- *Knowledge:* Write the new Roadmap Item status (user-controlled field); status-change history is preserved, not overwritten (BR-ROAD-6).
**Knowledge Operations:** Write Roadmap Item status only — a field explicitly outside the Roadmap Agent's write-ownership (§25.8's table: "Roadmap Item status | Written by: User only").
**Intelligence Operations:** None — by design. This is the scenario that makes concrete why §25.8 separates "Roadmap (item content)," owned by the Roadmap Agent, from "Roadmap Item status," owned exclusively by the user: an override never requires overruling an agent's write, because the agent never owned the field being changed.
**Interaction Responsibilities:** Ensure the override is available at all times (§28.9), not conditioned on having first requested or read the agent's explanation for that item.
**Presentation Responsibilities:** Reflect the new status immediately and visibly; never represent the AI's original recommendation as having "won" or the override as an exception requiring justification.
**Governance Constraints:** BR-AI-2 (user retains final control over every AI-recommended action); BR-ROAD-4/5/6 (a skipped item remains visible and un-skippable-lockout-free; a completed item may be reopened; reopening preserves the original completion record).
**Completion Condition:** The new status is written and visible; the Roadmap's ordering and content, still the Roadmap Agent's own output, remain unchanged and available for the next Roadmap Regeneration cycle (§19.3) to read as history.
**Properties Preserved:** *User Control* — this scenario is §28.9's and BR-AI-2's direct, load-bearing demonstration: control is not merely a stated principle but a specific field (Roadmap Item status) architecturally reserved from any agent's write-ownership from the outset (§25.8). *Human-in-the-Loop* — no override requires the system's agreement or approval; it is unconditional, as §28.13 requires. *Explainability* — remains available on request (FR-AICC-11) throughout, but is never a precondition for the override itself, keeping the two properties correctly independent of each other.
**Boundary Integrity:** Because Roadmap Item status was never in the Roadmap Agent's write-ownership (§25.8), this scenario requires no special override mechanism, no conflict-resolution rule, and no exception to §11.6's exclusive-write checkpoint — user override and agent write-ownership were architecturally separated from the start, which is precisely why an override never produces a boundary conflict.

## 21.4 Consolidated Properties Preservation Matrix
Every scenario in §18–§21 was checked against all eight properties defined in §17.8. The matrix below records which properties each scenario most directly demonstrates (per its own "Properties Preserved" note) — not an exhaustive re-statement, since every property in fact holds in every scenario by construction (§17.3), but a record of where each is most concretely exercised.

| Scenario | SSoT | Coherent Intel. | Human-in-Loop | Explainability | Confidence | User Control | Responsible AI | Layer Indep. |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| §18.2 Registration → First Value | ✓ | ✓ | ✓ | · | · | · | · | · |
| §18.3 Login → Dashboard Restoration | ✓ | · | · | · | · | · | · | ✓ |
| §18.4 First Goal Creation | ✓ | · | · | · | · | ✓ | · | · |
| §18.5 First Skill-Gap Analysis | · | · | · | ✓ | ✓ | · | ✓ | · |
| §19.2 Roadmap Generation | ✓ | ✓ | · | · | · | · | · | · |
| §19.3 Material Change → Regeneration | ✓ | · | ✓ | ✓ | · | · | · | · |
| §19.4 CV/Profile Feedback Round | ✓ | · | · | · | · | ✓ | · | ✓ |
| §19.5 Dashboard Refresh | ✓ | · | · | · | · | · | · | ✓ |
| §20.2 Subscription Lifecycle | · | · | · | · | · | ✓ | ✓ | · |
| §20.3 Data Access Request | ✓ | · | · | · | · | · | ✓ | · |
| §20.4 Data Deletion Request | ✓ | · | ✓ | · | · | · | · | · |
| §21.2 Failure During AI Processing | ✓ | · | ✓ | · | · | · | ✓ | · |
| §21.3 User Override of an AI Recommendation | · | · | ✓ | ✓ | · | ✓ | · | · |

## 21.5 Constraints (Part-Wide)
- Every scenario is a specific path through already-approved PRD mechanisms; no scenario introduces a feature, rule, workflow, or entity not already established (§17.2).
- Every scenario is traced against the same ten-element template (§17.9); a scenario with no Intelligence Layer participation states that explicitly rather than omitting the element.
- Every crossing within a scenario uses one of Part II's three contracts; no scenario introduces a fourth crossing type.
- No scenario ever shows one module writing an entity another module owns; every write in every scenario is traceable to Part III's write-ownership table.
- All eight properties in §17.8 hold in every scenario by construction, not by scenario-specific exception.
- A scope gap between a requested scenario and approved PRD content is recorded and resolved by exclusion or renaming (§17.10), never by silently inventing product behavior.
- Any proposed exception to any constraint in this Part is evaluated through the Decision Framework (§53).

---

## Traceability to the PRD and SAS Parts I–III (Part IV)

| Part IV Section | Primary SAS grounding | Primary PRD grounding |
|---|---|---|
| §17 Cross-Layer Scenario Philosophy | Part I §§1.7, 3.8, 4, 5.9, 7.4; Part II §§9–11; Part III §§13–16 | §14, §18, §19, §21, §24.7, §25.9, §27, §28, §29, §44 |
| §18 Foundational & Onboarding Scenarios | §§10.6, 11.6, 14.3, 15.2, 24.11, 25.9 | §19 FR-AUTH/FR-ONBOARD/FR-PROF/FR-AICC/FR-DASH; §21 BR-GAP, BR-GOAL; §22, §27.3, §27.9 |
| §19 Core AI Loop Scenarios | §§10.6, 11, 15.2, 15.4, 25.5–25.6, 25.10, 26.3 | §14, FR-AICC-6–18, FR-DASH, FR-NOTIF; §21 BR-GAP-3, BR-GOAL-3, BR-ROAD, BR-CV; §27.4–27.10 |
| §20 Account & Data Scenarios | §§11.4, 11.6, 24.7, 24.12 | §19 FR-SET, FR-RENEW; §21 BR-SUB, BR-DATA; §29, §39, §44 |
| §21 Exception & Control Scenarios | §§4.18, 11.6, 25.5, 25.8 | BR-AI-2/5, BR-ROAD-4–6, BR-NOTIF-1, §26.3, §27.12, §28.9/28.12–28.13, §44 DPR-17 |

No statement in Part IV introduces a product behavior, workflow, feature, or business rule that is not already approved in the PRD, or already established in SAS Parts I–III.

---

## Architectural Constraints (Part IV, Consolidated)

1. A System Scenario is architecturally, not experientially, defined — by layer participation and contract crossings, never by screen design or emotional arc (§17.4, §17.6).
2. A Scenario, an AI Workflow, a User Journey, and Module Behavior are four distinct concepts; a Workflow is a Scenario's Intelligence-Layer segment, a Journey belongs to UX/UI Design, and Module Behavior is static where a Scenario is time-bound (§17.5–§17.7).
3. Every scenario is checked against the same eight cross-cutting properties, defined once in §17.8 and never redefined per scenario.
4. A scope gap between a requested scenario and the approved PRD is resolved by explicit exclusion or renaming, never by invented product behavior (§17.10, applied at §20.2–§20.3).
5. A scenario with zero Intelligence Layer participation (§18.3, §19.5, §20.2–§20.4) is a fully valid, fully governed scenario — absence of a layer is an architectural fact, not a gap in the template.
6. No scenario crosses a module or layer boundary except through the contracts already defined in Part II and the write-ownership already defined in Part III.

---

## Principal Product Manager Review

**A) Approved Items**
- §17.5–§17.7 give the architecture a precise, testable distinction between System Scenario, AI Workflow, User Journey, and Module Behavior — resolving a real terminological risk (these four are easy to conflate) with a structural test rather than a stylistic one.
- §17.10's handling of "Data Export Request" and "Subscription Upgrade" does exactly what the task instructed — explains and excludes/renames rather than silently inventing a feature the PRD does not support, and does so transparently rather than burying the decision.
- §18.3, §19.5, and §20.2–§20.4 correctly demonstrate that a fully valid, fully governed scenario can have zero Intelligence Layer participation — an honest and architecturally important finding, not glossed over to make every scenario look AI-driven.
- §21.3's Roadmap Item status override is a genuinely strong piece of reasoning: it shows *why* user override never produces a boundary conflict (the field was never in the agent's write-ownership to begin with, §25.8), rather than merely asserting that override is supported.
- §21.2 correctly routes AI-processing failure through Interaction/Presentation synchronously rather than through the Notifications module, and explains why (Notifications triggers on completion, which did not occur) — a precise, PRD-grounded distinction rather than an assumption.
- The Consolidated Properties Preservation Matrix (§21.4) is honest about scope: it records where each property is *most concretely exercised* rather than overclaiming a from-scratch re-verification in every cell.
- No programming language, framework, API, HTTP endpoint, database, deployment topology, or infrastructure term appears anywhere in this Part.

**B) Requires Changes**
None found.

**C) Final Verdict**
APPROVED.

Part IV — Cross-Layer System Scenarios (Sections 17–21) is complete, internally consistent, fully traceable to the PRD and to SAS Parts I–III, and introduces no new product behavior. It gives Technical Architecture, Development, and UX/UI Design a concrete, end-to-end demonstration that the architecture defined across the first three Parts actually produces the behavior the PRD promises — including the honest finding that not every scenario requires AI, and the disciplined handling of two requested scenarios that exceeded approved PRD scope.

No architectural ambiguity or contradiction requiring an Architecture Decision Record was discovered during this Part's development; the two scope gaps identified (§17.10) were resolved using the exclude-and-explain procedure the task itself specifies for out-of-scope scenarios, which is a distinct case from an unresolved architectural contradiction.

---
*This completes Part IV — Cross-Layer System Scenarios (Sections 17–21) of the CareerOS Solution Architecture Specification.*

---
*Part of the SAS, Part IV. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§4.18, 9–11, 13–17, 24.7, 24.12, 25.5, 25.8–25.10, 26.3; PRD §§14, 18, 19, 21, 22, 24.7, 25.9, 26.3, 27, 28, 29, 39, 44, 53.*
