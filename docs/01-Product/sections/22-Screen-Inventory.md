# 22. Screen Inventory

*Part III — Product Definition · CareerOS Product Requirements Document*

Every screen maps to a node in the locked Information Architecture (§15) and to at least one Phase-0 feature (§18). Shared MVP user for all screens: Final-Year Student / Fresh Graduate (§9) unless noted otherwise.

## Authentication
1. **Sign Up** — Create a new account (FR-AUTH-1). Entry: landing surface, Log In's create-account link. Exit: success → Onboarding; abandon → no account created. Related: Feature #1 · FR-AUTH-1, FR-AUTH-4.
2. **Log In** — Authenticate an existing identity (FR-AUTH-2). Exit: success → Dashboard; forgot credentials → Account Recovery. Related: Feature #1 · FR-AUTH-2.
3. **Account Recovery** — Recover access to an existing account (FR-AUTH-3). Related: Feature #1 · FR-AUTH-3.

## Onboarding
4. **Onboarding** — Captures active goal and minimum profile information (FR-ONBOARD-1, FR-PROF-2). Cannot be skipped (BR-GAP-2). Exit: completion → Dashboard, first analysis generating. Related: Feature #2 · FR-ONBOARD-1, FR-PROF-2 · BR-GAP-1, BR-GAP-2.

## Dashboard
5. **Dashboard** — Single, current snapshot of career status and next recommended action (FR-DASH-1–4). Default landing screen. Related: Feature #10, #14 · FR-DASH-1–4, FR-RENEW-1 · BR-SUB-3.

## AI Career Center
6. **Profile & Goal** — Edit profile fields and manage the active goal (FR-PROF-1–4). Related: Feature #3, #9 · FR-PROF-1–4 · BR-GOAL-1–3, BR-GAP-3.
7. **Skill-Gap Analysis** — Presents the current assessment against the active goal (FR-AICC-1–5). Related: Feature #4 · FR-AICC-1–6 · BR-GAP-1–5, BR-AI-3–5.
8. **Roadmap** — Presents the ordered plan and tracks progress (FR-AICC-7–12). Related: Feature #5, #6, #9 · FR-AICC-7–12 · BR-ROAD-1–7, BR-GAP-3–4.
9. **CV / Profile Feedback — Submission** — Submit a CV/profile document for review (FR-AICC-13). Related: Feature #7 · FR-AICC-13, FR-AICC-17 · BR-CV-1, BR-CV-4.
10. **CV / Profile Feedback — Review Result** — Present feedback for one review round, current or (via Progress) past (FR-AICC-14–16, FR-AICC-18). Related: Feature #7 · FR-AICC-14–16, FR-AICC-18 · BR-CV-2–4, BR-AI-4–5.
11. **Progress** — Chronological record of assessments, roadmap changes, CV feedback rounds, and goal history — the hub for "what changed and why." Related: Feature #8 · FR-AICC-6, FR-AICC-12, FR-AICC-18–20 · BR-PROG-1–4, BR-ROAD-3, BR-ROAD-6–7, BR-GOAL-4–5, BR-DATA-4.

## Notifications
12. **Notifications** — Presents agent- and system-generated updates (FR-NOTIF-1, 2, 4). Related: Feature #11 · FR-NOTIF-1–4 · BR-NOTIF-1–4.

## Settings
13. **Settings — Account** — Manage core account identity and permanent deletion (FR-AUTH-5). Related: Feature #1 · FR-AUTH-5 · BR-DATA-5.
14. **Settings — Subscription & Billing** — Manage subscription, view renewal recap, cancel (FR-SET-1, 4, FR-RENEW-1–2). Related: Feature #12, #14 · FR-SET-1, FR-SET-4, FR-RENEW-1–2 · BR-SUB-1–5.
15. **Settings — AI & Memory Controls** — View stored data and delete specific stored data (FR-SET-2/3). Related: Feature #13 · FR-SET-2, FR-SET-3 · BR-DATA-2–4, BR-DATA-6.
16. **Settings — Notification Preferences** — Control notification frequency and category (FR-NOTIF-3). Related: Feature #11 · FR-NOTIF-3 · BR-NOTIF-3–4.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
