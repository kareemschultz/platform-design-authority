---
document_id: PDA-SEC-001
title: Security Section Index
version: 0.5.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
---

# Security

## Artifact Catalog

- [Privacy Rights and Retention](PRIVACY_RIGHTS_AND_RETENTION.md) — `PDA-SEC-002` · Draft
- [Risk Fraud and Anomaly Management](RISK_FRAUD_AND_ANOMALY.md) — `PDA-SEC-003` · Draft
- [PII Erasure and Pseudonymization](PII_ERASURE_AND_PSEUDONYMIZATION.md) — `PDA-SEC-010` · Draft
- [Threat Model and Tenant Isolation Strategy](THREAT_MODEL_AND_TENANT_ISOLATION_STRATEGY.md) — `PDA-SEC-011` · Draft
- [Security Architecture and Control Framework](SECURITY_ARCHITECTURE_AND_CONTROL_FRAMEWORK.md) — `PDA-SEC-012` · Draft
- [Cryptography Key and Secret Lifecycle](CRYPTOGRAPHY_KEY_AND_SECRET_LIFECYCLE.md) — `PDA-SEC-013` · Draft
- [Secure Software Supply Chain and Vulnerability Management](SECURE_SOFTWARE_SUPPLY_CHAIN_AND_VULNERABILITY_MANAGEMENT.md) — `PDA-SEC-014` · Draft
- [API Webhook Extension and Device Security](API_WEBHOOK_EXTENSION_AND_DEVICE_SECURITY.md) — `PDA-SEC-015` · Draft
- [Provider Risk Assessment Template](PROVIDER_RISK_ASSESSMENT_TEMPLATE.md) — `PDA-SEC-016` · Draft
- [Security Control Evidence and Legal Hold Matrix](SECURITY_CONTROL_EVIDENCE_AND_LEGAL_HOLD_MATRIX.md) — `PDA-SEC-017` · Draft

## Related Authority

- `docs/blueprint/15-Operations/SECURITY_OPERATIONS_AND_FORENSICS.md`
- `docs/blueprint/15-Operations/OPERATIONAL_EXERCISE_TEMPLATES.md`
- `docs/blueprint/01-Platform/BETTER_AUTH_IDENTITY_ARCHITECTURE.md`
- `docs/blueprint/01-Platform/AUTHORIZATION_AND_POLICY.md`
- `docs/blueprint/01-Platform/SECRETS_KEYS_AND_CREDENTIALS.md`
- `docs/blueprint/01-Platform/RATE_LIMITS_QUOTAS_AND_ABUSE_CONTROLS.md`
- `docs/blueprint/01-Platform/DEVICE_AND_EDGE_MANAGEMENT.md`
- `docs/blueprint/01-Platform/OFFLINE_SYNCHRONIZATION.md`
- `docs/blueprint/12-Deployment/BACKUP_RESTORE_AND_DISASTER_RECOVERY.md`

## Current Governed Controls

- Control ownership and evidence
- Threat and tenant-isolation model
- Key, secret, credential, and compromise lifecycle
- Supply-chain provenance, SBOM, vulnerability, and disclosure
- API, webhook, extension, provider, and device security
- Provider risk assessment
- Privacy rights, erasure, legal hold, retention, and backup reapplication
- Risk-signal retention classes
- Security severity, evidence retention, forensics, and notification flow

## Remaining Implementation Evidence

- Executable control-mapping system
- Authentication and support-access diagrams
- Penetration testing
- Key-rotation and compromise exercise results
- Artifact signing implementation
- Vulnerability-management tooling
- Device-security laboratory tests
- Customer assurance packages and certifications

Security requirements apply across every domain, engine, client, provider, deployment, partner, extension, and AI tool.
