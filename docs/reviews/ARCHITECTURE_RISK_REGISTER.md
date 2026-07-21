---
document_id: PDA-REV-009
title: Architecture Risk Register
version: 0.11.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-21
---

# Architecture Risk Register

This is a living register that tracks every independent-audit finding from discovery through disposition, remediation, verification, and closure. Its purpose is to let each future audit verify incrementally against recorded conclusions instead of rediscovering settled findings from scratch. Statuses are recorded verbatim from the governed disposition documents and verified audit reports; a registered conclusion is re-opened only when new evidence invalidates it.

**Register Rules**

1. Every new audit finding must reference or extend this register; findings may not be raised as if the prior record did not exist.
2. Re-reporting a registered, unchanged finding without new evidence is a process defect in the audit, not a defect in the repository.
3. Every status change requires an evidence pointer: a disposition document and section, or a commit/PR reference.
4. A registered finding is re-opened only when new evidence invalidates the recorded conclusion, never on re-reading alone.
5. Incremental verification against this register is preferred over whole-repository re-audits.
6. This register is an index. The immutable audit reports and the governed disposition documents remain the authority; rows link to evidence and never restate it.
7. Technical-debt entries are created in the same pull request that accepts the debt; every M-gate exit review scans the merged changes for new undeclared debt.

## Status Vocabulary

Reused from `FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md` §Status Definitions, plus `Open`:

- **Closed** — the repository defect is corrected and machine-checkable where appropriate.
- **Closed architecturally** — the governed design or contract is corrected; executable evidence remains future work.
- **Partially closed** — material remediation exists but a named closure condition remains.
- **External evidence** — customer, provider, legal, tax, accounting, security, accessibility, or operational evidence is still required.
- **Founder decision** — architecture records the question but cannot choose the business fact.
- **Recorded note** — no defect requires immediate change; the observation is preserved for the next material review.
- **Open** — acknowledged and not yet remediated.

Source dispositions sometimes combine classes (for example "Closed architecturally; Founder decision") or add qualifiers; the register preserves that wording verbatim rather than re-adjudicating it.

## First Audit (GAP / AMB) — checkpoint `ddae31d`

| ID | Title | Status | Evidence | Re-open trigger |
|---|---|---|---|---|
| GAP-001 | Missing declared directories | Closed with new issue (residue re-registered as SA-028, since Closed) | FABLE5_AUDIT_DISPOSITION_V1.md §Blocking Findings; FABLE5_SECOND_AUDIT_V1.md §2 | New contradicting evidence |
| GAP-002 | Missing extensible metadata and custom fields | Closed | FABLE5_AUDIT_DISPOSITION_V1.md §Blocking Findings; FABLE5_SECOND_AUDIT_V1.md §2 | Prototype invalidates metadata/storage design |
| GAP-003 | Unresolved Party model | Partially closed (residue re-registered as SA-005, since Closed) | FABLE5_AUDIT_DISPOSITION_V1.md §Blocking Findings; FABLE5_SECOND_AUDIT_V1.md §2; FABLE5_THIRD_AUDIT_V1.md §3 (SA-005) | Schema validation contradicts Party model |
| GAP-004 | Stack contradictions | Closed (residue re-registered as SA-029, since Closed) | FABLE5_AUDIT_DISPOSITION_V1.md §Blocking Findings; FABLE5_SECOND_AUDIT_V1.md §2 | New stack contradiction appears |
| GAP-005 | Missing AI engine owner | Closed | FABLE5_AUDIT_DISPOSITION_V1.md §Blocking Findings; FABLE5_SECOND_AUDIT_V1.md §2 | AI book contradicts engine boundary |
| AMB-001 | Kernel and engine boundary drift | Closed with new issue (residue re-registered as SA-004, since Closed) | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2 | Kernel/engine boundary drifts again |
| AMB-002 | Missing prefix registry | Closed | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2 | Registry generation breaks or drifts |
| AMB-003 | Backend framework simultaneously decided and open | Closed (closure rationale migrated to ADR-0020 per FA4-029) | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2; FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions (FA4-029) | Prototype evidence changes ADR-0020 outcome |
| AMB-004 | Loyalty has no owner | Closed | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2 | New contradicting evidence |
| AMB-005 | Module definition drift | Closed (fixed in naming pass) | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2; FABLE5_THIRD_AUDIT_V1.md §7 (00-Foundation note) | Glossary/naming definitions diverge again |
| AMB-006 | Better Auth evidence quality | Closed | FABLE5_AUDIT_DISPOSITION_V1.md §Ambiguities; FABLE5_SECOND_AUDIT_V1.md §2 | Vendor evidence changes |

