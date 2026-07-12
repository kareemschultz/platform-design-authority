---
document_id: PDA-DEV-006
title: SDK CLI and Scaffolding
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# SDK, CLI, and Scaffolding

## Purpose

Define how developers create applications, integrations, extensions, domain modules, capabilities, events, workflows, reports, and AI tools through governed generated artifacts.

## SDK Families

- TypeScript web and server SDK
- React and Next.js client helpers
- Expo and React Native SDK
- Webhook verification SDK
- Extension SDK
- Testing and provider-simulator SDK
- Future language SDKs generated from stable contracts

## CLI Responsibilities

The CLI may:

- Initialize a workspace
- Authenticate a developer
- Select tenant and environment
- Generate API clients
- Scaffold approved module and extension templates
- Register applications and webhooks
- Validate capabilities, events, permissions, schemas, and manifests
- Run local simulators
- Package and submit extensions
- Inspect compatibility and deprecations

The CLI must not bypass ordinary platform permissions, create hidden administrators, or mutate production without explicit confirmation and policy.

## Scaffolds

Initial scaffolds include:

- Domain module
- Shared engine adapter
- Capability specification
- REST endpoint and OpenAPI contract
- Event producer and consumer
- Webhook application
- Importer and exporter
- Report and dashboard widget
- Workflow and approval pack
- Industry-pack content
- AI tool and skill

Every scaffold includes ownership markers, tenant context, authorization, entitlement, audit, tests, and documentation stubs.

## Generation Rules

1. Generate from registries and approved templates.
2. Never infer domain ownership from folder location alone.
3. Reject unregistered prefixes.
4. Avoid provider-specific business abstractions.
5. Mark generated files and preserve safe regeneration boundaries.
6. Run formatting, type, architecture, security, and contract checks.

## Developer Experience

The happy path should produce a runnable local example with synthetic data, a test, a contract, and documentation. Errors identify the governing document and corrective action.

## Quality Gates

- Deterministic generation
- Idempotent regeneration
- Cross-platform paths
- No secrets in generated output
- Compatibility checks
- Golden-file tests
- Upgrade tests
- First-slice scope controls
