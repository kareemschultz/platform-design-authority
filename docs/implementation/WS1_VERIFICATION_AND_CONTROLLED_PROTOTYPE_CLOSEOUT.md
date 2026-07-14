---
document_id: PDA-IMPL-005
title: WS1 Verification and Controlled-Prototype Closeout
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
related_adrs: [ADR-0002, ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0016, ADR-0020, ADR-0027, ADR-0028]
---

# WS1 Verification and Controlled-Prototype Closeout

## 1. Decision and authority

WS1 is complete at the controlled-prototype depth governed by PDA-RDM-007 and PDA-RDM-008. This conclusion is limited to the implementation and evidence recorded here. It does not accept a Proposed ADR, approve a Draft specification, close FA4-032, ratify FDR-004, or claim pilot or production readiness. The authority order in `AGENTS.md`, the Constitution (PDA-FND-002), and the recorded ADR lifecycle remain unchanged.

The closeout covers the following first-slice capabilities: `party.records`, `platform.administration`, `platform.audit`, `platform.authentication`, `platform.authorization`, `platform.entitlements`, `platform.events`, `platform.identity`, `platform.organizations`, `platform.tenancy`, and `security.tenant-isolation`. `platform.administration` and `security.tenant-isolation` are included because WS1 implements and exercises them; this is not a scope expansion because both were already registered in PDA-RDM-003 and `registry/first-slice.json`.

## 2. Machine-readable evidence result

`evidence/first-slice/ws1-capability-evidence.json` is the reviewed evidence source consumed by `scripts/generate_registries.py`. The generated `registry/first-slice-tests.json` records:

- 11 of 103 first-slice capabilities with controlled-prototype evidence;
- 143 of 1,294 required capability-dimension cells with linked evidence;
- all 13 dimensions for each of the 11 WS1 capabilities;
- no blocking defect on an evidenced WS1 row; and
- exact evidence identifiers, paths, commands, and runtimes rather than prose-only completion claims.

`scripts/check_ws1_evidence.py` independently opens the WS1 evidence source and cited files. It fails if the capability set drifts, a declared source marker is absent, a capability/dimension declaration is invalid, a required cell lacks evidence, an evidence path disappears, a blocking defect is introduced, generated catalog propagation drifts, or an AI runtime dependency appears in an essential WS1 application/platform/domain path. Registry generation applies the same marker discipline as part of full first-slice propagation. Generated registries remain derived indexes and do not outrank their sources.

## 3. Verification by dimension

| Dimension | Principal evidence | Controlled-prototype conclusion |
|---|---|---|
| Happy path | contract, core, router, PostgreSQL, shell, and Node checks | Identity, context, Party, role, entitlement, session, and audit paths execute through published contracts. |
| Validation and denial | contract parity, security, authorization, router, and integration tests | Invalid input, missing authentication, wrong scope, missing permission, unavailable entitlement, and blocked native authority routes fail closed. |
| Tenant isolation | tenancy, Party, authorization, entitlement, audit, and PostgreSQL tests | Tenant predicates, composite ownership, active context, role scope, entitlement scope, and audit queries deny cross-tenant access. |
| Permission and entitlement | authorization/entitlement core, router, PostgreSQL, and shell tests | Permission and provisioning decisions remain separate; UI visibility is not authority. |
| Idempotency and duplicates | tenancy, Party, session, audit, event, and PostgreSQL tests | Command receipts and transactional state-plus-outbox behavior prevent duplicate authoritative effects. |
| Concurrency and conflict | Party optimistic concurrency, current-state authorization, session and PostgreSQL tests | Stale version, assignment, membership, entitlement, and session facts do not silently authorize or overwrite current state. |
| Events, jobs, projections | event schemas, outbox atomicity, replay and real-outbox Audit ingestion tests | WS1 proves canonical event schemas, the minimum transactional outbox, and consumption of the exact committed session-revocation fact into Audit; delivery infrastructure is explicitly deferred. |
| Audit and observability | Audit core and PostgreSQL integration | Consequential access/security facts are append-oriented, tenant-scoped where required, correlated, redacted, chained, and query-audited. |
| Privacy and classification | event, Party, Audit, architecture, and persistence tests | Restricted values are allowlisted/redacted and tenant/global scope is explicit. |
| Offline and degraded | core fail-closed behavior, router/shell states, and AI-independent gate | Current authority requires connectivity; cached display cannot become authority; essential WS1 workflows do not depend on AI. |
| Accessibility and responsive | PDA-UX-038, shell tests, and the PR9 browser review below | The real shell has governed landmarks, names, focus, errors, modal behavior, responsive transformation, and narrow-screen reflow at prototype depth. |
| Performance and capacity | PostgreSQL suites, 40-sample revocation measurements, build and browser inspection | Session invalidation is far inside the 60-second p95 budget; no production capacity claim is made. |
| Recovery, replay, reconciliation | migration, state-plus-outbox rollback/repeat, idempotency, audit-chain, and Node checks | Owner migrations, transaction rollback, retry, replay, and current-state revalidation are executable. |

