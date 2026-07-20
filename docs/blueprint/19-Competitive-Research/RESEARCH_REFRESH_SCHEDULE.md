---
document_id: PDA-CIR-015
title: Competitive Research Refresh Schedule
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-15
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Refresh Schedule

## 1. Purpose

This document defines when competitive research must be revalidated so dated observations do not quietly become permanent product truth.

Refresh work is risk-based. Meridian does not re-research every product on a fixed calendar merely to appear current. It refreshes evidence when volatility, implementation proximity, consequence, or contradiction makes stale conclusions dangerous.

## 2. Refresh Classes

### Class A — Highly Volatile

Default review window: 30–90 days.

Includes:

- AI features and model capabilities;
- pricing and packaging;
- roadmap status;
- supported integrations;
- API limits;
- product versions;
- changelog and release behavior;
- legal terms and license conditions;
- availability by region;
- security or authentication features.

### Class B — Moderately Volatile

Default review window: 6 months.

Includes:

- product navigation and major UX;
- workflow sequence;
- account administration;
- reporting and analytics;
- plugin ecosystems;
- mobile capabilities;
- offline behavior;
- onboarding and documentation.

### Class C — Slow-Changing

Default review window: 12–18 months.

Includes:

- established accounting workflows;
- core inventory and POS concepts;
- durable product-positioning differences;
- market pain themes;
- architecture evidence from maintained public source code.

### Class D — Event-Driven

No fixed interval; refresh when the trigger occurs.

Includes:

- major acquisition;
- product shutdown or relaunch;
- significant pricing-model change;
- framework or architecture rewrite;
- regulatory change;
- major security incident;
- new country or industry scope;
- Meridian implementation workstream start;
- contradictory pilot or customer evidence.

## 3. Mandatory Refresh Triggers

Research must be revalidated when:

- it is used to authorize a new implementation workstream;
- it supports a founder, architecture, security, legal, or commercial decision;
- a competitor ships a major redesign or relevant capability;
- the source page changes materially or disappears;
- licensing or access terms change;
- direct Meridian evidence contradicts the finding;
- the conclusion depends on a roadmap item that becomes shipped, delayed, removed, or inaccessible;
- a new market entrant materially changes the comparison set;
- the evaluated target segment changes;
- the research confidence was Low or Unknown and the finding becomes consequential.

## 4. Domain Cadence

| Domain | Baseline refresh | Required workstream refresh |
|---|---|---|
| Accounting and finance | 6–12 months | before Accounting implementation plan and before production candidate |
| Catalog and inventory | 6–12 months | before WS2 contract freeze and prototype closeout |
| POS and commerce | 6 months | before Prototype 3 and before pilot |
| Payments and providers | 3–6 months | before adapter selection and provider certification |
| Offline and clients | 6 months | before native/offline prototype and pilot |
| CRM and service | 12 months | before implementation planning |
| Workforce and payroll | 6 months | before jurisdiction-specific planning |
| Manufacturing and procurement | 12 months | before implementation planning |
| AI and automation | 30–90 days | before any autonomy-level increase |
| Security and identity | 3–6 months | before production-candidate review |
| UX patterns and component sources | 6 months | before major shell/design-system change |
| Documentation and changelog | 12 months | before public release communication launch |

## 5. Refresh Depth

A refresh may be:

- **Source check** — confirm the cited source, date, and claim remain valid.
- **Delta review** — inspect only material releases or changes since the last review.
- **Focused re-teardown** — repeat one changed workflow or product area.
- **Full re-teardown** — repeat the comparison due to major product or market change.
- **Meridian evidence reconciliation** — compare external findings with actual prototype, pilot, telemetry, support, or usability evidence.

The smallest sufficient level should be used.

## 6. Freshness Metadata

Every governed research document must record:

- `last_reviewed` in front matter;
- evidence cutoff date in the body where relevant;
- products and editions reviewed;
- volatile claims;
- known inaccessible evidence;
- next scheduled review or event trigger;
- superseded findings.

## 7. Staleness Handling

When evidence is stale:

- do not delete it automatically;
- label the affected conclusion Stale or Needs Revalidation;
- prevent it from authorizing irreversible implementation decisions;
- retain historical context;
- create or update a research-backlog entry;
- state which parts remain stable.

A document does not become wholly invalid because one volatile figure changed. Review at the claim level where practical.

## 8. Quarterly Review

During active development, the Platform Design Authority performs a quarterly research review covering:

- research used by current and next workstreams;
- high-volatility sources;
- open P0/P1 research backlog;
- newly contradictory evidence;
- differentiation claims without implementation or customer proof;
- products added, acquired, deprecated, or removed from comparison sets;
- licensing and paid-source changes;
- stale research referenced by open issues or PRs.

## 9. Workstream Entry Gate

Before a business-domain implementation plan is accepted, the owner must confirm:

- relevant domain research exists or is intentionally waived;
- material sources are within their review window;
- market pain and best-in-class workflows are mapped;
- intentional exclusions are current;
- unresolved research questions are classified blocking or non-blocking;
- research has not silently changed domain ownership.

Research must not become a blanket excuse to delay implementation. A workstream may proceed with explicit Low-confidence areas when the prototype is designed to answer them safely.

## 10. Workstream Exit Gate

At prototype closeout:

- reconcile external findings with implementation evidence;
- advance, reject, or revise differentiation entries;
- record surprises and contradictions;
- update the implementation evidence register when established;
- create refresh triggers for unresolved market assumptions.

## 11. Automation

Automation may validate:

- front-matter dates;
- allowed freshness classes;
- overdue review dates;
- missing revalidation triggers;
- broken source references where public;
- research documents referenced by active workstreams.

Automation must not rewrite conclusions or claim that a source remains semantically valid merely because its URL responds.

## 12. Exceptions

A refresh may be deferred when:

- the related capability is explicitly out of scope;
- access is legally or technically unavailable;
- the product no longer serves a relevant segment;
- newer direct Meridian evidence is more authoritative for the decision;
- the finding is historical and clearly labeled.

Every exception must state an owner, reason, and next trigger.