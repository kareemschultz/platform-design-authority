---
document_id: PDA-CIR-007
title: Competitive Research Ledger
version: 0.7.0
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

### CIR-LED-0010 — Accounting and bookkeeping wave completed

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority review pending
- Wave: Accounting / Bookkeeping
- Question: Which accounting, reconciliation, close, review, and AI-assistance patterns are transferable without allowing research to override Finance authority?
- Products: Kick, Akaunting, Xero, QuickBooks Online, Wave, FreshBooks, Zoho Books, Odoo, ERPNext, Sage, NetSuite, and adjacent products
- Sources: SRC-001, SRC-002, SRC-004, SRC-026, and SRC-033 through SRC-040; page-level first-party citations in PDA-CIR-020 through PDA-CIR-024
- Evidence mode: documented public product/help evidence and internal synthesis
- Access limitations: authenticated ledgers, bank feeds, accountant workflows, model-quality evidence, regional availability, and qualified Guyana accounting review unavailable
- Finding: reconciliation and assisted bookkeeping require explicit evidence, confidence, review, close-state, reversal, and deterministic fallback boundaries; product automation claims do not establish posting safety.
- Contradictions: vendors increasingly describe automated or agentic reconciliation, while direct accuracy, calibration, correction, and jurisdiction evidence remains unavailable.
- Confidence: Medium for workflow patterns; Low for automation quality and jurisdiction fit
- Meridian impact:
  - outputs: PDA-CIR-020 through PDA-CIR-024;
  - capabilities and contracts: research input only; no authority promotion;
  - implementation: prototype hypotheses remain subject to Finance, AI, security, privacy, and first-slice authority.
- Follow-up: independent review, qualified accounting evidence, and implementation evaluation before any consequential automation.
- Revalidate when: a related Finance or AI workstream begins, a cited automation model changes materially, or twelve months elapse.

### CIR-LED-0011 — ITSM, MSP, and RMM documented research transferred

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Design Authority, Service, Assets/Maintenance, Security, Operations, and independent review pending
- Wave: Continuing study — ITSM / MSP / RMM
- Question: Which service-management, managed-service, device-operations, remote-action, automation, credential, and escalation patterns transfer without collapsing domain ownership or operator authority?
- Products: ServiceNow, Freshservice/Freshservice for MSPs, HaloPSA, ConnectWise PSA, NinjaOne, SuperOps, Datto RMM, and IT Glue
- Sources: SRC-041 through SRC-048; page-level first-party citations in PDA-CIR-087
- Evidence mode: documented public product, help, developer, security, and administration evidence; internal architectural synthesis
- Access limitations: no configured tenants, paid editions, remote sessions, agent deployments, provider sandbox/API calls, accessibility review, scale test, support evidence, or Guyana availability review
- Finding: incident/problem/change, agreement/SLA, configuration/device, credential, and remote-operation identities must remain separate; consequential remote work requires target-bound authority, consent/presence policy, signed/versioned action, uncertainty reconciliation, and protected evidence.
- Contradictions: products combine PSA/RMM for operator efficiency while Meridian ownership and tenant rules prohibit the combined UI from becoming a universal data or authority owner; several products expose broad administrator or unattended-action modes that Meridian must constrain rather than copy.
- Confidence: Medium for documented workflow/control patterns; Low for configured defaults, effectiveness, edition parity, accessibility, and operational quality
- Meridian impact:
  - outputs: PDA-CIR-087 through PDA-CIR-089;
  - capabilities: research input for `service.*`, `maintenance.*`, `platform.devices`, `platform.jobs`, `platform.secrets`, `platform.audit`, `platform.delegation`, `engine.workflow`, `engine.automation`, and `developer.*`;
  - contracts: no identifiers or endpoints introduced; registration and ADR review required at roadmap admission;
  - implementation: no first-slice expansion and no provider selection.
- Follow-up: independent review, role-based customer/technician evidence, lawful tenant/agent trials, provider/security/deployment evaluation, and roadmap authority.
- Revalidate when: Service/MSP/RMM scope is proposed, a remote-action provider is evaluated, a cited edition changes materially, or 2027-07-16, whichever occurs first.

