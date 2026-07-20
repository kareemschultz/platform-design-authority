---
document_id: PDA-UX-021
title: Interactive Analytics and Visualization
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Interactive Analytics and Visualization

Interactive analytics levels L3–L5 are outside the first-slice implementation registry. They remain governed design targets and cannot expand `registry/first-slice.json` without an explicit scope change.

## Purpose

Define responsive, accessible, interactive charts, graphs, analytical canvases, insight panels, drill paths, comparison tools, and visualization-to-action workflows across operational dashboards, reports, mobile experiences, and executive workspaces.

This document extends `DASHBOARD_AND_DATA_VISUALIZATION.md`. Metric definitions and analytical ownership remain governed by the Data Platform semantic layer.

## Scope relative to Dashboard and Data Visualization

Standard operational dashboards, KPI surfaces, and first-slice charts/tables are governed by `DASHBOARD_AND_DATA_VISUALIZATION.md` (PDA-UX-012) — read this document only once a surface needs exploratory or canvas-level interaction beyond that baseline.

## Experience Principle

A visualization is successful only when it helps an authorized user understand a business question, inspect evidence, compare alternatives, and take the correct next action.

Animation, gradients, hover effects, and visual novelty are never substitutes for metric correctness, responsiveness, accessibility, or workflow value.

## Interaction Levels

### Level 0 — Static Summary

A stable chart or KPI with no interaction beyond accessible text and export. Use for documents, email summaries, receipts, and low-complexity views.

### Level 1 — Inspect

The user can focus or point to a mark and inspect exact values, labels, confidence, freshness, source, and comparison context.

### Level 2 — Filter and Compare

The user can change time range, scope, dimensions, measures, comparison period, currency, or segment while preserving a clear active-filter summary.

### Level 3 — Drill and Cross-Filter

Selecting a chart mark filters related charts, tables, and exception lists. The user can drill from aggregate to contributing records without losing context.

### Level 4 — Analyze

The user can brush a time window, zoom, pan, change grouping, inspect distributions, compare scenarios, annotate events, and save an analytical view.

### Level 5 — Act

The insight surface provides a governed action such as opening an approval queue, creating a replenishment proposal, investigating a cash variance, or reviewing affected records.

Higher interaction levels are justified only when users need them. A simple operational question should not become a miniature business-intelligence studio.

## Core Interactive Behaviors

### Tooltips and Focus Details

Tooltips must provide useful exact values, units, date or category, comparison basis, and status. They must be available through keyboard focus and not rely only on pointer hover.

Required information must not exist only in a tooltip.

### Legends

Legends may toggle series when that behavior is discoverable and reversible. Hidden series remain indicated. Color, label, line style, and marker shape preserve meaning across themes and color-vision differences.

### Cross-Filtering

Selecting a category, time interval, location, channel, or status may filter related visualizations and record lists.

The interface must:

- Show the active selection
- Provide clear reset and undo
- Preserve tenant, organization, legal-entity, currency, timezone, and permission context
- Avoid applying an invisible filter to unrelated pages
- Announce the result change accessibly
- Update the URL when a filtered view is expected to be shareable

### Drill-Down and Drill-Through

Drill-down moves from one aggregation level to another, such as company → store → register. Drill-through opens the contributing records or workflow.

Every drill path preserves:

- Metric definition
- Time range
- Filters
- Currency and units
- Source and freshness
- Sort and selected dimensions
- Permission-safe context

### Brushing, Zoom, and Pan

Use brushing and zoom only for dense time series, distributions, maps, or high-volume operational traces.

Requirements:

- Visible selected range
- Reset control
- Keyboard-accessible alternative
- Minimum and maximum zoom
- No loss of source scale or period context
- Mobile gesture behavior that does not block page scrolling accidentally

### Comparison Modes

Supported comparisons may include:

- Previous period
- Same period last year
- Target or budget
- Forecast
- Peer location or category
- Before and after a known event

The comparison definition must remain visible. Percent change shows its denominator, base period, and handling of zero or missing values.

### Annotations

Annotations explain promotions, outages, store openings, policy changes, stock events, fiscal changes, or other known causes.

Annotations record author, source, time, scope, classification, and whether the note is factual, inferred, or explanatory.

### Saved Analytical Views

An authorized user may save filters, measures, grouping, comparison, layout, and visualization state.

Saved views declare whether they are private, team, tenant, or template-level. Sharing a view never grants access to the underlying data.

## Insight Panels

An insight panel explains what changed, why it may have changed, confidence, contributing metrics, affected records, and recommended next steps.

Insight types:

- Deterministic threshold or rule
- Statistical anomaly
- Forecast or scenario result
- AI-assisted explanation
- User-authored annotation

The interface must distinguish these types visibly. AI-generated explanations cite evidence and never replace current domain validation.

## Real-Time and Streaming Data

Use the term real-time only when a measurable update contract exists.

Every live surface declares:

- Expected freshness
- Last successful update
- Connection state
- Partial or delayed data
- Reconciliation status
- Pause behavior
- Whether the current value is provisional or authoritative

Live updates must preserve keyboard focus and should not reorder actionable lists while the user is interacting without warning.

## Responsive Behavior

Charts respond to available container size rather than assuming a desktop viewport.

### Desktop

