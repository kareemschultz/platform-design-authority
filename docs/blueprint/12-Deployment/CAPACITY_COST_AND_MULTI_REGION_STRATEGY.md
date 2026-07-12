---
document_id: PDA-DEP-013
title: Capacity Cost and Multi Region Strategy
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Capacity, Cost, and Multi-Region Strategy

## Purpose

Define workload sizing, performance isolation, cost governance, regional expansion, failover, and scaling triggers.

## First-Slice Capacity Envelope

The provisional workload envelope is governed by `docs/blueprint/17-Roadmap/FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md` and includes pilot-scale tenants, stores, registers, products, sales, inventory ledger entries, stored-value instruments, webhook delivery, and offline queues.

Capacity testing must cover:

- Ordinary representative tenant
- Largest provisional pilot tenant
- Fifty concurrent representative tenants
- One noisy-neighbor tenant at ten times ordinary load
- Provider outage and queue backlog
- Restore and projection rebuild
- Long-disconnected offline devices

## Reference Topology

### Prototype and Initial Pilot

- One authoritative application and PostgreSQL write region
- Multi-availability-zone database and application deployment where the selected cloud supports it
- Encrypted object storage with versioning and cross-region backup where legally and commercially appropriate
- Redis or Valkey for bounded cache, rate, and queue functions
- Search as a rebuildable projection
- Separate isolated recovery environment
- Edge CDN and DNS for static and safe cacheable content
- External providers treated as regional dependencies with explicit outage behavior

### Region Selection

The exact cloud region is not selected by this document. Before pilot, benchmark candidate regions against:

- Measured latency from Guyana and expected Caribbean users
- PostgreSQL and managed-service availability
- Data-residency and transfer obligations
- Provider peering and egress
- Disaster-recovery pairing
- Cost and support
- Customer contracting entity

The architecture must not claim a “Guyana region” or Caribbean residency when the selected provider does not operate one.

### Failover Mode

Initial mode:

- Single authoritative write region
- Warm or restorable recovery region
- No active-active financial writes
- DNS or traffic-manager controlled failover
- Manual incident-command approval
- Payment, stored-value, inventory, outbox, privacy, and webhook reconciliation before declaring recovery complete

A later hot-standby or multi-region read model requires measured need and a new decision.

## Scaling Rules

- Scale stateless application tiers horizontally.
- Protect databases with indexing, connection management, bounded transactions, workload isolation, and measured partitioning.
- Separate services only when ownership, reliability, deployment, or scale evidence justifies extraction.
- Use quotas, rate limits, work queues, and backpressure to protect shared infrastructure.
- Preserve tenant-level cost and noisy-neighbor visibility.
- Isolate long-running exports, reports, AI work, imports, and rebuilds from POS-critical workloads.

## Capacity Signals and Triggers

| Signal | Review trigger |
|---|---|
| Application CPU or memory | Sustained 60% p75 or repeated saturation |
| PostgreSQL CPU | Sustained 60% plus latency or queue growth |
| Database connection use | 70% of safe pool |
| Storage growth | Forecast reaches 70% of provisioned threshold within 90 days |
| Queue oldest age | Exceeds workflow deadline or 50% of retry horizon |
| Search indexing lag | Exceeds freshness objective for 15 minutes |
| POS p95 processing | Exceeds provisional budget for three consecutive windows |
| Noisy-neighbor tenant | Consumes more than 20% of shared critical-workload capacity |
| Restore estimate | Exceeds RTO objective |

Triggers start analysis; they do not force a particular scaling technique.

## Cost Model

Track monthly and unit cost for:

- Application compute
- PostgreSQL compute, storage, backup, and I/O
- Cache and queue infrastructure
- Object storage and retrieval
- Search and vector projections
- Messaging and durable workflow
- Observability ingestion and retention
- Network egress and CDN
- Backup and recovery environments
- Provider fees
- AI usage
- Security tooling
- Support and operational labor

## Unit-Cost Worksheet

At minimum calculate:

- Cost per active tenant
- Cost per store
- Cost per register
- Cost per 1,000 completed sales
- Cost per million sale lines
- Cost per million inventory ledger entries
- Cost per 10,000 webhook deliveries
- Cost per GB-month of files and backups
- Cost per full restore exercise
- Cost per AI workflow where AI is enabled

Each unit cost records included infrastructure, workload period, region, tenant mix, and support allocation.

## Cost Guardrails

- Critical cost increases above 20% require explanation and review.
- A new managed service requires a build/buy/partner assessment and exit path.
- Idle dedicated and recovery resources are measured separately.
- Premium provider features are not included in plan economics until contractually verified.
- Self-hosted cost claims include customer operation and support burden, not infrastructure alone.

## Multi-Region Promotion Gates

Before adding an active secondary region:

1. Document the customer, legal, latency, or resilience need.
2. Define authoritative-write ownership.
3. Prove tenant routing and isolation.
4. Define conflict and reconciliation behavior.
5. Validate provider availability in both regions.
6. Rehearse failover and failback.
7. Measure cost increase.
8. Review data residency and privacy.
9. Update recovery objectives and customer terms.

## Quality Gates

- Load, soak, and noisy-neighbor tests
- Cost forecast and measured variance
- Capacity alarms tied to runbooks
- Region-latency benchmark
- Failover and failback exercise
- Provider-region dependency map
- Data-residency review
- Recovery and financial reconciliation
- Unit-cost worksheet
- Decision evidence before multi-region complexity
