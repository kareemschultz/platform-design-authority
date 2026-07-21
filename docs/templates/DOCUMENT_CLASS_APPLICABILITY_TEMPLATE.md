# Document Class Applicability Record Template

Use this structure when adding one artifact to `registry/document-class-adoption.json`. It is an authoring aid, not review evidence and not a registry source.

```json
{
  "artifact_id": "CLASS-SAMPLE-NNN",
  "path": "repository/relative/path.md",
  "identity": "canonical document or product-documentation ID",
  "class_id": "class identifier from registry/document-classes.json",
  "declared_depth": "depth from PDA-FND-017",
  "evidence_state": "evidence state from PDA-FND-017",
  "review_state": "author-self-reviewed",
  "dimensions": {
    "required-dimension": {
      "disposition": "addressed",
      "sections": ["Exact heading text"]
    },
    "another-required-dimension": {
      "disposition": "not-applicable",
      "reason": "Artifact-specific explanation of why the dimension cannot affect this scope."
    }
  }
}
```

Every required dimension appears exactly once. An `addressed` mapping names at least one existing Markdown/MDX heading. A `not-applicable` mapping contains a specific reason and no fake section. Independent review evidence is recorded separately and must identify the exact candidate revision.
