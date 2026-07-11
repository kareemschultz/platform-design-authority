---
document_id: PDA-UX-020
title: Navigation Command Palette and Global Search
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Navigation, Command Palette, and Global Search

## Purpose

Define how users move across workspaces, records, actions, recent items, saved views, and search without exposing the platform's full complexity.

## Navigation Model

- Stable application shell
- Role-based primary navigation
- Workspace-specific secondary navigation
- Breadcrumbs for hierarchy
- Recent and favorite records
- Search and command palette
- Context switcher for tenant, organization, location, and workspace

## Rules

1. Navigation reflects permissions and entitlements but is not the enforcement layer.
2. Primary navigation contains frequent destinations only.
3. Deep features remain discoverable through search, command palette, or workspace configuration.
4. Context changes are explicit and visible.
5. URLs preserve significant navigation and filter state.
6. Mobile navigation prioritizes the current task.

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
