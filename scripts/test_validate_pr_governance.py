from __future__ import annotations

import unittest

from scripts.validate_pr_governance import validate_pr_body


VALID_BODY = """## Documentation impact disposition

- [x] Updated in this PR
- [ ] No documentation impact
- [ ] Blocking documentation issue
Evidence: docs/example.md

## Changeset and release impact disposition

- [x] Changeset included
- [ ] No Changeset required
- [ ] Blocking Changeset issue
Evidence: .changeset/example.md

## Lifecycle statement

Controlled-prototype and Draft documentation only; no production claim.

## No unsupported production-readiness claim

- [x] This PR does not claim founder, legal, customer, provider, security, accessibility, operational, pilot, or production readiness beyond separately evidenced results.
"""


class PullRequestGovernanceTests(unittest.TestCase):
    def messages(
        self,
        body: str = VALID_BODY,
        paths: list[str] | None = None,
        head_sha: str = "a" * 40,
    ) -> list[str]:
        return validate_pr_body(
            body,
            paths or ["docs/example.md", ".changeset/example.md"],
            head_sha,
        )

    def test_valid_contract_passes(self) -> None:
        self.assertEqual([], self.messages())

    def test_requires_both_disposition_sections(self) -> None:
        body = VALID_BODY.replace("## Documentation impact disposition", "## Documentation")
        body = body.replace("## Changeset and release impact disposition", "## Changeset")
        messages = self.messages(body)
        self.assertEqual(2, len([message for message in messages if "missing required section" in message]))

    def test_requires_exactly_one_checked_option(self) -> None:
        body = VALID_BODY.replace("- [ ] No documentation impact", "- [x] No documentation impact")
        self.assertTrue(any("exactly one disposition" in message for message in self.messages(body)))

    def test_requires_non_placeholder_evidence(self) -> None:
        body = VALID_BODY.replace("Evidence: docs/example.md", "Evidence: TBD")
        self.assertTrue(any("Evidence must name" in message for message in self.messages(body)))

    def test_updated_documentation_requires_changed_documentation(self) -> None:
        messages = self.messages(paths=["packages/example/src/index.ts", ".changeset/example.md"])
        self.assertTrue(any("no governed documentation path changed" in message for message in messages))

    def test_included_changeset_requires_changed_changeset_file(self) -> None:
        self.assertTrue(
            any("no Changeset file changed" in message for message in self.messages(paths=["docs/example.md"]))
        )

    def test_blocking_dispositions_require_issue_numbers(self) -> None:
        body = VALID_BODY.replace("- [x] Updated in this PR", "- [ ] Updated in this PR")
        body = body.replace("- [ ] Blocking documentation issue", "- [x] Blocking documentation issue")
        body = body.replace("Evidence: docs/example.md", "Evidence: blocked")
        self.assertTrue(any("requires an issue number" in message for message in self.messages(body)))

    def test_requires_lifecycle_and_readiness_acknowledgement(self) -> None:
        body = VALID_BODY.replace(
            "Controlled-prototype and Draft documentation only; no production claim.",
            "TBD",
        ).replace("- [x] This PR does not claim", "- [ ] This PR does not claim")
        messages = self.messages(body)
        self.assertTrue(any("exact claimed lifecycle" in message for message in messages))
        self.assertTrue(any("acknowledgement must be checked" in message for message in messages))

    def test_rejects_stale_manual_head_pin(self) -> None:
        body = VALID_BODY + "\n- PR head: `bbbbbbb`\n"
        self.assertTrue(any("stale PR head" in message for message in self.messages(body)))


if __name__ == "__main__":
    unittest.main()
