---
document_id: PDA-ENG-017
title: Fiscalization and Statutory Reporting Engine
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0010]
---

# Fiscalization and Statutory Reporting Engine

## Purpose

Define a governed engine for jurisdiction-specific fiscal receipts, electronic invoices, digital signatures, tax-authority submissions, certified numbering, fiscal devices, statutory ledgers, and legal reporting acknowledgements.

## Architectural Position

Fiscalization is a shared statutory engine, not an optional POS plugin. It coordinates jurisdiction packs and provider adapters while preserving domain ownership:

- Commerce owns sales, returns, and transaction state.
- Finance owns accounting documents and postings.
- Tax Engine owns tax determination.
- Sequence Service owns governed reference allocation.
- Document Engine owns rendering.
- Fiscalization owns legal transformation, signing, submission, acknowledgement, certified device integration, and statutory status.

## Core Entities

- Jurisdiction profile
- Fiscal registration
- Establishment and device registration
- Statutory document type
- Fiscal schema version
- Submission
- Signed payload
- Authority acknowledgement
- Rejection and correction
- Contingency record
- Fiscal device and certificate
- Reporting period and statutory return package

## Capabilities

- Fiscal receipt issuance
- Electronic invoice and credit-note submission
- Digital signing and certificate rotation
- QR code and authority-reference generation
- Real-time or near-real-time transaction reporting
- Certified fiscal printer or device adapters
- Sequential and authority-assigned numbering
- Cancellation, reversal, correction, and replacement workflows
- Contingency and offline operation
- Statutory exports and reconciliation
- Authority status polling and replay

## Jurisdiction Packs

Each pack declares:

- Applicable taxpayers, entities, locations, and transaction types
- Registration prerequisites
- Schemas and protocol versions
- Numbering authority and uniqueness rules
- Required tax, party, product, payment, and address fields
- Signing, certificate, device, and timestamp requirements
- Submission deadlines
- Contingency and offline rules
- Correction and cancellation procedures
- Retention period and evidence
- Test and certification requirements

No jurisdiction pack is considered production-ready without legal review and authority-conformance testing.

## Transaction Flow

1. Domain transaction reaches the jurisdiction-defined fiscalization point.
2. Tax, party, payment, product, and numbering data are frozen into a statutory snapshot.
3. The engine validates the jurisdiction schema and prerequisites.
4. It signs, transmits, or routes to the certified device.
5. Authority response is persisted with immutable payload hashes.
6. Commerce or Finance receives the statutory result and exposes it to the user.
7. Rejections enter an operational queue and follow jurisdiction-specific correction rules.

## Offline and Contingency

Offline behavior is jurisdiction-specific. The engine may support:

- Pre-authorized number ranges
- Local signing with protected device keys
- Certified fiscal hardware
- Contingency document markers
- Deferred submission deadlines
- Restricted transaction values or counts
- Mandatory reconciliation after reconnection

The platform must never claim offline fiscal legality without an approved jurisdiction profile.

## Data Integrity

- Submitted payloads are immutable.
- Corrections use linked legal documents, not destructive edits.
- Numbering gaps and voids are explainable.
- Authority acknowledgements and certificates are retained.
- Reconciliation compares domain records, statutory records, tax totals, payments, and finance postings.

## Security

- Hardware-backed or managed signing keys where required
- Certificate inventory and expiry alerts
- Separation of duties for registration and key management
- Tamper-evident payload and acknowledgement storage
- Restricted access to taxpayer credentials
- Full operational and security audit

## Regulatory Direction

Electronic invoicing and digital transaction reporting continue to expand internationally. The EU's VAT in the Digital Age package, adopted in 2025, introduces progressive e-invoicing and digital reporting changes through 2035. The platform must therefore treat statutory digital reporting as a durable architecture concern rather than a country-specific afterthought.

## Initial Scope

- Jurisdiction profile contract
- Fiscal receipt snapshot
- Authority/provider adapter interface
- Submission and acknowledgement ledger
- Rejection queue
- Contingency state
- Reconciliation report

## Source References

- Council of the European Union, VAT in the Digital Age adoption: https://www.consilium.europa.eu/en/press/press-releases/2025/03/11/taxation-council-adopts-vat-in-the-digital-age-package/
- European Commission, ViDA implementation timeline: https://taxation-customs.ec.europa.eu/taxation/vat/vat-digital-age-vida_en
