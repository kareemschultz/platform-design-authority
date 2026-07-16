# Meridian Documentation Completion Audit V1

## Independent conclusion

Meridian is not documentation-complete under the mission's definition of an authoritative enterprise blueprint from which implementation teams may build directly.

The repository is a strong, unusually disciplined **controlled-prototype architecture baseline**. Its ownership rules, first-slice boundaries, identifier discipline, event and permission registries, and explicit production gates are materially better than a typical early platform repository. The audit found no reason to stop the already-authorized Technical Prototypes 1–3 when they remain within the named Draft/Proposed prototype exception.

That conclusion is narrower than enterprise or production readiness. At the audited cutoff, all 406 governed documents are Draft or Proposed. No Constitution, ADR, specification, handbook, operational standard, or contract is Approved, Accepted, or Ratified. The repository itself says only those later lifecycle states may direct production implementation. Several current status and completeness claims also overstate either delivery currency or document depth, and the competitive-research branch fails its document-registry freshness gate.

The correct readiness statement is therefore:

> Meridian has a coherent governed baseline for bounded technical prototypes and a broad enterprise capability catalogue. It does not yet have ratified production authority, implementation-ready depth across its declared capability estate, or the external evidence required for pilot or production.

## Audit identity and cutoff

- Audit date: 2026-07-16
- Audited branch: `docs/competitive-intelligence`
- Audited head: `c9faa31bf97414ecf308ae59bc18c8e4a6ea44ec`
- Comparison head: `origin/main` at `40454740838bba4426b9ca48b2e82811bc7b466d`
- Remote: `kareemschultz/platform-design-authority`
- Auditor role: independent documentation, architecture, governance, and evidence review
- Report state: immutable audit evidence after delivery; corrections and closure claims belong in a registration, disposition, or later audit

The audited branch advanced through four local research-wave commits during the review. The cutoff above deliberately freezes the evidence examined. Later commits are not silently treated as audited.

## Scope and method

The review combined repository-wide machine inspection with manual review of governing and representative material.

### Repository evidence examined

- all 912 tracked paths, including 457 Markdown files and 9 MDX pages;
- every filename, directory, README, index, lifecycle field, document identifier, and generated-registry record;
- all ADRs, the Constitution, naming and glossary authority, the Founder Decision Register, ratification plan, first-slice manifest, implementation plan, test matrix, capability map, dependency matrix, architecture rules, technology ledger, risk register, completion checklist, and completeness matrix;
- all OpenAPI operations, registered permissions, registered events, first-slice capability depths, endpoint-permission mappings, JSON Schemas, and generated registries;
- document length and implementation-dimension coverage across 263 blueprint specifications, excluding indexes, appendices, ADRs, and research evidence where those dimensions would be inappropriate;
- repository TODO, placeholder, unchecked-checklist, orphan-reference, internal-link, and generated-registry checks;
- Git history, branch history, recent commit history, pull requests, issues, project fields/items, and GitHub Discussions;
- the competitive-research framework, backlog, ledger, matrices, workflow references, teardowns, findings, source rules, and cited first-party sources available at the cutoff;
- representative current first-party documentation from SAP, Oracle, Microsoft, Odoo, Workday, ServiceNow, Keycloak, and the npm registry.

### GitHub evidence examined

- Open PR #74: WS2 durable event delivery and projections; checks green at audit time.
- Open draft PR #75: competitive intelligence research; both documentation checks red at audit time.
- Open WS2 sequence issues #70–#73 and broader delivery issues.
- GitHub user project `Meridian Delivery Program`: present, private, 35 items and 23 fields at audit time.
- GitHub Discussions: zero discussions.
- Active local/remote branches and the dedicated PR #74 worktree.

### Limits

This was not a line-by-line semantic proof of every sentence. Entire files were enumerated and mechanically inspected; governing documents, all ADRs, registries, plans, audit evidence, and representative domain/engine/industry/operations specifications received manual review. Historical independent audit reports were treated as immutable evidence, not as files to correct. Paid product instances, private implementation guides, provider sandboxes, customer interviews, jurisdictional professional advice, and production exercises were not available and are not inferred.

## Quantitative baseline

