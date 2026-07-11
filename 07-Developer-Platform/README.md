---
document_id: PDA-DEV-001
title: Developer Platform Section Index
version: 0.6.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Developer Platform

## Current Specifications

- `WEBHOOKS_AND_EVENT_DELIVERY.md`
- `REGISTRY_AND_AGENT_AUTOMATION.md`
- `API_VERSIONING_AND_DEPRECATION.md`
- `PUBLIC_API_AND_APPLICATION_REGISTRATION.md`
- `SDK_CLI_AND_SCAFFOLDING.md`
- `EXTENSION_PLUGIN_AND_SANDBOX_ARCHITECTURE.md`
- `REFERENCE_INTEGRATIONS_AND_PROVIDER_SIMULATORS.md`
- `PROJECT_AGENT_SKILLS.md`
- `../18-Decisions/ADR-0019-PHASED-EXTENSION-EXECUTION-MODEL.md`
- `../openapi/first-slice-v1.yaml`
- `../schemas/providers/provider-capability-v1.schema.json`
- `../schemas/webhooks/webhook-envelope-v1.schema.json`
- `../schemas/offline/sync-batch-v1.schema.json`

## Project Skills

### Governance

- `spec-author`
- `adr-author`
- `consistency-auditor`
- `capability-registrar`
- `review-disposition`

### Frontend and Experience

- `frontend-architecture`
- `ui-pattern-audit`
- `dashboard-design`
- `form-wizard-design`
- `accessibility-review`
- `vercel-v0-handoff`

## Extension Execution

ADR-0019 permits declarative extensions and externally hosted applications first. Platform-hosted sandboxed code is future work gated on security prototypes. Arbitrary third-party code is prohibited in the core application process.

## Remaining Implementation Evidence

- Generated TypeScript SDK package
- CLI executable and authentication flow
- Generator templates and golden tests
- Provider simulator package
- Developer portal UX
- Execution-sandbox prototypes
- Marketplace submission integration
- Skill evaluation fixtures and trigger regression tests

The Event Backbone owns internal transport. The Developer Platform owns external applications, credentials, SDKs, webhooks, extensions, simulators, developer sandboxes, and application-facing compatibility.