## Second Audit (SA) — checkpoint `4070e2f`

| ID | Title | Status | Evidence | Re-open trigger |
|---|---|---|---|---|
| SA-001 | Stored-value ownership contradictory; no positive owner | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Critical Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Stored-value ownership contradicted again |
| SA-002 | Erasure versus append-only doctrine has no mechanism | Closed (behavioral tests remain, as declared) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Critical Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Schema or tests contradict ADR-0014 mechanism |
| SA-003 | Tenant merchant acquiring model never posed | Closed architecturally (ratification and legal verification open) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Critical Findings; FABLE5_THIRD_AUDIT_V1.md §3 | FDR-001 decision or legal advice changes model |
| SA-004 | Kernel charter drift | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Kernel charter drifts again |
| SA-005 | Party cross-reference cleanup incomplete | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Stale Party ownership claims reappear |
| SA-006 | Retail pack contradicts ADR-0010 on fiscalization | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Retail pack contradicts ADR-0010 again |
| SA-007 | Statutory returns triple-claimed | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Statutory-return ownership contradicted again |
| SA-008 | Webhooks have two owners and three placements | Closed (replacement events re-registered via TA-001/TA-045, since Closed) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Webhook ownership contradicted again |
| SA-009 | Risk service unregistered | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Registration drift recurs |
| SA-010 | Cash absent from regional payment strategy | Closed (workflow prototype remains) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Cash workflow prototype contradicts design |
| SA-011 | Recurring commerce assumes unverified collection rail | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Provider evidence contradicts collection modes |
| SA-012 | Storefront and recurring capabilities unminted | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Registry drift recurs |
| SA-013 | "Subscription" names two different things | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Terminology drift recurs |
| SA-014 | 30 event names violate standard; four unregistered prefixes | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Event lint weakened or bypassed |
| SA-015 | Erasure propagation has unspecified targets | Closed architecturally (scenario tests remain) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Scenario tests fail erasure propagation |
| SA-016 | Risk service operationally hollow at terminal stage | Closed architecturally | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §High Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Prototype or operations exercise invalidates case model |
| SA-017 | Manifest engine taxonomy contradicts ADRs | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-018 | Paid memberships promised to two owners | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Membership ownership contradicted again |
| SA-019 | Fiscalization dependency arrows inverted | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Matrix arrows contradicted again |
| SA-020 | Velocity controls duplicated across engines and Risk | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-021 | Documents domain claims collaboration | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-022 | Storefront scope Shopify-class on paper | Closed architecturally (founder ratification open) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | FDR-004 decision changes storefront scope |
| SA-023 | Storefront content-page owner undecided | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-024 | E-commerce sequencing contradicted across three docs | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Sequencing contradiction recurs |
| SA-025 | No cross-rail refund/chargeback design; GYD/USD unaddressed | Partially closed — matches disposition (provider-certified matrices remain) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Provider-certified matrices delivered or contradict design |
| SA-026 | No Guyana regulator verification; MMG unknowns compressed | Partially closed (open until authoritative legal, tax, regulatory, and provider review) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Authoritative Guyana/provider review delivered |
| SA-027 | Backup restore can resurrect erased data | Closed architecturally (restore exercise remains) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Restore exercise resurrects erased data |
| SA-028 | Section READMEs mislabel existing docs as planned | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-029 | ADR-0005 pre-commits to TanStack Form | Closed | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | Benchmark outcome contradicts open framing |
| SA-030 | Search overlap and taxonomic ambiguity | Closed with Low residue (residue re-registered as TA-052, since Closed) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | New contradicting evidence |
| SA-031 | Governance tooling gaps | Partially closed (residue re-registered as TA-001/TA-050, since dispositioned Closed / Closed architecturally) | FABLE5_SECOND_AUDIT_DISPOSITION_V1.md §Medium Findings; FABLE5_THIRD_AUDIT_V1.md §3 | CI enforcement regresses |

## Third Audit (TA) — checkpoint `aa8056b`

