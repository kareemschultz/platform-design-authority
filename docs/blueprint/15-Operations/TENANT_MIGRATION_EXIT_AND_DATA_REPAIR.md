---
document_id: PDA-OPS-017
title: Tenant Migration Exit and Data Repair
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Tenant Migration, Exit, and Data Repair

## Purpose

Define controlled tenant onboarding, environment movement, legal-entity or region migration, customer exit, export, credential revocation, retention, deletion, and exceptional repair.

## Migration Types

- Import from a prior system
- Tenant move between shared and dedicated deployment
- Region move
- Legal-entity or organizational restructuring
- Provider migration
- Self-hosted to managed or managed to self-hosted
- Customer exit to another system

## Migration Plan

Every migration records scope, owners, source and target, data classes, contracts, downtime, coexistence, mapping, transformation, reconciliation, rollback, customer acceptance, retention, and destruction.

## Cutover

1. Freeze or bounded dual-write period
2. Final extraction and validation
3. Apply migration idempotently
4. Reconcile counts, ledgers, files, permissions, integrations, and audit
5. Revoke old credentials and webhooks
6. Validate critical workflows
7. Obtain customer acceptance
8. Retain rollback evidence for the approved window

## Exit Package

Include documented open formats for authoritative records, files, configuration, custom fields, identities and role mappings where lawful, integrations, audit evidence, schemas, identifiers, relationships, and hashes.

## Post-Exit Controls

- Revoke sessions, keys, provider credentials, applications, extensions, webhooks, and support access
- Stop billing and usage collection according to contract
- Apply retention, legal hold, archive, and deletion policy
- Provide deletion or handoff evidence
- Preserve only lawful residual records

## Data Repair Template

The canonical repair record and mandatory independent-review controls are defined by `docs/blueprint/15-Operations/PROBLEM_CHANGE_RELEASE_AND_DATA_REPAIR_OPERATIONS.md`. Migration or exit repairs use that record without weakening it and add:

- Migration/export/import manifest and hashes
- Source and target schema versions
- Transfer and transformation provenance
- Tenant acceptance or exit authority
- Importability and portability evidence
- Credential, integration, and residual-data disposition

Direct SQL is not the default repair interface. When emergency direct access is unavoidable, the action is captured, reviewed, reproduced safely, and removed from ordinary operator practice.

## Quality Gates

- Tenant isolation
- Export completeness and importability
- Financial and inventory reconciliation
- Privacy and legal-hold review
- Credential and integration revocation
- Customer acceptance
- Restore point
- Repair simulation
- No orphaned provider or marketplace access

## Canonical Repair Control Record

`PROBLEM_CHANGE_RELEASE_AND_DATA_REPAIR_OPERATIONS.md` owns repair authorization, independent review, execution, evidence, rollback, and closure. This document adds portability only.
