---
document_id: PDA-CIR-084
title: Cross-Domain Failure and Recovery Patterns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014, ADR-0017]
---

# Cross-Domain Failure and Recovery Patterns

## Canonical experience vocabulary candidate

| State | Meaning | Required user evidence | Recovery owner |
|---|---|---|---|
| Draft | not committed | unsaved/saved version and owner | initiating domain |
| Pending | accepted, outcome not final | operation ID, next check, cancel policy | owning domain |
| Queued offline | device holds unsent command | captured time, limits, expiry, sync status | client/offline plus domain |
| Unknown | external outcome cannot be proven | last evidence, do-not-repeat guidance | provider adapter/reconciliation |
| Stale | projection may lag source | watermark and refresh path | projection owner |
| Conflicted | concurrent valid changes require choice | versions, diff, consequences | owning domain/reviewer |
| Partially completed | some scoped items succeeded | item outcomes and safe retry subset | owning domain |
| Needs review | deterministic policy cannot finish | evidence, priority, owner, SLA | owning domain queue |
| Rejected | command did not commit | reason, correction path, retained draft | owning domain |
| Reversed/compensated | prior fact remains and is counteracted | original/correction link and net effect | owning domain |

## Repeated market failures

False success, generic failure, silent retry, destructive correction, last-write-wins, lost partial outcomes, stale projections presented as live, notifications presented as completion, and opaque audit trails recur across product categories. Research does not establish prevalence; it establishes a reusable threat model.

## Recovery rules

- Never guess an external outcome; query and reconcile.
- Reuse operation identity and idempotency scope.
- Preserve original evidence and every committed consequence.
- Separate transport delivery, provider acceptance, domain commitment, projection refresh and notification.
- Give every review state an accountable owner, age, priority, next action and escalation.
- Use compensation for consequential facts; “rollback” is reserved for truly reversible effects.

## Evidence and confidence

High confidence in the control model. Prototype timeout, replay, out-of-order webhook, duplicate scan, partial bulk action, offline expiry, concurrent edit, late settlement, stale search, and restore/rebuild scenarios before standardizing UI language.

