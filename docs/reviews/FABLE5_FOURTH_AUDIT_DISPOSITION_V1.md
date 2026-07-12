---
document_id: PDA-REV-008
title: Fable 5 Fourth Audit Disposition V1
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
review_evidence: docs/reviews/FABLE5_FOURTH_AUDIT_V1.md
---

# Fable 5 Fourth Audit Disposition V1

## Purpose

Disposition every FA4-001 through FA4-034 finding from the immutable fourth audit, identify remediation evidence, and separate documentation closure from implementation, founder, provider, customer, and professional evidence.

## Status Definitions

- **Closed** — the repository defect is corrected and machine-checkable where appropriate.
- **Closed architecturally** — the governed design or contract is corrected; executable evidence remains future work.
- **Partially closed** — material remediation exists but a named closure condition remains.
- **External evidence** — customer, provider, legal, tax, accounting, security, accessibility, or operational evidence is still required.
- **Founder decision** — architecture records the question but cannot choose the business fact.
- **Recorded note** — no defect requires immediate change; the observation is preserved for the next material review.

## Executive Position

The three High findings are closed without editing the independent report. Medium and Low defects are corrected or explicitly reclassified. Technical Prototypes 1–3 remain permitted by the audited Draft/Proposed authority, but production and pilot readiness remain blocked by the Constitution/ADR ratification gap, founder decisions, customer evidence, qualified Guyana review, provider certification, executable implementation evidence, security/accessibility testing, and operational exercises.

## Finding Dispositions

| ID | Disposition | Remediation evidence | Remaining condition |
|---|---|---|---|
| FA4-001 | Closed architecturally | `registry/design-tokens.json` now contains provisional `color.chart.*`; PDA-UX-023 scopes and qualifies it; PDA-APP-018 carries a dated correction note; validator resolves token references | Contrast, dark-mode, monochrome and color-vision evidence during component implementation |
| FA4-002 | Closed | PDA-ARC-012 now contains sequence 11 for support impersonation; PDA-ARC-011 explicitly defers separate data-flow diagrams until deployable topology exists | Implementation review may refine diagrams but cannot omit the flow |
| FA4-003 | Closed | Unimplemented detail/review endpoints were removed from PDA-DOM-026; mutation intent is explicitly deferred; Markdown endpoint declarations are now checked against OpenAPI | Add endpoint, manifest and permission together if review mutation enters scope |
| FA4-004 | Closed | PDA-ARC-019 totals corrected to 400/435/395; the disclosed Bun preference override remains explicit | Prototype evidence may change the decision, not the arithmetic |
| FA4-005 | Closed architecturally | PDA-ENGR-012 and `registry/architecture-rules.json` prohibit Bun/Hono/oRPC/database-adapter leakage and require Bun/Node critical-suite evidence | Executable import-graph tests in implementation |
| FA4-006 | Closed as dated architecture evidence | ADR-0018, PDA-ENGR-013, PDA-APP-019 and the recommended stack now cross-link OpenTofu 1.12.3 evidence and full-lock obligations | Pin and prove CLI/providers/modules/state/policy in implementation |
| FA4-007 | Closed | ADR-0004/0005/0006 carry visible change logs; ADR-0006 links ADR-0004 and ADR-0020 | Formal ADR review remains pending |
| FA4-008 | Closed architecturally | `platform-clients` is defined; missing prohibitions and contract-only family semantics are recorded; validator checks family closure | Replace abstract patterns with executable package tests |
| FA4-009 | Closed for declared registry scope | `radius.md`/`screen.md` names align; PDA-UX-023 explicitly scopes machine-backed groups and identifies prose-only groups; validator checks referenced machine tokens | Approve cross-platform shapes before adding typography/elevation/z-index groups |
| FA4-010 | Closed architecturally | Capability metadata defines reviewed depth defaults; generator emits `required`, `not-applicable`, `deferred-by-depth`, plus reasons | Executable evidence remains Planned and depth advancement remains gated |
| FA4-011 | Closed architecturally | AI schema admits and requires the governance fields named by PDA-AI-016; release-state spelling aligns; schema compilation is in CI | Validate real records and compatibility during implementation |
| FA4-012 | Closed | PDA-UX-010 marks customer-account tender deferred and links PDA-UX-027 and the first-slice registry | Future scope requires Finance/Commerce authority and registry change |
| FA4-013 | Closed | PDA-ENG-019 is sole architecture authority; PDA-STR-012 is strategy rationale with explicit deference; engine overview includes Business DNA | Prototype recommendation accuracy evidence |
| FA4-014 | Closed architecturally; Founder decision | Marketplace publisher, review and commercial docs mark tax/payout/settlement Phase 3 only and gate them on FDR-008 plus external review | FDR-008 and legal/tax/provider evidence before paid marketplace |
| FA4-015 | Closed | Root `AGENTS.md` is the agent-neutral contract; `.agents/skills` supplies Codex-compatible governed skills; exemption records conventional root format | Keep AGENTS and CLAUDE authority rules synchronized |
| FA4-016 | Closed honestly; External evidence | TA-016 is reclassified with zero-evidence banner/log; TA-032 exact environment names are propagated; TA-048 partner lifecycle aligns; TA-054 becomes FDR-010 with cash collection disabled | Customer evidence, FDR-010 and other external gates remain open |
| FA4-017 | Closed | Better Auth identity architecture now uses the deny-by-default matrix vocabulary for magic links and phone | New method requires matrix disposition and threat evidence |
| FA4-018 | Closed | Stack calls pgvector an isolated ADR-0024 candidate, not the initial baseline | Admission trigger and prototype evidence |
| FA4-019 | Closed | BullMQ was de-named; a concrete queue library now requires ledger admission and Bun/Node proof | Select only when a qualifying job exists |
| FA4-020 | Closed | Missing section indexes were added; first-slice manifest and Finance domain link the handoff contract | Maintain indexes through document registry checks |
| FA4-021 | Closed for documentation CI | CI installs pinned `jsonschema`; schemas compile; architecture family closure, token references, Markdown endpoints and governed exemptions are enforced | Implementation architecture tests remain future evidence |
| FA4-022 | Closed | Engineering lifecycle/coordination/frontend documents moved to PDA-ENGR-013/014/015; PDA-ENG remains reserved for Business Engines | Generated document registry must remain unique |
| FA4-023 | Closed | PDA-OPS-014 is the canonical repair record; PDA-OPS-017 references it and adds only migration/exit fields | Implement repair tooling and independent-review workflow |
| FA4-024 | Closed | Ranking, retrieval, platform primitive and UX search docs mutually reference distinct evaluation scopes | Execute shared relevance and leakage datasets |
| FA4-025 | Closed | PDA-UX-024 explicitly governs the platform company website and disclaims tenant Marketing Domain ownership | Implementation/content review |
| FA4-026 | Closed | ADR-0023 change log includes v0.2.0 | None beyond proposed evaluation gates |
| FA4-027 | Recorded and propagated | Better Auth successor/prerelease note and Bun Linux-only cluster constraint are in the matrix, PDA-APP-017 and PDA-ENGR-013 | Reverify at implementation lock; historical PDA-APP-002 retains its true 2026-07-10 evidence date |
| FA4-028 | Recorded note | Preference override is legitimate, explicit and now based on corrected arithmetic | Prototype evidence and ADR review |
| FA4-029 | Recorded rationale migration | AMB-003’s old NestJS/Fastify preference is superseded by ADR-0020’s controlled Bun/Hono/oRPC experiment with Node and NestJS/Fastify fallbacks | Revisit only from prototype evidence |
| FA4-030 | Closed | CLAUDE.md and AGENTS.md gate Bun/Hono/oRPC, workflow-runtime and documentation-platform matrices as mandatory lookups | Maintain parity between agent contracts |
| FA4-031 | Closed for current material edit | ADR-0017/0018/0019 now carry Review Record and Change Log sections | Older untouched ADRs follow their existing template until material edit |
| FA4-032 | Recorded; ratification required | No lifecycle promotion was fabricated; Draft Constitution and Proposed ADR state is called out here and in readiness language | Ratification waves with review evidence |
| FA4-033 | Closed architecturally | Finance schema control totals now include unit-preserving inventory quantities and provisional valuation minor units | Accountant and inventory prototype validation |
| FA4-034 | Closed | Marketing website, status page and interactive analytics explicitly disclaim first-slice expansion | Normal scope-change process for future admission |

