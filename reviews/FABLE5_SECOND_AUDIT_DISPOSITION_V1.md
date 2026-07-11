---
document_id: PDA-REV-004
title: Fable 5 Second Audit Disposition V1
version: 0.2.0
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

The audit correctly identified propagation as the dominant failure mode. Decisions are not considered closed merely because a new ADR or file exists; older authority documents, capability maps, dependency matrices, registries, tests, section indexes, and industry packs must agree.

## Critical Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-001 Stored-value ownership | Accepted | ADR-0013 selects Commerce; added Stored Value specification; aligned Payment, Finance, Loyalty, Commerce, Retail, capability map, dependency matrix, first-slice scope, testing, and recovery | Closed pending independent verification |
| SA-002 Erasure versus append-only | Accepted | ADR-0014 selects PII isolation and irreversible pseudonymization; added deletion journal, backup restore, offline, audit, Party, privacy, data-consistency, classification, and test rules | Closed pending independent verification and behavioral tests |
| SA-003 Tenant merchant acquiring model | Accepted | ADR-0015 selects direct tenant-provider contracts first; cash is first-class; regional rails, refund asymmetry, currency, and recurring-collection constraints updated | Closed architecturally; founder ratification and legal/regulatory verification remain open |

## High Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-004 Kernel charter drift | Accepted | Kernel overview updated to current primitives, boundaries, delivery order, and exit criteria | Closed pending independent verification |
| SA-005 Party propagation | Accepted | Procurement, CRM, Healthcare, Party, Better Auth, kernel, Commerce, and dependency documents aligned to ADR-0007 | Closed pending independent verification |
| SA-006 Retail versus fiscalization | Accepted | Retail pack treats fiscalization as jurisdiction-conditional core architecture and links Guyana profile | Closed architecturally; Guyana jurisdiction evidence remains open |
| SA-007 Statutory returns ownership | Accepted | Tax produces calculation and return data; Fiscalization packages and submits; Finance accounts and reconciles | Closed pending independent verification |
| SA-008 Webhook ownership | Accepted | Developer Platform owns external webhooks; Notifications owns person-directed delivery; Event Backbone remains internal | Closed pending independent verification |
| SA-009 Risk service registration | Accepted | Registered `security.*` capabilities, data owner, dependency row, cases, appeals, GRC boundary, fraud-by/against distinction, and cross-tenant restrictions | Closed pending threat-model and prototype validation |
| SA-010 Cash absent | Accepted | Added cash lifecycle to Payment, regional rails, Retail, Guyana profile, Commerce, first slice, UX, operations, testing, and ADR-0015 | Closed pending workflow prototype and pilot review |
| SA-011 Recurring rail mismatch | Accepted | Recurring Agreements select verified automatic, request-to-pay, invoice/manual, standing-order, or cash modes and are deferred from the first slice | Closed pending provider evidence before delivery |
| SA-012 Missing storefront and recurring capabilities | Accepted | Capability map and dependency matrix register storefront, connectors, recurring agreements, and memberships; first-slice deferral is explicit | Closed and registry-verified |
| SA-013 Subscription ambiguity | Accepted | Defined Platform Subscription versus Commerce Recurring Agreement in glossary, naming standards, lifecycle, domains, roadmap, and agent rules | Closed pending independent terminology scan |
| SA-014 Invalid events and namespaces | Accepted | ADR-0016, namespace registry, event standards, source normalization, event validator, and generated `events.json` added | Closed; strict CI validates names, prefixes, duplicates, and registry freshness |
| SA-015 Erasure target gaps | Accepted | Added target acknowledgements, offline tombstones and lease expiry, multi-role Party rules, webhook purge, AI retention, backup reapplication, and restore gate | Closed architecturally; scenario tests remain |
| SA-016 Operationally hollow risk service | Accepted | Added risk capabilities, cases, states, service levels, evidence, appeals, fraud-by/against distinction, protective actions, and operational monitoring | Closed architecturally; prototype and operations exercise remain |

## Medium Findings

