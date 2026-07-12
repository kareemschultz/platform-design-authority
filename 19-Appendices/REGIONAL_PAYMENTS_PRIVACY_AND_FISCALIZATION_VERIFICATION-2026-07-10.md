---
document_id: PDA-APP-003
title: Regional Payments Privacy and Fiscalization Verification
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
verified_as_of: 2026-07-10
---

# Regional Payments, Privacy, and Fiscalization Verification

## Purpose

Record dated primary-source evidence used by the regional payment, privacy-rights, and fiscalization architecture documents.

These facts can change. Re-verify before implementation, legal commitments, provider contracting, certification, or public pricing.

## Stripe Country Availability

Stripe's official global-availability page states that businesses can open Stripe accounts in the countries and regions listed on that page. Guyana was not present in the published supported-country list reviewed on 2026-07-10.

Implications:

- Do not promise a Guyana-local Stripe merchant account without updated confirmation.
- Stripe may remain usable through a supported foreign entity or another product arrangement, subject to legal, tax, banking, payout, and commercial review.
- The architecture must not require Stripe for all tenant payment processing.

Source:

- https://stripe.com/global

## MMG Guyana Business Services

MMG's official business page states that it provides:

- Merchant services to accept payments into a merchant wallet with reimbursement to a bank or MMG account
- Biller services for customer collections with reporting
- Disbursement services for salaries, supplier fees, reimbursements, and incentives
- Developer API access

MMG's developer page describes:

- Merchant Checkout using an HTTPS redirect flow and callback confirmation
- RSA-encrypted checkout data exchange
- Merchant-Initiated Payments for in-store or POS scenarios where the customer approves or rejects a request

Implications:

- MMG should be evaluated for Guyana merchant checkout, POS payment requests, bill collection, and disbursement.
- Sandbox quality, reconciliation, refunds, settlement, support, fees, onboarding, availability, and production controls still require direct provider due diligence.

Sources:

- https://mmg.gy/business/
- https://mmg.gy/developer/

## EU Privacy Rights

The EU General Data Protection Regulation defines data-subject rights including access, rectification, erasure, restriction, portability, objection, and safeguards regarding certain automated decisions. Applicability and exceptions depend on role, jurisdiction, processing context, and law.

Implications:

- Privacy requests require cross-domain discovery and governed workflows.
- The platform must support exemptions, retention obligations, legal holds, identity verification, and evidence rather than performing blind deletion.
- Jurisdiction packs and legal review determine exact requirements.

Source:

- https://eur-lex.europa.eu/eli/reg/2016/679/oj

## EU VAT in the Digital Age

The Council of the European Union gave final approval to the VAT in the Digital Age package on 11 March 2025. The European Commission states that the package entered into force on 14 April 2025 and is scheduled for progressive implementation through 2035.

The Commission's current timeline includes:

- Member-state ability to introduce mandatory e-invoicing under specified conditions after entry into force
- Digital reporting requirements for specified cross-border B2B transactions from 1 July 2030
- Alignment of domestic digital real-time reporting systems with the EU model by 1 January 2035

Implications:

- E-invoicing and digital transaction reporting are long-term platform architecture concerns.
- Country implementations still require separate jurisdiction specifications and certification.
- The platform should separate tax calculation from statutory signing, submission, acknowledgement, and reconciliation.

Sources:

- https://www.consilium.europa.eu/en/press/press-releases/2025/03/11/taxation-council-adopts-vat-in-the-digital-age-package/
- https://taxation-customs.ec.europa.eu/taxation/vat/vat-digital-age-vida_en

## CloudEvents

The CloudEvents project publishes a specification for describing event data in a common way. It may improve interoperability for external event delivery, but adopting a compatible envelope does not replace platform authorization, event ownership, schema governance, or delivery guarantees.

Source:

- https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md
