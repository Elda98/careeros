# CareerOS — Product Requirements Document (PRD)

**Status:** Living document — Complete (§0–§59), Approved

---

## Document Metadata

| Field | Value |
|---|---|
| Project Name | CareerOS |
| Document | Product Blueprint |
| Version | 1.0 |
| Status | Living — complete, §0–§59 approved |
| Owners | CareerOS Founding Team (Product) — specific owner names to be assigned as the team forms |
| Intended Audience | Founding product, design, AI, and engineering team; future hires onboarding onto the project; select stakeholders requiring an accurate (non-marketing) account of the product |

This block should be updated at every meaningful revision — version incremented, status changed, and the date refreshed — so anyone opening the document can immediately tell how current and how authoritative what they're reading is.

---

# Part 0 — Foundations

## 0.1 Purpose of This Blueprint

This document is the single source of truth for what CareerOS is, who it is for, and why it exists — established before any database, API, agent, or interface is designed. Every architectural, design, and engineering decision made from this point forward should be traceable back to a statement in this document. Where a future decision requires something this document doesn't yet answer, the answer is added here first, via the Decision Framework (§53) and logged in the Open Questions & Decision Log (§55) — not decided ad hoc inside a pull request or a design file.

**What this document is:**

- The definitive statement of product scope, user needs, business model, AI product behavior, experience direction, and success criteria.
- The reference every subsequent artifact — technical architecture, database design, API contracts, agent specifications, design systems, UI screens — is expected to be consistent with.
- A living document. It will be revised as we learn, but revisions are deliberate and recorded, not silent drift.

**What this document is explicitly not:**

| Not this document | Where it belongs instead |
|---|---|
| Technical architecture (system design, service boundaries, infra) | A separate Architecture Decision Record set, written after this blueprint is stable |
| Database schema or data modeling | Database design docs, informed by the Career Knowledge Graph concept in §24 |
| API contracts | Engineering specs, informed by Functional Requirements (§19) |
| Agent implementation (prompts, graphs, orchestration logic) | AI engineering docs, informed by the Agent Ecosystem (§25) and AI Workflows (§27) |
| UI specifications or visual design | Design files, informed by Screen Inventory (§22) and Part V |
| Sprint plans or backlogs | Project management tooling, informed by the Phased Roadmap (§51) |

This separation is intentional. Product thinking that gets skipped by jumping straight to implementation is the single most common cause of expensive rework in early-stage products — and conversely, a blueprint that starts prescribing technical detail stops being a product document and becomes a bad architecture document. This blueprint stays at the altitude of *what and why*; everything downstream owns *how*.

**Authority model.** If a future technical, design, or AI decision appears to conflict with something stated here, that is a signal to stop and reconcile it in this document first — not to quietly override the blueprint in code or in Figma. Section 53 (Decision Framework) defines how such conflicts get evaluated; Section 55 is where the resolution gets recorded permanently.

**Audience.** Primarily the founding product, design, AI, and engineering team, and every person who joins the team afterward and needs to get to full context without a verbal handoff. Secondarily, anyone evaluating the product from the outside (investors, early partners) who needs an accurate, non-marketing account of what's being built and why.

## 0.2 Project Vision Summary

CareerOS is an AI-native career operating system: a single platform where a person's professional identity, goals, skills, learning, and opportunities live in one continuously updated model, and where a coordinated set of AI agents actively works that model on the user's behalf — identifying gaps, adjusting plans, improving materials, and surfacing relevant opportunities — rather than waiting to be prompted.

The underlying thesis: career growth today is fragmented across tools that don't talk to each other (a network on LinkedIn, courses on Coursera, a resume in a Google Doc, job search in a dozen tabs, advice from a chatbot with no memory of any of it), which forces the *person* to be the integration layer. CareerOS's bet is that if one system holds the full picture — persistently, and improves it continuously — it can do meaningfully more for a person's career than the sum of those disconnected tools, and that this compounding advantage is what will justify someone paying for and staying on the platform.

This vision is intentionally large. Section 7 (Product Strategy & Sequencing Philosophy) and Section 13 (Product Scope) exist specifically to constrain it into something buildable — starting with a single, provable core loop for one user segment, before any of the platform's later breadth is earned. The full statement of this vision, including its five-year aspiration and the market reasoning behind it, is developed in Part I §1.

**Vision Statement**
Every professional manages their career through one intelligent system that knows them, works for them continuously, and gets better the longer they use it — not through a dozen disconnected tools that start over from zero every time.

**Mission Statement**
CareerOS's mission is to give every student, job seeker, and professional a persistent, AI-driven system for managing their career — one that continuously analyzes where they stand, identifies what stands between them and their next goal, and takes concrete action to close that gap, from improving their materials to guiding their learning to surfacing the right opportunities. We start by proving this for the group career tools currently serve worst — students and fresh graduates entering a job market with more competition and less individual guidance than any generation before them — before extending the same system to every later stage of a professional's working life.

**One-line Product Description**
CareerOS is the AI-native operating system for managing and growing a professional career.

**Elevator Pitch (30-second version)**
Most people manage their career across a dozen disconnected tools — LinkedIn for networking, Coursera for learning, a resume in a Google Doc, job search spread across a dozen browser tabs, and a chatbot with no memory of any of it. CareerOS replaces all of that with one system: an AI-native career operating system that knows a user's goals and skills, continuously identifies what's holding them back, and actively works on their behalf — building their roadmap, improving their materials, and surfacing the right opportunities. We're starting with students and fresh graduates, the group today's tools serve worst, and building the system to grow with them for their entire career.

## 0.3 Glossary & Terminology

Terms used with a specific, consistent meaning throughout this document. Where a term has a colloquial meaning in the industry that differs from how we use it here, the CareerOS-specific meaning governs for the purposes of this blueprint.

