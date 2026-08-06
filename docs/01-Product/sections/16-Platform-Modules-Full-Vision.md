# 16. Platform Modules — Full Vision

*Part III — Product Definition · CareerOS Product Requirements Document*

| Module | Purpose | Phase | Reads from Career Graph | Writes to Career Graph |
|---|---|---|---|---|
| Authentication | Account creation, login, session/identity. Identity/session model is role-agnostic by design — already compatible with future account types without requiring modification. | 0 | Identity linkage only | Identity linkage only |
| User Profiles | Surface layer for profile data (background, target goal) | 0 | Core profile fields | Core profile fields |
| Dashboard | Home surface: status snapshot + next action. Future roles receive a role-appropriate entry surface using the same Dashboard module concept, specified when their phase is reached. | 0 | Aggregated signals (Career Score, active roadmap step) | None |
| AI Career Center | Skill-gap analysis, roadmap, CV/profile feedback, progress | 0 | Full profile, goal, history | Full — gap assessments, roadmap state, progress |
| Notifications | Agent- and system-triggered updates | 0 | Event triggers | None |
| Settings | Account, billing, AI/memory controls, preferences | 0 | User preferences | User preferences (not career substance) |
| Learning Hub | Recommends resources tied to skill gap; tracks completion | 1 | Skill gap | Completed skills, learning progress |
| Portfolio | Curates projects/work as evidence of claimed skills | 1 | Skills, roadmap-derived projects | Validated experience/skill evidence |
| Jobs & Internships | Surfaces opportunities ranked by Opportunity Score; tracks applications; company accounts create listings and review applicants | 2 | Profile, goal, skills | Application history and outcomes; company-submitted job/internship listings and applicant review status |
| Professional Community | Peer connection around shared goals/field | 3 | Goal/field, for relevant grouping | Minimal — community activity, not core career state |
| University / Company Admin | Institutional views and management (B2B surface). Remains the institutional licensing/aggregate-recruiting layer, distinct from Phase 2's self-serve Company capability above. | 4 | Aggregate, permissioned data only | Institution-specific data (seats, licenses) |
| Services Marketplace | Enables students, graduates, and service providers to publish, browse, request, and review professional, educational, or career-related services (e.g., tutoring, training, mentoring, programming, design, translation, CV writing, portfolio building, career consulting, academic assistance within platform policy) | Unscheduled | Profile, skills (for relevant matching) | Service listings, requests, reviews |

Every future module reads from and, where relevant, writes back to the same graph the AI Career Center already populates.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
