---
document_id: PDA-CIR-008
title: Competitive Research Backlog
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0022]
---

# Competitive Research Backlog

## 1. Purpose

This backlog records accepted research questions that should be answered before, during, or after implementation. It prevents useful discoveries from disappearing while keeping speculative research from silently expanding implementation scope.

A backlog entry is not a feature request, roadmap commitment, architecture decision, or production-readiness claim.

## 2. Prioritization

Research priority is based on:

1. proximity to an implementation workstream;
2. consequence of getting the decision wrong;
3. uncertainty in the current blueprint;
4. evidence volatility;
5. customer or regulatory impact;
6. opportunity for meaningful differentiation;
7. cost and availability of evidence.

Priority values:

- **P0** — immediate blocker or material safety/compliance risk.
- **P1** — required before the related workstream begins.
- **P2** — valuable during implementation or prototype review.
- **P3** — exploratory, future-facing, or low urgency.

Status values:

- **Planned** — accepted question with no active evidence collection.
- **Ready** — prerequisites are satisfied and research may start.
- **In Progress** — evidence collection or synthesis is active.
- **In Review** — outputs exist but have not passed independent review.
- **Transferred** — outputs and implementation findings are registered in the research ledger; this does not approve an authority change.
- **Deferred** — the question remains valid but its scope-admission trigger has not been met; the entry must state the trigger or reason.
- **Blocked** — a named access, legal, evidence, or dependency constraint prevents useful progress.
- **Superseded** or **Withdrawn** — a newer entry replaces the question, or evidence shows it should no longer be pursued; the reason must remain visible.

## 3. Required Fields

Each entry records:

- backlog ID;
- priority;
- status;
- research question;
- domain or cross-cutting concern;
- trigger or deadline condition;
- expected outputs;
- likely sources;
- dependencies;
- owner;
- completion criteria.

## 4. Program Backlog

### CIR-BACK-001 — Accounting and bookkeeping competitive capability matrix

- Priority: P1
- Status: Transferred
- Domain: Accounting and Finance
- Trigger: complete before detailed Accounting implementation planning
- Question: Which bookkeeping and accounting capabilities are table stakes, differentiated, underserved, or intentionally excluded across Kick, QuickBooks Online, Xero, Akaunting, Wave, FreshBooks, Zoho Books, Sage, NetSuite, ERPNext, and Odoo?
- Outputs:
  - accounting capability matrix;
  - bookkeeping workflow reference;
  - automation and AI bookkeeping standard;
  - implementation findings;
  - product teardowns.
- Likely sources: official documentation, help centers, release notes, API docs, public pricing, public source code where applicable, direct product observations, customer pain-point sources.
- Dependencies: Wave 1 framework complete.
- Owner: Platform Design Authority
- Completion: reviewed matrix with confidence, contradictions, gaps, and explicit Meridian dispositions.

### CIR-BACK-002 — Bank feeds, categorization, matching, and reconciliation

- Priority: P1
- Status: Transferred
- Domain: Accounting
- Trigger: before bank-feed and reconciliation contracts are designed
- Question: What are best-in-class workflows for transaction import, categorization, rules, transfer detection, invoice/bill matching, duplicate detection, review, reconciliation, rollback, and audit?
- Expected outputs: workflow state models, exception taxonomy, UX findings, AI safety boundaries, API and event implications.
- Dependencies: CIR-BACK-001.
- Completion: at least six materially different products compared with official evidence and pain-point triangulation.

### CIR-BACK-003 — Accountant review mode and unified review queue

- Priority: P1
- Status: Transferred
- Domain: Accounting / Platform Workflow
- Trigger: before implementing AI-assisted bookkeeping
- Question: Should Meridian provide a unified review queue for uncategorized transactions, unmatched receipts, duplicate suspicions, failed rules, reconciliation exceptions, and AI suggestions?
- Completion: define queue ownership, priority, state, assignment, approval, rejection, explanation, audit, and bulk-action requirements.

### CIR-BACK-004 — Period close, lock dates, adjustments, and reversals