### CIR-LED-0012 — IAM and identity-administration documented research transferred

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Platform Identity, Security, Developer Platform, Operations, and independent review pending
- Wave: Continuing study — IAM / identity administration
- Question: Which isolation, federation, provisioning, service-identity, recovery, rotation, delegated-administration, audit and migration patterns transfer without displacing Better Auth or collapsing Party and authorization ownership?
- Products: Keycloak, authentik, Better Auth, and Microsoft Entra as an adjacent enterprise directory/workload-identity reference
- Sources: SRC-049 through SRC-056; page-level first-party citations in PDA-CIR-090
- Evidence mode: documented public administration, product, security and protocol evidence; internal architectural synthesis
- Access limitations: no configured production tenant, paid feature, protocol certification, source-code security review, upgrade/migration, scale test, accessibility review, support evidence or regional/provider review
- Finding: retain Better Auth under ADR-0006; extend only through Platform Identity after PDA-PLT-028 and owner/security review; replace only for a named unmet requirement through an Accepted ADR and reversible migration evidence. Provider realms, tenants, organizations, groups, roles and claims remain adapter-local inputs rather than Meridian tenant, Party or authorization truth.
- Contradictions: compared products deliberately combine authentication, directory and administration concepts for operator convenience, while Meridian ownership requires explicit separation; authentik documents multi-tenancy as alpha with cross-tenant cautions, and Better Auth plugin documentation exposes useful SSO/SCIM patterns without constituting Meridian adoption approval.
- Confidence: Medium for documented concepts/control patterns; Low for defaults, effectiveness, edition parity, migration effort, accessibility and operational quality
- Meridian impact:
  - outputs: PDA-CIR-090 through PDA-CIR-092;
  - capabilities: research input for `platform.authentication`, `platform.identity`, `platform.tenancy`, `platform.organizations`, `platform.authorization`, `platform.party`, `platform.audit`, `platform.secrets`, `developer.applications`, and `developer.api-keys`;
  - contracts: no identifiers, endpoints, plugin enablement or owner changes introduced; capability/contract registration and ADR review remain required;
  - implementation: no first-slice expansion and no provider selection.
- Follow-up: independent Platform Identity/Security review, customer requirement evidence, configured-provider trials, protocol/security/tenant-isolation testing, operational exercises and roadmap authority.
- Revalidate when: enterprise federation, SCIM, delegated identity administration, workload identity or authentication-owner change is proposed; a cited product behavior changes materially; or 2027-07-16, whichever occurs first.

### CIR-LED-0013 — Infrastructure inventory, DCIM, IPAM, and network-operations documented research transferred

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Assets/Maintenance, Service, Developer Platform, Security, Operations, and independent review pending
- Wave: Continuing study — infrastructure inventory / DCIM / IPAM / network operations
- Question: Which desired-state, asset, IPAM, discovery, reconciliation, credential, configuration-change, API, plugin, backup and migration patterns transfer without making a scanner/controller a universal owner?
- Products: NetBox, phpIPAM, Snipe-IT, UniFi, FortiManager, and Nautobot Golden Configuration as an adjacent intended-state reference
- Sources: SRC-057 through SRC-061; page-level first-party citations in PDA-CIR-093
- Evidence mode: documented public project, product, administration, API, backup and change-control evidence; internal architectural synthesis
- Access limitations: no configured deployment, real scan, device adoption, controller change, API call, plugin, upgrade, restore, scale/accessibility test, licensing/support assessment, Guyana availability review or network outage exercise
- Finding: distinguish declared intent, observed evidence and reconciled authoritative state; preserve Assets, Platform Device, Service, Secrets and Developer Platform ownership; require an explicit owner/ADR decision before general infrastructure-network/IPAM facts are admitted.
- Contradictions: network tools market or describe themselves as a source of truth while NetBox itself defines desired rather than live state and emphasizes human validation; controllers combine observation and mutation for efficiency while Meridian must keep provider control separate from tenant, Asset and domain authority.
- Confidence: Medium for documented models/control patterns; Low for safe defaults, operational effectiveness, version/edition parity, integration effort and recovery quality
- Meridian impact:
  - outputs: PDA-CIR-093 through PDA-CIR-095;
  - capabilities: research input for `assets.*`, `maintenance.*`, `service.*`, `platform.devices`, `platform.secrets`, `platform.audit`, `engine.workflow`, `engine.automation`, `engine.approvals`, and `developer.*`;
  - contracts: no identifier, endpoint, provider, owner or first-slice change introduced; ADR/capability registration remains required for infrastructure-network/IPAM authority;
  - implementation: no scanner/controller/plugin admission or remote change authorization.
- Follow-up: independent owner/Security review, customer requirements, lawful configured-product and device/controller trials, owner/roadmap/ADR decision, provider/deployment evaluation, accessibility and operational exercises.
- Revalidate when: infrastructure inventory, DCIM, IPAM, discovery, controller or network-change scope is proposed; cited product behavior changes materially; or 2027-07-16, whichever occurs first.

