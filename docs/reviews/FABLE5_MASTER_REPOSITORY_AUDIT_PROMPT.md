# Fable 5 Master Repository Audit Prompt

Copy the prompt below into Fable 5 exactly as written. Give it access to the GitHub repository and the `docs/initial-blueprint` branch.

---

## Role

Act as an independent principal enterprise architect, product strategist, security reviewer, UX leader, commercial systems architect, AI-governance specialist, and adversarial technical auditor.

You are not being asked to praise the work or continue its assumptions. Your responsibility is to determine whether this blueprint could realistically guide the design and construction of a world-class, modular, AI-native Business Operating Platform that competes with leading integrated platforms and best-in-class specialist products while remaining intuitive, secure, commercially viable, maintainable, mobile-friendly, offline-capable, extensible, and white-label-ready.

Be rigorous, skeptical, evidence-driven, and constructive.

## Repository to Audit

Repository:

`kareemschultz/platform-design-authority`

Primary review branch:

`docs/initial-blueprint`

Draft pull request:

`#1 — docs: establish initial Platform Design Authority foundation`

Do not audit only the default branch. The authoritative review target for this exercise is the complete content of `docs/initial-blueprint`.

## Audit Scope

Audit **every document and every decision currently present in the repository branch**, including but not limited to:

- Root README and Platform Manifest
- All Foundation documents
- Platform Kernel documents
- Architecture documents
- Technology-stack documents
- Better-T-Stack, Next.js, TanStack, Expo, and mobile decisions
- Better Auth architecture and identity decisions
- Business Engines
- Business Domains
- Business Capability Map
- Domain Dependency Matrix
- Industry Packs
- Commercial Architecture
- Architecture Decision Records
- Templates
- Review documents
- Naming, glossary, governance, lifecycle, and authority rules

You must read every Markdown document on the branch. Do not audit a sample and claim full coverage.

At the beginning of your report, include a **coverage manifest** showing:

- Total files discovered
- Total files reviewed
- Files skipped, if any
- Reason for each skipped file
- Repository branch and commit SHA audited
- Audit date

If repository access is incomplete, stop and clearly explain what is unavailable. Do not pretend the audit is complete.

## Founding Intent to Preserve

The platform is intended to be:

- One unified public brand and one shared technical platform
- Modular at capability, entitlement, permission, UI, API, job, report, automation, integration, extension, and AI-tool levels
- Able to sell only the capabilities a business needs and paywall the rest
- Suitable for retail, e-commerce, POS, inventory, warehouses, procurement, finance, CRM, workforce, payroll, manufacturing, projects, assets, fleet, rental, service, analytics, and additional industries
- Composable through industry packs rather than product forks
- Role-based and progressively disclosed so users are not overwhelmed
- Mobile-friendly and offline-capable for relevant workflows
- Cloud, self-hosted, hybrid, edge, and white-label capable
- AI-native, but permission-aware, explainable, auditable, and approval-controlled
- Extensible through APIs, events, SDKs, plugins, a marketplace, themes, workflows, reports, and AI skills
- Competitive with leading integrated platforms and best-in-class specialists
- Easier to learn and use than traditional ERP systems

Do not preserve a decision merely because it appears in the blueprint. Preserve only the intent; challenge the proposed implementation whenever evidence supports a better approach.

## Mandatory Web Research

Perform extensive current web research before reaching conclusions.

### Source Requirements

Use primary and authoritative sources whenever possible:

- Official product documentation
- Official security, architecture, pricing, licensing, and release documentation
- Standards bodies
- Government and regulatory sources
- Maintainer repositories and release notes
- Vendor engineering documentation
- Original research papers where relevant

Use secondary sources only to supplement primary evidence, identify user-reported problems, or compare market perception. Clearly label lower-confidence sources.

### Verification Rules

For every material factual claim about current software, licensing, maturity, capabilities, pricing model, support status, security model, standards support, or ecosystem health:

1. Verify it using current sources.
2. Include a citation or source reference.
3. State the date accessed or current version where relevant.
4. Distinguish verified fact from your inference.
5. Note conflicts between sources.
6. Do not rely solely on memory.

Do not fabricate benchmark numbers, adoption statistics, prices, maturity claims, or competitor capabilities.

### Required Technology Research

At minimum, verify the current status, capabilities, limitations, release maturity, licensing implications, integration model, and migration risk for:

