"""Regression tests for competitive-research registration validation."""

import tempfile
import unittest
from pathlib import Path

from scripts.validate_research_registration import validate_research_registration


class ResearchRegistrationValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.research = Path(self.temporary.name)
        self._write_document("OUTPUT_A.md", "PDA-CIR-020")
        self._write_document("OUTPUT_B.md", "PDA-CIR-021")
        (self.research / "RESEARCH_BACKLOG.md").write_text(
            """---
document_id: PDA-CIR-008
---
### CIR-BACK-001 — Completed question
- Status: Transferred
### CIR-BACK-002 — Future question
- Status: Planned
""",
            encoding="utf-8",
        )
        (self.research / "SOURCE_REGISTRY.md").write_text(
            """---
document_id: PDA-CIR-006
---
| Source ID | Product |
|---|---|
| SRC-001 | Product A |
""",
            encoding="utf-8",
        )
        self._write_ledger(
            "| RES-001 | Test wave | Transferred | CIR-LED-0001 | CIR-BACK-001 | "
            "PDA-CIR-020 through PDA-CIR-021 | SRC-001 | Review pending |"
        )

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def _write_document(self, name: str, document_id: str) -> None:
        (self.research / name).write_text(
            f"---\ndocument_id: {document_id}\n---\n# Output\n", encoding="utf-8"
        )

    def _write_ledger(self, rows: str) -> None:
        (self.research / "RESEARCH_LEDGER.md").write_text(
            f"""---
document_id: PDA-CIR-007
---
### CIR-LED-0001 — Evidence

{RESULT_HEADER}
|---|---|---|---|---|---|---|---|
{rows}
""",
            encoding="utf-8",
        )

    def test_valid_registration_passes(self) -> None:
        self.assertEqual(validate_research_registration(self.research), [])

    def test_unregistered_output_fails(self) -> None:
        self._write_document("OUTPUT_C.md", "PDA-CIR-022")
        errors = validate_research_registration(self.research)
        self.assertTrue(any("unregistered research output" in error for error in errors))

    def test_transferred_backlog_without_result_fails(self) -> None:
        backlog = self.research / "RESEARCH_BACKLOG.md"
        backlog.write_text(
            backlog.read_text(encoding="utf-8").replace(
                "CIR-BACK-002 — Future question\n- Status: Planned",
                "CIR-BACK-002 — Future question\n- Status: Transferred",
            ),
            encoding="utf-8",
        )
        errors = validate_research_registration(self.research)
        self.assertTrue(any("has no result registration" in error for error in errors))

    def test_planned_backlog_cannot_be_registered_as_transferred(self) -> None:
        ledger = self.research / "RESEARCH_LEDGER.md"
        ledger.write_text(
            ledger.read_text(encoding="utf-8").replace(
                "CIR-BACK-001 |", "CIR-BACK-001; CIR-BACK-002 |"
            ),
            encoding="utf-8",
        )
        errors = validate_research_registration(self.research)
        self.assertTrue(any("is Planned, not Transferred" in error for error in errors))

    def test_unknown_source_record_fails(self) -> None:
        ledger = self.research / "RESEARCH_LEDGER.md"
        ledger.write_text(
            ledger.read_text(encoding="utf-8").replace("SRC-001 |", "SRC-002 |"),
            encoding="utf-8",
        )
        errors = validate_research_registration(self.research)
        self.assertTrue(any("unknown source record SRC-002" in error for error in errors))

    def test_unknown_ledger_entry_fails(self) -> None:
        ledger = self.research / "RESEARCH_LEDGER.md"
        ledger.write_text(
            ledger.read_text(encoding="utf-8").replace(
                "CIR-LED-0001 | CIR-BACK", "CIR-LED-0002 | CIR-BACK"
            ),
            encoding="utf-8",
        )
        errors = validate_research_registration(self.research)
        self.assertTrue(any("unknown ledger entry CIR-LED-0002" in error for error in errors))


RESULT_HEADER = (
    "| Result ID | Wave | Status | Ledger entry | Backlog transfers | "
    "Output documents | Source records | Review boundary |"
)


if __name__ == "__main__":
    unittest.main()
