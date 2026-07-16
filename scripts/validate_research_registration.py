#!/usr/bin/env python3
"""Validate competitive-research output registration without judging findings.

The Markdown ledger remains the human-readable source. This validator checks
only bounded identity, existence, lifecycle-transfer, and one-to-one coverage
invariants across the research ledger, backlog, source registry, and outputs.
"""

import re
import sys
from collections import Counter
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
RESEARCH_DIR = REPO_ROOT / "docs" / "blueprint" / "19-Competitive-Research"
RESULT_HEADER = (
    "| Result ID | Wave | Status | Ledger entry | Backlog transfers | "
    "Output documents | Source records | Review boundary |"
)


def expand_references(value: str, prefix: str, width: int) -> list[str]:
    """Expand single identifiers and inclusive `through` ranges in one cell."""

    pattern = re.compile(
        rf"{re.escape(prefix)}(\d{{{width}}})"
        rf"(?:\s+through\s+{re.escape(prefix)}(\d{{{width}}}))?"
    )
    references: list[str] = []
    for match in pattern.finditer(value):
        start = int(match.group(1))
        end = int(match.group(2) or match.group(1))
        if end < start:
            references.append(f"INVALID-RANGE:{match.group(0)}")
            continue
        references.extend(f"{prefix}{number:0{width}d}" for number in range(start, end + 1))
    return references


def duplicates(values: list[str]) -> set[str]:
    """Return repeated non-empty identifiers."""

    return {value for value, count in Counter(values).items() if value and count > 1}


def parse_document_ids(research_dir: Path) -> tuple[list[str], list[str]]:
    """Return research document IDs and files missing a document ID."""

    document_ids: list[str] = []
    missing: list[str] = []
    for path in sorted(research_dir.glob("*.md")):
        match = re.search(
            r"^document_id:\s*(PDA-CIR-\d{3})\s*$",
            path.read_text(encoding="utf-8"),
            re.MULTILINE,
        )
        if match:
            document_ids.append(match.group(1))
        else:
            missing.append(path.name)
    return document_ids, missing


def parse_heading_ids(text: str, prefix: str, width: int) -> list[str]:
    """Return identifiers used in level-three headings."""

    return re.findall(rf"^### ({re.escape(prefix)}\d{{{width}}})\b", text, re.MULTILINE)


def parse_backlog(text: str) -> tuple[list[str], dict[str, str]]:
    """Return backlog IDs and the status declared in each entry."""

    headings = list(re.finditer(r"^### (CIR-BACK-\d{3})\b", text, re.MULTILINE))
    identifiers: list[str] = []
    statuses: dict[str, str] = {}
    for index, heading in enumerate(headings):
        identifier = heading.group(1)
        identifiers.append(identifier)
        end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
        body = text[heading.end() : end]
        status = re.search(r"^- Status:\s*([^\n]+?)\s*$", body, re.MULTILINE)
        statuses[identifier] = status.group(1).strip() if status else ""
    return identifiers, statuses


def parse_source_ids(text: str) -> list[str]:
    """Return stable source identifiers from the program collection table."""

    return re.findall(r"^\| (SRC-\d{3}) \|", text, re.MULTILINE)


def parse_results(text: str) -> tuple[list[dict[str, str]], list[str]]:
    """Parse the stable result index and return row-format diagnostics."""

    lines = text.splitlines()
    errors: list[str] = []
    try:
        header_index = lines.index(RESULT_HEADER)
    except ValueError:
        return [], ["stable result index header is missing or has changed"]

    results: list[dict[str, str]] = []
    for line_number, line in enumerate(lines[header_index + 2 :], start=header_index + 3):
        if not line.startswith("|"):
            break
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != 8:
            errors.append(
                f"research ledger:{line_number}: expected 8 result cells, found {len(cells)}"
            )
            continue
        results.append(
            dict(
                zip(
                    (
                        "result_id",
                        "wave",
                        "status",
                        "ledger",
                        "backlogs",
                        "outputs",
                        "sources",
                        "review_boundary",
                    ),
                    cells,
                    strict=True,
                )
            )
        )
    if not results:
        errors.append("stable result index has no result rows")
    return results, errors


