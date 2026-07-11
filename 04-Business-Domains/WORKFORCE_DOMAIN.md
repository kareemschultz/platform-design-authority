---
document_id: PDA-DOM-008
title: Workforce Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Workforce Domain

## Purpose

Own the employee lifecycle, organizational workforce records, recruitment, onboarding, time, attendance, leave, scheduling inputs, performance, learning, employee relations, and self-service.

## Core Capabilities

- Employee and contractor records
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

Worker, Employment, Position, Job, Assignment, Applicant, Time Record, Attendance Exception, Leave Request, Leave Balance, Performance Review, Skill, and Certification.

## Boundaries

Identity owns platform user authentication. Payroll owns pay calculation and pay-run posting. Scheduling Engine provides reusable scheduling. Assets owns equipment records. Workforce owns the employment and people-management context.

## Rules

- Compensation and sensitive personal data require field-level controls.
- Effective dating is required for employment, position, manager, location, and policy changes.
- Employment actions require audit, approvals, and jurisdiction-aware policy.
- Employee self-service exposes only permitted personal and organizational data.
- AI recommendations must not make unreviewed employment decisions.