- Better Auth
- Better Auth 2FA, passkeys, organization, admin, API key, bearer, JWT, OIDC provider, device authorization, SSO, and SCIM capabilities
- Next.js
- React
- TanStack Query
- TanStack Table
- TanStack Virtual
- TanStack Form
- TanStack Router
- TanStack Start
- TanStack Store
- TanStack DB
- Better-T-Stack
- React Native
- Expo
- Expo Router
- Expo UI
- PostgreSQL
- Kysely
- Drizzle
- Prisma
- NestJS
- Fastify
- Hono
- Redis and Valkey
- BullMQ
- Temporal
- NATS JetStream
- Kafka where relevant
- OpenSearch and reasonable alternatives
- OpenTelemetry
- pgvector
- AWS, Vercel, container hosting, and Kubernetes assumptions

For each major choice, determine whether the blueprint's current conclusion is:

- Strongly supported
- Reasonable but requires a prototype
- Premature
- Incorrect
- Incomplete
- Too vendor-dependent
- Too operationally complex
- Too immature for a critical platform path

### Required Competitive Research

Audit against three competitor groups.

#### Direct Integrated Platforms

Research current offerings and positioning for at least:

- Odoo
- ERPNext or Frappe
- Microsoft Dynamics 365 and Business Central
- Oracle NetSuite
- SAP Business One and relevant SAP cloud offerings
- Acumatica
- Zoho One
- Sage business platforms
- Infor where relevant
- Oracle Fusion where enterprise comparisons are useful

#### Best-in-Class Specialists

Research leading specialists by capability, including suitable current examples for:

- POS and retail
- E-commerce
- Inventory
- Warehouse management
- Procurement
- Accounting and finance
- CRM and marketing
- HR and payroll
- Manufacturing
- Projects and professional services
- Help desk and field service
- Fleet and maintenance
- Hospitality and restaurant
- Analytics and planning
- AI-assisted business software

Do not assume the names already mentioned in the blueprint are still the current top competitors. Verify the market and explain your selection criteria.

#### Experience Leaders

Evaluate applicable UX lessons from products known for strong usability, onboarding, developer experience, or interaction design. Examples may include Stripe, Shopify, Linear, Notion, Figma, Vercel, Slack, and others you judge relevant.

The goal is not imitation. Identify principles and measurable workflow standards.

## Audit Questions

### 1. Vision and Product Coherence

- Is the product vision coherent or too broad to execute?
- Does the repository distinguish platform, domains, engines, capabilities, packs, extensions, and solutions consistently?
- Are there contradictions between the Canon, Constitution, Manifest, Glossary, domain documents, and commercial documents?
- Does the blueprint avoid becoming a feature checklist?
- Is the proposed platform meaningfully differentiated?
- Is the term Business Operating Platform justified?

### 2. Scope and Delivery Feasibility

- Is the planned scope achievable by a startup or small initial team?
- Which capabilities are essential for a credible first release?
- Which capabilities should be delayed, bought, integrated, or excluded?
- Does the blueprint need a narrower beachhead market?
- Which sequence provides the strongest commercial validation with the least architectural risk?
- Where is the platform overengineered before product-market evidence?

### 3. Domain Architecture

- Does every authoritative entity have one clear owner?
- Are any domains too broad, too narrow, duplicated, or missing?
- Are any shared engines actually domains, or vice versa?
- Are the dependency rules realistic?
- Are circular dependencies hidden in the proposed workflows?
- Is the modular-monolith decision appropriate?
- Are extraction criteria specific enough?
- Are consistency, transaction, reservation, ledger, reversal, idempotency, and projection patterns sufficient?

### 4. Platform Kernel

Audit completeness and boundaries for:

- Multi-tenancy
- Partner and reseller hierarchy
- Identity
- Authentication
- Authorization
- Entitlements
- Configuration
- Audit
- Events
- Jobs
- Notifications
- Files
- Search
- Localization
- Reference data
- Feature flags
- Devices
- Edge operations
- Offline synchronization
- Secrets
- Administration and diagnostics

Identify missing kernel services and anything incorrectly placed in the kernel.

### 5. Better Auth and Identity

Verify whether Better Auth is suitable as the chosen authentication and session foundation.

Audit:

- Session model
- Cookie and token security
- Database adapters
- Horizontal scaling
- Account linking
- Recovery
- Email verification
- TOTP
- OTP
- Backup codes
- Trusted devices
- Lockout
- Passkeys and WebAuthn
- Social login
- Organizations and teams
- Multi-tenant mapping
- Admin operations
- Impersonation
- API keys
- Bearer tokens
- JWTs
- OIDC provider
- Device authorization
- Enterprise SSO
- SAML
- OIDC federation
- SCIM
- Expo and React Native integration
- Custom white-label domains
- Passkey relying-party limitations
- Offline and edge authentication
- Audit hooks
- Licensing and enterprise-tier dependencies
- Migration and exit strategy

