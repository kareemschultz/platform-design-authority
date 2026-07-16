---
document_id: PDA-CIR-001
title: Competitive Intelligence and Product Research
version: 0.8.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Intelligence and Product Research

## 1. Purpose

This section defines Meridian's permanent competitive-intelligence and product-research program. It exists to answer a question that architecture documents alone cannot answer:

> What does world-class behavior look like for each capability Meridian intends to provide, and what should Meridian adopt, improve, reject, or invent?

The program is evidence-driven. It does not authorize feature cloning, visual imitation, unsupported market claims, or architecture decisions based on screenshots. Its outputs inform the blueprint; they do not silently override the Constitution, ADRs, domain ownership, registries, risk controls, or implementation plans.

## 2. Authority

This section is subordinate to:

- the Constitution and guiding principles;
- ratified ADRs;
- domain and platform ownership documents;
- capability, permission, event, and API registries;
- security, privacy, accessibility, and operational standards;
- founder decisions and explicit external gates.

Competitive evidence may reveal a missing requirement or a better approach. It may not become authoritative until the appropriate Meridian document, ADR, registry, or implementation plan is changed through normal governance.

## 3. Program Outcomes

The program produces six kinds of durable knowledge:

1. **Capability coverage** — which market capabilities are table stakes, differentiated, weakly served, or intentionally excluded.
2. **Workflow evidence** — how real users complete consequential tasks, including failure, recovery, reversal, review, and exception handling.
3. **Experience evidence** — navigation, information hierarchy, progressive disclosure, mobile transformation, accessibility risks, and expert efficiency.
4. **Automation evidence** — rules, assisted workflows, AI suggestions, confidence, human review, overrides, and auditability.
5. **Failure evidence** — recurring customer pain points, support burdens, migration triggers, and anti-patterns.
6. **Differentiation decisions** — where Meridian will match, improve, reject, defer, or create a new approach.

## 4. Program Structure

### 4.1 Framework documents

- `COMPETITIVE_RESEARCH_METHODOLOGY.md`
- `COMPETITOR_EVALUATION_FRAMEWORK.md`
- `RESEARCH_STANDARDS.md`
- `SOURCE_TRUST_MODEL.md`
- `PRODUCT_TEARDOWN_STANDARD.md`
- `IMPLEMENTATION_PLAYBOOK_STANDARD.md`
- `RESEARCH_REFRESH_SCHEDULE.md`
- `WORLD_CLASS_CRITERIA.md`

### 4.2 Living registers

- `SOURCE_REGISTRY.md`
- `RESEARCH_LEDGER.md`
- `RESEARCH_BACKLOG.md`
- `COMMON_FAILURES_AND_PAIN_POINTS.md`
- `MARKET_GAP_REGISTER.md`
- `DIFFERENTIATION_REGISTER.md`
- `BEST_IN_CLASS_SCORECARD.md`
- `PATTERN_DECISION_REGISTER.md`
- `DISCOVERIES_REGISTER.md`
- `IMPLEMENTATION_EVIDENCE_REGISTER.md`

The stable result index in `RESEARCH_LEDGER.md` binds each transferred backlog question to exactly one result, ledger entry, output set, source-record set, and explicit review boundary. `scripts/validate_research_registration.py` enforces that structural registration and includes seeded failure tests. It does not certify research accuracy or promote Draft findings.

### 4.3 Domain research waves

Research proceeds in waves so findings remain reviewable and implementation-relevant.

1. Accounting and bookkeeping
2. ERP foundations and cross-domain administration
3. Catalog, inventory, procurement, warehouse, and manufacturing
4. POS, commerce, payments, stored value, and marketplace
5. CRM, projects, service, field service, rental, and booking
6. HR, payroll, workforce, scheduling, and expenses
7. AI, automation, analytics, search, notifications, collaboration, and documentation
8. Cross-domain synthesis and Meridian differentiation

Each domain wave should include a capability matrix, workflow reference, pain-point analysis, product teardowns, implementation findings, and explicit Meridian decisions.

## 5. Research Principles

### 5.1 Requirements before products

Research begins with a named Meridian user task, risk, or capability. It does not begin with a fashionable product and search for reasons to copy it.

### 5.2 Workflows before feature lists

"Supports reconciliation" is not sufficient evidence. Research should document:

