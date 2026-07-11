---
document_id: PDA-UX-023
title: Design Token Values and Breakpoints
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Design Token Values and Breakpoints

## Purpose

Define provisional normative values for the first web and native design-system implementation. These values operationalize `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` and are represented machine-readably in `registry/design-tokens.json`.

Values are pre-implementation defaults and may change through design-system governance after usability, accessibility, performance, and white-label testing.

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

Task rules take precedence over breakpoint labels. A drawer may become a full page earlier than `md`; a table may become a focused list based on content width.

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

The exact hexadecimal values are maintained in `registry/design-tokens.json` and must pass contrast and color-vision review against their intended background.

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
