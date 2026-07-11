---
document_id: PDA-DEV-001
title: Developer Platform Section Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Developer Platform

## Current Specifications

- `WEBHOOKS_AND_EVENT_DELIVERY.md` — external subscriptions, signing, delivery, replay, and diagnostics
- `REGISTRY_AND_AGENT_AUTOMATION.md` — machine-readable governance for humans, CI, and agents
- `API_VERSIONING_AND_DEPRECATION.md` — API, event, webhook, SDK, provider, and offline compatibility
- `PUBLIC_API_AND_APPLICATION_REGISTRATION.md` — application types, credentials, scopes, consent, developer portal, and revocation
- `SDK_CLI_AND_SCAFFOLDING.md` — SDK families, CLI, generators, simulators, and developer workflow
- `EXTENSION_PLUGIN_AND_SANDBOX_ARCHITECTURE.md` — manifests, execution models, permissions, sandboxes, compatibility, and uninstall
- `PROJECT_AGENT_SKILLS.md` — Claude and agent skills, security boundaries, evaluation, and Vercel integration

## Project Skills

Under `.claude/skills/`:

- `frontend-architecture`
- `ui-pattern-audit`
- `dashboard-design`
- `form-wizard-design`
- `accessibility-review`
- `vercel-v0-handoff`

These are original project procedures. They do not override repository authority or copy proprietary prompts.

## Remaining Implementation-Level Depth

- Concrete OpenAPI and SDK packages
- CLI executable and authentication flow
- Generator templates and golden tests
- Provider simulator package
- Developer portal UX
- Extension runtime implementation
- Sandbox infrastructure
- Marketplace submission integration
- Skill evaluation fixtures and regression tests

The Event Backbone owns internal event transport. The Developer Platform owns external applications, credentials, SDKs, webhooks, extensions, sandboxes, and application-facing compatibility.
