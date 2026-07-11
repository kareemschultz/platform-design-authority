---
document_id: PDA-MKT-001
title: Marketplace Section Index
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Marketplace

## Current Specifications

- `MARKETPLACE_ARCHITECTURE.md` — publisher lifecycle, review, discovery, installation, permissions, billing, settlement, support, suspension, and removal
- `../07-Developer-Platform/EXTENSION_PLUGIN_AND_SANDBOX_ARCHITECTURE.md` — extension manifests, execution models, permissions, sandboxing, compatibility, and uninstall
- `../13-Commercial/PARTNER_RESELLER_AND_MARKETPLACE_MODEL.md` — partner and marketplace commercial models
- `../13-Commercial/BILLING_ARCHITECTURE.md` — billing-provider and internal commercial boundaries
- `../20-Strategy/ECOSYSTEM_ACADEMY_AND_CERTIFICATION.md` — publisher and partner enablement

## Remaining Implementation-Level Depth

- Publisher application workflow
- Listing and manifest schemas
- Automated package scanning pipeline
- Review checklist and certification fixtures
- Installation and upgrade APIs
- Marketplace search and recommendation ranking
- Rating and dispute moderation procedures
- Settlement-provider selection
- Publisher dashboard and customer administration UX

Marketplace content must use published contracts and may not create hidden database access, broaden permissions silently, bypass tenant policy, or weaken uninstall and data-portability rights.
