# 24. Career Knowledge Graph

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 24.1 What the Career Knowledge Graph Is
The Career Knowledge Graph is the persistent, structured representation of one user's career state — their profile, goal, skill gaps, roadmap, and feedback history. It is scoped to career substance specifically: identity, billing, and notification preferences exist alongside it as account-level data but are not part of it.

## 24.2 Why One Shared Graph, Not Separate Module Data
§3 commits to "one person, one model," and §16 shows every module reading from and writing to the same graph rather than maintaining its own. If each module held its own view of the user, personalization would fragment exactly the way the tools CareerOS replaces already do (§4).

## 24.3 Core Entities (Conceptual)
- **Profile** — background, education, experience.
- **Goal** — the user's stated target role/field; one active at a time, previous ones retained.
- **Skill-Gap Analysis** — an assessment of the user against the active goal at a point in time.
- **Roadmap** — an ordered plan derived from an analysis, made up of **Roadmap Items**, each with a status.
- **CV/Profile Feedback Round** — a submitted document paired with the feedback generated for it.
- **Derived signals** — Readiness, Career Score, Career Health — computed from the entities above, not stored as independent raw facts.

**Progress** is not a separate entity — it is the chronological view across Goal history, Analysis versions, Roadmap/Item history, and Feedback rounds.

## 24.4 Relationships Between Entities

```
Identity (anchors the graph; itself outside its scope — §24.12)
   │
   ├── Profile ─────────────┐ (current state; user-controlled)
   │                         │
   ├── Goal ─────────────────┤ (current: one active; history: previous goals)
   │   (user-controlled)     ▼
   │                  Skill-Gap Analysis (AI-generated; versioned)
   │                         │
   │                         ▼
   │                     Roadmap (AI-generated; versioned)
   │                         └── Roadmap Items
   │                              (AI-generated content + user-controlled status;
   │                               status-change history retained)
   │
   ├── CV / Profile Feedback Round
   │       (user-submitted document + AI-generated feedback; all rounds retained;
   │        evaluated against the active Goal, not derived from Analysis/Roadmap)
   │
   └── Derived signals: Readiness, Career Score, Career Health
           (read across all of the above; do not feed back into them)

Progress = the chronological view across Goal history, Analysis versions,
           Roadmap/Item history, and Feedback rounds — not a stored entity.
```

## 24.5 User-Controlled vs. AI-Generated

| Entity | Who controls it |
|---|---|
| Profile (fields) | User |
| Goal (statement, active/previous) | User |
| Skill-Gap Analysis (content) | AI |
| Roadmap (content, sequence) | AI |
| Roadmap Item status | User |
| CV/Profile document submitted | User |
| CV/Profile feedback content | AI |
| Readiness, Career Score, Career Health | System-derived — computed from other entities, not independently set by user or agent |

## 24.6 Historical vs. Current State
- **Current-state only:** Profile fields.
- **Current + history:** Goal, Skill-Gap Analysis, Roadmap, Roadmap Item status, CV/Profile Feedback — every version or round retained, not only the latest.

Detecting a material change requires knowing whether a specific profile field has changed since the last analysis that used it — a lightweight comparison, not full version history of every profile edit.

## 24.7 Single Source of Truth
For any fact about a user's career state, the graph holds exactly one current value — never two modules each holding a version that could disagree.

## 24.8 Module Read/Write Pattern
§16 specifies, module by module, what each reads from and writes to the graph. Every module, present and future, is a view onto this graph, never a private data store.

## 24.9 How the Graph Enables Personalization
Because the graph exists as a single, queryable representation of the individual, an agent doesn't personalize by inference from a persona — it reads the user's actual current Goal, Profile, and history.

## 24.10 How the Graph Enables Explainability
"Why was this skill flagged" points to the specific Profile fields and Goal the Analysis compared; "why did the roadmap change" points to the specific prior version and the material change that triggered regeneration.

## 24.11 How the Graph Enables Continuity
A returning user's Dashboard, Roadmap, and Progress all read the same graph state that existed when they left, not a fresh or degraded reconstruction of it.

## 24.12 Constraints the Graph Must Always Satisfy
- **Scope discipline.** The graph represents career substance only — Profile, Goal, Skill-Gap Analysis, Roadmap, CV/Profile Feedback, and their derived signals. Identity, billing/subscription state, and notification preferences are account-level data alongside the graph, not inside it.
- **User visibility.** Everything in the graph is visible to the user it describes, with no hidden fields.
- **User deletability.** Specific graph data can be deleted independent of the full account, without silently invalidating historical records generated from it before deletion.
- **Historical immutability.** Once created, a historical entry is not rewritten — only removed by explicit user-initiated deletion.
- **No competing current state.** Exactly one current value per fact; no module-private shadow copy.
- **Full traceability.** Every entity in the graph is populated or consumed by an already-approved Feature, Functional Requirement, or Business Rule.
- **Extensibility without redesign.** The model must accommodate Phase 1+ entities (learning progress, portfolio evidence, application history — §16) as additions to the same graph, not a reason to introduce a second one. Future role-specific profile types — a Company profile and a Service Provider profile (covering any professional, educational, or career-related service offered on CareerOS, including tutoring, training, or mentoring) — are new entities added under this same principle when their respective phase (§16) is reached; none requires redesigning the Phase 0 Profile entity.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