Explicitly identify what Better Auth should own and what must remain platform-owned.

### 6. Authorization and Entitlements

- Is the separation among authentication, authorization, entitlements, plans, feature flags, and configuration correct?
- Does the model support legal entity, branch, location, department, record, field, device, and contextual scope?
- Is separation of duties adequately represented?
- Can permissions and entitlements be enforced consistently across UI, API, jobs, reports, exports, integrations, extensions, offline clients, and AI tools?
- Is policy explanation and debugging addressed?
- Is the proposed model too complex for the first release?

### 7. Technology Stack

Audit the complete recommended stack and every ADR.

For each component, evaluate:

- Architectural fit
- Current maturity
- Security posture
- Ecosystem health
- Licensing
- Operational burden
- Self-hosting
- Vendor lock-in
- Talent availability
- AI-agent development quality
- Migration risk
- Performance
- Multi-tenant suitability
- Offline suitability
- Long-term maintenance

Provide a decision matrix for at least:

- Next.js versus TanStack Start
- Next.js App Router versus TanStack Router use cases
- TanStack Query versus server-only data fetching
- TanStack Form versus React Hook Form
- Kysely versus Drizzle versus Prisma
- NestJS/Fastify versus plain Fastify versus Hono
- Better Auth versus credible alternatives, while respecting that Better Auth is the founder's current preference
- BullMQ versus Temporal
- Redis versus Valkey
- NATS JetStream versus Kafka
- PostgreSQL search versus OpenSearch versus reasonable alternatives
- pgvector versus a standalone vector database
- Vercel-hosted web versus containerized Next.js
- Managed containers versus Kubernetes
- Expo UI versus cross-platform component libraries

Do not recommend replacing a chosen tool without explaining migration cost and a concrete advantage.

### 8. Web, Mobile, and Offline Experience

- Is the division among Next.js, TanStack libraries, Expo Router, React Native, Expo UI, PWA, SQLite, and the synchronization layer coherent?
- Are shared packages defined at the correct abstraction level?
- Are offline authority, conflict resolution, reconciliation, device identity, entitlement leases, and queue semantics sufficient?
- Which workflows genuinely need offline support?
- Are mobile screens being treated as first-class workflows rather than smaller desktop screens?
- Are SwiftUI and Jetpack Compose wrappers through Expo UI an advantage or an upgrade risk?

### 9. UX and Simplicity

- Can this broad platform remain easy to learn?
- Are role-based workspaces enough?
- Are onboarding, guided setup, progressive disclosure, universal search, command palette, saved views, bulk actions, accessibility, and error recovery sufficiently specified?
- Is the proposed Business DNA concept valuable, dangerous, vague, or missing governance?
- Which workflows should be measured using time, clicks, decisions, typing, error rates, and training time?
- Where does the blueprint lack UX detail needed to outperform incumbents?

### 10. Business Capabilities and Industry Packs

- Are important business domains or capabilities missing?
- Are any listed capabilities unnecessary or redundant?
- Are the capability identifiers coherent and consistently scoped?
- Do industry packs compose capabilities, or do they quietly require unique domain logic?
- Which industry packs are commercially sensible first?
- Which packs require specialized regulatory expertise before development?
- Are pharmacy, healthcare, government, payroll, tax, and other regulated scopes framed safely?

### 11. Commercial Architecture

Audit:

- Editions
- Domain bundles
- Capability add-ons
- Industry packs
- Usage billing
- AI credits
- Limits and overages
- Trials
- Proration
- Pending payment changes
- Upgrades
- Downgrades
- Grace periods
- Suspension
- Cancellation
- Reactivation
- Data retention
- Customer billing portal
- White-label tiers
- Partner and reseller billing
- Marketplace revenue share
- Professional services
- Support tiers
- Customer success

Identify missing cases involving:

- Multiple currencies
- Tax
- Refunds and credits
- Chargebacks
- Collections
- Contract amendments
- Annual commitments
- Ramp contracts
- Minimum spend
- Prepaid credits
- Revenue recognition
- Partner settlement
- Marketplace payout
- Failed provisioning
- Billing-provider migration
- Enterprise purchase orders
- Offline entitlement leases
- Customer and partner termination

Verify the current billing-provider assumptions with official documentation.

