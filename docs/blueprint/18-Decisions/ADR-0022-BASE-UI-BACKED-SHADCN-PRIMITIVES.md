---
document_id: ADR-0022
title: Prefer Base UI-Backed shadcn Primitives for New Web Components
version: 0.5.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-21
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
- **React Aria hook packages (`@react-aria/*` and `@react-stately/*`) are proposed as a controlled-prototype exception for the lower-level primitive source in exactly two families where Base UI and Radix both ship no first-party primitive: tree/hierarchical selection and virtualized-collection keyboard and selection behavior.** Date/calendar/range picking is explicitly **excluded** from this exception: shadcn ships a first-party Base UI-variant `Calendar` (built on React DayPicker) and a `Date Picker` composed from `Popover` + `Calendar` — verified directly against `ui.shadcn.com/docs/components/base/calendar` and `.../base/date-picker` on 2026-07-21 — so the original premise that Base UI has no first-party date-picking primitive was false; a Codex review of this amendment caught the error before merge. This is not an adoption of shadcn's `react-aria-components` package or its `--base aria` project-level CLI option — those install a second, pre-styled competing base and were evaluated and rejected (see `SHADCN_CONFIGURATION_DECISION_MATRIX.md`). React Aria's own architecture separates the pre-styled `react-aria-components` layer from the independently usable `react-aria`/`react-stately` hook layer beneath it; only the hook layer is proposed here, composed under fully owned, Tailwind-token-styled DOM exactly as this ADR already requires for `@base-ui/react` direct use. Combobox, autocomplete, date/calendar/range picking, and every other family already assigned to Base UI in `PREFERRED_COMPONENT_CATALOG.md` are unaffected and remain Base UI-default. Virtualized-collection use pairs these hooks' selection/keyboard behavior with the platform's existing TanStack Virtual windowing commitment (`ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`); the two are complementary layers, not alternatives. Virtualized-collection behavior is itself two distinct ARIA contracts, not one: `@react-aria/listbox` for static-content collections and `@react-aria/gridlist` for collections whose rows contain interactive children (buttons, checkboxes, menus) — a Codex review caught the original text naming only `listbox`, which would produce the wrong ARIA role/keyboard contract for interactive rows such as data-grid row actions. This is a controlled-prototype-depth proposal only, like the rest of this still-Proposed ADR — no component code is written by this amendment, and adopting it for an actual component still requires its own review against the Required Controls below.

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
- A component built on the React Aria hook exception records provenance the same way as any other source-owned component (source package names and versions, modifications, review status); it is not a premium source, so it does not require the paid-source license/redistribution fields.

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
| 0.3.0 | 2026-07-21 | Platform Design Authority | Named React Aria's `@react-aria/*`/`@react-stately/*` hook packages as the approved lower-level primitive source for date/calendar/range picking, tree/hierarchical selection, and virtualized-collection keyboard/selection behavior — the three families confirmed absent from both Base UI's and Radix's first-party component sets. Evaluated and rejected shadcn's `react-aria-components` package and `--base aria` CLI option as a project-wide base switch; every other family remains Base UI-default. |
| 0.4.0 | 2026-07-21 | Platform Design Authority | Codex review of the 0.3.0 amendment found its date/calendar/range-picking primitive-gap premise false: shadcn ships a first-party Base UI-variant `Calendar`/`Date Picker` (React DayPicker-backed), verified directly against `ui.shadcn.com`. Removed that family from the exception — it stays Base UI-default; only tree/hierarchical selection and virtualized-collection behavior remain. Reworded the exception from "approved" to a controlled-prototype-depth proposal, consistent with this ADR's own still-Proposed status and the rest of this repo's lifecycle discipline. |
| 0.5.0 | 2026-07-21 | Platform Design Authority | A further Codex review found virtualized-collection behavior named only `@react-aria/listbox`, which implements the ARIA listbox pattern for static content — the wrong contract for collections with interactive row children (buttons, checkboxes, menus), which React Aria's own docs route to `useGridList`/`@react-aria/gridlist` (grid ARIA pattern) instead. Added `@react-aria/gridlist` alongside `@react-aria/listbox`, both pairing with `@react-stately/list`, and named the ARIA-contract distinction explicitly. Empirically verified via `bun install` that all named hook packages resolve and install cleanly against this platform's `react@^19.2.7` pin. |
