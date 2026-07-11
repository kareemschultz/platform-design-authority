---
document_id: PDA-DEV-002
title: Registry and Agent Automation
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Registry and Agent Automation

## Purpose

Define machine-readable registries and automation that allow humans, CI, Claude Code, Codex, and other agents to inspect the blueprint without guessing ownership, identifiers, lifecycle state, or authority.

## Required Registries

### `registry/documents.json`

Fields:

- `document_id`
- `path`
- `title`
- `version`
- `status`
- `owner`
- `last_reviewed`
- `related_adrs`

### `registry/domains.json`

Fields:

- Canonical domain or platform area
- Namespace prefix
- Document path
- Kind
- Additional approved prefixes

### `registry/capabilities.json`

Fields:

- Capability identifier
- Owning namespace
- Display name
- Source document and heading
- Status
- Dependencies
- Packaging class
- Offline declaration
- First-slice relevance

### Future Registries

- `events.json`
- `permissions.json`
- `schemas.json`
- `integrations.json`
- `industry-packs.json`
- `jurisdictions.json`

## Source-of-Truth Rule

The authoritative human-readable specification remains the approved Markdown document or ADR. Registries are generated indexes and must identify their source path and heading.

A registry must never silently introduce a capability, event, permission, or decision that is absent from authoritative documentation.

## Generation

Registry generation must:

1. Scan governed Markdown files.
2. Parse front matter.
3. Extract identifiers from designated canonical sections.
4. Validate prefixes against `domains.json`.
5. Reject duplicate identifiers.
6. Produce deterministic sorted JSON.
7. Record schema version and source commit where available.
8. Fail CI when committed output differs from generated output.

## Agent Rules

Agents must:

- Query registries before inventing identifiers.
- Cite the authoritative document and ADR.
- Update the Markdown source first.
- Regenerate registries in the same change.
- Report ownership conflicts instead of choosing silently.
- Avoid treating Draft or Planned records as approved implementation authority.

## CI Rules

CI should validate:

- Registry JSON syntax and schema
- No duplicate identifiers
- Every document registry path exists
- Every registered document front matter matches the registry
- Every capability prefix exists in `domains.json`
- Every capability appears in exactly one canonical source section
- Generated output is clean
- Approved documents have completed review evidence

## Incremental Adoption

1. Establish domain and document registries.
2. Generate the capability registry from the capability map.
3. Move new event and permission definitions into structured canonical sections.
4. Add code generation only after registries and schemas are ratified.

## Security

Registries contain architecture metadata, not secrets. Public repositories may expose planned capabilities and technology choices, so sensitive deployment identifiers, credentials, customer names, and unreleased security details must remain outside the registries.
