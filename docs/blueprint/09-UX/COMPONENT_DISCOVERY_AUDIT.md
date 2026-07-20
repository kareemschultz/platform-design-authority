---
document_id: PDA-UX-034
title: Component Discovery Audit
version: 0.4.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
related_adrs: [ADR-0005, ADR-0022]
---

# Component Discovery Audit

> **Point-in-time evidence.** Findings, verification results, and conclusions below reflect the platform, dependencies, and vendor catalogs as observed through this document's own dated evidence (most recently reviewed 2026-07-13). Nothing here is re-verified automatically on a later read; re-confirm current state before relying on a dated finding for a new decision. See ADR-0025's evidence-banner amendment for the convention.

## Executive decision

Meridian should use the official shadcn/ui registry as its canonical external primitive and component discovery source. Shadcn Studio may supply licensed composition and visual-exploration candidates. Neither source may define Meridian behavior, authority, tokens, state semantics, accessibility acceptance, or business rules.

The audit promotes no item to Prototype Approved or Platform Approved. The strongest results are Preferred Candidates that still require acquisition, normalization, Storybook, accessibility, responsive, performance, offline, white-label, and workflow evidence.

No source, block, page, theme, animation, or licensed asset was retrieved or installed during this audit.

## Scope and method

The audit:

1. Read the foundation, UX, ADR-0005, ADR-0022, registry, first-slice, and technology-lifecycle authorities.
2. Queried the official shadcn MCP for the complete configured registry metadata inventory.
3. Queried Shadcn Studio MCP for safe block-family and inspiration-identifier metadata.
4. Verified current public MCP capability, licensing, client-support, and command claims against vendor documentation.
5. Classified sources against Meridian task fit, architecture, canonical states, accessibility, responsiveness, white label, offline operation, dependencies, performance, Storybook, and AI-generation constraints.
6. Recorded the complete discovered names in COMPONENT_SOURCE_MATRIX.md.

The baseline was main at 8986977a3fa04a4b38c9b82c6a7384014dc8fadb at original authoring; re-verified current on 2026-07-13 against main at a350732204aa33bebd4e9de6c1b64366372e1653 (this branch's merge-base equals that tip — no rebase required). Discovery used exactly pinned `shadcn@4.13.0` and `shadcn-studio-mcp@1.0.7` (never `@latest`) on 2026-07-12/13, with an authenticated re-verification pass on 2026-07-13. The official-registry figures below were independently reproduced by driving the pinned `shadcn@4.13.0` package directly over its stdio JSON-RPC interface, since the equivalent Claude-side MCP connector was not reachable this session (see COMPONENT_SOURCE_MATRIX.md's Connector status section). The Studio authenticated figures were reproduced by calling the metadata-only `get-block-meta-content` endpoint for all 61 families with a valid credential, and validated as genuinely credential-gated via a controlled with/without-credential comparison on one family (1 variant unauthenticated vs. 18 authenticated, 3 of them `isPro: true`).

## Inventory totals

