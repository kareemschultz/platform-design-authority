---
name: frontend-architecture
description: Design or review platform frontend architecture, page composition, component boundaries, state ownership, Next.js, TanStack, Expo, accessibility, and white-label behavior. Use for frontend plans, implementations, refactors, and UI architecture reviews.
paths:
  - "apps/**"
  - "packages/ui-*/**"
  - "packages/design-tokens/**"
  - "09-UX/**"
  - "02-Architecture/**"
---

# Frontend Architecture Skill

## Read First

Read the relevant governing documents before proposing code:

- `02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md`
- `02-Architecture/TANSTACK_DECISION_MATRIX.md`
- `18-Decisions/ADR-0005-NEXTJS-TANSTACK-EXPO-CLIENT-STACK.md`
- `09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `09-UX/ADVANCED_INTERFACE_PATTERNS.md`
- `09-UX/FORMS_SELECTION_AND_MULTISELECT.md`
- `09-UX/PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `00-Foundation/UX_PHILOSOPHY.md`

## Architecture Rules

1. Keep authoritative business rules on the server and behind domain application contracts.
2. Separate server state, local interaction state, form state, URL state, and offline state.
3. Use Next.js for the primary web shell and Expo with Expo Router for native applications.
4. Use TanStack Query for server-state synchronization and TanStack Table/Virtual for appropriate dense data surfaces.
5. Do not select a form library without the approved evaluation; follow the existing decision matrix.
6. Use shared semantic design tokens, not duplicated raw styling constants.
7. Share contracts, value objects, identifiers, and behavior specifications across web and native; do not force identical rendered components.
8. Every route and component must respect tenant context, permission, entitlement, classification, and connectivity state.
9. Essential workflows must remain usable without AI.
10. Provider or framework SDKs must not become the business abstraction.

## Page Composition

For each page identify:

- User role and task
- Primary decision or action
- Authoritative data source
- URL and navigation state
- Permission and entitlement behavior
- Loading, empty, stale, offline, pending, error, and success states
- Mobile transformation
- Accessibility behavior
- Audit or analytics events

Prefer task workspaces over generic module landing pages.

## Component Boundaries

Create components around stable interaction contracts, not arbitrary markup fragments.

A reusable component defines:

- Purpose and supported variants
- Controlled and uncontrolled state behavior
- Accessibility semantics
- Keyboard and focus behavior
- Loading and error states
- Responsive behavior
- Token use
- Test contract

Do not build one universal component with dozens of unrelated flags.

## State Ownership

- Server state: TanStack Query or framework server mechanisms
- URL state: filters, tabs, pagination, selected record when shareable
- Form state: chosen form abstraction
- Local transient state: component or page state
- Global client state: only for genuinely cross-route client concerns
- Offline state: explicit sync store and protocol

Do not mirror server state into a global client store without a measured reason.

## Output

When asked for a frontend plan or review, provide:

1. Governing documents and capability identifiers
2. User task and route structure
3. Component tree and ownership
4. State model
5. API and event dependencies
6. Accessibility and responsive behavior
7. Offline and error behavior
8. Test plan
9. Risks and unresolved decisions

Reject visually attractive proposals that violate domain boundaries, accessibility, progressive disclosure, or first-slice scope.

## Sources

This project skill follows the Agent Skills model documented by Anthropic and uses project-local `.claude/skills/` discovery. It is original project guidance, not a copy of an Anthropic or Vercel proprietary skill.
