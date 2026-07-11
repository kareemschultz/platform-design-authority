---
document_id: PDA-DAT-001
title: Data Platform Section Index
version: 0.3.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Data Platform

## Current Specifications

- `DATA_PLATFORM_ARCHITECTURE.md` — authoritative stores, projections, analytics, search, AI retrieval, and data products
- `DATA_CONTRACTS_LINEAGE_AND_SCHEMA_REGISTRY.md` — contracts, schemas, lineage, compatibility, and ownership
- `MASTER_REFERENCE_AND_DATA_QUALITY_GOVERNANCE.md` — stewardship, survivorship, reference values, and quality issues
- `ANALYTICS_SEMANTIC_LAYER_AND_METRIC_GOVERNANCE.md` — certified metrics, dimensions, formulas, and analytical security
- `DATA_RETENTION_ARCHIVAL_AND_PORTABILITY.md` — retention, legal hold, archive, export, and exit
- `SEARCH_RELEVANCE_AND_SEMANTIC_RETRIEVAL.md` — lexical, semantic, hybrid, permission-filtered retrieval
- `DATA_CLASSIFICATION_AND_HANDLING.md` — handling, export, offline, search, AI, and support rules
- `../01-Platform/IMPORT_EXPORT_AND_DATA_MIGRATION.md`
- `../01-Platform/EXTENSIBLE_METADATA_AND_CUSTOM_FIELDS.md`
- `../02-Architecture/DATA_OWNERSHIP_AND_CONSISTENCY.md`
- `../11-Security/PRIVACY_RIGHTS_AND_RETENTION.md`

## Remaining Implementation Evidence

- Physical warehouse or lakehouse selection
- Schema-registry tooling
- Automated lineage
- Certified metric models
- Data-quality jobs and stewardship queues
- Full-tenant export rehearsal
- Performance, cost, and recovery benchmarks

Authoritative domain data remains domain-owned. Analytical, search, webhook, integration, AI, and offline systems are governed projections with declared freshness, classification, retention, privacy, and rebuild behavior.
