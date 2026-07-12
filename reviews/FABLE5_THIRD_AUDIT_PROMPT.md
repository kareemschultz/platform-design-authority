# Fable 5 Third Audit Prompt — Complete Blueprint Verification

Audit the complete repository below as an independent, adversarial architecture, product, UX, AI, developer-platform, marketplace, engineering, security, commercial, regulatory-readiness, operating-model, and governance reviewer.

Repository: `kareemschultz/platform-design-authority`

Branch: `docs/initial-blueprint`

Starting review head: `8bc700c62f7c41ebf2b0ce9d21f2fdb6e0b0902e`

Draft pull request: `#1`

The branch may contain one later non-governed commit updating this prompt. Record the exact commit SHA you actually audit.

## Primary Objective

Verify whether the full blueprint is coherent, sufficiently complete for the next stage, correctly scoped, evidence-driven, and internally propagated. Re-evaluate the second-audit remediation and audit the newly completed AI, developer platform, marketplace, UX, engineering, deployment, operations, testing, competitive-intelligence, Business DNA, recipe, and company-handbook books.

Do not accept a subject as complete merely because a file exists. Evaluate depth, ownership, contradictions, implementability, operational burden, security, usability, evidence, and missing contracts.

## Required Coverage

Read every governed Markdown document on the branch, plus:

- `README.md`
- `CLAUDE.md`
- `PLATFORM_MANIFEST.md`
- Every file under `.claude/skills/`
- Every file under `registry/`
- Every script under `scripts/`
- `.github/workflows/docs-governance.yml`
- All Fable reports, prompts, and dispositions under `reviews/`
- All templates

Produce a complete file-coverage manifest. No sampling.

## Mandatory Verification

### 1. Second-Audit Finding Closure

Re-evaluate every finding SA-001 through SA-031 from `reviews/FABLE5_SECOND_AUDIT_V1.md`.

For each finding state:

- Closed
- Partially closed
- Still open
- Regressed
- Superseded by a better decision

Cite exact file paths and headings. Compare the result with `reviews/FABLE5_SECOND_AUDIT_DISPOSITION_V1.md` and identify inaccurate closure claims.

### 2. Critical Architecture Decisions

Verify the coherence and downstream propagation of:

- ADR-0013 — Commerce owns customer stored value
- ADR-0014 — PII isolation and irreversible pseudonymization
- ADR-0015 — Direct tenant merchant contracts first
- ADR-0016 — Registered namespaces and event conventions

Check Commerce, Payment, Finance, Loyalty, Risk, Retail, stored value, recurring commerce, Party, privacy, backups, offline devices, webhooks, AI data, cash, refunds, settlement, GYD, USD, and multi-currency behavior.

Identify any document that silently reintroduces payment facilitation, aggregation, pooled funds, custody, sub-merchants, or merchant-of-record behavior.

### 3. Party, Identity, Authorization, and Entitlements

Verify that Better Auth, Party, CRM, Procurement, Workforce, Healthcare, Commerce, the permission catalog, the dependency matrix, and the first-slice contracts consistently distinguish:

- Authentication account
- Canonical Party
- Domain role
- Tenant membership
- Permission
- Entitlement
- Feature flag
- Delegated and support authority

Look for duplicate identity ownership, merge ambiguity, cross-tenant correlation, or UI-only enforcement.

### 4. First-Slice Implementability

Review together:

- `17-Roadmap/FIRST_SLICE_MANIFEST.md`
- `registry/first-slice.json`
- `02-Architecture/FIRST_SLICE_SYSTEM_CONTEXT_AND_FLOWS.md`
- `02-Architecture/FIRST_SLICE_ENTITY_AND_STATE_MODEL.md`
- `02-Architecture/FIRST_SLICE_API_AND_EVENT_CONTRACTS.md`
- `01-Platform/FIRST_SLICE_PERMISSION_CATALOG.md`
- `09-UX/FIRST_SLICE_UX_AND_ACCESSIBILITY.md`
- `05-Industry-Packs/GUYANA_RETAIL_JURISDICTION_PROFILE.md`
- Relevant Commerce, Catalog, Inventory, Finance, Security, Testing, Deployment, Operations, and AI documents

