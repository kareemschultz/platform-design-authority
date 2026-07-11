---
document_id: PDA-DEV-001
title: Developer Platform Section Index
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Developer Platform

## Current Specifications

- `WEBHOOKS_AND_EVENT_DELIVERY.md` — external subscriptions, signing, delivery, replay, and diagnostics
- `REGISTRY_AND_AGENT_AUTOMATION.md` — machine-readable governance for humans, CI, and agents
- `API_VERSIONING_AND_DEPRECATION.md` — public, first-party, domain, provider, event, webhook, SDK, and offline compatibility
- `PROJECT_AGENT_SKILLS.md` — project-local Claude and agent skills, security boundaries, evaluation, and Vercel/Anthropic integration

## Current Project Skills

Under `.claude/skills/`:

- `frontend-architecture`
- `ui-pattern-audit`
- `dashboard-design`
- `form-wizard-design`
- `accessibility-review`
- `vercel-v0-handoff`

These skills are original repository procedures informed by public official documentation. They do not copy proprietary Anthropic or Vercel prompts and do not override the Constitution, ADRs, specifications, permissions, or human review.

## Planned Specifications

- Public and internal SDK architecture
- API application registration and consent
- CLI and scaffolding
- Extension and plugin contracts
- Sandboxes and developer environments
- Documentation and SDK generation
- Testing SDK and provider simulators
- Marketplace publishing workflow
- Agent and automation development kits
- Skill evaluation fixtures and regression tests
- Reference integrations and recipes

## Boundaries

The Event Backbone owns internal event transport. The Developer Platform owns external webhooks and application-facing delivery. Better Auth may issue approved API credentials, while Platform Authorization, entitlements, quotas, and audit remain authoritative.

Agent skills provide procedures and context, not authority. Side-effecting skills must be manually invoked, use least-privilege tools, and preserve project scope.

The Developer Platform must preserve domain boundaries, tenant isolation, permissions, entitlements, data classification, privacy transformation, audit, accessibility, version compatibility, and provider portability.
