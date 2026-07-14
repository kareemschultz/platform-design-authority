---
document_id: PDA-IMPL-005
title: Ecommerce Dashboard and Shadcn Studio Candidate Audit
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0003, ADR-0005, ADR-0021, ADR-0022, ADR-0025]
review_evidence: []
---

# Ecommerce Dashboard and Shadcn Studio Candidate Audit

## 1. Executive verdict

The supplied Vercel application is **not a verified official Shadcn Studio template**. The evidence supports the exact provenance classification **Verified third-party derivative of Studio material**: the deployed bundle loads 29 URLs from `cdn.shadcnstudio.com`, exposes a distinctive sales-metrics composition that matches Studio's public `chart-sales-metrics.tsx` block and MCP metadata for `chart-component-01`, and runs outside Studio's official application/template preview domains. The exact author, source repository, complete block set, acquisition path, and deployment license remain unproven.

The live application is useful as visual and interaction research. It is not an acceptable source package or Meridian shell. It has good compact spacing, a clear page title, responsive stacking, readable action labels, a functional order filter, and several bounded composition ideas. It also has placeholder hash navigation, no visible tenant/organization/location/offline/entitlement context, no governed metric definitions or freshness, no URL-backed table state, inaccessible or weakly described charts, undersized targets, a mixed storefront/admin information architecture, and a 899,598-byte uncompressed single JavaScript asset. Its navigation model is rejected.

Studio is viable as a **candidate source**, not an authority. The Studio MCP genuinely worked in this Codex session for metadata and command generation, including Pro-tagged results. No Claude Code retrieval was required. No candidate was installed, no complete template was downloaded, and no licensed Studio output was written to the repository. Five exact one-item commands were generated for audit evidence only and were not executed because they use `@latest`, can write broad dependency/component diffs, and require the repository's acquisition gates.

The follow-up catalog sweep materially broadens that conclusion. The MCP returned 735 exact records across all 61 exposed block families and 595 exact records across 30 component families. Studio's public component catalog currently enumerates 58 families and 902 displayed variants; 28 newer family slugs were visible publicly but did not resolve through the MCP metadata endpoint used in this session. First-party template pages exposed 13 named landing/full-site templates and six named admin/application templates. The broader catalog contains several strong bounded references, but no additional full template or page displaces Meridian's current shell, context, authorization, offline, or domain contracts.

The current Meridian implementation is materially ahead of the demo on trust boundaries: the thin administration shell already has server-validated workspace context, canonical denial/offline/reauth states, two persistent navigation levels, semantic desktop tables plus mobile cards, Base UI-backed primitives, and cursor navigation. The useful gap is shared, governed composites and Storybook evidence—not another generic dashboard shell.

Recommended first prototype: a **ProductListToolbar + cursor-paginated responsive product list** for WS2, using the current shell and query-state model, with `datatable-component-06` only as a composition reference. Do not prototype a full dashboard first.

## 2. Scope, authority, and evidence method

This audit is read-only with respect to application and Studio source. It does not approve a component, dependency, template, metric, or product requirement. Evidence was collected on 2026-07-14 from current `main` at `1bda97d42293c1008412bc5cc346d781a2ab4e22`, the live demo, first-party Studio pages, the official Studio public repository, the official shadcn registry connector, the Studio MCP, the in-app browser, response headers, built assets, and targeted public GitHub search.

Repository authority was applied in this order: `CLAUDE.md`; `AGENTS.md`; Foundation/UX blueprint authorities; component acquisition, normalization, acceptance, source, and Studio policies; WS1/WS2 plans and evidence; current code and dependencies. The requested Mobbin UX Pattern Discovery Audit is absent from `docs/implementation` on current `main`; no statement attributed to that missing file is treated as repository evidence. No detailed WS2 execution plan is present; WS2 remains planned and blocked on WS1 exit in `PROGRAM_STATUS.md`.

The browser audit used visible UI interaction and DOM accessibility snapshots. It did not inject hidden application state. No automated axe/Lighthouse service was exposed. Contrast, actual operating-system screen-reader output, and actual 200% browser zoom therefore remain partially unverified; reflow at equivalent reduced CSS viewports was tested.

## 3. Tool and MCP verification

### 3.1 Available servers and authentication

| Server/connector | Exact exposed surface | Authentication/evidence | Use and limitation |
|---|---|---|---|
| `shadcn` | Official shadcn registry tools listed below | Public project registry read succeeded; project exposes `@shadcn` | Metadata/search/view/add-command/audit only; not Studio Pro content |
| `shadcn_studio` | Studio tools listed below | `get_blocks_metadata` and `get_block_meta_content` returned Pro-tagged application-shell records; add-command generation succeeded | Bounded metadata works in Codex. This proves interoperability in this session, not vendor support for large source payloads |
| `shadcn_studio_mcp` | Duplicate alias of the same Studio tool surface | Same configured Studio service; not separately exercised | Treat as an alias, not independent corroboration |
| `node_repl` | Persistent JavaScript kernel | Available; browser-client binding succeeded | Browser/devtools-style inspection available through the in-app browser; not Chrome DevTools Protocol source debugging |
| `codex_apps` / GitHub | Repository, issue, PR, review, CI/log, and file APIs listed below | Connected GitHub app present; authenticated user also verified with `gh` as `kareemschultz` | Read/write capable; this audit used local git/`gh` for discovery and the connector for PR creation |
| `codex_apps` / Sites | Site/version/deploy/access tools listed below | Connector exposed; authentication not exercised because no Sites task or `.openai/hosting.json` was in scope | Irrelevant to this audit; no site mutation |
| `codex_apps` / Spreadsheets document control | Connected-document session tools listed below | Connector exposed; no active document session requested or used | Irrelevant to Markdown audit |
| `codex_apps` / plugin management/hotline | Permission/dependency/uninstall and local hotline tools listed below | Exposed; authentication not exercised | Irrelevant and not invoked |
| `sites_design_picker` | `choose_site_design` | Exposed; authentication not exercised | Irrelevant and not invoked |
| Mobbin MCP | None | Not available | No Mobbin retrieval was possible |
| Figma MCP | None | Not available | Studio `parse_figma_blocks` is not a Figma MCP. `/ftc` remained disabled |

MCP resource discovery returned only connector/plugin resources for Default Templates, GitHub, and Sites; no additional parameterized MCP resources were exposed.

### 3.2 Exact exposed tool names

`shadcn`: `get_add_command_for_items`, `get_audit_checklist`, `get_item_examples_from_registries`, `get_project_registries`, `list_items_in_registries`, `search_items_in_registries`, `view_items_in_registries`.

`shadcn_studio` and duplicate alias `shadcn_studio_mcp`: `collect_selected_blocks`, `collect_selected_components`, `get_add_command_for_components`, `get_add_command_for_items`, `get_block_meta_content`, `get_blocks_metadata`, `get_component_content`, `get_component_meta_content`, `get_create_instructions`, `get_ftc_instructions`, `get_inspiration_block_content`, `get_inspire_instructions`, `get_refine_instructions`, `install_theme`, `parse_figma_blocks`.

`node_repl`: `js`, `js_add_node_module_dir`, `js_reset`.

`sites_design_picker`: `choose_site_design`.

`codex_apps` document control: `codex_document_control_execute_d_7437ad2e4ffa`, `codex_document_control_get_docum_83c7f0565c0f`, `codex_document_control_list_document_sessions`.

`codex_apps` GitHub: `github_add_comment_to_issue`, `github_add_issue_assignees`, `github_add_issue_labels`, `github_add_reaction_to_issue_comment`, `github_add_reaction_to_pr`, `github_add_reaction_to_pr_review_comment`, `github_add_review_to_pr`, `github_compare_commits`, `github_convert_pull_request_to_draft`, `github_create_blob`, `github_create_branch`, `github_create_commit`, `github_create_file`, `github_create_issue`, `github_create_pull_request`, `github_create_tree`, `github_delete_file`, `github_dismiss_pull_request_review`, `github_download_user_content`, `github_download_workflow_artifact`, `github_enable_auto_merge`, `github_fetch`, `github_fetch_blob`, `github_fetch_commit`, `github_fetch_commit_workflow_runs`, `github_fetch_file`, `github_fetch_issue`, `github_fetch_issue_comments`, `github_fetch_pr`, `github_fetch_pr_comments`, `github_fetch_pr_file_patch`, `github_fetch_pr_patch`, `github_fetch_workflow_job_logs`, `github_fetch_workflow_job_steps`, `github_fetch_workflow_run_artifacts`, `github_fetch_workflow_run_jobs`, `github_get_commit_combined_status`, `github_get_issue_comment_reactions`, `github_get_pr_diff`, `github_get_pr_info`, `github_get_pr_reactions`, `github_get_pr_review_comment_reactions`, `github_get_profile`, `github_get_repo`, `github_get_repo_collaborator_permission`, `github_get_user_login`, `github_get_users_recent_prs_in_repo`, `github_label_pr`, `github_list_installations`, `github_list_installed_accounts`, `github_list_pr_changed_filenames`, `github_list_pull_request_review_threads`, `github_list_pull_request_reviews`, `github_list_recent_issues`, `github_list_repositories`, `github_list_repositories_by_affiliation`, `github_list_repositories_by_installation`, `github_list_user_org_memberships`, `github_list_user_orgs`, `github_lock_issue_conversation`, `github_mark_pull_request_ready_for_review`, `github_merge_pull_request`, `github_remove_issue_assignees`, `github_remove_issue_label`, `github_remove_pull_request_reviewers`, `github_remove_reaction_from_issue_comment`, `github_remove_reaction_from_pr`, `github_remove_reaction_from_pr_review_comment`, `github_reply_to_review_comment`, `github_request_pull_request_reviewers`, `github_rerun_failed_workflow_run_jobs`, `github_rerun_workflow_job`, `github_resolve_review_thread`, `github_search`, `github_search_branches`, `github_search_commits`, `github_search_installed_reposito_be740b6e4965`, `github_search_installed_repositories_v2`, `github_search_issues`, `github_search_prs`, `github_search_repositories`, `github_unlock_issue_conversation`, `github_unresolve_review_thread`, `github_update_file`, `github_update_issue`, `github_update_issue_comment`, `github_update_pull_request`, `github_update_ref`, `github_update_review_comment`.

