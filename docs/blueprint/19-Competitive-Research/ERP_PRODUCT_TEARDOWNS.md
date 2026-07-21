---
document_id: PDA-CIR-027
title: ERP Product Teardown Synthesis
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0007, ADR-0016, ADR-0019, ADR-0022]
---

# ERP Product Teardown Synthesis

## Method and scope

This teardown applies PDA-CIR-014 to public documentation available by 2026-07-16. It is not a visual reconstruction. No trials, screenshots, assets, private links, or proprietary source were used. Products are grouped by design trade-off rather than scored as globally better or worse.

## Modular suites: Odoo and ERPNext

Strong patterns: broad business coverage; installable/hideable modules; configurable document workflows; role controls; visible document stages; and connection between operations and ledgers. Odoo 19 documents staged manufacturing and PLM approval roles. ERPNext documents role, document, field-level permission levels and configurable multi-stage workflows.

Weak patterns and risks: users can face a large application catalog, similarly named setup surfaces, and configuration that requires implementation knowledge. Public documentation cannot establish prevalence or ease of use. Meridian should adopt transparent state and configurable routing, improve task discovery and consequences, and reject any assumption that installing a module safely defines ownership or entitlement.

## Enterprise suites: Dynamics 365, SAP S/4HANA, and Infor CloudSuite

Strong patterns: legal-entity and environment discipline, role-oriented landing experiences, lifecycle guidance, detailed authorization, workflow, localization, and extension ecosystems. Weak patterns: implementation vocabulary, role/configuration density, environment dependencies, and high change-management load can surface to ordinary users. Consultant dependency is plausible but not measured here.

Meridian implication: preserve explicit implementation and release governance, but keep ordinary workspaces task-shaped. A platform control plane may coordinate capabilities; it cannot become a universal business-data owner.

## Mid-market suites: NetSuite OneWorld, SAP Business One, Acumatica, and Sage X3

Strong patterns: subsidiary-aware records, practical approvals, batch operations, audit history, and operational/financial linkage. NetSuite documents subsidiary constraints on items and transactions; SAP Business One documents approval stages, batch decisions, module authorizations, inventory, and pick/pack operations.

Weak patterns: edition-specific behavior is easy to overgeneralize; menus can mirror product modules rather than user goals; and configuration effects may be distributed across setup pages. Meridian should expose legal-entity and location consequences adjacent to commands and treat bulk actions as consequential, reviewable scopes.

## Bundled app suite: Zoho One

The strongest research value is app discovery and breadth for SMB buyers. The central risk is interpreting a commercial bundle as proof of one coherent authority model. Meridian must keep Party, domain roles, permissions, entitlements, workflows, events, and audit explicit even when the UI feels unified.

## ERP maze failure pattern

The maze appears when capability breadth, configuration, access, and record navigation are all represented by the same deep module hierarchy. Symptoms include ambiguous company context, duplicate setup entry points, jargon-first labels, settings without impact previews, reports detached from action, and extensions that introduce a second interaction model.

Countermeasures for Meridian are role workspaces, global and scoped search, command palette, recent work, progressive disclosure, configuration readiness, owner-linked review queues, state/freshness visibility, and documentation mapped to the current task.

## Adopt, improve, reject

| Decision | Pattern | Reason |
|---|---|---|
| Adopt | Explicit active organization/legal-entity context | Prevents silent cross-entity consequences |
| Adopt | Versioned workflow stages and approval history | Supports audit and separation of duties |
| Improve | Module discovery into role/task workspaces | Breadth without irrelevant complexity |
| Improve | Import tools with manifest and reconciliation | Makes migration recoverable |
| Reject | Superuser as routine operating role | Conflicts with least privilege |
| Reject | Generic master record owning every domain fact | Conflicts with single owner boundaries |
| Reject | In-process arbitrary custom code | Conflicts with ADR-0019 |
| Reject | Copying enterprise configuration into first slice | Conflicts with bounded scope |

## Confidence and inaccessible evidence

Confidence is Medium. Official docs establish features but not usability or operational outcomes. Authenticated implementation portals, customer configurations, contract pricing, partner methods, and some Acumatica, Sage, and Infor details were inaccessible or insufficiently stable; conclusions about them are deliberately limited.

## Sources

- [Odoo 19 three-step manufacturing](https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/manufacturing/basic_setup/three_step_manufacturing.html).
- [ERPNext item and stock-ledger behavior](https://docs.frappe.io/erpnext/item).
- [Dynamics 365 Finance documentation](https://learn.microsoft.com/en-us/dynamics365/finance/).
- [NetSuite items and subsidiaries](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N276948.html).
- [SAP Business One Inventory](https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5bf959a184d9c6727/452365de9e152b31e10000000a1553f7.html).

