---
document_id: ADR-0022
title: Prefer Base UI-Backed shadcn Primitives for New Web Components
version: 0.2.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0005, ADR-0021]
---

# ADR-0022 — Prefer Base UI-Backed shadcn Primitives for New Web Components

## Context

The platform requires accessible, unstyled, white-label primitives beneath source-owned shadcn components. Base UI 1.6.0 is stable, shadcn/ui now defaults new projects to Base UI, and Fumadocs supports a Base UI-backed package. Existing policy permitted both Base UI and Radix without selecting a default.

## Options Considered

- Base UI-backed shadcn source for new components
- Radix-backed shadcn source
- Direct Base UI without the shadcn source layer
- Uber Base Web (`baseui`)
- A platform-authored primitive library

## Decision

Prefer Base UI-backed shadcn source for new platform web components and the documentation portal.

- Copy and normalize selected shadcn source into `packages/ui-web`.
- Use `@base-ui/react` directly only when a required primitive is absent or lower-level composition is justified.
- Radix remains supported for existing, proven components; do not migrate working components merely for uniformity.
- Do not mix primitive families inside one owned component.
- Uber Base Web is not selected because its styled/Styletron model conflicts with Tailwind and source ownership.
- `@fumadocs/base-ui` is the Fumadocs theme package backed by `@base-ui/react`; it is not the platform business-component package.

## Consequences

### Positive

- Alignment across shadcn, Fumadocs, Tailwind, and the platform token system
- Headless accessibility, focus, keyboard, popup, and form behavior
- Source ownership and incremental migration
- Less need for a platform-authored primitive layer

### Negative

- Base UI APIs differ from Radix, including composition patterns such as `render` versus `asChild`.
- Source ownership still requires accessibility and regression testing.
- Mixed legacy primitives increase temporary maintenance cost.

## Required Controls

- Pin the primitive choice in registry/configuration rather than accepting future CLI defaults silently.
- Apply the provisional Base UI/Rhea bootstrap through `PDA-UX-028`; preserve human-readable inputs and a decoded preset generated with the pinned CLI.
- Record source version and provenance for every imported component.
- Normalize tokens, state APIs, portal stacking, responsive behavior, and error/loading/denied/offline states.
- Test keyboard, focus, screen readers, zoom, contrast, touch, RTL, reduced motion, iOS viewport behavior, and form submission.
- Migrate one component at a time with behavior reports and rollback commits.

## Validation

Prototype Dialog, Menu, Popover, Select, Combobox, Field, Tabs, Toast, Drawer, and one complex searchable multi-select against the platform accessibility and form matrices.

## References

- `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `docs/blueprint/09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md`
- `docs/blueprint/19-Appendices/DOCUMENTATION_TANSTACK_AND_BASE_UI_VERIFICATION-2026-07-12.md`
- `docs/blueprint/19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Frontend architecture | Component boundary | Pending | | |
| Accessibility | Assistive technology | Pending | | |
| Design system | Tokens and white label | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial proposal |
| 0.2.0 | 2026-07-12 | Platform Design Authority | Link governed shadcn bootstrap configuration and reproducibility controls |
