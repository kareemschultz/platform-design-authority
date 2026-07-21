---
document_id: PDA-CIR-090
title: IAM and Identity Administration Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0028]
---

# IAM and Identity Administration Capability Matrix

## Purpose and Decision Boundary

Answer CIR-BACK-022 with current first-party evidence about Keycloak, authentik, Better Auth, and Microsoft Entra patterns for isolation, federation, lifecycle provisioning, service identities, recovery, credential rotation, delegated administration, audit, and migration.

This research does not enable a Better Auth plugin, select an external identity provider, alter ADR-0006, admit federation or SCIM to the first slice, or transfer Party, tenant, authorization, entitlement, approval, or audit ownership. Better Auth remains the governed owner of authentication accounts, credentials, protocols, and sessions behind Platform Identity. Platform Tenancy owns tenant and organization context; Party owns real-world identity; Platform Authorization owns business permissions; each domain owns its roles and consequential behavior.

## Scope, Evidence, and Limits

- Evidence cutoff: 2026-07-16.
- Compared patterns: Keycloak realms, organizations, identity brokering, clients and delegated realm administration; authentik tenants, sources, providers, applications, users, service accounts, flows and events; Better Auth core plus Organization, SSO and SCIM documentation; Microsoft Entra SCIM and workload-identity guidance.
- Evidence mode: current public first-party administration, product, security and protocol documentation.
- Not observed: configured production tenants, paid features, source-code security review, protocol certification, upgrade execution, migration, failover, scale, accessibility, support quality, regional availability, or independent penetration testing.
- Confidence: Medium for documented concepts and control patterns; Low for safe defaults, operational effectiveness, edition parity and migration effort.

## Terminology Map

| External term | Provider meaning | Meridian interpretation and constraint |
|---|---|---|
| Keycloak realm | isolated user, credential, role, client and configuration namespace | not a Meridian tenant, organization or legal entity; any realm topology is deployment/configuration, requires ADR/deployment review and never supplies business authority |
| Keycloak organization | members, domains, identity providers and token claims within a realm | an authentication-directory construct only; it may map to a Platform organization reference after validation but cannot create or own `platform.organizations`, Party records or domain roles |
| Keycloak client/service account | relying party and optional non-human account whose roles derive from the client | maps only to a governed application/workload identity; it is not a Party employee, support operator or tenant administrator |
| authentik tenant | separately licensed installation boundary with a PostgreSQL schema; documented multi-tenancy is alpha | not a Meridian tenant. It is a provider deployment boundary whose alpha status, cross-tenant expression-policy warning and recovery-key scope prohibit unreviewed adoption |
| authentik source | upstream authentication or directory source | a Platform Identity federation/provisioning adapter input; attributes remain untrusted until issuer, subject, tenant and mapping policy are validated |
| authentik provider/application | protocol exposure and the user-facing resource protected by it | an integration configuration, not a canonical Meridian application capability, entitlement or authorization policy |
| authentik user/service account | human or machine directory principal | authentication principal only; Party/domain-role links are separate and service accounts require workload-specific least privilege |
| Better Auth user/account/session | local authentication identity, linked account and session | current Meridian authentication adapter records behind Platform Identity; never synonymous with Party or tenant membership |
| Better Auth organization/member/role | plugin-local collaboration and administrative records | constrained adapter data under PDA-PLT-028; Platform Tenancy and Authorization remain authoritative and must mediate any mapping |
| Better Auth SSO provider/domain | OIDC/SAML connection and discovery/routing attributes | a tenant-scoped federation configuration; email domain is a routing hint only until ownership is proved and explicit organization binding is authorized |
| Better Auth SCIM connection/token | directory-provisioning connection and bearer credential, optionally organization-scoped | an admitted integration secret and provisioning boundary; it cannot directly grant business permissions or delete Party/domain facts |
| Entra tenant | Microsoft identity and administration boundary | an upstream directory issuer, not a Meridian tenant |
| Entra enterprise application/service principal/managed identity | application instance and workload identities | external workload principals that map to `developer.applications` or another registered Platform workload seam; managed credential lifecycle does not imply Meridian authorization |
| group, role or claim | provider-local grouping or token assertion | evidence used by an explicit, versioned mapping policy; never a canonical permission, entitlement or domain role by name alone |

