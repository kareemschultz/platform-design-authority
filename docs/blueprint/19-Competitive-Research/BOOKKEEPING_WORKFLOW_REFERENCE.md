---
document_id: PDA-CIR-021
title: Bookkeeping Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0013, ADR-0016, ADR-0022]
---

# Bookkeeping Workflow Reference

## 1. Purpose

This document defines the reference workflow set Meridian should use when designing bookkeeping and accounting implementation. It converts broad feature names into stateful, auditable, correctable user journeys.

It is not the Finance domain specification, API contract, or implementation plan. It identifies the workflows those authorities must support and the evidence later prototypes must produce.

## 2. Governing Principles

1. Posted financial history is corrected, not silently overwritten.
2. Every consequential action has actor, scope, reason, time, evidence, and correlation.
3. Bank data is imported evidence, not automatically accounting truth.
4. Suggestions remain separate from approved accounting decisions.
5. Rules are deterministic, testable, versioned, explainable, and reversible.
6. AI is optional and cannot become the sole path to completion.
7. Multi-entity, multi-currency, tax, and intercompany context must be explicit.
8. Review queues prioritize uncertainty and consequence, not merely recency.
9. Reconciliation is a durable decision with history and reopening rules.
10. Reports derive from canonical accounting state and disclose freshness and scope.

## 3. Canonical State Vocabulary

### Imported financial evidence

- Received
- Normalized
- Duplicate Suspected
- Transfer Suspected
- Unmatched
- Match Suggested
- Category Suggested
- Rule Applied
- Needs Evidence
- Needs Review
- Approved
- Rejected
- Posted
- Reconciled
- Reopened
- Reversed
- Superseded

### Supporting documents

- Missing
- Uploaded
- Extracting
- Extracted
- Extraction Failed
- Linked
- Verified
- Rejected
- Archived

### Accounting periods

- Open
- Soft Close
- Review
- Locked
- Reopened
- Restated

These names are research vocabulary. Final canonical identifiers require domain governance.

## 4. Bank Connection and Import

### 4.1 Connect a bank or payment account

```text
Select provider or import method
→ authenticate or supply file
→ choose account and date range
→ preview source and ownership
→ detect overlap with prior imports
→ confirm connection/import
→ normalize transactions
→ create import receipt
→ route exceptions to review
```

Required behavior:

- server validates tenant and legal-entity context;
- provider credentials remain in an approved secret boundary;
- account ownership and currency are explicit;
- import date range and source are recorded;
- overlapping imports are detected before commit;
- every import receives stable identity and provenance;
- partial provider failure is visible;
- disconnecting a feed does not delete imported evidence.

### 4.2 File import

```text
Upload file
→ parse safely
→ map columns
→ validate account, date, amount, currency, and identity
→ identify duplicates and overlap
→ show valid / warning / rejected counts
→ correct or exclude rows
→ approve import
→ commit normalized evidence
→ retain import receipt and error report
```

Never silently discard invalid rows.

## 5. Transaction Normalization

Normalization should derive a stable imported-transaction representation while retaining original evidence.

Required fields include:

- source account;
- provider or import source;
- external transaction identifier where supplied;
- booking and value dates;
- signed amount and currency;
- original description;
- normalized merchant or counterparty candidate;
- running balance where supplied;
- source category where supplied;
- raw-source reference;
- import receipt;
- normalization version.

Normalization must not create a journal by itself.

## 6. Categorization Workflow

```text
Normalized transaction
→ deterministic exclusions and transfer checks
→ matching candidates
→ rule evaluation
→ AI suggestion when enabled and permitted
→ review when confidence, consequence, or policy requires
→ approve category and accounting treatment
→ generate proposed posting
→ validate balanced journal
→ post
→ audit + event + reporting update
```

The interface should explain:

- suggested account/category;
- why it was suggested;
- rule, prior decision, source evidence, or model path;
- confidence or uncertainty where meaningful;
- tax treatment consequence;
- affected entity and currency;
- proposed debit and credit effect;
- whether approval creates or updates a rule.

## 7. Rules Engine Workflow

### 7.1 Create a rule

```text
Choose example transaction or start blank
→ define conditions
→ define scope
→ preview matching historical transactions
→ define accounting action
→ define review policy
→ test
→ save version
→ activate
```

Conditions may include:

- account;
- merchant/counterparty;
- description pattern;
- amount range;
- currency;
- direction;
- date or recurrence;
- entity or organization;
- source/provider;
- document evidence state.

