---
document_id: PDA-RDM-001
title: Blueprint and Delivery Roadmap
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
related_adrs: [ADR-0013, ADR-0014, ADR-0015]
---

# Blueprint and Delivery Roadmap

## Purpose

Sequence blueprint ratification, technical prototypes, implementation-ready specifications, and product delivery so capability breadth does not outrun architecture, usability, security, regulatory readiness, or customer evidence.

## Current Readiness

The repository is ready for controlled technical prototypes only, subject to the workstream entry gates in PDA-RDM-004/007 and the approved WSX external-evidence track in PDA-REV-015.

Production implementation is blocked until the governing documents for the selected vertical slice are approved and the audit remediation gates below are satisfied.

The bounded human-readable scope is `docs/blueprint/17-Roadmap/FIRST_SLICE_MANIFEST.md`; the machine-readable index is `registry/first-slice.json`.

## Phase 0 — Audit Remediation and Governance

Completed or materially addressed:

- Stack contradictions
- AI-agent instructions and namespace registries
- Canonical Party model
- Extensible metadata and custom fields
- AI orchestration ownership
- Sequence and numbering
- Honest repository section indexes
- Documentation validation CI
- Ratification waves
- Stored-value ownership
- Privacy erasure and append-only reconciliation
- Initial direct tenant-merchant payment model
- Event namespaces and registry generation
- Founder ratification of the bounded first retail beachhead scope (FDR-004, 2026-07-17)

Still open before broad ratification:

- Founder ratification of platform legal entity and billing currency
- Authoritative Guyana tax, payment, privacy, and fiscal research
- Full first-slice specifications and threat models
- UX, accessibility, deployment, operations, and testing depth

Exit criteria:

- No unresolved blocker-level repository contradiction
- Foundation and kernel review waves prepared
- Machine-readable document, namespace, capability, event, and first-slice registries available
- A constrained prototype slice selected and founder-ratified — **satisfied on 2026-07-17 by FDR-004** for the scope and depth/deferral contract in PDA-RDM-003 and `registry/first-slice.json`

M0 passed on 2026-07-13 while FDR-004 was still only provisionally adopted. The later ratification resolves the scope-authority gate prospectively; it does not rewrite that historical deviation, promote the Draft scope documents, or authorize pilot/production use. The separate P-W2a tracking synchronization records the historical sequence and review evidence.

## Phase 1 — Technical Foundation Prototype

Execution note (2026-07-17, fifth-audit F-L-008): this phase is executed as the WS0–WS7 workstream decomposition in `FIRST_SLICE_IMPLEMENTATION_PLAN.md` (PDA-RDM-007) and the prototype sequence in `TECHNICAL_PROTOTYPE_PLAN.md` (PDA-RDM-004); the single-slice content list below is the scope inventory, not the delivery order. Offline sync and backup/restore items land in WS5/WS7 after WS3, per those plans.

Founder controls recorded on 2026-07-17 apply to that execution sequence:

- WSX is the approved parallel external-evidence track, with accountable roles and start-by/finish-by milestone gates in PDA-REV-015 and PDA-RDM-007.
- WS3 may not start until the repository disclosure/redaction review is complete and the market-evidence record contains at least 8 structured interviews plus 3 direct workflow observations across at least 3 distinct businesses. This is a hard gate; agent-generated, simulated, inferred, or waived evidence is not acceptable.
- P1–P3 retain the FA4 controlled-prototype clearance. P4–P7 receive general entry clearance only at the M3 standing-charter checkpoint, after the checkpoint is recorded; every workstream-specific founder, ADR, provider, security, evidence, and sequencing gate remains binding.

Build a non-production vertical slice that proves:

- Better Auth sign-in, sessions, 2FA, passkeys, and session revocation through the platform adapter
- Tenant, organization, workspace, Party, permission, and entitlement context
- Product and catalog read model
- Inventory ledger and availability
- POS cash transaction and one directly contracted payment-adapter seam
- Commerce-owned stored-value issue and redemption
- Sequence allocation and offline numbering
- Audit and transactional outbox
- Next.js web client
- Expo offline client with SQLite
- Synchronization, privacy tombstones, and conflict handling
- OpenTelemetry traces
- Backup restore with deletion-journal reapplication

