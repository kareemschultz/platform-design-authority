---
document_id: PDA-REV-003
title: Fable 5 Second Audit V1
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
audited_commit: 4070e2f94b8b977f257fb2b91e181f6ff5a76e17
audited_branch: docs/initial-blueprint
prior_audit_disposition: reviews/FABLE5_AUDIT_DISPOSITION_V1.md
---

# Fable 5 Second Audit V1

Second-checkpoint adversarial audit of `docs/initial-blueprint` at commit `4070e2f9`, performed after the second remediation batch (169 files, 191 commits ahead of `main`, documentation-governance CI green at the audited head). Four parallel review passes were run: blocker-disposition closure, ownership coherence across the new engines and services, commercial and regional-payment architecture, and privacy/fraud/governance-tooling effectiveness.

## 1. Executive Verdict

**The remediation is genuine.** No first-audit finding was closed by file existence alone; every "Closed" disposition maps to substantive content, and the disposition document itself is honest (one item, AMB-005, is correctly still open; AMB-002 is further along than claimed). The machine-readable governance layer (registries plus CI) is real and its freshness check genuinely diffs generated output.

**The dominant failure mode has shifted.** The first audit found *missing* architecture. This audit finds *asserted-but-unpropagated* architecture: new ADRs and specs make correct decisions that older documents (kernel overview, manifest, Retail pack, CRM/Procurement domains, capability map) were never updated to reflect, and rules that exist in prose (event naming, offline declarations, review gates) have no enforcement. The repository's own closure rule — "cross-references are updated" — is the rule most frequently violated.

**Readiness remains: suitable for controlled technical prototypes.** First-slice *specification* work is not yet unblocked: three Critical findings (stored-value ownership, erasure-vs-immutability mechanism, tenant merchant acquiring model) plus the jurisdiction profile must be resolved first, because each dictates day-one schema or regulatory posture.

## 2. Disposition Closure Verification

| Finding | Verdict | Notes |
|---|---|---|
| GAP-001 Missing directories | Closed with new issue | All 13 indexes exist and are substantive, but they list already-existing sibling documents as "planned" and never link them; root README omits `registry/`, `scripts/`, `CLAUDE.md` |
| GAP-002 Extensible metadata | Closed | PDA-PLT-022 + ADR-0008 cover search, uniqueness, offline leases, field permissions, AI visibility, versioning, pack fields; status honestly Draft/Proposed |
| GAP-003 Party model | Partially closed | ADR-0007 + PDA-PLT-021 + matrix are genuine, but `PROCUREMENT_DOMAIN.md:33` still says "CRM or Party Management owns shared party identity", `CRM_DOMAIN.md:29,37` still claims Party Relationship and merge as CRM-authoritative, and the kernel overview never registered Party |
| GAP-004 Stack contradictions | Closed | Keycloak survives only as rejected option / guarded note; Better Auth consistent; form standard consistently open — except ADR-0005:52 pre-commits to "TanStack Form after a focused production evaluation" |
| GAP-005 AI engine owner | Closed | PDA-ENG-016 registered with boundaries, capability family, events; 06-AI correctly layered on it |
| AMB-001 Kernel/engine boundary | Closed with new issue | Boundary defined on the engines side only; `PLATFORM_KERNEL_OVERVIEW.md` (v0.1.0) was never updated and now disagrees with the engines overview about the kernel's contents |
| AMB-002 Prefix registry | Closed | Exceeds the disposition's claim: documents.json and capabilities.json committed with CI freshness enforcement |
| AMB-003 Backend framing | Closed | Conditional-ratification framing consistent everywhere |
| AMB-004 Loyalty owner | Closed | ADR-0009 + engine doc + overview registration coherent |
| AMB-005 Module definition | Open (as declared) | Glossary vs Naming Standards definitions still differ |
| AMB-006 Better Auth evidence | Closed | Dated, sourced, implication-separated; caveat: paraphrase-only, no verbatim quotes or version pins |
| Missing-capabilities table (12 rows) | Closed at claimed level | All 12 files substantive (87–374 lines), statuses match disposition qualifiers |

## 3. Findings

Severity: Blocker findings would stop first-slice specification; Critical must be fixed before schema or provider decisions; High before ratification of the affected wave.

### Critical

