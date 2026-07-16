---
document_id: PDA-CIR-060
title: HR Competitive Capability Matrix
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0002, ADR-0003, ADR-0014]
---

# HR Competitive Capability Matrix

## Scope and authority

Rippling, BambooHR, HiBob, Deel, Workday, SAP SuccessFactors, Personio, and publicly accessible HR product documentation were reviewed as of 2026-07-16. A worker links to Party; authentication identity and the HR role record remain distinct. No vendor was validated for Guyana statutory completeness.

| Concern | Strong pattern | Risk | Meridian implication |
|---|---|---|---|
| worker record | effective-dated job, manager, location, status | duplicate identity and overwrite | Party link plus HR-owned effective-dated role facts |
| onboarding | task/document/approval orchestration | broad early access | staged authority with accountable owner and expiry |
| offboarding | access, equipment, payroll, documents | missed cross-domain revocation | observable checklist plus owning-domain commands |
| documents | templates, signatures, acknowledgements | sensitive copies and retention gaps | classification, access purpose, version, retention, integrity |
| benefits | eligibility/enrollment/provider seams | jurisdiction and provider overclaim | seam only until policy and jurisdiction evidence exist |
| reporting | workforce profile and lifecycle | re-identification | minimum necessary access, aggregation, export control |

## Decisions and limitations

Adopt effective dating, staged onboarding, explicit offboarding ownership, and worker self-service. Reject user-equals-worker, overwrite-based history, default broad manager access, and global HR/legal claims. Confidence is medium for workflow patterns and low for jurisdictional coverage.

## Sources

- [BambooHR onboarding](https://www.bamboohr.com/platform/onboarding) — official product documentation, retrieved 2026-07-16.
- [Workday human capital management](https://www.workday.com/en-us/products/human-capital-management/overview.html) — official product documentation, retrieved 2026-07-16.
- [SAP SuccessFactors Employee Central](https://www.sap.com/products/hcm/employee-central-hris.html) — official product documentation, retrieved 2026-07-16.
- [Personio employee lifecycle](https://www.personio.com/product/) — official product documentation, retrieved 2026-07-16.

