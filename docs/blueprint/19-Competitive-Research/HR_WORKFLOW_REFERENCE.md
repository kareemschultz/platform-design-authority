---
document_id: PDA-CIR-061
title: HR Workflow Reference
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# HR Workflow Reference

## Reference workflow

1. Resolve or create the Party through Party authority; create an HR-owned candidate/worker role with provenance.
2. Approve hire terms and effective dates; do not grant production access merely because a record exists.
3. Orchestrate onboarding tasks through owning domains: identity/session, permissions, device, equipment, payroll seam, policy acknowledgements.
4. Record job, manager, location, compensation reference, leave policy, and status as effective-dated facts.
5. Process transfers, corrections, leave, and termination with future/retroactive impact review.
6. Offboard by revoking authority and recovering assets through explicit commands; retain records per law and policy.

## Privacy and recovery

Purpose-limited field access, high-sensitivity audit, redacted exports, retention, deletion-journal handling, and emergency access review are mandatory. Mistaken Party linkage or effective date requires governed correction, not destructive rewrite.

## Confidence and evidence

Medium. Prototype Party linkage, future-dated changes, retroactive correction, offboarding failure, manager delegation, accessible self-service, and highly sensitive export controls. Legal and benefits policies require qualified review.

## Sources

- [SAP SuccessFactors Employee Central](https://help.sap.com/docs/SAP_SUCCESSFACTORS_EMPLOYEE_CENTRAL) — official documentation, retrieved 2026-07-16.
- [Workday security](https://www.workday.com/en-us/why-workday/trust/security.html) — official information, retrieved 2026-07-16.

