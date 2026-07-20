---
document_id: PDA-CIR-083
title: Cross-Domain Workflow Patterns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0010, ADR-0014]
---

# Cross-Domain Workflow Patterns

## Purpose and boundary

These are reusable mechanics, not a generic domain that owns business facts. Every use must name the owning domain, canonical capability/permission/event, first-slice depth, and offline/security/privacy constraints.

## Reusable workflow grammar

1. **Resolve context:** tenant, organization, location, role, device, timezone, currency, jurisdiction, entitlement and permission.
2. **Capture intent:** create a durable command/draft identity, validate input, preserve source and show consequences.
3. **Preview:** calculate diff, affected records, rule/policy version, uncertainty and irreversible effects.
4. **Approve when required:** accountable reviewer, scope, separation, expiry, delegation and reason.
5. **Commit in owning domain:** reauthorize at execution, enforce invariants, write authoritative facts and outbox evidence.
6. **Propagate:** projections/search/analytics/notifications declare freshness; external delivery uses governed contracts.
7. **Recover:** retry idempotently, reconcile unknowns, review conflicts and compensate consequential facts.

## Shared mechanics

| Mechanic | Reused by | Boundary |
|---|---|---|
| search/select | all domains | permission-scoped projection; source remains owner |
| import mapping/preview | catalog, finance, parties, workforce | manifest, row outcomes, idempotency, rollback/compensation |
| review queue | accounting, payments, inventory, service, AI | shared assignment/evidence only; domain validates/commits |
| approval | purchasing, journals, payroll, access, automation | typed decision against exact version |
| activity/history | all consequential workflows | readable operational view distinct from immutable audit |
| correction | finance, stock, payment, stored value, payroll | reversal/compensation/effective date; never generic delete |
| bulk action | admin, catalog, operations | explicit selection scope, preview, partial failure |
| offline work package | POS, warehouse, field service, time | signed lease, limits, idempotency, conflict and reconciliation |

## Evidence requirements

Each transfer requires accessible desktop/mobile states, tenant isolation, performance bounds, audit/redaction, error/recovery tests, AI-disabled behavior where relevant, and domain-specific invariant tests. Shared UI does not imply shared persistence.

## Confidence and contradictions

High for repeated mechanics; medium for a single component/API implementation. Domain-specific differences may outweigh reuse, especially financial correction, payroll, warehouse concurrency, and regulated evidence.

