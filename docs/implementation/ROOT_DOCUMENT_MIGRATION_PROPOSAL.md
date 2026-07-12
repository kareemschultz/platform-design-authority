# Repository Layout Migration Record

Status: Executed on the ADR-0025 migration branch; merge and post-merge validation remain the completion gate.

Owner: Platform Design Authority with Developer Platform and Operations.

## Purpose

Record the migration from a root-level architecture tree plus nested `meridian/` scaffold to one conventional monorepo root with repository prose organized beneath `docs/`.

## Pre-migration layout

```text
/
├── 00-Foundation/ ... 20-Strategy/
├── docs/implementation/
├── reviews/
├── templates/
└── meridian/
    ├── apps/
    ├── packages/
    ├── ops/
    └── package.json
```

The old shape was valid for blueprint-only development but created two operational roots after the scaffold arrived.

## Canonical layout

```text
/
├── apps/
│   ├── docs/
│   ├── native/
│   ├── server/
│   └── web/
├── packages/
├── ops/
├── docs/
│   ├── blueprint/
│   │   ├── 00-Foundation/
│   │   └── ... 20-Strategy/
│   ├── implementation/
│   ├── reviews/
│   └── templates/
├── openapi/
├── schemas/
├── registry/
├── scripts/
└── package.json
```

## Authority and content boundaries

- `docs/blueprint/` contains governed architecture and keeps all document IDs and lifecycle metadata.
- `apps/docs/content/docs/` contains product-facing prose compiled by Fumadocs; it does not duplicate the blueprint.
- `docs/reviews/` preserves immutable audit contents. Registrations and dispositions use current paths; audit text remains historically unchanged.
- `docs/implementation/` contains non-authoritative scaffold and migration evidence.
- `openapi/`, `schemas/`, and `registry/` remain machine-consumed contracts and indexes at root.
- Root `AGENTS.md` and `CLAUDE.md` remain contributor authority for the entire monorepo.

## Execution sequence

1. Captured pre-move `main` SHA `215885b3cf1607d693ec799194d3723d37fe4553`.
2. Moved 485 tracked files in a move-only commit with zero content changes.
3. Removed the obsolete ignored wrapper after verifying it contained only `node_modules` and `.turbo`.
4. Updated active paths in governed sources, dispositions, app guidance, scripts, schemas, curated registries, workflows, and agent instructions.
5. Excluded immutable audit evidence from content substitution.
6. Added ADR-0025 and updated ADR-0021.
7. Regenerated derived registries from moved authoritative sources.

## Required validation

```bash
python scripts/generate_registries.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
git diff --check
bun install --frozen-lockfile
bun run check
bun run check-types
bun run test
bun run build
```

The migration also requires Drizzle migration freshness, PostgreSQL 18.4 smoke testing, Compose validation, Docker image builds, live stack health, synthetic authentication, Fumadocs navigation/build validation, and stale-path scans.

## Rollback

- Before merge: abandon the dedicated branch.
- After merge: revert the migration PR as one unit, regenerate registries from restored paths, and rerun both workflows.
- Do not partially restore old paths or leave compatibility copies that create two authorities.

## Historical links

External links to old paths may require GitHub commit permalinks. The repository does not keep duplicate source files solely as redirects. Historical audit evidence continues to describe the layout evaluated at its issue date.
