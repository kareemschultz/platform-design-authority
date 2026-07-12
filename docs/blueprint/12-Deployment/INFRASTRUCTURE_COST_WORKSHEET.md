---
document_id: PDA-DEP-015
title: Infrastructure Cost Worksheet
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
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

| Category | Quantity driver | Unit price source | Estimated monthly cost |
|---|---|---|---|
| Application compute | CPU-hours, memory-hours, instances | Provider calculator or quote | TBD |
| PostgreSQL | Compute, storage, I/O, backups, replicas | Provider quote | TBD |
| Cache and queues | Memory, operations, nodes | Provider quote | TBD |
| Object storage | GB-month, requests, retrieval, replication | Provider quote | TBD |
| Search | Compute, storage, indexing | Provider quote | TBD |
| Messaging/workflow | Nodes, operations, retention | Provider quote | TBD |
| Observability | GB ingestion and retention | Provider quote | TBD |
| Network | Egress, CDN, inter-region traffic | Provider quote | TBD |
| Backups and recovery | Storage, replication, exercise runtime | Provider quote | TBD |
| Security tooling | Scanning, WAF, secrets, SIEM | Contract or quote | TBD |
| Providers | Auth, payments, messaging, AI, tax | Contract or quote | TBD |
| Support labor | Hours by service level | Internal model | TBD |

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
