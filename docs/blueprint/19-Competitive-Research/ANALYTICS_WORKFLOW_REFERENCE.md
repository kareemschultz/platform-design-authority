---
document_id: PDA-CIR-073
title: Analytics Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Analytics Workflow Reference

## Reference workflow

Select a governed metric/version and permission-scoped dataset; disclose tenant, filters, unit, timezone, grain, comparison, source watermark, and freshness; render chart plus table/text alternative; allow drill-down only after reauthorization; preserve filter context into an owning-domain action; annotate with sourced events; export or schedule a snapshot with recipient, purpose, timestamp, retention, and audit.

## Failure and degraded behavior

Late data, partial refresh, definition change, empty result, suppressed small cohort, permission loss, export failure, and source outage are explicit states. Cached analytics is labeled stale and never used as current authority. Offline analytics may show a signed snapshot only with captured-at and scope.

## Required evidence

Metric-definition review, reconciliation to authoritative totals, row-level tenant isolation, filter/share safety, keyboard/screen-reader chart alternatives, timezone and currency, large-data performance, scheduled-delivery revocation, and action authorization require implementation evidence.

## Confidence and sources

High for the workflow model, medium for cross-product parity.

- [Looker semantic model](https://cloud.google.com/looker/docs/what-is-lookml) — official documentation, retrieved 2026-07-16.
- [Tableau data freshness](https://help.tableau.com/current/online/en-us/to_refresh_extract_manual.htm) — official help, retrieved 2026-07-16.

