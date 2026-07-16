---
document_id: PDA-CIR-087
title: ITSM, MSP, and RMM Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014, ADR-0019]
---

# ITSM, MSP, and RMM Competitive Capability Matrix

## Purpose and Decision Boundary

Answer CIR-BACK-021 with documented first-party evidence about incident/problem/change relationships, managed-service agreements, configuration and device evidence, remote actions, automation, credentials, tenant/client boundaries, and operator authority.

This research does not admit managed-service, RMM, remote-control, or service-desk implementation scope. It creates no capability, event, permission, endpoint, schema, provider selection, or first-slice expansion. Service remains owner of service records; Assets and Maintenance own operational asset facts; Platform owns tenant/device/secret/audit controls; Developer Platform owns external webhooks and integration admission.

## Scope, Evidence, and Limits

- Evidence cutoff: 2026-07-16.
- Products: ServiceNow, Freshservice/Freshservice for MSPs, HaloPSA, ConnectWise PSA, NinjaOne, SuperOps, Datto RMM, and IT Glue.
- Evidence mode: current public first-party product, help, developer, security, and administration documentation.
- Not observed: configured customer tenants, paid editions, remote sessions, agent deployment, billing reconciliation, API behavior, accessibility, support quality, scale, recovery exercises, or Guyana availability.
- Confidence: Medium for documented workflow and control patterns; Low for product quality, safe defaults, operational effectiveness, and edition parity.

## Comparative Matrix

| Requirement | Documented product patterns | Meridian disposition and rationale |
|---|---|---|
| Incident restoration | ServiceNow separates incident restoration and escalation from longer-term analysis; HaloPSA and ConnectWise expose ticket state, owner, queue/board, tasks, and resolution evidence | **Adopt** separate restoration outcome, ownership, affected service/asset, communications, and closure evidence; a closed ticket is not proof the underlying domain fact is corrected |
| Problem and known-error work | ServiceNow links Problems to affected configuration items and dependent CIs; problem models can vary lifecycle and transitions | **Improve** with explicit symptom-to-problem evidence, affected-scope snapshots, hypotheses, known workaround version, recurrence measure, and authorized follow-up change; discovery remains projection, not asset authority |
| Change control | ServiceNow documents a lifecycle intended to minimize service disruption; HaloPSA exposes approvals/releases; ConnectWise supports workflow conditions/actions | **Adopt** risk, affected scope, approval, plan, test, maintenance window, rollback, verification, and evidence; **reject** generic workflow approval as authority to alter another domain |
| Service agreement and SLA | ConnectWise applies agreement/configuration/default SLA precedence and exposes response/resolution clocks; Freshservice MSPs and HaloPSA organize customer/client service delivery | **Improve** with versioned `service.contracts`, `service.entitlements`, and `service.sla`; preserve Platform Subscription and Recurring Agreement terminology and do not let a ticketing tool own commercial or Finance facts |
| Client/workspace isolation | Freshservice distinguishes ESM workspaces from MSP clients and documents account/client installation scope; multi-account mode offers stronger isolation than multiple companies in one account | **Adopt principle, custom boundary required**: tenant is never a UI workspace; partner delegation is separately granted, resource scoped, time bounded, and audited; cross-client analytics use classified projections |
| Ticket-to-configuration/device context | ConnectWise tickets may attach configurations/devices and launch integrated control; ServiceNow Problems associate affected CIs; RMM products maintain device inventories | **Improve** by linking immutable asset/device references plus freshness and source; Service may not become the authoritative asset, network, credential, or Party store |
| Remote support | NinjaOne and Datto expose remote control with role/device permissions and optional or policy-driven end-user approval; agent/enrollment types change available control | **Custom Meridian required**: preflight authority, tenant/resource scope, user presence/consent policy, reason, session identity, recording policy, command class, expiry, kill switch, evidence, and post-action verification |
| Script and automation execution | NinjaOne and SuperOps run or schedule scripts at device/client/site scope; NinjaOne records sent values/results in activity views and allows automation-category permissioning; Datto jobs/components are gated by security levels | **Improve** with signed/versioned automation, immutable hash, parameter classification, dry run where possible, staged cohort, concurrency/rate limit, approval by risk class, idempotency, timeout, rollback/compensation, per-target outcome, and evidence retention |
| Credentials and secure fields | NinjaOne can execute using stored credentials; IT Glue documents password encryption, permission layers, offboarding exposure reports, and activity logging | **Reject embedded credential ownership in Service/RMM records**; Platform Secrets supplies short-lived references or brokered access, never plaintext export or parameter echo; every access and use is separately audited |
| Device visibility and delegated roles | NinjaOne roles scope organizations, devices, policies, automations, ticketing, and documentation; Datto security levels can restrict sites/groups/devices and remote tools | **Adopt least privilege, improve default**: zero authority by default; separate view, diagnose, interact, automate, credential-use, policy-change, and approval permissions; support role never implies tenant administration |
| Consent and privacy mode | NinjaOne supports end-user confirmation and visible remote-session notification; Datto distinguishes managed/on-demand agents and privacy-mode behavior | **Adopt explicit presence policy** but do not equate product setting with lawful consent; jurisdiction, tenant policy, employment context, device ownership, emergency access, notice, and evidence require Security/Privacy review |
| Monitoring-to-ticket automation | Datto and ConnectWise describe alerts/RMM events creating tickets; SuperOps combines monitoring, tickets, policies, and automation | **Improve** with dedupe/correlation, alert source and freshness, deterministic routing, uncertain state, suppression evidence, retry/dead-letter handling, and separation between monitoring signal, incident, problem, and business impact |
| Audit and evidence | NinjaOne exposes automation activity; Datto exposes audits/security-level controls; IT Glue exposes activity logs; ticket platforms retain work notes/tasks/attachments | **Custom evidence contract required**: actor, tenant, client/delegation, target, action definition/hash, parameters after redaction, authority decision, consent, start/end, result, output classification, correlation, failure/uncertainty, and linked incident/change |
| API and integration scope | Freshservice documents client/workspace-aware APIs; SuperOps has a developer API; ConnectWise integrates PSA/configuration/RMM surfaces | **Adopt external contract discipline**: adapters call domain commands; external callbacks enter Developer Platform webhooks; provider objects never become canonical business contracts |
| AI assistance | ServiceNow documents agentic ITSM workflows and several vendors market AI assistance | **Defer consequential autonomy**: AI may summarize, classify, propose diagnostics, or draft plans; execution uses ordinary authorized commands with deterministic fallback, explicit risk controls, and no prompt-derived authority |

