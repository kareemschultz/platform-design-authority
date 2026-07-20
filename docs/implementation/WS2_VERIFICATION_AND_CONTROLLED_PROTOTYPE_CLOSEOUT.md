---
document_id: PDA-IMPL-007
title: WS2 Verification and Controlled-Prototype Closeout
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0016, ADR-0020, ADR-0027]
---

# WS2 Verification and Controlled-Prototype Closeout

## 1. Decision boundary

WS2 implementation and repository-owned evidence are complete at the controlled-prototype depth governed by PDA-RDM-004, PDA-RDM-007, and PDA-RDM-009. The generated matrix records all 14 WS2 capabilities and all 182 required evidence cells; whole-first-slice coverage is 25 of 103 capabilities and 325 of 1,294 required cells.

The actual closeout sequence is retained without rewriting history. PR #79 final head `22a3a38369d458d065d5fb2bc2216d09aec410de` merged as `81e903b27bf41785106775afb33f9f88738e39b9` without the required recorded pre-merge exact-head concurrence. PDA-REV-013 then independently audited that exact merged `main`, reproduced the WS2 evidence, and concurred with the implementation evidence while reporting the process deviation as F-A-001. The Founder accepted PDA-REV-013 as the superseding exact-`main` WS2 review in issue #81, comment `5008157609`; PR #89 merged the decision record as `7de0688d11a80de950f0e0639ade84b23e790e59`. That superseding disposition closes the WS2 controlled-prototype review condition while preserving the missed pre-merge concurrence as a governance deviation.

This Draft records controlled-prototype closeout only. It does not approve a Draft or Proposed source, close RR-007 or RR-009, establish a contractual service level, claim pilot or production readiness, or treat FDR-004's separately recorded ratification as evidence that its customer, legal, provider, security, accessibility, operational, and disclosure gates are satisfied. PR #91 completed the independently reviewed P-W2a tracking synchronization: exact reviewed head `ff9816efa93efff6954708c025c8e8f70260108f` merged as `15417950925b78ad267e54fe6b3550010a46f60d`. That merge records the synchronization without converting any retained external or production gate into a pass.

The registry-derived WS2 set is exactly:

- full depth: `catalog.barcodes`, `catalog.identifiers`, `catalog.products`, `catalog.variants`, `inventory.adjustments`, `inventory.availability`, `inventory.counts`, `inventory.offline-movements`, `inventory.stock-balances`, and `inventory.stock-ledger`;
- prototype depth: `catalog.bulk-import`, `catalog.lifecycle`, `inventory.reservations`, and `inventory.transfers`.

All thirteen PDA-TST-013 dimensions remain required for all fourteen capabilities. Evidence at registered depth is not evidence of production maturity.

## 2. PR and independent-review ledger

