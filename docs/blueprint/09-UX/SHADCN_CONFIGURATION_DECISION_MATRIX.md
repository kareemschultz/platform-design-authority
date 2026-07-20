---
document_id: PDA-UX-028
title: shadcn Configuration Decision Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
verified_as_of: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# shadcn Configuration Decision Matrix

## Purpose

Select the reproducible shadcn/create starting configuration for the authenticated platform web applications without treating a generated preset as the final design system. The selection is optimized for dense operational work, accessible touch workflows, white label, localization, charts, and source ownership.

The official facts and screenshot evaluation behind this decision are recorded in `docs/blueprint/19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md`.

## Selected Bootstrap Configuration

| Setting | Selection | Decision |
|---|---|---|
| Component base | Base UI | Selected under ADR-0022 and now the shadcn default for new projects. |
| Style | Rhea | Compact, rounded, focused product baseline with better information density than Maia or Luma. |
| Base color | Neutral | Low-chroma generator baseline that is easy to remap into semantic and white-label tokens. |
| Theme/accent | Blue | Safe provisional action and focus seed consistent with the existing token registry; it is not a permanent brand lock. |
| Chart color seed | Blue | Better first-series emphasis than Neutral. The governed eight-role chart palette replaces the generated seed for real charts. |
| Heading font | Geist Sans | Clear contemporary hierarchy for page and section headings; use only approved weights and self-hosted/subset assets. |
| Body font | Inter Variable | UI-focused legibility, broad language coverage, variable weights, and tabular-number support for operational and financial data. |
| Monospace | Geist Mono with system-monospace fallback | Identifiers, codes, technical references, and developer surfaces only. Never use mono for ordinary body copy. |
| Icon library | Lucide | Default shadcn alignment, typed/tree-shakeable React components, React Native package, consistent outline language, and permissive ISC license. |
| Radius | Default | Balanced platform baseline. Map generated radius into governed `radius.*` tokens rather than consuming raw component values. |
| Menu accent | Subtle | Keeps navigation calm and preserves emphasis for status and primary actions. |
| Menu color | Default | Most portable across brand themes and safer than inverted/translucent navigation as a global default. |
| CSS variables | Enabled | Required for semantic tokens, dark mode, high contrast, density, and white-label transformations. |
| TypeScript/TSX | Enabled | Required for the platform component contracts. |
| React Server Components | Enabled for the Next.js app configuration | Component packages still mark client boundaries explicitly and contain no business authority. |
| RTL | Enabled from initial scaffold | Logical layout and CLI transformations are cheaper and safer before component customization. Actual locales still require content and assistive-technology testing. |
| Pointer cursor | Enabled for interactive controls | Reinforces clickability without replacing focus, semantics, labels, or touch behavior. |
| Initial appearance | System preference with light and dark token maps | User preference may override. High contrast remains a separate tested mode. |

The human-readable preset inputs are authoritative; an opaque preset code is generated and decoded with the exact pinned shadcn CLI at implementation time and then committed with `components.json`. Do not copy a code from a screenshot or rely on `@latest` to reproduce it.

```text
base: base
style: rhea
baseColor: neutral
theme: blue
chartColor: blue
iconLibrary: lucide
font: inter
fontHeading: geist
radius: default
menuAccent: subtle
menuColor: default
tsx: true
rsc: true
rtl: true
cssVariables: true
pointer: true
```

## Style Decision Matrix

Scores use 1 (poor) to 5 (strong) for this platform, not for every product. The composite weights operational density 30%, touch adaptation 20%, white-label neutrality 20%, maturity confidence 20%, and distinctiveness 10%.

| Style | Official character | Operational density | Touch adaptation | White-label neutrality | Distinctiveness | Migration/maturity confidence | Weighted result | Disposition |
|---|---|---:|---:|---:|---:|---:|---:|---|
| Vega | Classic shadcn look | 3 | 4 | 5 | 2 | 5 | 3.9 | Stable fallback, but visually generic. |
| Nova | Reduced padding and margins | 4 | 3 | 5 | 3 | 5 | 4.1 | Primary fallback if Rhea prototype fails. |
| Maia | Soft, rounded, generous spacing | 2 | 5 | 4 | 4 | 5 | 3.8 | Good onboarding/portal inspiration; too spacious as the product-wide operational base. |
| Lyra | Boxy, sharp, mono-friendly | 4 | 3 | 3 | 4 | 5 | 3.8 | Too technical and severe for the broad customer base. |
| Mira | Compact and made for dense interfaces | 5 | 2 | 4 | 4 | 5 | 4.1 | Strong for expert grids but risks cramped general and touch workflows. |
| Luma | Rounded, soft elevation, breathable | 2 | 5 | 4 | 5 | 4 | 3.7 | Attractive but too spacious for the default authenticated product. |
| Sera | Editorial, typographic, square/underlined controls | 2 | 3 | 2 | 5 | 4 | 2.9 | Better suited to editorial/marketing expression than frequent transactions. |
| Rhea | Compact Luma for focused product interfaces | 5 | 4 | 5 | 4 | 3 | 4.3 | Selected, subject to prototype and accessibility gates. |

