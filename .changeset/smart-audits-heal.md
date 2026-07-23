---
"web": patch
"docs": patch
---

Bump Next.js from 16.2.10 to 16.2.11, resolving 9 freshly-disclosed security advisories (4 high, 5 moderate — SSRF in Server Actions on custom servers, middleware/proxy bypass in Turbopack single-locale App Router configs, DoS via Server Actions and unbounded Edge Server Action payloads, cache confusion of response bodies, SSRF via attacker-controlled rewrite destinations, image-optimization DoS via SVGs, unauthenticated Server Function endpoint disclosure). `bun audit` was clean as of the #208 merge and failed universally (including on unmodified `main`) as of this fix — a newly-disclosed advisory affecting the already-pinned version, not a regression introduced by prior work.