| Inventory | Verified total | Counting meaning |
|---|---:|---|
| Official shadcn registry entries | 471 | All configured @shadcn metadata entries; independently reproduced via direct JSON-RPC |
| Official UI entries | 61 | Primitive and component candidates |
| Official block entries | 97 | Page or composition examples, chiefly charts, sidebars, and authentication |
| Official example entries | 239 | Documentation examples, not reusable platform contracts |
| Official font entries | 52 | Typeface choices rejected by current token authority except already selected families |
| Official theme entries | 5 | External theme entries rejected as token authority |
| Other official entries | 17 | Hook (1), internal (13), library (1), and style (2) entries |
| Studio block families | 61 | Metadata families across five categories (catalog level, unaffected by authentication) |
| Studio inspiration variants (catalog level) | 146 | Named inspiration variants from the catalog listing, not 146 accepted components |
| Studio variant records (authenticated, per-family) | 735 | Actual variant records returned by authenticated per-family metadata across all 61 families — substantially more than the catalog implies; see COMPONENT_SOURCE_MATRIX.md for the per-family breakdown |
| Studio Pro-tagged variants (authenticated) | 74, across 21 of 61 families | Variants whose metadata carries an explicit `isPro: true` tag. The remaining 661 authenticated variant records carry no entitlement tag at all — this is unestablished entitlement, not confirmed Free |
| Studio component-library families discovered | 28 of 54 candidate slugs tried | A separate per-primitive component catalog (`accordion`, `button`, `dialog`, `select`, etc.), distinct from the 61 block families, queried one slug at a time via `get-component-meta-content` (no listing tool exists for this content type) |
| Studio component-library variant records | 573 | Total variant records across the 28 found component families |
| Studio component-library Pro-tagged variants | 0 of 573 | No component-library variant carries `isPro: true` in this pass; recorded as entitlement unclassified for all 573, not confirmed Free |
| Studio component-library animated-tagged variants | 44 of 573 | Variants carrying an explicit `isAnimated: true` tag |
| Studio component-library slugs not found | 26 of 54 tried | Server returned an explicit "Component not found" (a real response, not a parse error) for these slugs; recorded as unverified for that name, not evidence Studio lacks the concept |
| Studio independent pages/templates/layouts | Unverified | The response did not provide reliable independent types or totals |
| Studio independent animations/themes | Unverified (44 tagged component variants observed; no separate animation-library classification or total exists) | The response did not provide reliable independent types or totals; Studio's own marketing claims a broader animation set, recorded separately as vendor-claimed, not independently reproduced |

Unknown is intentionally not reported as zero. Studio's per-family authenticated metadata now proves Pro-tagging exists and is credential-gated for at least 74 observed variants; it still does not classify any family as independently a page, layout, template, or animation, so those totals remain unverified rather than zero.

## Source decision matrix

| Source | Canonical role | Strength | Blocking limit | Recommendation |
|---|---|---|---|---|
| Platform-owned @meridian/ui | Accepted implementation after evidence gates | Ownership, governance, tests, removal control | Does not yet contain every required composite | Use when accepted |
| Official shadcn/ui | External registry and primitive baseline | Accessible primitive starting points, source ownership, broad ordinary UI coverage | Listings and examples are not Meridian-normalized | Use immediately for bounded candidate discovery |
| Shadcn Studio | Licensed composition and inspiration source | Dashboard, form, empty-state, marketing, and visual-composition breadth | Codex unsupported by vendor; item entitlement and quality are not represented in metadata | Prototype selected low-risk compositions after credential rotation and review |
| Custom Meridian composite | Domain behavior and high-consequence workflow | Can encode Meridian states and contracts without vendor coupling | Higher design, implementation, and test cost | Required for platform-specific operational workflows |
| AI-generated composition | Disposable exploration | Fast variation | Untrusted source, hidden assumptions, inconsistent behavior | Isolated prototype only |

## Candidate evaluation

The matrix below evaluates candidate families, not individual source implementations. An individual candidate can be accepted only after the acceptance checklist.

