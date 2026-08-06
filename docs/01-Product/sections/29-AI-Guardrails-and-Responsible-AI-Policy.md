# 29. AI Guardrails & Responsible AI Policy

*Part IV — AI System Design · CareerOS Product Requirements Document*

This section consolidates guardrails already established across §0.4, §3, §21, §23, §25, §26, §27, and §28 into one coherent policy.

## 29.1–29.2 Purpose and Relationship to Product Principles
This is the single, complete answer to "what is CareerOS's AI allowed to do, and what governs it," operationalizing §3's principles and §0.4's Principles 9, 10, 15.

## 29.3 Human Oversight
**RAI-1:** Every AI output remains subject to human review and decision before it has any real-world consequence.

## 29.4 Decision Boundaries
**RAI-2:** No AI action bypasses user awareness or consent.
**RAI-3:** No agent acts outside CareerOS on the user's behalf without explicit, in-the-moment initiation.

## 29.5 Explainability Requirements
**RAI-4:** Every AI-generated output must be explainable on request, grounded in actual graph data.
**RAI-5:** The Dashboard's next-action recommendation is the sole case requiring inline, non-request-based explanation.

## 29.6 Confidence Requirements
**RAI-6:** Confidence must be presented at the point of output whenever meaningfully reduced, and never inflated.

## 29.7 Failure Behavior
**RAI-7:** When a reliable output cannot be produced, the system must say so.
**RAI-8:** Failure must never leave a user's prior state degraded, corrupted, or lost.
**RAI-9:** A system failure must never be presented in a way a user could mistake for a finding about themselves.

## 29.8 User Control & Override
**RAI-10:** The user may act against or independent of any AI recommendation at all times.

## 29.9 Transparency Requirements
**RAI-11:** Every AI-initiated change is visible to the user, either immediately or via notification and history.

## 29.10 Privacy & Data Boundaries
**RAI-12:** Data is owned by the user it describes, visible to them, and independently deletable.
**RAI-13:** No AI capability uses one user's data to shape another user's experience by default.

## 29.11 Consistency Across All Agents
**RAI-14:** Every guardrail in this policy applies identically to all Phase 0 agents and to any future agent.

## 29.12 Prevention of Hidden AI Behavior
**RAI-15:** "Invisible seams" (agent-count complexity is hidden) and concealment of AI action (never permitted) are not the same thing.

## 29.13 Trust Principles
Trust is the product's central asset. Explainability, confidence calibration, human oversight, unconditional override, and honest failure are structural guarantees, not tone.

## 29.14 Constraints for Future AI Features
**RAI-16:** Any future AI agent, capability, workflow, or interaction pattern must comply with every RAI item in this section. Any exception requires the Decision Framework (§53).

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
