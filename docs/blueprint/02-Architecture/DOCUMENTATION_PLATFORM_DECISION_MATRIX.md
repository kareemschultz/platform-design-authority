---
document_id: PDA-ARC-017
title: Documentation Platform Decision Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0005, ADR-0021, ADR-0022]
---

# Documentation Platform Decision Matrix

## Decision Summary

Prototype Fumadocs as the repository-owned publishing layer. Keep Markdown/MDX and canonical OpenAPI portable so Nextra, Starlight, or Docusaurus remains a practical fallback.

Scores use 1 (poor) through 5 (strong). Weighted totals are architecture analysis, not implementation evidence.

| Option | Next/Tailwind 15 | OpenAPI 15 | Self-host 15 | Search/UX 15 | White label 10 | Git/MDX 10 | Maintenance 10 | Version/i18n 5 | Lock-in/cost 5 | Total / 500 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Fumadocs | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | **485** |
| Nextra | 5 | 2 | 5 | 4 | 4 | 5 | 4 | 4 | 5 | **415** |
| Docusaurus | 2 | 4 | 5 | 5 | 4 | 5 | 3 | 5 | 5 | **410** |
| Astro Starlight | 2 | 2 | 5 | 5 | 4 | 5 | 5 | 4 | 5 | **395** |
| Mintlify | 2 | 5 | 2 | 5 | 3 | 4 | 5 | 4 | 1 | **355** |
| Native Next.js + MDX | 5 | 1 | 5 | 2 | 5 | 5 | 2 | 2 | 5 | **350** |
| GitBook | 1 | 5 | 2 | 5 | 3 | 4 | 5 | 5 | 1 | **345** |

## Disposition

| Option | Disposition | Reason |
|---|---|---|
| Fumadocs | Preferred prototype | Best fit for Next.js, Base UI, OpenAPI, self-hosting, search, and source ownership |
| Nextra | First fallback | Simpler Next.js/MDX stack; weaker first-party OpenAPI support |
| Docusaurus | Future multi-version fallback | Mature versioning, but another framework and copied version trees |
| Starlight | Static independent fallback | Accessible and efficient; introduces Astro and weaker API generation |
| Mintlify | Reconsider for hosted developer portal | Excellent API UX; commercial/platform dependence and license constraints |
| GitBook | Reconsider for non-technical editing | Strong collaboration and API support; managed authority and sync complexity |
| Native Next.js + MDX | Reject as default | Hidden cost of building navigation, search, OpenAPI, accessibility, redirects, and authoring tools |
| TypeDoc | Supplement only | Generates TypeScript API reference, not task-oriented product documentation |

## Required Information Architecture

- Getting started and onboarding
- Task- and role-based user guides
- Administrator, security, privacy, backup, and configuration guides
- Mobile, offline, accessibility, and troubleshooting guidance
- Developer, API, SDK, webhook, extension, and integration reference
- Release notes, migration guides, known limitations, and deprecations
- Internal engineering patterns kept outside the public collection

## Search Decision

Use Fumadocs' self-hosted Orama integration initially. Static search is acceptable while the index stays within an explicit download and memory budget. Typesense, Algolia, Orama Cloud, or another provider requires privacy, cost, availability, tenant-content, and portability review.

## Versioning Decision

Publish current documentation plus release notes and migration guides. Introduce frozen documentation versions only when the platform simultaneously supports behaviorally different release lines. Versioning every release creates duplicated content and stale corrections.

## AI and Agent Consumption

- Preserve readable Markdown source and stable page identifiers.
- Generate an `llms.txt`/document index only from public, reviewed content.
- Do not expose internal architecture, vulnerabilities, secrets, tenant data, or restricted runbooks through agent-readable endpoints.
- AI may draft documentation, but a named owner verifies behavior against the released application.

## Prototype Gates

- Exact package compatibility on Bun and Node
- Container and static build
- OpenAPI page generation and freshness
- Orama index quality, size, and performance
- Base UI theme and platform tokens
- WCAG 2.2 AA, mobile, print, keyboard, screen-reader, zoom, and reduced-motion review
- Broken links, redirects, metadata, examples, screenshot freshness, and preview deployment
- Authoring trial with engineering, support, product, and a non-technical contributor

## Official References

- `https://www.fumadocs.dev/docs`
- `https://www.fumadocs.dev/docs/integrations/openapi`
- `https://www.fumadocs.dev/docs/search/orama`
- `https://nextra.site/docs`
- `https://docusaurus.io/docs/versioning`
- `https://astro.build/themes/details/starlight/`
- `https://mintlify.com/docs/api-playground/openapi-setup`
- `https://gitbook.com/docs/developers/gitbook-api`
