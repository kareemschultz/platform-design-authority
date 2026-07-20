#!/usr/bin/env python3
"""Validate opt-in document-class adoption without implying semantic review."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
POLICY_PATH = Path("registry/document-classes.json")
ADOPTION_PATH = Path("registry/document-class-adoption.json")
DOCUMENTS_PATH = Path("registry/documents.json")
DISPOSITIONS = {"addressed", "not-applicable"}
REVIEW_STATES = {"author-self-reviewed", "independent-reviewed"}


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_front_matter(path: Path) -> dict[str, Any]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening front-matter delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("missing closing front-matter delimiter") from exc
    metadata: dict[str, Any] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"invalid front-matter line: {line!r}")
        key, raw = line.split(":", 1)
        value = raw.strip()
        if value.startswith("[") and value.endswith("]"):
            body = value[1:-1].strip()
            metadata[key.strip()] = (
                []
                if not body
                else [item.strip().strip('"').strip("'") for item in body.split(",")]
            )
        else:
            metadata[key.strip()] = value.strip('"').strip("'")
    return metadata


def headings(path: Path) -> set[str]:
    values: set[str] = set()
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.lstrip()
        marker_length = len(stripped) - len(stripped.lstrip("#"))
        if 1 <= marker_length <= 6 and stripped[marker_length :].startswith(" "):
            values.add(stripped[marker_length + 1 :].strip())
    return values


def validate_document_classes(root: Path = REPO_ROOT) -> list[str]:
    errors: list[str] = []
    try:
        policy = load_json(root / POLICY_PATH)
        adoption = load_json(root / ADOPTION_PATH)
    except (OSError, json.JSONDecodeError) as exc:
        return [str(exc)]

    dimensions = [str(item.get("id", "")) for item in policy.get("dimensions", [])]
    if not dimensions or len(dimensions) != len(set(dimensions)) or "" in dimensions:
        errors.append(f"{POLICY_PATH.as_posix()}: dimension IDs must be non-empty and unique")
    dimension_ids = set(dimensions)

    classes: dict[str, list[str]] = {}
    for item in policy.get("classes", []):
        class_id = str(item.get("id", ""))
        required = [str(value) for value in item.get("required_dimensions", [])]
        if not class_id or class_id in classes:
            errors.append(f"{POLICY_PATH.as_posix()}: class IDs must be non-empty and unique")
            continue
        unknown = sorted(set(required) - dimension_ids)
        if not required or unknown or len(required) != len(set(required)):
            errors.append(
                f"{POLICY_PATH.as_posix()}: {class_id} has empty, duplicate, or unknown dimensions {unknown}"
            )
        classes[class_id] = required

    depths = {str(value) for value in policy.get("depths", [])}
    evidence_states = {str(value) for value in policy.get("evidence_states", [])}
    review_path_value = str(adoption.get("review_evidence", ""))
    review_path = root / review_path_value
    review_text = review_path.read_text(encoding="utf-8") if review_path.is_file() else ""
    if not review_text:
        errors.append(f"{ADOPTION_PATH.as_posix()}: missing review evidence {review_path_value!r}")

    document_records: dict[str, dict[str, Any]] = {}
    documents_file = root / DOCUMENTS_PATH
    if documents_file.is_file():
        try:
            document_records = {
                str(item.get("document_id")): item
                for item in load_json(documents_file).get("documents", [])
            }
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{DOCUMENTS_PATH.as_posix()}: {exc}")

    seen_ids: set[str] = set()
    seen_paths: set[str] = set()
    adopted_classes: set[str] = set()
    for artifact in adoption.get("artifacts", []):
        artifact_id = str(artifact.get("artifact_id", ""))
        relative_path = str(artifact.get("path", ""))
        identity = str(artifact.get("identity", ""))
        class_id = str(artifact.get("class_id", ""))
        label = artifact_id or relative_path or "<unnamed artifact>"
        if not artifact_id or artifact_id in seen_ids:
            errors.append(f"{ADOPTION_PATH.as_posix()}: duplicate or empty artifact ID {artifact_id!r}")
        seen_ids.add(artifact_id)
        if not relative_path or relative_path in seen_paths:
            errors.append(f"{ADOPTION_PATH.as_posix()}: duplicate or empty artifact path {relative_path!r}")
        seen_paths.add(relative_path)
        artifact_path = root / relative_path
        if not artifact_path.is_file():
            errors.append(f"{label}: missing artifact path {relative_path!r}")
            continue
        if class_id not in classes:
            errors.append(f"{label}: unknown document class {class_id!r}")
            continue
        adopted_classes.add(class_id)
        if artifact.get("declared_depth") not in depths:
            errors.append(f"{label}: invalid declared depth {artifact.get('declared_depth')!r}")
        if artifact.get("evidence_state") not in evidence_states:
            errors.append(f"{label}: invalid evidence state {artifact.get('evidence_state')!r}")
        if artifact.get("review_state") not in REVIEW_STATES:
            errors.append(f"{label}: invalid review state {artifact.get('review_state')!r}")

        try:
            metadata = parse_front_matter(artifact_path)
        except ValueError as exc:
            errors.append(f"{label}: {exc}")
            continue
        actual_identity = metadata.get("document_id") or metadata.get("documentation_id")
        expected_metadata = {
            "identity": (actual_identity, identity),
            "document_class": (metadata.get("document_class"), class_id),
            "declared_depth": (metadata.get("declared_depth"), artifact.get("declared_depth")),
            "evidence_state": (metadata.get("evidence_state"), artifact.get("evidence_state")),
            "applicable_dimensions": (
                metadata.get("applicable_dimensions"),
                classes[class_id],
            ),
        }
        for field, (actual, expected) in expected_metadata.items():
            if actual != expected:
                errors.append(f"{label}: {field} {actual!r} does not match {expected!r}")

        mappings = artifact.get("dimensions", {})
        if not isinstance(mappings, dict) or set(mappings) != set(classes[class_id]):
            errors.append(
                f"{label}: dimension mappings must exactly match class requirements {classes[class_id]}"
            )
            continue
        artifact_headings = headings(artifact_path)
        for dimension_id in classes[class_id]:
            mapping = mappings[dimension_id]
            disposition = mapping.get("disposition") if isinstance(mapping, dict) else None
            if disposition not in DISPOSITIONS:
                errors.append(f"{label}: {dimension_id} has invalid disposition {disposition!r}")
                continue
            sections = mapping.get("sections", [])
            reason = str(mapping.get("reason", "")).strip()
            if disposition == "addressed":
                if not isinstance(sections, list) or not sections:
                    errors.append(f"{label}: {dimension_id} addressed mapping requires sections")
                else:
                    for section in sections:
                        if str(section) not in artifact_headings:
                            errors.append(f"{label}: {dimension_id} references missing heading {section!r}")
                if reason:
                    errors.append(f"{label}: {dimension_id} addressed mapping must not carry a reason")
            else:
                if len(reason) < 30:
                    errors.append(f"{label}: {dimension_id} not-applicable reason is not specific")
                if sections:
                    errors.append(f"{label}: {dimension_id} not-applicable mapping must not cite sections")

        if review_text:
            folded_review = review_text.casefold()
            for value_name, value in (
                ("artifact ID", artifact_id),
                ("identity", identity),
                ("class", class_id),
            ):
                if value.casefold() not in folded_review:
                    errors.append(f"{label}: review evidence does not identify {value_name} {value!r}")

        if relative_path.endswith(".md") and identity in document_records:
            record = document_records[identity]
            for field in ("document_class", "declared_depth", "evidence_state", "applicable_dimensions"):
                if record.get(field) != metadata.get(field):
                    errors.append(f"{label}: generated document registry field {field} is stale")

    missing_classes = sorted(set(classes) - adopted_classes)
    if missing_classes:
        errors.append(f"{ADOPTION_PATH.as_posix()}: no adoption sample for classes {missing_classes}")
    return errors


def main() -> int:
    errors = validate_document_classes()
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} document-class error(s).")
        return 1
    adoption = load_json(REPO_ROOT / ADOPTION_PATH)
    print(
        "Document-class validation passed: "
        f"{len(adoption['artifacts'])} adopted samples cover 9 classes; independent review remains open."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
