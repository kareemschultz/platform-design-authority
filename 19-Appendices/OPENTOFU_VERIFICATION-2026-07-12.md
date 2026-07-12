---
document_id: PDA-APP-019
title: OpenTofu Verification 2026-07-12
version: 0.1.0
status: Draft
owner: Platform Engineering
last_reviewed: 2026-07-12
verified_as_of: 2026-07-12
related_adrs: [ADR-0018]
---

# OpenTofu Verification — 2026-07-12

## Purpose

Record dated primary-source evidence for ADR-0018 without treating external version facts as implementation proof.

## Verified Facts

- OpenTofu 1.12.3 was the current stable release observed on 2026-07-12.
- OpenTofu is governed by the Linux Foundation and uses an open-source project model.
- The OpenTofu Registry provides a broad provider and module ecosystem; registry size is directional and must not be treated as provider quality or compatibility evidence.
- Compatibility is evaluated across the CLI, providers, modules, state backend, policy tooling, and target cloud APIs. A CLI version alone is insufficient.

## Primary Sources

- `https://opentofu.org/docs/`
- `https://github.com/opentofu/opentofu/releases/tag/v1.12.3`
- `https://registry.opentofu.org/`

## Required Reverification

Reverify before creating the implementation lock, changing the CLI/provider/module set, adopting a state backend, or claiming Terraform compatibility. Record exact hashes, licenses, advisories, platform support, state migration behavior, and disposable-environment evidence in the implementation repository.
