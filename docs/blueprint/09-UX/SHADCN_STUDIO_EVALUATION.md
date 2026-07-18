---
document_id: PDA-UX-035
title: Shadcn Studio Evaluation
version: 0.7.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0005, ADR-0022]
---

# Shadcn Studio Evaluation

## Decision

Shadcn Studio is a Restricted licensed discovery and composition source. It complements the official shadcn/ui registry; it does not replace it and is not Meridian design-system or architecture authority.

Use Studio for bounded visual exploration of selected application shells, dashboard compositions, forms, empty states, and marketing surfaces. Do not use it to define business behavior, authentication architecture, enterprise-grid semantics, POS, permissions, tenant authority, offline conflict, provider uncertainty, audit, finance, or AI authority.

No Studio item is Prototype Approved or Platform Approved by this evaluation.

## Verified environment and capabilities

| Item | Verified state on 2026-07-13 | Meridian interpretation |
|---|---|---|
| MCP package | shadcn-studio-mcp 1.0.7 | Exact discovery runtime; reverify before reuse |
| Project prerequisite | Initialized shadcn project | Studio is an overlay on a governed shadcn foundation |
| /cui | Customize an existing Studio block | Adaptation aid; output remains untrusted until normalized |
| /iui | Pro-only inspired UI generation | Visual exploration only; never authority |
| /rui | Refine an existing block | Iteration aid; cannot promote lifecycle |
| /ftc | Figma-to-code workflow with Figma MCP | Composition/install aid; Figma names and output are not contracts |
| Free mode | Essential features and limited block set | Suitable only for limited exploration |
| Pro mode | Premium blocks, advanced capability, and priority support | Entitlement does not imply architectural acceptance |
| Returned metadata (catalog level) | 61 block families and 146 inspiration identifiers | Catalog-level response; does not vary with authentication |
| Returned metadata (authenticated, per-family) | 735 total variant records across the same 61 families, of which 74 (across 21 families) carry an explicit `isPro: true` tag | Substantially deeper than the catalog implies; see COMPONENT_SOURCE_MATRIX.md for the full per-family breakdown |
| Item entitlement fields | Returned at the per-family metadata level (`get-block-meta-content`'s `meta.isPro` field) for authenticated variants that carry it; absent (not false) for the remainder | Premium-only count is now partially observed, not fully unverified — see below |
| Credential-gating confirmed | Yes, by controlled comparison: identical call returned 1 variant unauthenticated vs. 18 variants (3 `isPro: true`) authenticated for the same family | The configured credential is live and authenticating, not merely configured |
| Separate component library (distinct from block families) | 28 of 54 candidate primitive slugs found (573 variant records, 44 `isAnimated: true`, 0 `isPro: true`); 26 slugs returned "Component not found" | A second, per-primitive catalog exists alongside the block families; its coverage is partial and no listing tool exists for it, so absence for a given slug is unverified, not proof of non-coverage |
| Independent page/template/layout/animation/theme types | Not returned reliably | Do not invent totals; Studio's own marketing claims broader coverage, recorded separately as vendor-claimed and not independently reproduced |

The public documentation describes /ftc as primarily installing blocks represented by Figma frame names and allowing minor changes. That is not evidence that it can safely translate complex operational layout, state machines, authority, or application contracts.

Entitlement caveat: the presence of `isPro: true` on 74 of 735 authenticated variant records is direct evidence those specific variants are Pro-tier. The absence of the field on the remaining 661 is **not** evidence they are Free-tier — Studio's metadata schema does not appear to positively tag Free items, only Pro ones observed so far. Treat un-tagged variants' entitlement as unverified, not Free-by-default.

## Codex support status

Studio's current documentation lists VS Code, Cursor, Windsurf, Cline, and Claude Code as supported clients and provides a dedicated Claude Code setup section. It explicitly says Codex is not supported because Studio's instruction payload exceeds a Codex MCP response-size limit, and directs readers to upstream issues.

In this audit, the MCP server initialized and safe metadata calls returned usable results inside a MCP-enabled Codex task. This proves only bounded local interoperability for those calls. It does not contradict the vendor support statement, prove full command reliability, or justify fetching large licensed payloads through Codex.

Required fallback:

- Use metadata-only calls in Codex.
- Use a vendor-supported client for a later authenticated, item-level source review.
- Keep each result bounded and record truncation or missing fields.
- Never silently interpret an incomplete response as a complete catalog.

**Compatibility finding (historical, 2026-07-13): Codex's configured credential did not authenticate at all.** The `shadcn-studio-mcp@1.0.7` package (confirmed by reading its `build/utils/config.js` source) only recognizes the environment variables `API_KEY` and `EMAIL`; `isPro()` requires both to resolve to non-empty values. The `.codex/config.toml` MCP entry for this server set `EMAIL` correctly but named the license variable `LICENSE_KEY`, which the package does not read — so `apiKey` never got set and Studio calls made from that Codex configuration ran in freemium mode regardless of the license actually held. A successful call only proves the server started, not that it authenticated (freemium calls also succeed).

**Status update (2026-07-18):** after Codex was restarted, a metadata-only call for the known Application Shell family returned 18 variants, including 3 tagged `isPro: true`. That matches the authenticated control recorded on 2026-07-13; the historical unauthenticated control returned 1 variant. This independently verifies that the corrected Codex environment-variable name is effective in this session without exposing a credential. It proves bounded authenticated metadata interoperability only, not vendor support for Codex or reliability for large licensed payloads.

## Inventory profile

| Studio category | Families | Typical value | Meridian disposition |
|---|---:|---|---|
| Bento Grid | 1 | Marketing and summary composition | Restricted |
| dashboard-and-application | 17 | Shells, headers, sidebars, forms, charts, settings, states | Preferred Candidate or Researching by family |
| Datatable | 1 | Table visual composition | Researching; custom enterprise behavior required |
| eCommerce | 13 | Storefront and checkout presentation | Restricted; production storefront deferred |
| Marketing UI Components | 29 | Landing, auth-page presentation, social proof, pricing, portfolio | Restricted to marketing or visual research |
| Total | 61 | 146 catalog-level inspiration variants; 735 actual variant records observed via authenticated per-family metadata (74 explicitly `isPro: true`) | No automatic approval |

The complete family and variant names, plus the full per-family authenticated/Pro-tagged breakdown, are in COMPONENT_SOURCE_MATRIX.md.

## 2026-07-18 catalog delta review

This delta is deliberately narrower than the 2026-07-13 exhaustive inventory. It records newly advertised candidates and the boundary between Studio's public website and its pinned MCP metadata interface. No source, installation payload, private URL, or premium asset was retrieved.

Website evidence was verified in rendered Chrome sessions with the browser's Playwright-backed DOM inspection and viewport screenshots, not inferred only from static page extraction or URL parameters. At the `?base=radix` Autocomplete URL, one live DOM read exposed a `Radix UI` component-library control, while an independent rendered recheck exposed `Base UI Component Library`; both retained the `/preview/components/radix/autocomplete?index=0` link and rendered `Base UI Autocomplete Support`, `Radix UI Autocomplete Support`, and Base UI-specific implementation prose. The control is therefore not a stable implementation signal. Screenshots are ephemeral review evidence and are not committed because they reproduce third-party presentation content; the durable repository evidence is the bounded observation and source URL below.

| Evidence | Verified result | Interpretation |
|---|---|---|
| npm package metadata | `shadcn-studio-mcp` remains at 1.0.7; its last publish remains 2026-01-13 | Studio's server-side and website catalogs can change without a new MCP package release |
| MCP block catalog | 61 block families remain listed; Onboarding Feed is present | The block catalog remains queryable but its summary count is not a complete product-catalog view |
| Onboarding Feed family metadata | 5 variants returned; variant 02 declares `@stepperize/react` and variant 05 declares `motion` | Variant-level dependency and authority review is required before any prototype |
| Public component catalog | The official page advertises 58 component families, 1,000+ variants, and a new Autocomplete family with 10 components. At `?base=radix`, rendered Chrome/Playwright checks retained `/preview/components/radix/autocomplete?index=0` but exposed conflicting `Radix UI` and `Base UI` component-library control labels across rechecks while keeping Base UI-specific prose | These are vendor catalog claims, not an acceptance or accessibility result. The conflicting hydrated control and copy cannot establish the actual variant implementation or dependencies; the URL parameter does not alter Meridian's governed primitive choice |
| MCP component metadata | `autocomplete`, `auto-complete`, `autocomplete-component`, and `typeahead` returned `Component not found`; the known `combobox` family returned 14 variants | Autocomplete is not currently discoverable through the pinned MCP metadata API; absence is not proof that the Studio product lacks it |
| Public templates | AIDesk, Sprintrix, Promptly, and Brandly are advertised on first-party template pages | Templates are not enumerated by the available Studio MCP metadata tools and remain outside the verified MCP inventory |
| License page | Last-updated date remains 2026-01-13 | No new license grant was inferred from the catalog release |

Candidate dispositions from this delta:

| Candidate | Disposition | Meridian boundary |
|---|---|---|
| Autocomplete 10 | Researching | Compare visual and interaction ideas only against the official shadcn Command/Combobox and the platform-owned searchable-select direction. New owned work remains Base UI-backed under ADR-0022; the Studio Radix view is comparison/fallback evidence only and does not authorize mixing primitive families. Because rendered rechecks at `?base=radix` produced conflicting component-library labels while retaining the Radix preview link and Base UI-specific prose, require item-level source and dependency evidence before assigning a primitive family. Any prototype must preserve tenant and permission filtering, cancellable/debounced remote search, no-results, stale, degraded, offline, large-data, keyboard, focus, announcement, and custom-option semantics. |
| Onboarding Feed 01 | Preferred Candidate | Bounded composition inspiration for an optional first-run or operational-readiness checklist. Completion state must come from governed application contracts; support skip, resume, recovery, and non-coercive disclosure. |
| Onboarding Feed 02 | Researching | Multi-step setup reference only. `@stepperize/react` is a new dependency requiring separate review; external step state must not become business authority. |
| Onboarding Feed 03 | Researching | Progress-and-dialog composition reference only. Dialog actions must expose consequence, cancellation, validation, and authoritative completion rather than treating presentation state as success. |
| Onboarding Feed 04 | Researching | Timeline/readiness-history inspiration only; it cannot replace the immutable audit or canonical activity evidence. |
| Onboarding Feed 05 | Restricted | Its `motion` dependency and privacy/billing demonstration content add cost and misleading authority risk without a current operational need. |
| AIDesk | Researching | Visual composition reference for future support, inbox, and knowledge surfaces only. Do not reuse its authentication, ticket, AI-agent, contact, or role semantics. |
| Sprintrix | Researching | Visual reference for saved views, filters, boards, and activity composition only. Do not import its project, issue, team, security, billing, or authorization model. |
| Promptly | Restricted | AI interaction visual research only. It cannot define model authority, autonomy, data handling, pricing, or the deterministic non-AI path. |
| Brandly | Restricted | Public-marketing inspiration only; it has no role in the authenticated operational application. |

Studio descriptions such as "production-ready," "accessible," and "fully responsive" remain vendor claims until Meridian reproduces the relevant evidence against a named, licensed item.

## Strengths

- Broad visual variation can reduce blank-page design work.
- Application Shell, dashboard shell/header/sidebar, Account Settings, Form Layout, Empty State, File Upload, and multi step form families address genuine composition needs.
- Blocks are based on the shadcn ecosystem and can be normalized into source-owned code when licensing allows.
- Marketing compositions may accelerate the separate public-marketing surface.
- /rui can support bounded refinement after Meridian requirements and tokens are supplied.

## Weaknesses

- Catalog-level metadata does not expose per-item version, entitlement, accessibility evidence, license scope, or independent content type. Authenticated per-family metadata does expose `dependencies`, `registryDependencies`, file paths/types, and an `isPro` tag on some variants (see Verified environment and capabilities), but still no version, accessibility, or license-scope evidence.
- Vendor claims such as production-ready or accessible are discovery claims, not acceptance evidence.
- Visual compositions do not model Meridian canonical states, offline truth, tenant scope, permissions, entitlements, provider uncertainty, reconciliation, or reversal semantics.
- Authentication and checkout pages can appear complete while hiding serious architectural gaps.
- Generated or refined output can introduce one-off spacing, color, typography, animation, icons, client boundaries, and dependencies.
- Current Codex support is explicitly absent.

## Family dispositions

### Preferred Candidates

Subject to item-level inspection and full normalization:

- Application Shell
- dashboard-shell, dashboard-header, and dashboard-sidebar
- Account Settings
- Form Layout and multi step form
- Empty State
- File Upload
- Onboarding Feed
- Charts Component
- statistics-component and widgets-component

### Researching

- Card Nav, dashboard dialogs/dropdowns/footer, and DataTable
- Any composition whose responsive, accessibility, dependency, or state behavior cannot be established from metadata

DataTable is visual research only. Meridian still requires a custom enterprise-grid composite under ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md.

### Restricted

- All marketing families
- All eCommerce families
- Bento Grid
- Studio authentication-page families
- Timeline and portfolio presentation
- Animation or interaction used mainly for novelty or persuasion

Restricted families may be considered for the public marketing site, a deferred storefront, onboarding illustration, demonstration, or low-risk empty state. They may not be repurposed as operational workflow authority.

### Rejected use

- Wholesale installation of a template or page without a governed task
- Licensed code copied into public evidence or a repository when redistribution is unclear
- Embedded business logic, mock authorization, tenant assumptions, provider behavior, or invented metrics
- Studio themes, fonts, or token values replacing Meridian semantic tokens
- Studio source as the canonical POS, permissions, finance, inventory, offline, audit, or AI-control implementation

## Acquisition gates

Before retrieving a selected Studio item:

1. Rotate any credential previously exposed in conversation and configure the replacement outside the repository.
2. Confirm the purchasing entity, license grant, repository/deployment scope, seat or user restrictions, update rights, redistribution rights, and termination obligations.
3. Record item identifier, MCP version, retrieval date, entitlement class, license evidence location, and intended surface without recording the secret or private URL.
4. Retrieve one named candidate in an isolated prototype branch using a supported client.
5. Inspect dependencies and source before execution.
6. Remove business behavior, replace tokens and icons, minimize client boundaries, and reconnect through Meridian contracts.
7. Complete accessibility, responsive, offline/degraded, white-label, security, privacy, performance, Storybook, and visual-regression evidence.
8. Promote only through the preferred catalog and acceptance checklist.

## Credential boundary

License keys, account email addresses, invoices, cookies, access tokens, private registry URLs, billing records, and prohibited licensed source must never enter repository files, issues, pull requests, logs, screenshots, fixtures, or generated evidence.

This evaluation's 2026-07-13 authenticated pass used a Shadcn Studio Pro credential already confirmed by the founder to be the previously-rotated, non-compromised key, configured only through local MCP `env` settings (`API_KEY`/`EMAIL`) — never typed, pasted, logged, or committed. Only metadata-only endpoints (`get-blocks-metadata`, `get-block-meta-content`) were called; no install, collect, or content-fetching endpoint was used, and no licensed source was retrieved or persisted. A full-diff secret scan of this branch found no credential, private URL, or account detail in any committed file. Any *future* credential believed to be exposed must still be revoked or rotated through the vendor account before further authenticated work — this standing rule is unchanged.

## Recommendation

Retain Studio MCP 1.0.7 as a pinned, optional discovery tool. Keep official shadcn/ui as canonical registry interface. Use the public catalog only to identify a named candidate; verify that candidate through bounded metadata and a supported-client fallback before any licensed source acquisition. Do not interpret a website/MCP mismatch as approval, rejection, or product absence. If Studio cannot provide bounded, auditable source and dependency evidence, use official primitives and build the Meridian composite directly.

## Sources and recheck

- Studio MCP documentation: https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server
- Studio component catalog: https://shadcnstudio.com/components
- Studio Autocomplete documentation: https://shadcnstudio.com/docs/components/autocomplete
- Studio Autocomplete Radix view: https://shadcnstudio.com/docs/components/autocomplete?base=radix
- Studio Onboarding Feed: https://shadcnstudio.com/blocks/dashboard-and-application/onboarding-feed
- Studio admin-dashboard templates: https://shadcnstudio.com/templates/admin-dashboard
- Studio AIDesk template: https://shadcnstudio.com/templates/admin-dashboard/aidesk
- Studio Sprintrix template: https://shadcnstudio.com/templates/admin-dashboard/sprintrix
- Studio Promptly template: https://shadcnstudio.com/templates/admin-dashboard/promptly
- Studio Brandly template: https://shadcnstudio.com/templates/brandly-agency-template
- Studio license: https://shadcnstudio.com/license
- Official shadcn MCP documentation: https://ui.shadcn.com/docs/mcp
- MCP package registry metadata for the exact configured packages

Recheck at every Studio MCP update, support-matrix change, license change, metadata-schema change, shadcn configuration change, or candidate acquisition.
