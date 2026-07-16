---
document_id: PDA-CIR-025
title: ERP Competitive Capability Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0007, ADR-0016, ADR-0019, ADR-0022]
---

# ERP Competitive Capability Matrix

## Purpose and authority boundary

Compare representative ERP suites for cross-domain administration and implementation patterns. This research cannot change domain ownership, capability scope, permissions, entitlements, or first-slice depth. The Constitution, proposed ADRs, domain specifications, and registries remain controlling Draft authorities.

## Cutoff, sample, and access

Research cutoff: 2026-07-16. Evidence is officially documented unless marked otherwise. No authenticated tenant was tested. Editions were compared by documented surface: Odoo 19.0; ERPNext current public documentation (including v16-labelled material); Dynamics 365 Finance and Supply Chain Management; NetSuite OneWorld; SAP Business One 10.0 and S/4HANA Cloud documentation; Acumatica public help; Zoho One; Sage X3; and Infor CloudSuite. Enterprise configuration, partner extensions, geography, and contract entitlements vary; absence from public help is not proof of absence.

## Segment matrix

| Product group | Segment and delivery | Strong documented patterns | Material limits for this comparison | Meridian disposition |
|---|---|---|---|---|
| Odoo 19.0 | Modular mid-market suite; community and enterprise variants | Application breadth, staged manufacturing, activities, configurable approvals | Module/edition and configuration depth vary; consultant practice not directly tested | Adopt discoverability ideas; reject module sprawl as primary IA |
| ERPNext | Open-source SMB/mid-market ERP | Role/document permissions, configurable workflows, hideable modules, auditable document stages | Hosted and self-managed operations differ; documentation quality is uneven | Adopt transparent workflow states; improve boundary clarity |
| Dynamics 365 | Enterprise cloud applications | Implementation lifecycle guidance, legal-entity context, workflow and Power Platform seams | Licensing, environment, and implementation dependencies are substantial and volatile | Adopt explicit context and lifecycle; reject platform jargon in task UI |
| NetSuite OneWorld | Multi-subsidiary cloud ERP | Subsidiary-aware master data, intercompany and elimination concepts | OneWorld-only behavior must not be generalized to all NetSuite editions | Adopt legal-entity consequence visibility |
| SAP S/4HANA / Business One | Enterprise and SMB product families | Role-oriented entry points, approval stages, document audit, inventory authorization | Products are not equivalent; configuration and implementation access are extensive | Adopt role/task entry; reject transaction-code and menu maze imitation |
| Acumatica | Mid-market cloud ERP | Workspace-oriented navigation plus mapped, prepared and reviewed import scenarios | Public help coverage and edition packaging require revalidation; no configured tenant was tested | Adopt task-shaped workspaces and governed staged imports; reject UI workspaces as ownership boundaries or direct-table import contracts |
| Zoho One | Bundled business-app suite | Broad app discovery and integration across SMB tools | App boundaries can duplicate records and policy; suite packaging is not one data model | Reject bundle-equals-platform reasoning |
| Sage X3 / Infor CloudSuite | Mid-market and industry ERP | Localization, industry depth, role/security configuration | Detailed documentation can be gated; no direct workflow test | Defer product-specific claims; retain implementation-risk lessons |

## Capability observations

| Capability | Market pattern | Strong pattern | Repeated risk | Meridian implication |
|---|---|---|---|---|
| Application shell | Modules, workspaces, favorites, role menus | Role- and task-shaped entry with recents and search | Broad module trees become an ERP maze | Keep capability-aware workspaces and progressive disclosure |
| Company context | Company, legal entity, subsidiary, branch, warehouse | Visible active context and transaction consequence | Silent context persistence and unsafe switching | Context must be explicit, scoped, audited, and cleared on switch |
| Master data | Shared customers, suppliers, items, dimensions | Controlled reuse and duplicate handling | One generic master record steals domain ownership | Party remains canonical identity; domains retain role records |
| Configuration | Setup checklists and parameter pages | Readiness, dependency, and impact previews | Hundreds of loosely ordered settings | Prefer guided, reversible, evidence-backed configuration |
| Roles and approvals | Role permissions plus document workflow | Stage-specific authority and separation of duties | Superuser escape hatches and confusing role inheritance | Keep permissions separate from entitlements and approvals |
| Import and migration | Templates, mappings, validation, batch status | Dry run, row errors, resumability, reconciliation | Partial imports with unclear downstream consequences | Require manifests, hashes, idempotency, and owner validation |
| Audit | Chatter, history, document logs | Actor, transition, reason, and source visibility | UI history mistaken for tamper-resistant audit | Platform Audit remains the authoritative cross-cutting record |
| Reporting | Embedded reports and export | Scope, as-of time, drill-through | Stale extracts and duplicated metric definitions | Planning/Analytics governs metrics; owners govern source facts |
| Extensibility | Plugins, scripts, low-code, partner add-ons | Versioned contracts and isolated extensions | In-process arbitrary code and upgrade breakage | Preserve ADR-0019 isolation and deny arbitrary core-process code |
| Upgrades | Release trains and migration tooling | Compatibility checks and rollback plans | Customization debt and partner dependency | Record provenance, supported combinations, and removal conditions |
| Jobs/search/notifications | Queues, global search, inboxes | Permission-filtered state with retry/health | Cross-domain aggregators becoming authority | Aggregators reference owner records and expose freshness |
| Mobile | Focused approvals and field tasks | Bounded role workflows | Desktop ERP squeezed into mobile | Transform tasks; declare degraded/offline limits |

## Table stakes and exclusions

Table stakes are explicit organization/location context, role-aware navigation, approval and audit trails, bulk import with error handling, configurable reporting, searchable records, notification routing, and upgrade-safe extension seams. Meridian must not copy broad-module navigation, global superuser assumptions, silent cross-company switching, provider-specific contracts, or customization that bypasses owner commands.

## Confidence, contradictions, and revalidation

Confidence is High for the cited documented workflows, Medium for cross-product synthesis, and Low for usability, consultant dependency, and real implementation cost because no production deployments were observed. Public documentation establishes supported behavior, not reliability or adoption. Revalidate at implementation planning, major product releases, plan changes, and after direct task testing.

## Primary sources

- [Odoo 19.0 approval workflow](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/plm/management/approvals.html) — retrieved 2026-07-16.
- [ERPNext workflows](https://docs.frappe.io/erpnext/workflows) and [role-based permissions](https://docs.frappe.io/erpnext/permissions) — retrieved 2026-07-16.
- [Dynamics 365 Finance documentation](https://learn.microsoft.com/en-us/dynamics365/finance/) — retrieved 2026-07-16.
- [NetSuite subsidiary records](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N272471.html) — retrieved 2026-07-16.
- [SAP Business One approvals](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/077beb5578d80033e10000000a44538d.html) and [authorizations](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/45071a5bf61941dee10000000a1553f6.html) — retrieved 2026-07-16.
- [Acumatica workspaces](https://help.acumatica.com/Wiki/ShowWiki.aspx?PageID=51c2588f-6596-4091-9545-1d6fe1447303&wikiname=HelpRoot_Interface) and [import scenarios](https://help.acumatica.com/Wiki/ShowWiki.aspx?PageID=c6a08ccf-7f71-4b69-9508-fbfef5720a53&wikiname=HelpRoot_Integration) — official help, retrieved 2026-07-16; edition and configured behavior untested.
