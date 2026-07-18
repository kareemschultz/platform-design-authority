#!/usr/bin/env python3
"""Reject tracked files that are unsafe for public repository disclosure.

Diagnostics intentionally identify only the file, line, and rule. Matched
credential material is never included in output.
"""

from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REQUIRED_ROOT_FILES = ("CONTRIBUTING.md", "SECURITY.md")

DOTENV_FILE = re.compile(r"^\.env(?:\..+)?$", re.IGNORECASE)
PROHIBITED_EXTENSIONS = {
    ".bcfks": "keystore",
    ".cer": "certificate",
    ".cert": "certificate",
    ".crt": "certificate",
    ".der": "certificate",
    ".jceks": "keystore",
    ".jks": "keystore",
    ".key": "private-key",
    ".keystore": "keystore",
    ".p12": "keystore",
    ".p8": "private-key",
    ".pem": "private-key-or-certificate",
    ".pfx": "keystore",
    ".pkcs12": "keystore",
    ".pkcs8": "private-key",
    ".ppk": "private-key",
}
PRIVATE_KEY_FILENAMES = {"id_dsa", "id_ecdsa", "id_ed25519", "id_rsa"}

CONTENT_RULES = (
    (
        "private-key-material",
        re.compile(
            r"(?:-----BEGIN (?:ENCRYPTED |RSA |DSA |EC |OPENSSH |PGP )?"
            r"PRIVATE KEY(?: BLOCK)?-----|PuTTY-User-Key-File-[23]:)"
        ),
    ),
    ("aws-access-key", re.compile(r"\b(?:AKIA|ASIA)[0-9A-Z]{16}\b")),
    (
        "aws-secret",
        re.compile(
            r"(?i)\b(?:aws_secret_access_key|aws_session_token)\b\s*[:=]\s*"
            r"['\"]?[A-Za-z0-9/+=]{32,}"
        ),
    ),
    ("github-token", re.compile(r"\bgh[pousr]_[A-Za-z0-9]{36,255}\b")),
    (
        "github-fine-grained-token",
        re.compile(r"\bgithub_pat_[A-Za-z0-9_]{50,255}\b"),
    ),
    ("google-api-key", re.compile(r"\bAIza[0-9A-Za-z_-]{35}\b")),
    ("google-oauth-token", re.compile(r"\bya29\.[0-9A-Za-z_-]{20,}\b")),
    (
        "stripe-secret-key",
        re.compile(r"\b(?:sk|rk)_(?:live|test)_[0-9A-Za-z]{16,}\b"),
    ),
    (
        "slack-token",
        re.compile(r"\b(?:xox[baprs]-[0-9A-Za-z-]{10,}|xapp-[0-9A-Za-z-]{10,})\b"),
    ),
    (
        "slack-webhook",
        re.compile(
            r"https://hooks\.slack\.com/services/"
            r"[A-Za-z0-9]+/[A-Za-z0-9]+/[A-Za-z0-9_-]{10,}"
        ),
    ),
    (
        "sendgrid-api-key",
        re.compile(r"\bSG\.[0-9A-Za-z_-]{16,}\.[0-9A-Za-z_-]{20,}\b"),
    ),
    (
        "jwt",
        re.compile(
            r"\beyJ[0-9A-Za-z_-]{5,}\.eyJ[0-9A-Za-z_-]{5,}\."
            r"[0-9A-Za-z_-]{8,}\b"
        ),
    ),
)

URL = re.compile(r"\b[a-zA-Z][a-zA-Z0-9+.-]*://[^\s<>\"']+")
CREDENTIAL_QUERY_KEYS = {
    "access_token",
    "api_key",
    "apikey",
    "auth",
    "key",
    "password",
    "secret",
    "sig",
    "signature",
    "token",
    "x-amz-credential",
    "x-amz-security-token",
    "x-amz-signature",
    "x-goog-credential",
    "x-goog-signature",
}
LOCAL_HOSTS = {"127.0.0.1", "::1", "localhost"}
GENERIC_SECRET_ASSIGNMENT = re.compile(
    r"(?i)\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|"
    r"license[_-]?key|pass(?:word|wd)|private[_-]?key|secret)\b\s*[:=]\s*"
    r"(?:['\"]([A-Za-z0-9_./+=-]{16,})['\"]|"
    r"([A-Za-z0-9_./+=-]{16,})\s*(?:#.*)?$)"
)
NON_SECRET_VALUE_MARKERS = {
    "example",
    "fixture",
    "placeholder",
    "redacted",
    "replace",
    "test-only",
    "unit-test",
    "verification",
}


