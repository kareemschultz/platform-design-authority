---
document_id: PDA-DAT-010
title: Data Classification and Handling
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Data Classification and Handling

## Purpose

Define a platform-wide classification model that drives access, masking, encryption, logging, export, retention, offline storage, search, AI use, support access, and incident response.

## Classification Levels

### Public

Approved for public disclosure.

Examples:

- Public storefront content
- Published product descriptions
- Public documentation
- Approved marketing material

### Internal

Ordinary tenant or platform operational information not intended for public disclosure.

Examples:

- Internal tasks and comments
- General configuration
- Non-sensitive operating procedures
- Aggregated operational metrics

### Confidential

Business, personal, contractual, or financial information whose disclosure could harm a tenant, person, partner, or the platform.

Examples:

- Customer and supplier contacts
- Prices, costs, contracts, and forecasts
- Orders, inventory, and financial reports
- Employee records
- Integration configuration

### Restricted

Highly sensitive information requiring strong purpose limitation, field-level controls, masking, enhanced audit, and restricted export.

Examples:

- Payroll and compensation
- Government identifiers
- Bank-account and payment data
- Authentication recovery data
- Health or regulated personal information
- Investigation and whistleblower records
- Signing keys and provider secrets

### Secret

Credential or cryptographic material that must not be exposed to ordinary application users, logs, AI systems, or support operators.

Examples:

- Password hashes
- Private keys
- API secrets
- TOTP seeds
- Session signing material
- Encryption master keys

## Handling Dimensions

Classification is necessary but not sufficient. Every field or record class also declares:

- Tenant and organization scope
- Data subject or business owner
- Purpose
- Retention class
- Legal or contractual basis where applicable
- Geographic or residency restrictions
- Searchability
- Exportability
- Offline eligibility
- AI eligibility
- Support visibility
- Masking and redaction policy

## Default Rules

1. Unknown data defaults to Confidential.
2. Secrets never enter logs, analytics, search, vector stores, prompts, or support exports.
3. Restricted data requires explicit authorization and enhanced audit.
4. Client applications receive only fields needed for the current task.
5. Offline storage is denied unless the capability declares it and the device is managed.
6. AI use is denied unless classification, purpose, provider policy, retention, and tool scope permit it.
7. Exports inherit the highest classification of included data.
8. Classification changes are versioned and may trigger re-indexing, purge, or re-encryption.

## Field Metadata

Canonical schemas and extensible fields should support metadata such as:

```text
classification: Restricted
retention_class: payroll-record
searchable: false
exportable: permissioned
offline: managed-device-only
ai_usage: prohibited
masking: last-four
support_visibility: denied
```

Custom-field authors must choose from approved values and cannot weaken a domain minimum.

## Logging and Observability

- Public and Internal identifiers may appear in ordinary logs when needed.
- Confidential values are minimized and structured.
- Restricted values are redacted, tokenized, or hashed.
- Secrets are prohibited.
- Tenant and correlation identifiers may be logged, but not raw authentication tokens.
- Debug capture in production requires time-limited approval and automatic deletion.

## Search and Analytics

Search documents carry classification and field-level restrictions. Analytics receives only approved dimensions and measures. Cross-tenant aggregates require thresholds, de-identification, and governance. Restricted row-level data must not be copied into broad self-service datasets without an approved model.

## AI

AI eligibility states:

- Prohibited
- Retrieval only
- Processing with approved provider
- Tool input allowed
- Training or evaluation allowed only after de-identification

The model provider never determines access. Platform policy filters data before retrieval or tool execution.

## Offline and Mobile

Offline eligibility states:

- Not allowed
- Temporary encrypted cache
- Managed device only
- Capability-specific operational store

Offline stores require encryption, device binding, lease expiry, remote revocation, privacy purge, and minimized fields.

## Export and Sharing

- Exports require purpose, permission, and audit.
- Restricted exports may require approval, step-up authentication, watermarking, expiry, and recipient acknowledgment.
- Public sharing must never inherit merely from a public link if record authorization does not permit it.
- Webhooks and integrations receive a declared data contract and classification ceiling.

## Retention and Erasure

Classification links to retention classes, but high sensitivity does not automatically mean long retention. Erasure uses ADR-0014. Backups and projections follow the deletion journal and restore-time reapplication rules.

## Initial Classification Registry

The first retail slice must classify at minimum:

- User and session data
- Party and customer profile
- Product and price data
- Orders and receipts
- Stored value
- Inventory balances and movements
- Cash counts and variances
- Payment references
- Audit and support access
- Offline device data
- AI prompts and tool records

## Quality Gates

- Every first-slice schema field has a classification or inherits an explicit record default.
- API schemas expose classification metadata to code generation where safe.
- Logs and traces pass secret and PII scanning.
- Search and AI tests prove Restricted fields are excluded.
- Export and offline policies are testable.
- Classification changes trigger migration and projection review.