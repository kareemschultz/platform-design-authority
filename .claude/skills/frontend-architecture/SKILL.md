---
name: frontend-architecture
description: Design or review platform frontend architecture, page composition, component boundaries, state ownership, Next.js, TanStack, Expo, Tailwind, shadcn/ui, accessibility, analytics, and white-label behavior. Use for frontend plans and architecture reviews before implementation.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# Frontend Architecture Skill

## Safety and Scope

This skill is read-only and produces architecture and implementation plans. It does not modify code. Remove the restriction only through a separate explicitly authorized implementation workflow.

Do not use undocumented `paths` metadata. Claude Code discovers project skills from `.claude/skills/` and their descriptions.

## Read First

- `docs/blueprint/02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md`
- `docs/blueprint/02-Architecture/TANSTACK_DECISION_MATRIX.md`
- `docs/blueprint/18-Decisions/ADR-0005-NEXTJS-TANSTACK-EXPO-CLIENT-STACK.md`
- `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `docs/blueprint/09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `docs/blueprint/09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `docs/blueprint/09-UX/PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `docs/blueprint/09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`
- `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `docs/blueprint/00-Foundation/UX_PHILOSOPHY.md`

## Architecture Rules

1. Keep authoritative business rules on the server and behind domain application contracts.
2. Separate server, local interaction, form, URL, and offline state.
3. Use Next.js for the primary web shell and Expo with Expo Router for native applications.
4. Use the latest approved stable Tailwind CSS release, pinned and reviewed.
5. Use owned shadcn/ui source components normalized into platform tokens and contracts.
6. Use TanStack Query for server state and TanStack Table/Virtual for appropriate dense data surfaces.
7. Use shadcn chart composition and Recharts for the initial ordinary web chart family.
8. Do not select a form library without the approved evaluation.
9. Share semantic tokens, contracts, value objects, and identifiers across web and native; do not force identical rendered components.
10. Every route and component respects tenant, permission, entitlement, classification, and connectivity state.
11. Essential workflows remain usable without AI.
12. Provider, premium-block, or framework source must not become the business abstraction.

## Page Composition

For each page identify:

- User role and task
- Primary decision or action
- Authoritative data source
- URL and navigation state
- Permission and entitlement behavior
- Loading, empty, stale, offline, pending, error, and success states
- Interactive analytics and drill behavior where applicable
- Mobile transformation
- Accessibility behavior
- Audit and product analytics events

Prefer task workspaces over generic module landing pages.

## Component Boundaries

A reusable component defines purpose, variants, state behavior, accessibility, keyboard and focus behavior, loading and error states, responsive behavior, token use, performance budget, and test contract.

Do not build one universal component with dozens of unrelated flags.

## State Ownership

- Server state: TanStack Query or framework server mechanisms
- URL state: filters, tabs, pagination, selected record, and shareable analytical state
- Form state: approved form abstraction
- Local transient state: component or page state
- Global client state: only genuinely cross-route concerns
- Offline state: explicit sync store and protocol

Do not mirror server state into a global client store without a measured reason.

## Output

Provide:

1. Governing documents and capability identifiers
2. User task and route structure
3. Component tree and ownership
4. State model
5. API and event dependencies
6. Tailwind, shadcn/ui, chart, and token approach
7. Accessibility and responsive behavior
8. Offline and error behavior
9. Performance and quality budgets
10. Test plan
11. Risks and unresolved decisions

Reject attractive proposals that violate domain boundaries, accessibility, progressive disclosure, data integrity, or first-slice scope.
