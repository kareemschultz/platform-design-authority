---
document_id: PDA-REV-004
title: Fable 5 Second Audit Disposition V1
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
source_audit: reviews/FABLE5_SECOND_AUDIT_V1.md
source_audited_commit: 4070e2f94b8b977f257fb2b91e181f6ff5a76e17
---

# Fable 5 Second Audit Disposition V1

## Purpose

Record the Platform Design Authority response to the second independent Fable 5 audit and provide verifiable closure criteria for each finding.

## Overall Disposition

The audit's conclusion—**controlled technical prototypes only**—is accepted.

The audit correctly identified propagation as the dominant failure mode. Decisions are not considered closed merely because a new ADR or file exists; older authority documents, capability maps, dependency matrices, registries, tests, and industry packs must agree.

## Critical Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-001 Stored-value ownership | Accepted | ADR-0013 selects Commerce; added Stored Value specification; aligned Payment, Finance, Loyalty, Commerce, Retail, capability map, and dependency matrix | Closed pending independent verification |
| SA-002 Erasure versus append-only | Accepted | ADR-0014 selects PII isolation and irreversible pseudonymization; added deletion journal, backup restore, offline, audit, Party, privacy, and data-consistency rules | Closed pending independent verification |
| SA-003 Tenant merchant acquiring model | Accepted | ADR-0015 selects direct tenant-provider contracts first; cash is first-class; regional rails and recurring collection constraints updated | Closed architecturally; legal/regulatory verification remains open |

## High Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-004 Kernel charter drift | Accepted | Kernel overview updated to v0.2.0 with current primitives and boundaries | Closed pending verification |
| SA-005 Party propagation | Accepted | Procurement, CRM, Healthcare, Party, kernel, and dependency documents aligned to ADR-0007 | Closed pending verification |
| SA-006 Retail versus fiscalization | Accepted | Retail pack now treats fiscalization as jurisdiction-conditional core architecture and links Guyana profile | Closed pending jurisdiction evidence |
| SA-007 Statutory returns ownership | Accepted | Tax produces calculation and return data; Fiscalization packages/submits; Finance accounts and reconciles | Closed pending verification |
| SA-008 Webhook ownership | Accepted | Developer Platform owns external webhooks; Notifications owns person-directed delivery; map and matrix updated | Closed pending verification |
| SA-009 Risk service registration | Accepted | Registered `security.*` capability family, data owner, matrix row, cases, appeals, and GRC boundary | Closed pending verification |
| SA-010 Cash absent | Accepted | Added cash lifecycle to Payment, regional rails, Retail, Guyana profile, first slice, roadmap, and ADR-0015 | Closed pending workflow-depth review |
| SA-011 Recurring rail mismatch | Accepted | Recurring Agreements now select verified auto-debit, request-to-pay, invoice/manual, standing-order, or cash modes | Closed pending provider evidence |
| SA-012 Missing storefront and recurring capabilities | Accepted | Capability map and dependency matrix now register storefront, connector, recurring-agreement, and membership capabilities | Closed pending registry verification |
| SA-013 Subscription ambiguity | Accepted | Defined Platform Subscription versus Commerce Recurring Agreement in glossary, naming standards, lifecycle, domain, and roadmap | Closed pending terminology scan |
| SA-014 Invalid events and namespaces | Accepted | ADR-0016, namespace registry, event standards, event validator, and generated event registry added; source events being normalized | In progress until CI is green |
| SA-015 Erasure target gaps | Accepted | Added target acknowledgement, offline tombstones and lease expiry, multi-role Party rules, webhook purge, AI retention, and backup reapplication | Closed pending scenario testing |
| SA-016 Operationally hollow risk service | Accepted | Added risk capability family, case states, SLA, evidence, appeals, fraud-by/against distinction, and cross-tenant restrictions | Closed pending threat-model review |

