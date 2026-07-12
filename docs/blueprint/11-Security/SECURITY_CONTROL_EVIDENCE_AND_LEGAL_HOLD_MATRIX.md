---
document_id: PDA-SEC-017
title: Security Control Evidence and Legal Hold Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Security Control Evidence and Legal Hold Matrix

## Purpose

Define how security controls produce reviewable evidence and how legal or investigation holds suspend ordinary deletion without broadening access.

## Control Evidence Record

Every material control records:

- Control identifier and objective
- Owner
- Systems, capabilities, tenants, and deployment modes in scope
- Implementation description
- Preventive, detective, corrective, or recovery class
- Evidence source and collection method
- Test frequency
- Last test and result
- Exceptions and compensating controls
- Expiry and review date
- Linked incident, audit, or obligation

## Evidence Families

- Configuration snapshots
- Policy and access review
- Automated test results
- Architecture and tenant-isolation tests
- Vulnerability and dependency scans
- Build provenance and SBOM
- Key and credential rotation
- Backup and restore exercises
- Incident and tabletop evidence
- Provider assessments
- Privacy request and deletion reconciliation
- Training and acknowledgement
- Customer assurance artifacts

## Legal Hold Record

A hold records:

- Hold identifier
- Authorized requester and approving legal authority
- Tenant, legal entity, Party, record classes, and date range
- Purpose and matter reference
- Start date
- Systems and projections affected
- Custodians and providers
- Access restrictions
- Notification restrictions where lawful
- Review cadence
- Release authority and release date
- Post-release retention and deletion action

## Hold Actions by Data Family

| Data family | Hold behavior |
|---|---|
| Authoritative domain record | Suspend deletion or irreversible pseudonymization only for the specified scope |
| Append-oriented ledger | Preserve required fact; restrict direct identifiers where legally permitted |
| Audit and security evidence | Preserve integrity and chain of custody |
| Search and analytics | Remove from ordinary discovery unless continued availability is authorized; retain restricted evidence copy where required |
| AI prompts, memory, embeddings, and evaluations | Disable ordinary retrieval; preserve only explicitly held evidence with restricted access |
| Offline devices | Issue hold-aware tombstone or retention instruction according to authority and reconnect policy |
| Backups | Record hold watermark and ensure restoration reapplies hold and deletion journals correctly |
| Webhooks and integrations | Stop future disclosure; preserve only retained delivery evidence when included in scope |

## Rules

1. A legal hold does not grant new read access.
2. Holds are as narrow as the authorized matter permits.
3. Ordinary users cannot infer that a subject is under investigation.
4. Released holds trigger normal retention, erasure, and projection-cleanup workflows.
5. Restores reapply both hold and deletion state in the correct effective order.
6. Provider-held evidence is included only through contractual and lawful process.
7. Hold changes are audited and require appropriate segregation of duties.

## Quality Gates

- Evidence inventory complete for critical controls
- Stale or missing evidence visible
- Hold scope tested across authoritative and derived stores
- Restricted access tested
- Restore and deletion-journal interaction tested
- Hold release and delayed deletion tested
- Qualified legal review before production use
