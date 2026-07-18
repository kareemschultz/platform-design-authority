from __future__ import annotations

import subprocess
import tempfile
import unittest
from pathlib import Path

from scripts.check_public_disclosure import validate_public_disclosure


class PublicDisclosureTest(unittest.TestCase):
    def make_repository(
        self, files: dict[str, str], *, include_required_files: bool = True
    ) -> tuple[tempfile.TemporaryDirectory[str], Path]:
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        subprocess.run(
            ["git", "init", "--quiet", str(root)],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        if include_required_files:
            files = {
                "CONTRIBUTING.md": "# Contributing\n",
                "SECURITY.md": "# Security\n",
                **files,
            }
        for relative, content in files.items():
            path = root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(content, encoding="utf-8")
        subprocess.run(
            ["git", "-C", str(root), "add", "--force", "--", "."],
            check=True,
            stdout=subprocess.DEVNULL,
        )
        return temporary, root

    def test_detects_prohibited_filename_classes(self) -> None:
        temporary, root = self.make_repository(
            {
                ".env.local": "SAFE_NAME=value\n",
                "certificates/client.pem": "example\n",
                "keys/id_ed25519": "example\n",
                "stores/release.jks": "example\n",
            }
        )
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertTrue(any(".env.local" in error and "dotenv" in error for error in errors))
        self.assertTrue(any("client.pem" in error for error in errors))
        self.assertTrue(any("id_ed25519" in error for error in errors))
        self.assertTrue(any("release.jks" in error for error in errors))

    def test_detects_each_high_signal_content_class(self) -> None:
        token_cases = {
            "private-key-material": "-----BEGIN " + "PRIVATE KEY-----",
            "aws-access-key": "AK" + "IA" + ("A" * 16),
            "aws-secret": "aws_secret_access_key=" + ("aB1/" * 10),
            "github-token": "gh" + "p_" + ("a" * 36),
            "github-fine-grained-token": "github_" + "pat_" + ("a" * 50),
            "google-api-key": "AI" + "za" + ("a" * 35),
            "google-oauth-token": "ya" + "29." + ("a" * 20),
            "stripe-secret-key": "sk_" + "live_" + ("a" * 24),
            "slack-token": "xox" + "b-1234567890-abcdefghijklmnop",
            "slack-webhook": (
                "https://hooks.slack.com/services/"
                + "A" * 10
                + "/"
                + "B" * 10
                + "/"
                + "c" * 24
            ),
            "sendgrid-api-key": "S" + "G." + ("a" * 16) + "." + ("b" * 24),
            "jwt": (
                "ey" + "JhbGciOiJIUzI1NiJ9."
                "ey" + "JzdWIiOiIxMjM0NTY3ODkwIn0."
                "abcdefghijklmnop"
            ),
        }
        temporary, root = self.make_repository(
            {
                f"fixtures/{rule}.txt": value + "\n"
                for rule, value in token_cases.items()
            }
        )
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        for rule in token_cases:
            with self.subTest(rule=rule):
                self.assertTrue(any(rule in error for error in errors), errors)

    def test_detects_credential_bearing_non_local_url(self) -> None:
        credential_url = (
            "https://service-user:" + "service-password@example.com/private"
        )
        temporary, root = self.make_repository({"config.txt": credential_url})
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertTrue(any("credential-bearing-url" in error for error in errors))
        self.assertNotIn(credential_url, "\n".join(errors))

    def test_detects_signed_query_fragment_and_generic_assignments(self) -> None:
        cases = {
            "signed.txt": "https://objects.example.com/a?X-Amz-Signature=" + "a" * 40,
            "fragment.txt": "https://identity.example.com/callback#access_token=" + "b" * 32,
            "generic.txt": "CLIENT_SECRET=" + "cD9_" * 8,
        }
        temporary, root = self.make_repository(cases)
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertEqual(
            sum("credential-bearing-url" in error for error in errors), 2, errors
        )
        self.assertTrue(any("generic-secret-assignment" in error for error in errors))

    def test_detects_utf16_secret_content(self) -> None:
        temporary, root = self.make_repository({"encoded.txt": "safe\n"})
        self.addCleanup(temporary.cleanup)
        secret = "gh" + "p_" + ("z" * 36)
        (root / "encoded.txt").write_bytes(secret.encode("utf-16"))

        errors = validate_public_disclosure(root)

        self.assertTrue(any("github-token" in error for error in errors), errors)

    def test_allows_examples_local_development_urls_and_untracked_files(self) -> None:
        temporary, root = self.make_repository(
            {
                ".env.example": "DATABASE_URL=postgresql://postgres:dev@localhost:5432/app\n",
                "examples.txt": "\n".join(
                    (
                        "postgresql://postgres:dev@127.0.0.1:5432/app",
                        "postgres://postgres:dev@postgres:5432/app",
                        "https://example.com/public/path",
                        "AKIAEXAMPLE",
                        "sk_live_REPLACE_ME",
                    )
                ),
            }
        )
        self.addCleanup(temporary.cleanup)
        untracked_secret = "gh" + "p_" + ("z" * 36)
        (root / "untracked.txt").write_text(untracked_secret, encoding="utf-8")

        self.assertEqual(validate_public_disclosure(root), [])

    def test_rejects_non_postgres_local_credentials(self) -> None:
        credential_url = "https://admin:" + "private-value@localhost/control"
        temporary, root = self.make_repository(
            {"config.txt": credential_url}
        )
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertTrue(any("credential-bearing-url" in error for error in errors))

    def test_requires_root_security_and_contributing_files(self) -> None:
        temporary, root = self.make_repository(
            {"README.md": "# Example\n"}, include_required_files=False
        )
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            [
                "public-disclosure: missing tracked root file: CONTRIBUTING.md",
                "public-disclosure: missing tracked root file: SECURITY.md",
            ],
        )

    def test_requires_policy_files_to_be_tracked(self) -> None:
        temporary, root = self.make_repository({"README.md": "# Example\n"})
        self.addCleanup(temporary.cleanup)
        subprocess.run(
            ["git", "-C", str(root), "rm", "--cached", "--quiet", "SECURITY.md"],
            check=True,
        )

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            ["public-disclosure: missing tracked root file: SECURITY.md"],
        )

    def test_errors_are_deterministic_and_never_disclose_values(self) -> None:
        secret = "AI" + "za" + ("q" * 35)
        temporary, root = self.make_repository(
            {"z.txt": secret, "a.txt": "AK" + "IA" + ("Z" * 16)}
        )
        self.addCleanup(temporary.cleanup)

        first = validate_public_disclosure(root)
        second = validate_public_disclosure(root)

        self.assertEqual(first, sorted(first))
        self.assertEqual(first, second)
        self.assertNotIn(secret, "\n".join(first))


if __name__ == "__main__":
    unittest.main()
