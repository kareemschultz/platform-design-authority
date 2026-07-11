---
document_id: PDA-UX-017
title: Component Catalog and State Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Component Catalog and State Matrix

## Purpose

Define the minimum web and native component families and the states each must support before broad application implementation.

## Foundation Components

- Button and icon button
- Link
- Text input, textarea, number, currency, date, time, and search input
- Checkbox, radio, switch, segmented control
- Select, combobox, multi-select, and hierarchical picker
- Field, field group, error summary, and help text
- Badge, status, avatar, icon, and tooltip
- Divider, stack, grid, and container

## Navigation

- Application shell
- Sidebar and top navigation
- Breadcrumbs
- Tabs and overflow tabs
- Pagination
- Command palette
- Stepper
- Mobile navigation

## Overlays

- Dialog
- Alert dialog
- Drawer and inspector
- Popover
- Menu
- Toast and persistent notice

## Data Display

- Table and virtualized table
- Record list
- KPI card
- Chart container
- Empty state
- Timeline and activity feed
- Definition list
- Key-value inspector
- Tree

## Workflow

- Wizard shell
- Approval panel
- Bulk action bar
- Filter bar
- Saved view selector
- File upload
- Import mapping grid
- Sync and offline status
- Conflict resolver

## State Matrix

Each applicable component defines:

- Default
- Hover
- Focus visible
- Active
- Selected
- Disabled
- Read only
- Loading
- Empty
- Invalid
- Warning
- Pending
- Stale
- Offline
- Success
- Destructive
- Permission denied
- Entitlement unavailable

## Contract Requirements

Every component documents:

- Semantic role
- Keyboard interaction
- Focus behavior
- Screen-reader naming and announcements
- Controlled state API
- Responsive transformation
- Token use
- Localization
- Error and pending behavior
- Test identifiers used without coupling to presentation

## Composition Rules

- Prefer native semantics.
- Do not nest interactive controls illegally.
- Avoid stacked overlays.
- Keep one primary action per bounded task.
- Do not create visually similar components with different semantics.
- State meaning is stable across white-label themes.

## Delivery

Components are implemented in separate web and native packages backed by shared tokens and behavior specifications. Storybook or an equivalent workbench provides examples, accessibility notes, and visual regression.

## Quality Gates

- Unit and interaction tests
- Keyboard and screen-reader tests
- Responsive examples
- Dark and high-contrast modes
- Text scaling
- Visual regression
- Performance budget
- White-label theme validation
