---
document_id: PDA-DEV-007
title: Extension Plugin and Sandbox Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0019]
---

# Extension, Plugin, and Sandbox Architecture

## Purpose

Define how third-party and first-party extensions add capabilities without bypassing tenant isolation, domain ownership, permissions, entitlements, data classification, compatibility, or marketplace governance.

## Extension Types

- Integration connector
- Workflow or approval pack
- Report or dashboard widget
- Theme
- Document template
- Importer or exporter
- Domain-specific application
- AI skill or tool pack
- Device or provider adapter

## Manifest

Every extension declares identifier, publisher, version, supported platform versions, capabilities, requested permissions, required entitlements, events, webhooks, routes, UI surfaces, data classes, storage, network access, regions, support, privacy terms, billing, and uninstall behavior.

## Execution Classes

ADR-0019 is authoritative:

1. Declarative extension
2. Externally hosted application using public APIs
3. Future sandboxed WASM or isolated worker after security prototype
4. Reviewed first-party package

Arbitrary third-party code inside the core application process is prohibited.

## Developer Sandbox versus Execution Sandbox

A **developer sandbox** is a non-production environment containing synthetic tenants, provider simulators, test webhooks, event replay, rate limits, and reset controls. Its credentials cannot reach production.

An **execution sandbox** is a security boundary for platform-hosted publisher code. It is not available for GA until ADR-0019 controls, runtime prototypes, resource limits, network denial, signing, tenant-isolation tests, and emergency suspension are proven.

These terms must never be used interchangeably.

## Permission Model

Extensions receive explicit scopes and tenant installation grants. Installation cannot grant more authority than the approving administrator possesses. Runtime calls revalidate permissions, entitlements, tenant scope, classification, and installation status.

## Data Rules

- Domain data is accessed through APIs and events.
- Secrets use mediated secret references.
- Restricted data requires explicit disclosure and review.
- Cross-tenant data is prohibited.
- Local extension storage is declared, scoped, exportable, and deletable.
- Uninstall defines export, retention, deletion, webhook, credential, and orphaned-record behavior.

## Network and Runtime Rules

Externally hosted applications declare destinations and processors. Future execution sandboxes use default-deny egress, no ambient filesystem or credentials, typed inputs and outputs, CPU/memory/time limits, cancellation, and audited metering.

## AI Skill and Tool Packs

Publisher AI assets enter the same Model, Prompt, Tool, Agent, Evaluation, Incident, Budget, Memory, and Provider Exit governance as first-party AI assets. Listing suspension immediately prevents new execution and may revoke installed runtime authority according to incident policy.

## Compatibility

Extensions declare minimum and maximum supported contracts. Breaking API or event changes follow the deprecation policy. Marketplace installation and update block incompatible versions.

## Security Review

Review covers provenance, dependencies, permissions, network destinations, data handling, cryptography, secrets, tenant isolation, prompt injection, supply chain, update channel, signing, runtime limits, uninstall, and incident contact.

## Lifecycle

Draft, Submitted, Under Review, Approved, Published, Suspended, Deprecated, Removed, and Archived.

## Quality Gates

- Manifest validation
- Permission minimization
- Developer-sandbox tests
- Execution-sandbox tests before Class 3 use
- Tenant-isolation tests
- Upgrade and uninstall tests
- Data-export and erasure tests
- Supply-chain and signing review
- AI governance linkage where applicable
- Operational runbook and kill switch
