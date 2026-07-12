---
document_id: PDA-ENGR-001
title: Engineering Section Index
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Engineering

## Current Specifications

- `TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- `WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md`
- `ADVANCED_FRONTEND_TECHNIQUE_CATALOG.md`
- `ENGINEERING_HANDBOOK.md`
- `IMPLEMENTATION_RECIPES_AND_SCAFFOLDING.md`
- `ARCHITECTURE_DEPENDENCY_RULES.md`
- `registry/architecture-rules.json`
- `docs/blueprint/07-Developer-Platform/SDK_CLI_AND_SCAFFOLDING.md`
- `docs/blueprint/07-Developer-Platform/PROJECT_AGENT_SKILLS.md`
- `docs/blueprint/02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`
- `docs/blueprint/16-Testing/PLATFORM_TESTING_STRATEGY.md`
- `openapi/first-slice-v1.yaml`
- `schemas/`

## Current Direction

The implementation begins as a TypeScript modular monolith with domain-owned persistence, explicit contracts, outbox events, architecture tests, OpenTofu infrastructure, Tailwind and shadcn/ui web foundations, Expo native clients, and generated registries and schemas.

The machine-readable dependency rules define package families, allowed dependency direction, prohibited imports, single table and migration ownership, cycle policy, and expiring exceptions.

## Remaining Implementation Evidence

- Exact monorepo package map and packages
- Executable architecture-test toolchain
- TypeScript lint, formatting, and build configuration
- Money, quantity, time, and identifier libraries
- Better Auth adapter
- Outbox, idempotency, and event schema reference implementation
- Offline client and sync server
- Generated SDK and CLI
- Dependency-update automation
- Signed build and release pipeline
- Technical-debt and deprecation dashboards
- GitHub Project, worktree, Changesets, documentation-impact, and release automation trial

Engineering recipes implement approved specifications rather than silently becoming architecture decisions.
