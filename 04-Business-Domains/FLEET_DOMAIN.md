---
document_id: PDA-DOM-015
title: Fleet Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Fleet Domain

## Purpose

Own vehicle and mobile-equipment operations, assignment, compliance, usage, fuel, inspections, telematics, maintenance coordination, incidents, and fleet performance.

## Core Capabilities

- Vehicles, trailers, mobile equipment, specifications, ownership, and status
- Driver eligibility, assignment, licenses, certifications, and restrictions
- Odometer, engine hours, fuel, charging, tolls, and operating costs
- Pre-trip, post-trip, safety, and regulatory inspections
- Registration, insurance, permits, renewals, and compliance alerts
- Telematics, GPS, geofences, diagnostics, and provider integrations
- Accidents, incidents, claims, fines, damage, and corrective action
- Utilization, availability, replacement planning, and total cost of ownership
- Dispatch and route coordination hooks
- Maintenance integration with Assets and Maintenance

## Authoritative Entities

Vehicle, Fleet Assignment, Driver Qualification, Vehicle Inspection, Fuel Transaction, Telematics Reading, Fleet Incident, Registration, Insurance Policy, and Fleet Compliance Obligation.

## Boundaries

Assets and Maintenance owns maintenance execution. Workforce owns worker identity and employment. Supply Chain owns shipment and route planning. Finance owns accounting and fixed assets. Fleet owns vehicle operations and compliance.

## Quality Requirements

- Location-data privacy and retention
- Odometer and fuel anomaly detection
- Driver eligibility enforcement
- Mobile and offline inspections
- Telematics reconciliation and provider outage handling
- Incident, claim, and compliance auditability
