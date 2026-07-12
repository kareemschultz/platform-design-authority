---
document_id: PDA-PLT-024
title: Import Export and Data Migration
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Import, Export, and Data Migration

## Purpose

Define a governed platform service for onboarding data, bulk maintenance, customer portability, integration exchange, merger and acquisition transitions, partner implementations, and system exit.

## Architectural Position

The platform provides common orchestration, mapping, validation, staging, audit, security, and job management. Each domain owns its import commands, validation rules, conflict semantics, authoritative writes, and export representations.

The migration service must never bypass domain application services by writing arbitrary production tables.

## Core Concepts

- Import project
- Source system and format
- Mapping template
- Transformation rule
- Staging batch
- Validation finding
- Dry run
- Commit wave
- Reconciliation result
- Export package
- Migration checkpoint

## Supported Inputs

- CSV and delimited files
- XLSX where explicitly supported
- JSON and newline-delimited JSON
- API-based extraction
- Database export adapters approved for implementation services
- Industry and competitor-specific templates
- Attachments and media manifests

## Import Lifecycle

1. Create project and select tenant, target domains, and source system.
2. Upload or connect the source securely.
3. Profile fields, types, volume, duplicates, and data quality.
4. Map source fields to canonical and custom fields.
5. Apply transformations through versioned rules.
6. Validate references, permissions, entitlements, business rules, and limits.
7. Run a dry run with counts and representative errors.
8. Approve the migration plan.
9. Commit in idempotent waves through domain commands.
10. Reconcile source counts, target counts, totals, balances, and exceptions.
11. Record acceptance and archive evidence.

## Validation

Validation supports:

- Required fields and data types
- Reference and relationship resolution
- Duplicate detection and merge candidates
- Custom-field definitions
- Currency, unit, time-zone, and locale normalization
- Effective dates and closed periods
- Ledger and inventory balancing
- Authorization and tenant scope
- File and malware controls

Errors must identify the source row, field, rule, severity, and corrective action. A customer must be able to correct and resubmit only affected records where practical.

## Idempotency and Rollback

- Every source record receives a stable import key.
- Replays must not create duplicates.
- Commit waves expose checkpoints and counts.
- Reversible master-data imports may support compensating rollback before downstream use.
- Posted ledgers and legally significant records use domain reversal rules rather than deletion.
- Every rollback policy is declared before execution.

## Export

Exports must support:

- Customer self-service for authorized datasets
- Regulatory and privacy requests
- Full tenant exit packages
- Incremental and scheduled extracts
- Open, documented formats
- Schema, manifest, checksum, and attachment inventory
- Permission-filtered operational exports
- Legally complete exports under elevated approval

## Portability

The platform must not make customer exit artificially difficult. Exit packages should preserve identifiers, timestamps, relationships, currencies, units, attachment references, audit context where lawful, and custom-field definitions.

## Security

- Encrypted transport and storage
- Expiring upload and download links
- Malware scanning
- Data classification and redaction
- Approval for sensitive or large exports
- Tenant isolation in staging and jobs
- Automatic staging retention and deletion
- Full audit of who initiated, approved, downloaded, or cancelled work

## Offline and Edge

Offline clients may import bounded operational packages only through signed manifests and capability-specific rules. General bulk imports require an online authoritative service.

## First-Slice Requirements

- Product and price import
- Customer and supplier party import
- Opening inventory import with reconciliation
- Export of products, parties, sales, and inventory balances
- Dry run, correction file, idempotent replay, and acceptance report
