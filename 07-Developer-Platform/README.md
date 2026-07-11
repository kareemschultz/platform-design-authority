---
document_id: PDA-DEV-001
title: Developer Platform Section Index
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Developer Platform

## Current Specifications

- `WEBHOOKS_AND_EVENT_DELIVERY.md` — external subscriptions, signing, delivery, replay, and diagnostics
- `REGISTRY_AND_AGENT_AUTOMATION.md` — machine-readable governance for humans, CI, and agents

## Planned Specifications

- Public and internal SDK architecture
- API application registration and consent
- CLI and scaffolding
- Extension and plugin contracts
- Sandboxes and developer environments
- Documentation and SDK generation
- API and event compatibility and deprecation policy
- Testing SDK and provider simulators
- Marketplace publishing workflow
- Agent and automation development kits
- Reference integrations and recipes

## Boundaries

The Event Backbone owns internal event transport. The Developer Platform owns external webhooks and application-facing delivery. Better Auth may issue approved API credentials, while Platform Authorization, entitlements, quotas, and audit remain authoritative.

The Developer Platform must preserve domain boundaries, tenant isolation, permissions, entitlements, data classification, privacy transformation, audit, and version compatibility.