| Finding | Disposition | Remediation | Status |
|---|---|---|---|
| SA-017 Manifest taxonomy | Accepted | Manifest aligned to current engines, platform services, Security, Developer, Commercial, payment, and first-slice taxonomies | Closed pending independent verification |
| SA-018 Paid membership overlap | Accepted | Recurring Commerce owns agreement and collection; Loyalty owns benefits and non-cash ledger | Closed pending independent verification |
| SA-019 Fiscalization dependency arrows | Accepted | Dependency matrix defines Tax, Documents, Numbering, source, Finance, and consumer directions | Closed pending independent verification |
| SA-020 Loyalty/Promotion versus Risk velocity | Accepted | Local correctness limits remain in domains and engines; cross-transaction correlation, risk decisions, and cases belong to Security Risk | Closed pending independent verification |
| SA-021 Documents claims collaboration | Accepted | Generic collaboration belongs to Platform Collaboration; formal version review remains in Documents and Knowledge | Closed pending independent verification |
| SA-022 Storefront breadth | Accepted | Native production storefront deferred; first slice contains connector and headless seams only | Closed architecturally; founder ratification remains |
| SA-023 Storefront content owner | Accepted | Marketing owns landing, navigation, merchandising, and SEO content; Documents owns controlled legal content | Closed pending independent verification |
| SA-024 E-commerce sequence conflict | Accepted | Commerce, Storefront, Retail, Manifest, roadmap, first-slice manifest, and agent rules align to connector-first and deferred native storefront | Closed architecturally; founder ratification remains |
| SA-025 Rail asymmetry and currency | Accepted | Added refund and reversal behavior, GYD-first and USD/multi-currency seams, cash, mixed tender, stored value, and provider capability declarations | Partially closed; provider-specific certified matrices remain |
| SA-026 Guyana regulator and MMG unknowns | Accepted | Guyana jurisdiction profile and provider known-unknowns added; unavailable regulator site recorded as a limitation | Open until authoritative legal, tax, regulatory, and provider review |
| SA-027 Backup resurrection | Accepted | Backup and restore specification requires deletion-journal watermark and reapplication before traffic | Closed architecturally; restore exercise remains |
| SA-028 Section indexes and root map | Accepted | Root README and section indexes link implemented files and expose registries, scripts, CLAUDE, current status, and commands | Closed; link validation passes in CI |
| SA-029 TanStack Form pre-commitment | Accepted | ADR-0005 now selects no form library and requires the same production-form evaluation of TanStack Form and React Hook Form | Closed pending benchmark execution |
| SA-030 Search overlap and taxonomic ambiguity | Accepted | Kernel Search, Data Platform semantic retrieval, AI answer generation, Commerce sub-capabilities, Event Backbone families, and control-plane taxonomies are separated explicitly | Closed pending independent verification |
| SA-031 Governance tooling gaps | Accepted | Expanded governed-file coverage, front-matter checks, related-ADR checks, event lint, namespace validation, internal links, JSON validation, document/capability/event registries, first-slice registry, cross-platform path normalization, and strict freshness CI | Closed; strict read-only CI passed after registry refresh |

## Founder Decisions

### Payment Operating Model

Recommended and provisionally adopted through ADR-0015: direct tenant-provider merchant contracts first. Founder ratification and qualified legal/regulatory review remain required before production claims.

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
- First Slice System Context and Flows
- First Slice UX and Accessibility
- First Slice AI Boundary
- Observability, Incident, and Support Operations
- API Versioning and Deprecation
- Founder Decision Register
- Document, capability, event, namespace, and first-slice registries

## Remaining Blocking Work Before First-Slice Specifications Enter Review

1. Founder ratification of first-slice scope and direct tenant merchant model.
2. Founder decision on platform legal entity and billing and settlement currencies.
3. Authoritative Guyana tax, payment-regulation, privacy, receipt, fiscalization, and provider research with qualified review.
4. Implementation-ready first-slice entity schemas, state machines, API and event schemas, permission catalog, and UX flow artifacts.
5. Executable tenant-isolation, ledger, offline, privacy, restore, provider, accessibility, and performance tests.
6. Controlled technical prototypes validating Better Auth, POS, inventory, stored value, cash, offline sync, payment seams, and recovery.
7. Another independent Fable audit against the final remediated head.

## Closure Rule

A finding closes only when:

- The selected decision is explicit.
- Every affected authoritative document is aligned.
- Capability, dependency, event, namespace, and scope registries reflect the result.
- Strict CI passes without repairing the branch.
- Tests or review evidence exist where the finding is behavioral.
- The next independent audit can verify the closure without relying on a progress summary.