Actions may include:

- suggest category;
- split transaction;
- identify transfer;
- assign counterparty;
- request evidence;
- route to reviewer;
- create a proposed match;
- never silently perform an irreversible posting beyond the allowed policy.

### 7.2 Change a rule

A rule change must show:

- old and new definition;
- historical match impact;
- future-only versus retroactive behavior;
- affected entities and accounts;
- conflict and precedence changes;
- approval requirement;
- rollback path.

### 7.3 Rule conflict

```text
Multiple rules match
→ evaluate explicit priority and specificity
→ if deterministic winner exists, record path
→ otherwise route to review
→ permit user resolution
→ optionally refine rule definitions
```

No invisible “last rule wins” behavior.

## 8. Matching Workflow

Possible matches include:

- customer invoice payment;
- supplier bill payment;
- expense claim reimbursement;
- payroll payment;
- tax payment;
- loan payment;
- transfer;
- refund;
- chargeback;
- stored-value movement;
- payment-provider settlement;
- existing journal or cash transaction.

```text
Imported transaction
→ retrieve candidates within governed scope
→ score by amount, currency, date, counterparty, reference, and state
→ show top candidates and mismatch reasons
→ user accepts, rejects, splits, or creates new treatment
→ domain validates
→ link evidence
→ post or reconcile
```

A match suggestion must never hide amount or currency differences.

## 9. Transfer Workflow

### 9.1 Same-entity transfer

```text
Debit-side imported evidence
+ credit-side imported evidence
→ transfer candidate
→ confirm accounts and amount
→ handle fees or FX differences
→ link both sides
→ post one balanced treatment
→ reconcile each side
```

### 9.2 Intercompany transfer

```text
Source entity payment
+ destination entity receipt
→ identify separate legal entities
→ select intercompany relationship
→ create due-to / due-from treatment
→ handle currency and timing differences
→ approve both scoped effects
→ post entity-specific journals
→ retain cross-entity correlation
```

A transfer between legal entities is not merely a bank-account transfer.

## 10. Split Transaction Workflow

```text
Transaction selected
→ define split lines
→ assign category/account, amount, tax, counterparty, and evidence per line
→ verify total equals source amount
→ review proposed journal
→ approve
→ post
```

Support:

- amount or percentage entry;
- residual calculation;
- mixed tax treatment;
- personal/business separation where allowed;
- project, department, location, or analytical dimensions;
- correction without deleting source evidence.

## 11. Receipt and Document Capture

```text
Capture/upload/forward document
→ virus and file validation
→ extract merchant, date, amount, currency, tax, and reference
→ show source image beside extracted values
→ detect duplicates
→ suggest transaction matches
→ user verifies or corrects
→ link evidence
→ retain extraction provenance
```

AI or OCR extraction is never treated as verified evidence until policy permits or a user validates it.

## 12. Review Queue

The review queue is a shared operating model, not a shared accounting authority.

### 12.1 Queue families

- Unmatched transactions
- Low-confidence categories
- Missing receipts
- Duplicate suspects
- Transfer suspects
- Rule conflicts
- Tax uncertainty
- Multi-currency differences
- Intercompany differences
- Failed imports
- Reconciliation discrepancies
- Period-close exceptions
- AI suggestions
- Approval requests

### 12.2 Queue item requirements

Each item includes:

- reason for review;
- consequence and amount;
- entity, account, and period;
- age and due date;
- evidence completeness;
- suggestions and rationale;
- policy and permission requirements;
- assignment and ownership;
- available actions;
- audit history.

### 12.3 Prioritization

Priority should consider:

- financial materiality;
- close or filing deadline;
- age;
- uncertainty;
- downstream blocking;
- security or fraud signal;
- customer/vendor impact;
- reviewer role and scope.

Do not prioritize solely by newest first.

## 13. Manual Journal Workflow

```text
Create draft journal
→ select entity, date, period, currency, and reason
→ enter balanced lines
→ attach evidence
→ validate account and dimension rules
→ request approval when required
→ approve
→ post
→ emit audit and event
```

Required controls:

- debits equal credits;
- posting date belongs to an open or authorized period;
- restricted accounts require permission or workflow;
- tax and currency treatment are explicit;
- source and purpose are documented;
- approval separation where policy requires;
- posted journal cannot be silently edited.

## 14. Adjusting and Reversing Entries

### Adjustment