`codex_apps` Sites: `sites_add_custom_domain`, `sites_create_site`, `sites_create_source_repository_w_7e7b8ba6ef73`, `sites_deploy_private_site_version`, `sites_deploy_site_version`, `sites_generate_siwc_bypass_token`, `sites_get_deployment_status`, `sites_get_environment_variables`, `sites_get_site`, `sites_get_site_version`, `sites_list_custom_domains`, `sites_list_site_versions`, `sites_list_sites`, `sites_refresh_custom_domain_status`, `sites_remove_custom_domain`, `sites_save_site_version`, `sites_update_environment_variables`, `sites_update_site_access`, `sites_update_site_metadata`.

Other `codex_apps`: `hotline_get_local_hotline`, `plugin_management_get_app_permissions`, `plugin_management_get_plugin_dependencies`, `plugin_management_uninstall_app`, `plugin_management_update_app_permissions`.

## 4. Demo provenance

### 4.1 Direct findings

| Question | Evidence | Finding |
|---|---|---|
| Application title | Served HTML and browser title | `Vite + React + TS` |
| Framework | Single Vite client entry, Vite markers, client-only `#root` | React SPA built with Vite |
| React | Production bundle embeds `19.1.1` | React 19.1.1 |
| Vite | Vite build shape and title | Vite verified; exact version unverified |
| TypeScript | Title says `TS`; no source/source map | Likely TypeScript, not source-level verified |
| Tailwind | CSS banner | Tailwind CSS 4.1.13, MIT banner |
| shadcn/Studio | Studio CDN assets and exact public block content match | Studio-derived composition verified; exact shadcn package/version unverified |
| Primitive system | Ten rendered `data-radix-*` elements; no Base UI markers | Radix-backed primitives in the deployed UI; no evidence of a second primitive system in this bundle |
| Charts | `recharts` occurs 103 times in bundle; Recharts DOM classes render | Recharts verified; exact version unverified |
| Icons | `lucide` occurs 65 times | Lucide verified; exact version unverified |
| Routing | No React Router/BrowserRouter/HashRouter signatures; every observed link uses `#` | No real routing library observed; navigation is local UI/hash placeholders |
| State | Pagination changes rows without URL change; no Zustand signature | Local React state/mock arrays likely; exact state architecture unverified |
| Data | No app API/XHR observed; order rows/products are bundled mock values | Mock/static data |
| Analytics | No analytics host or tracking request observed | None observed; absence is not proof of none in every execution path |
| Images | Unsplash URLs, Studio CDN dashboard assets, Vite icon | Remote third-party imagery and Studio assets |
| Fonts | No font network request or `@font-face` in CSS | System/local fallback fonts |
| Client boundary | HTML is 464 bytes with empty root and script | Entire application is client rendered |
| Source maps | Bundle has no source-map marker; adjacent `.js.map` returns 404 | Not exposed |
| Public source | Exact hostname and unique-string GitHub searches returned no matching deployment repository | No public deployment source found |
| Package/comments | Minified bundle only; no package manifest/comments/template ID | Unavailable |
| Deployment | `Server: Vercel`; standalone Vercel hostname | Vercel deployment; owner and build pipeline unknown |

The closest repository-name search result, `Eng-Mohamad-hasan-hmedy/DashBoardEcommerce`, is a different React 18/MUI/AOS application and is rejected as provenance evidence.

### 4.2 Why the classification is not “official”

The live host is not a Studio template preview URL, has no Studio release/template identifier, and has no linked official source. Studio's official public repository contains the matching sales-metrics block, and the demo directly consumes Studio-hosted assets; that establishes derivation. It does not establish that Studio published, endorsed, licensed, or deployed this assembled application. Accordingly:

> **Provenance verdict: Verified third-party derivative of Studio material.**

## 5. Runtime architecture and source-level limits

The application ships one 899,598-byte JavaScript asset and one 74,761-byte CSS asset, both with `Cache-Control: public, max-age=0, must-revalidate`. No route-level chunking was observed. All dashboard regions, Recharts, Radix behavior, mock data, filters, and navigation hydrate on the client. The HTML contains no server-rendered page content.

The runtime uses React 19.1.1, Tailwind 4.1.13, Recharts, Lucide, and Radix-backed components. It does not expose source maps. Vite, TypeScript, exact package versions other than React/Tailwind, lockfile quality, error boundaries, source component boundaries, test coverage, unsafe HTML, dependency vulnerabilities, arbitrary Tailwind values, and unused dependencies are **unverified**. A dependency/security scan was not meaningful without a lawful source tree and lockfile.

The only fetch-like bundle match belonged to runtime/preload behavior; browser asset/network observation showed static assets and remote images, not an application API. No secrets were observed, but a minified client-bundle review is not a secret audit.

## 6. License and lawful-source status

The deployed bundle and Vercel page provide no license or redistribution grant. Public delivery is not permission to copy, de-minify, or redistribute the assembled application. The lawful-source verdict for the deployment is therefore **unavailable/unverified**.

Studio's current first-party license page distinguishes free material from paid resources. It describes free material as MIT plus Commons Clause restrictions and prohibits unmodified resale/redistribution or competing products. Paid Basic/Pro resources may be used and modified in end products but may not be redistributed separately or shared outside licensed access. The official public GitHub repository reports a non-standard “Other” license. Every retained candidate therefore needs an acquisition record with exact item, plan, retrieval date, license text/version, license holder, source command, generated files, and redistribution assessment.

Meridian may use a lawfully acquired Studio block inside an end product only after legal/provenance review and normalization. It may not commit license credentials, mirror Studio catalogs, publish vendor source as a standalone component library, or infer that the public deployment grants rights. The generated MCP commands were evidence only.

## 7. Screenshot hypotheses and verified findings

1. **Three stacked bands:** verified. The desktop has a global identity/search header, a horizontal primary-navigation band, and a breadcrumb/action band. The breadcrumb is contextual, not a third persistent navigation level, but the combined chrome is visually dense. Adding Meridian context as a fourth band would be unacceptable.
2. **Navigation mix:** Dashboard, Products, Orders, Customers, and Marketing are buttons/dropdown groups; Reports and Settings are hash links. Products opens All Products, Add Product, Categories, and Inventory. Destinations and disclosure controls are mixed, and current-route state is weak.
3. **No trusted context:** verified. No tenant, organization, location, environment, offline, stale, permission, or entitlement state is visible. “ShopNow” is branding, not a server-validated workspace context.
4. **Mixed KPI periods:** verified. Cards mix month, week, and prior-month comparisons without a shared range, definition, freshness timestamp, baseline, or drill-down URL. Text plus signs reduce reliance on color, but trend semantics are still not programmatically explained.
5. **Revenue target:** verified as ambiguous. “Plan completed 56%” and “Sales plan 54%” appear together without numerator, denominator, currency, time basis, source, or text/table alternative. A governed progress bar would communicate this bounded value more honestly than a donut.
6. **Popular products and transactions:** static decorative summaries. They have no freshness, pagination, permission boundary, inspection action, or record links. “Refund Processing +$45.00” is semantically suspect.
7. **Generic Admin identity:** verified. “John Doe / Admin” conflates authentication, person display, role, and access. There is no membership, entitlement, tenant, organization, or location model.
8. **Action hierarchy:** Add Product and View Orders have similar prominence. Neither demonstrates capability/permission/entitlement denial, confirmation, idempotency, or safe disabled/unavailable behavior.

## 8. Navigation review

| Concern | Demo behavior | Meridian rule | Conflict | Adaptation |
|---|---|---|---|---|
| Global header | Brand, search, three unnamed icon buttons, generic user menu | Trusted identity plus visible context and accessible actions | Missing context/names | Keep compact geometry; replace content with Meridian identity/context contracts |
| Primary navigation | Horizontal mixed buttons and hash links | Maximum two persistent levels; current route evident | Mixed semantics and fake routes | Use current Meridian shell/navigation, not demo IA |
| Nested menus | Products submenu; other groups implied | One bounded nested level | Depth is bounded, but destination/action roles are unclear | Govern every item as link, action, or disclosure |
| Breadcrumbs | Home / Products / disabled current item | Contextual aid, not primary navigation | Hash links and stale “Products” context on dashboard | Derive from real route metadata |
| Contextual actions | Add Product and View Orders in chrome | Permission/entitlement-aware, task hierarchy | Equal weight; no denial model | One primary task and contextual secondary link |
| Search | Opens command-palette dialog | Search cannot be sole path; keyboard and focus restoration required | Escape closes but focus returns to `BODY`, not trigger | Use canonical GlobalSearch/CommandPalette contract |
| Account menu | “John Doe / Admin” | Separate identity, Party, membership, role, permission, entitlement | Conflation | Show identity/membership/context separately; never infer access from role label |
| Context switcher | None | Visible server-derived tenant/org/location context | Critical absence | Integrate into existing workspace context area/header, not another band |
| Mobile navigation | Primary nav becomes a Menu button; breadcrumb/actions remain | Preserve current context and task | Transformation is understandable but context remains absent | Current Meridian sheet pattern with active route and context summary |
| Tabs | New/Pending/Shipping cards visually resemble tabs; selected item reported `tabindex=-1` | Roving focus and URL-backed meaningful views | Keyboard/state semantics suspect | Use governed Tabs only for peer views; route/filter state in URL |
| Recent/favorites | None | Optional productivity enhancement | Missing, not a blocker | Add only from evidence, never template filler |
| Command palette | Search dialog with combobox and suggestions | Accessible escape, focus restoration, result authorization | Focus restoration defect; authorization unknown | Canonical palette filters results server-side/client-safe |
| Current route | Dashboard visual selection; all URLs remain `#` | URL is shareable and back/forward works | Fails | Real Next routes and search params |
| URL state | Table page 1→2 changes rows but URL remains `/#` | Filters/sort/page state shareable where useful | Fails | Cursor/search state encoded through governed Next URL contract |
| Permission-hidden | No evidence | Hidden only when disclosure itself is sensitive; denial otherwise explicit | Unverified | Use current canonical denial states |
| Entitlement unavailable | No evidence | Distinct from permission denial | Unverified | Preserve current `EntitlementUnavailableState` |

