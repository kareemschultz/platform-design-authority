# Program Progress Measurement Standard

## Purpose

This document defines how Meridian reports progress without confusing documentation coverage, implementation completion, prototype evidence, and production readiness.

A single unqualified percentage is prohibited because it hides materially different states. Program reporting must publish at least these four measures:

1. **Blueprint baseline completeness** — whether the governed architecture set required to begin implementation exists, is internally consistent, indexed, and has no undisposed blocking review finding.
2. **First-slice implementation progress** — completion of WS0–WS7 against their governed exit gates.
3. **Capability evidence coverage** — the proportion of in-scope capabilities with evidence for their required test dimensions and declared depth.
4. **Production-readiness gate progress** — closure of external, legal, security, accessibility, operational, customer, provider, pilot, and founder gates. Prototype code does not automatically advance this measure.

## Status vocabulary

Use only:

- `not-started`
- `planned`
- `in-progress`
- `evidence-pending`
- `complete`
- `blocked`
- `deferred`

`Complete` means the governed exit criteria are evidenced on a merged commit. A merged implementation PR does not make a workstream complete unless its closeout gate is satisfied.

## Blueprint baseline completeness

The blueprint baseline may be reported as **100% complete for implementation commencement** only when all of the following are true:

- Constitution, principles, platform canon, architecture, UX, security, data, AI, commercial, testing, operations, roadmap, and strategy authorities required by the first slice exist.
- Canonical capability, permission, event, endpoint-permission, first-slice, test, architecture-rule, document, and design-token registries are generated and fresh.
- First-slice scope, deferrals, numeric quality budgets, acceptance scenarios, and change control are explicit.
- Material architectural decisions required for the next workstream are Accepted or are covered by a named controlled-prototype exception with review and expiry conditions.
- Audit findings have governed dispositions and unresolved items appear in the Architecture Risk Register.
- There is no known undisposed contradiction that would make implementation unsafe to continue.

This does **not** mean the documentation can never change. New implementation evidence may amend, supersede, or add documents through normal governance. It means the baseline is sufficient and governed, not omniscient.

## Workstream progress

Each workstream has weighted stages:

| Stage | Weight | Evidence |
|---|---:|---|
| Governed implementation plan and contracts | 10% | Plan merged; contract and registry gaps disposed |
| Core/domain implementation | 30% | Runtime-neutral core and application behavior merged |
| Persistence, events, migrations, and integrations | 20% | Owner-specific persistence and atomic event behavior evidenced |
| User experience | 15% | Required real workflow UI implemented and accessibility-tested |
| Automated test dimensions and quality budgets | 15% | Required capability dimensions and numeric budgets evidenced |
| Independent closeout and governance updates | 10% | Exit report, risk/register/roadmap updates, exact-head CI |

A workstream percentage is the sum of completed stage weights. Partial PR counts may be shown as operational detail but are not the authoritative percentage.

## First-slice implementation percentage

WS0–WS7 are not assumed equal in effort. Until measured delivery data replaces estimates, use these provisional weights:

| Workstream | Weight |
|---|---:|
| WS0 Scaffold and contracts | 8% |
| WS1 Identity, tenancy, Party, authorization | 17% |
| WS2 Catalog and inventory | 17% |
| WS3 POS cash | 17% |
| WS4 Stored value | 11% |
| WS5 Offline sync | 12% |
| WS6 Provider adapter | 9% |
| WS7 Recovery and operations | 9% |

The dashboard must show the weights and may revise them only with a recorded rationale. Progress must never be calculated from lines of code, commit count, issue count, or elapsed time.

## Capability evidence coverage

For every capability in `registry/first-slice.json`, report evidence by the 13 dimensions in `registry/first-slice-tests.json`. A capability is not fully evidenced merely because an endpoint exists.

Report:

- required evidence cells;
- evidenced cells;
- blocked or deferred cells;
- evidence pointers;
- depth (`full`, `prototype`, or `seam`).

Do not average away a failed blocking dimension such as tenant isolation, accounting correctness, authorization, privacy, accessibility, or recovery.

## Production-readiness progress

Production-readiness reporting is gate-based, not percentage-of-code-based. At minimum track:

- founder decisions;
- legal and regulatory validation;
- customer evidence;
- provider and sandbox certification;
- security review and penetration testing;
- privacy and retention validation;
- accessibility audit;
- performance and capacity evidence;
- backup, restore, recovery, and incident exercises;
- operational ownership and support readiness;
- pilot outcomes.

Until these are satisfied, the correct lifecycle label remains controlled prototype or another explicitly governed pre-production state.

## Update responsibility

Every workstream closeout PR must update `docs/project/PROGRAM_STATUS.md`. Intermediate PRs update it only when they materially change an evidence-backed stage. The status document must cite merged PRs, issues, governed documents, registries, or test artifacts rather than relying on narrative confidence.
