---
document_id: PDA-DOM-008
title: Workforce Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0007, ADR-0014]
---

# Workforce Domain

## Purpose

Own employment, contractor engagement, workforce structure, recruitment, onboarding, time, attendance, leave, performance, learning, employee relations, and self-service without duplicating canonical Party identity.

## Core Capabilities

- Employee and contractor role records linked to canonical Parties
- Positions, jobs, departments, reporting lines, and workforce structure
- Recruitment, applicants, interviews, offers, and hiring
- Onboarding, offboarding, documents, checklists, and equipment handoff
- Time, attendance, shifts, breaks, overtime, and exceptions
- Leave, accruals, balances, requests, approvals, and calendars
- Performance goals, reviews, feedback, and development plans
- Learning, certifications, skills, and compliance training
- Employee relations, cases, disciplinary actions, and acknowledgements
- Employee and manager self-service

## Authoritative Entities

Employment, Contractor Engagement, Position, Job, Assignment, Applicant Role, Time Record, Attendance Exception, Leave Request, Leave Balance, Performance Review, Skill, and Certification.

A worker is represented by a canonical Party plus one or more Workforce-owned role records. Workforce does not create a second authoritative person, name, address, contact point, or identifier when Party already owns it.

## Party and Identity Boundary

Party and Relationship Management owns shared real-world identity, names, contact points, addresses, identifiers, duplicate resolution, merge, and cross-role relationships.

Workforce owns employment and contractor context, including worker status, position, assignment, manager, department, compensation references, leave, time, performance, and lifecycle.

Better Auth owns authentication and sessions. Platform Identity links a Better Auth user to the Party and optional Workforce role. A user account is not the employee record.

Recruitment may create a provisional Party or applicant role through Party contracts. Hiring promotes the approved relationship into Employment without silently duplicating identity.

## Boundaries

- Payroll owns pay calculation and pay-run posting.
- Scheduling Engine provides reusable scheduling behavior.
- Assets owns equipment records.
- Documents owns controlled policies and acknowledgements.
- Security and Privacy own cross-domain rights, restriction, and erasure orchestration.
- Workforce owns employment and people-management context.

## Privacy and Retention

A person may simultaneously be an employee, customer, supplier contact, and authenticated user. Privacy actions are scoped by role and purpose under ADR-0014. Ending or erasing an unrelated customer role must not corrupt retained employment records.

Compensation, government identifiers, disciplinary records, health-related accommodations, and other sensitive attributes require Restricted classification, purpose limitation, field-level controls, retention policy, masking, and enhanced audit.

## Rules

- Effective dating is required for employment, position, manager, location, policy, and compensation-related changes.
- Employment actions require authorization, workflow, audit, and jurisdiction-aware policy.
- Employee self-service exposes only permitted personal and organizational data.
- Merge and duplicate resolution are performed through Party governance.
- AI may assist drafting, summarization, scheduling, and retrieval but must not make unreviewed employment decisions.

## Events

- `workforce.employment.created.v1`
- `workforce.employment.activated.v1`
- `workforce.employment.ended.v1`
- `workforce.assignment.changed.v1`
- `workforce.leave-request.submitted.v1`
- `workforce.leave-request.approved.v1`
- `workforce.time-record.posted.v1`

## Quality Gates

- One person can hold multiple roles without duplicate authoritative identity.
- Authentication-account suspension does not silently terminate Employment.
- Employment termination does not erase legally retained payroll or workforce facts.
- Party merge preserves Workforce role references and audit.
- Tenant and organization isolation is tested across employee self-service and manager access.
