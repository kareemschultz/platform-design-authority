---
document_id: PDA-CIR-024
title: Accounting Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0013, ADR-0016, ADR-0022]
---

# Accounting Implementation Findings

## 1. Purpose

This document translates the accounting competitive-capability matrix, bookkeeping workflow reference, automation policy, and product teardown synthesis into bounded Meridian implementation findings.

It does not replace the future Accounting domain specification or implementation plan. It identifies the capabilities, seams, prototypes, and quality evidence those authorities must address.

## 2. Executive Findings

1. Accounting must remain the canonical financial authority, but most accounting entries should originate from governed business-domain events rather than duplicate user entry.
2. Bank feeds, rules, matching, documents, and AI suggestions are evidence and preparation layers—not the ledger.
3. Reconciliation should be a frequent operational workflow, not merely a month-end report.
4. The review queue is a major opportunity for Meridian differentiation, provided domain authority remains local.
5. Business owners and accountants require different information density and vocabulary over the same canonical records.
6. Corrections must use reversal, adjustment, or explicitly governed reopen workflows; destructive mutation is unacceptable.
7. Multi-company support requires explicit legal-entity, organization, currency, intercompany, consolidation, and authorization semantics.
8. Financial reports must drill to canonical entries and supporting evidence.
9. AI is optional and review-first; deterministic bookkeeping must remain complete.
10. Accounting implementation should be delivered as vertical workflows, not as a giant ledger backend followed by a late UI.

## 3. Required Domain Boundaries

### Accounting owns

- chart of accounts;
- accounting periods and lock state;
- journals and journal entries;
- posting validation;
- general ledger;
- trial balance;
- adjustments and reversals;
- financial statements;
- exchange gains and losses;
- close state;
- accounting policy references;
- consolidation and elimination where implemented.

### Banking or integration capabilities own

- external connection lifecycle;
- provider credentials and consent;
- feed retrieval;
- provider cursor and retry state;
- raw external transaction evidence;
- connection health and errors.

They do not own ledger truth.

### Documents/files own

- file storage;
- malware and content checks;
- retention and access control;
- stable document identity;
- extraction artifacts where appropriate.

Accounting owns whether a document sufficiently supports an accounting decision.

### Business domains own

- sales, purchasing, inventory, payroll, expenses, assets, payments, stored value, projects, and other operational facts;
- domain commands and invariants;
- canonical business events.

Accounting consumes governed contracts and events to produce financial consequences. It must not reach into another domain’s private tables.

### AI platform owns

- provider and model abstraction;
- policy, cost, and usage controls;
- model execution evidence;
- prompt/tool governance;
- evaluation support.

Accounting owns suggestion validity and posting.

## 4. Proposed Capability Families

The future capability registry should evaluate at least these families:

### Foundation

- accounting setup;
- chart of accounts;
- fiscal calendars;
- accounting periods;
- lock dates;
- currencies and rates;
- dimensions and segments;
- journals;
- posting policy.

### Banking and review

- bank connections;
- statement imports;
- bank transactions;
- categorization;
- deterministic rules;
- transaction matching;
- transfer matching;
- splits;
- review queues;
- reconciliation;
- reconciliation reopening;
- connection exceptions.

### Journals and close

- manual journal drafts;
- journal approval;
- recurring journals;
- adjusting entries;
- reversing entries;
- accruals and deferrals;
- period close;
- close checklist;
- close evidence;
- post-close adjustment.

### Assets and currency

- fixed-asset register;
- capitalization;
- depreciation;
- impairment and disposal;
- foreign-currency transactions;
- revaluation;
- realized and unrealized gains/losses.

### Reporting and collaboration

- trial balance;
- general ledger report;
- journal browser;
- profit and loss;
- balance sheet;
- cash-flow statement;
- statement drill-down;
- budget and variance;
- accountant workspace;
- evidence attachments;
- exports;
- audit support.

### Multi-entity

- organization-specific books;
- intercompany transactions;
- due-to/due-from;
- eliminations;
- consolidation;
- organization and group reporting;
- entity-specific close.

## 5. Canonical State Models to Define

The implementation plan should define state machines for:

- bank connection;
- imported transaction;
- categorization proposal;
- match proposal;
- deterministic rule;
- reconciliation session;
- journal draft and approval;
- posted journal;
- reversal;
- accounting period;
- close checklist;
- fixed asset;
- exchange-rate source;
- report snapshot or query result where applicable;
- bookkeeping suggestion;
- review-queue item.

A screen-level status is not sufficient. States require explicit transitions, authorization, idempotency, events, audit, and recovery.

## 6. Accounting Data Integrity Rules

### Double entry

Every posted journal must balance in the journal currency and satisfy configured base/reporting-currency rules.

### Immutability

Posted entries are not destructively edited. Correction uses reversal and replacement, bounded adjustment, or an explicitly governed reopen operation.

### Effective dating

Posting date, document date, transaction date, recognition date, and occurrence time must not be collapsed into one timestamp.

### Period control