AI is optional in this phase. If included, it must be one low-risk, measurable, read-only or draft-assistance workflow and must not become an acceptance dependency.

This phase validates architecture. It does not establish statutory compliance or broad product scope.

## Phase 2 — First Market Slice Decision

### Selected Founder-Ratified Scope Candidate

FDR-004 ratifies the bounded Guyana-first Caribbean small and medium retail scope candidate below. This is scope authority, not customer validation or an Approved lifecycle promotion:

- POS and register control
- Product catalog and search
- Inventory and stock counts
- Cash, mixed tender, and deposit reconciliation
- Returns and refunds
- Customer and supplier Party roles
- Gift cards and store credit
- Tax and receipt seams
- Accountant-ready financial handoff
- Offline continuity
- Multi-location foundations
- Direct tenant-provider payment adapters
- Fiscalization interface where jurisdiction review requires it

The detailed scope is controlled by the First Slice Manifest. The native reference storefront and tenant Recurring Agreements are deferred unless a named pilot and verified collection rail justify them.

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

### Remaining Founder and External Gates

Before this candidate package becomes Approved:

- Confirm platform legal entity and contracting structure.
- Confirm platform billing and settlement currencies.
- Ratify direct tenant merchant contracts as the initial payment model.
- Approve named pilot-customer criteria and success metrics.

FDR-004 already ratifies the production storefront and tenant Recurring Agreement deferrals for this first slice. Any reversal or expansion requires the manifest/registry change-control path and new Founder approval.

## Phase 3 — First Production Slice

Before implementation, promote the following from outline to full specification depth:

- Tenancy and organizations
- Better Auth identity architecture
- Authorization and policy
- Entitlements and licensing
- Party and relationships
- Extensible metadata
- Sequence and numbering
- Data classification, privacy erasure, and deletion journal
- Audit, events, jobs, files, search, devices, and offline synchronization
- Import/export and migration
- Product Catalog
- Inventory
- Commerce, POS, cash, returns, and stored value
- Pricing, Tax, Payment, Fiscalization, Documents, Workflow, and Risk as required
- Security threat model and tenant-isolation tests
- UX and accessibility specifications
- Testing, deployment, backup, recovery, observability, and operations
- Guyana jurisdiction profile with dated authoritative evidence

Exit criteria:

- Approved governing specifications
- Threat models, data classification, and privacy review
- End-to-end and cross-tenant test plan
- Migration, backup, recovery, and support plan
- Commercial offer and cost model
- Provider and jurisdiction evidence
- Pilot customers and measurable success criteria

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
- External commerce connectors and then the native reference storefront
- Tenant Recurring Agreements after payment-rail validation
- Projects and field service
- Manufacturing
- Assets, fleet, and rental

## Ratification Waves

1. Foundation
2. Platform Kernel
3. Architecture and ADRs
4. Business Engines
5. Business Domains and Capability Map
6. Industry and Jurisdiction Packs
7. Commercial Architecture
8. AI, Developer Platform, Marketplace, UX, Data, Security, Deployment, Engineering, Operations, Testing, Roadmap, and Strategy

The large authoring pull request may remain open as a workspace, but approval occurs through smaller reviewable waves.

## Scope Guardrails

- Do not attempt all capabilities in the first release.
- Do not launch a domain without one complete, measurable workflow.
- Do not promise a jurisdiction before legal, tax, payment, fiscalization, privacy, and support readiness.
- Do not use AI autonomy to compensate for missing deterministic business behavior.
- Do not require professional services for ordinary customer success.
- Do not expand an industry pack through code forks.
- Do not add storefront, recurring commerce, advanced loyalty, or payment-facilitator scope to the first slice without explicit change control.

## Success Measures

Each delivered workflow tracks:

- Time to first value
- Completion time
- Steps, clicks, and required typing
- Error and correction rate
- Training time
- Mobile and offline success
- Accessibility outcomes
- Support burden
- Reliability, recovery, and performance
- Fraud and privacy exception rate
- AI acceptance and override rate where AI is present
- Customer business outcome
- Competitive benchmark position
