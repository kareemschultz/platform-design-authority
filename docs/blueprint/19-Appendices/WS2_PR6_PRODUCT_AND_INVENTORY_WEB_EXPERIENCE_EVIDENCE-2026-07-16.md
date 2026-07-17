---
document_id: PDA-APP-025
title: WS2 PR6 Product and Inventory Web Experience Evidence
version: 0.9.0
status: Draft
owner: Frontend Platform
last_reviewed: 2026-07-17
related_adrs: [ADR-0005, ADR-0016, ADR-0020, ADR-0022]
---

# WS2 PR6 Product and Inventory Web Experience Evidence

## Evidence boundary

This Draft record covers merged issue #72 / PR #78 at controlled-prototype depth. It records only reproduced Product, Inventory, and bounded-import web behavior over generated clients and current server authority. Claude Code independently concurred at exact head `c69e5fb4415083affc40dc52f2d0ada78846252e` in PR #78 comment `4998183817`; PR #78 merged as `635fa3f1618d5c880585fdd3e86de7a16d0993ac`. This does not establish WCAG 2.2 AA conformance, pilot or production readiness, production tenant-isolation defense in depth, native or broad offline execution, contractual service levels, or WS2/first-slice completion. RR-007 and RR-009 remain open. PR7 retains the registry-derived capability/dimension closeout, scenario-boundary reconciliation, recovery/capacity evidence, and WS2 exit.

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
- Browser authentication and oRPC calls use same-origin `/api/auth` and `/rpc` paths. Next rewrites those paths to the private API address; only server execution reads `PLATFORM_API_INTERNAL_URL`. This prevents cross-host cookie loss without exposing the Compose service name to the browser bundle.
- Every protected request supplies the current server-issued active-context ID. Mutations additionally carry idempotency and version preconditions where the command requires them.
- Context changes cancel and remove incompatible Catalog/Inventory queries and remount context-bound interactive state. They do not mint or broaden authority.
- A failed latest context activation refetches the cancelled active queries for the still-current workspace; a stale failed request cannot revive queries after a newer activation starts.
- Create and receipt idempotency keys are bound to canonical command intent plus current context. They survive double-submit, uncertain response loss, and receipt-dialog dismissal after a settled ambiguous failure; rotate when material intent changes; and clear only after authoritative success.
- Product exact-SKU lookup, Product state filtering, balance pagination, activity metadata, and durable Count draft-line save are published through OpenAPI, oRPC, generated TypeScript contracts, router bindings, and permission parity.
- Exact SKU lookup trims surrounding whitespace, rejects an empty exact filter at the contract, domain, and persistence-adapter boundaries, and uses the same tenant-identifier normalization as creation, so valid separators are preserved without degrading into an unfiltered list. Stock-balance cursors use a closed, versioned structural owner cursor inside the opaque public token, including for contract-valid units containing control delimiters; malformed, future-version, or extra-field envelopes fail with the same non-disclosing reference error.
- The HTTP shell allows the governed `PUT` and `If-Match` precondition required by durable Count draft-line saves. CORS tests prove the method/header are allowed without widening origins or the header allowlist.
- Count draft editing intentionally reuses `inventory.count.create`; the internal receipt operation is `inventory.count.draft.save`. This does not introduce a second permission ID.
- Transfer receiver metadata represents the latest receiving action. The current model does not fabricate a full receipt-history actor list. Count has no separate `submittedAt`, so the UI does not invent one.
- Repository and application tenant predicates remain mandatory after transport authorization. Foreign and nonexistent identifiers retain the same non-disclosing response behavior.

## Workflow evidence

