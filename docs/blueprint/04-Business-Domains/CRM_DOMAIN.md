---
document_id: PDA-DOM-007
title: CRM Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
related_adrs: [ADR-0007]
---

# CRM Domain

## Purpose

Own customer and prospect relationship management, sales activity, opportunities, communication history, segmentation, service context, and relationship intelligence without duplicating canonical Party identity.

## Core Capabilities

- Customer, prospect, household, and account roles attached to canonical Parties
- Leads, opportunities, pipelines, stages, and forecasts
- Activities, tasks, notes, meetings, calls, and communication history
- Segments, tags, consent, preferences, and marketing eligibility
- Customer 360 views across permitted commerce, service, finance, loyalty, and stored-value data
- Territory, ownership, assignment, and team selling
- Quotes and handoff to Commerce
- Sales goals, conversion, pipeline health, and activity reporting

## Authoritative Entities

Customer Relationship Profile, Prospect Profile, Lead, Opportunity, Pipeline, Sales Activity, Segment, Consent Preference, Territory, and Relationship Owner.

The canonical Party, Party Relationship, addresses, contact points, identifiers, and cross-role duplicate resolution are owned by Party and Relationship Management, not CRM.

## Boundaries

Party and Relationship Management owns shared real-world identity and merge decisions. CRM may propose duplicate candidates and request a governed Party merge, but it cannot merge canonical Parties independently.

Commerce owns sales transactions and customer stored value. Finance owns receivables and credit accounting. Marketing owns campaigns and audience activation. Service owns cases. CRM owns customer/prospect role context, sales progression, and relationship intelligence.

## Quality Requirements

- Duplicate detection through Party matching and governed merge requests
- Consent and communication-policy enforcement
- Field-level privacy and masking
- Role-scoped erasure and retention under ADR-0014
- Assignment and territory audit
- Explainable scoring and forecasting
- Mobile-first activity capture