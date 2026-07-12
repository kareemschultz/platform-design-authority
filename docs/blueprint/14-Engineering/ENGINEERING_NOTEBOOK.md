---
document_id: PDA-ENGR-016
title: Engineering Notebook
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Engineering Notebook

An append-only engineering notebook: patterns, mistakes, discoveries, trade-offs, benchmarks, performance experiments, and migration notes that are **not load-bearing enough for an ADR and not a technology-version fact for the lifecycle ledger, but too valuable to lose**.

## Rules

1. Append-only; entries are never rewritten. Corrections are new entries referencing the old one.
2. Every entry: date, author (human or agent), context, observation, and — where applicable — evidence paths.
3. Nothing here is authority. When a note becomes load-bearing, it graduates: technology/version facts to `TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`, decisions to an ADR, defects/risks to the Architecture Risk Register. The graduating PR records the promotion here.
4. Notes must not restate specifications; link instead.

## Entries

### 2026-07-12 — Notebook established
Created as part of the program-plan batch (PDA-RDM-007). Seed observations from the audit/remediation cycles worth keeping visible:

- **Windows contributor friction:** deep checkout paths break Turbopack builds (MAX_PATH); `core.autocrlf` without `.gitattributes` produced 93 phantom lint errors until LF enforcement landed. Linux CI is authoritative; local Windows failures should be reproduced in CI before debugging locally.
- **tsc incremental caches trip CI content scans:** `tsc --noEmit` with Next's `incremental: true` writes `tsconfig.tsbuildinfo` whose `node_modules` path lists false-positive naive greps. Scans must exclude build artifacts by class, not by name.
- **`import.meta.main` dies under tsdown bundling** (module moves into a shared chunk); gate Bun-serve entry points on `"bun" in process.versions` instead.
- **Registry-first governance works:** the generated-registry + freshness-check pattern (documents, capabilities, events, permissions, endpoint-permissions, first-slice, tests) caught real drift repeatedly across four audits; extend the same pattern to any new machine-readable artifact rather than inventing bespoke checks.
- **Line-length between prose and machine artifacts is where drift lives:** every recurring audit-finding class was a prose claim without a machine mirror (chart tokens, endpoint tables, environment names). Default to giving normative claims a lintable home.
