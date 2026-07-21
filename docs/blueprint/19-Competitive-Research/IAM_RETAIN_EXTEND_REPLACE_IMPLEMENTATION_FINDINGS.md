---
document_id: PDA-CIR-092
title: IAM Retain, Extend, and Replace Implementation Findings
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0028]
---

# IAM Retain, Extend, and Replace Implementation Findings

## Executive Finding

Retain Better Auth as Meridian's authentication and session foundation under ADR-0006. Extend it only through the governed Platform Identity boundary when a named enterprise federation, SCIM, recovery or workload-identity requirement is admitted and passes PDA-PLT-028. Do not replace it because another IAM product has more features or uses familiar enterprise terminology. Replacement is justified only when an approved requirement cannot be met safely through the adapter, with dated evidence, an accepted ADR and a reversible migration plan.

Meridian's differentiator should be boundary clarity rather than an all-owning identity suite: authentication proves a principal; Tenancy establishes active context; Party links the principal to real-world identity; Authorization and domains decide business authority; Audit records the decision. No provider realm, organization, group, claim or administrator role may collapse those steps.

## Adopt, Improve, Reject, and Defer

| Disposition | Finding | Rationale |
|---|---|---|
| Adopt | issuer/subject-based external identity keys and explicit protocol-connection ownership | email, display name and provider-local organization names are mutable and collision-prone |
| Adopt | separate human, application/service and emergency principals | workload and break-glass access have different credential, session, owner and review requirements |
| Adopt | staged federation/provisioning administration with test, review, activation, observation and retirement | provider configuration is security-sensitive operational change, not a one-form CRUD task |
| Adopt | overlapping key/certificate rotation and observed-use verification | creation of a new credential does not prove consumers switched or rollback is possible |
| Improve | claims/groups propose versioned mappings into ordinary owner commands | preserves enterprise-directory automation without outsourcing Meridian authorization |
| Improve | deprovisioning as suspension plus separately owned membership/domain reviews | prevents directory deletion from erasing Party, audit, financial or operational truth |
| Improve | normalized audit evidence linked to provider correlation and raw protected evidence | provider logs vary in retention, semantics and availability and cannot replace Meridian audit |
| Improve | reversible provider migration with inventory, crosswalk, cohorts, re-enrollment, session revocation and reconciliation | credentials and sessions are often non-portable; big-bang cutover creates lockout and identity-link risk |
| Reject | Keycloak realm, authentik tenant, Better Auth organization or Entra tenant as the canonical Meridian tenant model | product deployment/directory constructs have different semantics and lifecycle |
| Reject | upstream administrator, group, job title or token claim as a direct business permission or domain role | authentication assertions are input evidence, not Meridian authority |
| Reject | email-only auto-linking, silent duplicate merge or domain-only organization membership | enables account takeover and cross-tenant ambiguity |
| Reject | reusable human credentials for integrations or universal service accounts | defeats least privilege, attribution, rotation and owner lifecycle |
| Reject | provider-local audit, successful redirect or SCIM response as proof of converged Meridian state | delivery and authentication success do not prove downstream authorization or lifecycle completion |
| Defer | production SAML/OIDC federation, SCIM, tenant self-service connection administration, external workload federation and provider migration | require explicit roadmap admission, security/protocol design, capability/contract registration and implementation evidence |

## Retain, Extend, and Replace Gates

### Retain Better Auth

Retain when all approved needs can be satisfied behind Platform Identity without violating ownership, tenant isolation, security, operational or licensing constraints. Evidence must cover the exact pinned version, plugin state, schema/endpoints, supported protocol behavior, secret/key operations, upgrade path, telemetry, backup/restore and incident support. The present evidence supports retention for the prototype scope; it does not claim pilot readiness for enterprise federation or SCIM.

### Extend Through Platform Identity

Extension requires all of the following:

1. a named customer/workstream requirement and explicit first-slice depth or deferral decision;
2. PDA-PLT-028 review of the exact Better Auth plugin/feature/version and its schemas, endpoints, hooks, secrets and lifecycle;
3. owner-approved commands, data classification, Party-link and authorization mapping boundaries;
4. threat model for tenant resolution, account linking, metadata, token/assertion validation, provisioning, recovery and administrator abuse;
5. permission/event/OpenAPI registration where public or integration contracts are admitted;
6. migration, rollback, disable, credential rotation, provider outage and data-exit behavior;
7. tenant-isolation, security, accessibility, load, recovery and operational evidence with runbooks and tested alerts.

An extension may use Keycloak, authentik, Entra or another system as an upstream identity provider, broker or provisioning client without making it Meridian's authentication owner. Such use is a provider/integration decision with its own risk and deployment review.

### Replace the Authentication Owner

Replacement requires an Accepted ADR amending or superseding ADR-0006. The proposal must name a requirement that the current adapter cannot meet after a fair prototype or documented technical evaluation. Qualifying evidence may include mandatory protocol/certification behavior, proven isolation or scale constraints, unsupported security controls, unacceptable recovery/upgrade characteristics, jurisdiction/deployment requirements, or lifecycle/support risk. Feature count, product popularity, an administrator preference, a provider-local organization model or speculative future need is insufficient.

