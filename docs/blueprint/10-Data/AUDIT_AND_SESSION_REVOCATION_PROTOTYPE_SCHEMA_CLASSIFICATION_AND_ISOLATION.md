---
document_id: PDA-DAT-018
title: Audit and Session Revocation Prototype Schema Classification and Isolation
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0003, ADR-0006, ADR-0014, ADR-0027, ADR-0028]
review_evidence: []
---

# Audit and Session Revocation Prototype Schema Classification and Isolation

## Purpose and Authority

This record governs WS1 PR7's controlled Technical Prototype 1 implementation of `platform.audit` and account-owned session revocation. It does not promote PDA-PLT-007, ADR-0014, ADR-0027, or ADR-0028 beyond their recorded lifecycle and does not claim pilot or production readiness.

Better Auth through Platform Identity remains the owner of accounts and sessions. Platform Audit owns audit evidence and privacy overlays. The Event Backbone owns the outbox. Platform Identity may atomically append the session-revoked outbox fact but never mutates Audit tables in that transaction; Audit projects the durable fact idempotently.

## Table Declarations

| Table | Scope and owner | Default classification | Retention and erasure | Offline | Audit implications |
|---|---|---|---|---|---|
| `session` | Platform-global Platform Identity account session | Restricted | Better Auth lifecycle; revoke/delete invalidates the credential-bearing session. Tokens are never returned by the Platform session API | Online only | Revocation commits a privacy-safe outbox fact in the same owner transaction |
| `platform_identity_session_command_receipt` | Platform-global Platform Identity command receipt, keyed by account/operation/idempotency key | Confidential | Short operational deduplication window to be finalized before production; stores a SHA-256 request fingerprint and opaque IDs only | Denied | Proves retry binding; not a substitute for Audit evidence |
| `platform_event_outbox` | Event Backbone; discriminator enforces Tenant or registered Platform scope | Inherits event classification | Event retention class; Platform session facts use `platform-security-evidence` | Server only | Durable handoff prevents a revoked session without evidence when Audit projection is asynchronous |
| `platform_audit_record` | Platform Audit; per-scope append chain, Tenant or registered Platform scope | Restricted unless the source fact is lower and policy permits | Append-oriented; `retention_until` and `legal_hold_id` prevent ordinary purge. ADR-0014 transformations preserve the fact while ordinary queries apply pseudonyms | Queue-and-sync contract only; no direct client store in PR7 | Audit access is itself appended; record and previous hashes make unauthorized modification detectable |
| `platform_audit_privacy_overlay` | Platform Audit; scope-keyed irreversible subject-digest overlay | Restricted | Retained with privacy case evidence and transformation version; no reverse mapping is stored | Denied | Query projection replaces direct actor identifiers without rewriting historical action/time/outcome |

No table stores raw authorization headers, cookies, session tokens, passwords, OTPs, recovery codes, factor secrets, raw session IP addresses, or full user-agent strings in Audit. Session summary responses contain only masked IP and coarse device/browser labels.

## Scope and Isolation Controls

- ADR-0028 requires `scope_type` on events and Audit records.
- Tenant scope requires non-null `tenant_id`; Platform scope requires null tenant/organization/location fields and the fixed `platform` scope key.
- `GET /v1/audit-records` derives tenant scope from a revalidated active context, requires `platform.audit.read`, queries Tenant records only, and appends its own access record.
- Platform-scoped session evidence is not exposed by the tenant Audit API.
- Account session list/revoke uses the authenticated Better Auth user ID and always predicates reads/deletes by both user and session ID. Another account receives the same idempotent absence behavior without existence disclosure.
- Session revocation, command receipt, and outbox event commit or roll back together. Audit ingestion is a separate idempotent owner transaction keyed by source event ID.
- Audit chain append obtains a PostgreSQL transaction advisory lock per scope and has a unique `(scope_key, sequence)` constraint.
- Audit repository ports expose insert/query/verification and privacy overlay operations; they expose no ordinary update/delete operation.

## PostgreSQL RLS Disposition

RLS remains deferred for this controlled prototype under the same conditions recorded by PDA-DAT-016 and PDA-DAT-017: one composition-owned database role exists and transaction-local tenant context/reset behavior has not received Security and Data Platform approval. Enabling an incomplete policy would create false assurance.

Compensating controls are a schema-level scope discriminator check, server-derived tenant scope, tenant predicates, separate Platform evidence query policy, opaque global account identifiers, two-tenant negative tests, invalid mixed-scope database tests, and architecture ownership enforcement. Pilot and production remain blocked on reviewed database roles, tenant-context set/reset, owner/migration privileges, background consumers, restore behavior, bypass policy, and executable RLS denial tests.

## Integrity, Privacy, and Retention Controls

- Metadata and structured change summaries are recursively redacted at write; prohibited key families and embedded bearer/basic credentials become `[REDACTED]`.
- Canonicalized record content, sequence, prior hash, and scope are SHA-256 chained. Verification detects direct database tampering; database-owner or privileged-role prevention remains an operational production gate.
- Privacy transformation appends a new evidence record and a subject-digest overlay. It never changes the historical action, target class, timestamp, or outcome and retains no reversible mapping.
- Legal hold always wins over archive review. Expired retention makes a record eligible only for governed archive review, not automatic deletion.
- Platform-global evidence contains the minimum opaque identity/session references and no tenant membership list.

## Executable Evidence

WS1 PR7 keeps these checks green:

- Runtime-neutral unit tests for redaction, deterministic hashing, tamper detection, source-event idempotency, retention/hold disposition, privacy overlays, audit-of-access, and Tenant/Platform query separation.
- PostgreSQL 18 integration tests for empty/repeat migrations, mixed-scope rejection, state/receipt/outbox rollback, account ownership, event idempotency, two-tenant Audit isolation, legal-hold persistence, privacy overlays, and direct-tamper detection.
- Measured database-current session revocation p95 at or below 60 seconds, with every sample proving the session row absent before completion.
- Router tests for authentication, active-context revalidation, `platform.audit.read`, safe session summaries, and idempotent revoke dispatch.
- Bun and approved Node fallback checks, architecture validation, OpenAPI/contract parity, migration freshness, documentation/registry freshness, lint, types, and secret/PII scans.

## Explicit Deferrals

A privileged platform-security Audit query API, audit export, cryptographic external anchoring, WORM storage, production retention schedules, automated archival/purge, legal-hold administration UI, RLS, deletion-journal delivery, offline Audit storage, and a continuously running outbox-to-Audit worker remain outside PR7. The prototype supplies the idempotent projector boundary and durable outbox evidence; PR9 records this worker as an operational seam rather than claiming continuous production projection.
