---
document_id: PDA-UX-017
title: Component Catalog and State Matrix
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
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

## Data Display and Analytics

- Table and virtualized table
- Record list
- KPI and delta card
- Sparkline
- Responsive chart container
- Chart tooltip and legend
- Filter and comparison toolbar
- Brush and range selector
- Insight and annotation panel
- Accessible chart summary and data table
- Empty state
- Timeline and activity feed
- Definition list
- Key-value inspector
- Tree

Interactive chart components follow `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` and must support exact-value inspection, responsive sizing, accessible alternatives, active-filter visibility, drill context, freshness, partial data, and live-update behavior where applicable.

## POS and Retail Components

- Barcode and scanner input field
- Product lookup and result list
- Product tile and variant chooser
- Cart line and cart summary
- Quantity and unit editor
- Price override request and approval panel
- Tender selector
- Cash denomination and amount-received pad
- Numeric keypad
- Split-tender composer
- Customer-approved payment-request panel
- Payment uncertainty and reconciliation status
- Stored-value lookup, balance, reservation, and redemption panel
- Receipt preview and delivery panel
- Return-line selector
- Refund-destination summary
- Register and shift status
- Cash drawer, safe-drop, variance, and deposit panel
- Offline lease, sync queue, and conflict status
- External scanner and keyboard command handling

Every POS component defines touch, keyboard, scanner, screen-reader, offline, pending, provider-uncertainty, and manager-approval behavior.

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

## AI-Assisted and Explainable Components

- Suggestion and recommendation card with rationale, confidence, and source disclosure
- Context-scoped copilot panel
- Draft-to-review handoff
- Autonomy-level indicator aligned with `docs/blueprint/06-AI/AI_PLATFORM_ARCHITECTURE.md`
- Proposed-action preview with affected scope and ordinary permission/entitlement result
- Explicit approval, denial, and edit-before-approval controls
- Explainability and provenance inspector
- Citation and retrieved-evidence list
- Budget, cost, and usage-limit indicator where applicable
- Provider/model degraded, unavailable, uncertain, and AI-disabled fallback
- Accept, reject, and edit-and-accept feedback controls

Every AI-assisted component additionally defines:

- Inform, Draft, Recommend, Act with Approval, and Policy-Bounded Autonomous presentation where the governed workflow permits that level
- Streaming, interrupted, partial, stale-source, missing-citation, policy-denied, tool-denied, approval-required, approval-expired, provider-uncertain, and deterministic-fallback states
- The exact proposed command, tenant and record scope, affected data, authority result, and approval consequence before mutation
- Traceability from displayed rationale and citations to governed AI records
- A fully usable non-AI path for every essential first-slice workflow

AI presentation never grants tool authority, hides normal permissions or entitlements, or converts generated confidence into business truth.

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
- Degraded
- Provider uncertain
- Reconciliation required
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
- Tailwind and semantic-token use
- shadcn/ui or underlying primitive provenance where applicable
- Localization
- Error, pending, offline, and uncertainty behavior
- Performance budget
- Test identifiers used without coupling to presentation

## Composition Rules

- Prefer native semantics.
- Do not nest interactive controls illegally.
- Avoid stacked overlays.
- Keep one primary action per bounded task.
- Do not create visually similar components with different semantics.
- State meaning is stable across white-label themes.
- Premium blocks are normalized into platform-owned components before production use.
- Charts never calculate authoritative business metrics in the client.

## Delivery

Components are implemented in separate web and native packages backed by shared tokens and behavior specifications.

The web foundation uses approved stable Tailwind CSS and source-owned shadcn/ui components. The initial ordinary chart family uses shadcn chart composition with Recharts. Premium Magic UI Pro and shadcn/studio sources may accelerate selected compositions under the premium UI source policy.

Storybook or an equivalent workbench provides examples, accessibility notes, interactive states, responsive viewports, visual regression, and provenance.

## Quality Gates

- Unit and interaction tests
- Keyboard and screen-reader tests
- Responsive examples
- Touch, scanner, and external-keyboard tests for POS
- Chart interaction and structured-data alternatives
- Dark and high-contrast modes
- Text scaling
- Reduced motion
- Visual regression
- Performance budget
- White-label theme validation
- Offline and provider-uncertainty scenarios
