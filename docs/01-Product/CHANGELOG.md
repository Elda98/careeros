# PRD Changelog

All notable revisions to the CareerOS Product Requirements Document are recorded here. Entries are grouped by milestone, not by date, since the document was built section-by-section through a structured review process rather than on a calendar.

## v1.0 — Initial complete PRD (§0–§59)

- Established the Table of Contents and locked its structure (Parts 0–X, 59 sections).
- Wrote and approved Part 0 (Foundations) through Part X (Appendices), each section passing a Principal Product Manager Review (traceability, consistency, no duplicate concepts) before being locked.
- Key foundational decisions locked during this pass:
  - MVP scope: AI Career Center only, for Students & Fresh Graduates, on a B2C subscription model (§13).
  - Phased sequencing: Phase 0 (Core Loop) → Phase 1 (Learning Hub, Portfolio) → Phase 2 (Jobs & Internships) → Phase 3 (Community) → Phase 4 (Universities, Companies) (§7, §16).
  - Career Knowledge Graph, three-agent Phase 0 roster, capability catalog, and eight AI Workflows defined (§24–§27).
  - Responsible AI Policy (§29), Non-Functional Requirements (§43), Data Privacy & Compliance (§44), and Trust & Safety Requirements (§45) consolidated from material established earlier in the document.
  - Decision Framework (§53) formalized as the governance mechanism referenced throughout every prior section's "Constraints" subsection.

## Post-v1.0 amendments

### Amendment 1 — Future-phase roles and modules added
Following a scope-conflict review against §7, §13, §16, and §47 (PC-1/PC-2), the following were added **as documented future-phase vision only**, with zero change to Phase 0 scope, the Core Loop, or any approved FR/BR/RAI/NFR/DPR/TS item:
- **Company (Self-Serve / Job-Posting)** segment and persona — Phase 2, supply-side complement to Jobs & Internships.
- **Service Provider / Freelancer** segment and persona — Unscheduled, tied to a new **Services Marketplace** module.
- Extended §16 (Jobs & Internships row, Services Marketplace row), §18 (Feature Inventory #35–44), §8, §9, §12, and §24.12 accordingly.
- Flagged, not resolved: the Services Marketplace sits close to §13's permanent "not a gig or freelance marketplace" boundary — logged as an open reconciliation point for whenever that phase is actually pursued.

### Amendment 2 — Trainer/Tutor merged into Service Provider
Per locked product decision: Trainer/Tutor/Mentor is no longer a standalone account type, persona, or segment. Fully merged into the existing Service Provider account, which now explicitly covers tutoring, training, mentoring, programming, design, translation, CV writing, portfolio design, career consulting, and any future professional service.
- Removed the standalone Trainer/Tutor row from §8 and §9; removed the Trainer-specific value-proposition line from §12.
- Reverted the Learning Hub row in §16 to its original (pre-Trainer) description.
- Removed Feature Inventory items #39–41 (Trainer-specific); generalized "Trainer professional profile" into a new **Service Provider profile creation** feature, renumbering the Services Marketplace feature cluster to #39–42.
- Updated §24.12 to reference a single Service Provider profile entity rather than separate Company/Service Provider/Trainer entities.

## Structural change — Master + Sections split

Per the repository rule established in [`CONTRIBUTING.md`](../../CONTRIBUTING.md) (no approved document may exist only as a single large file), the PRD was split into a `sections/` folder containing all 64 individual section files (§0.1–§0.5, §1–§59), alongside the existing `PRD.md`. No content was changed in this split — every section file is an exact extraction of its corresponding block in `PRD.md`. Going forward, `sections/` is the editable source of truth and `PRD.md` is regenerated from it.

## Status

Current version: **1.0**, with the two amendments above incorporated directly into `PRD.md` and `sections/`. No section of the original locked PRD (§0–§59) was rewritten to accommodate these amendments — both were additive extensions consistent with §59.4 (Extension vs. Revision).
