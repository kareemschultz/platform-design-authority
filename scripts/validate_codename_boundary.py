#!/usr/bin/env python3
"""Enforce ADR-0026's internal-codename and public-brand boundary."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
CODENAME = re.compile(r"\bmeridian\b", re.IGNORECASE)
INTERNAL_SCOPE_REFERENCE = re.compile(r"@meridian/[a-z0-9._/-]+", re.IGNORECASE)
PUBLICATION_STATES = {"release-preview", "published"}


def load_json(root: Path, relative: str, errors: list[str]) -> Any | None:
    path = root / relative
    if not path.exists():
        errors.append(f"{relative}: required codename-boundary input is missing")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        errors.append(f"{relative}: cannot read codename-boundary input: {exc}")
        return None


def contains_codename(value: object) -> bool:
    return isinstance(value, str) and CODENAME.search(value) is not None


def validate_canonical_identifiers(root: Path) -> list[str]:
    errors: list[str] = []
    sources = (
        ("registry/domains.json", "namespaces", ("prefix", "additional_prefixes")),
        ("registry/capabilities.json", "capabilities", ("id",)),
        ("registry/events.json", "events", ("name",)),
        ("registry/permissions.json", "permissions", ("id",)),
    )
    for relative, collection, fields in sources:
        data = load_json(root, relative, errors)
        if not isinstance(data, dict):
            continue
        entries = data.get(collection, [])
        if not isinstance(entries, list):
            errors.append(f"{relative}: {collection} must be an array")
            continue
        for index, entry in enumerate(entries):
            if not isinstance(entry, dict):
                continue
            for field in fields:
                value = entry.get(field)
                values = value if isinstance(value, list) else [value]
                for candidate in values:
                    if contains_codename(candidate):
                        errors.append(
                            f"{relative}: {collection}[{index}].{field} embeds the internal codename"
                        )
    return errors


def validate_public_contracts(root: Path) -> list[str]:
    errors: list[str] = []
    paths = [root / "openapi", root / "schemas"]
    for base in paths:
        if not base.exists():
            errors.append(f"{base.relative_to(root).as_posix()}: public-contract directory is missing")
            continue
        for path in sorted(item for item in base.rglob("*") if item.is_file()):
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if CODENAME.search(text):
                errors.append(
                    f"{path.relative_to(root).as_posix()}: public contract embeds the internal codename"
                )
    return errors


def validate_internal_package_privacy(root: Path) -> list[str]:
    errors: list[str] = []
    candidates = [root / "package.json"]
    for base in (root / "apps", root / "packages"):
        if base.exists():
            candidates.extend(base.rglob("package.json"))
    for path in sorted(set(candidates)):
        if any(part in {"node_modules", ".next", ".turbo", "dist"} for part in path.parts):
            continue
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            errors.append(f"{path.relative_to(root).as_posix()}: cannot verify package privacy: {exc}")
            continue
        name = data.get("name") if isinstance(data, dict) else None
        if (name == "meridian" or (isinstance(name, str) and name.startswith("@meridian/"))) and data.get("private") is not True:
            errors.append(
                f"{path.relative_to(root).as_posix()}: internal codename package {name!r} must set private=true"
            )
    return errors


def scrub_internal_scope_references(text: str) -> str:
    return INTERNAL_SCOPE_REFERENCE.sub("", text)


def validate_visible_application_sources(root: Path) -> list[str]:
    errors: list[str] = []
    for relative in ("apps/web/src", "apps/docs/src", "apps/native/app"):
        base = root / relative
        if not base.exists():
            continue
        for path in sorted(item for item in base.rglob("*") if item.is_file()):
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            if CODENAME.search(scrub_internal_scope_references(text)):
                errors.append(
                    f"{path.relative_to(root).as_posix()}: tenant-visible application source embeds the internal codename"
                )

    app_config = load_json(root, "apps/native/app.json", errors)
    if isinstance(app_config, dict):
        expo = app_config.get("expo", {})
        visible_name = expo.get("name") if isinstance(expo, dict) else None
        if contains_codename(visible_name):
            errors.append(
                "apps/native/app.json: expo.name is user-visible and must not use the internal codename"
            )
    return errors


def validate_published_product_docs(root: Path) -> list[str]:
    errors: list[str] = []
    relative = "registry/product-documentation.json"
    manifest = load_json(root, relative, errors)
    if not isinstance(manifest, dict):
        return errors
    pages = manifest.get("pages", [])
    if not isinstance(pages, list):
        errors.append(f"{relative}: pages must be an array")
        return errors
    for index, page in enumerate(pages):
        if not isinstance(page, dict) or page.get("publication_state") not in PUBLICATION_STATES:
            continue
        content_path = page.get("path")
        if not isinstance(content_path, str):
            errors.append(f"{relative}: pages[{index}] has no path")
            continue
        path = root / content_path
        if not path.exists():
            errors.append(f"{relative}: published page path does not exist: {content_path}")
            continue
        if CODENAME.search(scrub_internal_scope_references(path.read_text(encoding="utf-8"))):
            errors.append(
                f"{content_path}: {page.get('publication_state')} product documentation embeds the internal codename"
            )
    return errors


def validate_founder_brand_gate(root: Path) -> list[str]:
    errors: list[str] = []
    required = (
        "docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md",
        "docs/blueprint/20-Strategy/FOUNDER_DECISION_EVIDENCE_AND_CLOSURE_PACKETS.md",
    )
    for relative in required:
        path = root / relative
        if not path.exists():
            errors.append(f"{relative}: required FDR-011 authority source is missing")
            continue
        if not re.search(r"^## FDR-011\b", path.read_text(encoding="utf-8"), re.MULTILINE):
            errors.append(f"{relative}: missing FDR-011 commercial product brand gate")
    return errors


def validate_codename_boundary(root: Path = ROOT) -> list[str]:
    return (
        validate_canonical_identifiers(root)
        + validate_public_contracts(root)
        + validate_internal_package_privacy(root)
        + validate_visible_application_sources(root)
        + validate_published_product_docs(root)
        + validate_founder_brand_gate(root)
    )


def main() -> int:
    errors = validate_codename_boundary()
    if errors:
        print("Codename and public-brand boundary validation failed:", file=sys.stderr)
        for error in sorted(set(errors)):
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Codename and public-brand boundary validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
