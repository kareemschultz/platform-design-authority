---
document_id: PDA-STR-002
title: Founder Decision Register
version: 0.5.0
status: Draft
owner: Founder
last_reviewed: 2026-07-17
---

# Founder Decision Register

## Purpose

Record business decisions architecture cannot safely infer. Recommendations remain provisional until explicit founder ratification and required professional review.

## FDR-001 — Initial Tenant Payment Operating Model

**Status:** Open — recommended and provisionally adopted.

Recommended: direct tenant-provider merchant contracts under ADR-0015. The platform supplies software and adapters. Each tenant contracts directly with its bank, wallet, or acquiring provider. The platform does not initially pool, custody, settle tenant funds, act as payment facilitator, or act as merchant of record.

**Ratification required before:** production provider selection, contracts, or public payment-service claims.

## FDR-002 — Platform Operating Legal Entity

**Status:** Open — critical path.

Decide:

- Legal entity name and jurisdiction
- Source-code and trademark ownership
- Customer contracting and invoicing entity
- Tax registration and banking
- Staff and contractor engagement
- Data-controller and support obligations
- Caribbean and international expansion structure

**Block:** billing provider, marketplace paid phase, merchant-of-record, platform payout, and several provider contracts cannot be ratified before qualified legal and tax review.

## FDR-003 — Platform Billing and Settlement Currency

**Status:** Open with operating assumptions.

Known requirements:

- GYD is first-class.
- USD and additional currencies are supported.
- Tenant transactions may use multiple currencies and split tenders.

Decide platform invoice currencies, bank and settlement currencies, FX source, rounding, gains/losses, tax-invoice presentation, and refund policy.

## FDR-004 — First Retail Beachhead Scope

**Status:** Ratified on 2026-07-17.

**Decision owner:** Founder.

