---
document_id: PDA-UX-029
title: Preferred Component Catalog
version: 0.6.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0005, ADR-0022]
---

# Preferred Component Catalog

## Purpose

Define how Meridian discovers, evaluates, adopts, adapts, composes, versions, and retires user-interface primitives, components, patterns, blocks, animations, and page compositions.

This catalog prevents agents and contributors from independently selecting visually attractive components that conflict with platform tokens, accessibility, task efficiency, progressive disclosure, offline behavior, performance, white-label requirements, source ownership, or licensing.

It is the mandatory decision point between an external source such as shadcn/ui, shadcn/studio, Magic UI Pro, a Figma library, a registry, or an MCP response and platform-owned implementation under `@meridian/ui-web`.

## Authority and Scope

This document governs component-source selection and preferred implementation patterns. It does not replace:

- `COMPONENT_CATALOG_AND_STATE_MATRIX.md` for required component families and canonical states
- `SHADCN_CONFIGURATION_DECISION_MATRIX.md` for the approved shadcn bootstrap
- `TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md` for source, license, provenance, and normalization rules
- `ADVANCED_INTERFACE_PATTERNS.md` for pattern choice
- `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md` for disclosure rules
- `DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` and `DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md` for visual authority
- `STORYBOOK_AND_VISUAL_REGRESSION_STANDARD.md` for implementation evidence
- `FIRST_SLICE_UX_AND_ACCESSIBILITY.md` for first-slice acceptance
- `COMPONENT_ACQUISITION_POLICY.md` for the detailed, canonical acquisition procedure and per-source rules
- `COMPONENT_NORMALIZATION_STANDARD.md` for the required transformation from external source to owned implementation
- `COMPONENT_ACCEPTANCE_CHECKLIST.md` for the itemized evidence checklist used at promotion

The current source evidence and pattern detail are recorded in:

- COMPONENT_SOURCE_MATRIX.md for the complete official and Studio metadata inventory
- COMPONENT_DISCOVERY_AUDIT.md for source comparison, gaps, and recommendations
- SHADCN_STUDIO_EVALUATION.md for Studio support, license, and acquisition constraints
- ANIMATION_AND_MOTION_GUIDE.md for governed operational and marketing motion
- PROGRESSIVE_DISCLOSURE_PATTERN_LIBRARY.md for pattern choice and domain-specific disclosure

When a preferred candidate conflicts with those documents, the governing specification wins and the candidate must be modified or rejected.

## Catalog Statuses

Every catalog entry uses one status:

- **Needed** — a governed requirement exists, but no candidate has been selected.
- **Researching** — candidate sources are being compared.
- **Preferred Candidate** — best current source for a prototype; not yet platform-approved.
- **Custom Required** — the governed need exists, but external sources cannot own the required behavior; compose an owned solution from accepted primitives.
- **Prototype Approved** — normalized implementation may be used in a bounded prototype.
- **Platform Approved** — owned implementation has passed all required gates and is the default for new work.
- **Restricted** — permitted only for named surfaces or use cases.
- **Deprecated** — existing use may remain during migration; no new use.
- **Rejected** — unsuitable because of architecture, accessibility, licensing, security, performance, interaction, or maintenance concerns.

An MCP result, registry listing, screenshot, generated file, or paid-library entitlement never grants Platform Approved status.

## Source Classes

| Source class | Intended role | Default trust |
|---|---|---|
| Platform-owned component | Canonical reusable implementation | Highest after evidence gates pass |
| shadcn/ui registry | Source-owned primitive and component starting point | Preferred baseline candidate |
| shadcn/studio Pro | Premium component, block, layout, and composition discovery | Candidate source only |
| Magic UI Pro | Marketing animation and presentation acceleration | Restricted candidate source |
| Figma or design library | Design intent and visual specification | Non-executable evidence |
| Third-party registry | Gap-specific candidate | Deny by default pending review |
| AI-generated component | Exploration or prototype | Untrusted until fully reviewed |
| Application-local implementation | One-off need or incubation | Must graduate, remain explicitly local, or be removed |

## Mandatory Agent Workflow

