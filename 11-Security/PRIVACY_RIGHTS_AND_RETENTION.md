---
document_id: PDA-SEC-002
title: Privacy Rights and Retention
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0014]
---

# Privacy Rights and Retention

## Purpose

Define platform capabilities for access, correction, portability, restriction, objection, deletion, consent evidence, retention, legal hold, and accountable privacy operations across all domains.

## Architectural Position

Privacy rights are cross-domain workflows. Security and Governance coordinate identity verification, request intake, discovery, approvals, deadlines, evidence, redaction, export, deletion, pseudonymization, and closure. Each domain remains responsible for locating and acting on the records it owns.

ADR-0014 defines the default technical mechanism: isolate direct identifiers, retain only minimum required historical snapshots, and use deletion or irreversible pseudonymization without changing economic facts.

This document defines technical and operational architecture, not jurisdiction-specific legal advice. Jurisdiction packs and counsel-approved policy determine which rights, exemptions, and deadlines apply.

## Core Entities

- Privacy Subject
- Privacy Request
- Verified Identity Evidence
- Jurisdiction and Applicable Policy
- Data Location Task
- Domain Response
- Exemption or Retention Basis
- Export Package
- Privacy Transformation Action
- Deletion Journal Entry
- Target Acknowledgement
- Legal Hold
- Decision and Communication Record

## Request Types

- Access and disclosure
- Correction
- Portability
- Deletion or erasure
- Restriction of processing
- Objection or opt-out
- Consent withdrawal
- Automated-decision review
- Account closure
- Authorized-agent request

## Lifecycle

1. Receive request through authenticated self-service, support, or authorized intake.
2. Verify requester identity and authority proportionately.
3. Determine tenant, controller, processor, jurisdiction, deadline, and request type.
4. Discover records through Party and domain data-location contracts.
5. Separate roles and purposes for multi-role Parties.
6. Apply legal holds, exemptions, retention obligations, and third-party considerations.
7. Generate a reviewable response or action plan.
8. Obtain required approvals.
9. Export, correct, restrict, delete, generalize, redact, pseudonymize, or deny with reason.
10. Publish deletion-journal tasks to authoritative and derived targets.
11. Obtain target acknowledgements and manage failures.
12. Notify downstream processors and integrations where required.
13. Record completion evidence and retain the privacy case separately from erased source PII.

## Domain Contract

Every domain containing personal data declares:

- Personal-data categories and classification
- Party or identity linkage
- Roles and purposes
- Lawful, contractual, safety, fraud, or operational basis metadata where applicable
- Search and export operation
- Correction operation
- Deletion, pseudonymization, restriction, or retention behavior
- Minimum historical snapshot and why it is required
- Downstream processors and projections
- Legal, financial, payroll, security, fraud, or audit constraints
- Responsible owner and service-level expectation

## Multi-Role Parties

Privacy action is scoped to role, purpose, tenant, legal entity, and record class. A person who is both a customer and employee is not globally erased because the customer relationship is erasable. Unnecessary customer and marketing data may be removed while payroll or legal employment data remains restricted to its retained purpose.

## Retention

Retention policies are versioned and effective-dated by record class, jurisdiction, tenant policy, contract, and legal basis.

A policy defines:

- Retention start event
- Minimum and maximum period
- Archive period
- Deletion, restriction, generalization, or pseudonymization action
- Review and approval
- Legal-hold override
- Backup treatment
- Evidence required

Deletion is idempotent, observable, and propagated to non-authoritative copies through the deletion journal.

## Target Systems

Required privacy targets include:

- Authoritative domain stores
- Search, suggestions, vectors, and embeddings
- Analytics, reports, and caches
- Files and generated exports
- Webhook payload retention and replay stores
- Notifications and provider metadata
- AI prompts, responses, traces, and evaluation datasets
- Offline devices and queued operations
- Support and diagnostic captures
- Backup restore processes

## Offline Devices

Offline devices receive privacy tombstones and purge commands. A device that fails to acknowledge before its privacy lease expires loses authorization to operate on protected tenant data or synchronize until a clean-state or verified purge is completed.

## Backups

Backups expire under documented retention and are not selectively rewritten by default. Every backup records a deletion-journal watermark. Restore occurs in isolation, reapplies newer privacy transformations, rebuilds derived systems, and passes privacy verification before ordinary traffic resumes.

## Webhooks and External Recipients

The platform may purge retained webhook payloads and disable replay. It records downstream recipients and sends deletion instructions where contractually supported. It must not claim technical control over data already delivered to an independent recipient.

## Legal Holds

A hold can suspend deletion for specified Parties, roles, record classes, date ranges, matters, and tenants. Holds require authority, reason, scope, review date, and release evidence.

## Data Export

Privacy exports use open formats and include a manifest, date range, source domains, relationship context, classification, and redaction notes. They must not disclose another person's protected data merely because records are related.

## Security and Abuse Controls

- Strong identity verification
- Fresh authentication for self-service downloads
- Separation of requester, reviewer, and approver for high-risk cases
- Rate and abuse controls
- Encrypted packages with expiring delivery
- Minimal internal visibility
- Immutable case audit with privacy-safe evidence
- No secrets or authentication factors in exports

## Events

- `security.privacy-request.received.v1`
- `security.privacy-request.verified.v1`
- `security.privacy-action.requested.v1`
- `security.privacy-target.completed.v1`
- `security.privacy-target.failed.v1`
- `security.privacy-hold.applied.v1`
- `security.privacy-hold.released.v1`
- `security.privacy-case.closed.v1`

## AI

AI may assist classification, discovery, summarization, and redaction suggestions. It must not autonomously approve denials, exemptions, legal holds, or irreversible deletion. Prompts and outputs are Restricted case data with explicit retention and erasure behavior.

## Quality Gates

- Multi-role partial erasure
- Ledger pseudonymization without economic change
- Search, vector, analytics, cache, and webhook purge
- Offline-device tombstone and lease-expiry test
- Backup restore with deletion reapplication
- Legal-hold and exemption tests
- AI retention and purge tests
- Target acknowledgement and retry

## Source References

- EU General Data Protection Regulation, including data-subject rights and portability: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- `18-Decisions/ADR-0014-PII-ISOLATION-AND-IRREVERSIBLE-PSEUDONYMIZATION.md`
- `11-Security/PII_ERASURE_AND_PSEUDONYMIZATION.md`
- `12-Deployment/BACKUP_RESTORE_AND_DISASTER_RECOVERY.md`