**SA-001 — Stored-value ownership is contradictory in four places, with no positive owner.**
`03-Business-Engines/LOYALTY_ENGINE.md` (Ownership Decision) assigns gift cards/store credit to "Payment and Finance domains"; `04-Business-Domains/BUSINESS_CAPABILITY_MAP.md` assigns `commerce.gift-cards` and `commerce.store-credit` to Commerce; `COMMERCE_DOMAIN.md` claims store credit; `PAYMENT_ENGINE.md` lists gift-card/store-credit tender; `FINANCE_DOMAIN.md` never mentions stored value; the dependency matrix states only the prohibition. Naming the Payment *Engine* as owner also violates the engines-overview rule that engines avoid owning authoritative records. The stored-value liability ledger — real money owed to customers — has no single owner. **Fix:** add a "Stored value" row to Core Data Ownership naming one owner (recommend: Commerce owns the liability ledger; Payment Engine handles tender; Finance interprets accounting), then point Loyalty/ADR-0009 at that row.

**SA-002 — Erasure versus append-only doctrine has no mechanism, and it dictates day-one schema.**
`11-Security/PRIVACY_RIGHTS_AND_RETENTION.md` mandates deletion/anonymization propagation, while `CLAUDE.md` §4, `02-Architecture/DATA_OWNERSHIP_AND_CONSISTENCY.md` (Ledger Rules), and `01-Platform/AUDIT_AND_ACTIVITY.md` (Rule 1) forbid destructive mutation of exactly the records that will contain personal data — and `PARTY_AND_RELATIONSHIP_MODEL.md` designs immutable historical snapshots of names and addresses. No document anywhere chooses an erasure technique (PII vaulting/tokenization at write time, or field-level crypto-shredding). Retrofit cost is maximal. **Fix:** ratify an erasure-mechanism ADR before any first-slice schema design, and amend the doctrine documents to name anonymization of snapshot/ledger PII as a permitted non-destructive operation class (or the chosen alternative).

**SA-003 — The tenant merchant acquiring model is never posed as a decision.**
`13-Commercial/BILLING_PROVIDER_AND_REGIONAL_PAYMENT_RAILS.md` and ADR-0011 separate the five payment contexts well, but whether the platform acts as payment facilitator/aggregator (contracting MMG/banks, onboarding tenants as sub-merchants, inheriting KYC/AML and possible central-bank licensing) or each tenant contracts rails directly is absent from Open Decisions. This single decision drives credential architecture, settlement, reconciliation, compliance scope, and the shape of the Tenant Payment Adapter. Nothing verifies Guyana's payment-system/AML regulatory framework. **Fix:** add the operating-model decision (future ADR) plus a dated Guyana regulatory verification section in the appendix.

### High

**SA-004 — Kernel charter drift.** `01-Platform/PLATFORM_KERNEL_OVERVIEW.md` (still v0.1.0) lists none of the new kernel primitives — Party, extensible metadata, sequence/numbering, collaboration, quotas, import/export — while `BUSINESS_ENGINES_OVERVIEW.md:48` and the capability map assert kernel ownership of exactly those, and `registry/domains.json` names the kernel overview as the authoritative document for the `platform` namespace. This reproduces the first audit's contradiction class one level down. **Fix:** update the kernel overview's Responsibilities, Logical Components, and delivery order.

**SA-005 — Party cross-reference cleanup incomplete.** `PROCUREMENT_DOMAIN.md:33` ("CRM or Party Management owns shared party identity") and `CRM_DOMAIN.md:29,37` (Party Relationship as CRM authoritative entity; CRM-owned merge) contradict ADR-0007; `HEALTHCARE_OPERATIONS_PACK.md:18` retains ambiguous pre-ADR phrasing. Under the disposition's own closure rule, GAP-003 is not closed until these are fixed.

**SA-006 — Retail pack contradicts ADR-0010.** `RETAIL_PACK.md` still lists "Fiscal printers and statutory receipt integrations" under Industry Extensions and omits fiscalization from Required Capabilities, while ADR-0010 rules fiscalization "not an optional POS plugin". The pack ADR-0010 says was updated never was. For the Caribbean retail beachhead this is a legal-scope error, not cosmetics.

**SA-007 — Statutory returns triple-claimed.** Finance ("statutory outputs"), Tax Engine ("return-reporting outputs"), and Fiscalization ("Reporting period and statutory return package") all claim statutory reporting; ADR-0010 excludes only tax *determination*. **Fix:** one boundary statement — Tax produces calculation/return data, Fiscalization owns statutory packaging/submission, Finance consumes.

