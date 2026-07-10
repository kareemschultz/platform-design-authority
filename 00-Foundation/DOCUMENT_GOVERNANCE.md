---
document_id: PDA-FND-011
title: Document Governance
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Document Governance

## Purpose

This document defines how blueprint documents are created, reviewed, approved, ratified, versioned, changed, superseded, and used by human and AI contributors.

## Authority Order

1. Ratified Constitution
2. Accepted Architecture Decision Records
3. Approved domain, engine, data, UX, security, AI, commercial, and operational specifications
4. Approved standards and handbooks
5. Draft documents and proposals
6. Implementation notes and source code comments

A lower-authority document may not silently override a higher-authority document.

## Required Metadata

Every authoritative document must include:

- `document_id`
- `title`
- `version`
- `status`
- `owner`
- `last_reviewed`
- `supersedes` where applicable
- `superseded_by` where applicable

Additional metadata may include reviewers, dependencies, effective date, review cadence, classification, and related ADRs.

## Lifecycle

### Draft

Content is under active development and may change materially.

### In Review

The document is considered complete enough for structured review. Blocking issues must be recorded and resolved.

### Approved

The document may guide implementation. Approval indicates required reviewers have accepted its current scope.

### Ratified

Reserved for Constitution-level or similarly foundational documents. Ratification requires the highest governance threshold.

### Deprecated

The document remains available for historical context but should no longer guide new implementation.

### Superseded

A newer document or decision replaces it. Both documents must link to each other.

## Versioning

Blueprint documents use semantic versioning:

- **Major:** changes meaning, contracts, authority, or compatibility
- **Minor:** adds approved content without invalidating prior meaning
- **Patch:** clarification, correction, formatting, or non-semantic improvement

Draft iteration may remain within version `0.x`. Version `1.0.0` indicates the first approved stable baseline unless a document-specific rule states otherwise.

## Review Requirements

Reviewers are selected according to impact. Possible perspectives include:

- Founder and product strategy
- Architecture
- Security and privacy
- Data governance
- UX and accessibility
- AI governance
- Commercial and billing
- Operations and reliability
- Legal and compliance
- Independent AI review

The author should not be the sole approver of a Class A or Class B decision.

## Review Disposition

Every material comment must receive one of these dispositions:

- Accepted
- Accepted with modification
- Rejected with rationale
- Deferred to a named follow-up
- Out of scope with destination document

Unresolved blocking comments prevent approval.

## Change Process

1. Open or update a tracked proposal
2. Change the document on a dedicated branch
3. Update version and change log
4. Link related ADRs, issues, and specifications
5. Request required reviews
6. Resolve comments with written dispositions
7. Merge after approval
8. Update indexes and supersession links
9. Communicate implementation impact

## AI Contributor Rules

AI agents must:

- Read the relevant approved documents before producing implementation plans or code
- Cite document IDs and ADRs in plans and pull requests
- Distinguish approved rules from drafts and suggestions
- Never invent an absent platform-wide rule inside code
- Report conflicts between documents rather than choosing silently
- Propose changes through the documented review process
- Preserve tenant, security, entitlement, audit, and data-ownership requirements

## Pull Request Requirements

Blueprint pull requests should include:

- Purpose and scope
- Documents added or changed
- Decision class
- Related issues and ADRs
- Review perspectives required
- Known risks and unresolved questions
- Compatibility or implementation impact

## Review Cadence

- Constitution and Canon: at least annually or after major strategic change
- Architecture and security standards: every six months or after major incidents
- Commercial, AI, and regulatory documents: as market, provider, or legal conditions change
- Domain specifications: at major capability milestones
- Roadmaps: at least quarterly

## Repository Integrity

- Main branch contains the current accepted history
- Draft work occurs through branches and pull requests
- Documents are never deleted solely to hide prior decisions
- Sensitive customer data, secrets, credentials, or private keys must never be committed
- Generated copies may exist, but Markdown source remains authoritative unless explicitly changed