**Navigation verdict: Reject navigation model.** Selected header density, mobile Menu transformation, and action-bar spacing may be visual research only.

Tenant/org/location context can be added without convoluting the shell only by replacing—not stacking—demo chrome: use Meridian's existing global header and workspace context, keep one primary navigation level, and retain breadcrumbs as contextual page content.

## 9. Accessibility review

Positive evidence:

- `html` language is English.
- Header, main, footer, main navigation, breadcrumb navigation, and pagination landmarks are exposed.
- Products menu opens and closes with Escape.
- The command palette exposes a dialog and focused search combobox.
- Order headers are semantic column headers; meaningful product/customer images generally have alt text.
- No-results filtering produces the explicit text “No orders found.”

Material findings:

- Three icon-only header buttons have empty accessible names.
- Command-palette Escape returns focus to `BODY`, not the invoking control.
- The heading outline jumps from one H1 to H3 for Recent Orders; major card regions are generic text rather than headings.
- Two hidden/portal “Command Palette” H2 nodes remain in the accessibility snapshot while closed.
- The chart exposes one generic `application` region without a useful accessible name; Recharts renders dozens of nodes but only two SVG title/description pairs. No data-table alternative or metric description is associated with the chart.
- The order table has no caption.
- Menu controls measured about 24×24 CSS pixels, footer social targets about 20×20, and sortable table-header buttons about 20 pixels high. These miss Meridian's preferred 40-pixel target and create WCAG 2.2 target-size risk.
- The selected order-status tab was observed with `tabindex=-1`; full arrow-key tab behavior was not proven.
- No `prefers-reduced-motion` rule exists in the 74,761-byte stylesheet.
- Trend arrows and chart colors are not backed by exposed definitions. Contrast was not fully computed, so conformance is unverified rather than failed.
- All 30 inspected links used `#`; keyboard activation cannot provide meaningful navigation or back behavior.

Actual screen-reader speech, high-contrast mode, forced colors, full keyboard order, tooltip keyboard access, and automated axe results remain unverified. The available evidence is enough to conclude: **accessibility verdict: not acceptable as-is; bounded visual research only**.

## 10. Responsive review

| Viewport | Result |
|---|---|
| 360×800 | No document-level horizontal overflow; primary nav collapses to Menu; cards stack into a 7,245-pixel page; 1,112-pixel order table remains in an internal horizontal scroller |
| 768×1024 | No document-level overflow; mobile navigation remains; long 6,210-pixel page; same wide table scroller |
| 1024×768 | Full horizontal nav returns; table is 1,112 pixels wide inside clipped/scrolling container; document height 3,239 pixels |
| 1280×800 | Full nav; table fits container at about 1,215 pixels; document height 3,136 pixels |
| 1440×900 | Stable centered max-width layout; table about 1,231 pixels |
| 1920×1080 | Stable centered max-width layout; unused outer width grows; table remains about 1,231 pixels |
| 200% zoom | Browser automation exposed viewport sizing, not a browser zoom control. Equivalent reduced-CSS-width reflow was covered at 768 and 360; true 200% zoom remains unverified |

Responsive stacking prevents page overflow, but it does not preserve efficient order-management work on phone: the entire desktop table is merely horizontally scrollable, the page becomes extremely long, and no priority-column/card transformation is provided. Long translated labels were not present and were not fabricated. Loading, error, stale, partial, offline, and permission states are absent/unreachable in the static demo. Empty order data is not externally controllable; the supported search no-results state is clear but leaves pagination controls with only Previous/Next labels and no result summary. Print/export controls are absent.

**Responsive verdict: visually reflows, but operational task preservation is insufficient for Meridian.**

## 11. Dashboard and analytics review

| Region / candidate | Source | User task and required contract | A11y/responsive/freshness/access implications | Runtime cost | Recommendation |
|---|---|---|---|---|---|
| Five KPI cards | Demo; Studio-like statistics | No defined decision. Requires metric ID, definition, scope, period, baseline, unit, freshness, quality, drill-down | Explicit trend text, semantic heading, stale/partial state, authorized aggregate; stack 1/2/5 columns | Low individually | Reject current content; prototype one governed `MetricCard` |
| Sales metrics card | Exact Studio public block family; `chart-component-01` metadata | Compare sales/profit/orders for a declared scope/range | Named chart, keyboard tooltip or direct labels, table alternative, freshness, aggregate permission | Recharts in initial bundle | Composition reference only |
| Revenue target donut | Demo/Studio sales metrics | Assess progress against governed target | State numerator/denominator/range; text alternative; avoid color-only precision | Recharts | Replace with governed progress/variance component |
| Popular Products | Demo | Identify products needing action, not “popular” decoration | Ranking definition, scope, freshness, image fallback, drill-down authorization | Remote images | Adapt only as `ProductRankingList` tied to replenishment/exception task |
| Recent Transactions | Demo | Investigate recent financial/commerce events | Signed amount semantics, status, currency, permission, cursor, inspection action | Low | Reject as dashboard filler; use domain-owned activity list later |
| Recent Orders table | Demo local table | Search/inspect orders | Caption, priority mobile representation, cursor URL state, loading/error/stale/partial, row permission | Medium; shipped eagerly | Useful composition reference, not WS2 inventory contract |
| Order status cards | Demo | Monitor pipeline | Status taxonomy, counts, filters, route state, permission | Low | Reject until Order Management owns contract |
| Top products lists | Demo | Duplicate of Popular Products | Same issues plus duplicated hierarchy | Remote imagery | Reject duplicate widget |
| Add Product | Demo | Create product | Capability `catalog.products`, permission, entitlement, validation, idempotency | Low | Keep task concept; use WS2 governed route/form |
| View Orders | Demo | Navigate to orders | Real route, availability and permission | Low | Outside WS2 unless order work is active |
| Global/date filters | None | Scope every metric | Required for comparability and URL state | Unknown | Custom Meridian required |
| Query states | Only no-results | Recover and judge data | Canonical loading/empty/no-results/error/offline/stale/partial | None | Reuse current Meridian query-state model |

The KPI cards are decorative because they do not support a governed decision or drill-down. Metric freshness and definitions are not visible. The chart is not acceptably accessible. The page resembles back-office ecommerce administration, but its mock data, consumer storefront footer, generic commerce taxonomy, and absent trust boundaries make it unsuitable as a back-office implementation.

## 12. Code-quality, dependency, and performance review

### 12.1 What can be concluded

- The single client bundle is large for an initial admin dashboard and eagerly includes chart/table/menu behavior.
- Remote Studio and Unsplash imagery adds privacy, CSP, availability, and performance dependencies.
- Pagination and filters are local-only; browser back/forward and shareable state fail.
- Static mock data eliminates meaningful loading/error/offline/stale behavior.
- A full storefront footer and admin navigation coexist, indicating component/IA assembly rather than a coherent back-office boundary.
- The app has no server-rendered content and therefore pays full client boot/hydration cost for every region.
- CSS contains Tailwind 4.1.13 but no reduced-motion media rule.

### 12.2 What cannot be concluded

Without source and lockfile, exact dependency versions, duplicated dependencies, unused packages, monolithic component boundaries, TypeScript strictness, error boundaries, unsafe HTML, raw colors, hard-coded spacing, tests, lint/typecheck/build status, licensing headers, and security advisories remain unverified. This is not a clean code audit.

**Performance verdict: high initial-bundle and external-asset risk; no benchmark or production budget evidence.**

## 13. Current Meridian baseline

Current `main` uses Next.js 16.2, React 19.2.7, Tailwind, shadcn 4.13.0 with `base-rhea`, Base UI 1.6.0, Lucide, TanStack Query, and TanStack Form. Product UI primitives live in `packages/ui-web/core`; the product surface does not mix Radix into its governed primitive package merely because unrelated workspace packages have transitive Radix dependencies.

The real administration route has a global header, a visible server-validated workspace-context band, and one administration navigation level. It distinguishes loading, empty, denied, entitlement unavailable, offline, reauthentication, step-up, approval, retry, and query failures. Desktop semantic tables transform to mobile cards and use cursor navigation. `/dashboard` redirects to `/administration`; an orphaned dashboard component only renders `API: privateData` and is not a real analytics surface.

There is no Storybook and no approved shared composite catalog for the candidates in this audit. Formal WS1 accessibility evidence is still pending PR9. These are the relevant gaps.

## 14. Official Studio ecosystem verification

