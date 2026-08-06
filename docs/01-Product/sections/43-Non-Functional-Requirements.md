# 43. Non-Functional Requirements

*Part VII — Requirements & Constraints · CareerOS Product Requirements Document*

This section is a consolidation — every requirement already exists elsewhere in the approved document.

## 43.3 Trust Requirements
- **NFR-TRUST-1:** Every AI-generated output must be explainable on request, grounded in actual data.
- **NFR-TRUST-2:** Confidence presented at the point of output whenever reduced, never inflated.
- **NFR-TRUST-3:** Honest failure; prior valid output remains intact.
- **NFR-TRUST-4:** Every AI-initiated change is visible immediately or via notification and history.
- **NFR-TRUST-5:** Trust-relevant behavior is identical across every agent and future agent.

## 43.4 Reliability Requirements
- **NFR-REL-1:** State persists across sessions without degradation.
- **NFR-REL-2:** A failed operation never leaves prior valid state degraded, corrupted, or lost.
- **NFR-REL-3:** Exactly one current value exists for any fact.
- **NFR-REL-4:** A workflow writes only to entities it owns, acts only on current input, and a failed step never invalidates a valid upstream output.

## 43.5 Consistency Requirements
- **NFR-CONS-1:** AI behavior is identical across all agents.
- **NFR-CONS-2:** UX principles apply identically across every module.
- **NFR-CONS-3:** Voice and tone are identical regardless of agent or module.
- **NFR-CONS-4:** Design system patterns are reused, never reinvented.
- **NFR-CONS-5:** Every module reads from and writes to the same Career Knowledge Graph.

## 43.6 Accessibility Requirements
- **NFR-ACC-1:** Accessibility is a default in every release.
- **NFR-ACC-2:** Inclusivity extends beyond ability to circumstance and prior exposure to professional norms.
- **NFR-ACC-3:** Language avoids unnecessary jargon and remains plain.
- **NFR-ACC-4:** AI interaction must be genuinely comprehensible, not merely technically present.
- **NFR-ACC-5:** Accessibility applies fully to empty and error states.

## 43.7 User Control Requirements
- **NFR-CTRL-1:** Every AI output remains subject to human review before real-world consequence.
- **NFR-CTRL-2:** Data is owned by the user it describes.
- **NFR-CTRL-3:** No AI action bypasses user awareness or consent.
- **NFR-CTRL-4:** A user can view what data is stored about them at any time.
- **NFR-CTRL-5:** A user can delete specific stored data independent of their account.
- **NFR-CTRL-6:** A user may act against or independent of any AI recommendation at all times.

## 43.8 Scalability Requirements
- **NFR-SCALE-1:** The Career Knowledge Graph accommodates new entities without redesigning existing ones.
- **NFR-SCALE-2:** New agents may be introduced without redesigning existing agents.
- **NFR-SCALE-3:** New capabilities may be added without duplicating existing ones.
- **NFR-SCALE-4:** New workflows are built only from already-approved components.
- **NFR-SCALE-5:** Design system and UX patterns extend through reuse, not reinvention.

## 43.9 Constraints
No future NFR may weaken any item above. Any proposed weakening requires the Decision Framework (§53).

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