**SA-008 — Webhooks have two owners and three placements.** `NOTIFICATIONS_AND_COMMUNICATION.md` still claims webhooks (purpose, communication type, and the `platform.webhook.delivery-failed.v1` event) while `07-Developer-Platform/WEBHOOKS_AND_EVENT_DELIVERY.md` declares Developer Platform ownership; simultaneously the capability map/matrix file webhooks under Platform Kernel and the engines-overview boundary omits them. Pick one placement and align all four documents.

**SA-009 — Risk service is unregistered.** `11-Security/RISK_FRAUD_AND_ANOMALY.md` — the highest-fan-out new service — has no capability identifier, no Core Data Ownership row, and no dependency-matrix entry, violating the capability map's own governance rule. Additionally `GOVERNANCE_AND_COMPLIANCE_DOMAIN.md` owns "Risk" and "Assessment" entities with no carve-out from the Security platform's "Risk assessments" (enterprise GRC risk vs transactional fraud risk is never distinguished).

**SA-010 — Cash is absent from the regional payment strategy.** Zero occurrences of cash in the rails doc, ADR-0011, and the verification appendix — for a Caribbean SMB retail beachhead where cash is the dominant tender and a plausible SaaS-collection channel (agent/reseller collection). Cash deposit and bank reconciliation flows need first-class treatment.

**SA-011 — Recurring commerce assumes a collection rail that is not verified to exist.** `RECURRING_COMMerce_AND_MEMBERSHIPS.md` promises stored provider tokens, unattended collection, and dunning, but the only verified beachhead rail (MMG) documents redirect checkout and customer-approved merchant-initiated payments — both interactive. Neither document flags the mismatch. **Fix:** add a rail-capability constraint section (auto-debit vs request-to-pay vs invoice+manual) and mark auto-collection jurisdiction-dependent.

**SA-012 — ADR-0012's own premise is unremediated.** The ADR's context states that `commerce.ecommerce` + `commerce.checkout` "concealed the scope", yet the capability map and generated registry still contain exactly and only those ids — no storefront, connector, recurring-agreement, or membership capabilities were minted. Storefront and Recurring Commerce also have no dependency-matrix rows, and Recurring Commerce declares a Scheduling dependency the matrix does not authorize for Commerce.

**SA-013 — "Subscription" names two different things.** `BILLING_ARCHITECTURE.md` (platform SaaS) and `RECURRING_COMMERCE_AND_MEMBERSHIPS.md` (tenant-facing) both define "Subscription"/"Subscription item" entities with no glossary disambiguation; `SUBSCRIPTION_LIFECYCLE.md` events use an unregistered `commercial.` prefix that will be maximally confusable with future tenant `commerce.subscription.*` events. **Fix:** rename the tenant concept to the doc's own better term ("Customer Agreement" / "Recurring Agreement"), ban bare "Subscription" for tenant entities in NAMING_STANDARDS, and register or fold the `commercial` prefix by ADR.

**SA-014 — 30 event names violate the platform's own standard, using four unregistered prefixes.** `identity.*`, `security.*`, `loyalty.*`, `commercial.*` are not in `registry/domains.json` (CLAUDE.md §5: "Do not invent a prefix"), and names like `loyalty.points-earned.v1`, `security.risk-assessment-created.v1`, `platform.record-followed.v1`, `party.duplicate-detected.v1` collapse entity and fact into one segment against `EVENT_STANDARDS.md`. Engine-event prefix convention is inconsistent (`engine.ai.*` vs bare `loyalty.*`). **Fix:** register or rename, normalize to the standard segment form, document the engine-event convention, and add event linting to CI (see §4).

**SA-015 — Erasure propagation has unspecified targets.** (a) Offline devices: no tombstone protocol, purge acknowledgment, or case-closure policy for never-reconnecting devices ("where supported" is an undefined escape hatch). (b) Party multi-role: no rule for partial erasure when one Party holds an erasable role (customer) and a retention-bound role (employee) — the Party doc's own Open Decisions leave the objects erasure must act on undecided. (c) Webhooks: stored delivery payloads, dead letters, and replay are never connected to erasure, and endpoint owners are not treated as recipients. (d) The privacy lifecycle publishes no events, while search-index deletion propagation depends on events defined nowhere. (e) AI prompt/response logs required by Audit Rule 4 have no retention class.