| Increment | Exact reviewed head | Merge commit | Independent disposition |
|---|---|---|---|
| Plan | `83ab7a781021dc22460f259925fd80e877eecf0b` | PR #63 `6a30c246915418f5d9752439a9024f6083691280` | Plan concurrence after four remediations; G1 satisfied |
| PR1 contracts/governance/spike | `f4a9dc68b795b11745a78ae0068fde8c84451c19` | PR #65 `9da5ac060721a5ce4654675c42483e75ec560f75` | Exact-head concurrence after architecture-checker remediation |
| PR2 Catalog | `1d99fffa5c59a9c90b821e3a9e07511a5d12c63a` | PR #67 `124613781d3c2b4b61d1e2b7a6eb48515d26cc85` | Exact-head concurrence after lifecycle, CHECK-constraint, and barcode non-disclosure remediation |
| PR3 Inventory | `48a72cd5c75af5aa8c13bc68c7c72a55a0390ae7` | PR #69 `40454740838bba4426b9ca48b2e82811bc7b466d` | Exact-head concurrence after migration-freshness and concurrent offline-command proof |
| PR4 delivery/projections | `8b676bc4df140acf9c0a2a40aa44cb9e94c46e26` | PR #74 `7202fc819b70982c013e1ca11a4fcc136e01e2de` | Exact-head concurrence; PR comment `4991097241`; RR-006 closed at controlled-prototype depth |
| PR5 import/numbering | `7a9e9edbfadfd59ed769d9d780c25fb71bbdb6be` | PR #76 `f7d2a6bbd7ad6df20a08820ba4a65299017b4db5` | Exact-head concurrence; PR comment `4995579814` |
| PR6 web experience | `c69e5fb4415083affc40dc52f2d0ada78846252e` | PR #78 `635fa3f1618d5c880585fdd3e86de7a16d0993ac` | Exact-head concurrence; PR comment `4998183817` |
| PR7 verification/closeout | final PR head `22a3a38369d458d065d5fb2bc2216d09aec410de`; superseding reviewed exact-`main` `81e903b27bf41785106775afb33f9f88738e39b9` | PR #79 `81e903b27bf41785106775afb33f9f88738e39b9` | No pre-merge concurrence was recorded. PDA-REV-013 independently audited the exact merge, reproduced the evidence, and the Founder accepted it in issue #81 as the superseding WS2 review; the deviation remains recorded as F-A-001. |

## 3. Machine-readable matrix

`evidence/first-slice/ws2-capability-evidence.json` is the reviewed WS2 evidence source consumed by `scripts/generate_registries.py`. `scripts/check_ws2_evidence.py` derives the capability set from the live capability registry and fails on membership drift, a missing executable required dimension, absent paths or source markers, undeclared capabilities, unknown dimensions, missing commands/runtimes, generated-registry drift, blocking defects, or an AI runtime dependency anywhere in the runtime workspace closure derived from the `server`, `web`, and `worker` package manifests. Its regression suite proves that transitive workspace packages, including the API client, UI library, authorization, and entitlement packages, cannot escape that scan.

After generation, `registry/first-slice-tests.json` records:

- 14 of 14 WS2 capabilities and 182 of 182 WS2 required cells with linked executable evidence;
- aggregate first-slice coverage of 25 of 103 capabilities and 325 of 1,294 required cells with linked executable evidence;
- all thirteen dimensions required for every WS2 full/prototype row; and
- no blocking defect on an evidenced WS2 row.

An `Evidenced` row means executable evidence exists at registered depth. Open scale, production, external, representative-user, and assistive-technology targets remain named deferrals outside the 182-cell controlled-prototype matrix; prose does not satisfy a required cell and no deferral is counted as a pass.

## 4. G1-G6 disposition

| Gate | Result | Evidence and retained boundary |
|---|---|---|
| G1 independent plan review | Satisfied | PR #63 exact-head concurrence after four accepted/remediated findings |
| G2 contract-first closure | Satisfied | PR #65; 116 OpenAPI operations equal 116 endpoint mappings; 109 registered permissions after PR7 added two internal Reservation application-command authorities; generated contract freshness |
| G3 ledger/Drizzle suitability | Satisfied at controlled-prototype depth | PDA-APP-021 through PDA-APP-022; exact decimal, row locking, immutable reversal, balance rebuild, atomic outbox, migration, and 250k Product query-shape evidence; production scale remains open |
| G4 owner persistence/composition | Satisfied at controlled-prototype depth | ADR-0027 v0.3.5; owner-specific adapters/migrations; literal server/worker roots; no cross-owner persistence import; Import/Export and Numbering exact-head sign-off |
| G5 data/isolation/classification | Satisfied at controlled-prototype depth | PDA-DAT-019; composite ownership, tenant predicates, safe errors, two-tenant owner/job/event/projection/import/numbering proof; RR-007 stays open |
| G6 real event delivery | Satisfied at controlled-prototype depth | PDA-APP-023; PR #74 worker, leases, retry, dead letter, replay, observability, consumer receipts/idempotency, projection rebuild; RR-006 remains closed |