| Workflow | Safety and usability evidence |
|---|---|
| Product | Stable aggregate/child IDs remain visible; Identifierless Variants are supported; exact SKU is distinct from text search and preserves tenant separators; archive is a confirmed lifecycle transition, never deletion; stale versions preserve the proposed edit for deliberate recovery. |
| Balance | Location is mandatory; pagination is bounded; projection source, timestamp, freshness, reconciliation, unit, reserved, on-hand, and available quantities are visible without presenting the projection as write authority. |
| Adjustment | Maker/checker identity is visible; approve/post and reverse are consequential confirmations; reversal links a compensating movement and never edits the original ledger fact. |
| Count | Each observation persists through the Inventory draft API and reloads from owner state; standard scanner keyboard input works without a device-specific SDK; blind expected values remain hidden until posting; approval/posting is one atomic command. |
| Transfer | Dispatch and receipt transitions are explicit; partial receipt preserves the remaining amount and advances selection to an outstanding line; exception is terminal and points to a compensating Adjustment rather than mutation. |
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

### PR7 exact-stack accessibility and pattern re-audit

PR7 extended the real-authentication Compose lane across Product import review, blind Count capture/submission, balances, Adjustments, Transfers, browser history, and an explicit permission-denied state on desktop and mobile. The first live run found two substantive defects rather than converting the existing review prose into a pass:

| Finding | Severity | Correction | Executable verification |
|---|---:|---|---|
| Destructive denial text and default Sonner description/action colors fell below the WCAG AA text-contrast target | High | Darkened the owned destructive semantic token and supplied explicit owned Sonner foreground/action classes; removed the incompatible rich-color shortcut | axe A/AA and visual contrast checks are clean on the denial route in both desktop and mobile projects |
| Opaque Count, location, and Product identifiers widened the mobile document | High | Added intentional wrapping to the shared page title and Count/location/Product identifier surfaces | The mobile Count workflow passes the document-width reflow assertion after five durable observations and submission |

The full Playwright regression passes **20/20** against the rebuilt web/server/PostgreSQL stack. Seven closeout scenarios run in both desktop and mobile projects (fourteen closeout executions) and verify:

- a Product import reaches `ReadyForApproval`, exposes the maker/checker boundary in a keyboard-operated dialog, and preserves detail/list browser history;
- a blind Count persists five scanner-style Enter submissions, returns focus to Product input after each authoritative rerender, hides expected quantities before posting, reaches `Submitted`, and exposes the self-approval boundary;
- balance filtering clears both cursor and cursor trail while Back/Forward preserves intentional URL state;
- balance, Adjustment, and Transfer routes expose headings, landmarks, current context, projection/non-authority semantics, responsive transformation, reflow, and clean automated axe A/AA results; and
- Product Barcode entry and exact lookup preserve keyboard focus, numeric input semantics, responsive reflow, and clean automated axe A/AA results;
- Product activation and archive controls fail closed on the offline detail route, including the consequential archive dialog; and
- a permission-limited operator receives a distinct non-disclosing denial without leaking the permission identifier.

The Count interaction samples measure Enter through the real HTTP command, durable owner update, authoritative rerender, and Product-input refocus: desktop `n=5`, median `86.16 ms`, maximum `92.59 ms`; mobile `n=5`, median `83.32 ms`, maximum `133.14 ms`; zero failures. Both are below the governed 5-second median target. This is automated Chromium/scanner-keyboard evidence, not representative-user task-time or assistive-technology conformance.

## Responsive, theme, white-label, and motion evidence

- Layouts use semantic tokens and platform-owned `@meridian/ui-web` primitives; no raw tenant-visible codename, premium source, provider identity, or palette shortcut is introduced.
- Dense data transforms to stacked task summaries on small screens; essential navigation and controls remain reachable without horizontal-only interaction.
- Theme behavior inherits the governed light/dark/system shell. Status and projection state include text, not color alone.
- No workflow depends on animation. Existing motion follows the governed reduced-motion surface; no new chart or specialized visualization dependency is introduced.
- Ordinary responsive behavior is CSS/native layout. No user-agent-specific authority or business rule exists.

## Product help and adoption evidence

`apps/docs/content/docs/inventory/index.mdx` is the stable `PDA-DOC-001` controlled-prototype guide. It records prerequisites, exact permissions, permission-versus-entitlement outcomes, Product lifecycle, projection freshness, reversal/compensation, count maker/checker flow, transfer exceptions, import retention, conflict recovery, offline limits, and prototype exclusions. The docs schema validates the ID format and a new content check rejects duplicate stable IDs. Troubleshooting and prototype release notes are reconciled so they no longer claim Catalog/Inventory are absent.

