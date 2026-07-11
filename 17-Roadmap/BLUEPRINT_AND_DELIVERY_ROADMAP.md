---
document_id: PDA-RDM-001
title: Blueprint and Delivery Roadmap
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Blueprint and Delivery Roadmap

## Purpose

Sequence blueprint ratification, technical prototypes, implementation-ready specifications, and product delivery so capability breadth does not outrun architecture, usability, security, or customer evidence.

## Current Readiness

The repository is ready for controlled technical prototypes only.

Production implementation is blocked until the governing documents for the selected vertical slice are approved and the audit remediation gates below are satisfied.

## Phase 0 — Audit Remediation and Governance

- Resolve stack contradictions
- Establish AI-agent instructions and registries
- Decide the Party model
- Specify extensible metadata and custom fields
- Register AI orchestration ownership
- Specify sequence and numbering
- Define planned repository sections honestly
- Add documentation validation CI
- Split ratification into review waves

Exit criteria:

- No unresolved blocker-level repository contradiction
- Foundation and kernel review wave prepared
- Machine-readable document, namespace, and capability registries available
- A constrained prototype slice selected

## Phase 1 — Technical Foundation Prototype

Build a non-production vertical slice that proves:

- Better Auth sign-in, sessions, 2FA, and passkeys through the platform adapter
- Tenant, organization, workspace, Party, permission, and entitlement context
- Product and catalog read model
- Inventory ledger and availability
- One POS or stock transaction
- Sequence allocation
- Audit and transactional outbox
- Next.js web client
- Expo offline client with SQLite
- Synchronization and conflict handling
- OpenTelemetry traces
- One carefully governed AI assistance workflow

This phase validates architecture. It does not establish broad product scope.

## Phase 2 — First Market Slice Decision

### Provisional Candidate

Caribbean small and medium retail operations:

- POS
- Product catalog
- Inventory
- Purchasing essentials
- Customer and supplier Party roles
- Tax and receipt rules
- Basic financial handoff
- Offline continuity
- Multi-location support
- Local payment and fiscal integrations where required

This candidate is attractive because it aligns with existing domain knowledge and prior operating experience. It remains provisional until customer interviews, market research, payment-rail analysis, fiscalization research, and implementation-cost estimates are complete.

### Decision Criteria

- Pain severity and willingness to pay
- Existing customer access
- Competitive gap
- Regulatory and fiscal complexity
- Offline need
- Migration burden
- Integration availability
- Support and implementation cost
- Time to measurable value
- Ability to become a reusable platform proof rather than a one-off product

## Phase 3 — First Production Slice

Before implementation, promote the following from outline to full specification depth:

- Tenancy and organizations
- Better Auth identity architecture
- Authorization and policy
- Entitlements and licensing
- Party and relationships
- Extensible metadata
- Sequence and numbering
- Audit, events, jobs, files, search, devices, and offline synchronization
- Product Catalog
- Inventory
- Commerce and POS
- Pricing, Tax, Payment, Documents, Workflow, and AI orchestration as required
- Security, Data, UX, Testing, Deployment, and Operations specifications for the slice

Exit criteria:

- Approved governing specifications
- Threat models and privacy review
- End-to-end test plan
- Migration and support plan
- Commercial offer and cost model
- Pilot customers and success metrics

## Phase 4 — Workforce and Payroll Slice

Potential second slice:

- Workforce core
- Time and attendance
- Leave
- Payroll for one validated jurisdiction
- Employee self-service
- Finance postings and reconciliation
- Statutory reporting

Each new jurisdiction is a governed pack with effective-dated rules, evidence, tests, and review—not a hard-coded expansion.

## Phase 5 — Domain Expansion

Add domains only when the platform kernel, shared engines, design system, developer platform, and operations can support them without lowering quality.

Candidate ordering is evidence-driven and may include:

- Procurement and warehouse depth
- CRM and service
- Finance depth
- E-commerce or connector-first storefront
- Projects and field service
- Manufacturing
- Assets, fleet, and rental

## Ratification Waves

1. Foundation
2. Platform Kernel
3. Architecture and ADRs
4. Business Engines
5. Business Domains and Capability Map
6. Industry Packs
7. Commercial Architecture
8. AI, Developer Platform, Marketplace, UX, Data, Security, Deployment, Engineering, Operations, Testing, and Strategy

The large authoring pull request may remain open as a workspace, but approval must occur through smaller reviewable waves.

## Scope Guardrails

- Do not attempt all 400-plus capabilities in the first release.
- Do not launch a domain without one complete, measurable workflow.
- Do not promise a jurisdiction before legal, tax, payment, fiscalization, and support readiness.
- Do not use AI autonomy to compensate for missing deterministic business behavior.
- Do not require professional services for ordinary customer success.
- Do not expand an industry pack through code forks.

## Success Measures

Each delivered workflow must track:

- Time to first value
- Completion time
- Steps, clicks, and required typing
- Error and correction rate
- Training time
- Mobile and offline success
- Accessibility outcomes
- Support burden
- Reliability and performance
- AI acceptance and override rate
- Customer business outcome
- Competitive benchmark position
