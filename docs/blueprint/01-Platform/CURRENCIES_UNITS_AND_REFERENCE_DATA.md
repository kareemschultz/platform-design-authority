---
document_id: PDA-PLT-014
title: Currencies Units and Reference Data
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Currencies, Units, and Reference Data

## Purpose

Define shared reference data and calculation rules used by commerce, inventory, finance, payroll, manufacturing, logistics, reporting, and integrations.

## Scope

- Currencies and decimal precision
- Exchange rates and rate sources
- Units of measure and conversions
- Countries, regions, languages, and time zones
- Tax and commodity classification references
- Calendars, fiscal periods, and holidays
- Controlled code lists and enumerations

## Rules

1. Monetary values must store currency explicitly and use approved decimal precision and rounding policy.
2. Exchange-rate calculations must record source, rate type, effective time, direction, and precision.
3. Original transaction currency and converted accounting or reporting currency must both remain traceable.
4. Units of measure must belong to compatible dimensions before conversion.
5. Conversion factors, tolerances, packaging relationships, and rounding must be effective-dated where needed.
6. Reference data must be versioned and must not silently reinterpret historical records.
7. Tenant overrides are allowed only where the owning standard permits them.
8. External standards and code lists require update, deprecation, and mapping procedures.

## Currency Capabilities

- Tenant base and reporting currencies
- Legal-entity functional currency
- Transaction and settlement currencies
- Buy, sell, average, contractual, and statutory rates
- Revaluation support hooks
- Cash denomination definitions

## Unit Capabilities

- Quantity, mass, volume, length, area, time, temperature, and custom dimensions
- Base and alternative units
- Product-specific packaging conversions
- Purchase, stocking, manufacturing, and selling units
- Catch weight and variable-measure support hooks

## Governance

Reference changes must identify owner, source, effective date, affected domains, migration need, and backward-compatibility impact.

## Quality Gates

- Currency precision and rounding tests
- Exchange-rate reversal and triangulation tests
- Unit compatibility tests
- Historical-reference preservation tests
- Import and integration mapping tests
