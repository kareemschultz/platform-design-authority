---
document_id: PDA-OPS-018
title: Controlled-Prototype Service Runbooks
version: 0.1.0
status: Draft
owner: Platform Operations
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0016, ADR-0027]
document_class: operations-runbook
declared_depth: prototype-ready
evidence_state: implemented
applicable_dimensions: [authority-and-scope, data-and-integrity, contracts-and-compatibility, authority-controls, offline-and-degraded, failure-and-recovery, security-and-privacy, verification-and-evidence, references-and-traceability]
---

# Controlled-Prototype Service Runbooks

## Purpose and Authority Boundary

Provide executable, bounded response procedures for the services that exist on merged `main` through WS2 PR3: the web shell, API/application runtime, Better Auth and Platform Identity boundary, authorization and entitlements, the composition-owned PostgreSQL database, transactional outbox storage, Party, Catalog, Inventory, and Audit behavior.

These are Draft controlled-prototype procedures. They do not prove production observability, on-call coverage, backup recovery, failover, provider response, contractual SLOs, or pilot readiness. `registry/operational-readiness.json` is the status register. A missing dashboard, tested alert, escalation contact, or exercise remains a blocker; this document is not substitute evidence.

## Universal Safety Rules

1. Establish the affected environment, tenant scope, time window, release SHA, and incident commander before mutation.
2. Prefer read-only health, metadata, aggregate-count, and synthetic-account checks. Never copy credentials, session cookies, raw request bodies, personal data, full Catalog text, Inventory reasons, or audit payloads into tickets or chat.
3. Do not trust tenant, organization, or location identifiers supplied by a browser report. Revalidate scope through ordinary application authority.
4. Do not edit Better Auth tables, domain tables, command receipts, outbox rows, audit records, or migration journals by hand.
5. Financial, inventory, stored-value, cash, and audit corrections require governed reversal or compensation. No runbook authorizes destructive fact repair.
6. Stop and escalate when the safe procedure cannot prove tenant isolation, when reconciliation diverges, when evidence may be legally relevant, or when the action would exceed the controlled local prototype.
7. Preserve command output with secrets removed, exact timestamps, correlation identifiers, image/commit identifiers, and the operator identity. Do not preserve confidential vendor terms or protected data in a public artifact.

## Shared Evidence Record

Every execution records:

- incident or exercise ID, start/end time, environment, release SHA, and accountable operator;
- affected service IDs from `registry/operational-readiness.json`;
- detection source and the exact first failing signal;
- affected capabilities, permissions, events, tenants, and workflows, using counts rather than protected values;
- commands run and their exit codes, with secrets and protected payloads removed;
- containment, recovery, reconciliation, verification, communication, and rollback decisions;
- unresolved findings, owner, due date, and evidence path.

Until an approved evidence store exists, executions remain outside this repository unless a sanitized governed evidence document is intentionally reviewed and registered.

## Runbook CP-RUN-001 — Web, API, Authentication, or Authority Failure

### Scope and Contracts

- Services: `OPS-SVC-001` and `OPS-SVC-002`.
- Capabilities: `platform.administration`, `platform.authentication`, `platform.identity`, `platform.tenancy`, `platform.organizations`, `platform.authorization`, `platform.entitlements`, `platform.audit`, and `party.records`.
- Authority checks include `platform.organization.read`, `platform.role.read`, `platform.entitlement.read`, `platform.audit.read`, `platform.user.read`, and `party.record.read` as applicable. A runbook never grants these permissions.
- Relevant facts include `platform.session.revoked.v1`, `platform.membership.suspended.v1`, `platform.role-assignment.granted.v1`, `platform.entitlement.changed.v1`, and Party creation/link facts. Outbox presence is not delivery evidence.
- Runtime seams: web `/`, API `/health`, Better Auth `/api/auth/*`, and governed oRPC/OpenAPI operations under `/rpc` and `/api-reference`.

### Trigger and Impact

Use this runbook when the Compose web or server healthcheck is unhealthy; the shell cannot load; authenticated synthetic access fails; sessions are not recognized or revoked; or authority decisions unexpectedly deny, allow, or cross scope. `/health` is liveness only: it performs no database or authentication round trip and cannot close an incident by itself.

### Safe Diagnosis

1. Record `git rev-parse HEAD`, deployed image identifiers, and the environment. Do not print environment variable values.
2. Run `docker compose ps` and preserve service health, restart count, and start time.
3. Request `http://localhost:3000/health` and `http://localhost:3001/` from the controlled host. A successful API liveness response proves only the process/HTTP shell.
4. Inspect bounded recent logs with `docker compose logs --since=15m --tail=200 server web`. Stop if logs contain protected values; sanitize before preservation.
5. Check PostgreSQL separately with `docker compose exec -T postgres pg_isready -U postgres -d meridian`.
6. Using a disposable synthetic user only, reproduce one authenticated Administration request and record status, time, and correlation ID. Do not use a customer account.
7. Classify the failure as web-to-server routing, API process, database reachability, authentication/session, active-context validation, permission, entitlement, or application-owner behavior. Do not infer one class from another.

