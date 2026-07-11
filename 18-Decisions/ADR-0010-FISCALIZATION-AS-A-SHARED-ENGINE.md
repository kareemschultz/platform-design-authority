---
document_id: ADR-0010
title: Treat Fiscalization as a Shared Statutory Engine
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0010 — Treat Fiscalization as a Shared Statutory Engine

## Context

The Retail pack previously treated fiscal printers and statutory receipt integrations as optional extensions. In many jurisdictions, fiscal receipts, electronic invoicing, certified numbering, signing, authority reporting, and contingency procedures are legal prerequisites for selling or invoicing.

Fiscalization crosses Commerce, Finance, Tax, Documents, Numbering, Devices, Security, and jurisdiction packs. Leaving it as an unowned integration would make legal transaction state inconsistent and encourage country-specific forks.

## Options Considered

### Keep fiscalization as optional integration adapters

Simple initially, but does not provide one statutory state model, reconciliation process, or offline-contingency contract.

### Place all fiscalization inside Commerce

Fits POS receipts but does not cover business invoices, accounting documents, procurement reporting, platform-economy reporting, or broader statutory submissions.

### Place it entirely inside the Tax Engine

Tax determination is related, but authority signing, device certification, numbering, document submission, and legal acknowledgement are broader than tax calculation.

### Create a shared Fiscalization and Statutory Reporting Engine

Provides one legal-submission lifecycle while existing domains retain their authoritative records.

## Decision

Create a shared Fiscalization and Statutory Reporting Engine.

It owns:

- Jurisdiction fiscal profiles
- Statutory document transformation
- Signing and certificate integration
- Authority and certified-device adapters
- Submission, acknowledgement, rejection, correction, and contingency state
- Statutory reconciliation evidence

It does not own:

- Source sales or accounting records
- Tax determination
- Generic document rendering
- General-purpose numbering

## Consequences

### Positive

- Fiscal legality becomes an explicit platform concern
- Jurisdiction packs remain configuration and adapters rather than forks
- Commerce, Finance, and Tax share one statutory status model
- Offline and contingency behavior become governed
- Reconciliation and authority evidence are consistent

### Negative

- Every target jurisdiction requires legal and conformance work
- Certified devices and authority APIs may force specialized adapters
- Release timelines may depend on external certification
- Offline legality cannot be promised globally

## Required Controls

- Jurisdiction-specific legal review
- Immutable submitted payloads and acknowledgements
- Certificate and signing-key governance
- Separation of duties
- Numbering and void reconciliation
- Explicit contingency procedures
- Provider and authority version monitoring

## Validation

Validate the engine with one real jurisdiction profile covering receipt issuance, rejection, correction, numbering, offline contingency, authority acknowledgement, and end-of-period reconciliation.
