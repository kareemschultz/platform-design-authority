---
document_id: PDA-UX-012
title: Dashboard and Data Visualization
version: 0.2.3
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Dashboard and Data Visualization

## Purpose

Define how operational dashboards, KPI surfaces, charts, tables, alerts, and drill-downs translate business questions and data shape into fast, trustworthy decisions.

## Scope relative to Interactive Analytics and Visualization

This document governs dashboards, KPI surfaces, standard charts/tables, alerts, and drill-downs — the default operational reporting surface. `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` (PDA-UX-021) governs deeper interactive analytics (levels L3–L5: analytical canvases, comparison tools, exploratory drill paths) that sit outside the first-slice implementation registry. A surface that needs exploratory, canvas-style interaction beyond this document's baseline is scoped by PDA-UX-021.

## Core Rule: Data Drives Shape

Do not design a card or chart first and force data into it. Start with:

1. The user decision
2. The metric or record grain
3. Comparison or trend needed
4. Time horizon
5. Required precision
6. Action triggered by the result
7. Data freshness and confidence

Then select the smallest visual form that communicates the answer accurately.

## Information Weight

Assign each dashboard element a weight:

- Critical: immediate operational risk or required action
- Primary: daily decision metric
- Secondary: diagnostic or comparative context
- Tertiary: low-frequency detail

Critical and primary content receives the most prominent position and clearest action path. Tertiary content belongs in drill-downs, inspectors, tooltips, or secondary views.

## Operational Visual Grammar

Operational dashboards use a calm, information-dense visual grammar. The
business state and next action carry the emphasis; containers remain quiet.

- Use a neutral canvas and one restrained action accent. Status color remains
  semantic and is never used as decoration.
- Prefer subtle borders and surface contrast over decorative shadows.
- Use one consistent radius and elevation profile across a workspace.
- Align page context, metrics, filters, tables, and actions to a shared modular
  grid rather than centering each card independently.
- Reserve cards for meaningful grouping. Do not place every label, control, or
  statistic in its own floating container.
- Keep primary content visually continuous. Secondary evidence may use an
  inspector, drawer, or lower-priority region without narrowing the main task
  into an unusable strip.

### Operational page frame

Where the task supports a dashboard composition, use this order:

1. Context strip: workspace, organization/location/legal entity, time range,
   currency or unit, freshness, and connectivity.
2. Attention summary: one primary result or warning plus the next governed
   action.
3. Compact KPI strip: normally three to five metrics with comparable visual
   weight; exceptional metrics may receive stronger emphasis.
4. Primary work area: chart, queue, table, or task workspace selected from the
   decision the user must make.
5. Evidence and drill layer: contributing records, explanations, source,
   audit, and secondary analysis.

This is a composition grammar, not a requirement to turn every task into a
dashboard. Cashier, scanning, counting, and other frequent transactional
workflows remain task-first and use the governed touch/POS density profile.

### Compact KPI anatomy

A compact KPI may combine label, value, unit/currency, comparison, and status
in one scan line or small stack. It still includes the governed time window,
comparison basis, freshness, and evidence link. Delta badges state direction
and meaning in text; green or red alone is insufficient. Empty, partial,
stale, and unavailable values use explicit language rather than a misleading
zero.

### Status treatment

Status chips remain compact but include a readable label and, when useful, an
icon or shape. Pastel fills do not excuse low-contrast text. Stable semantic
meanings are shared across tables, cards, queues, and detail views and cannot
be reassigned by a white-label theme.

## Four-Part Dashboard Structure

### Navigation and Context

The user must always know:

- Tenant and organization
- Location, store, legal entity, or team
- Time range
- Currency and unit
- Data freshness
- Workspace or role

### Overview and KPIs

The first viewport should answer “What needs attention?” within seconds.

KPI cards require:

- Clear metric name
- Current value
- Comparison basis
- Direction and meaning
- Time window
- Currency or unit
- Freshness
- Click-through to evidence

Avoid decorative cards that repeat the same number in multiple forms.

### Main Analysis Area

Use charts, tables, and distributions for the primary business questions.

### Action Layer

Alerts, approvals, drill-down drawers, filters, explanations, and workflow entry points connect insight to action.

A dashboard without a meaningful action or decision is often a report, not an operational dashboard.

## Visualization Selection

| Question | Preferred form |
|---|---|
| What is the current value? | KPI or compact metric |
| How is it changing over time? | Line or area chart |
| Which categories differ? | Sorted bar chart |
| What is the distribution? | Histogram, box plot, or bands |
| What contributes to a total? | Stacked bar; pie only for very few stable parts |
| Where are exceptions? | Ranked table, heat map, or alert list |
| What is the process status? | Funnel, stage counts, or status table |
| What is the relationship? | Scatter plot with careful explanation |
| What is the exact record detail? | Table or record list |
| What requires action now? | Queue with severity, age, owner, and action |

## Chart Rules

- Prefer position and length over angle and area for comparison.
- Start quantitative axes at zero when truncation would mislead.
- Use consistent time direction and interval.
- Do not use 3D charts.
- Limit simultaneous series and provide direct labels where practical.
- Use color for meaning, not decoration.
- Preserve meaning without color through labels, shape, or pattern.
- Explain missing, delayed, partial, estimated, and reconciled data.
- Show target, threshold, or prior period only when it supports a decision.
- Avoid dual axes unless the relationship is essential and clearly explained.