Posting checks the current period state at command execution. A UI that was opened before a period locked does not retain permission to post.

### Idempotency

External imports, domain-event consumption, journal creation, and posting require stable command or source identity.

### Concurrency

Approvals, reconciliation, imports, and close operations must reject stale versions and expose a recovery path.

### Provenance

Every derived financial consequence should trace to its owning command, event, user decision, rule or suggestion, and supporting evidence.

## 7. Bank Feed and Import Architecture

A normalized external-transaction model should preserve:

- provider and connection;
- external immutable identifier where reliable;
- account;
- amount and currency;
- transaction and posted dates;
- description and counterparty evidence;
- raw-source reference;
- import batch and cursor;
- pending/posted/reversed provider status;
- duplicate fingerprint;
- provider corrections;
- retrieval time and freshness.

Provider records may change or disappear. Meridian must preserve received evidence and model corrections explicitly.

Manual statement import remains required as a deterministic fallback and migration path.

## 8. Reconciliation Architecture

Reconciliation should use an explicit session or statement scope containing:

- account;
- statement period;
- opening and closing balances;
- source evidence;
- included and excluded transactions;
- matches and adjustments;
- unresolved difference;
- actor and reviewers;
- status;
- completion and reopen evidence.

Required statuses may include:

- Draft
- In Progress
- Blocked
- Ready for Review
- Completed
- Reopened
- Superseded

Completion must be a consequential command with authorization and audit.

## 9. Rule Engine Requirements

Accounting rules need:

- stable identity and version;
- tenant and organization scope;
- priority and deterministic ordering;
- conditions and proposed effects;
- effective dates;
- test mode against historical synthetic-safe data;
- match-count preview;
- overlap/conflict analysis;
- approval and audit;
- disable and supersede;
- performance and effectiveness metrics.

Rules may propose accounting treatment. Final posting remains subject to Accounting validation.

## 10. Review Queue Platform Seam

A shared platform seam may provide:

- assignment;
- priority;
- due date;
- comments;
- evidence links;
- status;
- saved views;
- bulk-selection mechanics;
- notification integration;
- service-level metrics.

The queue must not own:

- accounting posting;
- inventory adjustment;
- payment settlement;
- identity decisions;
- domain-specific validation.

Each queue item references an owning domain command or proposal.

## 11. User Experience Findings

### Business-owner mode

Optimize for:

- what needs attention;
- why it matters;
- financial effect in plain language;
- missing evidence;
- approve, correct, or ask the accountant;
- cash and obligations;
- confidence without jargon.

### Accountant mode

Optimize for:

- keyboard efficiency;
- dense search and filters;
- journals and account detail;
- bulk review with explicit scope;
- period controls;
- evidence and working context;
- multi-client or multi-organization switching;
- exports and reconciliation history.

These are role-shaped experiences over common canonical records, not separate accounting systems.

### Navigation

Suggested accounting workspace:

```text
Accounting
  Overview
  Review
  Banking
  Journals
  Reconciliation
  Close
  Reports
  Settings
```

The exact information architecture requires user research. Avoid exposing every accounting capability in the primary shell.

### Pagination and lists

Use numbered pagination for stable journal, account, period, and report lists where total position matters. Use cursor pagination for changing activity, import, suggestion, or integration-event streams. Avoid infinite scrolling for consequential financial records.

## 12. Reporting Findings

Reports must provide:

- accounting basis;
- organization/entity scope;
- period and comparison;
- currency and exchange-rate basis;
- freshness or as-of time;
- filters and dimensions;
- drill-down to account and journal;
- drill-down to source evidence subject to authorization;
- export and print semantics;
- accessible table alternatives;
- explanation of restatements or reopened periods.

Dashboards may summarize. They do not replace canonical financial reports.

## 13. Event and Contract Implications

Before implementation, define canonical schemas for events such as:

- account created or changed;
- journal drafted, approved, posted, reversed, or rejected;
- accounting period opened, locked, closed, or reopened;
- bank transaction imported or corrected;
- match proposed, approved, rejected, or invalidated;
- reconciliation started, completed, or reopened;
- rule created, tested, activated, or superseded;
- asset capitalized, depreciated, impaired, or disposed;
- exchange revaluation posted;
- close task completed;
- report definition changed where relevant.

Names must follow registered namespaces and must not be added from this research document alone.

## 14. Permissions and Entitlements

Permissions should distinguish at least:

- view accounts and reports;
- manage chart of accounts;
- import bank statements;
- manage bank connections;
- categorize and match;
- create journal draft;
- approve journal;
- post journal;
- reverse journal;
- reconcile;
- reopen reconciliation;
- manage periods and lock dates;
- close period;
- manage rules;
- manage exchange rates;
- manage assets;
- export sensitive financial data;
- administer accounting settings.

Entitlements determine whether the tenant has capabilities such as multi-currency, fixed assets, consolidation, automated feeds, or advanced close. Entitlements never replace user authorization.

## 15. Proposed Implementation Sequence

