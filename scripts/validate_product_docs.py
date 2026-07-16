#!/usr/bin/env python3
"""Validate the product-documentation manifest and MDX publication plane."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker

REPO_ROOT = Path(__file__).resolve().parent.parent
MANIFEST_PATH = Path("registry/product-documentation.json")
SCHEMA_PATH = Path(
    "schemas/documentation/product-documentation-manifest-v1.schema.json"
)
CONTENT_ROOT = Path("apps/docs/content/docs")
PAGE_FIELDS = (
    "documentation_id",
    "title",
    "owner",
    "content_class",
    "audience",
    "publication_state",
    "applicable_version",
    "evidence_revision",
    "last_verified",
    "implementation_evidence",
    "related_capabilities",
    "permission_refs",
    "contract_refs",
)
LINK = re.compile(r"\[[^\]]+\]\(([^)]+)\)")
OPENAPI_OPERATION = re.compile(r"^\s{6}operationId:\s*(\S+)\s*$", re.MULTILINE)


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_front_matter(path: Path) -> tuple[dict[str, Any], str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    if not lines or lines[0].strip() != "---":
        raise ValueError("missing opening front-matter delimiter")
    try:
        end = lines.index("---", 1)
    except ValueError as exc:
        raise ValueError("missing closing front-matter delimiter") from exc

    values: dict[str, Any] = {}
    for line in lines[1:end]:
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        if ":" not in line:
            raise ValueError(f"invalid front-matter line: {line!r}")
        key, raw_value = line.split(":", 1)
        value = raw_value.strip()
        if value.startswith("[") and value.endswith("]"):
            body = value[1:-1].strip()
            values[key.strip()] = (
                []
                if not body
                else [item.strip().strip('"').strip("'") for item in body.split(",")]
            )
        else:
            values[key.strip()] = value.strip('"').strip("'")
    return values, "\n".join(lines[end + 1 :])


def route_for(path: Path, content_root: Path) -> str:
    relative = path.relative_to(content_root)
    if relative == Path("index.mdx"):
        return "/docs"
    if relative.name == "index.mdx":
        return "/docs/" + "/".join(relative.parent.parts)
    return "/docs/" + "/".join(relative.with_suffix("").parts)


def git_revision_is_ancestor(root: Path, revision: str) -> bool:
    present = subprocess.run(
        ["git", "cat-file", "-e", f"{revision}^{{commit}}"],
        cwd=root,
        capture_output=True,
        check=False,
    )
    if present.returncode != 0:
        return False
    ancestor = subprocess.run(
        ["git", "merge-base", "--is-ancestor", revision, "HEAD"],
        cwd=root,
        capture_output=True,
        check=False,
    )
    return ancestor.returncode == 0


def validate_product_docs(
    root: Path = REPO_ROOT,
    *,
    check_git: bool = True,
    validate_schema: bool = True,
) -> list[str]:
    errors: list[str] = []
    manifest_file = root / MANIFEST_PATH
    if not manifest_file.exists():
        return [f"{MANIFEST_PATH.as_posix()}: missing product-documentation manifest"]

    try:
        manifest = load_json(manifest_file)
    except (json.JSONDecodeError, OSError) as exc:
        return [f"{MANIFEST_PATH.as_posix()}: {exc}"]

    if validate_schema:
        schema_file = root / SCHEMA_PATH
        if not schema_file.exists():
            errors.append(f"{SCHEMA_PATH.as_posix()}: missing manifest schema")
        else:
            schema = load_json(schema_file)
            validator = Draft202012Validator(schema, format_checker=FormatChecker())
            for error in sorted(validator.iter_errors(manifest), key=lambda item: list(item.path)):
                location = "/".join(str(part) for part in error.path) or "<root>"
                errors.append(f"{MANIFEST_PATH.as_posix()}:{location}: {error.message}")

    pages = manifest.get("pages", [])
    if not isinstance(pages, list):
        return errors + [f"{MANIFEST_PATH.as_posix()}: pages must be an array"]

    ids = [str(page.get("documentation_id", "")) for page in pages]
    routes = [str(page.get("route", "")) for page in pages]
    paths = [str(page.get("path", "")) for page in pages]
    for label, values in (("documentation ID", ids), ("route", routes), ("path", paths)):
        duplicates = sorted({value for value in values if value and values.count(value) > 1})
        if duplicates:
            errors.append(f"duplicate product-documentation {label}: {duplicates}")

    content_root = root / CONTENT_ROOT
    actual_files = {
        path.relative_to(root).as_posix() for path in content_root.rglob("*.mdx")
    }
    manifest_files = set(paths)
    for path in sorted(actual_files - manifest_files):
        errors.append(f"unregistered product-documentation page: {path}")
    for path in sorted(manifest_files - actual_files):
        errors.append(f"manifest references missing product-documentation page: {path}")

    capability_file = root / "registry" / "capabilities.json"
    permission_file = root / "registry" / "permissions.json"
    capability_ids = {
        str(item["id"]) for item in load_json(capability_file).get("capabilities", [])
    }
    permission_ids = {
        str(item["id"]) for item in load_json(permission_file).get("permissions", [])
    }
    openapi_text = (root / "openapi" / "first-slice-v1.yaml").read_text(
        encoding="utf-8"
    )
    openapi_operation_ids = set(OPENAPI_OPERATION.findall(openapi_text))

    manifest_revision = str(manifest.get("evidence_revision", ""))
    if check_git and not git_revision_is_ancestor(root, manifest_revision):
        errors.append(
            f"manifest evidence revision is missing or not an ancestor of HEAD: {manifest_revision}"
        )

    package_version = str(load_json(root / "apps" / "docs" / "package.json").get("version", ""))
    if not str(manifest.get("product_version", "")).startswith(package_version):
        errors.append(
            "manifest product_version must begin with apps/docs/package.json version "
            f"{package_version!r}"
        )

    known_routes = set(routes)
    for page in pages:
        relative_path = str(page.get("path", ""))
        page_path = root / relative_path
        if not page_path.exists():
            continue
        try:
            metadata, body = parse_front_matter(page_path)
        except ValueError as exc:
            errors.append(f"{relative_path}: {exc}")
            continue

        expected_route = route_for(page_path, content_root)
        if page.get("route") != expected_route:
            errors.append(
                f"{relative_path}: manifest route {page.get('route')!r} does not match {expected_route!r}"
            )

        for field in PAGE_FIELDS:
            if metadata.get(field) != page.get(field):
                errors.append(
                    f"{relative_path}: front matter {field} {metadata.get(field)!r} "
                    f"does not match manifest {page.get(field)!r}"
                )

        if page.get("evidence_revision") != manifest_revision:
            errors.append(
                f"{relative_path}: page evidence revision differs from manifest baseline"
            )

        for evidence_path in page.get("implementation_evidence", []):
            if not (root / str(evidence_path)).is_file():
                errors.append(f"{relative_path}: missing implementation evidence {evidence_path}")
        for contract_path in page.get("contract_refs", []):
            if not (root / str(contract_path)).is_file():
                errors.append(f"{relative_path}: missing contract reference {contract_path}")
        for capability_id in page.get("related_capabilities", []):
            if capability_id not in capability_ids:
                errors.append(f"{relative_path}: unknown capability {capability_id}")
        for permission_id in page.get("permission_refs", []):
            if permission_id not in permission_ids:
                errors.append(f"{relative_path}: unknown permission {permission_id}")

        for target in LINK.findall(body):
            clean_target = target.split("#", 1)[0].strip("<>")
            if clean_target.startswith("/docs") and clean_target not in known_routes:
                errors.append(f"{relative_path}: unknown internal documentation route {clean_target}")

        if page.get("content_class") == "api-reference":
            mode = page.get("api_reference_mode")
            declared_ids = set(page.get("openapi_operation_ids", []))
            if metadata.get("api_reference_mode") != mode:
                errors.append(f"{relative_path}: API reference mode differs from manifest")
            if metadata.get("openapi_operation_ids") != page.get("openapi_operation_ids"):
                errors.append(f"{relative_path}: OpenAPI operation list differs from manifest")
            if mode == "boundary-overview":
                if declared_ids:
                    errors.append(
                        f"{relative_path}: boundary overview must not claim generated operation parity"
                    )
                if "boundary overview" not in body.lower():
                    errors.append(
                        f"{relative_path}: boundary overview must label itself in page content"
                    )
            elif mode == "generated-canonical" and declared_ids != openapi_operation_ids:
                errors.append(
                    f"{relative_path}: generated canonical API parity differs from OpenAPI "
                    f"(missing {sorted(openapi_operation_ids - declared_ids)}, "
                    f"extra {sorted(declared_ids - openapi_operation_ids)})"
                )

    meta_file = content_root / "meta.json"
    if not meta_file.exists():
        errors.append(f"{meta_file.relative_to(root).as_posix()}: missing navigation metadata")
    else:
        expected_navigation = [
            "index" if route == "/docs" else route.removeprefix("/docs/")
            for route in routes
        ]
        actual_navigation = load_json(meta_file).get("pages", [])
        if actual_navigation != expected_navigation:
            errors.append(
                f"{meta_file.relative_to(root).as_posix()}: pages do not match manifest order; "
                f"expected {expected_navigation}, found {actual_navigation}"
            )

    return errors


def main() -> int:
    errors = validate_product_docs()
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"\n{len(errors)} product-documentation error(s).")
        return 1
    manifest = load_json(REPO_ROOT / MANIFEST_PATH)
    print(
        "Product-documentation validation passed: "
        f"{len(manifest['pages'])} MDX pages match the evidence manifest."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
