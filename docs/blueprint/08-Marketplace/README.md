---
document_id: PDA-MKT-001
title: Marketplace Section Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Marketplace

## Artifact Catalog

- [Marketplace Architecture](MARKETPLACE_ARCHITECTURE.md) — `PDA-MKT-010` · Draft
- [Publisher Review and Extension Lifecycle](PUBLISHER_REVIEW_AND_EXTENSION_LIFECYCLE.md) — `PDA-MKT-011` · Draft
- [Marketplace Commercial Phasing](MARKETPLACE_COMMERCIAL_PHASING.md) — `PDA-MKT-012` · Draft

## Related Authority

- `docs/blueprint/07-Developer-Platform/EXTENSION_PLUGIN_AND_SANDBOX_ARCHITECTURE.md`
- `docs/blueprint/18-Decisions/ADR-0019-PHASED-EXTENSION-EXECUTION-MODEL.md`
- `docs/blueprint/13-Commercial/PARTNER_RESELLER_AND_MARKETPLACE_MODEL.md`
- `docs/blueprint/13-Commercial/BILLING_ARCHITECTURE.md`
- `docs/blueprint/20-Strategy/ECOSYSTEM_ACADEMY_AND_CERTIFICATION.md`
- `docs/blueprint/06-AI/AI_REGISTRY_SCHEMAS_AND_PROVIDER_EXIT.md`

## Commercial Phase

The initial marketplace is private or free-listings-first. Direct publisher billing may be supported under separate contracts. Platform-billed listings, connected accounts, and publisher payout remain disabled until FDR-002, FDR-003, FDR-008, legal and tax review, payout-provider validation, and a new ADR are complete.

## Capability Governance

Marketplace has a registered namespace, canonical capabilities, lifecycle events, permission and extension boundaries, and AI-pack linkage. Marketplace approval cannot bypass Developer Platform, Security, AI, Commercial, Finance, or domain authority.

## Remaining Implementation Evidence

- Listing and manifest JSON schemas
- Automated package scanning and signing pipeline
- Review checklist and certification fixtures
- Installation, update, suspension, and uninstall APIs
- Marketplace search and recommendation ranking implementation
- Rating and moderation procedures
- Publisher dashboard and customer administration UX
- Paid-phase settlement provider and legal evidence

Marketplace content may not create hidden database access, broaden permissions silently, bypass tenant policy, or weaken uninstall and portability rights.
