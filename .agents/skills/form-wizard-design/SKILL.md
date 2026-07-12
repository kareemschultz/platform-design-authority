---
name: form-wizard-design
description: Design or review forms, field groups, searchable selects, multi-selects, bulk edits, repeatable sections, conditional fields, wizards, steppers, validation, and offline form behavior.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# Form and Wizard Design Skill

## Safety

This is a read-only design and review skill. Mutation and shell tools are removed while active.

## Governing Documents

- `09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `09-UX/PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `02-Architecture/TANSTACK_DECISION_MATRIX.md`

## Choose the Form Shape

Use:

- Simple form for one bounded purpose
- Structured page for related sections
- Wizard for dependent ordered setup
- Record workspace for long-lived, frequently revisited records
- Search dialog or picker drawer for rich record selection

Do not turn every form into a wizard or every edit into a modal.

## Required Design

Define:

- User and goal
- Create, edit, draft, approval, posting, or submission boundary
- Fields and why they are needed now
- Defaults and inheritance
- Conditional fields
- Repeatable groups
- Single and multi-select behavior
- Validation layers
- Permission, entitlement, and classification
- Save, autosave, cancel, and unsaved-change behavior
- Server errors
- Offline and synchronization behavior
- Mobile transformation
- Accessibility and keyboard sequence
- Test cases

## Multi-Select Checklist

- Searchable when the option set is large
- Scope of select-all is explicit
- Tokens collapse for large selections
- Selected and disabled options are clear
- Hierarchical inheritance is visible
- Removal works by keyboard and screen reader
- Remote loading and errors are handled
- “Leave unchanged” differs from “clear” in bulk forms

## Wizard Checklist

- Steps have real dependencies
- Optional and conditional steps are explicit
- Back navigation is safe
- Save and resume is defined
- Validation timing is deliberate
- Final review states consequences
- Final commit is idempotent
- Cancellation cleans up provisional state
- Expert users have safe shortcuts where warranted

## Output

Produce a form schema outline, interaction sequence, state model, validation matrix, accessibility plan, mobile/offline behavior, and acceptance tests. Flag any business rule placed in client-only code.
