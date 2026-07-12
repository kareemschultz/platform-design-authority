---
document_id: PDA-DEP-001
title: Deployment Section Index
version: 0.5.0
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
- `SELF_HOSTED_COMPATIBILITY_MATRIX.md`
- `INFRASTRUCTURE_COST_WORKSHEET.md`
- `../18-Decisions/ADR-0018-USE-OPENTOFU-FOR-INFRASTRUCTURE-AS-CODE.md`
- `../02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`
- `../02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md`
- `../15-Operations/OBSERVABILITY_INCIDENT_AND_SUPPORT_OPERATIONS.md`
- `../15-Operations/SLO_AND_OPERATIONAL_READINESS.md`
- `../registry/architecture-rules.json`

## Current Direction

- OpenTofu is the default infrastructure-as-code engine.
- The canonical environment taxonomy is Local, CI Ephemeral, Integration, Shared Development, Staging, Pilot, Production, Recovery, Dedicated, and Self-Hosted.
- Initial failover uses one authoritative write region with an isolated warm or restorable recovery region.
- Active-active financial writes are not assumed.
- Containers are standard; Kubernetes is adopted only when operating evidence justifies it.

## Remaining Implementation Evidence

- OpenTofu modules and policy checks
- Network and certificate diagrams
- Measured service sizing
- Candidate-region latency and residency comparison
- Failover and failback exercise
- Edge packaging
- Customer-managed key implementation
- Self-hosted installation and upgrade evidence
- Measured provider and unit-cost worksheet
