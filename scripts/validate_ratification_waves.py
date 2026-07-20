#!/usr/bin/env python3
"""Validate ratification-wave evidence gates and prohibit false promotion."""

import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
EXPECTED_WAVES = {f"RW-{number:02d}" for number in range(9)}
ALLOWED_STATES = {
    "not-started",
    "preparation",
    "in-review",
    "changes-requested",
    "approved",
    "ratified",
    "superseded",
}
REVIEW_STATES = {"in-review", "changes-requested", "approved", "ratified"}
APPROVAL_STATES = {"approved", "ratified"}
SHA256 = re.compile(r"^[0-9a-f]{64}$")
GIT_SHA = re.compile(r"^[0-9a-f]{40}$")


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def revision_exists(repo_root: Path, revision: str) -> bool:
    """Return whether a revision is an ancestor of the current checkout."""

    if not (repo_root / ".git").exists():
        return True
    result = subprocess.run(
        ["git", "merge-base", "--is-ancestor", revision, "HEAD"],
        cwd=repo_root,
        check=False,
        capture_output=True,
        text=True,
    )
    return result.returncode == 0


def validate_ratification_waves(
    waves: dict[str, Any], documents: dict[str, Any], repo_root: Path
) -> list[str]:
    """Return deterministic wave-manifest and lifecycle errors."""

    errors: list[str] = []
    state_definitions = waves.get("state_definitions", {})
    if set(state_definitions) != ALLOWED_STATES:
        errors.append("ratification state definitions do not match the governed vocabulary")

    source_document = str(waves.get("source_document", ""))
    if not source_document or not (repo_root / source_document).is_file():
        errors.append(f"ratification source document does not exist: {source_document}")

    wave_rows = waves.get("waves", [])
    wave_ids = [str(row.get("wave_id", "")) for row in wave_rows]
    for wave_id, count in sorted(Counter(wave_ids).items()):
        if wave_id and count > 1:
            errors.append(f"duplicate ratification wave: {wave_id}")
    for wave_id in sorted(EXPECTED_WAVES - set(wave_ids)):
        errors.append(f"required ratification wave is missing: {wave_id}")
    for wave_id in sorted(set(wave_ids) - EXPECTED_WAVES):
        errors.append(f"unexpected ratification wave: {wave_id}")

    sequences = [row.get("sequence") for row in wave_rows]
    for sequence, count in Counter(sequences).items():
        if count > 1:
            errors.append(f"duplicate ratification sequence: {sequence}")

    document_map = {
        str(row.get("document_id")): row for row in documents.get("documents", [])
    }
    for row in wave_rows:
        wave_id = str(row.get("wave_id", ""))
        sequence = row.get("sequence")
        expected_id = f"RW-{sequence:02d}" if isinstance(sequence, int) else ""
        if expected_id != wave_id:
            errors.append(f"{wave_id}: sequence does not match wave ID")
        state = str(row.get("state", ""))
        if state not in ALLOWED_STATES:
            errors.append(f"{wave_id}: invalid state {state!r}")

        if not str(row.get("approval_authority", "")).strip():
            errors.append(f"{wave_id}: approval authority is missing")
        reviewer_roles = row.get("required_reviewer_roles", [])
        if not isinstance(reviewer_roles, list) or not reviewer_roles:
            errors.append(f"{wave_id}: required reviewer roles are missing")
            reviewer_roles = []
        elif len(set(reviewer_roles)) != len(reviewer_roles):
            errors.append(f"{wave_id}: required reviewer roles contain duplicates")

        blockers = row.get("blocking_dependencies", [])
        if not isinstance(blockers, list) or not blockers or any(
            not isinstance(item, str) or not item.strip() for item in blockers
        ):
            errors.append(f"{wave_id}: blocking dependencies must be explicit")
        scope_refs = row.get("scope_refs", [])
        if not isinstance(scope_refs, list) or not scope_refs:
            errors.append(f"{wave_id}: scope entry points are missing")
        else:
            for reference in scope_refs:
                if not isinstance(reference, str) or not (repo_root / reference).is_file():
                    errors.append(f"{wave_id}: scope reference does not exist: {reference}")

        candidate = row.get("candidate_revision")
        scope_manifest = row.get("scope_manifest", [])
        review_records = row.get("review_records", [])
        disposition = row.get("finding_disposition")
        approval = row.get("approval_record")
        promotions = row.get("promotion_records", [])

        if state in {"not-started", "preparation"}:
            premature = {
                "candidate_revision": candidate,
                "scope_manifest": scope_manifest,
                "review_records": review_records,
                "finding_disposition": disposition,
                "approval_record": approval,
                "promotion_records": promotions,
            }
            for field, value in premature.items():
                if value not in (None, []):
                    errors.append(f"{wave_id}: {field} is premature in {state}")
            continue

        if state == "superseded":
            continue
        if state in REVIEW_STATES:
            if not isinstance(candidate, str) or not GIT_SHA.fullmatch(candidate):
                errors.append(f"{wave_id}: review state requires an exact Git SHA")
            elif not revision_exists(repo_root, candidate):
                errors.append(f"{wave_id}: candidate revision is not an ancestor of HEAD")
            if not isinstance(scope_manifest, list) or not scope_manifest:
                errors.append(f"{wave_id}: review state requires a frozen scope manifest")
            if not isinstance(review_records, list) or not review_records:
                errors.append(f"{wave_id}: review state requires at least one review record")

        for item in scope_manifest if isinstance(scope_manifest, list) else []:
            document_id = str(item.get("document_id", ""))
            registered = document_map.get(document_id)
            if registered is None:
                errors.append(f"{wave_id}: unknown scoped document {document_id}")
                continue
            for field in ("path", "version"):
                if item.get(field) != registered.get(field):
                    errors.append(
                        f"{wave_id}: {document_id} {field} does not match document registry"
                    )
            if item.get("status_before_review") != registered.get("status"):
                errors.append(
                    f"{wave_id}: {document_id} status_before_review does not match registry"
                )
            if not SHA256.fullmatch(str(item.get("content_hash", ""))):
                errors.append(f"{wave_id}: {document_id} lacks a SHA-256 content hash")
            if item.get("scope_disposition") not in {
                "review",
                "context-only",
                "explicitly-deferred",
            }:
                errors.append(f"{wave_id}: {document_id} has invalid scope disposition")

        covered_roles: set[str] = set()
        for record in review_records if isinstance(review_records, list) else []:
            role = str(record.get("reviewer_role", ""))
            if role not in reviewer_roles:
                errors.append(f"{wave_id}: undeclared reviewer role {role!r}")
            covered_roles.add(role)
            if record.get("candidate_revision") != candidate:
                errors.append(f"{wave_id}: review record is bound to the wrong revision")
            path = record.get("path")
            if not isinstance(path, str) or not (repo_root / path).is_file():
                errors.append(f"{wave_id}: review record path does not exist: {path}")

        if state in {"changes-requested", *APPROVAL_STATES}:
            if not isinstance(disposition, str) or not (repo_root / disposition).is_file():
                errors.append(f"{wave_id}: finding disposition evidence is missing")
        if state in APPROVAL_STATES:
            missing_roles = sorted(set(reviewer_roles) - covered_roles)
            if missing_roles:
                errors.append(
                    f"{wave_id}: approval is missing reviewer roles: {', '.join(missing_roles)}"
                )
            if not isinstance(approval, str) or not (repo_root / approval).is_file():
                errors.append(f"{wave_id}: approval record is missing")
        elif promotions:
            errors.append(f"{wave_id}: lifecycle promotion requires approved or ratified state")

        for promotion in promotions if isinstance(promotions, list) else []:
            document_id = str(promotion.get("document_id", ""))
            if document_id not in document_map:
                errors.append(f"{wave_id}: promotion uses unknown document {document_id}")
            if promotion.get("status_after") not in {"Approved", "Accepted", "Ratified"}:
                errors.append(f"{wave_id}: promotion has invalid target status")
            evidence_path = promotion.get("review_evidence")
            if not isinstance(evidence_path, str) or not (repo_root / evidence_path).is_file():
                errors.append(f"{wave_id}: promotion review evidence is missing")

    return errors


def main() -> int:
    errors = validate_ratification_waves(
        load_json(REPO_ROOT / "registry" / "ratification-waves.json"),
        load_json(REPO_ROOT / "registry" / "documents.json"),
        REPO_ROOT,
    )
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} ratification-wave error(s).")
        return 1
    print(
        "Ratification-wave validation passed: RW-00 is preparation only; "
        "RW-01 through RW-08 remain not-started with no false review or promotion."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
