---
document_id: PDA-DEV-007
title: Extension Plugin and Sandbox Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
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

## Isolation

Preferred execution models, from safest to most privileged:

1. Declarative configuration
2. Hosted external application using public APIs
3. Sandboxed worker or function
4. Reviewed first-party package inside the monorepo

Arbitrary customer code inside the core application process is prohibited by default.

## Permission Model

Extensions receive explicit scopes and tenant installation grants. Installation never grants more authority than the approving administrator possesses. Runtime requests revalidate permissions and entitlements.

## Data Rules

- Domain data is accessed through APIs and events.
- Secrets use the Secrets service.
- Restricted data requires explicit disclosure and review.
- Cross-tenant data is prohibited.
- Uninstall defines export, retention, deletion, webhook, and orphaned-record behavior.

## Sandbox

A developer sandbox provides synthetic data, provider simulators, rate limits, event replay, test webhooks, sample tenants, and reset. Sandbox credentials cannot reach production.

## Compatibility

Extensions declare minimum and maximum supported contracts. Breaking API or event changes follow the deprecation policy. Marketplace installation blocks incompatible versions.

## Security Review

Review covers code provenance, dependencies, permissions, network destinations, data handling, cryptography, secrets, tenant isolation, prompt injection, supply chain, update channel, and incident contact.

## Lifecycle

Draft, Submitted, Under Review, Approved, Published, Suspended, Deprecated, Removed, and Archived.

## Quality Gates

- Manifest validation
- Permission minimization
- Sandbox tests
- Tenant-isolation tests
- Upgrade and uninstall tests
- Data-export and erasure tests
- Supply-chain review
- Operational runbook