| Meridian need | Best candidate source | Type | Current maturity | Architecture and UX fit | Accessibility and responsive proof | White label and normalization | Dependencies and performance | Storybook and AI suitability | Recommendation |
|---|---|---|---|---|---|---|---|---|---|
| Buttons, fields, inputs, choice controls | Official shadcn UI | Primitive/component | Preferred Candidate | Strong composable baseline; business rules remain outside UI | Required per variant, error, zoom, touch, RTL, and mobile state | Expected medium effort through semantic tokens | Verify copied dependencies and hydration | Canonical stories required; AI may compose only approved APIs | Use immediately for normalization prototypes |
| Dialog, alert dialog, drawer, sheet, popover, tooltip | Official shadcn UI | Compound component | Preferred Candidate | Strong when consequence and disclosure rules choose the pattern | Focus return, escape, inert background, labels, zoom, and mobile transformation required | Medium | Avoid nesting and excess client boundaries | Canonical stories required; constrain AI by consequence | Prototype |
| Command palette, combobox, search | Official shadcn UI plus custom ranking | Compound component | Preferred Candidate | Good interaction base; ranking, tenancy, permission, and offline truth are custom | Keyboard model, announcements, no-results, loading, and touch proof required | Medium | Virtualize or paginate large result sets | Canonical; AI cannot invent result authority | Prototype |
| Application shell, header, sidebar | Official primitives plus selected Studio composition | Layout/block | Preferred Candidate | Useful visual composition; Meridian owns navigation, tenant context, and task hierarchy | Landmark, focus order, collapse, mobile, kiosk, zoom, and RTL proof required | High normalization | Measure hydration and route-boundary cost | Canonical only after owned implementation | Prototype selected variants |
| Account settings and form layout | Official primitives plus Studio composition | Block | Preferred Candidate | Good low-risk composition evidence; schema, permissions, and save semantics remain custom | Full form and error-summary evidence required | Medium/high | Avoid client-only whole-page forms | Storybook per state; AI requires governed schema | Prototype |
| Multi-step form/wizard | Official primitives plus Studio inspiration plus custom state machine | Compound workflow | Preferred Candidate | Fits resumable onboarding only with explicit persistence and review | Step semantics, focus, errors, resume, mobile, and offline proof required | High | Lazy-load optional steps; no hidden submission | Canonical workflow stories required | Prototype after form contract |
| Empty, loading, error, and unavailable states | Official Empty/Skeleton/Alert plus Studio Empty State | Component/block | Preferred Candidate | Strong when canonical state semantics and next action are preserved | Status announcements, readable recovery, reduced motion required | Medium | Lightweight; no decorative dependency required | Canonical state stories; safe constrained AI copy | Use immediately for state-system prototype |
| Operational charts and KPI summaries | Official chart/Recharts plus Studio visual inspiration | Compound component | Preferred Candidate | Suitable for ordinary governed metrics; actions and source freshness are custom | Table/text alternative, keyboard drill-down, contrast, non-color encoding required | High token normalization | Lazy-load heavy charts and cap points | Canonical metric stories; AI cannot invent metrics | Prototype selected chart families |
| Enterprise data grid | Official table foundation plus custom Meridian grid | Compound platform component | Custom Required | External examples do not satisfy bulk scope, density, permissions, audit, or offline rules | Formal grid keyboard, virtualization, zoom, touch alternative, and screen-reader plan required | High | Virtualization and server operations required | Canonical; AI constrained to column contracts | Build custom governed composite |
| POS workspace and tender flow | Official primitives plus custom Meridian workflow | Page composition/workflow | Custom Required | Storefront checkout blocks do not match high-volume POS, device, tender, or uncertainty semantics | Kiosk, touch, scanner, keyboard, focus, interruption, and recovery proof required | High | Tight latency and offline budgets | Canonical first-slice stories; AI disabled on essential path | Build custom |
| Inventory adjustment, transfer, scan, reconciliation | Official primitives plus custom Meridian workflow | Workflow | Custom Required | Requires ledger, reversal, count, conflict, and offline semantics absent from sources | Device, mobile, batch, error prevention, and recovery proof required | High | Large lists, scanning, and queue state require measurement | Canonical; AI suggestions never authoritative | Build custom |
| Permission matrix, role editor, access scope | Custom Meridian composite | Compound platform component | Custom Required | Requires separate entitlement/permission truth and tenant scope | Table/grid semantics, keyboard, consequence summary, and error prevention required | High | Virtualize large matrices and avoid client-side authority | Canonical; AI may explain but not grant | Build custom |
| Tenant and organization switcher | Official command/popover primitives plus custom contract | Compound component | Custom Required | Requires explicit current tenant, role, stale state, and safe transition | Keyboard, announcements, focus, mobile, and blocked-transition proof required | Medium/high | Bounded result search | Canonical; AI must not switch authority | Build custom composite |
| Audit, event, diff, and activity viewers | Official table/accordion/scroll primitives plus custom views | Compound platform component | Custom Required | Requires immutable provenance, chronology, redaction, correlation, and honest incompleteness | Structured alternatives, keyboard navigation, zoom, and non-color difference required | High | Pagination/streaming and redaction at source | Canonical; AI summaries link to source facts | Build custom |
| Provider uncertainty and diagnostics | Custom Meridian state component | Compound platform component | Custom Required | No source represents pending, unknown, retry, duplicate-risk, reconciliation, or provider capability safely | Live-region restraint, action clarity, timeout and recovery proof required | High | Polling/backoff and event updates must be bounded | Canonical; AI may explain only | Build custom |
| Offline sync and conflict resolution | Custom Meridian workflow | Workflow | Custom Required | Requires leases, queue, authority, tombstones, conflict, and reconciliation | Offline announcements, recoverability, mobile, and interruption proof required | High | Background work and large queues require budgets | Canonical; AI cannot resolve protected conflicts autonomously | Build custom |
| AI sidebar, provenance, approval, autonomy controls | Official primitives plus custom Meridian contract | Compound platform component | Custom Required | Requires tool authority, citations, preview, approval, denial, and deterministic fallback | Focus, streaming announcements, keyboard, reduced motion, and readable provenance required | High | Stream carefully; virtualize history | Canonical; generated UI strictly constrained | Build custom |
| Marketing pages and decorative compositions | Studio marketing families | Page/block | Restricted | Useful outside operational truth; cannot become product workflow architecture | Accessibility and reduced-motion review still mandatory | High brand normalization | Enforce animation, image, and hydration budgets | Non-canonical product UI | Later, marketing only |
| Storefront e-commerce blocks | Studio eCommerce families | Page/block | Restricted | Production storefront is deferred and checkout is not POS | Full commerce accessibility proof absent | High | Unknown until item review | Not canonical | Later, only after storefront scope |
| Alternate fonts, themes, registry internals | Official registry metadata | Theme/internal | Rejected | Conflicts with token/type authority or is not a product contract | Not applicable | Would fragment system | Adds maintenance without task value | Never canonical | Never |

