---
document_id: PDA-APP-018
title: shadcn Configuration Verification - 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# shadcn Configuration Verification — 2026-07-12

## Purpose and Method

Record the dated official evidence used to evaluate the seven supplied shadcn/create screenshots and select the platform bootstrap configuration. Sources are limited to official shadcn/ui, Base UI, Lucide, Inter, and Geist material. The screenshots are input evidence, not an implementation lock or a reproducible preset by themselves.

## Screenshot Configuration Observed

Across the supplied screenshots the visible selections were:

- Maia style
- Neutral base color
- Blue theme/accent
- Neutral chart color
- Geist heading and Inter body in the later screenshot
- Lucide icon library
- Default radius

This is close to the recommendation. The governed matrix changes Maia to Rhea and Neutral chart seed to Blue, then adds settings not visible in the screenshots: Base UI, subtle/default menus, CSS variables, TSX, Next.js RSC configuration, RTL, pointer cursor, semantic tokens, density modes, and an implementation-time pinned preset code.

## Official Style Findings

The official shadcn/create introduction described the original styles as:

- Vega: classic shadcn appearance
- Nova: reduced padding and margins for compact layouts
- Maia: soft and rounded with generous spacing
- Lyra: boxy and sharp, pairing with mono fonts
- Mira: compact and made for dense interfaces

Later official releases added:

- Luma: rounded geometry, soft elevation, and breathable layouts
- Sera: editorial and typography-first, with uppercase headings, square corners, and underlined controls
- Rhea: a more compact Luma, using smaller spacing and controls for focused product interfaces while preserving Tailwind's underlying spacing scale

Project inference: Rhea best balances dense enterprise workflows and a calm rounded foundation. Nova is the fallback because it is compact, neutral, and more established. Maia/Luma are too spacious as the single product-wide base; Mira is strong for expert density but weaker for touch and general workflows; Sera and Lyra impose stronger visual personalities.

Sources:

- `https://ui.shadcn.com/docs/changelog/2025-12-shadcn-create`
- `https://ui.shadcn.com/docs/changelog/2026-03-luma`
- `https://ui.shadcn.com/docs/changelog/2026-04-sera`
- `https://ui.shadcn.com/docs/changelog` (May 2026 Rhea entry)

## Base UI Finding

shadcn/ui made Base UI the default for new projects in July 2026 while retaining Radix support and explicitly advising working applications not to migrate merely for uniformity. Base UI 1.6.0 was the latest stable line observed, and its documentation describes WAI-ARIA-oriented keyboard/focus behavior while retaining application responsibility for visible focus, labels, contrast, composition, and testing.

This supports ADR-0022: Base UI-backed shadcn source for new components, no bulk Radix rewrite, and platform-owned accessibility evidence.

Sources:

- `https://ui.shadcn.com/docs/changelog` (July 2026 Base UI default entry)
- `https://base-ui.com/react/overview/releases`
- `https://base-ui.com/react/overview/accessibility`

## Preset and CLI Findings

The current official CLI supports preset creation/application, decoding, URL generation, resolution from a project, and partial theme/font application. Official registry APIs also expose `encodePreset` and `decodePreset`. Presets include style, base color, theme, chart color, icon library, body/heading fonts, radius, and menu settings.

The CLI's default shortcut currently uses Next.js plus Nova, but a CLI default is not a project decision. Full preset apply can reinstall components and change theme, colors, CSS variables, fonts, and icons. Partial apply reduces scope but still changes governed source. Therefore:

- store human-readable inputs plus the decoded pinned code;
- dry-run/diff before application;
- never run a full preset over owned production components automatically;
- retain source ownership and migrations.

Sources:

- `https://ui.shadcn.com/docs/cli`
- `https://ui.shadcn.com/docs/changelog/2026-04-preset-commands`
- `https://ui.shadcn.com/docs/changelog/2026-04-partial-preset-apply`
- `https://ui.shadcn.com/docs/registry/api-reference`

## Monorepo and RTL Findings

