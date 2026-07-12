---
document_id: PDA-AI-013
title: AI Memory Retrieval and Context
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# AI Memory, Retrieval, and Context

## Purpose

Define how AI receives current business context, retrieves evidence, stores approved memory, and avoids cross-tenant leakage, stale authority, and uncontrolled personal profiling.

## Context Layers

- Authentication and assurance context
- Tenant, organization, legal entity, location, and workspace
- Permissions and entitlements
- User request and current record
- Approved retrieved evidence
- Workflow state
- Short-lived conversation state
- Approved durable memory

## Retrieval Rules

1. Search and Data Platform perform permission-filtered retrieval.
2. The AI layer cannot broaden retrieval scope.
3. Every chunk records tenant, source, classification, timestamp, and provenance.
4. High-impact answers revalidate current source records.
5. Retrieved text is untrusted and cannot redefine system or tool policy.
6. Citations identify the evidence used.
7. Stale, conflicting, or incomplete evidence is disclosed.
8. Deletion-journal and legal-hold state apply before retrieval.
9. Retrieval caches cannot outlive their source authorization or classification policy.

## Memory Types and Approvers

| Memory type | Example | Required approver | Default retention |
|---|---|---|---:|
| Ephemeral conversation | Current request and task context | System policy; no separate human approval | 24 hours maximum unless the user explicitly continues the task |
| Agent operational checkpoint | Workflow step, retry, compensation state | Workflow owner | Workflow completion plus 30 days |
| User preference | Layout, language, preferred summary style | The user | Until changed, deleted, or 12-month inactivity review |
| Workspace memory | Team-approved operating context or terminology | Workspace administrator or designated content owner | 12 months then review |
| Organizational knowledge memory | Approved summarized internal knowledge | Knowledge owner plus data steward | Source retention or 12 months, whichever is shorter without review |
| Evaluation feedback | Rating, correction, safety label | AI Evaluation Owner and data steward | 12 months by default |
| Incident preservation | Evidence required for an incident | Incident commander, Security, and Privacy as applicable | Incident evidence policy |

Secret data, raw credentials, unrestricted conversations, hidden sensitive profiles, and cross-tenant correlation are prohibited memory.

## Consent and Visibility

### User Preference Memory

- The user sees what is stored.
- The user may edit, export, reset, or delete it.
- A preference cannot silently change permission, entitlement, financial, legal, or safety policy.

### Workspace Memory

- The workspace administrator defines the purpose and audience.
- Contributors see that shared memory exists and who owns it.
- Personal content is not promoted to shared memory without an approved purpose and authority.
- A subject's correction or erasure request propagates to derived shared memory where applicable.

### AI-Derived Memory

AI may propose memory, but durable storage requires the policy and approver appropriate to its type. Inference is labeled with source and confidence and cannot replace an authoritative record.

## Memory Record

A durable memory stores:

- Identifier and version
- Tenant and workspace scope
- Subject or related Party reference where applicable
- Type and purpose
- Classification
- Source and provenance
- Fact, preference, inference, or summary status
- Confidence
- Owner and approver
- Creation method
- Effective and expiry dates
- Review date
- Legal hold
- Export, correction, restriction, and deletion behavior
- Source-deletion watermark

## Retention Classes

- M0 Ephemeral: up to 24 hours
- M1 Short Task: up to 30 days
- M2 User Preference: active use plus 12-month review
- M3 Workspace Knowledge: 12 months then owner review
- M4 Evaluation: 12 months unless longer evidence is approved
- M5 Incident or Legal: governed by incident or legal-hold policy

A memory cannot exceed the retention of its source without a separately documented lawful and operational basis.

## Privacy and Purge

Memory participates in access, export, correction, restriction, and erasure workflows.

Purge steps:

1. Resolve source and subject references.
2. Mark memory unavailable for retrieval immediately.
3. Remove or irreversibly pseudonymize stored content.
4. Purge embeddings, caches, summaries, feedback copies, and derived indexes.
5. Acknowledge each target in the deletion journal.
6. Rebuild or verify affected retrieval projections.
7. Preserve only privacy-safe completion evidence.

Provisional purge SLO:

- Online memory and retrieval targets: 5 minutes p95 after approved action
- Asynchronous evaluation or analytical copies: 24 hours p95
- Offline devices: next reconnect, with lease expiry enforcing the maximum disconnected period
- Failed targets: visible immediately in the privacy case and retried until completion, hold, or approved exception

## Reconstruction-Resistance Test

After deletion or irreversible pseudonymization:

1. Query by old identifier, name, contact point, source text, and semantically similar phrases.
2. Inspect direct memory, embeddings, retrieval chunks, caches, summaries, feedback, and evaluation datasets.
3. Attempt linkage through remaining opaque references.
4. Verify no ordinary authorized query can reconstruct the deleted identity or content beyond legally retained facts.
5. Record residual linkage and require Privacy approval where retention remains.

## Staleness and Conflict

- Source changes invalidate or mark affected memory stale.
- Conflicting authoritative sources are shown rather than merged silently.
- A stale memory cannot drive a consequential tool call without source revalidation.
- Owners receive review queues for expiring or stale shared memory.

## Quality Gates

- Tenant and permission isolation
- Approver and consent enforcement
- Prompt-injection testing
- Staleness and conflict handling
- Source deletion and purge SLO
- User visibility and control
- Retention and expiry enforcement
- Workspace-memory governance
- Reconstruction-resistance test
- Backup restore followed by purge reapplication
