---
document_id: ADR-0026
title: Use Meridian as Internal Platform Codename
version: 0.3.0
status: Proposed
owner: Platform Design Authority
last_reviewed: 2026-07-17
created: 2026-07-12
related_adrs: [ADR-0016, ADR-0020, ADR-0025]
related_founder_decisions: [FDR-011]
---

# ADR-0026 — Use Meridian as Internal Platform Codename

## Status

Proposed. The Founder reaffirmed the internal-only operating direction on 2026-07-17 and approved FDR-011's separate commercial naming and publication gates; that approval does not promote this ADR's lifecycle status or constitute trademark, domain-availability, or public package-publishing clearance.

## Context

The monorepo, prototype workspace, CI workflow (`meridian-prototype.yml`), and service topology already use the name "Meridian" without a decision record. The commercial product name is deliberately undecided: trademark, npm-organization, and domain availability checks have not been performed, the eventual brand may differ per market, and white-label tenants must never be forced to expose any platform-level name. Naming the code before naming the product requires an internal codename whose replacement cost is deliberately near zero.

A meridian is a reference line used for location, coordination, and navigation — an apt metaphor for a platform that coordinates many business capabilities without turning them into separate products, and it travels from Guyana-first to regional and international expansion.

## Decision

1. **Meridian is the internal engineering codename** for the platform. It names the workspace, packages, applications, services, CI workflows, and infrastructure — nothing customer-facing.
2. **Monorepo internal package scope is `@meridian/*`** (for example `@meridian/kernel`, `@meridian/contracts`, `@meridian/commerce`, `@meridian/ui`, `@meridian/design-tokens`). This scope is **provisional and private-workspace-only** until npm-organization and trademark availability checks are completed and recorded in a dated appendix; publishing under `@meridian/*` is prohibited until FDR-011 is ratified. Published packages may move to a verified organization scope without renaming source directories; `@pda/*` is only a candidate fallback and is not presumed available.
3. **Application and service names** follow the convention already in the repository: `apps/web`, `apps/native`, `apps/server`, `apps/docs`; deployed services as `meridian-api`, `meridian-worker`, `meridian-postgres`, `meridian-search`, `meridian-observability`.
4. **Canonical platform identifiers do not change with the codename.** Capabilities, events, permissions, schemas, and namespaces (`commerce.*`, `payment.*`, `platform.*`, and every family registered under ADR-0016) never embed the codename. The Naming Standards prohibition on plan names in identifiers extends to codenames.
5. **The commercial product name remains undecided** under FDR-011 and has separate trademark, domain, npm, and public-identity verification gates. Nothing in code, contracts, or documentation may treat "Meridian" as the customer-facing brand.
6. **White-label tenants never see "Meridian"** unless deliberately exposed by an explicit branding decision. User-visible strings, receipts, emails, documentation portals, and public API surfaces carry tenant or platform branding tokens, never the codename.

## Options Considered

- **Meridian (selected):** coordination/navigation metaphor fits the architecture; clean package names; serious without being generic ERP; already in de facto use in the scaffold.
- **Harbor, Northstar, Atlas, Confluence (rejected for now):** viable backups; Atlas and Confluence carry heavy existing-product associations (MongoDB Atlas, Atlassian Confluence); Harbor collides with the CNCF registry project.
- **Organization-scoped packages only (`@pda/*` or `@platform-design-authority/*`):** potentially lower naming risk but weaker identity; both remain unverified candidates, not reserved fallback scopes.
- **No codename:** rejected — the scaffold needed concrete names immediately, and ad-hoc naming was already leaking in without governance.

## Consequences

- Positive: the existing scaffold naming becomes governed; the brand decision is fully decoupled and can be made with proper legal checks; rename cost is confined to workspace metadata, service labels, and this ADR.
- Negative/risk: `@meridian` npm scope and "Meridian" marks are common; if unavailable, the publishing scope changes while source layout does not. The codename must be policed out of customer-facing surfaces — a lintable rule.

## Required Controls

- Package publishing under `@meridian/*` is blocked until the relevant availability and legal checks are recorded in a dated appendix under `docs/blueprint/19-Appendices/` and FDR-011 is ratified.
- CI or review checklists reject the string "Meridian" in tenant-visible UI strings, receipt templates, and public API surfaces.
- The commercial brand decision, when made, receives its own decision record and does not retroactively rename canonical identifiers.

## Validation

This ADR is honored when: the prototype workspace builds under the `meridian` name with `@meridian/*` internal packages; no registered capability, event, or permission identifier contains the codename; and FDR-011 plus a completed availability-check appendix exist before any public package, domain, or published artifact uses the name. `PRODUCT_NAMING_AND_PACKAGE_SCOPE_AVAILABILITY-2026-07-17.md` is the honest baseline: it records that the checks have not yet been performed and therefore does not clear public use.

## Review Record

| Date | Reviewer | Outcome |
|---|---|---|
| 2026-07-17 | Founder (`kareemschultz`, repository owner) | Confirmed the internal-only direction and approved the P-W1 F-L-006 FDR-011 controls in [issue #81 comment 5008157609](https://github.com/kareemschultz/platform-design-authority/issues/81#issuecomment-5008157609); ADR lifecycle remains Proposed and commercial naming/availability remain open |

## Change Log

| Version | Date | Author | Change |
|---|---|---|---|
| 0.3.0 | 2026-07-17 | Platform Design Authority | Recorded the founder's internal-only direction without lifecycle promotion, linked FDR-011, and clarified that the dated baseline contains no availability clearance |
| 0.2.0 | 2026-07-13 | Platform Design Authority | Corrected the canonical documentation application path and propagated the customer-visible codename prohibition into served prototype strings |
| 0.1.0 | 2026-07-12 | Platform Design Authority | Initial codename decision governing the existing Meridian workspace naming |
