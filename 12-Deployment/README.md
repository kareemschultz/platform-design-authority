---
document_id: PDA-DEP-001
title: Deployment Section Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Deployment

## Current Specifications

- `DEPLOYMENT_REFERENCE_ARCHITECTURE.md`
- `INFRASTRUCTURE_AS_CODE_AND_ENVIRONMENT_TOPOLOGY.md`
- `CAPACITY_COST_AND_MULTI_REGION_STRATEGY.md`
- `BACKUP_RESTORE_AND_DISASTER_RECOVERY.md`
- `../02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`
- `../02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md`
- `../15-Operations/OBSERVABILITY_INCIDENT_AND_SUPPORT_OPERATIONS.md`
- `../15-Operations/SLO_AND_OPERATIONAL_READINESS.md`

## Remaining Implementation Evidence

- IaC modules
- Network and certificate diagrams
- Database, Redis, object-storage, workflow, messaging, and search sizing
- Multi-region failover implementation
- Edge packaging
- Customer-managed keys
- Deployment compatibility test matrix
- Measured cost model

Containers are the standard deployment unit. Kubernetes is adopted only when operating requirements justify it.