## Product Emphasis and Edition Cautions

| Product family | Strong documented lens | Caution |
|---|---|---|
| ServiceNow | incident/problem/change lifecycle and CI relationship depth | broad configurable platform; plugins, roles, edition, and tenant configuration vary |
| Freshservice for MSPs | client/workspace vocabulary, portal/client scope, app-installation isolation | ESM, MSP mode, and multi-account isolation are materially different models |
| HaloPSA | PSA service desk, ITIL processes, agreements, assets, approvals, and API/admin surface | public guides are an index; configured behavior and current edition details were not observed |
| ConnectWise PSA | tickets, boards, agreements, SLAs, configurations, workflow rules, scheduling, time and finance context | documentation spans editions and versions; PSA context must not be copied as Meridian ownership |
| NinjaOne | device-scoped remote support, role permissions, automation categories, execution activity, consent settings | agent/OS/enrollment and subscription affect control; direct security effectiveness untested |
| SuperOps | combined PSA/RMM, client/site/asset scripts, policy automation, developer API | public help supports pattern discovery; authority defaults and execution evidence were not directly tested |
| Datto RMM | security levels, site/group/device visibility, remote-tool restriction, privacy mode, agent modes, jobs | account-wide settings and immutable administrator roles need explicit Meridian rejection/containment review |
| IT Glue | structured documentation, password protection, permissions, exposure/offboarding report, activity log | vendor security claims are not independent assurance and do not justify making documentation a secret authority |

## Meridian Traceability

Relevant canonical capabilities are `service.incidents`, `service.problems`, `service.requests`, `service.cases`, `service.contracts`, `service.entitlements`, `service.sla`, `service.queues`, `service.routing`, `maintenance.work-orders`, `maintenance.failures`, `platform.devices`, `platform.jobs`, `platform.secrets`, `platform.audit`, `platform.delegation`, `engine.workflow`, `engine.automation`, `engine.approvals`, `developer.applications`, `developer.webhooks`, and `developer.event-delivery`.

At this cutoff, no Service-specific permission family, canonical Service event family, or Service/RMM OpenAPI surface is registered. Any admitted implementation must use capability registration and ADR review where ownership, persistence, public contracts, extension execution, security, or deployment changes. Research prose must not pre-allocate identifiers.

## Sources

- [ServiceNow Incident Management](https://www.servicenow.com/docs/r/it-service-management/incident-management/c_IncidentManagement.html), [Problem Management use case](https://www.servicenow.com/docs/r/it-service-management/problem-management/pm-use-case-example.html), and [Change Management](https://www.servicenow.com/docs/r/it-service-management/change-management/c_ITILChangeManagement.html) — official documentation, Australia release, retrieved 2026-07-16.
- [Freshservice MSP account modes](https://support.freshservice.com/support/solutions/articles/50000012090-change-account-modes-on-multiple-requester-portals), [MSP app installation scope](https://support.freshservice.com/support/solutions/articles/50000011810-app-installation-types-in-freshservice), and [Freshservice API](https://api.freshservice.com/) — official support/developer documentation, retrieved 2026-07-16.
- [HaloPSA Guides](https://halopsa.com/guides/) — official guide index, retrieved 2026-07-16.
- [ConnectWise service ticket](https://docs.connectwise.com/ConnectWise_Documentation/060/010/010/001), [workflow rules](https://docs.connectwise.com/ConnectWise_Documentation/090/020/070/130), and [agreement types](https://docs.connectwise.com/ConnectWise_Documentation/090/020/020/010) — official documentation, retrieved 2026-07-16.
- [NinjaOne on-demand automation](https://www.ninjaone.com/docs/scripting-and-automation/running-automation-scripts-on-demand/), [remote support](https://www.ninjaone.com/docs/endpoint-management/remote-control/ninjaone-remote/), and [roles and permissions](https://www.ninjaone.com/docs/endpoint-management/users/user-roles-and-permissions/) — official documentation, retrieved 2026-07-16.
- [SuperOps scripts](https://support.superops.com/en/articles/7054997-using-scripts-in-superops) and [developer API](https://developer.superops.com/) — official help/developer documentation, retrieved 2026-07-16.
- [Datto RMM security levels](https://rmm.datto.com/help/en/Content/3NEWUI/Setup/SecurityLevels.htm), [managed/on-demand agents](https://rmm.datto.com/help/en/Content/3NEWUI/Devices/ManagedOnDemandAgent.htm), and [policies/privacy mode](https://rmm.datto.com/help/en/Content/3NEWUI/Policies/Policies.htm) — official documentation, retrieved 2026-07-16.
- [IT Glue Security](https://www.itglue.com/resources/itglue-security/) — official security documentation, retrieved 2026-07-16; vendor control claims were not independently verified.
