---
document_id: PDA-UX-001
title: UX and Design System Section Index
version: 0.8.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# UX and Design System

## Current Specifications

- `FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `FIRST_SLICE_TENDER_SCOPE_CLARIFICATION.md`
- `ADVANCED_INTERFACE_PATTERNS.md`
- `DASHBOARD_AND_DATA_VISUALIZATION.md`
- `INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md`
- `FORMS_SELECTION_AND_MULTISELECT.md`
- `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md`
- `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md`
- `DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md`
- `DESIGN_SYSTEM_OPERATIONS.md`
- `COMPONENT_CATALOG_AND_STATE_MATRIX.md`
- `PREFERRED_COMPONENT_CATALOG.md`
- `CONTENT_DESIGN_LOCALIZATION_AND_MOTION.md`
- `ICONOGRAPHY_TERMINOLOGY_AND_PRODUCT_CONTENT.md`
- `ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`
- `NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md`
- `STORYBOOK_AND_VISUAL_REGRESSION_STANDARD.md`
- `TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`
- `SHADCN_CONFIGURATION_DECISION_MATRIX.md`
- `MARKETING_WEBSITE_ARCHITECTURE.md`
- `docs/blueprint/10-Data/SEARCH_AND_COMMAND_RANKING_POLICY.md`
- `docs/blueprint/20-Strategy/DESIGN_HANDBOOK.md`
- `docs/blueprint/20-Strategy/PLATFORM_EXPERIENCE_INDEX.md`
- `docs/blueprint/03-Business-Engines/BUSINESS_DNA_ENGINE.md`

## Implementation Direction

- Latest approved stable Tailwind CSS
- Source-owned shadcn/ui components
- Recharts through shadcn chart composition for ordinary operational visualizations
- Specialized visualization libraries only for justified requirements
- Magic UI Pro and shadcn/studio premium sources under the premium UI policy
- Platform semantic tokens in `registry/design-tokens.json`
- Storybook or equivalent component workbench with visual regression
- Preferred external-source candidates must pass the catalog workflow before platform adoption

## Project Agent Skills

Project-local skills cover frontend architecture, UI-pattern audit, dashboard design, form and wizard design, formal accessibility review, Vercel v0 handoff, specification authoring, ADR authoring, consistency audit, capability registration, and review disposition.

## Remaining Implementation Evidence

- Web and native component packages
- Storybook implementation and baselines
- Exact icon-package lock and bundle/native-parity evidence for the provisional Lucide selection
- Automated token generation and contrast reports
- POS, kiosk, scanner, and device implementation examples
- Accessibility conformance reports
- Business DNA onboarding prototype
- Measured Platform Experience Index and competitor benchmarks
- Private premium-source license inventory
- Authenticated shadcn/studio candidate inventory and evaluated preferred sources

The design system makes common work fast without hiding financial, privacy, security, accessibility, offline, or regulated consequences.
