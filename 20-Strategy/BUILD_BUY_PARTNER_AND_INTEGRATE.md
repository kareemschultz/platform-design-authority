---
document_id: PDA-STR-024
title: Build Buy Partner and Integrate
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Build, Buy, Partner, and Integrate

## Purpose

Define how the company decides whether a capability belongs in the core platform, an external provider, a partner solution, an acquisition, or a marketplace extension.

## Decision Criteria

- Strategic differentiation
- Data and workflow ownership
- Security and regulatory exposure
- Time to value
- Total cost and operating burden
- Regional availability
- Reliability and support
- Portability and exit
- Extensibility
- Customer willingness to accept an external dependency

## Build

Build when the capability is central to platform differentiation, requires deep cross-domain integration, or cannot be trusted to an external dependency without unacceptable risk.

## Buy

Buy commodity infrastructure or mature specialist capability when integration and exit are acceptable and building creates no durable advantage.

## Partner

Partner when market access, implementation, local regulation, devices, services, or specialist knowledge matters more than ownership.

## Integrate

Use provider-neutral adapters when multiple rails, regions, or customer choices are expected. The platform owns the internal state and reconciliation context.

## Acquire

Acquisition requires strategic fit, technology and data due diligence, team fit, customer obligations, integration plan, security review, and a credible path away from permanent product fragmentation.

## Decision Record

Every material decision records problem, options, evidence, cost, risk, lock-in, data handling, fallback, exit, owner, and review date.

## Guardrails

- Do not build regulated infrastructure casually.
- Do not outsource authoritative business identity unintentionally.
- Do not buy a provider abstraction that prevents portability.
- Do not partner without customer ownership and support clarity.
- Do not acquire a product without a platform-integration thesis.