## Strongest candidates

The strongest bounded candidates are:

- Official field, form, input, selection, dialog, disclosure, command, table-foundation, feedback, and navigation primitives.
- Official dashboard, sidebar, authentication, and chart blocks as composition evidence only.
- Studio Application Shell, dashboard shell/header/sidebar, Account Settings, Form Layout, multi step form, Empty State, File Upload, Onboarding Feed, Charts Component, statistics-component, and widgets-component.
- Studio DataTable only as visual research; it is not a substitute for Meridian's governed enterprise grid.

## Restricted and rejected candidates

- Studio marketing, authentication-page, Bento, timeline, portfolio, and e-commerce families are Restricted to marketing, deferred storefront, or isolated visual research.
- Whole authentication pages are not identity architecture and must not redefine Better Auth flows, session semantics, Party linkage, tenant selection, recovery, or security messaging.
- Pie, radar, radial, carousel, parallax, continuous, decorative, and novelty motion patterns are Restricted unless the governed information and accessibility need justifies them.
- External fonts, themes, registry internals, and source-level business behavior are Rejected.
- Any candidate with an unclear redistribution license, unavailable provenance, inaccessible critical path, unsafe tenant scope, or unbounded dependency is Rejected.

## Custom components Meridian must build

Neither source provides a trustworthy platform contract for:

- High-volume POS product picking, scanner feedback, cart, tender, split payment, cash, receipt, return, and register workflows.
- Provider uncertainty, payment reconciliation, retry, duplicate-risk, and diagnostics.
- Offline queue, sync, stale authority, conflict, tombstone, lease, and reconciliation workflows.
- Enterprise grid behavior for bulk scope, virtualization, permissions, audit, exports, and responsive alternatives.
- Permission matrix, role editor, entitlement visibility, access scope, tenant administration, and organization switching.
- Inventory count, adjustment, transfer, barcode, receiving, and reconciliation workflows.
- Audit, event, diff, activity, provenance, correlation, and redaction viewers.
- Accounting review, financial exceptions, reversal/compensation, and reconciliation.
- AI provenance, tool preview, approval, denial, citations, autonomy bounds, and deterministic fallback.

