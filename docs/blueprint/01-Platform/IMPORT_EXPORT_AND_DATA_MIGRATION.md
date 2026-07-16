---
document_id: PDA-PLT-024
title: Import Export and Data Migration
version: 0.3.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Import, Export, and Data Migration

## Purpose

Define a governed platform service for onboarding data, bulk maintenance, customer portability, integration exchange, merger and acquisition transitions, partner implementations, and system exit.

## Architectural Position

The platform provides common orchestration, mapping, validation, staging, audit, security, and job management. Each domain owns its import commands, validation rules, conflict semantics, authoritative writes, and export representations.

The migration service must never bypass domain application services by writing arbitrary production tables.

## Core Concepts

- Import project
- Source system and format
- Mapping template
- Transformation rule
- Staging batch
- Validation finding
- Dry run
- Commit wave
- Reconciliation result
- Export package
- Migration checkpoint

## Supported Inputs

- CSV and delimited files
- XLSX where explicitly supported
- JSON and newline-delimited JSON
- API-based extraction
- Database export adapters approved for implementation services
- Industry and competitor-specific templates
- Attachments and media manifests

### WS2 first-slice format decision

WS2 Product and opening-inventory import is CSV-first. Parsing, validation, staging, correction reports, and commit waves run in the authoritative server-side job boundary; browsers do not parse or retain the authoritative import dataset. UTF-8 CSV with an explicit header, delimiter, quoting, newline, locale, decimal, unit, and timezone manifest is the only committed WS2 input format.

XLSX remains deferred. It may be added only after a governed technology-evidence update proves bounded server-side streaming, formula and external-link rejection, decompression and worksheet limits, malware controls, deterministic type/date handling, resource budgets, and CSV-equivalent dry-run/replay behavior. This deferral does not narrow the platform-wide list of candidate formats above.

### WS2 controlled-prototype bounds

The PR5 request boundary accepts one `text/csv` UTF-8 payload of at most 1 MiB, 1,000 data rows, 100 columns, and 10,000 UTF-8 characters per field. The manifest declares delimiter, quote character, newline convention, locale, decimal separator, default unit where applicable, and IANA timezone. The server verifies the supplied SHA-256 digest, rejects NUL bytes and invalid UTF-8, and fails closed when the injected malware-scanner seam reports blocked or unavailable.

Raw CSV exists only in the bounded request/scanner/parser lifetime. It is not persisted in PostgreSQL, logged, copied into Audit, emitted in events, or returned in errors. Persistence stores the manifest, digest, normalized allowlisted row representation, safe finding codes, checkpoints, target references, and reconciliation counts. Production object storage, antivirus-provider selection, production retention, and larger streaming uploads remain separate evidence gates.

## Import Lifecycle

1. Create project and select tenant, target domains, and source system.
2. Upload or connect the source securely.
3. Profile fields, types, volume, duplicates, and data quality.
4. Map source fields to canonical and custom fields.
5. Apply transformations through versioned rules.
6. Validate references, permissions, entitlements, business rules, and limits.
7. Run a dry run with counts and representative errors.
8. Approve the migration plan.
9. Commit in idempotent waves through domain commands.
10. Reconcile source counts, target counts, totals, balances, and exceptions.
11. Record acceptance and archive evidence.

For WS2, create performs upload validation, scanning, parsing, domain-target validation, and dry run. A dry run ends in `ReadyForApproval` or `Failed` and makes no Catalog or Inventory mutation. Approval requires the expected version and a different current actor, then commits deterministic waves through published Catalog or Inventory application commands. A failed wave retains its last completed row and safe failure code. Retrying resumes from that checkpoint; stable per-row idempotency keys prevent duplicate Products, Identifiers, stock movements, events, Audit records, or references.

## Validation

Validation supports:

- Required fields and data types
- Reference and relationship resolution
- Duplicate detection and merge candidates
- Custom-field definitions
- Currency, unit, time-zone, and locale normalization
- Effective dates and closed periods
- Ledger and inventory balancing
- Authorization and tenant scope
- File and malware controls