## 5. Contract, schema, and event denominators

The closeout records each denominator rather than using an ambiguous "schema count":

| Surface | Exact generated/current count | Disposition |
|---|---:|---|
| OpenAPI operations | 116 | Equals endpoint-permission entries |
| Endpoint-permission entries | 116 | Zero mapping drift |
| Registered permissions | 109 | Every endpoint permission resolves; `inventory.reservation.create` and `inventory.reservation.release` protect internal commands without creating public endpoints |
| Registered events | 208 | Global registry count; not all belong to WS2 |
| JSON Schema files | 44 | Includes event and non-event schemas |
| Event JSON Schema files | 38 | Includes the shared event envelope |
| Registered events with owner schema references | 37 | TD-006 remains for later workstreams |
| WS2-family registered events | 21 | All 21 have owner schema references |
| Events emitted by WS2 owner code | 19 | All 19 have schema, transactional append, and delivery-path evidence; the two registered future facts are not falsely claimed as emitted |

## 6. Event evidence semantics

The closeout distinguishes states that were previously easy to conflate:

| Evidence term | What proves it |
|---|---|
| Appended | Owner state, receipt, and outbox row commit atomically; an outbox row alone proves no delivery |
| Claimed | A worker acquires the event with a claim token and renewable 30-second lease; ordering blocks overtaking nonterminal earlier rows |
| Consumed | Each registered consumer executes its owner/projection port; source-event identity and owner-command idempotency prevent duplicate effects |
| Consumer receipt | `(consumer_id, event_id, consumer_schema_version)` records ordinary completion; replay adds `replay_request_id` |
| Published | The worker writes `published_at` only after required consumers succeed |
| Delivered | The outbox reaches terminal `delivered` in the same checked transition that records `published_at`; the prototype has one transition but the terms are not used as synonyms for append |
| Retried | A failed attempt persists a safe attempt record and schedules bounded jittered retry without acknowledging delivery |
| Dead-lettered | Twenty attempts or the 24-hour horizon produce minimized tenant-scoped terminal evidence and require governed replay/review |
| Replayed | An authorized bounded replay request reprocesses retained compatible events in committed order with replay-scoped receipts |

The local PR7 sample proves 20/20 append-to-delivery-and-consumption cycles with zero duplicate effects. It does not statistically substantiate the 99.99% retry-horizon reliability target.

## 7. Domain, isolation, and scenario evidence

### Scenario authority

- PDA-TST-013 golden scenario 2 is exercised by corrected Product import and reloadable review/commit evidence.
- PDA-TST-013 golden scenario 8 is exercised by blind Count capture, independent approval/posting, and variance evidence.
- PDA-ARC-015 scenario 8 is demonstrated end to end for Product/opening-stock import through owner commands, Numbering, events, reconciliation, and UI review.
- WS2 proves only the Catalog, Inventory, Numbering, and Event Backbone preconditions/subpath of PDA-ARC-015 scenario 2. The complete Online Cash Sale requires Commerce/POS/Pricing/Tax/Documents and remains WS3. No sale execution is claimed here.

### Two-tenant and integrity result

The retained suites use the PDA-TST-013 Demerara/Essequibo isolation model and directly cover Product/Variant/Identifier/barcode owner state, balances, Counts, Transfers, Reservations, same offline command identity in two tenants, imports, Numbering allocations, event claims/receipts/dead letters/replay, Catalog search projection, Inventory reconciliation projection, safe errors, URLs, active-context invalidation, and UI state.

No WS2 cache implementation exists; therefore there is no cache store to exercise. Query keys are context-bound and cancelled/removed on context change, and the browser test preserves URL/history isolation. A future server cache must add an executable tenant-key test rather than inheriting this disposition.