## Tables

Use tables for precision, comparison across attributes, sorting, filtering, and action.

Required features depend on task, not component availability:

- Stable row identity
- Column meaning and units
- Sorting and filtering
- Saved views
- Column visibility
- Responsive alternative
- Bulk-selection semantics
- Pagination or virtualization
- Export permissions
- Loading, stale, and partial states
- Accessible headers and focus

Do not place every record attribute in the default table. Use a focused column set and an inspector or detail page.

## Filters

Filters should answer common questions quickly.

- Promote common filters.
- Put rare filters in an advanced panel.
- Show active filters as removable tokens or a clear summary.
- Preserve and share saved views where useful.
- Distinguish current-page filters from query-wide filters.
- Explain timezone, currency, and legal-entity scope.
- Provide reset and sensible defaults.

## Drill-Down

Every aggregate should link to the records or calculation behind it when permissions allow.

Drill-down preserves:

- Time range
- Filters
- Scope
- Metric definition
- Currency and units
- Sort
- Source dashboard

Do not navigate users to an unrelated generic list and make them reconstruct the dashboard query.

## Metric Governance

Each metric defines:

- Canonical name and identifier
- Business definition
- Formula
- Grain
- Source owner
- Time semantics
- Currency and unit
- Inclusion and exclusion rules
- Freshness
- Certification state
- Responsible owner

A visually polished dashboard cannot compensate for ambiguous metric definitions. This operationalizes AIR-008 and `docs/blueprint/19-Competitive-Research/ANALYTICS_COMPETITIVE_CAPABILITY_MATRIX.md` (`PDA-CIR-072`).

## Alerts and Exceptions

Operational alerts show:

- Severity
- What happened
- Business impact
- Affected scope
- Age and freshness
- Owner or queue
- Recommended next action
- Evidence and source
- Resolution state

Avoid turning every unusual value into an alert. Use thresholds, persistence, correlation, and user role to control noise.

## Scheduled Delivery and Export

An exported or scheduled dashboard snapshot declares:

- Recipient
- Purpose
- Snapshot timestamp
- Expiration
- Retention period
- Audit trail entry

Expiration and revocation are distinct controls. Expiration is a declared end date the schedule or access grant carries from creation — it lapses on its own even if nobody acts. Revocation is an explicit action that ends access before that date. Every scheduled delivery supports both: a recipient's access, and a running schedule itself, can be withdrawn at any time without waiting for the next send cycle, and every grant also carries an expiration so a forgotten schedule does not stand indefinitely. A scheduled export is a governed, standing grant, not a one-time action; it carries the same accountability as any other permission grant until it is revoked or expires.

This operationalizes `docs/blueprint/19-Competitive-Research/ANALYTICS_COMPETITIVE_CAPABILITY_MATRIX.md`'s (`PDA-CIR-072`) delivery-capability finding ("purpose, recipient, expiration, snapshot time and audit") and `ANALYTICS_WORKFLOW_REFERENCE.md`'s (`PDA-CIR-073`) required-evidence list, which names "scheduled-delivery revocation" alongside metric-definition review and tenant isolation as implementation evidence a delivered analytics workflow must produce.

## Progressive Disclosure

Default dashboards should be sparse enough to scan. Use:

- Overview KPIs
- One or two primary charts
- Prioritized exception queue
- Expandable explanations
- Drill-down drawers
- Secondary tabs
- Saved views

Do not hide legal, financial, or data-quality caveats inside tooltips alone.

## Accessibility

- Provide text summaries for charts.
- Ensure keyboard access to legends, data points, and actions.
- Offer accessible tables or downloadable data where appropriate.
- Do not encode meaning by color alone.
- Support zoom, reflow, and high contrast.
- Announce filter and refresh results.
- Preserve focus during live updates.

## Mobile

Mobile dashboards prioritize status and action over chart density.

- Show critical KPIs and alerts first.
- Use concise charts with drill-down.
- Replace wide tables with task-focused lists.
- Keep filters accessible but collapsed.
- Preserve offline and freshness status.

## Performance

- Load the first meaningful view quickly.
- Defer low-priority panels.
- Cache safely by tenant and scope.
- Virtualize large record sets.
- Avoid dashboards that trigger uncontrolled fan-out queries.
- Show partial results only when clearly labeled.

## Anti-Patterns

- KPI card wall with no hierarchy
- Decorative gradients and shadows competing with data
- Chart type chosen for novelty
- Pie charts with many categories
- Traffic-light colors without labels
- “Real-time” claims without freshness evidence
- Mixed currencies or units in one visual without explicit conversion
- Percent changes without denominator or base period
- Hidden filters
- Dashboards that reproduce entire reports in tiny panels

## Change Log

- 2026-07-19 — v0.2.0 codified a source-neutral calm operational visual
  grammar after evaluation of the founder-selected BoardUI visual reference;
  no external component, asset, license, or implementation dependency was
  adopted.

## Dashboard Review

A dashboard passes review when a representative user can answer:

1. What needs attention?
2. What changed?
3. Why did it change?
4. What records support the conclusion?
5. What can I do next?
6. How current and trustworthy is the data?

within the expected task time and without training on the charting library.
