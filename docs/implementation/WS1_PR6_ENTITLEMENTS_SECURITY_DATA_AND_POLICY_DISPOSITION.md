---
document_id: PDA-IMPL-004
title: WS1 PR6 Entitlements Security, Data, and Policy Disposition
version: 0.1.0
status: Draft
owner: Platform Entitlements
last_reviewed: 2026-07-14
related_adrs: [ADR-0002, ADR-0003, ADR-0016, ADR-0020, ADR-0027]
review_evidence: []
---

# WS1 PR6 Entitlements Security, Data, and Policy Disposition

## Purpose and lifecycle

Record the ownership, scope, runtime policy, persistence, security, privacy, migration, and evidence disposition for the PDA-RDM-008 PR6 controlled prototype. This document does not promote PDA-PLT-005, PDA-COM-001, PDA-COM-003, PDA-PLT-027, or ADR-0027 beyond their recorded lifecycle and does not claim pilot or production readiness.

Canonical capability `platform.entitlements` is implemented by runtime-neutral package `@meridian/platform-entitlements`. Platform Entitlements owns effective runtime capability access, its current-state records, change history, and internal change command. Commercial Control Plane and Platform Subscription processes may propose changes but do not decide runtime access. Better Auth, canonical permissions, feature flags, plan labels, provider products, and UI visibility cannot create an entitlement.

## Runtime decision model

Every decision reloads the current tenant and optional organization entitlement set through an injected state port. An exact organization record overrides the tenant-wide record, including when that organization record is suspended or revoked; evaluation never falls back to a broader grant after a narrower denial. Trial and Active permit read and write. Grace permits reads and produces a distinct read-only outcome for writes. Pending, Suspended, Expired, Revoked, Archived, future-dated, and time-expired records deny access.

Dependencies and exclusions use canonical capability IDs generated from `registry/capabilities.json`. Dependencies are evaluated recursively and fail closed on absence or cycles. Write access requires dependencies that are themselves write-capable; a Grace dependency cannot silently support a write. A currently available exclusion denies the target capability. PR6 implements bounded hard integer limits: when supplied projected usage exceeds a named limit, the evaluator returns `limit_reached`. Soft warnings, overage, approval-required, contract-review, and authoritative usage metering remain named seams rather than being approximated by the hard-limit prototype.

Generated registry membership is only the controlled-prototype identifier allowlist; it does not make a Draft capability commercially sellable or production-approved. Production grants remain blocked until the capability's authoritative source reaches an allowed lifecycle with review evidence and all Commercial gates are satisfied.

Permission and entitlement evaluation are independent. `GET /v1/entitlements` requires authenticated active context plus `platform.entitlement.read`, but inspecting the entitlement ledger does not require an entitlement to itself. Conversely, permission allow does not satisfy `requireEntitlement`. The generic evaluator/guard is independently composable at application-operation boundaries; PR6 does not attach speculative capability IDs to unrelated existing endpoints. PR8 owns governed client rendering, and later domain PRs must declare their canonical endpoint-to-capability enforcement points before binding this guard.

## Governed change command and event behavior

There is no public entitlement write endpoint in PR6. All prototype setup and tests use the internal `change` command. The command:

- rejects identifiers absent from the canonical capability registry;
- requires tenant or organization scope, state, source, effective dates, and a reason;
- requires a non-empty reason and expiry for ManualGrant sources;
- validates non-negative integer hard limits and ordered effective dates;
- uses tenant-scoped idempotency receipts and optimistic version checks;
- atomically saves current state, appends immutable change history, appends one canonical outbox event, and completes the receipt;
- rolls back all four effects if any step fails.

New Trial, Active, or Grace records emit `platform.entitlement.activated.v1`; transitions to Expired emit `platform.entitlement.expired.v1`; other creations or changes emit `platform.entitlement.changed.v1`. Their governed JSON Schemas are registered under `schemas/events/`. Event payloads contain the entitlement ID, canonical capability, optional organization, state, dates, version, and safe change-field names. They omit commercial plan names, source references, grant reasons, limit values, actor contact data, credentials, tokens, and payment facts.

## Authoritative data controls