May support multiple coordinated charts, detailed legends, comparison controls, and inspector panels.

### Tablet

Prioritize one primary chart, concise controls, and a drawer or lower panel for detail.

### Mobile

- Show the business conclusion and critical KPI first
- Use one focused visualization at a time
- Collapse secondary series and controls intentionally
- Replace dense legends with a selectable series control
- Use a full-screen analytical view for deep interaction
- Provide a record-list or table alternative
- Preserve touch targets and page scroll
- Avoid horizontally compressed unreadable charts

A chart must have a measurable height and width contract so responsive rendering can be calculated reliably.

## Visualization Component Families

The design system should support:

- KPI and delta
- Sparkline
- Line and area chart
- Bar and stacked bar chart
- Histogram and distribution plot
- Scatter plot
- Heat map
- Funnel and stage chart
- Waterfall
- Bullet or target chart
- Cohort or retention matrix
- Calendar heat map
- Geographic map only when geography is material
- Timeline and event overlay
- Accessible data table companion
- Insight and annotation panel
- Filter and comparison toolbar
- Chart legend and tooltip
- Brush and range selector

Pie and donut charts are restricted to a small number of stable parts where angle comparison will not mislead.

## Tailwind, shadcn/ui, and Recharts Implementation Direction

For the web platform:

- Tailwind CSS is the styling and responsive-utility foundation.
- shadcn/ui provides source-owned component primitives and chart composition helpers.
- The current shadcn chart component uses Recharts and remains intentionally close to the underlying Recharts API rather than wrapping it behind a proprietary abstraction.
- Recharts is suitable for the initial operational chart family.
- More specialized visualization libraries may be introduced only for requirements Recharts cannot meet cleanly, such as advanced network, geographic, very-high-density canvas, or specialized statistical visualizations.

All imported chart code must be normalized into platform tokens, component contracts, accessibility requirements, test fixtures, and metric-governance rules.

## Premium UI Sources

Magic UI Pro and shadcn/studio premium blocks may accelerate:

- Marketing-site storytelling
- Product announcement pages
- Carefully selected animated demonstrations
- Landing-page charts and visual explanations
- Authenticated application compositions when they meet the same platform standards

Premium blocks are source material, not untouchable dependencies. Before adoption:

1. Confirm the license permits use in the intended repository and products.
2. Do not commit vendor credentials, private package tokens, license files, or source bundles not permitted for redistribution.
3. Copy only the needed source into an approved owned component or page.
4. Replace raw colors and spacing with semantic tokens.
5. Remove unnecessary animation and dependencies.
6. Verify accessibility, responsive behavior, performance, reduced motion, dark mode, and white-label compatibility.
7. Record source, license owner, imported version, local modifications, and upgrade decision.

## Accessibility

Every interactive visualization provides:

- Meaningful title and description
- Textual summary of the main conclusion
- Keyboard access to meaningful marks or an equivalent control
- Programmatic value, label, series, and state
- Accessible table or structured data alternative when precision matters
- Non-color differentiation
- Sufficient contrast
- Focus preservation during updates
- Announced filter and drill changes
- Reduced-motion behavior
- Touch-accessible controls

Not every individual point in a very large series must become a tab stop. Provide an efficient accessible inspection model and structured alternative.

## Data Integrity and Security

- Visualization data is permission- and tenant-filtered before rendering.
- Hidden series and tooltip data cannot expose fields unavailable elsewhere.
- Export uses the same authorization and classification policy.
- Cached analytical responses include tenant and scope in the key.
- Aggregates respect minimum-group and de-identification rules where required.
- The client never becomes the authoritative source for metric calculation.

## Performance

- Load critical metrics first.
- Defer secondary visualizations.
- Downsample or aggregate high-volume series through a governed server contract.
- Avoid rendering thousands of SVG marks when a summarized or canvas-based view is more appropriate.
- Cancel stale requests when filters change rapidly.
- Cache by tenant, scope, metric version, and filter set.
- Measure rendering time, interaction latency, data-query latency, and memory use.

## Testing

Test:

- Metric and formatting correctness
- Responsive container sizes
- Keyboard and screen-reader behavior
- Tooltip and legend interaction
- Cross-filter and reset
- Drill context preservation
- Empty, partial, stale, offline, delayed, and error states
- Theme and color-vision robustness
- Large-series performance
- Export authorization
- Live-update focus stability
- Mobile gestures and scrolling

## Anti-Patterns

- Interactive decoration with no analytical purpose
- Hover-only access to exact values
- Hidden filters or comparisons
- Cross-filtering that changes unrelated data silently
- Zoom without reset or original scale
- Live charts without freshness and reconciliation status
- Automatically generated AI explanations without evidence
- Tiny mobile charts copied directly from desktop
- Exporting a wider dataset than the visualized permission scope
- Premium animation blocks embedded without token, accessibility, or performance review

## Acceptance Questions

A user should be able to answer:

1. What changed?
2. Compared with what?
3. Over which scope and period?
4. How fresh and trustworthy is the result?
5. Which records contribute to it?
6. What uncertainty or missing data exists?
7. What action can be taken next?
8. Can the same task be completed with keyboard, touch, and assistive technology?

## First-Slice Boundary

Interactive analytics L3-L5 are outside the first retail slice. Bounded reporting adds no capability here.
