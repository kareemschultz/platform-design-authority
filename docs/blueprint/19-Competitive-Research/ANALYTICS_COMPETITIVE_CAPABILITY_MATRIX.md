---
document_id: PDA-CIR-072
title: Analytics Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Analytics Competitive Capability Matrix

## Scope

Metabase, Power BI, Tableau, Looker, and Grafana product experiences were reviewed from public official documentation through 2026-07-16. Analytics remains a projection and cannot become current business authority.

| Capability | Strong pattern | Failure risk | Meridian implication |
|---|---|---|---|
| metrics | reusable semantic definitions | same label, different formula | governed ID, owner, version, unit, grain and filters |
| freshness | refresh timestamp/status | “real time” ambiguity | source watermark, lag, failed refresh and timezone |
| filtering | global and local filters | hidden scope or reset | visible chips, defaults, apply state and share semantics |
| comparison | prior period, target, cohort | invalid baseline | disclose comparison window and completeness |
| drill-down | chart to underlying records | permission leakage | reauthorize at row/action, preserve context |
| annotation | events and deployments on trends | unsupported causal claim | source-linked annotation, not automatic causality |
| delivery | export, email/subscription, alerts | stale or over-shared data | purpose, recipient, expiration, snapshot time and audit |
| accessibility | table/summary alternatives | color/hover-only insight | semantic table, text summary, keyboard and contrast |

## Decisions and limitations

Adopt governed metrics, freshness, drill-through, annotations, accessible alternatives, and action links. Reject decorative dashboards, hidden definitions, authority inferred from a cache, and unrestricted scheduled exports. Confidence is high for UX/control patterns, low for performance/tool selection.

## Sources

- [Metabase dashboard filters](https://www.metabase.com/docs/latest/dashboards/filters) — official documentation, retrieved 2026-07-16.
- [Metabase subscriptions](https://www.metabase.com/docs/latest/dashboards/subscriptions) — official documentation, retrieved 2026-07-16.
- [Grafana annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/) — official documentation, retrieved 2026-07-16.
- [Power BI drillthrough](https://learn.microsoft.com/en-us/power-bi/create-reports/desktop-drillthrough) — official documentation, retrieved 2026-07-16.

