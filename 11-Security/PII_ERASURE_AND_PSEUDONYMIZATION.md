---
document_id: PDA-SEC-010
title: PII Erasure and Pseudonymization
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0014]
---

# PII Erasure and Pseudonymization

## Purpose

Define the technical contracts that reconcile privacy erasure with append-oriented business records, audit evidence, statutory retention, offline clients, backups, search, analytics, webhooks, and AI data.

## Principles

1. Remove unnecessary identity data without changing the economic meaning of historical records.
2. Keep direct identifiers out of ledgers and events unless a documented purpose requires them.
3. Evaluate erasure per role, purpose, tenant, jurisdiction, and record class.
4. Propagate through explicit targets and acknowledgements rather than assuming database deletion is sufficient.
5. Preserve legal holds and required retention with restricted purpose and visibility.
6. Make backup resurrection impossible to overlook.

## Data Placement

### Identity and Party Data

Mutable names, addresses, contact points, government identifiers, profile attributes, and relationship metadata belong in governed identity and Party structures with field classification and retention metadata.

### Immutable Business Records

Ledgers, posted documents, audit records, and statutory snapshots should store:

- Opaque party or subject reference
- Role at the time of the transaction
- Minimum legally or operationally necessary snapshot
- Hash or evidence reference where appropriate
- Retention class and policy version

Do not copy the full Party profile into every transaction.

## Transformation Actions

- Delete: physically remove a mutable attribute or record where no retention basis remains.
- Null: remove an optional value while preserving structure.
- Generalize: reduce precision, such as replacing a full address with country or region.
- Pseudonymize: replace a stable identifier with an irreversible tenant-scoped token.
- Redact: remove protected content from a document while preserving a redaction record.
- Restrict: retain under a legal basis but remove from ordinary workflows and search.
- Crypto-shred: destroy a narrowly scoped encryption key after proving backup and projection behavior.

Every action is idempotent and records policy, case, actor, target, transformation version, and result.

## Deletion Journal

The Privacy service owns an append-oriented deletion journal. Each entry includes:

- Privacy case and subject reference
- Tenant and organization scope
- Role or purpose being erased
- Target system and record class
- Required action
- Deadline
- Attempt count and last error
- Acknowledgement, evidence hash, and completion timestamp
- Legal-hold or exemption status

A privacy case cannot close until required targets acknowledge completion or an approved exception is recorded.

## Projection Targets

Required target types include:

- Authoritative domain stores
- Search indexes and suggestions
- Vector stores and embeddings
- Analytics and reporting projections
- Caches and materialized views
- Files, generated documents, and exports
- Webhook payload stores and dead letters
- Notification content and provider metadata
- AI prompts, responses, traces, and evaluation datasets
- Offline device stores and queued operations
- Support and diagnostic captures

## Offline Device Protocol

Each offline-capable device receives privacy tombstones and purge commands through synchronization.

The protocol records:

- Device identifier and tenant scope
- Subject and record tombstones
- Minimum client schema version
- Purge deadline
- Device acknowledgement and purge evidence
- Lease expiry and remote revocation

A device that does not reconnect before its privacy lease expires loses authorization to synchronize or operate on protected data. Re-enrollment requires a clean-state or verified purge workflow.

## Webhooks and Integrations

Webhook delivery stores must define payload retention. A privacy action may:

- Purge retained payload bodies while preserving delivery metadata
- Disable replay for affected payloads
- Issue a downstream deletion notification where contractually supported
- Record recipients that cannot be technically controlled after delivery

External recipients are processors or independent controllers according to contract; the platform must not imply it can erase data already lawfully exported beyond its control.

## AI Data

AI data receives a retention class before use. Prompt and response logs may store protected hashes instead of full content where debugging does not require raw data. Evaluation datasets require approved de-identification. Erasure propagates to retrieval chunks, embeddings, prompt logs, response stores, feedback, and fine-tuning datasets where applicable.

## Backups and Restore

Backups retain an immutable deletion-journal watermark. Restore procedure must:

1. Restore into an isolated environment.
2. Load the current deletion journal and legal holds.
3. Reapply all transformations newer than the backup watermark.
4. Rebuild or purge derived indexes.
5. Verify privacy invariants.
6. Only then permit ordinary user traffic.

## Multi-Role Party Rules

A Party is not erased globally merely because one relationship ends. The privacy case identifies:

- Role and relationship
- Purpose
- Tenant and legal entity
- Record classes
- Required and prohibited uses
- Retention basis

The system may remove marketing and prospect attributes while retaining restricted payroll or statutory records. User experiences must stop presenting retained data outside its remaining purpose.

## Related Event Family

Canonical privacy event definitions are owned by `PRIVACY_RIGHTS_AND_RETENTION.md`. This technical specification consumes the same event family:

- `security.privacy-request.received.v1`
- `security.privacy-request.verified.v1`
- `security.privacy-action.requested.v1`
- `security.privacy-target.completed.v1`
- `security.privacy-target.failed.v1`
- `security.privacy-case.closed.v1`
- `security.privacy-hold.applied.v1`
- `security.privacy-hold.released.v1`

## Testing

- Multi-role partial erasure
- Ledger pseudonymization without balance change
- Search and vector deletion
- Webhook replay prevention
- Offline-device purge and lease expiry
- Backup restore and deletion reapplication
- Legal-hold override
- Idempotent retry
- Cross-tenant isolation
- Reconstruction-resistance test

## Initial Scope

The first retail slice must implement Party/contact PII isolation, customer-role erasure, Commerce transaction pseudonymization, search purge, audit-safe transformation, offline tombstones, and backup reapplication.