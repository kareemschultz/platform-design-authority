---
document_id: PDA-COM-001
title: Commercial Architecture Overview
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Commercial Architecture Overview

## Purpose

Define how the platform is packaged, sold, metered, billed, upgraded, downgraded, suspended, white-labeled, resold, and supported without creating separate product codebases.

## Commercial Composition

A customer offer is composed from:

`Base Platform + Domain Bundles + Capability Add-ons + Industry Pack + Usage + Service Tier + Deployment Option`

## Core Principles

1. Plans are commercial bundles, not runtime authorization objects.
2. Runtime access is controlled by versioned entitlements and limits.
3. Permissions remain separate from entitlements.
4. Feature flags remain separate from both billing and authorization.
5. Billing provider state must not be trusted as the sole source of runtime access.
6. Every commercial change must define entitlement timing, proration, data behavior, and customer communication.
7. Customers must be able to understand what they own, use, owe, and will lose before a change takes effect.
8. White-label, partner, marketplace, and direct-sales models must share the same capability architecture.

## Commercial Layers

- Platform editions
- Domain and capability bundles
- Add-ons
- Industry packs
- Usage meters
- AI and automation consumption
- Deployment and data-residency options
- Support and service tiers
- White-label and partner rights
- Marketplace purchases
- Professional services and implementation packages

## Systems of Record

- Product catalog and price catalog: Commercial Catalog Service
- Contracted offer: Contract and Subscription Service
- Runtime access: Entitlement Service
- Usage: Metering Service
- Invoice and payment state: Billing Service and external billing provider
- Revenue share: Partner and Marketplace Settlement Service

## Required Commercial Events

- Offer accepted
- Subscription activated, changed, paused, suspended, resumed, or cancelled
- Trial started, expiring, converted, or ended
- Entitlement granted, changed, or revoked
- Usage threshold approached or exceeded
- Invoice issued, paid, failed, credited, or written off
- Partner commission earned, adjusted, or paid

## Completion Criteria

The commercial architecture is ready when a tenant can buy, trial, upgrade, downgrade, add, remove, exceed, suspend, reactivate, and export without manual code changes or inconsistent access behavior.
