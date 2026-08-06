"""Multi-agent orchestration: a supervisor graph that coordinates the
Skill-Gap Analysis and Roadmap agents with structured state hand-off, a
persistent (Postgres-backed) checkpointer, and a human-in-the-loop
approval gate before a generated roadmap is treated as final.

Distinct from `careeros_ai.agents`, which are independent, single-purpose
capabilities each owning one entity — this package coordinates *between*
them for the one real product flow where doing so matters (a fresh
analysis cascading into a roadmap draft that a user should be able to
review before it becomes their active plan), without changing what either
agent does on its own or how the simpler, already-shipped direct-call path
(`backend/app/api/routers/ai_career_center.py`) works.
"""