Before creating or importing a reusable UI component, block, page layout, animation, or disclosure pattern, an agent must:

1. Read this catalog and the governing documents listed above.
2. Search `@meridian/ui-web`, Storybook, application-local components, and this catalog for an existing approved solution.
3. State the user task, target roles, surfaces, devices, data density, risk level, and required canonical states.
4. Search approved MCPs or registries only for candidates matching that requirement.
5. Compare at least the platform-owned option, official shadcn/ui option, and premium-source option when each exists.
6. Record source, item identifier, source version, retrieval date, license class, and intended adaptation.
7. Prototype in an isolated branch or story; do not overwrite approved source automatically.
8. Normalize tokens, naming, composition, accessibility, responsive behavior, density, motion, state semantics, and white-label behavior.
9. Run the applicable acceptance gates.
10. Update this catalog entry and provenance record before promoting the implementation.

Agents must not select a block merely because it is described as recommended, popular, modern, beautiful, premium, AI-generated, or available through an MCP.

This list is the summary an agent must not skip. `COMPONENT_ACQUISITION_POLICY.md` is the detailed, canonical procedure — including per-source-class rules and the full provenance record — and is authoritative where the two differ in specifics.

## Evaluation Matrix

Every candidate is scored or dispositioned against these dimensions:

| Dimension | Required question |
|---|---|
| Task fit | Does it make the governed user task faster and clearer? |
| Pattern fit | Is the component or disclosure pattern appropriate for the information and consequence? |
| State completeness | Can it represent loading, empty, no-results, partial, stale, offline, pending, uncertain, denied, unavailable, validation, error, recovery, and success states where applicable? |
| Accessibility | Does it support WCAG 2.2 AA goals, keyboard, visible focus, semantics, screen readers, zoom, touch, reduced motion, and high contrast? |
| Density | Can it support compact, comfortable, and 48-pixel POS/touch variants without hidden interaction loss? |
| Responsiveness | Does it transform safely across containers, mobile, tablet, desktop, kiosk, and large displays? |
| White label | Are brand, surface, type, radius, density, motion, and chart roles expressed through semantic tokens? |
| Offline and degraded operation | Can authority, stale state, queueing, conflict, and recovery be represented honestly? |
| Security and privacy | Does it avoid unsafe HTML, hidden disclosure, secret exposure, misleading permissions, and protected-data leakage? |
| Performance | Does it meet bundle, rendering, interaction, image, animation, and large-data budgets? |
| Source ownership | Can Meridian own, test, update, and remove the resulting source? |
| License and provenance | Is use permitted for the intended entity, products, repositories, deployments, and redistribution model? |
| Maintainability | Does it minimize duplicate primitives, vendor coupling, undocumented conventions, and upgrade burden? |
| Localization | Does it support long text, pluralization, RTL where required, locale formatting, and translation context? |
| Testing | Can it be represented in Storybook and covered by interaction, accessibility, visual, responsive, and performance tests? |

A candidate with a blocking failure in accessibility, licensing, tenant safety, security, authority clarity, or source ownership is rejected regardless of visual quality.

## Preferred Primitive Direction

The governed bootstrap uses source-owned shadcn/ui with Base UI-backed primitives under ADR-0022 and the current shadcn configuration decision matrix.

Preferred primitive families include:

- Button, link, icon button, button group
- Input, textarea, checkbox, radio, switch, slider
- Select, combobox, autocomplete, command menu, multi-select
- Form field, label, description, validation message, error summary
- Dialog, alert dialog, drawer, sheet, popover, tooltip, hover card
- Menu, context menu, navigation menu, tabs, accordion, collapsible
- Table foundation, pagination, toolbar, filter controls, column controls
- Toast, inline alert, banner, status indicator, progress
- Calendar, date picker, date range, time input
- Avatar, badge, card, separator, skeleton, scroll area

Primitive source may change only through a reviewed decision. New work should not mix primitive systems casually within the same interaction family.

## Preferred Shared Components

These are required platform-owned component families. Source selection remains subject to evidence:

### Application shell and navigation

