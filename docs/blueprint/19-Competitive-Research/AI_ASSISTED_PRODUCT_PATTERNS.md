---
document_id: PDA-CIR-070
title: AI-Assisted Product Patterns
version: 0.1.0
status: Draft
owner: Platform Design Authority
last_reviewed: 2026-07-16
related_adrs: [ADR-0003, ADR-0014]
---

# AI-Assisted Product Patterns

## Purpose and authority boundary

OpenAI, Anthropic, Microsoft Copilot, GitHub Copilot, Notion AI, Intercom Fin, and adjacent product patterns were reviewed from public official material available 2026-07-16. This research cannot expand AI autonomy. Meridian AI uses ordinary application commands, permissions, entitlements, tenant scope, policy, audit, and deterministic fallback.

| Pattern | Product value | Required control |
|---|---|---|
| suggestion | completion, categorization, next step | source/provenance, confidence, editable diff, no implicit action |
| summary | compress history or case | citations/links, freshness, omitted-context warning, sensitive-data rules |
| draft | message, document, query, workflow | audience, policy, human approval, version and correction |
| tool/action | execute normal application command | capability schema, preview, permission at execution, confirmation, idempotency, audit |
| agent loop | multi-step goal pursuit | bounded plan, budget, allowlist, checkpoints, stop, rollback/compensation |
| disabled/failure | provider absent, refused, timed out, over budget | deterministic workflow remains usable and honest |

## Strong, weak, and rejected patterns

Strong patterns expose planned actions, ask for confirmation on consequential steps, retain user control, and provide source context. Weak patterns hide provider failure, blur generated and authoritative facts, or make correction hard. Reject blanket autonomy, prompt-based authorization, unbounded tool loops, silent model switching, and AI as a financial/inventory/payroll/audit authority.

## Confidence and limitations

High for the control implications, medium for current feature behavior because product capabilities and names change quickly. No enterprise tenant, data-control configuration, or vendor benchmark was independently tested.

## Sources

- [OpenAI ChatGPT agent](https://openai.com/index/introducing-chatgpt-agent/) — official product announcement, retrieved 2026-07-16.
- [OpenAI Codex security](https://developers.openai.com/codex/security/) — official documentation, retrieved 2026-07-16.
- [Microsoft Copilot agent governance](https://learn.microsoft.com/en-us/microsoft-365-copilot/extensibility/agents-overview) — official documentation, retrieved 2026-07-16.
- [Anthropic tool use](https://docs.anthropic.com/en/docs/agents-and-tools/tool-use/overview) — official documentation, retrieved 2026-07-16.
- [GitHub Copilot responsible use](https://docs.github.com/en/copilot/responsible-use-of-github-copilot-features) — official documentation, retrieved 2026-07-16.

