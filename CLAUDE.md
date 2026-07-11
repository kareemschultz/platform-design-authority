# Platform Design Authority — AI Contributor Instructions

This repository is the architectural source of truth for the modular, white-label, AI-native Business Operating Platform.

These instructions apply to Claude Code and to any AI or automated contributor operating in this repository.

## 1. Authority Order

When documents conflict, use this order and report the conflict explicitly:

1. `00-Foundation/CONSTITUTION.md`
2. Ratified or Accepted ADRs in `18-Decisions/`
3. Approved specifications
4. Proposed ADRs
5. Draft specifications
6. Templates, examples, research notes, and generated artifacts

Never silently choose between conflicting documents. Name the conflict, cite both paths and headings, and request or create a formal disposition.

## 2. Lifecycle Rule

Only documents with an approved or ratified status may direct production implementation.

Documents marked Draft or Proposed are exploration and design input. They may guide prototypes only when the prototype explicitly identifies the draft documents and ADRs it is testing.

Do not change a document status without its required review record and founder or designated authority approval.

## 3. Required Citations in Work

Every implementation plan, pull request, generated specification, or architectural recommendation must cite:

- Relevant `document_id` values
- Relevant ADR numbers
- Capability identifiers
- Affected domains or engines
- Any unresolved contradiction or assumption

## 4. Core Architectural Rules

- Preserve the modular-monolith boundaries in ADR-0002 and ADR-0003.
- A domain owns its authoritative data and behavior.
- Do not import another domain's repositories or mutate another domain's tables.
- Use explicit application contracts and versioned events.
- Use a transactional outbox for reliable business events.
- Enforce tenant scope on every data and command path.
- Check entitlements and permissions separately.
- Feature flags are not permissions or entitlements.
- Configuration is not authorization.
- Better Auth owns authentication and sessions, not business authorization, entitlements, tenant hierarchy, or party records.
- Financial, inventory, payroll, and audit corrections use reversal or compensating records rather than destructive mutation.
- Offline behavior is declared per capability and must define leases, idempotency, conflicts, numbering, and reconciliation.
- AI tools invoke normal application commands and remain permission-, entitlement-, policy-, and audit-aware.

## 5. Naming Rules

Use the canonical mappings in `registry/domains.json`.

Patterns:

- Capability: `<prefix>.<capability>`
- Event: `<prefix>.<entity>.<past-tense-event>.v<major>`
- Permission: `<prefix>.<resource>.<action>`
- ADR: `ADR-NNNN-DESCRIPTIVE-TITLE.md`
- Specifications: uppercase snake case

Do not invent a prefix. Do not use plan names in capability or authorization identifiers.

## 6. Money, Quantity, Time, and Identity

- Store monetary values with explicit currency and approved integer-decimal semantics; never use binary floating point for authoritative amounts.
- Define rounding policy at the correct business boundary.
- Preserve unit of measure and conversion provenance.
- Store timestamps with explicit timezone semantics and preserve the business-local date when legally relevant.
- Use opaque globally unique internal identifiers and separate human-readable references.
- A Better Auth user is not an employee, customer, supplier, or canonical party.

## 7. Change Discipline

Before editing:

1. Read the governing Foundation, ADR, domain, engine, and platform documents.
2. Search for the concept across the repository.
3. Identify the authoritative owner.
4. Check whether a new ADR is required.
5. Check downstream effects on permissions, entitlements, events, APIs, offline behavior, audit, reporting, AI tools, and commercial packaging.

After editing:

1. Update cross-references and registries.
2. Record contradictions or deferred decisions.
3. Validate document IDs and front matter.
4. Add or update review records.
5. Do not claim implementation readiness unless the lifecycle gates are satisfied.

## 8. Decision Classes Requiring an ADR

Create or amend an ADR for changes involving:

- Domain ownership or boundaries
- Authoritative data ownership
- Authentication, authorization, tenancy, or entitlement architecture
- Cross-domain contracts
- Technology stack or deployment architecture
- Persistence strategy for platform-wide primitives
- Offline synchronization semantics
- Public API or event compatibility
- Security or compliance posture
- Commercial behavior that changes runtime access or data retention

## 9. Prohibited Agent Behavior

- Do not resolve contradictions silently.
- Do not create cross-domain database shortcuts.
- Do not copy domain rules into UI code, route handlers, or AI prompts.
- Do not make provider SDKs the platform abstraction.
- Do not generate unscoped administrator access.
- Do not expose secrets, credentials, tokens, or protected personal data.
- Do not mark a document Approved merely because code was generated from it.
- Do not expand scope merely to increase feature count.

## 10. Current Readiness

The repository is currently suitable for controlled technical prototypes, not broad production implementation. The active independent audit and dispositions are under `reviews/`.

When uncertain, stop and report the missing decision rather than inventing one.
