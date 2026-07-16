---
document_id: PDA-CIR-006
title: Competitive Research Source Registry
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Source Registry

## 1. Purpose

This registry defines the source classes Meridian may use for competitive intelligence, the evidence each class can support, and the limits that prevent research from becoming imitation, unsupported inference, or accidental authority.

It complements `SOURCE_TRUST_MODEL.md`. The trust model explains how evidence is weighted; this registry defines how source classes are recorded and used operationally.

## 2. Registry Rules

Every material research claim must record:

- source owner and publisher;
- source title or product surface;
- stable locator where lawful and practical;
- publication, retrieval, or observation date;
- source class;
- access level: public, authenticated, paid, private preview, or unavailable;
- exact claim supported;
- confidence;
- known limitations;
- whether the evidence is direct, documented, inferred, anecdotal, or unknown;
- revalidation trigger.

A source must never be cited as supporting a claim it does not actually establish.

## 3. Source Classes

| Class | Examples | Strongest legitimate use | Cannot establish by itself |
|---|---|---|---|
| Official product documentation | Help centers, manuals, user guides | Current documented product behavior and supported workflows | Real-world usability, adoption, reliability, or customer satisfaction |
| Official technical documentation | API docs, SDK docs, schema docs | Public integration surface, documented limits, compatibility | Internal architecture or undocumented behavior |
| Official release communication | Changelogs, release notes, migration notices | Product evolution, additions, removals, deprecations | Quality, adoption, completeness, or roadmap certainty |
| Official roadmap | Public roadmap, project board | Stated direction and acknowledged work | Delivery date, final scope, or production availability |
| Official pricing and packaging | Pricing page, plan matrix | Public commercial packaging at observation time | Contract-specific terms, profitability, or actual entitlement implementation |
| Official legal terms | Terms, license, privacy policy | Usage, redistribution, access, and retention constraints | Legal advice beyond the plain text reviewed |
| Official product demonstration | Product tour, webinar, vendor video | Visible workflow and vendor explanation | Independent task success, accessibility, performance, or backend design |
| Direct product observation | Trial, demo, paid account, Mobbin reference | Visible screens, interaction sequence, information hierarchy | Hidden states, full accessibility, security, or architecture |
| Public source code | Official GitHub repository | Actual implementation, dependencies, tests, license | Hosted service behavior when deployments differ |
| Issue tracker and support forum | GitHub issues, vendor forum | Recurrent defects, confusion, workarounds, maintenance burden | Prevalence across all customers without broader evidence |
| Independent professional review | Analyst, practitioner, accountant, engineer | Comparative experience and implementation context | Universal truth or current feature state without corroboration |
| Structured review platform | G2, Capterra, app stores | Repeated themes and customer language | Precise prevalence, unbiased sampling, or technical root cause |
| Community discussion | Reddit, Hacker News, forums, social posts | Pain-point discovery and hypothesis generation | Authoritative feature or architecture claims |
| UX research catalog | Mobbin and equivalent | Comparative screen and flow evidence | Source code, accessibility, security, or business-rule correctness |
| Component/code catalog | shadcn/ui, Shadcn Studio | Primitive or composition candidates with provenance | Meridian approval, domain semantics, accessibility completeness, or architecture authority |
| Academic or standards source | Standards bodies, peer-reviewed papers | Definitions, validated methods, regulatory or technical baseline | Vendor-specific implementation state |
| Internal Meridian evidence | Prototype tests, telemetry, usability studies | Meridian-specific behavior and validation | General market truth beyond the tested context |

## 4. Source Preference Order

For current product capabilities, prefer:

1. official documentation or direct product observation;
2. official release notes and public technical artifacts;
3. official support content;
4. multiple independent professional or customer sources;
5. community discussion as hypothesis input only.

For user pain points, prefer triangulation across:

- support content;
- structured reviews;
- community discussion;
- direct usability observation;
- Meridian prototype evidence.

For architecture claims, require one of:

- official technical documentation;
- public source code;
- vendor engineering publication;
- directly observable protocol behavior;
- explicit classification as inference.

## 5. Paid and Authenticated Sources

Paid access does not increase authority automatically. It may improve coverage while also creating retention and redistribution restrictions.

For Mobbin, premium UI catalogs, licensed templates, or private previews:

