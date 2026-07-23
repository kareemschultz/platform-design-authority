---
"@meridian/ui-web": patch
"web": patch
---

Reconcile Card's radius token to `rounded-2xl`, matching Button/Badge/Alert and eliminating Card as the shape-family outlier, and migrate the Operations and Inventory overview pages' hand-rolled `rounded-2xl border` panels onto Card composition. Panel headings that were real `<h2>` landmarks (scope summary, task-link cards) keep real heading elements styled to match `CardTitle` rather than losing document-outline structure to `CardTitle`'s non-heading `<div>`.
