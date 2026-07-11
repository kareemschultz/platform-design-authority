---
name: accessibility-review
description: Review frontend code, components, screens, and workflows for WCAG 2.2 AA goals, keyboard and focus behavior, screen-reader semantics, forms, tables, dialogs, mobile, motion, contrast, and error prevention.
context: fork
allowed-tools: Read Grep Glob
---

# Accessibility Review Skill

## Read First

- `09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`

## Review Scope

Audit complete workflows, not only isolated markup.

### Keyboard and Focus

- All functions are keyboard accessible.
- Focus order follows task order.
- Focus is visible and unobscured.
- Dialogs, menus, tabs, comboboxes, and drawers follow appropriate interaction patterns.
- Focus returns sensibly after overlays close.
- Live refresh does not steal or lose focus.

### Semantics

- Native elements are preferred.
- Names, roles, states, and values are programmatic.
- Headings and landmarks express structure.
- Tables have correct headers.
- Form groups use fieldset and legend where appropriate.
- Status, errors, pending, offline, and completion are announced.

### Visual and Responsive

- Contrast meets policy.
- Information is not color-only.
- Text zoom and reflow do not cause loss.
- Touch targets meet the approved minimum.
- Reduced motion is respected.
- Dense screens remain usable at high zoom.

### Forms and Error Prevention

- Labels remain visible.
- Required and invalid state is announced.
- Error summaries link to fields.
- Instructions and correction suggestions are clear.
- Consequential financial, legal, privacy, and deletion actions include review and confirmation.

### Mobile and Native

- VoiceOver and TalkBack behavior is defined.
- Dynamic type is supported.
- Accessible actions and hints are used carefully.
- External keyboards and scanners do not break navigation.

## Output

Provide:

1. Conformance target and workflow reviewed
2. Findings by severity
3. WCAG criterion or interaction principle when known
4. User impact
5. Recommended correction
6. Verification steps using keyboard, screen reader, zoom, touch, and automated tooling
7. Remaining uncertainty requiring manual testing

Automated checks cannot be the sole evidence of accessibility.
