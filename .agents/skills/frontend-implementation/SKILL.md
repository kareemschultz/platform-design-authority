---
name: frontend-implementation
description: Mandatory build-time governance for ALL frontend and UI/UX implementation. Use this skill whenever creating, modifying, importing, restyling, or reviewing any code a user will see — web pages, components, blocks, layouts, themes, styles, charts, tables, forms, dialogs, navigation, native screens, design tokens, or animations — anywhere in apps/ or packages/, even for small tweaks, prototypes, copy changes with layout impact, or "quick fixes". Also use it before running shadcn/Studio/Mobbin searches or generating UI with any tool. If the task touches rendered UI at all, this skill applies.
---

# Frontend Implementation Skill

This skill is the single mandatory entry point for building UI in this repository. It exists because UI governance here was previously honor-system: the rules lived across a dozen 09-UX documents that implementing agents skipped under time pressure, which produced unreviewed pattern choices, token drift, and untracked premium-source imports. The skill routes you through the governed sources in the right order so compliance is the fast path, not extra work. It applies to every implementing agent — Claude Code, Codex, or any other — on web (Next.js) and native (Expo) surfaces alike.

The documents referenced below are the authority; this skill is a router and a hard-rule summary. When they conflict, the documents win — report the conflict rather than resolving it silently.

## Step 1 — Classify the change, read the governing documents

Read these two for any UI change:

- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` and `docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md` — the token system every visual decision resolves to
- `docs/blueprint/00-Foundation/UX_PHILOSOPHY.md` — why the platform looks and behaves the way it does

Then read what matches the surface you are touching:

- New/changed components, imports, or blocks → `docs/blueprint/09-UX/PREFERRED_COMPONENT_CATALOG.md`, `docs/blueprint/09-UX/COMPONENT_ACQUISITION_POLICY.md`, `docs/blueprint/09-UX/COMPONENT_NORMALIZATION_STANDARD.md`, `docs/blueprint/09-UX/COMPONENT_ACCEPTANCE_CHECKLIST.md`, `docs/blueprint/09-UX/COMPONENT_CATALOG_AND_STATE_MATRIX.md`
- shadcn preset, style, colors, fonts, icons, radius, density, RTL → `docs/blueprint/09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md`
- Premium or external UI source → `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- Dashboards, charts, analytics → `docs/blueprint/09-UX/DASHBOARD_AND_DATA_VISUALIZATION.md`, `docs/blueprint/09-UX/INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`, and invoke the `dashboard-design` skill
- Forms, selects, multi-select, wizards → `docs/blueprint/09-UX/FORMS_SELECTION_AND_MULTISELECT.md`, and invoke the `form-wizard-design` skill
- Dense data tables/grids → `docs/blueprint/09-UX/ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`
- Navigation, command palette, search → `docs/blueprint/09-UX/NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`
- Motion, animation, content/copy → `docs/blueprint/09-UX/ANIMATION_AND_MOTION_GUIDE.md`, `docs/blueprint/09-UX/CONTENT_DESIGN_LOCALIZATION_AND_MOTION.md`, `docs/blueprint/09-UX/ICONOGRAPHY_TERMINOLOGY_AND_PRODUCT_CONTENT.md`
- Disclosure/complexity decisions → `docs/blueprint/09-UX/PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md`
- First-slice scope questions → `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- Stories/visual regression → `docs/blueprint/09-UX/STORYBOOK_AND_VISUAL_REGRESSION_STANDARD.md`

For architecture-level questions (page composition, state ownership, component boundaries), invoke the `frontend-architecture` skill first and plan before implementing.

## Step 2 — Acquire components in the governed order

Search in this order and record the outcome. The order exists because platform-owned source is already normalized and tested, and the paid subscriptions are already bought — hand-building what Studio Pro ships is wasted days, and importing what the platform already owns creates duplicate primitive systems.

1. Platform-owned source: `docs/blueprint/09-UX/PREFERRED_COMPONENT_CATALOG.md` and the owned UI packages under `packages/`.
2. shadcn Studio Pro via its MCP server — an owned subscription; search it before designing any block, page, or composite by hand.
3. Mobbin Pro — an owned subscription; use it for pattern research on novel surfaces.
4. Hand-build, as the last resort.

Any imported or premium-derived UI requires a provenance record following `registry/premium-ui-provenance-template.json`, normalization into platform tokens and owned primitives, and the component acceptance checklist. Never record premium credentials, license keys, or private download URLs anywhere in the repository. Imported UI never redefines domain, permission, entitlement, payment, privacy, or workflow semantics — it is skin over platform contracts, never the contract.

## Step 3 — Build within the hard rules

- **Semantic tokens only.** Raw palette values — hex literals or Tailwind palette utility classes such as `bg-red-500` — are defects in `apps/**` and `packages/**` component code. Audited baseline (2026-07-20, `main`): zero palette classes repo-wide; hex exists only in `apps/native/lib/constants.ts`, `apps/web/src/app/manifest.ts`, and `packages/ui-web/core/src/styles/globals.css`. Do not add a fourth hex location unless it is genuinely a token source.
- **Governed bootstrap.** New authenticated web scaffolds use the Base UI/Rhea/Neutral/Blue/Geist-Inter/Lucide/default-radius bootstrap and are then normalized into semantic tokens. A preset is never design-system authority.
- **Canonical states.** Every component and workflow covers loading, empty, stale, offline, pending, error, and success states, plus accessible compact/comfortable/touch density variants. A component that only handles the happy path is unfinished, not minimal.
- **Accessibility is built in, not bolted on.** Keyboard and focus behavior, semantics, contrast, touch targets, and zoom per WCAG 2.2 AA goals. For formal review, invoke the `accessibility-review` skill; for pattern-selection review, invoke `ui-pattern-audit`.
- **Responsive, offline, and white-label** behavior are requirements of every surface, not enhancements. Offline behavior follows the declared lease/idempotency/conflict semantics; white-label means no tenant-visible hardcoded brand, name, or color.
- **No business rules in UI.** Authoritative rules live on the server behind domain application contracts. Permissions and entitlements are evaluated separately; feature flags are neither. Essential first-slice workflows stay deterministic with AI disabled.
- **Charts** use shadcn chart composition and Recharts; a specialized visualization library needs a justified requirement and review.
- **Codename boundary.** "Meridian" and `@meridian/*` never appear in tenant-visible strings, receipts, or public surfaces.

## Step 4 — Verify before the PR

- Run `bun run gates` and leave every gate green. If generated Playwright artifacts fail the lint gate, delete `apps/web/playwright-report` and `apps/web/test-results` (known residue until the Biome ignore-file fix lands).
- New or meaningfully changed patterns: invoke `ui-pattern-audit`. Accessibility-sensitive changes: invoke `accessibility-review`. Record both outcomes in the PR.
- Imported components: provenance record written, catalog and state matrix updated.
- The PR body's UI/UX section names routes, components, and canonical-state coverage.

## Sibling skills

`frontend-architecture` (pre-implementation planning) · `ui-pattern-audit` (pattern-selection review) · `accessibility-review` (formal WCAG review) · `dashboard-design` (KPI/analytics surfaces) · `form-wizard-design` (forms and wizards). This skill governs the implementation work between planning and review.
