---
document_id: PDA-CIR-071
title: Automation Competitive Pattern Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Automation Competitive Pattern Matrix

## Scope

Workflow/automation patterns across Microsoft, Salesforce, ServiceNow, Zapier, GitHub Actions, Linear, and ERP products were synthesized through 2026-07-16. This does not select a workflow runtime; that remains governed by the workflow decision matrix.

| Concern | Mature pattern | Meridian requirement |
|---|---|---|
| trigger | event, schedule, manual or webhook | owning event, version, tenant, dedupe and freshness |
| condition | typed filter/expression | validated inputs, explainable result, test cases |
| action | bounded connector/application command | permission/entitlement at execution and least authority |
| simulation | test data, preview, dry run | no side effects; disclose assumptions and unresolved calls |
| approval | pause and accountable reviewer | expiry, escalation, delegation and immutable decision |
| retry/failure | policy, dead letter, replay | idempotency, backoff, quarantine and owner |
| change | versions, publish, history | draft/published version, migration, rollback or compensation |
| observability | run log, step state, metrics | correlation, redaction, retention and tenant isolation |

## Decisions

Adopt versioned definitions, simulation, bounded approval, explicit run ownership, and replay tooling. Improve with one cross-domain failure vocabulary. Reject arbitrary code in the core process, automation-owned business data, unrestricted connector credentials, invisible retries, and rollback claims for irreversible effects.

## Confidence and sources

Confidence is high for platform controls and low for a runtime choice.

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions) — official documentation, retrieved 2026-07-16.
- [Microsoft Power Automate approvals](https://learn.microsoft.com/en-us/power-automate/get-started-approvals) — official documentation, retrieved 2026-07-16.
- [ServiceNow Flow Designer](https://www.servicenow.com/products/flow-designer.html) — official product documentation, retrieved 2026-07-16.

