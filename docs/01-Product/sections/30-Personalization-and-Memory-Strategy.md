# 30. Personalization & Memory Strategy

*Part IV — AI System Design · CareerOS Product Requirements Document*

## 30.1–30.3 Purpose, Relationship to Personalization, Purpose of Memory
Memory exists for one reason: to make CareerOS "a system, not a session."

## 30.4 Short-Term Memory
The context an agent holds for the duration of a single workflow invocation — narrower than multi-turn conversational memory.

## 30.5 Long-Term Memory
The Career Knowledge Graph itself — the persisted record of explicit facts that carries across sessions. Remembering what happened, precisely — not inferring what it might mean beyond what the graph's own entities already represent.

## 30.6 What Memory May Remember
Exactly, and only, what §24.3 defines as the Career Knowledge Graph's entities.

## 30.7 What Memory Must Never Remember or Infer
- Anything outside the graph's defined scope.
- Inferred traits or patterns beyond §24.3's derived signals.
- Another user's data, by default.
- Anything private to one agent.

## 30.8 Memory Visibility
Nothing memory contributes to an output is hidden from the user it describes.

## 30.9 Memory Deletion
A user can delete specific stored data independent of their account, without silently invalidating historical records already generated from it.

## 30.10 Memory and Personalization
Personalization is memory in use, not a separate mechanism.

## 30.11 Memory Across Agents
All three Phase 0 agents read from and write to the same memory — none holds a private, agent-specific memory.

## 30.12 Memory During Workflows
Nothing an agent holds during a workflow persists beyond it except what is explicitly written to the graph — this is the precise boundary between Short-Term and Long-Term Memory: what isn't written doesn't persist.

## 30.13 Trust & Continuity
Memory is what makes "a system, not a session" true rather than aspirational.

## 30.14 Constraints for Future Memory Expansion
Any future memory capability — most notably inferential Long-Term Memory — may only be introduced as a new, explicitly defined capability under §26.10's constraints, never as a silent extension of an existing agent's behavior.

---
*Part of the PRD (§0–§59). Master document: [`../PRD.md`](../PRD.md).*
