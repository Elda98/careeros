# 23. AI Product Philosophy

*Part IV — AI System Design · CareerOS Product Requirements Document*

This section establishes the philosophy §24–§30 operationalize into specifics.

## 23.1 AI's Role Inside CareerOS
CareerOS's AI is not a feature — it is the active layer of the Career Knowledge Graph, the mechanism by which the product's central promise (§1: a system that "works for you continuously") is actually delivered rather than merely described. AI's role is to do the work of synthesis and planning a person would otherwise do themselves across disconnected tools (§4) — never to replace the person's own judgment about their career.

## 23.2 What AI Is Allowed To Do
- Analyze the user's profile and active goal to produce a skill-gap assessment (§18 #4).
- Generate and adjust a roadmap derived from that assessment (§18 #5, #9).
- Critique user-submitted material and explain that critique (§18 #7).
- Recommend a next action and state why (§19 FR-DASH-4, FR-AICC-11).
- Ask the user for more information when a reliable output isn't yet possible (§21 BR-GAP-2, BR-AI-5).
- Express reduced confidence when its basis for an output is incomplete or uncertain (§21 BR-AI-4).

## 23.3 What AI Is Never Allowed To Do
- Act outside CareerOS on the user's behalf — submitting, sending, or publishing anything — without explicit, in-the-moment initiation.
- Change the user's roadmap, analysis, or other managed state without that change being visible and explained (§19 FR-AICC-6/12). Updates triggered automatically by the user's own edits (§21 BR-GAP-4, BR-ROAD-2) are allowed; silent ones are not — the line is visibility, not whether a step was automatic.
- Present an assessment as a final or authoritative verdict on the user's worth or potential.
- Present confidence it does not actually have.
- Use one user's data to shape another user's experience by default — any cross-user or aggregate use of data is a matter for §38's compliance policy, not assumed here.

## 23.4 Human vs. AI Decision Boundaries
**AI owns analysis, synthesis, and recommendation. The user owns judgment and action.** An agent can tell a user what it found and what it would do; only the user decides what actually happens next — no AI recommendation is self-executing (§21 BR-AI-1/2).

## 23.5 Explainability Philosophy
Every AI-generated output must be explainable on request, without exception (§0.4 Principle 6; §19 FR-AICC-5/9/16). The more consequential an output, the less acceptable it is for that explanation to be optional: the Dashboard's next-action recommendation surfaces its reason inline rather than requiring a request (§19 FR-DASH-4).

## 23.6 Confidence Philosophy
Confidence is a truthful signal, not a design element. CareerOS never presents an output with more apparent certainty than its actual basis supports (§21 BR-AI-4), and reduced confidence is expressed at the point of output, not buried in a settings screen (§0.4 Principle 15).

## 23.7 Personalization Philosophy
Personalization means an output measurably reflects this specific user's graph — not their segment, not a generic persona (§9). Two users who state the same goal should see outputs that diverge as soon as their profiles, progress, or history diverge.

## 23.8 Memory Philosophy
Memory exists for one reason: to make CareerOS a system, not a session (§3). What the system remembers about a user, it remembers in service of that same user's continuity — not, by default, to improve outputs for other users, and not as a hidden asset the user can't see; any aggregate or cross-user use of memory is a matter for §38's compliance policy, not assumed here.

## 23.9 Multi-Agent Collaboration Principles
- **Single responsibility.** Each agent owns one category of task; none should require guessing at another's.
- **Shared ground truth.** Agents read from and write to the same Career Knowledge Graph — no agent maintains a private, agent-specific memory of the user.
- **Consistent handoff.** When one agent's output feeds another's task, the receiving agent must not contradict or silently discard what the first agent already established with the user.
- **Invisible seams.** The user never needs to know or care how many agents were involved — from their perspective, CareerOS responded, not "Agent A, then Agent B."

## 23.10 Failure Behavior
When the system cannot produce a reliable output, it says so rather than producing a plausible-sounding wrong one (§21 BR-AI-5) — this is CareerOS's failure mode by design. A failure never leaves the user's existing state worse than before the attempt.

## 23.11 Trust Principles
Trust is the product's central asset, not a quality attribute alongside others (§1, §6). Every principle above exists to protect it: explainability and confidence calibration let a user verify AI output rather than simply accept it; the human/AI decision boundary keeps consequential choices with the person whose career it is; honest failure means a wrong answer is rare and, when it happens, visible rather than disguised.

## 23.12 Consistency with the Career Knowledge Graph
Every agent's output is grounded in, and updates, the same Career Knowledge Graph — the "one person, one model" commitment stated in §3 and structured as a Product Pillar in §14. If the graph doesn't yet reflect something an agent needs to know, the correct behavior is to ask the user, not assume.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
