---
document_id: PDA-OPS-015
title: Service Catalog and Runbook Index
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Service Catalog and Runbook Index

## Purpose

Define the operational catalog required for every critical platform service and capability, including ownership, dependencies, SLOs, dashboards, alerts, runbooks, support, recovery, and customer impact.

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

Implemented controlled-prototype runbook: [Event Backbone Delivery Runbook](./EVENT_BACKBONE_DELIVERY_RUNBOOK.md) (PDA-OPS-018). Its production SLO, alert, role/RLS, capacity, and exercise gates remain open.

## Change History

| Version | Date | Author | Change |
|---|---|---|---|
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
