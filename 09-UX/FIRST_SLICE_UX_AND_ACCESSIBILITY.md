---
document_id: PDA-UX-010
title: First Slice UX and Accessibility
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# First Slice UX and Accessibility

## Purpose

Define the user-experience, interaction, accessibility, device, offline, and usability requirements for the first Guyana retail vertical slice.

## Experience Goal

A new cashier should complete an ordinary sale safely after a short guided introduction. A store manager should understand cash, stock, exceptions, and system health without navigating the entire platform. Complexity remains available to authorized specialists but stays out of routine work.

## Primary Personas

### Cashier

Needs fast product lookup, reliable scanning, clear totals, simple tender entry, change calculation, receipt confirmation, return guidance, and visible offline status.

### Store Associate

Needs product availability, customer lookup, price checks, assisted selling, stock lookup, and simple task handoff.

### Store Manager

Needs register controls, overrides, cash variance, refunds, stored-value adjustments, stock exceptions, staff activity, approvals, and operational health.

### Inventory Clerk

Needs barcode-first counting, receiving and transfer seams, adjustment reasons, offline capture, and conflict resolution.

### Finance or Accounting Reviewer

Needs reconciled sales, tender, tax, stored-value, deposit, inventory, and exception outputs with source references.

### Tenant Administrator

Needs organization setup, roles, entitlements, devices, branding, imports, integrations, and support-access controls without ordinary cashier clutter.

### Customer

Needs understandable prices, tax, payment destination, refund destination, receipt, stored-value balance, privacy choices, and accessible communications.

## Core Workflow Standards

Every consequential workflow should:

1. Start from the user's role and current task.
2. Show only relevant fields and actions.
3. Preserve context across interruptions.
4. Validate as early as useful without blocking normal entry.
5. Explain unavailable actions using permission, entitlement, connectivity, or business-state reasons.
6. Preview financial, stock, stored-value, privacy, or statutory consequences before confirmation.
7. Make success, pending, offline, failed, reversed, and reconciled states visually and programmatically distinct.
8. Provide a clear recovery path rather than a generic error.
9. Preserve an audit-safe reason for overrides and corrections.
10. Avoid requiring users to understand internal domain or engine terminology.

## First-Slice Navigation

Navigation is workspace-based rather than module-based.

### Cashier Workspace

- New sale
- Held sales
- Returns and exchanges
- Customer lookup
- Stored-value lookup
- Register status
- Sync and device status

### Store Manager Workspace

- Store overview
- Approval queue
- Register and cash
- Returns and refunds
- Stored value
- Inventory exceptions
- Imports and reconciliation
- Devices and offline health

### Inventory Workspace

- Search and scan
- Counts
- Adjustments
- Transfers
- Receiving seam
- Sync conflicts

### Administration Workspace

- Organization and locations
- Users, roles, and access
- Entitlements
- Products and imports
- Tax and jurisdiction profile
- Payment adapters
- Branding
- Audit, privacy, support, and diagnostics

A user may receive more than one workspace, but the default home remains task-focused.

## POS Interaction Model

### Product Entry

Support barcode scanning, keyboard search, touch selection, recent items, quantity entry, weighted or measured-item seams, and unavailable-item explanation.

Search results show price, stock context, variant, unit, and restriction without overwhelming the cashier.

### Cart

- Large, readable line items and totals
- Explicit quantity, price, discount, tax, and fulfillment state
- Keyboard and touch operation
- Undo for reversible local changes
- Manager approval for governed overrides
- Clear held, resumed, and duplicate-sale behavior
- No silent price or tax recalculation after confirmation

### Tender

Tender selection distinguishes:

- Cash
- Card or bank provider
- Wallet or request-to-pay
- Customer stored value
- Customer account - deferred; see `FIRST_SLICE_TENDER_SCOPE_CLARIFICATION.md` and `registry/first-slice.json`
- Split tender

The interface shows whether an electronic payment is waiting for customer approval, authorized, captured, failed, uncertain, reversed, or refunded. It never displays an interactive payment request as an automatic charge.

For cash, show amount received, change due, denomination assistance where configured, and drawer consequence. Do not preselect a tender that could create an accidental financial action.

### Completion

The completion view shows:

- Final total and tenders
- Change or remaining balance
- Receipt status and reference
- Inventory and stored-value state where useful
- Online, pending, or offline status
- Print, email, SMS, or secure receipt options according to consent and channel policy
- Next task with a safe default

## Returns and Refunds

The user must see:

- Original sale and eligible lines
- Return reason
- Quantity and condition
- Original and proposed refund destination
- Cash, provider, or stored-value timing
- Restock, quarantine, or write-off result
- Approval requirement
- Customer communication

The UI must not substitute store credit merely because the original rail is inconvenient. It explains when a provider refund is pending or requires manual review.

## Stored Value Experience

Show available, pending, reserved, expired, and suspended value separately. Hide protected activation data. Manual adjustment requires reason and, above policy thresholds, approval.

