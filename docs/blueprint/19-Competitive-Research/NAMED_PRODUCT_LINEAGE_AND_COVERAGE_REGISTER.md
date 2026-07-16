---
document_id: PDA-CIR-096
title: Named Product Lineage and Coverage Register
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003]
---

# Named Product Lineage and Coverage Register

## Purpose and Completion Rule

This register closes CIR-BACK-024 by reconciling product names explicitly requested for the competitive-intelligence program. A name is not evidence. Each name receives one dated disposition: **Studied**, **Covered by successor**, **Deferred with reason**, or **Rejected as irrelevant**. “Studied” means the product contributed bounded evidence to a cited wave; it does not mean every edition, geography, workflow, integration, or claim was tested.

Research cutoff: **2026-07-16**. Product naming and status were checked against current public first-party product, help, release, acquisition/branding, developer, or public-source pages. No paid or configured tenant was used. The register does not promote products, dependencies, components, or scope.

## Reconciled Names Requiring Explicit Lineage Treatment

| Requested name | Current canonical locator/name at cutoff | Disposition | Coverage or reason | Evidence and limitations |
|---|---|---|---|---|
| Peachtree | Sage 50 Accounting | Covered by successor | historical name is reconciled to current Sage 50; accounting and ERP waves already use current Sage product evidence, but no Peachtree-era behavior is treated as current | [Sage 50 help](https://help-sage50.na.sage.com/en-us/2022/Content/home.htm) states “formerly Peachtree”; help edition is not a current cross-region parity claim |
| Sage 50 | Sage 50 Accounting | Studied | relevant SMB accounting comparator; current lineage is recorded, while detailed configured workflow remains unavailable | same official help locator; Sage product/region/version differences remain material |
| Vend | Lightspeed Retail POS (X-Series) | Covered by successor | POS/catalog/inventory name is mapped to the active Lightspeed product; Vend is not double-counted as an independent current product | [Lightspeed's Vend page](https://www.lightspeedhq.com/vend/) and [domain migration FAQ](https://x-series-support.lightspeedhq.com/hc/en-us/articles/25533675227163-Retail-X-Series-domain-migration-FAQ); configured register untested |
| Lightspeed Retail | Lightspeed Retail POS product families, including X-Series | Studied | commerce/POS/supply-chain evidence uses the current family and preserves series/edition context | [X-Series help center](https://x-series-support.lightspeedhq.com/hc/en-us) and [product-name FAQ](https://www.lightspeedhq.com/au/lightspeed-product-name-update-faq/); no suite-wide parity claim |
| Retail Pro | Retail Pro Prism | Studied | relevant POS/inventory/device comparator; current documentation identifies maintained Prism releases and device-specific guides | [Retail Pro Prism](https://www.retailpro.com/include/eng/solutions/prism/), [documentation index](https://my.retailpro.com/documentation/?bookid=1&chapterid=1&documentid=2&p=4), and [Prism app guide](https://my.retailpro.com/documentation/?bookid=287&chapterid=0&documentid=287&p=4); vendor-documented, no trial |
| Invoice Ninja | Invoice Ninja v5 | Studied | relevant invoicing/quotes/projects/time-tracking and open/self-hosted comparator; treated as focused accounting/project evidence, not ERP completeness | [official documentation](https://invoiceninja.github.io/), [self-hosting page](https://www.invoiceninja.org/getting-started/), and [official repository](https://github.com/invoiceninja/invoiceninja); hosting/edition behavior untested |
| Horilla | Horilla HR | Studied | relevant open-source HR/workforce comparator; documentation also describes CRM surfaces, but does not displace Party or domain ownership | [Horilla documentation](https://docs.horilla.com/) and [product site](https://www.horilla.com/); official pages contain inconsistent license-version wording, so exact license terms require repository/legal review |
| OpenHRMS | Open HRMS | Studied | relevant open-source HR suite comparator; bounded to documented HR modules and implementation-dependency evidence | [Open HRMS documentation](https://www.openhrms.com/documentation/); configuration, release support and jurisdiction behavior untested |
| OpenProject | OpenProject 17.x | Studied | relevant open-source project/work-management comparator; current release activity verified and project patterns covered by the Projects wave | [documentation](https://www.openproject.org/docs/) and [release notes](https://www.openproject.org/docs/release-notes/); no configured enterprise/community tenant tested |
| Freshworks | Freshworks product company/family | Covered by current named products | Freshworks is not treated as one product. Freshservice, Freshdesk/Freshdesk Omni, Freshsales, Freshchat and Freshcaller retain separate capability contexts | [Freshworks products](https://www.freshworks.com/products/) and [2017 company/product naming notice](https://www.freshworks.com/press-releases/freshdesk-is-now-freshworks/); edition/tier behavior untested |
| Freshservice | Freshservice / Freshservice for MSPs | Studied | service and ITSM/MSP evidence in PDA-CIR-054 and PDA-CIR-087 through PDA-CIR-089 | [Freshservice product explanation](https://www.freshworks.com/products/what-is-freshservice/) and SRC-042 |
| Freshdesk | Freshdesk / Freshdesk Omni | Studied | service/support wave; not conflated with Freshservice or Freshsales | [Freshworks products](https://www.freshworks.com/products/); configured omnichannel behavior untested |
| Freshsales | Freshsales / Freshsales Suite | Studied | CRM wave; not treated as Party authority | [Freshsales product explanation](https://www.freshworks.com/products/what-is-freshsales/); AI and automation behavior untested |

## Requested Catalog Coverage by Wave

This table prevents silent omission while avoiding repetitive product prose. “Studied” refers to the cited wave synthesis and its page-level source register. A grouped row does not assert equivalent depth across every member.

| Requested comparator set | Disposition at cutoff | Durable output/qualification |
|---|---|---|
| Odoo, ERPNext, Microsoft Dynamics 365, NetSuite, SAP Business One/S/4HANA, Acumatica, Zoho One, Sage ERP products, Infor CloudSuite, open/mid-market ERP alternatives | Studied as representative ERP set; Acumatica/Infor/Sage enterprise depth remains limited | PDA-CIR-025 through PDA-CIR-028; weaker depth remains an explicit limitation, not a false absence claim |
| Shopify/Shopify POS, Cin7, Unleashed, Fishbowl, Katana, MRPeasy, Odoo Inventory/Purchase/Manufacturing, ERPNext Stock/Buying/Manufacturing, Zoho Inventory, NetSuite/Dynamics/SAP supply-chain products, WMS alternatives | Studied at grouped/representative depth | PDA-CIR-029 through PDA-CIR-036; direct warehouse scanner/device observation remains blocked in PDA-CIR-097/098 |
| Square, Toast, Shopify POS, Lightspeed, Clover, Revel, NCR | Studied at representative documented depth | PDA-CIR-037/038 and PDA-CIR-045/046; device, geography, processor and edition limits are retained |
| Stripe, Adyen, PayPal/Braintree, Checkout.com | Studied as payment-provider references | PDA-CIR-041/042 and PDA-CIR-047; no Guyana eligibility/certification claim and no provider selection |
| Shopify Commerce, BigCommerce, WooCommerce, Medusa, Saleor, marketplace/stored-value products | Studied at representative depth | PDA-CIR-039 through PDA-CIR-044 and PDA-CIR-047; marketplace paid billing/payout remains gated |
| Salesforce, HubSpot, Pipedrive, Zoho CRM, Freshsales, Dynamics 365 Sales | Studied as CRM set | PDA-CIR-048/049/059; Party ownership remains Meridian authority |
| Linear, Jira, Asana, Monday.com, ClickUp, Notion, OpenProject | Studied as representative projects/work-management set | PDA-CIR-050/051 and PDA-CIR-058/059; current OpenProject lineage added here |
| ServiceNow, Zendesk, Freshdesk | Studied as service/support set | PDA-CIR-052 through PDA-CIR-054 and PDA-CIR-059 |
| Jobber, Housecall Pro, Salesforce Field Service, ServiceTitan and accessible alternatives | Studied at documented representative depth; ServiceTitan/authenticated flows remain limited | PDA-CIR-055/056/059; direct field-device behavior remains unobserved |
| Rental and booking products appropriate to target workflows | Studied at representative documented depth | PDA-CIR-057/058/059 and SRC-032; category breadth remains limited |
| Rippling, BambooHR, HiBob, Deel, Gusto, Workday, ADP, UKG, SAP SuccessFactors, Personio, Horilla, OpenHRMS | Studied at representative HR/payroll depth | PDA-CIR-060 through PDA-CIR-063 and PDA-CIR-068/069; no global payroll completeness claim |
| 7shifts, Deputy, When I Work | Studied as workforce/scheduling set | PDA-CIR-064/065 and PDA-CIR-068/069 |
| Expensify, Ramp, Brex and adjacent expense tools | Studied as expense-management set | PDA-CIR-066 through PDA-CIR-069; card/tax/reimbursement rails untested |
| OpenAI, Anthropic, Microsoft Copilot, GitHub Copilot, Notion AI | Studied as AI-assistance references | PDA-CIR-070/071/079; volatile behavior is qualified and no model/provider selected |
| Linear, Slack, Discord, GitHub, Vercel, Stripe | Studied across productivity, collaboration, notifications and documentation patterns | PDA-CIR-074 through PDA-CIR-079; grouped evidence does not imply feature parity |
| Metabase, Power BI, Tableau, Looker, Grafana | Studied as analytics references | PDA-CIR-072/073/078/079; metric authority and accessible alternatives remain Meridian requirements |
| Algolia, Elasticsearch/OpenSearch | Studied as search references | PDA-CIR-074/078/079; tenant isolation/ranking/freshness require implementation evidence |
| Intercom, Zendesk and mature documentation/changelog products including shadcn/studio patterns | Studied as notification/documentation references | PDA-CIR-075/077 through PDA-CIR-079; no premium assets or catalog exports committed |
| ServiceNow, Freshservice, HaloPSA, SuperOps, NinjaOne, ConnectWise, Datto RMM, IT Glue | Studied in continuation wave | PDA-CIR-087 through PDA-CIR-089; direct tenant/agent observation remains open |
| Keycloak, authentik, Better Auth and adjacent enterprise directory patterns | Studied in continuation wave | PDA-CIR-090 through PDA-CIR-092; Better Auth ownership remains governed, no plugin enabled |
| NetBox, phpIPAM, Snipe-IT, UniFi, Fortinet | Studied in continuation wave | PDA-CIR-093 through PDA-CIR-095; no infrastructure scope/provider admitted |

## Deferred and Rejected Names

No explicitly requested name was rejected as irrelevant. Some products received category-level rather than full product-teardown depth because the research question could be answered with representative evidence and because paid/authenticated, regional, device, implementation, or edition access was unavailable. Those limitations remain in each wave and do not permit “complete market coverage” claims.

Historical brands are not treated as current evidence when an official successor exists. Company names are not treated as product names when the company publishes separate products. Acquired or renamed products are counted once under the current canonical product while the requested alias remains searchable here.

## Grouped Comparator Primary-Evidence Completion

The catalog reconciliation exposed five names that had only grouped wave treatment or generalized prose without an exact first-party workflow citation. The following completion narrows that evidence gap. It does not supply configured-product, plan, edition, geography, usability, reliability, accessibility, customer, implementation, or independent-review evidence.

| Comparator | First-party evidence at cutoff | Adopt or improve | Reject or constrain |
|---|---|---|---|
| Acumatica | official help documents functional-area workspaces and mapped import scenarios with prepare/import and result review | task-shaped entry points; staged, mapped and reviewable imports | a UI workspace as a domain-ownership boundary; direct-table import or silent partial mutation |
| QuickBooks Desktop Enterprise | official help documents customizable roles and Advanced Inventory with multiple sites, per-site reorder points, transfers and migration-history warnings | visible role scope and permission reporting; location-aware controls; explicit migration consequences | desktop company-file authorization as tenant authority; add-on presence as ledger/costing correctness; history loss without reconciliation and recovery |
| monday.com | official help documents dependency modes and automatic date movement plus configurable automations | explicit dependency direction, mode, impact preview and bounded automation | silent cross-task date mutation; plan/beta behavior as a core contract |
| ClickUp | official help documents `blocks`/`blocked by`, dependency automation, permanent clearing and a mobile limitation | directional relationships, cycle checks, warnings and accessible alternatives | domain rules hidden in custom-field automation; irreversible bulk mutation without confirmation and recovery evidence |
| Rippling | official product pages describe centralized employee data, staged HR workflows, payroll data flow, permissions and approvals | staged onboarding/offboarding and payroll orchestration with provenance | “single source of truth” marketing overriding Party, HR, Payroll, IT, Assets or Authorization ownership; any inferred Guyana payroll support |

Detailed citations and access limits are retained in PDA-CIR-020, PDA-CIR-025, PDA-CIR-050, PDA-CIR-060, PDA-CIR-062 and SRC-075 through SRC-079.

## Findings and Meridian Implications

- Lineage is a source-integrity requirement: a stable alias-to-current-product record prevents stale links and double counting.
- Product-family labels are too broad for detailed capability claims; edition, series, target segment, geography and access mode remain necessary.
- Open-source availability does not prove production readiness, security, support, upgrade quality, jurisdiction fit, or lower implementation cost.
- A vendor's integrated suite does not redefine Meridian Party, tenant, authorization, domain, event, audit, correction, offline, or extension ownership.
- Current release evidence establishes that a product is active only at the cited date; it does not prove all previously documented capabilities remain available.

## Confidence, Limitations, and Revalidation

Confidence is high for the explicit Peachtree/Sage 50 and Vend/Lightspeed lineage statements because first-party pages state them; medium for product-family canonicalization; and low-to-medium for detailed behavior not tested in configured products. Official web pages can change, geographic sites can differ, and vendor documentation can be inconsistent. No acquisition/legal/trademark conclusion is made beyond the source language.

Revalidate a row when a source redirects, product or edition is renamed/discontinued/acquired, a cited wave begins implementation, a current release cannot be confirmed, or by 2027-07-16.

## Transfer Record

CIR-BACK-024 may be marked **Transferred** through this register, CIR-LED-0014, RES-012, SRC-062 through SRC-069, and SRC-075 through SRC-079. Transfer closes the naming/accounting and explicit primary-citation gaps; it does not convert grouped coverage into full product testing or remove each wave's limitations.
