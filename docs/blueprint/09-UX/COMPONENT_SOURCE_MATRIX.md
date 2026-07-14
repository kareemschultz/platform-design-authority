---
document_id: PDA-UX-033
title: Component Source Matrix
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0005, ADR-0022]
---

# Component Source Matrix

## Decision

Official shadcn/ui is Meridian's canonical external registry interface and primitive starting point. Shadcn Studio is a licensed design-exploration source. Neither source is architectural authority, and no item discovered here is Platform Approved.

This is a metadata-only inventory taken on 2026-07-12/13, with an authenticated re-verification pass on 2026-07-13. No component source, premium asset, installation command, page, or theme was retrieved or installed.

## Evidence and counting rules

- Remote baseline: `main` at `8986977a3fa04a4b38c9b82c6a7384014dc8fadb` at original authoring; re-verified current against `main` at `a350732204aa33bebd4e9de6c1b64366372e1653` on 2026-07-13, with this branch's merge-base equal to that tip (no rebase required).
- Official shadcn MCP package: pinned exactly to `shadcn@4.13.0` (not `@latest`); configured registry: `@shadcn`. Reproduced independently on 2026-07-13 by driving the pinned server directly over its stdio JSON-RPC interface (`initialize` → `get_project_registries` → `list_items_in_registries`) against a project's existing `components.json`, since the equivalent Claude-side MCP connector was not reachable in this session (see Connector status below). No item, block, page, theme, or file content was installed or retrieved; only registry metadata (name, registry type) was read.
- Shadcn Studio MCP package: pinned exactly to `shadcn-studio-mcp@1.0.7` (not unpinned/`@latest`).
- Official registry inventory: 471 entries, independently reproduced via the direct JSON-RPC session above, with an exact type breakdown: 239 `example`, 97 `block`, 61 `ui`, 52 `font`, 13 `internal`, 5 `theme`, 2 `style`, 1 `lib`, 1 `hook` (239+97+61+52+13+5+2+1+1 = 471). Counts are registry entries, not 471 approved components.
- Studio catalog-level inventory: 61 block families and 146 inspiration variants in five categories, as returned by `get-blocks-metadata` (unchanged whether or not Studio credentials are configured — this call is catalog-level and does not vary with entitlement).
- Studio authenticated re-verification (2026-07-13): calling the metadata-only, non-source-fetching `get-block-meta-content` endpoint per family with a valid `API_KEY`/`EMAIL` credential returns substantially more than the catalog implies. Across all 61 families this returned **735 total variant records** (not 146), of which **74 variants across 21 of the 61 families carry an explicit `isPro: true` tag** in their `meta` object; the remaining 661 variant records do not carry an `isPro` field at all (this is recorded as **not established as Free** — the field's absence is not evidence of a Free/Pro classification either way). Per-family authenticated variant and Pro-tagged counts are in the family table below alongside the original catalog-declared counts.
- **Controlled comparison establishing this is genuinely credential-gated** (not merely a richer public response): the identical `get-block-meta-content` call for `dashboard-and-application/application-shell/registry` was run twice from an isolated process, once with `API_KEY`/`EMAIL` set and once with both unset. Without credentials the endpoint returned exactly 1 variant (`application-shell-01`, the basic/free entry). With credentials it returned 18 variants, 3 of them `isPro: true`. This is direct, reproducible evidence that the configured credential is live and authenticating, not merely present.
- Studio also exposes a **separate component library** (`accordion`, `button`, `dialog`, `select`, etc.), distinct from the block-family catalog above, queried one family at a time via the same metadata-only `get-component-meta-content` endpoint. 54 candidate slugs were tried on 2026-07-13; 28 were found (573 total variant records, 44 tagged `isAnimated: true`, 0 tagged `isPro: true` — recorded as entitlement unclassified for all 573, not Free), and 26 returned a server-confirmed "Component not found" (recorded as unverified for that slug, not evidence Studio lacks the concept entirely — see the component-library section below for the full breakdown, per-family table, and complete identifier list).
- Studio documents Free and Pro modes and the `/cui`, `/iui`, `/rui`, and `/ftc` workflows and requires an initialized shadcn project: [Studio MCP documentation](https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server).
- Official shadcn documents MCP registry browsing, search, inspection, and installation through configured registries: [official shadcn MCP documentation](https://ui.shadcn.com/docs/mcp).
- Independent totals for pages, templates, themes, and animated/motion components beyond what is captured above remain **unverified**, not zero — the metadata-only endpoints used here do not expose a dedicated classification for those categories. Studio's own marketing pages claim broader page/template/animation libraries than this metadata classifies; those vendor claims are recorded separately, below, as vendor-claimed and not independently reproduced, rather than folded into this document's verified counts.

## Vendor-claimed totals not independently reproduced

Studio's public marketing and documentation pages describe additional scope — for example broader page, template, and animation libraries — beyond what any metadata-only MCP call classifies or counts. These claims are recorded here for completeness, explicitly labeled as **vendor-claimed, not independently reproduced**, and must not be merged into or cited alongside this document's verified inventory totals:

| Vendor claim | Source | Independent reproduction attempted | Result |
|---|---|---|---|
| Broader "Pro" block/page/template library beyond the 61 families and 735 authenticated variants captured here | Studio marketing site and MCP documentation | Yes — exhausted `get-blocks-metadata` (catalog) and `get-block-meta-content` (per-family, authenticated) across all 61 catalog families | No additional families or a distinct page/template/layout/theme/animation classification were exposed by either endpoint; the 735-variant, 74-Pro-tagged figure is the full authenticated result these endpoints will safely yield |
| A distinct animation/motion component set | Studio marketing site | Partial — `isAnimated: true` tagging was found on 44 of 573 component-library variants and referenced within some block variants' `meta` | No separate, independently-countable "animation library" endpoint or classification exists in the metadata; the 44-variant figure is the full observed tagging, not a vendor-declared animation library total |

## Connector status (2026-07-13)

The official `shadcn` MCP server is configured in the Claude Code user-level config (`shadcn@4.13.0`, pinned) and its command was independently confirmed to work correctly when driven directly (see JSON-RPC evidence above). Its tools did not load as an available Claude Code connector earlier in this session, and **remained unreachable after the user performed a full quit-and-relaunch of the desktop application**. Re-investigation after that relaunch found the credential still present in the live `claude.exe` host process's own command line (in its old, pre-migration raw-argument form), for both open windows including this session's own host process — indicating the relaunch did not fully clear whatever cached configuration snapshot the application (or its per-session resume mechanism) serializes into that process's command line. As a further mitigation, the Studio credential was moved out of `~/.claude.json` entirely into genuine Windows user-level environment variables (`setx API_KEY`/`setx EMAIL`, persisted in `HKCU\Environment`), with the config file's `env` object now empty — so nothing in the on-disk config remains for any future snapshot to serialize. This has not yet been verified end-to-end, since it requires inheritance by a freshly-spawned (not resumed) process tree; see TECH-LESSON-031's updated entry. All official-registry and Studio evidence in this document was gathered as a workaround by driving the pinned packages directly over stdio JSON-RPC, not through the (still unreachable) Claude Code connector.

## Source-role matrix

| Source | Governed role | Allowed discovery | Prohibited shortcut | Default disposition |
|---|---|---|---|---|
| Platform-owned `@meridian/ui-web` | Canonical implementation after evidence gates | Existing components, stories, tests, owners | Assuming existence means current acceptance | Highest trust after acceptance |
| Official `@shadcn` | Primitive/component baseline | Metadata list and search | Treating a registry item or block as approved | Preferred Candidate |
| Shadcn Studio | Composition and visual exploration | Metadata and documented capabilities | Copying licensed source, installing wholesale, or importing hidden business logic | Researching/Restricted |
| AI-generated UI | Bounded prototype evidence | Task-specific exploration | Promotion without provenance and tests | Untrusted |
| Custom Meridian composite | Domain-specific behavior | Requirement and contract design | Reimplementing accessible primitives unnecessarily | Custom Required |
| Mobbin | Real-world UX pattern evidence and inspiration for requirement-driven research; non-executable, non-authoritative, no source-code trust | Screen/flow/section search via the connected, authenticated MCP for a named Meridian requirement | Copying layout, information architecture, or copy wholesale as if it were a Meridian contract; treating a screenshot as accessibility, security, or state evidence; treating popularity as approval | Restricted (research evidence only — never a component source, never promotable to Preferred Candidate or higher) |

## Complete official registry metadata inventory

Each name below inherits the source, type, recommendation, and rationale on its row. This preserves the entire discovered metadata inventory without retrieving source content.

| Source | Registry type/category | Count | Recommendation | Rationale | Names |
|---|---:|---:|---|---|---|
| @shadcn | block | 97 | Researching | Composition evidence only; do not adopt whole blocks without task-specific review. | `chart-area-axes`, `chart-area-default`, `chart-area-gradient`, `chart-area-icons`, `chart-area-interactive`, `chart-area-legend`, `chart-area-linear`, `chart-area-stacked`, `chart-area-stacked-expand`, `chart-area-step`, `chart-bar-active`, `chart-bar-default`, `chart-bar-horizontal`, `chart-bar-interactive`, `chart-bar-label`, `chart-bar-label-custom`, `chart-bar-mixed`, `chart-bar-multiple`, `chart-bar-negative`, `chart-bar-stacked`, `chart-line-default`, `chart-line-dots`, `chart-line-dots-colors`, `chart-line-dots-custom`, `chart-line-interactive`, `chart-line-label`, `chart-line-label-custom`, `chart-line-linear`, `chart-line-multiple`, `chart-line-step`, `chart-pie-donut`, `chart-pie-donut-active`, `chart-pie-donut-text`, `chart-pie-interactive`, `chart-pie-label`, `chart-pie-label-custom`, `chart-pie-label-list`, `chart-pie-legend`, `chart-pie-separator-none`, `chart-pie-simple`, `chart-pie-stacked`, `chart-radar-default`, `chart-radar-dots`, `chart-radar-grid-circle`, `chart-radar-grid-circle-fill`, `chart-radar-grid-circle-no-lines`, `chart-radar-grid-custom`, `chart-radar-grid-fill`, `chart-radar-grid-none`, `chart-radar-icons`, `chart-radar-label-custom`, `chart-radar-legend`, `chart-radar-lines-only`, `chart-radar-multiple`, `chart-radar-radius`, `chart-radial-grid`, `chart-radial-label`, `chart-radial-shape`, `chart-radial-simple`, `chart-radial-stacked`, `chart-radial-text`, `chart-tooltip-advanced`, `chart-tooltip-default`, `chart-tooltip-formatter`, `chart-tooltip-icons`, `chart-tooltip-indicator-line`, `chart-tooltip-indicator-none`, `chart-tooltip-label-custom`, `chart-tooltip-label-formatter`, `chart-tooltip-label-none`, `dashboard-01`, `login-01`, `login-02`, `login-03`, `login-04`, `login-05`, `sidebar-01`, `sidebar-02`, `sidebar-03`, `sidebar-04`, `sidebar-05`, `sidebar-06`, `sidebar-07`, `sidebar-08`, `sidebar-09`, `sidebar-10`, `sidebar-11`, `sidebar-12`, `sidebar-13`, `sidebar-14`, `sidebar-15`, `sidebar-16`, `signup-01`, `signup-02`, `signup-03`, `signup-04`, `signup-05` |
| @shadcn | example | 239 | Researching | Documentation evidence, not reusable platform source or approval. | `accordion-demo`, `alert-demo`, `alert-destructive`, `alert-dialog-demo`, `aspect-ratio-demo`, `avatar-demo`, `badge-demo`, `badge-destructive`, `badge-outline`, `badge-secondary`, `breadcrumb-demo`, `breadcrumb-dropdown`, `breadcrumb-ellipsis`, `breadcrumb-link`, `breadcrumb-responsive`, `breadcrumb-separator`, `button-as-child`, `button-default`, `button-demo`, `button-destructive`, `button-ghost`, `button-group-demo`, `button-group-dropdown`, `button-group-input`, `button-group-input-group`, `button-group-nested`, `button-group-orientation`, `button-group-popover`, `button-group-select`, `button-group-separator`, `button-group-size`, `button-group-split`, `button-icon`, `button-link`, `button-loading`, `button-outline`, `button-rounded`, `button-secondary`, `button-size`, `button-with-icon`, `calendar-demo`, `calendar-hijri`, `card-demo`, `card-with-form`, `carousel-api`, `carousel-demo`, `carousel-orientation`, `carousel-plugin`, `carousel-size`, `carousel-spacing`, `chart-bar-demo`, `chart-bar-demo-axis`, `chart-bar-demo-grid`, `chart-bar-demo-legend`, `chart-bar-demo-tooltip`, `chart-tooltip-demo`, `checkbox-demo`, `checkbox-disabled`, `checkbox-with-text`, `collapsible-demo`, `combobox-demo`, `combobox-dropdown-menu`, `combobox-popover`, `combobox-responsive`, `command-demo`, `command-dialog`, `context-menu-demo`, `data-table-demo`, `date-picker-demo`, `date-picker-with-presets`, `date-picker-with-range`, `dialog-close-button`, `dialog-demo`, `drawer-demo`, `drawer-dialog`, `dropdown-menu-checkboxes`, `dropdown-menu-demo`, `dropdown-menu-dialog`, `dropdown-menu-radio-group`, `empty-avatar`, `empty-avatar-group`, `empty-background`, `empty-demo`, `empty-icon`, `empty-input-group`, `empty-outline`, `field-checkbox`, `field-choice-card`, `field-demo`, `field-fieldset`, `field-group`, `field-input`, `field-radio`, `field-responsive`, `field-select`, `field-slider`, `field-switch`, `field-textarea`, `form-formisch-array`, `form-formisch-checkbox`, `form-formisch-complex`, `form-formisch-demo`, `form-formisch-input`, `form-formisch-radiogroup`, `form-formisch-select`, `form-formisch-switch`, `form-formisch-textarea`, `form-next-complex`, `form-next-demo`, `form-rhf-array`, `form-rhf-checkbox`, `form-rhf-complex`, `form-rhf-demo`, `form-rhf-input`, `form-rhf-password`, `form-rhf-radiogroup`, `form-rhf-select`, `form-rhf-switch`, `form-rhf-textarea`, `form-tanstack-array`, `form-tanstack-checkbox`, `form-tanstack-complex`, `form-tanstack-demo`, `form-tanstack-input`, `form-tanstack-radiogroup`, `form-tanstack-select`, `form-tanstack-switch`, `form-tanstack-textarea`, `hover-card-demo`, `input-demo`, `input-disabled`, `input-file`, `input-group-button`, `input-group-button-group`, `input-group-custom`, `input-group-demo`, `input-group-dropdown`, `input-group-icon`, `input-group-label`, `input-group-spinner`, `input-group-text`, `input-group-textarea`, `input-group-tooltip`, `input-otp-controlled`, `input-otp-demo`, `input-otp-pattern`, `input-otp-separator`, `input-with-button`, `input-with-label`, `input-with-text`, `item-avatar`, `item-demo`, `item-dropdown`, `item-group`, `item-header`, `item-icon`, `item-image`, `item-link`, `item-size`, `item-variant`, `kbd-button`, `kbd-demo`, `kbd-group`, `kbd-input-group`, `kbd-tooltip`, `label-demo`, `menubar-demo`, `mode-toggle`, `native-select-demo`, `native-select-disabled`, `native-select-groups`, `native-select-invalid`, `navigation-menu-demo`, `pagination-demo`, `popover-demo`, `progress-demo`, `radio-group-demo`, `resizable-demo`, `resizable-demo-with-handle`, `resizable-handle`, `resizable-vertical`, `scroll-area-demo`, `scroll-area-horizontal-demo`, `select-demo`, `select-scrollable`, `separator-demo`, `sheet-demo`, `sheet-side`, `skeleton-card`, `skeleton-demo`, `slider-demo`, `sonner-demo`, `sonner-types`, `spinner-badge`, `spinner-basic`, `spinner-button`, `spinner-color`, `spinner-custom`, `spinner-demo`, `spinner-empty`, `spinner-input-group`, `spinner-item`, `spinner-size`, `switch-demo`, `table-demo`, `tabs-demo`, `textarea-demo`, `textarea-disabled`, `textarea-with-button`, `textarea-with-label`, `textarea-with-text`, `toggle-demo`, `toggle-disabled`, `toggle-group-demo`, `toggle-group-disabled`, `toggle-group-lg`, `toggle-group-outline`, `toggle-group-single`, `toggle-group-sm`, `toggle-group-spacing`, `toggle-lg`, `toggle-outline`, `toggle-sm`, `toggle-with-text`, `tooltip-demo`, `typography-blockquote`, `typography-demo`, `typography-h1`, `typography-h2`, `typography-h3`, `typography-h4`, `typography-inline-code`, `typography-large`, `typography-lead`, `typography-list`, `typography-muted`, `typography-p`, `typography-small`, `typography-table` |
| @shadcn | font | 52 | Rejected | Typography remains Geist/Inter/Geist Mono. | `font-dm-sans`, `font-eb-garamond`, `font-figtree`, `font-geist`, `font-geist-mono`, `font-heading-dm-sans`, `font-heading-eb-garamond`, `font-heading-figtree`, `font-heading-geist`, `font-heading-geist-mono`, `font-heading-ibm-plex-sans`, `font-heading-instrument-sans`, `font-heading-instrument-serif`, `font-heading-inter`, `font-heading-jetbrains-mono`, `font-heading-lora`, `font-heading-manrope`, `font-heading-merriweather`, `font-heading-montserrat`, `font-heading-noto-sans`, `font-heading-noto-serif`, `font-heading-nunito-sans`, `font-heading-outfit`, `font-heading-oxanium`, `font-heading-playfair-display`, `font-heading-public-sans`, `font-heading-raleway`, `font-heading-roboto`, `font-heading-roboto-slab`, `font-heading-source-sans-3`, `font-heading-space-grotesk`, `font-ibm-plex-sans`, `font-instrument-sans`, `font-instrument-serif`, `font-inter`, `font-jetbrains-mono`, `font-lora`, `font-manrope`, `font-merriweather`, `font-montserrat`, `font-noto-sans`, `font-noto-serif`, `font-nunito-sans`, `font-outfit`, `font-oxanium`, `font-playfair-display`, `font-public-sans`, `font-raleway`, `font-roboto`, `font-roboto-slab`, `font-source-sans-3`, `font-space-grotesk` |
| @shadcn | hook | 1 | Preferred Candidate | Shared behavior candidate after accessibility, lifecycle, and test review. | `use-mobile` |
| @shadcn | internal | 13 | Rejected | Registry-internal artifacts are not Meridian component contracts. | `sidebar-controlled`, `sidebar-demo`, `sidebar-footer`, `sidebar-group`, `sidebar-group-action`, `sidebar-group-collapsible`, `sidebar-header`, `sidebar-menu`, `sidebar-menu-action`, `sidebar-menu-badge`, `sidebar-menu-collapsible`, `sidebar-menu-sub`, `sidebar-rsc` |
| @shadcn | lib | 1 | Restricted | Utility candidate only when behavior and dependency footprint are verified. | `utils` |
| @shadcn | style | 2 | Restricted | Bootstrap/reference material; Meridian configuration and tokens remain authoritative. | `index`, `style` |
| @shadcn | theme | 5 | Rejected | External themes must not replace Meridian semantic tokens or the governed configuration. | `theme-gray`, `theme-neutral`, `theme-slate`, `theme-stone`, `theme-zinc` |
| @shadcn | ui | 61 | Preferred Candidate | Canonical primitive/component source; each selected item still requires normalization and acceptance evidence. | `accordion`, `alert`, `alert-dialog`, `aspect-ratio`, `attachment`, `avatar`, `badge`, `breadcrumb`, `bubble`, `button`, `button-group`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `combobox`, `command`, `context-menu`, `dialog`, `direction`, `drawer`, `dropdown-menu`, `empty`, `field`, `form`, `hover-card`, `input`, `input-group`, `input-otp`, `item`, `kbd`, `label`, `marker`, `menubar`, `message`, `message-scroller`, `native-select`, `navigation-menu`, `pagination`, `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `spinner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip` |

## Complete Shadcn Studio block-family metadata inventory

Every family is recorded individually. “Variants” is the inspiration-variant count returned by the metadata endpoint, not a licensed-source or quality count.

| Source | Category | Name | Type | Catalog variants | Authenticated variants | Pro-tagged variants | Recommendation | Rationale |
|---|---|---|---|---:|---:|---:|---|---|
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | 10 | 24 | 0 | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | 2 | 7 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | 9 | 18 | 3 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | 1 | 6 | 0 | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | 5 | 56 | 19 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | 2 | 26 | 0 | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | 2 | 23 | 0 | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | 1 | 10 | 0 | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | 6 | 18 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | 9 | 9 | 5 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | 2 | 11 | 3 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | 1 | 8 | 1 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | 1 | 7 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | 2 | 9 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | multi step form | Block family | 3 | 3 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | 1 | 5 | 0 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | 3 | 22 | 3 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | 2 | 20 | 1 | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | 2 | 7 | 0 | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | 1 | 12 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | 1 | 6 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | checkout-page | Block family | 1 | 4 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Gift Card | Block family | 1 | 3 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | 1 | 5 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | 1 | 5 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | 1 | 5 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | 1 | 12 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | 1 | 9 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | 2 | 9 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | 1 | 5 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | 2 | 5 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | shopping-cart | Block family | 1 | 4 | 0 | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | 6 | 24 | 1 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | 1 | 10 | 1 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | 2 | 17 | 1 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | 1 | 7 | 3 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | 2 | 16 | 1 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Cookies Consent | Block family | 1 | 3 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | 1 | 14 | 3 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | 1 | 6 | 1 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Error | Block family | 2 | 4 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | 2 | 19 | 2 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | 7 | 29 | 9 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | 1 | 9 | 4 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | 1 | 10 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | 15 | 41 | 6 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | 1 | 9 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | 2 | 14 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | 2 | 18 | 2 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | 2 | 20 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | 3 | 11 | 2 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | 2 | 20 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | 4 | 24 | 3 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | User Schedule | Block family | 1 | 2 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | 1 | 5 | 0 | Restricted | Marketing/auth exploration only; never an operational workflow contract. |

## Shadcn Studio inspiration-variant identifiers

The Studio catalog-level metadata endpoint (`get-blocks-metadata`) returned the following 146 inspiration identifiers; this is the catalog listing and does not vary with Studio authentication. Authenticated per-family metadata (`get-block-meta-content`) exposes substantially more actual variant records (735 total, see the family table above) plus explicit `isPro` tagging on 74 of them, but at a volume (735 individually-named entries) not reproduced identifier-by-identifier here; the per-family authenticated and Pro-tagged counts above are the governed record of that finding. They inherit the source, recommendation, rationale, and restrictions of their family in the table above. Only identifier basenames are recorded; internal source paths and licensed source content are intentionally omitted.

| Category | Family | Variant identifiers |
|---|---|---|
| Bento Grid | Bento Grid | `bento-grid`, `bento-grid-2`, `bento-grid-3`, `bento-grid-4`, `bento-grid-5`, `bento-grid-6`, `bento-grid-7`, `bento-grid-8`, `bento-grid-9`, `bento-grid-10` |
| dashboard-and-application | Application Shell | `application-shell`, `application-shell-2`, `application-shell-3`, `application-shell-4`, `application-shell-5`, `application-shell-6`, `application-shell-7`, `application-shell-8`, `application-shell-9` |
| dashboard-and-application | Charts Component | `charts-component`, `charts-component-2`, `charts-component-3`, `charts-component-4`, `charts-component-5` |
| dashboard-and-application | dashboard-dialog | `dashboard-dialog`, `dashboard-dialog-2` |
| dashboard-and-application | dashboard-dropdown | `dashboard-dropdown`, `dashboard-dropdown-2` |
| dashboard-and-application | dashboard-footer | `dashboard-footer` |
| dashboard-and-application | dashboard-header | `dashboard-header`, `dashboard-header-2`, `dashboard-header-3`, `dashboard-header-4`, `dashboard-header-5`, `dashboard-header-6` |
| dashboard-and-application | dashboard-shell | `dashboard-shell`, `dashboard-shell-2`, `dashboard-shell-3`, `dashboard-shell-4`, `dashboard-shell-5`, `dashboard-shell-6`, `dashboard-shell-7`, `dashboard-shell-8`, `dashboard-shell-9` |
| dashboard-and-application | dashboard-sidebar | `dashboard-sidebar`, `dashboard-sidebar-2` |
| dashboard-and-application | multi step form | `multi-step-form`, `multi-step-form-2`, `multi-step-form-3` |
| dashboard-and-application | statistics-component | `statistics-component`, `statistics-component-2`, `statistics-component-3` |
| dashboard-and-application | widgets-component | `widgets-component`, `widgets-component-2` |
| dashboard-and-application | Card Nav | `card-nav` |
| dashboard-and-application | Account Settings | `account-settings`, `account-settings-2` |
| dashboard-and-application | Form Layout | `form-layout`, `form-layout-2` |
| dashboard-and-application | Empty State | `empty-state` |
| dashboard-and-application | File Upload | `file-upload` |
| dashboard-and-application | Onboarding Feed | `onboarding-feed` |
| Datatable | DataTable | `datatable-component`, `datatable-component-2` |
| Marketing UI Components | About US Page | `about-us-page`, `about-us-page-2`, `about-us-page-3`, `about-us-page-4`, `about-us-page-5`, `about-us-page-6` |
| Marketing UI Components | App Integration | `app-integration` |
| Marketing UI Components | Blog | `blog-component`, `blog-component-2` |
| Marketing UI Components | Compare | `compare` |
| Marketing UI Components | Contact US | `contact-us-page`, `contact-us-page-2` |
| Marketing UI Components | Cookies Consent | `cookies-consent` |
| Marketing UI Components | CTA | `cta-section` |
| Marketing UI Components | Error | `error-page`, `error-page-2` |
| Marketing UI Components | FAQ | `faq-component`, `faq-component-2` |
| Marketing UI Components | Features | `features-section`, `features-section-2`, `features-section-3`, `features-section-4`, `features-section-5`, `features-section-6`, `features-section-7` |
| Marketing UI Components | Footer | `footer-component` |
| Marketing UI Components | Forgot Password | `forgot-password` |
| Marketing UI Components | Gallery | `gallery-component` |
| Marketing UI Components | Hero | `hero-section`, `hero-section-2`, `hero-section-3`, `hero-section-4`, `hero-section-5`, `hero-section-6`, `hero-section-7`, `hero-section-8`, `hero-section-9`, `hero-section-10`, `hero-section-11`, `hero-section-12`, `hero-section-13`, `hero-section-14`, `hero-section-15` |
| Marketing UI Components | Login Page | `login-page` |
| Marketing UI Components | Logo Cloud | `logo-cloud` |
| Marketing UI Components | Navbar | `navbar-component`, `navbar-component-2` |
| Marketing UI Components | portfolio | `portfolio`, `portfolio-2` |
| Marketing UI Components | Pricing | `pricing-component`, `pricing-component-2` |
| Marketing UI Components | Register | `register` |
| Marketing UI Components | Reset Password | `reset-password` |
| Marketing UI Components | Social Proof | `social-proof`, `social-proof-2`, `social-proof-3` |
| Marketing UI Components | Team | `team-section`, `team-section-2` |
| Marketing UI Components | Testimonials | `testimonials-component`, `testimonials-component-2`, `testimonials-component-3`, `testimonials-component-4` |
| Marketing UI Components | Two Factor Authentication | `two-factor-authentication` |
| Marketing UI Components | Verify Email | `verify-email` |
| Marketing UI Components | Timeline Component | `timeline-component` |
| Marketing UI Components | User Schedule | `user-schedule` |
| Marketing UI Components | Download | `download` |
| eCommerce | category-filter | `category-filter` |
| eCommerce | checkout-page | `checkout-page` |
| eCommerce | mega-footer | `mega-footer` |
| eCommerce | offer-modal | `offer-modal` |
| eCommerce | order-summary | `order-summary` |
| eCommerce | product-category | `product-category` |
| eCommerce | product-list | `product-list` |
| eCommerce | product-overview | `product-overview`, `product-overview-2` |
| eCommerce | product-quick-view | `product-quick-view` |
| eCommerce | product-reviews | `product-reviews`, `product-reviews-2` |
| eCommerce | shopping-cart | `shopping-cart` |
| eCommerce | Announcement Banner | `announcement-banner` |
| eCommerce | Gift Card | `gift-card` |

## Complete authenticated Shadcn Studio variant identifiers (all 735)

Every variant record returned by the authenticated, metadata-only `get-block-meta-content` endpoint is listed individually. Each inherits its family's source, category, type, recommendation, and rationale from the family table above; only the Pro tag is per-variant. `isPro: true` is recorded as `Pro`; its absence is recorded as `Unclassified` (not `Free` — Studio's schema does not appear to positively tag Free items).

| Source | Category | Family | Type | Variant identifier | Entitlement | Recommendation | Rationale |
|---|---|---|---|---|---|---|---|
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-21` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-22` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-23` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-24` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-25` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-26` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-27` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-28` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-29` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-30` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-31` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-32` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-33` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-34` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-35` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-36` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-37` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-38` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-39` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-40` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Hero | Block family | `hero-section-41` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-04` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-05` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-06` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-07` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-08` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-shell | Block family | `dashboard-shell-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-05` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Empty State | Block family | `empty-state-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Pricing | Block family | `pricing-component-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-06` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-09` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-sidebar | Block family | `dashboard-sidebar-11` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | `mega-footer-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | `mega-footer-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | `mega-footer-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | `mega-footer-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | mega-footer | Block family | `mega-footer-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | Error | Block family | `error-page-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Error | Block family | `error-page-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Error | Block family | `error-page-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Error | Block family | `error-page-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-06` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-07` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-08` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-list | Block family | `product-list-09` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | User Schedule | Block family | `user-schedule-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | User Schedule | Block family | `user-schedule-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Account Settings | Block family | `account-settings-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Logo Cloud | Block family | `logo-cloud-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | checkout-page | Block family | `checkout-page-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | checkout-page | Block family | `checkout-page-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | checkout-page | Block family | `checkout-page-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | checkout-page | Block family | `checkout-page-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-11` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-12` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-13` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-14` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-15` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-16` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-17` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-header | Block family | `dashboard-header-18` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-01` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-02` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-03` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-04` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-05` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-06` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-07` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-08` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-09` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-10` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-11` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-12` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-13` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-14` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-15` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-16` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-17` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-18` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-19` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-20` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-21` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-22` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-23` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-24` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-25` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dialog | Block family | `dashboard-dialog-26` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-01` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-02` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-03` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-04` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-05` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Card Nav | Block family | `card-nav-06` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-06` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-07` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-08` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-09` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-10` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-11` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Announcement Banner | Block family | `announcement-banner-12` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-11` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-12` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-13` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-14` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-15` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-16` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-17` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-18` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-19` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | widgets-component | Block family | `widget-component-20` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | `login-page-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | `login-page-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | `login-page-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | `login-page-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Login Page | Block family | `login-page-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-04` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-05` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-11` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-12` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-13` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-14` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-15` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-16` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-17` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Application Shell | Block family | `application-shell-18` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | `two-factor-authentication-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | `two-factor-authentication-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | `two-factor-authentication-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | `two-factor-authentication-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Two Factor Authentication | Block family | `two-factor-authentication-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-11` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-12` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-13` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-14` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-15` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-16` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-17` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-18` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-19` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-20` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-21` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-22` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-23` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-24` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-25` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-26` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-27` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-28` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-29` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-30` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-31` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-32` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-33` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-34` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-35` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-36` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-37` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-38` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-39` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-40` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-41` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-42` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-43` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-44` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-45` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-46` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-47` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-48` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-49` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-50` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-51` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-52` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-53` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-54` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-55` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Charts Component | Block family | `chart-component-56` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-21` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-22` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-23` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-24` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-25` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-26` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-27` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-28` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Features | Block family | `features-section-29` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | File Upload | Block family | `file-upload-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-06` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-07` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-08` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-overview | Block family | `product-overview-09` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-11` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-13` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | CTA | Block family | `cta-section-14` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-21` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-22` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-23` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | About US Page | Block family | `about-us-page-24` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-01` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-02` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-03` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-04` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-05` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-06` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Datatable | DataTable | Block family | `datatable-component-07` | Unclassified | Researching | Visual candidate only; Meridian's enterprise grid requires governed behavior, virtualization, accessibility, bulk scope, and offline states. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | `forgot-password-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | `forgot-password-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | `forgot-password-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | `forgot-password-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Forgot Password | Block family | `forgot-password-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Cookies Consent | Block family | `cookies-consent-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Cookies Consent | Block family | `cookies-consent-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Cookies Consent | Block family | `cookies-consent-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-01` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-02` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-05` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Compare | Block family | `compare-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-18` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | FAQ | Block family | `faq-component-19` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-10` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Social Proof | Block family | `social-proof-11` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-10` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-11` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-12` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-13` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-14` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-15` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-16` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-17` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-18` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-19` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-20` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-21` | Pro | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | statistics-component | Block family | `statistics-component-22` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Contact US | Block family | `contact-us-page-16` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-17` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | portfolio | Block family | `portfolio-18` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | `offer-modal-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | `offer-modal-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | `offer-modal-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | `offer-modal-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | offer-modal | Block family | `offer-modal-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-01` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Download | Block family | `download-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | `verify-email-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | `verify-email-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | `verify-email-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | `verify-email-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Verify Email | Block family | `verify-email-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | `reset-password-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | `reset-password-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | `reset-password-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | `reset-password-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Reset Password | Block family | `reset-password-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | `product-quick-view-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | `product-quick-view-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | `product-quick-view-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | `product-quick-view-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-quick-view | Block family | `product-quick-view-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-16` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Blog | Block family | `blog-component-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | App Integration | Block family | `app-integration-10` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-01` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-02` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-03` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-04` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-05` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-06` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-07` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-08` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-09` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-footer | Block family | `dashboard-footer-10` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-06` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-07` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-08` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Form Layout | Block family | `form-layout-09` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | `timeline-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | `timeline-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | `timeline-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | `timeline-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Timeline Component | Block family | `timeline-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | `order-summary-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | `order-summary-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | `order-summary-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | `order-summary-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | order-summary | Block family | `order-summary-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | `onboarding-feed-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | `onboarding-feed-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | `onboarding-feed-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | `onboarding-feed-04` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | Onboarding Feed | Block family | `onboarding-feed-05` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-01` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-02` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-03` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-04` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-05` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-06` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-07` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-08` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-09` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-10` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-11` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-12` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-13` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-14` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-15` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-16` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-17` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-18` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-19` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-20` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-21` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-22` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | dashboard-and-application | dashboard-dropdown | Block family | `dashboard-dropdown-23` | Unclassified | Researching | Potential dashboard composition evidence; requires a governed task and item-level review. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-01` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-02` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-03` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-04` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-05` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-06` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-07` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-08` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-09` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-10` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-11` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-12` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-13` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-14` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-15` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-16` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-17` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-18` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-19` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-20` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-21` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-22` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-23` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Bento Grid | Bento Grid | Block family | `bento-grid-24` | Unclassified | Restricted | Marketing or low-risk summaries only; avoid novelty-driven operational layout. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Gallery | Block family | `gallery-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | `product-reviews-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | `product-reviews-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | `product-reviews-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | `product-reviews-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-reviews | Block family | `product-reviews-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | shopping-cart | Block family | `shopping-cart-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | shopping-cart | Block family | `shopping-cart-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | shopping-cart | Block family | `shopping-cart-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | shopping-cart | Block family | `shopping-cart-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | dashboard-and-application | multi step form | Block family | `multi-step-form-01` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | multi step form | Block family | `multi-step-form-02` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | dashboard-and-application | multi step form | Block family | `multi-step-form-03` | Unclassified | Preferred Candidate | Useful composition evidence after token, state, accessibility, responsive, performance, and business-logic normalization. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-06` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-07` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-08` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Footer | Block family | `footer-component-09` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-06` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-07` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-08` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-09` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-10` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-11` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | product-category | Block family | `product-category-12` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Navbar | Block family | `navbar-component-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Team | Block family | `team-section-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-04` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-05` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | category-filter | Block family | `category-filter-06` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Gift Card | Block family | `gift-card-01` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Gift Card | Block family | `gift-card-02` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | eCommerce | Gift Card | Block family | `gift-card-03` | Unclassified | Restricted | Storefront evidence only; production storefront is deferred and POS semantics differ. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-06` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-07` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-08` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-09` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-10` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-11` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-12` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-13` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-14` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-15` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-16` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-17` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-18` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-19` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-20` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-21` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-22` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-23` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Testimonials | Block family | `testimonials-component-24` | Pro | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | `register-01` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | `register-02` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | `register-03` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | `register-04` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |
| Shadcn Studio MCP | Marketing UI Components | Register | Block family | `register-05` | Unclassified | Restricted | Marketing/auth exploration only; never an operational workflow contract. |

## Complete Shadcn Studio component-library metadata inventory

Distinct from the block-family inventory above, Shadcn Studio also exposes a separate per-primitive component library (e.g. `button`, `dialog`, `select`) queried through the same metadata-only `get-component-meta-content` endpoint, one bare family slug at a time (no listing/catalog tool exists for this content type, unlike `get-blocks-metadata` for blocks). 54 candidate slugs were tried — the shadcn/ui primitive names plus a small number of common additions — on 2026-07-13, using the same authenticated credential and metadata-only calls as the block-family inventory (no source or install endpoint was called).

**28 families were found** with a total of **573 variant records**. **0 of these carry an explicit `isPro: true` tag** (0 — this component library's metadata does not appear to tag any variant Pro; absence of the tag is recorded as entitlement **unclassified**, not Free, consistent with the block-family findings). **44 variants carry an explicit `isAnimated: true` tag.**

**26 candidate slugs returned an explicit "Component not found" response** (a real, well-formed error from the server, not a parse failure) under the exact name tried: `alert-dialog`, `autocomplete`, `carousel`, `command`, `drawer`, `empty`, `field`, `hover-card`, `item`, `kbd`, `label`, `menubar`, `navigation-menu`, `progress`, `resizable`, `scroll-area`, `separator`, `sidebar`, `skeleton`, `slider`, `spinner`, `stepper`, `toast`, `toggle`, `toggle-group`, `typography`. This means Studio does not expose a separate component-gallery page under that specific slug — it does **not** mean Studio has zero coverage of that concept; a different naming convention was not exhaustively guessed, per the standing instruction not to invent unverified data. These remain **unverified**, not zero.

### Component-library family summary

| Source | Family | Variants | Pro-tagged | Animated-tagged | Dependencies observed | Recommendation | Rationale |
|---|---|---:|---:|---:|---|---|---|
| Shadcn Studio MCP | accordion | 16 | 0 | 0 | `lucide-react`, `radix-ui` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | alert | 30 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | avatar | 21 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | badge | 24 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | breadcrumb | 8 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | button | 55 | 0 | 17 | `class-variance-authority`, `lucide-react`, `motion` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | calendar | 25 | 0 | 0 | `little-date`, `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | card | 17 | 0 | 2 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | checkbox | 19 | 0 | 3 | `lucide-react`, `motion`, `radix-ui` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | collapsible | 10 | 0 | 1 | `lucide-react`, `react-payment-inputs` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | combobox | 14 | 0 | 2 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | data-table | 13 | 0 | 0 | `@dnd-kit/core`, `@dnd-kit/modifiers`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `@tanstack/react-table`, `lucide-react`, `papaparse`, `xlsx` | Researching | Visual gallery only; Meridian requires a custom enterprise-grid composite per ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md, not a Studio data-table variant. |
| Shadcn Studio MCP | dialog | 26 | 0 | 3 | `input-otp`, `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | dropdown-menu | 16 | 0 | 2 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | form | 10 | 0 | 0 | `@hookform/resolvers`, `date-fns`, `lucide-react`, `react-hook-form`, `sonner`, `zod@3.25.76` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | input | 46 | 0 | 0 | `lucide-react`, `react-aria-components` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | input-otp | 10 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | pagination | 15 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | popover | 15 | 0 | 3 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | radio-group | 15 | 0 | 2 | `lucide-react`, `motion`, `radix-ui` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | select | 38 | 0 | 2 | `lucide-react`, `react-aria-components` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | sheet | 7 | 0 | 0 | `@hookform/resolvers`, `@tanstack/react-table`, `lucide-react`, `react-hook-form`, `sonner`, `zod@3.25.76` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | sonner | 20 | 0 | 0 | `lucide-react`, `sonner` | Preferred Candidate | Toast/notification variant gallery for a pattern already governed at the official-registry level; item-level selection still requires full acceptance evidence. |
| Shadcn Studio MCP | switch | 20 | 0 | 2 | `lucide-react`, `motion`, `radix-ui` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | table | 16 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | tabs | 29 | 0 | 3 | `lucide-react`, `motion` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | textarea | 21 | 0 | 0 | `lucide-react` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |
| Shadcn Studio MCP | tooltip | 17 | 0 | 2 | `lucide-react`, `motion` | Preferred Candidate | Visual variant gallery of a primitive already Preferred Candidate via the official shadcn registry; item-level selection still requires full normalization and acceptance evidence. |

### Component-library candidate slugs not found

| Slug tried | Result |
|---|---|
| `alert-dialog` | Component not found (server-confirmed, not a parse error) |
| `autocomplete` | Component not found (server-confirmed, not a parse error) |
| `carousel` | Component not found (server-confirmed, not a parse error) |
| `command` | Component not found (server-confirmed, not a parse error) |
| `drawer` | Component not found (server-confirmed, not a parse error) |
| `empty` | Component not found (server-confirmed, not a parse error) |
| `field` | Component not found (server-confirmed, not a parse error) |
| `hover-card` | Component not found (server-confirmed, not a parse error) |
| `item` | Component not found (server-confirmed, not a parse error) |
| `kbd` | Component not found (server-confirmed, not a parse error) |
| `label` | Component not found (server-confirmed, not a parse error) |
| `menubar` | Component not found (server-confirmed, not a parse error) |
| `navigation-menu` | Component not found (server-confirmed, not a parse error) |
| `progress` | Component not found (server-confirmed, not a parse error) |
| `resizable` | Component not found (server-confirmed, not a parse error) |
| `scroll-area` | Component not found (server-confirmed, not a parse error) |
| `separator` | Component not found (server-confirmed, not a parse error) |
| `sidebar` | Component not found (server-confirmed, not a parse error) |
| `skeleton` | Component not found (server-confirmed, not a parse error) |
| `slider` | Component not found (server-confirmed, not a parse error) |
| `spinner` | Component not found (server-confirmed, not a parse error) |
| `stepper` | Component not found (server-confirmed, not a parse error) |
| `toast` | Component not found (server-confirmed, not a parse error) |
| `toggle` | Component not found (server-confirmed, not a parse error) |
| `toggle-group` | Component not found (server-confirmed, not a parse error) |
| `typography` | Component not found (server-confirmed, not a parse error) |

### Complete component-library variant identifiers (all 573)

Every variant record returned for a found family is listed individually. Each inherits its family's source, recommendation, and rationale from the summary table above.

| Source | Family | Variant identifier | Entitlement | Animated | Recommendation |
|---|---|---|---|---|---|
| Shadcn Studio MCP | accordion | `accordion-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | accordion | `accordion-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-26` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-27` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-28` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-29` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | alert | `alert-30` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | avatar | `avatar-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | badge | `badge-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | breadcrumb | `breadcrumb-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-26` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-27` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-28` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-29` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-30` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-31` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-32` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-33` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-34` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-35` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-36` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-37` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-38` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | button | `button-39` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-40` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-41` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-42` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-43` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-44` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-45` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-46` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-47` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-48` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-49` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-50` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-51` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-52` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-53` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-54` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | button | `button-55` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | calendar | `calendar-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | card | `card-16` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | card | `card-17` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-17` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-18` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | checkbox | `checkbox-19` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | collapsible | `collapsible-10` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-13` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | combobox | `combobox-14` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | data-table | `data-table-01` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-02` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-03` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-04` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-05` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-06` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-07` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-08` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-09` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-10` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-11` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-12` | Unclassified | No | Researching |
| Shadcn Studio MCP | data-table | `data-table-13` | Unclassified | No | Researching |
| Shadcn Studio MCP | dialog | `dialog-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-24` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-25` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | dialog | `dialog-26` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-15` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | dropdown-menu | `dropdown-menu-16` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | form | `form-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | form | `form-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-26` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-27` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-28` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-29` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-30` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-31` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-32` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-33` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-34` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-35` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-36` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-37` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-38` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-39` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-40` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-41` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-42` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-43` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-44` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-45` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input | `input-46` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | input-otp | `input-otp-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | pagination | `pagination-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-13` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-14` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | popover | `popover-15` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-14` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | radio-group | `radio-group-15` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | select | `select-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-26` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-27` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-28` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-29` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-30` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-31` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-32` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-33` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-34` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-35` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-36` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | select | `select-37` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | select | `select-38` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sheet | `sheet-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | sonner | `sonner-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-19` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | switch | `switch-20` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | table | `table-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | table | `table-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-22` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-23` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-24` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-25` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-26` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-27` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-28` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | tabs | `tabs-29` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-16` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-17` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-18` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-19` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-20` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | textarea | `textarea-21` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-01` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-02` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-03` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-04` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-05` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-06` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-07` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-08` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-09` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-10` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-11` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-12` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-13` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-14` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-15` | Unclassified | No | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-16` | Unclassified | Yes | Preferred Candidate |
| Shadcn Studio MCP | tooltip | `tooltip-17` | Unclassified | Yes | Preferred Candidate |

## Cross-cutting acceptance dimensions

Any item selected for a prototype must be separately reviewed for keyboard and focus behavior, semantics and screen readers, contrast, zoom, touch, reduced motion, RTL, responsive transformation, kiosk/POS density, offline and stale authority, semantic-token coverage, white-label safety, dependencies, hydration, virtualization, Storybook suitability, and AI-generation constraints.

## Provenance and credential boundary

This pass authenticated with a Shadcn Studio Pro credential already confirmed by the founder to be a previously-rotated, non-compromised key, supplied only through local MCP configuration (`API_KEY`/`EMAIL` environment variables) and never typed, pasted, or echoed into this repository, any commit, any document, or any conversation transcript. Only metadata-only, non-source-fetching endpoints (`get-blocks-metadata`, `get-block-meta-content`) were used; no install, collect, `/ftc`, or content-fetching endpoint was called. Credentials, private registry URLs, cookies, account details, and licensed source remain prohibited from commits, and none appear in this document or elsewhere on this branch (verified by a full-diff secret scan; see the PR's verification section).

A separate, unrelated `.codex/config.toml` MCP configuration for the same repository was **found on 2026-07-13** to store the identical credential value under the names `LICENSE_KEY`/`EMAIL` rather than `API_KEY`/`EMAIL`. Because the `shadcn-studio-mcp@1.0.7` package only recognizes `API_KEY` and `EMAIL` (confirmed by reading its `build/utils/config.js` source), a client configured with `LICENSE_KEY` does not authenticate — `isPro()` in that package requires both `apiKey` and `email` to be set, and `LICENSE_KEY` is never mapped to `apiKey`. This was recorded as a compatibility finding rather than fixed in that session; the founder has since reported correcting the local Codex configuration's variable name from `LICENSE_KEY` to `API_KEY` independently of this document. That correction has **not** been independently verified here — Codex has not yet been restarted and no controlled with/without-credential comparison (the same technique used to prove Claude's own authenticated access above) has been run against the corrected Codex configuration. Do not treat Codex-side Studio calls as authenticated until both of those happen; any prior or current claim that a Codex-side call succeeding proves authenticated Pro access remains unproven on its own.

## Recheck triggers

Re-run this inventory when the configured registry set changes, either MCP package changes, Studio metadata adds entitlement/version fields, the governed shadcn configuration changes, a candidate is proposed for Prototype Approved status, the `shadcn` MCP connector becomes reachable in-session (allowing direct comparison against the JSON-RPC workaround used here), or the Codex `LICENSE_KEY`/`API_KEY` naming discrepancy is resolved.
