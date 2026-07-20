---
document_id: PDA-DOM-028
title: Capability Family Contract Readiness Register
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0007, ADR-0016, ADR-0017]
---

# Capability Family Contract Readiness Register

## Purpose

Declare the current admission and contract-readiness state of every registered capability namespace so the breadth of PDA-DOM-021 cannot be mistaken for implementation-ready scope.

This register addresses namespace families, not individual capability completion. It creates no capability, permission, event, API operation, owner, entitlement, roadmap commitment, or first-slice admission. While Draft, it guides documentation remediation and controlled-prototype planning only.

## Authority and Sources

The machine-readable register is `registry/capability-readiness.json`. Its declarations are checked against:

- `registry/domains.json` for namespace ownership and authoritative documents;
- `registry/capabilities.json` for the complete 497-capability catalogue and first-slice membership;
- `registry/first-slice.json` for `full`, `prototype`, `seam`, and explicit deferral scope;
- `registry/permissions.json`, `registry/events.json`, and `openapi/first-slice-v1.yaml` for existing contract surface;
- `registry/first-slice-tests.json` and `evidence/first-slice/` for bounded implementation evidence;
- PDA-DOM-022 for dependency direction;
- PDA-RDM-003, PDA-RDM-005, workstream plans, ADRs, and the Founder Decision Register for admission and lifecycle gates.

When sources conflict, the repository authority order applies. A readiness row never overrides an ADR, owner, first-slice depth, or external gate.

## Readiness States

| State | Meaning | What it does not mean |
|---|---|---|
| `outline` | Ownership and a broad boundary exist; detailed contracts are not admitted. | The listed capabilities are not build-ready. |
| `research` | A governed research question or evidence set exists. | Research is not architecture approval or roadmap admission. |
| `decision-blocked` | A material founder, professional, provider, regulatory, or architecture decision prevents contract commitment. | More prose cannot close the blocker. |
| `contract-planned` | At least one first-slice capability is admitted, but the family contract set is incomplete. | First-slice membership is not implementation or evidence. |
| `workstream-active` | A controlled-prototype workstream is implementing part of the family. | Merged increments do not complete the family or workstream. |
| `prototype-evidenced` | At least one capability has verified controlled-prototype evidence. | Evidence does not generalize to unevidenced capabilities, pilot, or production. |
| `deferred` | The family is outside current delivery scope until its named trigger is met. | The strategic catalogue entry is not a promise. |

## Current Evidence Cutoff

At the 2026-07-16 cutoff, the canonical catalogue contains 497 capabilities across 32 namespaces, 103 first-slice entries, 100 permissions, and 204 canonical events. Only 11 first-slice capabilities have registered evidence: nine `platform.*`, `party.records`, and `security.tenant-isolation`.

The namespace disposition is therefore:

| Readiness state | Namespaces |
|---|---|
| `prototype-evidenced` | `party`, `platform`, `security` |
| `workstream-active` | `catalog`, `inventory` |
| `decision-blocked` | `commercial`, `finance`, `fiscalization`, `payment` |
| `contract-planned` | `commerce`, `crm`, `developer`, `engine` |
| `research` | `ai`, `logistics`, `manufacturing`, `payroll`, `procurement`, `projects`, `rental`, `service`, `warehouse`, `workforce` |
| `outline` | `assets`, `fleet`, `governance`, `knowledge`, `maintenance`, `marketing`, `planning` |
| `deferred` | `loyalty`, `marketplace` |

The detailed register gives every family an admission trigger, named blockers, and evidence references. A family with events but no permissions, or permissions but no implementation, remains at the state supported by the weakest material admission dependency.

## Admission Gate

Before a family moves into `contract-planned` or deeper, the proposed workstream must record:

1. exact capability IDs and owner, with no new prefix unless an ADR registers it;
2. first-slice or roadmap depth and explicit exclusions;
3. authoritative entities, data ownership, classification, retention, privacy, money/time/quantity rules, and correction semantics;
4. commands, queries, OpenAPI operations or internal application contracts, schemas, versioning, idempotency, concurrency, pagination/bulk/resource bounds, and compatibility;
5. canonical events, ordering, retry, replay, projection freshness, and Developer Platform webhook implications;
6. permission IDs, entitlement class, active-context rules, segregation, support/AI/extension authority, and audit;
7. UI, canonical states, responsive behavior, accessibility, white label, and documentation obligations;
8. offline authority, leases, signed messages, numbering, conflicts, tombstones, certainty, limits, and reconciliation, or an explicit reason it is not applicable;
9. failure taxonomy, observability, operational ownership, recovery, migration, rollback, exit, and retained evidence;
10. test matrix, fixtures, performance/capacity budgets, security/privacy review, accessibility review, and workstream exit evidence;
11. founder, customer, legal, regulatory, professional, commercial, provider, certification, and jurisdiction dependencies that documentation cannot supply.

Moving to `workstream-active` additionally requires a governed implementation plan and prototype authority. Moving to `prototype-evidenced` requires at least one exact capability record in `registry/first-slice-tests.json` with evidence paths and complete applicable cells. Neither state authorizes production.

## Change Rules

- Change the curated readiness source and this document together.
- Do not infer readiness from namespace-level event or permission counts.
- Do not lower a blocker because a competitor offers the feature.
- Do not move a family because an implementation file exists without registered evidence.
- Do not bulk-create permissions, events, APIs, or schemas merely to improve apparent coverage.
- A new namespace requires the ordinary ADR and registry process under ADR-0016.
- A first-slice change requires propagation through PDA-RDM-003, `registry/first-slice.json`, contracts, tests, plans, founder decisions, and downstream indexes.
- Preserve external and founder gates as blockers until actual evidence exists.

## Validation

`scripts/validate_capability_readiness.py` verifies exact namespace coverage, owner/authoritative-document agreement, state vocabulary, admission triggers, blockers, evidence-path existence, first-slice/state consistency, prototype-evidence claims, and current capability/permission/event/evidence counts. Seeded tests reject an omitted family, wrong owner, invalid first-slice deferral, unsupported evidence claim, and missing evidence path.

The validator proves registry consistency, not architectural completeness. Domain, security, privacy, accessibility, operations, commercial, legal, regulatory, provider, and customer review remains human and evidence-based.

## Review and Ratification Boundary

PDA-DOM-028 is not a lifecycle promotion. Wave 0 must review the register and validator as governance infrastructure. Each family then moves only through its applicable ratification wave and review record. DCA-005 may be considered structurally implemented when every namespace remains registered with a valid trigger; it is not substantively closed for an admitted family until its required contracts and evidence exist.
