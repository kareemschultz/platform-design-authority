#!/usr/bin/env python3
"""Validate namespace-level capability admission and contract readiness."""

import json
import re
import sys
from collections import Counter
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
READINESS_PATH = REPO_ROOT / "registry" / "capability-readiness.json"
ALLOWED_STATES = {
    "outline",
    "research",
    "decision-blocked",
    "contract-planned",
    "workstream-active",
    "prototype-evidenced",
    "deferred",
}
FIRST_SLICE_STATES = {
    "decision-blocked",
    "contract-planned",
    "workstream-active",
    "prototype-evidenced",
}


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def namespace_owners(domains: dict[str, Any]) -> dict[str, dict[str, str]]:
    """Expand primary and additional namespace prefixes to their owners."""

    owners: dict[str, dict[str, str]] = {}
    for record in domains.get("namespaces", []):
        for prefix in [record.get("prefix"), *record.get("additional_prefixes", [])]:
            if prefix:
                owners[str(prefix)] = {
                    "owner": str(record.get("name", "")),
                    "authoritative_document": str(
                        record.get("authoritative_document", "")
                    ),
                }
    return owners


def validate_capability_readiness(
    capabilities: dict[str, Any],
    domains: dict[str, Any],
    permissions: dict[str, Any],
    events: dict[str, Any],
    tests: dict[str, Any],
    readiness: dict[str, Any],
    repo_root: Path,
) -> list[str]:
    """Return deterministic readiness registration errors."""

    errors: list[str] = []
    capability_rows = capabilities.get("capabilities", [])
    family_rows = readiness.get("families", [])
    owners = namespace_owners(domains)
    capability_namespaces = {str(row.get("namespace", "")) for row in capability_rows}
    family_namespaces = [str(row.get("namespace", "")) for row in family_rows]

    for namespace, count in sorted(Counter(family_namespaces).items()):
        if namespace and count > 1:
            errors.append(f"duplicate readiness family: {namespace}")
    for namespace in sorted(capability_namespaces - set(family_namespaces)):
        errors.append(f"capability namespace has no readiness row: {namespace}")
    for namespace in sorted(set(family_namespaces) - capability_namespaces):
        errors.append(f"readiness row has no canonical capabilities: {namespace}")

    state_definitions = readiness.get("state_definitions", {})
    if set(state_definitions) != ALLOWED_STATES:
        missing = sorted(ALLOWED_STATES - set(state_definitions))
        extra = sorted(set(state_definitions) - ALLOWED_STATES)
        errors.append(
            f"readiness state definitions drifted; missing={missing}, extra={extra}"
        )

    source_document = str(readiness.get("source_document", ""))
    if not source_document or not (repo_root / source_document).is_file():
        errors.append(f"readiness source document does not exist: {source_document}")

    evidenced_by_namespace = Counter(
        str(row.get("capability_id", "")).split(".", maxsplit=1)[0]
        for row in tests.get("tests", [])
        if row.get("evidence_status") == "Evidenced"
    )
    first_slice_by_namespace = Counter(
        str(row.get("namespace", ""))
        for row in capability_rows
        if row.get("first_slice") is True
    )

    permission_namespaces = Counter(
        str(row.get("namespace", "")) for row in permissions.get("permissions", [])
    )
    event_namespaces = Counter(
        str(row.get("namespace", "")) for row in events.get("events", [])
    )

    for family in family_rows:
        namespace = str(family.get("namespace", ""))
        if not re.fullmatch(r"[a-z][a-z0-9-]*", namespace):
            errors.append(f"invalid readiness namespace: {namespace or '<empty>'}")
            continue
        owner_record = owners.get(namespace)
        if owner_record is None:
            errors.append(f"readiness namespace has no registered owner: {namespace}")
            continue
        declared_owner = str(family.get("owner", ""))
        if declared_owner != owner_record["owner"]:
            errors.append(
                f"{namespace}: owner {declared_owner!r} does not match "
                f"{owner_record['owner']!r}"
            )

        capability_owners = {
            str(row.get("owner", ""))
            for row in capability_rows
            if row.get("namespace") == namespace
        }
        if capability_owners != {declared_owner}:
            errors.append(
                f"{namespace}: capability owners do not resolve exactly to {declared_owner!r}"
            )

        state = str(family.get("readiness_state", ""))
        if state not in ALLOWED_STATES:
            errors.append(f"{namespace}: invalid readiness state {state!r}")
        first_slice_count = first_slice_by_namespace[namespace]
        evidenced_count = evidenced_by_namespace[namespace]
        if first_slice_count and state not in FIRST_SLICE_STATES:
            errors.append(
                f"{namespace}: {first_slice_count} first-slice capabilities cannot use {state!r}"
            )
        if state in {"contract-planned", "workstream-active"} and not first_slice_count:
            errors.append(f"{namespace}: {state} requires admitted first-slice scope")
        if evidenced_count and state != "prototype-evidenced":
            errors.append(
                f"{namespace}: {evidenced_count} evidenced capabilities require "
                "prototype-evidenced state"
            )
        if state == "prototype-evidenced" and not evidenced_count:
            errors.append(
                f"{namespace}: prototype-evidenced has no Evidenced capability record"
            )

        trigger = str(family.get("admission_trigger", "")).strip()
        if len(trigger) < 20:
            errors.append(f"{namespace}: admission trigger is missing or too vague")
        blockers = family.get("blockers", [])
        if not isinstance(blockers, list) or not blockers or any(
            not isinstance(item, str) or not item.strip() for item in blockers
        ):
            errors.append(f"{namespace}: blockers must contain explicit non-empty entries")

        evidence_refs = family.get("evidence_refs", [])
        if not isinstance(evidence_refs, list) or not evidence_refs:
            errors.append(f"{namespace}: evidence_refs must not be empty")
            continue
        authoritative_document = owner_record["authoritative_document"]
        if authoritative_document not in evidence_refs:
            errors.append(
                f"{namespace}: evidence_refs omit authoritative document "
                f"{authoritative_document}"
            )
        for reference in evidence_refs:
            if not isinstance(reference, str) or not reference:
                errors.append(f"{namespace}: evidence reference is empty or invalid")
            elif not (repo_root / reference).is_file():
                errors.append(f"{namespace}: evidence reference does not exist: {reference}")

    readiness["_validation_summary"] = {
        "capabilities": len(capability_rows),
        "families": len(capability_namespaces),
        "first_slice_capabilities": sum(first_slice_by_namespace.values()),
        "permissions": sum(permission_namespaces.values()),
        "events": sum(event_namespaces.values()),
        "evidenced_capabilities": sum(evidenced_by_namespace.values()),
    }
    return errors


def main() -> int:
    readiness = load_json(READINESS_PATH)
    errors = validate_capability_readiness(
        load_json(REPO_ROOT / "registry" / "capabilities.json"),
        load_json(REPO_ROOT / "registry" / "domains.json"),
        load_json(REPO_ROOT / "registry" / "permissions.json"),
        load_json(REPO_ROOT / "registry" / "events.json"),
        load_json(REPO_ROOT / "registry" / "first-slice-tests.json"),
        readiness,
        REPO_ROOT,
    )
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} capability-readiness error(s).")
        return 1
    summary = readiness["_validation_summary"]
    print(
        "Capability-readiness validation passed: "
        f"{summary['families']} families cover {summary['capabilities']} capabilities; "
        f"{summary['first_slice_capabilities']} are first-slice and "
        f"{summary['evidenced_capabilities']} have bounded evidence."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