def validate_research_registration(research_dir: Path) -> list[str]:
    """Return deterministic registration errors for one research directory."""

    errors: list[str] = []
    required = {
        "ledger": research_dir / "RESEARCH_LEDGER.md",
        "backlog": research_dir / "RESEARCH_BACKLOG.md",
        "sources": research_dir / "SOURCE_REGISTRY.md",
    }
    for label, path in required.items():
        if not path.exists():
            errors.append(f"required {label} file is missing: {path.name}")
    if errors:
        return errors

    ledger_text = required["ledger"].read_text(encoding="utf-8")
    backlog_text = required["backlog"].read_text(encoding="utf-8")
    source_text = required["sources"].read_text(encoding="utf-8")

    document_ids, missing_document_ids = parse_document_ids(research_dir)
    ledger_ids = parse_heading_ids(ledger_text, "CIR-LED-", 4)
    backlog_ids, backlog_statuses = parse_backlog(backlog_text)
    source_ids = parse_source_ids(source_text)
    results, result_errors = parse_results(ledger_text)
    errors.extend(result_errors)

    for path_name in missing_document_ids:
        errors.append(f"research document has no PDA-CIR document_id: {path_name}")
    for label, values in (
        ("research document", document_ids),
        ("ledger entry", ledger_ids),
        ("backlog entry", backlog_ids),
        ("source record", source_ids),
        ("result", [result["result_id"] for result in results]),
    ):
        for identifier in sorted(duplicates(values)):
            errors.append(f"duplicate {label} identifier: {identifier}")

    document_set = set(document_ids)
    ledger_set = set(ledger_ids)
    backlog_set = set(backlog_ids)
    source_set = set(source_ids)
    output_assignments: list[str] = []
    backlog_assignments: list[str] = []

    for result in results:
        result_id = result["result_id"]
        if not re.fullmatch(r"RES-\d{3}", result_id):
            errors.append(f"invalid result identifier: {result_id or '<empty>'}")
        if result["status"] != "Transferred":
            errors.append(f"{result_id}: result status must be Transferred")
        if not result["wave"]:
            errors.append(f"{result_id}: wave is empty")
        if not result["review_boundary"]:
            errors.append(f"{result_id}: review boundary is empty")

        ledger_refs = expand_references(result["ledger"], "CIR-LED-", 4)
        backlog_refs = expand_references(result["backlogs"], "CIR-BACK-", 3)
        output_refs = expand_references(result["outputs"], "PDA-CIR-", 3)
        source_refs = expand_references(result["sources"], "SRC-", 3)
        for label, references in (
            ("ledger", ledger_refs),
            ("backlog", backlog_refs),
            ("output", output_refs),
            ("source", source_refs),
        ):
            if not references:
                errors.append(f"{result_id}: no parseable {label} references")
            for reference in references:
                if reference.startswith("INVALID-RANGE:"):
                    errors.append(f"{result_id}: {reference}")

        if len(ledger_refs) != 1:
            errors.append(f"{result_id}: expected exactly one ledger entry")
        for reference in ledger_refs:
            if reference not in ledger_set:
                errors.append(f"{result_id}: unknown ledger entry {reference}")
        for reference in backlog_refs:
            if reference not in backlog_set:
                errors.append(f"{result_id}: unknown backlog entry {reference}")
            elif backlog_statuses[reference] != "Transferred":
                errors.append(
                    f"{result_id}: backlog {reference} is {backlog_statuses[reference] or 'missing status'}, "
                    "not Transferred"
                )
        for reference in output_refs:
            if reference not in document_set:
                errors.append(f"{result_id}: unknown output document {reference}")
        for reference in source_refs:
            if reference not in source_set:
                errors.append(f"{result_id}: unknown source record {reference}")
        output_assignments.extend(output_refs)
        backlog_assignments.extend(backlog_refs)

    durable_outputs = {
        identifier
        for identifier in document_set
        if int(identifier.rsplit("-", maxsplit=1)[1]) >= 20
    }
    assigned_outputs = set(output_assignments)
    for identifier in sorted(durable_outputs - assigned_outputs):
        errors.append(f"unregistered research output: {identifier}")
    for identifier in sorted(assigned_outputs - durable_outputs):
        if identifier in document_set:
            errors.append(f"framework document registered as a research output: {identifier}")
    for identifier in sorted(duplicates(output_assignments)):
        errors.append(f"research output assigned to multiple results: {identifier}")

    transferred_backlogs = {
        identifier
        for identifier, status in backlog_statuses.items()
        if status == "Transferred"
    }
    assigned_backlogs = set(backlog_assignments)
    for identifier in sorted(transferred_backlogs - assigned_backlogs):
        errors.append(f"Transferred backlog has no result registration: {identifier}")
    for identifier in sorted(assigned_backlogs - transferred_backlogs):
        if identifier in backlog_set:
            errors.append(f"non-Transferred backlog registered as transferred: {identifier}")
    for identifier in sorted(duplicates(backlog_assignments)):
        errors.append(f"backlog assigned to multiple results: {identifier}")

    return errors


def main() -> int:
    errors = validate_research_registration(RESEARCH_DIR)
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} research-registration error(s).")
        return 1
    print(
        "Research-registration validation passed: durable outputs and Transferred "
        "backlogs map exactly once to existing ledger and source evidence."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
