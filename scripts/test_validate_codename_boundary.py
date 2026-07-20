from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from scripts.validate_codename_boundary import validate_codename_boundary


class CodenameBoundaryValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.write_json("registry/domains.json", {"namespaces": [{"prefix": "platform"}]})
        self.write_json("registry/capabilities.json", {"capabilities": [{"id": "platform.authentication"}]})
        self.write_json("registry/events.json", {"events": [{"name": "platform.session.revoked.v1"}]})
        self.write_json("registry/permissions.json", {"permissions": [{"id": "platform.user.read"}]})
        self.write_json("registry/product-documentation.json", {"pages": []})
        self.write("openapi/first-slice-v1.yaml", "openapi: 3.1.0\ninfo:\n  title: Platform API\n")
        self.write("schemas/example.schema.json", '{"title":"Platform record"}\n')
        self.write_json("package.json", {"name": "meridian", "private": True})
        self.write_json("packages/example/package.json", {"name": "@meridian/example", "private": True})
        self.write_json("apps/native/app.json", {"expo": {"name": "Platform Prototype", "slug": "meridian"}})
        self.write("apps/web/src/page.tsx", 'import { Button } from "@meridian/ui-web";\nexport const title = "Platform";\n')
        self.write("apps/docs/src/shared.ts", 'export const appName = "Platform Documentation";\n')
        self.write("apps/native/app/index.tsx", 'export const title = "Platform Prototype";\n')
        self.write(
            "docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md",
            "## FDR-011 — Commercial Product Brand and Publishing Identity\n",
        )
        self.write(
            "docs/blueprint/20-Strategy/FOUNDER_DECISION_EVIDENCE_AND_CLOSURE_PACKETS.md",
            "## FDR-011 — Commercial Product Brand and Publishing Identity\n",
        )

    def tearDown(self) -> None:
        self.temp.cleanup()

    def write(self, relative: str, content: str) -> None:
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def write_json(self, relative: str, content: object) -> None:
        self.write(relative, json.dumps(content))

    def messages(self) -> list[str]:
        return validate_codename_boundary(self.root)

    def test_valid_boundary_passes(self) -> None:
        self.assertEqual([], self.messages())

    def test_rejects_codename_in_canonical_identifier(self) -> None:
        self.write_json("registry/capabilities.json", {"capabilities": [{"id": "meridian.authentication"}]})
        self.assertTrue(any("canonical" in message or "internal codename" in message for message in self.messages()))

    def test_rejects_codename_in_public_contract(self) -> None:
        self.write("openapi/first-slice-v1.yaml", "openapi: 3.1.0\ninfo:\n  title: Meridian API\n")
        self.assertTrue(any("public contract" in message for message in self.messages()))

    def test_rejects_publishable_internal_package(self) -> None:
        self.write_json("packages/example/package.json", {"name": "@meridian/example"})
        self.assertTrue(any("private=true" in message for message in self.messages()))

    def test_rejects_codename_as_visible_expo_name(self) -> None:
        self.write_json("apps/native/app.json", {"expo": {"name": "Meridian", "slug": "meridian"}})
        self.assertTrue(any("expo.name" in message for message in self.messages()))

    def test_allows_internal_scope_import_but_rejects_visible_source_string(self) -> None:
        self.assertEqual([], self.messages())
        self.write("apps/web/src/page.tsx", 'export const title = "Meridian";\n')
        self.assertTrue(any("tenant-visible application source" in message for message in self.messages()))

    def test_rejects_codename_only_after_product_doc_publication(self) -> None:
        self.write("apps/docs/content/docs/page.mdx", "# Meridian guide\n")
        page = {"path": "apps/docs/content/docs/page.mdx", "publication_state": "internal-prototype"}
        self.write_json("registry/product-documentation.json", {"pages": [page]})
        self.assertEqual([], self.messages())
        page["publication_state"] = "published"
        self.write_json("registry/product-documentation.json", {"pages": [page]})
        self.assertTrue(any("published product documentation" in message for message in self.messages()))

    def test_requires_fdr_011_in_register_and_packet(self) -> None:
        self.write("docs/blueprint/20-Strategy/FOUNDER_DECISION_REGISTER.md", "# Register\n")
        self.assertTrue(any("missing FDR-011" in message for message in self.messages()))


if __name__ == "__main__":
    unittest.main()