| Studio source | What it contains/access | Build impact | Meridian use | Prohibited use |
|---|---|---|---|---|
| Component variants | Copyable primitive variants; free and premium; Radix/Base UI pages | Copied code/dependencies affect build | Candidate details after primitive compatibility review | Treating variants as governed primitives automatically |
| Animated variants | Motion-enhanced component code | Adds CSS/motion/runtime | Marketing or justified feedback only | Default operational motion; ignoring reduced motion |
| Blocks | Bounded page/composite code; free/Basic/Pro registries | Direct file/dependency writes via CLI | One-at-a-time composition research | Bulk mirroring or complete app generation |
| Page templates | Complete marketing/page projects | Broad architecture and dependency impact | Visual/IA research; isolated licensed prototype | Dropping into `apps/web` |
| AdminCN template | Pro downloadable Next.js admin source; Free AdminCN also announced | Full-app architecture | Bounded pattern comparison | Replacing Meridian shell/authorization architecture |
| CommerceO template | Pro e-commerce admin source, preview, product/order/customer/vendor pages | Full-app architecture | WS2 page-flow and list/detail research | Assuming its “API ready” model satisfies Meridian contracts |
| Dashboard/application families | Shells, charts, statistics, widgets, dialogs, dropdowns, forms, sidebars | Copied blocks and dependencies | Bounded composites | Generic dashboard filler |
| Ecommerce families | Product overview/quick view/category/list, cart, checkout, reviews, order summary | Copied consumer and admin code | Separate consumer research from admin | Calling checkout POS or product cards inventory ledgers |
| Datatable families | TanStack Table-oriented components | Adds table/export dependencies | Toolbar/table composition prototype | Importing XLSX/CSV dependencies without requirement |
| Theme generator | CSS variables/presets; free/pro | Changes design tokens/build CSS | Research only against Meridian semantic tokens | Applying vendor theme over governed tokens |
| Drag-and-drop builder | Visual page composition and export/install commands | Exported project can affect build | Disposable marketing prototypes | ERP/dashboard authority |
| Figma UI kit/plugin | Design assets and code transfer; plan-dependent | Development workflow; generated output can affect build | Design exploration under license | `/ftc` without Figma MCP and explicit request |
| IDE extension | Search/preview/install/visual edit; free/pro access | Development workflow and resulting code | Discovery only | One-click production installation |
| Studio MCP | `/cui`, `/iui`, `/rui`, `/ftc`; free/pro | Metadata itself none; generated/install output affects build | Exact one-block metadata/retrieval | Bulk generation; credential exposure |
| Documentation | Setup, admin-template, component, integration guidance | None directly | First-party factual evidence | Treating claims as implementation evidence |
| Help center/support | Purchase/integration support | None | Escalation path | Architecture authority |
| Community videos | First-party and third-party submitted video links | None until code copied | Optional learning index | Treating community videos as verified technical authority |
| Roadmap | Linked GitHub project | None | Directional only | Treating planned work as shipped |
| Free/Pro changelog | Version/date/category/resource updates in separate tabs | None directly | Release-communication pattern | Reusing commercial segmentation for Meridian roles |

Studio says individual Pro resources are downloaded separately, registries use CLI v4, credentials belong in ignored environment variables, and new blocks become visible through the MCP service. Those are vendor statements; a future acquisition must capture exact output and license at retrieval time.

## 15. Admin Dashboard Template architecture

First-party AdminCN/CommerceO pages and admin documentation verify this declared stack: Next.js 16 App Router, React, strict TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query, TanStack Table, React Hook Form, Zod, Recharts, Zustand, nuqs, date-fns/React Day Picker, Lucide, Sonner, ESLint, and Prettier. Public documentation describes route groups, reusable layouts, configuration-driven navigation, responsive light/dark modes, forms, charts, tables, and replacing demo data with APIs. CommerceO declares real fetch patterns through TanStack Query, but source was not downloaded, so that claim and error/loading/auth implementation remain unverified.

Studio's 2026-07-06 Pro changelog says Base UI became the default for blocks and components. Public component pages advertise both Base UI and Radix. The exact primitive implementation of every AdminCN/CommerceO file is unverified without the licensed source; do not infer “Base UI only.”

| Template dependency | Meridian disposition |
|---|---|
| Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Lucide, Sonner | Already selected by Meridian; normalize to pinned repo versions/config |
| Base UI | Already selected by ADR-0022 |
| TanStack Query | Already selected |
| Zod | Already used for contracts; UI validation placement still follows package ownership |
| TanStack Table | Compatible candidate for enterprise tables; requires isolated evidence and technology-ledger/ADR disposition before selection |
| Recharts | Compatible chart candidate only; requires accessibility/performance comparison and technology decision |
| nuqs | Useful only if it adds value beyond Next search-param handling; requires a demonstrated URL-state need and technology disposition |
| React Hook Form | Duplicate of Meridian's selected TanStack Form concern; reject from shared stack absent a new decision |
| Zustand | Duplicate/unproven global client-state concern; reject absent a concrete state model that existing React/Query boundaries cannot satisfy |
| date-fns, React Day Picker | Useful only inside a validated date-range requirement; do not inherit automatically |
| Template theme customizer | Reject for product runtime; Meridian tokens/configuration remain authoritative |
| Template auth/mock/API conventions | Replace completely with Meridian authentication, tenant context, permissions, entitlements, contracts, and query states |

## 16. Studio candidate matrix

Retrieval date for every row is 2026-07-14. “Pro” reflects MCP/page metadata, not a legal conclusion. No source was retained.

| Candidate | Exact identifier / source | Class and plan | Dependencies/evidence | Effort | Status |
|---|---|---|---|---|---|
| CommerceO admin template | `commerceo`; authenticated Pro download page | Complete Next.js 16 template, Pro | TanStack Query/Table, Zustand, nuqs, RHF/Zod, Recharts, Lucide, Sonner | Very high | Useful Composition Reference |
| AdminCN admin template | `admincn`; authenticated Pro download page | Complete template, Pro | Same declared stack; 6 layouts/9 dashboards/6 apps | Very high | Useful Composition Reference |
| Ecommerce application shell | `application-shell-15`; Studio MCP | Block/page, Pro | Lucide, react-use; avatar/badge/breadcrumb/button/card/collapsible/command/dropdown/input-group/navigation-menu/separator/sheet/tabs | High | Needs Isolated Prototype |
| Financial status cards | `statistics-component-12`; Studio MCP | Component/block; plan metadata not classified | Lucide; badge/card/utils | Medium | Strong Candidate |
| Operational KPI segments | `statistics-component-18`; Studio MCP | Component/block | Card/tooltip/utils; custom category bar | Medium | Useful Composition Reference |
| Weekly comparisons | `statistics-component-21`; Studio MCP | Component/block, Pro | Chart dependencies | High | Useful Composition Reference |
| Sales metrics block | `chart-component-01`; Studio MCP + official public repo | Component/block, public source present | Lucide; avatar/card/chart; exact demo composition match | High | Useful Composition Reference |
| Chart plus table | `chart-component-47`; Studio MCP | Page/component | date-fns, Lucide; card/chart/table/utils | High | Needs Isolated Prototype |
| Date-range metrics | `chart-component-41`; Studio MCP | Component, Pro | Chart/date-range dependencies | High | Useful Composition Reference |
| Product management datatable | `datatable-component-06`; Studio MCP | Page/component | TanStack Table, Lucide, PapaParse, XLSX, many primitives | High | Needs Isolated Prototype |
| Product analytics datatable | `datatable-component-07`; Studio MCP | Page/component | TanStack Table, charts, PapaParse, XLSX | Very high | Rejected |
| Product quick view | `product-quick-view-02`; Studio MCP | Ecommerce component | Lucide, react-aria-components; button/carousel/dialog/badge | High | Consumer Ecommerce Only |
| Product quick views | `product-quick-view-01` through `-05`; Studio MCP family | Ecommerce components | Consumer cart/detail dialog patterns | High | Consumer Ecommerce Only |
| Product overview | `product-overview-10`; Pro changelog/public preview | Ecommerce block | Exact code/deps not inspected | Unknown | Insufficient Evidence |
| Product category | `product-category-13`; Pro changelog/public preview | Ecommerce block | Exact code/deps not inspected | Unknown | Consumer Ecommerce Only |
| Dashboard empty states | `empty-state-09`, `empty-state-10`; Pro changelog/public preview | Dashboard/application blocks | Exact code/deps not inspected | Medium | Useful Composition Reference |

No Studio candidate directly satisfies a back-office inventory-by-location ledger, variant matrix, permission-denied state, entitlement-unavailable state, session list, audit timeline, or row inspector. Those are **Custom Meridian Required**.

## 17. Demo-versus-Studio comparison

| Concern | Supplied demo | Better Studio evidence | Meridian decision |
|---|---|---|---|
| Provenance | Unlicensed standalone bundle, verified Studio-derived | Official MCP metadata/public repo/licensed template pages | Acquire only exact items through governed process |
| Framework | Vite SPA, client-only | AdminCN/CommerceO use Next.js 16 App Router | Keep current Meridian Next architecture |
| Primitives | Radix rendered | Current Studio defaults Base UI but supports both | Keep ADR-0022 Base UI configuration |
| Context/auth | Generic Admin label | Templates claim auth/settings patterns, source unverified | Keep Meridian server-derived context/authorization |
| URL state | None | Admin template declares nuqs | Prove requirement; prefer existing Next route/search contracts first |
| Tables | Local mock, page-number state | `datatable-component-06` and CommerceO use TanStack Table | Prototype bounded WS2 list; keep cursor/API contracts |
| Analytics | Ambiguous sales filler | `statistics-component-12`, `chart-component-47` are better bounded structures | Custom metric contract and accessible frame |
| Inventory | Generic Products/Inventory menu only | CommerceO has inventory pages; exact contracts unknown | WS2 domain-owned custom composites |
| States | No-results only | Studio empty-state blocks exist | Reuse current Meridian canonical state family |
| Performance | One 899 KB client asset | Template source may support route splitting, unverified | Enforce budgets in retained prototype |

## 18. Cross-source evidence matrix

