---
document_id: PDA-STR-011
title: Platform Experience Index
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Platform Experience Index

## Purpose

Define a repeatable measurement system for workflow quality, usability, trust, accessibility, implementation effort, and business outcome.

## Dimensions

- Time to first value
- Task success
- Completion time
- Interaction effort
- Error and correction rate
- Learnability
- Accessibility
- Mobile and offline success
- Reliability and recovery
- Trust and explainability
- Support burden
- Configuration effort
- Integration effort
- Customer business outcome

## Workflow Scorecard

Every benchmarked workflow records persona, context, starting state, goal, success criteria, training, steps, clicks, typing, scans, context switches, completion time, error rate, assistance, accessibility, mobile and offline result, reliability, provider dependence, confidence, and competitor comparison.

## Benchmark Protocol

### Study Definition

Before collecting results, pin:

- Workflow and success criteria
- Product, edition, release, configuration, browser, device, network, and data volume
- Persona experience level
- Training and documentation available
- Starting and ending state
- Allowed assistance
- Clock start, pause, and stop rules
- Error and correction definitions
- Accessibility technology and settings
- Currency, locale, timezone, and jurisdiction

### Participants

Provisional minimums:

- Formative usability study: 5 representative participants per materially different persona
- Comparative workflow benchmark: 8 participants per product and persona where human testing is used
- Accessibility workflow review: at least 3 relevant assistive-technology combinations plus expert review
- Unmoderated directional study: 20 valid sessions per variant
- Production decision: use enough observations to report median, p75, p90, success rate, and confidence limits without exposing individuals

Small samples are disclosed and treated as directional rather than universal.

### Competitor Baseline

The initial direct comparator set is governed by `COMPETITIVE_INTELLIGENCE_AND_BENCHMARKING.md` and includes Odoo, ERPNext, and relevant POS or inventory specialists for the workflow under test.

Before freezing first-slice experience budgets, complete reproducible baselines for:

- Store setup and product import
- Cash sale
- Mixed-tender sale
- Return and refund
- Register close and deposit
- Inventory count
- User and role setup
- Custom-field setup
- Dashboard or operational insight review
- Offline operation where supported

Do not score a competitor from marketing material alone.

### Data Treatment

Report:

- Raw task-success count and rate
- Median, p75, and p90 completion time
- Median and range of steps, typing, and scans
- Error and correction rate
- Assistance rate
- Abandonment
- Confidence interval or credible interval where sample size supports it
- Qualitative themes with frequency and severity
- Outliers and exclusion reasons

Do not rely on the arithmetic mean alone for skewed completion times.

### Reproducibility

Store the benchmark script, data fixture, environment, screenshots or recordings where consent permits, evaluator notes, raw de-identified measures, calculation method, and source links.

A later run records whether changes arise from product updates, configuration, participant mix, or measurement method.

## Scoring

Scores remain dimensioned and evidence-backed. A composite index may summarize a workflow, but raw measures, confidence, weights, and limitations remain visible.

Suggested scale:

- 1: unusable or unsafe
- 2: serious friction
- 3: acceptable
- 4: strong
- 5: exceptional

Weighting varies by workflow. POS speed and reliability may outweigh customization depth; payroll correctness outweighs visual novelty.

A composite score is prohibited when any critical safety, accessibility, tenant-isolation, financial-correctness, or completion requirement fails.

## Experience Budgets

First-slice provisional targets are defined in `docs/blueprint/17-Roadmap/FIRST_SLICE_PROVISIONAL_QUALITY_BUDGETS.md`.

Prototype measurements replace assumptions with baselines. Pilot budgets are frozen only after competitor and customer tests, and GA targets require production telemetry.

## Research Methods

- Moderated usability tests
- Unmoderated task studies
- Production telemetry
- Support analysis
- Customer interviews
- Accessibility testing
- Competitor benchmarks
- Implementation observation

## Anti-Gaming

Do not reduce clicks by hiding decisions, combine steps that increase errors, exclude failures, use unrepresentative expert users, optimize averages while ignoring tail latency, or change a competitor's default configuration unfairly.

## Governance

Product and Design own measurement; Engineering supplies instrumentation; Support and Customer Success supply qualitative evidence; the Platform Design Authority approves benchmark definitions.

Every published comparison includes date, product version, evidence quality, limitations, and whether the result was independently reproducible.