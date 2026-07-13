---
document_id: PDA-UX-019
title: Enterprise Table and Data Grid Standard
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Enterprise Table and Data Grid Standard

## Purpose

Define when and how dense tables, virtualized grids, editable cells, grouping, selection, aggregation, and export support serious operational work without sacrificing accessibility, performance, or clarity.

## Pattern Selection

Use a semantic table for reading, comparison, sorting, filtering, and row actions. Use an interactive grid only when users need cell navigation, multi-cell selection, inline editing, spreadsheet-like copy/paste, or high-density operational entry.

A grid is not justified merely because a table library supports it.

## Required Capabilities

- Stable row identity
- Canonical column definitions, labels, units, and classification
- Server or client sorting and filtering with explicit ownership
- Saved views
- Column visibility, order, width, and optional pinning
- Pagination or virtualization
- Row and bulk selection with explicit scope
- Row and cell actions
- Grouping and aggregation where the metric remains valid
- Responsive alternative
- Accessible keyboard and focus model
- Loading, empty, partial, stale, offline, error, conflict, and permission states
- Export using the same tenant, field, and permission policy

## Keyboard Model

### Semantic Table

- Tab moves among interactive elements, not every noninteractive cell.
- Row actions are reachable in a predictable order.
- Sort controls are buttons with announced direction.
- Selection checkboxes have row-specific accessible names.

### Interactive Grid

When the ARIA grid pattern is used:

- Arrow keys move among cells.
- Home and End move to first and last cell in a row.
- Control/Command + Home or End moves to the first or last available grid cell where supported.
- Page Up and Page Down move by visible viewport when meaningful.
- Enter or F2 enters edit mode.
- Escape cancels an uncommitted edit and returns focus to the cell.
- Tab commits or moves according to the documented edit model.
- Space toggles selection only when the focused cell is a selection control.
- Shift extends a supported range selection.

Keyboard behavior must be displayed in contextual help for complex grids. Do not implement only a partial ARIA grid pattern.

## Focus and Virtualization

- Focus remains on a stable row and column identity during refresh.
- A virtualized cell that leaves the rendered window has a defined focus-retention strategy.
- Sorting, filtering, and paging move focus to a meaningful result or announce the change.
- Live data does not reorder rows while the user is editing or selecting without warning.
- Screen-reader users receive total count, visible range, active sort, filters, and selection count.

## Column Behavior

### Resize

- Resizing has pointer and keyboard alternatives.
- Minimum and maximum widths preserve labels and controls.
- Double-click or a named action may fit to content.
- Width preferences may persist per user or saved view.

### Reorder and Pinning

- Dragging has an accessible move-left/move-right alternative.
- Pinned columns are limited to identifiers and critical context.
- Pinned regions must not consume the majority of narrow screens.
- Column order cannot change field-level access.

### Visibility

Required identifiers and critical financial or legal context cannot be hidden when doing so would make an action unsafe. User preferences cannot remove required receipt, approval, currency, or scope information.

## Grouping and Aggregation

- Grouping declares the dimension and preserves underlying record access.
- Aggregates use certified metric definitions.
- Mixed currency or unit groups are prohibited without explicit conversion.
- Group totals explain excluded, partial, stale, and unreconciled records.
- Expanding a group preserves keyboard position and state.

## Editing

Inline editing is limited to low-risk fields where direct comparison benefits the user.

Each editable cell defines:

- Data type and validation
- Read-only and permission states
- Original and proposed value
- Save, saving, saved, failed, offline, and conflict states
- Optimistic concurrency token
- Server validation and error placement
- Undo, reversal, or correction behavior
- Audit requirements

Consequential actions such as financial posting, stored-value adjustment, permission assignment, tax treatment, payroll, privacy action, or provider configuration use dedicated forms or workflows.

## Edit Conflict UX

When the source changed after editing began:

1. Preserve the user's proposed value.
2. Show the current authoritative value and version.
3. Explain the conflicting actor or timestamp where permitted.
4. Offer discard, reapply, merge, or open full record according to field semantics.
5. Never silently overwrite a consequential newer value.

## Selection

Selection distinguishes:

- Current visible page
- Loaded virtual window
- Explicit individually selected rows
- All rows matching current filters
- Rule-based dynamic set

The UI shows selection count, filter summary, excluded records, permission-limited rows, and whether newly matching records would enter a dynamic set.

A bulk action uses a dry run or consequence preview when it affects money, inventory, permissions, communications, privacy, or many records.

## Pagination and Virtualization Thresholds

Provisional defaults:

- Up to 100 ordinary rows: render without virtualization when performance is acceptable.
- 100–1,000 rows: paginate or virtualize based on interaction needs.
- More than 1,000 rows or expensive cells: server-side pagination/filtering and row virtualization.
- More than 50 visible columns is a design failure requiring view reduction or specialist analysis mode.
- Horizontal virtualization requires explicit accessibility review.

Thresholds are measured and may change by device and row complexity.

## Pagination Strategy Selection

