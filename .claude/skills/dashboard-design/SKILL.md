---
name: dashboard-design
description: Design or review operational dashboards, KPI surfaces, responsive charts, interactive analytics, filters, drill-downs, comparisons, alerts, and insight-to-action flows using governed metrics and data-driven shape.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# Dashboard Design Skill

## Safety

This is a read-only design and review skill. Mutation and shell tools are removed while active.

## Read First

- `09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`
- `09-UX/ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`
- `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `03-Business-Engines/DASHBOARD_AND_WIDGET_ENGINE.md`
- `03-Business-Engines/REPORTING_AND_ANALYTICS_ENGINE.md`
- `10-Data/ANALYTICS_SEMANTIC_LAYER_AND_METRIC_GOVERNANCE.md`
- `10-Data/DATA_CLASSIFICATION_AND_HANDLING.md`

## Process

1. State the user, role, question, and decision.
2. List data points and assign Critical, Primary, Secondary, or Tertiary weight.
3. Define metric grain, formula, owner, time semantics, currency, unit, freshness, and certification.
4. Select the visual form from the question and data shape.
5. Decide the justified interaction level: static, inspect, filter/compare, drill/cross-filter, analyze, or act.
6. Define drill-down and record-level evidence.
7. Define the action layer.
8. Define loading, stale, partial, offline, delayed, unreconciled, error, and permission states.
9. Define responsive, mobile, keyboard, screen-reader, touch, and reduced-motion behavior.
10. Define performance, telemetry, and provisional budget linkage.

## Dashboard Structure

Use four layers when they serve the task:

- Stable navigation and business context
- Glanceable KPI overview
- Main analysis area
- Action, explanation, and drill-down layer

Do not create a card wall. Do not use a chart when a ranked table, distribution, exception queue, or single number communicates better.

## Interactive Analytics Checklist

- Tooltip or focus inspection has exact values, units, period, freshness, and comparison context.
- Cross-filtering shows the active selection and supports reset.
- Drill-down preserves filters, metric definition, currency, timezone, and scope.
- Comparison modes define the base period and denominator.
- Brushing and zoom have reset, keyboard alternative, and mobile behavior.
- Live updates show connection and reconciliation state and preserve focus.
- Every chart has an accessible summary and structured-data alternative where needed.
- Insight panels distinguish deterministic rules, statistical anomalies, AI explanations, and user annotations.

## Implementation Direction

For the initial web platform, prefer Tailwind CSS, owned shadcn/ui chart composition, and Recharts for ordinary operational charts. Recommend a specialized library only when the requirement is not served cleanly by that stack.

Premium Magic UI Pro and shadcn/studio assets may inform marketing and selected product compositions, but must be normalized into platform tokens, accessibility, responsive behavior, performance, and owned source.

## Required Output

Include:

- Business questions
- Metrics and definitions
- Data sources and freshness
- Information-weight map
- Layout outline
- Chart/table selection with rationale
- Interaction-level decision
- Filters, comparisons, and saved views
- Drill and cross-filter behavior
- Alerts, annotations, and actions
- Accessibility text alternatives
- Mobile transformation
- Performance and freshness budgets
- Acceptance metrics

## Reject

- Decorative charts
- Unexplained percentages
- Mixed currencies
- Hidden filters
- Misleading axes
- Color-only meaning
- Real-time claims without freshness
- Aggregates without evidence links
- Hover-only exact values
- Cross-filters with invisible scope
- Dashboards with no decision or action
