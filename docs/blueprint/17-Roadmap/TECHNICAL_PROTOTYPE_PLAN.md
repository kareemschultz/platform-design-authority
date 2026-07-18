---
document_id: PDA-RDM-004
title: Technical Prototype Plan
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
---

# Technical Prototype Plan

## Purpose

Define the sequence, evidence, exit criteria, and non-goals for controlled prototypes before first-slice implementation.

## Cross-Cutting Runtime and Contract Track

Technical Prototypes 1–3 use the Proposed ADR-0020 Bun/Hono/oRPC path. Each records exact stack and image versions, runs portable critical suites on Bun and Node, checks the oRPC/OpenAPI surface against `openapi/first-slice-v1.yaml`, and exercises telemetry, health, graceful shutdown, failure handling, and rollback. A successful scaffold is not an exit criterion.

## Founder Scope and Prototype Entry Authority

FDR-004 was ratified by the Founder on 2026-07-17 through issue #81, comment `5008157609`. The consequence is authority to continue testing the bounded first-slice scope and its registered `full`/`prototype`/`seam` depths and deferrals. It does not promote this Draft plan, validate the market hypothesis, or authorize pilot/production use.

P1–P3 retain the controlled-prototype clearance recorded by the fourth audit. P4–P7 receive general entry clearance only through the **M3 standing-audit charter checkpoint**, after the M3 disposition is recorded against the completed P3 evidence. M3 clearance is not automatic and does not waive a prototype's stricter sequencing, founder-decision, ADR, provider, security, or external-evidence gates.

| Prototype | General clearance | Additional entry conditions |
|---|---|---|
| P3 | Existing FA4 P1–P3 clearance | WS2 controlled-prototype closeout is recorded through P-W2a issue [#90](https://github.com/kareemschultz/platform-design-authority/issues/90); customer discovery [#82](https://github.com/kareemschultz/platform-design-authority/issues/82) satisfies 8 structured interviews plus 3 direct workflow observations across at least 3 businesses with retained real-world evidence; repository disclosure review [#83](https://github.com/kareemschultz/platform-design-authority/issues/83) is complete. |
| P4 | Recorded M3 charter checkpoint | P3 complete; FDR-003 dispositioned before the first schema freeze; ledger target remains a target until measured. |
| P5 | Recorded M3 charter checkpoint | P3 complete; offline device-trust/key-management ADR and device/browser support matrix completed before the first signing-contract freeze. |
| P6 | Recorded M3 charter checkpoint | Provider-neutral preparatory analysis may continue before M3, but P6 implementation entry waits for the checkpoint; real-provider work additionally requires FDR-002/FDR-007 and WSX issues [#84](https://github.com/kareemschultz/platform-design-authority/issues/84) and [#85](https://github.com/kareemschultz/platform-design-authority/issues/85). |
| P7 | Recorded M3 charter checkpoint | Real ledger/outbox baseline exists; final exercises follow P4/P5 and use the selected production-relevant topology. Independent evaluation gates [#86](https://github.com/kareemschultz/platform-design-authority/issues/86) and [#87](https://github.com/kareemschultz/platform-design-authority/issues/87) finish before pilot, not merely before prototype exit. |

## Prototype 1 — Identity and Tenant Context

Prove Better Auth, sessions, 2FA or passkey seam, tenant selection, Party link, permissions, entitlements, audit, and session revocation.

## Prototype 2 — Catalog and Inventory Ledger

Prove product search, stock ledger, balances, adjustments, counts, idempotency, tenant isolation, and event publication.

**Current result:** PDA-IMPL-007 records Prototype 2 complete at controlled-prototype depth with 14/14 WS2 capabilities and 182/182 WS2 required cells. PR #79 exact head `22a3a38369d458d065d5fb2bc2216d09aec410de` merged as `81e903b27bf41785106775afb33f9f88738e39b9` without the required pre-merge concurrence; PDA-REV-013 then independently reviewed that exact merged `main`, and the Founder accepted it as the superseding WS2 review in issue #81. P-W2a issue #90 synchronizes that honest sequence. This result does not make this Draft plan implementation-ready, authorize a pilot or production deployment, close RR-007/RR-009, or resolve customer, disclosure, founder, or other external gates.

## Prototype 3 — POS Cash Workflow

Prove register open, cash sale, receipt numbering, inventory movement, cash close, variance, and accountant handoff.

Entry is blocked until the P3 row above is evidenced. Repository prose, synthetic interviews, or generated observations do not satisfy customer evidence.

## Prototype 4 — Stored Value

Prove issue, load, reserve, redeem, release, reverse, refund, offline allowance, fraud limits, and Finance reconciliation.

Entry requires the recorded M3 charter checkpoint and the P4-specific conditions above.

## Prototype 5 — Offline Sync

Prove device enrollment, SQLite storage, offline lease, numbering range, queued sale, conflict handling, privacy tombstone, revocation, and resynchronization after restore.

Entry requires the recorded M3 charter checkpoint and the P5-specific conditions above.

## Prototype 6 — Provider Adapter

Prove one wallet or payment simulator with request-to-pay, delayed result, duplicate webhook, uncertain state, refund seam, and reconciliation.

Entry requires the recorded M3 charter checkpoint. Simulator results prove adapter behavior only; they do not satisfy provider capability, contracting, sandbox, or certification evidence.

## Prototype 7 — Recovery and Operations

Prove point-in-time restore, deletion-journal reapplication, outbox recovery, search rebuild, tenant-isolation checks, and incident communication.

Entry requires the recorded M3 charter checkpoint and the P7-specific conditions above.

## Evidence

Each prototype records source commit, exact dependency and container versions, official-source verification date, architecture assumptions, Bun and Node compatibility results, test results, performance, cost, security findings, UX findings, unresolved decisions, workarounds, rollback time, and recommendation. Findings update `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`.

## Non-Goals

- Production statutory compliance
- Full storefront
- Full Finance
- Recurring commerce
- Broad AI autonomy
- Payment facilitation
- Every business domain

## Exit Criteria

Proceed to implementation-ready specifications only when the core boundaries are proven, critical findings are dispositioned, all applicable founder and external gates are resolved, and the prototype results do not invalidate the selected architecture. FDR-004 scope ratification satisfies only the scope-selection gate.
