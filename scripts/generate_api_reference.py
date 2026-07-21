#!/usr/bin/env python3
"""Generate the canonical Draft OpenAPI operation table embedded in product MDX."""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OPENAPI_PATH = Path("openapi/first-slice-v1.yaml")
OUTPUT_PATH = Path("apps/docs/content/docs/api/index.mdx")
START = "{/* GENERATED:OPENAPI-REFERENCE:START */}"
END = "{/* GENERATED:OPENAPI-REFERENCE:END */}"
PATH_LINE = re.compile(r"^  (/[^:]+):\s*$")
METHOD_LINE = re.compile(r"^    (get|post|put|patch|delete|head|options|trace):\s*$")
OPERATION_LINE = re.compile(r"^      operationId:\s*(\S+)\s*$")
PERMISSION_LINE = re.compile(r"^      x-permission:\s*(\S+)\s*$")
AUTHORIZATION_LINE = re.compile(r"^      x-authorization:\s*(\S+)\s*$")
RESPONSES_LINE = re.compile(r"^      responses:\s*$")
STATUS_LINE = re.compile(r"^        ['\"]?([1-5][0-9][0-9])['\"]?:\s*$")
VERSION_LINE = re.compile(r"^  version:\s*(\S+)\s*$")


@dataclass
class Operation:
    method: str
    path: str
    operation_id: str = ""
    permission: str = ""
    authorization: str = ""
    success_status: str = ""


def collect_operations(path: Path) -> tuple[str, list[Operation]]:
    version = ""
    current_path = ""
    current: Operation | None = None
    in_responses = False
    operations: list[Operation] = []
    seen_ids: set[str] = set()
    seen_routes: set[tuple[str, str]] = set()
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        version_match = VERSION_LINE.match(line)
        if version_match and not version:
            version = version_match.group(1)
        path_match = PATH_LINE.match(line)
        if path_match:
            current_path = path_match.group(1)
            current = None
            in_responses = False
            continue
        method_match = METHOD_LINE.match(line)
        if method_match and current_path:
            route_key = (method_match.group(1).upper(), current_path)
            if route_key in seen_routes:
                raise ValueError(f"duplicate operation route at line {line_number}: {route_key}")
            seen_routes.add(route_key)
            current = Operation(method=route_key[0], path=current_path)
            operations.append(current)
            in_responses = False
            continue
        if current is None:
            continue
        if RESPONSES_LINE.match(line):
            in_responses = True
            continue
        if line.startswith("      ") and not line.startswith("        "):
            in_responses = False
        for attribute, pattern in (
            ("operation_id", OPERATION_LINE),
            ("permission", PERMISSION_LINE),
            ("authorization", AUTHORIZATION_LINE),
        ):
            match = pattern.match(line)
            if match:
                setattr(current, attribute, match.group(1))
                break
        if in_responses and not current.success_status:
            status_match = STATUS_LINE.match(line)
            if status_match and status_match.group(1).startswith("2"):
                current.success_status = status_match.group(1)

    if not version:
        raise ValueError("OpenAPI info.version is missing")
    for operation in operations:
        if not operation.operation_id:
            raise ValueError(f"missing operationId: {operation.method} {operation.path}")
        if operation.operation_id in seen_ids:
            raise ValueError(f"duplicate operationId: {operation.operation_id}")
        seen_ids.add(operation.operation_id)
        if bool(operation.permission) == bool(operation.authorization):
            raise ValueError(
                f"operation must declare exactly one permission or authorization: "
                f"{operation.method} {operation.path}"
            )
        if not operation.success_status:
            raise ValueError(f"missing success response: {operation.method} {operation.path}")
    return version, sorted(operations, key=lambda item: (item.path, item.method))


def render_block(version: str, operations: list[Operation]) -> str:
    lines = [
        START,
        "## Generated Draft contract operations",
        "",
        "This table is generated from the canonical Draft OpenAPI source. Inclusion proves contract registration, not runtime binding, release support, pilot readiness, provider capability, or production availability.",
        "",
        f"- Source: `openapi/first-slice-v1.yaml`",
        f"- Contract version: `{version}`",
        f"- Operations: `{len(operations)}`",
        "- Authority join: `x-permission` or explicit `x-authorization` on every operation",
        "",
        "| Method | Path | `operationId` | Authority | Success |",
        "|---|---|---|---|---:|",
    ]
    for operation in operations:
        authority = (
            f"permission `{operation.permission}`"
            if operation.permission
            else f"authorization `{operation.authorization}`"
        )
        lines.append(
            f"| `{operation.method}` | `{operation.path}` | `{operation.operation_id}` | "
            f"{authority} | `{operation.success_status}` |"
        )
    lines.extend(["", END])
    return "\n".join(lines)


def replace_generated_block(content: str, block: str) -> str:
    if content.count(START) != 1 or content.count(END) != 1:
        raise ValueError("API reference must contain exactly one generated block marker pair")
    start = content.index(START)
    end = content.index(END, start) + len(END)
    return content[:start] + block + content[end:]


def generate(root: Path = ROOT) -> str:
    version, operations = collect_operations(root / OPENAPI_PATH)
    output = root / OUTPUT_PATH
    return replace_generated_block(output.read_text(encoding="utf-8"), render_block(version, operations))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = ROOT / OUTPUT_PATH
    try:
        generated = generate()
    except (OSError, ValueError) as exc:
        print(f"API-reference generation failed: {exc}", file=sys.stderr)
        return 1
    current = output.read_text(encoding="utf-8")
    if args.check:
        if current != generated:
            print(f"stale generated API reference: {OUTPUT_PATH.as_posix()}", file=sys.stderr)
            return 1
        print("Generated API reference is current.")
        return 0
    output.write_text(generated, encoding="utf-8", newline="\n")
    print(f"wrote {OUTPUT_PATH.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
