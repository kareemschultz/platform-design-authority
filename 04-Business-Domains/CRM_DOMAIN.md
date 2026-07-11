---
document_id: PDA-DOM-007
title: CRM Domain
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# CRM Domain

## Purpose

Own customer and prospect relationship management, sales activity, opportunities, communication history, segmentation, service context, and relationship intelligence.

## Core Capabilities

- Accounts, contacts, prospects, households, and organizations
- Leads, opportunities, pipelines, stages, and forecasts
- Activities, tasks, notes, meetings, calls, and communication history
- Segments, tags, consent, preferences, and marketing eligibility
- Customer 360 views across permitted commerce, service, finance, and loyalty data
- Territory, ownership, assignment, and team selling
- Quotes and handoff to Commerce
- Sales goals, conversion, pipeline health, and activity reporting

## Authoritative Entities

Party Relationship, Lead, Opportunity, Pipeline, Sales Activity, Segment, Consent Preference, Territory, and Relationship Owner.

## Boundaries

Commerce owns sales transactions. Finance owns receivables and credit accounting. Marketing owns campaigns and audience activation. Customer Service owns cases. CRM owns relationship context and sales progression.

## Quality Requirements

- Duplicate detection and merge
- Consent and communication-policy enforcement
- Field-level privacy and masking
- Assignment and territory audit
- Explainable scoring and forecasting
- Mobile-first activity capture
