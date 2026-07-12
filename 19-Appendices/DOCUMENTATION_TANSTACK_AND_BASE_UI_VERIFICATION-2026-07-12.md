---
document_id: PDA-APP-014
title: Documentation TanStack and Base UI Verification 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
---

# Documentation, TanStack, and Base UI Verification — 2026-07-12

## Verified Release Snapshot

| Technology | Version/maturity observed | Classification |
|---|---|---|
| Fumadocs Core/UI | 16.11.3 | Current npm stable observed |
| Fumadocs MDX | 15.1.0 | Current npm stable observed |
| Fumadocs OpenAPI | 11.1.1 | Current npm stable observed |
| Nextra/docs theme | 4.6.1 | Current npm stable observed |
| Astro Starlight | 0.41.3 | Current npm stable observed |
| Docusaurus | 3.10.2 | Current stable release observed |
| Changesets CLI | 2.31.0 | Current npm stable observed |
| Base UI | 1.6.0 | Official latest stable release |
| TanStack Start | Release Candidate | Framework API considered stable by project; not bug-free |
| TanStack Start RSC | Experimental | Project says experimental into early v1 |

Reverify all exact packages together before creating a lockfile.

## Documentation Findings

- Fumadocs provides content adapters, MDX, UI, search, static output, i18n utilities, and OpenAPI page generation.
- Its OpenAPI integration can render endpoint information, examples, response samples, TypeScript definitions, and a playground from a canonical specification.
- Orama is the default/recommended self-hosted search path and supports server or static operation.
- Fumadocs' interactive OpenAPI proxy warns against unreliable origins because forwarded headers can include cookies or authorization.
- Nextra is a Next.js App Router plugin with MDX, Pagefind search, static rendering, i18n, and a documentation theme, but no equivalent first-party OpenAPI system was verified.
- Docusaurus has mature versioning and explicitly warns that unnecessary versions increase contributor and build complexity.
- Starlight provides an accessible-by-default complete docs solution but introduces Astro.
- Mintlify and GitBook provide strong managed collaboration/API features but introduce commercial/platform authority and portability questions.

## Base UI Findings

- `@base-ui/react` is an unstyled accessible React primitive library compatible with Tailwind.
- Official Base UI documentation records stable 1.0 in December 2025 and 1.6.0 as latest on 2026-06-17.
- shadcn/ui made Base UI its default for new projects on 2026-07-12 while continuing Radix support.
- Fumadocs maintains Base UI and Radix implementations and now defaults to Base UI through `@fumadocs/base-ui`.
- `@fumadocs/base-ui` is a Fumadocs UI package backed by Base UI; it is distinct from `@base-ui/react` and from the platform-owned `packages/ui-web`.
- Uber Base Web (`baseui`) is a different styled/Styletron system and was not selected.

## TanStack Video Claim Verification

- TanStack Start documents a client-led RSC model where renderables can be fetched, cached, and composed.
- `createCompositeComponent` supports children, render-prop, and component-prop slots.
- Slot content is opaque to the server and render-prop arguments must be serializable through React Flight.
- Current docs require `structuralSharing: false` when TanStack Query caches server-component values.
- TanStack Start is RC, while its RSC implementation remains experimental.

## Platform Inference

Composite Components are relevant to white-label registered slots, read-heavy dashboards, and explicit server/client composition, but not yet a production foundation. Examples that query a database directly or mutate business state in server functions conflict with the platform's Hono/oRPC application boundary.

## Official Sources

- `https://www.fumadocs.dev/docs`
- `https://www.fumadocs.dev/docs/integrations/openapi`
- `https://www.fumadocs.dev/docs/search/orama`
- `https://www.fumadocs.dev/docs/ui/component-library`
- `https://nextra.site/docs`
- `https://docusaurus.io/docs/versioning`
- `https://astro.build/themes/details/starlight/`
- `https://github.com/changesets/changesets`
- `https://base-ui.com/react/overview/releases`
- `https://base-ui.com/react/overview/accessibility`
- `https://ui.shadcn.com/docs/changelog/2026-07-base-ui-default`
- `https://tanstack.com/start/latest/docs/framework/react/overview`
- `https://tanstack.com/start/latest/docs/framework/react/guide/server-components`
- `https://tanstack.com/start/latest/docs/framework/react/comparison`
