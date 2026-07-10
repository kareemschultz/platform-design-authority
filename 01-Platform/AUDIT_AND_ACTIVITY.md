---
document_id: PDA-PLT-007
title: Audit and Activity
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Audit and Activity

## Purpose

Define the trusted record of significant actions, access, decisions, configuration changes, approvals, automation, AI activity, and administrative intervention across the platform.

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

## Rules

1. Audit records must be append-oriented and protected from ordinary modification or deletion.
2. Sensitive values, secrets, full payment data, and unnecessary personal content must be redacted or tokenized.
3. High-risk reads, exports, impersonation, permission changes, payroll, finance, inventory, and configuration actions require audit coverage.
4. Automated and AI actions must identify the governing workflow, tool, policy, model or provider context where appropriate, and human approvals.
5. Clock, ordering, and correlation behavior must support investigations across services and offline clients.
6. Audit access itself must be permissioned and audited.
7. Retention and legal-hold policy must be configurable by data class and jurisdiction.

## User Activity Experience

Activity timelines should show understandable business events, comments, attachments, approvals, and related records without exposing internal implementation noise.

## Search and Export

Authorized administrators need filtering by actor, action, domain, resource, date, location, source, outcome, risk, and correlation. Exports must be signed, access-controlled, and audited.

## Events

Audit ingestion may consume domain events but must not depend solely on them. Security-sensitive audit evidence should be generated at the authoritative action boundary.

## Quality Gates

- Tamper and retention tests
- Redaction tests
- Cross-tenant access tests
- Correlation completeness
- High-risk action coverage
- Export and legal-hold tests
- Offline timestamp and synchronization tests
