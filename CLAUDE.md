# Platform Design Authority — AI Contributor Instructions

This repository is the architectural source of truth for the modular, white-label, AI-native Business Operating Platform.

These instructions apply to Claude Code, Codex, and every AI or automated contributor operating in this repository.

## 1. Authority Order

When documents conflict, use this order and report the conflict explicitly:

1. `00-Foundation/CONSTITUTION.md`
2. Ratified or Accepted ADRs in `18-Decisions/`
3. Approved specifications
4. Proposed ADRs
5. Draft specifications
6. Founder decision register for unresolved business-authority questions
7. Templates, examples, research notes, reviews, and generated artifacts

Never silently choose between conflicting documents. Name the conflict, cite both paths and headings, and request or create a formal disposition.

Generated registries are indexes, not higher authority than their source Markdown.

## 2. Lifecycle Rule

Only Approved, Accepted, or Ratified documents may direct production implementation.

Draft and Proposed documents are exploration and design input. They may guide controlled prototypes only when the prototype identifies the exact documents and ADRs it tests.

Do not change a document status without the required review record and founder or designated authority approval.

## 3. Required Citations in Work

Every implementation plan, pull request, generated specification, or architectural recommendation must cite:

- Relevant `document_id` values
- Relevant ADR numbers
- Capability identifiers
- Event and permission identifiers where applicable
- Affected domains, platform services, security areas, or engines
- First-slice inclusion or deferral
- Unresolved founder, legal, regulatory, commercial, or provider assumptions

## 4. Mandatory Repository Lookups

Before inventing an identifier or boundary, consult:

- `registry/domains.json`
- `registry/documents.json`
- `registry/capabilities.json`
- `registry/events.json`
- `registry/first-slice.json`
- `04-Business-Domains/DOMAIN_DEPENDENCY_MATRIX.md`
- `20-Strategy/FOUNDER_DECISION_REGISTER.md`

Do not edit generated registries by hand. Update the authoritative document and run:

