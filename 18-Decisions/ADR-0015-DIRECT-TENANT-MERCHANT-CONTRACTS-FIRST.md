---
document_id: ADR-0015
title: Use Direct Tenant Merchant Contracts for the Initial Payment Model
version: 0.1.0
status: Proposed
owner: Platform Design Authority
created: 2026-07-10
last_reviewed: 2026-07-10
supersedes: null
superseded_by: null
---

# ADR-0015 — Use Direct Tenant Merchant Contracts for the Initial Payment Model

## Context

The platform must support tenant businesses accepting cards, wallets, bank transfers, MMG, cash, and other regional rails. Two fundamentally different operating models exist:

1. The platform contracts with providers and onboards tenants as sub-merchants or beneficiaries, potentially acting as an aggregator, payment facilitator, settlement intermediary, or regulated payment-service participant.
2. Each tenant contracts directly with its acquiring bank, wallet, or payment provider, while the platform supplies software, tenant-scoped credential storage, transaction orchestration, reconciliation, and reporting.

The first model can simplify onboarding but materially increases KYC, AML/CFT, sanctions, safeguarding, settlement, licensing, chargeback, reserve, and operational obligations. The platform's exact legal entity and regulatory permissions are not yet ratified.

## Decision Drivers

- Minimize unplanned custody and regulatory exposure
- Reach Guyana and Caribbean merchants through provider-neutral adapters
- Preserve tenant choice of bank, wallet, and acquiring relationship
- Avoid holding or commingling tenant funds
- Support cash-heavy retail operations
- Preserve a later path to a regulated facilitator model if commercially justified

## Decision

For the initial release, each tenant contracts directly with its payment providers and financial institutions.

The platform acts as software and orchestration infrastructure, not as merchant of record, payment facilitator, money transmitter, electronic-money issuer, settlement custodian, or sub-merchant aggregator.

The platform may:

- Store tenant-scoped provider credentials and configuration in the Secrets service
- Initiate provider operations on the tenant's behalf
- Receive and verify provider webhooks
- Maintain operational payment state
- Reconcile provider settlement reports against tenant transactions
- Produce accounting and exception outputs
- Support cash, bank transfer, wallet, card, account, and stored-value tenders

The platform must not in the initial model:

- Receive customer funds into a platform-owned settlement account
- Pool tenant funds
- Promise settlement timing independently of the provider
- Create sub-merchants under a platform master merchant account
- Perform regulated onboarding or KYC as a substitute for the provider
- Represent itself as licensed for payment services without formal approval

## Cash

Cash is a first-class tender and reconciliation rail, not an absence of a provider.

The platform supports:

- Cash drawer and register accountability
- Cash sales, refunds, paid-outs, and change
- Expected-versus-counted reconciliation
- Safe drops and transfers
- Bank deposit preparation and confirmation
- Cash collection by authorized agents or resellers where contractually permitted
- Suspense and variance workflows

Cash collected for the platform's own SaaS invoices requires a separate receivables and agent-collection policy and must not be confused with tenant customer payments.

## Provider Capability Contract

Every provider adapter declares support for:

- Merchant ownership model
- Interactive checkout
- Request-to-pay
- Tokenization
- Unattended or recurring collection
- Authorization and capture
- Void, reversal, refund, and partial refund
- Dispute and chargeback behavior
- Settlement timing and currency
- Fees and reserves
- Payout reporting
- Webhook or polling model
- Sandbox and certification

A consuming workflow may use only capabilities verified for that provider and tenant contract.

## Regional Regulatory Gate

Before any future facilitator, aggregator, wallet, stored-funds, or platform-settlement model is designed, obtain written legal and regulatory analysis covering at minimum:

- Guyana's national payments framework and Bank of Guyana oversight
- AML/CFT and sanctions obligations
- Merchant acquiring and sub-merchant rules
- Electronic-money or stored-funds rules
- Safeguarding, settlement, reserves, complaints, and reporting
- Cross-border and foreign-currency flows
- Card-network and provider rules

The Bank of Guyana public website was under maintenance during the July 2026 research pass, so this ADR intentionally does not claim a licensing interpretation.

## Consequences

### Positive

- Lower initial regulatory and treasury complexity
- Clear separation of tenant and platform funds
- Easier provider portability
- Tenant controls settlement relationship
- Supports local rails that require direct merchant agreements

### Negative

- Merchant onboarding is less unified
- Each provider may require separate tenant contracts and credentials
- Support and reconciliation vary by provider
- The platform cannot promise one global settlement experience initially

## Revisit Triggers

Reconsider only when:

- A licensed sponsor or acquiring partner offers a compliant program
- Legal review confirms the operating model
- Unit economics justify compliance and operational cost
- Customer demand materially exceeds direct-contract friction
- Safeguarding, reserves, disputes, KYC, and audit operations are fully designed

## Validation

Validate with one tenant directly contracted to a wallet or provider, one cash-heavy retailer, tenant-scoped credential rotation, provider settlement reconciliation, a refund or reversal, and a failed-settlement exception.