Rhea is newer than Nova and therefore retains Nova as the tested low-change fallback. The platform does not mix multiple shadcn base styles inside `packages/ui-web`. Comfortable, compact, touch/POS, marketing, and portal needs are expressed through owned component variants and semantic tokens rather than importing different style families into the same package.

## Color Decisions

### Base Color: Neutral

Neutral is a generator input, not an application palette. Imported source is immediately remapped to the semantic roles in `registry/design-tokens.json`. This prevents shadcn palette names from becoming product contracts.

Stone and Taupe introduce warmth; Zinc introduces a cooler technical cast; Mauve, Olive, and Mist add chromatic personality. Those may be useful brand inputs later but are weaker universal defaults for a multi-industry, white-label platform.

### Theme: Blue

Blue is the provisional primary-action, selection, link, and focus family. It must not communicate financial success, information status, pending work, or online state by itself. Tenant branding maps an approved brand color into `action.primary` and related roles only after contrast validation.

### Charts: Governed Palette, Not One Preset Color

Select Blue in shadcn/create to obtain a useful first-series seed. Production chart components use the governed categorical, sequential, and diverging roles. They also provide labels, direct values, line/marker differences, accessible summaries, and data-table alternatives. Status colors and categorical chart colors remain distinct.

## Typography Decisions

### Geist Sans Headings

Use Geist Sans for display, page-title, section, and subsection roles. Do not use uppercase-heavy or decorative heading treatments from Sera. Headings retain semantic HTML and the sizes/weights governed by `PDA-UX-023`.

### Inter Variable Body

Use Inter Variable for body, labels, inputs, tables, menus, and dense operational data. Enable tabular numerals for aligned money, quantities, dates, times, and comparative metrics. A font style never changes the approved decimal, currency, unit, or locale formatting rules.

Two families add loading and visual-regression cost. The prototype must compare Geist-heading/Inter-body against Inter-only. If the second family exceeds the performance budget, creates glyph mismatches, or complicates localization, headings inherit Inter without changing the component API.

Use locale-specific Noto or another approved family when required glyph coverage is absent. Font fallback must be tested for text expansion, line height, numerals, diacritics, RTL, PDF/document output, and native parity.

## Icon Decisions

Lucide is the canonical initial source for web and native. Use direct named imports from `lucide-react` and `lucide-react-native`; never import the complete icon namespace into application bundles.

The design system owns the concept-to-icon mapping, accessible label, size, stroke, directionality, and fallback. Icons reinforce text and state; they do not replace necessary labels or become the only carrier of success, warning, error, offline, or destructive meaning.

Brand and provider logos are not Lucide icons. They follow separate asset, trademark, and provenance rules.

## Density and Touch Reconciliation

Rhea's compactness is a component geometry starting point, not permission to shrink targets below policy.

| Mode | Intended surfaces | Minimum behavior |
|---|---|---|
| Compact | Accounting grids, inventory tables, audit, high-volume administration | 32–36 px rows where controls retain adequate hit area, spacing, keyboard access, zoom, and non-overlapping targets. |
| Comfortable | Default forms, portals, administration, dashboards | 40 px controls and 44 px rows by default. |
| Touch/POS | POS, scanners, warehouses, tablets, coarse pointer | 48 px minimum frequent targets, larger totals/actions, glove/scanner tests, and no hover dependency. |

Density is selected by surface and input context, not by globally scaling Tailwind spacing or browser detection alone. A user preference may increase density/size but cannot remove evidence, labels, state, or required controls.

## Studio Theme Generator and Theme Intake (added 2026-07-20)