## Production-build and bundle evidence

An optimized Next.js 16.2.10 build succeeds with all 13 new Operations route patterns. The emitted `.next/static` comparison uses a clean detached `main` worktree at `9e66939a901fe664b2d2655dc258fddf88ffd3a8` and the PR6 branch after consequential-UX and same-origin-proxy remediation, both with `NEXT_PUBLIC_SERVER_URL=http://localhost:3000`; the PR build additionally supplies the private server-only API address required by its rewrite topology.

| Measure | Merged-main baseline | PR6 measured state | Change |
|---|---:|---:|---:|
| Static files | 46 | 62 | +16 |
| Total emitted static bytes | 1,883,011 | 2,227,100 | +344,089 (18.27%) |
| JavaScript bytes | 1,427,096 | 1,768,223 | +341,127 (23.90%) |
| CSS bytes | 64,632 | 67,594 | +2,962 (4.58%) |

These are uncompressed build-artifact totals, not per-route transferred bytes or a contractual performance budget. The comparison prevents an unmeasured “thin UI” claim; route-level transfer, field-device latency, production cache behavior, and capacity/SLO evidence remain open. No new table, state-store, form, spreadsheet, chart, or visualization dependency was added for the workflows. Existing backend Catalog query budgets remain the separately governed 300 ms/800 ms p95 assertions; this build does not relabel them as end-user latency.

## Executable verification and exact-head disposition

| Lane | Reproduced result |
|---|---|
| Generated contract/API closure | `bun test packages/contracts/platform-api/src/index.test.ts packages/domains/catalog/src/index.test.ts packages/domains/inventory/src/index.test.ts apps/server/src/router.test.ts`: 72 tests / 210 expectations; OpenAPI, permission, and generated-client parity clean |
| Live Catalog/Inventory PostgreSQL | 37 tests / 215 expectations: 27 Catalog/Inventory cases (173 expectations) plus 10 Import/Numbering cases (42 expectations), covering delimiter-safe paged balances, Count draft persistence/idempotency, separator-preserving and empty-safe exact SKU/state filtering, tenant non-disclosure, activity metadata, and dedicated Numbering tenant isolation |
| Web unit/type/format | 40 tests / 110 expectations after consequential-UX, same-origin proxy, review remediation, Balance cursor-trail regression coverage, and receipt-intent lifecycle coverage; TypeScript and scoped Biome checks clean |
| Product documentation | `check-content`, Fumadocs generation, TypeScript, and Biome clean; one stable documentation ID |
| Browser and real-authority workflow | 6/6 desktop/mobile Chromium tests in the exact Compose topology: login keyboard/skip-link/reflow/axe, protected redirect, and authenticated Product create/read/list through same-origin Better Auth and oRPC, tenant membership, tenant-scoped role, entitlements, active context, and Catalog persistence |
| Direct API and import-security proof | 62 tests / 190 expectations prove transport and application-boundary permission and entitlement denial, stable non-disclosure, exact-byte CSV bounds, malformed UTF-8 replacement rejection, canonical EICAR scanner wiring, and safe HTTP validation titles |
| Residual live persistence proof | Imports plus dedicated Numbering tenant-isolation: 10 tests / 42 expectations; direct Node persistence fallback passes |

The browser lane was reproduced after review remediation against freshly built `web` and `server` images plus PostgreSQL 18 in one isolated Compose project. The sequence applied committed migrations, ran the server-owned `e2e:seed` fixture, and then executed `bun run --cwd apps/web test:e2e`; all six desktop/mobile tests passed in 10.6 seconds. The fixture creates only synthetic controlled-prototype identities and authority records and does not bypass authentication, current-context, permission, entitlement, oRPC, or owner persistence boundaries.