- Priority: P1
- Status: Transferred
- Domain: Accounting
- Trigger: before General Ledger implementation exits controlled prototype
- Question: How do leading products handle month-end and year-end close, lock dates, adjusting entries, reversing entries, reopen permissions, evidence, and user communication?
- Completion: explicit workflow comparison and Meridian invariants.

### CIR-BACK-005 — Fixed assets, depreciation, accruals, and deferrals

- Priority: P2
- Status: Deferred
- Domain: Accounting
- Trigger: before advanced accounting scope begins
- Question: Which workflows are table stakes for fixed assets, depreciation methods, prepaid expense amortization, accruals, and deferred revenue?
- Completion: capability and workflow matrix with jurisdictional cautions.

### CIR-BACK-006 — Multi-company consolidation and multi-currency close

- Priority: P2
- Status: Deferred
- Domain: Finance
- Trigger: before consolidation implementation
- Question: How should Meridian distinguish tenant, legal entity, organization, ledger, reporting currency, transaction currency, revaluation, elimination, and consolidation workflows?
- Completion: terminology map, workflow models, pain points, and architecture implications.

### CIR-BACK-007 — ERP navigation and modularity failures

- Priority: P1
- Status: Transferred
- Domain: ERP / UX
- Trigger: before broad capability navigation expands beyond first slice
- Question: Why do users describe Odoo, ERPNext, SAP, Dynamics, and NetSuite navigation as difficult, and what structural decisions prevent Meridian from repeating those failures?
- Completion: evidence-backed navigation requirements and rejected patterns.

### CIR-BACK-008 — Catalog and inventory best-in-class workflows

- Priority: P1
- Status: Transferred
- Domain: Catalog / Inventory
- Trigger: before WS2 contract freeze
- Question: What should Meridian learn from Shopify, Square, Cin7, Katana, Unleashed, Fishbowl, Odoo, and ERPNext for variants, stock by location, receiving, transfers, counts, adjustments, reservations, and reconciliation?
- Completion: domain matrix and implementation findings aligned with WS2.

### CIR-BACK-009 — POS cashier, register, tender, and recovery workflows

- Priority: P1
- Status: Transferred
- Domain: POS
- Trigger: before Prototype 3 implementation
- Question: What are best-in-class high-frequency cashier, cash-management, split-tender, refund, offline, provider-uncertainty, and register-close workflows?
- Completion: Square, Toast, Lightspeed, Shopify POS, Clover, Revel, and relevant regional products compared.

### CIR-BACK-010 — Payments and provider abstraction

- Priority: P1
- Status: Transferred
- Domain: Payments
- Trigger: before provider-adapter prototype
- Question: How do Stripe, Adyen, Square, PayPal, Checkout.com, Braintree, and regional providers expose uncertainty, retries, idempotency, disputes, refunds, and settlement?
- Completion: customer UX, API semantics, event model, and failure-handling findings.

### CIR-BACK-011 — CRM relationship and pipeline workflows

- Priority: P2
- Status: Transferred
- Domain: CRM
- Trigger: before CRM roadmap commitment
- Question: Which HubSpot, Salesforce, Pipedrive, Zoho CRM, and Freshsales workflows are table stakes, overcomplicated, or meaningfully differentiating?
- Completion: Party-aligned capability matrix and workflow reference.

### CIR-BACK-012 — Procurement and supplier operations

- Priority: P2
- Status: Transferred
- Domain: Procurement
- Trigger: before procurement implementation planning
- Question: What are best-in-class requisition, approval, purchase order, receiving, invoice matching, returns, and supplier-performance workflows?
- Completion: workflow and exception matrix.

### CIR-BACK-013 — Manufacturing and planning

- Priority: P2
- Status: Transferred
- Domain: Manufacturing
- Trigger: before manufacturing implementation planning
- Question: What should Meridian learn from Katana, MRPeasy, Odoo Manufacturing, ERPNext Manufacturing, and larger ERP products without inheriting their complexity?
- Completion: capability tiers, workflow boundaries, planning assumptions, and intentional exclusions.

### CIR-BACK-014 — HR, payroll, and workforce systems

- Priority: P2
- Status: Transferred
- Domain: Workforce
- Trigger: before workforce implementation planning
- Question: What patterns from Rippling, BambooHR, HiBob, Deel, Gusto, and regional payroll products are transferable across jurisdictions?
- Completion: global core versus jurisdiction-pack boundary recommendations.