Determine whether the slice is bounded, internally complete, implementable, testable, and still appropriately classified as prototype-only. Identify exact missing schemas, diagrams, contracts, fixtures, decisions, or evidence.

### 5. Complete AI Platform Audit

Audit:

- `06-AI/AI_PLATFORM_ARCHITECTURE.md`
- `06-AI/MODEL_PROMPT_TOOL_AND_AGENT_REGISTRIES.md`
- `06-AI/MEMORY_RETRIEVAL_AND_CONTEXT.md`
- `06-AI/EVALUATION_RED_TEAM_AND_INCIDENT_RESPONSE.md`
- `06-AI/FIRST_SLICE_AI_BOUNDARY.md`
- `03-Business-Engines/AI_ORCHESTRATION_ENGINE.md`
- `20-Strategy/AI_HANDBOOK.md`

Assess model portability, prompt governance, tool authority, memory, retrieval, data handling, evaluations, red teaming, incident response, budgets, provider dependencies, human oversight, and mutating-agent boundaries.

### 6. Developer Platform, Skills, and Marketplace

Audit:

- Public API and application registration
- SDK, CLI, and scaffolding
- Extension, plugin, and sandbox architecture
- API versioning and deprecation
- Webhooks and event delivery
- Project agent skills
- Marketplace architecture
- Publisher review and extension lifecycle
- Commercial settlement boundaries

Inspect every `.claude/skills/*/SKILL.md` for:

- Correct project-skill structure
- Clear triggering descriptions
- Safe tool restrictions
- Appropriate forked context
- Accidental authority escalation
- Duplication or contradiction of specifications
- False-trigger and missed-trigger risk
- Compatibility with Agent Skills implementations
- Vercel v0 handoff quality
- Missing high-value skills

Verify the repository uses original project guidance rather than copying proprietary prompts.

### 7. UX and Design-System Audit

Audit:

- Advanced interface patterns
- Dashboard and data visualization
- Forms, selection, and multiselect
- Progressive disclosure
- Design tokens and visual system
- Design-system operations
- Component catalog and state matrix
- First-slice UX and accessibility
- Design handbook
- Platform Experience Index
- Business DNA

Evaluate tabs, overflow tab menus, dialogs, drawers, popovers, tooltips, menus, wizards, steppers, searchable selects, hierarchical multiselect, bulk selection, forms, dashboards, tables, data-driven shape, CRAP principles, tokens, mobile, offline, white label, keyboard, screen reader, zoom, touch, scanner, errors, pending and uncertain states, novice usability, and expert efficiency.

Benchmark proposed workflows against Odoo, ERPNext, direct competitors, relevant specialists, and experience leaders. Focus on measurable workflow superiority, not visual polish or feature count.

### 8. Engineering, Deployment, Operations, and Testing

Audit:

- Engineering handbook
- Implementation recipes and scaffolding
- Deployment reference architecture
- Backup, restore, and disaster recovery
- Observability, incidents, and support operations
- SLO and operational readiness
- Platform testing strategy
- Specialist testing standards

Assess whether the documents are specific enough to prevent cross-domain shortcuts, unsafe migrations, provider lock-in, untestable offline behavior, weak recovery, noisy operations, and ceremonial SLOs.

Identify which reference implementations, infrastructure modules, simulators, runbooks, and executable tests remain necessary.

### 9. Strategy, Competitive Intelligence, and Company Operations

Audit:

- Company and platform strategy
- Competitive-intelligence program
- Competitor benchmark scorecard
- Platform Experience Index
- Business DNA Engine
- Geographic and jurisdiction expansion
- Build/buy/partner/integrate
- Ecosystem, academy, and certification
- Product, Design, Engineering, AI, Implementation, Support, Customer Success, Partner, and Sales handbooks

Determine whether these form a coherent company operating model, whether responsibilities conflict, and whether any handbook makes claims unsupported by the platform architecture or current company stage.

### 10. Current Web Research and Fact Verification

Perform fresh web research. Prefer official documentation, statutes, regulators, standards bodies, and primary vendor sources.

Verify, as currently available:

