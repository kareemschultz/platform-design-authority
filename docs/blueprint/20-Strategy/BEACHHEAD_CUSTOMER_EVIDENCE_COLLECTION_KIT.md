---
document_id: PDA-STR-030
title: Beachhead Customer Evidence Collection Kit
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
related_adrs: [ADR-0014]
---

# Beachhead Customer Evidence Collection Kit

## Purpose and scope

This document is a **collection kit**, not evidence. It exists so the Founder can conduct issue [#82](https://github.com/kareemschultz/platform-design-authority/issues/82)'s required fieldwork — **8 structured retailer interviews, 3 direct workflow observations, across at least 3 distinct businesses** — with a consistent instrument that traces directly to PDA-STR-027's declared segment dimensions and evidence fields, and to WS3's actual proposed scope (`docs/blueprint/17-Roadmap/FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS3).

**This kit satisfies none of the #82 threshold by itself.** Never fill this repository document with real responses. Only a governed public-safe synthesis PR against `BEACHHEAD_EVIDENCE_LOG.md` and `MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md`, citing real evidence through the scheme approved under #94, may close #82. No agent may fill in example answers, generate illustrative transcripts, treat an interview count as validation, or mark any assumption confirmed from this file alone.

## Consent and privacy — hard constraint

Every interview and observation is conducted under the consent notice in §4, **marked DRAFT pending review by qualified Guyana counsel under issue [#84](https://github.com/kareemschultz/platform-design-authority/issues/84)**. Do not conduct fieldwork using this notice until qualified Guyana counsel—whether engaged through #84 or separately—has supplied dated, scoped written guidance covering the activity and that engagement and guidance are recorded under #84. ADR-0014's minimization, retention, deletion-journal, legal-hold, and auditable-erasure boundaries apply; this kit cannot infer their legal implementation or retention periods. Raw participant data (names, contact details, business-identifying detail, recordings, transcripts, photos, signatures, consent records, staff allegations, and customer detail) is **prohibited from this repository** per PDA-REV-019 and may be retained only after issue [#94](https://github.com/kareemschultz/platform-design-authority/issues/94) selects and acceptance-tests a restricted system, custody owner, access policy, retention/deletion/legal-hold policy, and opaque reference scheme. Issue #94 is currently open; its recommendation is not a Founder decision. This repository receives only:

- an **opaque evidence reference** (the `PDA-EV-XXXX-XXXX-XXXX` form is a placeholder; the actual format must be selected and issued through #94, not invented in a PR);
- a coarse date (month/year is sufficient unless a finer date carries no re-identification risk);
- a **de-identified synthesis** — pseudonymous segment/persona description, never a name, exact address, or other identifying detail;
- a confidence rating and stated decision impact.

## 1. Structured interview guide (target: 8 interviews, ≥3 businesses)

Each interview is approximately 45–60 minutes with an owner, manager, or senior cashier/register operator at a candidate beachhead retailer. After #94 closes and the scoped #84-qualified notice/consent review is recorded, record answers in the accepted restricted store under one opaque evidence reference per interview, a separate restricted business pseudonym used to prove the ≥3-business threshold, the consent-notice version, collector, and collection timestamp/time zone. Do not paste raw responses here or into any PR.

### Interview administration and quality control

- Ask the open question first. Use parenthetical categories only as optional coding probes after the participant answers; record `unknown`, `refused`, `not applicable`, and `not observed` rather than forcing a category.
- Ask for the most recent concrete occurrence before general opinions. Do not educate, demonstrate, name the proposed product, sell a solution, or reveal a preferred answer during the evidence section.
- For every material pain raised in questions 7–13, use the same neutral probes: most recent occurrence; frequency in a bounded recent period; duration; people/time involved; direct spend, loss, rework, shrinkage, lost-sale, or customer consequence; workaround/recovery; and whether each number is exact, estimated, or unknown.
- The restricted session manifest records: opaque session/evidence reference, restricted business pseudonym, participant pseudonym and coarse role, method, instrument version, consent version and modality, selected activity, facilitator/observer, exact start/end time and time zone, completion status, qualifying/non-qualifying status, protocol deviations, and withdrawal/deletion status. It contains no public identifiers.
- One completed consented session with one participant may count as one interview. A follow-up with the same participant does not inflate the threshold unless the Founder records why it is a substantively separate qualifying session. The #94 custodian verifies unique interview, observation, and distinct-business counts; an agent cannot self-attest them.
- After each session, the interviewer records a restricted data-quality note: possible leading, missing topics, participant role/knowledge limits, contradictions, researcher assumptions, and follow-up needed. This note is not evidence of the participant's workflow.

### 1.1 Business and segment context (PDA-STR-027 §Segment Dimensions)

1. What does the business sell, and roughly how many transactions does the front register handle on a typical day and on the busiest day of the week?
2. How many locations, registers, and staff who handle cash sales does the business have?
3. What makes products and pricing easy or difficult to track? After the open answer, optionally probe SKU count, variants, weights, bundles, and price changes.
4. Tell me about the most recent connectivity or power interruption during trading: how long it lasted, which functions continued or failed, whether a sale was delayed/lost/duplicated, and how records were reconciled afterward. If none is recalled, record `none recalled`; only then code the general reliability band.
5. What forms of payment do customers actually use at checkout today? After the open answer, code the reported mix (cash, card, mobile money, store credit, layaway/informal credit, other) and whether shares are measured or estimated.
6. What government or regulatory paperwork does the business actually complete for a sale today (receipts, VAT records, fiscal devices, or reports)? Separately label anything the participant believes may be required but does not currently perform; the interview is not legal-compliance evidence.

### 1.2 Current workflow and pain (PDA-STR-027 §Evidence Record: problem, persona, current workaround, frequency, severity, economic impact)

7. Walk me through the most recent ordinary sale, step by step, from a customer arriving at the register to them leaving with a receipt.
8. What system, notebook, or process do you use today to ring up a sale, and what do you like or dislike about it?
9. What happens when the register needs to open for the day, and what happens when it's counted and closed at the end of the day? Who does that, and how long does it take?
10. Without naming a staff member or customer, has the business encountered a till discrepancy or cash miscount? Ask about the detection and correction process, frequency band, and operational impact—not blame, suspected wrongdoing, or an identifiable allegation.
11. Separately describe the most recent example, if any, of: cancelling/voiding a sale; returning, refunding, or exchanging an item; and failing to produce or needing to reissue a receipt. For each, trace roles, approval, tender/cash-drawer effect, stock effect, accounting record, recovery, and time—without suggesting how a future system should work.
12. Does anyone reconcile the day's sales against what an accountant or bookkeeper later records? How does that handoff happen, what artifacts move, and what difficulties or failures (if any) occurred most recently?
13. What is the most important unresolved problem in sales, cash, or receipt handling? Apply the common bounded-period frequency, severity, economic-impact, workaround, and confidence probes above; record `none identified` if appropriate.

### 1.3 Alternatives, switching cost, and buying process (PDA-STR-027 §Evidence Record: alternatives, switching cost, buying process, willingness to pay)

14. What alternatives has the business actually evaluated, trialled, purchased, or used most recently? After the open answer, optionally probe POS software, spreadsheet/notebook, or a larger system; distinguish never-considered, considered, trialled, purchased, abandoned, and current use.
15. Who owns the budget and approval to change checkout, where would funding come from, what is the decision cycle/timeline, and what evidence would each approver need?
16. What does the current workaround cost in staff time, errors, hardware, or fees? Has the business actually budgeted, paid, trialled, signed up for, or committed to another solution? Only after those facts: if a system solved [the problem named in Q13] reliably, what one-time or recurring price would enter the buying process? A hypothetical answer alone is not validated willingness to pay.
17. What would make the business reject a change regardless of price? Ask open first, then optionally probe connectivity, devices/power/peripherals, hardware, training, language/digital literacy, data migration/export, rollout downtime, and operational disruption.

### 1.4 Implementation and support capacity

18. Who could configure, train, operate, and maintain a new system; what devices, power, peripherals, data migration, language, accessibility, and staff-time constraints would affect implementation?
19. When help is needed today, whom does the business contact, through which channel and hours, what response time is necessary, and what support burden would be unacceptable?
20. If the problem and fit are real, what concrete next step could the business consider—another meeting, hands-on trial, paid pilot, approved budget, deposit, or letter of intent? Record `none` without pressure. Classify willingness to pay as hypothetical, behavioral (existing spend/trial), or committed; only concrete behavior/commitment can support validated willingness to pay.

### 1.5 Wrap-up

21. Would you be willing to have someone from the team observe a real shift under the separately approved no-recording observation protocol?
22. Is there anything I should have asked but did not, or anything you want removed or clarified before the session ends?

## 2. Direct workflow observation protocol (target: 3 observations)

An observation is a non-participating, non-recording watch of one real register shift (open → sales → close) at a business already interviewed or newly recruited, ideally spanning at least one busy period. The business, participating staff, and any customer-facing notice/consent treatment must follow the #84-qualified protocol before observation begins.

**Rules:**
- No audio, video, photography, screen capture, automated transcription, or external-AI processing. Issue #94 contains recommendations but no Founder decision; these activities remain prohibited unless separately approved by the Founder after #84-qualified review and implemented through the accepted #94 controls.
- No handling of cash, the register, or customer interaction by the observer.
- Do not record customer or staff names, faces, contact details, item baskets, payment amounts, account/store-credit facts, card/wallet identifiers, receipt numbers, credentials, or allegations. Pause note-taking if sensitive detail cannot be avoided and follow the qualified withdrawal/deletion procedure.
- The observer logs only: elapsed time for each register-open/close/sale/void/refund/return event observed; any interruption (connectivity loss, till discrepancy, dispute, or staff confusion) at a non-identifying category level and how the workflow recovered; and a rough transaction-volume count for the observed window.
- Label direct observation separately from participant explanation and researcher interpretation. Do not convert an unobserved explanation into an observed fact.

**Qualifying-session rule:** one observation counts toward #82 only when the restricted manifest shows approved activity-specific consent/notice, at least 60 minutes of direct non-participating observation, at least five completed sale workflows (or a documented low-volume exception approved by the Founder), an observed open or close/count activity, and no material protocol violation. Across the three qualifying observations, the set must include at least one register-open and one register-close/count. Remote walkthroughs, interviews about a shift, and researcher inference do not count as direct observations. `Not observed` means no data for that event; it does not mean the event never occurs.

**Observation log fields** (goes into the restricted store, referenced here only by opaque ID):

| Field | Description |
|---|---|
| Evidence reference | Opaque ID issued by the accepted #94 system; `PDA-EV-XXXX-XXXX-XXXX` is a placeholder only |
| Consent/activity record | Approved notice version and consented activity; retained only in the restricted system |
| Collection time | Exact local timestamp and time zone in the restricted system; public output uses month/year or a coarser safe period |
| Restricted business pseudonym | Stable random code used by the custodian to prove the ≥3-business threshold; never a business name or public identifier |
| Segment (pseudonymous) | e.g. "small general retail, single location" |
| Observed window | Start/end, duration, rough transaction count, open/close coverage, qualifying status, and protocol deviations |
| Register-open time | Elapsed, any friction noted |
| Register-close/count time | Elapsed, any discrepancy noted |
| Interruptions observed | Connectivity, till discrepancy, dispute, other |
| Void/refund/return observed | Yes/no; how it was handled |
| Evidence basis | Direct observation / participant explanation / researcher interpretation |
| Notable friction | Free text, de-identified |

For each observed workflow event, the restricted log records a sequence number or relative time, coarse actor role, action/system/artifact, elapsed duration, directly observed outcome, exception/workaround, and separate fields for participant explanation, observer interpretation, and follow-up question. It never records a customer, staff member, item basket, amount, account, payment credential, receipt identifier, or allegation.

## 3. Sanitized synthesis format (what actually closes #82)

Once ≥8 interviews and ≥3 observations across ≥3 distinct businesses are logged in the accepted restricted store, the Founder—or an agent working only from a Founder-supplied public-safe synthesis, never raw evidence unless #94 explicitly authorizes that processing—produces a governed PR updating:

- `docs/blueprint/20-Strategy/BEACHHEAD_EVIDENCE_LOG.md` — use an individual opaque reference only when the #84/#94 public-safe rule permits it; otherwise publish an aggregated row citing multiple opaque references. Include only coarse date, broad segment, public-safe finding, confidence, owner, and follow-up. Suppress or combine sparse combinations that could identify one of the three businesses. No participant/business names, exact locations, unique product details, allegations, or verbatim quotes.
- `docs/blueprint/20-Strategy/MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md` §Evidence Log — same discipline, plus an explicit **confirmed / contradicted / unresolved** classification against each of PDA-STR-027's Beachhead Hypothesis Criteria, and any WS3 scope changes the evidence implies (e.g., a scope item in §WS3 of `FIRST_SLICE_IMPLEMENTATION_PLAN.md` that the evidence shows is wrong, missing, or lower/higher priority than assumed).
- `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md` — if the evidence implies a change to FDR-004's ratified scope, the Founder records an amendment there; market findings do not confirm FDR status, and this document does not itself carry founder authority.

**Required synthesis structure:**

```
### Confirmed assumptions
- [assumption] — supported by [N] of [M] evidence items, representative references: PDA-EV-...

### Contradicted assumptions
- [assumption] — contradicted by evidence references: PDA-EV-...; implication for WS3 scope: ...

### Unresolved questions
- [question] — evidence so far insufficient/mixed; needs: ...

### Required WS3 changes
- [change], driven by evidence references: PDA-EV-...
```

Classification is evidence-weighted, not vote-counting. A **confirmed** workflow assumption needs support across at least three distinct businesses and, where observable, both interview and direct-observation evidence. A single clear counterexample remains visible rather than being averaged away. Hypothetical willingness-to-pay answers are directional only; confirmation requires concrete buying evidence such as an existing spend, approved budget, trial, deposit, letter of intent, or comparable commitment. Every classification states coverage, contrary evidence, limitations, and whether the result changes WS3 or merely creates a follow-up question.

The synthesis includes a per-hypothesis matrix with: support / contradiction / no-data classification; distinct businesses; participant roles; interview count; direct-observation count; evidence basis; magnitude/range; representative approved opaque references; contrary evidence; alternative explanations; confidence; limitations; and decision impact. `Strong` requires the three-business rule plus behavioral/direct-observation triangulation where observable and no unexplained material contradiction; `moderate` lacks one of those elements; `weak` is single-business, hypothetical, or interpretation-only. The 8/3/3 counts are necessary but never sufficient for confirmation. The Founder and #94 custodian attest source coverage; an agent may summarize public-safe inputs but cannot upgrade evidence strength or erase a negative case.

The `PDA-EV-...` tokens in the structure above are schema placeholders, not evidence references and not authority to select that format. The #94 custodian verifies the interview, observation, and distinct-business counts from the restricted mapping; the public PR reports only aggregate counts and approved opaque references.

## 4. Consent notice template (DRAFT — pending #84 qualified counsel review)

> This template is not legal advice and must not be used with a real participant until qualified Guyana counsel—whether engaged through issue #84 or separately—has supplied dated, scoped written guidance covering notice, lawful basis, cross-border processing, retention, and withdrawal rights under applicable law, with the engagement and guidance recorded under #84.

---

**Research participation notice (DRAFT)**

You are being invited to take part in research about how retail businesses in Guyana currently handle sales, cash, and receipts. This is voluntary—you may decline or stop at any time, with no effect on any current or future relationship with [organization name—pending FDR/contracting-entity decision]. You may request withdrawal or non-use through the counsel-approved process described below, subject to its stated limits and the cutoff after permitted de-identified aggregation.

What we would like to do: [interview / observe a shift — select applicable].

What we will record: notes on your answers or on what we observe. [If recording is separately approved: describe the separately consented recording and its deletion/retention policy.] We will not collect incidental customer or staff identifying information, item baskets, amounts, account/store-credit facts, payment credentials, receipt identifiers, allegations, or other detail not necessary for the approved research purpose.

How your information will be used: your name and business will be replaced with a general description (e.g. "small general retailer") before anything is shared outside the named authorized group selected through #94. We will keep the connection between you and that description only in the accepted restricted system, not in the public project. Public summaries may combine multiple participants where an individual description could identify you or the business.

How long we keep it and who can see it: [pending #94 selection — restricted system, named custody owner, retention/deletion terms].

Your choices and requests: you may stop participation at any time and use [contact — pending #94/#84] to request access, correction, withdrawal, or deletion. Qualified review must state the applicable process, response limits, retention/legal-hold exceptions, and what can no longer be withdrawn after de-identified aggregation; this Draft does not promise a legal outcome.

Consent: I agree to the selected activity on the terms above. Interview: ☐ Yes ☐ No. Workflow observation: ☐ Yes ☐ No. Recording remains prohibited unless a separately approved notice and separate opt-in are supplied.

Consent documented by: _______________. Notice/consent version: __________. Modality: written / verbal documentation. Selected activity: interview / observation. Collector: __________. Date, time, and time zone: __________.

---

## 5. Non-goals

This kit does not select the restricted evidence store, opaque ID format, custody/access policy, recording policy, AI/transcription policy, legal basis, retention period, or cross-border posture (issue #94); does not obtain counsel review (issue #84); does not conduct or simulate any interview or observation; and does not mark any PDA-STR-027 criterion confirmed. It is instrument design only.