### 12. AI Architecture

Although the detailed AI section is not yet complete, audit the existing AI principles and identify requirements for:

- Provider abstraction
- Model registry
- Prompt and policy versioning
- Tool registry
- Tool authorization
- Agent identity
- Memory
- Retrieval
- Tenant isolation
- Data residency
- Cost control
- Evaluation
- Observability
- Human approval
- High-impact actions
- Hallucination containment
- Adversarial prompt handling
- Marketplace AI skills
- Model and provider exit strategy

### 13. Security Privacy and Compliance

Identify missing or weak controls for:

- Threat modeling
- Tenant isolation
- Encryption
- Key management
- Secrets
- Authentication
- Authorization
- Session security
- Account recovery
- Audit integrity
- Data classification
- Retention
- Legal hold
- Privacy rights
- Consent
- Data residency
- Backup
- Disaster recovery
- Supply-chain security
- Extension sandboxing
- Webhooks
- File uploads
- AI data leakage
- Support impersonation
- Insider risk
- Fraud and abuse
- Secure development lifecycle

Map important recommendations to recognized standards where useful, such as OWASP, NIST, ISO, SOC 2, PCI DSS, WCAG, OAuth, OpenID Connect, WebAuthn, SCIM, and relevant privacy frameworks. Do not claim compliance merely from architecture documents.

### 14. Data and Reporting

- Are master data, reference data, transactional data, ledger data, documents, projections, analytics, and AI data sufficiently separated?
- Is the PostgreSQL strategy realistic for the expected workload?
- Are row-level security, schema ownership, partitioning, read replicas, archival, and tenant placement sufficiently considered?
- Is the reporting and semantic-metric governance adequate?
- Are data import, migration, quality, lineage, retention, and deletion under-specified?
- What data architecture documents must be added before implementation?

### 15. Developer Platform and Marketplace

Identify requirements and gaps for:

- Public APIs
- Internal contracts
- SDK generation
- Webhooks
- CLI
- Plugins
- Extensions
- Themes
- Widgets
- Workflow packs
- Report packs
- Industry packs
- AI skills
- Sandboxing
- Version compatibility
- App review
- Billing
- Revocation
- Data access
- Security scanning
- Local development
- Testing SDKs

### 16. Operations and Deployment

Audit assumptions for:

- SaaS
- Dedicated environments
- Self-hosting
- Hybrid deployment
- Edge nodes
- Offline clients
- Regional hosting
- Data sovereignty
- Containers
- Kubernetes
- CI/CD
- Observability
- Backups
- Recovery
- Multi-region operation
- Incident response
- Upgrades
- Database migrations
- Customer-specific extensions

Identify which promises should not be made during the first release.

### 17. Documentation Governance

- Is the document hierarchy clear?
- Are IDs, versions, statuses, owners, review dates, dependencies, and supersession adequate?
- Are any file names, document IDs, or terms inconsistent?
- Are the current documents too shallow to be implementation specifications?
- Which documents are strategic outlines versus executable specifications?
- Are the templates sufficient?
- Is one pull request with this many files still reviewable?
- Should the branch be split into smaller review units before ratification?

### 18. Competitive Position

For every major domain, identify:

- Direct integrated competitors
- Best-in-class specialists
- Their strongest relevant workflows
- Their major weaknesses
- Where this blueprint currently differentiates
- Where it merely reaches parity
- Where it is materially behind
- Evidence-based targets for usability, speed, reliability, mobile, offline, AI, reporting, extensibility, security, and implementation time

Do not assign unsupported numeric scores. Define how scores should be measured.

## Required Report Structure

Create a report titled:

`FABLE5_FULL_REPOSITORY_AUDIT_V1.md`

Use the following structure.

### 1. Executive Verdict

- Overall readiness level
- Strongest aspects
- Most serious risks
- Whether implementation should begin
- Conditions required before implementation

### 2. Coverage Manifest

List every file reviewed and any skipped files.

### 3. Scorecard by Repository Section

For each section, give:

- Readiness score from 0 to 5
- Confidence: Low, Medium, or High
- Summary reason
- Blocking issue count
- Major issue count

Score meaning:

- 0: Missing or unusable
- 1: Concept only
- 2: Directionally useful but materially incomplete
- 3: Suitable for further design, not implementation
- 4: Implementation-ready with limited conditions
- 5: Strong, verified, and implementation-ready

### 4. Blocking Findings

Issues that should stop implementation.

For every finding include:

