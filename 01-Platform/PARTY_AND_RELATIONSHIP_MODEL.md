---
document_id: PDA-PLT-021
title: Party and Relationship Model
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0007]
---

# Party and Relationship Model

## Purpose

Define the shared master-data capability for representing people, organizations, contact points, addresses, identifiers, and relationships while preserving domain ownership of customer, supplier, worker, partner, and financial roles.

## Architectural Position

The Party capability is a platform primitive consumed by domains. It owns common identity and relationship data, not domain-specific commercial, workforce, supplier, or financial behavior.

## Core Concepts

### Party

A stable tenant-scoped representation of a real-world person or organization.

Required attributes:

- Party ID
- Tenant ID
- Party type: Person or Organization
- Display name
- Legal or primary name
- Status
- Created and updated timestamps
- Provenance and source
- Privacy classification
- Merge and duplicate state

### Person

Person-specific identity attributes such as structured names and optional date-of-birth data where lawful and necessary.

### Organization

Organization-specific identity attributes such as legal name, registration identifiers, organization type, and parent relationships.

### Contact Point

A typed communication endpoint, including email, phone, messaging address, or web endpoint.

Each contact point records:

- Normalized and display values
- Verification state
- Usage: work, personal, billing, support, emergency, or other governed type
- Effective dates
- Visibility and disclosure classification
- Source and confidence

### Address

A structured postal, physical, mailing, billing, shipping, registered, service, or other address.

Addresses may be shared or copied into immutable transaction snapshots where legal and operational history requires exact preservation.

### Party Identifier

An identifier issued by a government, registry, external platform, customer, supplier, or internal system.

Each identifier records type, issuing authority, jurisdiction, value protection, effective period, verification, and provenance.

### Party Relationship

A directed, effective-dated relationship between parties, such as:

- Parent organization and subsidiary
- Organization and contact person
- Employer and worker
- Customer and guarantor
- Franchise operator and franchisor
- Partner and managed customer
- Beneficial owner and organization
- Household or family relationship where an approved industry workflow requires it

Relationship types must be registered and permission-aware.

### Domain Role

A domain-owned record that references a Party and adds behavior specific to that domain.

Examples:

- Customer Account
- Supplier Account
- Employment
- Contractor Engagement
- Partner Account
- Financial Counterparty
- Marketing Profile

## Ownership Rules

The Party capability owns:

- Canonical names and aliases
- Shared contact points and addresses
- Common identifiers
- Party-to-party relationships
- Duplicate detection candidates
- Merge records and identity links

Domains own:

- Customer status, credit, pipeline, pricing, and service history
- Supplier terms, qualification, risk, and procurement history
- Employment, compensation, leave, and performance
- Marketing segments and campaign behavior
- Financial balances, postings, and tax treatment
- Transaction-specific participant snapshots

## Historical Snapshots

Business transactions must not depend on later edits to Party data where history matters.

Orders, invoices, payroll records, tax documents, contracts, and shipments may preserve immutable snapshots of names, addresses, identifiers, and contact information used at the time of the transaction.

The snapshot references the Party but remains historically stable.

## Identity Linking

Authentication accounts link through `PlatformIdentityLink`.

A link records:

- Better Auth user ID
- Tenant and organization context
- Party ID
- Optional domain-role ID
- Link type
- Effective period
- Verification and provenance
- Delegation or impersonation restrictions

One Better Auth user may link to different Party contexts across organizations. One Party may have more than one authentication account only under explicit policy.

## Deduplication

Duplicate detection may use:

- Normalized names
- Verified email or phone
- Government or tax identifiers
- Registration identifiers
- Address similarity
- External source identifiers
- Domain-specific evidence

Automated matching produces candidates, not silent merges.

## Merge Workflow

A merge must:

1. Identify survivor and merged Party IDs.
2. Display affected domain roles and records.
3. Require permission and risk-based approval.
4. Preserve aliases, identifiers, sources, and history.
5. Repoint domain-role references through approved application commands.
6. Publish merge events.
7. Record the operator, evidence, reason, and timestamp.
8. Support rollback where possible before irreversible external effects.

## Privacy and Security

- Party data is tenant-scoped by default.
- Sensitive identifiers require encryption, masking, and purpose-based access.
- Search results must apply field and record permissions.
- Consent is not inferred from the existence of a contact point.
- Privacy requests must traverse Party data and all linked domain roles.
- Export and deletion behavior must respect legal holds and statutory retention.
- Global cross-tenant identity correlation is prohibited without a separate approved design.

## APIs

Representative operations:

- Create Person Party
- Create Organization Party
- Update shared identity attributes
- Add, verify, replace, or retire contact point
- Add or retire address
- Register or verify identifier
- Create or end relationship
- Search and resolve Party
- Propose duplicate
- Merge Parties
- Link or unlink authentication identity

Domains create or change role records through their own APIs.

## Events

- `party.person.created.v1`
- `party.organization.created.v1`
- `party.contact-point.verified.v1`
- `party.address.changed.v1`
- `party.relationship.created.v1`
- `party.relationship.ended.v1`
- `party.duplicate-detected.v1`
- `party.parties.merged.v1`
- `party.identity-linked.v1`

## Offline Behavior

Offline clients may create provisional Party records only for approved capabilities.

Requirements:

- Client-generated opaque identifiers
- Idempotent synchronization
- Duplicate-candidate handling after reconnect
- No automatic offline merge
- Locally captured provenance
- Restricted sensitive identifiers
- Transaction snapshots preserved even if Party records are later merged

## Reporting and Search

The Party capability provides shared identity projections and relationship traversal. Domain analytics remain domain-owned. Cross-domain reporting may join through Party IDs using governed analytical models rather than operational cross-domain table access.

## Open Decisions

- Exact storage model and schema boundaries
- Shared-address identity versus copied address objects
- Field-level survivorship rules
- Cross-tenant marketplace and network identities
- Legal-entity relationship to tenant and organization hierarchy
- Industry-specific party types that should remain role records rather than new Party types

## Validation Scenarios

- One company is both customer and supplier without duplicate identity records.
- One person is employee, customer contact, and authenticated user with separate permissions and role lifecycles.
- A transaction preserves an old billing address after the Party address changes.
- A duplicate merge preserves audit, identifiers, and all domain-role references.
- A privacy export includes shared Party data and linked domain-role data without exposing another tenant.