## Corrections to Third-Audit Closure Claims

| Prior finding | Corrected disposition |
|---|---|
| TA-016 | External evidence. The repository now states zero interviews/observations/willingness-to-pay/design partners and treats the beachhead as a hypothesis. |
| TA-032 | Closed after propagating the exact canonical environment names into deployment and test-data documents. |
| TA-048 | Closed after aligning Partner Handbook lifecycle terms to the Commercial authority; paraphrased operating health signals remain non-authoritative. |
| TA-054 | Founder decision. Tenant cash controls are architectural; Platform Subscription cash collection remains disabled pending FDR-010. |

The prior README/FDR claim is corrected by the current README references. The historical 2026-07-10 Better Auth appendix is not date-bumped because doing so would falsify its evidence date; PDA-APP-017 records current evidence. No first-slice fiscalization mutation endpoint exists, so no fiscalization permission exemption is implied: any future operation must enter OpenAPI, the endpoint manifest and permission catalog together.

## Documentation Structure Decision

The numbered root directories remain the governed architecture plane because registries, links, audit evidence and authority ordering depend on those paths. Product/user/developer documentation remains the Fumadocs content plane under `apps/docs/content/docs`. Implementation-only notes move to top-level `docs/implementation/`; `docs/README.md` explains the planes. This is a bounded migration, not a duplicate architecture tree.

## Residual Gates

- FDR-001 through FDR-010 as recorded
- Constitution and ADR ratification with review evidence
- Customer discovery and design-partner evidence
- Qualified Guyana legal, tax, accounting, privacy, banking and regulatory review
- Provider contracts, sandbox access and certification
- Executable domain, contract, isolation, ledger, offline, accessibility, performance and recovery tests
- Penetration testing and security-control evidence
- Backup, recovery, incident, migration, provider and offline exercises

## Maintainer Readiness Position

After deterministic registry generation, full documentation validation, Meridian CI, and independent verification at the final head, Technical Prototypes 1–3 may continue. This disposition does not authorize pilot or production.
