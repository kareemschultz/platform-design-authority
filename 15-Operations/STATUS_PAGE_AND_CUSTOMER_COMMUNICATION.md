---
document_id: PDA-OPS-016
title: Status Page and Customer Communication
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Status Page and Customer Communication

The public status page is an operational communication surface outside the first-slice implementation registry. Its later maturity levels do not expand `registry/first-slice.json` or prove production operations.

## Purpose

Define public and tenant-specific service-status communication for incidents, maintenance, degraded performance, provider outages, recovery, and post-incident reports.

## Status Components

Components map to user outcomes rather than internal infrastructure alone:

- Authentication and access
- Web and mobile applications
- POS and Commerce
- Inventory and warehouse operations
- Payments and provider connections
- Stored value
- Offline synchronization
- Search and reporting
- Files, receipts, and exports
- Integrations and webhooks
- AI assistance
- Administration and support

## Status States

- Operational
- Degraded performance
- Partial outage
- Major outage
- Maintenance
- Recovering and reconciling

“Resolved” is used only after authoritative state, financial and inventory reconciliation, privacy targets, and provider evidence are sufficiently verified.

## Communication Cadence

Provisional targets:

- Severity 1: initial notice within 20 minutes; update every 30 minutes
- Severity 2: initial notice within 45 minutes; update every 60 minutes
- Severity 3: tenant-targeted notice as impact warrants; update at meaningful milestones
- Planned maintenance: notice according to customer terms, with at least 5 business days as the default goal

Security and privacy incidents may require controlled communication that does not expose attack details. Legal and contractual clocks override these operational targets.

## Message Content

Every update states:

- Affected user workflow and scope
- Start and detection time when known
- Current impact
- Workaround, if safe
- Current action
- Data, payment, stored-value, inventory, or privacy uncertainty
- Next update time
- Whether customers must act

Avoid internal jargon, false precision, and unsupported root-cause speculation.

## Tenant-Specific Communication

Use authenticated notices, email, SMS, support cases, or partner channels when impact is limited to named tenants, locations, providers, or regions.

Tenant targeting must not reveal another customer's incident or data.

## Planned Maintenance

Maintenance notices describe affected workflows, expected duration, offline behavior, provider dependencies, customer preparation, rollback, and completion verification.

## Post-Incident Report

For material incidents, publish an appropriate report with timeline, impact, root and contributing causes, remediation, customer action, and prevention work. Security-sensitive details may be withheld while preserving accountability.

## Quality Gates

- Service catalog mapped to status components
- Contact lists tested
- Message templates reviewed for accessibility and localization
- Tenant-targeting tests
- Status updates included in incident exercises
- Resolution requires reconciliation evidence
