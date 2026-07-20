---
document_id: PDA-OPS-015
title: Service Catalog and Runbook Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Service Catalog and Runbook Index

## Purpose

Define the operational catalog required for every critical platform service and capability, including ownership, dependencies, SLOs, dashboards, alerts, runbooks, support, recovery, and customer impact.

`registry/operational-readiness.json` is the machine-readable status register for implemented controlled-prototype services. Its evidence cutoff is merged `main` `7202fc819b70982c013e1ca11a4fcc136e01e2de`, including Event Backbone PR #74. PDA-OPS-019 supplies bounded cross-service procedures for the web, API/authority, PostgreSQL, Catalog, Inventory, and outbox behavior; PDA-OPS-018 supplies the focused Event Backbone delivery procedure. Neither artifact supplies missing dashboards, tested alerts, exercises, escalation contacts, or pilot authority.

## Readiness States

- `requirements-only`: service requirements exist, but no executable service procedure is registered.
- `procedure-draft`: a bounded procedure references implemented behavior; independent review, telemetry, alerts, and exercises may remain open.
- `reviewed`: the service owner and Operations reviewed the exact procedure version; this is not exercise evidence.
- `exercised`: the reviewed procedure has dated execution evidence and residual findings.
- `pilot-ready`: all required runbooks, dashboards, tested alerts, escalation, recovery/reconciliation, and exercises pass the pilot gate. A registry validator rejects this state without evidence.

## Service Record

Every service records:

- Service identifier and name
- Owning team or accountable person
- Business capabilities supported
- Critical user workflows
- Runtime and deployment mode
- Data owned and classification
- Upstream and downstream dependencies
- External providers
- SLOs and error budgets
- Capacity and cost signals
- Dashboards and alerts
- Runbooks
- Backup and recovery
- Security and privacy controls
- Support and escalation
- Change and release policy
- Status-page component
- Customer communication owner

## Initial Critical Services

- Web application shell
- API and application runtime
- Better Auth and Platform Identity
- Authorization and entitlement policy
- PostgreSQL authoritative data
- Event outbox and event delivery
- Jobs and queues
- Device and offline synchronization
- Product search
- Files and receipts
- Commerce and POS
- Inventory ledger
- Payment orchestration
- Stored-value ledger
- Privacy and deletion journal
- Export and Finance handoff
- Observability
- Backup and recovery

Only merged services enter the implemented-service portion of the registry. Unimplemented services remain in its deferred list with an admission trigger; documentation must not fabricate their operational procedure.

## Registered Controlled-Prototype Services

| Service ID | Service group | Procedure | Readiness | Material remaining gates |
|---|---|---|---|---|
| `OPS-SVC-001` | Web application shell | PDA-OPS-019 CP-RUN-001 | `procedure-draft` | Dashboard, alert, escalation, outage exercise |
| `OPS-SVC-002` | API, identity, tenancy, authority, Party, and Audit | PDA-OPS-019 CP-RUN-001 | `procedure-draft` | Security/Operations review, authority SLIs, incident exercise |
| `OPS-SVC-003` | PostgreSQL and migrations | PDA-OPS-019 CP-RUN-002 | `procedure-draft` | Production role/RLS topology, capacity, backup/restore/PITR/failover evidence |
| `OPS-SVC-004` | Catalog, Inventory, and transactional outbox owner behavior | PDA-OPS-019 CP-RUN-003 | `procedure-draft` | Imports, UI/accessibility, repair tooling, correctness alerts, WS2 closeout |
| `OPS-SVC-005` | Event Backbone delivery, replay, and Catalog/Inventory projections | PDA-OPS-018 | `procedure-draft` | Runbook review, production SLO/capacity/multi-replica evidence, dashboards, alerts, exercises |

The PR #74 implementation audit and exact-head CI are implementation evidence for `OPS-SVC-005`; they are not Operations review of the runbook and do not satisfy the `reviewed`, `exercised`, or `pilot-ready` states.

## Required Runbooks

At minimum:

- Authentication outage
- Database saturation or failover
- Event backlog
- Job backlog
- Search indexing lag
- Object-storage failure
- Payment provider uncertainty
- Stored-value mismatch
- Cash and deposit reconciliation
- Offline synchronization backlog
- Privacy target failure
- Webhook dead letters
- Secret or key compromise
- Deployment rollback
- Restore and failover
- Tenant suspension and recovery
- Data repair

Implemented controlled-prototype runbooks:

- [Controlled-Prototype Service Runbooks](./CONTROLLED_PROTOTYPE_SERVICE_RUNBOOKS.md) (PDA-OPS-019) for `OPS-SVC-001` through `OPS-SVC-004`.
- [Event Backbone Delivery Runbook](./EVENT_BACKBONE_DELIVERY_RUNBOOK.md) (PDA-OPS-018) for `OPS-SVC-005`.

Their independent Operations review, production SLO, dashboard, alert, role/RLS, capacity, recovery, escalation, and exercise gates remain open as applicable.

Implemented controlled-prototype runbook: [Import and Online Numbering Recovery Runbook](./IMPORT_AND_NUMBERING_RECOVERY_RUNBOOK.md) (PDA-OPS-019). A tenant-scoped, permissioned operator purge API exists for eligible terminal staging; production scheduling, legal-hold/deletion-journal integration, restore/purge exercises, scanner/provider approval, fiscal policy, offline ranges, SLOs, alerts, and production role/RLS gates remain open.

## Change History

| Version | Date | Author | Change |
|---|---|---|---|
| 0.4.0 | 2026-07-20 | Platform Design Authority | Registered `OPS-SVC-001`-`OPS-SVC-005` and linked each controlled-prototype service to its procedure, retaining every review, telemetry, recovery, and exercise gate. |
| 0.3.0 | 2026-07-16 | Platform Design Authority | Reconciled the reachable audited operator purge with the still-open scheduler, legal-hold/deletion-journal, restore, and production operations gates. |
| 0.2.0 | 2026-07-16 | Platform Design Authority | Linked the WS2 controlled-prototype import/wave and Strict Online Numbering recovery runbook without claiming production operations readiness. |
| 0.1.1 | 2026-07-15 | Platform Design Authority | Linked the WS2 controlled-prototype Event Backbone delivery runbook without claiming production operations readiness. |

## Runbook Contract

Every runbook includes trigger, impact, prerequisites, safe diagnostic steps, dashboards, containment, recovery, reconciliation, communication, escalation, evidence, rollback, and closure criteria.

Runbooks must not require operators to expose secrets, bypass tenant isolation, or perform unexplained direct database edits.

## Support Tiers

- Critical: blocks core financial, identity, privacy, or tenant-safety workflows
- Important: degrades material customer work with a workaround
- Standard: bounded noncritical failure
- Informational: maintenance or advisory

Support severity maps to operational incident severity but remains distinct from customer priority or commercial tier.

## Quality Gates

- Named owner for every production service
- SLO and dashboard before pilot
- At least one runbook for every critical failure mode
- Recovery and reconciliation evidence
- Status-page mapping
- Support and escalation contact
- Quarterly catalog review and after major architecture changes
