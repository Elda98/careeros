# 36. Empty States, Errors & Edge-Case Philosophy

*Part V — Experience & Design Direction · CareerOS Product Requirements Document*

## 36.1–36.4 Purpose and Relationships
§22 defines screen-specific empty/error states; this section defines the enduring philosophy governing all of them.

## 36.5 Empty States Philosophy
An empty state is never "nothing" — it communicates why it is empty, whether that is expected, and what meaningful next step already exists. Most screens have no true empty state because Onboarding's immediate-value guarantee ensures content exists first.

## 36.6 Error Philosophy
System problems, missing user information, and unavailable outputs are each already governed. Errors explain what happened, explain what the user can do next, and never become dead ends.

## 36.7 Edge Cases
No analysis available, roadmap unavailable, deleted information, missing profile data, interrupted workflow — each already governed by an approved rule. Edge cases preserve consistency rather than introducing exceptional interaction models.

## 36.8 Trust During Failure
Trust is tested most during failure, not success.

## 36.9 Continuity After Failure
A failure is a temporary interruption, not a break in the user's ongoing relationship with CareerOS.

## 36.10 Honest Absence
"We don't know" is the correct output when the system has nothing reliable to ground an answer in — the limiting case of confidence calibration.

## 36.11 Accessibility During Failure
Accessibility applies fully to empty and error states — these moments matter most, not least.

## 36.12 Consistency Across Modules
Every future module follows this exact philosophy — no module-specific error language.

## 36.13 Future Expansion Constraints
Future modules may introduce new edge cases but may not introduce a different philosophy for handling them.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