- trigger;
- inputs;
- user roles;
- sequence;
- system decisions;
- human decisions;
- intermediate states;
- failures;
- recovery;
- reversal;
- audit evidence;
- outputs;
- downstream consequences.

### 5.3 Multiple sources before conclusions

No product is treated as the market. Where feasible, compare at least three materially different implementations of the same user task.

### 5.4 Official evidence before commentary

Official product documentation, help centers, API references, release notes, legal terms, and public demonstrations carry more weight than reviews, forum posts, screenshots, or inferred architecture.

### 5.5 Pain points are evidence, not truth

User complaints reveal friction and risk. They do not automatically prove root cause, prevalence, or the correct solution.

### 5.6 Popularity is not approval

A pattern being common or shipped by a successful company does not make it accessible, secure, appropriate, or compatible with Meridian.

### 5.7 Architecture is never inferred from appearance

Visible behavior may support a bounded inference. Unseen data models, event systems, authorization layers, and deployment architecture remain unknown unless documented by a reliable source.

### 5.8 Research never grants implementation approval

A finding may recommend a prototype or blueprint change. It cannot promote a component, dependency, provider, or capability to an approved lifecycle state by itself.

## 6. Standard Decisions

Every material finding must use one of these dispositions:

- **Adopt** — the principle fits Meridian with little conceptual change.
- **Improve** — the market pattern is useful but Meridian should provide a safer, clearer, faster, or more auditable version.
- **Combine** — multiple products each solve part of the problem; Meridian should synthesize the best compatible principles.
- **Custom Meridian Required** — market examples do not satisfy Meridian's domain, financial, tenant, offline, permission, audit, or AI constraints.
- **Defer** — valuable, but not justified for the current scope or maturity.
- **Reject** — conflicts with Meridian's principles or creates unacceptable risk.
- **Insufficient Evidence** — no conclusion is permitted yet.

## 7. Confidence Levels

Every conclusion must declare confidence:

- **High** — multiple strong sources agree, including official or direct product evidence.
- **Medium** — evidence is credible but incomplete, indirect, or lacks independent confirmation.
- **Low** — limited evidence, narrow sampling, or significant inference.
- **Unknown** — research question remains open.

Confidence describes evidence quality, not importance.

## 8. Prohibited Uses

This program must not:

- clone a competitor feature-for-feature;
- copy protected layouts, copy, illustrations, logos, or trade dress;
- mirror subscription research catalogs;
- treat screenshots as accessibility evidence;
- infer proprietary architecture as fact;
- publish unsupported pricing, market-share, legal, tax, compliance, security, or performance claims;
- use customer complaints as statistical evidence without a valid sample;
- turn competitive parity into automatic scope expansion;
- conceal trade-offs or contradictory evidence;
- recommend AI automation without deterministic fallback, review, override, and audit controls;
- recommend consequential automation merely because a competitor offers it.

## 9. Integration with Delivery

Before a major domain workstream begins, the relevant research wave should be sufficiently complete to answer:

- Which capabilities are table stakes?
- Which workflows are consequential or unusually difficult?
- What are the strongest and weakest market patterns?
- What does Meridian intentionally reject?
- Which blueprint, ADR, registry, UX, API, event, permission, or test changes are required?
- Which conclusions still require prototypes or user research?

Research should run ahead of implementation, but it must not indefinitely block delivery. Unknowns should become bounded prototypes, backlog items, or explicit risks rather than excuses for analysis paralysis.

## 10. Review Cadence

Research is refreshed according to `RESEARCH_REFRESH_SCHEDULE.md` and additionally:

- before beginning a new major domain;
- when a competitor materially changes the relevant workflow;
- when regulation, platform behavior, or customer expectations change;
- when implementation evidence contradicts a research conclusion;
- when a production incident or support pattern reveals a missing assumption.

## 11. Definition of Done for a Research Wave

A wave is complete only when:

- scope and competitors are explicit;
- official sources are recorded;
- workflows, not only features, are compared;
- pain points and counter-evidence are represented;
- conclusions carry confidence and provenance;
- Meridian dispositions are explicit;
- required blueprint changes are identified;
- prohibited copying and unsupported inference have been checked;
- implementation implications and validation criteria are stated;
- discoveries and pattern decisions are transferred or intentionally retained;
- implementation evidence requirements are registered where applicable;
- documentation validation and registry freshness pass;
- independent review has occurred.