Inventory facts remain append-only. Adjustment correction uses a linked inverse movement; Transfer dispatch/receipt conserves quantity; blind Count variance posts only after independent approval; balance rebuild reports zero unexplained divergence; duplicate commands, event receipts, replays, and import resumes produce zero duplicate owner effects in the exercised cases. Catalog retains stable child identity, supports Identifierless Variants, validates GTIN check digits, normalizes identifiers without cross-tenant disclosure, and performs lifecycle changes only through explicit preconditioned commands.

Permissions and entitlements remain separate at transport and direct application-command boundaries. The browser proves a non-disclosing permission denial; server/component tests separately prove entitlement-unavailable behavior. UI hiding is never treated as authority.

Offline-origin Inventory commands consume verified lease facts through a deterministic, runtime-neutral port and are idempotent. WS2 does not issue leases, verify signatures/devices, transport batches, reconcile general sync, apply privacy tombstones, or claim end-to-end offline behavior; those remain WS5.

## 8. Quality-budget measurements and open production targets

Environment for the PR7 retained measurements: Bun 1.3.14, Node 24 fallback where declared, PostgreSQL 18 in a loopback Docker container, warm application process, one in-process worker, rebuilt Next.js 16.2.10 web/server images, desktop Chromium and 390-by-844 mobile Chromium. The fixture is synthetic. Samples are sequential unless the named concurrency test says otherwise.

| Signal | Samples and retained result | Target | Disposition / limitation |
|---|---|---:|---|
| Barcode lookup | 30 warm PostgreSQL samples; test retains the p95 threshold assertion | <=300 ms p95 | Pass at controlled-prototype query depth; exact raw percentiles were not retained by the earlier test |
| Product text search | 30 warm PostgreSQL samples; test retains the p95 threshold assertion | <=800 ms p95 | Pass at controlled-prototype query depth; not global Search |
| Count scanner interaction | Desktop n=5 median 86.16 ms, max 92.59 ms; mobile n=5 median 83.32 ms, max 133.14 ms; failures 0 | <=5,000 ms median | Pass for Chromium keyboard-scanner proxy through HTTP, durable rerender, and focus return; no representative-human or external-device claim |
| Adjustment posting | Four n=20 runs: p95 14.904/198.772/31.150/28.851 ms; final rerun p50 18.518 ms, p99/max 29.909 ms; failures 0 | <=750 ms p95 | Pass for service-to-owner transaction; excludes browser/network latency and retains local-run variance rather than selecting only the fastest run |
| Availability visibility | Four n=20 runs: p95 4.692/69.687/8.482/12.836 ms; final rerun p50 3.825 ms, p99/max 33.797 ms; failures 0 | <=5,000 ms p95 | Pass through a fresh post-commit owner read; not an operational SLO sample |
| Count command/read proxy | Final n=12: p50 15.372 ms, p95/p99/max 25.920 ms; failures 0 | <=5,000 ms p95 | Pass for the bounded live command/read diagnostic; not representative-user task time or production capacity |
| Event append through consume/deliver | Four n=20 runs: p95 48.288/48.473/44.511/50.977 ms; final rerun p50 41.099 ms, p99/max 51.550 ms; failures 0 | 99.99% within retry horizon | Latency observed; reliability target remains open because local successes cannot prove 99.99% |
| Catalog search projection visibility | Four n=20 runs: p95 1.771/1.837/1.813/1.996 ms; final rerun p50 0.767 ms, p99/max 2.031 ms; failures 0 | <=60,000 ms p95 | Pass through a fresh SQL read after consumer completion |
| Duplicate business effects | concurrent/retry/replay suites report zero duplicate owner effects | zero | Pass for exercised controlled-prototype cases; not a production probability claim |
| Catalog monthly objective | Functional/query samples only | 99.9% | Open: no month-long denominator or production telemetry; Platform Operations owns pilot evidence |
| Inventory correctness objective | Concurrency/reversal/rebuild suites show zero unexplained divergence | 99.95% | Mechanism pass; percentage remains open without a representative annual denominator |
| 250k products/variants | Indexed 250k Product query-shape spike | representative envelope | Query-shape pass only; not latency/load capacity |
| 2m movements/year | Not run | representative envelope | Open; Data Platform owns production-scale load/retention/partition evidence |
| 50 tenants + 10x noisy neighbor | Not run | representative envelope | Open; Platform Operations/Data Platform own multi-tenant capacity and pooler evidence |

