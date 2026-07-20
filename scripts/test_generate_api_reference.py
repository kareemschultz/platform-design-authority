"""Regression tests for canonical Draft API-reference generation."""

from __future__ import annotations

import tempfile
import unittest
from pathlib import Path

from scripts.generate_api_reference import (
    END,
    START,
    collect_operations,
    generate,
)


class ApiReferenceGenerationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        (self.root / "openapi").mkdir()
        (self.root / "apps/docs/content/docs/api").mkdir(parents=True)
        self.openapi = self.root / "openapi/first-slice-v1.yaml"
        self.openapi.write_text(
            "openapi: 3.1.0\n"
            "info:\n"
            "  version: 0.1.0\n"
            "paths:\n"
            "  /things:\n"
            "    get:\n"
            "      operationId: listThings\n"
            "      x-permission: catalog.product.read\n"
            "      responses:\n"
            "        '200':\n"
            "          description: OK\n",
            encoding="utf-8",
        )
        (self.root / "apps/docs/content/docs/api/index.mdx").write_text(
            f"# API\n\n{START}\nstale\n{END}\n", encoding="utf-8"
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def test_generation_includes_contract_fields(self) -> None:
        generated = generate(self.root)
        self.assertIn("| `GET` | `/things` | `listThings` |", generated)
        self.assertIn("permission `catalog.product.read`", generated)
        self.assertIn("Contract version: `0.1.0`", generated)

    def test_missing_operation_id_fails(self) -> None:
        self.openapi.write_text(
            self.openapi.read_text(encoding="utf-8").replace(
                "      operationId: listThings\n", ""
            ),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "missing operationId"):
            collect_operations(self.openapi)

    def test_missing_authority_fails(self) -> None:
        self.openapi.write_text(
            self.openapi.read_text(encoding="utf-8").replace(
                "      x-permission: catalog.product.read\n", ""
            ),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(ValueError, "exactly one"):
            collect_operations(self.openapi)

    def test_marker_pair_is_required(self) -> None:
        (self.root / "apps/docs/content/docs/api/index.mdx").write_text(
            "# API\n", encoding="utf-8"
        )
        with self.assertRaisesRegex(ValueError, "marker pair"):
            generate(self.root)


if __name__ == "__main__":
    unittest.main()