Offline redemption displays the offline allowance and pending reconciliation state rather than pretending the server balance is current.

## Offline and Synchronization Experience

Connectivity is a visible operating state, not a transient toast.

Required states:

- Online and synchronized
- Online with pending work
- Degraded provider or service
- Offline with valid lease
- Offline with limited capabilities
- Lease expiring
- Lease expired or device revoked
- Conflict or reconciliation required

For every offline-capable action, explain:

- Whether it is allowed
- Which tenders or values are restricted
- Whether the result is final or pending
- When synchronization is required
- What the user should do if the device remains offline

Queued work is inspectable. Duplicate submission and conflict resolution must not require users to interpret raw event or database identifiers.

## Error Prevention and Recovery

Financial, legal, and data-changing workflows follow WCAG error-prevention principles and platform reversal doctrine.

- Confirm irreversible or externally consequential actions.
- Prefer previews for refunds, stored-value changes, stock adjustments, imports, and permission changes.
- Preserve user input after recoverable failure.
- Focus and announce the first error while providing a complete error summary.
- Explain the field, cause, and correction.
- Provide idempotent retry for uncertain network outcomes.
- Distinguish retry from creating a new transaction.
- Use reversal or correction workflows instead of hidden destructive edits.

## Accessibility Standard

The initial target is WCAG 2.2 Level AA for web experiences, supplemented by WAI-ARIA Authoring Practices for custom interaction patterns and native accessibility guidance for iOS and Android.

Required practices include:

- Full keyboard operation without traps
- Visible, unobscured focus
- Logical focus order
- Programmatic names, roles, states, and values
- Status messages announced without stealing focus
- Sufficient text and non-text contrast
- Reflow and zoom support
- Minimum touch-target sizing
- Alternatives to dragging and complex gestures
- No reliance on color, sound, motion, or position alone
- Clear labels, instructions, and error suggestions
- Reduced-motion behavior
- Accessible authentication without unnecessary cognitive tests
- Consistent help and repeated-entry reduction
- Screen-reader testing of complete workflows, not isolated components only

Automated checks are necessary but never sufficient for conformance.

## Data Tables and Dense Screens

TanStack Table and Virtual are implementation tools, not accessibility exemptions.

Tables must provide:

- Correct headers and relationships
- Keyboard navigation appropriate to the interaction model
- Sort and filter state announcements
- Accessible column visibility and saved views
- Non-virtualized print and export paths
- Responsive cards or focused task views where a wide grid would be unusable
- Preservation of focus during refresh and virtualization

Do not use an ARIA grid when an ordinary semantic table or list provides a simpler experience.

## Mobile and Native

Expo and React Native experiences must support:

- Dynamic type and text scaling
- VoiceOver and TalkBack
- Platform focus and rotor behavior
- Accessible labels, hints, actions, and state
- Large touch targets
- External scanners and keyboards where relevant
- Safe-area, orientation, and device-size variation
- Native controls through Expo UI only when parity, fallback, testing, and accessibility are defined

The design system shares semantic tokens and behavior specifications rather than forcing identical rendering across web, SwiftUI, and Jetpack Compose.

## Localization and Currency

- GYD is displayed correctly without assuming every currency uses two decimal places.
- USD and other currencies remain explicit; never infer currency from symbol alone.
- Dates, times, numbers, names, addresses, and phone numbers respect locale and jurisdiction.
- Text expansion and right-to-left readiness are considered even when the initial pilot is English.
- Terminology mappings must not change canonical meaning.

## White Label and Theming

Customer branding cannot reduce contrast, hide focus, change state semantics, imitate another trusted party, or remove required legal and security information. The theme system validates accessible token combinations and provides a safe fallback.

## AI in the First Slice

AI is not required to complete any essential first-slice workflow. Any AI assistance must:

- Be optional
- Identify itself
- Show sources or inputs
- Never hide the deterministic path
- Preserve keyboard and screen-reader access
- Require ordinary approval for consequential action
- Provide a clear non-AI fallback

## Usability Measures

For each primary workflow, measure:

- Successful completion rate
- Median and tail completion time
- Steps, clicks, scans, and required typing
- Error and correction rate
- Manager intervention rate
- Training time
- Offline completion and reconciliation success
- Accessibility defects and assistive-technology completion
- Support requests
- User confidence and perceived workload

## First-Slice UX Acceptance

The slice is not ready for pilot until representative users can complete:

- Open register
- Cash sale
- Mixed-tender sale
- Offline sale and synchronization
- Return and refund
- Stored-value issue and redemption
- Stock count and adjustment
- Register close and cash variance
- Product import correction
- Customer privacy request intake

Testing includes keyboard-only, screen reader, zoom/reflow, touch, external scanner, low-connectivity, and recovery scenarios.

## Source References

- W3C Web Content Accessibility Guidelines 2.2: https://www.w3.org/TR/WCAG22/
- W3C WAI-ARIA Authoring Practices Guide: https://www.w3.org/WAI/ARIA/apg/