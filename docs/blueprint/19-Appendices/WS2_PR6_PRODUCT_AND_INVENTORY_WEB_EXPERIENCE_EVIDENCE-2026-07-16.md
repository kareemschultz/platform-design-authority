---
document_id: PDA-APP-025
title: WS2 PR6 Product and Inventory Web Experience Evidence
version: 0.1.0
status: Draft
owner: Frontend Platform
last_reviewed: 2026-07-16
related_adrs: [ADR-0005, ADR-0016, ADR-0020, ADR-0022]
---

# WS2 PR6 Product and Inventory Web Experience Evidence

## Evidence boundary

This Draft record covers issue #72 at controlled-prototype depth. It records only reproduced Product, Inventory, and bounded-import web behavior over generated clients and current server authority. It does not establish WCAG 2.2 AA conformance, pilot or production readiness, production tenant-isolation defense in depth, native or broad offline execution, contractual service levels, or WS2/first-slice completion. RR-007 and RR-009 remain open. PR7 retains the 14-capability by 13-dimension closeout, scenarios 2 and 8, recovery/capacity evidence, and WS2 exit. Exact-head independent concurrence and merge remain required.

The implemented UI is deterministic with AI disabled. It never treats navigation visibility, cached queries, a balance projection, imported CSV content, Better Auth fields, or browser state as current permission, entitlement, tenant, version, or owner-state authority.

## Governing sources

| Concern | Source |
|---|---|
| WS2 scope and exit | PDA-RDM-009; issue #72 |
| Catalog and Inventory behavior | PDA-DOM-002; PDA-DOM-003; canonical OpenAPI |
| Information architecture and interaction | PDA-UX-001; PDA-UX-002; PDA-UX-003; PDA-UX-009; PDA-UX-018 |
| Accessibility target | PDA-UX-005; WCAG 2.2 AA target |
| Frontend architecture | ADR-0005; ADR-0020; PDA-ENGR-003; PDA-ENGR-004 |
| Offline/degraded boundary | PDA-UX-007; ADR-0022 |
| Product help | PDA-DEV-010; stable help ID `PDA-DOC-001` |

## Route and workflow inventory

| Area | Implemented route family | Current behavior |
|---|---|---|
| Operations | `/operations` | Two-level workspace entry with visible server-validated tenant, organization, and optional location context |
| Products | `/operations/products`, `/new`, `/{productId}` | Cursor list; text, exact SKU, exact barcode, and state filters; create; selected-field edit; activation; archive confirmation; version-conflict recovery |
| Balances | `/operations/inventory/balances` | Location-scoped cursor projection with source, timestamp, stale/unreconciled label, and explicit non-authority copy |
| Adjustments | `/operations/inventory/adjustments`, `/new`, `/{adjustmentId}` | Create; independent approval/posting; immutable reversal/compensation; activity evidence |
| Counts | `/operations/inventory/counts`, `/new`, `/{countId}` | Create blind Count; durable scanner/keyboard draft observations; submit; independent atomic approve/post; expected/variance disclosure only after posting |
| Transfers | `/operations/inventory/transfers`, `/new`, `/{transferId}` | Create; dispatch; partial/final/exception receipt; correction handoff; stable line identity |
| Imports | `/operations/imports`, `/new`, `/{target}/{importId}` | Bounded UTF-8 upload; dry-run findings; lifecycle/reconciliation; approve/cancel/accept; correction report; separately confirmed purge |

## Frontend and contract architecture proof

- `PlatformApiClient` is derived from the composed published contract, including the WS2 Catalog and Inventory surface. The web application imports the generated client type and never imports the server router.
- Every protected request supplies the current server-issued active-context ID. Mutations additionally carry idempotency and version preconditions where the command requires them.
- Context changes cancel and remove incompatible Catalog/Inventory queries and remount context-bound interactive state. They do not mint or broaden authority.
- Product exact-SKU lookup, Product state filtering, balance pagination, activity metadata, and durable Count draft-line save are published through OpenAPI, oRPC, generated TypeScript contracts, router bindings, and permission parity.
- Count draft editing intentionally reuses `inventory.count.create`; the internal receipt operation is `inventory.count.draft.save`. This does not introduce a second permission ID.
- Transfer receiver metadata represents the latest receiving action. The current model does not fabricate a full receipt-history actor list. Count has no separate `submittedAt`, so the UI does not invent one.
- Repository and application tenant predicates remain mandatory after transport authorization. Foreign and nonexistent identifiers retain the same non-disclosing response behavior.

