# Fable 5 Fourth Audit V1 — Full Repository Independent Audit

Governance note: this report intentionally carries no YAML front matter, following the immutable-evidence pattern established by `reviews/FABLE5_THIRD_AUDIT_REGISTRATION.md`. Registration (document id assignment plus registry regeneration) is a separate maintainer commit.

## 1. Audit Metadata

- **Repository:** kareemschultz/platform-design-authority
- **Branch:** `docs/initial-blueprint` (draft PR #1)
- **Audited SHA:** `394adba9b6a44c52da433fbe9c71bf28e618c1e0` — verified equal to the expected starting head; `8a02b36` (previous verification checkpoint) confirmed a direct ancestor
- **Date:** 2026-07-12
- **Reviewer/model:** Fable 5 (Claude Code), independent audit mode — six parallel adversarial review passes plus direct mechanical verification by the synthesizer
- **Audit mode:** INDEPENDENT AUDIT ONLY. No authoritative file was modified. No prior audit evidence was altered. Only this report was created.
- **Commands executed:** `python scripts/generate_registries.py --check` (PASS, deterministic on Windows), `python scripts/validate_docs.py` (PASS); `.github/workflows/docs-governance.yml` inspected — it runs exactly those two commands plus artifact upload, with `permissions: contents: read` (strictly read-only); both safe commands reproduced locally. Additional independent parsing: all 13 registry JSON files, all 11 JSON Schemas, `openapi/first-slice-v1.yaml` (PyYAML), repo-wide identifier sweeps.
- **Prior unfinished audit:** the focused final-remediation verification (TA-001–060 challenge at `8a02b36`) was interrupted by session limits; per this audit's charter it was finished *inside* this audit rather than duplicated — its results appear in §7 and its completed mechanical verification (OpenAPI 82/82 parity, mutation-tested CI detection, seam-honesty labeling, depth semantics) is carried forward as ancestor evidence and re-checked where inputs changed.

## 2. Executive Conclusion

**Readiness: Technical Prototypes 1–3 may proceed.** Severity counts: **0 BLOCKER, 0 CRITICAL, 3 HIGH, 13 MEDIUM, 10 LOW, 8 NOTE.**

This is the first audit of this repository in four cycles with **zero blocker and zero critical findings**. The doctrine layer held under adversarial sweep: no Constitution contradictions, no conflicting ADRs, no duplicate ownership among past offenders, all 12 tenant-isolation surfaces covered, all 197 events / 94 permissions / 497 capabilities resolving to registered namespaces, the ADR-0017 `payment.*` migration verified complete to the last string, and the ADR-0020 stack pivot executed with contract authority explicitly preserved. The previous audit's 60 findings re-verified at this head: 56 dispositions accurate, 4 overclaimed, **0 regressed** — including no regression from the five newest commits.

**Strongest parts:** ADR discipline and amendment propagation (ADR-0004/0005/0006 genuinely amended, not contradicted); the Better Auth plugin deny-by-default matrix and threat model; the dated-evidence appendix regime (the 2026-07-12 appendices already carry the current oRPC identity, correct `@base-ui/react` package, and pg_durable's preview status — this audit's independent web verification largely *confirmed* rather than corrected them); machine-readable governance with mutation-proven CI; honest readiness language repo-wide (zero unsupported implemented/certified claims found).

**Greatest remaining risks:** (1) the three HIGH findings are all "remediation that overstates itself" — a false registry claim inside a dated evidence appendix (chart palette), a false completeness claim (ten-flow diagrams missing the highest-abuse-risk flow), and contract-surface leakage back into markdown that CI cannot see (finance-handoff endpoints); (2) the machine layer added this cycle (architecture-rules, design-tokens, first-slice-tests, AI schemas) is structurally present but semantically thinner than its prose — the same registry-versus-doc divergence class the third audit flagged, one generation later; (3) all 24 ADRs and the Constitution remain Draft/Proposed, so the authority order's top two tiers are empty and every conflict is resolvable only by explicit deference statements — making the propagation findings below more consequential than they would be in a ratified repo.

## 3. Coverage Matrix

| Area | Coverage | Result | Evidence gaps |
|---|---|---|---|
| Foundation/Constitution/glossary/naming/governance | Constitution full read; targeted re-reads | Clean (no contradictions found) | Constitution itself Draft (FA4-032 NOTE) |
| Platform kernel + shared services | Identity/auth/Party/entitlement/tenancy/plugin-matrix full read; others prior-audit + targeted | Clean except FA4-017 | — |
| Architecture + all 24 ADRs | All 8 new ADRs + 0004/0005/0006 full; all matrices full; others headers+targeted | FA4-004..007, 018 | — |
| Business engines + domains | Overview, DNA (both), Payment, cash-affected domains full; others prior-audit | FA4-013 | — |
| Industry/jurisdiction packs | Tax pack + Guyana profile full | Clean | Statutory verification still external |
| AI architecture | Registry-schemas doc + schema full; others prior-audit + targeted | FA4-011 | Eval fixtures still unbuilt (declared) |
| Developer Platform / APIs / webhooks / extensions | Full read of new docs; OpenAPI parsed independently | FA4-003 | — |
| Marketplace | All 3 docs + phasing full | FA4-014 | FDR-008 open |
| UX / design system / shadcn / Base UI / charts | shadcn matrix, token values, premium policy full | FA4-001, 009, 012 | Storybook/baselines unbuilt (declared) |
| Data / search / analytics | Ranking policy + search relevance full; others targeted | FA4-024 | — |
| Security / privacy / isolation / threat model | Threat model v0.2.0 full; isolation enumeration scripted | Clean — all 12 surfaces covered | Pen-test external |
| Commercial / payment boundaries / partner | Cash boundaries + phasing + billing full | FA4-014 propagation | FDR-001/002/003 open |
| Deployment / self-hosting / recovery / operations | New ops docs full read | FA4-023 | Exercises unexecuted (declared) |
| Engineering / stack / lifecycle ledger | Ledger + worktree + recipes + dependency rules full | FA4-005, 006, 008, 019, 022 | — |
| Testing + first-slice tests | Test matrix + registry parsed | FA4-010 | Harnesses unbuilt (declared) |
| Roadmap / first-slice / prototypes | Manifest, budgets, prototype plan full | FA4-002 | — |
| OpenAPI + JSON Schemas | 100% parsed; refs/consts/params verified | FA4-003, 011 | Semantic lint pre-implementation (declared) |
| Registries (13 files) | 100% parsed + cross-verified | FA4-008, 009, 010, 021 | — |
| Workflows + scripts | Full read + executed + prior mutation-test evidence | FA4-021 | — |
| Indexes / contributor docs | Scripted README-coverage check | FA4-015 (AGENTS.md), 020 | — |
| Prior reviews/dispositions | All read; 60 findings re-verified | FA4-026 (4 downgrades) | — |
| Better Auth / shadcn research artifacts (07-12) | All six dated appendices read + independently re-verified on the live web | FA4-027 NOTE refresh items | — |

Inventory at head: 348 tracked files; 298 governed documents (274 Draft, 24 Proposed; 2 with review_evidence); 497 capabilities; 197 events; 94 permissions; first-slice 40 full / 48 prototype / 15 seam + 13 deferred with reasons; 24 ADRs; 12 skills; 6 dated 2026-07-12 verification appendices.

## 4. Findings Summary Table

| ID | Sev | Title |
|---|---|---|
| FA4-001 | HIGH | Governed chart palette claimed to live in `registry/design-tokens.json` does not exist there — including a false claim in a dated evidence appendix |
| FA4-002 | HIGH | Support-impersonation diagram missing; sequence-diagram doc's "ten load-bearing flows" claim is false |
| FA4-003 | HIGH | Finance-handoff contract declares endpoints and a review permission absent from OpenAPI/manifest/catalog; markdown-declared endpoints invisible to parity CI |
| FA4-004 | MEDIUM | Bun/Hono/oRPC decision-matrix weighted totals arithmetically wrong in all three columns; published tie fabricated |
| FA4-005 | MEDIUM | ADR-0020 runtime-neutrality prohibitions not propagated into ARCHITECTURE_DEPENDENCY_RULES / architecture-rules.json |
| FA4-006 | MEDIUM | ADR-0018 (OpenTofu) has no lifecycle-ledger row, no dated verification appendix, no cross-links |
| FA4-007 | MEDIUM | ADR-0006 declares zero related ADRs; amended ADRs 0004/0005/0006 carry no change logs |
| FA4-008 | MEDIUM | architecture-rules.json references undefined family `platform-clients`; grants looser than doc; three doc prohibitions unmirrored |
| FA4-009 | MEDIUM | design-tokens.json ↔ token doc drift: `radius.medium`/`screen.medium` vs `md`; typography/elevation/z-index absent from registry; `$description` promised, never used |
| FA4-010 | MEDIUM | first-slice-tests generator hardcodes all 13 dimensions "required" for all 103 capabilities including seams; doc's not-applicable/deferred-by-depth vocabulary inexpressible |
| FA4-011 | MEDIUM | AI registry JSON Schema contradicts its doc's required fields and `additionalProperties: false` makes them unrecordable |
| FA4-012 | MEDIUM | Superseded customer-account tender line still stands unannotated in FIRST_SLICE_UX_AND_ACCESSIBILITY.md (TA-023 residue) |
| FA4-013 | MEDIUM | Two live Business DNA Engine specs with no cross-reference; engines overview omits Business DNA from its catalog |
| FA4-014 | MEDIUM | Marketplace architecture/publisher-lifecycle docs present tax/payout setup unconditionally, without the Phase-3 gate |
| FA4-015 | MEDIUM | AGENTS.md does not exist despite being a named audit prerequisite and the standard Codex handoff contract |
| FA4-016 | MEDIUM | Four third-audit dispositions overclaimed: TA-016, TA-032, TA-048, TA-054 (see §7) |
| FA4-017 | LOW | Identity doc "supported foundations may include… magic links, phone" softens the deny-by-default matrix |
| FA4-018 | LOW | Stack doc §AI Platform "pgvector as the initial vector option" bypasses ADR-0024's isolated-prototype admission framing |
| FA4-019 | LOW | BullMQ recommended for early jobs with no lifecycle-ledger row and no Bun-compatibility disposition |
| FA4-020 | LOW | 8 sections lack README indexes; FIRST_SLICE_FINANCE_HANDOFF_CONTRACT has zero inbound references from governed docs |
| FA4-021 | LOW | CI validates only existence of the new machine artifacts (schemas never compiled; architecture-rules/design-tokens content unchecked); governance-exemptions.json is decorative and mismatches the hardcoded skip set |
| FA4-022 | LOW | PDA-ENG-* id series now spans Business Engines (001–019) and Engineering (020–022) alongside PDA-ENGR-* |
| FA4-023 | LOW | Two uncross-referenced data-repair requirement lists that can drift (Operations doc vs migration/exit template) |
| FA4-024 | LOW | Search ranking authority split: SEARCH_AND_COMMAND_RANKING_POLICY unreferenced by the three sibling search docs; two evaluation frameworks for one surface |
| FA4-025 | LOW | MARKETING_WEBSITE_ARCHITECTURE does not disambiguate the platform company's site from the tenant Marketing Domain, and reuses its ownership vocabulary |
| FA4-026 | LOW | ADR-0023 frontmatter 0.2.0 with changelog ending at 0.1.0 |
| FA4-027 | NOTE | Better Auth appendix refresh items: MCP plugin officially slated for deprecation in favor of OAuth Provider; v1.7.0-rc.1 live; Bun `node:cluster` load-balancing is Linux-only (record in ledger for ADR-0020 jobs proof) |
| FA4-028 | NOTE | Bun/Hono matrix outcome overrides its own ranking on disclosed founder preference — legitimate and bounded, but currently resting on wrong arithmetic (with FA4-004) |
| FA4-029 | NOTE | AMB-003's first-audit closure rationale (NestJS/Fastify preference) is superseded by ADR-0020; next disposition should record the rationale migration |
| FA4-030 | NOTE | CLAUDE.md §4 gates three of the six decision matrices as mandatory lookups; Bun/Hono, workflow-runtime, and documentation matrices are ungated |
| FA4-031 | NOTE | ADR template drift: 0017–0019 lack Options/Review Record/Change Log sections that 0020–0024 carry |
| FA4-032 | NOTE | All 24 ADRs Proposed and Constitution Draft — authority tiers 1–2 empty; every conflict is Draft-vs-Draft (ratification waves already planned) |
| FA4-033 | NOTE | finance-handoff-v1.schema.json `controlTotals` lacks the inventory quantity/valuation fields the contract doc requires per batch |
| FA4-034 | NOTE | Marketing website, status page, and interactive analytics L3–L5 carry no first-slice-boundary declaration (no registry expansion occurred — verified) |

## 5. Full Findings

### FA4-001 — HIGH — Chart palette falsely claimed to exist in the token registry
**Status:** Open. **Governing authority:** `09-UX/DESIGN_TOKENS_AND_VISUAL_SYSTEM.md` (raw-color prohibition), CLAUDE.md §4 mandatory lookups, dated-evidence appendix regime.
**Affected:** `09-UX/DESIGN_TOKEN_VALUES_AND_BREAKPOINTS.md` §Chart Palette (~L211: "The exact hexadecimal values are maintained in `registry/design-tokens.json`"); `09-UX/SHADCN_CONFIGURATION_DECISION_MATRIX.md` L28, L93–95 ("the governed eight-role chart palette replaces the generated seed"); `19-Appendices/SHADCN_CONFIGURATION_VERIFICATION-2026-07-12.md` §Color and Chart Findings (asserts the palette exists as observed fact); `registry/design-tokens.json` (groups: space, radius, motion, screen, size, color — zero `chart.*` tokens).
**Evidence:** grep for `chart` in the registry returns nothing; three governed documents, one of them a dated evidence appendix, assert otherwise.
**Failure scenario:** A chart implementer follows the mandatory lookup, finds no palette, and either keeps the generated shadcn Blue seed (which the matrix forbids) or invents raw hex values (which the token doc forbids) — and the appendix regime's core guarantee (dated statements about the repo are true) is broken.
**Scope:** cross-document. **Remediation:** add `color.chart.*` categorical-1..8 plus sequential/diverging scales with provisional values and contrast notes to the registry and PDA-UX-023, or amend all three docs to say "pending" and append a dated correction note to the appendix (do not rewrite evidence). **Propagation:** PDA-UX-028, PDA-UX-023, PDA-APP-018, DASHBOARD_AND_DATA_VISUALIZATION, INTERACTIVE_ANALYTICS_AND_VISUALIZATION; regenerate registries. **Tests/validation:** CI parity check that every doc-referenced token group exists in the registry (with FA4-021). **External evidence:** none. **Decision dependency:** none. **Closure:** chart tokens exist and resolve, or no doc claims they do and the appendix carries a correction. **Prior finding:** TA-027 closure residue; TA-050 class.

### FA4-002 — HIGH — Support-impersonation diagram missing; ten-flow claim false
**Status:** Open. **Governing authority:** `02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md` §First-Slice Diagram Deliverables (self-imposed implementation-review gate).
**Affected:** `02-Architecture/FIRST_SLICE_SEQUENCE_DIAGRAMS.md` (Purpose L14; diagrams 1–10); the flows doc's deliverables list (~L314–325).
**Evidence:** The deliverables list names ten flows including "Support impersonation" and asks for sequence *and data-flow* diagrams. The diagrams doc reaches ten only by splitting "Cash and electronic sale" into two; support impersonation has no diagram; no data-flow diagrams exist.
**Failure scenario:** Implementation review treats the gate as satisfied; the highest-privilege, highest-abuse-risk flow (time-boxed elevated access, tenant-visible audit, auto-expiry) is implemented without the required trust-boundary analysis.
**Scope:** local with review-gate impact. **Remediation:** add diagram 11 (impersonation request→approval→time-boxed session→tenant-visible audit→expiry) or record a dated deferral in the deliverables list; correct the Purpose sentence; decide whether data-flow diagrams remain promised. **Propagation:** flows doc, 17-Roadmap README. **Tests:** review checklist maps deliverables 1:1. **Closure:** every deliverable maps to a diagram or recorded deferral. **Prior finding:** TA-025 closure residue.

### FA4-003 — HIGH — Finance-handoff endpoints escape the governed contract surface
**Status:** Open. **Governing authority:** CLAUDE.md §10 Contract Discipline; `scripts/validate_docs.py::validate_openapi_endpoint_parity`.
**Affected:** `04-Business-Domains/FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md` §API Contracts (L136–145) and §Acceptance and Feedback (L123–134); `openapi/first-slice-v1.yaml`; `registry/endpoint-permissions.json`; `01-Platform/FIRST_SLICE_PERMISSION_CATALOG.md`; `registry/permissions.json`.
**Evidence:** The contract declares `GET /v1/finance-handoff/posting-batches/{batchId}` and `POST /v1/finance-handoff/posting-batches/{batchId}/review` — present in none of the machine artifacts; the mutating accountant review workflow (accept/reject/request correction) has no permission (`permissions.json` holds only `finance.posting-batch.read`). CI compares OpenAPI↔manifest only; markdown-declared endpoints are invisible to it.
**Failure scenario:** The verified 82/82 parity silently stops being the whole declared surface; scenario-10 implementers invent the batch-detail and review operations and their permission outside the governed catalog — precisely the drift class the 8a02b36 parity commit was built to prevent, recurring one layer up.
**Scope:** cross-document. **Remediation:** either add both operations + `finance.posting-batch.review` to OpenAPI, endpoint-permissions, catalog, and permissions registry, or strike them from the contract and defer the acceptance workflow; extend validate_docs.py to extract backticked `METHOD /v1/...` declarations from governed markdown and assert OpenAPI membership. **Propagation:** FIRST_SLICE_API_AND_EVENT_CONTRACTS.md L159. **Tests:** the new markdown-endpoint lint, mutation-tested. **Closure:** every endpoint string in governed markdown resolves to an OpenAPI operation with a cataloged permission, mechanically. **Prior finding:** TA-003/TA-004 closure residue.

### FA4-004 — MEDIUM — Decision-matrix arithmetic wrong (Bun/Hono/oRPC)
`02-Architecture/BUN_HONO_ORPC_DECISION_MATRIX.md` L22–35 publishes weighted totals **405/450/405**; recomputation from the stated weights and scores yields **400/435/395** — no published total is correct and the Bun-vs-NestJS tie is fabricated. Failure: the ADR-0020 ratification gate cites irreproducible numbers, inviting challenge to every other matrix (whose arithmetic this audit verified correct). Remediation: correct totals or publish per-cell arithmetic; keep the disclosed preference-override sentence (see FA4-028). Closure: totals reproduce. Scope: local. Prior: AMB-003 lineage.

### FA4-005 — MEDIUM — ADR-0020 runtime rules not machine-propagated
ADR-0020 requires domain/application/contract/authorization packages to avoid Bun globals, Hono contexts, oRPC transport objects, and DB adapters, "enforced by architecture tests" — but `14-Engineering/ARCHITECTURE_DEPENDENCY_RULES.md` (related_adrs: 0002, 0003 only) and `registry/architecture-rules.json` contain no Bun/Hono/oRPC/runtime entries. Failure: a prototype passes every documented architecture test while killing the Node-fallback guarantee. Remediation: add prohibited-import entries + two architecture-test bullets; add ADR-0020 to related_adrs; regenerate. Closure: greps hit normative prohibitions in both artifacts. Prior: TA-050 class.

### FA4-006 — MEDIUM — ADR-0018 evidence and propagation hole
OpenTofu is selected (ADR-0018) yet has no `TECHNOLOGY_LIFECYCLE_AND_LESSONS.md` register row, no dated verification appendix, empty `related_adrs`, and zero mention in the stack doc's Infrastructure section — the only 07-11/07-12 technology decision without ledger evidence, while its own text mandates CLI version pinning. Verified externally this audit: OpenTofu 1.12.3 current, Linux Foundation, registry ~3,900 providers (opentofu.org, github.com/opentofu/opentofu/releases, accessed 2026-07-12) — available for the appendix. Closure: ledger row + dated appendix + cross-links exist. Prior: TA-033 closure residue.

### FA4-007 — MEDIUM — Amendment traceability: ADR-0006 unlinked, no change logs on amended ADRs
ADR-0006 v0.2.0 (amended 2026-07-12) declares no related ADRs (ADR-0020 links to it, not back); ADR-0004 v0.5.0 / 0005 / 0006 carry no Change Log or amendment notes, so what changed is discoverable only via git. Failure: the natural identity-work entry point never reveals the runtime constraints or the amendment history — "old decision reads as current," in metadata form. Remediation: bidirectional related_adrs; retrofit one-line dated amendment records. Closure: links symmetric; amendments visible in-document. Prior: TA-053 class.

### FA4-008 — MEDIUM — architecture-rules.json: dangling family, loose grants, missing prohibitions
`applications.may_depend_on` includes undefined family `platform-clients`; JSON grants whole-family `domains→engines/platform` where the doc restricts to *contracts*; three doc prohibitions (Better Auth tables from domains; AI prompt/tool packages importing repositories; cloud-specific infra from domains) have no machine patterns. Mitigated by the doc's declared normative precedence until code exists. Remediation: define or remove `platform-clients`; add the three patterns; note contract-granularity; validator asserts family-id closure (with FA4-021). Closure: all ids resolve; doc prohibitions ⊆ machine patterns or recorded deltas. Prior: TA-035 closure residue.

### FA4-009 — MEDIUM — Token registry is a partial mirror of the token doc
`radius.medium`/`screen.medium` (doc) vs `radius.md`/`screen.md` (registry); typography (9 roles), elevation, z-index, density values absent from the registry despite the doc's "represented machine-readably" claim; `$description` promised, unused. Failure: codegen consumers and doc-following authors diverge silently. Remediation: align names (registry `md` form is conventional); add missing groups or scope the doc's claim; CI doc↔registry token parity (with FA4-021). Closure: every doc token resolves or is marked doc-only. Prior: TA-027 residue.

### FA4-010 — MEDIUM — Test-matrix registry cannot express its own model
`16-Testing/FIRST_SLICE_CAPABILITY_TEST_MATRIX.md` L36 defines per-dimension values required / not-applicable (with reason) / deferred-by-depth; `generate_registries.py::build_first_slice_tests_registry` hardcodes `required` ×13 for all 103 capabilities — so 15 seam capabilities formally require accessibility and performance evidence for contracts + test doubles. Failure: teams ignore the registry and "required" stops meaning anything — gate decoration where the third audit demanded teeth. Remediation: dimension-override source (capability-metadata) consumed by the generator; CI asserts seam capabilities carry reviewed profiles. Closure: registry vocabulary matches the doc. Prior: TA-026 residue.

### FA4-011 — MEDIUM — AI registry schema forbids its own doc's required fields
`schemas/ai/registry-records-v1.schema.json` with `additionalProperties: false` omits doc-required fields (Model: cost/latency profile, retirement, incident contact; Tool: data classification, rate/time/cost limits, incident disablement; Agent: tenant availability, approval and compensation policy); release-state enum spelling diverges (camelCase vs spaced). Failure: the first real record either fails validation when doc-compliant or ships without mandatory governance data. Remediation: add properties or rewrite doc field lists; align enums; declare which artifact wins. Closure: doc fields ⊆ schema; required sets match. Prior: new (batch artifact).

### FA4-012 — MEDIUM — Superseded tender line unannotated (TA-023 residue)
`09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md` L138 still lists "Customer account, when entitled" as a first-slice tender with no marker, while `FIRST_SLICE_TENDER_SCOPE_CLARIFICATION.md` supersedes it and `first-slice.json` machine-defers `commerce.customer-account-sales`. One-line fix; closure: no governed doc lists the tender without the deferral marker.

### FA4-013 — MEDIUM — Business DNA: two live specs and an incomplete catalog
(a) `03-Business-Engines/BUSINESS_DNA_ENGINE.md` (PDA-ENG-019) and `20-Strategy/BUSINESS_DNA_ENGINE.md` (PDA-STR-012) both carry Draft architecture/rules/dimensions with zero cross-references and *divergent dimension lists* — the authority order cannot break a Draft-vs-Draft tie. (b) `BUSINESS_ENGINES_OVERVIEW.md` (17 engines) omits Business DNA while PLATFORM_MANIFEST lists 18 and `engine.business-dna` is registered — violating the overview's own rule 7 linkage. Failure: two divergent DNA schemas get built; the TA-047 "no architectural home" ambiguity reopens. Remediation: PDA-ENG-019 sole authority; PDA-STR-012 rewritten as deferring strategy rationale or marked Superseded; add DNA to the overview list; unique titles in documents.json. Closure: one authoritative spec; catalog matches manifest and registry. Prior: TA-047 residue.

### FA4-014 — MEDIUM — Marketplace payout surface not phase-gated at point of use
`MARKETPLACE_ARCHITECTURE.md` L38 presents "tax and payout setup" as an unconditional publisher-lifecycle step and §Settlement/commercial models without gates; `PUBLISHER_REVIEW_AND_EXTENSION_LIFECYCLE.md` L18 likewise — while `MARKETPLACE_COMMERCIAL_PHASING.md` Phases 0–2 prohibit exactly that and FDR-008 holds the decision. Only the section README links the phasing doc. Failure: a team scoping publisher onboarding from the architecture doc builds tax-form collection and payout accounts, creating the payfac/tax obligations the phasing exists to avoid, while complying with the doc they were handed. Remediation: mark the lifecycle steps "Phase 3 only, gated by MARKETPLACE_COMMERCIAL_PHASING.md and FDR-008" in both docs; mirror the gate in `13-Commercial/PARTNER_RESELLER_AND_MARKETPLACE_MODEL.md` L49. Closure: every payout/settlement mention names the gate. Prior: TA-049 family; FDR-008 dependency (founder).

### FA4-015 — MEDIUM — AGENTS.md missing
The audit charter requires reading `AGENTS.md`; the file does not exist at head (only a skill-internal `agents/openai.yaml`). The repo's own coordination expectations (CLAUDE.md §11.6, WORKTREE_CHANGE_AND_RELEASE_COORDINATION) anticipate multi-agent handoff, and the announced next step is Codex dispositioning this report — Codex's standard contract file is AGENTS.md. Failure: a non-Claude agent lands in the repo with no binding instructions and misses the authority order, deny-by-default rules, and registry regeneration discipline. Remediation: create AGENTS.md (mirroring CLAUDE.md's normative content, agent-neutral), or explicitly record in the governance exemptions that CLAUDE.md is the single cross-agent contract and update external prompts accordingly. Closure: the file exists or the exemption is recorded and prompts corrected. Decision dependency: founder tooling choice. Prior: cross-check 21 (new).

### FA4-016 — MEDIUM — Four third-audit dispositions overclaimed
Verified in §7: **TA-016** (beachhead evidence reframe never applied — strategy doc still asserts advantages present-tense; no evidence log or status banner; no post-audit commits to either strategy file), **TA-032** (canonical environment table exists but DEPLOYMENT_REFERENCE_ARCHITECTURE uses non-canonical "development" and TEST_DATA_ENVIRONMENTS uses variants, both without referencing the table that mandates exact names), **TA-048** (authority declared, but Partner handbook claims "uses the same lifecycle terms" while listing 12 stages against the spec's 10 — an active contradiction; CS health list still a paraphrase), **TA-054** (tenant-side cash/agent controls real; the ADR-0015-mandated platform-SaaS cash receivables policy remains an undefined, untracked forward reference in two docs). Plus evidence inaccuracies not changing classifications: the disposition's "README cites FDR IDs" claim is false; Better Auth appendix front matter still `verified_as_of: 2026-07-10`; fiscalization permission exemption unrecorded. Remediation: correct the four in the FA4 disposition; perform the four small documentation actions. Closure: each item's original closure criterion met or honestly reclassified.

### FA4-017 to FA4-026 — LOW (abridged; full detail in agent evidence above)
- **FA4-017:** `BETTER_AUTH_IDENTITY_ARCHITECTURE.md` L54 lists magic links/phone as available foundations; the plugin matrix defers both with named risks (email-channel takeover; SIM-swap). Rewrite with matrix vocabulary.
- **FA4-018:** `RECOMMENDED_TECHNOLOGY_STACK.md` L311 "pgvector … initial vector option" vs its own L120 and ADR-0024 (isolated prototype behind admission trigger). Reword to "candidate, admitted only under ADR-0024."
- **FA4-019:** BullMQ named in the jobs path (stack L137) with no ledger row and no Bun-compatibility disposition — the exact ledger-bypass the ledger exists to prevent. Register or de-name.
- **FA4-020:** Sections 00–05, 13, 18 lack README indexes; `FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md` has zero inbound governed references (manifest §Finance Handoff never links it). Add indexes; link from manifest and Finance domain.
- **FA4-021:** validate_docs checks existence only for the new machine artifacts: schemas are `json.load`-ed, never compiled as JSON Schema; architecture-rules family closure and token parity unchecked; `governance-exemptions.json` is consumed by no code and mismatches the hardcoded skip set (three reviews/ prompt files lack front matter with neither exemption nor failure). Add schema compilation, closure assertions, and exemption enforcement.
- **FA4-022:** PDA-ENG-020/021/022 landed in 14-Engineering next to PDA-ENGR-*; the next engine spec will collide by pattern. Renumber to PDA-ENGR-013/014/015 or write the allocation rule into DOCUMENT_GOVERNANCE.
- **FA4-023:** Data-repair control lists in PROBLEM_CHANGE_RELEASE (11 items, independent reviewer) and TENANT_MIGRATION_EXIT (15 items, no independent reviewer) neither reference each other; make one canonical.
- **FA4-024:** `SEARCH_AND_COMMAND_RANKING_POLICY.md` referenced by no sibling search doc; two evaluation frameworks (precision/recall vs MRR/top-k) for one surface. Add scope statement + mutual references.
- **FA4-025:** Marketing-website doc governs the platform company's own site but never says so, reusing tenant Marketing Domain ownership vocabulary. One boundary paragraph.
- **FA4-026:** ADR-0023 frontmatter 0.2.0, changelog ends at 0.1.0 (ADR-0022 shows the correct pattern). Add the row.

### FA4-027 to FA4-034 — NOTE (abridged)
- **FA4-027:** Dated-appendix refresh items from this audit's live verification (all accessed 2026-07-12): Better Auth MCP plugin's own docs say it "will soon be deprecated in favor of the OAuth Provider Plugin" (the matrix's Defer row should name the successor); v1.7.0-rc.1 published; Bun `node:cluster` cannot pass handles between workers so HTTP load-balancing across processes is Linux-only (record in ledger — relevant to ADR-0020's jobs/deployment proofs); pricing figures remain point-in-time. Everything else in the six 07-12 appendices independently re-verified accurate — including the current oRPC identity (orpc.dev / middleapi, v1.14.8), correct `@base-ui/react` naming, shadcn's July 2026 Base UI default, and pg_durable's preview v0.2.3 status.
- **FA4-028:** The Bun preference override in the matrix is explicit, reasoned, and bounded by dual-runtime gates — legitimate once FA4-004's arithmetic is fixed.
- **FA4-029:** Record AMB-003's closure-rationale migration (NestJS preference → ADR-0020) in the FA4 disposition.
- **FA4-030:** Add the three ungated decision matrices to CLAUDE.md §4 mandatory lookups.
- **FA4-031:** Retrofit Review Record/Change Log sections to ADR-0017–0019 at next material edit.
- **FA4-032:** Authority tiers 1–2 are empty (all Proposed/Draft); ratification waves already planned — keep explicit deference statements until then.
- **FA4-033:** `finance-handoff-v1.schema.json` controlTotals lacks the doc-required inventory quantity/valuation fields (extension possible; undefined).
- **FA4-034:** Marketing website, status page, and analytics L3–L5 docs should each carry the one-sentence slice-boundary declaration the phasing and finance docs already model (verified: no quiet registry expansion occurred).

## 6. Cross-Cutting Contradiction and Propagation Matrix

| Axis | Verdict |
|---|---|
| Constitution vs newest docs (15 articles × 10 newest docs) | **Clean** — including billing-state-not-authorization and permission/entitlement separation |
| ADR pairwise conflicts (24 ADRs) | **Clean** — 0004/0005/0006 properly amended; only traceability gaps (FA4-007) |
| Duplicate ownership — past offenders (statutory, stored value, webhooks, comments, risk) | **Clean** — all still single-owner |
| Duplicate ownership — new docs | Business DNA dual-spec (FA4-013); ranking split (FA4-024); marketing-website vocabulary (FA4-025); data-repair lists (FA4-023) |
| Payment/Commerce/Finance/StoredValue/Loyalty boundaries | **Clean** — cash-boundaries and phasing docs match ADR-0013/0015/0017 exactly; four cash events registered |
| Auth vs Party vs tenancy vs permission vs entitlement | **Clean** — threat model and plugin matrix exemplary; one soft sentence (FA4-017) |
| ADR-0015 forbidden vocabulary (custody/pooling/payfac/MoR) | **Clean** at doctrine level; point-of-use gate missing in marketplace docs (FA4-014) |
| Tenant isolation (12 surfaces) | **All covered** with authoritative statements |
| Identifier namespaces (197 events, 94 permissions, 497 capabilities) | **All resolve**; ADR-0017 migration complete to the last string |
| Decision → machine-rules propagation | ADR-0020→architecture-rules (FA4-005); tokens (FA4-009); test dimensions (FA4-010); AI schema (FA4-011) |
| Decision → prose propagation | ADR-0018 evidence (FA4-006); ADR-0024 wording slip (FA4-018); ADR-0006 links (FA4-007) |

## 7. Previous-Audit Regression Review

All 60 third-audit findings re-verified at `394adba` against `reviews/FABLE5_THIRD_AUDIT_DISPOSITION_V1.md`: **56 Accurate** (many with minor recorded residues), **4 Overclaimed** (TA-016, TA-032, TA-048, TA-054 — detailed in FA4-016), **0 Regressed**, **0 Reintroduced**. The five commits after the previous checkpoint were specifically checked for regression: registries/OpenAPI/scripts byte-stable except source-line renumbering; the ADR-0020 pivot explicitly preserves contract authority ("Canonical OpenAPI and JSON Schemas remain authoritative… generator evaluation-only"), so no contract-family closure reopens; skill governance intact (the new `technology-evidence-maintainer` skill complies). Earlier audit families: SA-001–031 and GAP/AMB dispositions spot-checked where touched by new commits — no regressions; AMB-003 rationale note recorded as FA4-029. Notable durable improvements verified: provisional quality budgets exist and are wired into gates (TA-005), all four governance skills exist (TA-013), the `payment.*` namespace migration is total (TA-018), Business DNA has an engine home (TA-047, minus FA4-013 residue), FDR register now has status lines and two promoted decisions (TA-055).

## 8. Machine-Readable Artifact Review

All 13 registry files and 11 schemas parse; `openapi/first-slice-v1.yaml` parses with 82 operations, unique operationIds, resolving path parameters and refs (including the external `schemas/offline/sync-batch-v1.schema.json`). events.json: 197 events, all source_path files exist, all source_line values accurate ±1, schema_path entries resolve, event-schema `const` names match. endpoint-permissions ↔ OpenAPI: 82/82 with 100% permission/authorization value parity (ancestor evidence: six mutation classes proven detected). first-slice.json: 103 depth-classified + 13 reasoned deferrals; disjointness enforced; capability-metadata dependencies all resolve. Weaknesses: existence-only CI for the new artifacts, uncompiled schemas, dangling `platform-clients`, hardcoded test dimensions, partial token mirror, AI schema/doc contradiction (FA4-003, 008, 009, 010, 011, 021). Registry freshness: PASS; no generated artifact was hand-edited during this audit.

## 9. First-Slice Scope / Readiness Review

Scope is machine-bounded and did not creep: the new batch's surfaces (marketing website, status page, analytics) added no first-slice registry entries (verified), and the tender clarification *narrowed* scope. Contract completeness advanced materially since the third audit (all previously missing endpoint/permission families present; entities complete; diagrams 10/11; budgets numeric). Remaining slice-readiness gaps are exactly FA4-002 (one diagram), FA4-003 (two endpoints + one permission), FA4-010 (test-dimension semantics), FA4-012 (tender annotation), plus the honest external gates (tax verification, provider certification, founder decisions). The prototype plan's 7 prototypes bind to ADR-0020 gates. **Technical Prototypes 1–3 may proceed now**; none of the open findings blocks identity/tenant-context, catalog/inventory-ledger, or POS-cash prototype work, and the runtime pivot is prototype-scoped with a defined Node fallback.

## 10. Technology and External-Evidence Review

Independently verified against primary sources (2026-07-12; details and URLs in FA4-027 and the agent evidence): Bun 1.3.14 (MIT + LGPL-linked WebKit; Windows x64/arm64 supported; node:cluster LB Linux-only; http2 ~95% gRPC-suite), Hono 4.12.29, oRPC v1.14.7/8 at middleapi/orpc with **v2 in public beta** (repo already pins v1 and cites current URLs — appendix accurate; note the v2 transition at ratification), Drizzle 0.45.2 / Kysely 0.29.3 (both 0.x), OpenTofu 1.12.3 (needs the ledger row — FA4-006), Fumadocs 16.11.3 (single-maintainer; Next 16/React 19 peers), Base UI `@base-ui/react` 1.6.0 (repo names it correctly; shadcn made it the first-party **default** in July 2026 — the ADR-0022 direction is now upstream-default, reducing risk), Tailwind 4.3.2, pg_durable v0.2.3 Microsoft **preview** (ADR-0023's evaluate-only stance is exactly right), PostgreSQL 18.4 + pgvector 0.8.5 (minimal-extension posture well-founded), Better Auth 1.6.23 with v1.7.0-rc.1 (MCP plugin officially deprecating toward OAuth Provider; Agent Auth officially unstable — matrix already marks it Labs), Changesets CLI 2.31.0, Recharts 3.9.2 (shadcn charts on Recharts v3). **No blueprint technology claim relies on model knowledge alone** — every material claim traces to a dated appendix, and this audit found those appendices accurate except the chart-palette repo-claim (FA4-001, a claim about the repo, not about a vendor).

## 11. Recommended Remediation Order

- **Wave 0 (blockers/invalid authority):** none — empty for the first time.
- **Wave 1 (security, isolation, financial, ownership):** FA4-014 (marketplace payout gate at point of use), FA4-002 (impersonation diagram), FA4-013 (single DNA authority), FA4-017 (deny-by-default softening).
- **Wave 2 (contracts and first-slice propagation):** FA4-003 (+ markdown-endpoint lint), FA4-001 (chart tokens or corrected claims + appendix correction note), FA4-009, FA4-010, FA4-011, FA4-012, FA4-005, FA4-008.
- **Wave 3 (implementation readiness and evidence):** FA4-006, FA4-007, FA4-016 (four disposition corrections + small doc actions), FA4-019, FA4-021, FA4-015 (AGENTS.md or recorded exemption), FA4-026, FA4-027 appendix refresh items.
- **Wave 4 (clarity/maintenance):** FA4-004 (arithmetic), FA4-018, FA4-020, FA4-022, FA4-023, FA4-024, FA4-025, FA4-028..034 as they fall due.

## 12. Exact Closure Checklist for Codex

1. Add `color.chart.*` tokens (8 categorical + sequential + diverging, provisional values, contrast notes) to `registry/design-tokens.json` and PDA-UX-023 **or** amend PDA-UX-023/PDA-UX-028 to "pending" and append a dated correction to PDA-APP-018; regenerate registries. (FA4-001)
2. Add sequence diagram 11 (support impersonation) or a dated deferral to the deliverables list; correct the diagrams doc Purpose; resolve the data-flow-diagram promise. (FA4-002)
3. Add `GET .../posting-batches/{batchId}` + `POST .../posting-batches/{batchId}/review` + `finance.posting-batch.review` to OpenAPI, endpoint-permissions, permission catalog, permissions registry **or** strike from the contract; extend validate_docs.py with the markdown-endpoint lint; mutation-test it. (FA4-003)
4. Correct BUN_HONO_ORPC matrix totals to 400/435/395 or publish per-cell arithmetic. (FA4-004)
5. Add Bun/Hono/oRPC prohibited-import entries + architecture-test bullets to ARCHITECTURE_DEPENDENCY_RULES + architecture-rules.json; related_adrs += ADR-0020. (FA4-005)
6. OpenTofu: ledger row + dated verification appendix (evidence in §10) + ADR-0018 cross-links + stack-doc mention. (FA4-006)
7. ADR-0006 related_adrs (≥ ADR-0004, ADR-0020); amendment/change-log notes on ADR-0004/0005/0006. (FA4-007)
8. Fix `platform-clients` (define or remove); add three missing forbidden patterns; contract-granularity note; validator family-id closure assertion. (FA4-008)
9. Align `radius.md`/`screen.md` in PDA-UX-023 tables; add or descope typography/elevation/z-index registry groups; token doc↔registry CI parity. (FA4-009)
10. Dimension-override source consumed by build_first_slice_tests_registry; emit not-applicable/deferred-by-depth; seam-profile CI assertion. (FA4-010)
11. Reconcile registry-records schema with the AI registries doc (fields + enum spellings); state precedence. (FA4-011)
12. Annotate FIRST_SLICE_UX_AND_ACCESSIBILITY L138 tender line with the deferral pointer. (FA4-012)
13. Single DNA authority (PDA-ENG-019); rewrite or supersede PDA-STR-012; add Business DNA to BUSINESS_ENGINES_OVERVIEW. (FA4-013)
14. Phase-gate annotations on MARKETPLACE_ARCHITECTURE publisher lifecycle/settlement and PUBLISHER_REVIEW; mirror in PARTNER_RESELLER model. (FA4-014)
15. Create AGENTS.md or record the CLAUDE.md-is-the-contract exemption. (FA4-015)
16. FA4 disposition: correct TA-016/032/048/054 statuses; apply the four small doc actions (beachhead hypothesis reframe + evidence log; env-name fixes in two docs; Partner-handbook lifecycle alignment; receivables-policy FDR entry); note AMB-003 rationale migration (FA4-029); record fiscalization-permission exemption; bump the Better Auth appendix verified_as_of. (FA4-016, FA4-027)
17. LOW/NOTE sweep: FA4-017 wording, FA4-018 wording, FA4-019 BullMQ ledger row or de-name, FA4-020 section READMEs + finance-contract inbound links, FA4-021 schema compilation + exemption enforcement, FA4-022 id renumber or rule, FA4-023 canonical repair record, FA4-024 ranking scope statement, FA4-025 boundary paragraph, FA4-026 changelog row, FA4-030 CLAUDE.md lookups, FA4-031 ADR sections, FA4-033 schema fields, FA4-034 slice-boundary sentences.
18. Regenerate registries; run both validators; confirm CI green; write `reviews/FABLE5_FOURTH_AUDIT_DISPOSITION_V1.md` and a registration record for this report (do not edit this report).

## 13. Residual Founder, Legal, Regulatory, Provider, and Implementation Decisions

Unchanged and honestly recorded: FDR-001 (payment operating model — provisional), FDR-002 (legal entity — critical path), FDR-003 (billing/settlement currency), FDR-004 (first-slice scope ratification), FDR-005 (repository visibility — **still open while the repo is public**), FDR-006 (terminal strategy), FDR-007 (provider coverage beyond MMG), FDR-008 (marketplace paid phase), FDR-009 (premium UI); plus qualified Guyana legal/tax/AML review, MMG sandbox and certification, customer evidence (interviews remain zero — TA-016/FA4-016), penetration and accessibility testing, operational exercises, and all executable implementation. One addition this cycle: the platform-SaaS cash receivables policy required by ADR-0015 §Cash needs an FDR entry (FA4-016/TA-054).

---

## Delivery Statement

- **Report path:** `reviews/FABLE5_FOURTH_AUDIT_V1.md`
- **Audited branch/SHA:** `docs/initial-blueprint` @ `394adba9b6a44c52da433fbe9c71bf28e618c1e0`
- **Finding counts:** 0 BLOCKER / 0 CRITICAL / 3 HIGH / 13 MEDIUM / 10 LOW / 8 NOTE
- **Highest-priority finding IDs:** FA4-001, FA4-002, FA4-003, then FA4-014, FA4-013, FA4-005
- **Validation results:** `generate_registries.py --check` PASS; `validate_docs.py` PASS; workflow read-only confirmed
- **Files changed by this audit:** this report only (audit-only; no authoritative or evidence file touched)
- **Readiness:** Technical Prototypes 1–3 may proceed; vertical-slice implementation review remains gated on Waves 1–2 above; pilot/production remain gated on the §13 external decisions
