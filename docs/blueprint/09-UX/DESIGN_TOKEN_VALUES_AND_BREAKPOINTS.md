---
document_id: PDA-UX-023
title: Design Token Values and Breakpoints
version: 0.2.3
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Design Token Values and Breakpoints

## Purpose

Define provisional normative values for the first web and native design-system implementation. These values operationalize `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` and are represented machine-readably in `registry/design-tokens.json`.

Values are pre-implementation defaults and may change through design-system governance after usability, accessibility, performance, and white-label testing.

## Scope relative to Design Tokens and Visual System

`DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` (PDA-UX-015) owns the token roles and the principles behind them; it does not carry current values. This document owns the values themselves — read it for what a token role is currently set to, not for why the role exists.

## Token Format

The machine-readable registry follows the Design Tokens Community Group draft shape:

- `$type`
- `$value`
- `$description`

Application code consumes generated semantic CSS variables and native token modules rather than reading the JSON dynamically at runtime.

## Spacing

| Token | Value |
|---|---:|
| `space.0` | 0 px |
| `space.0_5` | 2 px |
| `space.1` | 4 px |
| `space.2` | 8 px |
| `space.3` | 12 px |
| `space.4` | 16 px |
| `space.6` | 24 px |
| `space.8` | 32 px |
| `space.12` | 48 px |
| `space.16` | 64 px |

## Typography

Provisional families:

| Role | Family | Fallback |
|---|---|---|
| Body, label, input, table, menu | Inter Variable | Approved locale-specific Noto family, then system sans-serif |
| Display and headings | Geist Sans | Inter Variable, approved locale-specific Noto family, then system sans-serif |
| Code and identifiers | Geist Mono | Approved locale-specific mono, then system monospace |

Use tabular numerals for comparative operational and financial columns. Font assets are self-hosted/subset where licensing permits and must not block text rendering. Inter-only is the approved performance/localization fallback.

| Role | Size | Line height | Weight |
|---|---:|---:|---:|
| Display | 32 px | 40 px | 700 |
| Page title | 24 px | 32 px | 700 |
| Section heading | 20 px | 28 px | 650 |
| Subsection heading | 16 px | 24 px | 650 |
| Body | 14 px | 21 px | 400 |
| Compact body | 13 px | 18 px | 400 |
| Label | 13 px | 18 px | 600 |
| Caption | 12 px | 16 px | 400 |
| Code/identifier | 13 px | 20 px | 500 |

Text must scale with user and browser settings. Fixed values are defaults, not caps.

## Radius

The shadcn `default` radius input maps into this governed scale. Generated component radius values do not become a parallel token system.

| Token | Value |
|---|---:|
| `radius.none` | 0 px |
| `radius.sm` | 4 px |
| `radius.md` | 8 px |
| `radius.lg` | 12 px |
| `radius.xl` | 16 px |
| `radius.full` | 9999 px |

## Elevation

| Token | Intended use |
|---|---|
| `elevation.0` | Flat operational surface |
| `elevation.1` | Raised card or toolbar |
| `elevation.2` | Popover or menu |
| `elevation.3` | Drawer or dialog |

Dense operational screens prefer borders and surface contrast over decorative shadows.

## Motion

| Token | Value |
|---|---:|
| `motion.instant` | 0 ms |
| `motion.fast` | 100 ms |
| `motion.normal` | 180 ms |
| `motion.slow` | 280 ms |
| `motion.deliberate` | 400 ms maximum for rare transitions |

Reduced motion changes nonessential movement to instant or opacity-only transitions. Frequent POS actions should normally complete without ornamental animation.

## Breakpoints

The web shell begins with Tailwind-compatible viewport breakpoints:

| Token | Minimum width |
|---|---:|
| `screen.sm` | 640 px |
| `screen.md` | 768 px |
| `screen.lg` | 1024 px |
| `screen.xl` | 1280 px |
| `screen.2xl` | 1536 px |

Reusable components should use container-aware behavior when their layout depends on the available component width rather than the whole viewport.

Task rules take precedence over breakpoint labels. A drawer may become a full page earlier than the medium breakpoint; a table may become a focused list based on content width.

## Touch Targets

- General minimum target: 24 × 24 CSS px, matching the WCAG 2.2 minimum-target baseline and spacing exceptions.
- Preferred product target: 40 × 40 CSS px.
- POS and frequent touch target: 48 × 48 CSS px minimum.
- Adjacent compact targets require adequate spacing and a tested keyboard alternative.

## Focus

- Visible focus-ring width: 2 px minimum.
- Focus-ring offset: 2 px where the surface permits.
- Focus must remain visible at 200% zoom and in high-contrast modes.
- White-label themes cannot remove or reduce focus visibility.

## Contrast

Minimum targets:

- Normal text: 4.5:1
- Large text: 3:1
- User-interface components and meaningful graphics: 3:1
- Disabled content may be exempt from text contrast but cannot be the sole way to communicate a required state.