Custom Required means compose owned behavior from accepted primitives; it does not mean reimplement accessible primitives.

## Gaps and risks

| Gap or risk | Consequence | Control |
|---|---|---|
| Studio does not list Codex as supported and documents a response-size limitation | Full instruction or source responses may truncate or fail | Use metadata-only discovery here; use a supported client for licensed item review; retain Codex fallback |
| Studio item metadata lacks entitlement and independent type classification | Premium/page/template/animation totals cannot be proven | Report unverified; perform item-level licensed review only after credential rotation |
| Registry presence can be mistaken for approval | Inconsistent or inaccessible platform UI | Preserve catalog statuses and acceptance gates |
| Attractive blocks can hide business rules | Cross-domain authority and security defects | Strip all behavior; reconnect through application contracts |
| Dashboard examples can invent metrics | Misleading operational decisions | Use governed metric IDs, freshness, provenance, and drill-down |
| Marketing motion can leak into operations | Cognitive load, motion harm, latency | Enforce ANIMATION_AND_MOTION_GUIDE.md |
| Copied source shifts maintenance to Meridian | Upgrade and regression burden | Record provenance, owner, tests, and recheck trigger |
| Codex's MCP configuration named the Studio credential `LICENSE_KEY`, which `shadcn-studio-mcp@1.0.7` does not recognize (only `API_KEY`/`EMAIL`) — the founder has since reported correcting this locally to `API_KEY`, not yet independently verified | Historical: Codex-side Studio calls ran in freemium mode despite a valid license being configured. Current: the correction is unverified until Codex restarts and a controlled with/without-credential comparison is run against it | Treat Codex Studio results as unauthenticated until both the restart and a passing controlled comparison are observed; do not migrate or print the credential value without an explicit request |
| The Claude Code desktop application's running host process was found (2026-07-13) to carry a stale, pre-migration MCP configuration snapshot baked into its own process command line, predating both the `shadcn` connector addition and the credential/version-pinning fixes — this persisted even after a believed quit-and-relaunch, because the underlying OS processes had not actually been terminated | **Resolved as of the confirmed process-tree termination**: independently re-verified at 0 `claude.exe` processes and 0 process command lines containing the credential, with authenticated Studio metadata confirmed still working from the fresh process tree. See TECH-LESSON-031 for the full before/after evidence | The Studio credential was moved out of `~/.claude.json` entirely into Windows user-level environment variables (`setx`), and the stale process tree was subsequently terminated and confirmed clean. The remaining open item is **not exposure** but long-term secret scoping: a user-wide `API_KEY` variable is broader than the Studio MCP needs and should be replaced with a Studio-specific launcher backed by an OS credential store; see TECH-LESSON-031 |

## Recommended next prototypes

1. Normalize one official field/form set and one dialog/drawer disclosure family into owned stories.
2. Compare official sidebar/dashboard composition with one Studio Application Shell variant without importing behavior.
3. Build the custom enterprise-grid state shell using a small static dataset before choosing a virtualization layer.
4. Build one POS scanner-to-cart happy path and its offline, uncertain, denied, and recovery states with AI disabled.
5. Build permission and provider-uncertainty composites from accepted primitives.
6. Run formal UI-pattern and accessibility reviews before any Prototype Approved promotion.

## Acceptance and recheck

Each selected item must follow COMPONENT_ACQUISITION_POLICY.md, COMPONENT_NORMALIZATION_STANDARD.md, and COMPONENT_ACCEPTANCE_CHECKLIST.md. Re-run discovery when the registry set, MCP versions, Studio support matrix, entitlement metadata, shadcn configuration, primitive foundation, or first-slice requirements change.
