---
document_id: PDA-UX-026
title: Iconography Terminology and Product Content
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Iconography, Terminology, and Product Content

## Purpose

Define icons, labels, action language, status wording, errors, instructions, confirmations, and terminology consistency across product, mobile, documents, notifications, help, and marketing.

## Icon Source

The initial icon source must be open, consistently styled, tree-shakeable, and compatible with web and native implementation. Exact library selection is an implementation decision recorded with license and bundle evidence.

Premium icons may be used only when the license permits the intended products and redistribution.

## Icon Rules

- Use icons to reinforce meaning, not replace necessary text.
- Interactive icons require accessible names.
- Status is never communicated through icon or color alone.
- Use one canonical icon for the same platform concept.
- Avoid culturally ambiguous metaphors when a label is clearer.
- Destructive actions use explicit text and confirmation, not a trash icon alone.
- Financial success icons appear only after authoritative completion.

## Sizes

Provisional sizes:

- Inline: 16 px
- Standard control: 20 px
- Large control or empty state: 24 px
- Illustrative icon: 32–48 px

Stroke weight and optical alignment remain consistent with the selected source.

## Canonical Action Language

Prefer direct verbs:

- Create
- Save draft
- Submit
- Approve
- Reject
- Post
- Complete sale
- Issue refund
- Reverse payment
- Close register
- Reconcile
- Export
- Suspend
- Archive
- Delete personal data

Avoid vague labels such as “Process,” “Proceed,” “Manage,” or “OK” when the consequence can be named.

## Status Language

Distinguish:

- Draft
- Pending
- Processing
- Awaiting customer
- Awaiting approval
- Completed
- Failed
- Uncertain
- Reconciliation required
- Offline
- Stale
- Suspended
- Reversed
- Cancelled

“Failed” is prohibited when an external provider result is unknown.

## Error Message Pattern

Every error states:

1. What happened
2. What remains safe or unchanged
3. Whether retry is appropriate
4. What the user can do next
5. A correlation reference when support may be needed

Example:

> We could not confirm the payment. The sale has not been completed, and you should not start a new charge. Check the payment status or ask a manager to reconcile it. Reference: PAY-…

## Confirmation Pattern

Consequential confirmation states:

- The exact action
- Records or amount affected
- Irreversible or reversible behavior
- Approval or authentication requirement
- Expected next state

Do not use generic “Are you sure?” without explaining the consequence.

## Terminology Governance

The glossary is authoritative for platform concepts. Product language may use customer-friendly labels, but mappings remain explicit.

Examples:

| Canonical concept | Preferred user-facing wording |
|---|---|
| Platform Subscription | Your platform plan |
| Recurring Agreement | Customer membership or recurring agreement |
| Party | Person or organization, depending on context |
| Entitlement | Included capability or plan access |
| Permission | What this user can do |
| Payment Intent | Payment status or payment request |
| Stored Value Instrument | Gift card or store credit |
| Tenant | Business account in ordinary customer UI |

## Localization

Content includes translation context, placeholders, gender or plural considerations, maximum length guidance, and screenshots where layout is complex.

Do not concatenate sentence fragments. Dates, currencies, numbers, names, and addresses use locale-aware formatting.

## Quality Gates

- Terminology lint for protected terms
- Accessible-name review
- Error and recovery usability tests
- Translation context
- Text expansion
- Screen-reader output
- Icon license inventory
- Consistent status wording across UI, API errors, notifications, and documentation
