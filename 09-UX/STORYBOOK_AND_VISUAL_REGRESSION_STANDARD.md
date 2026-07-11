---
document_id: PDA-UX-025
title: Storybook and Visual Regression Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Storybook and Visual Regression Standard

## Purpose

Define the component workbench, story taxonomy, required states, responsive viewports, visual baselines, interaction evidence, and release gates for the web and native design systems.

## Story Hierarchy

```text
Foundation/
Components/
Patterns/
POS/
Forms/
Tables and Grids/
Charts and Analytics/
Navigation/
Offline and Sync/
White Label/
Accessibility/
Templates/
Marketing/
```

Stories are organized by platform responsibility, not by vendor block name.

## Required Story Set

Every applicable component includes:

- Default
- All meaningful variants
- Canonical states from `COMPONENT_CATALOG_AND_STATE_MATRIX.md`
- Keyboard and focus example
- Screen-reader notes
- Long text and localization
- Dark mode
- High contrast
- Reduced motion
- Permission denied
- Entitlement unavailable
- Loading, empty, stale, partial, offline, error, and success
- Mobile and narrow-container behavior

## Specialist Stories

### POS

- Scanner input and rapid scans
- Tender selection
- Cash denomination pad
- Split tender
- Provider uncertainty
- Stored-value reservation
- Receipt preview
- Return and refund
- Register close and variance
- Offline queue and conflict

### Charts

- Responsive container sizes
- Keyboard inspection
- Accessible summary and table
- Cross-filtering
- Drill-down
- Comparison modes
- Empty, stale, partial, delayed, and unreconciled data
- Large-series performance

### Forms

- Validation summary
- Server conflict
- Save and resume
- Conditional sections
- Searchable multi-select
- Bulk update
- Offline draft

## Viewport Matrix

Minimum screenshot widths:

- 320 px compact mobile
- 375 px mobile
- 768 px tablet
- 1024 px small desktop
- 1280 px desktop
- 1536 px wide desktop

Components with container queries also include named container widths independent of viewport.

## Browser and Platform Coverage

- Current supported Chromium
- Current supported Firefox
- Current supported Safari/WebKit
- iOS and Android native workbench or screenshot equivalent for shared patterns
- High-contrast and forced-colors mode where supported

## Visual Regression

- Baselines are stored by component, story, theme, viewport, and browser.
- Intentional changes require human review and explanation.
- Global tolerance is not used to hide systematic drift.
- Dynamic timestamps, random data, and animation are frozen.
- Fonts, locale, timezone, device scale, and data fixtures are pinned.
- Financial, status, focus, and error visuals receive stricter review than decorative differences.

## Interaction Tests

Story interaction tests cover keyboard navigation, focus return, overlays, validation, selection, resizing, filtering, chart inspection, and offline transitions.

Visual snapshots do not replace semantic, accessibility, state, or business-contract tests.

## Accessibility

Automated checks run on every stable story. Manual evidence is required for complex dialogs, grids, charts, drag-and-drop, scanner workflows, and native behavior.

## Premium Source

Imported Magic UI Pro and shadcn/studio blocks receive provenance notes in internal metadata, normalized token stories, reduced-motion examples, and platform-owned names.

## Release Gate

A design-system release requires:

- Required story coverage
- Passing interaction and accessibility tests
- Reviewed visual diffs
- No missing canonical states for changed components
- Responsive coverage
- Dark and high-contrast coverage
- Migration notes for breaking changes
