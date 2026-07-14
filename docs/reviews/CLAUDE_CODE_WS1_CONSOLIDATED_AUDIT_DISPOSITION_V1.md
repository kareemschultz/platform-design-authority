---
document_id: PDA-REV-012
title: Claude Code WS1 Consolidated Audit Disposition V1
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-14
review_evidence: docs/reviews/CLAUDE_CODE_WS1_CONSOLIDATED_AUDIT_V1.md
---

# Claude Code WS1 Consolidated Audit Disposition V1

## Purpose

Disposition every finding in PDA-REV-011, preserve the independent report, close accepted repository defects with executable evidence, and separate controlled-prototype closure from residual pilot and production gates.

## Executive position

All ten actionable findings are accepted and remediated in issue #56 / PR #57. WS1 remains closed only at the registered controlled-prototype depth. This disposition closes RR-011 only after PR #57's exact-head CI and merge; it does not close RR-006 through RR-010, promote any Draft or Proposed authority, or authorize pilot, production, or broad WS2 code.

## Finding dispositions

| Finding | Disposition | Remediation evidence | Closure test |
|---|---|---|---|
| P1-1 | Closed | The Audit integration test now revokes a real session, selects the exact committed outbox row by idempotency key, converts that delivery row into the canonical published envelope, ingests it, and asserts source-event ID and payload equality. The evidence marker names this chain. | `bun run db:test`; standalone evidence-source validation |
| P2-1 | Closed | `scripts/check_ws1_evidence.py` now independently loads the WS1 source, verifies schema/workstream identity, capability/dimension declarations, unique evidence IDs, paths, every literal source marker, and catalog propagation. | `bun run ws1:evidence:check` succeeds standalone and reports marker count |
| P2-2 | Closed | The reauthentication link carries `min-h-10`; a unit regression asserts the generated class includes the governed minimum. | `bun test apps/web/src` |
| P2-3 | Closed | Party publishes a tenant/organization/user-scoped active-link query port; its PostgreSQL adapter implements it; composition resolves the current Party after authoritative active-context revalidation and sets both identity and context Party IDs. | Party PostgreSQL isolation assertion plus composed authenticated Node `/v1/me` response with non-null `partyId` |
| P2-4 | Closed | PDA-ENGR-012 now owns a registered-rule-allowance table. Registry generation derives pattern allowances from it; the checker removed the Tooling-family bypass and a negative Tooling fixture proves only the exact environment-schema file is allowed. | `python scripts/check_architecture.py`; `python scripts/test_architecture_checker.py` |
| P2-5 | Closed | The Node critical lane now builds the real Hono/oRPC handler and context, authenticates a request, calls `/v1/me`, and verifies the composed Party-linked response; the same CI command first runs Node PostgreSQL persistence checks. | `bun run --cwd apps/server db:test:node` under the PostgreSQL Docker lane |
| P3-1 | Closed | Entitlement reads now require `platform.entitlement.read` at the router boundary and retain the application-layer check for defense in depth. | Router denial proves no application dispatch |
| P3-2 | Closed | A route-focus manager observes pathname changes and focuses `#main-content`; the initial page load is not disturbed. | Web focus-helper regression plus governed manual/browser evidence retained in PDA-UX-038 |
| P3-3 | Closed | Program status records PR #54 as merged and RR-011 as disposition-in-progress/closed only after merge evidence. | Documentation validation and exact links |
| P3-4 | Closed | PDA-IMPL-005 now cites the Constitution as PDA-FND-002. | Documentation validation |

## Propagation

- PDA-IMPL-005 records this post-closeout audit and remediation without rewriting the original PR9 evidence result.
- ADR-0007 records the Party-link resolution evidence while retaining Proposed status and deeper Party gates.
- ADR-0020 records the composed Node request while retaining production compatibility reviews.
- ADR-0027 records the source-derived architecture-rule allowance while retaining RR-007.
- ADR-0028 records the real revocation-outbox-to-Audit proof while retaining production Architecture, Security, and Privacy review.
- PDA-REV-009 closes RR-011 only against this audit, disposition, issue, PR, exact CI, and merge evidence.
- RR-006 through RR-010 remain open and unchanged in meaning.

## Lifecycle and WS2 boundary

This is controlled-prototype remediation, not production acceptance. WS2 may proceed to its own documentation-only implementation-control plan after RR-011 closure. Broad WS2 implementation remains prohibited until that plan is governed and reviewed under the repository authority order.