The open rows are explicit deferral records under PDA-RDM-007 DoD item 2 and PDA-RDM-009 section 16.2. They are outside the controlled-prototype matrix, are not converted into passes, and block any pilot/production SLO or scale claim.

## 9. Formal UI-pattern and accessibility review

Target: the WCAG 2.2 AA-aligned controlled prototype under PDA-UX-010, PDA-UX-011, PDA-UX-013, PDA-UX-014, PDA-UX-015, PDA-UX-019, PDA-UX-023, and PDA-APP-025. Workflows: Product import review, blind Count entry/submission, balances, Adjustments, Transfers, URL/history recovery, and denial.

### Pattern verdict

Concur at controlled-prototype depth. The Operations workspace keeps two persistent navigation levels; lists use semantic tables or focused mobile summaries; long tasks use reloadable full pages; destructive/ledger transitions use bounded confirmation dialogs; cursor/filter state is intentional in the URL; context, freshness, reconciliation, permission denial, entitlement absence, stale/offline boundary, and current-authority language remain distinct. No dashboard, wizard, grid, drawer, or animation is introduced without a task need.

### Accessibility findings and remediation

The live PR7 audit found and corrected two High defects:

1. denial/destructive and Sonner description/action colors fell below AA text contrast; owned semantic/descriptive classes now pass automated axe A/AA on both viewports;
2. opaque Count/location/Product identifiers caused mobile document overflow; shared title and identifier surfaces now wrap without losing identity.

The independent WS2 PR7 closeout audit found and corrected two further defects: Sonner's own unlayered `[data-title]` rule still resolved to a ~2.77:1 gray toast title, missed by the description/action-only correction above, since Tailwind's `@layer components` cannot out-rank Sonner's unlayered stylesheet regardless of specificity or `!important`; and Product archival had only pre-emptive offline-gating browser coverage, not a genuinely dropped in-flight request, so a mid-flight-failure scenario was added that aborts the archive request once in flight, asserts fail-closed behavior and unmutated Draft state after reload, then confirms clean recovery to `Archived` on retry.

The rebuilt full Playwright suite passes 22/22. Keyboard, Barcode entry and exact lookup, Product lifecycle offline denial, mid-flight request-failure fail-closed and recovery, focus return, dialog entry/exit, landmarks/headings, semantic forms/tables/lists, error/denial copy, Back/Forward behavior, 390-by-844 reflow, touch-sized controls, reduced-motion inheritance, current context, projection freshness, explicit online-only fail-closed behavior, and automated axe A/AA are covered on the evaluated routes. Light/dark/system tokens and non-color state text remain platform-owned; no tenant-visible codename or premium source appears. The exact elapsed time is retained by the CI/Playwright artifact rather than promoted as a stable performance claim.

This is not WCAG conformance. Manual screen-reader testing across multiple assistive technologies, 400% text-only zoom, forced-colors/representative devices, production content, native VoiceOver/TalkBack, and an independent qualified accessibility review remain RR-009 pilot/production gates.

## 10. Security, privacy, and data review

- Raw CSV, unrestricted Product text, complete request objects, credentials, cookies, headers, tokens, and full event payloads are not copied into Audit or logs.
- Import content is byte/row/column/field bounded, SHA-256 bound, UTF-8/newline/header/quote/control/formula checked, and scanner-gated before owner commands. Unsafe normalized values are not retained.
- Catalog and Inventory facts default Confidential; event/storage fields are classified in PDA-DAT-019. Metrics use safe aggregate labels without tenant or payload cardinality.
- Tenant scope applies to owners, receipts, outbox/delivery state, replay, projections, imports, Numbering, queries, errors, URLs, and client query keys.
- Purge is current-authority, terminal-state, 30-day, idempotent, and audited. Legal-hold/deletion-journal integration and production scheduling remain open.
- RR-007 remains open because application constraints and two-tenant tests do not prove production RLS roles/policies, migration bypass, pooler behavior, or operational monitoring.
- Penetration testing, production secrets/key management, external malware-provider evidence, privacy exercises, and qualified external review remain open.

