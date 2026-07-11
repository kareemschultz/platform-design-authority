# Fable 5 Third Audit Prompt — Second-Audit Remediation Verification

Audit the complete repository below as an independent, adversarial architecture, product, security, commercial, regulatory-readiness, and governance reviewer.

Repository: `kareemschultz/platform-design-authority`

Branch: `docs/initial-blueprint`

Starting review head: `67c7d7dfaf1893bad8c01d3339c25f5138ea329a`

Draft pull request: `#1`

The branch may have one later non-governed commit containing this prompt. Record the exact commit SHA you actually audit.

## Primary Objective

Verify whether the remediation of `reviews/FABLE5_SECOND_AUDIT_V1.md` is genuine, propagated, internally coherent, evidenced, and sufficient for the repository to advance beyond controlled technical prototypes.

Do not accept a finding as closed merely because a new file or ADR exists. Trace the decision through all affected foundation, kernel, architecture, engine, domain, industry, security, data, deployment, commercial, roadmap, strategy, registry, agent, and CI documents.

## Required Coverage

Read every governed Markdown document on the branch, plus:

- `README.md`
- `CLAUDE.md`
- `PLATFORM_MANIFEST.md`
- All files under `registry/`
- All scripts under `scripts/`
- `.github/workflows/docs-governance.yml`
- Both Fable audit reports and disposition documents under `reviews/`
- The first-slice manifest and Guyana jurisdiction profile

Produce a file-coverage manifest proving what was reviewed. No sampling.

## Mandatory Verification

### 1. Second-Audit Finding Closure

Re-evaluate every finding SA-001 through SA-031 from `reviews/FABLE5_SECOND_AUDIT_V1.md`.

For each finding state:

- Closed
- Partially closed
- Still open
- Regressed
- Superseded by a better decision

Cite exact file paths and headings. Compare your result to `reviews/FABLE5_SECOND_AUDIT_DISPOSITION_V1.md` and identify inaccurate closure claims.

### 2. Critical Architecture Decisions

Verify the coherence and downstream propagation of:

- ADR-0013 — Commerce owns customer stored value
- ADR-0014 — PII isolation and irreversible pseudonymization
- ADR-0015 — Direct tenant merchant contracts first
- ADR-0016 — Registered namespaces and event conventions

Check especially:

- Commerce, Payment, Finance, Loyalty, Risk, Retail, stored-value, and recurring-commerce boundaries
- Append-only ledgers versus privacy transformations
- Multi-role Party erasure
- Backups, offline devices, webhooks, AI data, search, analytics, and deletion-journal acknowledgements
- Cash, refunds, reversals, settlement, GYD, USD, and multi-currency behavior
- Whether any document silently reintroduces a payment-facilitator, aggregator, custody, pooled-funds, or merchant-of-record model

### 3. Party and Identity

Verify that Better Auth, Party, CRM, Procurement, Workforce, Healthcare, Commerce, and the dependency matrix consistently distinguish:

- Authentication account
- Canonical Party
- Domain role
- Tenant membership
- Permission and entitlement

Look for remaining duplicate identity ownership, merge ownership, or cross-tenant identity correlation.

### 4. First-Slice Scope

Compare:

- `17-Roadmap/FIRST_SLICE_MANIFEST.md`
- `registry/first-slice.json`
- `17-Roadmap/BLUEPRINT_AND_DELIVERY_ROADMAP.md`
- `05-Industry-Packs/RETAIL_PACK.md`
- `05-Industry-Packs/GUYANA_RETAIL_JURISDICTION_PROFILE.md`
- Commerce, Catalog, Inventory, Finance, Security, UX, Testing, Deployment, Operations, and AI documents

Determine whether the first slice is:

- Bounded enough to build
- Complete enough to prove the architecture
- Still too broad
- Missing any indispensable workflow or non-functional requirement
- Accidentally including a production storefront, recurring commerce, broad AI, or full ERP scope

Identify the minimum implementation-ready specifications still required.

### 5. Current Web Research and Fact Verification

Perform fresh web research. Prefer authoritative primary sources, official documentation, statutes, regulators, standards bodies, and vendor documentation.

Verify, as currently available:

- Better Auth features, licensing, SSO, SCIM, 2FA, passkeys, sessions, organizations, API keys, mobile integration, and enterprise dependencies
- Next.js, React, TanStack Query/Table/Virtual/Form/Router/Start, Expo, Expo Router, Expo UI, Node.js, PostgreSQL, Kysely, NestJS/Fastify, Temporal, Redis, NATS, OpenSearch, and Better-T-Stack maturity and support assumptions
- Stripe account and settlement availability relevant to the planned platform legal entity
- MMG merchant, request-to-pay, recurring, refund, reversal, webhook, settlement, sandbox, and disbursement capabilities
- Guyana Revenue Authority tax, VAT, invoice, receipt, filing, and record-retention requirements
- Guyana NIS requirements relevant to later workforce and payroll work
- Bank of Guyana payment-system, merchant-acquiring, electronic-money, AML/CFT, foreign-exchange, aggregation, and licensing material
- Guyana privacy, consumer-protection, electronic-transactions, employment, and statutory-record requirements where official sources are available
- WCAG and relevant accessibility standards
- NIST AI RMF and current AI-risk guidance
- Fiscalization and electronic-invoicing developments relevant to architecture