Official monorepo guidance requires a `components.json` in each relevant workspace with consistent style, icon library, and base color, correct CSS paths, and aliases. The official RTL flow uses logical transformations and is directly supported for the newer style families when enabled through configuration or migration.

Project inference: RTL should be enabled at initial scaffold even though the first pilot language is English. Retrofitting directionality after source normalization creates more risk and review work.

Sources:

- `https://ui.shadcn.com/docs/monorepo`
- `https://ui.shadcn.com/docs/rtl`

## Color and Chart Findings

The shadcn chart layer supports CSS-variable colors and light/dark theme mappings. The project already has a semantic token registry with neutral/slate-like surfaces, Blue action/focus values, stable status roles, and a separate eight-role chart palette.

Project inference:

- choose Neutral as a low-opinion generator base;
- choose Blue as the default action/focus and chart seed;
- immediately remap generated colors to governed semantic roles;
- never use one preset chart color as the production analytical palette;
- keep chart series and status colors distinct and provide non-color differentiation.

Source: `https://ui.shadcn.com/docs/components/base/chart`

## Typography Findings

Inter describes itself as a UI and broad-application workhorse with more than 2,000 glyphs across 147 languages, variable optical sizing, tabular numbers, slashed zero, and disambiguation features. These are materially useful for tables, money, quantities, identifiers, and global interfaces.

Geist describes a clarity/functionality-oriented Sans/Mono family with full glyph assets available through its package/download and an OFL license. It provides stronger heading identity than using Inter alone but creates an additional font/loading/fallback obligation.

Project inference: use Inter Variable for body and operational UI, Geist Sans for headings, and Geist Mono only for technical/identifier roles. Retain an Inter-only fallback decision if the second family fails performance, localization, or visual-regression gates. Use approved locale-specific fallback families such as Noto where coverage requires them.

Sources:

- `https://rsms.me/inter/`
- `https://vercel.com/font`
- `https://ui.shadcn.com/docs/rtl` (font recommendations)

## Icon Findings

Lucide React exposes typed standalone SVG components and is tree-shakeable when icons are directly imported. Lucide React Native provides corresponding native SVG components through `react-native-svg`. The official native docs warn that importing a generic complete icon namespace can significantly increase bundle size. Both are ISC licensed.

This satisfies the provisional icon-source criteria better than introducing a separate web-only family. Selection remains subject to exact version, bundle, missing-concept, cultural-metaphor, RTL, accessibility, and native-rendering evidence.

Sources:

- `https://lucide.dev/guide/react`
- `https://lucide.dev/guide/packages/lucide-react-native`
- `https://ui.shadcn.com/docs/changelog/2024-11-icons`

## Decisions Propagated

- Created `PDA-UX-028` as the canonical shadcn configuration matrix.
- Selected Base UI, Rhea, Neutral, Blue, Geist/Inter, Lucide, Default radius, subtle/default menus, CSS variables, TSX/RSC, RTL, and pointer cursor for the controlled prototype.
- Kept Nova as the fallback style and Inter-only as the fallback typography composition.
- Clarified that shadcn configuration seeds semantic tokens and cannot override density, accessibility, chart, status, white-label, or native rules.
- Updated the source policy, token specification, icon specification, stack/scaffold guidance, lifecycle ledger, section indexes, and mandatory agent lookups.

## Evidence Gaps and Recheck Triggers

- Exact shadcn CLI, Base UI, Lucide, font asset, Tailwind, Next.js, and Storybook lockfiles.
- Encoded and decoded preset generated by the pinned implementation lock.
- Generated component diff and source/provenance inventory.
- Rhea versus Nova vertical-slice usability, density, accessibility, bundle, and visual-regression comparison.
- Geist/Inter versus Inter-only performance and localization comparison.
- Screen-reader, keyboard, zoom, forced-colors, RTL, touch/POS, native icon, chart, and white-label reports.
- License inventory and self-hosted font asset processing.

Recheck when shadcn changes preset schema or style output, Base UI/shadcn publishes a material component change, a chosen font or icon package changes licensing/maturity, the implementation lock changes, or prototype evidence fails a gate.
