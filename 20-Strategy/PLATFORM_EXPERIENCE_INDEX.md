---
document_id: PDA-STR-011
title: Platform Experience Index
version: 0.1.0
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

Every benchmarked workflow records:

- Persona and context
- Starting state
- Goal and success criteria
- Required training
- Steps, clicks, typing, scans, and context switches
- Time and error rate
- Assistance and manager intervention
- Accessibility result
- Mobile and offline result
- Reliability and provider dependence
- User confidence
- Competitor comparison

## Scoring

Scores remain dimensioned and evidence-backed. A composite index may summarize a workflow, but raw measures and confidence remain visible.

Suggested scale:

- 1: unusable or unsafe
- 2: serious friction
- 3: acceptable
- 4: strong
- 5: exceptional

Weighting varies by workflow. POS speed and reliability may outweigh customization depth; payroll correctness outweighs visual novelty.

## Experience Budgets

Each first-slice workflow establishes target budgets before implementation, such as maximum time, error rate, training time, offline failure rate, and accessibility defects.

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

Do not reduce clicks by hiding necessary decisions, combine steps that increase errors, or optimize average time while ignoring failure and tail latency.

## Governance

Product and Design own measurement; Engineering supplies instrumentation; Support and Customer Success supply qualitative evidence; the Platform Design Authority approves benchmark definitions.
