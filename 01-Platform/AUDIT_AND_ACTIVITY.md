---
document_id: PDA-PLT-007
title: Audit and Activity
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0014]
---

# Audit and Activity

## Purpose

Define the trusted record of significant actions, access, decisions, configuration changes, approvals, privacy transformations, automation, AI activity, and administrative intervention across the platform.

## Distinction

- **Audit record:** tamper-resistant evidence intended for accountability, security, compliance, and investigation.
- **Activity feed:** user-friendly operational history and collaboration context.
- **Application log:** technical diagnostic output.

These may reference one another but must not be treated as interchangeable.

## Required Audit Context

- Tenant and organizational scope
- Actor and original actor
- Actor type: human, service, device, integration, automation, AI, or support
- Action and target resource
- Timestamp and trusted time source
- Source channel and client context
- Correlation and causation identifiers
- Before and after values or controlled change summary
- Reason, approval, delegation, and impersonation context
- Outcome and failure reason
- Data classification and retention category
- Privacy case and transformation version where applicable

## Rules

1. Audit records are append-oriented and protected from ordinary modification or deletion.
2. Sensitive values, secrets, full payment data, and unnecessary personal content must be redacted, tokenized, or represented by protected hashes at write time.
3. High-risk reads, exports, impersonation, permission changes, payroll, finance, stored value, inventory, privacy, and configuration actions require audit coverage.
4. Automated and AI actions identify the governing workflow, tool, policy, model or provider context, and human approvals where appropriate.
5. Clock, ordering, and correlation behavior must support investigations across services and offline clients.
6. Audit access itself is permissioned and audited.
7. Retention and legal-hold policy is configurable by data class and jurisdiction.
8. ADR-0014 permits a governed privacy transformation of identity attributes contained in audit evidence when no lawful retention basis remains. The transformation preserves the event, actor type, action, target class, time, outcome, and evidentiary meaning while replacing direct identifiers with irreversible pseudonyms.
9. A privacy transformation creates a new audit entry and never silently rewrites the historical fact.
10. Authentication factors, raw secrets, CVV, and unnecessary prompt content are prohibited from audit storage.

## Privacy-Safe Evidence

Prefer recording stable opaque references, structured change summaries, data-classification labels, and hashes rather than raw personal or secret values. Where a legal or security purpose requires identifiable evidence, access and retention are separately restricted.

AI prompt and response evidence uses a declared retention class. Raw content is stored only when policy requires it; otherwise use protected hashes, source references, tool records, and outcome metadata.

## User Activity Experience

Activity timelines show understandable business events, comments, attachments, approvals, and related records without exposing internal noise or restricted audit-only evidence.

## Search and Export

Authorized administrators need filtering by actor, action, domain, resource, date, location, source, outcome, risk, privacy case, and correlation. Exports must be signed, access-controlled, time-limited where appropriate, and audited.

## Events

Audit ingestion may consume domain events but must not depend solely on them. Security-sensitive audit evidence is generated at the authoritative action boundary.

Privacy transformations and deletion-journal acknowledgements are themselves auditable actions.

## Quality Gates

- Tamper and retention tests
- Redaction and secret-exclusion tests
- Cross-tenant access tests
- Correlation completeness
- High-risk action coverage
- Privacy pseudonymization without loss of evidentiary meaning
- Export and legal-hold tests
- AI retention-class tests
- Offline timestamp and synchronization tests