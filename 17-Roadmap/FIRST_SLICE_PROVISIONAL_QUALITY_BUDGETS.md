---
document_id: PDA-RDM-006
title: First Slice Provisional Quality Budgets
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# First Slice Provisional Quality Budgets

## Purpose

Define provisional, pre-measurement budgets for the Guyana retail foundation slice so performance, reliability, recovery, accessibility, usability, and capacity gates are testable during prototypes.

These are engineering targets, not customer contractual commitments. Prototype evidence may tighten or relax a target through reviewed change control. Every change records measured evidence and user impact.

## Measurement Conditions

Unless stated otherwise:

- Measurements use a representative pilot tenant.
- Online latency excludes user think time.
- Percentiles use at least 1,000 representative operations where practical.
- Mobile tests include a mid-range supported device.
- Offline tests include at least 24 hours disconnected.
- Provider latency is measured separately from platform processing.
- All targets include tenant-isolation, permission, entitlement, audit, and observability controls enabled.

## User-Experience Budgets

| Workflow | Provisional target |
|---|---|
| New cashier completes ordinary cash sale after training | At least 95% task success |
| Median ordinary cash sale after item scan | 30 seconds or less, excluding customer payment time |
| P90 ordinary cash sale | 60 seconds or less |
| Cashier guided training for ordinary sale and void-before-completion | 30 minutes or less |
| Product barcode lookup perceived response | 300 ms p95 or less online |
| Product text search first useful result | 800 ms p95 or less online |
| Add scanned item to cart after local barcode match | 100 ms p95 or less |
| Open register | 20 seconds median or less |
| Close register excluding physical count | 3 minutes median or less |
| Manager resolves ordinary cash variance | 5 minutes median or less |
| Process receipt-backed return | 2 minutes median or less |
| Complete stock-count line using scanner | 5 seconds median or less |
| First-time tenant administrator creates a cashier user and assigns role | 5 minutes median or less |
| Critical first-slice workflow accessibility blockers | Zero open at pilot entry |
| High-severity accessibility defects | Zero open at pilot entry |

## Web Performance Budgets

| Signal | Provisional target |
|---|---|
| Initial authenticated workspace usable on representative broadband | 3.0 seconds p75 or less |
| Route transition with cached shell | 1.0 second p95 or less |
| Interaction response for local UI controls | 100 ms p95 or less |
| POS sale completion platform processing, excluding external provider | 750 ms p95, 1.5 s p99 or less |
| Register open or close command, excluding user count | 1.0 second p95 or less |
| Stock adjustment posting | 750 ms p95 or less |
| Stored-value online reservation | 500 ms p95 or less |
| Dashboard critical KPI first render after data response | 500 ms p95 or less |
| Interactive chart filter response with cached aggregate | 300 ms p95 or less |
| Interactive chart server query for pilot-sized data | 1.5 seconds p95 or less |
| JavaScript transferred for first POS route, compressed | 350 KB target, 500 KB hard review threshold |
| Layout shift on stable operational route | CLS 0.1 or less |

## API and Service Objectives

| Workflow or service | Availability / correctness target |
|---|---|
| Authentication and active tenant context | 99.9% monthly prototype objective |
| Online POS sale command | 99.9% monthly prototype objective |
| Catalog and barcode lookup | 99.9% monthly prototype objective |
| Inventory ledger posting | 99.95% correctness objective; no unexplained balance divergence |
| Stored-value ledger posting | 99.99% correctness objective; zero unexplained monetary divergence |
| Internal event publication through outbox | 99.99% eventually published within retry horizon |
| Critical background jobs | 99.5% completed within defined deadline |
| External webhook delivery | 99.0% first-attempt platform dispatch availability; at-least-once retry thereafter |
| Privacy target processing | 100% tracked to completion, exception, or approved hold |

These objectives do not become contractual SLAs without commercial approval, operational evidence, and customer terms.

## Offline and Synchronization Budgets

| Signal | Provisional target |
|---|---|
| Valid offline lease duration | 24 hours default; configurable within approved policy |
| Maximum unattended offline operation for financial workflows | 24 hours default before mandatory reconnect or manager override policy |
| Queue acceptance after reconnect | 5 seconds p95 for first acknowledgement |
| Synchronize 1,000 queued ordinary sale or stock operations | 10 minutes p95 on representative connection |
| Duplicate business effects from replay | Zero |
| Unresolved synchronization conflict rate | Less than 0.5% of queued operations in prototype tests |
| Privacy tombstone applied after device reconnect | 5 minutes p95 |
| Lost or revoked device denial after online contact | 60 seconds p95 |

## Recovery Budgets

| Asset or workflow | RPO | RTO |
|---|---:|---:|
| PostgreSQL authoritative first-slice data | 5 minutes | 4 hours |
| Stored-value and cash ledgers | 5 minutes | 4 hours with mandatory reconciliation |
| Object storage and receipts | 15 minutes | 8 hours |
| Search projections | Rebuildable from authoritative data | 8 hours |
| Analytics and dashboard projections | Rebuildable | 24 hours |
| Configuration, permissions, and entitlements | 5 minutes | 4 hours |
| Documentation registries and source | Git commit durability | 4 hours |

Pilot entry requires one measured restore that meets these provisional objectives or a documented founder-approved exception.

## Capacity Envelope for Prototype and Initial Pilot

The initial measured design target per tenant is:

- Up to 25 stores
- Up to 100 registers and managed devices
- Up to 500 active users
- Up to 250,000 active products and variants
- Up to 5 million sale lines per year
- Up to 2 million inventory ledger entries per year
- Up to 100,000 stored-value instruments
- Up to 50,000 webhook deliveries per day
- Up to 10,000 queued offline operations per device before mandatory intervention

Cross-tenant prototype testing should model at least 50 concurrent representative tenants and one noisy-neighbor tenant at 10 times ordinary load.

These numbers are not market limits or plan entitlements. They are a provisional test envelope.

## Data and Analytics Freshness

| Projection | Provisional freshness |
|---|---|
| POS operational totals | 30 seconds p95 |
| Inventory availability projection | 5 seconds p95 online |
| Search index | 60 seconds p95 |
| Manager operational dashboard | 2 minutes p95 |
| Finance handoff batch | 15 minutes p95 after source completion |
| Executive analytical dashboard | 4 hours or less unless explicitly labeled daily |

Every visualization displays last successful refresh and distinguishes authoritative, projected, stale, partial, and unreconciled data.

## Reliability Error Budgets

For a 99.9% monthly objective, the provisional unavailability budget is approximately 43 minutes in a 30-day month. For 99.95%, it is approximately 22 minutes.

Error-budget use includes failed or excessively slow requests that prevent the user outcome, not only infrastructure downtime.

When a critical workflow exhausts its monthly budget:

1. Freeze risky expansion in that workflow.
2. Prioritize corrective work.
3. Review alerting and runbooks.
4. Reassess capacity and dependencies.
5. Require explicit approval for further high-risk releases.

## Security and Privacy Budgets

- Zero known critical cross-tenant defects at any prototype release.
- Zero known critical or high secret-exposure defects at pilot entry.
- Critical session or credential revocation reaches online enforcement within 60 seconds p95.
- High-risk support access expires automatically at its approved time.
- Every privacy case target has an owner and deadline; no silent untracked target is permitted.

## Review and Promotion

Before pilot, replace provisional values with measured baselines and proposed pilot objectives. Before GA, connect approved objectives to dashboards, alerts, error budgets, runbooks, release gates, and commercial commitments where applicable.
