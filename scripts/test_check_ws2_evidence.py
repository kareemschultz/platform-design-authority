"""Regression tests for the WS2 evidence checker's runtime dependency closure."""

from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import sys
from pathlib import Path

# Fifth-audit F-I-001: allow both `python -m unittest scripts.test_x` and the
# documented plain-script invocation `python scripts/test_x.py`.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from scripts import check_ws2_evidence as checker


class Ws2AiRuntimeClosureTests(unittest.TestCase):
    def write_workspace_config(
        self, root: Path, patterns: list[str] | None = None
    ) -> None:
        (root / "package.json").write_text(
            json.dumps(
                {
                    "name": "test-workspace",
                    "private": True,
                    "workspaces": {
                        "packages": patterns or ["apps/*", "packages/*/*"]
                    },
                }
            ),
            encoding="utf-8",
        )

    def write_package(
        self,
        root: Path,
        relative_path: str,
        name: str,
        dependencies: dict[str, str] | None = None,
        dev_dependencies: dict[str, str] | None = None,
    ) -> Path:
        package_root = root / relative_path
        package_root.mkdir(parents=True)
        manifest = {
            "name": name,
            "dependencies": dependencies or {},
            "devDependencies": dev_dependencies or {},
        }
        (package_root / "package.json").write_text(
            json.dumps(manifest), encoding="utf-8"
        )
        return package_root

    def test_derives_transitive_runtime_workspace_closure(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root)
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/middle": "workspace:*"},
                {"@example/dev-only": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            self.write_package(
                root,
                "packages/platform/middle",
                "@example/middle",
                {"@example/leaf": "workspace:*"},
            )
            self.write_package(root, "packages/platform/leaf", "@example/leaf")
            self.write_package(root, "packages/platform/dev-only", "@example/dev-only")

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)

            self.assertEqual(
                {package.name for package in closure},
                {"server", "web", "worker", "@example/middle", "@example/leaf"},
            )

    def test_detects_ai_marker_in_transitive_workspace_package(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root)
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/transitive": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            transitive_root = self.write_package(
                root, "packages/platform/transitive", "@example/transitive"
            )
            (transitive_root / "src").mkdir()
            (transitive_root / "src" / "index.ts").write_text(
                'import { generateText } from "@ai-sdk/core";\n', encoding="utf-8"
            )

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)
            violations = checker.find_ai_runtime_violations(closure, root)

            self.assertEqual(
                violations,
                ["packages/platform/transitive/src/index.ts: @ai-sdk"],
            )

    def test_discovers_configured_workspace_patterns_and_rejects_hidden_ai(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root, ["apps/*", "services/*"])
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/hidden": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")
            hidden_root = self.write_package(
                root, "services/hidden", "@example/hidden"
            )
            (hidden_root / "src").mkdir()
            (hidden_root / "src" / "index.ts").write_text(
                'import { generateText } from "@ai-sdk/core";\n', encoding="utf-8"
            )

            packages = checker.discover_workspace_packages(root)
            closure = checker.derive_runtime_dependency_closure(packages)

            self.assertIn("@example/hidden", {package.name for package in closure})
            self.assertEqual(
                checker.find_ai_runtime_violations(closure, root),
                ["services/hidden/src/index.ts: @ai-sdk"],
            )

    def test_rejects_an_undiscovered_workspace_runtime_dependency(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            root = Path(temp_dir)
            self.write_workspace_config(root, ["apps/*"])
            self.write_package(
                root,
                "apps/server",
                "server",
                {"@example/missing": "workspace:*"},
            )
            self.write_package(root, "apps/web", "web")
            self.write_package(root, "apps/worker", "worker")

            packages = checker.discover_workspace_packages(root)
            with self.assertRaisesRegex(
                AssertionError, "undiscovered workspace runtime dependencies"
            ):
                checker.derive_runtime_dependency_closure(packages)

    def test_live_closure_includes_frontend_and_authority_transitives(self) -> None:
        packages = checker.discover_workspace_packages(checker.ROOT)
        closure = checker.derive_runtime_dependency_closure(packages)
        closure_names = {package.name for package in closure}

        self.assertTrue(
            {
                "@meridian/platform-clients-api-client",
                "@meridian/ui-web",
                "@meridian/platform-authorization",
                "@meridian/platform-entitlements",
            }
            <= closure_names
        )


if __name__ == "__main__":
    unittest.main()