**Decision evidence:** [Issue #81, owner approval comment 5008157609](https://github.com/kareemschultz/platform-design-authority/issues/81#issuecomment-5008157609).

The ratified first slice is the bounded Guyana retail foundation scope in `FIRST_SLICE_MANIFEST.md` (PDA-RDM-003) and `registry/first-slice.json` schema version 2.1.0: POS, catalog, inventory, cash/register control, Party/customer basics, stored value, prototype tax pack, payment adapter seam, audit, entitlements, permissions, offline continuity, and Finance handoff. The registry's `full`, `prototype`, and `seam` depths are target delivery depths; they are not claims of current implementation or production readiness.

The production native storefront, customer recurring agreements, memberships, advanced loyalty, full General Ledger, financial statements, self-checkout, and autonomous AI are outside the first slice.

This ratification closes the founder scope decision identified by F-L-003. It does not promote the Draft manifest or implementation plan, authorize a pilot or production deployment, or remove their legal, provider, security, accessibility, operational, and evidence gates.

**WS3 entry condition:** do not start WS3 until (1) the separate P-W2a WS2 closeout synchronization is merged, (2) the FDR-005 repository disclosure review is complete, and (3) the customer-evidence gate records at least 8 structured interviews and 3 workflow observations across at least 3 businesses, as directed in the same founder approval. The customer evidence must be retained real-world evidence; agents cannot generate, simulate, infer, or waive it.

## FDR-005 — Repository Visibility and Documentation License

**Status:** Open — provisional public visibility approved on 2026-07-17; final path classification and licensing remain undecided.

**Decision owner:** Founder.

**Decision evidence:** [Issue #81, owner approval comment 5008157609](https://github.com/kareemschultz/platform-design-authority/issues/81#issuecomment-5008157609).

**Current operating decision:** the repository may remain public only as a provisional disclosure posture while the required review is completed. Public availability is not evidence that every path has been classified for disclosure, that the documentation or source has been licensed for reuse, that security-sensitive detail is suitable for publication, or that public contribution is accepted.

Until final ratification, every change must continue to exclude secrets, customer or partner identities, private premium-source code, license keys, private download URLs, production credentials, exploitable production security detail, and material that contractual, legal, privacy, security, or licensing review has not cleared. A public repository does not waive copyright, confidentiality, trademark, privacy, or third-party license obligations.

Decide:

- Public thought leadership versus private competitive asset
- Paths safe for public disclosure
- Temporary reviewer access
- Documentation license
- Contribution policy
- Security and roadmap redaction

No secrets, customer identities, private premium-source code, license keys, or production security details may be committed regardless of visibility.

**Ratification trigger:** complete and record a repository/path disclosure and redaction review before WS3 starts, before publishing a documentation or source license, before soliciting external contributions, and before intentionally adding customer, provider, production-topology, security-control-gap, or commercially sensitive roadmap detail. The review must identify public, restricted, and prohibited paths; assign an owner for ongoing classification; and disposition security, commercial, legal, privacy, trademark, premium-source, and contribution-policy concerns.

If that review is not complete at the trigger, WS3 remains blocked and affected material must stay out of the public repository or move to an approved restricted location; provisional visibility is not automatic approval to disclose it.

## FDR-006 — Platform Payment Terminal Strategy

**Status:** Open.

Decide whether the first paid pilot supports:

- Cash only plus wallet/request-to-pay
- Customer-owned standalone terminals with manual reference entry
- Semi-integrated terminals
- Fully integrated terminals
- No card-terminal commitment until a certified provider exists

Required evidence: named pilot need, provider support, certification, settlement, refund/reversal behavior, offline behavior, device support, cost, and legal review.

## FDR-007 — Initial Provider Coverage Beyond MMG

**Status:** Open.

Decide which provider categories are required before pilot:

- MMG or another wallet/request-to-pay provider
- Card/acquiring provider
- Bank transfer or payment-link provider
- Email and SMS providers
- Identity enterprise provider
- Tax or fiscal provider

A category may be represented by a simulator until the pilot requires production certification.

## FDR-008 — Marketplace Paid Phase

**Status:** Open; free-listings-first is recommended.

Decide whether and when the platform may bill for publisher listings or execute publisher payouts. Phase 3 requires the legal entity, tax model, contracting role, payout provider, accounting, refunds, chargebacks, reserves, sanctions, and regulatory review.

Until ratified, the marketplace supports private and free listings or direct publisher billing only.

## FDR-009 — Premium UI and Marketing Asset Governance

**Status:** Operating direction accepted; license scope verification remains required.

Direction:

- Tailwind and source-owned shadcn/ui form the web UI foundation.
- Magic UI Pro and shadcn/studio premium assets may accelerate marketing and selected product surfaces.
- Private credentials, license keys, and prohibited redistributable bundles remain outside the public repository.

Before implementation, confirm the purchasing person or entity, permitted products, seats, redistribution, and renewal terms.

## FDR-010 — Platform SaaS Cash Receivables and Agent Collection

**Status:** Open — cash collection for Platform Subscription invoices is disabled until decided.

Decide whether the platform operating entity will ever accept physical cash for its own SaaS invoices and, if so, define the legal entity, authorized collector or agent model, receipt and numbering controls, segregation of duties, custody and deposit deadlines, insurance, fraud and variance handling, accounting application, tax treatment, reconciliation, reversals, customer disputes, audit retention, and jurisdiction limits.

Until ratified, tenants may not treat platform staff, partners, resellers, or implementation personnel as authorized cash collectors for Platform Subscription invoices. This decision is separate from tenant customer cash handled by Commerce.

**Ratification required before:** publishing a cash-payment option, appointing a collector, accepting physical funds, or implementing agent receivables.

## FDR-011 — Commercial Product Name and Public Package Scope

**Status:** Open — internal codename accepted; commercial naming and public package scope remain unverified and undecided.

**Decision owner:** Founder.

**Decision evidence:** [Issue #81, owner approval comment 5008157609](https://github.com/kareemschultz/platform-design-authority/issues/81#issuecomment-5008157609).

**Current operating decision:** accept ADR-0026's use of **Meridian** as the internal engineering codename and `@meridian/*` as a provisional private-workspace package scope. Neither is approved as a commercial product name, tenant-visible brand, public package scope, npm organization, domain, trademark, app-store identity, or public API namespace. Canonical capability, event, permission, schema, and public contract identifiers remain codename-independent.

Decide and evidence:

- Commercial product and company-facing brand names, including white-label presentation rules
- Trademark clearance in intended jurisdictions and relevant classes, with qualified legal review
- Company, product, and defensive domain availability and registration authority
- npm organization and package-scope availability, ownership, recovery, and publishing controls
- Relevant source-hosting organization, app-store, social, and other public identity availability
- Migration from `@meridian/*` if the provisional scope is unavailable or unsuitable

The dated baseline in `PRODUCT_NAMING_AND_PACKAGE_SCOPE_AVAILABILITY-2026-07-17.md` (PDA-APP-026) records that none of these availability or clearance checks had been performed as of 2026-07-17. Absence of a recorded conflict is not evidence of availability or legal clearance.

**Ratification triggers:** complete the relevant checks and record the selected name/scope before any commercial product-name announcement, tenant-visible use of "Meridian," domain registration or launch, public package publication, npm organization claim, public SDK naming, app-store submission, trademark filing, or external contract or marketing claim that depends on the name. Revisit the decision if a conflict, refusal, challenge, acquisition, market expansion, or white-label requirement changes the evidence.

Until ratified, public packages must not be published under `@meridian/*`; a verified alternative scope may be selected without changing canonical identifiers or source-directory names.

## Governance

A decision closes only when:

1. Selected option, owner, effective date, and status are recorded.
2. Affected ADRs and specifications are updated.
3. Required legal, tax, regulatory, security, accounting, and commercial evidence is attached.
4. Contradictory assumptions are removed.
5. The decision is represented in implementation and customer claims.

Architecture documents reference this register rather than inventing business facts.
