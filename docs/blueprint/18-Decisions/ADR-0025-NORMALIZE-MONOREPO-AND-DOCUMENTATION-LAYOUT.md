---
document_id: ADR-0025
title: Normalize the Monorepo and Documentation Layout
version: 0.1.1
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-20
supersedes: null
superseded_by: null
related_adrs: [ADR-0016, ADR-0020, ADR-0021]
---

# ADR-0025 — Normalize the Monorepo and Documentation Layout

## Status

Proposed. The repository owner authorized the reversible layout migration on 2026-07-12. Architecture review remains required before this ADR becomes Accepted; the move does not promote any product or technology decision.

## Context

The architecture blueprint originally occupied 21 numbered directories at repository root while the implementation monorepo was nested under `meridian/`. That shape obscured the normal application entry points, made root tooling and workspace discovery indirect, and left `docs/` containing only implementation notes despite being the expected documentation boundary.

The repository now contains both governed architecture and executable prototype code. A durable layout decision is required so contributors, CI, IDEs, package managers, documentation tooling, and agents share one unambiguous root.

## Decision Drivers

- Conventional Bun/Turborepo workspace discovery from repository root
- Clear separation of executable code, governed architecture, product documentation, machine contracts, and audit evidence
- History-preserving moves without duplicating authority
- Stable root contributor instructions and validation commands
- Fewer special working-directory assumptions in CI, Docker, and local tooling
- Portable Fumadocs source under the standard `apps/docs` application name

## Options Considered

### Retain the nested scaffold and root blueprint

Lowest immediate migration cost, but preserves two competing roots and makes `docs/` misleading.

### Flatten only the scaffold

Improves code tooling but leaves hundreds of architecture files mixed with runtime configuration at root.

### Move all artifacts under `docs/`

Creates a simple prose tree but incorrectly treats OpenAPI, JSON Schemas, generated registries, and validation scripts as ordinary documentation.

### Normalize code at root and prose under `docs/`

Creates one conventional monorepo root while keeping machine-consumed contracts and governance tooling explicit.

## Decision

Adopt the following canonical layout:

```text
/
├── apps/                    # web, server, native, and documentation applications
│   └── docs/               # Fumadocs product/developer documentation portal
├── packages/               # shared API, auth, database, environment, UI, and configuration packages
├── ops/                    # implementation operations assets
├── docs/
│   ├── blueprint/          # governed architecture sections 00–20 and platform manifest
│   ├── implementation/     # scaffold provenance, migration records, and implementation conflicts
│   ├── reviews/            # immutable audits plus registrations and dispositions
│   └── templates/          # governed authoring templates
├── openapi/                # canonical machine API contracts
├── schemas/                # canonical machine message and record contracts
├── registry/               # generated and curated governance registries
├── scripts/                # deterministic governance tooling
├── .agents/ and .claude/   # repository-owned agent workflows
└── package.json            # Bun/Turborepo workspace root
```

Repository paths in active guidance, registries, schemas, workflows, and tooling use this layout. Independent audit evidence is moved without rewriting its historical contents. Product documentation remains authored in `apps/docs/content/docs`; it does not duplicate the blueprint.

## Rationale

This layout makes the repository immediately operable as a monorepo while preserving the authority hierarchy. It distinguishes prose from executable contracts: OpenAPI, schemas, and registries stay at root because applications and CI consume them directly. The Fumadocs application follows ADR-0021's selected `apps/docs` location.

## Consequences

### Positive

- Root `bun`, Turbo, Docker, IDE, and CI commands require no wrapper directory.
- Governed architecture is discoverable beneath one documentation boundary.
- Product documentation, architecture, reviews, implementation notes, and templates have explicit homes.
- Source history remains traceable through move-only commits.
- Path validation can reject stale layout references.

### Negative

- Existing links, bookmarks, issue references, and downstream automation may require redirects or updates.
- A large one-time registry and link diff is unavoidable.
- Historical independent audit text continues to mention paths that were correct when the audits were issued.

### Risks

- **Missed active path:** mitigated by repository-wide stale-path scanning and registry freshness checks.
- **Accidental audit rewrite:** mitigated by excluding immutable review evidence from content substitution.
- **Broken workspace or Docker context:** mitigated by frozen install, builds, migrations, Compose runtime, and health tests from root.
- **Authority duplication:** mitigated by keeping blueprint prose separate from product MDX and machine contracts.

