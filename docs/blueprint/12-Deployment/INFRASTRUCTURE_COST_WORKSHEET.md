---
document_id: PDA-DEP-015
title: Infrastructure Cost Worksheet
version: 0.2.1
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-20
---

# Infrastructure Cost Worksheet

## Purpose

Define the worksheet used to estimate and compare prototype, pilot, production, dedicated, recovery, and self-hosted operating costs without inventing provider prices in architecture documents.

## Scenario Header

- Scenario and date
- Provider and region
- Environment class
- Tenant count and mix
- Stores, registers, users, products, transactions, files, jobs, webhooks, and AI usage
- Availability and recovery objectives
- Currency and exchange-rate source
- Pricing source and commitment assumptions

## Monthly Cost Categories

Every unresolved value is an evidence state, not a zero-cost assumption. The accountable owner records the dated source and calculated amount when the decision trigger occurs; totals and unit economics remain `Not calculated` until every included category has a value or a documented exclusion.

| Category | Quantity driver | Evidence required | Accountable owner | Decision trigger | Estimated monthly cost |
|---|---|---|---|---|---|
| Application compute | CPU-hours, memory-hours, instances | Selected-region calculator or provider quote plus measured workload profile | Platform Operations | Hosting provider and pilot topology selected | Unresolved — evidence not yet available |
| PostgreSQL | Compute, storage, I/O, backups, replicas | Selected-region quote plus measured database, retention, and recovery demand | Data Platform | Managed or self-hosted PostgreSQL topology selected | Unresolved — evidence not yet available |
| Cache and queues | Memory, operations, nodes | Architecture decision, capacity model, and selected-region quote | Platform Architecture | Cache or queue service admitted beyond the first-slice seam | Unresolved — evidence not yet available |
| Object storage | GB-month, requests, retrieval, replication | Retention model, workload measurement, and selected-region quote | Platform Operations | File and backup storage provider selected | Unresolved — evidence not yet available |
| Search | Compute, storage, indexing | Search workload model, architecture decision, and selected-region quote | Platform Architecture | Production search implementation admitted | Unresolved — evidence not yet available |
| Messaging/workflow | Nodes, operations, retention | Workflow decision, measured event/job demand, and selected-region quote | Platform Architecture | Production workflow infrastructure admitted | Unresolved — evidence not yet available |
| Observability | GB ingestion and retention | Telemetry volume measurement, retention policy, and vendor or self-hosted cost model | Site Reliability Engineering | Pilot telemetry stack and retention selected | Unresolved — evidence not yet available |
| Network | Egress, CDN, inter-region traffic | Traffic model, topology, and selected-region calculator or quote | Platform Operations | Pilot regions and delivery topology selected | Unresolved — evidence not yet available |
| Backups and recovery | Storage, replication, exercise runtime | Backup inventory, recovery design, exercise measurements, and selected-region quote | Site Reliability Engineering | Pilot recovery design approved and exercised | Unresolved — evidence not yet available |
| Security tooling | Scanning, WAF, secrets, SIEM | Approved security control set and contract or deployment cost model | Security | Pilot security architecture and vendors selected | Unresolved — evidence not yet available |
| Providers | Auth, payments, messaging, AI, tax | Approved provider capabilities, commercial terms, and usage forecast | Product Operations | Each provider passes its founder, legal, security, and capability gate (issue #88 owns the commercial offer/cost package) | Unresolved — evidence not yet available |
| Support labor | Hours by service level | Approved support model, staffing assumptions, and internal loaded-cost method | Service Operations | Pilot service levels and support hours approved (issue #88 owns the commercial offer/cost package) | Unresolved — evidence not yet available |

## Unit Economics

Calculate:

- Cost per active tenant
- Cost per store
- Cost per register
- Cost per active user
- Cost per 1,000 completed sales
- Cost per million sale lines
- Cost per million inventory ledger entries
- Cost per 10,000 webhook deliveries
- Cost per GB of customer files
- Cost per restore exercise
- Cost per AI workflow

## Sensitivity Analysis

Model at least:

- 50% lower and 100% higher transaction volume
- One noisy-neighbor tenant
- Provider price increase
- USD/GYD exchange-rate movement where relevant
- Longer observability retention
- Dedicated deployment
- Secondary recovery region
- AI enabled and disabled

## Cost Allocation

Shared costs may be allocated by measured usage, active tenant, committed capacity, or a justified hybrid. Allocation rules remain visible and do not silently become customer billing rules.

## Review Gates

- Prototype start
- Pilot approval
- New provider or managed service
- Dedicated or self-hosted offer
- Multi-region decision
- Material capacity increase
- More than 20% forecast variance

## Evidence

Attach dated calculators, quotes, contracts, workload assumptions, measurements, and exchange-rate sources. Do not preserve credentials or confidential vendor terms in a public repository.
