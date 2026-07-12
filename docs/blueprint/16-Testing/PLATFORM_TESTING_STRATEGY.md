---
document_id: PDA-TST-010
title: Platform Testing Strategy
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Platform Testing Strategy

## Purpose

Define the quality system for a modular, multi-tenant, offline-capable, financially consequential, white-label, AI-assisted Business Operating Platform.

## Testing Principles

1. Test business invariants, not only code coverage.
2. Every capability proves tenant isolation, permission, entitlement, audit, and failure behavior.
3. Ledger and statutory systems test reversal and reconciliation, not destructive correction.
4. Provider integrations are tested against recorded contracts and failure simulation.
5. Offline workflows test disconnection, duplication, stale authority, and conflict recovery.
6. Accessibility, usability, and performance are release criteria.
7. AI requires evaluation datasets and tool-safety tests, not anecdotal prompting.
8. Production incidents create regression tests where practical.

## Test Layers

### Unit and Domain

- Value objects and calculations
- State transitions and invariants
- Policy and rule evaluation
- Money, currency, quantity, time, and effective dating
- Serialization and schema validation

### Module and Application

- Commands, queries, repositories, and canonical events
- Permission and entitlement enforcement
- Idempotency and duplicate handling
- Outbox behavior
- Audit evidence
- Cross-domain contracts

### Integration

Use real PostgreSQL and representative infrastructure through Testcontainers or equivalent for database constraints, migrations, Redis or Valkey, jobs, events, object storage, search, Better Auth, providers, and webhook verification.

### Contract

- REST and OpenAPI
- Event schemas and compatibility
- Webhook signatures and retries
- SDK generation
- Provider capability declarations
- Offline synchronization protocol
- Permission-to-endpoint coverage

### End-to-End

- Role-based workflows
- White-label branding and domains
- Payment, stored value, cash, inventory, returns, and exchange
- Import and export
- Support and delegated administration
- Browser and native applications

### Security

- Cross-tenant read, write, search, export, event, file, job, cache, device, and AI denial
- Authorization bypass and confused deputy
- Session, recovery, passkey, SSO, SCIM, API-key, and support abuse
- Injection, SSRF, malicious file, and unsafe extension
- Rate limits and credential stuffing
- AI prompt injection and tool escalation

### Offline and Resilience

- Network loss at every state transition
- Duplicate and out-of-order replay
- Device lease expiry and revocation
- Privacy tombstones
- Number ranges
- Stored-value allowance and reservation
- Restore followed by client resynchronization

### Performance

Use provisional budgets from `docs/blueprint/17-Roadmap/FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md` for POS, product search and scanning, inventory posting, chart interaction, reports, exports, tenant isolation, queue recovery, webhooks, mobile startup, and offline database size.

### Accessibility and Experience

- Keyboard and screen-reader workflows
- Focus, errors, status, confirmation, charts, and grids
- Touch, mobile, scanner, and external keyboard
- High contrast, zoom, text scaling, and reduced motion
- Offline, stale, conflict, uncertainty, and pending-state clarity
- Workflow completion, error, and assistance rates

### AI Evaluation

- Grounding and citation
- Retrieval authorization
- Tool selection
- Refusal and approval
- Unsupported claims
- Prompt injection
- Cost and latency
- Regression by model, prompt, tool, and policy version

## Mandatory Capability Test Matrix

The normative matrix contract is `docs/blueprint/16-Testing/FIRST_SLICE_CAPABILITY_TEST_MATRIX.md`; the generated skeleton is `registry/first-slice-tests.json`.

Every first-slice capability declares all thirteen dimensions: happy path; validation and denial; tenant isolation; permission and entitlement; idempotency; concurrency; events/jobs/projections; audit; privacy; offline; accessibility; performance; and recovery/reconciliation.

## Financial and Ledger Testing

For Finance, Inventory, Stored Value, Payment, Payroll, cash, and fiscal records:

- Balance invariants
- Reversal chains
- Partial operations
- Multi-currency rounding
- Period boundaries
- Concurrent posting
- Duplicate source events
- Source and provider reconciliation
- Restore and replay

Use property-based and model-based tests for high-value invariants.

## Migration Testing

- Forward migration
- Rollback or compensation
- Large representative dataset
- Tenant-by-tenant validation
- Extension-field compatibility
- Backfill idempotency
- Zero or bounded downtime
- Restore from pre-migration backup

## Environments

Use the canonical taxonomy in `docs/blueprint/12-Deployment/INFRASTRUCTURE_AS_CODE_AND_ENVIRONMENT_TOPOLOGY.md`: Local, CI Ephemeral, Integration, Shared Development, Staging, Pilot, Production, Recovery, Dedicated, and Self-Hosted.

Testing selects the appropriate subset and does not create a competing environment vocabulary. Production data is not copied downward without approved de-identification.

## Release Gates

A release candidate requires:

- Governance and registry checks
- Architecture-boundary checks
- Unit, module, integration, and contract suites
- No unresolved critical security findings
- Tenant-isolation suite
- Migration rehearsal
- Accessibility and performance budgets
- Recovery verification for consequential changes
- Required manual approvals
- Generated capability matrix with no unexplained missing dimensions

## First-Slice Acceptance Suite

The Guyana retail foundation slice proves:

- Better Auth login, session revocation, step-up, and Party/domain-role link
- Tenant and legal-entity isolation
- Catalog search, barcode scanning, malformed barcode handling, rapid scans, and manual fallback
- Product import dry run, correction of rejected rows, partial apply, and idempotent rerun
- Register open, cash sale, mixed tender, safe drop, variance, deposit, and close
- Payment success, timeout, uncertainty, duplicate callback, and reconciliation
- Inventory adjustment, count, transfer, and reconciliation
- Stored-value issue, reservation, redemption, release, reversal, offline allowance, and duplicate protection
- Disconnect during sale, offline numbering, queue replay, conflict, lease expiry, and sync
- Receipt-backed return, exchange, refund destination, and provider limitation
- Staff-assisted and self-service privacy-request intake, verification failure, multi-role erasure, legal hold, target retry, and offline-device tombstone
- Audit, support access, impersonation, and export authorization
- Search, chart, dashboard, and record-level permissions
- Accountant handoff and control-total reconciliation
- Backup restore, deletion-journal reapplication, projection rebuild, and client resynchronization
- Provider webhook and settlement seam
- Cross-tenant denial across all access paths

## Evidence and Reporting

Test evidence records source commit, artifact, environment, data fixture, tenant, capability, matrix dimension, result, duration, logs, screenshots or traces, reviewer, waivers, linked defects, and expiry.

Flaky tests are defects and cannot be normalized into permanent retries.