### CIR-LED-0014 — Named-product lineage and coverage reconciled

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Competitive Research Lead and independent review pending
- Wave: Continuing study — named-product lineage and coverage accounting
- Question: Which explicitly requested comparators are current, renamed, acquired, historical, grouped under a product family, or only partially covered by the completed waves?
- Products: Peachtree/Sage 50, Vend/Lightspeed Retail POS (X-Series), Retail Pro Prism, Invoice Ninja v5, Horilla HR, Open HRMS, OpenProject 17.x, Freshworks/Freshservice/Freshdesk/Freshsales, Acumatica, QuickBooks Desktop Enterprise, monday.com, ClickUp, Rippling, and the complete requested catalog grouped by wave
- Sources: SRC-062 through SRC-069; SRC-075 through SRC-079; page-level first-party citations in PDA-CIR-020, PDA-CIR-025, PDA-CIR-050, PDA-CIR-060, PDA-CIR-062 and PDA-CIR-096; prior wave source records for already studied products
- Evidence mode: current first-party product, help, documentation, release, lineage and public-source evidence; cross-wave accounting
- Access limitations: no paid/configured tenant, normalized edition/geography comparison, acquisition/legal analysis, historical product installation, accessibility test, or full workflow parity test
- Finding: historical aliases must resolve to the current product without double counting; company/family names must resolve to separate product contexts; every named comparator used for a load-bearing workflow observation needs exact first-party page evidence; “studied” means bounded wave evidence, not exhaustive testing.
- Contradictions: vendor families use overlapping names and series while detailed capabilities vary by edition, geography and acquisition lineage; wave-level synthesis is useful but cannot support product-wide parity claims.
- Confidence: High for explicitly documented Peachtree/Sage 50 and Vend/Lightspeed lineage; Medium for family canonicalization and coverage accounting; Low for unconfigured detailed behavior
- Meridian impact:
  - output: PDA-CIR-096;
  - capabilities/contracts: none introduced or promoted;
  - research governance: requested aliases remain searchable and every named set has a dated disposition.
- Follow-up: independent catalog review and product/edition-specific revalidation when a comparator becomes load-bearing for a governed decision.
- Revalidate when: a product is renamed, acquired, discontinued or redirected; a cited wave enters implementation; or 2027-07-16, whichever occurs first.

### CIR-LED-0015 — Device and offline documented evidence transferred with direct observation blocked

- Status: In Review
- Completed: 2026-07-16
- Researcher: Codex with Client Platform, Offline, POS/Payment, Field Service, Security, Accessibility, Testing, and independent review pending
- Wave: Continuing study — direct device and offline evidence
- Question: Do representative products' actual device workflows support documented assumptions about bounded local work, certainty, leases, persistence, retry, conflict, recovery and reconciliation?
- Products: Square POS, Shopify POS, Toast, Dynamics 365 Field Service Mobile, Retail Pro Prism, and future Meridian controlled prototypes
- Sources: SRC-070 through SRC-074; page-level first-party citations in PDA-CIR-097
- Evidence mode: current first-party documentation and explicit access-block accounting; no behavior was directly observed
- Access limitations: no lawful configured tenants, representative hardware/peripherals, payment/provider test permission, controlled outage lab, assistive-technology evaluation, or available Meridian implementation artifact
- Finding: official documentation consistently exposes dependency-specific degraded modes, bounded features, pending/uncertain states, local data-loss hazards, reconnect requirements and provider risk; actual behavior and accessibility remain unknown until directly tested.
- Contradictions: product guidance differs by device, outage topology, plan, processor and supported feature; this reinforces a dependency/certainty model and prohibits a universal “offline works” claim.
- Confidence: Medium-to-High for documented constraints; Unknown for directly observed behavior; no Meridian implementation confidence is claimed
- Meridian impact:
  - outputs: PDA-CIR-097 and PDA-CIR-098;
  - capabilities/contracts: no identifier, endpoint, provider, device or scope change introduced;
  - implementation: OFF-01 through OFF-12 are proposed evidence scenarios, not completed tests.
- Follow-up: acquire lawful exact product/device/provider environments where relevant, execute controlled disruptions and accessibility review, and create implementation-linked EVID records without marking them complete prematurely.
- Revalidate when: an affected controlled prototype approaches exit criteria, exact hardware/provider/product changes, cited guidance changes materially, or 2027-07-16, whichever occurs first.

## 6.1 Stable Research Result Index

This index is the machine-checked registration boundary between backlog questions, durable outputs, ledger evidence, and stable source records. `Transferred` means the outputs are registered; it does not mean the Draft findings are approved or implementation-ready.

