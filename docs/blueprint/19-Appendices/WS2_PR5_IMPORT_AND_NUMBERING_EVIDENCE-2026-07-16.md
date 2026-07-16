---
document_id: PDA-APP-024
title: WS2 PR5 Import and Online Numbering Evidence
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0016, ADR-0020, ADR-0027]
---

# WS2 PR5 Import and Online Numbering Evidence

## Evidence boundary

This record covers issue #71 at controlled-prototype depth: bounded server-side UTF-8 CSV imports for Product and opening stock, and Strict Online Numbering. It does not claim XLSX support, production malware-provider approval, production operations readiness, offline range leasing, configurable reset/rollover, fiscal numbering certification, production roles/RLS, or WS2 completion. RR-007 remains open.

## Implemented import evidence

| Requirement | Executable evidence |
|---|---|
| Contract parity | Ten import operations have distinct create/read/approve/download permissions and matching OpenAPI, oRPC, generated contract, endpoint manifest, and router bindings. |
| Bounded input | One UTF-8 `text/csv` payload; 1 MiB, 1,000-row, 100-column, and 10,000-character field bounds; explicit delimiter, quote, newline, locale, decimal separator, timezone, and optional default unit. XLSX is rejected by contract. |
| Content safety | SHA-256 is verified before persistence; a fail-closed scanner port precedes parsing; the controlled prototype rejects the EICAR marker while a qualified production scanner/provider remains open. Raw CSV is not persisted, logged, emitted, audited, or returned in errors. |
| Dry run | Parsing, normalization, warning/error findings, duplicate source-key rejection, and staging complete before any Catalog Product or Inventory movement command runs. |
| Authority | Transport and direct application boundaries revalidate active context, the target-specific permission, and the target entitlement. The owner-command adapter separately checks `catalog.product.create` or both `inventory.adjustment.create` and `inventory.adjustment.approve` before a wave mutates owner state. Uploaders cannot approve their own import. Correction-report download has a separate permission and Audit record. |
| Domain ownership | Product rows call Catalog's idempotent Product application command. Opening-stock rows call Inventory's idempotent Adjustment create and approval commands; they never write owner tables directly. |
| Recovery | Create and approval commands persist tenant/operation/key receipts in the same import-owner transactions as their lifecycle facts and events. One deterministic wave preserves source order. Every accepted owner effect is followed by a durable row/job/wave checkpoint. A crash injected after an owner effect but before checkpoint replays the stable owner receipt and produces no duplicate Product, event, or number. |
| Retention | A terminal-only purge command deletes normalized rows, findings, and wave staging, records `staging_purged_at`, and preserves the import job, command receipts, owner facts, immutable Inventory movements, and outbox evidence. Scheduling and production retention automation remain operational gates. |
| Privacy | Tenant is derived from current context; job, row, finding, wave, report, and reference lookup use tenant predicates. Foreign and nonexistent IDs share the same not-found behavior. Reports contain only row number, constrained source key, field, severity, and safe code. |
| Events and Audit | Import validation, approval, completion, and failure schemas are registered. Import lifecycle state and outbox append share the import-owner transaction. Consequential approval and report access append allowlisted Audit metadata. |

## Implemented Numbering evidence

`@meridian/platform-numbering` is runtime-neutral. `@meridian/persistence-platform-numbering-postgres` owns only `platform_number_sequence` and `platform_number_allocation`, with its own generated migration history. Allocation uses a tenant/organization/sequence predicate and `FOR UPDATE`, then records the immutable allocation, increments the sequence, and appends `platform.sequence.number-issued.v1` on one checked-out PostgreSQL client and transaction.

The controlled configuration is fixed prefix, decimal padding, increment one, no automatic reset, and Active/Suspended state. Retry with the same tenant, sequence, and idempotency key returns the original allocation. Reuse with a different fingerprint is rejected. Offline leasing, voids, rollover, reset policy, and administrative definition APIs remain deferred.

## Live PostgreSQL 18 evidence

The disposable import suite proves the two PDA-TST-013 synthetic tenant boundaries, mixed valid/warning/rejected/duplicate/corrected rows, Product dry run, Catalog command commit, completed-import replay, opening-stock Inventory movement, tenant non-disclosure, raw-content absence, an injected owner-effect/checkpoint crash, deterministic resume, and terminal staging purge without erasing owner/event evidence. Result: **5 passed, 0 failed, 18 expectations**.

The serial persistence suite proves repeat migrations and exact owner histories, 20 concurrent unique Numbering allocations with values 1–20, idempotent replay without increment, and injected outbox rollback leaving zero allocation rows and the sequence at zero. The full suite result after PR5 additions is **12 passed, 0 failed, 79 expectations**.

The complete live PostgreSQL composition lane passes **51 tests, 0 failures, and 517 expectations** across Audit/session, Catalog, Import, Inventory, serial persistence, and WS2 ledger-spike suites. The approved Node fallback then executes the ten-owner migration, Import receipt lookup, Numbering allocation/replay, and WS1 critical checks successfully against a clean validation database.

The exact commands are:

```bash
bun test ./apps/server/composition/imports.integration.test.ts
bun test ./apps/server/composition/persistence.integration.test.ts
```

Final exact-head CI, migration freshness for all ten owners, Bun tests, Node fallback checks, architecture probes, generated registries/contracts, and documentation validation remain mandatory before independent concurrence or merge.

## Residual risks and deferrals

- A cross-owner effect and import checkpoint cannot share one owner transaction. Stable owner-command idempotency closes the crash window; the checkpoint provides progress and reconciliation evidence.
- The controlled scanner seam is not production malware-provider evidence.
- Staged normalized rows are Confidential. Terminal purge behavior is executable at prototype depth; production scheduling, legal/privacy retention configuration, deletion-journal integration, and restore/purge exercises remain open before pilot.
- Large files, object storage, streaming parser technology, XLSX, transformations, pricing, customer/supplier imports, and export packages are deferred.
- Strict Online Numbering is not evidence for WS5 offline ranges or jurisdiction-specific fiscal numbering.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-07-16 | Platform Design Authority | Added command-receipt use, owner-permission checks, two-tenant mixed/corrected fixtures, injected cross-owner crash recovery, and terminal staging-purge evidence while retaining production scheduling and retention gates. |
| 0.1.0 | 2026-07-16 | Platform Design Authority | Added the WS2 PR5 bounded import, owner-command, privacy, recovery, migration, concurrency, rollback, and online Numbering evidence boundary. |