**SA-016 — Risk service is operationally hollow at its terminal stage.** "Case" exists in an event name only — no entity, states, SLA, or evidence model; there is no subject-facing appeal or false-positive remediation path (ironic given the platform's reversal doctrine); fraud BY tenants (trial abuse, card-testing, laundering, sanctions) versus fraud AGAINST tenants is undistinguished, with no platform-operator investigator access model; and cross-tenant velocity/reputation correlation is claimed without reconciling the Party doc's explicit prohibition on cross-tenant identity correlation.

### Medium

- **SA-017** `PLATFORM_MANIFEST.md` engine taxonomy contradicts ADR-0009/0010 (groups "Tax and fiscal policy", groups loyalty under promotions, lists kernel primitives as engines). Align to the 17-engine overview list.
- **SA-018** Paid memberships promised to both Loyalty ("later capabilities") and Recurring Commerce (owner now); qualify entity names and split agreement/billing vs benefit grants.
- **SA-019** Dependency-matrix Fiscalization arrows inverted (Tax and Documents listed as consumers of Fiscalization while the engine doc consumes them) — apparent cycle by table.
- **SA-020** Loyalty/Promotion duplicate velocity controls that Risk claims, and Loyalty calls Risk a "future" service shipped in the same batch; define inline-hard-limits vs correlation split.
- **SA-021** `DOCUMENTS_AND_KNOWLEDGE_DOMAIN.md` claims comments/collaboration without deferring to Collaboration Primitives.
- **SA-022** Storefront "bounded" scope already includes custom domains, themes, SEO/structured data, SSR, consent controls, returns, and white-label validation — Shopify-class minus the page builder — plus an internal localization contradiction (Core Experiences vs "one market and currency"). Split slice-1 must-haves from deferred.
- **SA-023** Storefront content-page ownership left as "Documents/Knowledge or Marketing" while Marketing owns `marketing.landing-pages`; decide.
- **SA-024** E-commerce sequencing contradiction: Commerce roadmap step 3 vs ADR-0012 first-release priority vs Retail pack workspaces that assume online orders while its Required Capabilities omit e-commerce.
- **SA-025** Chargebacks/refunds are checklist nouns; no cross-rail asymmetry design (rails without chargeback semantics, refund-to-original-tender vs store credit). GYD/USD dual-currency reality unaddressed ("GYD" appears nowhere in the repo).
- **SA-026** Verification appendix lacks a Guyana regulator section and compresses MMG unknowns (refunds, tokenization, recurring, settlement timing) into one caveat sentence; add per-provider "Known Unknowns".
- **SA-027** Backup restore can silently resurrect erased data — no deletion-journal/re-apply-on-restore rule; no backup/DR spec exists.
- **SA-028** Section READMEs list existing sibling documents as "planned" without linking them (07-Developer-Platform, 10-Data, 11-Security, 19-Appendices); root README omits `registry/`, `scripts/`, `CLAUDE.md`.
- **SA-029** ADR-0005:52 pre-commits to TanStack Form while three other documents frame the form standard as an open contest — a small recurrence of the decided-and-open pattern.
- **SA-030** Two search documents overlap with an undefined "Search Platform" term and an AI-answer layer inside Search's stack that AI Orchestration owns; `EVENT_BACKBONE.md` Initial Event Families omits every new namespace. PDA-DOM-023/024 have undeclared taxonomic status (domain vs Commerce sub-capability) and no domains.json presence. Tenant disbursement orchestration has no owning domain link.

## 4. CI and Registry Enforcement Gaps

The freshness check is real (the workflow runs `generate_registries.py --check` with an exact diff). But:

1. **(Fixed in this batch)** Windows path separators broke the freshness check for Windows contributors — `relative_to(ROOT)` emitted backslashes; now `.as_posix()`.
2. **Capability extraction covers one file and one line shape.** Only `BUSINESS_CAPABILITY_MAP.md` is scanned; the 8 `engine.ai-*` capabilities in the AI engine doc are absent from `registry/capabilities.json`, capability ids referenced in other docs are never checked to exist, and three-segment ids are silently skipped.
3. **Events and permissions are entirely unvalidated** — hence the 30 nonconforming event names (SA-014). Add an event/permission lint against `domains.json` prefixes and the naming pattern.
4. **Governed-scope escape:** `reviews/`, `templates/`, `CLAUDE.md`, root README are outside `governed_markdown_files()`; `PDA-REV-002` could be silently duplicated by a governed doc.
5. **No dead-link checking** — zero dead relative links exist today (verified), but nothing keeps it that way, and the doc set leans heavily on path citations.
6. **Registry governance fields are unfalsifiable constants:** all 403 capabilities carry hardcoded `status: Draft`, `dependencies: []`, `packaging_class: Unclassified`, `offline: Undeclared`, `first_slice: false`, overwritten on every run. CLAUDE.md §4's "offline behavior is declared per capability" has no machine-readable home and can never fail. Source these from structured annotations or a curated overlay.
7. **Workflow checks the branch tip, not the merge result,** and its `ref:` override breaks on fork PRs; remove the override.
8. **Prose-only rules:** the dated-filename semantics, semver, `last_reviewed` validity/staleness, `related_adrs` existence, document-id-to-directory mapping, and "Approved requires review evidence" are all asserted but unenforced — a one-character front-matter edit can "approve" a document.

## 5. Still Missing Before First-Slice Specification (ranked)

1. Guyana/Caribbean jurisdiction profile (tax/VAT, fiscalization, payroll, privacy law, rails specifics) — every retail-slice document is unspecifiable without it.
2. Threat model + tenant-isolation testing strategy — highest-risk absence for a multi-tenant platform about to write its first schema.
3. Data-classification scheme — required by Audit, Party, Search, and Offline docs; defined nowhere.
4. Erasure-mechanism ADR (SA-002).
5. Machine-readable first-slice manifest — zero of 403 capabilities are marked `first_slice: true`; "first-slice work" has no scope object.
6. Backup/DR + environments/release process (12-Deployment, 15-Operations are stubs).
7. Testing strategy (16-Testing) — every spec's Quality Gates reference a discipline that doesn't exist.
8. API standards depth + deprecation/versioning policy.
9. 06-AI minimum set: model gateway, tool-permission model, audit/cost contract (and register `engine.ai-*` capabilities).
10. UX/accessibility standard — POS offline/conflict UI states are load-bearing for the retail slice.

## 6. Open Questions for the Founder

1. **Tenant payment operating model in Guyana:** payment facilitator/aggregator (platform inherits KYC/AML and licensing) or direct tenant-merchant contracts (platform is software plus credential vault)? Drives credential, settlement, reconciliation, and compliance design.
2. **Platform operating legal entity, settlement jurisdiction, and billing currency** — ADR-0011 correctly defers to this; it is the critical-path item for every provider decision.
3. **Are the native reference storefront and tenant recurring commerce inside the retail POS+inventory beachhead slice or after it?** The documents currently answer both ways (SA-022, SA-024), and no verified auto-collection rail exists for memberships.

## 7. Verified Clean

Import/export vs domain ownership (never bypasses domain commands); rate limits vs entitlements vs metering separation; event-backbone vs webhook boundary (backbone side) and CloudEvents treatment; Loyalty vs Promotion/Pricing and vs CRM/Marketing boundaries; Fiscalization vs Sequence Service and Document Engine (spec side); Risk vs Audit/Approval/Rules engines; Collaboration vs Notifications delivery; registration of all non-Risk batch additions in map/matrix/overview; dated-verification discipline in the payments appendix (negative evidence correctly scoped); platform-billing vs tenant-payments separation; marketplace settlement field-level design; no constitutional Stripe dependency; platform vs tenant lifecycle state machines; `documents.json` correctness for all five audited commercial docs; no dead relative links at the audited head.

## 8. Machine-Readable Findings

```json
[
  {"id":"SA-001","severity":"Critical","category":"ownership","files":["03-Business-Engines/LOYALTY_ENGINE.md","04-Business-Domains/BUSINESS_CAPABILITY_MAP.md","04-Business-Domains/COMMERCE_DOMAIN.md","03-Business-Engines/PAYMENT_ENGINE.md","04-Business-Domains/FINANCE_DOMAIN.md"],"finding":"Stored-value (gift cards, store credit) ownership contradictory in four places; liability ledger has no positive owner","action":"Add Core Data Ownership row; align Loyalty/ADR-0009"},
  {"id":"SA-002","severity":"Critical","category":"privacy-architecture","files":["11-Security/PRIVACY_RIGHTS_AND_RETENTION.md","02-Architecture/DATA_OWNERSHIP_AND_CONSISTENCY.md","01-Platform/AUDIT_AND_ACTIVITY.md","01-Platform/PARTY_AND_RELATIONSHIP_MODEL.md","CLAUDE.md"],"finding":"Erasure mandate vs append-only doctrine has no chosen mechanism (PII vaulting or crypto-shredding); dictates day-one schema","action":"New erasure-mechanism ADR before first-slice schema"},
  {"id":"SA-003","severity":"Critical","category":"commercial-regulatory","files":["13-Commercial/BILLING_PROVIDER_AND_REGIONAL_PAYMENT_RAILS.md","18-Decisions/ADR-0011-PROVIDER-NEUTRAL-BILLING-AND-REGIONAL-PAYMENT-RAILS.md"],"finding":"Tenant merchant acquiring model (payfac vs direct) never posed; Guyana payments regulator unverified","action":"Add open decision + regulatory verification; future ADR"},
  {"id":"SA-004","severity":"High","category":"consistency","files":["01-Platform/PLATFORM_KERNEL_OVERVIEW.md","03-Business-Engines/BUSINESS_ENGINES_OVERVIEW.md"],"finding":"Kernel charter never updated with new primitives; disagrees with engines overview; cited as authoritative by domains.json","action":"Update kernel overview"},
  {"id":"SA-005","severity":"High","category":"consistency","files":["04-Business-Domains/PROCUREMENT_DOMAIN.md","04-Business-Domains/CRM_DOMAIN.md","05-Industry-Packs/HEALTHCARE_OPERATIONS_PACK.md"],"finding":"Stale pre-ADR-0007 Party ownership claims; CRM claims Party Relationship and merge","action":"Fix three documents; GAP-003 not closed until done"},
  {"id":"SA-006","severity":"High","category":"consistency","files":["05-Industry-Packs/RETAIL_PACK.md","18-Decisions/ADR-0010-FISCALIZATION-AS-A-SHARED-ENGINE.md"],"finding":"Retail pack still treats fiscalization as optional extension, contradicting ADR-0010","action":"Move to Required Capabilities (jurisdiction-conditional)"},
  {"id":"SA-007","severity":"High","category":"ownership","files":["04-Business-Domains/FINANCE_DOMAIN.md","03-Business-Engines/TAX_ENGINE.md","03-Business-Engines/FISCALIZATION_AND_STATUTORY_REPORTING_ENGINE.md"],"finding":"Statutory return assembly/filing triple-claimed","action":"Boundary statement: Tax=data, Fiscalization=packaging/submission, Finance=consumer"},
  {"id":"SA-008","severity":"High","category":"ownership","files":["01-Platform/NOTIFICATIONS_AND_COMMUNICATION.md","07-Developer-Platform/WEBHOOKS_AND_EVENT_DELIVERY.md","04-Business-Domains/BUSINESS_CAPABILITY_MAP.md","03-Business-Engines/BUSINESS_ENGINES_OVERVIEW.md"],"finding":"Webhooks owned by two services and placed in three taxonomies","action":"Single placement; align four documents; rehome platform.webhook.delivery-failed.v1"},
  {"id":"SA-009","severity":"High","category":"registration","files":["11-Security/RISK_FRAUD_AND_ANOMALY.md","04-Business-Domains/BUSINESS_CAPABILITY_MAP.md","04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md","04-Business-Domains/GOVERNANCE_AND_COMPLIANCE_DOMAIN.md"],"finding":"Risk service unregistered (no capability, ownership row, matrix entry); GRC-vs-fraud risk overlap with Governance","action":"Register capability family + rows; boundary sentences both docs"},
  {"id":"SA-010","severity":"High","category":"commercial-regional","files":["13-Commercial/BILLING_PROVIDER_AND_REGIONAL_PAYMENT_RAILS.md"],"finding":"Cash absent from regional payment strategy for a cash-dominant beachhead","action":"Add cash as first-class rail with deposit/reconciliation flows"},
  {"id":"SA-011","severity":"High","category":"commercial-regional","files":["04-Business-Domains/RECURRING_COMMERCE_AND_MEMBERSHIPS.md","19-Appendices/REGIONAL_PAYMENTS_PRIVACY_AND_FISCALIZATION_VERIFICATION-2026-07-10.md"],"finding":"Recurring collection assumes tokenized auto-debit; only verified rail (MMG) is interactive","action":"Rail-capability constraint section; mark auto-collection jurisdiction-dependent"},
  {"id":"SA-012","severity":"High","category":"registration","files":["18-Decisions/ADR-0012-CONNECTOR-FIRST-WITH-A-NATIVE-REFERENCE-STOREFRONT.md","04-Business-Domains/BUSINESS_CAPABILITY_MAP.md","registry/capabilities.json","04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md"],"finding":"No storefront/connector/recurring capabilities minted; no matrix rows; unauthorized Scheduling dependency","action":"Mint ids, regenerate registry, add matrix rows"},
  {"id":"SA-013","severity":"High","category":"naming","files":["13-Commercial/BILLING_ARCHITECTURE.md","04-Business-Domains/RECURRING_COMMERCE_AND_MEMBERSHIPS.md","13-Commercial/SUBSCRIPTION_LIFECYCLE.md","00-Foundation/GLOSSARY.md"],"finding":"Subscription entity ambiguity platform-vs-tenant; unregistered commercial. event prefix","action":"Rename tenant concept to Recurring Agreement; register prefix by ADR"},
  {"id":"SA-014","severity":"High","category":"naming","files":["03-Business-Engines/LOYALTY_ENGINE.md","11-Security/RISK_FRAUD_AND_ANOMALY.md","01-Platform/COLLABORATION_PRIMITIVES.md","01-Platform/PARTY_AND_RELATIONSHIP_MODEL.md","01-Platform/BETTER_AUTH_IDENTITY_ARCHITECTURE.md","13-Commercial/SUBSCRIPTION_LIFECYCLE.md","02-Architecture/EVENT_STANDARDS.md"],"finding":"30 event names violate naming standard; 4 unregistered prefixes (identity, security, loyalty, commercial)","action":"Register or rename; normalize segments; add CI event lint"},
  {"id":"SA-015","severity":"High","category":"privacy-architecture","files":["11-Security/PRIVACY_RIGHTS_AND_RETENTION.md","01-Platform/OFFLINE_SYNCHRONIZATION.md","07-Developer-Platform/WEBHOOKS_AND_EVENT_DELIVERY.md","10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md"],"finding":"Erasure propagation unspecified for offline devices, multi-role Parties, webhook payload stores, and AI logs; privacy events undefined","action":"Add offline-purge protocol, role-partial erasure, webhook purge/replay guard, deletion event contract"},
  {"id":"SA-016","severity":"High","category":"security-architecture","files":["11-Security/RISK_FRAUD_AND_ANOMALY.md","01-Platform/PARTY_AND_RELATIONSHIP_MODEL.md"],"finding":"No case model/SLA, no subject appeal path, tenant-as-adversary fraud unowned, cross-tenant correlation unreconciled with Party prohibition","action":"Add case section, appeal/remediation, platform-vs-tenant fraud split"},
  {"id":"SA-017","severity":"Medium","category":"consistency","files":["PLATFORM_MANIFEST.md"],"finding":"Manifest engine taxonomy contradicts ADR-0009/0010 and kernel/engine boundary","action":"Align to 17-engine list"},
  {"id":"SA-018","severity":"Medium","category":"ownership","files":["03-Business-Engines/LOYALTY_ENGINE.md","04-Business-Domains/RECURRING_COMMERCE_AND_MEMBERSHIPS.md"],"finding":"Paid memberships promised to two owners","action":"Split agreements/billing vs benefit grants; qualify entity names"},
  {"id":"SA-019","severity":"Medium","category":"consistency","files":["04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md","03-Business-Engines/FISCALIZATION_AND_STATUTORY_REPORTING_ENGINE.md"],"finding":"Fiscalization consumer arrows inverted vs engine doc","action":"Correct consumer lists both directions"},
  {"id":"SA-020","severity":"Medium","category":"ownership","files":["03-Business-Engines/LOYALTY_ENGINE.md","03-Business-Engines/PROMOTION_AND_DISCOUNT_ENGINE.md","11-Security/RISK_FRAUD_AND_ANOMALY.md"],"finding":"Velocity/abuse controls duplicated across engines and Risk; Loyalty cites Risk as future","action":"Inline-limits vs correlation split; fix reference"},
  {"id":"SA-021","severity":"Medium","category":"ownership","files":["04-Business-Domains/DOCUMENTS_AND_KNOWLEDGE_DOMAIN.md","01-Platform/COLLABORATION_PRIMITIVES.md"],"finding":"Documents domain claims comments without deferring to Collaboration Primitives","action":"Boundary sentence"},
  {"id":"SA-022","severity":"Medium","category":"scope","files":["04-Business-Domains/STOREFRONT_AND_DIGITAL_COMMERCE.md","18-Decisions/ADR-0012-CONNECTOR-FIRST-WITH-A-NATIVE-REFERENCE-STOREFRONT.md"],"finding":"Reference storefront scope Shopify-class on paper; localization contradiction","action":"Slice-1 vs deferred split"},
  {"id":"SA-023","severity":"Medium","category":"ownership","files":["04-Business-Domains/STOREFRONT_AND_DIGITAL_COMMERCE.md","04-Business-Domains/MARKETING_DOMAIN.md"],"finding":"Storefront content-page owner undecided","action":"Decide and record in both docs"},
  {"id":"SA-024","severity":"Medium","category":"consistency","files":["04-Business-Domains/COMMERCE_DOMAIN.md","18-Decisions/ADR-0012-CONNECTOR-FIRST-WITH-A-NATIVE-REFERENCE-STOREFRONT.md","05-Industry-Packs/RETAIL_PACK.md"],"finding":"E-commerce sequencing contradicted across three docs","action":"Align roadmap step, ADR priority, pack capabilities"},
  {"id":"SA-025","severity":"Medium","category":"commercial-regional","files":["13-Commercial/BILLING_PROVIDER_AND_REGIONAL_PAYMENT_RAILS.md","03-Business-Engines/PAYMENT_ENGINE.md","01-Platform/CURRENCIES_UNITS_AND_REFERENCE_DATA.md"],"finding":"No cross-rail refund/chargeback design; GYD/USD dual currency unaddressed","action":"Per-rail-class refund policy; jurisdiction profile currency section"},
  {"id":"SA-026","severity":"Medium","category":"evidence","files":["19-Appendices/REGIONAL_PAYMENTS_PRIVACY_AND_FISCALIZATION_VERIFICATION-2026-07-10.md"],"finding":"No Guyana regulator verification; MMG unknowns compressed to one sentence","action":"Known-Unknowns per provider; regulator section"},
  {"id":"SA-027","severity":"Medium","category":"privacy-architecture","files":["11-Security/PRIVACY_RIGHTS_AND_RETENTION.md"],"finding":"Backup restore can resurrect erased data; no deletion journal/re-apply rule; no DR spec","action":"Add rule; cross-reference future backup/DR spec"},
  {"id":"SA-028","severity":"Medium","category":"documentation","files":["07-Developer-Platform/README.md","10-Data/README.md","11-Security/README.md","19-Appendices/README.md","README.md"],"finding":"Section READMEs mislabel existing sibling docs as planned; root README omits registry/, scripts/, CLAUDE.md","action":"Link existing docs; update structure listing"},
  {"id":"SA-029","severity":"Medium","category":"consistency","files":["18-Decisions/ADR-0005-NEXTJS-TANSTACK-EXPO-CLIENT-STACK.md"],"finding":"ADR-0005 pre-commits to TanStack Form while three docs frame the contest open","action":"Reword Decision line to match evaluation gate"},
  {"id":"SA-030","severity":"Medium","category":"consistency","files":["10-Data/SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md","01-Platform/SEARCH_AND_DISCOVERY.md","01-Platform/EVENT_BACKBONE.md","04-Business-Domains/STOREFRONT_AND_DIGITAL_COMMERCE.md","04-Business-Domains/RECURRING_COMMERCE_AND_MEMBERSHIPS.md"],"finding":"Undefined Search Platform term and overlapping search docs; event families stale; DOM-023/024 taxonomy undeclared; disbursement ownership unlinked","action":"Define term, cross-reference, extend families, declare taxonomy"},
  {"id":"SA-031","severity":"High","category":"ci-governance","files":["scripts/generate_registries.py","scripts/validate_docs.py",".github/workflows/docs-governance.yml"],"finding":"Capability extraction single-file (engine.ai-* unregistered); events/permissions unvalidated; governed-scope escape; unfalsifiable registry constants; workflow ref override breaks fork PRs; prose-only lifecycle rules","action":"Extend extraction, add event lint, widen scope, curated overlay, fix ref, encode gates"}
]
```

## 9. Recommended Remediation Order

1. **Before any first-slice schema or provider work:** SA-001, SA-002, SA-003, plus the jurisdiction profile (§5.1).
2. **Before ratification of the affected waves:** SA-004 through SA-016, SA-031 (the CI lint items prevent recurrence of the naming class).
3. **Next foundation/consistency cleanup:** SA-017 through SA-030, AMB-005, ADR-0005 wording.
4. **Standing observation:** the batch's failure mode is propagation, not invention. Adopt a rule that any ADR changing ownership must list, in the ADR itself, every document asserting the old ownership — and CI should eventually enforce reverse-reference updates (the registries make this tractable).