### CIR-BACK-015 — Project, work, and service management

- Priority: P2
- Status: Transferred
- Domain: Projects / Service
- Trigger: before project and service domain planning
- Question: How should Meridian balance Linear-like speed, Jira-like configurability, ClickUp-like breadth, and service-specific scheduling without creating configuration sprawl?
- Completion: capability matrix, complexity tiers, and navigation implications.

### CIR-BACK-016 — AI accounting and operational agents

- Priority: P1
- Status: Transferred
- Domain: AI / Accounting
- Trigger: before AI may propose consequential accounting actions
- Question: How do Kick, Numeric, Puzzle, Rillet, and adjacent products represent suggestions, confidence, provenance, review, approval, correction, and learning?
- Completion: AI autonomy, explanation, audit, and deterministic fallback requirements.

### CIR-BACK-017 — Search and command architecture

- Priority: P2
- Status: Transferred
- Domain: Platform UX
- Trigger: before global search implementation
- Question: What should Meridian learn from Linear, Notion, GitHub, Stripe, Vercel, and enterprise ERPs about global search, commands, recents, permissions, and context?
- Completion: ranking, scoping, privacy, keyboard, and discoverability findings.

### CIR-BACK-018 — Notifications and operational inboxes

- Priority: P2
- Status: Transferred
- Domain: Platform
- Trigger: before notification service implementation
- Question: How should Meridian avoid notification overload while supporting consequential alerts, assignments, approvals, failures, and release communication?
- Completion: channel, priority, read-state, escalation, digest, and accessibility recommendations.

### CIR-BACK-019 — Documentation, help, onboarding, and changelog

- Priority: P2
- Status: Transferred
- Domain: Documentation / UX
- Trigger: before public documentation and in-app changelog launch
- Question: What should Meridian learn from Shadcn Studio, Stripe, GitHub, Linear, Vercel, and mature enterprise products about getting started, help centers, videos, migration guides, changelogs, and in-app What’s New?
- Completion: audience-specific documentation and release-communication model.

### CIR-BACK-020 — Mobile, tablet, kiosk, and offline comparative study

- Priority: P1
- Status: Transferred
- Domain: Clients / Offline
- Trigger: before native and offline work exits prototype
- Question: How do leading products transform consequential workflows across device classes and degraded connectivity?
- Completion: first-party prototype requirements plus bounded competitor evidence.

### CIR-BACK-021 — ITSM, MSP, RMM, and managed-device operations

- Priority: P2
- Status: Planned
- Domain: Service / Assets / Maintenance / Developer Platform
- Trigger: before managed-service, service-desk, or remote-device operations enter roadmap scope
- Question: What should Meridian learn from ServiceNow, Freshservice, HaloPSA, SuperOps, NinjaOne, ConnectWise, Datto, and IT Glue about incident/problem/change relationships, service agreements, configuration evidence, remote actions, automation, credentials, tenancy, and operator authority?
- Expected outputs: capability matrix, workflow and escalation reference, remote-action threat boundary, integration implications, customer pain hypotheses, and adopt/improve/reject dispositions.
- Likely sources: first-party product, administration, API, security, release, and migration documentation; direct observation only where lawfully accessible.
- Dependencies: Party/domain-role boundaries, ADR-0019, service ownership, security review, and explicit roadmap admission.
- Owner: Platform Design Authority with Service, Assets, Maintenance, Developer Platform, and Security owners
- Completion: reviewed comparison with product/edition limits, stable sources, authority boundaries, failure recovery, and no implied first-slice expansion.

### CIR-BACK-022 — IAM and identity-administration comparison

- Priority: P2
- Status: Planned
- Domain: Platform Identity / Security / Developer Platform
- Trigger: before enterprise federation, SCIM, delegated identity administration, or an authentication-owner change is proposed
- Question: Which Keycloak, Authentik, Better Auth, and adjacent IAM patterns are useful for realms or organizations, federation, lifecycle provisioning, service accounts, recovery, key rotation, delegated administration, audit, and migration?
- Expected outputs: terminology map, administration workflow, threat and recovery matrix, interoperability implications, and explicit retain/extend/replace decision triggers.
- Likely sources: official administration, security, protocol, upgrade, release, and migration documentation plus public source where applicable.
- Dependencies: Better Auth decision matrix, ADR-0003, Party boundaries, security architecture, and ADR review for any owner change.
- Owner: Platform Identity and Security
- Completion: evidence-backed comparison that does not displace Better Auth or collapse Party/authorization ownership without an ADR.