Errors must identify the source row, field, rule, severity, and corrective action. A customer must be able to correct and resubmit only affected records where practical.

## Idempotency and Rollback

- Every source record receives a stable import key.
- Replays must not create duplicates.
- Commit waves expose checkpoints and counts.
- Reversible master-data imports may support compensating rollback before downstream use.
- Posted ledgers and legally significant records use domain reversal rules rather than deletion.
- Every rollback policy is declared before execution.

## Export

Exports must support:

- Customer self-service for authorized datasets
- Regulatory and privacy requests
- Full tenant exit packages
- Incremental and scheduled extracts
- Open, documented formats
- Schema, manifest, checksum, and attachment inventory
- Permission-filtered operational exports
- Legally complete exports under elevated approval

## Portability

The platform must not make customer exit artificially difficult. Exit packages should preserve identifiers, timestamps, relationships, currencies, units, attachment references, audit context where lawful, and custom-field definitions.

## Security

- Encrypted transport and storage
- Expiring upload and download links
- Malware scanning
- Data classification and redaction
- Approval for sensitive or large exports
- Tenant isolation in staging and jobs
- Governed terminal-staging retention and deletion, with durable purge evidence
- Full audit of who initiated, approved, downloaded, or cancelled work

### WS2 API and authority surface

Product imports expose create, tenant-scoped status, tenant-scoped findings, approve, and correction-report download operations under `catalog.import.create`, `catalog.import.read`, `catalog.import.approve`, and `catalog.import.download`. Opening-stock imports expose the equivalent operations under `inventory.import.create`, `inventory.import.read`, `inventory.import.approve`, and `inventory.import.download`. Transport and application boundaries both enforce current active context, permission, and the relevant entitlement. Foreign-tenant and nonexistent identifiers return the same non-disclosing outcome.

Correction reports contain only import ID, row number, stable source key, field, severity, and safe finding code. They never echo unrestricted field values or embed a durable public URL. Download permission is evaluated for every request and the download is audited.

## WS2 Runtime Ownership

`@meridian/platform-import-export` owns runtime-neutral parsing, bounds, lifecycle, checkpoint, reconciliation, and target-port orchestration. `@meridian/persistence-platform-import-export-postgres` owns only import job, normalized row, finding, wave, and command-receipt state. Catalog and Inventory remain the sole owners of Product and stock facts. The import orchestrator may call their published application commands but may never import their repositories, migrations, schemas, or tables.

## Events

The canonical WS2 lifecycle events are:

- `platform.import.validated.v1`
- `platform.import.approved.v1`
- `platform.import.completed.v1`
- `platform.import.failed.v1`

These events carry safe identifiers, target capability, counts, state, and correlation only. Row content and unrestricted findings are prohibited. Catalog Product commands and Inventory adjustment commands continue to emit their own owner events for each authoritative effect.

## Offline and Edge

Offline clients may import bounded operational packages only through signed manifests and capability-specific rules. General bulk imports require an online authoritative service.

## First-Slice Requirements

- Product and price import
- Customer and supplier party import
- Opening inventory import with reconciliation
- Export of products, parties, sales, and inventory balances
- Dry run, correction file, idempotent replay, and acceptance report

## Change Log

- 0.3.1 (2026-07-16): Bound tenant/operation/key command receipts, separate owner-command permissions, mixed duplicate/corrected fixtures, deterministic crash-window recovery, and terminal-only staging purge while retaining production scheduling and deletion-journal gates.
- 0.3.0 (2026-07-16): Bound the PR5 CSV request/resource limits, scanner and raw-content rules, owner-specific orchestration persistence, reloadable API/permission surface, resumable idempotent waves, safe correction reports, and canonical lifecycle events.
- 0.2.0 (2026-07-14): Select UTF-8 CSV-first server-side imports for WS2 and defer XLSX pending bounded streaming and security evidence.
