# Section 11 — Intelligence ↔ Knowledge Contract

*Part II — Interface & Contract Architecture · Solution Architecture Specification (SAS) · CareerOS*

## 11.1 Purpose of This Contract
This is the clearest ownership boundary in the entire architecture — the crossing that makes the Knowledge Layer's single source of truth (§3.8, §24.7) actually enforceable rather than aspirational.

## 11.2 Information Crossing the Boundary
**Knowledge → Intelligence:** the current state of whatever entities a given agent is permitted to read, per its specific reads list (§25.4–25.6) — always the current version (§25.10, HR-2), never a stale one.
**Intelligence → Knowledge:** a write of new entity content, scoped exclusively to what that agent owns (§25.8) — a write to any entity outside that scope is not a permitted use of this contract, not merely a discouraged one.

## 11.3 Responsibility Split
Knowledge is responsible for *being* the single source of truth (§24.7) — it does not evaluate whether a write is reasonable; it holds what is written, atomically, by the entity's owner. Intelligence is responsible for producing something worth writing — reasoned, capability-compliant output. Knowledge never validates the *quality* of what an agent writes; a write's reliability is Intelligence's own responsibility, enforced by an agent choosing not to write at all on failure (§4.18), not by Knowledge rejecting a low-quality write after the fact.

## 11.4 Ownership
This boundary *is* §25.8's read-shared/write-exclusive rule, stated as a formal contract term: many agents may read a given entity; exactly one may ever write it. No exception exists at this boundary — it is the mechanism, not merely the policy, behind §47 PC-5 ("no parallel data ownership exists anywhere in the system").

## 11.5 Operations
- **Read** (Intelligence → Knowledge): give me the current state of a specific entity.
- **Write** (Intelligence → Knowledge): record this new version of an entity I own.
- **Version-compare** (Intelligence → Knowledge): give me my own entity's immediately prior version, supporting Change Awareness (§26.3).

## 11.6 Governance Constraints at This Boundary
- §47 PC-5 is enforced exactly here: a write from an agent that does not own the entity in question is not a valid use of this contract — this is the single most safety-critical checkpoint in the architecture, since violating it would break §24.7's single source of truth directly.
- A write must never partially complete on failure (§4.18, §29 RAI-8) — it either fully commits or does not happen, so Knowledge is never left holding a half-formed entity.

## 11.7 Why This Contract Exists
This is the contract that makes §24.7 actually true rather than merely stated — restating §3.10 and §3.12's reasoning at the interface level, where it becomes a testable condition on every crossing rather than a description of intent.

## 11.8 What Must Never Cross
An agent's Short-Term Memory (§30.4) — its working context during reasoning — never crosses into Knowledge except through an explicit, owned write. Knowledge never observes an agent's reasoning process directly; it only ever sees the final, committed output.

## 11.9 Why Violating This Contract Would Break the Architecture
If this boundary were ever crossed by an unowned write, the single-source-of-truth guarantee every other part of this architecture — and the PRD's trust argument (§1, §6) — depends on would be false the moment it happened, even once. Nothing downstream (Interaction, Presentation, Governance) can detect or correct this after the fact; the guarantee only holds if this boundary is never crossed incorrectly in the first place.

---
*Part of the SAS, Part II. Master document: [`../SAS.md`](../SAS.md). Traces to SAS §§3.8, 3.10, 3.12, 4.18, 25.4–25.10, 26.3; PRD §§24.7, 29, 30.4, 47.*
