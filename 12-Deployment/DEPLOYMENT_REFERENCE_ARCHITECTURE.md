---
document_id: PDA-DEP-011
title: Deployment Reference Architecture
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Deployment Reference Architecture

## Purpose

Define the reference topology for multi-tenant SaaS, dedicated cloud, self-hosted enterprise, hybrid, and edge-aware deployments.

## Reference SaaS Topology

- Global DNS, certificate, and edge protection
- Web and API application tier
- Better Auth and Platform Identity services
- PostgreSQL authoritative data
- Redis for bounded cache, rate, and queue concerns
- Object storage
- Search and vector projections
- Durable workflow and messaging infrastructure
- Observability pipeline
- Secrets and key management
- Backup, restore, and disaster-recovery services

## Isolation

Tenant isolation is primarily logical and application-enforced, with database constraints and optional row-level security as defense in depth. Dedicated environments may isolate accounts, networks, databases, keys, and regions.

## Deployment Modes

### Multi-Tenant SaaS

Default managed service with shared infrastructure and strict tenant boundaries.

### Dedicated Cloud

Separate deployment or data plane for enterprise, regional, performance, or regulatory requirements.

### Self-Hosted

Customer-operated deployment using supported containers, configuration, upgrade tooling, diagnostics, and support boundaries.

### Hybrid and Edge

Cloud control plane with approved local services or offline clients for stores, warehouses, and remote sites.

## Environment Model

The exact canonical environment names are Local, CI Ephemeral, Integration, Shared Development, Staging, Pilot, Recovery Exercise, and Production, as governed by `16-Testing/TEST_DATA_ENVIRONMENTS_AND_RELEASE_EVIDENCE.md`. Production data is not copied downward without approved de-identification.

## Network and Trust Zones

- Public edge
- Application ingress
- Internal services
- Data stores
- Provider egress
- Administrative plane
- Recovery environment
- Edge or offline device

Every crossing is authenticated, authorized, encrypted, observable, and minimized.

## Data Residency

A tenant's residency profile declares authoritative region, backup region, provider regions, support access, search and AI processing, and lawful transfer controls. Residency claims require provider and legal verification.

## Scaling

Scale stateless application tiers horizontally. Preserve database correctness through indexing, partitioning where justified, connection management, read projections, workload isolation, and measured extraction—not premature microservices.

## Kubernetes

Containers are standard. Kubernetes is introduced only when multi-service scheduling, isolation, self-healing, deployment scale, or customer operation justifies its complexity.

## Release and Rollback

Use immutable artifacts, staged rollout, migration compatibility, feature controls, health gates, rollback or compensation, and tenant-scoped disablement.

## Self-Hosted Responsibilities

Contracts distinguish platform and customer responsibility for infrastructure, backups, upgrades, certificates, identity providers, security monitoring, provider credentials, and support evidence.

## Quality Gates

- Infrastructure as code
- Threat and failure-mode review
- Tenant-isolation tests
- Capacity and cost model
- Restore rehearsal
- Provider outage tests
- Upgrade and rollback rehearsal
- Regional and self-hosted compatibility matrix
