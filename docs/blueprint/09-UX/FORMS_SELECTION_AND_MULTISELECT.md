---
document_id: PDA-UX-013
title: Forms Selection and Multiselect
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-21
---

# Forms, Selection, and Multiselect

## Purpose

Define form architecture and selection controls for simple entry, dense enterprise records, repeatable sections, dependent fields, bulk selection, searchable comboboxes, multi-selects, and mobile/offline workflows.

## Form Design Principles

- Organize around the user's task, not the database schema.
- Ask only for information required now.
- Reuse known values and defaults safely.
- Keep labels visible; placeholders are examples, not labels.
- Explain why sensitive or unusual data is requested.
- Validate progressively without punishing normal entry.
- Preserve entered data after recoverable failure.
- Preview consequential effects before commit.
- Separate draft, validation, approval, posting, and external-submission states.

## Form Complexity Levels

### Simple Form

One purpose, few fields, one commit. Use inline or modal only when interruption and context loss are low.

### Structured Form

Multiple related sections on one page. Use headings, summaries, sticky actions where justified, and progressive disclosure for advanced fields.

### Wizard

Ordered setup or transaction with dependencies, conditional steps, review, and final commit.

### Record Workspace

Long-lived record with tabs or sections, collaboration, history, approvals, and partial saves. This is not a modal.

## Field Layout

- Use one column by default for reading and error recovery.
- Use multiple columns only for short, strongly related fields such as city/region/postal code or quantity/unit.
- Align labels and inputs consistently.
- Keep helper text and errors adjacent to the field.
- Group related fields through proximity and headings.
- Avoid placeholder-only or floating-label patterns that reduce clarity.

## Validation

Validation categories:

- Syntax and format
- Domain rule
- Cross-field dependency
- Uniqueness
- Permission or entitlement
- External-provider validation
- Offline limitation
- Approval requirement

Rules:

- Do not show errors before the user has meaningfully interacted unless the state is already invalid.
- Validate destructive or expensive external operations before final commit when possible.
- Provide a form-level error summary and focus path.
- Distinguish warnings from blockers.
- Preserve server errors and correlation references.
- Never rely on client validation as authoritative.

## Select Control Decision

| Situation | Control |
|---|---|
| Two or three mutually exclusive visible choices | Radio group or segmented control |
| Small stable list | Native select or accessible custom select |
| Large searchable single selection | Combobox |
| Several independent booleans | Checkbox group |
| Small known multi-selection | Checkbox group |
| Large searchable multi-selection | Multi-select combobox with tokens and result list |
| Hierarchical selection | Tree selector or staged combobox |
| Record selection with rich attributes | Search dialog, table, or picker drawer |
| Bulk selection from current result set | Table/list selection model |

Do not use a dropdown for a binary choice when a checkbox or switch communicates the state better.

A tree selector's keyboard/selection/ARIA behavior is sourced per `ADR-0022-BASE-UI-BACKED-SHADCN-PRIMITIVES.md`'s React Aria hook exception (`@react-aria/tree`+`@react-stately/tree`), since neither Base UI nor Radix ships a first-party Tree primitive — composed under fully owned, Tailwind-token-styled DOM, not the pre-styled `react-aria-components` package. A staged combobox stays on the existing Base UI Combobox source.

## Multi-Select Combobox

A multi-select supports:

- Search and filtering
- Selected-item tokens or compact summary
- Keyboard navigation
- Clear active option
- Add and remove without losing query context
- Selected and disabled states
- Optional select-all limited to a clearly stated scope
- Maximum selection and eligibility rules
- Remote loading, pagination, and error states
- Accessible count and announcements
- Mobile full-screen picker when space requires it

### Token Behavior

- Tokens use concise labels.
- Removal has an accessible name.
- Backspace behavior must not remove unexpectedly while editing search text.
- Large selections collapse into a summary such as “12 locations selected” with an inspector.
- Do not render hundreds of tokens in a narrow field.

### Select All

“Select all” must state its scope:

- All visible options
- All loaded options
- All matching the current search
- All records in a saved set

Changing the search or filter must not silently change the selection unless the interface explicitly models a dynamic rule-based set.

## Hierarchical Multi-Select

For organizations, locations, categories, permissions, or accounts:

- Clarify whether selecting a parent includes descendants.
- Show inherited versus explicit selection.
- Support partial selection state.
- Prevent impossible or conflicting combinations.
- Display the effective selected scope before commit.
- Preserve tenant and legal-entity boundaries.

## Multi-Select Forms

When a form applies values to multiple selected records:

- Show record count and scope.
- Distinguish “leave unchanged” from “clear value.”
- Preview records that are ineligible.
- Explain partial permissions.
- Provide dry-run results for consequential changes.
- Record one batch operation with per-record outcomes.
- Support safe retry without duplicating changes.

## Repeatable Sections

Use repeatable groups for addresses, lines, contacts, rules, conditions, or allocations.

Requirements:

- Stable item identifiers
- Add, duplicate, reorder, and remove behavior
- Clear minimum and maximum
- Per-item validation summary
- Keyboard-accessible reordering alternative
- Protection against accidental loss
- Virtualization or pagination for very large lists

## Conditional Fields

Reveal conditional fields after the controlling decision, but retain enough context to explain consequences.

- Clear dependent values when no longer valid, with confirmation when data loss matters.
- Do not submit hidden stale values accidentally.
- Preserve values when toggling temporarily if safe and expected.
- Make conditions understandable to screen-reader users.

## Save, Submit, and Commit

Use precise verbs:

- Save draft
- Validate
- Request approval
- Activate
- Post
- Issue
- Submit to authority
- Send payment request
- Import

Avoid generic “Submit” when the business consequence is more specific.

## Unsaved Changes

- Autosave only where versioning and conflict behavior are safe.
- Show saved, saving, offline, conflict, and failed states.
- Warn before navigation when meaningful work would be lost.
- Do not trap users in a form because a nonessential field is invalid.
- Support recovery from browser or device interruption where appropriate.

## Offline Forms

Offline-capable forms declare:

- Fields and options available offline
- Staleness and source time
- Local validation
- Server validation on sync
- Temporary identifiers
- Conflict policy
- Attachment queue behavior
- Lease expiry
- Privacy purge
- Whether submission is final or pending

## Accessibility

Forms must support:

- Programmatic labels and descriptions
- Required-state and error announcements
- Fieldset and legend for groups
- Keyboard operation
- Logical focus order
- Error summary with links
- No color-only validation
- Zoom and reflow
- Touch-target size
- Accessible custom combobox and multi-select behavior
- Authentication and security flows without unnecessary cognitive burden

## Security and Privacy

- Mask Restricted data appropriately.
- Do not prefill secrets.
- Prevent browser or telemetry leakage for protected fields.
- Require fresh authentication for sensitive changes where policy requires it.
- Show effective scope for permission, export, or impersonation forms.
- Minimize collection and state the purpose for sensitive fields.

## Evaluation Requirements

The form-library decision must implement and compare the same representative forms:

- Product and variant editor
- Purchase order with repeatable lines
- Employee onboarding wizard
- Role and permission editor
- Branding and theme form
- Searchable Party picker
- Hierarchical location multi-select
- Offline inventory count
- Bulk record update

Measure accessibility, type safety, validation composition, conditional logic, array performance, server errors, offline persistence, bundle cost, developer ergonomics, and testability before choosing a default library.
