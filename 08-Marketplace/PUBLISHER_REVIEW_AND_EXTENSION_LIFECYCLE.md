---
document_id: PDA-MKT-011
title: Publisher Review and Extension Lifecycle
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Publisher Review and Extension Lifecycle

## Purpose

Define the operational review and lifecycle of marketplace publishers, listings, versions, installations, security advisories, suspensions, and removals.

## Publisher Review

Verify legal identity, ownership, support contact, security history, privacy terms, sanctions and fraud checks where applicable, and agreement acceptance. Tax and payout data collection is Phase 3 only and remains disabled until `08-Marketplace/MARKETPLACE_COMMERCIAL_PHASING.md`, FDR-008, legal/tax review, and provider gates are complete.

## Listing Submission

A submission includes:

- Listing metadata and screenshots
- Extension manifest
- Requested permissions
- Data flows and subprocessors
- Pricing and refund terms
- Supported platform versions
- Test evidence
- Accessibility statement
- Security and privacy documentation
- Support and incident process
- Upgrade and uninstall behavior

## Review Stages

Automated validation, dependency and malware scan, permission review, privacy review, functional sandbox test, accessibility review, commercial review, manual approval, and publication.

## Version Lifecycle

Draft, Submitted, Changes Requested, Approved, Scheduled, Published, Deprecated, Suspended, Removed, and Archived.

## Installation Lifecycle

Pending Approval, Installed, Update Available, Updating, Active, Degraded, Suspended, Uninstalling, Uninstalled, and Data Retention Pending.

## Monitoring

Monitor crashes, API errors, rate limits, data access, security reports, support response, compatibility, ratings, refunds, and customer impact.

## Security Advisory

A publisher must report material vulnerabilities promptly. The platform may disable installation, suspend access, force updates, revoke credentials, and notify customers.

## Removal

Removal defines new-installation block, active-installation behavior, data export, credential revocation, webhooks, stored data, billing, refunds, replacement options, and support period.

## Appeals

Publishers may appeal review or enforcement decisions with evidence. Appeals do not restore risky access automatically.

## Quality Gates

- Repeatable review checklist
- Reviewer separation for high-risk listings
- Sandbox evidence
- Permission and privacy disclosure
- Upgrade and uninstall rehearsal
- Incident contact test
- Customer communication plan