The ADR package must compare retain/extend/replace options, current pinned versions and support lifecycles; identify ownership and persistence changes; document licensing/hosting/operations; provide threat/privacy assessment; prove compatibility with Party/Tenancy/Authorization; define API/event/permission impacts; inventory and classify all migrated data; handle non-exportable credentials and mandatory re-enrollment; provide dual-run or staged cutover, rollback and kill criteria; test session/token revocation, recovery and break-glass; and retain auditable source-to-target reconciliation.

## Architecture and Data Implications

No immediate authority changes are approved. A future admitted design may need Provider Connection, Verified Domain, External Subject Link, Attribute/Group Mapping Policy, Provisioning Connection, Provisioning Attempt, Reconciliation Exception, Workload Principal, Credential Version, Recovery Transaction and Migration Cohort concepts. These are candidate concepts, not approved schemas or identifiers.

Every record requires opaque ID, tenant/organization scope where applicable, owner, lifecycle/version, source/provenance, classification, timestamps/timezone, retention/legal hold, concurrency, audit correlation and disable/delete behavior. Provider configuration and credentials are protected data. External subject links remain distinct from Party identity links, tenant membership and domain roles. Corrections append or compensate; protected audit evidence is not silently rewritten.

## Contract and Integration Implications

- Federation endpoints remain within the authentication adapter; tenant-facing administration uses Platform Identity commands and must not expose raw provider SDK objects as canonical contracts.
- SCIM resources are interoperable boundary objects. They translate into owner commands and safe errors; they do not become Meridian's canonical user, Party, group or role schemas.
- OIDC/SAML metadata, SCIM calls and provider callbacks are bounded, authenticated, rate-limited and correlated. External asynchronous callbacks enter through Developer Platform webhook controls.
- Public operations declare explicit permission or authenticated context in OpenAPI. Material canonical facts are registered only after owner/consumer review; research does not pre-allocate event names.
- Secrets, certificates and tokens are references governed by Platform Secrets. APIs never return stored secret material after creation and exports never contain it.

## Security, Privacy, Operations, and UX Implications

Security review must cover issuer confusion, mix-up, malicious discovery/metadata, SSRF, redirect and ACS attacks, weak algorithms, replay, account-link takeover, domain takeover, claim/group escalation, SCIM bearer theft, cross-tenant service identities, recovery abuse, compromised upstream administrators, provider outage and migration rollback. Privacy review covers attribute minimization, purpose, notices, cross-border/provider processing, retention, subject rights, Party-link errors and deprovisioning without destructive overreach.

Operations needs connection and certificate inventory, expiry alerts, provider health, sign-in/provisioning/reconciliation telemetry, safe log redaction, rate/capacity limits, backup/restore scope, upgrade compatibility, incident and lockout runbooks, tested break-glass, credential rotation and provider-exit exercises. PDA-OPS-019 does not certify these unimplemented services.

UX must make provider-local and Meridian concepts visibly distinct, show connection scope and risk, preview mapping consequences, expose quarantine/reconciliation, support accessible recovery and avoid generic confirmation for role revocation, connection suspension or credential rotation. Essential sign-in and recovery paths require deterministic behavior with AI disabled.

## Testing and Acceptance Evidence

Any federation/SCIM prototype requires:

1. exact owner, version, plugin/provider and lifecycle decision evidence;
2. cross-tenant isolation and issuer/subject collision tests;
3. protocol negative tests for signature, audience, recipient/destination, time, replay, redirect and discovery;
4. account-link, domain-proof, mapping escalation and ambiguous-match tests;
5. duplicate, out-of-order, partial and failed SCIM lifecycle/reconciliation tests;
6. service-identity least privilege, rotation, anomalous use and revocation tests;
7. user/admin/break-glass recovery, enumeration, stolen-token and provider-outage exercises;
8. accessible/responsive administrator and recovery evidence;
9. telemetry, alerts, runbooks, backup/restore and credential/certificate rotation exercise;
10. migration inventory, cohort, rollback, re-enrollment, session revocation and source-to-target reconciliation.

## Research Disposition and Revalidation

CIR-BACK-022 can be marked Transferred because PDA-CIR-090 through PDA-CIR-092, CIR-LED-0012, RES-010 and SRC-049 through SRC-056 provide the required documented outputs and traceability. It is not independently reviewed, implementation-ready or a provider-selection decision. Revalidate before enterprise federation, SCIM, delegated identity administration, external workload identity or authentication-owner change; when the cited Better Auth, Keycloak, authentik or Entra behavior changes materially; or by 2027-07-16, whichever occurs first.

## Related Meridian Authorities

PDA-FND-013, ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0028, PDA-PLT-002, PDA-PLT-003, PDA-PLT-004, PDA-PLT-020, PDA-PLT-021, PDA-PLT-028, PDA-SEC-011, PDA-SEC-012, PDA-SEC-013, PDA-DEV-003, PDA-OPS-019, PDA-CIR-090, PDA-CIR-091, `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `registry/endpoint-permissions.json`, and `openapi/first-slice-v1.yaml`.
