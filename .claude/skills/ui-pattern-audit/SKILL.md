---
name: ui-pattern-audit
description: Audit information architecture, interaction-pattern selection, progressive disclosure, workflow states, responsiveness, consistency, and task efficiency. Use accessibility-review instead when WCAG conformance or assistive-technology behavior is the primary question.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# UI Pattern Audit Skill

## Safety

This is a read-only audit skill. `disallowed-tools` removes mutation and shell tools while the skill is active. Do not use `allowed-tools` as a restriction mechanism; it only pre-approves listed tools.

## Skill Boundary

Use this skill when the main question is whether the chosen interface patterns, hierarchy, disclosure, states, and workflow composition are appropriate.

Use `accessibility-review` when the main question is WCAG conformance, keyboard behavior, screen-reader semantics, contrast, zoom, touch-target compliance, or assistive technology. A UI-pattern audit may identify accessibility risks but should delegate a formal conformance review.

## Inputs

Identify the screen, flow, component, or diff being reviewed. Read:

- `docs/blueprint/09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `docs/blueprint/09-UX/PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `docs/blueprint/09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md` when charts or analytics are involved
- `docs/blueprint/00-Foundation/UX_PHILOSOPHY.md`

## Audit Dimensions

### Task and Hierarchy

- Is the user's role and primary task clear?
- Is there one obvious primary action where appropriate?
- Are critical status, scope, currency, time, and freshness visible?
- Does information weight control screen real estate?

### Pattern Choice

- Are tabs used for peers rather than ordered steps?
- Are wizards reserved for dependent, consequential setup?
- Are modals short and bounded?
- Are drawers context-preserving rather than mini applications?
- Are popovers and menus lightweight and anchored?
- Is bulk-selection scope explicit?

### Progressive Disclosure

- Is low-frequency complexity hidden but discoverable?
- Are errors inside collapsed content surfaced?
- Are fees, destructive impact, permissions, and legal consequences always visible?
- Does the interface remain efficient for experienced users?

### States

Check loading, empty, no results, partial, stale, offline, pending, uncertain provider result, permission denial, entitlement absence, validation error, recoverable failure, and success.

### Accessibility Risk Scan

Identify obvious keyboard, focus, naming, status, contrast, reflow, touch-target, motion, and non-color risks. Route formal conformance findings to `accessibility-review`.

### Visual System

Check token use, alignment, proximity, repetition, contrast, typography hierarchy, density, and avoidance of arbitrary one-off values.

### Mobile and Offline

Check mobile transformation, scanner/external keyboard behavior, offline authority, sync status, pending work, and conflict recovery.

## Output Format

Return:

1. Executive verdict
2. User task and risk level
3. Findings by severity
4. Pattern substitutions with reasons
5. Missing states
6. Accessibility risks requiring formal review
7. Mobile/offline findings
8. Recommended component and token changes
9. Acceptance tests

Do not praise visual polish that obscures workflow or correctness. Prefer fewer, stronger patterns over component variety.
