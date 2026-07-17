---
document_id: PDA-RDM-004
title: Technical Prototype Plan
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Technical Prototype Plan

## Purpose

Define the sequence, evidence, exit criteria, and non-goals for controlled prototypes before first-slice implementation.

## Cross-Cutting Runtime and Contract Track

Technical Prototypes 1–3 use the Proposed ADR-0020 Bun/Hono/oRPC path. Each records exact stack and image versions, runs portable critical suites on Bun and Node, checks the oRPC/OpenAPI surface against `openapi/first-slice-v1.yaml`, and exercises telemetry, health, graceful shutdown, failure handling, and rollback. A successful scaffold is not an exit criterion.

## Prototype 1 — Identity and Tenant Context

Prove Better Auth, sessions, 2FA or passkey seam, tenant selection, Party link, permissions, entitlements, audit, and session revocation.

## Prototype 2 — Catalog and Inventory Ledger

Prove product search, stock ledger, balances, adjustments, counts, idempotency, tenant isolation, and event publication.

**Current result:** a controlled-prototype closeout candidate is recorded in PDA-IMPL-007. PR1-PR6 are merged after exact-head independent concurrence; PR7 contains the registry-derived 14-capability/182-cell executable evidence matrix, live PostgreSQL and browser evidence, and explicit scale/accessibility/security deferrals. Prototype 2 is not closed by this draft statement: PR7 exact-head concurrence, merge, exact-`main` verification, and the separate whole-WS2 audit remain required. The result does not make this plan implementation-ready, authorize a pilot or production deployment, close RR-007/RR-009, or resolve founder/external gates.

## Prototype 3 — POS Cash Workflow

Prove register open, cash sale, receipt numbering, inventory movement, cash close, variance, and accountant handoff.

## Prototype 4 — Stored Value

Prove issue, load, reserve, redeem, release, reverse, refund, offline allowance, fraud limits, and Finance reconciliation.

## Prototype 5 — Offline Sync

Prove device enrollment, SQLite storage, offline lease, numbering range, queued sale, conflict handling, privacy tombstone, revocation, and resynchronization after restore.

## Prototype 6 — Provider Adapter

Prove one wallet or payment simulator with request-to-pay, delayed result, duplicate webhook, uncertain state, refund seam, and reconciliation.

## Prototype 7 — Recovery and Operations

Prove point-in-time restore, deletion-journal reapplication, outbox recovery, search rebuild, tenant-isolation checks, and incident communication.

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

Proceed to implementation-ready specifications only when the core boundaries are proven, critical findings are dispositioned, founder gates are resolved, and the prototype results do not invalidate the selected architecture.