## Workflow evidence

| Workflow | Safety and usability evidence |
|---|---|
| Product | Stable aggregate/child IDs remain visible; Identifierless Variants are supported; exact SKU is distinct from text search; archive is a confirmed lifecycle transition, never deletion; stale versions preserve the proposed edit for deliberate recovery. |
| Balance | Location is mandatory; pagination is bounded; projection source, timestamp, freshness, reconciliation, unit, reserved, on-hand, and available quantities are visible without presenting the projection as write authority. |
| Adjustment | Maker/checker identity is visible; approve/post and reverse are consequential confirmations; reversal links a compensating movement and never edits the original ledger fact. |
| Count | Each observation persists through the Inventory draft API and reloads from owner state; standard scanner keyboard input works without a device-specific SDK; blind expected values remain hidden until posting; approval/posting is one atomic command. |
| Transfer | Dispatch and receipt transitions are explicit; partial receipt preserves the remaining amount; exception is terminal and points to a compensating Adjustment rather than mutation. |
| Import | The browser validates bounded UTF-8 bytes and computes SHA-256 but never builds an authoritative CSV dataset. Server findings and lifecycle remain reloadable; temporary correction-report object URLs are always revoked. Opening-stock approval creates ledger facts only through the governed confirmed server command. |

## Formal UI-pattern disposition

The `ui-pattern-audit` review selects a small Operations workspace rather than a dashboard maze. Product and workflow lists use semantic tables at larger widths and task summaries at small widths; forms use native labels and bounded field groups; consequential state changes use alert dialogs; long-running import state uses a reloadable detail view rather than transient toast-only feedback. Persistent navigation remains at two levels.

| Pattern question | Disposition |
|---|---|
| Can users identify current scope? | Concur at prototype depth: the shell displays current organization and optional location; operations state is keyed and invalidated by active context. |
| Is navigation bounded and predictable? | Concur subject to exact-head browser verification: one primary Operations entry and one section navigation; URL filters/cursors preserve shareable state and safe internal return targets. |
| Are projections and authority distinguishable? | Concur: balance freshness/reconciliation and command revalidation language are visible and not color-only. |
| Are irreversible/consequential actions deliberate? | Concur after confirmation and safe-default-focus checks for archive, reversal, count posting, dispatch/receipt, import commit, and purge. |
| Are offline and failure states honest? | Concur at seam depth: mutation controls are online-only; stale cached presentation does not authorize a command; permission, entitlement, reauthentication, step-up, approval, validation, conflict, and network outcomes remain distinct. |

## Accessibility review disposition

The target is WCAG 2.2 AA; no conformance claim is made. Automated checks can detect only a subset of defects and are paired with keyboard, reflow, semantics, focus, forced-colors, reduced-motion, touch-target, and manual assistive-technology review requirements.

