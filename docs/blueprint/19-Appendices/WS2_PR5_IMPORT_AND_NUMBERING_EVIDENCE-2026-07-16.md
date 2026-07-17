---
document_id: PDA-APP-024
title: WS2 PR5 Import and Online Numbering Evidence
version: 0.5.0
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
| Contract parity | Eighteen import operations cover create, list, status, paginated findings, approve, cancel, accept, correction report, and purge for both targets. Ten permission IDs separate create/read/approve/download/purge authority with matching OpenAPI, oRPC, generated contract, endpoint manifest, and router bindings. |
| Bounded input | One UTF-8 `text/csv` payload; 1 MiB, 1,000-row, 100-column, and 10,000-character field bounds; exact target header/column count; optional leading BOM; strict declared LF/CRLF; explicit delimiter, quote, locale, decimal separator, timezone, and optional default unit. Locale/timezone are retained provenance in these templates, not an assertion that no-current-field transformations occurred. XLSX is rejected by contract. |
| Content safety | SHA-256 is verified before persistence; a fail-closed scanner port precedes parsing; controlled EICAR input is blocked; NUL/C0/DEL characters, malformed quoting, newline mismatch, and formula-capable prefixes in non-quantity fields are rejected without retaining the unsafe value. A qualified production scanner/provider remains open. Raw CSV is not persisted, logged, emitted, audited, or returned in errors. |
| Dry run | Parsing, normalization, warning/error findings, duplicate source-key rejection, and staging complete before any Catalog Product or Inventory movement command runs. |
| Authority | Transport and direct application boundaries revalidate active context, the target-specific permission, and the target entitlement. The owner-command adapter separately checks `catalog.product.create` or both `inventory.adjustment.create` and `inventory.adjustment.approve` before a wave mutates owner state. Uploaders cannot approve their own import. For opening stock, the uploader remains the staged Adjustment initiator and the current approver is the distinct approval/posting actor, preserving Inventory's maker/checker invariant. Correction-report download and staging purge have separate authority and Audit records. |
| Domain ownership | Product rows call Catalog's idempotent Product application command. Opening-stock rows call Inventory's idempotent Adjustment create and approval commands; they never write owner tables directly. Import creation calls Platform Numbering through a published port; the server composition root binds both Platform adapters without exposing a database handle to either runtime-neutral core. ADR-0027 v0.3.5 records the completed prototype-scope owner sign-off at exact head `7a9e9edbfadfd59ed769d9d780c25fb71bbdb6be`. |
| Recovery | Create, approval, cancel, accept, and per-row commit commands persist tenant/operation/key receipts. Each row receipt stores the safe opaque target result, so a resume checks Import/Export's receipt before any owner invocation; owner idempotency remains a second boundary. The create fingerprint binds the complete parsing manifest as well as content and target. A late row checkpoint is state-guarded and cannot revive `Failed` or `Cancelled`. A deterministic owner-command rejection atomically records terminal job/row/wave failure, a safe code, the approval receipt, and `platform.import.failed.v1`; same-key replay does not invoke the owner again. |
| Lifecycle and reconciliation | Tenant/organization-scoped lists and findings use cursor pagination. Cancellation is version-guarded and pre-commit only. Completion computes `Reconciled` or `Mismatch` from durable row outcomes. Acceptance is idempotent/version-guarded and succeeds only for a completed `Reconciled` job. |
| Retention | The audited, receipt-idempotent tenant-scoped purge API accepts Completed, Failed, or Cancelled jobs only after 30 days from the most recent terminal update and uses an atomic cutoff/not-already-purged predicate. The authorized prototype operator must first verify ADR-0014 hold/deletion-journal policy because no executable Privacy-provider integration exists yet; that manual step is not production control evidence. Purge deletes normalized rows, findings, and waves; records `staging_purged_at`; and preserves the job/reference/reconciliation summary, command receipts, Numbering allocation, owner facts, immutable Inventory movements, and outbox/Audit evidence. Scheduling, policy-provider integration, and exercises remain gates. |
| Privacy | Tenant is derived from current context; job, row, finding, wave, report, reference, allocation, and purge lookup use tenant predicates. Foreign and nonexistent IDs share the same not-found behavior. Reports contain only row number, constrained source key, field, severity, and safe code plus fixed schema/media/disposition/checksum metadata. |
| Events and Audit | Import validation, approval, completion, and failure schemas are registered. Executable assertions compare every emitted lifecycle payload to the canonical schema field set, including the failure checkpoint. Import lifecycle state and outbox append share the import-owner transaction. Consequential approval and report access append allowlisted Audit metadata. |

## Implemented Numbering evidence

`@meridian/platform-numbering` is runtime-neutral. `@meridian/persistence-platform-numbering-postgres` owns only `platform_number_sequence` and `platform_number_allocation`, with its own generated migration history. Real import creation assures the fixed, system-managed tenant/organization `platform.import-job` sequence and allocates `IMP-` plus six decimal digits in the same outer transaction that creates the import job. Allocation uses a tenant/organization/sequence predicate and `FOR UPDATE`, then records the immutable bigint counter, formatted value, sequence-definition version snapshot, source command, import business-record ID, actor, and issuance time; increments the sequence; and appends schema-shaped `platform.sequence.number-issued.v1`. The import job stores the same human reference, allocation ID, and sequence version before appending `platform.import.validated.v1`.