def _tracked_files(root: Path) -> tuple[list[str], list[str]]:
    """Return current-tree paths known to Git and any enumeration error."""
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "ls-files", "-z", "--cached"],
            check=False,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
        )
    except OSError:
        return [], ["public-disclosure: unable to execute git ls-files"]
    if result.returncode != 0:
        return [], ["public-disclosure: unable to enumerate git-tracked files"]
    paths = [os.fsdecode(item) for item in result.stdout.split(b"\0") if item]
    return sorted(paths), []


def _filename_class(relative: str) -> str | None:
    name = Path(relative).name
    lower_name = name.lower()
    if DOTENV_FILE.fullmatch(lower_name) and lower_name != ".env.example":
        return "dotenv"
    if lower_name in PRIVATE_KEY_FILENAMES:
        return "private-key"
    return PROHIBITED_EXTENSIONS.get(Path(lower_name).suffix)


def _is_allowed_local_url(candidate: str) -> bool:
    try:
        parsed = urlsplit(candidate.rstrip(".,);]}"))
        hostname = (parsed.hostname or "").lower()
    except ValueError:
        return False
    return parsed.scheme.lower() in {"postgres", "postgresql"} and hostname in {
        *LOCAL_HOSTS,
        "postgres",
    }


def _has_embedded_credentials(candidate: str) -> bool:
    try:
        parsed = urlsplit(candidate.rstrip(".,);]}"))
    except ValueError:
        return False
    if parsed.username is not None or parsed.password is not None:
        return True
    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    fragment_pairs = parse_qsl(parsed.fragment, keep_blank_values=True)
    return any(
        key.lower() in CREDENTIAL_QUERY_KEYS and bool(value)
        for key, value in (*query_pairs, *fragment_pairs)
    )


def _is_high_signal_generic_secret(line: str) -> bool:
    for match in GENERIC_SECRET_ASSIGNMENT.finditer(line):
        value = (match.group(1) or match.group(2)).strip()
        lower_value = value.lower()
        if value.startswith(("$", "<", "{")):
            continue
        if any(marker in lower_value for marker in NON_SECRET_VALUE_MARKERS):
            continue
        return True
    return False


def _decode_text(content: bytes) -> str | None:
    """Decode ordinary UTF-8/UTF-16 text while declining arbitrary binaries."""
    if b"\0" not in content:
        return content.decode("utf-8", errors="ignore")

    encodings = []
    if content.startswith((b"\xff\xfe", b"\xfe\xff")):
        encodings.append("utf-16")
    encodings.extend(("utf-16-le", "utf-16-be"))
    for encoding in encodings:
        try:
            decoded = content.decode(encoding)
        except (UnicodeDecodeError, UnicodeError):
            continue
        if "\0" in decoded:
            continue
        if not decoded:
            return decoded
        printable = sum(character.isprintable() or character.isspace() for character in decoded)
        if printable / len(decoded) >= 0.9:
            return decoded
    return None


def validate_public_disclosure(root: Path = ROOT) -> list[str]:
    """Return stable, redacted diagnostics for public-disclosure violations."""
    root = root.resolve()
    tracked, errors = _tracked_files(root)

    tracked_set = set(tracked)
    for required in REQUIRED_ROOT_FILES:
        if required not in tracked_set or not (root / required).is_file():
            errors.append(
                f"public-disclosure: missing tracked root file: {required}"
            )

    for relative in tracked:
        path = root / Path(relative)
        if not path.is_file():
            continue
        if path.is_symlink():
            errors.append(
                f"{relative}: public-disclosure tracked symbolic link is prohibited"
            )
            continue

        filename_class = _filename_class(relative)
        if filename_class:
            errors.append(
                f"{relative}: public-disclosure prohibited filename "
                f"({filename_class})"
            )

        try:
            content = path.read_bytes()
        except OSError:
            errors.append(f"{relative}: public-disclosure file could not be read")
            continue
        text = _decode_text(content)
        if text is None:
            continue
        for line_number, line in enumerate(text.splitlines(), start=1):
            for rule_name, pattern in CONTENT_RULES:
                if pattern.search(line):
                    errors.append(
                        f"{relative}:{line_number}: public-disclosure detected "
                        f"{rule_name} (matched value redacted)"
                    )
            if _is_high_signal_generic_secret(line):
                errors.append(
                    f"{relative}:{line_number}: public-disclosure detected "
                    "generic-secret-assignment (matched value redacted)"
                )
            if any(
                _has_embedded_credentials(candidate)
                and not _is_allowed_local_url(candidate)
                for candidate in URL.findall(line)
            ):
                errors.append(
                    f"{relative}:{line_number}: public-disclosure detected "
                    "credential-bearing-url (matched value redacted)"
                )

    return sorted(set(errors))


def main() -> int:
    errors = validate_public_disclosure()
    if errors:
        print("Public-disclosure validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1
    print("Public-disclosure validation passed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
