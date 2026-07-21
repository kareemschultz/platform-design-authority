---
document_id: PDA-UX-001
title: UX and Design System Section Index
version: 1.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# UX and Design System

## Artifact Catalog

- [First Slice UX and Accessibility](FIRST_SLICE_UX_AND_ACCESSIBILITY.md) — `PDA-UX-010` · Draft
- [Advanced Interface Patterns](ADVANCED_INTERFACE_PATTERNS.md) — `PDA-UX-011` · Draft
- [Dashboard and Data Visualization](DASHBOARD_AND_DATA_VISUALIZATION.md) — `PDA-UX-012` · Draft
- [Forms Selection and Multiselect](FORMS_SELECTION_AND_MULTISELECT.md) — `PDA-UX-013` · Draft
- [Progressive Disclosure and Complexity Management](PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md) — `PDA-UX-014` · Superseded (see PDA-UX-037)
- [Design Tokens and Visual System](DESIGN_TOKENS_AND_VISUAL_SYSTEM.md) — `PDA-UX-015` · Draft
- [Design System Operations](DESIGN_SYSTEM_OPERATIONS.md) — `PDA-UX-016` · Draft
- [Component Catalog and State Matrix](COMPONENT_CATALOG_AND_STATE_MATRIX.md) — `PDA-UX-017` · Draft
- [Content Design Localization and Motion](CONTENT_DESIGN_LOCALIZATION_AND_MOTION.md) — `PDA-UX-018` · Draft
- [Enterprise Table and Data Grid Standard](ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md) — `PDA-UX-019` · Draft
- [Navigation Command Palette and Global Search](NAVIGATION_COMMAND_PALETTE_AND_GLOBAL_SEARCH.md) — `PDA-UX-020` · Draft
- [Interactive Analytics and Visualization](INTERACTIVE_ANALYTICS_AND_VISUALIZATION.md) — `PDA-UX-021` · Draft
- [Tailwind shadcn and Premium UI Source Policy](TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md) — `PDA-UX-022` · Draft
- [Design Token Values and Breakpoints](DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md) — `PDA-UX-023` · Draft
- [Marketing Website Architecture](MARKETING_WEBSITE_ARCHITECTURE.md) — `PDA-UX-024` · Draft
- [Storybook and Visual Regression Standard](STORYBOOK_AND_VISUAL_REGRESSION_STANDARD.md) — `PDA-UX-025` · Draft
- [Iconography Terminology and Product Content](ICONOGRAPHY_TERMINOLOGY_AND_PRODUCT_CONTENT.md) — `PDA-UX-026` · Draft
- [First Slice Tender Scope Clarification](FIRST_SLICE_TENDER_SCOPE_CLARIFICATION.md) — `PDA-UX-027` · Draft
- [shadcn Configuration Decision Matrix](SHADCN_CONFIGURATION_DECISION_MATRIX.md) — `PDA-UX-028` · Draft
- [Preferred Component Catalog](PREFERRED_COMPONENT_CATALOG.md) — `PDA-UX-029` · Draft
- [Component Acquisition Policy](COMPONENT_ACQUISITION_POLICY.md) — `PDA-UX-030` · Draft
- [Component Normalization Standard](COMPONENT_NORMALIZATION_STANDARD.md) — `PDA-UX-031` · Draft
- [Component Acceptance Checklist](COMPONENT_ACCEPTANCE_CHECKLIST.md) — `PDA-UX-032` · Draft
- [Component Source Matrix](COMPONENT_SOURCE_MATRIX.md) — `PDA-UX-033` · Draft
- [Component Discovery Audit](COMPONENT_DISCOVERY_AUDIT.md) — `PDA-UX-034` · Draft
- [Shadcn Studio Evaluation](SHADCN_STUDIO_EVALUATION.md) — `PDA-UX-035` · Draft
- [Animation and Motion Guide](ANIMATION_AND_MOTION_GUIDE.md) — `PDA-UX-036` · Draft
- [Progressive Disclosure Pattern Library](PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md) — `PDA-UX-037` · Draft
- [WS1 Thin Application Shell Implementation Evidence](WS1_THIN_APPLICATION_SHELL_IMPLEMENTATION_EVIDENCE.md) — `PDA-UX-038` · Draft
- [Component Intake Fast Path](COMPONENT_INTAKE_FAST_PATH.md) — `PDA-UX-040` · Draft

## Related Authority

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
- Preferred external-source candidates must pass acquisition, normalization, and acceptance gates before platform adoption
- MCPs and registries are discovery tools, never design-system authority

## Component Source Governance

Before importing, generating, adapting, or promoting reusable UI, contributors and agents must:

1. Consult `PREFERRED_COMPONENT_CATALOG.md`.
2. Follow `COMPONENT_ACQUISITION_POLICY.md`.
3. Normalize resulting source under `COMPONENT_NORMALIZATION_STANDARD.md`.
4. Complete the applicable gates in `COMPONENT_ACCEPTANCE_CHECKLIST.md`.
5. Record provenance, Storybook evidence, tests, owner, and revisit trigger.

Paid access, MCP availability, visual quality, or source popularity never grants Platform Approved status.

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
- Item-level authenticated Studio source, dependency, entitlement, and license evidence for any selected candidate after credential rotation

The design system makes common work fast without hiding financial, privacy, security, accessibility, offline, or regulated consequences.
