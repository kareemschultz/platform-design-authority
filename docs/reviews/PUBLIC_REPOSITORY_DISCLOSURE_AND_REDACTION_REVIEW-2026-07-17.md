---
document_id: PDA-REV-019
title: Public Repository Disclosure and Redaction Review
version: 0.1.0
status: Draft
owner: Founder and Platform Design Authority
last_reviewed: 2026-07-17
related_adrs: [ADR-0014, ADR-0026]
---

# Public Repository Disclosure and Redaction Review

## 1. Authority, cutoff, and claim boundary

This is the dated path-level review required by FDR-005, PDA-STR-029, PDA-REV-015, issue #83, and the Founder approval in issue #81 comment `5008157609`.

**Evaluated cutoff:** public GitHub repository `kareemschultz/platform-design-authority`, `main` at `15417950925b78ad267e54fe6b3550010a46f60d` (merged PR #91), 997 tracked files, 714 commits on the evaluated `main` ancestry, and 789 commits reachable across all fetched refs at review time.

This review classifies the current controlled-prototype repository and records disclosure controls. Once independently reviewed and merged, it satisfies the **repository disclosure/redaction review** portion of the WS3 entry gate. It does not:

- ratify FDR-005's final public-visibility, source-license, documentation-license, or contribution decisions;
- prove copyright ownership, third-party redistribution rights, legal compliance, penetration resistance, or production security;
- authorize external contributions, public package/app publication, binary/container/native distribution, pilot, or production;
- replace the real customer evidence required by issue #82; or
- authorize raw external evidence to be stored in this public repository.

## 2. Classification model

| Classification | Meaning |
|---|---|
| **Public** | Intentionally disclosed as governance, thought leadership, or non-sensitive repository operation. |
| **Sanitized public** | Intentionally disclosed only at controlled-prototype depth, with no real customer/provider/private legal material, credentials, production topology, raw exploit/incident evidence, or protected source. |
| **Restricted** | Must live in an approved access-controlled system; this repository may retain only an opaque reference and sanitized disposition. |
| **Prohibited** | Must not enter public Git, public issues/PRs/comments, CI artifacts, ordinary source control, or prompts. Secrets use a secret manager; protected evidence uses its governed restricted system. |

Public visibility is not a reuse license. A path classified Public or Sanitized public remains unlicensed unless and until the applicable Founder and qualified legal decisions say otherwise.

## 3. Current path-level disposition

| Current path family | Classification | Knowingly disclosed content | Boundary and disposition |
|---|---|---|---|
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `SECURITY.md`, `CONTRIBUTING.md` | Public | Authority order, contributor constraints, prototype posture, disclosure and intake boundaries | Retain. No open-source, contribution, pilot, or production claim. AGENTS/CLAUDE parity remains mechanically enforced. |
| `.github/**`, `.changeset/**`, `.vscode/**` | Public | Issue/PR workflows, CI definitions, release metadata, recommended editor configuration | Retain after public-safety warnings. Workflows contain local/CI fixtures only. Public templates must never solicit sensitive vulnerability or customer evidence. |
| `.agents/**`, `.claude/**` | Public | Repository-owned contributor skills and review discipline | Knowingly disclosed to make automated contribution behavior auditable. Local credentials, session state, private prompts/evidence, and tool tokens remain prohibited. |
| `docs/blueprint/**` | Sanitized public | Draft architecture, strategy, roadmap, security objectives, generic runbooks, decision matrices, and prototype plans | Retain as thought leadership and prototype authority. Draft status is prominent. No real production coordinates, accounts, credentials, private negotiations, raw legal advice, customer identities, or executed security evidence were found. Future production-specific or privately sourced material is Restricted. |
| `docs/reviews/**`, `docs/implementation/**`, `docs/project/**`, `evidence/**` | Sanitized public | Historical independent audits, dispositions, prototype evidence, known limitations, and aggregate status | Retain for transparent prototype governance. Exact historical observations stay immutable. Raw penetration-test output, incident/forensic material, exploitable deployed-environment detail, raw customer evidence, and private external evidence are Restricted or Prohibited and may appear only as sanitized dispositions/references. |
| `apps/**`, `packages/**` | Sanitized public | Non-production controlled-prototype source and tests | Retain source visibility without a reuse or distribution license. All workspace manifests are private after this review. The native display name is descriptive rather than the internal codename. Public npm/app-store publication and external release artifacts remain prohibited pending FDR-002/FDR-005/FDR-011 and issue #93. |
| `openapi/**`, `schemas/**`, `registry/**` | Sanitized public | Draft first-slice contracts, schemas, permissions, events, capabilities, and generated governance indexes | Retain with Draft/prototype semantics. They are not a supported public API/SDK and contain no customer data or production endpoint coordinates. |
| `ops/**`, `docker-compose.yml`, `apps/server/.env.example` | Sanitized public | Disposable local PostgreSQL controls, local Compose topology, and synthetic configuration examples | Retain only as local prototype material. Fixed credential-shaped URIs are synthetic local/CI fixtures; deployed environments must supply independent secrets and topology. Production configuration, infrastructure state, backups, and real endpoints are Prohibited. |
| `scripts/**`, root tool configuration, `bun.lock` | Public | Deterministic governance/build tooling and exact dependency lock | Retain. Dependency manifests are not a third-party-notice or redistribution inventory; issue #93 gates external artifacts and licensing claims. |
| `apps/native/assets/**`, `apps/web/public/**`, `apps/web/src/app/favicon.ico` | Sanitized public source; external distribution restricted | Scaffold-derived prototype icons/logos/favicons | Retain in source pending asset provenance/notice cure. Unused assets should be removed; compiled or externally distributed artifacts remain blocked by issue #93. |
| Premium-source research documents and `registry/premium-ui-provenance-template.json` | Sanitized public metadata/template | Candidate names, public or account-visible catalog metadata, negative provenance conclusions, and the rule that no protected source was acquired | No premium source, credential, invoice, private URL, cookie, or license key was found. Do not add authenticated catalog dumps or access details. Vendor-contract, notice, and allowed-disclosure review remains in issue #93; completed entitlement evidence is Restricted. |

## 4. Restricted and prohibited classes

These classes are not approved for any current public path:

| Class | Required handling |
|---|---|
| Raw customer interviews, observation notes, recordings, screenshots, identities, contact data, consent records, tenant configuration, exports, or production data | Restricted. Issue #94 must select the system of record before issue #82 collects or retains raw evidence. Public records may contain only consented de-identified synthesis and opaque references. |
| Private legal/tax/privacy advice, provider correspondence/contracts/quotes, certification access, commercial negotiations, premium invoices/entitlements/private source | Restricted. Publish only sanitized decisions, dates, limitations, and opaque evidence references. |
| Raw penetration-test reports, proof-of-concept payloads, exploit chains, incident timelines, forensic captures, unredacted logs, production threat/control-gap detail | Restricted. Public material may state aggregate findings and dispositions only after security review. |
| Production topology, hostnames, accounts, network controls, infrastructure state, backups, recovery credentials, signing keys, production configuration | Prohibited from this repository. Use approved infrastructure systems and secret management. |
| Secrets, tokens, credentials, private keys, real `.env` files, credential-bearing non-local URLs, private download URLs, license keys | Prohibited. Rotate/revoke immediately if detected; do not paste the value into public remediation evidence. |
| Protected premium source, prohibited redistributable bundles, unverified customer/partner assets | Prohibited until exact rights and the permitted repository/distribution model are verified. |

## 5. Findings and dispositions

| ID | Finding | Severity | Disposition at this review |
|---|---|---:|---|
| RDR-001 | No confirmed current or reachable-history secret, key, live token, customer PII, private provider term, production endpoint, raw exploit chain, or premium source was found. | Informational | **Closed for the evaluated cutoff.** Re-open on any candidate detection or new external-evidence path. |
| RDR-002 | GitHub secret scanning is disabled; code scanning has no analysis; dependency alerting is disabled/unavailable. Existing grep coverage is narrow. | P2 | **Open, tracked by issue #92.** A dependency-free current-tree guard is added in this review as defense-in-depth; native/history scanning and private intake remain mandatory follow-up controls before external contribution intake, final public ratification, or pilot. |
| RDR-003 | No `LICENSE`/`NOTICE` framework, complete dependency/SBOM inventory, copied-source notice map, or per-asset provenance baseline exists. | P1 | **Open, tracked by issue #93.** No license is granted, external contributions are closed, and binary/container/native/public-package distribution is prohibited meanwhile. Qualified legal review remains required. |
| RDR-004 | No private vulnerability-reporting route is configured. | P1 | **Safely bounded, tracked by issue #92.** `SECURITY.md` forbids public sensitive reports and states that external vulnerability intake is not open until a private route exists. |
| RDR-005 | No approved restricted evidence store or opaque reference scheme exists for raw WSX evidence. | P1 | **Open, tracked by issue #94.** Issue #94 is a dependency of raw issue #82 evidence handling. No raw external evidence may enter this repository. |
| RDR-006 | Public audit, architecture, source, roadmap, and prototype-gap material creates correlation and competitive-intelligence risk. | P2 | **Accepted only at sanitized controlled-prototype depth** under the Founder-approved provisional public posture. The current tree has no deployed production coordinates or raw external evidence. Re-review triggers below prevent this acceptance from silently expanding. |
| RDR-007 | Seven credential-bearing PostgreSQL URIs match secret heuristics. | P3 | **Accepted fixtures.** Every occurrence is in CI, local documentation, `.env.example`, or tests and uses local/container hosts. The guard permits only local/container credential URIs and fails non-local forms. |
| RDR-008 | Three workspace manifests were publishable by omission, and the native visible app name used the internal codename. | P2 | **Closed in this review.** All workspace manifests carry `private: true`; the native display name is `Platform Prototype`. Internal slug/scheme/package identifiers remain permitted engineering codenames and are not publication authority. |
| RDR-009 | Public issue/PR templates could invite reproduction steps, logs, security/data impact, or premium-source details. | P1 | **Closed in this review.** Templates now prohibit sensitive content and route readers to `SECURITY.md`; `CONTRIBUTING.md` closes external intake. |

## 6. Scan evidence and limitations

The review used `git ls-files`, repository-wide `rg`, redacting high-signal pattern classifiers, `git rev-list --objects --all` plus persistent `git cat-file --batch`, targeted historical/config inspection, GitHub repository/settings APIs, package/asset inventory, and manual path classification.

- Current tree: 997 tracked files; no private-key, AWS, GitHub, Google, Stripe, Slack, SendGrid, or JWT pattern. Seven credential-URI matches were the local PostgreSQL fixtures in RDR-007.
- Reachable history: 714 commits on evaluated `main` and 789 across all fetched refs; no verified live secret or sensitive historical file. Fifty-one high-signal URI matches were repeated historical versions of the same local fixture class. A separately detected OpenAI-shaped substring was part of a public NIST URL, not a key.
- Email-shaped values use reserved/test domains; the governed beachhead evidence log has no populated customer evidence.
- No Gitleaks, TruffleHog, detect-secrets, or Semgrep binary was installed. The dependency-free guard is intentionally high-signal rather than entropy-based. Issue #92 owns maintained/native current-tree and history coverage.
- GitHub reported secret scanning disabled, no code-scanning analysis, and dependency alerting disabled/unavailable at the review date. Absence of alerts is therefore not evidence of absence.
- Dependency-license inspection was incomplete for locally unavailable resolutions and is not legal advice. Issue #93 and qualified counsel own the distributable/SBOM/notice decision.

Candidate values were never copied into this public record. Hashes, paths, rule classes, and sanitized dispositions were used instead.

## 7. Knowingly disclosed content statement

The Founder and Platform Design Authority knowingly retain the current repository's governed architecture, strategy, roadmap, contributor automation, controlled-prototype source, Draft contracts/schemas, sanitized audit history, prototype evidence, local development topology, and aggregate readiness gaps as public/source-visible material at the evaluated cutoff.

That disclosure is deliberate for governance transparency and technical-prototype collaboration. It is not an open-source license, public API commitment, security assurance, commercial product announcement, customer claim, or consent to publish new material in the same categories without classification. The restrictions in sections 3–4 control all future additions.

## 8. Ongoing controls and re-review triggers

The Platform Design Authority owns ongoing classification. Every issue/PR must keep public text sanitized, and `scripts/check_public_disclosure.py` runs through documentation governance validation. Human review remains mandatory for privacy, commercial sensitivity, provenance, security context, and correlation risk that pattern matching cannot decide.

Re-run and retain a new review before:

- intentionally adding customer/provider/legal/commercial/premium or production-topology material;
- publishing a source/documentation license, accepting external contributions, or changing repository visibility;
- public package, SDK, app-store, container, native, or binary distribution;
- storing any raw WSX evidence or publishing any penetration/incident evidence;
- production architecture, deployment, security-control, or recovery details replace generic Draft designs; or
- a secret/protected-data alert, license dispute, provider request, incident, or privacy concern changes the evidence.

## 9. Closure and retained gates

After exact-head independent concurrence and merge, issue #83 may close and the repository-disclosure component of WS3 entry is satisfied at controlled-prototype depth. Issue #82 remains a separate hard gate, with issue #94 required before raw customer evidence is retained. Agents cannot generate, simulate, infer, or waive the customer evidence.

FDR-005 remains Open for final visibility, licensing, and contribution ratification. Issues #92/#93, qualified legal review, independent penetration testing, accessibility evidence, RLS/deployment evidence, provider/counsel gates, and every pilot/production gate remain open. No production-readiness claim is made.

## Change Log

- **0.1.0 (2026-07-17):** Recorded the first full path-level public disclosure/redaction review, current and reachable-history sanitized scans, knowingly disclosed classes, prohibited/restricted classes, issue-template and package-visibility remediation, ongoing guard, and follow-up issues #92–#94.
