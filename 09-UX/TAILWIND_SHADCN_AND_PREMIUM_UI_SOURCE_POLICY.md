---
document_id: PDA-UX-022
title: Tailwind shadcn and Premium UI Source Policy
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# Tailwind, shadcn/ui, and Premium UI Source Policy

## Purpose

Define the approved web UI foundation and the rules for using open-source and paid component libraries, blocks, pages, animation kits, templates, and design assets.

## Decision

The primary web UI foundation is:

- Latest approved stable Tailwind CSS release, pinned and tested through the dependency-governance process
- shadcn/ui source-owned components and registries
- Base UI-backed shadcn primitives as the default for new components; Radix remains supported for existing proven components and explicit fallbacks
- Recharts for the initial operational chart family through the shadcn chart composition layer
- Platform-owned semantic design tokens, component contracts, accessibility behavior, and tests

This is a source-ownership model. Components are copied into and maintained by the platform rather than consumed as an opaque vendor design system.

## Why This Fits the Platform

- Tailwind provides explicit responsive and state utilities without forcing a visual product identity.
- shadcn/ui provides accessible-oriented source primitives that can be adapted into the platform design system.
- Source ownership supports white label, self-hosting, long-term maintenance, and AI-assisted development.
- Recharts supports the initial line, area, bar, scatter, pie-restricted, tooltip, legend, and responsive chart needs while remaining replaceable for specialized visualizations.

## Approved Sources

### Open and Public Sources

- Tailwind CSS official packages and documentation
- shadcn/ui official registry and component source
- Adopted primitive libraries and their official packages
- Recharts official packages and documentation
- Other libraries accepted through dependency and license review

## Base UI and Radix Policy

Base UI 1.6.0 was stable and shadcn/ui made it the default for new projects as of 2026-07-12. New platform components therefore prefer the Base UI-backed shadcn source path. This is not an instruction to rewrite working Radix components.

- Pin `registry:base` or the equivalent primitive selection in automated scaffolds.
- Use `@base-ui/react` directly only for a justified primitive gap.
- Do not mix Base UI and Radix within one owned component.
- Treat composition API differences such as Base UI `render` and Radix `asChild` as behavioral migrations, not mechanical renames.
- `@fumadocs/base-ui` belongs to the documentation portal and must not become the product business-component package.
- Uber Base Web (`baseui`) is a separate styled/Styletron system and is not approved for the platform foundation.

### Licensed Premium Sources

The founder has access to paid premium materials including:

- Magic UI Pro
- shadcn/studio premium blocks, pages, components, and animations

These may be used only within the purchased license terms and for the entities, repositories, products, users, or customer work permitted by those terms.

The repository must not store account credentials, download tokens, private registry secrets, invoices, license keys, or proprietary source bundles when redistribution is not permitted.

## Intended Use by Surface

### Core Authenticated Product

Prefer stable platform-owned primitives and interaction patterns. Premium source may accelerate composition, but every imported element must be simplified and governed for:

- Accessibility
- Dense operational work
- Mobile and offline behavior
- Performance
- Tenant and permission state
- White-label themes
- Long-term maintenance

Avoid marketing-style animation and visual spectacle in frequent transactional workflows.

### Marketing Website

Magic UI Pro and shadcn/studio premium assets are especially appropriate for:

- Hero sections
- Product storytelling
- Feature demonstrations
- Customer proof and metrics
- Animated diagrams
- Integrations and ecosystem showcases
- Pricing and edition pages
- Launch pages
- Interactive product previews

Marketing animation must respect reduced motion, loading performance, accessibility, content clarity, and truthful product maturity.

### Portals and Onboarding

Premium page and form blocks may be used for customer portal, partner portal, setup, onboarding, and Business DNA flows when they satisfy the same product standards.

## Import Workflow

Every premium or external UI import follows this sequence:

1. Record source library, product, version, retrieval date, purchaser or license owner, and intended use.
2. Confirm license and redistribution rights.
3. Copy only the required source files.
4. Remove unused dependencies, demo data, analytics, external scripts, and hard-coded links.
5. Replace raw colors, fonts, spacing, radius, shadow, z-index, and animation values with platform tokens.
6. Replace library-specific business assumptions with platform component contracts.
7. Validate keyboard, screen-reader, zoom, contrast, touch, mobile, RTL, dark mode, and reduced motion.
8. Add loading, empty, error, stale, offline, pending, denied, and unentitled states where applicable.
9. Add unit, interaction, accessibility, visual-regression, and responsive tests.
10. Record local modifications and whether future vendor updates will be merged or ignored.

## Component Ownership

After import, the platform owns maintenance of the copied component within the license terms.

Each component receives:

- Platform name and purpose
- Source attribution in internal provenance records where required
- Semantic token mapping
- Accessibility contract
- State matrix
- Responsive behavior
- Test coverage
- Owning package
- Deprecation and migration policy

Do not retain a generic vendor block name as the product abstraction when a platform-specific responsibility exists.

## Tailwind Rules

- Use semantic CSS variables and Tailwind utilities.
- Avoid arbitrary values when a governed token exists.
- Use responsive variants based on content and task behavior, not device stereotypes alone.
- Container-aware behavior is preferred for reusable components where supported and justified.
- Utility composition should remain readable; extract stable repeated patterns into owned components or variants.
- Do not encode permission, entitlement, or business logic in CSS class selection.

## shadcn/ui Rules

- Use the official component source as a starting point.
- Preserve accessible semantics from underlying primitives.
- Do not assume the default visual style is the platform design system.
- Normalize components into the platform package structure and tokens.
- Keep component APIs narrow and behaviorally documented.
- Avoid uncontrolled registry imports directly into production branches.
- Review upstream changes deliberately rather than auto-overwriting local components.

## Chart Rules

The shadcn chart composition uses Recharts. Platform chart components should expose governed business and visual contracts without hiding the necessary Recharts capabilities.

Requirements:

- Responsive measurable container
- Semantic chart tokens
- Accessible text and table alternative
- Keyboard-accessible inspection or equivalent
- Metric, unit, currency, time, freshness, and source context
- Drill, filter, comparison, export, and live-update behavior only when justified
- No chart-specific business calculation in the client

A specialized library may be introduced for maps, graph networks, high-density canvas rendering, advanced statistical plots, or other needs that Recharts cannot serve cleanly. Such adoption requires dependency, accessibility, performance, and portability review.

## Animation Rules

Animation may:

- Explain hierarchy or state transition
- Preserve spatial continuity
- Demonstrate product behavior on the marketing site
- Draw attention to a meaningful one-time event

Animation must not:

- Delay frequent tasks
- Imply financial or external success before confirmation
- Hide data or controls
- Ignore reduced-motion preferences
- Cause large layout shifts
- Consume disproportionate battery, CPU, or network
- Turn an operational dashboard into decorative motion

## Security and Privacy

Imported components must be inspected for:

- External network calls
- Third-party analytics
- Unsafe HTML rendering
- Untrusted URL handling
- Form and file-upload behavior
- Clipboard access
- Browser storage
- Secret or token placeholders
- Dependency vulnerabilities
- Tracking pixels

Demo data containing real customer or personal data is prohibited.

## License Inventory

Maintain an internal inventory with:

- Source
- License type
- Purchaser or owning entity
- Permitted products and seats
- Redistribution restrictions
- Renewal or access conditions
- Imported paths
- Attribution requirements
- Review date

The license inventory may remain private even when architectural policy is public.

## Quality Gate

No external or premium block is approved because it looks polished. It is approved only after it meets the same architecture, accessibility, responsive, security, performance, white-label, state, and testing requirements as a component authored internally.
