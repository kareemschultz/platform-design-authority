---
document_id: PDA-CIR-091
title: Identity Administration, Provisioning, and Recovery Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0028]
---

# Identity Administration, Provisioning, and Recovery Reference

## Purpose and Scope

Translate CIR-BACK-022 evidence into safe future workflow hypotheses for enterprise federation, SCIM, service identity, credential rotation, recovery and provider migration. This is research input, not an implementation contract or authorization to enable functionality in PDA-PLT-028.

## Authority Separation

| Actor/system | May decide or own | Must not inherit automatically |
|---|---|---|
| Platform Identity | authentication account, credential, factor, protocol connection and session orchestration behind its adapter | Party identity, tenant hierarchy, business role, entitlement or domain behavior |
| tenant identity administrator | propose and operate approved connections for named organizations within granted scope | Platform-global identity administration, Party merge, arbitrary role mapping or support access |
| Security administrator | connection threat policy, secret/key controls, break-glass conditions and security response | ordinary tenant membership or business-domain ownership |
| upstream identity provider | authenticate a subject and emit signed assertions; send lifecycle records within an admitted connection | Meridian tenant resolution, Party truth, permission, entitlement or approval authority |
| provisioning service | request account/membership lifecycle transitions | deletion of Party, financial, audit or domain-role facts; silent ambiguity resolution |
| workload identity owner | request an application/service identity for a named purpose and resource | human impersonation or interactive tenant administration |
| reviewer/approver | approve a specific configuration, mapping, migration cohort, rotation or recovery action | authoring and executing every consequential change |
| AI/automation | explain differences, detect anomalies or propose mappings/actions | authority, account linking, recovery proof, role grant or migration success |

## Federation Connection Lifecycle

1. **Request.** Capture tenant/organization, protocol, upstream owner, business purpose, domains, expected subjects/groups, data classes, service level and exit owner.
2. **Discover and prove.** Retrieve metadata only from allowlisted HTTPS origins with bounded redirects, size and time. Verify issuer, endpoints, signing/encryption algorithms and domain control separately. A user-supplied email domain is not proof.
3. **Configure safely.** Store secrets/certificates through Platform Secrets; validate redirect/ACS URLs, audience/entity ID, NameID/subject stability, clock skew, signed-request/response policy, assertion encryption where required and metadata-refresh behavior.
4. **Map explicitly.** Define immutable external subject key, allowed claims, transformations, default deny, Party-link rules and a versioned group/role mapping proposal. Show collisions and unmatched records.
5. **Test.** Use a non-privileged test subject plus negative cases for wrong issuer/audience/domain, expired/not-yet-valid assertion, replay, unsigned/weak algorithm, account-link collision, disabled tenant and revoked mapping.
6. **Review and activate.** Maker-checker review binds exact connection, mapping, certificate fingerprints, domains and tenant scope. Activate a bounded cohort with local sign-in/break-glass retained.
7. **Observe and reconcile.** Monitor success/failure, linking, provisioning, session creation, latency, metadata/certificate expiry and cross-tenant denials. Quarantine ambiguous accounts rather than guessing.
8. **Suspend or retire.** Stop new federation first, preserve a tested recovery path, revoke sessions/tokens as policy requires, disable provisioning, reconcile memberships, retain protected evidence and remove secrets only after rollback expiry.

## SCIM and Lifecycle Provisioning Workflow

1. Register one tenant-scoped directory connection with named owner, base URL, provider identifier, secret reference, allowed resource types, attribute allowlist and rate limits.
2. Validate bearer/token scope and show it once; never log it. Test authorization with a non-destructive request before activation.
3. Resolve each request by connection and tenant before external identifier, username or email. Preserve upstream resource ID, version/ETag when available, correlation and received time.
4. Normalize and validate attributes. Treat group and role data as mapping input, not authorization. Reject protected-field writes and quarantine ambiguous matches.
5. Execute idempotent Platform Identity or Tenancy commands. Create an authentication account independently from Party linkage; invite/activate/suspend membership independently from domain-role changes.
6. On deactivation, block new authentication and revoke sessions according to policy, then initiate separately owned membership/role reviews. Do not erase Party, audit or domain records.
7. Return protocol-safe errors without exposing tenant existence or sensitive matching data. Bound retries and rate limits; dead-letter unresolved records with visible owner and deadline.
8. Reconcile provider inventory against Meridian account and membership state. Report missing, duplicate, stale, quarantined and failed objects; never infer success from an HTTP acknowledgement alone.

