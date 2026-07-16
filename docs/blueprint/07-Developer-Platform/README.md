---
document_id: PDA-DEV-001
title: Developer Platform Section Index
version: 0.9.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Developer Platform

## Artifact Catalog

- [Webhooks and Event Delivery](WEBHOOKS_AND_EVENT_DELIVERY.md) — `PDA-DEV-002` · Draft
- [Registry and Agent Automation](REGISTRY_AND_AGENT_AUTOMATION.md) — `PDA-DEV-003` · Draft
- [API Versioning and Deprecation](API_VERSIONING_AND_DEPRECATION.md) — `PDA-DEV-004` · Draft
- [Project Agent Skills](PROJECT_AGENT_SKILLS.md) — `PDA-DEV-005` · Draft
- [SDK CLI and Scaffolding](SDK_CLI_AND_SCAFFOLDING.md) — `PDA-DEV-006` · Draft
- [Extension Plugin and Sandbox Architecture](EXTENSION_PLUGIN_AND_SANDBOX_ARCHITECTURE.md) — `PDA-DEV-007` · Draft
- [Public API and Application Registration](PUBLIC_API_AND_APPLICATION_REGISTRATION.md) — `PDA-DEV-008` · Draft
- [Reference Integrations and Provider Simulators](REFERENCE_INTEGRATIONS_AND_PROVIDER_SIMULATORS.md) — `PDA-DEV-009` · Draft
- [Product Documentation and Knowledge Architecture](PRODUCT_DOCUMENTATION_AND_KNOWLEDGE_ARCHITECTURE.md) — `PDA-DEV-010` · Draft

## Related Authority and Contracts

- `docs/blueprint/02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md`
- `docs/blueprint/18-Decisions/ADR-0021-REPOSITORY-OWNED-DOCUMENTATION-PORTAL.md`
- `docs/blueprint/18-Decisions/ADR-0019-PHASED-EXTENSION-EXECUTION-MODEL.md`
- `openapi/first-slice-v1.yaml`
- `schemas/providers/provider-capability-v1.schema.json`
- `schemas/webhooks/webhook-envelope-v1.schema.json`
- `schemas/offline/sync-batch-v1.schema.json`

## Project Skills

### Governance

- `spec-author`
- `adr-author`
- `consistency-auditor`
- `capability-registrar`
- `review-disposition`
- `technology-evidence-maintainer`

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
- Fumadocs portal, canonical OpenAPI generation, contextual-help map, search, and documentation CI prototype

The Event Backbone owns internal transport. The Developer Platform owns external applications, credentials, SDKs, webhooks, extensions, simulators, developer sandboxes, and application-facing compatibility.