### CIR-BACK-023 — Infrastructure inventory, DCIM, IPAM, and network operations

- Priority: P2
- Status: Planned
- Domain: Assets / Service / Developer Platform / Operations
- Trigger: before infrastructure inventory, IP address management, network-controller, or configuration-source-of-truth scope is admitted
- Question: What should Meridian learn from NetBox, phpIPAM, Snipe-IT, UniFi, Fortinet, and adjacent platforms about source-of-truth boundaries, discovery, reconciliation, credentials, topology, tenancy, change control, and automation?
- Expected outputs: capability/boundary matrix, discovery-versus-authority model, reconciliation workflow, credential and remote-action controls, API/event implications, and rejected ownership shortcuts.
- Likely sources: official product, administrator, API, security, backup/restore, plugin, and upgrade documentation; public source where applicable.
- Dependencies: Assets and Service ownership, Developer Platform integration rules, ADR-0019, secrets governance, and roadmap admission.
- Owner: Platform Design Authority with Assets, Service, Developer Platform, Security, and Operations owners
- Completion: reviewed findings that distinguish authoritative inventory from discovered projections and do not treat a network controller as a business-domain owner.

### CIR-BACK-024 — Named-product gap and historical-product reconciliation

- Priority: P3
- Status: Planned
- Domain: Cross-domain competitive research
- Trigger: before claiming the user-requested comparator catalogue is complete or using a missing product as decision evidence
- Question: Which requested products remain absent, renamed, acquired, historical, region-limited, or materially duplicated, including Peachtree/Sage 50, Vend/Lightspeed, Retail Pro, Invoice Ninja, Horilla, OpenHRMS, OpenProject, Freshworks products, and other named comparators?
- Expected outputs: canonical product-name/lineage table, current official locator, relevance disposition, duplication/acquisition note, and any bounded follow-up study.
- Likely sources: official product histories, current documentation, release notes, acquisition notices, and public source repositories.
- Dependencies: source trust model and product-comparison fairness rules.
- Owner: Competitive Research Lead
- Completion: every requested name has a dated `studied`, `covered-by-successor`, `deferred-with-reason`, or `rejected-as-irrelevant` disposition; name presence alone is not completion.

### CIR-BACK-025 — Direct mobile, kiosk, and offline workflow evidence

- Priority: P1
- Status: Planned
- Domain: Clients / Offline / POS / Field Operations
- Trigger: before native, kiosk, warehouse-scanner, field-service, or offline behavior exits controlled prototype
- Question: Do representative products' real device workflows support the documented assumptions about bounded commands, leases, local certainty, conflict handling, accessibility, retry, and reconciliation?
- Expected outputs: device-class scenario matrix, direct-observation evidence, accessibility limitations, failure/reconnect behavior, and prototype acceptance implications.
- Likely sources: official device/offline documentation, lawful product trials, hardware/provider test environments, and first-party Meridian prototypes.
- Dependencies: device security, offline authority, provider access, accessibility review, and implementation evidence.
- Owner: Client Platform, Offline, Security, Accessibility, and affected domain owners
- Completion: representative scenarios are directly observed or explicitly blocked; documentation-only evidence is not mislabeled as behavioral proof.

## 5. Backlog Management

- Research may be reordered when implementation sequencing changes.
- New entries require a clear decision or risk they can improve.
- Completed entries move to the research ledger; they are not deleted.
- Duplicate questions are consolidated.
- Research must not delay a workstream when existing evidence is sufficient and the remaining question is non-blocking.
- P0 and P1 entries require an owner and explicit completion condition.

## 6. Review Cadence

Review the backlog monthly during active implementation and at each workstream boundary. Remove no unresolved question merely because it is old; instead mark it Deferred, Withdrawn, or Superseded with a reason.
