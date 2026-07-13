---
document_id: PDA-UX-030
title: Component Acquisition Policy
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
related_adrs: [ADR-0005, ADR-0022]
---

# Component Acquisition Policy

## Purpose

Define how Meridian discovers, evaluates, imports, adapts, approves, versions, and retires user-interface primitives, components, blocks, page compositions, and animation assets from official shadcn/ui, shadcn/studio Pro, Magic UI Pro, Figma, third-party registries, MCP servers, and AI generation.

External libraries and MCPs are discovery and retrieval sources. They are never design authority.

## Governing Principle

Premium UI assets may accelerate implementation but are never authoritative. Every imported component must be normalized to Meridian design tokens, accessibility standards, interaction patterns, security requirements, performance budgets, responsive behavior, offline-state semantics, and white-label architecture before becoming part of the platform.

## Source Priority

Use this order unless a documented exception is approved:

1. Existing Platform Approved component in `@meridian/ui`
2. Existing application-local component suitable for graduation
3. Official shadcn/ui source-owned primitive or composition
4. shadcn/studio Pro candidate
5. Magic UI Pro candidate for restricted expressive surfaces
6. Reviewed third-party registry item
7. AI-generated implementation
8. Fully custom implementation

The order controls investigation, not automatic selection. Task fit and acceptance evidence decide the outcome.

## Official shadcn/ui MCP

The official shadcn/ui MCP is the canonical registry interface for official shadcn components and configured registries.

Agents may use it to:

- Search and inspect official components
- Compare variants and dependencies
- Retrieve installation commands or candidate source
- Inspect configured registries
- Identify changes in current official APIs

Agents must not:

- Use an unreviewed `latest` selector in committed automation
- Install over Platform Approved source without a reviewed diff
- Add a second primitive, icon, form, chart, or state library casually
- Treat registry popularity as approval

The exact reviewed CLI and MCP version must be recorded in the technology lifecycle ledger.

## shadcn/studio Pro MCP

shadcn/studio Pro is a licensed candidate source for premium components, blocks, layouts, page compositions, animations, and design exploration.

Use it primarily for:

- Application shells and settings layouts
- Dashboard and analytics compositions
- Form, wizard, onboarding, and progressive-disclosure candidates
- Documentation and marketing compositions
- Empty-state, demonstration, and explanatory motion candidates

It must not be treated as the source of authoritative business workflows. POS, payments, permissions, privacy, offline, stored-value, inventory, and administrative workflows require decomposition into Meridian-owned components and contracts.

License keys, access tokens, account cookies, private registry URLs, invoices, and restricted source bundles are local secrets and must never be committed.

## Magic UI Pro

Magic UI Pro is normally restricted to marketing, onboarding, product demonstration, empty states, and rare explanatory moments.

Continuous decorative animation, large client-side effects, or animation in frequent operational work is rejected unless a measured task benefit justifies it.

## Acquisition Workflow

For every reusable candidate:

1. Define the user task, roles, surfaces, devices, risk class, density, and canonical states.
2. Search the Preferred Component Catalog and existing source.
3. Compare platform-owned, official shadcn/ui, premium, and custom options where applicable.
4. Record exact source, item identifier, version, retrieval date, license class, dependencies, and intended modifications.
5. Retrieve or prototype only in an isolated branch, story, or throwaway workspace.
6. Review the diff before installation or overwrite.
7. Normalize under `COMPONENT_NORMALIZATION_STANDARD.md`.
8. Evaluate under `COMPONENT_ACCEPTANCE_CHECKLIST.md`.
9. Add Storybook stories and tests.
10. Update the Preferred Component Catalog and provenance record.
11. Promote only after required evidence passes.

## Prohibited Acquisition Patterns

- Blindly copying a complete premium page into a consequential workflow
- Committing secrets or private premium endpoints
- Depending on an MCP during build, test, deployment, or runtime
- Importing hidden analytics, tracking, fonts, network calls, or example services
- Keeping source-library branding or sample business data
- Installing duplicate primitive systems
- Allowing generated code to bypass permissions, entitlements, audit, or domain contracts
- Selecting a component because it is visually impressive without task evidence
- Hiding fees, destructive consequences, uncertainty, validation, permissions, or legal meaning through progressive disclosure

## Provenance Record

Every externally sourced reusable implementation records:

- Source and item identifier
- Source version and retrieval date
- License owner and permitted use
- Repository path
- Dependencies introduced
- Components replaced or composed
- Material modifications
- Accessibility review
- Token and white-label normalization
- Security and privacy review
- Performance and bundle impact
- Storybook and regression evidence
- Owner, review date, and revisit trigger

Use `registry/premium-ui-provenance-template.json` or its approved successor. Sensitive commercial evidence remains outside the public repository.

## Upgrade and Retirement

Source upgrades are treated as new candidate evaluations. Meridian does not automatically resync owned source with an external registry.

A component may be deprecated or removed when:

- A Platform Approved replacement exists
- Accessibility or security cannot be corrected
- Licensing changes
- Maintenance or bundle cost exceeds its task value
- The underlying pattern is no longer appropriate
- The source cannot support required states or deployment targets

Retirement includes migration guidance, compatibility notes, catalog status, and source removal criteria.

## Agent Instruction

Before importing or creating reusable UI, agents must read:

- `PREFERRED_COMPONENT_CATALOG.md`
- `COMPONENT_NORMALIZATION_STANDARD.md`
- `COMPONENT_ACCEPTANCE_CHECKLIST.md`
- `TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `COMPONENT_CATALOG_AND_STATE_MATRIX.md`

If no approved component exists, agents may propose candidates but may not silently establish a new platform pattern.