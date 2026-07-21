---
document_id: PDA-DAT-014
title: Analytics Semantic Layer and Metric Governance
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Analytics Semantic Layer and Metric Governance

## Purpose

Define certified metrics, dimensional models, semantic definitions, analytical access, and reproducible reporting.

## Metric Record

Every metric declares identifier, business definition, formula, grain, source owner, dimensions, time semantics, currency, unit, filters, exclusions, freshness, certification, and steward. This operationalizes `docs/blueprint/19-Competitive-Research/ANALYTICS_COMPETITIVE_CAPABILITY_MATRIX.md` (`PDA-CIR-072`), which identifies "same label, different formula" as the core risk a governed metric record prevents.

## Semantic Layer

The semantic layer provides governed measures, dimensions, joins, hierarchies, and security policies for dashboards, reports, exports, and AI analysis.

## Rules

1. Metrics must reconcile to authoritative sources.
2. Similar names cannot hide different formulas.
3. Currency conversion is explicit and versioned.
4. Tenant and field security apply before query results.
5. Self-service analytics uses approved models rather than unrestricted operational joins.
6. AI-generated analysis cites certified metrics and source periods.

## Certification

Draft, Reviewed, Certified, Deprecated, and Retired.

## Quality Gates

- Formula tests
- Source reconciliation
- Timezone and period tests
- Currency and unit tests
- Tenant-isolation tests
- Performance and cost budgets
- Lineage and ownership
