---
document_id: PDA-UX-019
title: Enterprise Table and Data Grid Standard
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Enterprise Table and Data Grid Standard

## Purpose

Define when and how dense tables, virtualized grids, editable cells, grouping, selection, aggregation, and export support serious operational work without sacrificing accessibility or clarity.

## Selection

Use a semantic table for reading and comparison. Use a grid only when users need interactive cell navigation, selection, editing, or spreadsheet-like behavior.

## Required Capabilities

- Stable row identity
- Column definitions and units
- Sorting and filtering
- Saved views
- Column visibility and order
- Pagination or virtualization
- Bulk selection
- Row and cell actions
- Responsive alternative
- Accessible keyboard model
- Loading, stale, offline, error, and partial states

## Editing

Inline editing is allowed only for low-risk fields with clear validation, save state, conflict behavior, and undo or correction. Consequential changes use dedicated forms or workflows.

## Selection

Selection distinguishes visible rows, loaded rows, all matching rows, and explicit record sets. The selected scope remains visible before bulk action.

## Performance

Virtualization must preserve focus, screen-reader meaning, row identity, and scroll position. Server-side sorting and filtering are explicit for large datasets.

## Accessibility

Prefer native table semantics. ARIA grid behavior requires complete keyboard and screen-reader testing. Provide non-visual summaries and accessible export where appropriate.

## Quality Gates

- Large-data performance
- Keyboard and screen-reader tests
- Selection-scope tests
- Editable-cell conflict tests
- Responsive behavior
- Export permission tests
- Tenant and field security
