# 18. Feature Inventory

*Part III — Product Definition · CareerOS Product Requirements Document*

*Phase 1–4 rows are provisional pending each module's own Core Loop definition.*

| # | Feature | Module | Phase | Priority | Depends On | Rationale |
|---|---|---|---|---|---|---|
| 1 | Account creation & authentication | Authentication | 0 | Foundational | — | Infrastructure prerequisite |
| 2 | Onboarding goal capture | Onboarding | 0 | Foundational | — | Core Loop step 1 |
| 3 | Profile builder | User Profiles | 0 | Foundational | — | Core Loop step 1 |
| 4 | Skill-gap analysis | AI Career Center | 0 | Foundational | #3 | Core Loop step 2; Must-JTBD |
| 5 | Roadmap generation | AI Career Center | 0 | Foundational | #4 | Core Loop step 3; Must-JTBD |
| 6 | Roadmap step tracking | AI Career Center | 0 | Foundational | #5 | Core Loop step 4 |
| 7 | CV / profile feedback | AI Career Center | 0 | Foundational | #3 | Core Loop step 4; Must-JTBD |
| 8 | Progress history / timeline | AI Career Center | 0 | Supporting | #6 | Core Loop step 5; Should-JTBD |
| 9 | Roadmap re-generation on goal change | AI Career Center | 0 | Enhancing | #5 | Should-JTBD, not Must |
| 10 | Dashboard status snapshot | Dashboard | 0 | Supporting | #4, #5 | Core Loop visibility |
| 11 | Notifications | Notifications | 0 | Supporting | #5, #7 | Re-engagement |
| 12 | Account, billing & subscription mgmt | Settings | 0 | Foundational | #1 | Required for B2C model |
| 13 | AI & memory controls | Settings | 0 | Supporting | #3 | Trust; not the full Memory Layer |
| 14 | Value Recap & Renewal Touchpoint | AI Career Center / Dashboard | 0 | Supporting | #8, #12 | Closes the Subscription Decision moment (§11) |
| 15 | Learning resource recommendations | Learning Hub | 1 | — | #4 | Module phase; provisional |
| 16 | Learning completion tracking | Learning Hub | 1 | — | #15 | Module phase; provisional |
| 17 | Portfolio project curation | Portfolio | 1 | — | #5 | Module phase; provisional |
| 18 | Portfolio-to-skill evidence linking | Portfolio | 1 | — | #17 | Module phase; provisional |
| 19 | Job/internship listing aggregation | Jobs & Internships | 2 | — | — | Data-partnership dependency |
| 20 | Opportunity Score ranking | Jobs & Internships | 2 | — | #19 | Depends on listings |
| 21 | Application tracking | Jobs & Internships | 2 | — | #19 | Module phase |
| 22 | Application-outcome feedback loop | Jobs & Internships | 2 | — | #19–21 | Depends on above |
| 23 | Peer matching by goal/field | Community | 3 | — | — | Critical-mass dependency |
| 24 | Community discussion spaces | Community | 3 | — | — | Module phase |
| 25 | Peer feedback exchange | Community | 3 | — | #23 | Depends on matching |
| 26 | University admin dashboard | University/Company Admin | 4 | — | — | B2B motion |
| 27 | Company recruiter portal | University/Company Admin | 4 | — | — | B2B motion |
| 28 | Institutional licensing / seat mgmt | University/Company Admin | 4 | — | #26, #27 | Depends on above |
| 29 | Native mobile apps | Cross-cutting | Unscheduled | — | — | Platform Surface open question |
| 30 | Multi-language support | Cross-cutting | Unscheduled | — | — | Language Strategy open question |
| 31 | Gamification / leaderboards | Cross-cutting | Unscheduled | — | — | Fails Measurable Value check |
| 32 | Browser extension | Cross-cutting | Unscheduled | — | — | Fails Measurable Value check |
| 33 | Transferable-skill modeling | AI Career Center | Unscheduled | — | — | Career Changers not in scope |
| 34 | Advancement-specific roadmap type | AI Career Center | Unscheduled | — | — | Professionals not in scope |
| 35 | Company profile creation | Jobs & Internships | 2 | — | — | Supply-side complement to #19–21 |
| 36 | Job/internship posting & management | Jobs & Internships | 2 | — | — | Supply-side complement to #19–21 |
| 37 | Applicant review | Jobs & Internships | 2 | — | #36 | Depends on #36 |
| 38 | Talent search | Jobs & Internships | 2 | — | #35 | Depends on #35 |
| 39 | Service Provider profile creation | Services Marketplace | Unscheduled | — | — | Module phase; generalizes what would have been a Trainer-specific profile feature to any Service Provider |
| 40 | Service listing publication | Services Marketplace | Unscheduled | — | #39 | Depends on #39 |
| 41 | Service browsing & request | Services Marketplace | Unscheduled | — | #40 | Depends on #40 |
| 42 | Service review | Services Marketplace | Unscheduled | — | #41 | Depends on #41 |

This inventory is expected to grow. New features get added and tagged using the §17 framework as they're proposed.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
