---
name: adr-author
description: Create or revise an Architecture Decision Record for ownership, boundaries, stack, persistence, offline, security, privacy, payments, commercial runtime, public contracts, or deployment decisions.
disable-model-invocation: true
argument-hint: "[decision-topic]"
---

# ADR Author

Author an ADR for `$ARGUMENTS` only when the decision changes durable architecture or ownership.

## Read First

- `docs/blueprint/00-Foundation/CONSTITUTION.md`
- `docs/blueprint/00-Foundation/DECISION_FRAMEWORK.md`
- `docs/templates/ADR_TEMPLATE.md`
- Existing ADRs with related scope
- Affected specifications, capability map, dependency matrix, founder decisions, and audit findings

## Process

1. State the problem and why a decision is required now.
2. Identify decision owner and whether founder, legal, tax, security, or regulatory review is required.
3. Describe realistic options, including do-nothing and deferral where relevant.
4. Compare options against explicit decision drivers.
5. Record the selected decision, consequences, controls, validation, revisit triggers, and migration implications.
6. Use the next available ADR number and required filename pattern.
7. Update all affected documents and `related_adrs` references.
8. Run validation and registry freshness checks.

## Rules

- Do not use an ADR to invent a business fact the founder has not decided.
- Do not describe a provider prototype as an architectural commitment.
- Do not close legal or regulatory uncertainty through technical prose.
- Preserve rejected options and negative consequences.
- Status begins Proposed unless governance explicitly authorizes otherwise.

## Output

Report ADR number, selected decision, rejected options, affected files, unresolved external decisions, and validation result.
