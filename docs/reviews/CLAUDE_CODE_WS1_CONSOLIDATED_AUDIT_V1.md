# Independent Audit — WS1 Controlled-Prototype Implementation (PR #54)

**Reviewer:** Claude Code

**Audit date:** 2026-07-14

**Merged commit:** `8f9d93f5d5f80b9c11a8a5c30b956bdac638a284`

**Verification:** Working tree clean; Documentation Governance and Meridian Prototype checks green on the exact commit; findings independently re-derived from code, tests, registries, and fresh test runs rather than accepted from PDA-IMPL-005 or PR #54.

This audit fulfils RR-011, which ADR-0007, ADR-0027, and ADR-0028 named as the pending consolidated independent Claude Code review of the exact merged WS1 PR1–PR9 state.

## 1. Severity-ranked findings

### P0 — none

No security defect, broken tenant-isolation boundary, fabricated test result, or non-functional core mechanism was found. Authentication/Party separation, active-context revalidation, deny-by-default authorization, permission/entitlement independence, tenant-scoped persistence, redaction, outbox atomicity, cross-owner boundaries, and runtime-neutral packages were independently re-verified.

### P1-1 — Revocation-to-Audit proof used a fabricated event

- `apps/server/composition/audit-session.integration.test.ts` called `ingestEvent` with a hand-constructed event rather than the event persisted by the preceding session-revocation command.
- `evidence/first-slice/ws1-capability-evidence.json` credited the test with `events_jobs_and_projections` and `audit_and_observability` coverage that the disconnected proof did not fully establish.
- Impact: both halves worked independently, but the claimed end-to-end evidence chain was incomplete and under-disclosed.
- Closure condition: select the real `platform_event_outbox` row written by `revoke()` and ingest that fact, or disclose the gap and narrow the evidence credit.

### P2-1 — Standalone WS1 evidence checker did not validate source markers

`scripts/check_ws1_evidence.py` validated the generated registry but did not open cited source files or verify declared marker strings. `scripts/generate_registries.py` did that work earlier in CI, so exposure was mitigated by ordering rather than by the named standalone gate.

### P2-2 — Reauthentication action missed the 40px target

`apps/web/src/components/query-state.tsx` used the default link-button height for the reauthentication call to action while sibling controls used `min-h-10`. This contradicted PDA-IMPL-005's recorded 40-pixel control-height evidence.

### P2-3 — `CurrentIdentity.partyId` was never populated

The current-identity contract correctly allowed a nullable Party ID, but the production call path never resolved a `PlatformIdentityLink`; linked users therefore received `partyId: null` from `GET /v1/me`.

### P2-4 — Tooling connection allowance was hidden in the checker

`scripts/check_architecture.py` excluded the entire Tooling family from `DATABASE_URL` detection in Python source rather than carrying the narrow validated-environment-schema allowance in the governed executable rule source.

### P2-5 — Node evidence was piecewise, not one composed WS1 request

The Node lane separately proved pure WS1 core behavior, PostgreSQL persistence, and a static server health endpoint, but did not issue one authenticated WS1 operation through the composed Hono/oRPC transport under Node.

### P3-1 — Entitlement-read permission placement was inconsistent

`GET /v1/entitlements` enforced permission in the application layer, unlike other WS1 endpoints that also enforce at the transport boundary. Deny-by-default behavior was correct, but the inconsistency made router-only review unreliable.

### P3-2 — Client-side navigation did not restore main-content focus

The shell provided a skip link and focusable `#main-content`, but no route-change focus manager moved keyboard/screen-reader focus after SPA navigation.

### P3-3 — PR9 program status was stale

`docs/project/PROGRAM_STATUS.md` still said “complete pending merge gate” after PR #54 had merged.

### P3-4 — Constitution citation used the wrong ID

PDA-IMPL-005 cited the Constitution as `PDA-FND-001`; its canonical ID is `PDA-FND-002`.

## 2. Verified residual risks and deferrals

The following were accurately scoped and are not defects in the WS1 controlled prototype:

- RR-006: the transactional outbox proves write atomicity but has no delivery worker, retry/dead-letter policy, delivery observability, or consumer idempotency.
- RR-007: production PostgreSQL RLS topology remains deferred; current prototype isolation uses tenant keys, constraints, scoped repositories, application checks, and tests.
- RR-008: production OTP/provider evidence remains blocked by FDR-007.
- RR-009: independent assistive-technology conformance, penetration testing, and production-content review remain open.
- RR-010: Party merge, richer identifiers/relationships, duplicate resolution, privacy-request execution, and global/shared identity remain beyond WS1 depth.
- Founder, legal, customer, provider, operational, pilot, production, Constitution-ratification, and ADR-lifecycle gates remain open.
- The single AI-reviewer pattern is transparently disclosed and is not equivalent to human specialist or production acceptance.

## 3. Concurrence decision

**WS1 may remain closed at controlled-prototype depth, conditional on an explicit P1-1 disposition.** No finding reopens WS1 as a whole.

**RR-011 may close with this report and a formal maintainer disposition.** P1-1 and the five P2 findings require tracked remediation; the four P3 findings may be fixed opportunistically or recorded as accepted-minor.

**No architectural, functional, or code-quality finding blocks WS2.** Broad WS2 code still requires its own governed implementation-control document before implementation begins.

## Evidence-integrity note

This file is a repository-normalized transcription of the final independent audit section delivered by Claude Code; conversational progress messages were not copied. Its severity, findings, residual-risk conclusions, and concurrence decision are retained without maintainer correction. Maintainer agreement, remediation, and closure are recorded separately in PDA-REV-012 and do not alter this report.
