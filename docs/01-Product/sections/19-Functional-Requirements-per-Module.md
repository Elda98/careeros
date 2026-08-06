# 19. Functional Requirements per Module

*Part III — Product Definition · CareerOS Product Requirements Document*

Covers Phase 0 (MVP) modules only. Each requirement references the Feature Inventory ID it implements.

## Authentication (#1)
- **FR-AUTH-1:** A user must be able to create a new account and establish a unique identity.
- **FR-AUTH-2:** A user must be able to authenticate into an existing account on return visits.
- **FR-AUTH-3:** A user must be able to recover access if credentials are lost.
- **FR-AUTH-4:** All activity and data must be associated with the authenticated identity, linked to the Career Knowledge Graph.
- **FR-AUTH-5:** A user must be able to permanently delete their account; deletion behavior follows §21/§38.

## Onboarding (#2)
- **FR-ONBOARD-1:** The system must define and communicate the minimum profile information required before generating an initial skill-gap analysis.

## User Profiles (#3)
- **FR-PROF-1:** A user must be able to create and edit background, education, and experience information.
- **FR-PROF-2:** A user must be able to state a target role or field and update it at any time.
- **FR-PROF-3:** Profile data must be stored as part of the Career Knowledge Graph, accessible to AI Career Center agents.
- **FR-PROF-4:** The system must indicate what profile information is missing or would improve analysis quality.

## AI Career Center — Skill-Gap Analysis (#4)
- **FR-AICC-1:** The system must generate a skill-gap analysis comparing the user's current profile against their stated goal.
- **FR-AICC-2:** The analysis must identify specific missing or underdeveloped skills/experience, not only an aggregate score.
- **FR-AICC-3:** The system must expose reduced confidence whenever the analysis carries meaningful uncertainty — incomplete profile data, an ambiguous goal, or low confidence in the skill mapping.
- **FR-AICC-4:** A user must be able to request a refreshed analysis after updating profile or goal.
- **FR-AICC-5:** The system must be able to explain, on request, why a specific skill was flagged as a gap.
- **FR-AICC-6:** When the analysis changes from a previous version, the user must be able to see what changed and why — not have it silently replaced.

## AI Career Center — Roadmap (#5, #6, #9)
- **FR-AICC-7:** The system must generate an ordered roadmap of concrete actions derived from the skill-gap analysis.
- **FR-AICC-8:** Each roadmap item must be presented with enough specificity that the user can act on it without further clarification.
- **FR-AICC-9:** A user must be able to mark roadmap items complete, in progress, or skipped — and revise that status afterward.
- **FR-AICC-10:** The system must regenerate or adjust the roadmap when the user's goal or profile changes materially (the definition of "material" is a business rule, set in §21).
- **FR-AICC-11:** The system must explain why a given roadmap item was recommended, on request.
- **FR-AICC-12:** When the roadmap changes as a result of regeneration, the user must be able to see what changed and why — not have it silently replaced.

## AI Career Center — CV/Profile Feedback (#7)
- **FR-AICC-13:** A user must be able to submit a CV or profile document for review.
- **FR-AICC-14:** The system must return specific, actionable feedback tied to the user's stated target role.
- **FR-AICC-15:** The system must distinguish factual/structural issues from judgment-call feedback.
- **FR-AICC-16:** The system must be able to explain, on request, why a specific piece of feedback matters for the target role.
- **FR-AICC-17:** A user must be able to request re-review after making changes.
- **FR-AICC-18:** A user must be able to view previous feedback rounds for a submitted CV/profile, not only the most recent.

## AI Career Center — Progress (#8)
- **FR-AICC-19:** The system must maintain a history of the user's skill-gap assessments and roadmap completion over time.
- **FR-AICC-20:** The user must be able to view how their readiness has changed since they started.

## Dashboard (#10)
- **FR-DASH-1:** The dashboard must present a single, current snapshot of the user's career status — action-oriented, not an analytics grid.
- **FR-DASH-2:** The dashboard must surface the single next recommended action from the active roadmap.
- **FR-DASH-3:** The dashboard must not require navigation to another screen to understand overall status at a glance.
- **FR-DASH-4:** The next-action recommendation must include a brief reason it's the next step, visible without additional navigation.

## Notifications (#11)
- **FR-NOTIF-1:** The system must notify the user when a requested analysis, roadmap update, or feedback review is ready.
- **FR-NOTIF-2:** The system must notify the user when their roadmap has gone stale relative to elapsed time or known changes.
- **FR-NOTIF-3:** A user must be able to control notification frequency and category (specific delivery channels depend on Platform Surface).
- **FR-NOTIF-4:** The system must notify the user when the skill-gap analysis or roadmap changes as a result of a system-initiated regeneration, not only in response to a user request.

## Settings (#12, #13)
- **FR-SET-1:** A user must be able to view and manage their subscription and billing information.
- **FR-SET-2:** A user must be able to view what data CareerOS has stored about them.
- **FR-SET-3:** A user must be able to request deletion of specific stored CareerOS data (e.g., AI memory contents, profile data) independent of full account deletion, which is covered exclusively by FR-AUTH-5.
- **FR-SET-4:** A user must be able to cancel their subscription directly, without contacting support.

## Value Recap & Renewal Touchpoint (#14)
- **FR-RENEW-1:** The system must present a summary of progress made (skills closed, roadmap completed) before a renewal charge occurs.
- **FR-RENEW-2:** If a user cancels, the system must offer an optional, non-blocking opportunity to state why.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
