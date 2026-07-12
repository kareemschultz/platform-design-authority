---
name: accessibility-review
description: Perform a formal accessibility review against WCAG 2.2 AA goals and platform policies, including keyboard, focus, screen readers, semantics, contrast, zoom, touch targets, motion, charts, tables, forms, mobile, and error prevention. Use ui-pattern-audit instead when pattern choice and workflow composition are the primary question.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# Accessibility Review Skill

## Safety

This is a read-only audit skill. Mutation and shell tools are removed while active.

## Skill Boundary

Use this skill when the requested outcome is accessibility conformance evidence, criterion-level findings, assistive-technology behavior, or verification steps.

Use `ui-pattern-audit` for information hierarchy, overlay choice, progressive disclosure, and broad workflow composition. This skill may reference pattern defects only where they create an accessibility barrier.

## Read First

- `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `docs/blueprint/09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `docs/blueprint/09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `docs/blueprint/09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `docs/blueprint/09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`
- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`
- `docs/blueprint/09-UX/ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`

## Review Scope

Audit complete workflows, not only isolated markup.

### Keyboard and Focus

- All functions are keyboard accessible.
- Focus order follows task order.
- Focus is visible and unobscured.
- Dialogs, menus, tabs, comboboxes, drawers, charts, and grids follow appropriate interaction patterns.
- Focus returns sensibly after overlays close.
- Live refresh does not steal or lose focus.

### Semantics

- Native elements are preferred.
- Names, roles, states, and values are programmatic.
- Headings and landmarks express structure.
- Tables have correct headers.
- Form groups use fieldset and legend where appropriate.
- Status, errors, pending, offline, and completion are announced.
- Charts provide titles, summaries, exact-value access, and a structured-data alternative where needed.

### Visual and Responsive

- Contrast meets policy.
- Information is not color-only.
- Text zoom and reflow do not cause loss.
- Touch targets meet the approved minimum.
- Reduced motion is respected.
- Dense screens remain usable at high zoom.
- Responsive chart transformations preserve meaning and exact-value access.

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
