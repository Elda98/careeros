# Section 14 — The AI Career Center as a Module

*Part III — Module Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 14.1 Purpose
This section applies §13's general template to the one module currently approved for build: the AI Career Center (Phase 0, §16). It demonstrates the vertical slice concretely, layer by layer, and draws the module's boundary precisely against its five Phase 0 siblings (Authentication, User Profiles, Dashboard, Notifications, Settings — all §16).

## 14.2 Identifying the AI Career Center as the Phase 0 Module
§16 names the AI Career Center's purpose (skill-gap analysis, roadmap, CV/profile feedback, progress) and its graph relationship (reads full profile, goal, history; writes gap assessments, roadmap state, progress). Applying §13.5's write-ownership test: the AI Career Center is the module that exclusively writes the Skill-Gap Analysis, Roadmap (item content), and CV/Profile Feedback Round entities (§24.3). Nothing else in the current graph is written by it.

## 14.3 Knowledge Layer Participation
**Owns (writes):** Skill-Gap Analysis, Roadmap and Roadmap Items (content, not status), CV/Profile Feedback Round — exactly the three entities §25.3's agent roster owns. **Reads as reference input:** Profile and Goal, both owned and written by the User Profiles module (§16), never by the AI Career Center. This is the concrete instance of §13.9's test: the AI Career Center reads Profile and Goal constantly (every Skill-Gap Analysis run compares against them, §25.4) but never writes either — read access without write-ownership is exactly what §11.2's Knowledge crossing already permits, and exactly why one shared graph, not per-module data, is required (§24.2).

## 14.4 Intelligence Layer Participation
The module's Intelligence occupants are exactly the three Phase 0 agents (§25.3): the Skill-Gap Analysis Agent, the Roadmap Agent, and the CV/Profile Feedback Agent — no more, no fewer. Each satisfies single-responsibility (§25.2) and exclusive write-ownership (§25.8) over one of the three entities in §14.3. No agent belonging to any other module reads or writes any of these three entities; no agent belonging to the AI Career Center reads or writes an entity outside them.

## 14.5 Interaction Layer Participation
Seven of the PRD's eight named workflows (§27) govern this module directly: First Skill-Gap Analysis, Roadmap Generation, Analysis Refresh, Roadmap Regeneration, Manual Refresh, CV/Profile Feedback, and Change Explanation. The eighth — Dashboard Next Action — is not owned by this module; §14.9 addresses it as a dependency crossing into the Dashboard module.

## 14.6 Presentation Layer Participation
Per the Screen Inventory (§22), the module's Presentation occupants are screens 7–11: Skill-Gap Analysis, Roadmap, CV/Profile Feedback — Submission, CV/Profile Feedback — Review Result, and Progress. Screen 6, Profile & Goal, is grouped under the same IA heading in §22 but is the User Profiles module's surface (§14.9) — IA grouping in the PRD is a navigation concern, not a module-boundary statement, and does not override the write-ownership test (§13.9).

## 14.7 Governance Constraining All Four Simultaneously
The AI Career Center is bound by exactly the Business Rules, RAI items, and NFRs that already name it: BR-GAP, BR-ROAD, BR-CV, BR-AI, BR-PROG (§21), and the full RAI set (§29) as it applies to any agent output. Per §7.14's general finding, a single rule constrains multiple layers of this one module at once — not in sequence. Explainability (§29 RAI-4) requires the Skill-Gap Analysis Agent to be capable of producing a reason (Intelligence), the Analysis Refresh workflow to make that reason reachable on request (Interaction), and the Skill-Gap Analysis screen to render it accessibly (Presentation) — one governance item, three simultaneous constraints on one module, exactly as §7.14 already demonstrates in the abstract.

```
                    ┌─────────────────────────────────────────┐
                    │              Governance Layer               │
                    │  (BR-GAP, BR-ROAD, BR-CV, BR-AI, BR-PROG,   │
                    │   RAI-1–16 — constrain every row below,     │
                    │   simultaneously, not in sequence)           │
                    │                                             │
  Student /         │  Presentation                                │
  Graduate  ───────▶│    Skill-Gap Analysis · Roadmap · CV         │
                    │    Feedback (Submit/Review) · Progress       │
                    │          ↓                                   │
                    │  Interaction                                 │
                    │    First Analysis · Analysis Refresh ·       │
                    │    Roadmap (Re)generation · Manual Refresh · │
                    │    CV Feedback · Change Explanation          │
                    │          ↓                                   │
                    │  Intelligence                                │
                    │    Skill-Gap Analysis Agent · Roadmap Agent ·│
                    │    CV/Profile Feedback Agent                 │
                    │          ↓                                   │
                    │  Knowledge                                   │
                    │    Skill-Gap Analysis · Roadmap · Roadmap    │
                    │    Items · CV/Profile Feedback Round          │
                    │    (writes)  ⋮  Profile, Goal (reads only)   │
                    └─────────────────────────────────────────┘
```

## 14.8 What Belongs Inside the AI Career Center Module
The three owned entities (§14.3), the three agents that write them (§14.4), the seven workflows that govern engagement with their output (§14.5), and the five screens that present them (§14.6). Nothing else.

## 14.9 What Belongs Outside the AI Career Center Module
- **Profile and Goal data and their editing surface** (Screen 6) — owned and written by the User Profiles module.
- **Identity, session, and login** — owned by the Authentication module; the AI Career Center reads identity only to anchor its own entities to the correct user, never to authenticate anyone itself.
- **The Dashboard surface and its next-action aggregation** — owned by the Dashboard module, which "has no agent of its own" and instead surfaces the Roadmap Agent's own item-level output (§25.5) — a read across the module boundary, not a write, and not a blurring of ownership.
- **Notification delivery and preferences** — owned by the Notifications and Settings modules; the AI Career Center's agent runs are event *sources* Notifications reads (§16), never something it writes into.
- **Account, billing, and AI/memory control settings** — owned by the Settings module.

## 14.10 Why the Boundary Is Drawn Here, Not Elsewhere
Every exclusion in §14.9 fails §13.9's test: none of Profile, Goal, identity, notification delivery, or account settings is written by any of the three Phase 0 AI Career Center agents. Drawing the boundary anywhere looser — for instance, treating Profile & Goal as inside the module because it shares an IA heading in §22 — would let the module's Presentation occupancy imply a Knowledge write-ownership it does not have, which is exactly the kind of boundary confusion §13.9 exists to prevent.

---
*Part of the SAS, Part III. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§7.14, 11.2, 11.4, 13; PRD §§16, 21, 22, 24.2–24.3, 25.2–25.8, 27, 29.*
