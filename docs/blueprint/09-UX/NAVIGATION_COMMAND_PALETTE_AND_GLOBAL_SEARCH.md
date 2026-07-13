---
document_id: PDA-UX-020
title: Navigation Command Palette and Global Search
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-13
---

# Navigation, Command Palette, and Global Search

This document owns interaction behavior. Search/index architecture is governed by `docs/blueprint/10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md`, and result/command ordering by `docs/blueprint/10-Data/SEARCH_AND_COMMAND_RANKING_POLICY.md`. Tab and menu interaction contracts (including the prohibition on nested tabs) are governed by `ADVANCED_INTERFACE_PATTERNS.md`; this document does not restate them. Pagination and list-state persistence mechanics are governed by `ENTERPRISE_TABLE_AND_DATA_GRID_STANDARD.md`.

## Purpose

Define how users move across workspaces, records, actions, recent items, saved views, and search without exposing the platform's full complexity.

More nested menus are not automatically simpler. The failure mode this document guards against is the classic ERP maze — menu → submenu → submenu → screen → tab → hidden drawer — where users spelunk for a destination rather than recognizing it. Simplicity comes from a shallow, predictable structure plus fast accelerators (search, command palette, recents, favorites), not from hiding depth behind more layers.

## Navigation Model

The model has five layers, each with a distinct job. A destination has exactly one **owning** layer among primary navigation, the nested capability-group level, contextual navigation, and record navigation — do not let one of those four duplicate what another already owns. The fifth layer, fast access, is deliberately the exception: it is an accelerator, not a competing owner, and rule 12 requires every destination it surfaces to also exist at its proper owning layer. Search, the command palette, recents, and favorites referencing a destination is not a duplicate-ownership violation; a second *persistent menu* claiming the same destination is.

1. **Primary navigation** — a small, role-based list of frequent workspaces. This is the only layer visible at all times regardless of context.
2. **One nested level** — capability groups related to the selected workspace (secondary navigation). This is the only permitted level of nesting beneath primary navigation.
3. **Contextual navigation** — tabs or a local sidebar scoped to the selected workspace or record, for peer views of the same object.
4. **Record navigation** — breadcrumbs and an explicit back path once inside a specific record or deep screen.
5. **Fast access** — global search, favorites, recents, and the command palette, available from anywhere as accelerators, not as the only path to a destination.

Supporting elements at every layer:

- Stable application shell
- Recent and favorite records
- Context switcher for tenant, organization, location, and workspace

## Rules

1. Navigation reflects permissions and entitlements but is not the enforcement layer.
2. Primary navigation contains frequent destinations only.
3. Deep features remain discoverable through search, command palette, or workspace configuration.
4. Context changes are explicit and visible.
5. URLs preserve significant navigation and filter state.
6. Mobile navigation prioritizes the current task.
7. **No more than two persistent, always-rendered navigation levels** (primary navigation plus one nested level of secondary/capability-group navigation). Tabs, local sidebars, breadcrumbs, and drawers are contextual to a workspace or record and do not count against this limit, but they also may not be used to smuggle in a third persistent global level.
8. **A submenu (secondary navigation level) must represent one coherent capability group** — items a user would recognize as belonging together by task, not an arbitrary folder of unrelated destinations grouped for menu-tidiness.
9. **Do not mix destinations and actions in the same menu without visual and semantic separation.** "Go to Inventory" and "Adjust stock" are different kinds of menu items; a menu that blends navigation targets with commands must group and label them distinctly (e.g., a separator plus a heading), never interleave them as visually identical rows.
10. **The current tenant, organization, location, workspace, and offline/degraded state must always be visible**, not only reachable by opening a switcher. A user should never have to open a menu to find out which context they are currently acting in.
11. **URLs preserve filter, sort, page, selected tab, and record context wherever meaningful** — reloading, sharing, or returning via back-button must restore the same view, not reset it. This extends rule 5 with the specific state that must survive: filters, sort order, pagination position, active tab, and the selected/open record.
12. **A destination reachable through search or the command palette must also have a discoverable non-search path** (primary nav, secondary nav, contextual nav, or an explicit link from a related screen). Search and the palette are accelerators for people who already know what they want; they are not permitted to be the sole route to a capability, since that makes the capability effectively undiscoverable to everyone else.
13. Tabs are for peer views of the same object or workspace, never a way to reach unrelated capabilities; nested tabs are prohibited (see `ADVANCED_INTERFACE_PATTERNS.md`'s anti-pattern list — this document does not duplicate that rule, only cross-references it for navigation designers).
14. **Mobile navigation preserves the task, not the desktop layout.** Do not compress a multi-level desktop sidebar onto a phone screen; redesign the flow around what the mobile user is actually trying to do (see `ADVANCED_INTERFACE_PATTERNS.md`'s responsive transformation guidance for tabs, drawers, and dense views).

## Command Palette

The palette supports navigation, record lookup, and approved actions. Actions show required context and confirmation. It is an expert accelerator, not the only discovery path.

## Global Search

Search groups results by type and provides safe previews, scope, freshness, and navigation target. Counts and suggestions must not leak protected records.

## Quality Gates

- Keyboard operation
- Screen-reader semantics
- Context-switch safety
- Permission and entitlement tests
- Mobile behavior
- Search leakage tests
- Command confirmation and audit
- Navigation depth: no persistent level beyond primary + one nested level exists anywhere in the shipped surface
- Context visibility: tenant, organization, location, workspace, and offline/degraded state are visible without opening a menu, on every screen
- URL-state fidelity: reload, share, and back-button restore filter, sort, page, active tab, and selected record
- Non-search discoverability: every destination surfaced by search or the command palette also has a working non-search path
