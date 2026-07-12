# Documentation Planes

This directory holds implementation-facing documentation that does not carry Platform Design Authority document IDs.

- `implementation/` contains scaffold provenance, compatibility conflicts, and migration proposals for the Meridian prototype.
- `../00-Foundation/` through `../20-Strategy/` remain the governed architecture and evidence plane indexed by `../registry/documents.json`.
- `../meridian/apps/fumadocs/content/docs/` is the product/user/developer documentation content plane. It may link or generate references from authoritative sources but must not duplicate them as independent authority.
- `../openapi/` and `../schemas/` remain canonical machine contracts.

Moving the numbered architecture tree under this directory is intentionally deferred: doing so requires a separate accepted migration decision, history-preserving moves, registry/script/path rewrites, link migration, CI changes, and rollback evidence. `implementation/ROOT_DOCUMENT_MIGRATION_PROPOSAL.md` records that analysis.