- do not commit credentials, tokens, cookies, private URLs, or account identifiers;
- do not mirror the source;
- do not commit screenshots or licensed assets unless redistribution is explicitly permitted;
- record original analysis rather than copied descriptions;
- retain only the minimum lawful reference needed for future verification;
- state when another reviewer needs equivalent paid access to reproduce the finding.

## 6. Volatile Sources

The following require a retrieval date and short revalidation interval:

- prices;
- plan features;
- product versions;
- roadmaps;
- changelogs;
- availability by country;
- AI features;
- integrations;
- supported platforms;
- legal terms;
- API limits;
- public officeholders or company leadership when relevant.

A finding depending on volatile evidence must not be reused after its review window without confirmation.

## 7. Anecdotal Evidence Controls

Anecdotes are useful for identifying failure modes, not estimating prevalence.

A complaint becomes a research finding only when it has:

- a reproducible or clearly described workflow;
- meaningful consequence;
- at least one independent corroborating source, or a reason corroboration is unavailable;
- a confidence rating;
- a statement separating observed pain from inferred cause.

Statements such as “users hate X” are prohibited unless supported by a defined study.

## 8. Product Comparison Fairness

Comparisons must record differences in:

- target segment;
- country and regulatory context;
- product edition;
- pricing tier;
- implementation maturity;
- platform: web, mobile, desktop, POS, API;
- optional modules;
- configuration assumptions;
- observation date.

A small-business bookkeeping product must not be penalized for lacking enterprise consolidation unless the comparison explicitly concerns market expansion. An ERP must not receive credit for a feature that exists only as a fragile third-party add-on without that limitation being recorded.

## 9. Source Record Template

```yaml
source_id: SRC-000
publisher: Example Vendor
product: Example Product
source_class: official-product-documentation
title: Bank Reconciliation Guide
locator: stable public URL or lawful internal locator
access: public
observed_at: YYYY-MM-DD
supports:
  - description of the documented reconciliation workflow
limitations:
  - does not establish usability or reliability
evidence_mode: documented
confidence: high
revalidate_on:
  - major product release
  - source update
  - twelve months elapsed
```

## 10. Prohibited Uses

Research agents must not:

- scrape or bulk-export a service contrary to its terms;
- bypass authentication or technical controls;
- reproduce proprietary screens or text as Meridian assets;
- infer internal architecture from visual similarity;
- use generated summaries as a substitute for reading the primary source;
- cite search-result snippets when the underlying source is available;
- conceal contradictory evidence;
- treat market popularity as proof of quality;
- count unavailable or roadmap-only features as shipped capability;
- state legal conclusions beyond verified source language.

## 11. Program Source Collections

The page-level citations remain in their research documents. These stable records identify the official public collections used for the 2026-07-16 synthesis; one collection may support multiple cited pages.

