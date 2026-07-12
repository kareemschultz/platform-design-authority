---
document_id: PDA-OPS-013
title: Security Operations and Forensics
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-11
---

# Security Operations and Forensics

## Purpose

Define detection, triage, containment, evidence preservation, investigation, eradication, recovery, notification, and lessons learned for security and privacy incidents.

## Detection Sources

- Identity and session anomalies
- Tenant-isolation alerts
- Provider and webhook anomalies
- Privileged access and support activity
- Data export and privacy failures
- Vulnerability reports
- Dependency and infrastructure alerts
- AI tool and retrieval anomalies
- Customer and partner reports

## Security Severity Mapping

| Security level | Operational mapping | Examples | Initial response target |
|---|---|---|---:|
| SEC-1 Critical | Severity 1 | Confirmed cross-tenant disclosure, active secret compromise, unauthorized financial mutation, widespread account takeover, destructive supply-chain compromise | 15 minutes |
| SEC-2 Major | Severity 2 | Material single-tenant disclosure, privileged-account compromise, exploitable high-risk vulnerability, major fraud or provider-security event | 30 minutes |
| SEC-3 Moderate | Severity 3 | Bounded suspicious activity, limited control failure, vulnerability with meaningful mitigations | 4 hours |
| SEC-4 Minor | Severity 4 | Low-impact defect, unsuccessful probe, hardening improvement | 1 business day |

Response targets begin incident ownership and containment; they are not promises of full resolution.

## Triage

Triage records:

- Detection source and time
- Affected tenant, data, capability, region, provider, and version
- Confidentiality, integrity, availability, privacy, financial, and statutory impact
- Active exploitation or exposure
- Evidence quality
- Current containment
- Operational and regulatory severity
- Incident commander and security lead
- Next update time

Cross-tenant exposure, Secret data, payment credentials, signing keys, stored-value corruption, or unauthorized privileged action cannot be classified below SEC-2 without documented security approval.

## Investigation

Preserve privacy-safe logs, audit records, traces, configuration, provider evidence, affected versions, deployment artifacts, identities, and chain of custody. Investigators receive least-privilege, time-limited access.

Investigation must distinguish:

- Confirmed facts
- Suspected scope
- Unknown scope
- Reconstructed timeline
- Provider assertions
- Customer reports
- Forensic inference

## Containment

Use the narrowest safe control:

- Revoke session, credential, key, API client, device, integration, extension, provider adapter, AI tool, or support access
- Pause a tenant, region, capability, import, export, webhook, job, or workflow
- Disable a release or roll back
- Restrict high-risk financial or privacy operations
- Isolate a recovery environment

Every containment records authority, reason, start, expiry or review time, affected customers, and reversal conditions.

## Evidence Retention

Provisional minimums, subject to legal and contractual review:

| Evidence | Minimum operational retention |
|---|---:|
| Critical and Major incident case, timeline, decisions, and final report | 7 years |
| Security audit events supporting an incident | 7 years or longer legal hold |
| Forensic disk, memory, packet, or provider evidence | 1 year after closure, then reviewed |
| Moderate incident case | 3 years |
| Minor security event and unsuccessful probe detail | 1 year |
| Chain-of-custody and legal-hold metadata | Life of retained evidence plus 1 year |

Raw personal or Secret content is minimized and retained only when necessary. Legal hold overrides ordinary deletion. Retention values require qualified legal review before pilot.

## Forensics

Forensic collection is authorized, documented, immutable where practical, time synchronized, hashed, access-controlled, and separated from ordinary support diagnostics.

Chain of custody records collector, method, time, source, hash, transfer, access, storage, and disposition.

## Notification Decision Flow

1. Was personal, confidential, Secret, financial, or regulated data accessed, altered, lost, or made unavailable?
2. Which tenant, subjects, jurisdictions, providers, and contracts apply?
3. Is the incident ongoing, contained, or uncertain?
4. Do verified laws or contracts impose a clock, content, recipient, or regulator requirement?
5. Can notice create additional security risk, and what safe interim communication is needed?
6. Who approves customer, regulator, provider, insurer, law-enforcement, and public communication?
7. How are facts, uncertainty, mitigation, required customer action, and next update communicated?

The Guyana Data Protection Act 2023 must not be treated as fully operative without verified commencement and qualified advice. Nevertheless, the platform maintains breach-ready evidence and uses the strictest applicable contractual or jurisdictional requirement.

## Communication

Coordinate Security, Privacy, Legal, Operations, Support, Product, affected customers, partners, providers, insurers, and regulators.

Communications state:

- What is known
- What is unknown
- Affected service and data
- Start and detection time
- Containment status
- Customer action
- Next update
- Reconciliation and restoration status

Do not claim resolution before affected authority, financial state, privacy targets, and external providers are reconciled.

## Eradication and Recovery

- Remove malicious access and persistence
- Rotate affected credentials and keys
- Patch and verify vulnerable components
- Restore from trusted artifacts and data
- Reapply privacy transformations
- Reconcile ledgers, payments, stored value, inventory, and events
- Run tenant-isolation and regression tests
- Monitor for recurrence

## Post-Incident Review

Complete for SEC-1 and SEC-2 and material SEC-3 incidents. Record timeline, causes, control performance, detection delay, response, communication, customer impact, regulatory assessment, corrective actions, owners, deadlines, and verification evidence.

## Quality Gates

- Incident playbooks
- Severity and response-time drills
- Tabletop and technical exercises
- Evidence-retention implementation
- Tenant-scoped containment test
- Provider escalation contacts
- Regulatory-notification decision rehearsal
- Chain-of-custody test
- Post-incident regression and control updates
- Corrective-action tracking to verified closure
