---
document_id: PDA-DOM-017
title: Marketing Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Marketing Domain

## Purpose

Own audiences, campaigns, journeys, marketing content, storefront merchandising content, offers, attribution, consent-aware engagement, and marketing performance across channels.

## Core Capabilities

- Audiences, segments, suppression lists, and eligibility rules
- Campaigns, journeys, triggers, schedules, budgets, and goals
- Email, SMS, push, social, advertising, and direct-mail integration hooks
- Marketing content, landing pages, storefront navigation and merchandising copy, forms, and lead capture
- Offers, coupons, referral programs, and promotion handoff
- Consent, communication preferences, frequency caps, and quiet hours
- A/B testing, holdouts, attribution, conversion, and return-on-spend analysis
- Lead scoring, nurturing, CRM handoff, and sales follow-up
- Customer lifecycle, churn, win-back, and loyalty engagement

## Authoritative Entities

Audience, Campaign, Journey, Marketing Activity, Marketing Content Block, Landing Page, Navigation Definition, Lead Form, Consent Activation, Experiment, Attribution Record, and Marketing Goal.

## Boundaries

- Party owns shared identity and contact points.
- CRM owns customer/prospect relationship context and sales progression.
- Commerce owns transactions, carts, checkout, orders, stored value, and storefront runtime orchestration.
- Product Catalog owns products and channel-publication facts.
- Promotion Engine owns discount calculation.
- Notification Service owns person-directed delivery.
- Developer Platform owns system-to-system webhooks.
- Marketing owns campaign orchestration, landing pages, storefront merchandising content, navigation content, SEO copy, and audience activation.
- Documents and Knowledge owns controlled legal notices, policies, terms, and content requiring formal version acknowledgement.
- Branding owns visual tokens and presentation constraints.

A storefront page may compose Marketing content with controlled Documents content. Each content block retains one authoritative owner, lifecycle, approval policy, and retention class.

## Quality Requirements

- Consent and suppression enforcement
- Recipient and frequency deduplication
- Content approval and brand compliance
- Storefront publishing, rollback, preview, and localization
- Attribution transparency and reproducibility
- Provider failure and bounce handling
- AI-generated content review, provenance, and policy controls
- Privacy transformation and deletion propagation