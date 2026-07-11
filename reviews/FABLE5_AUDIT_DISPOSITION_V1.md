---
document_id: PDA-REV-002
title: Fable 5 Audit Disposition V1
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
source_audit_commit: ddae31d4cd7ff30931c67335ca1227516b490602
---

# Fable 5 Audit Disposition V1

## Purpose

Record the Platform Design Authority response to the independent full-repository audit performed against all 122 Markdown files on `docs/initial-blueprint` at commit `ddae31d`.

## Overall Disposition

The audit verdict **Ready only for technical prototypes** is accepted.

The repository remains an architectural blueprint under construction. No production implementation may claim conformance until the governing documents for the selected vertical slice pass their lifecycle gates.

## Blocking Findings

| Finding | Disposition | Reason | Required Action |
|---|---|---|---|
| GAP-001 Missing declared directories | Accepted | The README presents the intended final hierarchy as if it already exists. | Add planned-section indexes or adjust the README; create a roadmap before ratification. |
| GAP-002 Missing extensible metadata and custom fields | Accepted | Configuration, industry packs, integrations, search, reporting, offline, permissions, and AI schemas require a governed extension model. | Create a kernel specification and persistence ADR before domain schemas are finalized. |
| GAP-003 Unresolved Party model | Accepted | Customer, supplier, worker, contact, and other roles can refer to one real-world party. Fragmented master data would damage every downstream domain. | Create a canonical Party and Relationship ADR and specification before domain schema work. |
| GAP-004 Stack contradictions | Accepted | ADR-0006 supersedes the managed-IdP recommendation; the form standard remains under evaluation. | Revise the stack document, Better-T-Stack document, and ADR-0004. |
| GAP-005 Missing AI engine owner | Accepted | AI is referenced as a shared engine without an owning specification or capability family. | Register an AI orchestration engine and defer detailed architecture to `06-AI`. |

## Ambiguities

| Finding | Disposition | Action |
|---|---|---|
| AMB-001 Kernel and engine boundary drift | Accepted | Clarify primitive-versus-orchestration boundaries in the manifest and relevant specs. |
| AMB-002 Missing prefix registry | Accepted | Add `registry/domains.json`; later generate capability, event, permission, and document registries. |
| AMB-003 Backend framework simultaneously decided and open | Accepted with clarification | NestJS/Fastify remains the preferred baseline but must pass the first vertical-slice benchmark before ratification. |
| AMB-004 Loyalty has no owner | Accepted | Add an ownership ADR or domain decision before loyalty enters a release scope. |
| AMB-005 Module definition drift | Accepted | Align the Glossary and Naming Standards during the next foundation cleanup. |
| AMB-006 Better Auth evidence quality | Accepted | Add dated, version-aware official references and commercial dependency notes. |

## Missing Capabilities and Services

| Area | Disposition | Timing |
|---|---|---|
| Sequence and numbering service | Accepted | Before first offline or fiscal transaction implementation |
| Webhook management | Accepted | Before public developer platform or third-party integrations |
| Import, export, and migration platform | Accepted | Before customer onboarding at production scale |
| Rate limiting and quotas | Accepted | Before external API exposure |
| Privacy rights and retention workflows | Accepted | Before production personal-data processing |
| Collaboration primitives | Accepted | Before broad cross-role workflow delivery |
| Tenant-facing recurring commerce | Accepted | Before salon, education, nonprofit, or retainer workflows |
| Fiscalization | Accepted | Before entering jurisdictions that mandate fiscal devices or e-invoicing controls |
| Storefront scope | Accepted | Decide connector-first versus owned storefront in roadmap |
| Anomaly and fraud engine | Accepted for registration, deferred for implementation | After transactional foundation |
| Semantic search ownership | Accepted | Resolve jointly in Search and AI architecture |
| Billing-provider ADR | Accepted | Before paid platform launch |

## Delivery and Governance Findings

- The recommendation to define a constrained beachhead is accepted. Caribbean SMB retail is a strong candidate, not yet a ratified roadmap decision.
- The recommendation to deepen selected documents through the full specification template before implementation is accepted.
- The current large draft PR may remain an authoring workspace, but ratification will be split into review waves.
- Version references will move from permanent hard-coded assumptions to dated compatibility records and approved support ranges.
- Better Auth licensing and managed-infrastructure pricing will be treated as a variable vendor dependency, not embedded permanently into customer promises.

## Claude Code Operating Kit

The audit's operating-kit recommendation is accepted.

Initial actions:

1. Add root `CLAUDE.md`.
2. Add canonical namespace registry.
3. Add generated document and capability registries.
4. Add documentation validation CI.
5. Add blueprint authoring and consistency-audit skills.
6. Add implementation skills only after the first vertical-slice specifications are approved.

## Ratification Waves

1. Foundation
2. Platform Kernel
3. Architecture and ADRs
4. Business Engines
5. Business Domains and Capability Map
6. Industry Packs
7. Commercial Architecture
8. AI, Data, Security, UX, Deployment, Testing, and Roadmap

Each wave requires explicit review findings, dispositions, owner approval, and lifecycle status changes.

## Next Remediation Order

1. Resolve live stack contradictions.
2. Establish AI-agent contribution rules and registries.
3. Decide Party ownership.
4. Specify extensible metadata and custom fields.
5. Register the AI orchestration engine.
6. Specify sequence and numbering.
7. Create the first-release roadmap and vertical-slice decision.
8. Create planned-section indexes and remaining architectural books.

## Closure Rule

A finding closes only when the affected documents are changed, cross-references are updated, and the resolution is verifiable from the repository. A statement of intent is not closure.