## Medium Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-017 Manifest taxonomy | Accepted | Manifest aligned to current engines, platform services, Security, Developer, and Commercial control planes | Closed pending verification |
| SA-018 Paid membership overlap | Accepted | Recurring Commerce owns agreement and collection; Loyalty owns benefits and non-cash ledger | Closed pending verification |
| SA-019 Fiscalization dependency arrows | Accepted | Dependency matrix rewritten with Tax, Documents, Numbering, source, and consumer directions | Closed pending verification |
| SA-020 Loyalty/Promotion versus Risk velocity | Accepted | Local correctness limits remain in domains/engines; cross-transaction correlation and cases belong to Security Risk | Closed pending verification |
| SA-021 Documents claims collaboration | Accepted | Generic collaboration moved to Platform Collaboration; formal document review remains in Documents | Closed pending verification |
| SA-022 Storefront breadth | Accepted | Native production storefront deferred; first slice contains connector/headless seams only | Closed pending founder ratification |
| SA-023 Storefront content owner | Accepted | Marketing owns landing/navigation/merchandising content; Documents owns controlled legal content | Closed pending verification |
| SA-024 E-commerce sequence conflict | Accepted | Commerce, Storefront, Retail, Manifest, roadmap, and first-slice manifest aligned to connector-first/deferred native storefront | Closed pending founder ratification |
| SA-025 Rail asymmetry and currency | Accepted | Added refund/reversal matrix, GYD-first and USD/multi-currency seams, cash, mixed tender, and stored-value rules | Partially closed; provider-specific matrices remain |
| SA-026 Guyana regulator and MMG unknowns | Accepted | Guyana jurisdiction profile and provider known-unknowns added; unavailable regulator site recorded as limitation | Open until authoritative legal/regulatory review |
| SA-027 Backup resurrection | Accepted | Backup/restore spec requires deletion-journal watermark and reapplication before traffic | Closed pending restore test |
| SA-028 Section indexes and root map | Accepted | Root README and current section indexes now link implemented files and expose registries/scripts/CLAUDE | Closed pending link validation |
| SA-029 TanStack Form pre-commitment | Accepted | ADR-0005 must state evaluation without preselecting TanStack Form | In progress |
| SA-030 Search overlap and taxonomic ambiguity | Accepted | Search/Data/AI ownership and Commerce sub-capability taxonomy are being aligned; Event Backbone family list requires update | In progress |
| SA-031 Governance tooling gaps | Accepted | Expanded governed-file coverage, event lint, namespace checks, internal links, first-slice registry, and event registry | In progress until CI proves freshness |

## Founder Decisions

### Payment Operating Model

Recommended and provisionally adopted through ADR-0015: direct tenant-provider merchant contracts first. Founder ratification and qualified legal/regulatory review are still required before production claims.

### Platform Legal Entity and Billing Currency

Open. `20-Strategy/FOUNDER_DECISION_REGISTER.md` records the required inputs. Architecture will not invent the contracting entity, tax residence, bank accounts, or final billing currency.

### Storefront and Recurring Commerce

Recommended and provisionally adopted: exclude the production native storefront and tenant Recurring Agreements from the first operational pilot. Preserve headless and connector seams. Founder ratification remains required before first-slice specifications enter review.

## New Documents and Decisions Created

- ADR-0013 — Commerce owns customer stored value
- ADR-0014 — PII isolation and irreversible pseudonymization
- ADR-0015 — Direct tenant merchant contracts first
- ADR-0016 — Registered namespaces and event conventions
- Stored Value and Customer Balances
- PII Erasure and Pseudonymization
- Threat Model and Tenant Isolation Strategy
- Data Classification and Handling
- Backup, Restore, and Disaster Recovery
- Platform Testing Strategy
- Guyana Retail Jurisdiction Profile
- First Slice Capability Manifest
- Founder Decision Register

## Remaining Blocking Work Before First-Slice Specifications Enter Review

1. Founder ratification of first-slice scope and payment operating model.
2. Founder decision on platform legal entity and billing/settlement currency.
3. Authoritative Guyana tax, payment-regulation, privacy, receipt, and fiscalization research.
4. Green CI with current document, capability, event, namespace, and first-slice registries.
5. Resolve SA-029 and SA-030.
6. Produce first-slice data flows, threat model, entity schemas, state machines, API contracts, and UX workflows.
7. Run another independent Fable audit against the remediated commit.

## Closure Rule

A finding closes only when:

- The selected decision is explicit.
- Every affected authoritative document is aligned.
- Capability and dependency registries reflect the result.
- CI passes.
- Tests or review evidence exist where the finding is behavioral.
- The next independent audit can verify the closure without relying on a progress summary.