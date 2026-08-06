# 01 — Product

This directory contains CareerOS's core product documentation — the single source of truth for what the product is, who it is for, and why every decision was made the way it was.

## Contents

| File | Contents |
|---|---|
| [`PRD.md`](PRD.md) | The compiled Product Requirements Document — Parts 0 through X, §0–§59, assembled from `sections/` |
| [`sections/`](sections/) | **The source of truth.** Every section (§0.1–§0.5, §1–§59) as its own individually editable file, 64 files total |
| [`CHANGELOG.md`](CHANGELOG.md) | A chronological record of major revisions to the PRD |

## Editing model (per [`CONTRIBUTING.md`](../../CONTRIBUTING.md))

**The files in `sections/` are the editable source of truth. `PRD.md` is the compiled reference, regenerated from them after every approved change.** To revise a section: edit its file in `sections/`, then regenerate the corresponding block in `PRD.md` so the two never diverge. Never edit `PRD.md` directly and leave `sections/` stale, and never edit a `sections/` file without reflecting the change in `PRD.md` in the same turn.

Each section file follows the naming pattern `NN-Title.md` (or `NN.N-Title.md` for Part 0's five subsections), matching its number and title in `PRD.md` exactly, and links back to the master document in its footer.

## What the PRD is

The PRD is the definitive statement of product scope, user needs, business model, AI product behavior, experience direction, and success criteria for CareerOS. Every subsequent artifact — the [Solution Architecture Specification](../02-Solution-Architecture/), technical architecture, database design, API contracts, agent specifications, design systems, UI screens — is expected to be consistent with it.

It deliberately does **not** contain technical architecture, database schema, API contracts, agent implementation, or UI specification — those belong to the documents that follow it, informed by (but never contradicting) what's established here.

## Structure

| Part | Sections | Contents |
|---|---|---|
| Part 0 | §0.1–§0.5 | Foundations — purpose, vision summary, glossary, design & engineering principles |
| Part I | §1–§7 | Vision & Strategy |
| Part II | §8–§12 | Users & Needs |
| Part III | §13–§22 | Product Definition — scope, core loop, IA, modules, features, requirements, business rules, screens |
| Part IV | §23–§30 | AI System Design |
| Part V | §31–§37 | Experience & Design Direction |
| Part VI | §38–§42 | Business Model |
| Part VII | §43–§47 | Requirements & Constraints |
| Part VIII | §48–§50 | Measurement |
| Part IX | §51–§55 | Roadmap & Execution |
| Part X | §56–§59 | Appendices |

## Status

**Complete and approved, §0–§59.** Locked as of this writing. Future changes follow the Decision Framework (§53) and are recorded in [`CHANGELOG.md`](CHANGELOG.md) and in §55 (Open Questions & Decision Log) within the PRD itself.

## Editorial note

The version of each section in `PRD.md` reflects its final, approved content. The "Principal Product Manager Review" blocks used during drafting and approval — which sometimes surfaced and resolved real inconsistencies before a section was locked — are not reproduced here; they were part of the approval *process*, not the deliverable. That review history is preserved in the project's conversation record.

## Governing rule for all future edits

Per §53 (Decision Framework) and §59 (Document Evolution & Versioning): every future addition extends this document; it does not silently rewrite an already-approved section. A proposed change to anything already approved requires explicit justification against §53.7's hierarchy (Vision → Principles → Strategy → Core Loop → Phase Structure → Features → Implementation) before it is made.