## 11. Runtime, migration, recovery, and architecture

- Catalog, Inventory, Import/Export, Numbering, and Events cores remain runtime-neutral; no Bun globals, Hono/oRPC transport, database adapters, or environment reads enter those cores.
- Concrete PostgreSQL adapters remain owner-specific and bind only in registered server/worker composition roots. The worker cannot invoke migrations.
- Ten owner migration streams have distinct histories and execute serially; clean/repeat/upgrade/failure/freshness checks remain in CI.
- Bun runs workspace and PostgreSQL critical paths; Node 24 runs the approved persistence, event delivery, and API fallback checks.
- The final branch gate reproduced all 29 workspace test tasks with zero failures, 67 server PostgreSQL tests / 643 expectations, 13 worker PostgreSQL tests / 132 expectations, and 20 desktop/mobile browser cases; server and worker Node fallback checks passed. These are exact branch-run lane results, not a frozen contractual denominator.
- Contract, OpenAPI, endpoint-permission, event, schema, generated-registry, architecture, TypeScript, formatting, build, Docker health, migration, and browser gates are executable.
- The manifest-derived runtime workspace closure for the essential `server`, `web`, and `worker` paths contains no AI runtime dependency and remains deterministic with AI disabled; transitive platform clients, UI, authorization, and entitlement packages are included rather than trusted through a hand-maintained directory list.
- RR-006 stays closed based on real PR4 worker evidence. Backup/PITR, multi-replica failover, production alerting, and full restore exercises remain WS7/production gates.

## 12. PDA-RDM-009 section 16.3 final disposition

| Exit condition | Final controlled-prototype result |
|---|---|
| G1-G6 | Satisfied at controlled-prototype depth; section 4 |
| 14 capabilities x 13 dimensions | 182/182 linked to executable evidence by the generated matrix and independently reproduced by PDA-REV-013 on exact merged `main` |
| Contract/permission/event/schema counts | Exact denominators reconciled; section 5 |
| Emitted event schema/append/delivery/consumer evidence | Satisfied for 19 emitted events; future registered facts are not claimed |
| RR-006 real worker evidence | Closed by PDA-APP-023 / PR #74; revalidated, not re-closed |
| Authorized process/pool topology | ADR-0027 and executable architecture rules satisfied at prototype scope |
| Runtime-neutral cores/owner persistence/composition | Satisfied; architecture checker and probes green |
| Import/Export and Numbering owner sign-off/atomic reference | Satisfied by ADR-0027 v0.3.5 / PR #76 |
| Two-tenant state/jobs/events/projections/imports/errors/UI | Satisfied at implemented depth; no WS2 cache exists, and any future cache requires its own test |
| Append-only/reversal/rebuild | Satisfied with zero unexplained divergence in exercised cases |
| Permission/entitlement separation | Satisfied at transport/application boundaries; browser + server evidence |
| Offline deterministic boundary / WS5 seam | Satisfied without claiming WS5 transport/lease/device behavior |
| Real accessible responsive reloadable UI | Satisfied at controlled-prototype target; RR-009 conformance remains open |
| Bun/Node critical paths | Satisfied by declared lanes and the exact-`main` whole-project audit evidence |
| Evidence/risk/lessons/runbooks/docs/migrations/contracts/gates | PR #79 merged the evidence; PDA-REV-013 reverified it on exact merged `main`; independently reviewed PR #91 merged P-W2a and synchronized the living tracking and risk records |

## 13. Delete discipline and retired assumptions

PR7 removed or retired these stale claims and artifacts:

