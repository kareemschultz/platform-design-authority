---
document_id: PDA-REV-017
title: Fable 5 Fifth Audit Repository Restructuring Assessment
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-17
review_evidence: docs/reviews/FABLE5_FIFTH_AUDIT_V1.md
---

# Repository Restructuring Assessment

**Verdict: no restructuring is required.** The audit surveyed the full tree (git ls-files; 36 workspace manifests; docs taxonomy; registries; migrations; evidence) and found the layout sound: package families fully classified with executable rules, one-to-one persistence-owner mapping, no dead packages, no committed build output or oversized artifacts, discoverable docs taxonomy, governed generated-vs-authored boundaries, and intact immutable-evidence discipline.

## Actual items (all small, none structural)

| Item | Class | Action | When |
|---|---|---|---|
| Empty residue dirs `apps/random-app`, `apps/worker-adjacent`, `apps/worker/migrations` created by checker probes (F-B-003) | Defect cleanup | Fix `probe()` teardown; delete the dirs | W2 |
| Dead `apps/web/src/app/dashboard/dashboard.tsx` (F-H-004) | Dead code | Delete | W3 |
| `evidence/audit/` subtree introduced by this audit | Taxonomy note | One line in `docs/README.md`/evidence index naming it the whole-project-audit evidence home | W2 tracking sync |
| `docs/implementation/*DISPOSITION*` vs `docs/reviews/*DISPOSITION*` split | Optional clarity | One-paragraph index note distinguishing per-PR implementation dispositions from audit-family dispositions. **Do not move files** — moves would break registered paths and registration records for zero functional gain | Optional, after W3 |

## Explicitly rejected restructurings (evaluated, unjustified)

- Merging `docs/implementation` into `docs/reviews` or `docs/project`: breaks `registry/documents.json` paths, governance-exemption paths, and dozens of cross-references; benefit is aesthetic only.
- Renaming migration files to sequential names: Drizzle journal owns ordering; committed migrations are immutable by rule.
- Splitting `packages/platform/import-export`: single-owner, cohesive; no boundary violation exists.
- Any move of immutable audit evidence: prohibited by the evidence-integrity rule.

Git-history preservation, reference propagation, and rollback plans are therefore required only for the four small items above, none of which moves a registered document.
