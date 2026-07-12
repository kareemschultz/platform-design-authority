---
document_id: PDA-UX-011
title: Advanced Interface Patterns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Advanced Interface Patterns

## Purpose

Define the platform-wide interaction patterns for tabs, tab menus, accordions, popovers, menus, dialogs, drawers, wizards, steppers, command surfaces, bulk actions, progressive disclosure, and dense enterprise workflows.

## Selection Principle

Choose a pattern from the user's task, information shape, risk, frequency, device, and interruption cost. Do not select a component because it looks modern.

## Pattern Matrix

| Pattern | Best for | Avoid when |
|---|---|---|
| Tabs | Peer views within one stable context | The user must complete steps in order |
| Segmented control | Two to five lightweight view modes | Labels are long or options exceed available width |
| Accordion | Optional explanatory sections and low-frequency detail | Users must compare multiple sections simultaneously |
| Popover | Small contextual controls or previews | The task is lengthy, destructive, or requires deep focus |
| Dropdown menu | Compact action lists | Actions require form entry or substantial explanation |
| Modal dialog | Focused, bounded decision or short task | The task is long, highly interruptible, or requires broad context |
| Side drawer | Context-preserving inspection or editing | The drawer would become a full application inside a panel |
| Full page | Complex, deep, or frequently revisited work | The task is a tiny confirmation or one-field edit |
| Wizard | Ordered, consequential setup with dependencies | Users need free navigation among independent sections |
| Stepper | Progress and position within an ordered flow | The flow is short enough that progress is obvious |
| Command palette | Expert navigation and actions | It is the only discoverable way to reach a capability |
| Bulk-action bar | Actions on a selected record set | Selection semantics are ambiguous or destructive scope is unclear |

## Tabs and Tab Menus

Tabs represent peer sections of the same object or workspace.

Requirements:

- One tablist and one active tab per set
- Stable labels using nouns, not vague verbs
- Keyboard navigation following WAI-ARIA practices
- Deep linking for significant tabs
- Preserve unsaved state deliberately or warn before loss
- Lazy loading must not shift focus unexpectedly
- Badges indicate meaningful counts, not decorative noise
- Overflow uses an explicit More menu while keeping the active tab visible
- Mobile may convert to a select, segmented control, horizontally scrollable tablist, or dedicated page based on task complexity

Use a tab menu only when secondary actions truly relate to that tab. Do not hide primary actions behind unlabeled chevrons.

## Modals

A modal interrupts the current flow and blocks interaction outside it.

Use for:

- Short confirmations
- Focused create or edit tasks
- Risk acknowledgement
- Selection from a bounded list
- Preview before a consequential action

Requirements:

- Clear title and consequence
- Initial focus on meaningful content, not automatically on a destructive button
- Escape and close behavior unless doing so would corrupt an irreversible process
- Focus trap and restoration
- No stacked modals except an exceptional system-level interruption
- Responsive transformation to a full-screen sheet on small devices when necessary
- Primary and secondary actions remain visible without obscuring content
- Unsaved-change handling
- Screen-reader announcement

A modal should not contain an entire administration section, a long wizard, or a dense data table with extensive filtering.

## Drawers and Side Panels

Drawers preserve the surrounding context while exposing detail, history, filters, or bounded editing.

Use for:

- Record preview
- Activity and audit timeline
- Filters
- Inspector panels
- Contextual notes and collaboration
- Quick edits that do not require a full workflow

Requirements:

- Explicit width behavior and responsive full-screen fallback
- Clear distinction between preview and editable state
- URL state for shareable or revisitable records where appropriate
- Back-button and close behavior
- Focus management
- Prevent background content from becoming unreadable or inaccessible
- Avoid nesting drawers

## Popovers, Tooltips, and Menus

Tooltips explain; they do not contain required information or actions. Popovers contain lightweight interactive content. Menus contain actions or navigation.

- Tooltips must be available by keyboard and pointer and disappear without trapping focus.
- Popovers need a clear anchor, collision behavior, focus policy, and escape handling.
- Menus use action verbs and group destructive actions separately.
- Disabled actions should usually explain why through adjacent help or an accessible description.
- Never put a critical workflow exclusively behind hover.

## Wizards and Steppers

Use a wizard when the task has dependencies, risk, setup complexity, or a need for progressive validation.

A wizard defines:

- Entry criteria
- Ordered steps
- Optional and conditional steps
- Save-and-resume behavior
- Validation timing
- Back navigation
- Review step
- Final commit boundary
- Cancellation and cleanup
- Recovery from provider or network failure

The final step summarizes what will be created, charged, activated, granted, imported, or changed.

Do not use a wizard to hide poor information architecture. Experienced users should receive shortcuts, templates, prefilled defaults, import paths, or direct-edit modes where safe.

## Progressive Disclosure

Surface the minimum needed to understand and complete the current task. Reveal complexity through:

- Advanced sections
- Conditional fields
- Expandable details
- Inspector drawers
- Contextual help
- Secondary tabs
- Saved views
- Role-based workspaces
- Search and command palette

Hidden content must remain discoverable. Do not use progressive disclosure to conceal fees, legal consequences, permissions, errors, selected scope, or destructive impact.

## Action Hierarchy

Each surface should have one visually dominant next action when the task has a natural next step.

- Primary action: advances or completes the task
- Secondary action: alternative non-destructive path
- Tertiary action: low-emphasis utility
- Destructive action: separated, labeled, and confirmed proportionately

Avoid rows of equally emphasized buttons. Place actions near the object or decision they affect.

## Bulk Selection and Actions

Bulk workflows must show:

- Number of selected records
- Whether selection applies to the current page, current filter, or all matching records
- Excluded or ineligible records
- Permission and entitlement limitations
- Dry-run or preview for consequential actions
- Partial success and retry behavior
- Audit and export evidence

A “select all” checkbox must not silently expand from visible rows to millions of filtered records.

## Empty, Loading, Pending, and Error States

Every advanced component defines:

- Initial empty state
- No-results state
- Loading skeleton or progress
- Partial data
- Stale data
- Offline data
- Pending server confirmation
- Validation error
- Provider uncertainty
- Permission denial
- Entitlement absence
- Recoverable failure
- Irrecoverable or escalated failure

The state should tell the user what happened, what is safe, and what to do next.

## Accessibility and Mobile

Patterns must meet `FIRST_SLICE_UX_AND_ACCESSIBILITY.md` and WCAG 2.2 AA goals. Keyboard, screen reader, zoom, touch, external keyboard, and scanner behavior are part of the component contract.

On small screens, preserve the task rather than shrinking desktop chrome. Tabs may become navigation; drawers may become full pages; dense tables may become focused lists or cards; wizards may use one clear step per screen.

## Anti-Patterns

- Nested tabs
- Modal over drawer over popover
- Hidden destructive actions in ambiguous menus
- Icon-only actions without accessible names
- Hover-only disclosure
- Wizard for a two-field task
- Full page for a trivial confirmation
- Permanent side panels that reduce the main task to a narrow strip
- Tabs used as a substitute for permissions or entitlements
- Accordion sections containing required fields but appearing optional

## Review Checklist

Before approving a pattern, verify:

1. The task and information shape justify it.
2. Primary action and current state are obvious.
3. Keyboard and focus behavior are defined.
4. Mobile transformation is defined.
5. Loading, empty, offline, stale, error, and pending states exist.
6. Permission and entitlement behavior is explicit.
7. URL, back-button, and unsaved-state behavior are intentional.
8. The pattern does not hide consequential information.
9. Analytics can measure completion, abandonment, errors, and time.
10. A simpler pattern would not serve the user better.