| ID | Title | Status | Evidence | Re-open trigger |
|---|---|---|---|---|
| TA-001 | First-slice event contract evades the event registry | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Blocker and Critical | Event registry drift recurs |
| TA-002 | first-slice.json encodes a bigger slice than the manifest | Closed architecturally; Founder decision recorded — FDR-004 Ratified; historical M0 provisional-adoption deviation retained | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Blocker and Critical; FDR-004; issue #81 comment `5008157609`; PR #89 concurrence comment `5008646684` and merge `7de0688` | FDR-004 is superseded or implementation exceeds its bounded first-slice scope |
| TA-003 | API contracts cover roughly half the flows | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Blocker and Critical | Implementation review finds contract gaps |
| TA-004 | Permission catalog covers neither APIs nor capability set | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Blocker and Critical | Permission parity CI regresses |
| TA-005 | Quality-gate system has zero numeric values | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Blocker and Critical | Measured evidence contradicts provisional budgets |
| TA-006 | Entity model missing load-bearing entities | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Schema work contradicts entity model |
| TA-007 | Jurisdiction profile defers every tax/receipt value | Closed architecturally; External evidence | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Qualified tax/accounting verification outcome |
| TA-008 | Jurisdiction corrections from live research | Closed as dated evidence; External evidence | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Authoritative Guyana legal/FX/tax advice outcome |
| TA-009 | Vendor and stack verification corrections | Closed as dated evidence | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Vendor evidence changes |
| TA-010 | Better Auth doc contradicts Party ownership split | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Identity lifecycle mutates domain roles in tests |
| TA-011 | Workforce domain never aligned to ADR-0007 | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Party/Workforce integration tests fail |
| TA-012 | Marketplace unregistered in capability governance | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Registration drift recurs |
| TA-013 | Project skills: wrong portfolio; tool-restriction misunderstood | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Skill trigger/safety regressions |
| TA-014 | AI guardrails real, mechanisms not | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | SDK/multi-agent prototype contradicts controls |
| TA-015 | Marketplace AI packs bypass AI governance pipeline | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §High Findings | Marketplace implementation bypasses registries |
| TA-016 | Zero customer evidence behind present-tense beachhead | External evidence — zero recorded; WS3 entry blocked by issue #82 | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Corrections to Third-Audit Closure Claims; MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md; issue #82 | Issue #82's real-customer evidence bar is met and independently accepted |
| TA-017 | Permission-naming example violates 3-segment rule | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | New contradicting evidence |
| TA-018 | Payments engine has no registered prefix | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Namespace drift recurs |
| TA-019 | Party capability id splits the Party namespace | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Deprecated alias reappears in implementation |
| TA-020 | Identity umbrella doc predates Party/PlatformIdentityLink | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | New contradicting evidence |
| TA-021 | Entitlement capability id never linked to registry | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Entitlement service tests contradict linkage |
| TA-022 | Registered stored-value event semantically malformed | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | New contradicting evidence |
| TA-023 | Customer-account tender unbacked by any artifact | Closed; Deliberately deferred | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Receivables specification enables the tender |
| TA-024 | Finance handoff deliverables specified nowhere | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Accountant review or export prototype fails |
| TA-025 | Ten required sequence diagrams; zero exist | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Deliverables list and diagrams diverge again |
| TA-026 | Capability test matrix mandated; zero exist | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Executable evidence contradicts matrix design |
| TA-027 | Design-token system has governance but no values | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Token generation or contrast evidence fails |
| TA-028 | Component catalog lacks the POS family | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | New contradicting evidence |
| TA-029 | Data-grid standard is a 58-line checklist | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Assistive-technology tests contradict standard |
| TA-030 | Three divergent component-state taxonomies | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | State taxonomies diverge again |
| TA-031 | Experience Index lacks benchmark protocol | Closed architecturally; External evidence | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Competitor baselines executed |
| TA-032 | Four divergent environment taxonomies | Closed after propagation | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Corrections to Third-Audit Closure Claims | Environment names diverge again |
| TA-033 | No IaC tool decision or module manifest | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | IaC module or installation tests fail |
| TA-034 | Capacity/multi-region doc is 46 lines | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Measured region and cost evidence contradicts |
| TA-035 | Architecture-test ruleset has no rule specification | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Executable architecture tests contradict rules |
| TA-036 | Security operations is a 52-line skeleton | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Tabletop/incident exercise contradicts design |
| TA-037 | Change classes lack approval matrix and error-budget link | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Release exercises contradict matrix |
| TA-038 | Acceptance-suite gaps versus UX | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Executable tests contradict acceptance suite |
| TA-039 | AI budget semantics undefined | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | SDK enforcement tests contradict semantics |
| TA-040 | Evaluation/red-team is taxonomy without program | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Evaluation results contradict thresholds |
| TA-041 | AI incident levels have no clocks | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Incident exercise contradicts clocks |
| TA-042 | Memory governance names no approvers or retention | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Memory purge evidence contradicts design |
| TA-043 | Extension sandbox execution technology undecided | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Runtime-candidate security prototypes fail |
| TA-044 | Marketplace settlement has no computation/execution owner | Closed architecturally; Founder decision | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | FDR-008 decision |
| TA-045 | Webhook delivery-failure events deleted, not rehomed | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Delivery implementation lacks registered events |
| TA-046 | Handbooks describe multi-team org in present tense | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | New contradicting evidence |
| TA-047 | Business DNA Engine has no architectural home | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Prototype accuracy evidence contradicts design |
| TA-048 | Handbook/spec lifecycle lists diverging | Closed after alignment | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Corrections to Third-Audit Closure Claims | Handbook/spec lifecycle terms diverge again |
| TA-049 | Billing adapter front-runs ADR-0015 | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | Provider selection contradicts conditional framing |
| TA-050 | Governance residues: constants, permissions, extraction, gates | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Medium Findings | CI enforcement regresses |
| TA-051 | Signal-retention policy placeholder in Risk doc | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Retention jobs or legal review contradict classes |
| TA-052 | Tenant disbursement lacks owning-domain link | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Disbursement implementation contradicts boundaries |
| TA-053 | ADR-0009 lacks the ADR-0013 cross-pointer | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | New contradicting evidence |
| TA-054 | Cash receivables/agent-collection policy missing | Founder decision (FDR-010; platform cash collection disabled) | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Corrections to Third-Audit Closure Claims | FDR-010 decision |
| TA-055 | FDR entries lack explicit status lines; open items not cross-listed | Closed; Founder decision | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Founder ratification recorded |
| TA-056 | v0-handoff skill transfers no design artifacts | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Generated-code review contradicts constraints |
| TA-057 | Skill trigger descriptions overlap | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Trigger regression tests fail |
| TA-058 | Three divergent AI autonomy ladders | Closed | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Autonomy ladders diverge again |
| TA-059 | Tenant-data training implies undefined opt-in path | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Opt-in implemented without approvals |
| TA-060 | Slice naming drift and miscellaneous UX/content gaps | Closed architecturally | FABLE5_THIRD_AUDIT_DISPOSITION_V1.md §Low Findings | Measured evidence contradicts values |

