import { beforeEach, describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { knownStatusTokens, statusBadgeVariant } from "./status";

// Top-level (not inside the `describe`, per lint/performance/useTopLevelRegex)
// reproductions of the two EXACT pre-fix regexes this item replaces.
const PRE_FIX_POSITIVE_PATTERN =
	/active|posted|approved|completed|reconciled|received/u;
const PRE_FIX_ADMIN_POSITIVE_PATTERN = /active|success|trial/i;

// WS3 remediation R3b, Item 11 (status/error discipline).
//
// Pre-fix behavior (proven below, not assumed): `StateBadge` classified
// status text with `POSITIVE_STATE_PATTERN =
// /active|posted|approved|completed|reconciled|received/u` tested against
// `state.toLowerCase()`. "Inactive".toLowerCase() is "inactive", which
// CONTAINS the substring "active" — the regex has no word-boundary or
// exact-match anchor, so it matched, and a genuinely Inactive Role or
// Party rendered with the SAME "secondary" (success-styled) badge variant
// as an Active one. The first test below reproduces that exact regex
// against the exact pre-fix pattern to prove the bug was real, then
// proves the new exhaustive map gets it right.
describe("statusBadgeVariant (WS3 remediation R3b, Item 11)", () => {
	test("pre-fix reproduction: both old regexes misclassify Inactive as positive", () => {
		expect(PRE_FIX_POSITIVE_PATTERN.test("Inactive".toLowerCase())).toBe(true);
		expect(PRE_FIX_ADMIN_POSITIVE_PATTERN.test("Inactive")).toBe(true);
	});

	test("post-fix: Inactive is never the positive (secondary) variant", () => {
		const variant = statusBadgeVariant("Inactive", () => undefined);
		expect(variant).not.toBe("secondary");
		expect(variant).toBe("outline");
	});

	test("post-fix: Active is correctly positive", () => {
		expect(statusBadgeVariant("Active", () => undefined)).toBe("secondary");
	});

	test("post-fix: a genuinely negative state (Suspended) is destructive, not neutral", () => {
		expect(statusBadgeVariant("Suspended", () => undefined)).toBe(
			"destructive"
		);
	});

	test("an unrecognized token fails loudly (calls onUnknown) and renders the safe neutral variant, never a guessed color", () => {
		const reported: { state: string | null } = { state: null };
		const variant = statusBadgeVariant("TotallyMadeUpState", (state) => {
			reported.state = state;
		});
		expect(reported.state).toBe("TotallyMadeUpState");
		expect(variant).toBe("outline");
	});

	test("the default onUnknown handler logs via console.error (fails loudly, not silently)", () => {
		const original = console.error;
		let called = false;
		console.error = (..._args: unknown[]) => {
			called = true;
		};
		try {
			statusBadgeVariant("AnotherMadeUpState");
		} finally {
			console.error = original;
		}
		expect(called).toBe(true);
	});
});

// Exhaustiveness: every state/severity/reconciliation/authentication enum
// token that actually exists in the contract package's schemas must have
// an entry in the map — parsed directly from the schema source, not
// hand-copied, so this test regresses automatically if a future schema
// change adds a token the map doesn't know about yet.
//
// `[\s\S]*?` (not `.` with the `s`/dotAll flag) so these compile under this
// workspace's `target: "ES2017"` tsconfig, which predates the dotAll flag.
const STATE_FIELD_PATTERN =
	/\b(?:state|severity|reconciliationState|authenticationState)\s*:\s*z\.enum\(\[([\s\S]*?)\]\)/g;
const PRODUCT_STATE_PATTERN = /ProductStateSchema = z\.enum\(\[([\s\S]*?)\]\)/;
const QUOTED_TOKEN_PATTERN = /"([A-Za-z]+)"/g;

describe("STATUS_CATEGORY_BY_TOKEN exhaustiveness (WS3 remediation R3b, Item 11)", () => {
	let contractTokens: string[] = [];

	beforeEach(() => {
		const schemaPath = fileURLToPath(
			new URL(
				"../../../../packages/contracts/platform-api/src/schemas.ts",
				import.meta.url
			)
		);
		const source = readFileSync(schemaPath, "utf-8");
		const tokens = new Set<string>();
		for (const match of source.matchAll(STATE_FIELD_PATTERN)) {
			for (const token of match[1].matchAll(QUOTED_TOKEN_PATTERN)) {
				tokens.add(token[1]);
			}
		}
		const productStateMatch = source.match(PRODUCT_STATE_PATTERN);
		if (productStateMatch) {
			for (const token of productStateMatch[1].matchAll(QUOTED_TOKEN_PATTERN)) {
				tokens.add(token[1]);
			}
		}
		contractTokens = [...tokens];
	});

	test("finds a non-trivial number of contract state tokens (sanity check the parser itself works)", () => {
		expect(contractTokens.length).toBeGreaterThan(40);
	});

	test("every contract state token has a known classification", () => {
		const known = new Set(knownStatusTokens());
		const missing = contractTokens.filter((token) => !known.has(token));
		expect(missing).toEqual([]);
	});
});