| Result ID | Wave | Status | Ledger entry | Backlog transfers | Output documents | Source records | Review boundary |
|---|---|---|---|---|---|---|---|
| RES-001 | Accounting/bookkeeping | Transferred | CIR-LED-0010 | CIR-BACK-001 through CIR-BACK-004; CIR-BACK-016 | PDA-CIR-020 through PDA-CIR-024 | SRC-001; SRC-002; SRC-004; SRC-026; SRC-033 through SRC-040 | Independent review and qualified accounting evidence pending |
| RES-002 | ERP administration | Transferred | CIR-LED-0004 | CIR-BACK-007 | PDA-CIR-025 through PDA-CIR-028 | SRC-001 through SRC-005 | Independent review pending |
| RES-003 | Supply chain | Transferred | CIR-LED-0004 | CIR-BACK-008; CIR-BACK-012; CIR-BACK-013 | PDA-CIR-029 through PDA-CIR-036 | SRC-001 through SRC-006 | Independent review and direct warehouse/device evidence pending |
| RES-004 | Commerce/payments | Transferred | CIR-LED-0005 | CIR-BACK-009; CIR-BACK-010 | PDA-CIR-037 through PDA-CIR-047 | SRC-006 through SRC-014 | Independent review, provider certification, and Guyana evidence pending |
| RES-005 | Customer/service | Transferred | CIR-LED-0006 | CIR-BACK-011; CIR-BACK-015 | PDA-CIR-048 through PDA-CIR-059 | SRC-015 through SRC-021; SRC-032 | Independent review and authenticated workflow evidence pending |
| RES-006 | Workforce | Transferred | CIR-LED-0007 | CIR-BACK-014 | PDA-CIR-060 through PDA-CIR-069 | SRC-022 through SRC-025 | Independent review and qualified jurisdiction evidence pending |
| RES-007 | Platform services | Transferred | CIR-LED-0008 | CIR-BACK-017 through CIR-BACK-019 | PDA-CIR-070 through PDA-CIR-079 | SRC-026 through SRC-031 | Independent review and controlled prototype evidence pending |
| RES-008 | Cross-domain synthesis | Transferred | CIR-LED-0009 | CIR-BACK-020 | PDA-CIR-080 through PDA-CIR-086 | SRC-001 through SRC-040 | Independent review; direct mobile/offline study remains CIR-BACK-025 |
| RES-009 | ITSM/MSP/RMM | Transferred | CIR-LED-0011 | CIR-BACK-021 | PDA-CIR-087 through PDA-CIR-089 | SRC-041 through SRC-048 | Independent review, direct tenant/agent observation, provider evaluation and roadmap admission pending |
| RES-010 | IAM/identity administration | Transferred | CIR-LED-0012 | CIR-BACK-022 | PDA-CIR-090 through PDA-CIR-092 | SRC-049 through SRC-056 | Independent review, configured-provider observation, protocol/security evaluation and roadmap admission pending |
| RES-011 | Infrastructure/DCIM/IPAM | Transferred | CIR-LED-0013 | CIR-BACK-023 | PDA-CIR-093 through PDA-CIR-095 | SRC-057 through SRC-061 | Independent review, direct discovery/controller observation, owner/provider decision and operational/security evaluation pending |
| RES-012 | Named-product lineage | Transferred | CIR-LED-0014 | CIR-BACK-024 | PDA-CIR-096 | SRC-062 through SRC-069; SRC-075 through SRC-079 | Independent catalog review and product/edition-specific revalidation pending |
| RES-013 | Device/offline evidence | Transferred | CIR-LED-0015 | CIR-BACK-025 | PDA-CIR-097 through PDA-CIR-098 | SRC-070 through SRC-074 | Direct observation explicitly blocked; implementation, accessibility, provider and operational evidence pending |

## 6.2 Registration Invariants

`scripts/validate_research_registration.py` enforces the following bounded structural claims:

- every research output from PDA-CIR-020 onward is assigned to exactly one stable result;
- every `Transferred` backlog entry is assigned to exactly one result, while Planned, Deferred, Blocked, Superseded, and Withdrawn entries are not misrepresented as transferred;
- every referenced ledger entry, output document, backlog entry, and stable source record exists;
- result, ledger, backlog, source, and document identifiers are unique;
- the result index remains parseable and its status vocabulary stays explicit.

The validator does not judge whether a comparison is correct, complete, fair, current, or suitable for Meridian. Those conclusions require source review, contradiction analysis, domain-owner review, and the ordinary authority process.

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