## Fourth Audit (FA4) — checkpoint `394adba`

| ID | Title | Status | Evidence | Re-open trigger |
|---|---|---|---|---|
| FA4-001 | Chart palette falsely claimed to exist in token registry | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Contrast/color-vision evidence contradicts palette |
| FA4-002 | Support-impersonation diagram missing; ten-flow claim false | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Implementation review omits the flow |
| FA4-003 | Finance-handoff endpoints escape governed contract surface | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Review mutation enters scope without full contract |
| FA4-004 | Bun/Hono/oRPC decision-matrix arithmetic wrong | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-005 | ADR-0020 runtime rules not machine-propagated | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Import-graph tests contradict rules |
| FA4-006 | ADR-0018 (OpenTofu) evidence and propagation hole | Closed as dated architecture evidence | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Vendor evidence changes |
| FA4-007 | Amendment traceability gaps on ADR-0004/0005/0006 | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-008 | architecture-rules.json dangling family and loose grants | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Executable package tests contradict patterns |
| FA4-009 | Token registry is a partial mirror of the token doc | Closed for declared registry scope | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New token groups added without approved shapes |
| FA4-010 | Test-matrix registry cannot express its own model | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Depth advancement bypasses gates |
| FA4-011 | AI registry schema contradicts its doc's required fields | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Real records fail validation |
| FA4-012 | Superseded customer-account tender line unannotated | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-013 | Two live Business DNA specs; incomplete engine catalog | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | DNA authority split recurs |
| FA4-014 | Marketplace payout surface not phase-gated at point of use | Closed architecturally; Founder decision | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | FDR-008 decision |
| FA4-015 | AGENTS.md missing | Closed; reopened 2026-07-17 by fifth-audit F-A-003 (contract divergence) and re-closed the same day by the parity restoration plus the executable `validate_agent_contract_parity` gate in `scripts/validate_docs.py` | FABLE5_FIFTH_AUDIT_REMEDIATION_PLAN_V1.md; FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Parity gate fails or is removed |
| FA4-016 | Four third-audit dispositions overclaimed | Closed honestly; External evidence | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Customer evidence or FDR-010 outcome |
| FA4-017 | Identity doc softens deny-by-default plugin matrix | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New method added without matrix disposition |
| FA4-018 | pgvector wording bypasses ADR-0024 admission framing | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Admission trigger or prototype evidence |
| FA4-019 | BullMQ named with no ledger row or Bun disposition | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Queue library selected without ledger admission |
| FA4-020 | Missing section READMEs; finance contract has no inbound links | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-021 | CI validates only existence of new machine artifacts | Closed for documentation CI | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Implementation architecture tests missing at review |
| FA4-022 | PDA-ENG-* id series spans two document families | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Document registry uniqueness fails |
| FA4-023 | Two uncross-referenced data-repair requirement lists | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Repair lists drift again |
| FA4-024 | Search ranking authority split across sibling docs | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Shared relevance datasets contradict scopes |
| FA4-025 | Marketing-website doc reuses tenant Marketing vocabulary | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-026 | ADR-0023 frontmatter/changelog mismatch | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | New contradicting evidence |
| FA4-027 | Better Auth appendix refresh items; Bun cluster constraint | Recorded and propagated | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Vendor evidence changes at implementation lock |
| FA4-028 | Bun preference override legitimate but rested on wrong arithmetic | Recorded note | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Prototype evidence or ADR review outcome |
| FA4-029 | AMB-003 closure rationale superseded by ADR-0020 | Recorded rationale migration | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Prototype evidence changes ADR-0020 outcome |
| FA4-030 | Three decision matrices ungated in CLAUDE.md lookups | Closed; reopened 2026-07-17 by fifth-audit F-A-003 and re-closed by the same parity restoration and executable gate as FA4-015 | FABLE5_FIFTH_AUDIT_REMEDIATION_PLAN_V1.md; FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Parity gate fails or is removed |
| FA4-031 | ADR template drift (0017-0019 lack sections) | Closed for current material edit | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Material edit lands without required sections |
| FA4-032 | All 24 ADRs Proposed and Constitution Draft; authority tiers empty | Recorded; ratification required | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Ratification waves complete or conflict unresolvable |
| FA4-033 | Finance schema controlTotals lacked inventory fields | Closed architecturally | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Accountant/inventory prototype validation fails |
| FA4-034 | Marketing/status/analytics docs lacked slice-boundary declarations | Closed | FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md §Finding Dispositions | Scope admitted without scope-change process |

