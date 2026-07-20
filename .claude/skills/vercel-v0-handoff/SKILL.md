---
name: vercel-v0-handoff
description: Prepare a precise design-system-aware prompt and implementation handoff for Vercel v0 or another UI generation agent, then review generated output against platform architecture and UX rules.
disable-model-invocation: true
argument-hint: "[screen-or-flow]"
disallowed-tools: Write Edit Bash NotebookEdit
---

# Vercel v0 Handoff Skill

Create a bounded generation brief for `$ARGUMENTS`.

## Safety

This skill is manual-only and read-only. It prepares a brief; it does not mutate the repository or grant broad tool access.

## Read First

- `docs/blueprint/09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `docs/blueprint/09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `docs/blueprint/09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`
- `docs/blueprint/09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `docs/blueprint/09-UX/PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md`
- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `docs/blueprint/02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md`
- Relevant domain, engine, permission, entitlement, and first-slice documents

## Generation Brief

Produce:

1. User, role, task, and success condition
2. Route and surrounding workspace
3. Required data and authoritative owners
4. Information hierarchy and weight
5. Component and pattern selection
6. Exact states: loading, empty, stale, offline, pending, error, success, denied, unentitled
7. Responsive transformation
8. Keyboard, focus, screen-reader, and contrast requirements
9. Tailwind, shadcn/ui, chart, and semantic-token constraints
10. Mock data containing no secrets or customer PII
11. Explicit non-goals and deferred scope
12. Acceptance tests

## Prompt Rules

Tell the generation agent:

- Use the approved Tailwind and owned shadcn/ui foundation.
- Use platform semantic tokens and existing components.
- For ordinary web charts, use the approved shadcn/Recharts direction and follow the interactive analytics standard.
- Treat Magic UI Pro and shadcn/studio blocks as licensed source inputs only when the user supplies or authorizes them.
- Do not invent business rules, permissions, entitlements, providers, or API shapes.
- Do not hardcode tenant identity, prices, currencies, or status meanings.
- Do not use decorative UI that competes with operational data.
- Keep server, URL, local, form, and offline state distinct.
- Use accessible native semantics or proven headless primitives.
- Preserve a deterministic non-AI path.
- Generate only the requested screen or flow.

## Review Generated Output

Check domain and data ownership, component boundaries, state completeness, progressive disclosure, accessibility, interactive analytics, mobile and offline behavior, token use, performance, security, privacy, licensing provenance, and first-slice scope.

Treat v0 as an implementation and exploration accelerator, not architecture authority. Generated code requires ordinary review, testing, and refactoring.
