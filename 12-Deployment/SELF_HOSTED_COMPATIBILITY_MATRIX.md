---
document_id: PDA-DEP-014
title: Self Hosted Compatibility Matrix
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Self-Hosted Compatibility Matrix

## Purpose

Define supported infrastructure, responsibility boundaries, compatibility evidence, upgrade policy, diagnostics, and support tiers for customer-operated deployments.

## Supported Baseline

The reference self-hosted architecture uses:

- Linux on x86_64; arm64 requires separate certification
- OCI-compatible containers
- OpenTofu reference modules where applicable
- PostgreSQL 18 authoritative database on an approved patch with ADR-0024's minimal extension baseline
- S3-compatible object storage
- Redis or Valkey-compatible cache and bounded queue functions
- Supported search, messaging, workflow, and observability adapters only when enabled
- Customer-managed DNS, certificates, backups, secrets, and network policy unless contracted otherwise

## Matrix Fields

Each released version records:

- Operating-system families
- CPU architectures
- Container runtime
- Kubernetes versions where supported
- PostgreSQL versions
- Required, optional, unsupported, and Labs-only PostgreSQL extensions plus preload/restart privileges
- Redis or Valkey versions
- Object-storage compatibility
- Search engine versions
- Messaging and workflow versions
- Identity-provider protocols
- Backup and restore tooling
- Observability export formats
- Required ports and egress destinations
- Minimum resources and capacity envelope
- Upgrade path from prior supported versions

## Support Levels

- Certified: continuously tested in release CI and supported under contract
- Compatible: expected to work through standard protocols but not continuously tested
- Experimental: prototype only
- Unsupported: known incompatibility or outside support policy

## Responsibility Matrix

Customer responsibilities normally include infrastructure, networking, certificates, host security, backups, monitoring ingestion, capacity, and provider credentials.

Platform responsibilities normally include application artifacts, supported migrations, compatibility documentation, diagnostics, release notes, security advisories, and defined support assistance.

Contracts may change the split but must state it explicitly.

## Upgrade Policy

- Supported upgrade paths are sequential and documented.
- Skipping versions requires explicit compatibility evidence.
- Database and offline-protocol windows are respected.
- Backup and rollback are verified before upgrade.
- Unsupported modifications may require reproduction on a certified baseline.

## Diagnostics

Provide privacy-safe health summaries, version inventory, dependency checks, migration state, queue and projection status, backup evidence, and configuration validation without collecting customer secrets by default.

## Quality Gates

- Install from clean environment
- Upgrade from prior supported release
- Backup and restore
- Offline-client compatibility
- Provider adapter tests
- Tenant isolation
- Performance at minimum resources
- Security hardening guide
- Failure and support bundle generation
