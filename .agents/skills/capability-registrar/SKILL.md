---
name: capability-registrar
description: Register or revise a canonical capability, namespace, first-slice depth, permission family, events, ownership, packaging, offline behavior, and registry entries.
disable-model-invocation: true
argument-hint: "[capability-id-or-topic]"
---

# Capability Registrar

Register `$ARGUMENTS` only after confirming its authoritative owner and avoiding duplicate concepts.

## Read First

- `registry/domains.json`
- `registry/capabilities.json`
- `registry/first-slice.json`
- `registry/permissions.json` when present
- `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`
- Relevant engine, domain, marketplace, commercial, security, and developer specifications
- `04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md`
- ADR-0016

## Process

1. Search for an existing capability or synonym.
2. Confirm the namespace is registered and appropriate.
3. Create an ADR before adding a new ownership prefix.
4. Define purpose, owner, users, maturity, permissions, entitlement class, dependencies, data, APIs, events, offline behavior, privacy, security, UX, operations, and tests.
5. Add the capability to an approved canonical capability source.
6. If first-slice relevant, assign `full`, `prototype`, or `seam` depth and record explicit deferrals.
7. Register required permissions and canonical events.
8. Update dependency and packaging documents.
9. Regenerate registries and run governance checks.

## Rules

- Plan names are prohibited in capability IDs.
- Directory names do not create ownership automatically.
- A capability cannot be both included and deferred.
- `seam` never means production delivery is promised.
- Do not use capability registration to grant permissions or entitlements.

## Output

Report capability ID, namespace, owner, first-slice depth, permissions, events, dependencies, affected files, and validation results.