- Better Auth features, licensing, SSO, SCIM, 2FA, passkeys, sessions, organizations, API keys, mobile integration, and enterprise dependencies
- Next.js, React, TanStack Query/Table/Virtual/Form/Router/Start, Expo, Expo Router, Expo UI, Node.js, PostgreSQL, Kysely, NestJS/Fastify, Temporal, Redis, NATS, OpenSearch, and Better-T-Stack maturity and support
- Anthropic Claude Code project skills, frontmatter, invocation, forked context, tool restrictions, and Agent Skills compatibility
- Vercel v0 and AI SDK capabilities and limitations relevant to the repository skills
- Stripe availability and settlement for the eventual platform entity
- MMG merchant, request-to-pay, recurring, refund, reversal, webhook, settlement, sandbox, and disbursement capabilities
- Guyana Revenue Authority tax, VAT, invoice, receipt, filing, and retention requirements
- Guyana NIS requirements
- Bank of Guyana payment-system, acquiring, e-money, AML/CFT, FX, aggregation, and licensing material
- Guyana privacy, consumer, electronic-transactions, employment, and record requirements
- WCAG and accessibility standards
- NIST AI RMF and current AI-risk guidance
- Fiscalization and electronic-invoicing developments

Where an official source is unavailable, state that limitation. Never infer that a requirement is absent.

Separate verified fact, source limitation, inference, recommendation, and legal or regulatory question requiring qualified counsel.

### 11. Governance and Automation

Run:

```bash
python scripts/validate_docs.py
python scripts/generate_registries.py --check
```

Verify:

- Cross-platform deterministic output
- Document-ID uniqueness
- Related-ADR integrity
- Namespace ownership
- Capability and event registry completeness
- First-slice registry validity
- Internal-link validation
- Template and historical-review exclusions
- Strict read-only CI behavior
- No workflow write permission
- Faithfulness of generated registries to source documents

Do not rely on an expected count. Report the actual number of governed documents, capabilities, canonical events, first-slice capabilities, deferred capabilities, skills, ADRs, domains, engines, industry packs, handbooks, and section indexes.

### 12. Commercial and Founder Decisions

Verify separation among:

- Platform Subscription
- Tenant Recurring Agreement
- Tenant customer payment
- Platform billing
- Partner and marketplace settlement
- Stored value
- Loyalty value
- Cash collection

Review unresolved founder decisions in `20-Strategy/FOUNDER_DECISION_REGISTER.md`. Identify which implementation, commercial, payment, jurisdiction, and company work remains blocked.

Do not invent legal entity, tax residence, bank accounts, merchant status, licensing, or billing currency.

## Required Output

Create one report only:

`reviews/FABLE5_THIRD_AUDIT_V1.md`

Do not modify any other repository file.

The report must include:

1. Audited commit SHA
2. Complete coverage manifest
3. Executive verdict
4. SA-001 through SA-031 closure matrix
5. New findings by severity
6. Contradictions and ambiguous ownership
7. Architecture-depth assessment for every repository section
8. First-slice implementability assessment
9. AI platform assessment
10. Developer platform, skills, and marketplace assessment
11. UX, design system, accessibility, and competitive assessment
12. Security, privacy, recovery, deployment, operations, and testing assessment
13. Strategy and company-handbook assessment
14. Technology and provider verification
15. Guyana jurisdiction and source limitations
16. Commercial and founder-decision assessment
17. Governance and registry verification
18. Missing implementation-ready specifications and evidence
19. Prioritized remediation: Now, Before Prototype, Before Pilot, Before Production, Later
20. Readiness score by repository section
21. Final readiness decision:
    - Not ready for implementation
    - Ready only for technical prototypes
    - Ready for one constrained vertical-slice implementation after named blockers
    - Ready for one constrained pilot after named blockers
    - Ready for broader implementation
22. Machine-readable JSON appendix containing every finding with ID, severity, confidence, status, affected files and headings, evidence, web sources, recommendation, owner, timing, document action, and closure criteria

## Review Standard

- Cite exact files and headings.
- Verify claims rather than repeating summaries.
- Distinguish architectural coverage from implementation evidence.
- Distinguish prototype, pilot, legal, and production readiness.
- Do not reward document volume.
- Identify scope that should be removed as readily as scope that is missing.
- Prefer simplicity, workflow superiority, tenant safety, financial correctness, privacy, recoverability, accessibility, maintainability, and honest company-stage fit.
- Challenge founder and prior-review assumptions when evidence warrants it.
