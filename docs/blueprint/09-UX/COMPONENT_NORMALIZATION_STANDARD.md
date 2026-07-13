---
document_id: PDA-UX-031
title: Component Normalization Standard
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0005, ADR-0022]
---

# Component Normalization Standard

## Purpose

Define the mandatory transformation from an external component, block, layout, animation, registry item, or AI-generated candidate into Meridian-owned, testable, upgradeable UI source.

Normalization is not cosmetic cleanup. It establishes platform ownership and removes accidental architecture.

This document is referenced by step 7 of `COMPONENT_ACQUISITION_POLICY.md`'s acquisition workflow; `PREFERRED_COMPONENT_CATALOG.md` remains the authority for whether and when a component is acquired at all.

## Required Outcome

A normalized component:

- Uses Meridian names and package boundaries
- Uses semantic design tokens
- Uses the approved primitive system
- Implements canonical states
- Meets accessibility and responsive requirements
- Preserves authority, security, privacy, offline, and uncertainty semantics
- Has no hidden external runtime dependency
- Has explicit Storybook and test evidence
- Can be maintained without the originating MCP or premium service

## Source Decomposition

Before adoption:

1. Identify primitives, shared components, page composition, example data, utilities, effects, assets, and external calls.
2. Replace external primitives with approved Meridian primitives where they exist.
3. Keep only layout or interaction ideas that improve the governed task.
4. Remove duplicate utilities, state libraries, icon libraries, form libraries, chart libraries, and styling systems.
5. Remove source branding, sample copy, fake testimonials, analytics, trackers, remote fonts, and unapproved assets.
6. Separate server and client boundaries deliberately.
7. Move business rules, permissions, entitlement checks, and data access out of the component.

## Naming and Ownership

- Reusable platform components live under the approved `@meridian/ui-web` family.
- Domain-specific compositions remain with their owning domain until a justified shared abstraction exists.
- Application-local components must be marked as local and must not masquerade as platform standards.
- External vendor or block names do not become public component APIs.
- Props use task and domain language rather than source-library terminology.

## Token Normalization

Replace raw visual values with governed semantic tokens for:

- Color and surface
- Text and icon roles
- Spacing
- Radius
- Elevation
- Typography
- Motion duration and easing
- Focus
- Density
- Breakpoints and container behavior
- Chart and status roles

Raw colors or arbitrary values require a documented exception. Brand tokens cannot redefine security, financial, warning, success, offline, or uncertainty meanings.

## Primitive Normalization

Use the approved shadcn/Base UI-backed primitive direction unless a reviewed decision permits otherwise.

Do not mix primitive systems inside one interaction family merely because an imported block includes another library. Replace external dialogs, menus, popovers, tooltips, tabs, accordions, and form controls with approved equivalents where feasible.

## State Normalization

Every applicable component represents the canonical states defined by the component state matrix, including:

- Loading
- Empty
- No results
- Partial
- Stale
- Offline
- Pending
- Uncertain
- Permission denied
- Entitlement unavailable
- Validation error
- Recoverable failure
- Irrecoverable failure
- Success
- Suspended or restricted

A visually polished happy path is not a normalized component.

## Accessibility Normalization

At minimum:

- Prefer native semantics
- Define accessible name, role, state, value, and description
- Preserve logical keyboard order
- Provide visible and unobscured focus
- Restore focus after overlays
- Support zoom, reflow, text scaling, reduced motion, high contrast, and forced colors where applicable
- Meet approved touch-target requirements
- Avoid color-only or motion-only meaning
- Announce validation, pending, offline, uncertain, and completion states appropriately
- Provide structured alternatives for charts and complex visualizations

Imported ARIA is not presumed correct. Review it against the resulting interaction.

## Progressive Disclosure Normalization

Disclosure may reduce cognitive load but must not hide:

- Fees or amounts
- Destructive impact
- Permission or entitlement consequences
- Legal or contractual meaning
- Financial or provider uncertainty
- Required validation or recovery action
- Privacy or data-sharing consequences
- Approval requirements

Errors inside collapsed content must surface at the parent and link to the affected field or section.

## Responsive and Density Normalization

Define behavior for:

- Narrow mobile
- Standard mobile
- Tablet
- Small desktop
- Standard desktop
- Wide desktop
- Kiosk or POS
- Container-constrained embedding

Support compact, comfortable, and POS/touch density only where the task warrants them. Compact visual height must not reduce the effective accessible target below policy.

## White-Label Normalization

- All brandable appearance uses semantic roles.
- Customer branding cannot remove focus, contrast, status meaning, legal identity, support identity, or security indicators.
- Source logos, gradients, fonts, illustrations, and trademarks are removed unless explicitly licensed and approved.
- Components must survive light, dark, high-contrast, and representative tenant themes.

## Motion and Animation Normalization

Motion must explain state, hierarchy, continuity, or feedback.

- Use tokenized durations and easing.
- Respect reduced motion.
- Do not delay frequent operational actions.
- Avoid continuous animation in product workspaces.
- Preserve focus and screen-reader state.
- Do not animate completion before authoritative confirmation.
- Measure JavaScript, layout, paint, GPU, battery, and interaction cost.

Marketing animation remains isolated from critical operational bundles where practical.

## Security and Privacy Normalization

Remove or reject:

- Unsafe HTML insertion
- Undeclared remote content
- Hidden telemetry or tracking
- Client-exposed secrets
- Untrusted script execution
- Unscoped file upload or URL rendering
- Permission assumptions
- Tenant or protected-data leakage through suggestions, counts, previews, or errors

Consequential actions use ordinary application commands, permissions, entitlements, approvals, audit, idempotency, and compensation.

## Performance Normalization

Record:

- Client/server boundary
- Bundle impact
- Dependencies added
- Hydration requirement
- Rendering and interaction behavior
- Image and font impact
- Large-list or large-data behavior
- Animation and chart cost

Prefer composition of existing owned components over importing a complete new dependency graph.

## Documentation and Evidence

A normalized reusable component includes:

- Public API and usage guidance
- Canonical states
- Accessibility notes
- Responsive and density behavior
- White-label notes
- Offline/degraded behavior where applicable
- Storybook stories
- Interaction tests
- Accessibility checks
- Visual regression
- Source provenance
- Upgrade and retirement notes

## Completion Rule

A candidate is not normalized until the external source can disappear and Meridian can still build, test, document, maintain, and migrate the resulting component from repository-owned evidence.