## Platform Impact

- Domains and engines: no ownership or behavior change.
- APIs and events: no semantic contract change; file locations remain `openapi/` and `schemas/`.
- Data ownership: unchanged.
- Security and privacy: no authority change; public/private documentation classification remains open.
- Entitlements and billing: unchanged.
- UX, mobile, offline, and AI behavior: unchanged.
- Operations: CI and contributor commands now execute from repository root.

## Migration and Rollback

1. Record the pre-move `main` SHA.
2. Commit history-preserving moves without prose edits.
3. Update active links, scripts, workflows, registries, agent instructions, and application names separately.
4. Regenerate derived registries from moved authoritative sources.
5. Validate documentation, contracts, builds, migrations, PostgreSQL, and Docker runtime.

Before merge, rollback means abandoning the migration branch. After merge, revert the migration PR as one unit, regenerate restored registries, and verify old paths before accepting further changes.

## Validation

- No tracked `meridian/` path or active old blueprint/review/template reference
- Generated registry freshness and document-path existence
- Markdown link and governance-exemption target validation
- Frozen Bun install, Ultracite, typecheck, tests, and production builds
- Drizzle migration freshness and PostgreSQL 18.4 smoke test
- Compose configuration, Docker image builds, live stack health, and synthetic authentication
- Fumadocs navigation, type generation, and production build under `apps/docs`

## Amendment (2026-07-20): Document Supersession and Point-in-Time Evidence Conventions

This ADR governs where documentation lives; this amendment records two hygiene conventions for how a document's own front matter and body communicate its currency, adopted during the governance remediation program's Phase 7 curation pass (first applied to `PROGRESSIVE_DISCLOSURE_AND_COMPLEXITY.md` and the `COMPONENT_DISCOVERY_AUDIT.md` / `SHADCN_STUDIO_EVALUATION.md` / `WS1_THIN_APPLICATION_SHELL_IMPLEMENTATION_EVIDENCE.md` trio).

**Document supersession (tombstone).** When one document's content is folded into another and it stops being cited for current guidance:

1. Set the losing document's front matter `status: Superseded` and add a `superseded_by: <document_id>` field naming the winning document.
2. Add a blockquote immediately after the H1 stating the supersession date, the winning document's ID and filename, and what specifically moved.
3. Retain the file — it is not deleted; historical citation and audit trail depend on it staying in place.
4. Update the file's own README/index row to show `Superseded` in place of its prior lifecycle status.

The winning document states, in its own prose, that it absorbed the loser and what changed as a result, so a reader arriving at either document understands the relationship without cross-referencing this ADR.

**Point-in-time evidence banners.** An audit, evaluation, or implementation-evidence document (as distinct from living guidance) that records findings dated to a specific verification pass carries a blockquote immediately after its H1, noting that its conclusions reflect the platform and vendor catalogs as of its `last_reviewed` date and are not re-verified automatically on a later read. This does not change the document's `status` or lifecycle — it remains `Draft` evidence, dated and honest about its own currency, per CLAUDE.md §4's instruction not to promote status because a document is long, implemented, or generated.

Neither convention promotes this ADR's own `Proposed` status, and neither claims founder, legal, or architecture-review authority beyond what this ADR already carries; they are documentation-hygiene practice, adopted the same way any 09-UX curation edit is.

## References

- `docs/implementation/ROOT_DOCUMENT_MIGRATION_PROPOSAL.md`
- `docs/blueprint/07-Developer-Platform/PRODUCT_DOCUMENTATION_AND_KNOWLEDGE_ARCHITECTURE.md`
- `docs/blueprint/14-Engineering/WORKTREE_CHANGE_AND_RELEASE_COORDINATION.md`
- ADR-0020 and ADR-0021

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Repository owner | Repository organization | Migration requested | 2026-07-12 | Flatten scaffold and organize blueprint under `docs/` |
| Architecture | Authority and boundaries | Pending | | |
| Developer Platform | Tooling and documentation | Pending | | |
| Operations | CI and rollback | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial proposed layout decision and migration controls |
| 0.1.1 | 2026-07-20 | Platform Design Authority | Amendment recording the document-supersession (tombstone) and point-in-time-evidence-banner conventions |