## Comparative Capability Matrix

| Requirement | Documented patterns | Meridian disposition and rationale |
|---|---|---|
| isolation topology | Keycloak realms isolate major configuration and identity namespaces; organizations partition members inside a realm. authentik documents schema-isolated tenants but labels the feature alpha and warns expression policies can access all tenants. Better Auth scopes plugin records by configured organization/application data | **Custom boundary required.** Preserve Meridian tenant scope at every command, query, session-context and audit boundary. Provider topology is defense in depth, not proof of tenant isolation |
| enterprise federation | Keycloak brokers external identity providers; authentik sources connect upstream directories and social/OIDC/SAML systems; Better Auth SSO supports OIDC discovery, SAML, provider/domain routing and organization binding | **Extend conditionally.** Admit per-tenant connections through Platform Identity only after issuer/domain proof, metadata and redirect validation, account-link policy, secret/certificate lifecycle, rollback and audit are specified |
| lifecycle provisioning | Keycloak can create brokered members with managed/unmanaged organization lifecycle. Better Auth SSO can provision on sign-in; SCIM exposes provider and optional organization-scoped directory connections. Entra acts as a SCIM client for create/update/deprovision flows | **Improve.** Separate authentication-account activation from tenant membership, Party linkage and domain-role grants. Use idempotent staged commands, quarantine ambiguous matches and compensate rather than cascade-delete business facts |
| organization and role mapping | Keycloak organization claims and groups can reach tokens; authentik groups/roles/policies govern provider access; Better Auth can derive organization roles during SSO provisioning | **Reject direct business-role mapping.** Claims may propose a mapping, but Platform Authorization validates an allowlisted, versioned rule and records the decision. Job title or upstream administrator status is not Meridian authority |
| delegated administration | Keycloak supports fine-grained delegated realm administrators; authentik exposes permissioned administration; Better Auth SSO/SCIM management uses organization membership and configured roles/hooks | **Improve with Meridian commands.** Separate connection view, test, propose, approve, activate, rotate, suspend and delete permissions. Tenant administrator never inherits Platform support or another tenant’s identity administration |
| non-human identity | Keycloak client service accounts, authentik service accounts/tokens and Entra service principals/managed identities distinguish workload access from interactive users | **Adopt the distinction.** Prefer workload-bound or managed credentials, explicit owner, purpose, resource/audience, expiry and sign-in evidence. Never reuse a human account or grant a service principal through a Party role shortcut |
| credential and key rotation | Keycloak supports client-secret regeneration; authentik documents API-token expiration/rotation for service accounts; Better Auth SCIM can regenerate bearer tokens; Entra recommends managed identities or certificates and overlapping certificate rotation | **Improve.** Platform Secrets owns references, overlap window, activation, observation, rollback and revocation. A generated secret is shown once, never returned in logs/export, and rotation is incomplete until both sides are verified |
| recovery and break-glass | authentik recovery flows can verify and reset credentials; emergency recovery keys grant direct access and therefore require strong protection. Keycloak has bootstrap/emergency administrator paths. Better Auth provides governed account-recovery primitives | **Custom control required.** Separate user recovery, tenant-admin recovery and platform break-glass. Require strong verification, short expiry, session/factor revocation, protected evidence, notification and independent post-use review |
| audit and operational evidence | Keycloak administration and event facilities, authentik event/audit logs, Entra service-principal sign-in logs and Better Auth hooks/session records expose provider-local evidence | **Adopt via normalized audit intake.** Retain raw provider correlation and source time while recording the Meridian actor, tenant, command, decision, target, result and uncertainty. Provider retention cannot replace `platform.audit` |
| migration and exit | every provider owns schemas, identifiers, credential formats, sessions, protocol configuration and operational tooling | **Require reversible migration.** Inventory principals/connections, define stable external subject links, dual-validate where safe, stage cohorts, preserve old-provider read/evidence, revoke sessions/tokens, test rollback and reconcile unmapped identities |
| AI or automation | providers automate routing, provisioning and policy evaluation | **Constrain.** Deterministic mapping and ordinary commands remain authoritative. AI may explain conflicts or draft mappings but cannot link accounts, grant roles, approve recovery or suppress deprovisioning evidence |