The detailed per-capability mapping is intentionally generated rather than duplicated in this document.

## 4. Session-revocation measurement

The PostgreSQL 18.4 integration suite uses 40 independent samples for database-current revocation and another 40 independent Better Auth sessions exercised through the real Hono/oRPC OpenAPI `GET /v1/me` boundary. The HTTP client first receives 200, revocation commits through the Identity application and owner transaction, and the next independently resolved request must receive 401.

The 2026-07-14 local controlled run recorded:

| Measurement | Samples | p50 | p95 | Maximum | Budget |
|---|---:|---:|---:|---:|---:|
| Revocation transaction plus current database absence | 40 | 118.020 ms | 131.891 ms | 133.108 ms | 60,000 ms p95 |
| Commit-to-protected-HTTP rejection | 40 | 2.857 ms | 7.779 ms | 9.529 ms | 60,000 ms p95 |

The committed test asserts ordering, sample count, and the 60-second p95 ceiling without relying on these particular workstation values. This is prototype evidence, not a distributed-region or production SLO result.

## 5. Formal prototype accessibility review

Target: WCAG 2.2 AA-aligned controlled prototype under PDA-UX-001, PDA-UX-038, and the governed design-token/interaction specifications. Workflows reviewed: login validation, authenticated Administration overview, desktop/mobile primary navigation, Administration subnavigation, theme menu, context/status regions, and narrow-screen transformation.

### Corrected findings

| Finding | Severity | Principle / criterion | Correction and verification |
|---|---:|---|---|
| Link-styled actions used Base UI button semantics | High | 1.3.1, 4.1.2; native semantics | Navigation actions now render native Next links with owned `buttonVariants`; the accessibility tree exposes links and the browser console is clean. |
| Session-dependent login rendering caused hydration replacement | High | 3.2.2, 4.1.3; predictable rendering | Login/signup forms no longer gate their stable form markup on a duplicate client session query; a fresh render has no hydration warning. |
| Administration subnavigation widened the document at 320 CSS pixels | High | 1.4.10 Reflow | The root grid and main track now use `min-w-0`; the document remains 320 pixels wide while only the labelled subnavigation scrolls horizontally. |
| Invalid submission removed focus when the submit button became disabled | High | 3.3.1, 3.3.3; focus management | Invalid login/signup submissions focus the first invalid labelled input; `aria-invalid`, `aria-describedby`, and live alert messages identify the errors. |
| Motion policy was stated but not executable | Medium | 2.3.3; reduced motion | The owned UI global stylesheet collapses animation/transition duration and disables smooth scrolling under `prefers-reduced-motion: reduce`. |

### Verified behavior

- one banner and one main landmark, labelled primary/Administration navigation, one level-one heading, and labelled status regions;
- the skip control transfers focus to `main-content`;
- client-side pathname changes transfer focus to `main-content` without disturbing initial page load;
- the mobile Sheet is a labelled dialog, focuses its first navigation link, exposes 48-pixel navigation targets, and restores focus to its trigger when closed;
- desktop and mobile navigation use native links and expose current-state semantics where applicable;
- labelled email/password fields use the correct autocomplete semantics and announce validation errors;
- no horizontal document overflow at 390 or 320 CSS pixels; the 320-pixel test is the WCAG reflow proxy for 400% zoom at a 1280-pixel baseline;
- visible shell controls meet or exceed the governed general target and the documented 40-pixel form/control height; mobile Sheet navigation uses 48 pixels;
- light muted text resolves to neutral Lab L 48.496 on L 100 (approximately 4.74:1), and dark muted text to L 66.128 on L 2.754 (approximately 7.6:1); and
- the corrected login and authenticated shell produced no browser warning or error.

