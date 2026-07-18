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

    def test_rejects_non_fixture_postgres_local_credentials(self) -> None:
        credential_url = (
            "postgresql://"
            + "prod_admin:"
            + "ThisLooksLikeARealPassword123@localhost/db"
        )
        temporary, root = self.make_repository({"config.txt": credential_url})
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertTrue(any("credential-bearing-url" in error for error in errors))
        self.assertNotIn(credential_url, "\n".join(errors))

    def test_scans_staged_blob_when_worktree_content_differs(self) -> None:
        secret = "gh" + "p_" + ("z" * 36)
        temporary, root = self.make_repository({"staged.txt": "safe\n"})
        self.addCleanup(temporary.cleanup)
        path = root / "staged.txt"
        path.write_text(secret, encoding="utf-8")
        subprocess.run(
            ["git", "-C", str(root), "add", "--", "staged.txt"],
            check=True,
        )
        path.write_text("safe\n", encoding="utf-8")

        errors = validate_public_disclosure(root)

        self.assertTrue(any("github-token" in error for error in errors), errors)
        self.assertNotIn(secret, "\n".join(errors))

    def test_scans_staged_blob_and_rejects_missing_worktree_file(self) -> None:
        secret = "gh" + "p_" + ("z" * 36)
        temporary, root = self.make_repository({"staged.txt": "safe\n"})
        self.addCleanup(temporary.cleanup)
        path = root / "staged.txt"
        path.write_text(secret, encoding="utf-8")
        subprocess.run(
            ["git", "-C", str(root), "add", "--", "staged.txt"],
            check=True,
        )
        path.unlink()

        errors = validate_public_disclosure(root)

        self.assertTrue(any("github-token" in error for error in errors), errors)
        self.assertTrue(any("worktree file is missing" in error for error in errors))
        self.assertNotIn(secret, "\n".join(errors))

    def test_allows_anonymous_git_ssh_transport_urls(self) -> None:
        # `git@host` with no password is the standard anonymous git-over-ssh
        # transport identity (GitHub/GitLab/Bitbucket/SourceHut all use it);
        # it appears in the `repository` field of a large fraction of
        # published npm packages and is not a credential leak.
        cases = {
            "npm-repo-field.txt": "git+ssh://git@github.com/facebook/react-native.git",
            "bare-git-scheme.txt": "git://git@github.com/EventSource/eventsource.git",
            "ssh-git-scheme.txt": "ssh+git://git@bitbucket.org/example/repo.git",
        }
        temporary, root = self.make_repository(cases)
        self.addCleanup(temporary.cleanup)

        self.assertEqual(validate_public_disclosure(root), [])

    def test_rejects_git_transport_url_with_password(self) -> None:
        credential_url = "git+ssh://git:" + "leaked-token@github.com/org/repo.git"
        temporary, root = self.make_repository({"config.txt": credential_url})
        self.addCleanup(temporary.cleanup)

        errors = validate_public_disclosure(root)

        self.assertTrue(any("credential-bearing-url" in error for error in errors))

    def test_rejects_non_git_username_only_url(self) -> None:
        # A bare username on a non-git-transport scheme is still flagged —
        # the exemption is narrowly scoped to the `git` transport identity,
        # not to username-only URLs in general (some services put the
        # actual secret in the username position, e.g. HTTP Basic tokens).
        credential_url = "https://sk-live-example-" + "token@api.example.com/v1"
        temporary, root = self.make_repository({"config.txt": credential_url})
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

    def test_rejects_git_index_symlink_mode_cross_platform(self) -> None:
        temporary, root = self.make_repository({"README.md": "# Example\n"})
        self.addCleanup(temporary.cleanup)
        object_id = subprocess.run(
            ["git", "-C", str(root), "hash-object", "-w", "--stdin"],
            check=True,
            input=b"../outside-repository",
            stdout=subprocess.PIPE,
        ).stdout.decode("ascii").strip()
        subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "update-index",
                "--add",
                "--cacheinfo",
                f"120000,{object_id},links/escape",
            ],
            check=True,
        )

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            [
                "links/escape: public-disclosure tracked symbolic link is prohibited"
            ],
        )

    def test_rejects_unstaged_filesystem_symlink(self) -> None:
        temporary, root = self.make_repository(
            {"README.md": "# Example\n", "tracked.txt": "safe\n"}
        )
        self.addCleanup(temporary.cleanup)
        tracked = root / "tracked.txt"
        tracked.unlink()
        try:
            tracked.symlink_to("README.md")
        except OSError as error:
            self.skipTest(f"filesystem symlink unavailable: {error}")

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            [
                "tracked.txt: public-disclosure tracked symbolic link is prohibited"
            ],
        )

    def test_rejects_gitlink_index_mode(self) -> None:
        temporary, root = self.make_repository({"README.md": "# Example\n"})
        self.addCleanup(temporary.cleanup)
        subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "-c",
                "user.name=Disclosure Test",
                "-c",
                "user.email=disclosure-test@example.invalid",
                "commit",
                "--quiet",
                "-m",
                "fixture",
            ],
            check=True,
        )
        commit_id = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "HEAD"],
            check=True,
            stdout=subprocess.PIPE,
        ).stdout.decode("ascii").strip()
        subprocess.run(
            [
                "git",
                "-C",
                str(root),
                "update-index",
                "--add",
                "--cacheinfo",
                f"160000,{commit_id},nested-repository",
            ],
            check=True,
        )

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            [
                "nested-repository: public-disclosure unsupported git index mode 160000"
            ],
        )

    def test_rejects_unresolved_index_stages(self) -> None:
        temporary, root = self.make_repository(
            {"README.md": "# Example\n", "conflict.txt": "safe\n"}
        )
        self.addCleanup(temporary.cleanup)
        object_ids: list[str] = []
        for content in (b"base\n", b"ours\n", b"theirs\n"):
            object_ids.append(
                subprocess.run(
                    ["git", "-C", str(root), "hash-object", "-w", "--stdin"],
                    check=True,
                    input=content,
                    stdout=subprocess.PIPE,
                ).stdout.decode("ascii").strip()
            )
        subprocess.run(
            ["git", "-C", str(root), "update-index", "--force-remove", "conflict.txt"],
            check=True,
        )
        index_info = "".join(
            f"100644 {object_id} {stage}\tconflict.txt\n"
            for stage, object_id in enumerate(object_ids, start=1)
        )
        subprocess.run(
            ["git", "-C", str(root), "update-index", "--index-info"],
            check=True,
            input=index_info.encode("ascii"),
        )

        errors = validate_public_disclosure(root)

        self.assertEqual(
            errors,
            [
                f"conflict.txt: public-disclosure unresolved git index stage {stage}"
                for stage in (1, 2, 3)
            ],
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
