# 15. Information Architecture

*Part III — Product Definition · CareerOS Product Requirements Document*

## Navigation Structure (MVP)

```
CareerOS (MVP)
├── Authentication            — sign up / log in
├── Onboarding                 — goal capture, initial profile
├── Dashboard                  — home base: career status snapshot + next action
├── AI Career Center           — the only functional module in MVP
│   ├── Profile & Goal         — target role/field, background (editable)
│   ├── Skill Gap Analysis     — current assessment vs. goal
│   ├── Roadmap                — ordered, trackable plan
│   ├── CV / Profile Feedback  — submit + review agent critique
│   └── Progress               — history of gap closure over time
├── Notifications              — agent- and system-generated updates
└── Settings
    ├── Account
    ├── Subscription / Billing
    ├── AI & Memory Controls   — what's remembered, user-controllable
    └── Notification Preferences
```

**Not present in MVP navigation:** Community, Jobs & Internships, Learning Hub, Portfolio, University/Company admin surfaces, Services Marketplace. Future modules are not shown as "coming soon" placeholders — navigation shows only what exists.

**Amendment:** Feature #14 (Value Recap & Renewal Touchpoint) has no dedicated navigation node. It surfaces contextually within **Dashboard** (progress recap) and **Settings → Subscription/Billing** (at the renewal/cancellation moment) — completing IA coverage for all Phase 0 features without adding a new top-level nav item.

## Structural decisions
- **Dashboard has one job:** show current career status and the single next action, not a grid of widgets.
- **Infrastructure vs. functional modules.** Authentication, User Profiles, Dashboard, Notifications, and Settings are infrastructure — present from Phase 0 regardless of which functional module is active. AI Career Center, Learning Hub, Portfolio, Jobs & Internships, and Community are functional modules, added by phase.
- **One model, many views.** Every module is a surface over the same Career Knowledge Graph.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