The controlled configuration is fixed prefix, decimal padding, increment one, no automatic reset, and Active/Suspended state. Retry with the same tenant, sequence, and idempotency key returns the original allocation/version. Reuse with a different fingerprint or a conflicting system-sequence definition is rejected. Tenant-scoped tests must prove another tenant cannot read or collide with the allocation. A failure in sequence assurance, allocation, import persistence, or either outbox append rolls back the definition/counter, allocation, import job, and both event records together. Offline leasing, voids, rollover, reset policy, and administrative definition APIs remain deferred.

## Live PostgreSQL 18 evidence

The remediated disposable import suite passes **8 tests, 0 failures, and 36 expectations** against PostgreSQL 18. It proves strict CSV/security boundaries, pagination/lifecycle/purge behavior, per-row receipts and terminal-state race protection, real atomic Numbering integration, two-tenant non-disclosure, concurrent approval/purge retry behavior, immutable Inventory adjustment posting, and rollback of the sequence definition/allocation/import/events when the validated-event append fails.

The serial persistence suite passes **13 tests, 0 failures, and 82 expectations** on each of five consecutive runs with a 20-second integration-test budget. The repeated result proves the prior five-second timeout was a test-harness flake rather than a weakened assertion. Definition-version snapshots, two-tenant Numbering isolation, and import-create transaction rollback are additionally covered by the Numbering core and disposable import suites.

The runtime-neutral core additions pass **13 tests / 35 expectations** for Import/Export and **6 tests / 21 expectations** for Numbering. The complete live PostgreSQL composition lane passes **55 tests, 0 failures, and 538 expectations** across Audit/session, Catalog, Import, Inventory, serial persistence, and WS2 ledger-spike suites. The approved Node fallback passes after serial ten-owner migration on a clean disposable database. The repository-wide Bun workspace suite, TypeScript checks, formatter/linter, documentation validation, generated registry/contract freshness, architecture checker and negative probes, and generated-migration freshness for all ten owners also pass at the remediated local head.

The exact commands are:

```bash
bun test ./apps/server/composition/imports.integration.test.ts
bun test ./apps/server/composition/persistence.integration.test.ts
```

Claude Code independently reproduced the critical real-transaction, concurrency, CSV-safety, tenant, migration-freshness, Bun, Node, architecture, registry/contract, and documentation evidence at exact head `7a9e9edbfadfd59ed769d9d780c25fb71bbdb6be`, recorded concurrence in PR #76 comment `4995579814`, and PR #76 merged as `f7d2a6bbd7ad6df20a08820ba4a65299017b4db5`. Production retention, malware-provider, offline numbering, capacity, and RR-007 gates remain open.

## Residual risks and deferrals

- A cross-owner effect and import checkpoint cannot share one owner transaction. Stable owner-command idempotency closes the crash window; the checkpoint provides progress and reconciliation evidence.
- The controlled scanner seam is not production malware-provider evidence.
- Staged normalized rows are Confidential. Terminal purge behavior is executable at prototype depth; production scheduling, legal/privacy retention configuration, deletion-journal integration, and restore/purge exercises remain open before pilot.
- Large files, object storage, streaming parser technology, XLSX, transformations, pricing, customer/supplier imports, and export packages are deferred.
- Strict Online Numbering is not evidence for WS5 offline ranges or jurisdiction-specific fiscal numbering.
- Locale and timezone are manifest provenance for the two current templates; no present Product/opening-stock field is transformed by either. A future localized date/time field requires explicit deterministic conversion tests.
- The 30-day staging value and operator purge prove only controlled-prototype mechanics. Legal-hold/deletion-journal integration, automatic scheduling, restore behavior, and production retention remain open.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.5.0 | 2026-07-16 | Platform Design Authority | Recorded exact-head independent concurrence, ADR-0027 owner sign-off, and PR #76 merge; removed stale pre-merge wording without closing production retention, provider, offline, capacity, or RR-007 gates. |
| 0.4.1 | 2026-07-16 | Platform Design Authority | Replaced superseded counts with reproduced remediation results and clarified opening-stock maker/checker attribution without weakening Inventory's segregation invariant. |
| 0.4.0 | 2026-07-16 | Platform Design Authority | Dispositioned the exact-head audit with real atomic import references, definition-version snapshots, strict CSV defenses, reloadable lifecycle/reconciliation/purge surfaces, per-row receipts and state guards, approver attribution, tenant/security evidence requirements, explicit ADR owner sign-off, and honest replacement of superseded pre-audit test counts. |
| 0.3.0 | 2026-07-16 | Platform Design Authority | Remediated exact event-payload parity, manifest-bound create idempotency, deterministic terminal owner-rejection evidence, and the binding Numbering provenance/constraint model; recorded the exact post-remediation Bun, PostgreSQL, and Node evidence. |
| 0.2.0 | 2026-07-16 | Platform Design Authority | Added command-receipt use, owner-permission checks, two-tenant mixed/corrected fixtures, injected cross-owner crash recovery, and terminal staging-purge evidence while retaining production scheduling and retention gates. |
| 0.1.0 | 2026-07-16 | Platform Design Authority | Added the WS2 PR5 bounded import, owner-command, privacy, recovery, migration, concurrency, rollback, and online Numbering evidence boundary. |
