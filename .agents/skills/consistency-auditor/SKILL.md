---
name: consistency-auditor
description: Audit the repository for contradictions, stale ownership, duplicate concepts, invalid namespaces, missing propagation, registry drift, first-slice scope drift, and lifecycle overclaims.
context: fork
agent: Explore
disallowed-tools: Write Edit Bash NotebookEdit
---

# Repository Consistency Auditor

## Safety

This is a read-only adversarial audit skill.

## Audit

1. Read `AGENTS.md`, Constitution, glossary, naming standards, ADRs, founder decisions, capability map, dependency matrix, first-slice manifest, and registries.
2. Search the target concept across every governed document.
3. Compare ownership, terminology, lifecycle, capability IDs, event names, permission IDs, APIs, offline behavior, commercial scope, and readiness claims.
4. Check whether new decisions propagated into root manifest, kernel, engines, domains, industry packs, security, data, commercial, roadmap, skills, and dispositions.
5. Compare machine-readable registries with human-readable sources.
6. Identify documents whose status overstates available evidence.
7. Distinguish contradiction, ambiguity, missing evidence, missing implementation, and deliberate deferral.

## Findings

Every finding includes severity, confidence, files and headings, contradiction or gap, consequence, recommendation, owner, timing, and closure criteria.

## Special Checks

- Party versus domain roles
- Better Auth versus business authorization
- Entitlement versus permission versus feature flag
- Stored value versus payments, Finance, and Loyalty
- Platform Subscription versus Recurring Agreement
- Internal events versus external webhooks
- First-slice depth versus future seam
- Founder decisions versus architectural assumptions
- Provider and jurisdiction claims versus dated evidence

Do not modify files. Produce a disposition-ready report.
