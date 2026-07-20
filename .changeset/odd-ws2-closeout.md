---
"@meridian/contracts-api": minor
"@meridian/contracts-permissions": minor
"@meridian/contracts-platform-api": minor
"@meridian/domain-catalog": minor
"@meridian/domain-inventory": minor
"@meridian/persistence-inventory-postgres": minor
"@meridian/ui-web": minor
"docs": minor
"web": minor
---

Add Inventory Reservation as an internal-command-only capability (no new endpoint) with dual domain/PostgreSQL expiry guards and advisory-lock-serialized idempotent release; add the governed WS2 capability evidence source and check gate (14 capabilities × 13 dimensions); add closeout browser and PostgreSQL proof for two-tenant isolation, append-only/reversal/rebuild behavior, Barcode entry/lookup accessibility, and online-only degraded-state fail-closed handling; extend the AI-runtime-dependency-absence gate to a genuine, manifest-derived, transitive workspace closure.
