# 21. Business Rules & Policies

*Part III — Product Definition · CareerOS Product Requirements Document*

Governs Phase 0 (AI Career Center, Students & Fresh Graduates) only.

## 21.1 Goal Management
- **BR-GOAL-1:** A user has exactly one active goal at a time.
- **BR-GOAL-2:** Setting a new active goal archives the current one as a previous goal — it is retained, not deleted.
- **BR-GOAL-3:** Changing the active goal is a material change (§21.2) and triggers regeneration of the skill-gap analysis and roadmap.
- **BR-GOAL-4:** Previous goals remain visible in progress history but are not editable.
- **BR-GOAL-5:** A user may reactivate a previous goal, making it the active goal again, subject to BR-GOAL-3.

## 21.2 Skill-Gap Analysis Rules
- **BR-GAP-1:** Minimum information required to run an analysis is an active goal plus the profile-completeness bar defined in FR-ONBOARD-1.
- **BR-GAP-2:** Analysis can only run once BR-GAP-1 is met; below that bar, the system communicates what's missing rather than producing an analysis.
- **BR-GAP-3 (definition of "material change"):** A material change is (a) the active goal changing, or (b) the user editing a profile field the most recent analysis identified as contributing to a specific gap. Edits unrelated to a flagged gap do not qualify.
- **BR-GAP-4:** Analysis regenerates automatically on a material change; the user may also request a manual refresh at any time regardless of whether a material change occurred.
- **BR-GAP-5:** An incomplete profile above the BR-GAP-1 bar does not block analysis, but the result must carry reduced confidence.

## 21.3 Roadmap Rules
- **BR-ROAD-1:** A roadmap only exists derived from a current skill-gap analysis; there is no roadmap independent of one.
- **BR-ROAD-2:** Roadmap regeneration follows the same material-change trigger as analysis.
- **BR-ROAD-3:** When a roadmap regenerates, the prior version is retained as version history, not deleted.
- **BR-ROAD-4:** A skipped item remains visible, counts neither toward nor against progress, and may be un-skipped at any time.
- **BR-ROAD-5:** A completed item may be reopened by the user at any time.
- **BR-ROAD-6:** Reopening a completed item does not erase its original completion record — progress history reflects the full sequence of status changes.
- **BR-ROAD-7:** Archived roadmap versions are retained for the lifetime of the account, viewable but not editable.

## 21.4 Progress Rules
- **BR-PROG-1:** Progress history is a chronological record of skill-gap assessments, roadmap status changes, and CV feedback rounds — not a single current-state snapshot.
- **BR-PROG-2:** Readiness is captured at each analysis event so its change over time is visible.
- **BR-PROG-3:** All progress history is visible to the user who generated it by default.
- **BR-PROG-4:** Progress history is never silently altered or removed, except by explicit user-initiated deletion.

## 21.5 AI Decision Rules
- **BR-AI-1:** All AI-generated outputs are advisory; none is presented as a final or authoritative verdict on the user.
- **BR-AI-2:** The user retains final control over every action an AI output recommends — nothing is executed on the user's behalf without their initiation.
- **BR-AI-3:** Every AI-generated recommendation must be explainable on request.
- **BR-AI-4:** Confidence must be presented wherever the system's certainty is reduced; confidence is never presented as higher than the system's actual basis for the output.
- **BR-AI-5:** Where the system cannot produce a reliable output, it must say so rather than produce a plausible but unflagged low-confidence result.

## 21.6 CV Feedback Rules
- **BR-CV-1:** A user may submit a CV/profile for review at any time; any limit on review-round volume is a subscription-tier matter defined in §39.
- **BR-CV-2:** Each submission and its feedback form one review round; all rounds are retained, not only the most recent.
- **BR-CV-3:** Retained review rounds exist so the user can judge whether prior feedback was addressed in a later submission.
- **BR-CV-4:** A new submission does not delete or overwrite previous versions or their feedback.

## 21.7 Notification Rules
- **BR-NOTIF-1:** A notification triggers when: (a) a requested analysis, roadmap, or feedback review completes; (b) the analysis or roadmap regenerates without a direct user request; or (c) the roadmap becomes stale.
- **BR-NOTIF-2 (definition of "stale"):** A roadmap is stale when an extended period passes with no item activity, or the system detects the user's circumstances have likely changed without a corresponding update. The exact time threshold is a tunable parameter set outside this document.
- **BR-NOTIF-3:** A user may adjust notification frequency and category; notifications tied to a pending renewal charge are exempt from full muting, though their frequency/format may still be adjusted.
- **BR-NOTIF-4:** Preference changes apply prospectively only; they do not retroactively affect already-triggered notifications.

## 21.8 Subscription Rules
- **BR-SUB-1:** CareerOS offers a free tier and a paid tier; the specific feature/usage split is defined in §39.
- **BR-SUB-2:** A user may cancel at any time without contacting support; cancellation takes effect at the end of the current billing period unless §39 states otherwise.
- **BR-SUB-3:** Before a renewal charge, the user is shown a progress recap reflecting actual, verifiable history — not marketing content.
- **BR-SUB-4:** Cancellation retains previously generated data; it is a distinct action from data deletion.
- **BR-SUB-5:** Cancellation does not delete the account — it changes access to free-tier terms as defined in §39.

## 21.9 Data & Memory Rules
- **BR-DATA-1:** Data in the Career Knowledge Graph is owned by the user who generated it. Compliance-level handling is governed by §38 (compliance), not established here.
- **BR-DATA-2:** A user can view what data CareerOS has stored about them at any time.
- **BR-DATA-3:** A user can delete specific stored data independent of deleting their account.
- **BR-DATA-4:** Deleting a specific data field does not retroactively remove historical AI outputs generated using it at the time, unless the user separately requests full history deletion.
- **BR-DATA-5:** Full account deletion is governed exclusively by FR-AUTH-5 and removes or anonymizes all associated data.
- **BR-DATA-6:** Nothing the system uses to personalize a user's experience is hidden from that user.

## 21.10 Business Constraints
- **BR-CONST-1:** These rules apply only within Phase 0 scope.
- **BR-CONST-2:** No rule in this section may override the Product Principles (§3) or §0.4; conflicts are resolved via the Decision Framework (§53).
- **BR-CONST-3:** No rule may authorize an AI action that bypasses user awareness or consent — absolute for Phase 0.
- **BR-CONST-4:** Rules dependent on geography, language, or platform surface are out of scope until the corresponding Open Questions (§13/§55) are resolved.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
