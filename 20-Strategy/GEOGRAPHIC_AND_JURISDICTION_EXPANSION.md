---
document_id: PDA-STR-023
title: Geographic and Jurisdiction Expansion
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Geographic and Jurisdiction Expansion

## Purpose

Define how the platform enters new countries and regions without hard-coded statutory behavior, unsupported payment promises, or fragmented product forks.

## Expansion Gate

A jurisdiction is production-ready only when the company has verified:

- Legal entity and contracting model
- Tax registration, calculation, invoicing, filing, and record retention
- Payment acceptance, settlement, refunds, disputes, and currency
- Privacy, consumer, employment, and electronic-transaction requirements
- Fiscalization or electronic invoicing
- Payroll and social contributions where offered
- Data residency and cross-border transfer
- Local language, addresses, dates, units, and support
- Provider contracts and operational runbooks

## Jurisdiction Pack

Each pack contains authoritative sources, effective-dated rules, configuration, forms, translations, provider adapters, tests, reviewer, open questions, and change monitoring.

## Market Selection

Evaluate customer access, pain, competitive gap, regulatory effort, provider coverage, support capacity, currency and banking, partner availability, implementation cost, and strategic reuse.

## Stages

Research, prototype, internal validation, professional review, pilot, limited availability, general availability, monitored maintenance, and retirement.

## Regulatory Change

Every pack has a responsible owner and review cadence. Changes create impact assessment, effective-dated configuration, regression tests, customer communication, and migration.

## Regional Strategy

Prefer regional architecture and reusable provider abstractions while accepting that tax, payroll, fiscalization, consumer, and payment rules remain country-specific.

## Exit

If a jurisdiction can no longer be supported, preserve contractual notice, export, retention, migration, support, and legal obligations.
