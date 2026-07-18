# Security Policy

This repository contains a non-production controlled prototype and governed architecture material. It does not claim production security readiness.

## Reporting boundary

Do not report suspected vulnerabilities, exploit instructions, credentials, customer data, private provider material, incident evidence, or unredacted logs in a public issue, pull request, discussion, commit, or comment.

A public private-reporting channel is not configured yet. Until the tracked private-intake control is completed, external vulnerability submissions are not accepted through this repository. Maintainers handling a concern through an already-established private relationship must confirm a restricted channel before any sensitive detail is transmitted.

Non-sensitive defects that contain no exploit detail or protected data may use the public bug template.

## Handling requirements

- Never commit secrets, keys, tokens, real environment files, production configuration, backups, forensic material, or raw penetration-test evidence.
- Use synthetic data and reserved domains in tests and examples.
- Keep raw customer research, private legal advice, provider correspondence, premium-license evidence, and production-security material in an approved restricted system; only sanitized dispositions and opaque evidence references belong here.
- Treat public audit and readiness material as prototype evidence, not a map of a deployed production environment.

Issue #83 and PDA-REV-019 record the current repository disclosure review. Final source/documentation licensing, private vulnerability intake, automated scanning, penetration testing, and production readiness remain separately gated.
