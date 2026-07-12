---
document_id: PDA-UX-024
title: Marketing Website Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Marketing Website Architecture

## Ownership and Scope Boundary

This document governs the platform company's public marketing website, not a tenant's Marketing business domain, campaigns, customer records, consent, or communications. “Owner” here means the accountable company team for a public-site surface; it does not transfer authoritative tenant Marketing Domain data or behavior.

This surface is outside the first-slice implementation registry. Levels L3–L5 remain roadmap concepts and cannot expand `registry/first-slice.json` without the normal scope-change process.

## Purpose

Define the public marketing website, product storytelling, documentation entry points, demonstrations, content governance, performance, analytics, accessibility, SEO, and use of licensed premium UI sources.

## Technology Direction

- Next.js for the public web application
- Latest approved stable Tailwind CSS
- Source-owned shadcn/ui primitives
- Magic UI Pro and shadcn/studio premium blocks where licensed and appropriate
- Platform semantic tokens
- Recharts or lightweight static graphics for truthful product visualizations
- A headless or repository-backed content source selected after editorial workflow evaluation

Premium assets are accelerators, not architecture authority. Imported source follows `TAILWIND_SHADCN_AND_PREMIUM_UI_SOURCE_POLICY.md`.

## Information Architecture

Initial public areas:

- Home
- Platform overview
- Capability and domain pages
- Industry and jurisdiction pages
- Offline and regional-readiness story
- AI and automation approach
- Security, privacy, and trust
- Developer platform and integrations
- Marketplace and partners
- Pricing or editions when approved
- Resources, documentation, changelog, and status
- Company, contact, legal, and accessibility

Pages must distinguish current product, prototype, planned capability, partner solution, and future vision.

## Content Ownership

- Marketing owns campaign and merchandising content.
- Product owns product claims and screenshots.
- Security and Privacy approve trust claims.
- Commercial approves pricing and packaging.
- Legal approves terms, privacy, cookies, trademarks, and regulated claims.
- Platform Design Authority approves architectural descriptions.

## Product Demonstrations

Interactive demonstrations must use synthetic data and clearly state whether they are prototypes or production behavior. They cannot expose internal environments, customer data, secrets, or unsupported roadmap promises.

## Performance Budgets

Provisional targets:

- Largest Contentful Paint: 2.5 seconds p75 or less
- Interaction to Next Paint: 200 ms p75 or less
- Cumulative Layout Shift: 0.1 or less
- Initial JavaScript on ordinary content pages: 200 KB compressed target
- Critical images use responsive sizing and modern formats
- Nonessential animation loads after primary content

## Animation

Magic UI Pro or shadcn/studio animations may explain product value, but must:

- Respect reduced motion
- Avoid blocking navigation or reading
- Avoid continuous CPU-heavy effects
- Avoid misleading product simulation
- Preserve keyboard and screen-reader access
- Degrade cleanly when JavaScript fails

## SEO and Structured Data

- Semantic headings and landmarks
- Canonical URLs
- Metadata and social previews
- Sitemap and robots policy
- Organization, SoftwareApplication, Product, FAQ, Article, and Breadcrumb structured data only when truthful
- Locale-aware URLs when localization is launched
- No hidden keyword content or fabricated reviews

## Analytics and Consent

Analytics must be privacy-minimized, consent-aware where required, and separated from authenticated product telemetry. Do not load unnecessary third-party trackers. Record source, purpose, fields, retention, and processor.

## Security

- Content Security Policy
- Safe external-link handling
- No secrets in client code
- Sanitized rich content
- Controlled form submissions and spam protection
- Dependency and supply-chain scanning
- Preview-environment access controls

## Accessibility

Target WCAG 2.2 AA. All pages support keyboard navigation, visible focus, semantic structure, text scaling, reduced motion, contrast, accessible forms, captions or transcripts, and usable mobile layouts.

## Release Governance

Every public claim has an owner and evidence source. Legal, pricing, certification, provider, customer-count, benchmark, and regulatory claims require dated verification.

## Quality Gates

- Content and claim review
- Accessibility checks
- Core Web Vitals
- SEO validation
- Link and structured-data validation
- Consent and privacy review
- Premium-source provenance
- Cross-browser and responsive tests
- Synthetic-data verification

## Ownership and First-Slice Boundary

This governs the platform company's corporate site, not a tenant Marketing Domain, campaigns, audiences, or customer data. It is outside the first retail slice and adds no capability.