```bash
python scripts/generate_registries.py
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

## 5. Core Architectural Rules

- Preserve the modular-monolith boundaries in ADR-0002 and ADR-0003.
- A domain owns its authoritative data and behavior.
- Do not import another domain's repositories or mutate another domain's tables.
- Use explicit application contracts and versioned events.
- Use a transactional outbox for reliable business events.
- Enforce tenant scope on every data, cache, search, job, event, export, offline, and AI path.
- Check entitlements and permissions separately.
- Feature flags are not permissions or entitlements.
- Configuration is not authorization.
- Better Auth owns authentication and sessions, not business authorization, entitlements, tenant hierarchy, Party, or domain-role records.
- Party owns canonical shared real-world identity; domains own customer, supplier, employment, and other role-specific records.
- Financial, inventory, payroll, stored-value, and audit corrections use reversal or compensating records rather than destructive economic mutation.
- Privacy transformation follows ADR-0014: isolate PII, preserve lawful business facts, and propagate through the deletion journal.
- Commerce owns customer stored value under ADR-0013. Payment orchestrates tender; Finance accounts and reconciles; Loyalty owns non-cash value.
- Initial tenant payments use direct tenant-provider contracts under ADR-0015. Do not introduce custody, pooling, sub-merchants, payment-facilitator, aggregator, or merchant-of-record behavior.
- Offline behavior is declared per capability and defines leases, idempotency, conflicts, numbering, privacy tombstones, and reconciliation.
- External webhooks belong to the Developer Platform, not Notifications or the internal Event Backbone.
- AI tools invoke normal application commands and remain permission-, entitlement-, classification-, policy-, approval-, privacy-, quota-, and audit-aware.
- Essential first-slice workflows remain deterministic and usable with AI disabled.

## 6. Naming Rules

Use the canonical mappings in `registry/domains.json` and ADR-0016.

Patterns:

- Capability: `<namespace>.<capability>`
- Event: `<namespace>.<entity>.<past-tense-fact>.v<major>`
- Permission: `<namespace>.<resource>.<action>`
- ADR: `ADR-NNNN-DESCRIPTIVE-TITLE.md`
- Specifications: uppercase snake case

Do not invent a prefix. Do not use plan names in capability or authorization identifiers. Do not use provider names in business identifiers.

Use `Platform Subscription` for the platform's SaaS contract and `Recurring Agreement` for a tenant's recurring customer contract. Do not use the bare term `Subscription` when the layer is ambiguous.

`engine.<engine-name>` registers a shared engine. Detailed capabilities for registered engine families use their dedicated namespaces, such as `ai.*`, `loyalty.*`, and `fiscalization.*`.

## 7. Money, Quantity, Time, and Identity

- Store monetary values with explicit currency and approved integer-decimal semantics; never use binary floating point for authoritative amounts.
- Define rounding policy at the correct business boundary.
- GYD is a first-class operational currency. USD and other currencies require explicit policy; never infer currency from symbol alone.
- Preserve unit of measure and conversion provenance.
- Store timestamps with explicit timezone semantics and preserve the business-local date when legally relevant.
- Use opaque globally unique internal identifiers and separate human-readable references.
- A Better Auth user is not an employee, customer, supplier, or canonical Party.
- A stored-value instrument is not a payment credential, loyalty account, bank deposit, or receivable.

## 8. Current First-Slice Scope

The current bounded scope is `17-Roadmap/FIRST_SLICE_MANIFEST.md` and `registry/first-slice.json`.

Included areas center on:

- Better Auth, tenancy, Party, permissions, entitlements, audit, privacy, devices, and offline sync
- POS, register, cash, returns, stored value, catalog, inventory, and financial handoff
- Guyana-first currency, payment, tax, and fiscalization seams
- Backup, restore, testing, UX, accessibility, operations, and tenant isolation

Explicitly deferred by default:

- Production native storefront
- Tenant Recurring Agreements
- Payment-facilitator or platform-custody model
- Broad autonomous AI
- Full delivery of every business domain

Do not add deferred scope without updating the First Slice Manifest, registry, dependencies, estimates, and founder decision record.

## 9. Change Discipline

Before editing:

1. Read the governing Foundation, ADR, domain, engine, platform, security, roadmap, and founder-decision documents.
2. Search for the concept across the repository.
3. Identify the authoritative owner.
4. Check whether a new ADR or founder decision is required.
5. Check downstream effects on Party, permissions, entitlements, events, APIs, offline behavior, audit, privacy, reporting, AI tools, recovery, operations, and commercial packaging.
6. Check first-slice inclusion or deferral.

After editing:

1. Update every affected authoritative document, not only the new file.
2. Update cross-references and source registries through the generator.
3. Record contradictions, open assumptions, and deferred decisions.
4. Run governance and registry checks.
5. Add or update review dispositions.
6. Do not claim implementation readiness unless lifecycle gates are satisfied.

## 10. Decision Classes Requiring an ADR

Create or amend an ADR for changes involving:

- Domain, engine, platform-area, or data ownership
- Authoritative record or ledger ownership
- Authentication, authorization, tenancy, Party, or entitlement architecture
- Cross-domain contracts
- Technology stack or deployment architecture
- Persistence strategy for platform-wide primitives
- Offline synchronization semantics
- Public API, event namespace, or compatibility policy
- Security, privacy, payment-operating, or compliance posture
- Commercial behavior that changes runtime access, custody, settlement, or data retention

Business facts that architecture cannot infer belong in `20-Strategy/FOUNDER_DECISION_REGISTER.md`.

## 11. Prohibited Agent Behavior

- Do not resolve contradictions silently.
- Do not create cross-domain database shortcuts.
- Do not copy domain rules into UI code, route handlers, provider adapters, or AI prompts.
- Do not make provider SDKs the platform abstraction.
- Do not generate unscoped administrator or support access.
- Do not expose secrets, credentials, tokens, or protected personal data.
- Do not mark a document Approved merely because code was generated from it.
- Do not expand scope merely to increase feature count.
- Do not assume a payment rail supports recurring debit, refunds, disputes, or settlement features unless verified.
- Do not claim a statutory, tax, fiscal, privacy, or regulatory behavior is production-ready from an unverified Draft jurisdiction profile.
- Do not treat AI output, search results, cache entries, or offline projections as current authorization or authoritative business state.

## 12. Current Readiness

The repository is suitable for controlled technical prototypes, not broad production implementation.

The active audit reports and dispositions are under `reviews/`. The second-audit remediation closes major ownership and propagation gaps, but founder decisions, Guyana authoritative evidence, detailed first-slice schemas, threat-model artifacts, and formal review waves remain required before implementation readiness changes.

When uncertain, stop and report the missing decision rather than inventing one.