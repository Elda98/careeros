# 14. Product Pillars & Core Loops

*Part III — Product Definition · CareerOS Product Requirements Document*

## Product Pillars
1. **Career Knowledge Graph** — the persistent model of the user's skills, goals, and progress.
2. **Agent Ecosystem** — the specialized AI agents that read and act on that model.
3. **Guided Execution** — the surfaces that turn agent output into concrete user action.
4. **Trust & Explainability Layer** — guardrails, confidence exposure, and transparency, applied across the other three pillars.

## The MVP Core Loop
Per §0.4 Principle 11, every proposed MVP feature should be evaluated against which step of this loop it strengthens.

```
   1. User states or updates a goal
       (target role / field)
              │
              ▼
   2. Skill-gap analysis
       (current profile vs. goal)  ◄────────────┐
              │                                   │
              ▼                                   │
   3. Roadmap generated or updated                │
              │                                   │
              ▼                                   │
   4. User acts
       (learns, builds, submits CV/profile
        for feedback)                             │
              │                                   │
              ▼                                   │
   5. Progress captured →                         │
       Career Knowledge Graph updated  ───────────┘
```

Each pass through the loop should leave the Career Knowledge Graph more accurate than before, which is what makes step 2 sharper on the next pass — the compounding mechanism referenced in §1 and §6. Additional loops (a Learning loop, a Jobs-matching loop, a Community loop) will be defined when their respective modules are scoped.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
