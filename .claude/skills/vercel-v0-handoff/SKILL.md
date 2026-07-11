---
name: vercel-v0-handoff
description: Prepare a precise design-system-aware prompt and implementation handoff for Vercel v0 or another UI generation agent, then review generated output against platform architecture and UX rules.
disable-model-invocation: true
argument-hint: "[screen-or-flow]"
allowed-tools: Read Grep Glob
---

# Vercel v0 Handoff Skill

Create a bounded generation brief for `$ARGUMENTS`.

## Read First

- `09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`
- `09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `09-UX/PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md`
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
9. Design-token constraints
10. Mock data that contains no secrets or customer PII
11. Explicit non-goals and deferred scope
12. Acceptance tests

## Prompt Rules

Tell the generation agent:

- Use semantic tokens and existing components.
- Do not invent business rules, permissions, entitlements, providers, or API shapes.
- Do not hardcode tenant identity, prices, currencies, or status meanings.
- Do not use decorative UI that competes with operational data.
- Keep server state, URL state, local state, form state, and offline state distinct.
- Use accessible native semantics or proven headless primitives.
- Preserve a deterministic non-AI path.
- Generate only the requested screen or flow.

## Review Generated Output

After generation, check:

- Domain and data ownership
- Component boundaries
- State completeness
- Progressive disclosure
- Accessibility
- Mobile and offline behavior
- Token use
- Loading and error handling
- Security and privacy
- First-slice scope

Treat v0 as a rapid implementation and exploration tool, not as architecture authority. Generated code requires ordinary review, testing, and refactoring.

## Sources

Vercel documents v0 as an AI development environment that can generate applications and work from project context. Vercel AI SDK provides TypeScript tools for AI applications and generative interfaces. This skill applies those tools under this repository's governance rather than adopting their output uncritically.
