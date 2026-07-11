---
name: review-disposition
description: Convert an independent audit or review into a formal disposition matrix, remediation plan, closure criteria, and propagated repository changes.
disable-model-invocation: true
argument-hint: "[review-path]"
---

# Review Disposition

Disposition `$ARGUMENTS` as formal governance input.

## Process

1. Read the complete review and its coverage manifest.
2. Verify each finding against the live branch rather than accepting the summary.
3. Classify each finding: Accepted, Partially Accepted, Rejected with Evidence, Superseded, or Needs Founder/External Decision.
4. Separate architecture closure from implementation, behavioral, legal, provider, customer, and operational evidence.
5. Prioritize Blocker, Critical, High, Medium, Low.
6. Define exact affected documents, owners, timing, and closure criteria.
7. Apply remediation in coherent batches.
8. Propagate changes through ADRs, specifications, capability and dependency maps, registries, skills, indexes, and previous dispositions.
9. Register the review document if it is to become governed.
10. Run validation and registry freshness checks.

## Rules

- File existence is not closure.
- A disposition may not silently downgrade severity.
- Founder and legal decisions remain open until actually decided.
- External evidence must be dated and sourced.
- Behavioral findings require tests or exercises, not prose alone.
- Keep the original review unchanged except for adding required governance metadata through a dedicated maintainer commit.

## Output

Produce a finding matrix, remediation batches, unresolved decisions, changed files, validation evidence, and next independent-review checkpoint.