Use when the original posting remains historically valid but a later correction is required.

### Reversal

Use when the accounting effect must be explicitly negated.

```text
Select posted journal
→ choose adjust or reverse
→ explain reason
→ preview financial effect
→ select effective date and period
→ approve
→ post linked correction
→ preserve original
```

The UI must make original, correction, and resulting net effect easy to understand.

## 15. Recurring Journals and Schedules

```text
Define template
→ select frequency and effective range
→ define variable inputs
→ define evidence requirement
→ choose auto-draft or policy-approved posting mode
→ preview schedule
→ approve
→ generate occurrences
→ route exceptions
```

Support pause, resume, supersede, and close without rewriting completed occurrences.

## 16. Reconciliation Workflow

```text
Choose account and statement period
→ establish statement opening and closing balances
→ load imported and book transactions
→ show matched, unmatched, duplicate, transfer, and discrepancy groups
→ resolve exceptions
→ verify difference is zero or explicitly approved
→ approve reconciliation
→ lock evidence snapshot
```

Required history:

- statement identity;
- balances;
- included transactions;
- exclusions;
- adjustments;
- reviewer and approver;
- completion time;
- reopen reason;
- subsequent changes affecting the period.

## 17. Reopen Reconciliation

```text
Request reopen
→ show downstream reports, close, and filings affected
→ require reason and authority
→ reopen bounded scope
→ make corrections
→ re-perform reconciliation
→ preserve prior snapshot and new version
```

Reopening is not deletion.

## 18. Period Close

### 18.1 Close preparation

- all bank accounts reconciled;
- receivables and payables reviewed;
- suspense and clearing accounts reviewed;
- missing evidence addressed;
- recurring and accrual entries posted;
- depreciation posted;
- intercompany differences resolved;
- foreign-currency revaluation completed;
- tax balances reviewed;
- material exceptions accepted explicitly.

### 18.2 Close workflow

```text
Open period
→ readiness checklist
→ exception review
→ adjusting journals
→ reviewer sign-off
→ soft close
→ final reports
→ authorized lock
```

### 18.3 Reopen period

Require:

- explicit authority;
- reason;
- affected reports and filings;
- correction plan;
- audit evidence;
- re-close verification.

## 19. Multi-Currency Workflow

### Foreign-currency transaction

```text
Record source amount and currency
→ capture transaction-date rate and source
→ derive functional-currency amount
→ settle later at settlement rate
→ recognize realized difference
→ retain both currencies and rates
```

### Period-end revaluation

```text
Select open foreign-currency balances
→ retrieve approved period-end rate
→ preview unrealized gain/loss
→ review exceptions
→ approve revaluation journal
→ reverse or carry according to policy
```

Rates require provenance and cannot be silently replaced.

## 20. Fixed Assets and Depreciation

```text
Acquire or identify capitalizable cost
→ classify asset and owner
→ define in-service date, method, life, residual value, dimensions, and evidence
→ approve capitalization
→ generate depreciation schedule
→ post periodic depreciation
→ handle impairment, disposal, transfer, or correction
```

Inventory quantity ownership remains outside Finance. Finance owns financial asset treatment once the appropriate domain event or approved entry exists.

## 21. Budgeting and Forecasting

Distinguish:

- approved budget;
- rolling forecast;
- cash-flow forecast;
- scenario;
- actual results.

A forecast is not ledger truth. Reports must disclose version, assumptions, horizon, and freshness.

## 22. Accountant and Reviewer Handoff

```text
Business owner completes routine work
→ unresolved items collected
→ accountant receives scoped review queue
→ requests evidence or proposes corrections
→ owner or authorized reviewer approves where required
→ accountant closes or returns items
→ tax/report package generated
```

Support:

- scoped access;
- comments and requests;
- evidence links;
- no password sharing;
- stable task ownership;
- visible completion state;
- export and handoff without lock-in.

## 23. Search and Journal Investigation

Search should support:

- amount and range;
- date and period;
- account;
- counterparty;
- description/reference;
- source transaction;
- attachment;
- actor;
- rule;
- journal ID;
- correlation ID;
- entity, organization, or location;
- reconciled and review state.

Search is an accelerator, never the only discoverable route.

## 24. Reporting Workflow

```text
Choose report
→ choose entity, consolidation scope, period, comparison, currency, and dimensions
→ disclose data freshness and close state
→ render report
→ drill to accounts, journals, and source evidence
→ export or share under authorization
```