## Service Identity and Rotation Workflow

1. Name application/workload owner, tenant scope, purpose, resources/audiences, environments, data classification, expiry and disable path.
2. Prefer platform/workload-managed identity where the deployment supports it. Otherwise prefer asymmetric credentials over shared secrets and prohibit human credential reuse.
3. Grant minimum application authority through the owning application contract. Human roles, Party records and interactive sessions are not shortcuts.
4. For rotation, create a second credential, distribute its reference, verify actual use, observe both old and new identifiers, revoke the old credential, and test failure/recovery. Record overlap and maximum expiry.
5. Alert on expiry, unused credentials, anomalous source/resource, excessive failures, dormant principals and owner departure. Every principal has an accountable non-service owner.
6. Disable and revoke before deleting. Preserve sign-in and authorization evidence according to Security, Privacy and Audit policy.

## Recovery and Break-Glass Classes

| Class | Required evidence and control | Recovery completion |
|---|---|---|
| user self-service recovery | anti-enumeration, verified recovery channel or strong enrolled factor, short single-use token, attempt/rate limits, risk signals and user notification | credential/factor changed, affected sessions reviewed/revoked, event recorded and user can authenticate safely |
| assisted user recovery | authenticated support workflow, independent identity evidence appropriate to risk, no disclosure of credential, maker-checker for privileged accounts | same as self-service plus support-action review and protected evidence |
| tenant identity-admin recovery | stronger factors, tenant authority revalidation, separate approver, no recovery by a sole affected administrator | administrator restored with scoped authority, all emergency sessions/tokens reviewed and tenant notified |
| platform break-glass | offline-protected credential/key, two-person access where feasible, time-bound elevation, explicit incident, immediate alert and command/session recording | ordinary control plane restored, emergency access revoked/rotated, independent post-incident review complete |
| provider outage/federation lockout | tested local fallback or alternate connection, health threshold, controlled failover and communication | provider recovered or alternate stabilized, queued lifecycle work reconciled, fallback sessions reviewed |

## Threat and Failure Matrix

| Threat/failure | Required control | Evidence retained |
|---|---|---|
| realm/tenant/organization term collision | explicit mapping object, tenant join at every command/query, provider topology never accepted as authorization | provider boundary, Meridian tenant/organization, mapping version and denial reason |
| account-link takeover | issuer-plus-subject key, verified-email rules, no email-only auto-link for privileged/existing accounts, collision quarantine | original/candidate accounts, claims, policy result, reviewer disposition |
| domain discovery takeover | DNS/domain proof, explicit organization binding, expiry/reverification and manual review for high-risk domains | proof method, token/fingerprint, verified time, bound organizations |
| metadata SSRF or malicious endpoints | HTTPS allowlist, DNS/IP protections, redirect/size/time bounds, schema validation and pinned issuer | requested/resolved URLs, validation outcome, content hash and rejection reason |
| token/assertion replay or injection | state/nonce, PKCE where applicable, request correlation/InResponseTo, audience/recipient/destination, signature, time and one-time replay cache | transaction ID, issuer/subject/audience, validation steps and safe error |
| group-to-role escalation | allowlisted versioned mapping, default deny, risk classification, maker-checker and previewed grants/revokes | incoming group/claim, proposed canonical action, approval and result |
| deprovisioning destroys business truth | lifecycle separation, suspend before delete, downstream owner review and compensation | upstream request, account/session action, membership/domain review status |
| SCIM token compromise | tenant/provider scope, protected storage, rotation, rate/anomaly controls and immediate revoke path | token identifier/hash only, issuance/rotation/revocation and use telemetry |
| service identity crosses tenants | audience/resource and tenant binding, non-human principal type, least privilege and no interactive login | principal, owner, tenant, credential ID, resource and authorization decision |
| rotation outage | overlapping credentials, observable credential ID, staged consumers, rollback and expiry alert | old/new IDs, activation observations, revoke and rollback outcome |
| recovery link/key compromise | short single use, strong delivery/storage, bound user/action, immediate session review and audit alert | token ID/hash, issuer, recipient, redemption and protective actions |
| compromised upstream IdP | connection kill switch, risk policy, session revoke, fallback, impacted-subject query and incident runbook | connection/version, impacted sessions/accounts, actions and reconciliation |
| privilege revoked mid-session | short session/token, authorization recheck for consequential commands and revocation propagation | session, permission version, revoke time and denied/terminated operations |
| migration mismatch or lockout | dry-run inventory, stable crosswalk, cohorts, dual validation, exception queue, rollback and reconciliation | source/target IDs, cohort, exceptions, session/token disposition and sign-off |
| incomplete provider audit | normalized Meridian audit plus provider correlation and clock/provenance | actor/principal, tenant, command, target, provider event, result and uncertainty |

