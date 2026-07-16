---
document_id: PDA-CIR-007
title: Competitive Research Ledger
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0005, ADR-0016, ADR-0022]
---

# Competitive Research Ledger

## 1. Purpose

The research ledger records material competitive-intelligence activity so future reviewers can determine what was examined, when it was examined, which sources were used, what changed, and which Meridian decisions were affected.

The ledger is not a bibliography and not a list of every web search. It records research work that produced, challenged, refreshed, or retired a durable finding.

## 2. Required Entry Fields

Every entry must include:

- ledger ID;
- date completed;
- researcher or agent;
- research wave and domain;
- question investigated;
- products or patterns examined;
- source classes used;
- primary source references;
- access limitations;
- findings produced or changed;
- confidence;
- contradictory evidence;
- affected documents, ADRs, capabilities, permissions, events, APIs, risks, or implementation plans;
- follow-up work;
- next review trigger.

## 3. Status Vocabulary

- **Planned** — accepted research question, not yet started.
- **In Progress** — evidence collection or synthesis is active.
- **In Review** — findings exist but have not passed independent review.
- **Accepted** — findings have been reviewed and incorporated or explicitly retained as evidence.
- **Superseded** — replaced by newer research.
- **Withdrawn** — invalid, unsupported, duplicated, or no longer relevant.
- **Blocked** — cannot proceed due to access, legal, evidence, or scope limitations.

## 4. Confidence Vocabulary

- **High** — multiple relevant primary sources or direct evidence agree, material contradictions resolved.
- **Medium** — credible evidence supports the finding but important limitations or uncertainty remain.
- **Low** — preliminary, anecdotal, weakly corroborated, or strongly inference-dependent.
- **Unknown** — evidence insufficient to support a conclusion.

Confidence is not approval. A high-confidence observation may still be unsuitable for Meridian.

## 5. Ledger Entry Template

```markdown
## CIR-LED-0001 — Short title

- Status: In Review
- Completed: YYYY-MM-DD
- Researcher: name or agent
- Wave: Accounting
- Question: What workflow was investigated?
- Products: Product A, Product B
- Sources: SRC identifiers or citations
- Evidence mode: documented / observed / inferred / anecdotal
- Access limitations: none or explanation
- Finding: concise result
- Contradictions: concise summary
- Confidence: Medium
- Meridian impact:
  - documents: ...
  - capabilities: ...
  - implementation: ...
- Follow-up: ...
- Revalidate when: ...
```

## 6. Initial Program Entries

### CIR-LED-0001 — Competitive research framework established

- Status: In Review
- Completed: 2026-07-15
- Researcher: Platform Design Authority
- Wave: Framework
- Question: What governance is required for durable, ethical, evidence-driven competitive research?
- Products: none; program-level research
- Sources: existing Meridian Constitution, ADRs, UX source policies, research-audit experience, Mobbin audit, Shadcn and Studio source evaluations
- Evidence mode: internal governance synthesis
- Access limitations: none material
- Finding: competitive research requires explicit authority boundaries, source trust, confidence, contradiction handling, freshness, and change-control rules before domain matrices are authored.
- Contradictions: none material; tension between research speed and evidence depth is handled through confidence and lifecycle states.
- Confidence: High
- Meridian impact:
  - establishes `docs/blueprint/19-Competitive-Research/`;
  - does not alter runtime or domain authority;
  - creates prerequisites for all domain research waves.
- Follow-up: complete Wave 1 framework and begin accounting/bookkeeping research.
- Revalidate when: first two domain waves complete or quality review finds missing controls.

### CIR-LED-0002 — Mobbin pattern-research method validated

- Status: Accepted
- Completed: 2026-07-14
- Researcher: Claude Code with Platform Design Authority review
- Wave: UX pattern research
- Question: Can Mobbin provide useful, governed comparative UX evidence without becoming a design or code authority?
- Products: approximately fifty sampled products across identity, administration, inventory, analytics, mobile, and marketing
- Sources: authenticated official Mobbin MCP; Meridian UX authorities
- Evidence mode: direct visual observation and internal synthesis
- Access limitations: no OCR, accessibility evidence, source code, Android-specific filter, or hidden-state evidence
- Finding: Mobbin is useful for requirement-driven comparative pattern research but cannot establish accessibility, security, backend architecture, or code provenance.
- Contradictions: search quality was uneven for POS and generic enterprise concepts; consumer results had to be rejected for back-office use.
- Confidence: High
- Meridian impact:
  - Mobbin classified as non-executable research evidence;
  - navigation and mobile guidance received narrow evidence-backed refinement;
  - no component was promoted.
- Follow-up: use only for bounded domain questions and triangulate with primary product sources.
- Revalidate when: MCP capabilities or terms change.

### CIR-LED-0003 — Shadcn Studio source-role boundary validated

- Status: Accepted
- Completed: 2026-07-14
- Researcher: Platform Design Authority and repository agents
- Wave: UI component discovery
- Question: How should Studio templates, blocks, and components participate in Meridian implementation?
- Products: Shadcn Studio Free and Pro catalogs
- Sources: official Studio documentation, authenticated metadata, official shadcn registry, Meridian component governance
- Evidence mode: documented and direct metadata inspection
- Access limitations: client support and exact code access vary by account and tool
- Finding: Studio is a code-bearing candidate composition source, not design authority; candidates require provenance, isolation, normalization, accessibility, Storybook, and acceptance evidence.
- Contradictions: none material; polished templates may imply architectural fit they do not possess.
- Confidence: High
- Meridian impact: component acquisition and normalization policy established.
- Follow-up: prototype no more than one bounded candidate per learning objective.
- Revalidate when: Studio MCP, licensing, template stack, or shadcn CLI changes materially.