This review is not a declaration of full product WCAG conformance. Formal screen-reader testing with multiple assistive technologies, text-only zoom, native VoiceOver/TalkBack, production content, and an independent qualified accessibility audit remain pilot/production gates.

## 6. Runtime, architecture, and contract evidence

- Bun 1.3.14 runs the complete workspace suites and PostgreSQL integrations.
- Node 24 runs persistence plus a WS1 critical check covering contract metadata, native Better Auth route blocking, authorization current-state denial, entitlement scope, tenancy invalidation, Audit disposition behavior, and one authenticated Hono/oRPC `GET /v1/me` request through the production app with a real Better Auth/PostgreSQL session, tenant context, Party record, and resolved identity link.
- PostgreSQL 18.4 applies each owner migration stream in deterministic order and proves clean/repeat/recovery and state-plus-outbox atomicity.
- OpenAPI operation/authority metadata, permission mappings, generated contracts, event schemas, and architecture boundaries are freshness-checked.
- Concrete binding remains in `apps/server/composition`; Party consumes injected published contracts and does not import Tenancy implementation or another owner's persistence.
- Better Auth owns authentication/session mechanics only. Platform Tenancy, Party, Authorization, Entitlements, and Audit retain their governed ownership.

## 7. Explicit residual risks and deferrals

WS1 closeout does not conceal or close the following:

1. The transactional outbox is durable, but publication workers, retry/backoff, dead-letter handling, delivery observability, consumer idempotency, ordering, and projection rebuild arrive in a later workstream.
2. PostgreSQL row-level security remains deferred until production role topology and operational evidence exist; current prototype isolation uses schema constraints, scoped repositories, application checks, and two-tenant tests.
3. Production OTP delivery/provider evidence remains blocked by FDR-007.
4. Party merge, rich identifiers/addresses/relationships, duplicate resolution, privacy-request execution, and global/shared identity remain outside WS1 prototype depth.
5. Factor enrollment/recovery screens and native implementation remain outside the thin WS1 shell.
6. Production penetration testing, independent accessibility conformance, qualified Guyana legal/regulatory review, customer evidence, provider certification, backup/failover exercises, and pilot operations remain open.
7. The Constitution and affected ADRs/specifications retain their current Draft/Proposed lifecycle. Implementation evidence informs later review; it does not self-ratify them.

## 8. Exit-gate disposition

PDA-RDM-008 G1-G7 and the PR1-PR9 implementation sequence are complete for the named controlled prototype. Canonical contracts, owner separation, current authority, permission/entitlement independence, revocation, privacy-safe Audit evidence, minimum outbox atomicity, real shell behavior, Bun/Node critical paths, generated evidence links, and repository gates are executable.

WS2 implementation may begin only under its own governed implementation-control document and the still-applicable authority/dependency gates.

## 9. RR-011 post-closeout audit

Claude Code independently audited the exact PR1-PR9 merge at `8f9d93f5d5f80b9c11a8a5c30b956bdac638a284`. PDA-REV-011 registers 0 P0, 1 P1, 5 P2, and 4 P3 findings and concurs that WS1 may remain closed at controlled-prototype depth after explicit P1 disposition. PDA-REV-012 accepts every actionable finding and records issue #56's executable remediation: real revocation-outbox-to-Audit ingestion, standalone source-marker verification, Party-linked current identity, source-derived architecture allowances, a composed Node request, transport-layer entitlement authorization, touch-target and route-focus regressions, and document corrections.

The audit does not reopen WS1 as a whole. RR-011 closes only when the remediation PR is exact-head green and merged. RR-006 through RR-010 and every pilot/production/lifecycle gate in §7 remain open.

## Change log

- 2026-07-14 — v0.2.0 registered and dispositioned the consolidated RR-011 audit, corrected the Constitution ID, and linked the accepted remediation evidence without promoting lifecycle.
- 2026-07-14 — v0.1.0 recorded the original PR9 controlled-prototype closeout.
