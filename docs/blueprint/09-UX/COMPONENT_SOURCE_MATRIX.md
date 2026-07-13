---
document_id: PDA-UX-033
title: Component Source Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
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
- Studio documents Free and Pro modes and the `/cui`, `/iui`, `/rui`, and `/ftc` workflows and requires an initialized shadcn project: [Studio MCP documentation](https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server).
- Official shadcn documents MCP registry browsing, search, inspection, and installation through configured registries: [official shadcn MCP documentation](https://ui.shadcn.com/docs/mcp).
- Independent totals for pages, templates, themes, and animated/motion components beyond what is captured above remain **unverified**, not zero — the metadata-only endpoints used here do not expose a dedicated classification for those categories.

## Connector status (2026-07-13)

The official `shadcn` MCP server is configured in the Claude Code user-level config (`shadcn@4.13.0`, pinned) and its command was independently confirmed to work correctly when driven directly (see JSON-RPC evidence above). However, its tools did not load as an available Claude Code connector in this session. Investigation traced this to the running `claude.exe` host process itself carrying a stale, pre-migration snapshot of the MCP server configuration baked into its own process command line at launch time — meaning the desktop application has not yet picked up either the `shadcn` server addition or the later credential/version-pinning corrections made to `~/.claude.json`. This requires a full quit-and-relaunch of the desktop application (not just a new chat/session) to resolve, and is recorded as an open recheck trigger below. All official-registry evidence in this document was gathered as a workaround by driving the pinned package directly over stdio JSON-RPC, not through the (currently unreachable) Claude Code connector.

## Source-role matrix

| Source | Governed role | Allowed discovery | Prohibited shortcut | Default disposition |
|---|---|---|---|---|
| Platform-owned `@meridian/ui` | Canonical implementation after evidence gates | Existing components, stories, tests, owners | Assuming existence means current acceptance | Highest trust after acceptance |
| Official `@shadcn` | Primitive/component baseline | Metadata list and search | Treating a registry item or block as approved | Preferred Candidate |
| Shadcn Studio | Composition and visual exploration | Metadata and documented capabilities | Copying licensed source, installing wholesale, or importing hidden business logic | Researching/Restricted |
| AI-generated UI | Bounded prototype evidence | Task-specific exploration | Promotion without provenance and tests | Untrusted |
| Custom Meridian composite | Domain-specific behavior | Requirement and contract design | Reimplementing accessible primitives unnecessarily | Custom Required |

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

## Cross-cutting acceptance dimensions

Any item selected for a prototype must be separately reviewed for keyboard and focus behavior, semantics and screen readers, contrast, zoom, touch, reduced motion, RTL, responsive transformation, kiosk/POS density, offline and stale authority, semantic-token coverage, white-label safety, dependencies, hydration, virtualization, Storybook suitability, and AI-generation constraints.

## Provenance and credential boundary

This pass authenticated with a Shadcn Studio Pro credential already confirmed by the founder to be a previously-rotated, non-compromised key, supplied only through local MCP configuration (`API_KEY`/`EMAIL` environment variables) and never typed, pasted, or echoed into this repository, any commit, any document, or any conversation transcript. Only metadata-only, non-source-fetching endpoints (`get-blocks-metadata`, `get-block-meta-content`) were used; no install, collect, `/ftc`, or content-fetching endpoint was called. Credentials, private registry URLs, cookies, account details, and licensed source remain prohibited from commits, and none appear in this document or elsewhere on this branch (verified by a full-diff secret scan; see the PR's verification section).

A separate, unrelated `.codex/config.toml` MCP configuration for the same repository stores the identical credential value under the names `LICENSE_KEY`/`EMAIL` rather than `API_KEY`/`EMAIL`. Because the `shadcn-studio-mcp@1.0.7` package only recognizes `API_KEY` and `EMAIL` (confirmed by reading its `build/utils/config.js` source), a client configured with `LICENSE_KEY` does not authenticate — `isPro()` in that package requires both `apiKey` and `email` to be set, and `LICENSE_KEY` is never mapped to `apiKey`. This is recorded as a **compatibility finding, not a fix applied here**: the Codex configuration was left untouched and its credential value was not printed, migrated, or otherwise handled beyond this observation. Any prior claim that Codex-side tool calls against this package exercised authenticated Pro access should be treated as unproven until its configuration is corrected.

## Recheck triggers

Re-run this inventory when the configured registry set changes, either MCP package changes, Studio metadata adds entitlement/version fields, the governed shadcn configuration changes, a candidate is proposed for Prototype Approved status, the `shadcn` MCP connector becomes reachable in-session (allowing direct comparison against the JSON-RPC workaround used here), or the Codex `LICENSE_KEY`/`API_KEY` naming discrepancy is resolved.