| Table | Owner and purpose | Tenant/scope controls | Classification and retention | Offline and audit implication |
|---|---|---|---|---|
| `platform_entitlement` | Platform Entitlements current runtime state | `tenant_id NOT NULL`; tenant/id primary key; tenant/scope/capability uniqueness; nullable organization plus normalized scope key | Confidential; retain while effective and through governed contract/security evidence periods; state change never deletes customer domain data | online authority; future offline clients consume only signed, expiring leases |
| `platform_entitlement_change` | append-only version history and confidential reason | `tenant_id NOT NULL`; tenant/id primary key; tenant-preserving FK to entitlement | Confidential; reason and snapshot follow entitlement/security-evidence retention and privacy transformation policy | PR7 audit may project governed facts but does not replace this owner history |
| `platform_entitlement_command_receipt` | idempotency and concurrent-command serialization | tenant/operation/idempotency primary key | Confidential; contains fingerprint, resource ID, and result, not free-text reason | online-only retry evidence; committed atomically with state and outbox |

No table has a foreign key to another owner. Tenant and organization identifiers cross the boundary as stable identifiers and are resolved through published application contracts at the server composition root. Architecture rules v0.8.0 register all three tables and the owner-specific migration stream.

## API, privacy, and customer inspection boundary

The canonical OpenAPI and Zod response expose capability ID, tenant/optional organization scope, state, source category, dates, dependencies, exclusions, bounded hard limits, and version. The API never accepts tenant authority from the body or an ad hoc tenant header; it derives tenant scope from the revalidated active context. The repository list query always carries the resolved tenant key.

The source field is a category (`PlatformSubscription`, `ManualGrant`, `Trial`, `Migration`, `AddOn`, `Contract`, or `PartnerPolicy`), not a plan or provider identifier. Commercial source-reference detail, renewal consequences, usage meters, downgrade previews, and customer-facing explanations require later Commercial and UX contracts. Free-text reasons are retained only in the owner change-history table and are not returned by this read surface or published in events.

## RLS and offline lease disposition

PostgreSQL RLS remains **deferred for the controlled prototype, not rejected**, under PDA-IMPL-002, PDA-IMPL-003, and PDA-DAT-017. Current application and CI connections use the owner role, so policy text alone would be bypassed and would create false evidence. Compensating controls are mandatory tenant columns, server-derived active context, tenant-filtered repositories, narrower-scope override semantics, two-tenant negative tests, atomic owner transactions, migration freshness, and architecture enforcement.

Signed expiring offline entitlement leases are required by PDA-PLT-005 and PDA-COM-003 but remain a WS5 seam. PR6 does not serialize an unsigned snapshot, treat cached policy as current authority, or claim offline enforcement. Pilot and production remain blocked on approved lease format/signing/key rotation, clock-skew and expiry policy, reconciliation behavior, non-owner application database roles, executable RLS denial tests, and restore/incident exercises.

## Executable evidence and bounded gaps

- `packages/contracts/capabilities/src/index.ts` is generated from the canonical capability registry, and contract freshness prevents invented runtime IDs.
- `packages/platform/entitlements/src/index.test.ts` proves current-state reload, tenant/organization override behavior, state/date denial, Grace read-only, dependency/exclusion/limit enforcement, and permission-entitlement independence.
- `packages/persistence/platform-entitlements-postgres/src/schema.test.ts` proves the exact registered table ownership and mandatory tenant columns.
- `apps/server/src/router.test.ts` proves the governed read procedure and active-context contract surface.
- `apps/server/composition/persistence.integration.test.ts` proves serial/repeat migrations, internal-command-only setup, idempotent replay, two-tenant denial, hard limits, atomic owner state/history/receipt/outbox rollback, and current PostgreSQL evaluation.
- The Node fallback verifies the expanded migration/table surface. Registry, contract, architecture, secret, dependency, image, and live-stack gates remain mandatory in CI.

PR7 implements authoritative audit storage, audit-of-access, entitlement administrative audit projection, and measured session revocation. PR8 renders capability and denial states without using UI visibility as authority. PR9 owns performance, capacity, recovery, full Bun/Node critical-path coverage, and consolidated WS1 evidence closeout. Public grant management, usage-meter ownership and correction, soft/overage/approval limits, downgrade preview, signed offline leases, Commercial write integration, RLS, and customer-facing renewal consequences remain explicit future work.

## Governing sources

- PDA-PLT-005, PDA-COM-001, PDA-COM-003, PDA-PLT-004, PDA-PLT-027
- PDA-RDM-008
- ADR-0002, ADR-0003, ADR-0016, ADR-0020, ADR-0027
- PDA-ENGR-012, PDA-ENGR-014, PDA-DAT-017
- PDA-IMPL-001, PDA-IMPL-002, PDA-IMPL-003
- `registry/capabilities.json`, `registry/permissions.json`, `registry/endpoint-permissions.json`, `registry/events.json`, `registry/architecture-rules.json`
