---
name: technology-evidence-maintainer
description: Verify and maintain current technology versions, compatibility, breaking changes, workarounds, alternatives, and lessons whenever selecting, adding, upgrading, removing, troubleshooting, or documenting a runtime, framework, library, database, provider SDK, deployment target, scaffold, or agent tool.
---

# Technology Evidence Maintainer

Use this workflow before making a time-sensitive technology claim or changing the project stack.

## Read First

- `AGENTS.md`
- `docs/blueprint/14-Engineering/TECHNOLOGY_LIFECYCLE_AND_LESSONS.md`
- Governing ADRs and affected specifications
- Implementation manifests, lockfiles, container files, and compatibility tests when they exist
- `registry/documents.json` and `registry/architecture-rules.json`

## Process

1. Classify the claim: architecture status, current feature, stable version, supported combination, implementation pin, security issue, license, breaking change, or observed behavior.
2. Search current official documentation, release notes, source repositories, security advisories, standards, and vendor support matrices. Never use model memory, a search snippet, generated answer, or unofficial tutorial as final evidence.
3. Record exact versions or supported families, publication and verification dates, source URLs, operating context, limitations, and unknowns.
4. Reproduce compatibility with the smallest safe check: CLI dry-run, package-resolution check, contract fixture, focused integration test, or existing suite. Do not create a production resource or upgrade implementation without authorization.
5. Compare alternatives in order: supported upgrade or pin, standards-based API, maintained compatible dependency, infrastructure adapter, explicit Node sidecar or worker, same application on fallback runtime, then framework replacement.
6. Update the technology register and append a `TECH-LESSON-NNN` entry for a new failure, workaround, breaking change, or reusable technique. Include owner, regression evidence, recheck, and removal condition.
7. Update affected ADRs and specifications if status or boundaries change. Do not promote Proposed or Draft material without review evidence.
8. Regenerate registries and run governance. Run implementation compatibility tests when an implementation exists.

## Evidence Rules

- Distinguish official support, successful installation, local test evidence, and production approval.
- Verify combinations, not only individual components.
- Treat `latest`, beta, preview, canary, and release candidates as time-sensitive and unsuitable for critical paths unless explicitly isolated.
- A workaround needs a regression test or marked pending test, upstream reference when available, owner, and recheck/removal trigger.
- Preserve canonical OpenAPI, schema, domain, tenant, permission, entitlement, privacy, ledger, and offline authorities across stack choices.
- Never record secrets, protected data, credentials, private package URLs, or premium source.

## Required Output

Report verified facts and date, lifecycle status, compatibility gaps, tested mitigation and fallback, documents and lessons updated, validation, and missing evidence.

Run:

```bash
python scripts/generate_registries.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```