- Finding ID
- Severity: Blocker, Critical, High, Medium, Low
- Confidence
- Affected files and exact headings
- Description
- Evidence
- Why it matters
- Recommended correction
- Proposed owner
- Recommended timing
- Required new or revised documents

### 5. Contradictions and Ambiguities

Identify conflicts across documents, terms, ownership, authority, technology choices, commercial behavior, and lifecycle rules.

### 6. Missing Architecture and Capabilities

List missing domains, engines, kernel services, capabilities, workflows, personas, APIs, events, policies, reports, AI functions, security controls, and operational concerns.

### 7. Technology Verification Report

For each material technology decision:

- Current verified status
- Official-source evidence
- Blueprint claim
- Audit conclusion
- Risks
- Required experiment
- Keep, revise, defer, or reject

### 8. Competitive Gap Analysis

Organize by domain and workflow, not by vendor marketing categories.

### 9. UX and Workflow Superiority Assessment

Identify the first workflows that should be benchmarked and the measurement method.

### 10. Security and Compliance Assessment

Separate architecture readiness from actual compliance claims.

### 11. Commercial Architecture Assessment

Cover all lifecycle, billing, partner, marketplace, and customer-data cases.

### 12. Scope Reduction and Phased Delivery Proposal

Recommend:

- Beachhead customer and industry
- Minimum credible platform kernel
- Minimum credible domain slice
- First commercial offer
- Features to integrate rather than build
- Features to defer
- 30-day, 90-day, 6-month, 12-month, and later priorities

Do not provide unrealistic timelines without team-size and assumption ranges.

### 13. Required Experiments and Proofs of Concept

At minimum consider:

- Better Auth with Next.js, Expo, custom domains, passkeys, 2FA, SSO, and SCIM
- Tenant and authorization enforcement
- Next.js plus TanStack data patterns
- TanStack Form versus React Hook Form
- NestJS/Fastify versus simpler backend shells
- Kysely versus Drizzle versus Prisma on representative domain queries
- Offline POS or warehouse synchronization
- Temporal workflow integration
- Transactional outbox and event delivery
- White-label custom-domain authentication
- Usage metering and entitlement propagation
- PostgreSQL tenant-scaling strategy

For each experiment define hypothesis, setup, success criteria, failure criteria, and decision produced.

### 14. Prioritized Remediation Plan

Use these categories:

- Fix before any implementation
- Fix before production architecture
- Fix before enterprise customers
- Fix before marketplace or partners
- Later improvement

### 15. Proposed Document Changes

List:

- Documents to add
- Documents to merge
- Documents to split
- Documents to rename
- Documents to deprecate
- Specific sections to rewrite

### 16. Recommended ADR Changes

For every existing ADR, recommend:

- Accept
- Accept with conditions
- Revise
- Defer
- Reject

Explain why.

### 17. Final Readiness Decision

Choose one:

- Not ready for implementation
- Ready only for technical prototypes
- Ready for one constrained vertical slice
- Ready for broader implementation after listed blockers
- Ready for implementation

State the exact conditions.

### 18. Sources

Provide a categorized bibliography with direct source names, page titles, organizations, dates, and URLs where the environment permits.

## Additional Machine-Readable Findings

In addition to the Markdown report, produce a structured table or JSON-compatible findings appendix containing:

- ID
- Severity
- Confidence
- Category
- Affected files
- Affected headings
- Finding
- Evidence summary
- Recommendation
- Timing
- Owner
- Suggested document action
- Source references

This structured appendix will be used to import findings into GitHub issues and track remediation.

## Behavioral Requirements

- Do not be agreeable by default.
- Do not confuse ambition with feasibility.
- Do not assume every listed capability should be built.
- Do not recommend microservices, Kubernetes, event sourcing, AI agents, or complex infrastructure merely because they are fashionable.
- Do not reject a technology solely because another tool is more popular.
- Explain tradeoffs and migration cost.
- Identify both underengineering and overengineering.
- Be explicit when evidence is insufficient.
- Use exact repository paths and headings.
- Cite current web evidence for material external claims.
- Clearly separate verified facts, inferences, opinions, and recommendations.
- Prioritize simplicity, security, correctness, workflow superiority, customer value, and sustainable execution.

## Final Instruction

Treat this as a pre-investment, pre-implementation, adversarial architecture audit. The objective is to expose weaknesses while they are still inexpensive to correct.

Do not modify the repository during the audit unless explicitly authorized. Return the complete report and structured findings to the founder so they can be reviewed and dispositioned by the Platform Design Authority.

---
