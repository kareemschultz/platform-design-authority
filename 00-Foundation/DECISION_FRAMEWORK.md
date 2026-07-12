---
document_id: PDA-FND-004
title: Decision Framework
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Decision Framework

## Purpose

This framework defines how significant product, architecture, UX, security, AI, commercial, and operational decisions are proposed, reviewed, approved, recorded, and revisited.

## Decision Classes

### Class A — Constitutional

Changes platform-wide rules, authority, core trust boundaries, tenancy, identity, data ownership, or governance.

**Required:** Founder approval, architecture review, security review, impact analysis, independent review, and a ratified amendment.

### Class B — Architectural

Introduces or changes domains, engines, contracts, deployment topology, extension mechanisms, persistence strategy, or cross-cutting infrastructure.

**Required:** ADR, architecture approval, security and operations review, migration plan, and validation criteria.

### Class C — Product and Commercial

Introduces major capabilities, packaging, pricing, entitlements, plans, usage meters, partner programs, or industry solutions.

**Required:** Capability proposal, product review, commercial review, UX review, architecture impact, and measurable success criteria.

### Class D — Local Implementation

Changes behavior inside an approved capability without altering public contracts or platform-wide rules.

**Required:** Normal engineering review, tests, documentation, and traceability to an approved specification.

## Six Review Lenses

Every material proposal is evaluated through six lenses.

### User and Experience

- Which user problem is solved?
- Is the workflow discoverable, accessible, and role-appropriate?
- Does it reduce or introduce cognitive load?
- What is the mobile and offline experience?

### Platform and Architecture

- Which domain owns it?
- Is a shared engine required?
- What contracts, events, and dependencies change?
- Can it remain inside a modular monolith, or is isolation justified?

### Security, Privacy, and Compliance

- What data is accessed, stored, exported, or deleted?
- What permissions, approvals, audit, retention, and consent rules apply?
- Could it weaken tenant isolation or create an escalation path?

### Commercial

- Is it core, bundled, add-on, industry-pack, partner-only, or usage-based?
- Which entitlements and meters are required?
- What happens during trial, downgrade, suspension, and cancellation?

### AI and Automation

- Can AI explain, recommend, prepare, or execute this capability?
- What tool permissions and approvals apply?
- What evidence, provenance, and evaluation are required?

### Engineering and Operations

- How is it tested, deployed, observed, supported, migrated, recovered, and deprecated?
- What are expected scale, latency, availability, and cost characteristics?
- How is failure contained and communicated?

## Decision Process

1. **Frame the problem** — state the user need, business need, constraints, and urgency.
2. **Identify ownership** — assign the domain, decision owner, reviewers, and document class.
3. **Collect evidence** — research workflows, constraints, comparable systems, risks, and data.
4. **Generate options** — include a do-nothing option and avoid presenting a predetermined decision as analysis.
5. **Evaluate tradeoffs** — use the six review lenses and Constitution.
6. **Record the decision** — create or update the relevant specification and ADR.
7. **Approve deliberately** — record approvals, objections, unresolved risks, and conditions.
8. **Implement with traceability** — link issues, pull requests, tests, releases, and migrations.
9. **Validate outcomes** — measure product, operational, quality, and commercial results.
10. **Revisit when triggered** — review when assumptions, scale, laws, costs, or user needs change.

## Decision Outcomes

- **Approved** — ready for implementation under stated conditions.
- **Approved with conditions** — implementation may begin after listed prerequisites are met.
- **Experiment** — limited, reversible validation is authorized; no platform commitment yet.
- **Deferred** — valuable but not justified now.
- **Rejected** — does not satisfy requirements or creates unacceptable tradeoffs.
- **Superseded** — replaced by a newer approved decision.

## Escalation Rules

A decision must be escalated when it:

- Changes tenant isolation, identity, authorization, or encryption
- Changes financial, inventory, payroll, or audit integrity
- Introduces a new domain or shared engine
- Creates a new public API, event, or extension contract
- Requires a source-code fork for a customer or industry
- Introduces irreversible AI or automation behavior
- Changes licensing enforcement or billing authority
- Creates a breaking migration or deprecation

## Evidence Standards

Claims should be supported by one or more of:

- User interviews or observed workflows
- Production telemetry or support evidence
- Prototype or usability testing
- Security and threat analysis
- Performance or cost modeling
- Legal or compliance review
- Technical spike or benchmark
- Independent architecture review

## Decision Record Minimums

Every significant decision must include:

- Context and problem
- Decision drivers
- Options considered
- Chosen decision and rationale
- Positive and negative consequences
- Risks and mitigations
- Migration and rollback
- Validation criteria
- Ownership and review record