- Responsive application shell
- Workspace and organization switcher
- Global search and command palette
- Sidebar and contextual navigation
- Breadcrumbs and task trail
- Mobile navigation and bottom actions
- Environment, tenant, offline, stale, and support indicators

### Forms and progressive disclosure

- Governed form field and error summary
- Searchable select and multi-select
- Inline create and edit
- Conditional section
- Accordion and collapsible disclosure
- Drawer-based contextual edit
- Review-and-confirm step
- Wizard and resumable setup flow
- Advanced-settings disclosure
- Consequence and approval summary

Progressive disclosure must never hide fees, destructive impact, permission consequences, legal meaning, financial uncertainty, validation failures, or required action.

### Data, operations, and analytics

- Enterprise data grid
- Responsive record list
- Filter builder and saved view
- Bulk-selection scope and bulk-action review
- KPI and metric card
- Accessible chart frame and data-table alternative
- Cross-filter control
- Drill-down and comparison controls
- Timeline, activity feed, and audit view
- Empty, unavailable, stale, partial, and unreconciled data states

### Commerce and POS

- Product search and scanner capture
- Sale-line editor
- Cart and totals summary
- Tender selector and split-tender composition
- Cash denomination input
- Provider-action and uncertainty panel
- Stored-value reservation and redemption
- Receipt preview and delivery choices
- Return, exchange, and refund review
- Register open, close, count, safe drop, deposit, and variance workflows
- Offline queue, lease, conflict, and reconciliation status

### Administration and trust

- User, Party, role, permission, and entitlement views
- Access-scope preview
- Approval queue and decision panel
- Integration and webhook health
- Provider capability and certification status
- Privacy request and deletion-target progress
- Security event and support-access evidence
- Service status and operational-readiness panel

### AI-assisted and explainable actions

- Suggestion and recommendation card with confidence and rationale disclosure
- Inline copilot panel scoped to the current record or workflow
- Draft-to-review handoff (AI proposes, human edits and confirms)
- Autonomy-level indicator matching the canonical ladder in `docs/blueprint/06-AI/AI_PLATFORM_ARCHITECTURE.md`
- Explicit approval control for any action above Inform/Draft autonomy — never an implicit confirm
- Explainability drawer showing inputs, retrieved evidence, and policy basis
- Cost, token, or budget indicator where usage-based limits apply
- Provider or model-degraded and AI-disabled fallback states
- Feedback capture (accept, reject, edit-and-accept) feeding evaluation records

AI-assisted components must never let a mutating action execute above the autonomy level a human explicitly granted, and every essential workflow's non-AI path must remain fully usable when these components are absent or disabled.

### Documentation and marketing

- Documentation shell and search
- API reference presentation
- Feature and capability comparison
- Product demonstration frame using synthetic data
- Accessible hero, feature grid, testimonial, pricing, FAQ, and call-to-action compositions
- Changelog and release-note layout

Marketing components may be more expressive than product components but remain bound by truthfulness, reduced motion, performance, accessibility, provenance, and semantic tokens.

## Animation and Motion Catalog

Motion exists to explain state, relationship, hierarchy, continuity, or feedback. It is not decoration authority.

Preferred motion categories:

- Short state transition
- Disclosure expansion and collapse
- Overlay entry and exit
- Reordering and list continuity
- Progress and completion feedback
- Chart update and drill transition
- Marketing reveal or illustration

Rules:

1. Use tokenized durations and easing.
2. Respect reduced motion with instant or opacity-only alternatives.
3. Never delay a frequent POS, approval, payment, or recovery action for ornament.
4. Avoid continuous animation in operational workspaces.
5. Preserve focus and screen-reader state during animated transitions.
6. Do not animate values or states in a way that implies false precision or confirmed completion.
7. Record animation source and dependencies when imported from premium libraries.
8. Reject effects with disproportionate JavaScript, GPU, battery, layout, or accessibility cost.

Magic UI Pro and shadcn/studio animation blocks are normally Restricted to marketing, onboarding, empty states, demonstrations, and rare explanatory moments unless a product-pattern review approves broader use.

## Block and Page-Composition Rules

A block is a candidate composition, not a reusable platform contract.

Before adopting a block:

