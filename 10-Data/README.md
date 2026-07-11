---
document_id: PDA-DAT-001
title: Data Platform Section Index
version: 0.4.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Data Platform

## Current Specifications

- `DATA_PLATFORM_ARCHITECTURE.md`
- `DATA_CONTRACTS_LINEAGE_AND_SCHEMA_REGISTRY.md`
- `MASTER_REFERENCE_AND_DATA_QUALITY_GOVERNANCE.md`
- `ANALYTICS_SEMANTIC_LAYER_AND_METRIC_GOVERNANCE.md`
- `DATA_RETENTION_ARCHIVAL_AND_PORTABILITY.md`
- `SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md`
- `SEARCH_AND_COMMAND_RANKING_POLICY.md`
- `DATA_CLASSIFICATION_AND_HANDLING.md`
- `../01-Platform/IMPORT_EXPORT_AND_DATA_MIGRATION.md`
- `../01-Platform/EXTENSIBLE_METADATA_AND_CUSTOM_FIELDS.md`
- `../02-Architecture/DATA_OWNERSHIP_AND_CONSISTENCY.md`
- `../11-Security/PRIVACY_RIGHTS_AND_RETENTION.md`
- `../schemas/import-export/import-export-v1.schema.json`
- `../schemas/events/event-envelope-v1.schema.json`

## Machine-Readable Contracts

Schemas under `schemas/` govern event envelopes, offline batches, provider capabilities, import/export, Finance handoff, webhooks, and AI registry records. The schemas are draft implementation-review contracts and do not replace source-domain authority.

## Remaining Implementation Evidence

- Physical warehouse or lakehouse selection
- Schema-registry service and automated lineage
- Certified metric models
- Data-quality jobs and stewardship queues
- Search-ranking benchmarks
- Full-tenant export and re-import rehearsal
- Performance, cost, and recovery benchmarks

Authoritative domain data remains domain-owned. Analytics, search, webhooks, integrations, AI, and offline stores are governed projections with explicit freshness, classification, retention, privacy, lineage, and rebuild behavior.