| Criterion/theme | Implemented or executable evidence | Remaining uncertainty |
|---|---|---|
| 1.3.1 structure and relationships | Landmarks, headings, labelled forms, fieldsets, semantic table/list transformations, descriptions and terms | Exact-head authenticated screen-reader reading order remains a manual review item |
| 1.4.3 / 1.4.11 contrast | Semantic governed tokens and automated axe evaluation on evaluated routes | Manual high-contrast/forced-colors inspection remains required before any conformance claim |
| 1.4.10 reflow | Desktop and 390-by-844 Chromium lanes; mobile section selector/list transformations; no required horizontal-only workflow | 400% desktop-equivalent manual review retained |
| 2.1.1 keyboard | Native controls, skip link, external-scanner keyboard form, dialog operation, visible focus | Full authenticated workflow keyboard walk must pass at exact head |
| 2.4.3 / 2.4.7 focus | Skip link, route focus manager, safe dialog focus, scanner refocus after durable save | Query-only pagination focus/announcement requires exact-head verification |
| 2.5.8 target size | Governed minimum-height controls and mobile workflow actions | Representative device/manual measurement retained |
| 3.3.1 / 3.3.3 errors | Adjacent validation, safe error summary/classification, preserved conflict input, corrective guidance | Server correlation-reference presentation is verified only for supported error shapes |
| 4.1.2 name, role, value | Native inputs/selects, platform-owned Base UI primitives, one current navigation item | Browser/accessibility-tree and assistive-technology evidence remains bounded to evaluated routes |

## Responsive, theme, white-label, and motion evidence

- Layouts use semantic tokens and platform-owned `@meridian/ui-web` primitives; no raw tenant-visible codename, premium source, provider identity, or palette shortcut is introduced.
- Dense data transforms to stacked task summaries on small screens; essential navigation and controls remain reachable without horizontal-only interaction.
- Theme behavior inherits the governed light/dark/system shell. Status and projection state include text, not color alone.
- No workflow depends on animation. Existing motion follows the governed reduced-motion surface; no new chart or specialized visualization dependency is introduced.
- Ordinary responsive behavior is CSS/native layout. No user-agent-specific authority or business rule exists.

## Product help and adoption evidence

`apps/docs/content/docs/inventory/index.mdx` is the stable `PDA-DOC-001` controlled-prototype guide. It records prerequisites, exact permissions, permission-versus-entitlement outcomes, Product lifecycle, projection freshness, reversal/compensation, count maker/checker flow, transfer exceptions, import retention, conflict recovery, offline limits, and prototype exclusions. The docs schema validates the ID format and a new content check rejects duplicate stable IDs. Troubleshooting and prototype release notes are reconciled so they no longer claim Catalog/Inventory are absent.

## Executable verification recorded before exact-head review

| Lane | Reproduced result |
|---|---|
| Generated contract/API closure | Targeted contract, domain, router, and application tests: 65 passed; OpenAPI, permission, and generated-client parity clean |
| Live Catalog/Inventory PostgreSQL | 25 passed with paged balances, Count draft persistence/idempotency, exact SKU/state filtering, tenant non-disclosure, and activity metadata |
| Web unit/type/format | 23 tests / 64 expectations; TypeScript and affected-file Biome checks clean before final UX integration |
| Product documentation | `check-content`, Fumadocs generation, TypeScript, and Biome clean; one stable documentation ID |
| Public browser baseline | Desktop/mobile login keyboard, skip-link, reflow, and axe checks reproduced locally; protected/authenticated full-stack lane remains an exact-head exit condition |

Final exact-head repository checks, authenticated browser counts, bundle/build measures, direct-API denial tests, CI links, and independent-review disposition are added only after they are reproduced on the review head.

## Residual risks and PR7 handoff

- Automated axe results are not WCAG conformance and do not replace screen-reader, zoom/reflow, forced-colors, device, or qualified accessibility review.
- RLS, penetration testing, production roles, external provider evidence, production observability/SLOs, and RR-007/RR-009 remain open.
- Browser support evidence is Chromium at controlled-prototype depth. Broader compatibility and native workflow evidence are not claimed.
- Product edit covers selected aggregate fields; richer Variant/Identifier administration remains at the depth assigned by PDA-RDM-009 and PDA-DOM-002.
- Transfer actor metadata is latest-action evidence, not an exhaustive receipt-history representation.
- PR7 owns the complete 14-capability by 13-dimension evidence matrix, scenarios 2 and 8, whole-workstream security/recovery/capacity evidence, risk/roadmap/program propagation, and final WS2 controlled-prototype disposition.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-16 | Frontend Platform | Recorded the initial PR6 controlled-prototype route, architecture, workflow, UI-pattern, accessibility-target, responsive, help, executable-evidence, and residual-risk disposition. |