- Decompose it into existing primitives and shared components.
- Remove source-specific branding, raw colors, arbitrary spacing, example data, tracking, network calls, and inaccessible semantics.
- Replace generated navigation, forms, charts, tables, and dialogs with platform-owned families where they exist.
- Preserve only the layout or interaction insight that improves the governed task.
- Avoid importing duplicate utilities, primitive libraries, icon packages, form libraries, state systems, or chart dependencies.
- Confirm server/client boundaries, hydration cost, and React/Next.js compatibility.
- Create Storybook stories for the resulting owned components rather than snapshotting the external block as authority.

Whole-block copy is prohibited for financial, privacy, access-control, administrative, POS, offline, and other consequential workflows unless every constituent part passes review.

## MCP and Registry Use

Approved MCPs and registries are discovery and retrieval tools. They are not architecture authorities.

For every MCP-assisted selection:

- Record the MCP or registry name and exact source item.
- Verify current official documentation and source metadata when version or behavior matters.
- Treat generated recommendations as untrusted until reviewed.
- Never provide secrets, license keys, tenant data, customer data, production URLs, or protected repository content unless an approved connector contract explicitly permits it.
- Never allow an MCP to install or overwrite source without reviewing the proposed diff.
- Prefer read/search/list operations before installation.
- Pin reviewed versions and record compatibility lessons in the technology ledger.
- Preserve a non-MCP path for builds, tests, upgrades, and maintenance.

The official shadcn/ui MCP may be used for the official registry and configured registries. shadcn/studio MCP access may be used for licensed candidate discovery through a supported client. Premium access details remain local secrets and are never committed.

## Catalog Entry Template

```markdown
### Component or pattern name

- Status:
- User task:
- Surfaces and roles:
- Risk class:
- Platform family:
- Preferred source:
- Source item and version:
- Alternative candidates:
- Why preferred:
- Required modifications:
- Canonical states:
- Accessibility evidence:
- Responsive and density evidence:
- Offline/degraded behavior:
- Performance evidence:
- License/provenance record:
- Storybook stories:
- Tests:
- Owner:
- Review date:
- Revisit trigger:
```

## Initial Candidate Priorities

The first discovery pass should evaluate candidates for:

1. Application shell and workspace navigation
2. Global search and command palette
3. Form field, error summary, combobox, and multi-select
4. Wizard and review/confirm flow
5. Enterprise table toolbar and responsive list transformation
6. Dashboard metric cards and accessible chart frames
7. POS product search, cart, tender, receipt, and register workflows
8. Offline, stale, pending, conflict, and reconciliation indicators
9. User, Party, role, permission, and entitlement administration
10. Documentation API reference and capability catalog
11. Marketing hero, product demonstration, feature comparison, pricing, FAQ, and changelog
12. Tokenized, reduced-motion disclosure and explanatory animations
13. AI suggestion card, autonomy-level indicator, and approval control

This priority list authorizes research only. It does not authorize installation or adoption.

## Discovery Dispositions

The 2026-07-13 metadata audit found 471 official shadcn registry entries and 61 Studio block families with 146 inspiration variants. The complete names and counting rules are in COMPONENT_SOURCE_MATRIX.md. None is Platform Approved.

A 2026-07-18 delta check found that Studio's public catalog and pinned MCP metadata can move independently: the official component page advertises 58 families, 1,000+ variants, and a new 10-variant Autocomplete family, but the MCP component lookup could not resolve that family while still resolving the known 14-variant Combobox family. Onboarding Feed resolves as 5 MCP variants. AIDesk, Sprintrix, Promptly, and Brandly are advertised on first-party template pages but are not enumerated by the available MCP metadata tools. These items are recorded below as dated candidates, not added to the exhaustive 2026-07-13 MCP counts and not promoted by vendor claims.

### Preferred Candidate