### Containment and Recovery

- If only the web process is unhealthy and API plus PostgreSQL checks pass, restart only the web service. Verify the same image and environment are retained.
- If the API process is unhealthy but PostgreSQL is reachable, stop ordinary prototype use, restart only the server, and verify database-current session/authority behavior with the synthetic account.
- If authentication or authority produces an unexplained allow, cross-tenant result, or stale-suspension result, stop affected writes and treat the incident as Security severity until Security dispositions it. Restarting is not a sufficient correction.
- If a release introduced the failure, use the governed deployment rollback procedure to the last exact known-good image. Do not rebuild an old mutable tag.
- Never delete sessions or alter memberships, roles, assignments, entitlements, Party links, or Audit rows directly. Use ordinary application commands only after the cause and authority are established.

### Verification, Escalation, and Closure

Verify web liveness, API liveness, PostgreSQL reachability, synthetic sign-in/session lookup, active-context revalidation, one permitted read, one denied read, and absence of cross-tenant disclosure. Escalate immediately to Security for suspected unauthorized access or protected-data exposure, to Data Platform for database faults, and to the relevant owner for application behavior. The register intentionally has no production paging contacts yet, so the pilot gate remains closed.

Close only after the original signal and a business-path check pass, no unexplained authority outcome remains, the affected time window is recorded, and follow-up work has owners. A successful liveness probe alone cannot close the runbook.

## Runbook CP-RUN-002 — PostgreSQL Health or Migration Failure

### Scope and Contracts

- Service: `OPS-SVC-003`.
- Runtime authority: ADR-0027; only the server composition owns the pool and serial migration execution.
- Migration order: Platform Identity, Tenancy, Entitlements, Audit, Events, Party, Numbering, Catalog, then Inventory, as encoded in `apps/server/composition/migrations.ts`.
- Authoritative data includes tenant-scoped Platform, Party, Catalog, and Inventory state plus command receipts and outbox storage. Rebuildable projections are not present on merged `main`.

### Trigger and Impact

Use this runbook for failed PostgreSQL health, connection refusal or saturation, a failed named migration stream, unexpected schema drift, repeated transaction failures, or storage pressure. The prototype has no proven failover, PITR, replica, or production role/RLS topology.

### Safe Diagnosis

1. Stop new prototype write activity and record the release SHA, database image digest, failing operation, and first error time.
2. Run `docker compose ps postgres` and `docker compose exec -T postgres pg_isready -U postgres -d meridian`.
3. Inspect bounded PostgreSQL and server logs. Preserve SQLSTATE, migration stream name, connection symptoms, and timestamps; do not preserve statement parameters or protected rows.
4. Check the current migration source with `git diff --exit-code -- packages/persistence/*/src/migrations` and run `bun run db:generate` only in a clean development checkout. Generated migrations are never hand-edited.
5. For a migration failure, identify the failing owner stream from `Migration stream <id> failed`. Do not blindly rerun until the owner confirms whether the failed migration is transactional and idempotent at the observed point.
6. For suspected capacity pressure, record connection count, database size, and aggregate activity only through reviewed read-only queries. The current repository has no approved production diagnostic SQL pack, dashboard, or threshold.

### Containment and Recovery

- Keep the database off the public host network and do not weaken authentication or tenant predicates to restore service.
- For a local disposable environment, a fresh database may be created only after explicitly confirming that no required evidence or user data will be destroyed.
- For any retained dataset, take a governed backup before a forward fix. The example in `ops/postgres/README.md` is controlled-prototype guidance, not proof of a restorable backup.
- Apply committed migrations only through `bun run db:migrate`. If a stream has partially changed schema or data, stop for an owner-authored forward-fix plan; do not edit the migration journal or schema manually.
- Do not use the documented `pg_restore --clean` example against an existing or unidentified database. Restore exercises require an isolated fresh target and PDA-DEP-010 privacy/deletion-journal controls.

### Verification, Escalation, and Closure

Verify `pg_isready`, serial migration completion, schema freshness (`bun run db:generate` reports no change), API liveness, a synthetic authenticated read, tenant-isolation tests, and owner-specific integration tests. For Catalog or Inventory migrations also run their exact integration suites in a disposable test database.

Escalate to Data Platform for any retained-data migration failure, corruption, unexplained constraint violation, storage exhaustion, or need for direct SQL repair; to Security for suspected access or tenant-isolation failure; and to Privacy for backup/restore involving deletion or legal-hold state. Close only after the cause, affected streams, backup disposition, reconciliation, and residual risk are recorded. No restore/failover claim is permitted until a dated exercise exists.

## Runbook CP-RUN-003 — Catalog, Inventory, or Outbox Consistency Failure

### Scope and Contracts

