---
document_id: PDA-STR-030
title: Beachhead Customer Evidence Collection Kit
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-18
---

# Beachhead Customer Evidence Collection Kit

## Purpose and scope

This document is a **collection kit**, not evidence. It exists so the Founder can conduct issue [#82](https://github.com/kareemschultz/platform-design-authority/issues/82)'s required fieldwork — **8 structured retailer interviews, 3 direct workflow observations, across at least 3 distinct businesses** — with a consistent instrument that traces directly to PDA-STR-027's declared segment dimensions and evidence fields, and to WS3's actual proposed scope (`docs/blueprint/17-Roadmap/FIRST_SLICE_IMPLEMENTATION_PLAN.md` §WS3).

**This kit satisfies none of the #82 threshold by itself.** Filling in this document with real dated responses does not close #82; only the governed synthesis PR against `BEACHHEAD_EVIDENCE_LOG.md` and `MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md`, citing real participant evidence, closes it. No agent may fill in example answers, generate illustrative transcripts, or mark any assumption confirmed from this file alone.

## Consent and privacy — hard constraint

Every interview and observation is conducted under the consent notice in §4, **marked DRAFT pending review by qualified Guyana counsel under issue [#84](https://github.com/kareemschultz/platform-design-authority/issues/84)**. Do not conduct fieldwork using this notice until #84 counsel has reviewed it, or until the Founder has obtained separate qualified guidance. Raw participant data (names, contact details, business-identifying detail, recordings, transcripts, photos) is **prohibited from this repository** per PDA-REV-019 and must be retained only in the restricted evidence store selected under issue [#94](https://github.com/kareemschultz/platform-design-authority/issues/94), once that store's acceptance tests pass. This repository receives only:

- an **opaque evidence reference** in the form `PDA-EV-XXXX-XXXX-XXXX` (issued by the #94 restricted system, not invented here);
- a coarse date (month/year is sufficient unless a finer date carries no re-identification risk);
- a **de-identified synthesis** — pseudonymous segment/persona description, never a name, exact address, or other identifying detail;
- a confidence rating and stated decision impact.

## 1. Structured interview guide (target: 8 interviews, ≥3 businesses)

Each interview is 30–45 minutes with an owner, manager, or senior cashier/register operator at a candidate beachhead retailer. Record answers in the restricted store under one opaque evidence reference per interview; do not paste raw responses here or into any PR.

### 1.1 Business and segment context (PDA-STR-027 §Segment Dimensions)

1. What does the business sell, and roughly how many transactions does the front register handle on a typical day and on the busiest day of the week?
2. How many locations, registers, and staff who handle cash sales does the business have?
3. How would you describe the complexity of what you track — few SKUs and simple pricing, or many SKUs, variants, weights, or bundled pricing?
4. What is the connectivity situation at the point of sale — reliable, intermittent, or frequently down? How does the business currently cope with an outage mid-sale?
5. What forms of payment do customers actually use at checkout today (cash, card, mobile money, store credit, layaway/informal credit)? What share is cash?
6. What government or regulatory paperwork touches a sale today (receipts, VAT records, any fiscal device or reporting requirement you're aware of)?

### 1.2 Current workflow and pain (PDA-STR-027 §Evidence Record: problem, persona, current workaround, frequency, severity, economic impact)

7. Walk me through what happens, step by step, from a customer arriving at the register to them leaving with a receipt.
8. What system, notebook, or process do you use today to ring up a sale, and what do you like or dislike about it?
9. What happens when the register needs to open for the day, and what happens when it's counted and closed at the end of the day? Who does that, and how long does it take?
10. Has cash ever gone missing or been miscounted? What happened, how was it found, and what would have caught it sooner?
11. Have you ever needed to void a sale, issue a refund, or reprint/reissue a receipt? Walk me through what that actually involves today.
12. Does anyone reconcile the day's sales against what an accountant or bookkeeper later records? How does that handoff happen, and where does it go wrong?
13. If you could fix one thing about how sales, cash, or receipts are handled today, what would it be — and how often does that problem actually happen (daily, weekly, rarely)?

### 1.3 Alternatives, switching cost, and buying process (PDA-STR-027 §Evidence Record: alternatives, switching cost, buying process, willingness to pay)

14. What else have you tried or considered for this (another POS product, a spreadsheet, a bigger system) — what happened, or what's stopped you from switching?
15. Who would need to be involved in a decision to change how the register/checkout works, and what would they need to see before agreeing?
16. If a system solved [the problem named in Q13] reliably, what would that be worth to the business — and is that a one-time cost, a monthly cost, or something else you'd expect?
17. What would make you say no immediately, regardless of price (e.g., needing internet, needing to change your phone, cost of hardware, retraining staff)?

### 1.4 Wrap-up

18. Would you be willing to have someone from the team come and observe a real shift as it happens (a workflow observation, no recording, nothing disruptive)?
19. Is there anything I should have asked but didn't?

## 2. Direct workflow observation protocol (target: 3 observations)

An observation is a non-participating, non-recording watch of one real register shift (open → sales → close) at a business already interviewed or newly recruited, ideally spanning at least one busy period.

**Rules:**
- No audio or video recording by default (per the #94 decision: recording prohibited unless the Founder separately approves it with counsel review).
- No handling of cash, the register, or customer interaction by the observer.
- No photographing customers, receipts with customer names, or any screen showing customer payment detail.
- The observer logs only: elapsed time for each register-open/close/sale/void/refund/return event observed; any interruption (connectivity loss, till discrepancy, customer dispute, staff confusion) and how it was resolved; a rough transaction-volume count for the observed window.

**Observation log fields** (goes into the restricted store, referenced here only by opaque ID):

| Field | Description |
|---|---|
| Evidence reference | `PDA-EV-XXXX-XXXX-XXXX` from the #94 restricted store |
| Coarse date | Month/year |
| Segment (pseudonymous) | e.g. "small general retail, single location" |
| Observed window | Duration and rough transaction count |
| Register-open time | Elapsed, any friction noted |
| Register-close/count time | Elapsed, any discrepancy noted |
| Interruptions observed | Connectivity, till discrepancy, dispute, other |
| Void/refund/return observed | Yes/no; how it was handled |
| Notable friction | Free text, de-identified |

## 3. Sanitized synthesis format (what actually closes #82)

Once ≥8 interviews and ≥3 observations across ≥3 distinct businesses are logged in the restricted store, the Founder or an agent working from the Founder's synthesis produces a governed PR updating:

- `docs/blueprint/20-Strategy/BEACHHEAD_EVIDENCE_LOG.md` — one row per evidence item, using only: date (coarse), segment, opaque evidence reference, one-line finding, confidence, owner, follow-up. No participant names, no business names, no verbatim quotes that could identify a participant.
- `docs/blueprint/20-Strategy/MARKET_SEGMENTATION_AND_BEACHHEAD_EVIDENCE.md` §Evidence Log — same discipline, plus an explicit **confirmed / contradicted / unresolved** classification against each of PDA-STR-027's Beachhead Hypothesis Criteria, and any WS3 scope changes the evidence implies (e.g., a scope item in §WS3 of `FIRST_SLICE_IMPLEMENTATION_PLAN.md` that the evidence shows is wrong, missing, or lower/higher priority than assumed).
- `docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md` — if the evidence changes or confirms FDR-004's beachhead status, record that disposition there; this document does not itself carry founder authority.

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

## 4. Consent notice template (DRAFT — pending #84 qualified counsel review)

> This template is not legal advice and must not be used with a real participant until qualified Guyana counsel (issue #84) has reviewed it, or the Founder has obtained separate qualified guidance covering notice, lawful basis, cross-border processing, retention, and withdrawal rights under applicable law.

---

**Research participation notice (DRAFT)**

You are being invited to take part in research about how retail businesses in Guyana currently handle sales, cash, and receipts. This is voluntary — you may decline, stop at any time, or ask that anything you've said not be used, with no effect on any current or future relationship with [organization name — pending FDR/contracting-entity decision].

What we would like to do: [interview / observe a shift — select applicable].

What we will record: notes on your answers or on what we observe. [If recording is separately approved: audio/video recording, deleted or retained per the retention policy stated below.] We will not record customer-identifying payment details.

How your information will be used: your name and business will be replaced with a general description (e.g. "small general retailer") before anything is shared outside a small research team. We will keep the connection between you and that description in a restricted, access-controlled system, not in the public project.

How long we keep it and who can see it: [pending #94 selection — restricted system, named custody owner, retention/deletion terms].

Your rights: you may ask to see what we recorded about you, ask us to correct it, or ask us to delete it, by contacting [contact — pending #94/#84].

Consent: I agree to take part on the terms above. ☐ Yes ☐ No

Signature / verbal consent recorded by: _______________ Date: _______________

---

## 5. Non-goals

This kit does not select the restricted evidence store (issue #94), does not obtain counsel review (issue #84), does not conduct or simulate any interview or observation, and does not mark any PDA-STR-027 criterion confirmed. It is instrument design only.
