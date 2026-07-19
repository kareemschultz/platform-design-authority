import { describe, expect, test } from "bun:test";

import { requireLegalEntityScope } from "../composition/legal-entity-scope";

/**
 * WS3 remediation R2, Finding K (legal-entity export scope). Deliberately a
 * plain `bun:test` unit test with NO database dependency — it imports only
 * `../composition/legal-entity-scope` (a registered composition root,
 * itself the only place permitted to import `@meridian/platform-import-
 * export`'s `ExportError` per `ARCHITECTURE_DEPENDENCY_RULES.md`'s
 * `applications` family rule: an ordinary `apps/server/src` edge path may
 * depend on a composition root but not directly on a `platform` package).
 * This test therefore asserts the thrown error's shape structurally
 * (`code`/`name`/`message`) rather than importing `ExportError` itself for
 * an `instanceof` check — `scripts/check_architecture.py` rejects the
 * direct `apps/server/src` -> `@meridian/platform-import-export` edge even
 * from a test file. This runs under `bun run test` (`src/*.test.ts`)
 * everywhere, not only against a live database under `db:test`. See
 * `remediation-dispositions.md` "## K — Legal-entity export scope" for the
 * governing citation and full disposition.
 */
describe("legal-entity-scope: WS3 remediation R2, Finding K", () => {
	test("succeeds when the request's legalEntityId matches the active context's", () => {
		expect(() =>
			requireLegalEntityScope({
				contextLegalEntityId: "legal_entity_0001",
				requestLegalEntityId: "legal_entity_0001",
			})
		).not.toThrow();
	});

	test("preserves the existing behavior: denies a request legalEntityId that MISMATCHES a set active context", () => {
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: "legal_entity_0001",
				requestLegalEntityId: "legal_entity_0002_different",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({
			code: "validation",
			message: expect.stringContaining("does not match the active context"),
			name: "ExportError",
		});
	});

	test("THE FIX: rejects (fails closed) when the active context carries NO legalEntityId at all, instead of silently proceeding unscoped", () => {
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: undefined,
				requestLegalEntityId: "legal_entity_0001",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({
			code: "validation",
			message: expect.stringContaining("Legal-entity scope is required"),
			name: "ExportError",
		});
	});

	test("THE FIX: also rejects when the active context's legalEntityId is null (the tenancy record's literal absent-value representation)", () => {
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: null,
				requestLegalEntityId: "legal_entity_0001",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({ code: "validation", name: "ExportError" });
	});

	test("THE FIX: rejects when the active context's legalEntityId is the empty string (never treated as a real scope value)", () => {
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: "",
				requestLegalEntityId: "legal_entity_0001",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({ code: "validation", name: "ExportError" });
	});
});
