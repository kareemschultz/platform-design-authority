#!/usr/bin/env python3
"""Validate operational readiness without inventing review or exercise evidence."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
REGISTER_PATH = REPO_ROOT / "registry" / "operational-readiness.json"
CAPABILITIES_PATH = REPO_ROOT / "registry" / "capabilities.json"
SERVICE_ID = re.compile(r"^OPS-SVC-\d{3}$")
SERVICE_REF = re.compile(r"\bOPS-SVC-\d{3}\b")
READINESS_STATES = {
    "requirements-only",
    "procedure-draft",
    "reviewed",
    "exercised",
    "pilot-ready",
}
IMPLEMENTATION_STATES = {
    "merged-controlled-prototype",
    "merged-storage-only",
}
COMMIT_SHA = re.compile(r"^[0-9a-f]{40}$")
ISO_DATE = re.compile(r"^\d{4}-\d{2}-\d{2}$")
PULL_REQUEST_REF = re.compile(r"\bPR\s+#(\d+)\b", re.IGNORECASE)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def nonempty_strings(value: Any) -> bool:
    return isinstance(value, list) and bool(value) and all(
        isinstance(item, str) and item.strip() for item in value
    )


def string_list(value: Any) -> bool:
    return isinstance(value, list) and all(
        isinstance(item, str) and item.strip() for item in value
    )


def validate_paths(
    values: Any, label: str, service_id: str, repo_root: Path, errors: list[str]
) -> None:
    if not string_list(values):
        errors.append(f"{service_id}: {label} must be an array of non-empty paths")
        return
    for value in values:
        if not (repo_root / value).is_file():
            errors.append(f"{service_id}: {label} path does not exist: {value}")


def validate_operational_readiness(
    register: dict[str, Any], capabilities: dict[str, Any], repo_root: Path
) -> list[str]:
    errors: list[str] = []
    if register.get("schema_version") != "1.0.0":
        errors.append("operational readiness schema_version must be 1.0.0")
    if set(register.get("readiness_states", {})) != READINESS_STATES:
        errors.append("readiness state definitions must match the governed state set")

    evidence_cutoff = register.get("evidence_cutoff", {})
    if not isinstance(evidence_cutoff, dict):
        errors.append("operational readiness evidence_cutoff must be an object")
        evidence_cutoff = {}
    main_commit = str(evidence_cutoff.get("main_commit", ""))
    if not COMMIT_SHA.fullmatch(main_commit):
        errors.append(
            "operational readiness evidence_cutoff.main_commit must be a full commit SHA"
        )
    verified_on = str(evidence_cutoff.get("verified_on", ""))
    if not ISO_DATE.fullmatch(verified_on):
        errors.append("operational readiness evidence_cutoff.verified_on must be an ISO date")
    merged_pull_requests = evidence_cutoff.get("merged_pull_requests", [])
    excluded_pull_requests = evidence_cutoff.get("excludes_open_pull_requests", [])
    for label, values in (
        ("merged_pull_requests", merged_pull_requests),
        ("excludes_open_pull_requests", excluded_pull_requests),
    ):
        if not isinstance(values, list) or any(
            not isinstance(value, int) or isinstance(value, bool) or value < 1
            for value in values
        ):
            errors.append(
                f"operational readiness evidence_cutoff.{label} "
                "must contain positive PR numbers"
            )
    valid_merged_pull_requests = (
        {
            value
            for value in merged_pull_requests
            if isinstance(value, int) and not isinstance(value, bool) and value > 0
        }
        if isinstance(merged_pull_requests, list)
        else set()
    )
    valid_excluded_pull_requests = (
        {
            value
            for value in excluded_pull_requests
            if isinstance(value, int) and not isinstance(value, bool) and value > 0
        }
        if isinstance(excluded_pull_requests, list)
        else set()
    )
    if isinstance(merged_pull_requests, list) and isinstance(
        excluded_pull_requests, list
    ):
        overlap = sorted(valid_merged_pull_requests & valid_excluded_pull_requests)
        if overlap:
            errors.append(
                "operational readiness evidence cutoff cannot mark PRs both merged and excluded: "
                + ", ".join(f"#{number}" for number in overlap)
            )

    for field in ("source_document", "runbook_document"):
        value = str(register.get(field, ""))
        if not value or not (repo_root / value).is_file():
            errors.append(f"operational readiness {field} does not exist: {value}")

    capability_ids = {
        str(item.get("id", "")) for item in capabilities.get("capabilities", [])
    }
    services = register.get("services", [])
    if not isinstance(services, list) or not services:
        return errors + ["operational readiness services must be a non-empty array"]

    seen_ids: set[str] = set()
    for service in services:
        service_id = str(service.get("service_id", ""))
        if not SERVICE_ID.fullmatch(service_id):
            errors.append(f"invalid operational service id: {service_id or '<empty>'}")
            continue
        if service_id in seen_ids:
            errors.append(f"duplicate operational service id: {service_id}")
        seen_ids.add(service_id)

        for field in ("name", "owner", "escalation_owner"):
            if not str(service.get(field, "")).strip():
                errors.append(f"{service_id}: {field} must not be empty")
        if service.get("implementation_state") not in IMPLEMENTATION_STATES:
            errors.append(f"{service_id}: invalid implementation_state")
        readiness_state = str(service.get("readiness_state", ""))
        if readiness_state not in READINESS_STATES:
            errors.append(f"{service_id}: invalid readiness_state {readiness_state!r}")

        service_capabilities = service.get("capabilities", [])
        if not nonempty_strings(service_capabilities):
            errors.append(f"{service_id}: capabilities must be a non-empty array")
        else:
            unknown = sorted(set(service_capabilities) - capability_ids)
            if unknown:
                errors.append(
                    f"{service_id}: unknown canonical capabilities: {', '.join(unknown)}"
                )

        validate_paths(
            service.get("artifact_paths", []),
            "artifact_paths",
            service_id,
            repo_root,
            errors,
        )
        runbooks = service.get("runbook_paths", [])
        validate_paths(runbooks, "runbook_paths", service_id, repo_root, errors)
        reviews = service.get("review_evidence_paths", [])
        validate_paths(
            reviews, "review_evidence_paths", service_id, repo_root, errors
        )
        exercises = service.get("exercise_evidence_paths", [])
        validate_paths(
            exercises, "exercise_evidence_paths", service_id, repo_root, errors
        )

        telemetry = service.get("telemetry", {})
        if not isinstance(telemetry, dict):
            errors.append(f"{service_id}: telemetry must be an object")
            telemetry = {}
        for field in ("liveness_probes", "business_checks", "limitations"):
            if not nonempty_strings(telemetry.get(field, [])):
                errors.append(f"{service_id}: telemetry.{field} must not be empty")
        dashboards = telemetry.get("dashboard_paths", [])
        alert_evidence = telemetry.get("tested_alert_evidence_paths", [])
        validate_paths(
            dashboards, "telemetry.dashboard_paths", service_id, repo_root, errors
        )
        validate_paths(
            alert_evidence,
            "telemetry.tested_alert_evidence_paths",
            service_id,
            repo_root,
            errors,
        )

        if readiness_state != "requirements-only" and not runbooks:
            errors.append(f"{service_id}: {readiness_state} requires a runbook")
        if readiness_state in {"reviewed", "exercised", "pilot-ready"} and not reviews:
            errors.append(f"{service_id}: {readiness_state} requires review evidence")
        if readiness_state in {"exercised", "pilot-ready"} and not exercises:
            errors.append(f"{service_id}: {readiness_state} requires exercise evidence")

        pilot_ready = service.get("pilot_ready") is True
        blockers = service.get("blockers", [])
        if pilot_ready:
            if readiness_state != "pilot-ready":
                errors.append(f"{service_id}: pilot_ready requires pilot-ready state")
            for label, values in (
                ("runbooks", runbooks),
                ("reviews", reviews),
                ("dashboards", dashboards),
                ("tested alerts", alert_evidence),
                ("exercises", exercises),
            ):
                if not values:
                    errors.append(f"{service_id}: pilot_ready requires {label}")
            if blockers:
                errors.append(f"{service_id}: pilot_ready cannot retain blockers")
        elif not nonempty_strings(blockers):
            errors.append(f"{service_id}: non-pilot service requires explicit blockers")

    source_path = repo_root / str(register.get("source_document", ""))
    if source_path.is_file():
        source_service_ids = set(
            SERVICE_REF.findall(source_path.read_text(encoding="utf-8"))
        )
        if source_service_ids != seen_ids:
            missing_from_source = sorted(seen_ids - source_service_ids)
            missing_from_register = sorted(source_service_ids - seen_ids)
            if missing_from_source:
                errors.append(
                    "operational readiness source omits registered services: "
                    + ", ".join(missing_from_source)
                )
            if missing_from_register:
                errors.append(
                    "operational readiness register omits source services: "
                    + ", ".join(missing_from_register)
                )

    deferred = register.get("deferred_services", [])
    if not isinstance(deferred, list) or not deferred:
        errors.append("deferred_services must record unimplemented operational scope")
    else:
        for index, item in enumerate(deferred, start=1):
            for field in ("name", "reason", "admission_trigger"):
                if len(str(item.get(field, "")).strip()) < 20:
                    errors.append(
                        f"deferred service {index}: {field} is missing or too vague"
                    )
            deferred_text = " ".join(
                str(item.get(field, ""))
                for field in ("name", "reason", "admission_trigger")
            )
            referenced_prs = {
                int(match.group(1)) for match in PULL_REQUEST_REF.finditer(deferred_text)
            }
            stale_refs = sorted(referenced_prs & valid_merged_pull_requests)
            if stale_refs:
                errors.append(
                    f"deferred service {index}: references already-merged PRs: "
                    + ", ".join(f"#{number}" for number in stale_refs)
                )
    return errors


def main() -> int:
    errors = validate_operational_readiness(
        load_json(REGISTER_PATH), load_json(CAPABILITIES_PATH), REPO_ROOT
    )
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} operational-readiness error(s).")
        return 1
    register = load_json(REGISTER_PATH)
    services = register["services"]
    draft_count = sum(
        service.get("readiness_state") == "procedure-draft" for service in services
    )
    pilot_count = sum(service.get("pilot_ready") is True for service in services)
    print(
        "Operational-readiness validation passed: "
        f"{len(services)} implemented service groups, {draft_count} procedure drafts, "
        f"{pilot_count} pilot-ready claims."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
