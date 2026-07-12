---
document_id: PDA-DAT-013
title: Master Reference and Data Quality Governance
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Master, Reference, and Data Quality Governance

## Purpose

Define stewardship, quality, survivorship, reference values, issue management, and controlled correction for shared business data.

## Governed Data

- Party and relationships
- Products and variants
- Locations and organizations
- Units, currencies, countries, and tax categories
- Accounts and dimensions
- Providers, carriers, and reference codes

## Stewardship

Every governed class has an owner, steward, quality rules, matching policy, source precedence, correction process, and service level.

## Quality Dimensions

- Completeness
- Validity
- Uniqueness
- Consistency
- Timeliness
- Accuracy
- Referential integrity
- Provenance

## Issue Lifecycle

Detected, Triaged, Assigned, Correcting, Awaiting Source, Resolved, Waived, and Reopened.

## Rules

1. Quality corrections use owning-domain commands.
2. Duplicate candidates are not merged automatically when risk is material.
3. Reference data is versioned and effective-dated.
4. Imports cannot weaken required quality rules.
5. Quality dashboards do not expose protected data broadly.
6. AI may suggest corrections but cannot silently apply high-impact changes.

## Quality Gates

- Data-quality checks at import and write boundaries
- Duplicate and survivorship tests
- Stewardship queue
- Change audit
- Historical replay
- Customer-visible correction workflow