Mobbin evidence is marked unavailable because its requested audit file is not on current `main` and no Mobbin connector exists.

| Meridian need | Demo pattern | Mobbin evidence | shadcn primitive | Studio candidate | Existing Meridian implementation | Final recommendation |
|---|---|---|---|---|---|---|
| ApplicationShell | Three-band header/nav/actions | Unavailable | Sheet, navigation menu, breadcrumb | `application-shell-15` | Real WS1 shell/context/nav | Keep Meridian; prototype only mobile/header composition |
| ContextSwitcher | None | Unavailable | Dropdown/command | No exact fit found | `WorkspaceContextBand` | Custom Meridian |
| PrimaryNavigation | Horizontal mixed nav | Unavailable | Navigation Menu/Sheet | `application-shell-15` | Administration nav | Keep current model |
| Breadcrumbs | Hash breadcrumb | Unavailable | Breadcrumb | shell dependency | Route-derived admin breadcrumb | Normalize existing |
| GlobalSearch | Search trigger | Unavailable | Command/Dialog | shell command dependency | Not implemented | Custom contract later |
| CommandPalette | Dialog/combobox | Unavailable | Command/Dialog | `application-shell-15` | Not implemented | Bounded custom candidate |
| MetricCard | Five KPIs | Unavailable | Card/Badge | `statistics-component-12` | None | Prototype governed card |
| AccessibleChartFrame | Unnamed Recharts app | Unavailable | Chart/Card/Table | `chart-component-47` | None | Custom Meridian wrapper |
| DateRangeFilter | None | Unavailable | Popover/Calendar | `chart-component-41` | None | Custom after metric need |
| ProductRankingList | Popular Products | Unavailable | Card/List | CommerceO; no exact block selected | `ResponsiveList` pattern | Custom task-based list |
| RecentTransactionsList | Static filler | Unavailable | Card/Table | none exact | `ResponsiveList` pattern | Domain-owned later |
| ProductListToolbar | Search only | Unavailable | Input/Select/Button | `datatable-component-06` | Query/list patterns | First WS2 prototype |
| CursorPagination | Numbered local pages | Unavailable | Button/navigation | datatable uses page numbers | Existing cursor next behavior | Extend current governed pattern |
| ProductVariantMatrix | None | Unavailable | Table/Input | CommerceO pages only | None | Custom Meridian |
| InventoryByLocation | Menu label only | Unavailable | Table/Card | No exact fit | None | Custom Meridian |
| RowInspector | Order actions only | Unavailable | Sheet/Dialog/Tabs | quick view is consumer-only | None | Custom Meridian inspector |
| ActivityTimeline | Transactions filler | Unavailable | Card/List | no exact fit | Audit list page | Custom domain composite |
| PermissionDeniedState | None | Unavailable | Alert/Card | no fit | Implemented query state | Reuse current |
| EntitlementUnavailableState | None | Unavailable | Alert/Card | no fit | Implemented query state | Reuse current |
| SessionList | None | Unavailable | Table/Card | AdminCN claims settings | Implemented administration page | Keep current |
| AuditTimeline | None | Unavailable | Table/Card | AdminCN generic pages | Implemented audit list | Extend current, not Studio |

## 19. Meridian adaptation proposal

What may survive from selected candidates:

- compact card density and clear label/value hierarchy;
- a bounded header/search/action composition;
- list/table toolbar grouping;
- chart-plus-summary-table composition;
- responsive collapse from broad toolbar to explicit controls;
- dialog/sheet progressive disclosure for inspection.

What must be replaced:

- all branding, copy, colors, typography, spacing, radii, icons, chart palette, imagery, and fake data;
- the demo navigation and storefront footer;
- Radix-specific APIs where Meridian uses Base UI-backed shadcn primitives;
- template auth, role labels, tenant assumptions, entitlement assumptions, API calls, state management, tracking, motion, and dependencies;
- local page-number state and every `#` link;
- inaccessible chart and tooltip behavior.

Every implementation must use Meridian semantic tokens, `@meridian/ui-web`, governed APIs, server-derived context, real permissions/entitlements, canonical query states, synthetic Storybook data, and responsive/accessibility evidence before lifecycle promotion.

## 20. Rejected patterns

Reject permanently unless a future governed requirement explicitly supersedes this audit:

- copying the supplied bundle or complete dashboard/template;
- the demo's horizontal mixed button/link navigation model;
- a fourth persistent context/chrome band;
- a runtime theme customizer in the operational product;
- role text such as “Admin” as authorization evidence;
- local-only/hash URL state for filters or pagination;
- dashboard metrics without definition, scope, freshness, quality, owner, and decision/drill-down;
- donut charts for a single bounded target when text/progress is clearer;
- consumer quick-view/cart/checkout blocks as POS, catalog administration, or inventory ledgers;
- storefront footer content in an authenticated admin shell;
- remote stock photography in operational records;
- `PapaParse`/`xlsx` exports inherited from a table block without an export requirement and data-governance review;
- Zustand, React Hook Form, nuqs, Recharts, or TanStack Table adoption by template inheritance;
- Studio `@latest` commands in a reproducible implementation PR;
- generic animated variants without reduced-motion and task evidence.

## 21. Five-candidate isolated prototype shortlist

| Prototype | Exact source candidate | User task / learning | Dependencies and effort | Key risk | Acceptance criteria | Delete/reject when |
|---|---|---|---|---|---|---|
| 1. Shell/navigation comparison | `application-shell-15` | Verify whether selected header/mobile-menu composition improves current shell without adding depth | Many shadcn primitives, Lucide, react-use; high normalization | Context loss, primitive mismatch, bundle growth | Two persistent levels; context always visible; real URLs; focus restoration; 360–1920 and 200%; no extra state package | Requires third band, hides context, or duplicates current shell without measurable benefit |
| 2. Governed MetricCard | `statistics-component-12` | Communicate one metric with period, baseline, freshness, quality, and drill-down | Card/Badge/Lucide; medium | Decorative metric and color-only status | Typed metric contract; accessible trend; stale/partial states; synthetic Storybook stories; no chart dependency | No owned decision/drill-down or comparison cannot be defined |
| 3. AccessibleChartFrame | `chart-component-47` | Test chart + summary table, keyboard descriptions, resize, and reduced motion | Recharts/date-fns plus Card/Chart/Table; high; requires technology disposition | Accessibility and initial bundle | Named figure; text/table equivalent; non-color encoding; tooltip keyboard path; route-level loading; performance budget | Recharts cannot meet evidence/budget or table alone serves task better |
| 4. Product list/filter/cursor | `datatable-component-06` as composition reference only | WS2 search/filter/sort/select/inspect products with stable URL/cursor state | TanStack Table candidate; explicitly exclude PapaParse/XLSX; high | Desktop-table bias, export leakage | Server cursor contract; URL filters; mobile cards/priority columns; canonical states; permission/entitlement; Storybook and browser tests | Requires client-only full dataset, numbered offset paging, or unapproved export deps |
| 5. Product/inventory inspector | `product-quick-view-02` as a negative/structural reference plus official shadcn Sheet/Dialog | Inspect variant, stock by location, reservations, and activity without consumer cart assumptions | Meridian custom composite; medium/high | Consumer leakage, stale mutations | Read-only first; visible product/context IDs; stock freshness; tabs/sections; deep link; permission and stale/partial behavior | Retains cart/price-marketing carousel semantics or obscures ledger/location provenance |

Generated, not executed, commands were: `npx shadcn@latest add application-shell-15`; `npx shadcn@latest add statistics-component-12`; `npx shadcn@latest add chart-component-47`; `npx shadcn@latest add datatable-component-06`; `npx shadcn@latest add product-quick-view-02`. A real prototype must replace `@latest` with the repository-pinned CLI and run one clean-worktree candidate at a time.

Exact retrieval protocol: create a disposable branch/worktree; record license/plan/item/version; invoke one item; inventory every changed file/dependency; inspect the complete diff; normalize only in the disposable location; run lint, types, tests, build, accessibility, responsive, and dependency/security checks; capture evidence; delete output unless a separate prototype PR retains it. `/iui` is not justified now; `/rui` is allowed only after findings exist; `/ftc` is disabled.

## 22. Storybook implications

No candidate can advance beyond prototype without Storybook. Required stories include default, compact, long localized content, loading, empty, no-results, denied, entitlement-unavailable, error, offline, stale, partial, overflow, reduced-motion, high-contrast/forced-color, 200% zoom, keyboard, and mobile states as applicable. Use synthetic data only. Chart stories must expose their table/text equivalent. Table/list stories must demonstrate both semantic desktop and mobile task-preserving forms.

The absence of Storybook is a program gap, but this audit should not introduce Storybook inside an unrelated docs PR. Create a dedicated evidence-infrastructure issue sequenced before component promotion.

## 23. Documentation, help-center, video, and roadmap patterns

Studio's documentation separates general getting started, Pro purchase/access, the Admin Dashboard template, component pages, support, and legal content. It has search, breadcrumbs, previous/next-style progression on docs pages, template-specific setup, troubleshooting, and a broad footer. Useful Meridian principles are audience separation, task-first onboarding, template/surface-specific guides, searchable troubleshooting, and explicit release/support links. Meridian should not copy Studio's product/catalog-heavy footer or combine marketing, developer, operator, and application-user documentation.

The community resource library separates Videos, Articles, and Made With Studio. It mixes vendor tutorials with community submissions and embeds many third-party YouTube iframes. Meridian can adopt a curated learning index with owner, audience, transcript, duration, last-reviewed date, and authority label; community material must never silently become normative documentation.

The help-center URL was not readable through the web connector in this session; Studio's separate `/support` page and footer linkage were readable. The supplied `https://shadcnstudio.com/docs/community-resources/videos` path is not canonical; `/community-resources/videos` is the working route.

