# 44. Data Privacy & Compliance Requirements

*Part VII — Requirements & Constraints · CareerOS Product Requirements Document*

A consolidation of privacy-relevant commitments.

## 44.3 Data Ownership
- **DPR-1:** Data is owned by the user it describes.
- **DPR-2:** The graph exists in service of the individual user — never repurposed as a shared/aggregate asset by default.
- **DPR-3:** A user can view what data is stored about them at any time.
- **DPR-4:** A user can delete specific stored data or delete their account entirely.

## 44.4 User Consent
- **DPR-5:** No AI action bypasses user awareness or consent.
- **DPR-6:** Every interaction is user-initiated or an automatic, visible consequence of the user's own action — never a third kind.
- **DPR-7:** Every AI output remains subject to human review before real-world consequence.

## 44.5 Privacy Boundaries
- **DPR-8:** An agent's output is grounded only in that specific user's own graph data — never another user's, by default.
- **DPR-9:** No capability performs inference beyond what is explicitly defined and approved.
- **DPR-10:** Any cross-user or aggregate data use is out of scope for this document.

## 44.6 Transparency Requirements
- **DPR-11:** Every AI-generated output is explainable on request.
- **DPR-12:** Confidence is presented honestly at the point of output.
- **DPR-13:** A user can see what changed in a historical output and why.
- **DPR-14:** Nothing used to personalize a user's experience is hidden from them.

## 44.7 Historical Integrity
- **DPR-15:** Historical entries are not rewritten — only removed by explicit user-initiated deletion.
- **DPR-16:** Deleting a data field does not retroactively invalidate historical records generated from it before deletion.
- **DPR-17:** A failed operation never leaves prior valid state degraded or lost.
- **DPR-18:** The graph persists continuously across sessions.

## 44.9 Future Compliance Constraints
Future legal or regulatory requirements may extend this section but may never weaken user ownership, consent, visibility, or Responsible AI. This document does not anticipate specific legal or regulatory frameworks.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
