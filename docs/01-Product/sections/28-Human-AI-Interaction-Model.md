# 28. Human-AI Interaction Model

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 28.1 Purpose
Defines the consistent, cross-cutting pattern of how users experience AI across every agent, workflow, and screen.

## 28.2 Interaction Philosophy
CareerOS's AI is not conversational. Interaction is structured: the user views a specific artifact and acts on it through defined actions, not free-form dialogue.

## 28.3 Human vs. AI Responsibilities in Interaction
The AI's part is to present an artifact and, on request, its reasoning; the user's part is to read, question, act, or override.

## 28.4 User Initiation vs. Automatic Assistance
Every interaction is user-initiated or an automatic, visible consequence of the user's own prior action — never a third kind.

## 28.5 Visibility of AI Actions
Every graph write an agent makes is visible to the user — immediately, or via notification plus Progress.

## 28.6 Explainability in Interaction
Every screen presenting an AI-generated output carries a defined action to request the reasoning. Dashboard's next-action recommendation surfaces its reason inline.

## 28.7 Confidence Presentation
Confidence appears as part of the artifact itself, at the moment the output is shown.

## 28.8 Requesting Explanations
An explanation request is a single, direct action scoped to the specific output being questioned — not open-ended questioning.

## 28.9 User Control and Overrides
The user can act against or independent of any AI recommendation at all times.

## 28.10 AI Recommendations vs. User Decisions
No interaction presents an AI output as a decision already made.

## 28.11 Interaction Consistency Across All Agents
The interaction pattern for requesting an explanation or reading a confidence signal is identical regardless of which agent produced the output.

## 28.12 Error and Uncertainty Communication
A system failure is communicated as a system failure, never left for the user to interpret as a finding about themselves.

## 28.13 Trust-Building Behaviors
Explanation-on-request, honest confidence, full visibility of changes, and unconditional override together are what let a user verify AI output rather than simply accept it.

## 28.14 Relationship to Product Principles
Guidance not gatekeeping (§28.12); Explainability (§28.6, §28.8); Confidence calibration (§28.7); One Career Knowledge Graph (§28.5); No silent changes (§28.4, §28.5); User ownership (§28.9, §28.10); System not session (§28.2).

## 28.15 Constraints for Future Interaction Patterns
- Preserves structured, non-conversational interaction.
- Keeps explanation requests scoped to a specific output.
- Presents confidence inline with the output it qualifies.
- Never defaults a user into accepting a recommendation.
- Applies identically across whichever agents are active at that phase.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
