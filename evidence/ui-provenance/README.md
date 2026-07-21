# UI Provenance Evidence

Public-safe provenance records for imported or premium-derived UI components, blocks, or pages, following `registry/premium-ui-provenance-template.json`.

Each file here is `{"record": {...}}`, matching the template's `record` field set exactly (add a field to the template first if a new one is genuinely needed).

`scripts/validate_ui_governance.py` enforces two things about every file in this directory:

1. Every field the template declares is present.
2. `license_owner`, `permitted_entity`, and `permitted_products` are `null`. Sensitive commercial and licensing detail — who is licensed, under what account, for what products — remains outside the public repository per `docs/blueprint/09-UX/COMPONENT_ACQUISITION_POLICY.md`. Keep that detail in a private or permitted provenance inventory; this directory is the public-safe, engineering-facing subset (source, version, modifications, normalization, and review evidence).

A `PREFERRED_COMPONENT_CATALOG.md` entry with `Status: Platform Approved` must cite the corresponding file here in its `License/provenance record` field.
