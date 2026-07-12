---
document_id: PDA-DEP-012
title: Infrastructure as Code and Environment Topology
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0018, ADR-0023]
---

# Infrastructure as Code and Environment Topology

## Purpose

Define reproducible infrastructure, canonical environments, bootstrap, secrets, network topology, drift control, module support, and deployment evidence.

## Canonical Environment Taxonomy

This table is authoritative for architecture, engineering, deployment, operations, and testing documents.

| Environment | Purpose | Data policy | External providers | Lifetime |
|---|---|---|---|---|
| Local | Individual development and deterministic tests | Synthetic only | Simulators by default | Developer controlled |
| CI Ephemeral | Pull-request and branch verification | Synthetic generated per run | Simulators | Minutes or hours |
| Integration | Cross-package, migration, provider-contract, and multi-service tests | Synthetic or approved de-identified fixtures | Simulators plus approved sandbox providers | Resettable shared or ephemeral |
| Shared Development | Collaborative feature integration | Synthetic; no raw production data | Approved sandbox providers | Persistent but resettable |
| Staging | Production-like release, migration, security, accessibility, performance, and recovery rehearsal | Synthetic or approved de-identified data | Sandbox or test-mode providers | Persistent |
| Pilot | Named design-partner validation before broad production | Real pilot data under contract and approved controls | Certified pilot providers | Persistent and tightly governed |
| Production | Contracted customer service | Authoritative customer data | Production providers | Persistent |
| Recovery | Isolated restore and disaster-recovery exercise | Restored production data under restricted incident authority | Disabled or isolated until reconciliation | Temporary and isolated |
| Dedicated | Customer-isolated managed environment | Customer authoritative data | Customer-approved production providers | Persistent |
| Self-Hosted | Customer-operated supported environment | Customer authoritative data | Customer-managed or approved providers | Persistent under support policy |

Other documents reference these names exactly and may describe subsets rather than inventing new environment classes.

## Infrastructure-as-Code Toolchain

ADR-0018 selects OpenTofu.

Required tooling:

- OpenTofu CLI pinned in CI and release tooling
- `tofu fmt`, `validate`, and reviewed plan
- Encrypted remote state and locking for shared environments
- Provider and module lockfiles
- Policy-as-code checks
- Cost estimation
- Security scanning
- Drift detection
- Signed or provenance-linked release artifacts where practical

## Module Manifest

| Module family | Purpose | SaaS | Dedicated | Self-hosted |
|---|---|---:|---:|---:|
| Bootstrap and state | State backend, locking, initial identity, audit | Required | Required | Reference implementation |
| Identity and access | Workload roles and least privilege | Required | Required | Customer-adapted |
| Network and DNS | Trust zones, ingress, egress, certificates | Required | Required | Reference implementation |
| Application runtime | Containers, scaling, deployment, health | Required | Required | Supported variants |
| PostgreSQL | Authoritative storage, backup, PITR | Required | Required | Supported variants |
| Redis or Valkey | Cache, rate, and bounded queue use | As required | As required | Supported variants |
| Object storage | Files, receipts, exports, backups | Required | Required | S3-compatible reference |
| Search | Search projections and rebuild | Prototype | Optional | Supported variants |
| Messaging | NATS or selected event transport | Prototype | Optional | Supported variants |
| Durable workflow | Temporal or selected workflow runtime; isolated pg_durable Labs variant only | Later/prototype | Optional | Supported variants subject to extension/preload support |
| Observability | Logs, metrics, traces, alerts | Required | Required | Export-compatible reference |
| Secrets and keys | Provider secrets, signing, encryption | Required | Required | Customer KMS or vault |
| Backup and recovery | Backup schedules, replication, restore | Required | Required | Customer responsibility split |
| Edge support | Store or warehouse local services | Prototype | Optional | Optional |

A “reference implementation” does not imply the company operates the customer's infrastructure.

## State Structure

Separate state by:

- Environment
- Region
- Customer isolation boundary
- High-risk platform subsystem where blast-radius reduction is required

State contains sensitive metadata and receives Restricted handling, encryption, access review, backup, and audit.

## Rules

1. No manual production resource without a recorded emergency exception and later codification.
2. Environment credentials, state, networks, and data are isolated.
3. Secrets are referenced, not embedded.
4. Plans are reviewed before apply.
5. Drift is detected and reconciled.
6. Destructive changes require additional approval, data-impact analysis, and recovery evidence.
7. Customer environments use supported modules rather than private forks.
8. Production and pilot data never enter lower environments without approved de-identification.
9. Provider sandbox and production credentials are isolated.
10. Environment naming appears in telemetry and deployment evidence.

## Bootstrap and Dual Control

Bootstrap creates state storage, locking, initial workload identity, key management, audit, network, and recovery access.

For pilot and production:

1. One authorized operator creates the bootstrap plan.
2. A second authorized reviewer approves identity, state, network, and recovery settings.
3. Short-lived credentials apply the plan.
4. Human standing access is removed or minimized afterward.
5. State backup and emergency-access evidence is verified.

## Network Topology

Separate public edge, application ingress, application runtime, data stores, administrative plane, provider egress, observability, and recovery zones.

Default-deny connectivity is preferred. Egress destinations for payment, identity, communications, AI, updates, and extensions are governed and observable.

## Self-Hosted Support Tiers

- Reference: documented modules and community-style guidance; customer operates everything.
- Supported: tested platform versions and defined support evidence; customer operates infrastructure.
- Managed Assist: platform team assists upgrades, diagnostics, and recovery under contract.

No tier promises support for arbitrary infrastructure divergence.

## Quality Gates

- Canonical environment-name validation
- OpenTofu formatting and validation
- Plan review
- Policy-as-code checks
- Provider and module provenance
- Secret scanning
- Drift detection
- Disaster-recovery bootstrap
- State backup and restore
- Destruction safeguards
- Cost estimation
- Dedicated and self-hosted compatibility tests
- Environment data-policy tests