- Service: `OPS-SVC-004`.
- Catalog capabilities: `catalog.products`, `catalog.variants`, `catalog.identifiers`, `catalog.barcodes`, and `catalog.lifecycle`. `catalog.bulk-import` is unimplemented and excluded.
- Inventory capabilities: `inventory.stock-ledger`, `inventory.stock-balances`, `inventory.availability`, `inventory.reservations`, `inventory.adjustments`, `inventory.transfers`, `inventory.counts`, and `inventory.offline-movements` at the boundaries recorded in PDA-RDM-009.
- Relevant permissions include `catalog.product.read`, `catalog.product.update`, `catalog.product.activate`, `catalog.product.archive`, `inventory.balance.read`, `inventory.adjustment.read`, `inventory.adjustment.reverse`, `inventory.count.read`, and `inventory.transfer.read`.
- Relevant facts include Catalog Product/Variant/Identifier facts and Inventory adjustment, count, transfer, reservation, and reversal facts in `registry/events.json`. They are transactionally stored in the outbox; merged `main` does not deliver them continuously.

### Trigger and Impact

Use this runbook for duplicate or cross-tenant identifiers, stale Product identity after update, an invalid lifecycle transition, unexplained Inventory balance divergence, negative stock, missing/duplicate movements, transfer non-conservation, count variance disagreement, an unlinked reversal, command replay disagreement, or state committed without its expected outbox record.

Outbox row accumulation is expected before the PR4 worker merges. Do not page on backlog age or count until delivery, retry horizon, dead-letter, and lag alerts exist and are reviewed.

### Safe Diagnosis

1. Stop the affected tenant/workflow from accepting new writes; do not suspend unrelated tenants without authority.
2. Record tenant, organization, location, aggregate IDs, command/idempotency key, correlation ID, versions, and event names in a protected incident record. Do not copy Product text, Inventory reasons, or raw event data to public artifacts.
3. Reproduce through governed read operations with a synthetic or explicitly authorized support context. Compare foreign-tenant access with an absent-record result; never probe another tenant's actual data.
4. For Catalog, verify normalized identifier collision family, Product version, preserved Variant/Identifier IDs, and lifecycle state. Do not delete or reassign identifiers directly.
5. For Inventory, verify immutable movement sequence, exact decimal quantities, linked reversal, transfer dispatched/received/exception conservation, count maker/checker separation, reservation effect on availability, and command receipt outcome.
6. Confirm whether owner state, command receipt, and outbox record committed together. Use aggregate counts and identifiers; do not expose payloads.
7. Run `bun test packages/domains/catalog/src/index.test.ts` or `bun test packages/domains/inventory/src/index.test.ts` for deterministic domain behavior. Use the live PostgreSQL integration suites only against a disposable test database, never a retained incident database.

### Containment and Recovery

- Deny or pause the affected command path while keeping safe reads available where tenant/privacy boundaries remain trustworthy.
- Use the ordinary Catalog command with the current expected version for a valid correction. Archived records remain governed by lifecycle rules.
- Inventory facts are never updated or deleted. Use `inventory.adjustment.reverse` for an authorized linked inverse; a different correction requires a domain-approved compensating command that exists in the contract.
- The owner adapter has a balance-rebuild function, but merged `main` exposes no operator CLI. Do not invoke internal code or write SQL as an ad hoc repair. Escalate for a reviewed, tenant-scoped repair tool and evidence plan.
- Do not delete, retry, or mark outbox rows delivered. Durable delivery/replay authority remains open PR #74 and `platform.event.replay` is not an operator shortcut.

### Verification, Escalation, and Closure

Verify the original business invariant, idempotent repeat outcome, exact quantity conservation, linked reversal where used, tenant non-disclosure, command receipt, outbox atomicity, and Audit evidence. Run the relevant domain, contract, architecture, and PostgreSQL integration suites against a clean test database. Escalate to Catalog or Inventory owner, Data Platform, Security, Audit/Privacy, and Finance when classification or accounting consequences require them.

Close only when zero unexplained divergence remains, the correction used a governed command, affected projections/consumers are either absent or reconciled, the tenant impact window is known, and a regression test or explicit residual-risk item exists. This runbook cannot close missing PR4 delivery, PR6 UI/accessibility, PR7 exercise, or production recovery gates.

## Known Missing Operational Evidence

The following are deliberate blockers in `registry/operational-readiness.json`:

- production telemetry backend, dashboards, alert routes, tested alert evidence, and named on-call escalation;
- authentication-provider and customer communication procedures;
- PostgreSQL backup, PITR, restore, failover, capacity, RPO, and RTO exercises;
- Event Backbone worker delivery, retry, dead-letter, replay, projections, and its PR #74 runbook until merged;
- Catalog/Inventory UI, import, numbering, operator repair tooling, and formal accessibility evidence;
- penetration, privacy, security incident, tenant exit, offline continuity, and disaster-recovery exercises.

These gaps prevent `pilot-ready` or `exercised` status regardless of prose completeness.
