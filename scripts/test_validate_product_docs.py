"""Regression tests for the product-documentation validator."""

import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_product_docs import validate_product_docs


class ProductDocumentationValidatorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.root = Path(self.temporary.name)
        for directory in (
            "apps/docs/content/docs/api",
            "registry",
            "openapi",
            "evidence",
        ):
            (self.root / directory).mkdir(parents=True, exist_ok=True)

        (self.root / "apps/docs/package.json").write_text(
            json.dumps({"version": "0.0.4"}), encoding="utf-8"
        )
        (self.root / "registry/capabilities.json").write_text(
            json.dumps({"capabilities": [{"id": "platform.authentication"}]}),
            encoding="utf-8",
        )
        (self.root / "registry/permissions.json").write_text(
            json.dumps({"permissions": [{"id": "platform.user.read"}]}),
            encoding="utf-8",
        )
        (self.root / "openapi/first-slice-v1.yaml").write_text(
            "openapi: 3.1.0\npaths:\n  /v1/users:\n    get:\n      operationId: listUsers\n",
            encoding="utf-8",
        )
        (self.root / "evidence/api.txt").write_text("evidence", encoding="utf-8")
        (self.root / "apps/docs/content/docs/meta.json").write_text(
            json.dumps({"pages": ["api"]}), encoding="utf-8"
        )

        self.revision = "a" * 40
        self.page = {
            "documentation_id": "PDOC-0001",
            "path": "apps/docs/content/docs/api/index.mdx",
            "route": "/docs/api",
            "title": "API",
            "content_class": "api-reference",
            "audience": ["developer"],
            "owner": "Developer Platform",
            "publication_state": "internal-prototype",
            "applicable_version": "0.0.4-controlled-prototype",
            "evidence_revision": self.revision,
            "last_verified": "2026-07-16",
            "implementation_evidence": ["evidence/api.txt"],
            "related_capabilities": ["platform.authentication"],
            "permission_refs": ["platform.user.read"],
            "contract_refs": ["openapi/first-slice-v1.yaml"],
            "api_reference_mode": "boundary-overview",
        }
        self.write_manifest([self.page])
        self.write_page(self.page, "This API page is a boundary overview.")

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def write_manifest(self, pages: list[dict]) -> None:
        manifest = {
            "schema_version": "1.0.0",
            "product_version": "0.0.4-controlled-prototype",
            "evidence_revision": self.revision,
            "publication_scope": "internal-prototype",
            "pages": pages,
        }
        (self.root / "registry/product-documentation.json").write_text(
            json.dumps(manifest), encoding="utf-8"
        )

    def write_page(self, page: dict, body: str) -> None:
        lines = ["---"]
        for field in (
            "title",
            "owner",
            "documentation_id",
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
            "api_reference_mode",
            "generated_reference_source",
        ):
            if field not in page:
                continue
            value = page[field]
            rendered = "[" + ", ".join(value) + "]" if isinstance(value, list) else value
            lines.append(f"{field}: {rendered}")
        lines.extend(["---", "", body])
        (self.root / page["path"]).write_text("\n".join(lines), encoding="utf-8")

    def validate(self) -> list[str]:
        return validate_product_docs(
            self.root, check_git=False, validate_schema=False
        )

    def test_valid_boundary_overview_passes(self) -> None:
        self.assertEqual(self.validate(), [])

    def test_unregistered_mdx_page_fails(self) -> None:
        extra = self.root / "apps/docs/content/docs/extra.mdx"
        extra.write_text("---\ntitle: Extra\n---\n", encoding="utf-8")
        self.assertTrue(any("unregistered" in error for error in self.validate()))

    def test_duplicate_documentation_id_fails(self) -> None:
        duplicate = dict(self.page)
        duplicate["path"] = "apps/docs/content/docs/index.mdx"
        duplicate["route"] = "/docs"
        self.write_manifest([self.page, duplicate])
        self.write_page(duplicate, "Boundary overview")
        (self.root / "apps/docs/content/docs/meta.json").write_text(
            json.dumps({"pages": ["api", "index"]}), encoding="utf-8"
        )
        self.assertTrue(any("duplicate" in error for error in self.validate()))

    def test_front_matter_drift_fails(self) -> None:
        drifted = dict(self.page)
        drifted["owner"] = "Wrong Owner"
        self.write_page(drifted, "Boundary overview")
        self.assertTrue(any("does not match manifest" in error for error in self.validate()))

    def test_broken_internal_route_fails(self) -> None:
        self.write_page(self.page, "Boundary overview. [Missing](/docs/missing)")
        self.assertTrue(any("unknown internal" in error for error in self.validate()))

    def test_boundary_overview_cannot_claim_operation_parity(self) -> None:
        claimed = dict(self.page)
        claimed["openapi_operation_ids"] = ["listUsers"]
        self.write_manifest([claimed])
        self.write_page(claimed, "Boundary overview")
        self.assertTrue(any("must not claim" in error for error in self.validate()))

    def test_generated_reference_requires_exact_openapi_parity(self) -> None:
        generated = dict(self.page)
        generated["api_reference_mode"] = "generated-canonical"
        generated["generated_reference_source"] = "openapi/first-slice-v1.yaml"
        self.write_manifest([generated])
        self.write_page(
            generated,
            "{/* GENERATED:OPENAPI-REFERENCE:START */}\n"
            "Generated reference with no rows.\n"
            "{/* GENERATED:OPENAPI-REFERENCE:END */}",
        )
        self.assertTrue(any("parity differs" in error for error in self.validate()))

    def test_generated_reference_with_exact_content_parity_passes(self) -> None:
        generated = dict(self.page)
        generated["api_reference_mode"] = "generated-canonical"
        generated["generated_reference_source"] = "openapi/first-slice-v1.yaml"
        self.write_manifest([generated])
        self.write_page(
            generated,
            "{/* GENERATED:OPENAPI-REFERENCE:START */}\n"
            "| Method | Path | `operationId` | Authority | Success |\n"
            "|---|---|---|---|---:|\n"
            "| `GET` | `/v1/users` | `listUsers` | permission `platform.user.read` | `200` |\n"
            "{/* GENERATED:OPENAPI-REFERENCE:END */}",
        )
        self.assertEqual(self.validate(), [])


if __name__ == "__main__":
    unittest.main()
