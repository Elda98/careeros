# Contributing to CareerOS (Orbit)

## Quick start

1. Fork the repository and clone your fork.
2. Copy `.env.example` to `.env` and fill in your own Clerk and Groq API keys — see the root [`README.md`](README.md#environment-variables) for what each variable does.
3. Run the stack locally: `make up` (Docker Compose), or follow [`backend/README.md`](backend/README.md) and [`frontend/README.md`](frontend/README.md) for a native setup.
4. Before opening a pull request:
   - Backend: `cd backend && pytest tests/`
   - AI package: `cd ai && pytest tests/`
   - Frontend: `cd frontend && npx tsc --noEmit && npx eslint .`
5. Keep commits scoped and describe *why* a change was made, not just what changed.
6. Open a pull request against `master` with a clear description of the change and how it was verified.

## Code style

- Backend/AI: standard Python, type-hinted, matching the existing FastAPI/Pydantic patterns already in `backend/app/` and `ai/careeros_ai/`.
- Frontend: TypeScript, functional React components, Tailwind utility classes via the existing design-token system (`frontend/app/globals.css`) — avoid hardcoded colors.
- Every router/agent states which entity it owns vs. only reads (write-ownership discipline — see the root README's AI architecture section); new code should follow the same discipline.

## Repository governance

The rules below record how this repository's own project documentation (PRD, SAS, and related specs) is maintained. They apply to anyone editing `docs/`, not to routine application code changes covered by the Quick start above.

## 1. The repository is the single source of truth

Every approved document, section, revision, or architectural decision must be written to the repository immediately, not left only in a conversation or chat log. Conversation history is never assumed sufficient — the repository must always contain the latest approved version of the project.

## 2. Master document + sections folder, always together

No approved document may exist only as a single large file. Every major document must always have **both**:

1. A master document (e.g., `PRD.md`, `SAS.md`, `DDS.md`, `API.md`, `TA.md`, `AIA.md`)
2. A `sections/` folder containing every section as an individual file

**The section files are the editable source of truth. The master document is the compiled reference, regenerated from the section files after every approved change.** The two must never be allowed to diverge — if they do, the section files govern, and the master is regenerated from them.

Example:
```
docs/
  01-Product/
    PRD.md
    sections/
      00.1-Purpose-of-This-Blueprint.md
      00.2-Project-Vision-Summary.md
      ...
      59-Document-Evolution-and-Versioning.md
  02-Solution-Architecture/
    SAS.md
    sections/
      01-System-Architecture-Philosophy.md
      ...
```

## 3. Update rules for every approved change

- If a change belongs to an existing document, update the master document and the relevant section file(s) in the same turn.
- Maintain all numbering, headings, cross-references, tables of contents, and internal links automatically — never leave them stale.
- If a document does not yet exist, create it (master + `sections/` folder) in the correct numbered folder under `docs/` before writing content into it.
- If a new document requires a new folder, create it following the existing `NN-Document-Name/` convention.
- If an edit changes something another document depends on, update all affected cross-references in the same turn.

## 4. Every major document maintains a CHANGELOG

Each major document (PRD, SAS, DDS, API, Technical Architecture, AI Architecture, and any future one) has its own `CHANGELOG.md` alongside its master document, recording revisions by milestone.

## 5. READMEs stay current

Every folder's `README.md` is updated whenever a document, section, or folder is added beneath it — including this file, whenever the rules themselves change.

## 6. Reporting

At the end of every task that touches the repository, report: files created, files modified, files updated, and any cross-references updated.

## 7. Document Reference

| Document | Master file | Location |
|---|---|---|
| Architecture Decision Records (ADRs) | *(none — one file per decision)* | `docs/00-Architecture-Decisions/` |
| Product Requirements Document (PRD) | `PRD.md` | `docs/01-Product/` |
| Solution Architecture Specification (SAS) | `SAS.md` | `docs/02-Solution-Architecture/` |
| Database Design Specification (DDS) | `DDS.md` | `docs/03-Database-Design/` *(not yet started)* |
| API Specification | `API.md` | `docs/04-API-Specification/` *(not yet started)* |
| Technical Architecture | `TA.md` | `docs/05-Technical-Architecture/` *(not yet started)* |
| AI Architecture | `AIA.md` | `docs/06-AI-Architecture/` *(not yet started)* |

Numbered folders under `docs/` are assigned as each document is actually started, following the existing sequence already in place (see root [`README.md`](README.md)).

## 8. Implementation-phase documentation (post-SAS)

Once the PRD and SAS are approved as sufficient for implementation, rule 2's master-document-plus-`sections/`-folder pattern applies only to the PRD and SAS themselves (and any future full specification explicitly commissioned the same way) — it does not apply to implementation-adjacent documentation. A database schema, API contract, or component-level architectural note is written in minimal form directly alongside the code it describes (e.g., in the relevant `frontend/`, `backend/`, `ai/`, or `infrastructure/` subfolder), not compiled into a separate top-level specification document first. Every such fragment must still trace back to the PRD and SAS and must never contradict them without an ADR (rule 9); only the delivery form changes, not the traceability requirement.

## 9. Architecture Decision Records (ADRs)

If work on any document surfaces a genuine architectural ambiguity or contradiction — not a scope gap already resolvable by excluding or renaming, but a real tension between two already-approved statements, or between an approved product decision and an approved constraint — it is never silently resolved. It is recorded as an ADR under `docs/00-Architecture-Decisions/`, one file per decision, named `ADR-NNN-short-slug.md`, numbered sequentially. Each ADR states: the issue, the affected PRD/SAS (or other document) sections, the options considered, a recommended decision, and its impact if left unresolved. An ADR's status is **Proposed** until a decision-maker explicitly approves it; no document is edited to reflect an ADR's recommended decision until that approval is recorded, per rule 1. An approved ADR's resolution is then written into the affected document(s) directly, and the ADR itself is updated to **Accepted** with a pointer to where the resolution landed.
