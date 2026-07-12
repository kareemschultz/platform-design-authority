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
OPENAPI_PATH = re.compile(r"^  (/[^:]+):\s*$")
OPENAPI_METHOD = re.compile(r"^    (get|post|put|patch|delete|options|head|trace):\s*$")
OPENAPI_OPERATION_ID = re.compile(r"^      operationId:\s*(\S+)\s*$")
OPENAPI_PERMISSION = re.compile(r"^      x-permission:\s*(\S+)\s*$")
OPENAPI_AUTHORIZATION = re.compile(r"^      x-authorization:\s*(\S+)\s*$")
HEADING = re.compile(r"^(#{2,6})\s+(.+?)\s*$")
MARKDOWN_LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
BACKTICK_PATH = re.compile(r"`([^`\n]+\.md)`")
MARKDOWN_ENDPOINT = re.compile(r"`(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD|TRACE) (/v1/[^`\\s]+)`")
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


def normalize_endpoint_path(route: str) -> str:
    """Normalize base-version and placeholder names for contract parity checks."""
    if route.startswith("/v1/"):
        route = route[3:]
    return re.sub(r"\{[^{}]+\}", "{}", route)


def collect_openapi_operations(path: Path) -> tuple[list[str], dict[tuple[str, str], dict[str, str]]]:
    """Extract the controlled OpenAPI path surface without adding a YAML dependency to CI."""
    errors: list[str] = []
    operations: dict[tuple[str, str], dict[str, str]] = {}
    current_path: str | None = None
    current_key: tuple[str, str] | None = None
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        path_match = OPENAPI_PATH.match(line)
        if path_match:
            current_path = path_match.group(1)
            current_key = None
            continue
        method_match = OPENAPI_METHOD.match(line)
        if method_match and current_path:
            current_key = (method_match.group(1).upper(), normalize_endpoint_path(current_path))
            if current_key in operations:
                errors.append(f"{path.relative_to(ROOT)}:{line_number}: duplicate OpenAPI operation {current_key[0]} {current_path}")
            operations[current_key] = {"source_line": str(line_number)}
            continue
        if current_key is None:
            continue
        for field, pattern in (
            ("operation_id", OPENAPI_OPERATION_ID),
            ("permission", OPENAPI_PERMISSION),
            ("authorization", OPENAPI_AUTHORIZATION),
        ):
            match = pattern.match(line)
            if match:
                operations[current_key][field] = match.group(1)
                break
    operation_ids: dict[str, tuple[str, str]] = {}
    for key, operation in operations.items():
        operation_id = operation.get("operation_id")
        if not operation_id:
            errors.append(f"{path.relative_to(ROOT)}:{operation['source_line']}: {key[0]} {key[1]} has no operationId")
        elif operation_id in operation_ids:
            errors.append(f"{path.relative_to(ROOT)}: duplicate operationId {operation_id}")
        else:
            operation_ids[operation_id] = key
        if bool(operation.get("permission")) == bool(operation.get("authorization")):
            errors.append(f"{path.relative_to(ROOT)}:{operation['source_line']}: {key[0]} {key[1]} needs exactly one x-permission or x-authorization")
    return errors, operations


def validate_openapi_endpoint_parity() -> list[str]:
    errors: list[str] = []
    openapi_path = ROOT / "openapi" / "first-slice-v1.yaml"
    manifest_path = ROOT / "registry" / "endpoint-permissions.json"
    if not openapi_path.exists() or not manifest_path.exists():
        return errors
    extraction_errors, operations = collect_openapi_operations(openapi_path)
    errors.extend(extraction_errors)
    manifest = load_json(manifest_path).get("endpoints", [])
    expected: dict[tuple[str, str], dict[str, str]] = {}
    for item in manifest:
        key = (str(item.get("method", "")).upper(), normalize_endpoint_path(str(item.get("path", ""))))
        if key in expected:
            errors.append(f"registry/endpoint-permissions.json: duplicate normalized endpoint {key[0]} {key[1]}")
        expected[key] = {
            field: str(item[field])
            for field in ("permission", "authorization")
            if item.get(field)
        }
    for key in sorted(set(expected) - set(operations)):
        errors.append(f"openapi/first-slice-v1.yaml: missing endpoint from manifest: {key[0]} {key[1]}")
    for key in sorted(set(operations) - set(expected)):
        errors.append(f"openapi/first-slice-v1.yaml: endpoint absent from manifest: {key[0]} {key[1]}")
    for key in sorted(set(expected) & set(operations)):
        for field in ("permission", "authorization"):
            if expected[key].get(field) != operations[key].get(field):
                errors.append(
                    f"openapi/first-slice-v1.yaml: {key[0]} {key[1]} {field} "
                    f"{operations[key].get(field)!r} does not match manifest {expected[key].get(field)!r}"
                )
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