Where an official source is unavailable, say so. Do not infer that a requirement is absent. Separate:

- Verified fact
- Source limitation
- Inference
- Recommendation
- Legal or regulatory question requiring qualified counsel

### 6. Governance and Automation

Run or independently reproduce:

```bash
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

Verify:

- Cross-platform deterministic output, including Windows path separators
- Document-ID uniqueness
- Related-ADR integrity
- Namespace ownership
- Capability registry completeness
- Event shape, prefix, ownership, duplicates, and source extraction
- First-slice registry validity
- Internal-link validation
- Template and historical-review exclusions
- Strict read-only CI behavior
- No workflow write permission remains

Inspect whether the generated registries faithfully represent the human documents rather than merely passing their own assumptions.

At the starting head, the expected approximate registry scale is:

- 177 governed documents
- 463 capabilities
- 115 canonical events
- 100 first-slice capabilities
- 5 explicitly deferred capabilities

Report the actual counts at the audited head and explain differences.

### 7. Threat, Privacy, Recovery, and Operations

Review the first-slice threat model, data classification, privacy rights, PII erasure, backup and disaster recovery, operations, and testing documents as one system.

Challenge:

- Cross-tenant access
- Support impersonation
- Offline device compromise
- Lost device and non-returning device behavior
- Webhook replay and retained payloads
- Search and vector leakage
- AI prompt injection and data retention
- Provider uncertainty
- Duplicate financial actions
- Stored-value fraud
- Cash reconciliation
- Backup resurrection of erased data
- Restore-time reconciliation
- Incident containment and customer communication

Identify missing diagrams, schemas, tests, runbooks, or control owners.

### 8. UX and Competitive Quality

Assess whether the first-slice UX is likely to be easier than Odoo, ERPNext, and comparable platforms while retaining serious operational depth.

Benchmark the proposed workflows against direct competitors, relevant POS and inventory specialists, and experience leaders. Focus on workflow superiority rather than feature count.

Review:

- Cashier learning time
- Product search and scanning
- Cash and mixed tender
- Returns and refund destination clarity
- Stored-value visibility
- Offline-state clarity
- Register close and deposit
- Inventory counts
- Manager exception handling
- Accessibility
- Mobile and scanner use
- Implementation and migration experience

Recommend measurable Platform Experience Index targets.

### 9. Commercial and Company Readiness

Verify the separation among:

- Platform Subscription
- Tenant Recurring Agreement
- Tenant customer payment
- Platform billing
- Partner and marketplace settlement
- Stored value
- Loyalty value
- Cash collection

Review the unresolved founder decisions in `20-Strategy/FOUNDER_DECISION_REGISTER.md` and identify which architecture or product work must remain blocked until they are answered.

Do not invent the platform legal entity, tax residence, bank accounts, merchant status, or billing currency.

## Required Output

Create one comprehensive report named:

`reviews/FABLE5_THIRD_AUDIT_V1.md`

Do not modify any other repository file.

The report must include:

1. Audited commit SHA
2. Complete coverage manifest
3. Executive verdict
4. SA-001 through SA-031 closure matrix
5. New blocker, critical, high, medium, and low findings
6. Contradictions and ambiguous ownership
7. Missing implementation-ready specifications
8. First-slice scope assessment
9. Security, privacy, recovery, and operations assessment
10. Technology and provider verification
11. Guyana jurisdiction and source limitations
12. UX and competitive assessment
13. Commercial and founder-decision assessment
14. Governance and registry verification results
15. Prioritized remediation: Now, Before Prototype, Before Pilot, Before Production, Later
16. Readiness score by repository section
17. Final readiness decision using this scale:
    - Not ready for implementation
    - Ready only for technical prototypes
    - Ready for one constrained vertical-slice implementation after named blockers
    - Ready for one constrained pilot after named blockers
    - Ready for broader implementation
18. Machine-readable JSON appendix containing every finding with:
    - Finding ID
    - Severity
    - Confidence
    - Status
    - Affected files and headings
    - Evidence
    - Web sources
    - Recommendation
    - Required owner
    - Timing
    - Proposed document action
    - Closure criteria

## Review Standard

Be skeptical, specific, and constructive.

- Cite exact files and headings.
- Verify claims rather than repeating summaries.
- Distinguish architecture closure from behavioral proof.
- Distinguish prototype readiness from legal or production readiness.
- Identify scope that should be removed as readily as missing scope that should be added.
- Do not reward document volume.
- Do not recommend features merely to enlarge the checklist.
- Prefer simplicity, workflow superiority, tenant safety, financial correctness, privacy, recoverability, accessibility, and maintainability.
- Challenge founder and prior-review assumptions when evidence warrants it.
