---
document_id: ADR-0008
title: Adopt Hybrid Storage for Extensible Metadata and Custom Fields
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0008 — Adopt Hybrid Storage for Extensible Metadata and Custom Fields

## Context

The platform promises configuration before code forks, industry-pack composition, tenant-defined fields, integration mapping, customizable forms, reporting, search, offline operation, and AI-generated tool schemas.

Core domain schemas must remain explicit and strongly governed, but customers and industry packs need extension points that do not require a database migration for every tenant-specific attribute.

A storage decision is required before domain schemas are finalized because custom fields affect persistence, validation, indexing, reporting, permissions, APIs, events, offline synchronization, imports, and AI tools.

## Decision Drivers

- Preserve explicit typed core schemas
- Support tenant and industry-pack fields without forks
- Maintain transactional integrity and tenant isolation
- Avoid unbounded EAV query complexity
- Support typed validation and schema evolution
- Support search, reporting, filtering, and integration mapping
- Support offline schema snapshots and synchronization
- Enforce field-level permissions and sensitivity
- Preserve audit and historical interpretation

## Options Considered

### Add physical columns for every custom field

Provides strong SQL typing but creates tenant-specific migrations, operational risk, schema explosion, and poor portability.

### Pure Entity-Attribute-Value model

Highly flexible but produces complex queries, weak constraints, difficult indexing, and poor developer ergonomics for business-critical records.

### Store all records as arbitrary JSON documents

Flexible, but weakens core-domain contracts, relational integrity, migration discipline, and analytical clarity.

### Hybrid typed core plus governed JSONB extensions and projections

Keep canonical domain attributes in typed relational columns. Store approved custom values in a versioned extension document on extensible records. Project fields that require filtering, uniqueness, search, analytics, or cross-record constraints into governed typed indexes or domain-owned projections.

## Decision

Adopt the hybrid model.

### Core Fields

Canonical domain fields remain explicit relational columns governed by domain schemas and migrations.

### Custom Values

Extensible records contain a tenant-scoped, schema-versioned JSONB extension document keyed by stable custom-field IDs rather than display names.

### Metadata Definitions

The Extensible Metadata capability owns field definitions, data types, constraints, labels, help text, sensitivity, permissions, default values, effective dates, pack ownership, and lifecycle.

### Query and Reporting Projections

A field definition declares whether it is:

- Display only
- Filterable
- Sortable
- Searchable
- Reportable
- Unique within an approved scope
- Aggregatable
- Exportable
- Available offline
- Available to AI tools

Fields requiring these behaviors are projected into governed typed structures or search and analytical projections. The JSONB document is not treated as the only query strategy for every workload.

### Events and APIs

APIs expose custom values through a stable `extensions` or equivalent contract that includes schema context. Events include only approved extension fields and must preserve compatibility rules.

## Consequences

### Positive

- Core domain integrity remains explicit
- Tenant and industry-pack configuration avoids schema forks
- Custom values can participate in search, reports, APIs, and offline workflows under policy
- Storage remains understandable and portable within PostgreSQL
- Query-heavy fields can be optimized selectively

### Negative

- Requires metadata and projection infrastructure
- Some queries span core columns and projected extension values
- Field-definition changes require compatibility and migration rules
- Unique and relational constraints on custom fields need specialized enforcement
- Reporting systems must understand metadata versions

## Required Controls

- Stable opaque field IDs
- Tenant and record-type scoping
- Metadata versioning and effective dates
- Type-safe validation on every write path
- Field-level permission and sensitivity checks
- Audit of definition and value changes
- Limits on field count, size, indexing, and computation
- Reserved-name protection
- Migration and rollback for type or option changes
- Search and analytical projection reconciliation
- Offline schema leases and compatibility checks
- AI-tool schema filtering
- Export, retention, and privacy classification

## Prohibited Uses

- Replacing required canonical domain fields with custom fields
- Allowing tenant-defined code execution in validation expressions
- Using display labels as persistent identifiers
- Creating hidden cross-domain foreign keys through custom fields
- Granting AI access merely because a custom field exists
- Indexing every custom value by default

## Validation

The decision is validated when an industry pack and a tenant can each add governed fields to the same record type and those fields can be validated, permissioned, searched, reported, exported, synchronized offline, and exposed selectively to AI without changing the core domain table schema.