Required baseline reports:

- Profit and Loss
- Balance Sheet
- Cash Flow Statement
- Trial Balance
- General Ledger
- Account Transactions
- Aged Receivables
- Aged Payables
- Reconciliation Summary
- Journal Report
- Tax Summary seam

## 25. Failure and Recovery Patterns

### Bank feed unavailable

- show last successful import;
- allow safe file import without duplicate creation;
- do not imply accounts are current;
- reconcile once service returns.

### Partial import

- commit only under explicit partial-success policy;
- preserve failed rows and retry identity;
- never duplicate successful rows.

### AI unavailable

- deterministic rules and manual review continue;
- no essential workflow disappears;
- pending suggestions remain traceable.

### Posting failure

- no partial journal;
- retain draft and error evidence;
- retry with stable command identity.

### Report stale

- disclose freshness and pending updates;
- prevent misleading “final” presentation during incomplete close or projection lag.

## 26. Required First-Party Prototype Evidence

Before Accounting can claim prototype exit, prove:

- duplicate-safe bank import;
- deterministic rule evaluation and conflict handling;
- explainable category suggestion;
- invoice/bill/transfer matching;
- balanced posting atomicity;
- correction through adjustment or reversal;
- reconciliation and reopen history;
- lock-date enforcement;
- multi-currency source/rate preservation;
- review-queue prioritization;
- tenant and entity isolation;
- permission and entitlement separation;
- audit and attachment redaction;
- AI-disabled completion;
- responsive and accessible critical workflows;
- export and accountant handoff.

## 27. Competitor Research Mapping

Priority teardown targets by workflow:

| Workflow | Priority products |
|---|---|
| Automation and categorization | Kick, QuickBooks, Xero, Zoho Books |
| Bank reconciliation | Xero, QuickBooks, Zoho Books, Sage |
| Open-source extensibility | Akaunting, ERPNext, Odoo |
| Invoicing and expenses | FreshBooks, Wave, QuickBooks, Xero |
| Accountant workflow | Xero, QuickBooks, Sage, NetSuite |
| Multi-entity and intercompany | Kick, Odoo, Sage, NetSuite |
| Close and advanced accounting | Sage, NetSuite, Odoo, ERPNext |
| Small-business simplicity | Kick, Wave, FreshBooks, Akaunting |

## 28. Meridian Differentiation Hypothesis

Meridian can differentiate by providing:

- automation that explains itself;
- one coherent review operating model;
- accountant-grade evidence without accountant-only language;
- correction and reversal as normal workflows;
- visible context across tenant, entity, organization, location, account, and period;
- strong multi-entity and intercompany foundations;
- complete operation without AI;
- consistent audit, permissions, attachments, search, and canonical states across every financial workflow.

These remain hypotheses until implementation and user evidence validate them.

## 29. Next Artifacts

This workflow reference feeds:

- `AUTOMATION_AND_AI_BOOKKEEPING.md`;
- `ACCOUNTING_PRODUCT_TEARDOWNS.md`;
- `ACCOUNTING_IMPLEMENTATION_FINDINGS.md`;
- the future Finance implementation playbook;
- future capability, permission, event, API, UX, and quality-budget changes.

## 30. Research Sources and Limits

The workflow is a Meridian synthesis, not a claim that one product implements it end to end. Official public sources were revalidated 2026-07-16:

- [Xero reconcile bank transactions](https://www.xero.com/us/accounting-software/reconcile-bank-transactions/) — documented reconciliation pattern; region and edition vary.
- [QuickBooks Online reconciliation](https://quickbooks.intuit.com/learn-support/en-us/help-article/reconciliation/reconcile-account-quickbooks-online/L5rOz7Kew_US_en_US) — documented reconciliation pattern; no usability claim.
- [Odoo 19 bank reconciliation](https://www.odoo.com/documentation/19.0/applications/finance/accounting/bank/reconciliation.html) — documented ERP workflow; configured implementation untested.
- [ERPNext accounting](https://docs.frappe.io/erpnext/user/manual/en/accounting) — documented open-source workflow; version and deployment vary.
- [NetSuite banking and reconciliation](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_156820249909.html) — documented enterprise workflow; authenticated tenant unavailable.

Pricing, bank-feed availability, tax, payroll, fixed assets, AI behavior, multi-company consolidation, country coverage and close policy remain volatile or incomplete. Confidence is high for Meridian control requirements and medium or low for product parity.