def validate_markdown_endpoint_parity() -> list[str]:
    _, operations = collect_openapi_operations(ROOT / "openapi" / "first-slice-v1.yaml")
    errors: list[str] = []
    for path in governed_markdown_files():
        if "FIRST_SLICE" not in path.name:
            continue
        for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
            for method, route in MARKDOWN_ENDPOINT.findall(line):
                if (method, normalize_endpoint_path(route)) not in operations:
                    errors.append(f"{path.relative_to(ROOT)}:{number}: endpoint absent from OpenAPI: {method} {route}")
    return errors

def validate_machine_semantics() -> list[str]:
    errors: list[str] = []
    rules = load_json(ROOT / "registry" / "architecture-rules.json")
    families = {str(item.get("id")) for item in rules.get("package_families", [])}
    for item in rules.get("package_families", []):
        for target in item.get("may_depend_on", []):
            if target not in families:
                errors.append(f"registry/architecture-rules.json: unknown family {target}")
    tokens = load_json(ROOT / "registry" / "design-tokens.json").get("tokens", {})
    if len([key for key in tokens.get("color", {}).get("chart", {}) if key.startswith("categorical-")]) != 8:
        errors.append("registry/design-tokens.json: chart palette requires eight categorical roles")
    return errors

def validate_schema_structure() -> list[str]:
    errors: list[str] = []
    for path in sorted((ROOT / "schemas").rglob("*.json")):
        schema = load_json(path)
        def walk(node: Any, location: str = "#") -> None:
            if isinstance(node, dict):
                required, properties = node.get("required", []), node.get("properties", {})
                if isinstance(required, list) and isinstance(properties, dict):
                    for name in required:
                        if name not in properties:
                            errors.append(f"{path.relative_to(ROOT)}:{location}: undefined required property {name}")
                ref = node.get("$ref")
                if isinstance(ref, str) and ref.startswith("#/"):
                    target: Any = schema
                    try:
                        for part in ref[2:].split("/"):
                            target = target[part.replace("~1", "/").replace("~0", "~")]
                    except (KeyError, TypeError):
                        errors.append(f"{path.relative_to(ROOT)}:{location}: unresolved local $ref {ref}")
                for key, value in node.items():
                    walk(value, f"{location}/{key}")
            elif isinstance(node, list):
                for index, value in enumerate(node):
                    walk(value, f"{location}/{index}")
        walk(schema)
    return errors

def validate_governance_exemptions() -> list[str]:
    errors: list[str] = []
    exemptions = {str(item.get("path")) for item in load_json(ROOT / "registry" / "governance-exemptions.json").get("exemptions", []) if item.get("rule") == "document_front_matter"}
    for path in all_markdown_files():
        rel = path.relative_to(ROOT).as_posix()
        if rel.startswith("templates/"):
            continue
        first = path.read_text(encoding="utf-8").splitlines()[:1]
        if not (first and first[0].strip() == "---") and rel not in exemptions:
            errors.append(f"{rel}: missing front matter and governance exemption")
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
        + validate_openapi_endpoint_parity()
        + validate_markdown_endpoint_parity()
        + validate_internal_links()
        + validate_json_files()
        + validate_machine_semantics()
        + validate_schema_structure()
        + validate_governance_exemptions()
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