## 12. Initial Priority

The first domain wave is accounting and bookkeeping because it crosses bank feeds, reconciliation, journals, reporting, approvals, audit, tax, attachments, automation, and AI-assisted review. It will compare automation-first products, small-business accounting systems, open-source accounting systems, ERP accounting modules, and enterprise financial suites without treating any one category as the reference model.

## 13. Initial Program Completion Index

The initial research program was authored through 2026-07-16. All artifacts remain Draft pending independent review and governed disposition.

| Wave | Governed documents | Result |
|---|---|---|
| Framework and living registers | PDA-CIR-001 through PDA-CIR-019 | methodology, evidence, backlog, failures, gaps, decisions and implementation-evidence controls |
| Accounting/bookkeeping | PDA-CIR-020 through PDA-CIR-024 | Finance-bound capability, workflow, AI, teardown and implementation findings |
| ERP administration | PDA-CIR-025 through PDA-CIR-028 | capability, cross-domain workflow, teardown and implementation findings |
| Supply chain | PDA-CIR-029 through PDA-CIR-036 | catalog/inventory, procurement/warehouse, manufacturing, teardown and findings |
| Commerce/payments | PDA-CIR-037 through PDA-CIR-047 | POS, commerce, payments, stored value, marketplace, teardown and findings |
| Customer/service | PDA-CIR-048 through PDA-CIR-059 | CRM, projects, support, field service, rental/booking, teardown and findings |
| Workforce | PDA-CIR-060 through PDA-CIR-069 | HR, payroll, scheduling, expenses, teardown and findings |
| Platform services | PDA-CIR-070 through PDA-CIR-079 | AI, automation, analytics, search, inbox, collaboration, docs, teardown and findings |
| Cross-domain synthesis | PDA-CIR-080 through PDA-CIR-086 | differentiation, advantage, dispositions, shared workflows/recovery/review and closeout |
| Continuing ITSM/MSP/RMM study | PDA-CIR-087 through PDA-CIR-089 | capability comparison, escalation/remote-action workflow, threat boundary and implementation findings |
| Continuing IAM/identity-administration study | PDA-CIR-090 through PDA-CIR-092 | terminology/capability comparison, administration/provisioning/recovery controls, and retain/extend/replace findings |
| Continuing infrastructure/DCIM/IPAM study | PDA-CIR-093 through PDA-CIR-095 | capability/authority matrix, discovery/reconciliation workflow and network-operations findings |
| Named-product lineage reconciliation | PDA-CIR-096 | requested-name lineage, current locator, grouped wave coverage and bounded disposition |
| Device/offline evidence disposition | PDA-CIR-097 through PDA-CIR-098 | documented device/degraded behavior, explicit direct-observation blocks and executable evidence scenarios |

The section contains 98 uniquely identified Markdown documents, including continuation studies and evidence-accounting work after the initial nine-wave set. SOURCE_REGISTRY.md records stable source collections; page-level evidence remains in each domain document. COMPETITIVE_RESEARCH_PROGRAM_CLOSEOUT.md closes only the initial writing set and records access limits, comparator lineage, continuation studies, direct-observation blocks, and external evidence gates.

## 14. Artifact Catalog

This catalog is the canonical navigation surface for the research artifacts. Identifier ranges in the completion index summarize waves; they do not substitute for explicit artifact links or page-level evidence.

### 14.1 Framework and living registers

