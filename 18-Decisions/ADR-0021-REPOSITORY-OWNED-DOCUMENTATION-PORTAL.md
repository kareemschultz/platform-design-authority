---
document_id: ADR-0021
title: Use a Repository-Owned Fumadocs Documentation Portal
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-12
last_reviewed: 2026-07-12
supersedes: null
superseded_by: null
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# ADR-0021 — Use a Repository-Owned Fumadocs Documentation Portal

## Status

Proposed. Fable and implementation review remain required.

## Context

The platform needs professional user, administrator, developer, API, troubleshooting, migration, release, and in-application help. The solution must preserve self-hosting, white label, source control, OpenAPI authority, accessibility, and AI-readable content without creating a second content authority.

## Options Considered

- Fumadocs on Next.js with local MDX and generated OpenAPI pages
- Nextra on Next.js
- Docusaurus or Astro Starlight as a separate framework
- Mintlify or GitBook as a managed documentation platform
- Hand-built Next.js and MDX
- Deferral to repository Markdown only

## Decision

Use Fumadocs in `apps/docs` as the preferred controlled-prototype documentation portal.

- Markdown/MDX in the implementation repository is authoritative for published prose.
- `openapi/first-slice-v1.yaml` and later governed OpenAPI files generate API reference; generated pages are not edited as a second contract.
- Use self-hosted Orama search initially; external search requires a separate privacy, cost, and portability review.
- Use Base UI-backed Fumadocs UI under ADR-0022 and platform-owned tokens.
- Published product docs, internal engineering knowledge, and this architecture repository remain distinct information classes.
- Stable documentation identifiers connect in-app contextual help to published pages.
- Do not create copied documentation versions until more than one supported product line actually requires them.

## Rationale

Fumadocs scored highest in `02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md` because it aligns with Next.js, TypeScript, Tailwind, Base UI, Git review, self-hosting, search, and first-party OpenAPI rendering. Native MDX has lower dependency overhead but transfers navigation, search, API rendering, accessibility, redirects, and content tooling to the platform team.

## Consequences

### Positive

- One reviewable source for human- and agent-readable content
- Strong alignment with the selected web stack and design system
- Generated API reference from canonical contracts
- Self-hosted search and container deployment
- Professional information architecture without a managed-docs dependency

### Negative

- Adds a documentation application and upgrade surface
- MDX permits executable components and therefore requires a restricted component registry and security review
- Product documentation still requires ownership, editorial review, screenshots, testing, and release discipline
- Fumadocs internationalization utilities do not replace an application-wide localization system

## Required Controls

- Pin compatible Fumadocs package versions and test them as a set.
- Allow only approved MDX components; prohibit arbitrary imports, secrets, tenant data, and unsafe HTML.
- Validate links, front matter, accessibility, navigation, OpenAPI freshness, search indexing, redirects, and static/container builds in CI.
- Preview every documentation pull request.
- Require a documentation-impact disposition in feature pull requests.
- Keep internal security findings, threat models, provider evidence, and protected operational material out of the public portal.
- Require review before enabling an interactive API proxy; never forward ambient cookies or authorization headers to untrusted origins.

## Migration and Rollback

Begin with getting-started, task guides, administration, developer/API, troubleshooting, and release notes. Keep content as portable Markdown/MDX and canonical OpenAPI so Nextra, Starlight, Docusaurus, or a static renderer remains a viable fallback.

## Validation

- Bun and Node build compatibility
- Docker and static-export comparison
- OpenAPI generation and semantic freshness
- Orama search quality and index size
- WCAG 2.2 AA review
- Broken-link, redirect, metadata, screenshot, and code-example tests
- White-label token and responsive behavior
- Contributor and non-engineer authoring trial

## References

- `02-Architecture/DOCUMENTATION_PLATFORM_DECISION_MATRIX.md`
- `07-Developer-Platform/PRODUCT_DOCUMENTATION_AND_KNOWLEDGE_ARCHITECTURE.md`
- `19-Appendices/DOCUMENTATION_TANSTACK_AND_BASE_UI_VERIFICATION-2026-07-12.md`

## Review Record

| Reviewer | Perspective | Decision | Date | Notes |
|---|---|---|---|---|
| Architecture | Platform fit | Pending | | |
| UX/accessibility | Reader experience | Pending | | |
| Developer Platform | OpenAPI and authoring | Pending | | |
| Security/privacy | Public/private boundary | Pending | | |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial proposal |
