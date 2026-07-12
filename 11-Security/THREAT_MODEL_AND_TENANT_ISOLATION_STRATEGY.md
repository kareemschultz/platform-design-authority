---
document_id: PDA-SEC-011
title: Threat Model and Tenant Isolation Strategy
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-12
---

# Threat Model and Tenant Isolation Strategy

## Purpose

Define the initial threat model and the controls proving that one tenant, user, partner, device, integration, extension, support operator, or AI agent cannot access or affect another tenant's data or authority.

## Protected Assets

- Tenant business data and documents
- Identity, session, factor, recovery, and API-key material
- Payment and stored-value credentials
- Payroll and workforce data
- Financial, tax, audit, and statutory records
- Custom fields and configuration
- Offline device data and synchronization leases
- AI prompts, retrieval results, tool inputs, and outputs
- Secrets, signing keys, and provider credentials
- Entitlements, permissions, feature flags, and delegated authority

## Principal Adversaries

- Unauthenticated internet attacker
- Compromised tenant user
- Malicious tenant administrator
- Tenant attempting cross-tenant discovery
- Compromised device or offline database
- Leaked API key or webhook secret
- Malicious integration or marketplace extension
- Compromised support operator
- Insider with database or infrastructure access
- Supply-chain attacker
- Prompt-injection or malicious AI content
- Automated abuse, scraping, credential stuffing, and card testing
- Tenant using the platform to defraud customers, providers, or other parties

## Trust Boundaries

- Browser and mobile client to API
- Public API and webhook boundary
- Better Auth to Platform Identity Link
- Application service to domain repository
- Domain to domain contract
- Transactional database to projections
- Online services to offline devices
- Platform to payment, tax, communication, AI, and identity providers
- Platform operator to tenant support context
- Extension sandbox to platform APIs
- AI model to approved tool gateway

## Tenant Context

Every trusted execution path carries an immutable tenant context established at the authentication or service boundary. Tenant context must not be accepted from an untrusted request body when it can be derived from the session, API key, route, device lease, or workload identity.

Required context includes:

- Tenant identifier
- Organization and legal-entity scope
- Actor or workload identity
- Delegation or impersonation context
- Entitlements and policy version
- Correlation and request identifiers

## Better Auth Boundary Controls

- Better Auth establishes authentication identity and session state; Platform Identity resolves tenant membership, Party links, delegated context, current permissions, entitlements, and policy.
- Better Auth Organization and Admin roles are never accepted as business authorization. Powerful plugin operations are wrapped by platform commands and canonical permissions.
- Production keeps CSRF and origin checks enabled, uses exact HTTPS trusted origins, prefers host-only `SameSite=Lax` cookies, and explicitly configures trusted proxy and client-IP headers.
- Cross-domain cookies, wildcard/dynamic origins, forwarded host/protocol derivation, and native custom schemes require topology-specific threat models and negative tests.
- Database-backed sessions are the baseline. Cookie cache is disabled until revocation staleness is accepted; sensitive operations force current session plus platform-authority evaluation.
- Every plugin or upgrade receives a schema, endpoint, secret, hook, data-flow, package, tenant-isolation, rollback, and audit review under `PDA-PLT-028`.
- Authentication logs and events exclude credentials, cookies, tokens, OTPs, recovery codes, factor secrets, API-key secrets, and excessive provider claims.
- Payment/subscription, referral, Agent Auth, MCP, and managed-audit plugins cannot silently create a new trust boundary or transfer canonical ownership.

## Isolation Layers

### Application Layer

- Tenant-scoped repositories and application services
- No unrestricted shared data-access helpers
- Authorization and entitlement enforcement before operations
- Explicit cross-tenant platform-operator APIs
- Domain contracts rather than direct table access

### Database Layer

- Tenant identifier on every tenant-owned row
- Composite uniqueness including tenant scope
- Foreign keys that preserve tenant scope where practical
- Database roles separated by service responsibility
- Row-level security evaluated as defense in depth, not the only control
- No tenant-selected schema or table names

### Cache, Search, and Analytics

- Tenant key in cache namespaces
- Tenant filter applied before search retrieval
- Index documents carry tenant and classification metadata
- Analytical models prohibit accidental cross-tenant joins
- Shared benchmarking data must be aggregated and de-identified under policy

### Files and Object Storage

- Tenant-scoped object keys or buckets
- Authorization before issuing signed URLs
- Short expiry and content-disposition controls
- Malware scanning and classification
- No predictable public object paths

### Jobs, Events, and Workflows

- Tenant context persisted with work
- Idempotency scoped correctly
- Consumers reject missing or inconsistent tenant context
- Dead letters preserve tenant isolation
- Workflow search and administration restrict tenant visibility

### Mobile and Offline

- Device registration and tenant binding
- Encrypted local stores
- Signed, expiring offline leases
- Capability- and scope-limited offline authority
- Remote revocation and privacy tombstones
- Server revalidation during synchronization

### AI

- Permission-filtered retrieval
- Tool authorization for every invocation
- Tenant-scoped memory and vector stores
- No model prompt may grant authority
- Output validation and human approval for high-impact action
- Cross-tenant training or evaluation only with explicit de-identification and governance

## Support and Impersonation

Support access requires:

- Named operator
- Tenant approval or documented emergency basis
- Reason and ticket
- Scoped role and duration
- Visible tenant banner where appropriate
- Original actor preserved in audit
- Prohibition on accessing authentication factors or raw secrets
- Review of high-risk exports and changes

## Abuse Cases to Test

- Change tenant ID in URL, body, header, query, or cached object
- Reuse object ID from another tenant
- Cross-tenant search count or autocomplete leakage
- Webhook subscription receiving another tenant's event
- Offline device reconnecting under a different tenant
- API key moved between tenant applications
- Partner administrator exceeding delegated customer scope
- Support impersonation escaping its scope
- AI retrieval or tool call using another tenant's context
- Import file referencing another tenant's identifiers
- Background job missing tenant context
- Database migration or report omitting tenant predicate

## Security Test Strategy

Every first-slice capability requires:

- Positive same-tenant test
- Negative cross-tenant read, write, search, export, and event tests
- Property-based identifier substitution tests
- Repository-contract test proving tenant criteria
- Search and cache leakage tests
- Offline lease and revocation tests
- Support-access tests
- AI tool and retrieval isolation tests where applicable

CI must fail on an unapproved cross-domain or cross-tenant data path.

## Incident Containment

The platform must support tenant-scoped credential revocation, device revocation, integration suspension, job pause, webhook pause, AI-tool kill switch, export block, and support-access termination without taking unrelated tenants offline.

## Initial Threat-Model Deliverables

- System and data-flow diagrams for the retail slice
- STRIDE-style abuse analysis for authentication, POS, inventory, stored value, offline sync, payments, webhooks, and support access
- Tenant-isolation test matrix
- Data-classification mapping
- Named residual risks and owners
- Pre-production penetration test scope

## Ratification Gate

No first-slice schema or API is Approved until its tenant ownership, trust boundaries, abuse cases, and isolation tests are represented here or in a linked capability threat model.