| Term | Definition |
|---|---|
| **CareerOS** | The product as a whole: the platform, its modules, and its AI agent ecosystem, operating over a single user career model. |
| **Career Operating System** | The product category we are defining ourselves into — a persistent, continuously-updated system a person's career activity runs *through*, as distinct from a tool they visit for a single task. |
| **Career Knowledge Graph** | The conceptual model of everything CareerOS knows about a user's professional life — skills, goals, experience, progress, preferences — and the relationships between those things. The substrate every module and agent reads from and writes to. Defined at the product level in §24; not a database schema. |
| **Core Loop** | A self-reinforcing sequence of user and system actions that delivers value and produces data that improves the next iteration of that same loop. CareerOS's MVP is deliberately scoped around proving one core loop before adding more. |
| **Module** | A distinct functional area of the platform (e.g., AI Career Center, Learning Hub, Jobs & Internships). Modules are surfaces on top of the shared Career Knowledge Graph, not independent products. |
| **Agent** | A specialized, purpose-bound AI worker responsible for one category of task (e.g., analyzing a skill gap, critiquing a CV). Agents are defined by their responsibility and boundaries at the product level in §25; not by their technical implementation. |
| **Agent Ecosystem** | The full set of agents and how they collaborate, hand off work, and share context. |
| **Multi-Agent Collaboration** | Multiple agents contributing to a single outcome for the user, each within its own responsibility, coordinated rather than acting as one undifferentiated model. |
| **Plan-and-Execute** | An agent pattern where the system first produces a plan (a sequence of intended steps) before carrying it out, so the reasoning is visible and interruptible rather than opaque. |
| **Reflection / Self-Critique** | An agent evaluating and revising its own output before presenting it to the user, used where a first-pass answer carries meaningful risk of being wrong or low-quality. |
| **Short-Term Memory** | Context an agent holds for the duration of a single session or task. |
| **Long-Term Memory** | Context persisted across sessions that informs future interactions — the mechanism by which CareerOS's advantage compounds over time. Governed by the Personalization & Memory Strategy (§30), including explicit user control over what is remembered. |
| **RAG (Retrieval-Augmented Generation)** | An agent grounding its output in retrieved, specific information (e.g., a user's actual profile, a real job description) rather than relying on general knowledge alone. Used here strictly as a product concept: where and why grounding matters, not the retrieval mechanism. |
| **Guardrail** | A defined limit on what an agent is allowed to decide, say, or act on autonomously, and the point at which it must express uncertainty or defer to the user. See §29. |
| **Explainability** | The standard that a user (or team member) can understand *why* the system produced a given recommendation, not just what it recommended. |
| **Skill Gap** | The delta between the skills a user's target role or goal requires and the skills the Career Knowledge Graph currently reflects them as having. |
| **Career Roadmap** | A personalized, ordered plan of actions (learning, projects, applications) generated to close a user's skill gap and move them toward a stated goal. |
| **Career Milestone** | A discrete, recognizable point of progress in a user's roadmap (e.g., a skill validated, a project completed) — a candidate building block for the platform's north star metric (§48). |
| **Persona** | A defined archetype of a target user, grounded in real needs rather than demographics alone. Defined in §9. |
| **ICP (Ideal Customer Profile)** | The specific segment we are prioritizing acquisition and product effort against at a given phase — narrower than "target users" as a whole. |
| **Wedge** | The initial, narrow use case a platform business uses to earn its first users and prove value, before expanding to its full vision. For CareerOS, the wedge is defined in §13 (Product Scope). |
| **Tenant** | An organizational account (a university or a company) with its own users, branding, or permissions scoped within the shared platform — relevant once B2B modules are in scope, not in the MVP. |
| **Feature Phase Tag** | The classification applied to every feature in the Feature Inventory (§18): **MVP**, **Phase 2**, or **Future** — indicating when it is in scope, not its importance. |
| **North Star Metric** | The single metric the team optimizes above all others, chosen because it best represents genuine user value delivered, not just engagement. Defined in §48. |
| **Observability** | The team's ability to see, measure, and diagnose what the AI system is actually doing in production — a requirement stated here at the product level; its technical implementation is out of scope for this document. |
| **AI Career Center** | The platform module where a user directly engages with CareerOS's AI agents — skill-gap analysis, roadmap generation, CV and profile feedback. The first and only module in scope for MVP (§13). |
| **Career Score** | A composite, at-a-glance indicator of a user's overall career strength and momentum. Its exact composition is a decision made when the Career Knowledge Graph (§24) and dashboard experience are designed. |
| **Readiness Score** | How prepared a user currently is for one particular target role or goal, derived from the gap between current skills/experience and that goal's requirements. |
| **Opportunity Score** | A relevance ranking applied to a specific external opportunity, expressing how well it matches a given user's profile and goals. |
| **Career Health** | A qualitative, directional signal (e.g., improving, stagnant, at risk) describing the trajectory of a user's career progress over time. |
| **Career Graph** | Informal shorthand for the Career Knowledge Graph. |
| **Career Journey** | The full, ongoing arc of a user's professional life as represented and supported within CareerOS — spanning multiple goals, roles, and life stages. |
| **AI Workflow** | A defined, named sequence of agent activity that fulfills one specific user need end-to-end, documented at the product level in §27 without describing its technical implementation. |
| **Tool Calling** | An agent's ability to invoke a specific external capability as part of fulfilling a task, rather than relying solely on generated text. |
| **MCP (Model Context Protocol)** | A standard for connecting AI agents to external tools and data sources in a consistent way. Referenced only as a capability; its technical integration is out of scope here. |
| **Memory Layer** | The part of the system responsible for storing and retrieving Short-Term and Long-Term Memory so agents can act with continuity. |
| **Personalization Engine** | The overall product capability — spanning the Career Knowledge Graph, Memory Layer, and Agent Ecosystem — responsible for making every user's experience reflect their specific goals, history, and preferences. |

## 0.4 Design & Engineering Principles

This section defines the principles that govern **how the CareerOS team works and builds** — the process discipline and quality bar applied to every decision, regardless of discipline. It is distinct from Product Principles (§3), which define what CareerOS itself stands for as a product in the market.

**1. Think before building, at every altitude.**
The sequence — analyze, identify problems, weigh trade-offs, recommend, confirm, then build — applies not only to this blueprint but to every subsequent architecture, design, and AI decision.

**2. Earn complexity; don't front-load it.**
CareerOS's full vision includes multi-agent orchestration, long-term memory, RAG, and a multi-sided marketplace. None of that is built because the vision calls for it eventually — each piece is built when the simpler version it replaces has already been validated and has become the actual constraint.

**3. Every module is a surface on one model, not a silo.**
Community, Jobs, Learning, Portfolio, and the AI Career Center all read from and contribute to the same Career Knowledge Graph.

**4. Premium means considered, not decorated.**
The products referenced as inspiration — Linear, Notion, Stripe, Raycast, Framer, Arc — earn their premium feel through restraint, clear hierarchy, and every element having a reason to exist, not through visual flourish.

**5. Security, accessibility, and reliability are defaults, not phases.**
Given this is a funded effort building for real scale, these are not hardening work saved for later — they are properties every feature is designed with from its first version.

**6. Every AI behavior must be explainable to a human on the team.**
If no one on the team can articulate why an agent produced a given output, that agent is not ready for users, regardless of how good its output looks in a demo.

**7. Simplicity is a decision, not a shortcut.**
Three similar implementations are preferable to one premature abstraction; a direct solution is preferable to a flexible one built for hypothetical future needs.

**8. Every decision is traceable.**
Significant product, design, AI, or technical decisions are recorded with their reasoning at the time they're made (§55), not reconstructed from memory later.

**9. User trust over AI magic.**
When a flashy AI output and a trustworthy one conflict, trust wins. Impressive-but-unreliable is a worse outcome than modest-but-dependable, every time.

**10. AI augments the user's decision-making; it doesn't replace it.**
Every AI-driven feature should leave the user better informed and better equipped to decide, not on rails toward an answer they never got to weigh in on.

**11. Every feature must strengthen at least one Core Loop.**
A feature that doesn't feed into or draw from a defined Core Loop is a feature without a clear reason to exist in CareerOS's model.

**12. No feature ships without a measurable definition of the user value it creates.**
If we can't state, before building a feature, what user outcome it should move and how we'd know it worked, it isn't ready to build.

**13. Every screen has exactly one primary objective.**
A screen that asks a user to focus on several equally-weighted things has quietly deferred a product decision onto the user.

**14. Design for delight; optimize for clarity.**
Delight is the outcome of a user effortlessly getting what they came for — not a layer of polish added on top of a confusing flow.

**15. AI outputs expose their confidence whenever uncertainty is meaningful.**
Where an agent's output carries real risk of being wrong, the user should be able to tell how confident the system is, not just receive a confident-sounding sentence.

## 0.5 How to Read This Blueprint

This document is long by design — the complete product reference, not a quick brief. Everyone should read **Part 0 (Foundations)** and **Part I (Vision & Strategy)** in full regardless of role. Beyond that, read in the order below for your role.

| Role | Read first, in order | Why |
|---|---|---|
| **Founder / Leadership** | Part 0 → Part I → §13 Product Scope → Part VI (Business Model) → Part IX (Roadmap & Execution) | These sections carry the decisions with the highest cost to get wrong or reverse later. |
| **Product Manager** | Part 0 → Part I → Part II (Users & Needs) → Part III (Product Definition) in full → Part VIII (Measurement) | Part III is where the product is specified in detail. |
| **Designer (UX/UI)** | Part 0 → Part I → Part II (Personas, §9–§11) → §15 IA → §22 Screen Inventory → Part V in full → §28 Human-AI Interaction Model | Design work needs user context before the screen list. |
| **AI Engineer** | Part 0 → Part I → Part IV in full (§23–§30) → §19 Functional Requirements → §27 AI Workflows → §58 AI Prompt Library | Part IV is the product-level spec for agent behavior. |
| **Backend Engineer** | Part 0 → Part I → §19 Functional Requirements → §21 Business Rules → §24 Career Knowledge Graph (conceptual) → Part VII (Requirements & Constraints) | These define behavior and data relationships a technical model must support. |

A general rule for every role: if a downstream document is about to make a decision that isn't clearly answered here, come back and add the answer to this blueprint first — via the Decision Framework (§53) — rather than deciding it locally.

---

# Part I — Vision & Strategy

## 1. Vision Statement

> *Every professional manages their career through one intelligent system that knows them, works for them continuously, and gets better the longer they use it — not through a dozen disconnected tools that start over from zero every time.*

**The category we're defining.** CareerOS is not competing to be a better professional network, a better job board, or a better learning platform. Those are all *point solutions* — each optimized for one moment in a career. We are defining a different category: the **Career Operating System** — a persistent layer a person's entire professional life runs through, the way an operating system underlies every application on a device rather than being one of the applications. No incumbent occupies this category today, because until recently, nothing made it *possible* to occupy — which is the second half of why this vision is timely rather than merely appealing.

**Why AI agents are the enabling condition, not a feature.** Every previous generation of "career tech" — recommendation engines, static content libraries, rule-based matching, single-turn chatbots — could either personalize *or* act, never both, and never with continuity. A recommendation engine can rank options but can't reason about *why* they fit or produce a plan. A chatbot can reason in a conversation but forgets everything the moment it ends, and can't take multi-step action on the user's behalf. What changed, concretely, is that AI systems capable of holding context over time, reasoning across multiple steps, critiquing their own output, and calling external tools to act — not just talk — became practically buildable as a product, not just viable as a research demo. That capability is the specific, non-hand-wavy reason a persistent, active "system that works for you" is now possible in a way it genuinely was not five years ago. This is the technological inflection CareerOS is built on.

**Why this matters more now than it did a decade ago.** Independent of the technology, the underlying problem has gotten worse, not stayed flat: the pace at which skills become obsolete has shortened, entry-level job markets have gotten more competitive and more global, and the guidance infrastructure meant to help people navigate this — university career services, generic content, one-off coaching — has not scaled to match either the volume of people who need it or the frequency at which their situation now changes. The need for continuous, personalized career guidance has grown; the technology to deliver it continuously has only just become available. CareerOS sits directly at that intersection.

**The five-year aspiration.** If this works, CareerOS becomes the default place a person's career "lives" — the system that knows their trajectory better than any single tool they've used before, that they return to not because they have to, but because leaving would mean losing a model of themselves nothing else has. That is a high bar, and Section 7 exists precisely because we do not get there by building toward it directly — we get there by proving the narrowest possible version of "actually knows and works on it" first, extraordinarily well, before building anything wider.

## 2. Mission Statement

> *CareerOS's mission is to give every student, job seeker, and professional a persistent, AI-driven system for managing their career — one that continuously analyzes where they stand, identifies what stands between them and their next goal, and takes concrete action to close that gap, from improving their materials to guiding their learning to surfacing the right opportunities. We start by proving this for the group career tools currently serve worst — students and fresh graduates entering a job market with more competition and less individual guidance than any generation before them — before extending the same system to every later stage of a professional's working life.*

**Why students and fresh graduates, specifically.** This is a strategic choice, not a sentimental one:

- **They are the most underserved.** Working professionals have imperfect but real alternatives — a manager, a mentor, industry peers, an established network. A student or fresh graduate typically has none of that yet, and university career services are structurally unable to give most students sustained, individualized attention.
- **They have the longest possible relationship with the product.** A career system adopted at the start of someone's professional life has decades ahead of it to grow alongside, compounding in value.
- **They are the least defended segment for incumbents.** A student entering the job market is *forming* habits right now, not defending existing ones — the competitive question isn't "can we get someone to switch" but "can we be the first system they build the habit around."

## 3. Product Principles

These are distinct from the Design & Engineering Principles in §0.4, which govern *how the team works*. These govern *what CareerOS itself stands for* as a product.

**A system, not a session.**
CareerOS's value is continuity — what it knows and does across weeks and months — not any single interaction. This is the product-level expression of why CareerOS is not a chatbot.

**Executes, not just answers.**
Where a generic AI assistant produces an answer and stops, CareerOS's agents produce artifacts and next steps a user can act on directly, and track whether that action happened.

**One person, one model.**
Everything a user does anywhere in CareerOS updates the same underlying picture of them, and every module draws from that same picture.

**Guidance, not gatekeeping.**
CareerOS exists to expand what a user can see and do, not to score, rank, or gate them the way some hiring and HR technology does.

**Earns trust before it earns reliance.**
CareerOS is built for a user to rely on it *because* it has been reliable, not because its output is persuasive.

**Compounds around the person, not just the platform.**
CareerOS should get better at serving *this specific user* the longer they stay — not just accumulate more features for all users.

## 4. Problem Statement

**The problem is not that good career tools don't exist. It's that no tool holds the whole person.**

A student or job seeker today assembles their own career-management stack out of tools that are each excellent at what they were built for, and structurally unable to do what CareerOS is attempting:

| Category | Representative players | What they optimize for | Why that leaves a gap |
|---|---|---|---|
| Professional networks | LinkedIn | Engagement, content consumption, recruiter subscription revenue | A profile is a static snapshot, not a continuously maintained model; guidance is generic feed content |
| Job marketplaces | Indeed, Handshake, LinkedIn Jobs | Volume and liquidity of matches between employer demand and candidate supply | Treats the user as a search query at the moment of applying, not a person with a trajectory |
| Learning platforms | Coursera, Udemy, LinkedIn Learning | Content completion and certification sales | Recommends courses based on browsing behavior or popularity, not a rigorously identified gap tied to a specific goal |
| University career services | In-house career centers | Serving an entire student population with fixed staff | Cannot scale to sustained, individualized attention for most students by structural design |
| General AI chat assistants | ChatGPT and similar, used ad hoc | A good single-turn answer to whatever is asked | No persistent memory across sessions, no structured model of skills or goals, no multi-step action |

Every one of these products succeeds enormously at what it is built to optimize. "Help this specific person advance their career, continuously" has never been any of their core objective functions. **CareerOS's reason to exist is to become that missing integration layer, natively, rather than asking the user to keep being it.**

## 5. Market Landscape & Competitive Positioning

**Positioning by two axes: how much of the career lifecycle a product covers, and how deeply and continuously it personalizes to one person.**

```
                          HIGH PERSONALIZATION / CONTINUITY
                                         │
   Emerging AI career copilots          │        CareerOS
   (AI resume/interview tools)          │   (target end-state:
   — narrow, but genuinely deep —       │    broad AND deep)
                                         │
        CareerOS MVP starts here ──►    │
                                         │
  NARROW ───────────────────────────────┼─────────────────────── FULL
  LIFECYCLE                             │                     LIFECYCLE
  BREADTH                               │                     BREADTH
                                         │
   Job marketplaces (Indeed, Handshake) │           LinkedIn
   Learning platforms (Coursera, Udemy) │   (broad coverage, but
   — narrow, low continuity —           │    engagement-optimized,
                                         │    shallow personalization)
                          LOW PERSONALIZATION / CONTINUITY
```

**Reading the map objectively:**

- **LinkedIn** occupies the broadest footprint — network, jobs, learning, content — a genuinely formidable position from network effect alone. Its personalization is real but shallow relative to what CareerOS aims for. LinkedIn is already shipping AI-assisted features and will continue to.
- **Indeed and Handshake** are exceptionally strong at matching supply and demand at scale. Their product logic is built around the moment of application, not the months before or after it.
- **Coursera, Udemy, and similar learning platforms** have deep content catalogs and real partnerships. Their recommendation systems optimize for content engagement, not a specific, externally-validated skill gap tied to a job outcome.
- **Emerging AI career-copilot startups** are the most direct competitive analogue to CareerOS's *approach* — AI-native, personalization-focused, but almost all point solutions, deep on one task with no persistent model connecting it to the rest of a user's career.

**The honest version of "why won't LinkedIn just build this."** They might attempt to. The more defensible argument is not that they *can't*, but that it is a harder execution problem for them: LinkedIn's business model depends on engagement, ad revenue, and recruiter subscriptions at massive scale — retrofitting deep, continuous, individually-compounding personalization onto that architecture is a materially different undertaking than building it natively. This is a real advantage, but time-limited, not permanent — which is why urgency and depth matter, not assumed permanence.

## 6. Strategic Differentiation

Four things make CareerOS's position defensible, in decreasing order of durability:

**1. A persistent Career Knowledge Graph as a compounding data asset.**
Every session makes the model of the user more accurate, which makes every subsequent output better, which increases the cost of switching. Competitors built around single-session interactions structurally cannot replicate this.

**2. A multi-agent system built specifically for career reasoning, not a general assistant pointed at career questions.**
CareerOS's agents are narrow, specialized, and accountable to a shared model of the user — a meaningfully different (and better, for this domain) architecture than a general assistant.

**3. Trust-first design as a market position, not just an internal principle.**
Given how high the stakes of career decisions are, a product that is transparent about its confidence, explains its reasoning, and is explicit about where the user should apply their own judgment is a genuine differentiator.

**4. Full lifecycle coverage — the long-term moat, not the current one.**
Once Learning, Portfolio, Jobs, and Community exist on top of the same Career Knowledge Graph, they reinforce each other in a way no point solution can match by definition. This is explicitly a *future* advantage, not a current one — the MVP's differentiation rests entirely on points 1–3.

## 7. Product Strategy & Sequencing Philosophy

**The decision: CareerOS launches with the AI Career Center only — nothing else — for students and fresh graduates, on a B2C subscription model.** Community, Jobs & Internships, Universities, and Company/Marketplace features are deliberately excluded from this phase.

**Why AI Career Center first is the fastest path to proving the actual thesis.** The AI Career Center — profile → skill-gap analysis → roadmap → CV/profile feedback — is the smallest complete slice of the product that tests the core bet end to end, without requiring anything CareerOS doesn't yet control. It needs no critical mass of other users, no employer participation, and no institutional sales cycle.

**Why this is also the right decision given a funded team building for scale — not despite it.** Building Jobs, Community, and B2B infrastructure before the core AI loop is proven risks a wide, shallow product where every module is mediocre because none had focused attention. Capital efficiency here means sequencing depth before breadth, not spending less.

**Why Community is deliberately delayed.** Community value depends on a critical mass of engaged users being present when a new user arrives. Launching before that critical mass exists produces an empty room, which actively damages trust rather than merely underwhelming.

**Why Jobs & Internships is deliberately delayed.** This module requires solving a two-sided marketplace cold start *and* a data-sourcing problem that is fundamentally a business-development timeline, not an engineering one. Shipping a thin jobs board would violate the trust-first differentiation more severely than not having the module at all.

**Why Universities and Companies (B2B) are deliberately delayed.** These are a different buyer, sales motion, and sales cycle than the B2C subscription this phase is built around. A proven, retained student user base is the strongest asset when eventually pitching a university on a licensing relationship, or a company on recruiting access.

**The strategic sequencing, stated plainly (full roadmap detail lives in §51):**

1. **Phase 0 — Prove the core loop.** AI Career Center only. Students and fresh graduates only. B2C subscription only.
2. **Phase 1 — Deepen and reinforce.** Expand AI Career Center depth; add Learning Hub and Portfolio only insofar as they strengthen the same core loop, once Phase 0 shows real retention.
3. **Phase 2 — Open the marketplace.** Jobs & Internships, once a credible data/partnership strategy exists.
4. **Phase 3 — Enable network effects.** Community, once there's a base worth connecting.
5. **Phase 4 — Expand to institutional buyers.** Universities and Companies, backed by proof points Phases 0–3 created.

This is a sequencing philosophy, not a fixed calendar — the trigger to move from one phase to the next is evidence (retention, engagement, validated demand), not elapsed time.

### Strategic Position in One Page

**What CareerOS is.** An AI-native Career Operating System — a persistent, continuously-updated model of a person's professional life, worked on by specialized AI agents that plan, act, and improve it over time, rather than a chatbot, job board, or course catalog bolted onto one.

**Why now.** Two curves crossed: AI systems capable of continuous memory, multi-step reasoning, and real tool use just became practically buildable, at the same moment career guidance infrastructure has visibly failed to keep pace with a faster-moving, more competitive job market.

**Why current solutions fail.** LinkedIn, Indeed, Handshake, Coursera, and general AI chat assistants each optimize for a real but different objective — engagement, marketplace liquidity, content consumption, a good single answer — none of which is "manage this one person's career continuously."

**Why we win.** A persistent Career Knowledge Graph that compounds with use, a multi-agent system built specifically for career reasoning, and a trust-first design standard. Full lifecycle breadth is the long-run moat, honestly earned later — not claimed now.

**Why this sequencing.** AI Career Center, for students and fresh graduates, as a B2C subscription — nothing else — because it's the smallest complete test of the company's actual thesis, with no dependency on network effects, employer participation, or institutional sales cycles.

**The bet, stated once, plainly.** A system that actually knows a person's career and keeps working on it beats a shelf of disconnected tools that don't — and the way to prove that is to build the narrowest possible version of "actually knows and works on it" first, extraordinarily well, before building anything wider.

---

# Part II — Users & Needs

## 8. Target Users & Market Segmentation

| Segment | Definition | Phase | Priority rationale |
|---|---|---|---|
| Final-year students | Enrolled, within ~12 months of graduating, beginning to job/internship search | 0 (MVP) | Primary segment — see §7 |
| Fresh graduates | Graduated, within ~24 months, actively job-searching | 0 (MVP) | Primary segment — see §7 |
| Career changers | Employed or recently employed, targeting a different field or function | 2 | Roadmap/gap-analysis logic generalizes, but requires transferable-skill modeling not yet built |
| Working professionals | Established in a career, seeking advancement or lateral growth | 1–2 | Reached partly by Phase 0 users aging into this stage; deliberate acquisition comes later |
| Job seekers (general) | Any segment above, specifically at the point of active application | 2 | Served by the Jobs & Internships module, not before it exists |
| Universities | Institutional buyer, career-services function | 4 | B2B motion, sequenced after B2C proof points exist |
| Companies | Institutional buyer, recruiting/talent function | 4 | B2B motion, sequenced after B2C proof points exist |
| Company (Self-Serve / Job-Posting) | An organization creating an account to post jobs/internships and review applicants directly | 2 | Supply-side complement to Jobs & Internships (§16); distinct from the institutional "Companies" row above, which remains the deeper recruiting-access relationship pursued once Phase 0–3 trust is established (§7) |
| Service Provider / Freelancer | A student, graduate, or other individual offering a professional, educational, or career-related service through CareerOS — including but not limited to tutoring, training, mentoring, programming, design, translation, CV writing, portfolio design, or career consulting | Unscheduled | Tied to the Services Marketplace (§16); no phase assigned — sequencing is an open question (§55) |

MVP scope covers **final-year students and fresh graduates only**. All other rows are documented here for completeness of the long-term vision; they are explicitly not design targets until their listed phase.

## 9. User Personas

### Primary personas (MVP — designed for now)

| | **The Final-Year Student** | **The Fresh Graduate** |
|---|---|---|
| Situation | Currently enrolled, 6–12 months from graduating | Graduated 0–24 months ago, not yet in a role that matches their goal |
| Core need | Direction: which skills/experience actually matter for their target field, and what to do with remaining time in school | Proof: closing the gap between "has a degree" and "is hireable," fast, with a market that isn't responding to generic applications |
| Current workarounds | University career center (infrequent), scattered YouTube/LinkedIn advice, asking peers | Job board mass-applying, ad hoc ChatGPT prompts, resume templates found online |
| Core frustration | Advice is generic; doesn't know if what they're doing (courses, clubs, projects) actually moves the needle | Applying broadly with no feedback loop — doesn't know *why* they're not getting responses |
| Success looks like | A concrete plan for the time they have left, tied to a specific target role/field | A CV, profile, and skill set that demonstrably match a target role, with visible progress closing the gap |
| Primary CareerOS jobs | Skill-gap analysis against a target field; a roadmap that fits an academic schedule | Skill-gap analysis against a target role; CV/profile feedback; a roadmap to close the gap |

These two personas share the same core loop (profile → gap analysis → roadmap → feedback) and the same module (AI Career Center). They differ in time horizon and starting material, which is a content/tuning distinction, not a separate feature set.

### Secondary personas (documented, not designed for yet)

| Persona | One-line need | Phase | Note |
|---|---|---|---|
| Career Changer | Identify which of their existing skills transfer, and what's missing, for a new field | 2 | Requires transferable-skill modeling beyond the MVP's gap analysis |
| Working Professional | Advancement planning within an existing field, not a first-job search | 1–2 | Same core loop, different goal type; revisit once Phase 0 core loop is proven with retained users |
| University Career Services | Give their student population access to CareerOS, with visibility into aggregate outcomes | 4 | Institutional buyer; different product surface (admin/reporting), not built in MVP |
| Company / Employer | Access CareerOS's candidate pool for recruiting | 4 | Institutional buyer; requires trust and scale established in Phases 0-3 first |
| Company (Self-Serve / Job-Posting) | Create a profile, publish job/internship listings, manage postings, review applicants, and search for candidates | 2 | Distinct from the Company/Employer persona above (Phase 4) |
| Service Provider / Freelancer | Publish a service for others to discover, request, and review | Unscheduled | Tied to the Services Marketplace (§16); covers tutoring, training, mentoring, design, programming, translation, CV writing, and career consulting |

## 10. User Problems & Jobs-to-be-Done

JTBD statements for the MVP personas, tagged by priority. "Must" = required for the core loop to deliver its value; "Should" = strengthens it but isn't launch-blocking.

| Priority | Job-to-be-done |
|---|---|
| Must | When I don't know if I'm on track for a target role, I want an honest assessment of where I stand, so I can stop guessing whether my current effort is the right effort. |
| Must | When I have a target role or field in mind, I want to know specifically what skills or experience I'm missing, so I can prioritize what to work on next instead of doing everything generically. |
| Must | When I've identified a gap, I want a concrete, ordered plan to close it, so I don't have to figure out sequencing and prioritization myself. |
| Must | When I submit a CV or profile, I want specific, actionable feedback tied to my target role, so I know what to change and why. |
| Should | When my situation changes (new goal, new information, time passes), I want my plan to update accordingly, so I'm not working from a stale roadmap. |
| Should | When I complete a step in my plan, I want that progress reflected back to me, so I can see the gap actually closing. |
| Won't (MVP) | When I'm ready to apply, I want relevant job/internship listings surfaced to me. *(Jobs & Internships module — Phase 2)* |
| Won't (MVP) | When I want peer feedback or community, I want to connect with others on a similar path. *(Community — Phase 3)* |

## 11. User Journey Maps

Single journey map covering both MVP personas — their paths diverge only in the "Core Loop Usage" content, not in structure.

| Stage | User does | CareerOS does | User's goal at this stage | Dropoff risk |
|---|---|---|---|---|
| Discovery | Finds CareerOS (search, referral, social) | — | Decide whether this is worth trying | Value proposition unclear from outside |
| Onboarding | Creates account, provides goal/target role, initial background | Initializes the Career Knowledge Graph for this user | Get to a useful first output quickly | Onboarding too long before any value is shown |
| First value moment | Receives first skill-gap analysis and roadmap | Runs gap-analysis agent against stated goal | Confirm the assessment is specific to them, not generic | Output reads as generic/templated — breaks trust immediately (§0.4 Principle 9) |
| Core loop usage | Works through roadmap steps; submits CV/profile for feedback | Tracks progress; feedback agent produces specific critique | See tangible movement toward the goal | No visible connection between using the product and actual progress |
| Retention / habit | Returns periodically as circumstances change | Updates roadmap and gap analysis based on new state | Feel the system is current, not static | Roadmap doesn't reflect known changes; user reverts to old workarounds |
| Subscription decision | Evaluates whether to continue paying | — | Judge accumulated value against cost | Value felt in early sessions doesn't compound — nothing to show for time invested |

The "First value moment" and "Subscription decision" rows are the two highest-leverage points for the MVP: the first because it's where trust is won or lost per §0.4 Principle 9, the second because it's where the B2C subscription model (§7) is validated or falsified.

## 12. Value Proposition per Segment

**Final-Year Student:** A specific plan for the time you have left before graduating, built from what your target field actually requires — not generic advice.

**Fresh Graduate:** A clear answer to why applications aren't landing, and a concrete plan to close the gap — not another job board to scroll.

**Career Changer** *(Phase 2)*: A plan that starts from what already transfers, not from zero.

**Working Professional** *(Phase 1–2)*: A system that keeps advancing with you after the first job, instead of stopping once you're placed.

**University** *(Phase 4)*: Give every student the individualized guidance your staff can't scale to provide alone.

**Company** *(Phase 4)*: Access candidates who've already done the work of becoming role-ready, with visible evidence of it.

**Company (Self-Serve / Job-Posting)** *(Phase 2)*: Post roles and reach candidates who've already done the work of becoming role-ready — without a separate institutional relationship.

**Service Provider / Freelancer** *(Unscheduled)*: Turn your skills into income, discoverable by the same community you're building your career alongside.

---

# Part III — Product Definition

## 13. Product Scope

### What CareerOS Is
An AI-native Career Operating System: a persistent model of a user's career (the Career Knowledge Graph) combined with a multi-agent system that continuously analyzes, plans, and acts on it. In its current, concrete form: an AI Career Center for students and fresh graduates, delivering skill-gap analysis, roadmap generation, and CV/profile feedback, on a B2C subscription model.

### What CareerOS Is Not
- **Not a chatbot.** No feature should be a single-session Q&A with no persistent state or follow-through.
- **Not a job board or marketplace.** Jobs & Internships is a future module within CareerOS (Phase 2), not the business itself.
- **Not a course marketplace or LMS.** Learning Hub (Phase 1) recommends and tracks against a skill gap; it does not host or sell course content.
- **Not a generic professional social network.** Community (Phase 3) connects users around shared career context, not general networking or content feeds.
- **Not a recruiter/ATS tool.** No employer-side tooling exists until the Companies segment (Phase 4).
- **Not a gig or freelance marketplace.**
- **Not a certification or credentialing authority.**

### MVP Scope
| Dimension | Definition |
|---|---|
| Segment | Final-year students and fresh graduates (§8) |
| Module | AI Career Center only |
| Core loop | Profile → skill-gap analysis → roadmap → CV/profile feedback → progress tracking (§14) |
| Business model | B2C subscription (free + paid tier; packaging defined in §39) |
| Platform surface | Not yet decided — open question, logged in §55 |
| Geography / language | Not yet decided — open question, logged in §55 |

### Out of Scope (this phase — not permanently)
Community and social features · Jobs & Internships · Portfolio · Learning Hub · University and Company accounts · team/org accounts · native mobile apps · multi-language support · gamification or leaderboards · browser extensions · payments beyond an individual subscription · any integration not required by the MVP core loop.

### Future Scope
- **Phase 1:** Learning Hub, Portfolio
- **Phase 2:** Jobs & Internships
- **Phase 3:** Community
- **Phase 4:** Universities, Companies
- **Unscheduled:** native mobile apps, multi-language support, gamification, browser extension, primary acquisition of Career Changers and Working Professionals, Services Marketplace / Service Provider

## 14. Product Pillars & Core Loops

### Product Pillars
1. **Career Knowledge Graph** — the persistent model of the user's skills, goals, and progress.
2. **Agent Ecosystem** — the specialized AI agents that read and act on that model.
3. **Guided Execution** — the surfaces that turn agent output into concrete user action.
4. **Trust & Explainability Layer** — guardrails, confidence exposure, and transparency, applied across the other three pillars.

### The MVP Core Loop
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

## 15. Information Architecture

### Navigation Structure (MVP)

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

### Structural decisions
- **Dashboard has one job:** show current career status and the single next action, not a grid of widgets.
- **Infrastructure vs. functional modules.** Authentication, User Profiles, Dashboard, Notifications, and Settings are infrastructure — present from Phase 0 regardless of which functional module is active. AI Career Center, Learning Hub, Portfolio, Jobs & Internships, and Community are functional modules, added by phase.
- **One model, many views.** Every module is a surface over the same Career Knowledge Graph.

## 16. Platform Modules — Full Vision

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

## 17. Feature Prioritization Framework

| Step | Question | If it fails |
|---|---|---|
| 1. Module Phase | Which module (§16) does this feature belong to? | Inherits that module's minimum phase |
| 2. Core Loop Alignment | For Phase 0 candidates: does it strengthen a step of the MVP Core Loop (§14)? | Not eligible for Phase 0 |
| 3. Dependency Resolution | Are external dependencies resolved by the proposed phase? | Push to the phase where they resolve |
| 4. Trust Bar | Can it ship at a quality *and reliability* level meeting §0.4 Principle 9 — including actual agent reliability, not just interface polish? | Defer rather than ship degraded |
| 5. Measurable Value | Can we state, in one sentence, the user outcome this should move (§0.4 Principle 12)? | Unscheduled — back to discovery |

**Priority Tier** (applied within a phase, after tagging): **Foundational** (Must-JTBD or Core-Loop-critical) / **Supporting** (trust, re-engagement, or business-model-required) / **Enhancing** (Should-JTBD, improves but not required).

## 18. Feature Inventory

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

## 19. Functional Requirements per Module

Covers Phase 0 (MVP) modules only. Each requirement references the Feature Inventory ID it implements.

### Authentication (#1)
- **FR-AUTH-1:** A user must be able to create a new account and establish a unique identity.
- **FR-AUTH-2:** A user must be able to authenticate into an existing account on return visits.
- **FR-AUTH-3:** A user must be able to recover access if credentials are lost.
- **FR-AUTH-4:** All activity and data must be associated with the authenticated identity, linked to the Career Knowledge Graph.
- **FR-AUTH-5:** A user must be able to permanently delete their account; deletion behavior follows §21/§38.

### Onboarding (#2)
- **FR-ONBOARD-1:** The system must define and communicate the minimum profile information required before generating an initial skill-gap analysis.

### User Profiles (#3)
- **FR-PROF-1:** A user must be able to create and edit background, education, and experience information.
- **FR-PROF-2:** A user must be able to state a target role or field and update it at any time.
- **FR-PROF-3:** Profile data must be stored as part of the Career Knowledge Graph, accessible to AI Career Center agents.
- **FR-PROF-4:** The system must indicate what profile information is missing or would improve analysis quality.

### AI Career Center — Skill-Gap Analysis (#4)
- **FR-AICC-1:** The system must generate a skill-gap analysis comparing the user's current profile against their stated goal.
- **FR-AICC-2:** The analysis must identify specific missing or underdeveloped skills/experience, not only an aggregate score.
- **FR-AICC-3:** The system must expose reduced confidence whenever the analysis carries meaningful uncertainty — incomplete profile data, an ambiguous goal, or low confidence in the skill mapping.
- **FR-AICC-4:** A user must be able to request a refreshed analysis after updating profile or goal.
- **FR-AICC-5:** The system must be able to explain, on request, why a specific skill was flagged as a gap.
- **FR-AICC-6:** When the analysis changes from a previous version, the user must be able to see what changed and why — not have it silently replaced.

### AI Career Center — Roadmap (#5, #6, #9)
- **FR-AICC-7:** The system must generate an ordered roadmap of concrete actions derived from the skill-gap analysis.
- **FR-AICC-8:** Each roadmap item must be presented with enough specificity that the user can act on it without further clarification.
- **FR-AICC-9:** A user must be able to mark roadmap items complete, in progress, or skipped — and revise that status afterward.
- **FR-AICC-10:** The system must regenerate or adjust the roadmap when the user's goal or profile changes materially (the definition of "material" is a business rule, set in §21).
- **FR-AICC-11:** The system must explain why a given roadmap item was recommended, on request.
- **FR-AICC-12:** When the roadmap changes as a result of regeneration, the user must be able to see what changed and why — not have it silently replaced.

### AI Career Center — CV/Profile Feedback (#7)
- **FR-AICC-13:** A user must be able to submit a CV or profile document for review.
- **FR-AICC-14:** The system must return specific, actionable feedback tied to the user's stated target role.
- **FR-AICC-15:** The system must distinguish factual/structural issues from judgment-call feedback.
- **FR-AICC-16:** The system must be able to explain, on request, why a specific piece of feedback matters for the target role.
- **FR-AICC-17:** A user must be able to request re-review after making changes.
- **FR-AICC-18:** A user must be able to view previous feedback rounds for a submitted CV/profile, not only the most recent.

### AI Career Center — Progress (#8)
- **FR-AICC-19:** The system must maintain a history of the user's skill-gap assessments and roadmap completion over time.
- **FR-AICC-20:** The user must be able to view how their readiness has changed since they started.

### Dashboard (#10)
- **FR-DASH-1:** The dashboard must present a single, current snapshot of the user's career status — action-oriented, not an analytics grid.
- **FR-DASH-2:** The dashboard must surface the single next recommended action from the active roadmap.
- **FR-DASH-3:** The dashboard must not require navigation to another screen to understand overall status at a glance.
- **FR-DASH-4:** The next-action recommendation must include a brief reason it's the next step, visible without additional navigation.

### Notifications (#11)
- **FR-NOTIF-1:** The system must notify the user when a requested analysis, roadmap update, or feedback review is ready.
- **FR-NOTIF-2:** The system must notify the user when their roadmap has gone stale relative to elapsed time or known changes.
- **FR-NOTIF-3:** A user must be able to control notification frequency and category (specific delivery channels depend on Platform Surface).
- **FR-NOTIF-4:** The system must notify the user when the skill-gap analysis or roadmap changes as a result of a system-initiated regeneration, not only in response to a user request.

### Settings (#12, #13)
- **FR-SET-1:** A user must be able to view and manage their subscription and billing information.
- **FR-SET-2:** A user must be able to view what data CareerOS has stored about them.
- **FR-SET-3:** A user must be able to request deletion of specific stored CareerOS data (e.g., AI memory contents, profile data) independent of full account deletion, which is covered exclusively by FR-AUTH-5.
- **FR-SET-4:** A user must be able to cancel their subscription directly, without contacting support.

### Value Recap & Renewal Touchpoint (#14)
- **FR-RENEW-1:** The system must present a summary of progress made (skills closed, roadmap completed) before a renewal charge occurs.
- **FR-RENEW-2:** If a user cancels, the system must offer an optional, non-blocking opportunity to state why.

## 20. User Stories

| Feature | User Story | Priority |
|---|---|---|
| Authentication (#1) | As a job seeker, I want to create a secure account, so that my career information is saved and private to me. | Foundational |
| Onboarding (#2) | As a new user, I want to be guided to provide enough information for a meaningful first analysis, so that my first result isn't generic. | Foundational |
| Profile (#3) | As a student, I want to enter my background and target role, so that CareerOS can assess me against something specific. | Foundational |
| Skill-Gap Analysis (#4) | As a fresh graduate, I want to see exactly which skills I'm missing for my target role, and why, so that I know what to prioritize instead of guessing. | Foundational |
| Roadmap Generation (#5) | As a user with an identified gap, I want an ordered plan to close it, so that I don't have to figure out sequencing myself. | Foundational |
| Roadmap Tracking (#6) | As a user working through my roadmap, I want to mark steps complete — and undo that if I make a mistake — so my plan reflects my actual progress. | Foundational |
| CV Feedback (#7) | As a job seeker, I want specific feedback on my CV tied to my target role, and to understand why it matters, so I know what to change and why. | Foundational |
| Progress History (#8) | As a returning user, I want to see how my readiness has changed over time, so I can tell whether my effort is working. | Supporting |
| Roadmap Regeneration (#9) | As a user whose goal has changed, I want my roadmap to update accordingly — and to be told what changed and why — so I'm never working from a stale plan I don't know is stale. | Enhancing |
| Dashboard (#10) | As a returning user, I want to immediately see where I stand, what to do next, and why, so I don't have to dig for it. | Supporting |
| Notifications (#11) | As a user, I want to be told when my analysis or roadmap changes, so I'm never surprised by a plan I didn't know had updated. | Supporting |
| Billing (#12) | As a subscriber, I want to manage or cancel my subscription directly, so I stay in control of what I'm paying for. | Foundational |
| AI & Memory Controls (#13) | As a privacy-conscious user, I want to see and delete what CareerOS has stored about me, so I can trust the system with my information. | Supporting |
| Value Recap & Renewal (#14) | As a subscriber approaching renewal, I want to see what I've actually accomplished, so I can judge whether continuing is worth it. | Supporting |

## 21. Business Rules & Policies

Governs Phase 0 (AI Career Center, Students & Fresh Graduates) only.

### 21.1 Goal Management
- **BR-GOAL-1:** A user has exactly one active goal at a time.
- **BR-GOAL-2:** Setting a new active goal archives the current one as a previous goal — it is retained, not deleted.
- **BR-GOAL-3:** Changing the active goal is a material change (§21.2) and triggers regeneration of the skill-gap analysis and roadmap.
- **BR-GOAL-4:** Previous goals remain visible in progress history but are not editable.
- **BR-GOAL-5:** A user may reactivate a previous goal, making it the active goal again, subject to BR-GOAL-3.

### 21.2 Skill-Gap Analysis Rules
- **BR-GAP-1:** Minimum information required to run an analysis is an active goal plus the profile-completeness bar defined in FR-ONBOARD-1.
- **BR-GAP-2:** Analysis can only run once BR-GAP-1 is met; below that bar, the system communicates what's missing rather than producing an analysis.
- **BR-GAP-3 (definition of "material change"):** A material change is (a) the active goal changing, or (b) the user editing a profile field the most recent analysis identified as contributing to a specific gap. Edits unrelated to a flagged gap do not qualify.
- **BR-GAP-4:** Analysis regenerates automatically on a material change; the user may also request a manual refresh at any time regardless of whether a material change occurred.
- **BR-GAP-5:** An incomplete profile above the BR-GAP-1 bar does not block analysis, but the result must carry reduced confidence.

### 21.3 Roadmap Rules
- **BR-ROAD-1:** A roadmap only exists derived from a current skill-gap analysis; there is no roadmap independent of one.
- **BR-ROAD-2:** Roadmap regeneration follows the same material-change trigger as analysis.
- **BR-ROAD-3:** When a roadmap regenerates, the prior version is retained as version history, not deleted.
- **BR-ROAD-4:** A skipped item remains visible, counts neither toward nor against progress, and may be un-skipped at any time.
- **BR-ROAD-5:** A completed item may be reopened by the user at any time.
- **BR-ROAD-6:** Reopening a completed item does not erase its original completion record — progress history reflects the full sequence of status changes.
- **BR-ROAD-7:** Archived roadmap versions are retained for the lifetime of the account, viewable but not editable.

### 21.4 Progress Rules
- **BR-PROG-1:** Progress history is a chronological record of skill-gap assessments, roadmap status changes, and CV feedback rounds — not a single current-state snapshot.
- **BR-PROG-2:** Readiness is captured at each analysis event so its change over time is visible.
- **BR-PROG-3:** All progress history is visible to the user who generated it by default.
- **BR-PROG-4:** Progress history is never silently altered or removed, except by explicit user-initiated deletion.

### 21.5 AI Decision Rules
- **BR-AI-1:** All AI-generated outputs are advisory; none is presented as a final or authoritative verdict on the user.
- **BR-AI-2:** The user retains final control over every action an AI output recommends — nothing is executed on the user's behalf without their initiation.
- **BR-AI-3:** Every AI-generated recommendation must be explainable on request.
- **BR-AI-4:** Confidence must be presented wherever the system's certainty is reduced; confidence is never presented as higher than the system's actual basis for the output.
- **BR-AI-5:** Where the system cannot produce a reliable output, it must say so rather than produce a plausible but unflagged low-confidence result.

### 21.6 CV Feedback Rules
- **BR-CV-1:** A user may submit a CV/profile for review at any time; any limit on review-round volume is a subscription-tier matter defined in §39.
- **BR-CV-2:** Each submission and its feedback form one review round; all rounds are retained, not only the most recent.
- **BR-CV-3:** Retained review rounds exist so the user can judge whether prior feedback was addressed in a later submission.
- **BR-CV-4:** A new submission does not delete or overwrite previous versions or their feedback.

### 21.7 Notification Rules
- **BR-NOTIF-1:** A notification triggers when: (a) a requested analysis, roadmap, or feedback review completes; (b) the analysis or roadmap regenerates without a direct user request; or (c) the roadmap becomes stale.
- **BR-NOTIF-2 (definition of "stale"):** A roadmap is stale when an extended period passes with no item activity, or the system detects the user's circumstances have likely changed without a corresponding update. The exact time threshold is a tunable parameter set outside this document.
- **BR-NOTIF-3:** A user may adjust notification frequency and category; notifications tied to a pending renewal charge are exempt from full muting, though their frequency/format may still be adjusted.
- **BR-NOTIF-4:** Preference changes apply prospectively only; they do not retroactively affect already-triggered notifications.

### 21.8 Subscription Rules
- **BR-SUB-1:** CareerOS offers a free tier and a paid tier; the specific feature/usage split is defined in §39.
- **BR-SUB-2:** A user may cancel at any time without contacting support; cancellation takes effect at the end of the current billing period unless §39 states otherwise.
- **BR-SUB-3:** Before a renewal charge, the user is shown a progress recap reflecting actual, verifiable history — not marketing content.
- **BR-SUB-4:** Cancellation retains previously generated data; it is a distinct action from data deletion.
- **BR-SUB-5:** Cancellation does not delete the account — it changes access to free-tier terms as defined in §39.

### 21.9 Data & Memory Rules
- **BR-DATA-1:** Data in the Career Knowledge Graph is owned by the user who generated it. Compliance-level handling is governed by §38 (compliance), not established here.
- **BR-DATA-2:** A user can view what data CareerOS has stored about them at any time.
- **BR-DATA-3:** A user can delete specific stored data independent of deleting their account.
- **BR-DATA-4:** Deleting a specific data field does not retroactively remove historical AI outputs generated using it at the time, unless the user separately requests full history deletion.
- **BR-DATA-5:** Full account deletion is governed exclusively by FR-AUTH-5 and removes or anonymizes all associated data.
- **BR-DATA-6:** Nothing the system uses to personalize a user's experience is hidden from that user.

### 21.10 Business Constraints
- **BR-CONST-1:** These rules apply only within Phase 0 scope.
- **BR-CONST-2:** No rule in this section may override the Product Principles (§3) or §0.4; conflicts are resolved via the Decision Framework (§53).
- **BR-CONST-3:** No rule may authorize an AI action that bypasses user awareness or consent — absolute for Phase 0.
- **BR-CONST-4:** Rules dependent on geography, language, or platform surface are out of scope until the corresponding Open Questions (§13/§55) are resolved.

## 22. Screen Inventory

Every screen maps to a node in the locked Information Architecture (§15) and to at least one Phase-0 feature (§18). Shared MVP user for all screens: Final-Year Student / Fresh Graduate (§9) unless noted otherwise.

### Authentication
1. **Sign Up** — Create a new account (FR-AUTH-1). Entry: landing surface, Log In's create-account link. Exit: success → Onboarding; abandon → no account created. Related: Feature #1 · FR-AUTH-1, FR-AUTH-4.
2. **Log In** — Authenticate an existing identity (FR-AUTH-2). Exit: success → Dashboard; forgot credentials → Account Recovery. Related: Feature #1 · FR-AUTH-2.
3. **Account Recovery** — Recover access to an existing account (FR-AUTH-3). Related: Feature #1 · FR-AUTH-3.

### Onboarding
4. **Onboarding** — Captures active goal and minimum profile information (FR-ONBOARD-1, FR-PROF-2). Cannot be skipped (BR-GAP-2). Exit: completion → Dashboard, first analysis generating. Related: Feature #2 · FR-ONBOARD-1, FR-PROF-2 · BR-GAP-1, BR-GAP-2.

### Dashboard
5. **Dashboard** — Single, current snapshot of career status and next recommended action (FR-DASH-1–4). Default landing screen. Related: Feature #10, #14 · FR-DASH-1–4, FR-RENEW-1 · BR-SUB-3.

### AI Career Center
6. **Profile & Goal** — Edit profile fields and manage the active goal (FR-PROF-1–4). Related: Feature #3, #9 · FR-PROF-1–4 · BR-GOAL-1–3, BR-GAP-3.
7. **Skill-Gap Analysis** — Presents the current assessment against the active goal (FR-AICC-1–5). Related: Feature #4 · FR-AICC-1–6 · BR-GAP-1–5, BR-AI-3–5.
8. **Roadmap** — Presents the ordered plan and tracks progress (FR-AICC-7–12). Related: Feature #5, #6, #9 · FR-AICC-7–12 · BR-ROAD-1–7, BR-GAP-3–4.
9. **CV / Profile Feedback — Submission** — Submit a CV/profile document for review (FR-AICC-13). Related: Feature #7 · FR-AICC-13, FR-AICC-17 · BR-CV-1, BR-CV-4.
10. **CV / Profile Feedback — Review Result** — Present feedback for one review round, current or (via Progress) past (FR-AICC-14–16, FR-AICC-18). Related: Feature #7 · FR-AICC-14–16, FR-AICC-18 · BR-CV-2–4, BR-AI-4–5.
11. **Progress** — Chronological record of assessments, roadmap changes, CV feedback rounds, and goal history — the hub for "what changed and why." Related: Feature #8 · FR-AICC-6, FR-AICC-12, FR-AICC-18–20 · BR-PROG-1–4, BR-ROAD-3, BR-ROAD-6–7, BR-GOAL-4–5, BR-DATA-4.

### Notifications
12. **Notifications** — Presents agent- and system-generated updates (FR-NOTIF-1, 2, 4). Related: Feature #11 · FR-NOTIF-1–4 · BR-NOTIF-1–4.

### Settings
13. **Settings — Account** — Manage core account identity and permanent deletion (FR-AUTH-5). Related: Feature #1 · FR-AUTH-5 · BR-DATA-5.
14. **Settings — Subscription & Billing** — Manage subscription, view renewal recap, cancel (FR-SET-1, 4, FR-RENEW-1–2). Related: Feature #12, #14 · FR-SET-1, FR-SET-4, FR-RENEW-1–2 · BR-SUB-1–5.
15. **Settings — AI & Memory Controls** — View stored data and delete specific stored data (FR-SET-2/3). Related: Feature #13 · FR-SET-2, FR-SET-3 · BR-DATA-2–4, BR-DATA-6.
16. **Settings — Notification Preferences** — Control notification frequency and category (FR-NOTIF-3). Related: Feature #11 · FR-NOTIF-3 · BR-NOTIF-3–4.

---

# Part IV — AI System Design

## 23. AI Product Philosophy

This section establishes the philosophy §24–§30 operationalize into specifics.

### 23.1 AI's Role Inside CareerOS
CareerOS's AI is not a feature — it is the active layer of the Career Knowledge Graph, the mechanism by which the product's central promise (§1: a system that "works for you continuously") is actually delivered rather than merely described. AI's role is to do the work of synthesis and planning a person would otherwise do themselves across disconnected tools (§4) — never to replace the person's own judgment about their career.

### 23.2 What AI Is Allowed To Do
- Analyze the user's profile and active goal to produce a skill-gap assessment (§18 #4).
- Generate and adjust a roadmap derived from that assessment (§18 #5, #9).
- Critique user-submitted material and explain that critique (§18 #7).
- Recommend a next action and state why (§19 FR-DASH-4, FR-AICC-11).
- Ask the user for more information when a reliable output isn't yet possible (§21 BR-GAP-2, BR-AI-5).
- Express reduced confidence when its basis for an output is incomplete or uncertain (§21 BR-AI-4).

### 23.3 What AI Is Never Allowed To Do
- Act outside CareerOS on the user's behalf — submitting, sending, or publishing anything — without explicit, in-the-moment initiation.
- Change the user's roadmap, analysis, or other managed state without that change being visible and explained (§19 FR-AICC-6/12). Updates triggered automatically by the user's own edits (§21 BR-GAP-4, BR-ROAD-2) are allowed; silent ones are not — the line is visibility, not whether a step was automatic.
- Present an assessment as a final or authoritative verdict on the user's worth or potential.
- Present confidence it does not actually have.
- Use one user's data to shape another user's experience by default — any cross-user or aggregate use of data is a matter for §38's compliance policy, not assumed here.

### 23.4 Human vs. AI Decision Boundaries
**AI owns analysis, synthesis, and recommendation. The user owns judgment and action.** An agent can tell a user what it found and what it would do; only the user decides what actually happens next — no AI recommendation is self-executing (§21 BR-AI-1/2).

### 23.5 Explainability Philosophy
Every AI-generated output must be explainable on request, without exception (§0.4 Principle 6; §19 FR-AICC-5/9/16). The more consequential an output, the less acceptable it is for that explanation to be optional: the Dashboard's next-action recommendation surfaces its reason inline rather than requiring a request (§19 FR-DASH-4).

### 23.6 Confidence Philosophy
Confidence is a truthful signal, not a design element. CareerOS never presents an output with more apparent certainty than its actual basis supports (§21 BR-AI-4), and reduced confidence is expressed at the point of output, not buried in a settings screen (§0.4 Principle 15).

### 23.7 Personalization Philosophy
Personalization means an output measurably reflects this specific user's graph — not their segment, not a generic persona (§9). Two users who state the same goal should see outputs that diverge as soon as their profiles, progress, or history diverge.

### 23.8 Memory Philosophy
Memory exists for one reason: to make CareerOS a system, not a session (§3). What the system remembers about a user, it remembers in service of that same user's continuity — not, by default, to improve outputs for other users, and not as a hidden asset the user can't see; any aggregate or cross-user use of memory is a matter for §38's compliance policy, not assumed here.

### 23.9 Multi-Agent Collaboration Principles
- **Single responsibility.** Each agent owns one category of task; none should require guessing at another's.
- **Shared ground truth.** Agents read from and write to the same Career Knowledge Graph — no agent maintains a private, agent-specific memory of the user.
- **Consistent handoff.** When one agent's output feeds another's task, the receiving agent must not contradict or silently discard what the first agent already established with the user.
- **Invisible seams.** The user never needs to know or care how many agents were involved — from their perspective, CareerOS responded, not "Agent A, then Agent B."

### 23.10 Failure Behavior
When the system cannot produce a reliable output, it says so rather than producing a plausible-sounding wrong one (§21 BR-AI-5) — this is CareerOS's failure mode by design. A failure never leaves the user's existing state worse than before the attempt.

### 23.11 Trust Principles
Trust is the product's central asset, not a quality attribute alongside others (§1, §6). Every principle above exists to protect it: explainability and confidence calibration let a user verify AI output rather than simply accept it; the human/AI decision boundary keeps consequential choices with the person whose career it is; honest failure means a wrong answer is rare and, when it happens, visible rather than disguised.

### 23.12 Consistency with the Career Knowledge Graph
Every agent's output is grounded in, and updates, the same Career Knowledge Graph — the "one person, one model" commitment stated in §3 and structured as a Product Pillar in §14. If the graph doesn't yet reflect something an agent needs to know, the correct behavior is to ask the user, not assume.

## 24. Career Knowledge Graph

### 24.1 What the Career Knowledge Graph Is
The Career Knowledge Graph is the persistent, structured representation of one user's career state — their profile, goal, skill gaps, roadmap, and feedback history. It is scoped to career substance specifically: identity, billing, and notification preferences exist alongside it as account-level data but are not part of it.

### 24.2 Why One Shared Graph, Not Separate Module Data
§3 commits to "one person, one model," and §16 shows every module reading from and writing to the same graph rather than maintaining its own. If each module held its own view of the user, personalization would fragment exactly the way the tools CareerOS replaces already do (§4).

### 24.3 Core Entities (Conceptual)
- **Profile** — background, education, experience.
- **Goal** — the user's stated target role/field; one active at a time, previous ones retained.
- **Skill-Gap Analysis** — an assessment of the user against the active goal at a point in time.
- **Roadmap** — an ordered plan derived from an analysis, made up of **Roadmap Items**, each with a status.
- **CV/Profile Feedback Round** — a submitted document paired with the feedback generated for it.
- **Derived signals** — Readiness, Career Score, Career Health — computed from the entities above, not stored as independent raw facts.

**Progress** is not a separate entity — it is the chronological view across Goal history, Analysis versions, Roadmap/Item history, and Feedback rounds.

### 24.4 Relationships Between Entities

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

### 24.5 User-Controlled vs. AI-Generated

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

### 24.6 Historical vs. Current State
- **Current-state only:** Profile fields.
- **Current + history:** Goal, Skill-Gap Analysis, Roadmap, Roadmap Item status, CV/Profile Feedback — every version or round retained, not only the latest.

Detecting a material change requires knowing whether a specific profile field has changed since the last analysis that used it — a lightweight comparison, not full version history of every profile edit.

### 24.7 Single Source of Truth
For any fact about a user's career state, the graph holds exactly one current value — never two modules each holding a version that could disagree.

### 24.8 Module Read/Write Pattern
§16 specifies, module by module, what each reads from and writes to the graph. Every module, present and future, is a view onto this graph, never a private data store.

### 24.9 How the Graph Enables Personalization
Because the graph exists as a single, queryable representation of the individual, an agent doesn't personalize by inference from a persona — it reads the user's actual current Goal, Profile, and history.

### 24.10 How the Graph Enables Explainability
"Why was this skill flagged" points to the specific Profile fields and Goal the Analysis compared; "why did the roadmap change" points to the specific prior version and the material change that triggered regeneration.

### 24.11 How the Graph Enables Continuity
A returning user's Dashboard, Roadmap, and Progress all read the same graph state that existed when they left, not a fresh or degraded reconstruction of it.

### 24.12 Constraints the Graph Must Always Satisfy
- **Scope discipline.** The graph represents career substance only — Profile, Goal, Skill-Gap Analysis, Roadmap, CV/Profile Feedback, and their derived signals. Identity, billing/subscription state, and notification preferences are account-level data alongside the graph, not inside it.
- **User visibility.** Everything in the graph is visible to the user it describes, with no hidden fields.
- **User deletability.** Specific graph data can be deleted independent of the full account, without silently invalidating historical records generated from it before deletion.
- **Historical immutability.** Once created, a historical entry is not rewritten — only removed by explicit user-initiated deletion.
- **No competing current state.** Exactly one current value per fact; no module-private shadow copy.
- **Full traceability.** Every entity in the graph is populated or consumed by an already-approved Feature, Functional Requirement, or Business Rule.
- **Extensibility without redesign.** The model must accommodate Phase 1+ entities (learning progress, portfolio evidence, application history — §16) as additions to the same graph, not a reason to introduce a second one. Future role-specific profile types — a Company profile and a Service Provider profile (covering any professional, educational, or career-related service offered on CareerOS, including tutoring, training, or mentoring) — are new entities added under this same principle when their respective phase (§16) is reached; none requires redesigning the Phase 0 Profile entity.

## 25. Agent Ecosystem Overview

### 25.1 Purpose of the Agent Ecosystem
The Agent Ecosystem is what turns the Career Knowledge Graph from a passive record into the active, working system CareerOS's vision describes.

### 25.2 Why Multiple Specialized Agents, Not One General-Purpose AI
- **Explainability requires narrow accountability.** An agent responsible for exactly one kind of output can be held to a clear, specific standard of correctness.
- **The boundaries already exist in the Core Loop.** §14's Core Loop has distinct steps — analyze, plan, act/feedback — that map directly onto distinct responsibilities.
- **Ownership makes the "no silent overwrite" guarantee enforceable.**

### 25.3 The Phase 0 Agent Roster

| Agent | Single Responsibility | Owns (writes) |
|---|---|---|
| Skill-Gap Analysis Agent | Compare Profile and active Goal to produce a skill-gap assessment | Skill-Gap Analysis |
| Roadmap Agent | Derive an ordered roadmap from the current Skill-Gap Analysis | Roadmap (item content) |
| CV/Profile Feedback Agent | Evaluate a submitted document against the active Goal | CV/Profile Feedback Round |

Three agents, not more — the minimal set that satisfies single-responsibility against the Phase 0 Feature Inventory.

### 25.4 Skill-Gap Analysis Agent
- **Reads:** Profile, active Goal, its own previous Analysis version.
- **Writes:** A new Skill-Gap Analysis version.
- Confidence exposure, on-request explanation, and change-visibility are output properties every agent's output must have (§23.5/§23.6), not separate responsibilities.

### 25.5 Roadmap Agent
- **Reads:** Current Skill-Gap Analysis, its own previous Roadmap version.
- **Writes:** New Roadmap Item content on generation or regeneration. It never sets or alters item status — that remains exclusively user-controlled.
- **Powers Dashboard's next-action reasoning:** Dashboard has no agent of its own — it surfaces the Roadmap Agent's own item-level output and explanation.

### 25.6 CV/Profile Feedback Agent
- **Reads:** Active Goal, the submitted document.
- **Writes:** Feedback content for a new review round, distinguishing factual/structural issues from judgment calls.
- **Independence:** Does not read the Skill-Gap Analysis or Roadmap.

### 25.7 User-Facing vs. Internal Agents
All three Phase 0 agents are user-facing. Phase 0 has no internal-only agent — staleness detection (§21 BR-NOTIF-2) does not require one, since its trigger conditions are evaluated against existing graph state.

### 25.8 Ownership Boundaries
**Many agents may read a given entity; exactly one agent writes it.**

| Entity | Written by | Read by |
|---|---|---|
| Skill-Gap Analysis | Skill-Gap Analysis Agent | Roadmap Agent, Skill-Gap Analysis Agent (own history) |
| Roadmap (item content) | Roadmap Agent | Roadmap Agent (own history) |
| CV/Profile Feedback Round | CV/Profile Feedback Agent | — |
| Roadmap Item status | User only | — |

### 25.9 Agent Collaboration Principles (Applied)
- **Single responsibility:** established in §25.3–§25.6.
- **Shared ground truth:** none of the three agents retain state outside the Career Knowledge Graph.
- **Consistent handoff:** the Skill-Gap Analysis Agent's output is the Roadmap Agent's input; never proceeds on a version the Skill-Gap Analysis Agent hasn't actually produced.
- **Invisible seams:** the user experiences one regenerated roadmap, not "two systems ran."

### 25.10 Handoff Rules
- **HR-1:** A handoff occurs only when the upstream entity actually changes.
- **HR-2:** The downstream agent always acts on the current version of its input, never a stale one.
- **HR-3:** A handoff must not silently discard user-controlled state.
- **HR-4:** If a downstream agent's run fails, the upstream agent's output remains valid and visible.

### 25.11 Agent Lifecycle
- **Skill-Gap Analysis Agent** invoked: after Onboarding, on a material change, or on user-requested refresh.
- **Roadmap Agent** invoked immediately following any new Skill-Gap Analysis version.
- **CV/Profile Feedback Agent** invoked only on user-initiated submission — never automatically.

### 25.12 Preventing Conflicting Outputs
Conflicts are prevented structurally: exclusive write-ownership means two agents can never produce competing versions of the same entity; HR-2 means a downstream agent can never act on a superseded input; the single-current-value constraint means the user is never shown two disagreeing outputs.

### 25.13 Constraints for Future Agents (Phase 1–4)
- Exactly one primary responsibility — no exceptions.
- Reads and writes only through the Career Knowledge Graph, extending it with new entities if needed.
- Does not overlap an existing agent's write-ownership of any entity.
- Complies fully with §23 — advisory output only, explainable, confidence-calibrated, no silent action.
- Is introduced only when its owning module reaches its phase.
- Requires no redesign of an existing agent's responsibility or of the graph model.

### 25.14 Extending the Ecosystem Without Redesign
New agents attach to new graph entities, added when their module is scoped, without altering the write-ownership of entities that already exist.

## 26. AI Capability Map

### 26.1 Purpose of the Capability Map
This section defines what the Phase 0 agent roster is capable of doing, at the product level: the reusable abilities beneath an agent's single responsibility, available to be shared across agents.

### 26.2 Agent vs. Capability
An **agent** is a bounded responsibility with exclusive write-ownership of specific graph entities — a *who*. A **capability** is a reusable type of ability an agent draws on to fulfill that responsibility — a *how-able*.

### 26.3 Master Capability Catalog (Phase 0)

| Capability | Product-level definition | Boundary |
|---|---|---|
| **Analysis / Comparison** | Compare two pieces of graph state and produce a structured account of the difference. | Produces an assessment only — never a self-executing action. |
| **Planning** | Produce an ordered sequence of steps toward a goal, with reasoning available on request. | Never extends to carrying out the steps it produces — governs sequencing and reasoning-visibility only. |
| **Critique / Evaluation** | Assess user-submitted material against a stated goal and produce specific, categorized feedback. | Evaluates only what the user submitted; does not generate replacement content. |
| **Explainability** | Articulate, on request, the reasoning behind a specific output, grounded in the graph state that produced it. | Must reference actual graph state — not a generic justification. |
| **Confidence Calibration** | Represent the system's actual certainty in an output. | Confidence never presented as higher than its actual basis. |
| **Change Awareness** | Compare a newly produced version of an entity against its own immediately prior version. | Applies only to versioned entities (Analysis, Roadmap) — not CV/Profile Feedback Rounds. |
| **Grounding** | An agent's output is derived from specific Career Knowledge Graph data it has read, not general knowledge unconnected to the user. | Distinct from Explainability: Grounding is the property the output *is* based on real data; Explainability is the ability to *surface* that basis. |

Multi-Agent Collaboration, Guardrails, Workflow Engineering, MCP, Monitoring, and Observability are deliberately absent from this catalog — not overlooked, but properties of the ecosystem, engineering practice, or team requirement, not agent capabilities.

### 26.4 Capabilities by Agent

| Agent | Capabilities Used |
|---|---|
| Skill-Gap Analysis Agent | Analysis/Comparison, Explainability, Confidence Calibration, Change Awareness, Grounding |
| Roadmap Agent | Planning, Explainability, Confidence Calibration, Change Awareness, Grounding |
| CV/Profile Feedback Agent | Critique/Evaluation, Explainability, Confidence Calibration, Grounding |

### 26.5 Shared Capabilities
Explainability, Confidence Calibration, and Grounding are used by all three agents. Change Awareness is shared by two of three (not CV Feedback, whose rounds are independent). Analysis/Comparison, Planning, and Critique/Evaluation are each used by exactly one agent.

### 26.6 Capabilities Not Possessed by Any Phase 0 Agent
- **Long-Term Memory, as inferential synthesis.** No Phase 0 agent forms new insight from patterns across history beyond stored facts.
- **Short-Term Memory, as multi-turn conversational context.** No Phase 0 agent conducts extended interactive dialogue.
- **Reflection / Self-Critique, as a distinct internal step.** The honesty-under-failure requirement is satisfied by Confidence Calibration alone.
- **Tool Calling.** No Phase 0 agent invokes an external capability — nothing external exists to call yet.

### 26.7 Capability Boundaries
Every capability is bounded by its own stated boundary and by every guardrail already established in §21 and §23.

### 26.8 Capability Reuse Principles
When more than one agent needs the same ability, they use the exact same capability definition — not agent-specific variations.

### 26.9 Rules Preventing Capability Overlap
Before a new capability is added, it must be checked against every existing entry; if it substantially overlaps, the existing entry is extended rather than a new, competing capability created.

### 26.10 Constraints on Introducing Future Capabilities
- A Phase 1–4 agent genuinely requires an ability not already in the catalog.
- It receives exactly one precise, implementation-independent definition.
- It does not duplicate or substantially overlap an existing capability.
- It complies fully with §23's philosophy and is bounded the same way every existing capability is.

### 26.11 Capabilities and the Career Knowledge Graph
No capability operates independently of the graph — it is what every capability in this catalog is exercised on.

### 26.12 Capabilities and the Product Principles

| Capability | Principle it most directly serves |
|---|---|
| Analysis / Comparison | §3, "Executes, not just answers" |
| Planning | §3, "Executes, not just answers"; bounded by §23.4 |
| Critique / Evaluation | §3, "Executes, not just answers" |
| Explainability | §0.4 Principle 6; §3, "Earns trust before it earns reliance" |
| Confidence Calibration | §0.4 Principle 15 |
| Change Awareness | §0.4 Principle 9 — nothing silently replaced |
| Grounding | §3, "One person, one model"; §23.7 Personalization |

## 27. AI Workflows

### 27.1 Purpose of AI Workflows
An AI Workflow is the named, complete sequence connecting a trigger, the agent(s) invoked, the graph entities touched, and what the user ultimately sees.

### 27.2 Workflow vs. Agent, Capability, and Feature
A Feature is a user-facing capability at product-scope level. An Agent is who owns producing part of it. A Capability is a reusable ability an agent draws on. A Workflow is the specific, complete path connecting a trigger to an outcome.

### 27.3 Workflow: First Skill-Gap Analysis
- **Trigger:** Onboarding completes, meeting the minimum bar.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads:** Profile, active Goal. No prior version exists — Change Awareness does not apply.
- **Writes:** First Skill-Gap Analysis version.
- **Initiation:** Automatic, as a direct consequence of completing Onboarding.
- **Outcome / Screen:** Skill-Gap Analysis screen, with confidence indicator if applicable.
- **Cascades to:** §27.4.

### 27.4 Workflow: Roadmap Generation
- **Trigger:** A Skill-Gap Analysis version has just been produced with no existing Roadmap yet.
- **Participants:** Roadmap Agent.
- **Reads:** Current Skill-Gap Analysis.
- **Writes:** First Roadmap version.
- **Initiation:** Automatic, cascading immediately from §27.3.
- **Outcome / Screen:** Roadmap screen.

### 27.5 Workflow: Analysis Refresh after Material Change
- **Trigger:** A material change — active Goal changes, or a flagged Profile field is edited.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads:** Profile, active Goal, previous Analysis version.
- **Writes:** New Skill-Gap Analysis version; prior version retained.
- **Initiation:** Automatic, as a direct consequence of the user's own edit.
- **Side effect (not agent activity):** A notification is triggered.
- **Cascades to:** §27.6, if the new Analysis differs from the prior one.

### 27.6 Workflow: Roadmap Regeneration
- **Trigger:** A new Skill-Gap Analysis version differs from the prior one, and a Roadmap already exists.
- **Participants:** Roadmap Agent.
- **Reads:** Current Skill-Gap Analysis, previous Roadmap version.
- **Writes:** New Roadmap Item content; prior version retained; Item status-change history preserved.
- **Initiation:** Automatic, cascading from §27.5 (or §27.7).

### 27.7 Workflow: Manual Refresh
- **Trigger:** The user explicitly requests a refreshed Analysis, whether or not a material change has occurred.
- **Participants:** Skill-Gap Analysis Agent.
- **Reads / Writes:** Identical mechanics to §27.5.
- **Initiation:** User-initiated directly.
- **Cascades to:** §27.6, under the same condition as §27.5.

### 27.8 Workflow: CV / Profile Feedback
- **Trigger:** User submits a CV/profile document.
- **Participants:** CV/Profile Feedback Agent only.
- **Reads:** Active Goal, the submitted document.
- **Writes:** A new CV/Profile Feedback Round; prior rounds retained.
- **Initiation:** Always user-initiated.
- **Boundary:** Does not cascade into §27.5 or §27.6.

### 27.9 Workflow: Dashboard Next Action
- **Trigger:** User views the Dashboard.
- **Participants:** None — a read/display workflow, not an agent-invocation workflow.
- **Reads:** The current Roadmap's next incomplete item and its existing explanation, and the current Analysis's confidence state.
- **Writes:** Nothing.

### 27.10 Workflow: Change Explanation
- **Trigger:** User requests to see what changed and why, for a Skill-Gap Analysis or a Roadmap, via Progress.
- **Participants:** Skill-Gap Analysis Agent or Roadmap Agent — using Change Awareness. Not available for CV/Profile Feedback Rounds.
- **Reads:** The current version and its immediately prior version.
- **Writes:** Nothing.

### 27.11 Workflow Boundaries
A workflow ends where its own trigger's outcome is fully written and visible. A handoff between workflows is governed by §25.10's Handoff Rules.

### 27.12 Failure Behavior
Every generation workflow fails the same way: if the agent cannot produce a reliable output, it says so, and the prior state remains intact and visible. Display workflows fail by showing the last known state.

### 27.13 Workflow Consistency Rules
- No workflow writes an entity it does not own.
- A downstream workflow step always acts on the current version of its input.
- Every generation workflow's output carries Explainability and Confidence Calibration.
- "Automatic" and "silent" are never the same thing.

### 27.14 Relationship to Product Principles
These workflows are the concrete mechanism behind §3's "Executes, not just answers."

### 27.15 Constraints for Future Workflows
- Uses only agents already approved (or introduced under §25.13) and capabilities already approved (or introduced under §26.10).
- Touches only Career Knowledge Graph entities already defined (or extended under §24.12).
- Is triggered either directly by the user or automatically as a visible, notifiable consequence of the user's own action.
- Respects exclusive write-ownership and the handoff rules exactly as applied above.
- Belongs to a module that has reached its approved phase.

## 28. Human-AI Interaction Model

### 28.1 Purpose
Defines the consistent, cross-cutting pattern of how users experience AI across every agent, workflow, and screen.

### 28.2 Interaction Philosophy
CareerOS's AI is not conversational. Interaction is structured: the user views a specific artifact and acts on it through defined actions, not free-form dialogue.

### 28.3 Human vs. AI Responsibilities in Interaction
The AI's part is to present an artifact and, on request, its reasoning; the user's part is to read, question, act, or override.

### 28.4 User Initiation vs. Automatic Assistance
Every interaction is user-initiated or an automatic, visible consequence of the user's own prior action — never a third kind.

### 28.5 Visibility of AI Actions
Every graph write an agent makes is visible to the user — immediately, or via notification plus Progress.

### 28.6 Explainability in Interaction
Every screen presenting an AI-generated output carries a defined action to request the reasoning. Dashboard's next-action recommendation surfaces its reason inline.

### 28.7 Confidence Presentation
Confidence appears as part of the artifact itself, at the moment the output is shown.

### 28.8 Requesting Explanations
An explanation request is a single, direct action scoped to the specific output being questioned — not open-ended questioning.

### 28.9 User Control and Overrides
The user can act against or independent of any AI recommendation at all times.

### 28.10 AI Recommendations vs. User Decisions
No interaction presents an AI output as a decision already made.

### 28.11 Interaction Consistency Across All Agents
The interaction pattern for requesting an explanation or reading a confidence signal is identical regardless of which agent produced the output.

### 28.12 Error and Uncertainty Communication
A system failure is communicated as a system failure, never left for the user to interpret as a finding about themselves.

### 28.13 Trust-Building Behaviors
Explanation-on-request, honest confidence, full visibility of changes, and unconditional override together are what let a user verify AI output rather than simply accept it.

### 28.14 Relationship to Product Principles
Guidance not gatekeeping (§28.12); Explainability (§28.6, §28.8); Confidence calibration (§28.7); One Career Knowledge Graph (§28.5); No silent changes (§28.4, §28.5); User ownership (§28.9, §28.10); System not session (§28.2).

### 28.15 Constraints for Future Interaction Patterns
- Preserves structured, non-conversational interaction.
- Keeps explanation requests scoped to a specific output.
- Presents confidence inline with the output it qualifies.
- Never defaults a user into accepting a recommendation.
- Applies identically across whichever agents are active at that phase.

## 29. AI Guardrails & Responsible AI Policy

This section consolidates guardrails already established across §0.4, §3, §21, §23, §25, §26, §27, and §28 into one coherent policy.

### 29.1–29.2 Purpose and Relationship to Product Principles
This is the single, complete answer to "what is CareerOS's AI allowed to do, and what governs it," operationalizing §3's principles and §0.4's Principles 9, 10, 15.

### 29.3 Human Oversight
**RAI-1:** Every AI output remains subject to human review and decision before it has any real-world consequence.

### 29.4 Decision Boundaries
**RAI-2:** No AI action bypasses user awareness or consent.
**RAI-3:** No agent acts outside CareerOS on the user's behalf without explicit, in-the-moment initiation.

### 29.5 Explainability Requirements
**RAI-4:** Every AI-generated output must be explainable on request, grounded in actual graph data.
**RAI-5:** The Dashboard's next-action recommendation is the sole case requiring inline, non-request-based explanation.

### 29.6 Confidence Requirements
**RAI-6:** Confidence must be presented at the point of output whenever meaningfully reduced, and never inflated.

### 29.7 Failure Behavior
**RAI-7:** When a reliable output cannot be produced, the system must say so.
**RAI-8:** Failure must never leave a user's prior state degraded, corrupted, or lost.
**RAI-9:** A system failure must never be presented in a way a user could mistake for a finding about themselves.

### 29.8 User Control & Override
**RAI-10:** The user may act against or independent of any AI recommendation at all times.

### 29.9 Transparency Requirements
**RAI-11:** Every AI-initiated change is visible to the user, either immediately or via notification and history.

### 29.10 Privacy & Data Boundaries
**RAI-12:** Data is owned by the user it describes, visible to them, and independently deletable.
**RAI-13:** No AI capability uses one user's data to shape another user's experience by default.

### 29.11 Consistency Across All Agents
**RAI-14:** Every guardrail in this policy applies identically to all Phase 0 agents and to any future agent.

### 29.12 Prevention of Hidden AI Behavior
**RAI-15:** "Invisible seams" (agent-count complexity is hidden) and concealment of AI action (never permitted) are not the same thing.

### 29.13 Trust Principles
Trust is the product's central asset. Explainability, confidence calibration, human oversight, unconditional override, and honest failure are structural guarantees, not tone.

### 29.14 Constraints for Future AI Features
**RAI-16:** Any future AI agent, capability, workflow, or interaction pattern must comply with every RAI item in this section. Any exception requires the Decision Framework (§53).

## 30. Personalization & Memory Strategy

### 30.1–30.3 Purpose, Relationship to Personalization, Purpose of Memory
Memory exists for one reason: to make CareerOS "a system, not a session."

### 30.4 Short-Term Memory
The context an agent holds for the duration of a single workflow invocation — narrower than multi-turn conversational memory.

### 30.5 Long-Term Memory
The Career Knowledge Graph itself — the persisted record of explicit facts that carries across sessions. Remembering what happened, precisely — not inferring what it might mean beyond what the graph's own entities already represent.

### 30.6 What Memory May Remember
Exactly, and only, what §24.3 defines as the Career Knowledge Graph's entities.

### 30.7 What Memory Must Never Remember or Infer
- Anything outside the graph's defined scope.
- Inferred traits or patterns beyond §24.3's derived signals.
- Another user's data, by default.
- Anything private to one agent.

### 30.8 Memory Visibility
Nothing memory contributes to an output is hidden from the user it describes.

### 30.9 Memory Deletion
A user can delete specific stored data independent of their account, without silently invalidating historical records already generated from it.

### 30.10 Memory and Personalization
Personalization is memory in use, not a separate mechanism.

### 30.11 Memory Across Agents
All three Phase 0 agents read from and write to the same memory — none holds a private, agent-specific memory.

### 30.12 Memory During Workflows
Nothing an agent holds during a workflow persists beyond it except what is explicitly written to the graph — this is the precise boundary between Short-Term and Long-Term Memory: what isn't written doesn't persist.

### 30.13 Trust & Continuity
Memory is what makes "a system, not a session" true rather than aspirational.

### 30.14 Constraints for Future Memory Expansion
Any future memory capability — most notably inferential Long-Term Memory — may only be introduced as a new, explicitly defined capability under §26.10's constraints, never as a silent extension of an existing agent's behavior.

---

# Part V — Experience & Design Direction

## 31. UX Principles & Interaction Philosophy

### 31.1 Purpose
Defines the enduring experience philosophy every current and future screen must follow.

### 31.2 Relationship to Product Vision
The experience must feel like §1's thesis — one continuous, working system — not merely claim it in copy.

### 31.3 Simplicity Over Complexity
Every screen shows only what serves its single primary objective (§0.4 Principle 13).

### 31.4 Progressive Disclosure
Depth is available on request, not surfaced by default — request-based explanations, and Progress holding history off the primary screens.

### 31.5 Clarity of AI Output
AI-generated content is presented with the same clarity and hierarchy standard as any other content — never visually distinguished as separate or mysterious.

### 31.6 User Control
The user is never in a position where the product acts without their initiation or blocks their ability to change course.

### 31.7 Consistency Across Modules
Every module — present and future — must feel like one product, using the same interaction patterns, information hierarchy, and trust signals.

### 31.8 Visibility of System State
The user should never have to wonder what the current state of their account, roadmap, or subscription is.

### 31.9 Error Communication
Every error state tells the user what happened and what they can do next; none is a dead end.

### 31.10 Trust Through Interaction
Trust accumulates through consistent, small interaction promises being kept — not through reassuring visual language.

### 31.11 Continuity Across Sessions
A returning user's experience picks up exactly where they left off, with no re-orientation cost.

### 31.12 Accessibility & Inclusiveness
Accessibility is a default from the first release, not a retrofit.

### 31.13 Scalability of Experience
The principles in this section must accommodate future modules without requiring a philosophy rewrite.

### 31.14 Constraints for Future UX Patterns
A new UX pattern must comply with every principle above and go through the Decision Framework (§53) if it would require revisiting a principle.

## 32. Design Inspirations & Experience Benchmarks

### 32.1–32.2 Purpose and Why External Inspirations Are Used
These products calibrate design *reasoning*, not visual reference.

### 32.3 Linear — Interaction Philosophy
Actions resolve immediately and visibly, consistent with §31.8 and §28.9.

### 32.4 Notion — Information Architecture
One underlying structure serves many surfaces — confirmation of the Career Knowledge Graph/module architecture already locked in, not a new direction.

### 32.5 Stripe — Clarity & Trust
Precise, consistent communication — the direct standard for Explainability and Confidence Calibration.

### 32.6 Raycast — Speed & Focus
The sharpest expression of §0.4 Principle 13 and §31.3, mirroring §13's MVP scope discipline.

### 32.7 Framer — Polish & Restraint
Detail communicates state or hierarchy, never sophistication for its own sake — §0.4 Principle 4.

### 32.8 Arc — Thoughtful Workflows
Screens shaped by the Core Loop, not by default "dashboard with widgets" category conventions.

### 32.9 Apple Human Interface Guidelines — Consistency & Accessibility
Precedent for §31.7 and §31.12 as the product grows through §16's phases.

### 32.10 What CareerOS Must Not Copy
Linear's engineering-tool audience assumption; Notion's blank-canvas openness; Stripe's developer-first register; Raycast's power-user assumption; Framer's/Arc's novelty for its own sake; Apple's platform-exclusivity assumption.

### 32.11 Synthesizing These Inspirations Into One Product
No single benchmark is followed wholesale; each maps to a principle already in §0.4, §3, or §31.

### 32.12 Constraints for Future Design Decisions
A future design decision may not cite resemblance to an inspiration as justification on its own — it must be justified by the underlying principle.

## 33. Brand Identity & Voice

### 33.1–33.5 Purpose and Relationships
Defines the enduring identity and communication philosophy of CareerOS, tied to Vision (§1), Principles (§0.4), UX (§31), and Design Inspirations (§32, especially Stripe).

### 33.6 Brand Personality
A capable, honest collaborator who has done the work — not a hype-driven marketer, not a cold tool, not a performance of friendliness.

### 33.7 Communication Philosophy
Say exactly what is true, as plainly as clarity allows, and never perform confidence or warmth the system hasn't earned.

### 33.8 Tone of Voice
Direct, plain, and respectful — never alarmist, never effusive, never distant.

### 33.9 Writing Principles
State what happened, not what sounds good. Name the specific thing. Be as brief as clarity allows. Never use urgency or scarcity language.

### 33.10 Guidance vs. Authority
CareerOS's voice presents findings and options; it never issues instructions. A recommendation is offered, never ordered.

### 33.11 Confidence without Overstatement
Language must match the calibrated confidence level already required of every AI output.

### 33.12 Human-Centered Language
Plain language over jargon; addresses this user's actual stated goal and situation, not generic career-advice phrasing.

### 33.13 Consistency Across All Modules
The voice is the same regardless of which agent or module produced an output.

### 33.14 AI Communication Style
AI-generated content reads as CareerOS speaking, not as "the AI" speaking in a separate register.

### 33.15 Error Communication Philosophy
Errors are stated plainly: what happened, and what the user can do next.

### 33.16 Trust Through Language
Voice is a promise the system's actual behavior must keep, not decoration layered on top of it.

### 33.17 Accessibility of Language
Plain language, minimal reliance on industry jargon.

### 33.18 Constraints for Future Brand Evolution
Any future voice evolution must remain consistent with Guidance vs. Authority, Confidence without Overstatement, and the personality defined here.

## 34. Design System Direction

### 34.1–34.5 Purpose and Relationships
A design system is the enduring set of principles ensuring every interface element expresses the same underlying product logic — tied to Vision, Principles, UX, and Voice.

### 34.6 Design System Philosophy
A design system is the visual counterpart to structures already locked elsewhere: just as the Career Knowledge Graph ensures one shared truth about data, the Agent Ecosystem ensures one coherent intelligence, Capabilities ensure one reusable ability with one definition, and Workflows ensure consistent sequences — a design system ensures one visual and interactive language.

### 34.7 Consistency Over Novelty
A new interface pattern is never justified by being interesting or different — it is justified by serving an already-established principle better.

### 34.8 Components as Product Language (Principle Only)
A reusable interface pattern is product language — one definition wherever it's reused. What that pattern actually is remains implementation-level, out of scope here.

### 34.9 Visual Hierarchy
Exists to make each screen's single primary objective immediately apparent — the visual expression of Progressive Disclosure (§31.4).

### 34.10 States & Feedback Consistency
Empty, loading, and error states (§22) are expressed consistently across every screen, so a user learns to recognize them once, universally.

### 34.11 Accessibility by Default
Reuse is what makes accessibility-by-default enforceable, not merely aspirational — verified once at the system level, it propagates everywhere the pattern is used.

### 34.12 Scalability Across Future Modules
A future module reuses the existing system's patterns; it does not introduce its own visual language.

### 34.13 Design System Governance
No pattern is added because a single screen needed it — it is added, if justified, against §34.6's core parallel.

### 34.14 Constraints for Future Design System Evolution
Must serve an already-established principle, apply universally once adopted, preserve accessibility and consistency, and go through the Decision Framework (§53) for any reinterpretation.

## 35. Onboarding Strategy

### 35.1–35.5 Purpose and Relationships
Onboarding exists only to activate the Core Loop for a new user as quickly and honestly as possible.

### 35.6 Onboarding as the Beginning of Continuity
§3's "a system, not a session" begins at onboarding, not after it.

### 35.7 Minimum Information Philosophy
Onboarding collects only what §21 BR-GAP-1 and §19 FR-ONBOARD-1 define as necessary for a meaningful first Skill-Gap Analysis.

### 35.8 Progressive Commitment
A user is not asked to fully specify their entire career situation before receiving any value.

### 35.9 Building Trust Before Asking for More
Onboarding asks for the minimum, delivers a real first outcome, and only afterward invites the user to provide more.

### 35.10 Immediate Value
Onboarding ends at a real, usable outcome — a first Skill-Gap Analysis and Roadmap — not a completion message.

### 35.11 Avoiding Setup Fatigue
Every additional field or step is a direct cost against §35.10's goal.

### 35.12 Personalization Begins at Onboarding
The first Analysis a user receives is already personalized to exactly what they provided.

### 35.13 Future Expansion Constraints
As Phase 1–4 modules are introduced, onboarding does not grow to collect information for them upfront — a future module's own data needs are collected within that module's own flow.

### 35.14 Constraints for Future Onboarding Evolution
Any future change must preserve the minimum-information philosophy, the real-first-outcome ending, and the no-upfront-growth constraint.

## 36. Empty States, Errors & Edge-Case Philosophy

### 36.1–36.4 Purpose and Relationships
§22 defines screen-specific empty/error states; this section defines the enduring philosophy governing all of them.

### 36.5 Empty States Philosophy
An empty state is never "nothing" — it communicates why it is empty, whether that is expected, and what meaningful next step already exists. Most screens have no true empty state because Onboarding's immediate-value guarantee ensures content exists first.

### 36.6 Error Philosophy
System problems, missing user information, and unavailable outputs are each already governed. Errors explain what happened, explain what the user can do next, and never become dead ends.

### 36.7 Edge Cases
No analysis available, roadmap unavailable, deleted information, missing profile data, interrupted workflow — each already governed by an approved rule. Edge cases preserve consistency rather than introducing exceptional interaction models.

### 36.8 Trust During Failure
Trust is tested most during failure, not success.

### 36.9 Continuity After Failure
A failure is a temporary interruption, not a break in the user's ongoing relationship with CareerOS.

### 36.10 Honest Absence
"We don't know" is the correct output when the system has nothing reliable to ground an answer in — the limiting case of confidence calibration.

### 36.11 Accessibility During Failure
Accessibility applies fully to empty and error states — these moments matter most, not least.

### 36.12 Consistency Across Modules
Every future module follows this exact philosophy — no module-specific error language.

### 36.13 Future Expansion Constraints
Future modules may introduce new edge cases but may not introduce a different philosophy for handling them.

## 37. Accessibility & Inclusivity Standards

### 37.1–37.4 Purpose and Relationships
Accessibility has been assumed and applied throughout this document; this section states the philosophy beneath every prior application.

### 37.5 Accessibility as Product Inclusion
Not a compliance bar to clear — a direct test of whether CareerOS actually remains usable by the people it claims to exist for.

### 37.6 Accessibility Across the Entire Experience
Applies equally to every touchpoint. The product's overall accessibility is gated by its weakest surface, not averaged across surfaces.

### 37.7 Inclusive Communication
Plain language is accessibility applied to words, not merely a writing preference.

### 37.8 Accessibility During AI Interaction
An explanation technically available but not genuinely comprehensible has not fulfilled Explainability's purpose.

### 37.9 Accessibility During Failure
Builds directly on §36.11 — failure is where inclusion is tested hardest.

### 37.10 Accessibility Across Future Modules
Future modules inherit this philosophy automatically, the same way they inherit consistency, voice, and design system patterns.

### 37.11 Inclusivity Beyond Ability
CareerOS serves people during a high-stakes transition where circumstances vary enormously — the product must not assume a "typical" starting point.

### 37.12 Future Constraints
A future module may extend accessibility but never weaken it. Any exception requires the Decision Framework (§53).

---

# Part VI — Business Model

## 38. Monetization Strategy per Segment

### 38.1 Purpose
Monetization deserves its own philosophy because how a product makes money shapes what it optimizes for — §4 identified this as the root failure of existing tools.

### 38.2 Relationship to Product Vision
Monetization must strengthen the compounding trust relationship, not extract from it.

### 38.3 Relationship to Product Principles
Trust (Principle 9), Simplicity (Principles 2, 7), Long-term thinking, Considered design (Principle 4).

### 38.4 Relationship to User Segments
Monetization philosophy must remain sensitive to who is being asked to pay and at what stage of need, without presuming one value proposition applies uniformly.

### 38.5 Value Before Payment
A user experiences real value (§27.3/27.4) before any monetization moment is relevant.

### 38.6 Monetization Without Manipulation
CareerOS rejects dark patterns, artificial urgency, and forced upgrades. The Value Recap & Renewal Touchpoint (§18 #14, §21 BR-SUB-3) reflects actual, verifiable progress — not marketing content.

### 38.7 Free vs. Premium Philosophy
The free experience must be sufficient for a user to genuinely experience the Core Loop and judge its value; what compounds indefinitely — continuity, depth of personalization, sustained access over a full career journey — is where ongoing payment finds its justification.

### 38.8 Relationship to Product Growth
Sustainable monetization funds continued investment without pressure to compromise the trust-first approach under resource strain.

### 38.9 Future Expansion
Future phases may introduce additional paid value — monetization follows product value, not the reverse.

### 38.10 Constraints
Every future monetization decision must remain consistent with Product Principles, Responsible AI, UX, Brand Voice, and Accessibility. No dark pattern, manufactured urgency, or forced upgrade is ever authorized.

## 39. Pricing & Packaging

### 39.1–39.3 Purpose and Relationships
Defines how value is organized into offerings — not what those offerings cost. §38.7's principle becomes packaging structure here.

### 39.4 Packaging Philosophy
The test for where value belongs: does it represent the complete, honest first experience of the Core Loop, or value that only becomes meaningful through sustained use.

### 39.5 Free Experience
The free experience must let a user complete at least one full pass through the Core Loop — not a teaser or crippled preview.

### 39.6 Premium Experience
What justifies ongoing payment is continuity, deepening personalization, and the compounding advantage — the same Core Loop, continued and sustained, not a different feature set.

### 39.7 Packaging Across Future Phases
As Phase 1–4 modules are introduced, packaging evolves by asking §39.4's same question of each new module's value.

### 39.8 Simplicity of Pricing
Pricing structure should be understandable without requiring comparison of confusing options.

### 39.9 User Trust
Packaging must never be structured to create artificial complexity that obscures what a user is getting or paying for.

### 39.10 Constraints
This document names no tier, sets no price, and creates no commercial offer.

## 40. Go-To-Market Strategy

### 40.1–40.4 Purpose and Relationships
Go-to-market must reinforce the Career Operating System positioning and is scoped to Phase 0's approved audience only.

### 40.5 Product-Led Growth Philosophy
Product value precedes and drives growth — the product itself is the primary growth mechanism.

### 40.6 Trust as the Growth Engine
Because differentiation is trust-based, the primary growth mechanism is a user's own experience of that trust translating into continued use and advocacy.

### 40.7 Expansion Across Phases
Go-to-market scope expands only after a phase is actually scoped and built.

### 40.8 Relationship to Monetization
§38, §39, and §40 form one continuous arc: differentiate honestly → reach the right audience → deliver real value before payment → sustain and deepen that value over time.

### 40.9 Constraints
No go-to-market communication may introduce manipulation, artificial urgency, or misrepresentation. Externally-facing messaging is still governed by Brand Voice (§33).

## 41. Growth & Acquisition Strategy

### 41.1–41.4 Purpose and Relationships
Addresses what sustains the relationship after the first experience, distinct from §40's initial arc.

### 41.5 Product-Led Growth
Continued product value, cycle after cycle, is the primary growth mechanism — §14's flywheel sustaining the relationship.

### 41.6 Trust and Retention
Long-term retention is strategically more important than short-term acquisition, because losing a retained user contradicts CareerOS's core thesis directly, in a way failing to acquire a new one does not.

### 41.7 Expansion Through Product Maturity
Growth expands as a direct consequence of the product becoming more complete.

### 41.8 Relationship to Monetization and GTM
§38–§41 form one continuous strategic chain — growth is a consequence of every other link holding.

### 41.9 Constraints
No growth decision may trade retention or trust for acquisition volume.

## 42. Partnerships Strategy

### 42.1–42.4 Purpose and Relationships
Two categories: content/data relationships for Jobs & Internships (Phase 2), and institutional relationships with Universities and Companies (Phase 4).

### 42.5 Partnerships as Product Multipliers
A partnership amplifies value the product already delivers; it never compensates for value the product doesn't yet deliver.

### 42.6 Partnerships Across Future Phases
Each category becomes relevant only when its corresponding module is scoped.

### 42.7 Relationship to Growth Strategy
Partnerships support product-led growth; they do not replace it.

### 42.8 Relationship to Monetization
A partnership must not gate the free experience's minimum guarantee behind a partner relationship.

### 42.9 Constraints
This document names no organization, invents no integration, and defines no commercial agreement.

---

# Part VII — Requirements & Constraints

## 43. Non-Functional Requirements

This section is a consolidation — every requirement already exists elsewhere in the approved document.

### 43.3 Trust Requirements
- **NFR-TRUST-1:** Every AI-generated output must be explainable on request, grounded in actual data.
- **NFR-TRUST-2:** Confidence presented at the point of output whenever reduced, never inflated.
- **NFR-TRUST-3:** Honest failure; prior valid output remains intact.
- **NFR-TRUST-4:** Every AI-initiated change is visible immediately or via notification and history.
- **NFR-TRUST-5:** Trust-relevant behavior is identical across every agent and future agent.

### 43.4 Reliability Requirements
- **NFR-REL-1:** State persists across sessions without degradation.
- **NFR-REL-2:** A failed operation never leaves prior valid state degraded, corrupted, or lost.
- **NFR-REL-3:** Exactly one current value exists for any fact.
- **NFR-REL-4:** A workflow writes only to entities it owns, acts only on current input, and a failed step never invalidates a valid upstream output.

### 43.5 Consistency Requirements
- **NFR-CONS-1:** AI behavior is identical across all agents.
- **NFR-CONS-2:** UX principles apply identically across every module.
- **NFR-CONS-3:** Voice and tone are identical regardless of agent or module.
- **NFR-CONS-4:** Design system patterns are reused, never reinvented.
- **NFR-CONS-5:** Every module reads from and writes to the same Career Knowledge Graph.

### 43.6 Accessibility Requirements
- **NFR-ACC-1:** Accessibility is a default in every release.
- **NFR-ACC-2:** Inclusivity extends beyond ability to circumstance and prior exposure to professional norms.
- **NFR-ACC-3:** Language avoids unnecessary jargon and remains plain.
- **NFR-ACC-4:** AI interaction must be genuinely comprehensible, not merely technically present.
- **NFR-ACC-5:** Accessibility applies fully to empty and error states.

### 43.7 User Control Requirements
- **NFR-CTRL-1:** Every AI output remains subject to human review before real-world consequence.
- **NFR-CTRL-2:** Data is owned by the user it describes.
- **NFR-CTRL-3:** No AI action bypasses user awareness or consent.
- **NFR-CTRL-4:** A user can view what data is stored about them at any time.
- **NFR-CTRL-5:** A user can delete specific stored data independent of their account.
- **NFR-CTRL-6:** A user may act against or independent of any AI recommendation at all times.

### 43.8 Scalability Requirements
- **NFR-SCALE-1:** The Career Knowledge Graph accommodates new entities without redesigning existing ones.
- **NFR-SCALE-2:** New agents may be introduced without redesigning existing agents.
- **NFR-SCALE-3:** New capabilities may be added without duplicating existing ones.
- **NFR-SCALE-4:** New workflows are built only from already-approved components.
- **NFR-SCALE-5:** Design system and UX patterns extend through reuse, not reinvention.

### 43.9 Constraints
No future NFR may weaken any item above. Any proposed weakening requires the Decision Framework (§53).

## 44. Data Privacy & Compliance Requirements

A consolidation of privacy-relevant commitments.

### 44.3 Data Ownership
- **DPR-1:** Data is owned by the user it describes.
- **DPR-2:** The graph exists in service of the individual user — never repurposed as a shared/aggregate asset by default.
- **DPR-3:** A user can view what data is stored about them at any time.
- **DPR-4:** A user can delete specific stored data or delete their account entirely.

### 44.4 User Consent
- **DPR-5:** No AI action bypasses user awareness or consent.
- **DPR-6:** Every interaction is user-initiated or an automatic, visible consequence of the user's own action — never a third kind.
- **DPR-7:** Every AI output remains subject to human review before real-world consequence.

### 44.5 Privacy Boundaries
- **DPR-8:** An agent's output is grounded only in that specific user's own graph data — never another user's, by default.
- **DPR-9:** No capability performs inference beyond what is explicitly defined and approved.
- **DPR-10:** Any cross-user or aggregate data use is out of scope for this document.

### 44.6 Transparency Requirements
- **DPR-11:** Every AI-generated output is explainable on request.
- **DPR-12:** Confidence is presented honestly at the point of output.
- **DPR-13:** A user can see what changed in a historical output and why.
- **DPR-14:** Nothing used to personalize a user's experience is hidden from them.

### 44.7 Historical Integrity
- **DPR-15:** Historical entries are not rewritten — only removed by explicit user-initiated deletion.
- **DPR-16:** Deleting a data field does not retroactively invalidate historical records generated from it before deletion.
- **DPR-17:** A failed operation never leaves prior valid state degraded or lost.
- **DPR-18:** The graph persists continuously across sessions.

### 44.9 Future Compliance Constraints
Future legal or regulatory requirements may extend this section but may never weaken user ownership, consent, visibility, or Responsible AI. This document does not anticipate specific legal or regulatory frameworks.

## 45. Trust & Safety Requirements

### 45.3 Trust Foundations
**TS-1** through **TS-6:** Explainability, honest confidence, honest failure, human oversight, data ownership/visibility/deletability, session continuity.

### 45.4 User Safety
**TS-7** through **TS-11:** Guidance not gatekeeping; AI advisory only; consequential decisions remain with the user; no recommendation self-executes; unconditional override.

### 45.5 Predictable System Behavior
**TS-12** through **TS-16:** Visible AI-initiated change; exclusive write-ownership; single current value; continuous persistence; no partial writes on failure.

### 45.6 Trust During Failure
**TS-17** through **TS-20:** Honest failure statements; no degraded prior state; honest uncertainty; failure never mistaken for a personal finding.

### 45.7 Trust Through Consistency
One UX philosophy, one voice, one design system, one graph, one interaction model — consistency is what lets trust earned once apply everywhere.

### 45.8 Relationship to Privacy
Privacy governs what the system is allowed to know; Trust & Safety governs how the system behaves using that data. Neither substitutes for the other.

### 45.9 Future Constraints
Future modules, agents, workflows, or capabilities may extend trust and safety requirements but may never weaken human oversight, transparency, explainability, user ownership, user control, or Responsible AI.

## 46. System Integrations

### 46.1–46.5 Purpose and Relationships
Integrations extend product value; they never define it. External data flows into the graph but never becomes an alternate source of truth. Integrations follow approved partnership philosophy (§42) rather than creating it.

### 46.6 Product Boundaries
No external integration ever becomes required for experiencing the Core Loop.

### 46.7 Future Expansion
Future modules may introduce integrations only when those modules are approved and scoped.

### 46.8 Constraints
Future integrations may extend the product but may never weaken one source of truth, user ownership, privacy, Responsible AI, consistency, or trust.

## 47. Platform Constraints & Assumptions

### 47.3 Core Product Assumptions
- **PA-1:** There is one Career Knowledge Graph.
- **PA-2:** There is one coherent intelligence.
- **PA-3:** There is one interaction philosophy.
- **PA-4:** There is one design system.
- **PA-5:** There is one source of truth.
- **PA-6:** There is one Core Loop.

### 47.4 Platform Constraints
- **PC-1:** Evolution is phase-gated.
- **PC-2:** No module operates before approval.
- **PC-3:** No capability exists outside the approved catalog.
- **PC-4:** No workflow exists outside approved agent ownership.
- **PC-5:** No parallel data ownership exists anywhere in the system.
- **PC-6:** The Core Loop remains independent of anything not yet approved.

### 47.5 Relationship to Extensibility
Extensibility elsewhere in the document is a consequence of PA-1 through PA-6 and PC-1 through PC-6 holding, not an independent feature.

### 47.6 Relationship to Future Decisions
Future implementation choices remain flexible provided they preserve these assumptions and constraints. No technology is discussed here because none needs to be.

### 47.7 Constraints
Future implementation may extend the platform but may never weaken one source of truth, one coherent product, user ownership, trust, Responsible AI, or phase sequencing.

---

# Part VIII — Measurement

## 48. Success Metrics & North Star Metric

### 48.1–48.3 Purpose and Relationships
Success means becoming the system §1 describes — a system a person's entire career runs through continuously. Success is measured by depth and sustained value, not feature breadth.

### 48.4 North Star Philosophy
No metric is defined here — only what a North Star Metric must represent: repeated, successful passes through the Core Loop over time, not one-off engagement. Career Milestone (§0.3) is a candidate building block; the specific formula remains undefined here, deliberately.

### 48.5 Success Across the User Journey
Success requires the whole arc to hold — first value, continued use, and sustained continuity together, not any one moment alone.

### 48.6 Relationship to the Core Loop
Repeated successful Core Loop cycles represent increasing product success.

### 48.7 Success Across Future Phases
Each future phase extends the same definition of success rather than replacing it.

### 48.8 Relationship to Growth & Monetization
Product value produces trust, which produces retention, which drives growth, which makes monetization sustainable — one outcome, not four to separately optimize.

### 48.9 Constraints
Future success metrics may evolve but may never redefine success away from user value, trust, continuity, the Core Loop, or the Product Vision.

## 49. KPIs per Module / per Phase

### 49.1–49.3 Purpose and Relationships
A single North Star is insufficient once the platform spans multiple modules. Module-level success exists only because a module strengthens the Core Loop — no module defines success independently.

### 49.4 KPIs Across Product Phases
Phase 0 measures only the AI Career Center. Later phases introduce measurements only after those modules exist.

### 49.5 Module Ownership
Every module eventually owns its own indicators, but they remain subordinate to Product Vision, Core Loop, North Star, and Product Strategy.

### 49.6 Avoiding Metric Fragmentation
Optimizing isolated module measurements at the expense of overall user value would recreate the fragmentation problem §4 identifies in the tools CareerOS replaces — internally this time.

### 49.7 Relationship to Growth & Monetization
KPIs exist to verify value creation, not replace it.

### 49.8 Future Constraints
A future module may introduce new KPIs only after it is approved, scoped, and has a defined role in the Core Loop. No KPI may redefine success independently of §48.

## 50. Experimentation & Feedback Strategy

### 50.1 Purpose
A product intended to support an entire career must continually learn whether it's actually delivering on that promise.

### 50.2 Relationship to Product Vision
Experimentation exists to strengthen the long-term relationship, never to optimize isolated interactions.

### 50.3 Relationship to Product Strategy
CareerOS does not experiment to discover its identity — §6 already specifies the strategy. Experimentation validates that it's genuinely working.

### 50.4 Relationship to the Core Loop
Improvements are evaluated by whether they strengthen the Core Loop — no improvement exists independently.

### 50.5 Learning Through Evidence
Future product evolution follows demonstrated user value rather than assumptions — the same evidentiary discipline already applied to phase transitions (§7), onboarding (§35.8), and growth (§41.3).

### 50.6 Feedback as Product Guidance
Feedback is diagnostic, not directive — it informs decisions, it does not replace Product Vision.

### 50.7 Relationship to Future Phases
Every future module learns independently once it exists, while remaining subordinate to the same Core Loop and Product Vision.

### 50.8 Constraints
Future experimentation may evolve but may never redefine Product Vision, Core Loop, Product Principles, Responsible AI, or the trust-first philosophy. No experiment may treat a Responsible AI principle as a variable to be tested away.

---

# Part IX — Roadmap & Execution

## 51. Phased Roadmap

### 51.1 Purpose
A phased roadmap exists to protect product integrity while CareerOS grows — not to schedule work.

### 51.2 Relationship to Product Vision
The roadmap exists to progressively realize one vision, not to change vision over time.

### 51.3 Relationship to Product Strategy
Sequencing follows strategic differentiation, not opportunity chasing.

### 51.4 Relationship to Phase Structure
§16 already defines the phases; this section defines the philosophy governing movement through them.

### 51.5 Evidence Before Expansion
Each phase is earned through demonstrated value, not assumed progression — the trigger to move between phases is evidence, not elapsed time.

### 51.6 Core Loop Protection
Every future phase strengthens the Core Loop rather than competing with it.

### 51.7 Roadmap as Progressive System Completion
Each phase makes CareerOS more complete, not different — every phase extends the same one graph, one intelligence, one interaction philosophy, one design system, one source of truth, one Core Loop.

### 51.8 Constraints
Future roadmap evolution may extend phases, refine sequencing, or introduce new modules — but may never violate Product Vision, Core Loop, Product Strategy, phase discipline, or Responsible AI.

## 52. Release Strategy

### 52.1 Purpose
Releases exist to deliver meaningful product progress, not simply to ship change.

### 52.2 Relationship to Product Vision
Every release should make CareerOS more fully realize the same vision rather than changing direction.

### 52.3 Relationship to Product Strategy
Releases follow strategic sequencing rather than opportunity-driven delivery.

### 52.4 Relationship to the Phased Roadmap
Releases operate within the roadmap philosophy; they do not replace roadmap discipline.

### 52.5 Meaningful Progress
A release should improve genuine user value — does it move First Value Moment, ongoing Core Loop cycles, or the Subscription Decision moment.

### 52.6 Core Loop Integrity
Every release strengthens the Core Loop rather than introducing disconnected value.

### 52.7 Release as Progressive Completion
Each release represents another step toward the same complete system.

### 52.8 Constraints
Future release practices may evolve but may never violate Product Vision, Product Strategy, Core Loop, phase discipline, Responsible AI, or the trust-first philosophy.

## 53. Decision Framework

### 53.1 Purpose
The explicit statement of the reasoning pattern this document has already used, consistently, throughout its own construction.

### 53.2 Relationship to Product Vision
Every future decision exists to preserve one vision, never to redefine it.

### 53.3 Relationship to Product Principles
Product Principles are the first evaluation criteria for any future decision.

### 53.4 Relationship to the Core Loop
A decision that weakens the Core Loop fails regardless of local benefit.

### 53.5 Relationship to Product Strategy
Decisions preserve differentiation rather than chase opportunity.

### 53.6 Relationship to Evidence
Evidence informs decisions; it does not replace Product Vision.

### 53.7 Decision Hierarchy

```
Vision (§1)
     │
Principles (§0.4, §3)
     │
Strategy (§6, §7)
     │
Core Loop (§14)
     │
Phase Structure (§16, §51)
     │
Features (§17, §18)
     │
Implementation (out of scope, §0.1)
```

A decision at any lower level may never contradict a decision already fixed at a higher level.

### 53.8 Future Evolution
Future additions extend the existing document; they do not rewrite it.

### 53.9 Constraints
Future decisions may evolve the product but may never violate Vision, Core Loop, Product Principles, Responsible AI, Trust, or the One System philosophy. This constraint applies to the Decision Framework itself.

## 54. Risks & Mitigation Plan

### 54.1 Purpose
Risk means anything that threatens CareerOS's ability to fulfill its Product Vision.

### 54.2 Relationship to Product Vision
The greatest product risk is losing alignment with the Vision.

### 54.3 Relationship to Product Strategy
The greatest strategic risk is sacrificing differentiation for short-term opportunity.

### 54.4 Relationship to Trust
Trust loss is a structural product risk, not a UX issue.

### 54.5 Relationship to the Core Loop
Weakening the Core Loop is itself a product risk.

### 54.6 Relationship to Growth
Growth unsupported by genuine value is treated as risk rather than success — arguably the most insidious risk category because it disguises itself as success.

### 54.7 Relationship to Future Evolution
The Decision Framework (§53) exists partly to prevent product drift over time — the mitigation for every risk above is consistent application of the framework already defined.

### 54.8 Constraints
Future risk practices may evolve but may never redefine Product Vision, Core Loop, the trust-first philosophy, Responsible AI, or the Decision Framework.

## 55. Open Questions & Decision Log

### 55.1 Purpose
Some questions remain intentionally unresolved because they belong outside this document's scope — not because they were forgotten.

### 55.2 Relationship to Scope
Implementation decisions were intentionally excluded throughout the PRD.

### 55.3 Relationship to Phase Planning
Future phases naturally introduce questions only when they become scoped.

### 55.4 Relationship to the Decision Framework
Unresolved questions are resolved through the Decision Framework rather than independently.

### 55.5 Open vs. Deferred Decisions
**Open questions** (outside current scope, no fixed home yet): Platform Surface, Geography, and Language Strategy (§13). **Deferred decisions** (already acknowledged, already have a home): exact pricing/packaging (§38.7, §39.4–39.6); the numeric thresholds behind "material change" (§21 BR-GAP-3) and "stale" (§21 BR-NOTIF-2); the phase for Services Marketplace / Service Provider (documented as Unscheduled).

### 55.6 Product Completeness
A complete PRD does not answer every future implementation question — it completely defines the product while intentionally leaving implementation flexibility.

### 55.7 Constraints
Future answers to open questions may never contradict Vision, Core Loop, Product Principles, the Decision Framework, Responsible AI, or the trust-first philosophy.

---

# Part X — Appendices

## 56. Competitive Analysis Detail

Expands the competitive analysis already summarized in §5. No new competitor research, market statistics, or comparative framework beyond what §5 and §6 established.

**Existing tool categories** (§5): Professional networks (LinkedIn); Job marketplaces (Indeed, Handshake); Learning platforms (Coursera, Udemy); University career services and general AI chat assistants (§4); Emerging AI career-copilot startups.

**CareerOS positioning:** narrow-breadth, high-personalization at MVP, targeting broad-and-deep as the full vision — a position no competitor currently occupies (§5's positioning map).

**Differentiation summary** (§6): persistent Career Knowledge Graph; multi-agent system built for career reasoning; trust-first design; full lifecycle coverage as a long-term, not-yet-earned moat.

**Competitive philosophy:** CareerOS does not respond to a competitor's feature by matching it — competitive responses are evaluated against §53.5's rule that decisions preserve differentiation rather than chase opportunity.

## 57. Glossary & Definitions

Centralizes every term already defined across the document into one alphabetical reference. See §0.3 for the master glossary table, expanded and cross-referenced throughout the document as new terms were introduced (Core Loop §14, Career Knowledge Graph §24, Agent §25, Capability §26, Workflow §27, North Star Metric §48.4, First Value Moment §11, Product Vision §1, Product Principles §3/§0.4, Responsible AI §29, Trust §45.3, One System §47, Phase §7/§16, Module §16, Feature §18, Business Rule §21, Functional Requirement §19, Non-Functional Requirement §43, Decision Framework §53).

## 58. Requirements Traceability Matrix

**Product Definition Trace:** Feature Inventory (§18) → Functional Requirements (§19, FR-) → Screens (§22) and AI Workflows (§27).

**Policy & Guardrail Trace:** Product Principles (§0.4, §3) → Functional Requirements (§19) ↔ Business Rules (§21, BR-) → Responsible AI Policy (§29, RAI-) → Non-Functional Requirements (§43, NFR-) → Data Privacy & Compliance (§44, DPR-) → Trust & Safety Requirements (§45, TS-).

**Relationship to the Decision Framework (§53):** the chain above is a *consolidation* trace, showing how requirements were built up section by section. §53.7's hierarchy is a separate, non-linear *arbitration* trace sitting above every layer simultaneously — used to resolve conflicts, not merely appended after the consolidation chain.

**Section ownership summary:**

| Artifact type | Prefix | Defined in |
|---|---|---|
| Functional Requirement | FR- | §19 |
| Business Rule | BR- | §21 |
| Responsible AI item | RAI- | §29 |
| Non-Functional Requirement | NFR- | §43 |
| Data Privacy Requirement | DPR- | §44 |
| Trust & Safety item | TS- | §45 |
| Platform Assumption | PA- | §47 |
| Platform Constraint | PC- | §47 |

## 59. Document Evolution & Versioning

### 59.1 Purpose
Explains how this PRD itself evolves — not software versions, releases, or change logs.

### 59.2 Relationship to Decision Framework
Any future addition or change to this document is itself a decision, evaluated by §53.7's hierarchy exactly as a product decision would be.

### 59.3 Relationship to Open Questions
Resolving an open question or deferred decision (§55.5) is the primary way this document is expected to evolve going forward.

### 59.4 Extension vs. Revision
**Extension** adds new content consistent with the existing hierarchy. **Revision** changes something already approved and requires explicit justification through §53 — never a casual edit.

### 59.5 Maintaining Internal Consistency
Every future addition is held to the same standard applied throughout this document: full traceability, no duplicated concepts, no contradiction, and consistent terminology (§57 is the checkpoint for the last).

### 59.6 Future Editions
A future edition adds new Parts and sections that follow §0's own numbering and rigor discipline, extending the document's structure rather than replacing it.

### 59.7 Constraints
Future revisions may extend this document but may never contradict Vision, Core Loop, Product Principles, or the Decision Framework itself without that contradiction being explicitly resolved through §53 first.

---

*The CareerOS Product Requirements Document (§0–§59) is complete.*
