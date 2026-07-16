# Meridian Documentation Portal

This Fumadocs application is the controlled prototype selected by ADR-0021. It is a delivery surface, not an architecture authority.

## Content Boundaries

- Authored product content: `content/docs/`
- Architecture authority: repository root `docs/blueprint/00-Foundation/` through `docs/blueprint/20-Strategy/`
- Canonical API contracts: root `openapi/` and `schemas/`
- Implementation notes: root `docs/implementation/`
- Generated API/reference pages must identify their source revision and must never become a second editable contract.
- Product-page publication and implementation evidence: root `registry/product-documentation.json`

Only released or explicitly identified prototype behavior may be described as available. Draft/Proposed architecture, independent reviews, threat models, secrets, customer data, and private provider evidence are not public product content.

## Local Verification

From the repository root:

```bash
bun install --frozen-lockfile
bun run --filter docs check-types
bun run --filter docs build
python -m unittest scripts/test_validate_product_docs.py
python scripts/validate_product_docs.py
```

The root Meridian CI runs the authoritative frozen-install and build gates. The application must also remain buildable through the approved Node fallback.

## Authoring Requirements

Every page carries stable `PDOC-NNNN` metadata mirrored in the product-documentation manifest. Every procedural page identifies audience, prerequisites, permission, outcome, offline/degraded behavior, validation errors, correction or reversal path, related capability/contract, applicable product version, and immutable evidence revision. Use synthetic examples only. Product/domain owners review behavioral accuracy; Developer Platform owns publication; UX and Accessibility review information design.

## Publication Status

Prototype only. Search is local, AI chat is disabled, and no interactive API proxy or unapproved production documentation is published.
