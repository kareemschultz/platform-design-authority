# Project Governance and Status

This directory contains lightweight program-control documents. It does not replace the blueprint, ADRs, registries, Architecture Risk Register, GitHub Issues, or pull requests.

## Documents

- `PROGRAM_STATUS.md` — current executive view of blueprint completeness, first-slice implementation, capability evidence, and production readiness.
- `PROGRESS_MEASUREMENT_STANDARD.md` — authoritative rules for calculating and advancing progress.
- `BLUEPRINT_BASELINE_COMPLETION_CHECKLIST.md` — bounded evidence for declaring the implementation-start baseline complete.

## Authority

- GitHub Issues and pull requests remain the live execution and ownership record.
- Blueprint documents and ADRs remain architectural authority.
- Generated registries and contracts remain machine-readable authority.
- The Architecture Risk Register remains the risk-status index.
- `PROGRAM_STATUS.md` summarizes those sources and must never silently contradict them.

## Maintenance

Update the program dashboard when a workstream stage closes, a blocking gate changes, or a material scope decision changes the denominator. Do not update percentages for ordinary commits, issue churn, elapsed time, or documentation volume.
