---
document_id: PDA-DEP-001
title: Deployment Section Index
version: 0.6.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Deployment

## Artifact Catalog

- [Backup Restore and Disaster Recovery](BACKUP_RESTORE_AND_DISASTER_RECOVERY.md) — `PDA-DEP-010` · Draft
- [Deployment Reference Architecture](DEPLOYMENT_REFERENCE_ARCHITECTURE.md) — `PDA-DEP-011` · Draft
- [Infrastructure as Code and Environment Topology](INFRASTRUCTURE_AS_CODE_AND_ENVIRONMENT_TOPOLOGY.md) — `PDA-DEP-012` · Draft
- [Capacity Cost and Multi Region Strategy](CAPACITY_COST_AND_MULTI_REGION_STRATEGY.md) — `PDA-DEP-013` · Draft
- [Self Hosted Compatibility Matrix](SELF_HOSTED_COMPATIBILITY_MATRIX.md) — `PDA-DEP-014` · Draft
- [Infrastructure Cost Worksheet](INFRASTRUCTURE_COST_WORKSHEET.md) — `PDA-DEP-015` · Draft

## Related Authority

- `docs/blueprint/18-Decisions/ADR-0018-USE-OPENTOFU-FOR-INFRASTRUCTURE-AS-CODE.md`
- `docs/blueprint/02-Architecture/RECOMMENDED_TECHNOLOGY_STACK.md`
- `docs/blueprint/02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md`
- `docs/blueprint/15-Operations/OBSERVABILITY_INCIDENT_AND_SUPPORT_OPERATIONS.md`
- `docs/blueprint/15-Operations/SLO_AND_OPERATIONAL_READINESS.md`
- `registry/architecture-rules.json`

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