### Accounting PR1 — Contracts and invariants

- domain vocabulary;
- account and journal contracts;
- posting invariants;
- period model;
- permissions;
- events;
- API and error semantics;
- reporting query contracts.

### Accounting PR2 — Ledger core

- chart of accounts;
- journals and entries;
- posting;
- reversal;
- persistence and migrations;
- outbox atomicity;
- two-tenant tests.

### Accounting PR3 — Periods and close foundation

- fiscal calendar;
- periods and lock dates;
- close checklist seam;
- adjusting and reversing entries;
- current-state validation.

### Accounting PR4 — Banking evidence and import

- connection abstraction;
- normalized external transactions;
- manual import;
- duplicate handling;
- provider correction model;
- deterministic fallback.

### Accounting PR5 — Matching, rules, and review

- matching proposals;
- transfer pairing;
- rule engine;
- review queue integration;
- suggestions and stale-state handling.

### Accounting PR6 — Reconciliation

- reconciliation sessions;
- statement balance proof;
- completion and reopen;
- exception experience;
- audit evidence.

### Accounting PR7 — Reporting

- trial balance;
- general ledger;
- P&L;
- balance sheet;
- cash-flow foundation;
- drill-down and export;
- accessible alternatives.

### Accounting PR8 — Assets, currency, and advanced seams

- fixed-asset prototype;
- multi-currency and revaluation;
- intercompany and consolidation seams;
- explicit deferrals.

### Accounting PR9 — Experience shell and role modes

- business-owner review;
- accountant workspace;
- banking and reconciliation UI;
- journal and report UI;
- responsive/accessibility evidence.

### Accounting PR10 — Verification and closeout

- concurrent posting;
- duplicate import safety;
- reversal conservation;
- period-lock races;
- reconciliation reopen;
- tenant isolation;
- permission and entitlement separation;
- AI-disabled fallback;
- performance and audit evidence.

The final plan may combine or reorder PRs after dependency analysis.

## 16. Required Prototype Scenarios

At minimum:

1. Import the same statement twice without duplicate accounting effect.
2. Correct a provider transaction after an initial match.
3. Categorize a transaction manually and through a rule.
4. Reject and correct an AI suggestion.
5. Match one payment to multiple invoices.
6. Split one bank transaction across accounts and tax treatments.
7. Detect and approve an internal transfer without double-counting income or expense.
8. Reconcile an account with an unresolved difference.
9. Complete and reopen reconciliation with complete audit history.
10. Attempt posting while another user locks the period.
11. Reverse a posted journal and preserve the original.
12. Drill from a financial statement to supporting evidence.
13. Switch organizations without leaking financial data or stale context.
14. Operate core bookkeeping with AI disabled.
15. Export accountant evidence with authorization and redaction.

## 17. Quality Budgets to Define

The implementation plan should establish measured targets for:

- posting latency;
- report query latency by bounded data size;
- import throughput;
- duplicate-detection accuracy;
- reconciliation list performance;
- rule evaluation time;
- suggestion calibration;
- audit completeness;
- maximum stale-context window;
- accessibility conformance;
- export scale;
- recovery time after provider interruption.

Do not copy competitor marketing numbers as Meridian quality budgets.

## 18. Explicit Deferrals

Until separately designed:

- jurisdiction-specific tax filing;
- payroll calculation;
- advanced revenue recognition;
- regulated statutory reporting;
- full consolidation and eliminations;
- treasury and cash management;
- complex hedge accounting;
- insurance accounting;
- banking-core accounting;
- autonomous journal posting;
- production bank-feed provider selection.

Seams may be planned without claiming implementation.

## 19. Required Blueprint Work

Before Accounting implementation begins:

- verify or create the canonical Accounting domain specification;
- reconcile chart-of-accounts and ledger authorities;
- define bank/integration ownership;
- define period and reversal rules;
- map permissions, events, and APIs;
- define the review-queue platform seam or bounded local substitute;
- define reporting and drill-down authority;
- document multi-company and multi-currency semantics;
- create an Accounting implementation plan using current repository structure;
- refresh competitor evidence and direct workflow testing.

## 20. Differentiation Candidates

Candidate claims requiring implementation and user evidence:

- less bookkeeping work without less accounting control;
- every suggestion explains evidence and financial effect;
- reconciliation exceptions are easier to find and resolve;
- reports trace directly to business evidence;
- expert and owner modes share one canonical truth;
- corrections are safe, visible, and reversible;
- business-domain integration avoids duplicate accounting entry;
- essential workflows remain complete without AI.

These are not approved marketing claims.

## 21. Exit Conditions for the Research Wave

The accounting research wave may be marked complete when:

- first-party source references and access dates are recorded;
- material capability claims are revalidated;
- at least the priority product teardowns are deepened or explicitly deferred;
- contradictions and regional/edition limits are documented;
- required blueprint impacts are reconciled;
- implementation findings receive independent accounting and architecture review;
- registries and documentation validation pass;
- no unsupported product-superiority claim remains.