- [Competitive Research Methodology](COMPETITIVE_RESEARCH_METHODOLOGY.md) — `PDA-CIR-002` · Draft
- [Competitive Research Source Trust Model](SOURCE_TRUST_MODEL.md) — `PDA-CIR-003` · Draft
- [Competitor Evaluation Framework](COMPETITOR_EVALUATION_FRAMEWORK.md) — `PDA-CIR-004` · Draft
- [Competitive Research Standards](RESEARCH_STANDARDS.md) — `PDA-CIR-005` · Draft
- [Competitive Research Source Registry](SOURCE_REGISTRY.md) — `PDA-CIR-006` · Draft
- [Competitive Research Ledger](RESEARCH_LEDGER.md) — `PDA-CIR-007` · Draft
- [Competitive Research Backlog](RESEARCH_BACKLOG.md) — `PDA-CIR-008` · Draft
- [Common Failures and Pain Points Register](COMMON_FAILURES_AND_PAIN_POINTS.md) — `PDA-CIR-009` · Draft
- [Market Gap Register](MARKET_GAP_REGISTER.md) — `PDA-CIR-010` · Draft
- [Meridian Differentiation Register](DIFFERENTIATION_REGISTER.md) — `PDA-CIR-011` · Draft
- [Best-in-Class Comparative Scorecard](BEST_IN_CLASS_SCORECARD.md) — `PDA-CIR-012` · Draft
- [World-Class Capability Criteria](WORLD_CLASS_CRITERIA.md) — `PDA-CIR-013` · Draft
- [Product Teardown Standard](PRODUCT_TEARDOWN_STANDARD.md) — `PDA-CIR-014` · Draft
- [Competitive Research Refresh Schedule](RESEARCH_REFRESH_SCHEDULE.md) — `PDA-CIR-015` · Draft
- [Competitive Research Discoveries Register](DISCOVERIES_REGISTER.md) — `PDA-CIR-016` · Draft
- [Competitive Pattern Decision Register](PATTERN_DECISION_REGISTER.md) — `PDA-CIR-017` · Draft
- [Research-to-Implementation Playbook Standard](IMPLEMENTATION_PLAYBOOK_STANDARD.md) — `PDA-CIR-018` · Draft
- [Competitive Research Implementation Evidence Register](IMPLEMENTATION_EVIDENCE_REGISTER.md) — `PDA-CIR-019` · Draft

### 14.2 Accounting and bookkeeping