### CIR-LED-0004 — ERP and supply-chain waves completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Wave: ERP / Catalog / Inventory / Procurement / Warehouse / Manufacturing
- Products: Odoo, ERPNext, Dynamics 365, NetSuite, SAP, Shopify, Cin7, Unleashed, Fishbowl, Katana, MRPeasy, Zoho and related products
- Sources: SRC-001 through SRC-006 and page-level citations in PDA-CIR-025 through PDA-CIR-036
- Access limitations: enterprise tenants, consultant implementations, several Sage/Infor/Acumatica details and warehouse devices unavailable
- Finding: breadth must not drive module-maze navigation; ledgers, reservations, receiving, warehouse tasks and manufacturing corrections require explicit ownership and recovery.
- Confidence: Medium
- Follow-up: proposed governed changes in PDA-CIR-028 and PDA-CIR-036.

### CIR-LED-0005 — Commerce and payments wave completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Products: Square, Toast, Shopify POS/Commerce, Stripe, Adyen, Braintree, WooCommerce, Medusa, Saleor and related products
- Sources: SRC-006 through SRC-014 and PDA-CIR-037 through PDA-CIR-047
- Access limitations: terminals, merchant accounts, certification, Guyana rails and settlement files unavailable
- Finding: stable operation identity, explicit uncertainty, bounded offline and compensation are cross-provider controls; marketplace money movement remains gated.
- Confidence: Medium-High
- Follow-up: provider prototypes and founder/legal gates.

### CIR-LED-0006 — Customer and service wave completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Products: Salesforce, HubSpot, Pipedrive, Zoho, Linear, Jira, Asana, ServiceNow, Zendesk, Freshdesk, Jobber, Housecall Pro, Booqable, Checkfront and related products
- Sources: SRC-015 through SRC-021 and SRC-032; PDA-CIR-048 through PDA-CIR-059
- Access limitations: authenticated field-service/rental tenants and vertical legal terms unavailable
- Finding: Party-safe links, versioned workflows, domain-command remediation and bounded mobile work packages are required.
- Confidence: Medium
- Follow-up: Party merge recovery, service ownership and rental/deposit authority decisions.

### CIR-LED-0007 — Workforce wave completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Products: Rippling, BambooHR, Workday, SAP SuccessFactors, ADP, UKG, 7shifts, Deputy, When I Work, Ramp, Expensify, Brex and related products
- Sources: SRC-022 through SRC-025 and PDA-CIR-060 through PDA-CIR-069
- Access limitations: payroll tenants, statutory filings, Guyana legal review, benefits and card rails unavailable
- Finding: worker/Party separation, effective dating, immutable payroll runs, sensitive-data controls and qualified jurisdiction packages are mandatory.
- Confidence: Medium for workflow controls; Low for jurisdiction coverage
- Follow-up: qualified Guyana evidence before scope admission.

### CIR-LED-0008 — Platform-services wave completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Products: OpenAI, Anthropic, Microsoft, GitHub, Notion, Linear, Slack, Metabase, Power BI, Tableau, Looker, Grafana, Algolia, Elastic, OpenSearch, Intercom and related products
- Sources: SRC-026 through SRC-031 and PDA-CIR-070 through PDA-CIR-079
- Access limitations: enterprise tenants and official OpenAI documentation connector unavailable; official public OpenAI pages used instead
- Finding: authority/freshness/provenance must survive shared surfaces; AI and automation require bounded commands and deterministic fallback.
- Confidence: Medium-High
- Follow-up: controlled prototypes and quarterly refresh.

### CIR-LED-0009 — Cross-domain synthesis completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Wave: Cross-domain closeout
- Sources: PDA-CIR-020 through PDA-CIR-086; SRC-001 through SRC-032
- Finding: table stakes, candidate differentiators, exclusions, shared mechanics, recovery vocabulary and follow-up authorities are separated without promoting implementation claims.
- Confidence: Medium
- Follow-up: independent review, disposition, prototype evidence and scheduled refresh.

## 6.1 Stable Research Result Index

| Result ID | Wave | Status | Transfer |
|---|---|---|---|
| RES-001 | Accounting/bookkeeping | Transferred | PDA-CIR-020 through PDA-CIR-024 |
| RES-002 | ERP administration | Transferred | PDA-CIR-025 through PDA-CIR-028 |
| RES-003 | Supply chain | Transferred | PDA-CIR-029 through PDA-CIR-036 |
| RES-004 | Commerce/payments | Transferred | PDA-CIR-037 through PDA-CIR-047 |
| RES-005 | Customer/service | Transferred | PDA-CIR-048 through PDA-CIR-059 |
| RES-006 | Workforce | Transferred | PDA-CIR-060 through PDA-CIR-069 |
| RES-007 | Platform services | Transferred | PDA-CIR-070 through PDA-CIR-079 |
| RES-008 | Cross-domain synthesis | Transferred | PDA-CIR-080 through PDA-CIR-086 |

## 7. Ledger Maintenance Rules

- Add an entry when a research artifact materially changes a conclusion.
- Update the existing entry rather than creating duplicates for minor editorial revisions.
- Superseded entries remain visible with a link to their replacement.
- Findings affecting ratified architecture require an ADR or governed-document change; the ledger alone cannot authorize them.
- Research based on paid or authenticated sources must state reproducibility limitations.
- The ledger must never contain credentials, proprietary copied content, or private customer information.

## 8. Review Cadence

Review this ledger at:

- completion of each research wave;
- start of a related implementation workstream;
- quarterly competitive-intelligence review;
- major competitor release or acquisition;
- material regulatory or platform change;
- discovery of contradictory evidence.
