# 27. AI Workflows

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 27.1 Purpose of AI Workflows
An AI Workflow is the named, complete sequence connecting a trigger, the agent(s) invoked, the graph entities touched, and what the user ultimately sees.

## 27.2 Workflow vs. Agent, Capability, and Feature
A Feature is a user-facing capability at product-scope level. An Agent is who owns producing part of it. A Capability is a reusable ability an agent draws on. A Workflow is the specific, complete path connecting a trigger to an outcome.

## 27.3 Workflow: First Skill-Gap Analysis
- **Trigger:** Onboarding completes, meeting the minimum bar.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads:** Profile, active Goal. No prior version exists — Change Awareness does not apply.
- **Writes:** First Skill-Gap Analysis version.
- **Initiation:** Automatic, as a direct consequence of completing Onboarding.
- **Outcome / Screen:** Skill-Gap Analysis screen, with confidence indicator if applicable.
- **Cascades to:** §27.4.

## 27.4 Workflow: Roadmap Generation
- **Trigger:** A Skill-Gap Analysis version has just been produced with no existing Roadmap yet.
- **Participants:** Roadmap Agent.
- **Reads:** Current Skill-Gap Analysis.
- **Writes:** First Roadmap version.
- **Initiation:** Automatic, cascading immediately from §27.3.
- **Outcome / Screen:** Roadmap screen.

## 27.5 Workflow: Analysis Refresh after Material Change
- **Trigger:** A material change — active Goal changes, or a flagged Profile field is edited.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads:** Profile, active Goal, previous Analysis version.
- **Writes:** New Skill-Gap Analysis version; prior version retained.
- **Initiation:** Automatic, as a direct consequence of the user's own edit.
- **Side effect (not agent activity):** A notification is triggered.
- **Cascades to:** §27.6, if the new Analysis differs from the prior one.

## 27.6 Workflow: Roadmap Regeneration
- **Trigger:** A new Skill-Gap Analysis version differs from the prior one, and a Roadmap already exists.
- **Participants:** Roadmap Agent.
- **Reads:** Current Skill-Gap Analysis, previous Roadmap version.
- **Writes:** New Roadmap Item content; prior version retained; Item status-change history preserved.
- **Initiation:** Automatic, cascading from §27.5 (or §27.7).

## 27.7 Workflow: Manual Refresh
- **Trigger:** The user explicitly requests a refreshed Analysis, whether or not a material change has occurred.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads / Writes:** Identical mechanics to §27.5.
- **Initiation:** User-initiated directly.
- **Cascades to:** §27.6, under the same condition as §27.5.

## 27.8 Workflow: CV / Profile Feedback
- **Trigger:** User submits a CV/profile document.
- **Participants:** CV/Profile Feedback Agent only.
- **Reads:** Active Goal, the submitted document.
- **Writes:** A new CV/Profile Feedback Round; prior rounds retained.
- **Initiation:** Always user-initiated.
- **Boundary:** Does not cascade into §27.5 or §27.6.

## 27.9 Workflow: Dashboard Next Action
- **Trigger:** User views the Dashboard.
- **Participants:** None — a read/display workflow, not an agent-invocation workflow.
- **Reads:** The current Roadmap's next incomplete item and its existing explanation, and the current Analysis's confidence state.
- **Writes:** Nothing.

## 27.10 Workflow: Change Explanation
- **Trigger:** User requests to see what changed and why, for a Skill-Gap Analysis or a Roadmap, via Progress.
- **Participants:** Skill-Gap Analysis Agent or Roadmap Agent — using Change Awareness. Not available for CV/Profile Feedback Rounds.
- **Reads:** The current version and its immediately prior version.
- **Writes:** Nothing.

## 27.11 Workflow Boundaries
A workflow ends where its own trigger's outcome is fully written and visible. A handoff between workflows is governed by §25.10's Handoff Rules.

## 27.12 Failure Behavior
Every generation workflow fails the same way: if the agent cannot produce a reliable output, it says so, and the prior state remains intact and visible. Display workflows fail by showing the last known state.

## 27.13 Workflow Consistency Rules
- No workflow writes an entity it does not own.
- A downstream workflow step always acts on the current version of its input.
- Every generation workflow's output carries Explainability and Confidence Calibration.
- "Automatic" and "silent" are never the same thing.

## 27.14 Relationship to Product Principles
These workflows are the concrete mechanism behind §3's "Executes, not just answers."

## 27.15 Constraints for Future Workflows
- Uses only agents already approved (or introduced under §25.13) and capabilities already approved (or introduced under §26.10).
- Touches only Career Knowledge Graph entities already defined (or extended under §24.12).
- Is triggered either directly by the user or automatically as a visible, notifiable consequence of the user's own action.
- Respects exclusive write-ownership and the handoff rules exactly as applied above.
- Belongs to a module that has reached its approved phase.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