shadcn Studio Pro's theme generator and its `@ss-themes` registry are the **preferred theme-crafting tools** for this platform — for evolving the platform default theme and for producing white-label tenant theme candidates alike. Heavy use is expected and encouraged. What they are not, and cannot become, is the design-system **authority**: §8's "a preset is not design-system authority" and this document's own purpose sentence apply to a Studio theme exactly as they apply to a shadcn/create preset. The platform's semantic token roles (`registry/design-tokens.json`, `packages/ui-web/core/src/styles/globals.css`) remain the product contract — which is precisely what makes white-label tenant theming possible at all: a theme is a set of values mapped into platform-owned roles, never a replacement for the roles themselves.

The governed fast path for a Studio-crafted theme — designed so the governed route is also the fastest route:

1. **Craft** in the Studio theme generator (or select an `@ss-themes` entry as the starting point). Iterate freely there; nothing at this stage touches the repository.
2. **Land as a candidate.** Export/fetch the theme's CSS variable values. They enter the repository only as remapped values on the platform's existing semantic roles in `packages/ui-web/core/src/styles/globals.css` (an allowlisted token source in `scripts/validate_ui_governance.py`) — Studio's own variable names are mapped, not adopted, the same rule Base Color: Neutral already applies to generator palettes.
3. **Validate** before any adoption: contrast on every remapped role pair, light/dark/high-contrast/forced-colors behavior, and the status-color separation rules (an accent theme must not repaint financial success, pending, or error semantics). The existing Prototype Gates list is the reference checklist; a tenant-candidate theme additionally runs the "deliberately difficult white-label themes" gate.
4. **Record** the decision as a row or amendment in this document (which theme, from what Studio source, for which scope — platform default vs. named tenant candidate), so the choice is reviewable and reversible. `evidence/ui-provenance/` records the source item when the theme derives from a paid `@ss-themes` entry.
5. **Never per-surface.** A theme applies at the token layer for a whole application (or a whole tenant), never as an inline install scoped to one page or component — that is the "ungoverned re-theming" failure mode this section exists to prevent, and it is what the skills' refinement guardrail routes here.

The `/rui` theme-install capability and `npx shadcn add @ss-themes/<name>` are the *mechanics* of step 2, not a bypass of steps 3–4. An agent may run the full path end-to-end in one session — craft, land, validate, record — provided all four steps happen; what it may not do is stop after step 2.

## Scaffold and Monorepo Rules

1. Pin the exact shadcn CLI and Base UI versions in the implementation lock and lifecycle ledger.
2. Generate in a disposable branch/worktree and inspect the preset using the official decode command.
3. Keep matching `style`, `iconLibrary`, `baseColor`, aliases, and CSS path across `apps/web/components.json` and `packages/ui-web/components.json`.
4. Use Tailwind v4 configuration conventions and semantic CSS variables.
5. Enable RTL before installing/customizing components.
6. Copy only required components. Use `view`, `--dry-run`, and diffs before overwriting owned source.
7. Do not apply a full preset to an established component package without a reviewed migration. Partial theme/font apply still requires token and visual review.
8. Normalize source into platform variants, states, tokens, accessibility contracts, and tests; the preset code is provenance, not runtime configuration.
9. Keep the web component package independent of Vercel hosting and compatible with the approved container deployment.

## Prototype Gates

The selection remains Draft until the prototype covers:

- Dialog, Menu, Popover, Select, Combobox, Field, Tabs, Toast, Drawer, data grid, complex multi-select, chart, and POS controls
- Base UI keyboard/focus behavior and screen-reader testing
- Rhea compact, comfortable, and 48 px POS/touch variants
- Light, dark, high-contrast, reduced-motion, 200%/400% zoom, and Windows forced-colors
- Neutral/Blue default plus at least three deliberately difficult white-label themes
- Geist/Inter loading, layout shift, offline/self-hosted assets, unsupported glyph fallback, and Inter-only comparison
- Lucide direct-import bundle evidence and native parity
- RTL, text expansion, long currency/unit values, GYD/USD display, and locale-specific numerals
- Recharts categorical palette and non-color differentiation
- Bun and Node builds, Storybook visual regression, Playwright accessibility, and real iOS/Android/Windows/browser checks

## Related Documents

- `docs/blueprint/09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `docs/blueprint/09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`
- `docs/blueprint/09-UX/ICONOGRAPHY_TERMINOLOGY_AND_PRODUCT_CONTENT.md`
- `docs/blueprint/09-UX/TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `docs/blueprint/09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `docs/blueprint/18-Decisions/ADR-0022-BASE-UI-BACKED-SHADCN-PRIMITIVES.md`
- `docs/blueprint/19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md`
