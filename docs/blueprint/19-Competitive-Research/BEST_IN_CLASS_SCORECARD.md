---
document_id: PDA-CIR-012
title: Best-in-Class Comparative Scorecard
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0005, ADR-0016, ADR-0022]
---

# Best-in-Class Comparative Scorecard

## 1. Purpose

This scorecard defines how Meridian compares products and workflows without reducing research to feature counts, popularity, or subjective star ratings.

The scorecard evaluates a named capability in a named context. A product may be excellent for one segment and unsuitable for another. Scores are evidence summaries, not universal rankings.

## 2. Scoring Scale

Each dimension uses a five-point anchored scale:

- **0 — Absent or unusable:** capability unavailable, materially broken, or inaccessible for the evaluated context.
- **1 — Weak:** serious gaps, excessive workaround, poor safety, or unclear ownership.
- **2 — Adequate:** basic workflow works but has notable limitations.
- **3 — Strong:** effective for its target segment with manageable trade-offs.
- **4 — Best observed:** exceptional evidence in the comparison set; still not proof of universal superiority.

Use **N/E — Not Evaluated** rather than guessing.
Use **N/A — Not Applicable** only when the dimension genuinely does not apply.

## 3. Core Dimensions

### User Outcome

Does the workflow reliably achieve the user’s intended result?

### Learnability

Can a relevant first-time user understand and complete the workflow without unnecessary training?

### Expert Efficiency

Can frequent users operate quickly through keyboard, bulk actions, saved views, defaults, and low-friction repetition?

### Information Architecture

Are destinations, ownership, scope, and current context understandable?

### Progressive Disclosure

Is complexity revealed when needed without hiding consequential information?

### Error Prevention

Does the design prevent wrong-scope, duplicate, destructive, or invalid action?

### Recovery and Reversal

Can users understand, retry, correct, reverse, or escalate failures safely?

### State Completeness

Are loading, empty, no-results, denied, unentitled, offline, stale, partial, uncertain, failed, and completed states handled where relevant?

### Accessibility

Is there evidence for keyboard, focus, screen-reader, contrast, zoom, reflow, motion, touch, and non-color semantics?

### Mobile and Device Fit

Does the workflow preserve the task across phone, tablet, desktop, kiosk, scanner, or POS contexts?

### Offline and Degraded Behavior

Does the product honestly handle connectivity, provider failure, queuing, conflict, and recovery?

### Security and Privacy

Are authentication, authorization, scope, sensitive data, audit, and safe defaults visible and credible?

### Auditability and Explainability

Can users and operators explain what happened, why, by whom, under which rule, and with what evidence?

### Automation Quality

Does automation reduce work without silently taking unsafe authority? Are rules, AI, confidence, and override paths understandable?

### Integration and Extensibility

Are APIs, webhooks, imports, exports, plugins, and upgrade boundaries coherent and governable?

### Performance and Reliability

Is the workflow responsive, resilient, observable, and appropriate for the data scale claimed?

### Configuration and Upgrade Cost

How much setup, consultant effort, customization debt, and upgrade risk does the capability introduce?

### Commercial and Lifecycle Clarity

Are plan availability, limits, deprecation, support, release state, and replacement paths clear?

## 4. Domain-Specific Dimensions

Research waves add dimensions only when necessary. Examples:

### Accounting

- double-entry integrity;
- reconciliation quality;
- close controls;
- traceability from source to journal to report;
- multi-entity and currency handling;
- accountant review efficiency.

### Inventory

- movement-ledger integrity;
- reservation and availability clarity;
- receiving and count workflows;
- reversal and correction;
- location and serial/batch handling.

### POS

- cashier speed;
- scanner and touch fit;
- tender correctness;
- offline continuity;
- uncertainty and recovery;
- register and cash controls.

### AI

- provenance;
- explanation;
- approval and autonomy boundary;
- feedback and correction;
- deterministic fallback;
- cost and latency transparency.

## 5. Evidence Weight

A numeric score must include an evidence grade:

