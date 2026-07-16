---
document_id: PDA-DEV-010
title: Product Documentation and Knowledge Architecture
version: 0.2.0
status: Draft
owner: Developer Platform
last_reviewed: 2026-07-16
related_adrs: [ADR-0016, ADR-0021, ADR-0022]
document_class: specification
declared_depth: architecture-specified
evidence_state: documented
applicable_dimensions: [purpose, authority-and-scope, data-and-integrity, contracts-and-compatibility, authority-controls, experience-and-accessibility, offline-and-degraded, failure-and-recovery, security-and-privacy, migration-and-extensibility, verification-and-evidence, external-dependencies, references-and-traceability]
---

# Product Documentation and Knowledge Architecture

## Purpose

Define ownership, information classes, authoring, release integration, contextual help, search, security, accessibility, and quality controls for platform documentation.

## Documentation Planes

| Plane | Audience | Authority | Publication |
|---|---|---|---|
| Architecture blueprint | Architects, reviewers, agents | Constitution, ADRs, governed specs | This repository; controlled access as required |
| Engineering knowledge | Engineers, operators, agents | Accepted decisions plus implementation evidence | Implementation repository, internal by default |
| Product help | Users and administrators | Released product behavior | `apps/docs`, public or authenticated by classification |
| Developer reference | Integrators and extension developers | Canonical OpenAPI, schemas, SDK and support policy | Generated/reference content plus reviewed guides |
| In-app contextual help | Current user in a workflow | Stable documentation ID and released product behavior | Short guidance plus link to product help |
| Release communication | Customers, support, operators, developers | Approved release contents | Release notes, changesets/changelogs, migrations, status communication |

## Proposed Repository Shape

```text
apps/docs/
  content/docs/
    getting-started/
    user-guides/
    role-guides/
    administration/
    mobile-and-offline/
    accessibility/
    troubleshooting/
    integrations/
    developers/
    release-notes/
docs/engineering/
  patterns/
  migrations/
  operations/
packages/
  design-tokens/
  ui-docs/
```

## Content Rules

- Prefer task titles such as “Close a register” over module descriptions.
- Every procedure names prerequisites, permissions, outcome, steps, errors, offline behavior, reversal/correction path, and related concepts.
- Screenshots supplement text and use synthetic data; they are not the only instruction.
- Public content excludes vulnerabilities, threat models, secret topology, private provider evidence, tenant data, and internal incident detail.
- API prose supplements canonical OpenAPI and never duplicates schemas manually.
- Examples use supported versions and are executable or explicitly illustrative.
- AI-generated drafts require named human/product verification.

## Change and Release Integration

Every feature pull request declares documentation impact. User-visible, API, permission, migration, configuration, workflow, or troubleshooting changes update documentation in the same pull request or link a blocking documentation issue.

Use Changesets for package/release metadata in an implementation monorepo. Generate package changelogs and GitHub releases from approved changesets; curate user-facing release notes by audience. ADRs remain the architecture record and are not replaced by changelog entries.

## Contextual Help

- Assign stable `PDOC-NNNN` documentation IDs independent of routes.
- Map route, capability, role, and state to a documentation ID.
- Show short, non-blocking guidance in product surfaces and open the full page in a new context.
- Never infer permission from documentation visibility.
- Bundle a reviewed offline help subset for essential Expo workflows where needed.

## Search and AI

The initial product portal uses self-hosted Orama search. Index only content the current deployment is allowed to publish. Any AI assistant uses permission-filtered content, cites page/version, identifies product release, and cannot convert documentation into execution authority.

## Quality Gates

- Front-matter schema and stable ID uniqueness
- Link, anchor, redirect, image, and code-example validation
- OpenAPI and generated-reference freshness
- Accessibility, responsive, keyboard, screen-reader, zoom, print, and reduced-motion review
- Search-result relevance fixtures
- Screenshot age and product-version metadata
- Documentation-impact check in pull requests
- Preview deployment and editorial approval
- Customer/support feedback and failed-search review

## Product Documentation Manifest

`registry/product-documentation.json` is the curated publication and evidence manifest for MDX product content. It is intentionally separate from `registry/documents.json`, which indexes governed architecture documents. `schemas/documentation/product-documentation-manifest-v1.schema.json` defines its machine contract.

Every manifest entry binds one MDX page to:

- its stable `PDOC-NNNN` identifier, route, title, content class, audience, and owner;
- publication state and applicable product/prototype version;
- an immutable Git evidence revision and last-verification date;
- implementation evidence paths;
- relevant capability IDs, permission IDs, and contract paths;
- API-reference mode where applicable.

The allowed publication states are `internal-prototype`, `release-preview`, `published`, and `retired`. `internal-prototype` is not a customer release. Promotion to `release-preview` or `published` requires a named release record, current implementation evidence, editorial/product review, security classification, accessibility review appropriate to the content, and green MDX metadata/link/build gates.

API content declares either `boundary-overview` or `generated-canonical`. A boundary overview may explain implemented and canonical surfaces but must not claim complete operation parity. A generated canonical reference must contain exactly the operation IDs from the named OpenAPI source and is rejected when parity drifts.

`scripts/validate_product_docs.py` validates the manifest schema, MDX/manifest parity, stable ID and route uniqueness, metadata equality, evidence-revision ancestry, evidence/contract paths, registered capabilities and permissions, internal documentation links, and API operation parity rules. Fumadocs' Zod schema enforces the same page metadata at MDX build time. The repository typecheck and build remain the rendering/compilation gates.

This Draft metadata contract introduces no public API and changes no domain or lifecycle authority, so no ADR is triggered. An ADR review is required before `PDOC-*` identifiers or manifest semantics become a supported external API or a cross-deployment compatibility promise.

## Ownership

Developer Platform owns the publishing system and API reference pipeline. Product/domain owners own behavioral accuracy. UX owns information design and accessibility. Support owns troubleshooting feedback. Security/privacy classify content. Release Management owns release-note completeness.

## Open Decisions

- Public versus authenticated content split
- Supported languages and translation workflow
- Screenshot automation and redaction tooling
- Search-index size threshold for a hosted provider review
- Documentation support windows for self-hosted releases
- Release-record and editorial-approval system of record beyond the controlled prototype
