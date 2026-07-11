---
document_id: PDA-DEP-012
title: Infrastructure as Code and Environment Topology
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Infrastructure as Code and Environment Topology

## Purpose

Define reproducible infrastructure, environment separation, bootstrap, secrets, network topology, drift control, and deployment evidence.

## Environment Classes

- Local
- CI ephemeral
- Shared development
- Staging
- Pilot
- Production
- Isolated recovery
- Dedicated or self-hosted customer environment

## Infrastructure as Code

All durable cloud resources, networks, identities, policies, databases, object stores, queues, search, observability, backups, and certificates are declared in reviewed code.

## Rules

1. No manual production resource without a recorded exception and later codification.
2. Environment credentials and state are isolated.
3. Secrets are referenced, not embedded.
4. Plans are reviewed before apply.
5. Drift is detected and reconciled.
6. Destructive changes require additional approval and backup review.
7. Customer-specific environments use the same supported modules.

## Bootstrap

Bootstrap establishes state storage, identity, key management, audit, network, and recovery access with minimal manual steps and dual control.

## Network Topology

Separate public edge, application, data, administration, provider egress, recovery, and observability planes. Default-deny connectivity is preferred.

## Quality Gates

- Plan review
- Policy-as-code checks
- Secret scanning
- Drift detection
- Disaster-recovery bootstrap
- Environment-destruction safeguards
- Cost estimation
- Self-hosted compatibility test
