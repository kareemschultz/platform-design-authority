# Project Governance and Status

This directory contains lightweight program-control documents. It does not replace the blueprint, ADRs, registries, Architecture Risk Register, GitHub Issues, or pull requests.

These documents are deliberately outside the governed document registry and are non-authoritative. Where a summary conflicts with a governed source, the source wins and the summary must be corrected.

## Documents

- `PROGRAM_STATUS.md` — current executive view of blueprint completeness, first-slice implementation, capability evidence, and production readiness.
- `PROGRESS_MEASUREMENT_STANDARD.md` — provisional reporting convention for calculating and advancing progress.
- `BLUEPRINT_BASELINE_COMPLETION_CHECKLIST.md` — bounded evidence for declaring the implementation-start baseline complete.
- `STATUS_UPDATE_TEMPLATE.md` — evidence checklist for a workstream-stage or readiness-gate update.
- `GITHUB_PROJECTS_OPERATING_GUIDE.md` — deployed tracking metadata, permission limitations, and the target GitHub Projects design; it must distinguish configured state from planned state.
- `GOVERNANCE_REMEDIATION_PROGRAM_PLAN.md` — the founder-approved 2026-07-20 remediation program for enforcement gaps, doc fragmentation, stranded work, and tracking automation; checked off only on merged evidence. Completed 2026-07-21.
- `DECISION_AND_RATIFICATION_PROGRAM_PLAN.md` — the founder-approved 2026-07-21 program closing every decidable decision, repairing authority-status honesty and cross-document contradictions, adding enforcement validators, batching founder-only decisions, and starting the ratification waves; gated on Codex concurrence before phase execution; checked off only on merged evidence.

## Authority

- GitHub Issues and pull requests remain the live execution and ownership record.
- Blueprint documents and ADRs remain architectural authority.
- Generated registries and contracts remain machine-readable authority.
- The Architecture Risk Register remains the risk-status index.
- `PROGRAM_STATUS.md` summarizes those sources and must never silently contradict them.

## Maintenance

Update the program dashboard when a workstream stage closes, a blocking gate changes, or a material scope decision changes the denominator. Do not update percentages for ordinary commits, issue churn, elapsed time, or documentation volume.
