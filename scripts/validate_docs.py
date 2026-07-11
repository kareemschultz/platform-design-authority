#!/usr/bin/env python3
"""Validate Platform Design Authority documentation, registries, skills, and contracts."""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
ADR_FILE = re.compile(r"^ADR-\d{4}-[A-Z0-9-]+\.md$")
SPEC_FILE = re.compile(r"^[A-Z0-9_]+(?:-\d{4}-\d{2}-\d{2})?\.md$")
DOCUMENT_ID = re.compile(r"^(?:PDA-[A-Z]+-\d{3}|ADR-\d{4})$")
SEMVER = re.compile(r"^\d+\.\d+\.\d+$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
EVENT = re.compile(r"^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*$")
EVENT_BULLET = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*)`\s*$")
EVENT_CANDIDATE = re.compile(r"`([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.v[1-9][0-9]*)`")
PERMISSION = re.compile(r"^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$")
PERMISSION_BULLET = re.compile(r"^- `([a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*)`\s*$")
HEADING = re.compile(r"^(#{2,6})\s+(.+?)\s*$")
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
BACKTICK_PATH = re.compile(r"`([^`\n]+\.md)`")
PLACEHOLDER_PATH = re.compile(r"(?:NNNN|XXXX|YYYY|DESCRIPTIVE|<[^>]+>)")
VALID_STATUSES = {"Planned", "Draft", "Proposed", "In Review", "Approved", "Accepted", "Ratified", "Deprecated", "Superseded", "Archived"}
REQUIRED_FIELDS = {"document_id", "title", "version", "status", "owner", "last_reviewed"}
REVIEW_GATED_STATUSES = {"Approved", "Ratified"}


def parse_front_matter(path: Path) -> dict[str, str]:
    lines = path.read_text(encoding="utf-8").splitlines()
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


def parse_simple_front_matter(path: Path) -> dict[str, str]:
    try:
        return parse_front_matter(path)
    except ValueError:
        return {}


def all_markdown_files() -> list[Path]:
    return [path for path in sorted(ROOT.rglob("*.md")) if not any(part.startswith(".") for part in path.relative_to(ROOT).parts)]


def governed_markdown_files() -> list[Path]:
    governed: list[Path] = []
    for path in all_markdown_files():
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] == "templates":
            continue
        first = path.read_text(encoding="utf-8").splitlines()[:1]
        if first and first[0].strip() == "---":
            governed.append(path)
    return governed


def parse_list(raw: str) -> list[str]:
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
        if status in REVIEW_GATED_STATUSES and not meta.get("review_evidence"):
            errors.append(f"{rel}: {status} documents require review_evidence")
        if path.parent.name == "18-Decisions":
            if not ADR_FILE.fullmatch(path.name):
                errors.append(f"{rel}: ADR filename does not match required pattern")
            if not meta.get("created"):
                errors.append(f"{rel}: ADR is missing created date")
        elif path.name not in {"README.md", "PLATFORM_MANIFEST.md"} and not SPEC_FILE.fullmatch(path.name):
            errors.append(f"{rel}: specification filename must use uppercase snake case; a trailing ISO date is allowed for dated evidence")
    for document_id, paths in ids.items():
        if len(paths) > 1:
            errors.append(f"duplicate document_id {document_id}: {', '.join(map(str, paths))}")
    return errors, {document_id: paths[0] for document_id, paths in ids.items() if len(paths) == 1}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def load_namespace_registry() -> tuple[list[str], dict[str, dict[str, object]]]:
    errors: list[str] = []
    path = ROOT / "registry" / "domains.json"
    if not path.exists():
        return ["registry/domains.json: missing"], {}
    try:
        data = load_json(path)
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
            errors.append(f"registry/domains.json: duplicate prefix {prefix!r}")
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
        for adr in parse_list(meta.get("related_adrs", "")):
            if adr not in document_ids:
                errors.append(f"{path.relative_to(ROOT)}: related ADR does not exist: {adr}")
            elif not adr.startswith("ADR-"):
                errors.append(f"{path.relative_to(ROOT)}: related_adrs contains non-ADR id: {adr}")
    return errors


def is_canonical_event_heading(heading: str) -> bool:
    normalized = heading.strip().lower()
    return normalized == "events" or normalized.endswith(" events") or normalized in {"event integration", "required events", "representative events"}


def collect_canonical_events(prefixes: dict[str, dict[str, object]]) -> tuple[list[str], set[str]]:
    errors: list[str] = []
    definitions: dict[str, str] = {}
    for path in governed_markdown_files():
        current_heading = ""
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            heading = HEADING.match(line)
            if heading:
                current_heading = heading.group(2)
                continue
            if not is_canonical_event_heading(current_heading):
                continue
            match = EVENT_BULLET.match(line)
            if not match:
                continue
            event_name = match.group(1)
            source = f"{path.relative_to(ROOT)}:{line_number}"
            prefix = event_name.split(".", 1)[0]
            if prefix not in prefixes:
                errors.append(f"{source}: unregistered event prefix {prefix!r}")
            if event_name in definitions:
                errors.append(f"duplicate canonical event {event_name}: {definitions[event_name]} and {source}")
            definitions[event_name] = source
    return errors, set(definitions)


def validate_event_references(prefixes: dict[str, dict[str, object]]) -> list[str]:
    definition_errors, definitions = collect_canonical_events(prefixes)
    errors = list(definition_errors)
    for path in governed_markdown_files():
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in {"reviews", "templates"}:
            continue
        for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
            for event_name in EVENT_CANDIDATE.findall(line):
                if not EVENT.fullmatch(event_name):
                    errors.append(f"{rel}:{line_number}: invalid event identifier {event_name}")
                    continue
                prefix = event_name.split(".", 1)[0]
                if prefix not in prefixes:
                    errors.append(f"{rel}:{line_number}: unregistered event prefix {prefix!r} in {event_name}")
                if event_name not in definitions:
                    errors.append(f"{rel}:{line_number}: event reference has no canonical definition: {event_name}")
    return sorted(set(errors))


def collect_permissions(prefixes: dict[str, dict[str, object]]) -> tuple[list[str], set[str]]:
    errors: list[str] = []
    path = ROOT / "01-Platform" / "FIRST_SLICE_PERMISSION_CATALOG.md"
    definitions: set[str] = set()
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        match = PERMISSION_BULLET.match(line)
        if not match:
            continue
        permission = match.group(1)
        if permission in definitions:
            errors.append(f"{path.relative_to(ROOT)}:{line_number}: duplicate permission {permission}")
        definitions.add(permission)
        prefix = permission.split(".", 1)[0]
        if prefix not in prefixes:
            errors.append(f"{path.relative_to(ROOT)}:{line_number}: unregistered permission prefix {prefix!r}")
    return errors, definitions


def validate_endpoint_permissions(prefixes: dict[str, dict[str, object]]) -> list[str]:
    errors, permissions = collect_permissions(prefixes)
    path = ROOT / "registry" / "endpoint-permissions.json"
    try:
        endpoints = load_json(path).get("endpoints", [])
    except (OSError, json.JSONDecodeError) as exc:
        return errors + [f"{path.relative_to(ROOT)}: {exc}"]
    seen: set[tuple[str, str]] = set()
    for item in endpoints:
        method = str(item.get("method", ""))
        route = str(item.get("path", ""))
        key = (method, route)
        if key in seen:
            errors.append(f"registry/endpoint-permissions.json: duplicate endpoint {method} {route}")
        seen.add(key)
        permission = item.get("permission")
        authorization = item.get("authorization")
        if bool(permission) == bool(authorization):
            errors.append(f"registry/endpoint-permissions.json: {method} {route} needs exactly one permission or authorization marker")
        if permission and permission not in permissions:
            errors.append(f"registry/endpoint-permissions.json: unknown permission {permission} for {method} {route}")
    return sorted(set(errors))


def looks_like_document_reference(target: str) -> bool:
    if "/" in target or "\\" in target:
        return True
    name = Path(target).name
    return name == "README.md" or bool(SPEC_FILE.fullmatch(name)) or bool(ADR_FILE.fullmatch(name))


def normalize_local_target(source: Path, target: str) -> Path | None:
    target = target.strip()
    if not target or target.startswith(("http://", "https://", "mailto:", "#")):
        return None
    target = target.split("#", 1)[0].split("?", 1)[0]
    if not target or PLACEHOLDER_PATH.search(target):
        return None
    candidate = Path(target)
    return candidate if candidate.is_absolute() else source.parent / candidate


def validate_internal_links() -> list[str]:
    errors: list[str] = []
    markdown_files = all_markdown_files()
    basename_index: dict[str, list[Path]] = defaultdict(list)
    for item in markdown_files:
        basename_index[item.name].append(item)
    for path in markdown_files:
        rel = path.relative_to(ROOT)
        if rel.parts and rel.parts[0] in {"reviews", "templates"}:
            continue
        text = path.read_text(encoding="utf-8")
        targets = [match.group(1) for match in MARKDOWN_LINK.finditer(text)]
        targets += [match.group(1) for match in BACKTICK_PATH.finditer(text) if looks_like_document_reference(match.group(1))]
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
    for directory in [ROOT / "registry", ROOT / "schemas"]:
        if not directory.exists():
            continue
        for path in sorted(directory.rglob("*.json")):
            try:
                load_json(path)
            except (json.JSONDecodeError, OSError) as exc:
                errors.append(f"{path.relative_to(ROOT)}: {exc}")
    return errors


def validate_contract_files() -> list[str]:
    errors: list[str] = []
    required = [
        "openapi/first-slice-v1.yaml",
        "schemas/events/event-envelope-v1.schema.json",
        "schemas/offline/sync-batch-v1.schema.json",
        "schemas/providers/provider-capability-v1.schema.json",
        "schemas/import-export/import-export-v1.schema.json",
        "schemas/finance/finance-handoff-v1.schema.json",
        "schemas/webhooks/webhook-envelope-v1.schema.json",
        "schemas/ai/registry-records-v1.schema.json",
        "registry/architecture-rules.json",
        "registry/design-tokens.json",
        "registry/endpoint-permissions.json",
    ]
    for relative in required:
        if not (ROOT / relative).exists():
            errors.append(f"missing required contract: {relative}")
    openapi = ROOT / "openapi" / "first-slice-v1.yaml"
    if openapi.exists() and "openapi: 3.1.0" not in openapi.read_text(encoding="utf-8"):
        errors.append("openapi/first-slice-v1.yaml: expected OpenAPI 3.1.0 marker")
    return errors


def validate_skills() -> list[str]:
    errors: list[str] = []
    skills_root = ROOT / ".claude" / "skills"
    if not skills_root.exists():
        return errors
    for path in sorted(skills_root.glob("*/SKILL.md")):
        meta = parse_simple_front_matter(path)
        if not meta.get("name") or not meta.get("description"):
            errors.append(f"{path.relative_to(ROOT)}: skill requires name and description")
        if "allowed-tools" in meta:
            errors.append(f"{path.relative_to(ROOT)}: allowed-tools pre-approves tools and cannot be used as a restriction")
        body = path.read_text(encoding="utf-8")
        read_only = "read-only" in body.lower()
        if read_only and not meta.get("disallowed-tools"):
            errors.append(f"{path.relative_to(ROOT)}: read-only skill requires disallowed-tools")
    return errors


def main() -> int:
    document_errors, document_ids = validate_documents()
    namespace_errors, prefixes = load_namespace_registry()
    errors = (
        document_errors
        + namespace_errors
        + validate_related_adrs(document_ids)
        + validate_event_references(prefixes)
        + validate_endpoint_permissions(prefixes)
        + validate_internal_links()
        + validate_json_files()
        + validate_contract_files()
        + validate_skills()
    )
    if errors:
        print("Documentation governance validation failed:", file=sys.stderr)
        for error in sorted(set(errors)):
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Documentation governance validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
