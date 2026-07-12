---
document_id: PDA-UX-015
title: Design Tokens and Visual System
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Design Tokens and Visual System

## Purpose

Define the constrained visual language that makes the platform coherent, accessible, white-label capable, and visually quiet across web, Expo, native controls, documents, dashboards, and partner experiences.

## Principle: Invisible Consistency

The interface should feel predictable rather than decorated. Users should notice the business state and next action, not arbitrary shadows, border colors, spacing, or typography.

## Token Layers

### Primitive Tokens

Raw values such as neutral scales, spacing units, type sizes, radii, shadows, and motion durations.

### Semantic Tokens

Purpose-based values such as:

- `surface.default`
- `surface.raised`
- `text.primary`
- `text.muted`
- `border.subtle`
- `action.primary`
- `status.critical`
- `focus.ring`

Product code should use semantic tokens rather than raw palette values.

### Component Tokens

Rarely used overrides for a specific component contract, such as table row height or dialog width.

### Brand Tokens

Approved customer or partner values mapped into semantic roles. Brand tokens cannot change state meaning, accessibility requirements, or security indicators.

## Spacing

Use a small documented scale. Suggested starting primitives:

`0, 2, 4, 8, 12, 16, 24, 32, 48, 64`

Choose by relationship:

- Tight: elements within one control
- Related: label, input, helper, and error
- Group: fields or records in one section
- Section: distinct tasks or information groups
- Page: major layout regions

Do not introduce one-off values without a documented component need.

## Typography

Define a limited hierarchy:

- Display or page title
- Section heading
- Subsection heading
- Body
- Compact body
- Label
- Caption or metadata
- Monospace for identifiers and technical values

Typography communicates hierarchy through size, weight, spacing, and placement. Avoid using many near-identical font sizes.

Requirements:

- Text scales with user settings.
- Line height supports scanning.
- Tabular numerals are available for financial and operational columns.
- Uppercase is limited and never used for long text.
- Brand fonts require performance, character-set, fallback, and accessibility review.

The provisional web composition uses Geist Sans for headings and Inter Variable for body/UI text, with Geist Mono limited to identifiers and technical content. Inter-only is the fallback if the second family fails performance, glyph, localization, or layout-stability gates. Locale-specific approved fallbacks such as Noto fill unsupported scripts. See `SHADCN_CONFIGURATION_DECISION_MATRIX.md`.

## Color

Color has semantic roles, not arbitrary ownership by components.

- Neutral surfaces carry most of the interface.
- Brand color identifies primary actions and selected states within accessibility limits.
- Status colors are stable across all brands.
- Destructive, warning, success, informational, pending, offline, and disabled states use color plus text, icon, or pattern.
- Charts use an accessible categorical and sequential palette distinct from UI status colors.
- Dark mode and high contrast are token transformations, not manual component restyling.

## Shape and Elevation

- Use a small radius scale.
- Elevation communicates layering and focus, not decoration.
- Borders often provide clearer structure than shadows in dense enterprise UI.
- Modals, popovers, menus, and drawers use consistent elevation and overlay behavior.
- Cards are used only when grouping needs a visible boundary; do not wrap every section in a card.

## Motion

Motion explains change, hierarchy, or continuity.

- Use a small duration and easing scale.
- Respect reduced-motion preferences.
- Avoid animation that delays frequent work.
- Do not animate financial completion before authoritative success.
- Preserve spatial continuity when opening drawers, expanding sections, or reordering items.
- Loading indicators should reflect real progress where known.

## Grid and Alignment

- Use consistent content widths and gutters.
- Align labels, values, actions, and table columns to visible or invisible grid lines.
- Maintain strong vertical rhythm.
- Use proximity to express relationship.
- Avoid centering dense operational content by default.
- Right-align comparable numeric data and align decimals where practical.

## CRAP Review

Every screen is reviewed for:

- Contrast: importance and state are distinguishable.
- Repetition: patterns, labels, actions, and status treatments are consistent.
- Alignment: elements share intentional grid lines.
- Proximity: related content is closer than unrelated content.

## White Label

Brand configuration may change:

- Logo and approved imagery
- Brand colors within semantic mapping
- Typography from an approved set
- Radius or density profile within supported bounds
- Communication and document styling

Brand configuration may not:

- Reduce contrast below policy
- Reassign destructive or success meanings
- Hide focus indicators
- Remove security or legal identity
- Change workflow logic
- Introduce arbitrary CSS or scripts by default
- Make one customer experience unmaintainably unique

## Density Modes

Support comfortable and compact density where the component and device allow it. Density changes spacing and control size within accessible minimums; it does not remove labels, evidence, or states.

POS and touch workflows may use larger targets while accounting and inventory tables use compact density.

The selected Rhea shadcn style is only the generated component geometry baseline. It does not redefine the token scale or reduce minimum targets. Owned compact, comfortable, and touch/POS variants remain authoritative.

## Token Governance

A token change requires:

- Reason and affected semantic role
- Web, native, document, chart, dark-mode, and high-contrast impact
- Screenshot or visual-regression evidence
- Accessibility validation
- White-label compatibility
- Migration plan for deprecated tokens

No product feature should add a raw brand color or spacing value directly to application code.

## Quality Gates

- Token linting
- Visual regression tests
- Contrast and focus checks
- Dark and high-contrast modes
- Text scaling
- White-label theme validation
- Web and native parity review
- Print and generated-document review where relevant
- Performance and font-loading checks