## Fifth Audit (FA5) — checkpoint `81e903b` (P-W2a status pointers)

The immutable finding set and closure tests remain in `evidence/audit/fable5-whole-project-findings.yaml`. These rows record only the P-W2a findings whose status changes in issue #90; the FA4-015/FA4-030 reopen-and-reclose history remains recorded once in the Fourth Audit table above.

| ID | Title | Status | Evidence | Re-open trigger |
|---|---|---|---|---|
| F-A-001 | WS2 PR7 merged without its required pre-merge exact-head concurrence | Closed — P-W2a independently reviewed and merged | PDA-REV-013 exact-`main` audit at `81e903b`; issue #81 comment `5008157609`; PR #89 concurrence comment `5008646684` and merge `7de0688`; PR #91 independent concurrence comment `5009220014` (exact head `ff9816e`) and merge `1541795`; issue #90 | The superseding-review decision is changed, or a governed source again claims PR #79 had pre-merge concurrence |
| F-A-002 | Post-PR7 tracking sources contradict merged state and registry-derived counts | Closed — P-W2a independently reviewed and merged | FABLE5_FIFTH_AUDIT_REMEDIATION_PLAN_V1.md §Implementation status; PR #91 independent concurrence comment `5009220014` (exact head `ff9816e`) and merge `1541795`; issue #90 | Merged tracking sources drift from the registry-derived evidence |
| F-L-005 | Eleven production-readiness gate families were not individually tracked | Closed | PROGRAM_STATUS.md §Production-readiness gates; PR #80 concurrence comment `5008076728` and merge `24d28e6` | The eleven-family table loses a family, owner, status, or evidence pointer |

## Currently Open Risks

