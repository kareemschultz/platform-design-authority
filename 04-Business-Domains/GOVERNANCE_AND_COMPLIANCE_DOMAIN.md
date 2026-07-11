---
document_id: PDA-DOM-019
title: Governance and Compliance Domain
version: 0.2.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-10
---

# Governance and Compliance Domain

## Purpose

Own obligations, controls, enterprise risks, assessments, evidence, policies, audits, incidents, corrective actions, attestations, and compliance reporting across the organization.

## Core Capabilities

- Laws, regulations, standards, contracts, and internal obligations
- Control libraries, ownership, frequency, testing, evidence, and effectiveness
- Enterprise, operational, financial, privacy, security, and third-party risk registers
- Assessments, questionnaires, certifications, and compliance calendars
- Internal audits, findings, recommendations, and management responses
- Governance incidents, breaches, investigations, root cause, and corrective action
- Policy linkage, employee attestations, exceptions, and waivers
- Vendor and third-party due diligence, monitoring, and remediation
- Regulatory reporting, evidence packages, and audit trails
- Compliance dashboards, risk heat maps, maturity, and overdue actions

## Authoritative Entities

Obligation, Control, Enterprise Risk, Control Assessment, Audit, Finding, Governance Incident, Corrective Action, Exception, Evidence Record, and Attestation.

## Boundaries

Documents and Knowledge owns controlled content. Security owns technical security controls and the Risk, Fraud, and Anomaly service for transaction-level signals, assessments, protective decisions, and risk cases. Workforce owns employee actions. Finance owns financial records. Governance and Compliance owns the enterprise control framework and evidence that obligations are met.

A Security Risk Case may create or link to a Governance Incident, Enterprise Risk, Control Assessment, or Corrective Action. Governance does not replace real-time fraud decisions, and Security does not own the enterprise risk register.

## Quality Requirements

- Effective dating and regulatory-jurisdiction context
- Immutable evidence and review history
- Segregation of control owner, tester, and approver
- Confidential investigation and whistleblower controls
- Retention, legal hold, pseudonymization, and export integrity
- Traceable links between transactional risk cases and governance remediation
- Explainable AI assistance without autonomous compliance conclusions