| Measure | Audited result | Meaning |
|---|---:|---|
| Tracked files | 912 | Repository-wide inventory completed |
| Markdown files | 457 | Governed and conventional prose |
| MDX pages | 9 | Product-documentation plane; excluded from current registry generator and validator |
| Governed documents discovered | 406 | Files with governed front matter and `document_id` |
| Draft documents | 377 | May guide only controlled prototypes under named exceptions |
| Proposed documents | 29 | Includes all ADRs; none is Accepted |
| Approved / Accepted / Ratified | 0 / 0 / 0 | No production-directing authority exists |
| Generated document records | 345 | Stale by 61 governed documents at the cutoff |
| Capability records | 497 | Broad architecture catalogue, not implementation-depth proof |
| Canonical events | 204 | Predominantly first-slice and platform coverage |
| Canonical permissions | 100 | Predominantly first-slice and platform coverage |
| OpenAPI operations | 99 | Draft first-slice contract |
| First-slice included / deferred | 103 / 13 | Depth is full, prototype, or seam |
| First-slice evidence coverage | 11 of 103 capabilities | WS1 evidence only at the audited branch cutoff |
| First-slice evidence cells | 143 of 1,294 required cells | Implementation evidence materially lags declared slice breadth |
| Architecture-rule exceptions | 0 | Strong current dependency-governance posture |
| Competitive-research documents | 59 | Four completed local waves plus framework/accounting material |
| Competitive-research cited links | 86 references / 65 unique URLs | Useful first-party base, not comprehensive market coverage |
| GitHub Discussions | 0 | No discussion history to audit |

### Specification-depth indicators

Across 263 blueprint specifications for which implementation detail is relevant:

| Dimension | Documents with a detectable treatment |
|---|---:|
| Purpose | 88.6% |
| Dependencies | 34.6% |
| Security | 66.2% |
| Data, schema, or persistence | 28.9% |
| API, command, or endpoint implications | 48.3% |
| Events or outbox implications | 49.4% |
| Permissions | 58.2% |
| UI, UX, or accessibility | 40.3% |
| Offline or sync behavior | 63.1% |
| Failure, retry, error, or recovery behavior | 54.4% |
| Extensibility or future evolution | 36.5% |
| Implementation guidance | 36.1% |
| Testing, validation, or acceptance | 76.0% |
| Migration, rollback, or upgrade | 46.0% |
| Capability references | 72.6% |
| Registry references | 15.2% |
| Explicit business value or problem solved | 0.8% |

These are lexical indicators, not quality scores. They are sufficient to disprove a universal implementation-ready-depth claim. Several declared domain and engine specifications contain roughly 160–225 words and act as ownership outlines rather than build specifications. Examples include Data Contracts and Lineage, Analytics, Cryptography, Rules Engine, and Warehouse Domain material.

## Positive findings that must be preserved

1. **Authority conflicts are explicit.** The Constitution, ADR order, founder-decision boundary, and prototype exception are documented rather than implied.
2. **Domain ownership is consistently defended.** Party versus domain roles, Better Auth versus authorization, Commerce stored value versus Payment/Finance/Loyalty, and Developer Platform webhook ownership are materially coherent.
3. **First-slice depth is bounded.** Full, prototype, seam, and explicit deferral are machine-readable; future-domain research does not automatically expand implementation scope.
4. **Identifiers are governed.** Capability, event, permission, namespace, and payment-family rules are well established and validated.
5. **Architecture boundaries are machine-backed.** Package families, persistence owners, forbidden imports, and zero current exceptions provide a strong prototype foundation.
6. **Financial and inventory correction semantics are sound.** Reversal/compensation, exact decimal handling, outbox atomicity, and owner-ledger principles are consistently reinforced.
7. **Research governance is appropriately skeptical.** The source trust model, confidence vocabulary, contradiction controls, licensing rules, and adopt/improve/reject discipline prevent competitor material from becoming hidden authority.
8. **Readiness caveats are generally honest.** The repository repeatedly blocks pilot and production on founder, professional, provider, customer, security, accessibility, and operational evidence.

## Findings

### DCA-001 — Production authority is empty

- Severity: **Blocker for production-directing blueprint completion; not a blocker for the existing controlled-prototype exception**
- Confidence: High
- Evidence: `docs/blueprint/00-Foundation/CONSTITUTION.md` front matter and Ratification Criteria; every ADR under `docs/adr/`; `docs/blueprint/17-Roadmap/RATIFICATION_WAVES.md`; repository lifecycle scan
- Gap: 377 governed documents are Draft and 29 are Proposed. None is Approved, Accepted, or Ratified. The Constitution is itself Draft and every ADR remains Proposed.
- Consequence: implementation teams cannot correctly treat the repository as production authority. Calling the mission complete would contradict the repository's own lifecycle rule.
- Recommendation: prepare review packets and evidence manifests wave by wave, but do not self-ratify. Record named architecture, security, UX, commercial, licensing, founder, and independent-review decisions. Keep prototype and production readiness visibly separate.
- Owner: Platform Design Authority with founder and named external reviewers
- Timing: Wave 0 immediately; production blocker until actual review evidence exists
- Closure: the required authority set has valid lifecycle states, dated `review_evidence`, recorded dissent/disposition, and no validator or registry drift.