Consolidated list of every register entry not fully closed (status Partially closed, External evidence, Founder decision, or Open), plus implementation risks that remain after WS1 controlled-prototype closeout.

| ID | Title | Owner class | Blocking |
|---|---|---|---|
| SA-025 | Provider-certified refund/reversal/dispute matrices | External evidence | Provider selection and pilot payment scope |
| SA-026 | Authoritative Guyana regulator and MMG review | External evidence | Pilot and production claims |
| TA-007 | Qualified tax/accounting verification of the prototype tax pack | External evidence | Pilot |
| TA-008 | Authoritative Guyana commencement/FX/tax/payment advice | External evidence | Pilot |
| TA-016 | Customer discovery evidence (currently zero interviews; issue #82) | External evidence | WS3 entry and hardening prototype investment into pilot commitments |
| TA-031 | Competitor baseline execution (Odoo, ERPNext, specialists) | External evidence | Experience-budget freeze |
| TA-044 | Marketplace paid-phase settlement decision (FDR-008) | Founder | Paid marketplace phase |
| TA-054 | Platform-SaaS cash receivables policy (FDR-010) | Founder | Platform Subscription cash collection |
| TA-055 | Remaining FDR-001–003 and FDR-005–010 ratification (FDR-004 is Ratified) | Founder | Pilot and production |
| FA4-014 | Marketplace payout gating (FDR-008 plus legal/tax/provider review) | Founder | Paid marketplace phase |
| FA4-016 | Customer evidence and FDR-010 external gates from corrected dispositions | External evidence | Pilot |
| FA4-032 | Constitution and ADR ratification waves | PDA and named reviewers | Ratified authority tiers and later pilot/production readiness claims |
| RR-001 | Expo auth plugin approval per the BETTER_AUTH plugin matrix | PDA | Native app authentication implementation |
| RR-002 | PWA manifest theme-color tokens decision | PDA | Web app shell and PWA manifest implementation |
| RR-003 | apps/native Biome lint exclusion | Implementation | Uniform lint enforcement across workspaces |
| RR-004 | Design-token-to-CSS generation pipeline | Implementation | Token registry as the single styling source in code |
| RR-005 | packages/ui catalog completion versus PDA-UX-028 | Implementation | Component catalog conformance |
| RR-007 | Production PostgreSQL RLS role topology and evidence remain deferred | Security/Data | Pilot and production tenant-isolation defense in depth |
| RR-008 | Production OTP delivery and provider evidence remain blocked by FDR-007 | Founder/External evidence | Production factor delivery and recovery |
| RR-009 | Independent assistive-technology conformance, penetration testing, and production-content review remain open | External evidence | Pilot and production accessibility/security claims |
| RR-010 | Party merge, rich identifiers/relationships, duplicate resolution, and privacy-request execution remain beyond WS1 prototype depth | Platform/Party | Any claim or workflow requiring full Party depth |

**RR-006 — Closed at controlled-prototype depth.** PR #74 merged as `7202fc819b70982c013e1ca11a4fcc136e01e2de` after exact-head concurrence at `8b676bc4df140acf9c0a2a40aa44cb9e94c46e26` and green Documentation Governance plus Meridian Prototype workflows. PDA-APP-023 proves bounded claim/lease recovery, retry/dead-letter behavior, replay authority and replay-scoped receipts, consumer idempotency, safe observability, tenant isolation, and rebuildable Catalog/Inventory consumers. Claude Code's final independent re-audit recorded zero remaining actionable findings in PR #74 comment `4991097241`. This closes only the missing controlled-prototype delivery-runtime risk; RR-007, production capacity/SLO/alerting, multi-replica topology, production retention, restore exercises, and external webhook delivery remain open under their named owners. Reopen RR-006 only if new evidence invalidates the merged delivery or idempotency controls.

**RR-007 — Open after the WS2 checkpoint.** WS2 extends the controlled-prototype evidence through tenant-scoped owner constraints, repository predicates, application-command revalidation, worker claims/receipts, projection/import/numbering scope, safe non-disclosure, and two-tenant tests. Those controls do not select or prove the production database-role topology, PostgreSQL Row-Level Security policies, pooler/session-variable behavior, migration/administration bypass roles, operational monitoring, or penetration evidence. Security and Data Platform retain ownership; pilot and production tenant-isolation defense in depth remains blocked until the separate topology and exercise are reviewed and evidenced.

**RR-011 — Closed.** PDA-REV-011 audited exact merge `8f9d93f` and found 0 P0/1 P1/5 P2/4 P3. PDA-REV-012 accepted and remediated all ten findings; PR #57 merged at exact-head-green CI, closing issue #56. Removed from the not-fully-closed list above per Register Rule 4; reopens only on new evidence invalidating PDA-REV-012's disposition.

## Technical Debt Register

Distinct from risk: a debt entry records a deliberate suboptimal choice accepted for expedience, with a defined revisit point — not a defect. Debt entries are created in the same pull request that accepts the debt (Register Rule 7), and each M-gate exit review scans for new undeclared debt.

| ID | Description | Why accepted | Revisit trigger | Owner class |
|---|---|---|---|---|
| TD-001 | **Closed 2026-07-13.** packages/api dissolved into `apps/server` transport (router/context/procedures) plus a generated client type surface in `packages/platform-clients/api-client` during WS0's package restructuring. Evidence: `FIRST_SLICE_IMPLEMENTATION_PLAN.md` §2/§5 WS0; fresh install/typecheck (12/12)/test (126/126)/lint/build all green. | Scaffold expedience to unblock initial workspace wiring | WS0 execution | Implementation |
| TD-002 | **Closed 2026-07-13 (one workstream early).** `@meridian/db`'s Better Auth tables moved to `packages/platform/identity` (`@meridian/platform-identity`) ownership during WS0 rather than waiting for WS1, since no domain code yet depends on the shared connection. Evidence: same as TD-001. | Single-migration-owner rule keeps one migration stream during scaffold phase | WS1 identity workstream | Implementation |
| TD-003 | apps/native excluded from Biome linting | Better-T-Stack scaffold default; no native work is active yet | Native app work starts | Implementation |
| TD-004 | Status-token CSS variables are hand-copied literals pending the token-generation pipeline | Pipeline (PDA-UX-023) not yet built; literals unblock UI work | Token-generation pipeline lands (PDA-UX-023) | Implementation |
| TD-005 | Registry capability governance fields (packaging_class and similar) remain namespace defaults pending curation | Curated overlay exists but per-capability curation is deferred to workstream owners | Capability curation pass per workstream | PDA |
| TD-008 | `apps/web/src/app/error.tsx` logs client errors to `console.error`; no structured client error-reporting sink exists | Prototype-only diagnostics; no reporting infrastructure is selected yet (fifth-audit F-H-008) | Client error-reporting decision at WS7 operational readiness, or first pilot-candidate build | Implementation |
| TD-006 | 37 of 208 registered events currently resolve to owner JSON Schemas; WS2-family emitted events are covered, while later workstreams remain schema-deferred | Workstream-by-workstream schema completion preserves contract ownership without pretending future event payloads are designed | Expand and verify owner schemas as each later workstream enters implementation | Implementation |
| TD-007 | **Closed 2026-07-13.** `packages/contracts/platform-api` now defines transport-neutral oRPC contracts derived from canonical OpenAPI metadata, a semantic-parity test compares route/method/operation/authority/schema metadata, and `packages/platform-clients/api-client` derives from that contract without importing `apps/server`. The former exception is removed and the path-aware architecture checker passes. Evidence: PDA-RDM-008 PR1 and PDA-IMPL-001. | Initial scaffold exposed only two procedures and accepted the temporary type-only import | WS1 PR1 contract-first closure | Implementation |

## Maintenance

This register is updated in the same pull request as any disposition change: a status may not change in a disposition document without the corresponding row changing here, and every row change must carry its evidence pointer. The file is validated by the standard document-governance checks (front matter fields and internal link resolution); the audit reports and dispositions it indexes remain immutable, and corrections to them are recorded as new dated evidence rather than edits.

## Change Log

- **0.10.0 (2026-07-17):** Added the P-W2a fifth-audit status pointers for F-A-001, F-A-002, and F-L-005; recorded FDR-004 ratification on TA-002 while retaining the historical M0 deviation; preserved all external, pilot, and production blockers.
- **0.11.0 (2026-07-21):** Closed F-A-001 and F-A-002 — both stale rows still read "implemented pending independent review" after PR #91 (P-W2a) had already completed exact-head independent review (concurrence comment `5009220014`, reviewed head `ff9816e`) and merged (`1541795`, an ancestor of every later `main` commit). Reconciliation only; no new review commissioned. Removed both rows from the Currently Open Risks list.
