---
document_id: PDA-CIR-001
title: Competitive Intelligence and Product Research
version: 0.3.0
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

The initial section contains 86 uniquely identified Markdown documents. SOURCE_REGISTRY.md records stable source collections; page-level evidence remains in each domain document. COMPETITIVE_RESEARCH_PROGRAM_CLOSEOUT.md closes only the initial nine-wave writing set and records access limits, omitted comparator families, continuing research backlog, and external evidence gates.