Product design should exceed minimum ratios where low-quality displays, outdoor use, POS glare, or older users are expected.

## Semantic Color Roles

The initial semantic roles are:

- `surface.canvas`
- `surface.default`
- `surface.raised`
- `surface.subtle`
- `text.primary`
- `text.secondary`
- `text.muted`
- `text.inverse`
- `border.default`
- `border.strong`
- `action.primary`
- `action.primary-hover`
- `focus.ring`
- `status.info`
- `status.success`
- `status.warning`
- `status.critical`
- `status.pending`
- `status.offline`

The registry provides provisional light and dark values. Brand colors map into approved action and accent roles; they do not redefine status colors.

## Density

### Comfortable

- Standard input height: 40 px
- Standard table row: 44 px
- POS touch row: 52 px or greater

### Compact

- Standard input height: 32 px
- Standard table row: 32–36 px
- Minimum interactive target remains accessible through padding, row actions, or expanded hit area.

## Z-Index Layers

| Layer | Value |
|---|---:|
| Base content | 0 |
| Sticky content | 10 |
| Header and navigation | 20 |
| Popover and menu | 40 |
| Drawer overlay | 50 |
| Dialog overlay | 60 |
| Critical system interruption | 70 |

Arbitrary z-index values are prohibited outside a reviewed component need.

## Dark Mode

Dark mode is a semantic token mapping. It must:

- Preserve state and action meanings
- Meet the same contrast requirements
- Avoid pure black for every surface by default
- Preserve visible borders and focus
- Revalidate charts and data-series differentiation
- Avoid increasing glow or shadow decoration

## Chart Palette

The first chart palette defines eight categorical roles plus sequential and diverging scales. Every chart also uses labels, patterns, shapes, or direct annotation so color is not the only carrier of meaning.

The provisional exact values are maintained under `color.chart.*` in `registry/design-tokens.json`. Categorical roles are ordered rather than semantic status colors. Sequential and diverging scales are evaluation starting points. Every use must pass contrast, adjacent-series, dark-mode, monochrome, and common color-vision-deficiency review; labels or patterns remain mandatory.

Registry-backed groups are `space`, `radius`, `motion`, `screen`, `size`, and `color`. Typography, elevation, and z-index remain governed prose until a cross-platform machine representation is approved.

## Governance

- Raw application colors are prohibited when a semantic token exists.
- Premium components are remapped to these tokens.
- Token changes require web, native, document, chart, dark-mode, high-contrast, and white-label review.
- Breaking semantic changes follow design-system versioning and migration policy.

## Quality Gates

- JSON schema validation
- CSS-variable and native-module generation
- Contrast automation and manual review
- Visual regression
- 200% and 400% zoom
- High-contrast mode
- Dark mode
- Reduced motion
- Text scaling
- Touch and POS target measurement

## Recorded prototype drift (fifth-audit F-H-003)

The shipped theme (`packages/ui-web/core/src/styles/globals.css`) resolves the non-status semantic aliases (`--surface-*`, `--action-primary*`, `--text-*`, `--focus-ring`, borders) to the governed shadcn preset values, which differ from this registry's draft values; only the `status-*` roles are registry-synchronized. This is a deliberate controlled-prototype mapping — the governed preset wins until this token registry leaves draft. When it does, either reconcile the CSS aliases to registry values or re-record the exception here; a white-label or contrast change applied only to the registry does not reach the product until then.

### Recorded Non-Status Alias Exceptions

Second-review closure for F-H-003: `scripts/validate_docs.py`'s `validate_design_token_alias_exceptions()` parses every alias between the `BEGIN non-status semantic aliases` / `END non-status semantic aliases` markers in `globals.css`'s `:root` block and fails the gate unless each one either (a) has an exact same-name key under `tokens.color.light` in `registry/design-tokens.json` (value drift is the already-recorded prototype behavior above, name presence is what this assertion checks), or (b) is listed in this table. `action-primary`, `surface-canvas`, `text-muted`, and `focus-ring` satisfy (a) by name. The three below have no same-name registry key at all and are recorded here under (b):

| CSS alias | Nearest registry key | Reason |
|---|---|---|
| `--action-primary-foreground` | none (`registry/design-tokens.json` has `action-primary-hover`, no foreground variant) | The registry has not yet defined an on-`action-primary` text-contrast token; the shadcn preset's `--primary-foreground` is the controlled-prototype stand-in. |
| `--surface-panel` | none (`registry/design-tokens.json` has `surface-default`/`surface-raised`/`surface-subtle`, no `panel`) | No registry surface tier maps directly to the shadcn `--card` role used for panel/dialog surfaces; reconcile naming when the registry leaves draft. |
| `--text-default` | none (`registry/design-tokens.json` has `text-primary`, not `text-default`) | Naming divergence only; the shadcn `--foreground` role is the controlled-prototype stand-in for the registry's `text-primary`. |