Each authenticated browser lane attaches bounded Navigation Timing/resource-count JSON to its Playwright report. CI retains the report and failure evidence; these measurements are diagnostic artifacts, not an SLA. Claude Code reproduced the final remediation lanes at exact head `c69e5fb4415083affc40dc52f2d0ada78846252e`, confirmed both required GitHub Actions workflows green on that SHA, and recorded concurrence before merge. PR7 retains whole-workstream exact-head and exact-main verification.

## Residual risks and PR7 handoff

- Automated axe results are not WCAG conformance and do not replace screen-reader, zoom/reflow, forced-colors, device, or qualified accessibility review.
- PR7 directly browser-proves permission denial; entitlement-unavailable remains covered by component/server boundary tests rather than a separate live browser case.
- RLS, penetration testing, production roles, external provider evidence, production observability/SLOs, and RR-007/RR-009 remain open.
- Browser support evidence is Chromium at controlled-prototype depth. Broader compatibility and native workflow evidence are not claimed.
- Product edit covers selected aggregate fields; richer Variant/Identifier administration remains at the depth assigned by PDA-RDM-009 and PDA-DOM-002.
- Transfer actor metadata is latest-action evidence, not an exhaustive receipt-history representation.
- PR7 owns the complete registry-derived 14-capability by 13-dimension evidence matrix; PDA-TST-013 scenarios 2 and 8; PDA-ARC-015 scenario 8 plus only WS2's precondition subpath of scenario 2; whole-workstream security/recovery/capacity evidence; risk/roadmap/program propagation; and final WS2 controlled-prototype disposition.

## Change history

| Version | Date | Author | Change |
|---|---|---|---|
| 0.9.0 | 2026-07-17 | Frontend Platform | Added exact-stack Barcode entry/lookup accessibility evidence and Product lifecycle offline fail-closed evidence; the complete desktop/mobile Playwright lane now reproduces 20/20 cases. |
| 0.8.0 | 2026-07-16 | Frontend Platform | Recorded the PR7 exact-stack pattern/accessibility re-audit, remediated AA contrast and opaque-identifier mobile reflow defects, reproduced 16/16 desktop/mobile browser cases including online-only fail-closed mutation behavior, and retained measured Count interaction evidence without claiming screen-reader conformance. |
| 0.7.0 | 2026-07-16 | Frontend Platform | Recorded exact-head independent concurrence and PR #78 merge, removed stale pending-review wording, and preserved PR7 plus RR-007/RR-009 and every pilot/production accessibility gate. |
| 0.6.0 | 2026-07-16 | Frontend Platform | Closed the independent review finding by resetting both Balance cursor fields with handler-level regression proof; also closed the disclosed receipt-intent and persistence-adapter whitespace residuals so the recorded idempotency and exact-lookup boundary claims remain literal. |
| 0.5.0 | 2026-07-16 | Frontend Platform | Dispositioned the seven automated exact-head findings and follow-up edge audit through intent-bound idempotency, filter-trail reset, outstanding Transfer-line selection, failed-context query recovery, exact `If-Match` CORS proof, separator-preserving/empty-safe SKU lookup, closed versioned structural balance cursors, and reproducible evidence commands. |
| 0.4.0 | 2026-07-16 | Frontend Platform | Added the same-origin auth/oRPC proxy remediation, exact Compose 6/6 browser result, corrected integrated PostgreSQL and web-unit counts, and bounded browser-performance-artifact disposition. |
| 0.3.0 | 2026-07-16 | Frontend Platform | Added direct transport/application denial, import-security, canonical scanner, CORS, dedicated Numbering tenant-isolation, and Node evidence. |
| 0.2.0 | 2026-07-16 | Frontend Platform | Added reproduced authenticated desktop/mobile browser, real-authority fixture, CI orchestration, production-build, bundle-delta, and consequential-UX remediation evidence. |
| 0.1.0 | 2026-07-16 | Frontend Platform | Recorded the initial PR6 controlled-prototype route, architecture, workflow, UI-pattern, accessibility-target, responsive, help, executable-evidence, and residual-risk disposition. |
