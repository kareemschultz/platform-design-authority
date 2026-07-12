---
document_id: PDA-MKT-010
title: Marketplace Architecture
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
related_adrs: [ADR-0016]
---

# Marketplace Architecture

## Purpose

Define publishing, review, discovery, purchase, installation, permissions, compatibility, billing, support, suspension, removal, and settlement for the platform marketplace.

## Capability Family

- `marketplace.publishers`
- `marketplace.listings`
- `marketplace.submissions`
- `marketplace.reviews`
- `marketplace.installations`
- `marketplace.licenses`
- `marketplace.compatibility`
- `marketplace.security-advisories`
- `marketplace.ratings`
- `marketplace.settlement`
- `marketplace.suspension`
- `marketplace.removal`

## Marketplace Objects

Publisher, Publisher Agreement, Listing, Listing Version, Extension Package, Review Record, Compatibility Declaration, Installation, License and Entitlement Grant, Purchase or Contract, Rating, Security Advisory, Suspension, Removal, and Settlement Statement.

## Publisher Lifecycle

Application, identity and business verification, agreement, tax and payout setup, sandbox access, certification, active publishing, monitoring, suspension, termination, and archival.

## Submission Review

Review covers manifest and capability ownership, permissions, entitlements, classification, privacy, tenant isolation, supply chain, accessibility, performance, billing, support, upgrade, migration, uninstall, marketing claims, and screenshots.

## Installation

The administrator sees requested access, data use, price, support owner, external services, compatibility, and uninstall consequences before approval. Installation is tenant-scoped and auditable.

## AI Skill and Tool Packs

Publisher-supplied prompts, tools, agents, retrieval sources, or AI skills enter the same Model, Prompt, Tool, and Agent Registries as first-party AI assets.

They must:

- Use registered identifiers
- Pass AI evaluation and red-team gates
- Declare data classifications and providers
- Use ordinary permissions and entitlements
- Remain tenant-scoped
- Suspend immediately when the listing or publisher is suspended
- Participate in privacy erasure and incident response

Marketplace approval never bypasses AI governance.

## Commercial Models

Free, one-time, recurring fixed fee, per-user, per-location, usage based, negotiated private listing, or included partner offer.

Marketplace billing integrates with the Commercial Control Plane. Tenant customer payments remain separate.

## Settlement

Settlement records gross value, platform fee, publisher share, tax, refunds, chargebacks, reserves, payout currency, and status. A marketplace payout model requires provider and legal validation and does not authorize platform custody by default.

## Trust and Safety

The platform may suspend an extension immediately for security, privacy, fraud, legal, availability, AI, or compatibility risk. Customer communication, data termination, replacement, and export are defined.

## Discovery

Search and recommendations use category, capabilities, industry, compatibility, verified quality, support, adoption, and customer context. Paid placement is labeled and cannot override security or relevance.

## Ratings

Only verified installations may rate. Reviews are moderated for abuse without suppressing legitimate criticism.

## Events

- `marketplace.publisher.approved.v1`
- `marketplace.listing.submitted.v1`
- `marketplace.listing.published.v1`
- `marketplace.installation.created.v1`
- `marketplace.installation.removed.v1`
- `marketplace.security-advisory.published.v1`
- `marketplace.listing.suspended.v1`
- `marketplace.settlement.created.v1`

## Quality Gates

- Publisher verification
- Package and dependency scanning
- Manual risk review
- Sandbox certification
- Compatibility tests
- Permission and privacy disclosure
- AI registry and evaluation linkage where applicable
- Installation and uninstall rehearsal
- Incident and support runbook
- Commercial and settlement reconciliation

## Paid-Marketplace Phase Gate

Tax onboarding, settlement, payout, reserves, and paid billing are Phase 3 only, disabled until `MARKETPLACE_COMMERCIAL_PHASING.md`, FDR-008, and legal/provider/custody/refund/reconciliation gates pass.
