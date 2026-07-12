---
document_id: PDA-IND-001
title: Industry Packs Overview
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Industry Packs Overview

## Purpose

Industry Packs assemble reusable platform capabilities into practical, opinionated solutions for specific industries without creating separate source-code products.

## Pack Contents

An Industry Pack may define:

- Recommended and required capabilities
- Default workspace assignments
- Terminology mappings
- Roles and permission templates
- Workflows and approvals
- Rules and automation
- Dashboards, KPIs, and reports
- Forms, documents, labels, and communication templates
- Integrations and hardware profiles
- Compliance and jurisdiction overlays
- Onboarding data and guided setup
- AI skills, prompts, tools, and evaluation sets

## Pack Rules

1. Industry Packs must not own platform or domain source code.
2. Packs may require capabilities but must declare every dependency.
3. Packs may configure canonical concepts but cannot redefine their internal meaning.
4. Customer overrides must be upgrade-safe and separable from the pack baseline.
5. Pack versions require compatibility declarations and migration plans.
6. A tenant may combine multiple packs where dependency and terminology conflicts are resolved explicitly.
7. Pack entitlements are separate from the underlying capability entitlements unless commercially bundled.

## Lifecycle

Draft, Preview, Generally Available, Maintained, Deprecated, and Retired.

## Initial Pack Portfolio

- Retail
- Wholesale and Distribution
- Restaurant and Food Service
- Manufacturing
- Construction
- Field Service
- Hospitality
- Healthcare Operations
- Automotive
- Education
- Nonprofit
- Agriculture
- Government and Public Administration
- Salon and Personal Services
- Professional Services

## Completion Criteria

An Industry Pack is ready for release only when it includes a validated end-to-end onboarding path, role-based workspaces, baseline reports, implementation guidance, sample data, migration approach, and upgrade tests.
