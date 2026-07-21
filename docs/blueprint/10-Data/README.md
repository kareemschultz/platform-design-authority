---
document_id: PDA-DAT-001
title: Data Platform Section Index
version: 0.6.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Data Platform

## Artifact Catalog

- [Search Relevance and Semantic Retrieval](SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md) — `PDA-DAT-002` · Draft
- [Data Classification and Handling](DATA_CLASSIFICATION_AND_HANDLING.md) — `PDA-DAT-010` · Draft
- [Data Platform Architecture](DATA_PLATFORM_ARCHITECTURE.md) — `PDA-DAT-011` · Draft
- [Data Contracts Lineage and Schema Registry](DATA_CONTRACTS_LINEAGE_AND_SCHEMA_REGISTRY.md) — `PDA-DAT-012` · Draft
- [Master Reference and Data Quality Governance](MASTER_REFERENCE_AND_DATA_QUALITY_GOVERNANCE.md) — `PDA-DAT-013` · Draft
- [Analytics Semantic Layer and Metric Governance](ANALYTICS_SEMANTIC_LAYER_AND_METRIC_GOVERNANCE.md) — `PDA-DAT-014` · Draft
- [Data Retention Archival and Portability](DATA_RETENTION_ARCHIVAL_AND_PORTABILITY.md) — `PDA-DAT-015` · Draft
- [Search and Command Ranking Policy](SEARCH_AND_COMMAND_RANKING_POLICY.md) — `PDA-DAT-016` · Draft
- [Party Prototype Schema Classification and Isolation](PARTY_PROTOTYPE_SCHEMA_CLASSIFICATION_AND_ISOLATION.md) — `PDA-DAT-017` · Draft
- [Audit and Session Revocation Prototype Schema Classification and Isolation](AUDIT_AND_SESSION_REVOCATION_PROTOTYPE_SCHEMA_CLASSIFICATION_AND_ISOLATION.md) — `PDA-DAT-018` · Draft
- [WS2 Catalog Inventory and Numbering Schema Classification](WS2_CATALOG_INVENTORY_AND_NUMBERING_SCHEMA_CLASSIFICATION.md) — `PDA-DAT-019` · Draft
- [WS3 POS Cash Schema Classification](WS3_POS_CASH_SCHEMA_CLASSIFICATION.md) — `PDA-DAT-020` · Draft (controlled prototype on `claude/ws3-integration`)

## Related Authority and Contracts

- `docs/blueprint/01-Platform/IMPORT_EXPORT_AND_DATA_MIGRATION.md`
- `docs/blueprint/01-Platform/EXTENSIBLE_METADATA_AND_CUSTOM_FIELDS.md`
- `docs/blueprint/02-Architecture/DATA_OWNERSHIP_AND_CONSISTENCY.md`
- `docs/blueprint/11-Security/PRIVACY_RIGHTS_AND_RETENTION.md`
- `schemas/import-export/import-export-v1.schema.json`
- `schemas/events/event-envelope-v1.schema.json`

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