- [Accounting and Bookkeeping Competitive Capability Matrix](ACCOUNTING_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-020` · Draft
- [Bookkeeping Workflow Reference](BOOKKEEPING_WORKFLOW_REFERENCE.md) — `PDA-CIR-021` · Draft
- [Automation and AI-Assisted Bookkeeping](AUTOMATION_AND_AI_BOOKKEEPING.md) — `PDA-CIR-022` · Draft
- [Accounting Product Teardown Synthesis](ACCOUNTING_PRODUCT_TEARDOWNS.md) — `PDA-CIR-023` · Draft
- [Accounting Implementation Findings](ACCOUNTING_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-024` · Draft

### 14.3 ERP administration

- [ERP Competitive Capability Matrix](ERP_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-025` · Draft
- [ERP Cross-Domain Workflow Reference](ERP_CROSS_DOMAIN_WORKFLOW_REFERENCE.md) — `PDA-CIR-026` · Draft
- [ERP Product Teardown Synthesis](ERP_PRODUCT_TEARDOWNS.md) — `PDA-CIR-027` · Draft
- [ERP Implementation Findings](ERP_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-028` · Draft

### 14.4 Supply chain

- [Catalog and Inventory Competitive Capability Matrix](CATALOG_AND_INVENTORY_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-029` · Draft
- [Catalog and Inventory Workflow Reference](CATALOG_AND_INVENTORY_WORKFLOW_REFERENCE.md) — `PDA-CIR-030` · Draft
- [Procurement and Warehouse Competitive Capability Matrix](PROCUREMENT_AND_WAREHOUSE_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-031` · Draft
- [Procurement and Warehouse Workflow Reference](PROCUREMENT_AND_WAREHOUSE_WORKFLOW_REFERENCE.md) — `PDA-CIR-032` · Draft
- [Manufacturing Competitive Capability Matrix](MANUFACTURING_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-033` · Draft
- [Manufacturing Workflow Reference](MANUFACTURING_WORKFLOW_REFERENCE.md) — `PDA-CIR-034` · Draft
- [Supply Chain Product Teardown Synthesis](SUPPLY_CHAIN_PRODUCT_TEARDOWNS.md) — `PDA-CIR-035` · Draft
- [Supply Chain Implementation Findings](SUPPLY_CHAIN_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-036` · Draft

### 14.5 Commerce and payments

- [POS Competitive Capability Matrix](POS_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-037` · Draft
- [POS Workflow Reference](POS_WORKFLOW_REFERENCE.md) — `PDA-CIR-038` · Draft
- [Commerce Competitive Capability Matrix](COMMERCE_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-039` · Draft
- [Commerce Workflow Reference](COMMERCE_WORKFLOW_REFERENCE.md) — `PDA-CIR-040` · Draft
- [Payments Competitive Capability Matrix](PAYMENTS_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-041` · Draft
- [Payments Provider Workflow Reference](PAYMENTS_PROVIDER_WORKFLOW_REFERENCE.md) — `PDA-CIR-042` · Draft
- [Stored Value Competitive Capability Matrix](STORED_VALUE_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-043` · Draft
- [Stored Value Workflow Reference](STORED_VALUE_WORKFLOW_REFERENCE.md) — `PDA-CIR-044` · Draft
- [Marketplace Competitive Capability Matrix](MARKETPLACE_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-045` · Draft
- [Commerce and Payments Product Teardowns](COMMERCE_AND_PAYMENTS_PRODUCT_TEARDOWNS.md) — `PDA-CIR-046` · Draft
- [Commerce and Payments Implementation Findings](COMMERCE_AND_PAYMENTS_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-047` · Draft

### 14.6 Customer and service

- [CRM Competitive Capability Matrix](CRM_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-048` · Draft
- [CRM Workflow Reference](CRM_WORKFLOW_REFERENCE.md) — `PDA-CIR-049` · Draft
- [Projects Competitive Capability Matrix](PROJECTS_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-050` · Draft
- [Projects Workflow Reference](PROJECTS_WORKFLOW_REFERENCE.md) — `PDA-CIR-051` · Draft
- [Service and Support Competitive Capability Matrix](SERVICE_AND_SUPPORT_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-052` · Draft
- [Service Workflow Reference](SERVICE_WORKFLOW_REFERENCE.md) — `PDA-CIR-053` · Draft
- [Field Service Competitive Capability Matrix](FIELD_SERVICE_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-054` · Draft
- [Field Service Workflow Reference](FIELD_SERVICE_WORKFLOW_REFERENCE.md) — `PDA-CIR-055` · Draft
- [Rental and Booking Competitive Capability Matrix](RENTAL_AND_BOOKING_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-056` · Draft
- [Rental and Booking Workflow Reference](RENTAL_AND_BOOKING_WORKFLOW_REFERENCE.md) — `PDA-CIR-057` · Draft
- [Customer and Service Product Teardowns](CUSTOMER_AND_SERVICE_PRODUCT_TEARDOWNS.md) — `PDA-CIR-058` · Draft
- [Customer and Service Implementation Findings](CUSTOMER_AND_SERVICE_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-059` · Draft

### 14.7 Workforce

- [HR Competitive Capability Matrix](HR_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-060` · Draft
- [HR Workflow Reference](HR_WORKFLOW_REFERENCE.md) — `PDA-CIR-061` · Draft
- [Payroll Competitive Capability Matrix](PAYROLL_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-062` · Draft
- [Payroll Workflow Reference](PAYROLL_WORKFLOW_REFERENCE.md) — `PDA-CIR-063` · Draft
- [Workforce and Scheduling Competitive Capability Matrix](WORKFORCE_AND_SCHEDULING_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-064` · Draft
- [Workforce Workflow Reference](WORKFORCE_WORKFLOW_REFERENCE.md) — `PDA-CIR-065` · Draft
- [Expense Management Competitive Capability Matrix](EXPENSE_MANAGEMENT_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-066` · Draft
- [Expense Workflow Reference](EXPENSE_WORKFLOW_REFERENCE.md) — `PDA-CIR-067` · Draft
- [Workforce Product Teardowns](WORKFORCE_PRODUCT_TEARDOWNS.md) — `PDA-CIR-068` · Draft
- [Workforce Implementation Findings](WORKFORCE_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-069` · Draft

### 14.8 Platform services

- [AI-Assisted Product Patterns](AI_ASSISTED_PRODUCT_PATTERNS.md) — `PDA-CIR-070` · Draft
- [Automation Competitive Pattern Matrix](AUTOMATION_COMPETITIVE_PATTERN_MATRIX.md) — `PDA-CIR-071` · Draft
- [Analytics Competitive Capability Matrix](ANALYTICS_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-072` · Draft
- [Analytics Workflow Reference](ANALYTICS_WORKFLOW_REFERENCE.md) — `PDA-CIR-073` · Draft
- [Search Competitive Pattern Matrix](SEARCH_COMPETITIVE_PATTERN_MATRIX.md) — `PDA-CIR-074` · Draft
- [Notifications and Inbox Pattern Matrix](NOTIFICATIONS_AND_INBOX_PATTERN_MATRIX.md) — `PDA-CIR-075` · Draft
- [Collaboration Competitive Pattern Matrix](COLLABORATION_COMPETITIVE_PATTERN_MATRIX.md) — `PDA-CIR-076` · Draft
- [Documentation and Changelog Pattern Matrix](DOCUMENTATION_AND_CHANGELOG_PATTERN_MATRIX.md) — `PDA-CIR-077` · Draft
- [Cross-Platform Productivity Teardowns](CROSS_PLATFORM_PRODUCTIVITY_TEARDOWNS.md) — `PDA-CIR-078` · Draft
- [Platform Services Implementation Findings](PLATFORM_SERVICES_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-079` · Draft

### 14.9 Cross-domain synthesis

- [Meridian Differentiation Manifest](MERIDIAN_DIFFERENTIATION_MANIFEST.md) — `PDA-CIR-080` · Draft
- [Platform Advantage Register](PLATFORM_ADVANTAGE_REGISTER.md) — `PDA-CIR-081` · Draft
- [Adopt Improve Reject Register](ADOPT_IMPROVE_REJECT_REGISTER.md) — `PDA-CIR-082` · Draft
- [Cross-Domain Workflow Patterns](CROSS_DOMAIN_WORKFLOW_PATTERNS.md) — `PDA-CIR-083` · Draft
- [Cross-Domain Failure and Recovery Patterns](CROSS_DOMAIN_FAILURE_AND_RECOVERY_PATTERNS.md) — `PDA-CIR-084` · Draft
- [Cross-Domain Review Queue Standard](CROSS_DOMAIN_REVIEW_QUEUE_STANDARD.md) — `PDA-CIR-085` · Draft
- [Initial Competitive Research Program Closeout](COMPETITIVE_RESEARCH_PROGRAM_CLOSEOUT.md) — `PDA-CIR-086` · Draft

### 14.10 Continuing studies

- [ITSM, MSP, and RMM Competitive Capability Matrix](ITSM_MSP_RMM_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-087` · Draft
- [Managed-Service Escalation and Remote-Action Workflow Reference](MANAGED_SERVICE_ESCALATION_AND_REMOTE_ACTION_WORKFLOW_REFERENCE.md) — `PDA-CIR-088` · Draft
- [ITSM, MSP, and RMM Implementation Findings](ITSM_MSP_RMM_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-089` · Draft
- [IAM and Identity Administration Capability Matrix](IAM_AND_IDENTITY_ADMINISTRATION_CAPABILITY_MATRIX.md) — `PDA-CIR-090` · Draft
- [Identity Administration, Provisioning, and Recovery Reference](IDENTITY_ADMINISTRATION_PROVISIONING_AND_RECOVERY_REFERENCE.md) — `PDA-CIR-091` · Draft
- [IAM Retain, Extend, and Replace Implementation Findings](IAM_RETAIN_EXTEND_REPLACE_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-092` · Draft
- [Infrastructure, DCIM, IPAM, and Network Operations Competitive Capability Matrix](INFRASTRUCTURE_DCIM_IPAM_COMPETITIVE_CAPABILITY_MATRIX.md) — `PDA-CIR-093` · Draft
- [Infrastructure Discovery and Reconciliation Workflow Reference](INFRASTRUCTURE_DISCOVERY_RECONCILIATION_WORKFLOW_REFERENCE.md) — `PDA-CIR-094` · Draft
- [Infrastructure Operations Implementation Findings](INFRASTRUCTURE_OPERATIONS_IMPLEMENTATION_FINDINGS.md) — `PDA-CIR-095` · Draft
- [Named Product Lineage and Coverage Register](NAMED_PRODUCT_LINEAGE_AND_COVERAGE_REGISTER.md) — `PDA-CIR-096` · Draft
- [Direct Device and Offline Evidence Matrix](DIRECT_DEVICE_AND_OFFLINE_EVIDENCE_MATRIX.md) — `PDA-CIR-097` · Draft
- [Device and Offline Evidence Disposition](DEVICE_OFFLINE_EVIDENCE_DISPOSITION.md) — `PDA-CIR-098` · Draft
