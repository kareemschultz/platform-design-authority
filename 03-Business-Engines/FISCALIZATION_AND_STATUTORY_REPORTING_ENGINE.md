---
document_id: PDA-ENG-018
title: Fiscalization and Statutory Reporting Engine
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0010, ADR-0016]
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

The engine is required as an architectural seam for jurisdictions that mandate fiscalization or electronic reporting. The Guyana-first slice must not claim that Guyana currently mandates real-time fiscalization unless authoritative evidence verifies it. For Guyana, this engine initially provides a future-proofed interface and prototype contingency model; production activation remains jurisdiction-gated.

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

Each pack declares applicable taxpayers, registrations, schemas, numbering, required fields, signing, submission deadlines, contingency, correction, retention, and certification requirements.

No jurisdiction pack is production-ready without legal review and authority-conformance testing.

## Transaction Flow

1. Domain transaction reaches the jurisdiction-defined fiscalization point.
2. Tax, party, payment, product, and numbering data are frozen into a statutory snapshot.
3. The engine validates the jurisdiction schema and prerequisites.
4. It signs, transmits, or routes to the certified device.
5. Authority response is persisted with immutable payload hashes.
6. Commerce or Finance receives the statutory result.
7. Rejections enter an operational queue.

## Offline and Contingency

Offline behavior is jurisdiction-specific and may support number ranges, local signing, certified hardware, contingency markers, deferred deadlines, limits, and mandatory reconciliation.

The platform must never claim offline fiscal legality without an approved jurisdiction profile.

## Data Integrity

- Submitted payloads are immutable.
- Corrections use linked legal documents.
- Numbering gaps and voids are explainable.
- Acknowledgements and certificates are retained.
- Reconciliation compares domain, statutory, tax, payment, and Finance records.

## Security

- Managed or hardware-backed signing keys where required
- Certificate inventory and expiry alerts
- Separation of duties
- Tamper-evident payload and acknowledgement storage
- Restricted taxpayer credentials
- Full audit

## Events

- `fiscalization.document.prepared.v1`
- `fiscalization.submission.created.v1`
- `fiscalization.submission.accepted.v1`
- `fiscalization.submission.rejected.v1`
- `fiscalization.submission.reconciled.v1`
- `fiscalization.contingency.started.v1`
- `fiscalization.contingency.ended.v1`
- `fiscalization.certificate.rotated.v1`

## Regulatory Direction

Electronic invoicing and digital transaction reporting continue to expand internationally. EU ViDA changes are a durable architecture signal for export markets and future jurisdictions, not evidence of a current Guyana mandate.

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