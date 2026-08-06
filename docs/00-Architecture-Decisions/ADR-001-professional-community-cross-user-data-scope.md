# ADR-001 — Professional Community's Peer-Matching Mechanism Requires Cross-User Data Use Not Yet Scoped by the PRD

**Status:** Proposed — awaiting approval. Discovered during Solution Architecture Specification, Part V (Extensibility & Future-Phase Architecture), while producing the Professional Community worked example. Not silently resolved in SAS.md or any PRD section; recorded here per repository governance.

## Issue

PRD §16 approves **Professional Community** (Phase 3) with the stated purpose "Peer connection around shared goals/field," reading "Goal/field, for relevant grouping" and writing "Minimal — community activity, not core career state."

PRD §44 (Data Privacy & Compliance Requirements), §44.5 Privacy Boundaries, states:
- **DPR-8:** "An agent's output is grounded only in that specific user's own graph data — never another user's, by default."
- **DPR-10:** "Any cross-user or aggregate data use is out of scope for this document."

Professional Community's own stated purpose — connecting peers *around shared goals/field* — requires comparing one user's Goal/field against other users' Goal/field to determine who should be surfaced to whom. That comparison is a cross-user data use by definition: it cannot be performed by reading only one user's own graph data. DPR-10 explicitly declines to scope cross-user or aggregate data use anywhere in the current PRD.

This is not a conflict between two SAS statements, and not a defect in Parts I–IV of the SAS — every Knowledge Layer rule in Part I (§3.1, §24.1: the graph as "the persistent representation of *one user's* career state") is written, correctly, on the assumption of single-user scope. The issue is that PRD §16's approval of Professional Community's *purpose* already implies a mechanism the PRD's own §44 has not yet scoped, and no SAS section can resolve that gap without either inventing a cross-user privacy model (a genuine new product/policy decision, out of an SAS's authority) or silently ignoring the tension (which repository governance and this Part's own instructions forbid).

## Affected Sections

- PRD §16 (Platform Modules) — Professional Community's approved purpose.
- PRD §44.5 (DPR-8, DPR-10) — the privacy boundary that does not yet scope cross-user use.
- SAS Part I, §3.1, §24.1-equivalent Knowledge Layer scope (single-user representation).
- SAS Part V, §24/§25 (this Part) — the Professional Community worked example, which is written to model only the storage of an already-established connection and community activity, explicitly excluding the peer-matching/discovery mechanism from architectural detail as a result of this ADR.

## Options Considered

1. **Model the matching mechanism anyway, inferring a cross-user rule.** Rejected — this would require the SAS to originate a privacy policy decision (what cross-user comparison is permitted, under what consent) that PRD §44 explicitly reserves as unscoped. An SAS may formalize approved product decisions; it may not make new ones.
2. **Silently omit Professional Community from Part V's worked examples.** Rejected — the module is already PRD-approved; omitting it without explanation would violate this Part's own traceability requirement and would hide a real architectural finding rather than surfacing it.
3. **Model only the already-unambiguous portion (storing an accepted connection and minimal community activity, per §16's write description) and explicitly exclude the matching/discovery mechanism from architectural detail, pending resolution.** Adopted for the worked example in §24/§25. This keeps the SAS within its own boundary (formalizing what's approved) while surfacing exactly what remains open.

## Recommended Decision

Resolve DPR-10's scope specifically for Professional Community before Phase 3 is architected in further detail — i.e., before Part V's Professional Community worked example (or a future document) can describe the matching/discovery mechanism itself. Two sub-options for that future resolution, presented for product decision, not decided here:
- **(a)** Extend §44 with a narrowly-scoped cross-user rule specific to goal/field matching (e.g., opt-in visibility, matching on non-sensitive fields only), keeping DPR-10's general prohibition intact for everything else.
- **(b)** Scope Professional Community's matching as a user-initiated, explicit action (the user browses or searches, rather than the system inferring and surfacing matches) — which may avoid triggering DPR-10 at all, since it would not require the system to compare users' data without a direct request.

## Impact if Unresolved

None to Phase 0 (AI Career Center) or any currently-approved scope. Professional Community is Phase 3 and not yet in active development. This ADR blocks only the *depth* of Professional Community's future architecture — its approved existence at product level (§16) is not in question, and this ADR does not request or imply any change to §16.

## Approval

This decision has not been made. Per repository governance, no PRD or SAS section has been altered to reflect either option above. Awaiting explicit approval before any further Professional Community architectural detail beyond what §24/§25 of SAS Part V already models is produced.