### DCA-002 — “Complete blueprint coverage” overstates implementation depth

- Severity: Critical
- Confidence: High
- Evidence: `docs/blueprint/19-Appendices/DOCUMENTATION_COMPLETENESS_MATRIX-2026-07-11.md` Coverage Status and Blueprint Completeness Claim; 263-specification dimension scan; representative domain/engine/industry specifications
- Gap: the matrix labels every major area “Complete blueprint coverage,” while large parts of the capability estate are short ownership outlines without the data, API, event, permission, UI, offline, failure, testing, migration, and operational detail demanded of an implementation reference.
- Consequence: reviewers may confuse breadth of named concepts with sufficient build depth, suppressing legitimate discovery and review.
- Recommendation: replace the binary claim with document-class and depth semantics: `authority-outline`, `architecture-complete`, `contract-complete`, `prototype-ready`, `implementation-ready`, `operationally-evidenced`, and `ratified`. Score each domain/capability family against only the sections appropriate to its document class.
- Owner: Platform Design Authority and Documentation Governance
- Timing: immediate truth-correction wave
- Closure: the completeness matrix is regenerated or maintained from explicit criteria, makes no universal completeness claim, and has adversarial review evidence.

### DCA-003 — Program status and roadmap evidence lag actual WS2 delivery

- Severity: Critical
- Confidence: High
- Evidence: `docs/project/PROGRAM_STATUS.md` Executive view, First-slice workstreams, and Immediate priorities; `docs/blueprint/17-Roadmap/FIRST_SLICE_IMPLEMENTATION_PLAN.md` Baseline and WS2 sections; merged PRs through #69; open PR #74; project and issue state
- Gap: program status says WS2–WS7 have not begun and instructs reviewers to complete planning under issue #62. Main already contains WS2 planning/prototype/ledger work through PR #69, and PR #74 is green. The implementation plan still says Catalog and Inventory do not exist at first-slice depth.
- Consequence: delivery sequencing, percentages, blockers, and audit assumptions are wrong even though the underlying implementation history is available.
- Recommendation: update status from verifiable issue/PR/evidence facts, state an evidence cutoff SHA, and distinguish merged work, active PR work, remaining WS2 exit criteria, and overall first-slice evidence coverage. Automate only facts the API can prove.
- Owner: Delivery Lead and Platform Design Authority
- Timing: immediate; then at each merged workstream PR
- Closure: status validation asserts the current main SHA/workstream state, and no prose claims a completed prerequisite is still pending.

### DCA-004 — The competitive-research branch is unmergeable under its own documentation gate

- Severity: Critical
- Confidence: High
- Evidence: PR #75 checks; `python scripts/validate_docs.py`; `python scripts/generate_registries.py --check`; `registry/documents.json`; 406 governed documents discovered versus 345 registered
- Gap: prose validation passes locally, but registry freshness fails. PR #75 has two red `validate-docs` jobs. Sixty-one governed documents are absent from the generated document registry at the audited cutoff.
- Consequence: navigation, document discovery, uniqueness evidence, and CI trust are stale. The branch must not merge red.
- Recommendation: after concurrent research writing stops, regenerate registries from sources, review the diff, rerun both governance commands independently, and update every applicable index.
- Owner: Competitive-research branch maintainer
- Timing: before PR #75 leaves Draft or merges
- Closure: `validate_docs.py` and `generate_registries.py --check` both exit zero in a fresh checkout and PR #75 is green.

### DCA-005 — Capability breadth is not matched by contracts outside the first slice

