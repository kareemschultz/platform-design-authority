---
document_id: PDA-CIR-026
title: ERP Cross-Domain Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0007, ADR-0016, ADR-0019]
---

# ERP Cross-Domain Workflow Reference

## Purpose

Define evidence-backed workflow mechanics that recur across ERP administration without creating a generic ERP domain. Research cutoff is 2026-07-16; all Mermaid-free sequences are original synthesis.

## Authority boundary

Platform Kernel owns tenant, organization, location context, permissions, entitlements, audit, import/export services, jobs, search, and notification seams as governed. Party owns canonical identity. Each domain owns its records and commands. A cross-domain workflow coordinates owners; it never mutates their private data.

## Workflow 1 — enter and switch operating context

1. Authenticate through the governed identity boundary.
2. Resolve permitted tenant, organization, legal entity, and location choices.
3. Display active context before consequential work.
4. On switch, re-evaluate permission and entitlement independently.
5. Invalidate context-bound drafts, caches, search results, and background subscriptions where unsafe.
6. Record the switch and reason when policy requires it.
7. Return the user to a role workspace whose contents are filtered by effective context.

Failure states: no valid context, stale membership, removed entitlement, offline lease mismatch, unsaved draft, and a job still bound to the previous context. Never silently retain the old location for a new transaction.

## Workflow 2 — guided capability setup

| Phase | Required behavior | Evidence created |
|---|---|---|
| Assess | Show owner, prerequisites, scope, data impact, and deferrals | Readiness assessment |
| Configure | Save versioned drafts with permission checks | Configuration draft and audit |
| Validate | Dry-run rules against synthetic or safely scoped data | Validation report |
| Approve | Apply separation of duties where consequence warrants it | Approval decision |
| Activate | Recheck context, entitlement, version, and dependencies | Activation command and events |
| Observe | Expose jobs, errors, metrics, and rollback/disable action | Operational evidence |

Configuration is not a substitute for a founder, legal, security, or provider decision.

## Workflow 3 — import or migration

1. Choose owning record family and target context.
2. Download a versioned template or map a public contract.
3. Upload through the Developer Platform import boundary.
4. Malware-scan, hash, classify, and retain source evidence.
5. Parse into a staging model; do not write owner tables yet.
6. Validate required identifiers, units, money, dates, duplicates, and referential dependencies.
7. Preview creates, updates, skips, conflicts, and rejected rows.
8. Obtain approval when policy requires it.
9. Execute idempotent owner commands in bounded batches.
10. Publish owner events through the transactional outbox.
11. Reconcile counts and hashes; make row-level errors downloadable under authorization.
12. Correct by an owner-supported reversal, compensation, or new import—not private-table edits.

## Workflow 4 — cross-domain approval

The owning domain creates a proposal with stable identity and version. The Approval Engine evaluates the configured route, but the owner validates whether the approved proposal may execute. Approvers see consequence, evidence, conflicts, prior actions, and scope. Approval expiry or owner-state change returns the item for re-evaluation. A shared inbox references the proposal; it does not own the business transition.

## Workflow 5 — background job and exception recovery

Every job records tenant and organization scope, owner, initiating actor/service, idempotency key, input version, attempts, next retry, progress, and terminal outcome. Operators can pause or retry only under permission. A retry revalidates current authority and must not duplicate business effect. Poison work is quarantined with redacted diagnostics and an owner-specific recovery command.

## Workflow 6 — upgrade and extension review

Inventory extensions and customizations; compare required contracts; run compatibility, migration, tenant-isolation, accessibility, and rollback tests; stage rollout; observe; and retain a removal condition. ADR-0019 prohibits arbitrary third-party code in the core process. Premium or private source remains outside the repository unless redistribution is explicitly permitted.

## UX mechanics to adopt

Adopt task-oriented workspaces, visible context, favorites/recents, searchable commands, saved views, consequence previews, setup progress, and exception queues. Improve them with deterministic keyboard behavior, responsive transformation, accessible status text, and explicit freshness. Reject nested module trees as the only discovery method.

## Confidence and limitations

Confidence: Medium. The workflow is consistent with official ERP documentation and Meridian authorities, but no full competitor task was independently reproduced. Direct usability, screen-reader behavior, latency, and offline recovery remain unknown.

## Sources

- [ERPNext workflows](https://docs.frappe.io/erpnext/workflows), retrieved 2026-07-16.
- [ERPNext permissions](https://docs.frappe.io/erpnext/permissions), retrieved 2026-07-16.
- [NetSuite multi-subsidiary vendor transactions](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_1509453911.html), retrieved 2026-07-16.
- [SAP Business One handling approval requests](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/3a10e6660d084fa9acd5360b37de3ef9.html), retrieved 2026-07-16.