| Source ID | Publisher/product collection | Class | Public locator | Retrieved | Evidence mode | Limitations |
|---|---|---|---|---|---|---|
| SRC-001 | Odoo 19 | official documentation | https://www.odoo.com/documentation/19.0/ | 2026-07-16 | documented | configured/enterprise behavior not tested |
| SRC-002 | ERPNext | official documentation | https://docs.frappe.io/erpnext/ | 2026-07-16 | documented/public source | version and deployment variation |
| SRC-003 | Microsoft Dynamics 365 | official documentation | https://learn.microsoft.com/en-us/dynamics365/ | 2026-07-16 | documented | licensing and tenant configuration vary |
| SRC-004 | Oracle NetSuite | official help/product | https://docs.oracle.com/en/cloud/saas/netsuite/ | 2026-07-16 | documented | some content/account flows inaccessible |
| SRC-005 | SAP ERP/HCM | official documentation | https://help.sap.com/ | 2026-07-16 | documented | product/edition configuration is extensive |
| SRC-006 | Shopify/Shopify POS | official help/developer | https://help.shopify.com/ | 2026-07-16 | documented | plan, geography and processor vary |
| SRC-007 | Square | official help/developer | https://squareup.com/help/ | 2026-07-16 | documented | regional/hardware eligibility varies |
| SRC-008 | Toast | official documentation | https://doc.toasttab.com/ | 2026-07-16 | documented | restaurant/processor ecosystem specific |
| SRC-009 | Stripe | official developer documentation | https://docs.stripe.com/ | 2026-07-16 | documented | no Guyana availability/certification claim |
| SRC-010 | Adyen | official developer documentation | https://docs.adyen.com/ | 2026-07-16 | documented | commercial/platform eligibility untested |
| SRC-011 | PayPal/Braintree | official developer documentation | https://developer.paypal.com/braintree/docs/ | 2026-07-16 | documented | regional/product coverage varies |
| SRC-012 | WooCommerce | official documentation | https://woocommerce.com/documentation/ | 2026-07-16 | documented | plugin ecosystem not normalized |
| SRC-013 | Medusa | official documentation/public source | https://docs.medusajs.com/ | 2026-07-16 | documented/public source | implementation responsibility varies |
| SRC-014 | Saleor | official documentation/public source | https://docs.saleor.io/ | 2026-07-16 | documented/public source | implementation responsibility varies |
| SRC-015 | Salesforce | official help/product | https://help.salesforce.com/ | 2026-07-16 | documented | authenticated configuration unavailable |
| SRC-016 | HubSpot | official knowledge base | https://knowledge.hubspot.com/ | 2026-07-16 | documented | tier/configuration variation |
| SRC-017 | Linear | official documentation/changelog | https://linear.app/docs | 2026-07-16 | documented | no enterprise tenant tested |
| SRC-018 | Atlassian Jira | official help | https://support.atlassian.com/jira-software-cloud/ | 2026-07-16 | documented | marketplace/configuration variation |
| SRC-019 | ServiceNow | official product/documentation | https://www.servicenow.com/products/ | 2026-07-16 | documented | tenant flows inaccessible |
| SRC-020 | Zendesk | official help | https://support.zendesk.com/ | 2026-07-16 | documented | tier and configuration variation |
| SRC-021 | Dynamics/Salesforce Field Service | official documentation | https://learn.microsoft.com/en-us/dynamics365/field-service/ | 2026-07-16 | documented | technician/dispatch tenant not tested |
| SRC-022 | Workday | official product/trust | https://www.workday.com/ | 2026-07-16 | documented | detailed tenant configuration inaccessible |
| SRC-023 | SAP SuccessFactors | official documentation | https://help.sap.com/docs/SAP_SUCCESSFACTORS_HXM_SUITE | 2026-07-16 | documented | no jurisdiction implementation test |
| SRC-024 | 7shifts/Deputy/When I Work | official product/help | https://help.wheniwork.com/ | 2026-07-16 | documented | union/jurisdiction policies untested |
| SRC-025 | Ramp/Expensify/Brex/Concur | official product/help | https://support.ramp.com/ | 2026-07-16 | documented | cards, tax and reimbursement rails untested |
| SRC-026 | OpenAI | official product/developer documentation | https://developers.openai.com/ | 2026-07-16 | documented | features and models volatile |
| SRC-027 | Anthropic/Microsoft/GitHub AI | official documentation | https://docs.anthropic.com/ | 2026-07-16 | documented | enterprise controls not tested |
| SRC-028 | Metabase/Grafana/Power BI/Looker/Tableau | official documentation | https://www.metabase.com/docs/latest/ | 2026-07-16 | documented | performance and accessibility not directly tested |
| SRC-029 | Algolia/Elastic/OpenSearch | official documentation | https://www.algolia.com/doc/ | 2026-07-16 | documented | ranking/security implementation not tested |
| SRC-030 | Slack/GitHub/Teams collaboration | official documentation | https://slack.com/help/ | 2026-07-16 | documented | tenant policies and external sharing untested |
| SRC-031 | Stripe/GitHub/Vercel/Linear/shadcn changelogs | official changelogs | https://github.blog/changelog/ | 2026-07-16 | documented | current snapshots are volatile |
| SRC-032 | Rental/booking products | official product/documentation | https://www.odoo.com/documentation/19.0/applications/sales/rental.html | 2026-07-16 | documented | authenticated operations and legal terms unavailable |

All SRC-001 through SRC-032 are primary evidence. Secondary evidence was used only to discover questions and is not load-bearing in the completed waves.

## 12. Review and Maintenance

This registry is reviewed when:

- a new source class enters the program;
- a source changes terms or access model;
- research quality review finds repeated misuse;
- a paid tool becomes a build or runtime dependency;
- Meridian begins a regulated or jurisdiction-specific research wave.

Changes to source handling that affect licensing, privacy, security, or legal risk require review by the appropriate authority before use.