- Severity: High
- Confidence: High
- Evidence: `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `openapi/first-slice-v1.yaml`, and namespace coverage analysis
- Gap: 497 capabilities span 31 namespaces, but many future namespaces have no canonical permissions or events and no API contract. Examples include Assets, Fleet, Logistics, Maintenance, Manufacturing, Payroll, Planning, Projects, Rental, Service, Warehouse, and most Workforce detail.
- Consequence: the map is a strategic catalogue, not a directly implementable enterprise contract estate. Teams could invent identifiers or boundaries if the distinction is not explicit.
- Recommendation: do not bulk-invent contracts or expand the first slice. Add a capability-family contract-readiness register that declares each future family `outline`, `research`, `decision-blocked`, `contract-planned`, or `deferred`. Create detailed contracts only as a governed roadmap/workstream admits them.
- Owner: owning domains with Platform Design Authority
- Timing: register immediately; deepen before each domain implementation workstream
- Closure: every capability family has an explicit depth and admission trigger; admitted workstreams have resolved capabilities, permissions, events, APIs, data ownership, UI/offline behavior, and tests.

### DCA-006 — No document-class-specific completeness contract exists

- Severity: High
- Confidence: High
- Evidence: templates, validator behavior, completeness matrix, and specification-depth scan
- Gap: the mission's desired fields are not encoded as a governed standard by artifact type. A Constitution, ADR, evidence report, domain specification, runbook, API guide, and capability specification should not share one indiscriminate checklist, yet implementation specifications need far more than many currently contain.
- Consequence: documents can pass structural validation while remaining too shallow, or be padded with irrelevant sections to satisfy an unsuitable universal template.
- Recommendation: define required sections and acceptable `Not applicable — reason` handling for each artifact class. Add machine-checkable metadata such as `document_class`, `declared_depth`, `applicable_dimensions`, and `evidence_state` only after an ADR/governance review of registry compatibility.
- Owner: Documentation Governance
- Timing: before the mass specification-deepening wave
- Closure: templates, validator, registry, and completeness reporting use the same class-specific rules and sample documents pass independent review without filler.

### DCA-007 — Competitive research output is materially ahead of its ledger and backlog

- Severity: High
- Confidence: High
- Evidence: `docs/blueprint/19-Competitive-Research/RESEARCH_LEDGER.md`, `RESEARCH_BACKLOG.md`, 59 research documents, and four local wave commits at the cutoff
- Gap: the ledger records only the framework and earlier UX/source work. The backlog still marks already-produced ERP, Catalog/Inventory, POS, Payments, Procurement, Manufacturing, CRM, Projects, Service, and Rental studies as Planned or Ready.
- Consequence: reviewers cannot tell what was completed, reviewed, superseded, or still evidence-limited. Research volume can be mistaken for accepted findings.
- Recommendation: add one dated ledger record per completed wave, disposition each affected backlog item, link exact outputs and source sets, declare access limitations, and keep status `In Review` until independent review.
- Owner: Competitive Research Lead
- Timing: before PR #75 review
- Closure: every output resolves to a ledger entry and backlog state; no completed artifact remains falsely Planned.

### DCA-008 — The requested competitive landscape remains incomplete

- Severity: High
- Confidence: High
- Evidence: product-mention and source analysis across the competitive-research directory; mission product list; `RESEARCH_BACKLOG.md`
- Gap: accounting, ERP, supply-chain, commerce/payments, and customer/service waves establish a useful base. Material requested families remain unresearched or only name-checked: HR/HCM/payroll, ITSM/MSP/RMM, IAM, infrastructure/IPAM/DCIM, project/work management depth, documentation/search/notifications, mobile/offline, and several accounting/POS products. At the cutoff there is no substantive treatment of products such as Workday, UKG, SuccessFactors, ServiceNow, Fortinet, IT Glue, HaloPSA, NinjaOne, ConnectWise, Snipe-IT, NetBox, phpIPAM, Authentik, or Keycloak.
- Consequence: “research complete” would be false, and future domain recommendations lack a comparable evidence base.
- Recommendation: continue bounded waves by implementation proximity and consequence. Use first-party capability, administration, API, security, release, and migration sources; clearly label marketing-only evidence and inaccessible workflows. Never let competitor breadth expand the first slice.
- Owner: Competitive Research Lead with domain owners
- Timing: P1 before related workstreams; P2/P3 on the research roadmap
- Closure: each named research family has a reviewed matrix, workflow reference, product limitations, adopt/improve/reject decisions, Meridian impact, dated source ledger, and explicit remaining evidence gaps.

### DCA-009 — Navigation and index coverage do not match repository scale

- Severity: High
- Confidence: Medium-High
- Evidence: filename/document-ID incoming-reference analysis; section READMEs; root README repository tree
- Gap: 63 governed documents had no incoming reference by filename, path, or document ID in the audit graph. Many section READMEs are one-line filename lists rather than navigable indexes. The root structure omits the competitive-research section and contains a stale roadmap path description.
- Consequence: important authority and supporting specifications are effectively orphaned for human readers even when the document registry knows they exist.
- Recommendation: require every governed document to appear in one canonical section index and relevant cross-reference graph, with explicit exemptions for immutable evidence or generated artifacts. Convert section READMEs to concise linked inventories with purpose, authority class, lifecycle, and entry routes.
- Owner: Documentation Governance and section owners
- Timing: truth-and-navigation wave
- Closure: an orphan/index validator reports zero unexplained governed documents and all root/section navigation matches the generated registry.

### DCA-010 — MDX product documentation is outside core governance checks

- Severity: High
- Confidence: High
- Evidence: `apps/docs/content/docs/`, `apps/docs/content/docs/index.mdx`, `scripts/validate_docs.py`, and `scripts/generate_registries.py`
- Gap: the generator and validator walk `.md` files, not `.mdx`. The nine MDX guides have product-doc front matter only and are intentionally outside the architecture registry, but no equivalent product-doc manifest validates ownership, release applicability, permissions, accessibility, links, or implementation evidence. The index says the guides complete behavior currently present, a stronger claim than the evidence model proves.
- Consequence: the public documentation plane can drift from canonical OpenAPI, permissions, releases, and actual behavior without failing the principal documentation governance job.
- Recommendation: retain plane separation, add a product-document manifest and MDX-specific checks, generate API reference from OpenAPI, and qualify completion by release and evidence state.
- Owner: Developer Platform Documentation
- Timing: before public documentation deployment
- Closure: MDX builds, links, metadata, release applicability, generated API parity, and evidence references are CI-enforced.

### DCA-011 — Operational documentation is primarily a requirements catalogue, not an executable runbook set

- Severity: High
- Confidence: High
- Evidence: `docs/blueprint/15-Operations/SERVICE_CATALOG_AND_RUNBOOK_INDEX.md`, operations directory inventory, first-slice operational gates, and PR #74 runbook work
- Gap: the service catalogue defines required service and runbook fields, but most named runbooks, dashboards, escalation paths, recovery procedures, and completed exercises do not exist as executable evidence. PR #74 begins closing the Event Backbone case only.
- Consequence: operators cannot safely diagnose, contain, recover, or verify most services from the current prose. Production readiness remains blocked.
- Recommendation: create runbooks only alongside real deployable services, telemetry, and exercises. Each must name triggers, safe actions, authority, tenant/privacy controls, rollback, verification, escalation, and evidence. Do not fabricate operational steps for unimplemented services.
- Owner: Service owners and Operations
- Timing: per implementation workstream; mandatory before pilot
- Closure: every pilot-critical service has reviewed runbooks, tested alerts, and dated exercise evidence with residual findings.

### DCA-012 — Capability sources remain deliberately fragmented

- Severity: High
- Confidence: High
- Evidence: `docs/blueprint/04-Business-Domains/BUSINESS_CAPABILITY_MAP.md`, `CAPABILITY_MAP_AMENDMENT-2026-07-11.md`, `scripts/generate_registries.py`
- Gap: the amendment says Party, Payment, and Business DNA entries should be folded into the next consolidated capability map, but the generator still consumes three source documents.
- Consequence: humans must understand amendment precedence while the generated registry hides the source fragmentation. Future edits can duplicate or diverge definitions.
- Recommendation: consolidate at a governed version boundary, preserve amendment history as superseded evidence, update source lists, and verify no identifier or first-slice depth changes accidentally.
- Owner: Platform Design Authority
- Timing: before capability map approval/ratification
- Closure: one canonical current capability source or an explicitly ratified multi-source model; registry provenance and indexes agree.

### DCA-013 — Ratification waves are plans without completed review records

- Severity: High
- Confidence: High
- Evidence: `docs/blueprint/17-Roadmap/RATIFICATION_WAVES.md` Waves 0–8 and Review Records
- Gap: all waves remain Draft; no wave manifest demonstrates completed reviewers, reviewed versions, dissent, dispositions, approval authority, or promotion evidence.
- Consequence: the lifecycle blocker cannot close merely by editing more prose.
- Recommendation: begin with Wave 0 repository governance and Wave 1 Constitution/product foundation. Produce immutable review packets and formal dispositions. External/founder gates must remain open when evidence is unavailable.
- Owner: Platform Design Authority and named approvers
- Timing: after truth-correction and registry repair; before production implementation authority
- Closure: required wave records exist and each promotion is supported by review evidence rather than document volume.

### DCA-014 — Technology evidence needs a live refresh queue

- Severity: Medium
- Confidence: High
- Evidence: `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`, root package catalogue, npm registry queried 2026-07-16
- Gap: the July 14 register is mostly current and accurately pins prototype versions. By July 16, Hono 4.12.30 and `@orpc/server` 1.14.8 were available while the repository pinned 4.12.29 and 1.14.7. This is ordinary patch drift, not proof that an upgrade is appropriate.
- Consequence: a static “verified” date can be misread as current compatibility evidence; security or compatibility changes may be missed.
- Recommendation: track discovered, assessed, selected, pinned, and proven versions separately. Queue patch reviews with release/security evidence and run the named compatibility tests before changing locks.
- Owner: Engineering Architecture and Security
- Timing: each dependency-review cadence and before implementation locks
- Closure: the ledger records the current assessed version, disposition, exact evidence date, compatibility result, and fallback without untested upgrade claims.

### DCA-015 — Project-control artifacts contain stale external state

- Severity: Medium
- Confidence: High
- Evidence: GitHub issue #59 and the live `Meridian Delivery Program` project
- Gap: issue #59 still requests authorization and creation of a project that already exists with 35 items and 23 fields. GitHub Discussions are empty, so no missing decision history can be recovered there.
- Consequence: backlog readers may repeat completed setup work or infer an authorization gate that has already changed.
- Recommendation: disposition issue #59 with evidence of project creation and audit project field/status mappings against current issue states. Do not create a parallel manual task tracker in documentation.
- Owner: Delivery Lead / repository administrator
- Timing: next project-maintenance pass
- Closure: issue and project state agree; no duplicated status authority is introduced.

### DCA-016 — Current validation proves syntax and cross-reference integrity, not semantic completeness

- Severity: High
- Confidence: High
- Evidence: `scripts/validate_docs.py`, `scripts/generate_registries.py`, current CI behavior
- Gap: validation covers Markdown front matter, IDs, naming, links, events, permissions, OpenAPI parity, architecture rules, exemptions, founder decisions, and schema compilation. It does not cover MDX, external-link freshness, canonical section-index membership, orphan documents, document-class required sections, stale status facts, research-ledger closure, or semantic contradiction across authority levels.
- Consequence: a green documentation gate can coexist with shallow, stale, or difficult-to-discover documentation.
- Recommendation: add bounded checks for index/orphan coverage, MDX metadata/build, status cutoffs, research output registration, and class-specific completeness. Keep semantic review human and evidence-based; do not pretend keyword lint is architectural proof.
- Owner: Documentation Governance and CI maintainers
- Timing: Wave 0 remediation
- Closure: new tests fail on seeded defects, pass on corrected sources, and do not force filler or rewrite immutable audit evidence.

### DCA-017 — Placeholder and unresolved-value content remains in active artifacts

- Severity: Medium
- Confidence: High
- Evidence: `openapi/first-slice-v1.yaml` server description; infrastructure cost worksheet; templates
- Gap: OpenAPI contains `description: Placeholder only`. The infrastructure cost worksheet contains unresolved `TBD` values. Template placeholders are legitimate, but active contracts and decision worksheets need explicit lifecycle semantics.
- Consequence: generated API documentation exposes filler, and cost conclusions may be inferred without inputs.
- Recommendation: replace the OpenAPI filler with an accurate local/prototype server description. Mark unknown cost inputs as `Unresolved — owner/evidence/decision trigger` rather than generic TBD, and prohibit totals/readiness claims until resolved.
- Owner: API Contract owner and Deployment/Commercial owners
- Timing: immediate for OpenAPI; before cost-based decisions for worksheet
- Closure: no active governed artifact contains unexplained placeholder language; templates remain exempt and clearly marked.

### DCA-018 — First-slice evidence registration lags merged implementation

- Severity: High
- Confidence: High
- Evidence: `registry/first-slice-tests.json`, `evidence/first-slice/`, merged WS2 commits through PR #69, open PR #74
- Gap: only 11 of 103 included first-slice capabilities have evidence declarations, all from WS1. WS2 implementation has begun and multiple PRs have merged, but no partial WS2 evidence source is registered at this cutoff.
- Consequence: repository status may either under-credit delivered evidence or overstate WS2 completion without capability-dimension proof.
- Recommendation: register evidence at coherent workstream gates, not per trivial commit, but make interim status explicit. WS2 exit must populate all applicable dimensions with tests, deferral reasons, and source references.
- Owner: WS2 Delivery Lead and Test Architecture
- Timing: WS2 closeout; status correction immediately
- Closure: WS2 capabilities and all applicable test dimensions resolve to reviewed evidence, while unproven cells remain visibly planned or deferred-by-depth.

### DCA-019 — External and founder gates cannot be completed by autonomous documentation

- Severity: Blocker for pilot/production, external to documentation closure
- Confidence: High
- Evidence: `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md`, Architecture Risk Register, first-slice plan, Constitution ratification criteria
- Gap: FDR-001 through FDR-010, customer evidence, qualified Guyana legal/tax/accounting/privacy review, provider capability and certification, penetration testing, accessibility evidence, migration/recovery exercises, and design-partner validation remain open.
- Consequence: producing more documents cannot truthfully authorize the business, legal, provider, jurisdictional, or operational claims.
- Recommendation: maintain decision/evidence packets with exact questions, options, consequences, owners, deadlines, and admissible evidence. Stop at the boundary rather than inventing answers.
- Owner: founder, legal/professional reviewers, providers, customers, Security, Accessibility, and Operations as named
- Timing: by the gates already recorded in the roadmap
- Closure: actual dated decisions and evidence are linked; no agent-generated proxy is accepted.

## Contradiction and boundary audit

No material active contradiction was found in these high-risk semantic boundaries:

- Party owns canonical real-world identity; business domains own role records.
- Better Auth owns authentication and sessions, not Party, permissions, entitlements, or tenant hierarchy.
- Entitlements, permissions, rollout flags, and active context remain separate evaluations.
- Commerce owns stored value; Payment owns provider orchestration; Finance accounts and reconciles; Loyalty owns non-cash value.
- Platform Subscription and Recurring Agreement terminology is generally preserved.
- Internal events use the Event Backbone; external webhooks belong to the Developer Platform.
- Payment detail uses `payment.*`; no provider name becomes a canonical business contract.
- First-slice research documents repeatedly disclaim scope expansion.
- Pilot and production readiness are usually qualified rather than silently claimed.

Historical audit evidence contains superseded observations by design. Those are not active contradictions and must not be edited.

## Enterprise research assessment

### What Meridian should retain or adopt

- role/task-oriented entry points rather than a module maze, supported by current SAP business-role documentation;
- explicit enterprise-structure and implementation readiness, supported by Oracle Financials setup guidance;
- workspaces, lifecycle guidance, extensibility boundaries, and integration visibility, supported by Microsoft Dynamics documentation;
- clear stock states, reservations, lots/serials, routes, counts, and multi-step receiving concepts, supported by Odoo 19 documentation;
- visible incident/problem/change relationships and role-gated actions, supported by current ServiceNow documentation;
- HR system-of-record separation from payroll, time, talent, planning, and jurisdictional obligations, rather than collapsing all “people” data into authentication;
- IAM realm/organization/role lessons only as comparative evidence; Better Auth remains the governed authentication owner unless an ADR changes it;
- durable operation identity, idempotency, uncertainty, reconciliation, reversal, and evidence-first exception handling across payments and supply chain.

### What Meridian should improve

- combine enterprise consequence visibility with small-business learnability;
- show tenant, organization, legal entity, location, role, permission, entitlement, and connection state where a command makes them consequential;
- make background work, partial failure, uncertain provider state, stale projections, and recovery actions understandable to operators;
- use one review experience only as a shell over domain-owned decisions, versions, permissions, and outcomes;
- make imports, bulk edits, migration, and setup previewable, resumable, reconcilable, and reversible where the domain allows;
- treat extension provenance, upgrade compatibility, disable behavior, and data exit as product features.

### What Meridian should reject

- module count as a proxy for platform coherence;
- a universal customer/vendor/employee record that erases Party and domain ownership;
- silent financial or inventory mutation, deletion-based correction, or hidden retries;
- provider SDK semantics as canonical platform contracts;
- global administrator, support, extension, or AI authority without tenant/resource scope and audit;
- offline as a generic toggle rather than command-specific bounded risk;
- marketplace billing, custody, facilitation, pooling, or payout implied by enabling a feature;
- competitor marketing, screenshots, pricing pages, or generated summaries as proof of architecture, accessibility, security, or customer outcomes.

## Required remediation sequence

The repository should not respond by creating hundreds of speculative documents. Depth must follow authority, implementation proximity, and evidence.

### Wave A — Truth, integrity, and mergeability

1. Freeze the competitive-research writing batch.
2. Update research ledger/backlog and all affected indexes.
3. Regenerate `registry/documents.json` and make PR #75 green.
4. Correct program status, first-slice implementation baseline, root navigation, completeness claims, and active placeholders.
5. Record exact evidence cutoffs and concurrent PR boundaries.

### Wave B — Documentation governance depth model

1. Define artifact classes and required dimensions.
2. Add index/orphan, MDX, research-registration, and status-freshness checks.
3. Add a capability-family contract-readiness register without inventing future contracts.
4. Reclassify completeness from binary file coverage to declared depth and evidence state.

### Wave C — Ratification preparation

1. Assemble Wave 0 and Wave 1 manifests.
2. Reconcile the Constitution, naming, glossary, ADR set, FDR gates, and review evidence.
3. Obtain named reviews; disposition dissent; promote only with actual authority.
4. Continue later waves in dependency order.

### Wave D — First-slice implementation documentation

1. Reconcile WS2 plans/status/evidence with merged PRs and PR #74.
2. Complete WS2 runbooks, evidence declarations, user/admin/developer documentation, migration notes, and operational recovery only from implemented behavior.
3. Repeat the vertical documentation slice for WS3–WS7 without broadening their authorized depth.

### Wave E — Future-domain specification depth

1. Prioritize domains by accepted roadmap and customer evidence.
2. For each admitted family, complete purpose, value, owner, entities, invariants, commands/APIs, events, permissions, UI/UX/accessibility, offline/sync, failures, security/privacy, observability, migration, testing, and extensibility.
3. Amend or create ADRs only when ownership, persistence, public contracts, security, deployment, payment, commercial, or lifecycle decisions actually change.

### Wave F — Competitive research completion

1. Complete HR/HCM/payroll.
2. Complete ITSM/MSP/RMM and asset/infrastructure management.
3. Complete IAM comparison, search/commands, notifications/inboxes, documentation/onboarding/changelog, and device/offline studies.
4. Revalidate earlier accounting/ERP/supply-chain/commerce/customer-service sources at implementation entry.

### Wave G — Operational and release evidence

1. Produce real service runbooks, dashboards, capacity results, backup/restore evidence, incident exercises, migration/rollback evidence, accessibility reports, and security tests.
2. Complete user/admin/developer/release documentation for behavior that actually exists.
3. Obtain provider, jurisdictional, customer, and founder evidence.

### Wave H — Final adversarial audit

Re-run repository, contract, lifecycle, research, navigation, external-link, implementation-evidence, and semantic-boundary audits at a fixed main-branch SHA. Completion requires zero unexplained Blocker/Critical/High documentation findings and an explicit disposition of every external gate. “No more files can be imagined” is not the criterion.

## Definition of documentation complete

Documentation completion may be claimed only when all of the following are true:

1. Every governed artifact has an honest lifecycle, owner, class, depth, and evidence state.
2. The production-directing authority set is actually Approved, Accepted, or Ratified with review evidence.
3. Every roadmap-admitted capability family has implementation-ready contracts and acceptance evidence at its declared depth.
4. Deferred families are explicitly deferred with admission triggers; they are not padded into speculative implementation specifications.
5. All generated registries and navigation indexes are current and CI-green.
6. Product MDX, generated API references, runbooks, release notes, and migration guides are tied to implemented versions.
7. Research outputs resolve to a dated ledger, sources, confidence, contradictions, dispositions, and revalidation triggers.
8. Program status matches issue, PR, main-branch, and evidence state at an explicit cutoff.
9. No active artifact contains unexplained placeholders, stale completion claims, or orphaned authority.
10. Founder, legal, regulatory, provider, customer, security, accessibility, and operational gates are either satisfied with real evidence or visibly block the applicable readiness claim.

## Final disposition recommendation

Accept all findings for maintainer disposition. Preserve the existing authorization for bounded Technical Prototypes 1–3. Reject any claim that the enterprise blueprint, ratification program, competitive research mission, first-slice implementation documentation, or pilot/production readiness is complete at the audited cutoff.

The highest-value next change is not another broad feature document. It is a truth-and-integrity batch that makes the current research branch green, reconciles live delivery status, replaces the binary completeness claim with depth, and establishes the class-specific completion contract needed for every later wave.
