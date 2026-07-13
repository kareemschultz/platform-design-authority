---
document_id: ADR-0026
title: Use Meridian as Internal Platform Codename
version: 0.2.0
status: Proposed
owner: Platform Design Authority
last_reviewed: 2026-07-13
created: 2026-07-12
related_adrs: [ADR-0016, ADR-0020, ADR-0025]
---

# ADR-0026 — Use Meridian as Internal Platform Codename

## Status

Proposed. Founder-selected engineering codename; explicitly not a trademark or commercial branding decision.

## Context

The monorepo, prototype workspace, CI workflow (`meridian-prototype.yml`), and service topology already use the name "Meridian" without a decision record. The commercial product name is deliberately undecided: trademark, npm-organization, and domain availability checks have not been performed, the eventual brand may differ per market, and white-label tenants must never be forced to expose any platform-level name. Naming the code before naming the product requires an internal codename whose replacement cost is deliberately near zero.

A meridian is a reference line used for location, coordination, and navigation — an apt metaphor for a platform that coordinates many business capabilities without turning them into separate products, and it travels from Guyana-first to regional and international expansion.

## Decision

1. **Meridian is the internal engineering codename** for the platform. It names the workspace, packages, applications, services, CI workflows, and infrastructure — nothing customer-facing.
2. **Monorepo internal package scope is `@meridian/*`** (for example `@meridian/kernel`, `@meridian/contracts`, `@meridian/commerce`, `@meridian/ui`, `@meridian/design-tokens`). This scope is **provisional and private-workspace-only** until npm-organization and trademark availability checks are completed and recorded in a dated appendix; published packages may move to a verified organization scope (fallback: `@pda/*`) without renaming source directories.
3. **Application and service names** follow the convention already in the repository: `apps/web`, `apps/native`, `apps/server`, `apps/docs`; deployed services as `meridian-api`, `meridian-worker`, `meridian-postgres`, `meridian-search`, `meridian-observability`.
4. **Canonical platform identifiers do not change with the codename.** Capabilities, events, permissions, schemas, and namespaces (`commerce.*`, `payment.*`, `platform.*`, and every family registered under ADR-0016) never embed the codename. The Naming Standards prohibition on plan names in identifiers extends to codenames.
5. **The commercial product name remains undecided** and is a separate founder decision with its own trademark, domain, and npm verification gates. Nothing in code, contracts, or documentation may treat "Meridian" as the customer-facing brand.
6. **White-label tenants never see "Meridian"** unless deliberately exposed by an explicit branding decision. User-visible strings, receipts, emails, documentation portals, and public API surfaces carry tenant or platform branding tokens, never the codename.

## Options Considered

- **Meridian (selected):** coordination/navigation metaphor fits the architecture; clean package names; serious without being generic ERP; already in de facto use in the scaffold.
- **Harbor, Northstar, Atlas, Confluence (rejected for now):** viable backups; Atlas and Confluence carry heavy existing-product associations (MongoDB Atlas, Atlassian Confluence); Harbor collides with the CNCF registry project.
- **Organization-scoped packages only (`@pda/*` or `@platform-design-authority/*`):** lowest trademark risk but weak identity; `@pda/*` is retained as the fallback publishing scope if `@meridian` is unavailable when publishing begins.
- **No codename:** rejected — the scaffold needed concrete names immediately, and ad-hoc naming was already leaking in without governance.

## Consequences

- Positive: the existing scaffold naming becomes governed; the brand decision is fully decoupled and can be made with proper legal checks; rename cost is confined to workspace metadata, service labels, and this ADR.
- Negative/risk: `@meridian` npm scope and "Meridian" marks are common; if unavailable, the publishing scope changes while source layout does not. The codename must be policed out of customer-facing surfaces — a lintable rule.

## Required Controls

- Package publishing under `@meridian/*` is blocked until an availability check is recorded in a dated appendix under `docs/blueprint/19-Appendices/`.
- CI or review checklists reject the string "Meridian" in tenant-visible UI strings, receipt templates, and public API surfaces.
- The commercial brand decision, when made, receives its own decision record and does not retroactively rename canonical identifiers.

## Validation

This ADR is honored when: the prototype workspace builds under the `meridian` name with `@meridian/*` internal packages; no registered capability, event, or permission identifier contains the codename; and a recorded availability check exists before any public package, domain, or published artifact uses the name.

## Review Record

| Date | Reviewer | Outcome |
|---|---|---|
| — | — | Pending |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.2.0 | 2026-07-13 | Platform Design Authority | Corrected the canonical documentation application path and propagated the customer-visible codename prohibition into served prototype strings |
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial codename decision governing the existing Meridian workspace naming |
