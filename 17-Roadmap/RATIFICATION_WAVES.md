---
document_id: PDA-RDM-002
title: Blueprint Ratification Waves
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Blueprint Ratification Waves

## Purpose

Define reviewable approval waves so the blueprint is not treated as one indivisible pull request and no draft document silently becomes implementation authority.

## Principles

1. Ratify dependency order, not folder order alone.
2. Keep each review wave small enough for meaningful human and AI review.
3. Resolve blocking contradictions before the dependent wave begins.
4. Record every review finding and disposition.
5. Approval of a wave does not approve future or unrelated documents.
6. Implementation references only Approved, Accepted, or Ratified documents plus explicitly authorized prototype exceptions.

## Wave 0 — Repository Governance

Scope:

- Document governance
- Naming standards and glossary
- Templates
- CLAUDE.md
- Registries and documentation CI
- Review and disposition process

Exit criteria:

- CI is green
- Document IDs and registries reconcile
- Authority order is unambiguous
- Review evidence is stored

## Wave 1 — Constitution and Product Foundation

Scope:

- Platform Canon
- Constitution
- Values and guiding principles
- Product, UX, engineering, security, and AI philosophies
- Decision framework

Exit criteria:

- No contradictory supreme rules
- Competitive and usability goals are measurable
- Scope and non-goals are explicit

## Wave 2 — Platform Kernel

Scope:

- Tenancy and organizations
- Party model
- Identity and Better Auth
- Authorization and entitlements
- Configuration and custom metadata
- Audit, events, jobs, notifications, files, search, numbering, quotas, collaboration, import/export, devices, and offline synchronization

Exit criteria:

- Tenant isolation model approved
- Party and identity links approved
- Authentication, authorization, and entitlement boundaries approved
- First-slice kernel state machines and contracts exist

## Wave 3 — Architecture and Technology Decisions

Scope:

- System context
- Modular monolith
- Data ownership and consistency
- Domain communication
- API and event standards
- Integration architecture
- Quality attributes
- Technology stack and client architecture
- ADR-0001 onward

Exit criteria:

- All live contradictions closed
- Conditional decisions have measurable experiments
- Source verification is dated
- Deployment and failure assumptions are explicit

## Wave 4 — Shared Business Engines

Scope:

- Workflow, approvals, rules, automation
- Pricing, tax, payments, promotions, loyalty
- Documents, fiscalization, scheduling
- Branding, workspaces, dashboards, reporting, and AI orchestration

Exit criteria:

- Each engine has one owner and stable boundary
- Domain-specific records remain outside engines
- First-slice engine contracts are complete

## Wave 5 — First-Slice Domains

Initial scope:

- Product Catalog
- Commerce and POS
- Inventory
- Party projections in CRM and Procurement
- Basic Finance handoff

Exit criteria:

- Entity models, commands, events, permissions, entitlements, state machines, reports, and offline declarations are implementation-ready
- Worked end-to-end scenarios pass architecture review

## Wave 6 — Industry and Jurisdiction Pack

Initial scope:

- Retail pack
- Guyana or selected Caribbean jurisdiction requirements
- Payment rails
- Fiscal receipt and statutory obligations
- Localization and tax configuration

Exit criteria:

- No code fork required
- Legal assumptions are reviewed
- Certification and provider dependencies are known

## Wave 7 — Commercial Architecture

Scope:

- Packaging and editions
- Entitlements and metering
- Billing and subscription lifecycle
- White label and partners
- Support and implementation services
- Provider and regional payment strategy

Exit criteria:

- Sellable offer can be mapped to entitlements and invoices
- Downgrade, suspension, export, and partner-exit behavior is complete
- Unverified provider promises are removed

## Wave 8 — AI, Security, Data, UX, Deployment, Testing, and Operations

These sections become separate review waves as their planned indexes are expanded into full specifications. AI and Security may be pulled earlier where the first vertical slice depends on them.

## Prototype Exception

Before ratification completes, a constrained technical prototype may implement Draft documents only when:

- The experiment is named in an ADR or roadmap
- The code is non-production
- The assumption under test is explicit
- Results are captured
- No draft behavior is represented as final architecture

## Review Records

Each wave produces:

- Scope manifest and commit SHA
- Independent review report
- Finding disposition table
- Revised documents
- Final approval record
- Deferred-items register
- Next-wave dependency statement