| Family | Preferred source direction | Required normalization |
|---|---|---|
| Buttons, fields, inputs, checkboxes, radio groups, switches, selects, comboboxes | Official shadcn UI | Semantic tokens, canonical states, form errors, touch, zoom, RTL, white label |
| Dialog, alert dialog, drawer, sheet, popover, tooltip | Official shadcn UI | Consequence-based pattern choice, focus, dismissal, mobile transformation, reduced motion |
| Command palette and search interaction | Official Command/Combobox plus Meridian ranking and authority | Tenant and permission filtering, offline/no-results states, result provenance |
| Application shell and dashboard composition | Official Sidebar/Dashboard plus selected Studio Application Shell/dashboard candidates | Meridian navigation, tenant context, landmarks, density, responsive and hydration budgets |
| Account settings, form layout, multi-step form | Official form primitives plus selected Studio compositions | Application contracts, validation, draft/resume, review/confirm, accessibility |
| Optional setup checklist and onboarding feed | Official Accordion/Progress/Form plus Studio Onboarding Feed 01 composition inspiration | Server-authoritative step state, skip/resume/recovery, no coercion, canonical loading/error/offline states, keyboard and announcement behavior |
| Empty, loading, error, and unavailable states | Official Empty/Skeleton/Alert plus Studio Empty State inspiration | Canonical state language, recovery, announcements, offline and uncertainty semantics |
| Ordinary operational charts and KPIs | Official chart/Recharts plus selected Studio visual inspiration | Governed metric IDs, source/freshness, text/table alternative, token and point budgets |

Preferred Candidate authorizes a bounded normalization prototype only.

### Researching

| Candidate | Research value | Boundary before promotion |
|---|---|---|
| Studio Autocomplete 10 | Visual comparison for product, Party, location, and global-search inputs | The pinned MCP cannot currently resolve the family. Keep official/owned Command and Combobox as the baseline; require a supported-client item review plus async cancellation, tenant/permission filtering, large-data, offline/degraded, keyboard, focus, and screen-reader evidence. |
| Studio Onboarding Feed 02, 03, and 04 | Multi-step setup, progress/dialog, and readiness-history composition ideas | Review `@stepperize/react` before dependency adoption; completion and chronology remain application/audit authority, not local component state. Dialog actions require explicit consequence, cancellation, and recovery. |
| AIDesk template | Inbox, support, contact, and knowledge-surface composition reference | No whole-template acquisition and no reuse of its authentication, ticket, contact, AI-agent, or role semantics. |
| Sprintrix template | Saved views, filters, board, roadmap, and activity composition reference | No whole-template acquisition and no reuse of project-domain, team, security, billing, integration, or authorization behavior. |

Researching authorizes metadata and visual analysis only. It does not authorize source retrieval, installation, dependency addition, or implementation.

### Custom Required

| Platform component or workflow | Why external blocks are insufficient |
|---|---|
| Enterprise data grid and responsive record view | Bulk scope, server operations, virtualization, permissions, audit, export, density, offline, and accessible alternatives |
| POS product picker, scanner, cart, tender, split payment, cash, receipt, return, and register | High-volume device workflow, financial consequence, offline leases, idempotency, provider uncertainty, and deterministic first-slice operation |
| Tenant/organization switcher and tenant administration | Current authority, role, unsaved work, offline state, and safe boundary transition |
| Party/entity picker | Tenant scope, canonical Party linkage, permissions, search authority, duplicate handling, and offline behavior |
| Permission matrix, role editor, entitlement visibility, and access-scope preview | Permissions and entitlements remain separate; grants require scope and consequence evidence |
| Inventory adjustment, count, transfer, barcode, receiving, and reconciliation | Ledger, reversal, units, location, scanner ambiguity, conflicts, queueing, and evidence |
| Provider uncertainty, payment reconciliation, retry, duplicate-risk, and diagnostics | External sources do not model pending/unknown authority and safe recovery |
| Offline queue, sync, conflict, tombstone, and reconciliation | Requires explicit leases, versions, idempotency, authority, and recovery |
| Audit, activity, event, diff, and provenance viewers | Immutability, chronology, redaction, correlation, incomplete evidence, and protected access |
| Accounting/financial review and reversal/compensation | Money, currency, classification, source references, audit, and non-destructive correction |
| AI sidebar, provenance, approval, citations, autonomy controls, and deterministic fallback | AI must use normal commands and cannot redefine tool authority or essential workflow behavior |

