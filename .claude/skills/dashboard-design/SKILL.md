---
name: dashboard-design
description: Design or review operational dashboards, KPI surfaces, data tables, charts, filters, drill-downs, alerts, and action layers using data-driven shape and metric governance.
context: fork
allowed-tools: Read Grep Glob
---

# Dashboard Design Skill

## Read First

- `09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `03-Business-Engines/DASHBOARD_AND_WIDGET_ENGINE.md`
- `03-Business-Engines/REPORTING_AND_ANALYTICS_ENGINE.md`
- `10-Data/DATA_CLASSIFICATION_AND_HANDLING.md`
- `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`

## Process

1. State the user, role, and decision.
2. List the data points and assign Critical, Primary, Secondary, or Tertiary weight.
3. Define metric grain, formula, owner, time semantics, currency, unit, freshness, and certification.
4. Select visual form from the question and data shape.
5. Define drill-down to evidence.
6. Define the action layer.
7. Define loading, stale, partial, offline, error, and permission states.
8. Define mobile and accessibility behavior.
9. Define performance and telemetry.

## Dashboard Structure

Use four layers when they serve the task:

- Stable navigation and context
- Glanceable KPI overview
- Main analysis area
- Action and drill-down layer

Do not create a card wall. Do not use charts when a ranked table or single number communicates better.

## Required Output

For a dashboard proposal include:

- Business questions
- Metrics and definitions
- Data sources and freshness
- Information-weight map
- Layout outline
- Chart/table selection with rationale
- Filters and saved views
- Drill-down behavior
- Alerts and actions
- Accessibility text alternatives
- Mobile view
- Acceptance metrics

## Review Rules

Reject:

- Decorative charts
- Unexplained percentages
- Mixed currencies
- Hidden filters
- Misleading axes
- Color-only meaning
- Real-time claims without freshness
- Aggregates without evidence links
- Dashboards with no decision or action