The public GitHub roadmap project link exists, but its project contents were not exposed to the unauthenticated web reader. Only roadmap linkage—not item content or status—was verified. Roadmap items must remain future intent and separate from shipped release notes.

## 24. Free and Pro changelog review

The live first-party changelog exposes accessible tabs for Free and Pro. Entries contain date, version deep link, title, summary, and categorical lists such as Added, Updated, Removed, and Fixed, with links to affected resources. Free entries are a shorter history of the open catalog. Pro entries are more frequent and include templates, blocks, Figma/plugin/MCP changes, and commercial resources. The 2026-07-06 Pro entry records Base UI as the default for blocks/components; the 2026-06-25 entry introduces CommerceO.

Strengths:

- clear chronological scan and separate release anchors;
- version/date/title/summary hierarchy;
- concrete category labels and affected-resource links;
- stable query deep links for tab and version;
- explicit separation of shipped changelog and linked roadmap;
- Free/Pro split matches Studio's commercial access model.

Weaknesses for Meridian:

- no visible search or product/capability filter;
- long undifferentiated stream as history grows;
- no role/capability/entitlement/rollout targeting;
- no consistent action-required, migration, deprecation deadline, known-limitations, accessibility, offline/mobile, or support fields;
- “Updated” is less user-centered than “Improved” and can mix implementation details with user impact;
- Free/Pro tabs would be the wrong segmentation for Meridian;
- query-string release identifiers are workable but canonical path-based release URLs would be clearer;
- responsive behavior and formal accessibility conformance were not fully audited.

Comparison:

| Product | Chronology/categories | Audience/action/migration | Useful Meridian lesson |
|---|---|---|---|
| Studio | Free/Pro tabs; versions/dates; Added/Updated/Removed/Fixed | Commercial access, weak capability/action metadata | Clear entry anatomy and affected-resource links |
| GitHub Changelog | New release/Improvement/Retired plus curated product tags, month/year archives | Product-area filters; concise why/what | Filter by surface/category and archive cleanly |
| Stripe API Changelog | API version/date, product tags, breaking-change filter, GA/preview | Strong developer compatibility/migration orientation | Separate API authority, breaking changes, version contracts |
| Linear | Chronological feature narratives plus grouped fixes/improvements and deep links | Strong scannability; less formal migration metadata | Lead with meaningful release, group smaller quality changes |

## 25. Meridian release-communication model

These are four separate authorities and data models:

1. **Public Product Changelog** — curated customer/prospect/admin/partner explanation of shipped product changes.
2. **In-App What's New** — an audience-filtered projection of published release notes, never an independent release authority.
3. **Developer/API Changelog** — compatibility, contract, SDK, webhook, authentication, permission, pagination, idempotency, migration, and deprecation authority.
4. **Tenant Audit Log** — tenant-scoped evidence of who did what to customer data and when.

A product release must never appear as a tenant-user action. A tenant action must never appear in public release notes. Generated contract diffs contribute evidence but cannot publish customer prose without review.

### 25.1 Original contract sketch

```ts
type ProductReleaseNote = {
  id: Id<"ProductReleaseNote">;
  releaseTrain: string;
  productVersion?: string;
  releasedAt: Instant;
  title: string;
  summary: string;
  category:
    | "added"
    | "improved"
    | "fixed"
    | "deprecated"
    | "removed"
    | "security"
    | "known-issue";
  audience: {
    capabilityIds?: CapabilityId[];
    roleReferences?: string[];
    surfaces: Array<"web" | "mobile" | "pos" | "admin" | "api">;
  };
  availability: {
    state: "planned" | "rolling-out" | "available" | "paused" | "rolled-back";
    featureFlagReference?: string;
    entitlementCapabilityId?: CapabilityId;
  };
  affectedSurfaces: string[];
  details: string;
  actionRequired: boolean;
  migrationRequired: boolean;
  deprecationDeadline?: BusinessDate;
  replacementPath?: string;
  documentationReferences: string[];
  knownLimitations: string[];
  accessibilityImpact?: string;
  offlineMobileImpact?: string;
  supportReference?: string;
};
```

This sketch uses the implemented `Id<TBrand>`, numeric UTC `Instant`, branded `BusinessDate`, and generated `CapabilityId`. The current entitlement implementation is capability-centric and does not expose a canonical `EntitlementId` suitable for this public contract; the note should therefore target a capability, not invent an entitlement identifier. Role references, release-train rules, feature-flag references, ownership, localization, security-redaction, and publication state still require design. Do not implement this type from the audit.

### 25.2 Staged surface recommendation