## Interoperability and Contract Implications

Any admitted provider is behind Platform Identity and Developer Platform application/secret controls. OIDC issuer, subject and audience—or SAML issuer and persistent subject—form an external identity key; email is mutable contact/routing data, not the durable join. The canonical link to a real-world person or organization remains a separately authorized Party identity link.

SCIM is an external lifecycle input, not a business command bus. Create, update, suspend and deactivate requests must resolve tenant and connection, validate schema and scope, deduplicate, preserve upstream version/correlation, and invoke Platform Identity/Tenancy commands. Groups and roles are staged mapping inputs. External callbacks or asynchronous notifications enter through Developer Platform webhooks; provider event names never become canonical Meridian events.

At the evidence cutoff, the first-slice OpenAPI includes current-identity, organization, active-context, session, membership, role-assignment, audit and Party identity-link operations. It does not publish an enterprise federation, SCIM connection or external service-identity administration surface. Existing operations and `platform.support-access.approve` must not be repurposed as implicit federation authority.

## Canonical Traceability

Relevant capabilities are `platform.authentication`, `platform.identity`, `platform.tenancy`, `platform.organizations`, `platform.authorization`, `platform.delegation`, `platform.audit`, `platform.secrets`, `platform.party`, `party.identity-links`, `developer.applications`, and `developer.api-keys`.

Relevant existing events include `platform.account-recovery.completed.v1`, `platform.authentication-factor.enrolled.v1`, `platform.authentication-factor.removed.v1`, `platform.membership.invited.v1`, `platform.membership.activated.v1`, `platform.membership.suspended.v1`, `platform.membership.ended.v1`, `platform.role-assignment.granted.v1`, `platform.role-assignment.revoked.v1`, `platform.session.created.v1`, `platform.session.revoked.v1`, `platform.sso-session.created.v1`, and `party.identity-link.created.v1`. These existing facts do not pre-authorize new federation/SCIM events.

Relevant permissions include `platform.organization.read`, `platform.organization.update`, `platform.user.read`, `platform.user.invite`, `platform.user.suspend`, `platform.role.read`, `platform.role.assign`, `platform.audit.read`, and `platform.support-access.approve`. Any federation, SCIM, workload-identity or recovery-administration permission must be registered by its owner rather than coined in research prose.

## Sources

- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/) — official administration documentation covering realms, organizations, identity brokering, service accounts, delegated administrators and client-secret regeneration; retrieved 2026-07-16.
- [authentik Tenancy](https://docs.goauthentik.io/sys-mgmt/tenancy), [Sources](https://docs.goauthentik.io/users-sources/sources), [Providers](https://docs.goauthentik.io/providers/), [Service accounts](https://docs.goauthentik.io/sys-mgmt/service-accounts/), [event logging](https://docs.goauthentik.io/sys-mgmt/events/logging-events/), [recovery flows](https://docs.goauthentik.io/add-secure-apps/flows-stages/flow/), and [emergency recovery](https://docs.goauthentik.io/troubleshooting/login/) — official documentation; retrieved 2026-07-16. Tenancy is documented as Enterprise alpha and was not tested.
- [Better Auth SSO](https://better-auth.com/docs/plugins/sso), [SCIM](https://better-auth.com/docs/plugins/scim), and [Organization](https://better-auth.com/docs/plugins/organization) — official plugin documentation; retrieved 2026-07-16. Documentation presence is not Meridian adoption approval.
- [Microsoft Entra SCIM support](https://learn.microsoft.com/en-us/entra/identity/app-provisioning/scim-support-in-entra-id), [Securing managed identities](https://learn.microsoft.com/en-us/entra/architecture/service-accounts-managed-identities), and [Certificate rotation](https://learn.microsoft.com/en-us/entra/msidweb/authentication/certificates) — official Microsoft documentation; retrieved 2026-07-16.
