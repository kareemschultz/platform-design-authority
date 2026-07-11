#!/usr/bin/env python3
"""Validate Platform Design Authority documentation governance rules.

Uses only the Python standard library so it can run locally and in CI without
installing project dependencies.
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ADR_FILE = re.compile(r"^ADR-\d{4}-[A-Z0-9-]+\.md$")
SPEC_FILE = re.compile(r"^[A-Z0-9_]+(?:-\d{4}-\d{2}-\d{2})?\.md$")
DOCUMENT_ID = re.compile(r"^(?:PDA-[A-Z]+-\d{3}|ADR-\d{4})$")
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
EVENT = re.compile(
    r"^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*$"
)
EVENT_CANDIDATE = re.compile(r"`([a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*){2,}\.v\d+)`")
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
BACKTICK_MD_PATH = re.compile(r"`([^`\n]+\.md)`")
PLACEHOLDER_PATH = re.compile(r"(?:NNNN|XXXX|YYYY|DESCRIPTIVE|<[^>]+>)")
VALID_STATUSES = {
    "Planned",
    "Draft",
    "Proposed",
    "In Review",
    "Approved",
    "Accepted",
    "Ratified",
    "Deprecated",
    "Superseded",
    "Archived",
}
REQUIRED_FIELDS = {"document_id", "title", "version", "status", "owner", "last_reviewed"}


def parse_front_matter(path: Path) -> dict[str, str]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening front-matter delimiter")

    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("missing closing front-matter delimiter") from exc

    values: dict[str, str] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"invalid front-matter line: {line!r}")
        key, value = line.split(":", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def all_markdown_files() -> list[Path]:
    files: list[Path] = []
    for path in sorted(ROOT.rglob("*.md")):
        rel = path.relative_to(ROOT)
        if any(part.startswith(".") for part in rel.parts):
            continue
        files.append(path)
    return files


def governed_markdown_files() -> list[Path]:
    """Governed records have real front matter; reusable templates do not."""
    governed: list[Path] = []
    for path in all_markdown_files():
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] == "templates":
            continue
        first = path.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].strip() == "---":
            governed.append(path)
    return governed


def parse_related_adrs(raw: str) -> list[str]:
    value = raw.strip()
    if not value or value == "[]":
        return []
    if value.startswith("[") and value.endswith("]"):
        value = value[1:-1]
    return [item.strip() for item in value.split(",") if item.strip()]


def validate_documents() -> tuple[list[str], dict[str, Path]]:
    errors: list[str] = []
    ids: dict[str, list[Path]] = defaultdict(list)

    for path in governed_markdown_files():
        rel = path.relative_to(ROOT)
        try:
            meta = parse_front_matter(path)
        except ValueError as exc:
            errors.append(f"{rel}: {exc}")
            continue

        missing = REQUIRED_FIELDS - set(meta)
        if missing:
            errors.append(f"{rel}: missing required fields {sorted(missing)}")

        document_id = meta.get("document_id", "")
        if document_id:
            ids[document_id].append(rel)
            if not DOCUMENT_ID.fullmatch(document_id):
                errors.append(f"{rel}: invalid document_id {document_id!r}")

        version = meta.get("version", "")
        if version and not SEMVER.fullmatch(version):
            errors.append(f"{rel}: version must use semantic versioning, got {version!r}")

        review_date = meta.get("last_reviewed", "")
        if review_date and not ISO_DATE.fullmatch(review_date):
            errors.append(f"{rel}: last_reviewed must use YYYY-MM-DD, got {review_date!r}")

        status = meta.get("status", "")
        if status and status not in VALID_STATUSES:
            errors.append(f"{rel}: unsupported status {status!r}")

        if path.parent.name == "18-Decisions":
            if not ADR_FILE.fullmatch(path.name):
                errors.append(f"{rel}: ADR filename does not match required pattern")
            if not meta.get("created"):
                errors.append(f"{rel}: ADR is missing created date")
        elif path.name not in {"README.md", "PLATFORM_MANIFEST.md"} and not SPEC_FILE.fullmatch(path.name):
            errors.append(
                f"{rel}: specification filename must use uppercase snake case; "
                "a trailing ISO date is allowed only for periodic evidence"
            )

    for document_id, paths in ids.items():
        if len(paths) > 1:
            errors.append(f"duplicate document_id {document_id}: {', '.join(map(str, paths))}")

    return errors, {document_id: paths[0] for document_id, paths in ids.items() if len(paths) == 1}


def load_namespace_registry() -> tuple[list[str], dict[str, dict[str, object]]]:
    errors: list[str] = []
    path = ROOT / "registry" / "domains.json"
    if not path.exists():
        return ["registry/domains.json: missing"], {}

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as exc:
        return [f"registry/domains.json: {exc}"], {}

    prefixes: dict[str, dict[str, object]] = {}
    for item in data.get("namespaces", []):
        name = item.get("name")
        prefix = item.get("prefix")
        document = item.get("authoritative_document")
        if not name or not prefix or not document:
            errors.append("registry/domains.json: namespace missing name, prefix, or authoritative_document")
            continue
        if not re.fullmatch(r"[a-z][a-z0-9-]*", str(prefix)):
            errors.append(f"registry/domains.json: invalid prefix {prefix!r}")
        if prefix in prefixes:
            errors.append(
                f"registry/domains.json: prefix {prefix!r} used by both "
                f"{prefixes[str(prefix)].get('name')!r} and {name!r}"
            )
        prefixes[str(prefix)] = item
        if not (ROOT / str(document)).exists():
            errors.append(f"registry/domains.json: authoritative document does not exist: {document}")

        for additional in item.get("additional_prefixes", []):
            if additional in prefixes:
                errors.append(f"registry/domains.json: duplicate additional prefix {additional!r}")
            prefixes[str(additional)] = item

    return errors, prefixes


def validate_related_adrs(document_ids: dict[str, Path]) -> list[str]:
    errors: list[str] = []
    for path in governed_markdown_files():
        meta = parse_front_matter(path)
        for adr in parse_related_adrs(meta.get("related_adrs", "")):
            if adr not in document_ids:
                errors.append(f"{path.relative_to(ROOT)}: related ADR does not exist: {adr}")
            elif not adr.startswith("ADR-"):
                errors.append(f"{path.relative_to(ROOT)}: related_adrs contains non-ADR id: {adr}")
    return errors


def validate_event_identifiers(prefixes: dict[str, dict[str, object]]) -> list[str]:
    errors: list[str] = []
    for path in all_markdown_files():
        text = path.read_text(encoding="utf-8")
        for line_number, line in enumerate(text.splitlines(), start=1):
            for match in EVENT_CANDIDATE.finditer(line):
                event_name = match.group(1)
                if not EVENT.fullmatch(event_name):
                    errors.append(
                        f"{path.relative_to(ROOT)}:{line_number}: invalid event identifier {event_name!r}; "
                        "expected <namespace>.<entity>.<past-tense-fact>.v<major>"
                    )
                    continue
                prefix = event_name.split(".", 1)[0]
                if prefix not in prefixes:
                    errors.append(
                        f"{path.relative_to(ROOT)}:{line_number}: unregistered event prefix {prefix!r} in {event_name}"
                    )
    return errors


def normalize_local_target(source: Path, target: str) -> Path | None:
    target = target.strip()
    if not target or target.startswith(("http://", "https://", "mailto:", "#")):
        return None
    target = target.split("#", 1)[0].split("?", 1)[0]
    if not target or PLACEHOLDER_PATH.search(target):
        return None
    candidate = Path(target)
    return candidate if candidate.is_absolute() else (source.parent / candidate)


def validate_internal_links() -> list[str]:
    errors: list[str] = []
    markdown_files = all_markdown_files()
    basename_index: dict[str, list[Path]] = defaultdict(list)
    for item in markdown_files:
        basename_index[item.name].append(item)

    for path in markdown_files:
        rel = path.relative_to(ROOT)
        # Audits and reusable templates may quote historical filenames or desired output names.
        if rel.parts and rel.parts[0] in {"reviews", "templates"}:
            continue
        text = path.read_text(encoding="utf-8")
        targets = [match.group(1) for match in MARKDOWN_LINK.finditer(text)]
        targets += [match.group(1) for match in BACKTICK_MD_PATH.finditer(text)]
        for target in targets:
            candidate = normalize_local_target(path, target)
            if candidate is None:
                continue
            root_target = target.split("#", 1)[0]
            root_candidate = ROOT / root_target
            if candidate.exists() or root_candidate.exists():
                continue
            if "/" not in root_target and len(basename_index.get(Path(root_target).name, [])) == 1:
                continue
            errors.append(f"{rel}: broken internal document reference {target!r}")
    return sorted(set(errors))


def validate_json_files() -> list[str]:
    errors: list[str] = []
    for path in sorted((ROOT / "registry").glob("*.json")):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            errors.append(f"{path.relative_to(ROOT)}: {exc}")
    return errors


def main() -> int:
    document_errors, document_ids = validate_documents()
    namespace_errors, prefixes = load_namespace_registry()
    errors = (
        document_errors
        + namespace_errors
        + validate_related_adrs(document_ids)
        + validate_event_identifiers(prefixes)
        + validate_internal_links()
        + validate_json_files()
    )
    if errors:
        print("Documentation governance validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print("Documentation governance validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