**Phase 1:** use the existing Fumadocs `release-notes` information architecture and publish manually reviewed Markdown/MDX at canonical `/releases/{release-id}` routes (navigation label “Release notes” or “What's new”). Categories: Added, Improved, Fixed, Deprecated, Removed, Security, Known Issue. Stable deep links, RSS/search where supported, synthetic imagery only.

**Phase 2:** add an authenticated `/whats-new` page or non-modal drawer backed by the same canonical published source, filtered by real surface/capability/permission/entitlement/flag/tenant rollout. Add unread/read state. Use banners/modals only for consequential required action.

**Phase 3:** add a separate developer/API changelog that combines human-reviewed contract-diff evidence with explicit migrations/deadlines/compatibility.

Do not start with a dashboard widget, notification-only feed, user-menu-only entry, or release-management CMS. The existing `PDA-DEV-010` already owns release communication, proposes `apps/docs/content/docs/release-notes`, Changesets inputs, curated audience-facing notes, and ownership. A new blueprint standard is **not justified yet**. First amend or implement that authority; recommend a future “Product Changelog and In-App Release Communication Standard” only if the real implementation exposes unresolved cross-surface ownership or publication-state rules.

## 26. Required follow-up implementation issues / PR sequence

1. Close WS1 PR9 accessibility/evidence gate; do not let this audit bypass it.
2. Establish Storybook/visual-regression infrastructure and canonical state stories.
3. WS2 product-list prototype: current shell + governed toolbar + cursor/URL state + mobile representation; use `datatable-component-06` as reference, exclude exports.
4. Product/inventory inspector prototype with stock-by-location and variant/activity contracts; do not use consumer quick view as product code.
5. Metric contract and `MetricCard` Storybook prototype only after an owned WS2 operational decision exists.
6. Accessible chart technology spike only after a chart is demonstrably better than text/table; compare Recharts against alternatives and record the technology decision.
7. Release-notes Phase 1 implementation under `PDA-DEV-010`, followed by in-app projection design; keep developer changelog and audit log separate.
8. If any Studio source is retained, create a separate acquisition/prototype PR with exact license evidence, pinned CLI, generated-file manifest, complete diff, dependency scan, and deletion criteria.

## 27. Specific questions answered

1. Official Studio template? **No.** Verified third-party derivative of Studio material.
2. Lawful source available? **Not for the assembled deployment.** A matching public Studio block and licensed Studio candidates exist separately.
3. Usable under repository licensing? **Only exact lawfully acquired items after license/provenance review and normalization; never the served bundle by inference.**
4. shadcn or resemblance? **Studio/shadcn-derived and Radix-backed, verified by assets/content/runtime markers; exact shadcn version unverified.**
5. One or multiple primitive systems? **One observed in this bundle: Radix. No Base UI evidence.**
6. Three-band navigation too complex? **Yes as a Meridian model; reject it.** Breadcrumbs may remain contextual, but context must replace chrome, not add a band.
7. Can context be added? **Yes, by keeping Meridian's current context/header model and discarding demo chrome.**
8. KPI cards task-oriented? **Decorative as implemented.**
9. Charts accessible? **No sufficient evidence; observed semantics are inadequate.**
10. Freshness/definitions visible? **No.**
11. Responsive tasks preserved? **Partially visual, not operationally on phone/tablet table workflows.**
12. Suitable for back-office ecommerce? **As visual research only.**
13. Suitable for WS2? **Toolbar density, list hierarchy, and bounded chart/card structures only; not contracts or shell.**
14. Consumer-oriented portions? **Yes: storefront footer, imagery, product quick views/cart-oriented Studio family.**
15. Better exact Studio candidates? **Yes.** In addition to CommerceO, `application-shell-15`, `statistics-component-12`, `chart-component-47`, and `datatable-component-06`, the expanded sweep found bounded value in `file-upload-06`, `dashboard-dialog-19`, `dashboard-dropdown-13`, `timeline-component-05`, `account-settings-05`, `account-settings-06`, and component variants for expandable/pinnable tables, sticky-action dialogs, progress, pagination, and searchable selection. All remain conditional references.
16. Custom components? **ContextSwitcher, MetricCard contract, AccessibleChartFrame, ProductVariantMatrix, InventoryByLocation, RowInspector, ActivityTimeline, denial/entitlement states and domain lists.**
17. Prototype first? **Product list/filter/cursor behavior in the existing shell.**
18. Reject permanently? **Full demo/template adoption, demo nav, storefront/admin mixing, ambiguous donuts/KPIs, consumer checkout as inventory/POS, and ungoverned dependencies.**

## 28. Final disposition

| Item | Disposition |
|---|---|
| Supplied demo | Use as visual research only; do not copy source or navigation |
| Demo provenance | Verified third-party derivative of Studio material |
| Demo source/license | Unavailable/unverified; not reusable by inference |
| Studio MCP in Codex | Worked for metadata and command generation; Pro-tagged access observed |
| Claude Code | Not required for this audit; may be useful only if a future licensed large-source retrieval exceeds Codex MCP limits |
| Full AdminCN/CommerceO template | Do not install; inspect bounded patterns under separate licensed prototype |
| First prototype | WS2 product list/filter/cursor in current Meridian shell |
| Component lifecycle | No promotion; all remain candidates |
| New changelog blueprint standard | Not necessary now; implement/refine existing `PDA-DEV-010` first |
| Expanded Studio catalog | Audited across block, component, page, admin, application, ecommerce, and marketing families; retain only bounded references |

## 29. Expanded Studio catalog sweep

This pass intentionally widened discovery beyond the original ecommerce demo and five-candidate shortlist. It used first-party catalog pages for published family/template inventory and the authenticated Studio MCP for exact metadata. It did not fetch component source, execute installation commands, download complete templates, or infer that a public count equals an installable licensed count.

### 29.1 Block coverage

`get_blocks_metadata` exposed 61 families. Sequential `get_block_meta_content` retrieval returned 735 exact variant records:

| Published area | Families | Exact MCP records | Audit conclusion |
|---|---:|---:|---|
| Dashboard and application | 17 | 258 | Highest Meridian relevance; most value is bounded workflow, settings, upload, dialog, dropdown, shell-region, and operational-summary composition |
| Marketing UI | 29 | 362 | Useful for public docs/marketing only; reject as operational application authority |
| Ecommerce | 13 | 84 | Separate consumer commerce from back-office operations; list/order hierarchy can inform research, checkout/cart/review flows cannot define WS2 |
| Bento grid | 1 | 24 | Dense visual research; frequent motion/decorative dependencies make it unsuitable as an operational layout system |
| Datatable | 1 | 7 | Useful enterprise table compositions; all require contract, pagination, export, responsiveness, and accessibility normalization |
| **Total** | **61** | **735** | Complete sweep of the families exposed by the MCP on 2026-07-14 |

This verified count differs from Studio's broader marketing count because the surfaces are not equivalent. Treat the MCP result as a dated metadata observation, not a permanent vendor inventory guarantee.

### 29.2 Component coverage

The first-party component catalog displayed 58 named families whose visible per-family counts sum to 902 variants. The page headline says “1000+”; the audit records both facts and does not reconcile the marketing headline by invention. The MCP `get_component_meta_content` endpoint returned exact metadata for 30 established family slugs totaling 595 variants. Twenty-eight publicly listed newer families—including Autocomplete, Command, Drawer, Kanban, List, Progress, Skeleton, Spinner, Stepper, and Sortable—did not resolve under their public slugs through that endpoint during this session.

This is a service-surface gap, not proof those variants are unavailable or defective. Any candidate from those 28 families needs a later licensed retrieval or Studio support confirmation before source-level assessment.

### 29.3 Template coverage

The public template catalog exposed these named landing/full-site candidates: Ink, Track, Bistro, Grow, Orion, Matter, Craft, Flow, Swipe, Neural, Brandly, Shopix, and SkillSphere. The admin/application catalog exposed AdminCN Free, AdminCN Pro, CommerceO, PropXYZ, Promptly, and Calendrix.

| Template family | Potential value | Disposition |
|---|---|---|
| AdminCN Free / Pro | General settings, tables, navigation, responsive application composition | Useful composition reference only; current shell and trust boundaries remain authoritative |
| CommerceO | Product/order/customer/vendor page hierarchy and back-office density | Strongest WS2 template research source; no wholesale adoption |
| PropXYZ | Entity/list/detail and tenant-like property workflows | Domain-mismatched composition reference; do not transfer tenancy or booking assumptions |
| Promptly | Command/chat, authentication, pricing, and conversation layouts | AI/product-marketing specific; command/search regions may be researched separately |
| Calendrix | Calendar, event, task, note, and contact interaction patterns | Scheduling reference only; no calendar capability is implied for Meridian |
| Track | Public changelog presentation | Useful release-note visual reference; canonical content model remains owned by `PDA-DEV-010` |
| Shopix | Consumer ecommerce storefront | Consumer Ecommerce Only; keep outside WS2 back-office authority |
| Ink, Bistro, Grow, Orion, Matter, Craft, Flow, Swipe, Neural, Brandly, SkillSphere | Marketing/blog/restaurant/AI/product/portfolio/SaaS/mobile/agency/LMS compositions | Public-site research only unless a separately governed capability creates a matching need |

## 30. High-value exact block findings

The following records are the strongest additional findings from the 735-record block sweep. “Gold” means a high-value bounded reference, not approved source.

| Exact Studio identifier | Useful composition | Required replacement or constraint | Disposition |
|---|---|---|---|
| `file-upload-06` | Upload manager with active, failed, and completed work plus progress and retry affordances | Use governed import-job contracts, durable job IDs, validation reports, offline rules, permissions, and non-optimistic completion | **Gold: reserve prototype bench** |
| `dashboard-dialog-19` | Search/command dialog | Use canonical routes, permission-filtered results, keyboard/focus evidence, and server-derived context | **Gold: GlobalSearch/CommandPalette reference** |
| `dashboard-dialog-20` | Activity-tracking sheet/dialog | Replace event types, identity, timestamps, redaction, retention, and audit authority | Useful RowInspector/ActivityTimeline reference |
| `dashboard-dialog-22` | Destructive confirmation structure | Reject “do not ask again” for consequential operations; add named object, consequences, reauth/approval state, and error recovery | Useful confirmation reference |
| `dashboard-dialog-25` | Four-step configuration flow | Replace invented CI/CD semantics; preserve URL/draft/recovery only when the real workflow requires them | Workflow structure only |
| `dashboard-dialog-26` | Sharing and permission dialog | Replace all role/permission assumptions with canonical capability and grant contracts | Useful administration composition reference |
| `dashboard-dropdown-13` | Workspace/environment switcher | Replace every option and authority check with server-derived ContextSwitcher contracts; never trust client selection alone | **Gold: ContextSwitcher reference** |
| `dashboard-dropdown-14` | Search and filter dropdown | Normalize to URL-backed, labeled, keyboard-usable query state | Useful toolbar reference |
| `dashboard-dropdown-20` / `-21` | Tag and assignment selectors | Only if canonical tag/assignment capabilities exist; never create domain concepts from the UI | Useful searchable-assignment reference |
| `account-settings-05` | Team member, role, invite, and pending-invitation organization | Reuse existing user/role routes and permission vocabulary; replace invitations and status logic | **Gold: admin information architecture** |
| `account-settings-06` | Security settings, two-factor auth, API keys, and sessions table | Current Meridian session/security authority wins; split concerns and preserve step-up/reauth/revocation states | **Gold: security-page composition** |
| `account-settings-02` | Notification channels, categories, and do-not-disturb preferences | Requires a real notification capability, delivery semantics, timezone, and failure model | Future composition reference |
| `account-settings-03` | Workspace identity, timezone, branding, export, backup, danger zone | Split governed concerns; context remains server-derived and export/backup need owned jobs | Useful only after decomposition |
| `account-settings-04` | Grouped integration catalog | Requires canonical integration ownership, connection state, permissions, secrets, and error handling | Developer/integrations reference |
| `account-settings-07` | Billing, payment, AI credits, usage, and add-ons | Inherits an unapproved commercial/payment model and third-party payment inputs | Rejected |
| `form-layout-02` | Multi-section responsive form with helper text and preferences | Normalize to TanStack Form, canonical Field primitives, durable drafts where needed, and visible error summary | Strong composition reference |
| `form-layout-05` | Tabbed personal/account/social form | Avoid hiding invalid fields behind tabs; separate unrelated concerns | Conditional reference |
| `form-layout-08` | Five-step product-creation flow | Reject inherited `@stepperize/react`/React Aria stack; require WS2 product contract, draft/recovery, validation, permission, and concurrency design | **Gold: reserve prototype bench** |
| `form-layout-03` / `-09` | Schema-backed tier/payment forms | React Hook Form/Zod-form stack duplicates selected TanStack Form concern; payment semantics are unapproved | Rejected as implementation source |
| `onboarding-feed-01` | Task checklist with completion and per-step actions | Use owned onboarding criteria and durable completion state | Useful tenant/admin onboarding reference |
| `onboarding-feed-04` | Workspace-setup event timeline | Replace events/statuses with canonical activity records | Useful ActivityTimeline reference |
| `timeline-component-05` | Version/date changelog timeline with anchors and responsive layout | Preserve date/version on mobile; remove questionable copy dependency; use canonical release-note routes/content | **Gold: release-note presentation reference** |
| `category-filter-03` | Dialog filters, removable summary badges, clear-all action | Keep URL/query source of truth, accessible labels, applied/pending distinction, and server-supported operators | **Gold: FilterBuilder reference** |
| `category-filter-02` | Collapsible multi-facet filters with responsive sheet | Replace consumer/company examples and `react-use`; prove mobile task completion | Useful complex-filter reference |
| `datatable-component-04` | Administration table with search, filters, selection, roles, and pagination | Replace subscription/role model; use cursor navigation and canonical bulk-action permissions | Strong admin-table reference |
| `statistics-component-18` | Segmented operational counts for orders, stock, and shipments | Define metric owner, filters, units, freshness, comparison, empty/error, and drill-down | Strong MetricCard/distribution reference |
| `application-shell-02` | Collapsible navigation with command/search | Current Meridian shell wins; only command/search and responsive-region composition may transfer | Better general shell reference than ecommerce shell |

The reserve bench does not expand the five active prototypes in section 21. It identifies the next evidence candidates only if one of the current five fails or a governed implementation issue creates the need.

## 31. High-value exact component findings

Component variants are narrower and often safer research inputs than whole blocks, but they still carry behavior, primitive, dependency, and accessibility assumptions.

| Exact component identifier(s) | Finding | Meridian disposition |
|---|---|---|
| `data-table-06` | Expandable rows with only TanStack Table plus the table primitive | Strong RowInspector/table-detail reference; prove keyboard semantics, responsive representation, and server data loading |
| `data-table-07` | Pinnable left/right columns | Useful only for demonstrated wide-table tasks; preserve reading order and provide a usable mobile representation |
| `data-table-02` | User-controlled density | Useful preference reference; must not reduce touch targets or readability below governed minimums |
| `data-table-10` | Sorting, selection, pagination, and page-size controls | Composition reference only; replace page-number assumptions with cursor contracts where the API is cursor-based |
| `data-table-13` | Inline text/status/progress editing | High-risk: requires cell-level validation, concurrency, permissions, save/error state, and undo/recovery; not an automatic productivity win |
| `data-table-12` | Browser CSV/XLSX export through PapaParse/XLSX | Rejected by default; export must be governed, permissioned, auditable, redacted, and usually server-generated |
| `pagination-14` / `-15` | Page-size and detailed navigation chrome | Reuse labels/affordances only; implement cursor semantics and unknown-total behavior from Meridian contracts |
| `combobox-07` | Searchable timezone selection using `Intl` data | Strong settings reference if timezone is a canonical field; store canonical identifiers and localize labels |
| `combobox-08` | Searchable user selector with identity detail | Strong assignee/member reference; filter by permission and avoid exposing unauthorized identity data |
| `combobox-10` / `-11` / `-12` | Searchable multi-select with removable or summarized selections | Strong filter/form reference; verify keyboard removal, announcement, overflow, and server-supported limits |
| `dialog-05` / `-06` | Scrollable dialogs with sticky header/footer | Strong long-form/modal action reference; keep title, errors, and actions reachable at zoom and small viewports |
| `dialog-01` | Basic destructive alert dialog | Useful only after consequence-specific copy, pending/error state, focus return, and reauth/approval rules are added |
| `popover-06` | Download progress with pause/cancel/retry | Strong long-running job control reference; progress must be truthful and resumability server-backed |
| `alert-07` / `-09` | File/task progress with actions and completion | Useful import/job status reference; avoid transient-only reporting for durable work |
| `calendar-19` / `-20` | Calendar synchronized with date/time input | Strong accessible-entry concept; require business-date/timezone rules and text-entry validation |
| `calendar-22` / `-23` | Date and range presets | Useful analytics filters only when preset semantics and inclusive boundaries are explicit |
| `input-34` / `-35` | Character count/remaining guidance | Strong constrained-field reference; announce limits without noisy live regions |
| `input-36` | Clearable input | Useful search-field behavior; provide accessible name and do not erase without predictable focus/result behavior |
| `input-37` | Search input with keyboard shortcut | Useful GlobalSearch affordance; shortcut must avoid conflicts and be documented semantically |
| `input-39` | Search loading state | Useful asynchronous-filter reference; coordinate busy state, cancellation, and stale-result handling |
| `form-10` | Comprehensive form composition | Reject implementation stack: React Hook Form/resolvers/Zod form wiring duplicates Meridian's selected TanStack Form approach |
| `tabs-27` / `-28` / `-29`, animated inputs/switches/cards | Motion-heavy styling | Reject for operational defaults; consider only with a demonstrated purpose and reduced-motion behavior |
| `table-10` / `-11` / `-12` | Sticky header, sticky first column, and key/value table | Useful primitives for dense read-only information; test zoom, overflow, reading order, and header associations |

## 32. Patterns rejected across the broader catalog

The expanded audit strengthens these cross-catalog rejections:

1. **Kitchen-sink shells:** `dashboard-shell-01`, `dashboard-shell-02`, `dashboard-shell-09`, and complete admin templates mix too many concerns and dependencies to serve as Meridian architecture.
2. **Decorative analytics:** charts or bento grids without an owned decision, definition, unit, freshness, comparison, and drill-down remain filler regardless of polish.
3. **Consumer-to-operations substitution:** carts, checkout, gift cards, reviews, product quick views, offer modals, and storefront footers do not define inventory, purchasing, fulfillment, order administration, or POS.
4. **Client-side export by convenience:** PapaParse/XLSX dependencies do not establish lawful, secure, scalable export behavior.
5. **Dependency inheritance:** React Hook Form, Zustand, `react-use`, React Aria Components, motion packages, stepper libraries, DnD kits, payment inputs, or custom animation helpers require an explicit need and technology disposition.
6. **Hidden validation:** tabbed and stepped forms may not conceal blocking errors or discard unsaved work.
7. **Unsafe consequence suppression:** “do not ask again” is rejected for destructive, security, permission, and financial actions.
8. **Client-authored authority:** workspace, environment, role, entitlement, assignment, integration, or security state in a demo is display data only until backed by canonical server contracts.
9. **Animation as default feedback:** operational state must remain understandable with reduced motion and without motion.
10. **Catalog accessibility claims as evidence:** every retained variant still needs keyboard, focus, screen-reader, contrast, zoom, reflow, touch-target, loading/error, and reduced-motion verification in Meridian.

## 33. Updated candidate tiers and prototype discipline

| Tier | Candidates | Action |
|---|---|---|
| Active isolated shortlist | The five candidates already named in section 21 | Keep the cap at five; no expansion from catalog abundance |
| Reserve gold bench | `file-upload-06`, `dashboard-dialog-19`, `dashboard-dropdown-13`, `timeline-component-05`, `form-layout-08`, `category-filter-03`, `data-table-06`, `combobox-08`/`-10` | Open only when a matching governed issue exists or an active prototype is rejected |
| Composition reference | Settings, security, onboarding, activity, filter, sticky-dialog, pagination, calendar, progress, and table variants listed above | Capture screenshots/metadata and rebuild through Meridian primitives/contracts; no source promotion by resemblance |
| Domain-mismatched research | PropXYZ, Promptly, Calendrix, consumer ecommerce, finance/marketing charts | Use only for interaction questions that survive domain normalization |
| Rejected | Full shell/template adoption, payment/billing assumptions, client export, motion-heavy operational defaults, inherited duplicate state/form stacks | Do not prototype without a new authority-changing decision |

Prototype acceptance remains evidence-based. A retained candidate must identify the real task, owner, permission, contract, states, URL/draft behavior, responsive transformation, accessibility evidence, performance budget, dependency diff, license/provenance, deletion criteria, and exact normalization boundary. Visual attractiveness alone is not an acceptance criterion.

## 34. Updated acquisition and implementation sequence

1. Keep the current five-prototype cap and finish WS1 gates.
2. Use public metadata and screenshots for composition research; do not retrieve licensed source until a matching issue has acceptance criteria.
3. For the WS2 product list, compare the existing `datatable-component-06` reference with narrower `data-table-06`, `-07`, and `-10` behaviors; prefer the smallest evidence-bearing composition.
4. When bulk import is authorized, prototype `file-upload-06` concepts against a canonical import-job contract and durable validation report.
5. When global search is authorized, prototype `dashboard-dialog-19` plus `input-37`/`-39` against permission-filtered, context-aware results.
6. When context switching is expanded, compare `dashboard-dropdown-13` only at the presentation layer; preserve server validation and canonical denial/offline/reauth states.
7. When settings/security work is scheduled, use `account-settings-05`/`-06` to test information architecture, not to replace current routes or security authority.
8. When release-note presentation is implemented under `PDA-DEV-010`, compare Track and `timeline-component-05` while preserving accessible mobile date/version context and stable routes.
9. Retrieve at most one exact candidate per acquisition PR. Pin the CLI/registry input, retain license evidence and generated manifest, scan the full diff and dependencies, normalize through `packages/ui-web/core`, and delete rejected source.
10. Promote only after Storybook/canonical-state, accessibility, responsive, performance, test, and ownership evidence closes the candidate's acceptance record.

## 35. Primary sources inspected

- Demo: <https://e-commerce-dashboard-vite-demo.vercel.app/#>
- Studio introduction: <https://shadcnstudio.com/docs/getting-started/introduction>
- Studio blocks catalog: <https://shadcnstudio.com/blocks>
- Studio components catalog: <https://shadcnstudio.com/components>
- Studio templates catalog: <https://shadcnstudio.com/templates>
- Studio admin/application template catalog: <https://shadcnstudio.com/templates/admin-dashboard>
- Studio Pro guide: <https://shadcnstudio.com/docs/getting-started/introduction-pro>
- Studio MCP: <https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server>
- Studio CLI/registry guidance: <https://shadcnstudio.com/docs/getting-started/how-to-use-shadcn-cli>
- Admin template introduction: <https://shadcnstudio.com/docs/documentation-admin/introduction>
- Admin template getting started: <https://shadcnstudio.com/docs/documentation-admin/getting-started>
- AdminCN: <https://shadcnstudio.com/templates/admin-dashboard/admincn>
- CommerceO: <https://shadcnstudio.com/templates/admin-dashboard/commerceo>
- Studio changelog: <https://shadcnstudio.com/changelog>
- Studio license: <https://shadcnstudio.com/license>
- Community videos: <https://shadcnstudio.com/community-resources/videos>
- Support: <https://shadcnstudio.com/support>
- Roadmap link (contents inaccessible to unauthenticated reader): <https://github.com/orgs/shadcnstudio/projects/6/views/2>
- Studio public repository/matching block: <https://github.com/shadcnstudio/shadcn-studio/blob/main/src/components/shadcn-studio/blocks/chart-sales-metrics.tsx>
- GitHub Changelog pattern: <https://github.blog/changelog/2025-05-05-improvements-to-changelog-experience/>
- Stripe API Changelog: <https://docs.stripe.com/changelog>
- Linear Changelog: <https://linear.app/changelog>

Inaccessible or limited sources: `https://help.shadcnstudio.com/en/` returned no readable web-connector content; support separation was verified through Studio's first-party support/footer pages. The GitHub roadmap project shell was readable but not its board items. The AdminCN/CommerceO licensed source trees were intentionally not downloaded, so their source-level claims remain unverified. The Studio changelog was inspected live in both tabs; no account-only Pro source was copied.