This is the platform's single authority for pagination strategy; other documents (including `NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`'s URL-state rule) cross-reference this section rather than restate it. Pagination strategy depends on the data and task, not aesthetic preference. Choose per list, not once for the whole platform.

### Numbered pages

Use for stable, boundable lists where a user needs a sense of total size and position — administrative lists, reports, invoices, audit evidence, user and role directories, and any work where "page 4 of 20" is meaningful to the task.

Requirements:

- Total count when reliably and cheaply available; if computing an exact total is expensive or unstable, say so rather than presenting a false-precision number
- First, previous, next, and last controls where the list is long enough to benefit
- Configurable page size within governed bounds
- Filter and sort preserved in the URL always
- Returning from a record detail restores the same page, filter, and sort the user came from

**API-contract constraint (first-slice):** `PDA-ARC-014` (`docs/blueprint/02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md`) mandates cursor pagination for every first-slice list endpoint, and `openapi/first-slice-v1.yaml` defines only `cursor`/`limit` query parameters — there is no `page`/`offset` parameter to request an arbitrary page directly. A numbered-page *presentation* over a cursor-only API is still permitted, but it can only be built as a client-maintained sequential walk: the client caches the cursor reached at each page number as the user pages forward, and a URL can preserve "the page number the user was last on" as a display label plus the cursor needed to reach it, not as a parameter the server can resolve from a cold reload or a shared link to an arbitrary page in one request. Do not promise direct URL-addressable jump-to-page-N for a first-slice list until the API contract adds an offset/page lookup or a documented cursor-to-page mapping; until then, "page number in the URL" means the cached cursor for that position, and a cold load of that URL walks from the nearest known cursor rather than performing a single random-access fetch.

### Cursor pagination

Use for large or actively changing operational datasets where a stable offset would skip or duplicate rows as data mutates underneath the user — event streams, activity logs, transaction history, search results, and webhook deliveries.

Requirements:

- A stable ordering key that does not shift under concurrent writes (e.g., a monotonic id or `(timestamp, id)` tuple, never a raw offset into a mutating set)
- No duplicate or skipped records under concurrent writes — this must be tested, not assumed
- A clear "new results available" affordance when data arrives ahead of the user's current cursor position, rather than silently reordering what they are looking at
- Do not present a total-count figure when computing one is expensive or the underlying set is actively changing; say the count is unavailable rather than estimating it silently

### Infinite scroll

Use sparingly, for non-consequential browsing only — marketing content, image or inspiration galleries, and similar low-stakes feeds where losing your place has no real cost.

Do not use infinite scroll for finance, inventory, permissions, audit, bulk actions, or reconciliation work, or for anything a user must count, select, compare, export, or revisit at a specific position. Those tasks require a stable, addressable position (numbered pages or cursor pagination), which infinite scroll does not provide. The bulk-selection standard in `ADVANCED_INTERFACE_PATTERNS.md` already requires selection to be explicit about page/filter/all-matching scope; infinite scroll makes that boundary harder for users to reason about and is disallowed wherever bulk selection applies.

## Responsive Transformation

### Desktop

May support dense columns, pinning, grouping, and bulk actions.

### Tablet

Reduce default columns, preserve identifiers and critical state, move filters and column controls to drawers or sheets.

### Mobile

Prefer task-focused lists, cards, or one-record-at-a-time workflows. A full grid may use a dedicated landscape or full-screen analytical view, but ordinary users should not be forced to pan through a desktop table.

## Tailwind, shadcn/ui, and TanStack Direction

- Tailwind provides responsive layout and token-backed utilities.
- shadcn/ui provides source-owned table, menu, checkbox, popover, command, and overlay primitives.
- TanStack Table supplies headless sorting, filtering, grouping, pagination, visibility, and selection state.
- TanStack Virtual may support row or column virtualization.

The platform owns the resulting interaction contract, accessibility, persistence, tests, and state semantics.

## Performance Budgets

- Sorting or filtering a locally held pilot-sized table: 100 ms p95 target.
- Server-filtered first useful page: 1.5 seconds p95 target.
- Scroll interaction: 50–60 frames per second target on representative hardware.
- Editing feedback: visible within 100 ms.
- Bulk-action preview: progress and cancellation for operations exceeding 2 seconds.

## Accessibility

- Prefer native table semantics unless grid behavior is truly required.
- Provide headers, captions or descriptions, row labels, and announced sort/filter state.
- Do not place every cell in the tab order.
- Use non-color cues for status and changes.
- Support 200% and 400% zoom.
- Provide accessible export or structured detail for highly complex data.

## Quality Gates

- Large-data and noisy-neighbor performance
- Keyboard-map tests
- Screen-reader tests with representative workflows
- Resize, reorder, visibility, and pinning tests
- Grouping and metric-integrity tests
- Selection-scope tests
- Editable-cell concurrency tests
- Responsive transformations
- Export permission and classification tests
- Tenant and field security
- Offline and stale-data behavior