Custom Required means compose Meridian-owned behavior from accepted primitives, not duplicate the primitive foundation.

### Restricted

- Studio marketing, authentication-page, Bento, timeline, portfolio, and eCommerce families.
- Whole Studio templates, including Promptly and Brandly; AIDesk and Sprintrix remain visual research references only, not installable application foundations.
- Studio Onboarding Feed 05 while it carries a `motion` dependency and unrelated privacy/billing demonstration semantics.
- Official whole-page authentication, sidebar, dashboard, and chart blocks when used as more than composition evidence.
- DataTable candidates when presented as an enterprise-grid solution.
- Carousels, pie/radar/radial charts, novelty visualization, and decorative or continuous motion.
- Any premium, generated, or third-party candidate before item-level provenance and license review.

Restricted items may be used only for a named marketing, deferred storefront, onboarding, demonstration, or low-risk research surface.

### Rejected

- External theme entries replacing Meridian semantic tokens.
- Alternative font entries outside the governed Inter/Geist decision.
- Registry-internal artifacts as product contracts.
- Whole-block adoption for financial, access-control, privacy, tenant, POS, offline, inventory, audit, or AI-authority workflows.
- Candidate source with unclear redistribution rights, inaccessible critical path, secret requirement in source, unsafe network behavior, or hidden business authority.
- Motion that pressures a purchase or approval, implies success early, or is required to understand a task.

## Promotion Gates

A candidate reaches Platform Approved only when:

- Source and license provenance are recorded.
- Platform-owned source has no prohibited dependency or network behavior.
- Semantic tokens replace raw visual values.
- Required canonical states are implemented.
- Keyboard, focus, semantics, screen reader, zoom, contrast, touch, motion, and high-contrast evidence pass.
- Responsive, compact, comfortable, POS/touch, dark, and white-label variants pass where applicable.
- Performance and bundle impact remain within approved budgets.
- Storybook stories, interaction tests, accessibility checks, and visual baselines exist.
- Security and privacy review passes for consequential surfaces.
- Offline and degraded behavior is honest where relevant.
- Upgrade, deprecation, fallback, and removal ownership are named.

`COMPONENT_ACCEPTANCE_CHECKLIST.md` is the itemized, checkable version of these gates and is the record of evidence used at promotion.

## Change and Retirement

- Material catalog decisions increment this document version.
- Source-library upgrades do not automatically upgrade platform-owned components.
- A preferred source may be replaced without changing the public component API when evidence supports it.
- Deprecated components receive migration guidance and a removal trigger.
- Rejected candidates remain recorded when their rejection prevents repeated investigation.
- Application-local variants are periodically reviewed for promotion, consolidation, or deletion.

## Prohibited Behavior

Agents and contributors must not:

- Install a component or block directly into production source because an MCP recommended it.
- Treat premium status as quality, accessibility, security, or license proof.
- create duplicate platform primitives without a recorded gap.
- Introduce a second primitive, form, icon, chart, table, animation, or styling system without a decision.
- Commit license keys, authenticated registry URLs, private download links, invoices, account cookies, or prohibited source.
- Preserve example analytics, testimonials, customer names, financial values, or claims as if they were real.
- Hide consequential information behind progressive disclosure.
- Use animation as the only indication of state.
- Bypass Storybook, accessibility, performance, provenance, or visual-regression gates.
- Let generated source redefine capability, permission, entitlement, payment, privacy, or domain semantics.

## Remaining Implementation Work

- Rotate the previously exposed Studio credential before any authenticated item-level work.
- Re-run selected Studio item review in a vendor-supported client; Codex metadata interoperability is not vendor support.
- Run a supported-client, item-level review for the named Autocomplete and Onboarding Feed candidates before retrieving source; preserve the official/owned fallback when the MCP cannot resolve a public catalog item.
- Add a machine-readable candidate inventory only when an implementation consumer and freshness validator are defined.
- Implement Storybook and the first platform-owned primitive set.
- Prototype the strongest Preferred Candidates and the first Custom Required operational composites.
- Add automated checks for raw palette values, prohibited dependencies, provenance, and stale candidate records.
- Connect approved components to design-token generation and visual-regression evidence.
