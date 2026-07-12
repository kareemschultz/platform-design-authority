---
document_id: PDA-PLT-022
title: Extensible Metadata and Custom Fields
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0008]
---

# Extensible Metadata and Custom Fields

## Purpose

Define the governed platform primitive that lets industry packs, customers, partners, integrations, and extensions add fields, field groups, validation, layouts, and metadata without forking domain code or weakening core schemas.

## Architectural Position

Extensible Metadata is a kernel capability. Domains opt specific record types into extensibility and retain ownership of their canonical fields and business behavior.

Custom fields add metadata and values. They do not create a parallel ungoverned domain model.

## Goals

- Support configuration before customization
- Support industry-specific forms and terminology
- Preserve explicit typed core schemas
- Provide safe tenant-specific extensibility
- Integrate with APIs, forms, imports, search, reports, offline clients, permissions, audit, and AI
- Prevent extension behavior from bypassing domain rules

## Non-Goals

- Arbitrary tenant code execution
- Replacing canonical domain fields
- Creating ad hoc cross-domain foreign keys
- Allowing custom fields to mutate another domain
- Turning every record into an untyped document
- Providing a full low-code application platform in the first release

## Core Concepts

### Extensible Record Type

A domain-owned declaration that a record may accept custom metadata.

The declaration includes:

- Record type identifier
- Owning domain
- Supported field types
- Maximum field and payload limits
- Supported contexts: API, web, mobile, offline, import, export, search, report, AI
- Allowed relationship targets
- Historical and snapshot behavior
- Event and audit policy

### Field Definition

A stable metadata definition with:

- Field ID
- Tenant, partner, or pack scope
- Record type
- Stable key
- Display label and description
- Data type
- Required, optional, or conditionally required behavior
- Default value
- Validation constraints
- Option set or reference target
- Sensitivity and privacy classification
- Field-level view and edit policy
- Search, filter, sort, report, export, offline, and AI flags
- Effective dates and version
- Owner: platform, industry pack, partner, tenant, or extension
- Lifecycle state

Display labels are localizable and mutable. Stable keys and field IDs are not casually changed.

### Field Group

A named grouping used for form sections, panels, tabs, import templates, and reports.

### Option Set

A versioned list of allowed values, labels, ordering, active state, and localization.

### Computed Field

A derived value based on an approved expression language or platform function catalog.

Computed fields must be deterministic unless explicitly marked otherwise. They may not execute arbitrary code, call unrestricted external services, or bypass domain commands.

### Custom Value

A typed value attached to an extensible record and validated against the effective field-definition version.

### Layout Metadata

Configuration that places canonical and custom fields into approved forms, workspaces, mobile screens, document templates, and role-specific views.

Layout configuration never grants access to a field the actor is not allowed to view.

## Supported Field Types

Initial types may include:

- Short text
- Long text
- Integer
- Decimal
- Money with currency semantics
- Boolean
- Date
- Date and time
- Time
- Duration
- Email
- Phone
- URL
- Single-select option
- Multi-select option
- Reference to an approved record type
- Address
- Measurement with unit
- Attachment reference
- Structured JSON only for explicitly registered schemas

Every type requires serialization, validation, API, search, report, offline, and migration behavior before release.

## Storage Model

Per ADR-0008:

- Canonical fields remain typed relational columns.
- Custom values use a schema-versioned JSONB extension document keyed by stable field IDs.
- Queryable or constrained custom fields are projected to governed typed indexes, search indexes, or analytical models.
- Projection state is reconcilable from authoritative records and metadata.

## Definition Lifecycle

States:

- Draft
- Active
- Deprecated
- Migration Pending
- Retired
- Archived

A field definition cannot be hard-deleted after values exist unless retention and audit policy explicitly allow it.

## Definition Changes

### Safe Changes

- Label, help text, grouping, and ordering
- Adding a non-required field
- Adding an inactive option
- Expanding allowed text length within limits

### Potentially Breaking Changes

- Type change
- Making a field required
- Removing or merging options
- Changing precision, scale, currency, unit, or timezone semantics
- Changing reference target
- Changing sensitivity or visibility
- Disabling offline or API access
- Replacing a stable key

Breaking changes require impact analysis, preview, migration plan, rollback plan, and affected-record counts.

## Permissions

Field access is the intersection of:

- Record-level permission
- Field-definition policy
- Data sensitivity
- Tenant or organization scope
- Workspace and purpose context
- Delegation or support-access restrictions

A user who can read a record may still be unable to read selected custom fields.

## Entitlements and Limits

Commercial entitlements may control:

- Whether custom fields are available
- Number of active definitions
- Advanced field types
- Indexed or reportable fields
- Computed fields
- Industry-pack managed fields
- API, offline, and AI exposure

Entitlements never bypass permissions or validation.

## APIs

Required metadata APIs:

- List extensible record types
- Create and update field definitions
- Activate, deprecate, retire, and migrate fields
- Manage option sets and groups
- Preview impact of definition changes
- Retrieve effective metadata for a context
- Validate a proposed extension payload

Record APIs expose custom values through a stable extension envelope with metadata version and validation errors.

## Search and Filtering

A field must explicitly opt into search, filter, sort, or aggregation.

Controls include:

- Type-appropriate operators
- Indexing quotas
- Tenant isolation
- Permission-aware search projection
- Reindex status and reconciliation
- Protection against unbounded high-cardinality indexes

## Reporting and Analytics

Reportable fields require:

- Stable type and semantic definition
- Historical interpretation rules
- Analytical projection mapping
- Localization and option-label handling
- Currency, unit, date, and timezone semantics
- Deprecated-field behavior

Reports should prefer field IDs and semantic metadata rather than display labels.

## Imports and Integrations

Import and mapping tools may map source columns to canonical or custom fields.

Required controls:

- Metadata version pinning
- Type conversion preview
- Required-field checks
- Option and reference resolution
- Dry run
- Error export
- Idempotent retry
- Provenance capture

Integrations may create field definitions only with an explicit administrative permission and approved namespace.

## Events

Representative events:

- `platform.metadata.field-created.v1`
- `platform.metadata.field-activated.v1`
- `platform.metadata.field-changed.v1`
- `platform.metadata.field-deprecated.v1`
- `platform.metadata.field-migration-started.v1`
- `platform.metadata.field-migration-completed.v1`
- `platform.metadata.projection-reconciled.v1`

Domain events should not include every custom field by default. Event contracts declare which extension fields are permitted and how compatibility is maintained.

## Audit

Audit definition changes, permission changes, sensitive-value changes, migrations, exports, and administrative overrides.

Audit entries should include field ID, record type, previous and new metadata versions, actor, reason, affected scope, and migration result.

## Offline Behavior

Offline-enabled custom fields require a signed metadata lease containing:

- Record type
- Allowed field definitions and versions
- Validation rules
- Option sets
- Visibility and edit permissions
- Maximum payload size
- Lease expiry

Clients may not create arbitrary fields offline. Queued writes are revalidated against current metadata on synchronization.

Definition changes must specify compatibility with clients holding older leases.

## AI Integration

AI tools receive only the custom-field schemas permitted for the current actor, tenant, capability, purpose, and operation.

Requirements:

- Human-readable labels plus stable IDs
- Sensitivity filtering
- Input and output validation
- No automatic exposure of hidden fields
- Provenance when AI proposes or changes a value
- Confirmation and approval for high-impact fields
- Evaluation cases for schema drift and prompt injection through labels or help text

## Industry Packs

Industry packs may publish managed field definitions, groups, layouts, option sets, and validation.

Pack-managed fields:

- Use stable pack namespaces
- Declare dependencies
- Support localization
- Define override policy
- Preserve upgrade compatibility
- Cannot be silently deleted by a tenant if active workflows depend on them

## Customer Experience

Administrators need:

- A field builder with type and impact guidance
- Live preview
- Usage counts
- Search and report cost indicators
- Permission and sensitivity configuration
- Change-impact preview
- Migration status
- Dependency visibility
- Safe retirement workflow

Ordinary users should see custom fields integrated naturally into their workspaces rather than in a separate generic metadata screen.

## Operational Limits

Define per-tenant and per-record limits for:

- Active fields
- Indexed fields
- Option counts
- Payload size
- Computed-field complexity
- Reference depth
- Search cardinality
- Offline metadata size
- AI schema size

Limits must be visible and entitlement-aware.

## Threats and Failure Modes

- Field definitions used to exfiltrate sensitive data
- Labels or option values containing prompt-injection content
- Excessive indexing causing database degradation
- Type changes corrupting historical interpretation
- Hidden required fields blocking imports or offline sync
- Custom references creating domain coupling
- Extension payloads bypassing validation through background jobs
- Tenant-controlled expressions consuming excessive resources

## Validation Scenarios

- A retail pack adds regulated product attributes without a code fork.
- A customer adds a purchase-order project code that is permissioned, searchable, reportable, and exportable.
- A mobile stock-count form validates custom fields offline and reconciles after a metadata update.
- A field type migration previews affected records and rolls back safely.
- An AI assistant sees only custom fields allowed for the current user and tool action.
- A hidden custom field never appears in search, exports, events, or analytics for an unauthorized actor.
