---
document_id: PDA-UX-001
title: UX and Design System Section Index
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# UX and Design System

## Current Specifications

- `FIRST_SLICE_UX_AND_ACCESSIBILITY.md` — personas, role workspaces, POS, tenders, returns, stored value, offline states, WCAG 2.2 AA target, mobile, and usability measures
- `ADVANCED_INTERFACE_PATTERNS.md` — tabs, tab menus, dialogs, drawers, popovers, menus, steppers, wizards, bulk actions, and state contracts
- `DASHBOARD_AND_DATA_VISUALIZATION.md` — data-driven shape, information weight, KPI hierarchy, charts, tables, filters, drill-downs, and alerts
- `FORMS_SELECTION_AND_MULTISELECT.md` — form architecture, comboboxes, multi-selects, hierarchy, repeatable sections, bulk forms, validation, and offline behavior
- `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md` — disclosure layers, discoverability, role adaptation, data density, expert shortcuts, and onboarding
- `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` — semantic tokens, spacing, typography, color, motion, alignment, density, CRAP review, and white-label constraints
- `../00-Foundation/UX_PHILOSOPHY.md` — platform-wide experience principles
- `../03-Business-Engines/BRANDING_AND_THEME_ENGINE.md` — themes and white-label presentation
- `../03-Business-Engines/WORKSPACE_AND_NAVIGATION_ENGINE.md` — task-focused workspaces and navigation composition
- `../03-Business-Engines/DASHBOARD_AND_WIDGET_ENGINE.md` — dashboard composition
- `../02-Architecture/TANSTACK_DECISION_MATRIX.md` — headless table, virtualization, form, and routing decisions
- `../02-Architecture/BETTER_T_STACK_AND_CLIENT_ARCHITECTURE.md` — web, Expo, Expo UI, and shared design-system architecture

## Project Agent Skills

The repository includes project-local skills under `.claude/skills/` for frontend architecture, UI-pattern audits, dashboard design, form and wizard design, accessibility review, and Vercel v0 handoff. See `../07-Developer-Platform/PROJECT_AGENT_SKILLS.md`.

## Planned Depth

- Experience architecture and workspace composition schema
- Web and native component APIs
- Enterprise table and data-grid implementation standard
- Command palette and global navigation specification
- Mobile, tablet, kiosk, POS, scanner, and desktop pattern catalog
- Accessibility conformance evidence and assistive-technology test plans
- White-label anti-phishing and custom-domain experience rules
- Onboarding and Business DNA configuration
- Platform Experience Index and competitive workflow benchmarks
- Content, terminology, localization, and motion standards
- Visual regression and token linting automation

The design system must make common work fast without hiding controls required for exceptional, financial, privacy-sensitive, and regulated cases. Branding cannot weaken accessibility, state meaning, or security semantics.
