---
document_id: PDA-UX-035
title: Shadcn Studio Evaluation
version: 0.1.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
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
| Returned metadata | 61 block families and 146 inspiration identifiers | Complete safe metadata response observed in this audit |
| Item entitlement fields | Not returned | Premium-only count remains unverified |
| Independent page/template/layout/animation/theme types | Not returned reliably | Do not invent totals |

The public documentation describes /ftc as primarily installing blocks represented by Figma frame names and allowing minor changes. That is not evidence that it can safely translate complex operational layout, state machines, authority, or application contracts.

## Codex support status

Studio's current documentation lists VS Code, Cursor, Windsurf, Cline, and Claude Code as supported clients and provides a dedicated Claude Code setup section. It explicitly says Codex is not supported because Studio's instruction payload exceeds a Codex MCP response-size limit, and directs readers to upstream issues.

In this audit, the MCP server initialized and safe metadata calls returned usable results inside a MCP-enabled Codex task. This proves only bounded local interoperability for those calls. It does not contradict the vendor support statement, prove full command reliability, or justify fetching large licensed payloads through Codex.

Required fallback:

- Use metadata-only calls in Codex.
- Use a vendor-supported client for a later authenticated, item-level source review.
- Keep each result bounded and record truncation or missing fields.
- Never silently interpret an incomplete response as a complete catalog.

## Inventory profile

| Studio category | Families | Typical value | Meridian disposition |
|---|---:|---|---|
| Bento Grid | 1 | Marketing and summary composition | Restricted |
| dashboard-and-application | 17 | Shells, headers, sidebars, forms, charts, settings, states | Preferred Candidate or Researching by family |
| Datatable | 1 | Table visual composition | Researching; custom enterprise behavior required |
| eCommerce | 13 | Storefront and checkout presentation | Restricted; production storefront deferred |
| Marketing UI Components | 29 | Landing, auth-page presentation, social proof, pricing, portfolio | Restricted to marketing or visual research |
| Total | 61 | 146 inspiration variants | No automatic approval |

The complete family and variant names are in COMPONENT_SOURCE_MATRIX.md.

## Strengths

- Broad visual variation can reduce blank-page design work.
- Application Shell, dashboard shell/header/sidebar, Account Settings, Form Layout, Empty State, File Upload, and multi step form families address genuine composition needs.
- Blocks are based on the shadcn ecosystem and can be normalized into source-owned code when licensing allows.
- Marketing compositions may accelerate the separate public-marketing surface.
- /rui can support bounded refinement after Meridian requirements and tokens are supplied.

## Weaknesses

- Catalog metadata does not expose per-item version, entitlement, dependency, accessibility evidence, license scope, or independent content type.
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

Any Studio credential disclosed in a conversation is treated as compromised. It must be revoked or rotated through the vendor account before later authenticated work. This audit neither used nor persisted such a credential.

## Recommendation

Retain Studio MCP 1.0.7 as a pinned, optional discovery tool. Keep official shadcn/ui as canonical registry interface. Revisit Studio only for a named candidate and user task, through a supported-client fallback, after credential rotation and license review. If Studio cannot provide bounded, auditable source and dependency evidence, use official primitives and build the Meridian composite directly.

## Sources and recheck

- Studio MCP documentation: https://shadcnstudio.com/docs/getting-started/shadcn-studio-mcp-server
- Official shadcn MCP documentation: https://ui.shadcn.com/docs/mcp
- MCP package registry metadata for the exact configured packages

Recheck at every Studio MCP update, support-matrix change, license change, metadata-schema change, shadcn configuration change, or candidate acquisition.