- PR6 is no longer described as active or unmerged;
- RR-006 is no longer described as open pending PR7;
- ADR-0027 no longer describes Import/Export and Numbering review as pending;
- the obsolete 4-of-197 event-schema debt count is replaced by the generated 37-of-208 fact;
- PDA-RDM-007 no longer assigns the complete Online Cash Sale to WS2;
- obsolete `packages/api`, `packages/auth`, `packages/db`, `packages/env`, and `packages/ui` developer guidance is removed;
- fixed-calendar retention test logic is retired in favor of record-relative UTC boundaries;
- superseded PR6 worktrees and local branches were removed after clean/patch-equivalence verification; and
- generated Playwright reports/test results remain CI artifacts and are not committed.

## 14. Residual gates and next decision

Open after controlled-prototype closeout:

- issue #94 restricted raw-evidence handling, issue #82 real customer evidence, and all remaining founder/legal/customer/provider/regulatory gates; PDA-REV-019 records the issue #83 repository disclosure/redaction review subject to exact-head independent concurrence and merge;
- FDR-005's final repository visibility, licensing, contribution, security-scanning, and third-party-provenance decisions, which remain separate from the completed path review;
- RR-007 production PostgreSQL role/RLS topology and RR-009 accessibility/security conformance;
- 99.9%/99.95%/99.99% operational denominators, 2m movement/year and 50-tenant noisy-neighbor load;
- production retention/legal-hold/deletion-journal integration, malware provider, secrets, SLO/alerting, multi-replica and restore exercises;
- WS5 signing/device/lease/sync/tombstone behavior and WS7 backup/recovery exercises;
- full Online Cash Sale and all Commerce/POS/Pricing/Tax/Documents behavior in WS3;
- pilot/production external assistive-technology, penetration, and qualified review.

PR #79 merged the PR7 evidence, PDA-REV-013 supplied the superseding exact-`main` whole-WS2 review, and the Founder accepted that disposition in issue #81 while retaining the process deviation. Independently reviewed PR #91 merged P-W2a and records WS2 at 100% of its controlled-prototype target, a 17.0% weighted contribution, and the overall program at 42.0%; issues #12 and #73 are closed. PDA-REV-019 records the issue #83 repository disclosure/redaction review subject to exact-head independent concurrence and merge. WS3 remains blocked on issue #94's restricted raw-evidence handling and issue #82's retained real-world customer evidence; the final FDR-005 visibility, licensing, contribution, scanning, and provenance work remains separately open and does not become satisfied by this controlled-prototype closeout.

## Change log

- 2026-07-17 — v0.3.0 recorded the independently reviewed PR #91 P-W2a merge and closure of issues #12 and #73; recorded PDA-REV-019 as the issue #83 disclosure review subject to exact-head concurrence and merge; and replaced the stale WS3 gate statement with issues #94 and #82 while retaining the separate open FDR-005 work.
- 2026-07-17 — v0.2.0 recorded the actual PR #79 history, PDA-REV-013's superseding exact-`main` review, and the Founder disposition in issue #81; finalized the 14/14 capability and 182/182 WS2-cell closeout at controlled-prototype depth; and retained RR-007, RR-009, WS3-entry, external-evidence, pilot, and production gates.
- 2026-07-17 — v0.1.1 closed two findings from the independent WS2 PR7 closeout audit: a Sonner toast-title contrast defect the earlier description/action-only correction missed, and a Product archival mid-flight-request-failure gap where only pre-emptive offline gating had browser coverage. The complete desktop/mobile Playwright lane now reproduces 22/22 cases.
- 2026-07-16 — v0.1.0 recorded the registry-derived closeout candidate, exact PR1-PR6 ledger, PR7 live database/browser measurements, G1-G6 and section 16.3 dispositions, formal pattern/accessibility and security/privacy reviews, explicit production deferrals, and retained independent-review/merge/exact-main/whole-WS2 gates.