## UX, Accessibility, Offline, and Failure Requirements

- Connection screens must show Meridian tenant/organization, provider issuer, protocol, verified domains, status, owner, certificate/secret expiry, mapping version, last test and last successful use. Provider terms must be labeled as provider-local.
- Mapping review presents additions, revocations, collisions, protected roles, excluded records and downstream reviews. Bulk approval cannot hide high-risk changes in a count.
- Recovery never reveals whether an arbitrary account exists. Accessible status and errors use text, not color alone; keyboard and screen-reader users receive the same expiry, consequence, progress and recovery choices.
- Narrow screens may observe status or approve only when the entire issuer, tenant, mapping consequence and recovery path remain visible. High-risk connection editing is not reduced to ambiguous mobile toggles.
- Offline sign-in may use only separately specified bounded assertions. Federation, SCIM, role mapping, service-identity issuance, credential rotation, recovery and break-glass require current server authority; queued offline administration is prohibited.
- Failed or uncertain operations retain explicit state and owner. No spinner, redirect, provider `200`, webhook delivery or queue dispatch is proof that identity state converged.

## API, Events, Permissions, Testing, and Migration

An admitted specification must define owner commands for connection request/test/approve/activate/suspend/retire, mapping preview/approve, SCIM token issue/rotate/revoke, reconciliation, workload-principal lifecycle, recovery and migration cohorts. Public operations require OpenAPI, explicit permissions or authenticated context, typed safe errors, idempotency, rate bounds and audit correlation. New canonical events are registered only when owners and consumers are known.

Test coverage must include cross-tenant issuer/subject collision, domain takeover, metadata SSRF, redirect/ACS manipulation, weak algorithms, replay, clock skew, account-link collision, group escalation, duplicate/out-of-order SCIM, partial deprovisioning, secret leakage, rotation overlap/rollback, service-principal misuse, recovery enumeration/token theft, disabled tenant, revoked administrator, provider outage, database/worker restart, audit completeness, accessibility and data exit.

Migration evidence must inventory users, accounts, credentials, factors, sessions, connections, mappings, service principals and audit retention; define immutable crosswalks; identify non-exportable password/passkey secrets; require reauthentication or re-enrollment where necessary; run cohorts with rollback; revoke old sessions/credentials; and reconcile every exception before declaring completion.

## Traceability

PDA-FND-013, ADR-0003, ADR-0006, ADR-0007, ADR-0014, ADR-0028, PDA-PLT-002, PDA-PLT-003, PDA-PLT-004, PDA-PLT-020, PDA-PLT-021, PDA-PLT-028, PDA-SEC-011, PDA-SEC-012, PDA-SEC-013, PDA-DEV-003, PDA-CIR-090, `registry/capabilities.json`, `registry/events.json`, `registry/permissions.json`, `registry/endpoint-permissions.json`, and `openapi/first-slice-v1.yaml`.
