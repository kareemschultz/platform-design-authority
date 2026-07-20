# Security Policy

This repository contains a non-production controlled prototype and governed architecture material. It does not claim production security readiness.

## Private vulnerability reporting

Do not report suspected vulnerabilities, exploit instructions, credentials, customer data, private provider material, incident evidence, or unredacted logs in a public issue, pull request, discussion, commit, or comment.

Use GitHub's private [Report a vulnerability](https://github.com/kareemschultz/platform-design-authority/security/advisories/new) form for a suspected security defect. GitHub creates a private security advisory visible to the repository's security managers and participating reporter. Do not place secrets, unnecessary personal data, raw production data, or third-party confidential material in the report; establish the separately approved restricted channel before transmitting material that does not belong in GitHub.

The Platform Design Authority owns intake and the Founder is the current primary responder. This controlled-prototype repository has no 24/7 response commitment or backup responder yet. Reports are acknowledged and triaged on a best-effort basis; urgent operational response, customer notification, and production incident handling are not claimed. A second qualified responder and organization/team continuity remain required before pilot.

Non-sensitive defects that contain no exploit detail or protected data may use the public bug template.

## Handling requirements

- Never commit secrets, keys, tokens, real environment files, production configuration, backups, forensic material, or raw penetration-test evidence.
- Use synthetic data and reserved domains in tests and examples.
- Keep raw customer research, private legal advice, provider correspondence, premium-license evidence, and production-security material in an approved restricted system; only sanitized dispositions and opaque evidence references belong here.
- Treat public audit and readiness material as prototype evidence, not a map of a deployed production environment.

Issue #83 and PDA-REV-019 record the repository disclosure review. Issue #92 and PDA-REV-020 record the private-intake and native-scanning baseline after exact-head review and merge. Final source/documentation licensing, scanner triage, independent penetration testing, backup responder coverage, pilot, and production readiness remain separately gated.
