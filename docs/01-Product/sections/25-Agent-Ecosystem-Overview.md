# 25. Agent Ecosystem Overview

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 25.1 Purpose of the Agent Ecosystem
The Agent Ecosystem is what turns the Career Knowledge Graph from a passive record into the active, working system CareerOS's vision describes.

## 25.2 Why Multiple Specialized Agents, Not One General-Purpose AI
- **Explainability requires narrow accountability.** An agent responsible for exactly one kind of output can be held to a clear, specific standard of correctness.
- **The boundaries already exist in the Core Loop.** §14's Core Loop has distinct steps — analyze, plan, act/feedback — that map directly onto distinct responsibilities.
- **Ownership makes the "no silent overwrite" guarantee enforceable.**

## 25.3 The Phase 0 Agent Roster

| Agent | Single Responsibility | Owns (writes) |
|---|---|---|
| Skill-Gap Analysis Agent | Compare Profile and active Goal to produce a skill-gap assessment | Skill-Gap Analysis |
| Roadmap Agent | Derive an ordered roadmap from the current Skill-Gap Analysis | Roadmap (item content) |
| CV/Profile Feedback Agent | Evaluate a submitted document against the active Goal | CV/Profile Feedback Round |

Three agents, not more — the minimal set that satisfies single-responsibility against the Phase 0 Feature Inventory.

## 25.4 Skill-Gap Analysis Agent
- **Reads:** Profile, active Goal, its own previous Analysis version.
- **Writes:** A new Skill-Gap Analysis version.
- Confidence exposure, on-request explanation, and change-visibility are output properties every agent's output must have (§23.5/§23.6), not separate responsibilities.

## 25.5 Roadmap Agent
- **Reads:** Current Skill-Gap Analysis, its own previous Roadmap version.
- **Writes:** New Roadmap Item content on generation or regeneration. It never sets or alters item status — that remains exclusively user-controlled.
- **Powers Dashboard's next-action reasoning:** Dashboard has no agent of its own — it surfaces the Roadmap Agent's own item-level output and explanation.

## 25.6 CV/Profile Feedback Agent
- **Reads:** Active Goal, the submitted document.
- **Writes:** Feedback content for a new review round, distinguishing factual/structural issues from judgment calls.
- **Independence:** Does not read the Skill-Gap Analysis or Roadmap.

## 25.7 User-Facing vs. Internal Agents
All three Phase 0 agents are user-facing. Phase 0 has no internal-only agent — staleness detection (§21 BR-NOTIF-2) does not require one, since its trigger conditions are evaluated against existing graph state.

## 25.8 Ownership Boundaries
**Many agents may read a given entity; exactly one agent writes it.**

| Entity | Written by | Read by |
|---|---|---|
| Skill-Gap Analysis | Skill-Gap Analysis Agent | Roadmap Agent, Skill-Gap Analysis Agent (own history) |
| Roadmap (item content) | Roadmap Agent | Roadmap Agent (own history) |
| CV/Profile Feedback Round | CV/Profile Feedback Agent | — |
| Roadmap Item status | User only | — |

## 25.9 Agent Collaboration Principles (Applied)
- **Single responsibility:** established in §25.3–§25.6.
- **Shared ground truth:** none of the three agents retain state outside the Career Knowledge Graph.
- **Consistent handoff:** the Skill-Gap Analysis Agent's output is the Roadmap Agent's input; never proceeds on a version the Skill-Gap Analysis Agent hasn't actually produced.
- **Invisible seams:** the user experiences one regenerated roadmap, not "two systems ran."

## 25.10 Handoff Rules
- **HR-1:** A handoff occurs only when the upstream entity actually changes.
- **HR-2:** The downstream agent always acts on the current version of its input, never a stale one.
- **HR-3:** A handoff must not silently discard user-controlled state.
- **HR-4:** If a downstream agent's run fails, the upstream agent's output remains valid and visible.

## 25.11 Agent Lifecycle
- **Skill-Gap Analysis Agent** invoked: after Onboarding, on a material change, or on user-requested refresh.
- **Roadmap Agent** invoked immediately following any new Skill-Gap Analysis version.
- **CV/Profile Feedback Agent** invoked only on user-initiated submission — never automatically.

## 25.12 Preventing Conflicting Outputs
Conflicts are prevented structurally: exclusive write-ownership means two agents can never produce competing versions of the same entity; HR-2 means a downstream agent can never act on a superseded input; the single-current-value constraint means the user is never shown two disagreeing outputs.

## 25.13 Constraints for Future Agents (Phase 1–4)
- Exactly one primary responsibility — no exceptions.
- Reads and writes only through the Career Knowledge Graph, extending it with new entities if needed.
- Does not overlap an existing agent's write-ownership of any entity.
- Complies fully with §23 — advisory output only, explainable, confidence-calibrated, no silent action.
- Is introduced only when its owning module reaches its phase.
- Requires no redesign of an existing agent's responsibility or of the graph model.

## 25.14 Extending the Ecosystem Without Redesign
New agents attach to new graph entities, added when their module is scoped, without altering the write-ownership of entities that already exist.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