- **A:** multiple primary sources plus direct observation or implementation evidence.
- **B:** credible primary documentation with meaningful corroboration.
- **C:** limited primary evidence or mostly indirect observation.
- **D:** anecdotal, inferred, stale, or insufficient; score cannot drive a Meridian decision.

Example: `3B` means Strong with grade-B evidence.

## 6. Weighting

Default weighting is equal. A domain matrix may declare weights before scoring when consequence differs materially.

Weights must:

- sum to 100%;
- be justified by user task and risk;
- remain fixed during a comparison round;
- never be adjusted after seeing results merely to favor Meridian;
- keep accessibility, security, correctness, and recovery from being diluted below minimum gates.

A product failing a mandatory gate cannot be named best-in-class for that context regardless of aggregate score.

## 7. Mandatory Gates

Where relevant, these are pass/fail gates rather than optional points:

- correctness and data integrity;
- tenant and authorization safety;
- accessibility baseline;
- reversible or compensating behavior for consequential actions;
- honest uncertainty and failure states;
- licensing and lawful use;
- audit and evidence requirements;
- no unsupported production or compliance claim.

## 8. Comparison Table Template

| Dimension | Weight | Product A | Product B | Product C | Meridian current | Meridian target | Evidence notes |
|---|---:|---:|---:|---:|---:|---:|---|
| User outcome | 10 | 3B | 4A | 2B | 1A | 4 | ... |
| Learnability | 8 | ... | ... | ... | ... | ... | ... |

Do not calculate a weighted total when more than 20% of weighted dimensions are N/E.

## 9. Interpretation

The scorecard should identify:

- best observed patterns by dimension;
- material weaknesses;
- segment differences;
- contradictory evidence;
- trade-offs;
- table-stakes baseline;
- intentional exclusions;
- Meridian target and validation plan.

The highest total score does not automatically determine Meridian’s design. Architecture ownership, strategy, legality, lifecycle cost, and product philosophy still govern.

## 10. Anti-Gaming Rules

Researchers must not:

- award points for roadmap-only capability;
- treat module count as capability quality;
- compare free and enterprise editions without noting the difference;
- penalize a product for intentionally serving a narrower segment without stating that context;
- use absence of complaints as evidence of excellence;
- convert Mobbin screenshots into accessibility or performance scores;
- infer implementation architecture from visual resemblance;
- score Meridian’s planned target as if it were implemented;
- hide N/E dimensions to improve a total.

## 11. Meridian Target Setting

A Meridian target should be one of:

- **Match table stakes** — adequate parity is sufficient.
- **Adopt best observed** — reproduce the underlying principle through Meridian-owned implementation.
- **Improve materially** — solve a demonstrated weakness better.
- **Invent** — no observed approach satisfies the governed requirement.
- **Exclude intentionally** — capability is outside Meridian scope or strategically harmful.

Each target requires acceptance evidence and a responsible owner.

## 12. Review

Scorecards are reviewed whenever a research wave completes, a major competitor release changes the comparison, or Meridian implementation evidence becomes available. Historical scores remain dated snapshots; they must not be silently overwritten as if the original research never existed.

## 13. Initial Program Target Summary

No cross-product numerical winner is declared because editions, segments, access and N/E coverage are not comparable. The completed waves establish these dated targets instead:

| Domain | Table-stakes target | Improve/Invent target | Gate before claim |
|---|---|---|---|
| ERP administration | context, roles, import, audit, search | task-first breadth without module maze | representative administrator usability |
| supply chain | explicit stock/reservation/receipt/task history | correction and offline concurrency clarity | invariant, performance and device tests |
| POS/payment | fast sale, tender, return, closeout | honest uncertainty and recovery | terminal/provider certification and recovery exercise |
| customer/service | pipeline, queue, SLA, dispatch | Party-safe links and domain-owned remediation | privacy, merge and offline evidence |
| workforce | effective dates, self-service, approval, statements | correction and sensitive-data transparency | qualified jurisdiction and security evidence |
| platform services | search, inbox, metrics, docs, assistance | authority/provenance/fallback across shared surfaces | accessibility, isolation and AI safety evidence |

Meridian current implementation remains N/E for unimplemented capabilities; research targets must not be scored as shipped.
