import { describe, expect, test } from "bun:test";

import {
	requireExportRecordScope,
	requireLegalEntityScope,
	resolveContextLegalEntityId,
} from "../composition/legal-entity-scope";

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

	test("DEFENSE IN DEPTH (advisor-raised): rejects when the REQUEST-side legalEntityId is the empty string, even with a well-formed active context — the directive's 'unset on either side' wording, not just the context side", () => {
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: "legal_entity_0001",
				requestLegalEntityId: "",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({
			code: "validation",
			message: expect.stringContaining("legalEntityId is required"),
			name: "ExportError",
		});
	});
});

/**
 * WS3 remediation R3, cycle 1 (remediation-of-remediation). The R2 fix
 * above is correct in isolation, but `finance-handoff.ts`'s
 * `requireExportContext` fed it `context.legalEntityId` DIRECTLY — and no
 * code path in this system can ever populate that field for a real
 * session (`packages/platform/tenancy/src/index.ts`'s `setActiveContext`,
 * the only writer of an active-context row, unconditionally throws when a
 * caller supplies `legalEntityId`: "Legal-entity and branch context are
 * not implemented in PR3"). So the R2 fix rejected 100% of real
 * `createAccountantHandoffExport` calls, not just unverified ones — a
 * total outage on the transport path
 * (`financeHandoffTransportApplication` -> `requireExportContext`), caught
 * by this stage's e2e lane (`apps/web/e2e/ws3-pos.spec.ts` "handoff
 * export"), not by R2's own coverage: the tests above exercise
 * `requireLegalEntityScope` as a pure function and never touch the wiring
 * that decides WHAT gets passed as `contextLegalEntityId`.
 *
 * `resolveContextLegalEntityId` is the fix: derive the scope from
 * `context.organizationId` (always populated, never caller-forgeable)
 * whenever `context.legalEntityId` is unset. These tests reproduce the
 * exact call `requireExportContext` now makes end to end, proving both
 * that the fix restores the feature for a legitimate same-organization
 * caller AND that it does not resurrect Finding K's original hole (an
 * arbitrary spoofed value still gets rejected).
 */
describe("legal-entity-scope: WS3 remediation R3 cycle 1 (transport-path outage fix)", () => {
	test("PRE-FIX REPRODUCTION: feeding context.legalEntityId directly (R2's wiring) throws for EVERY real session, matching legalEntityId or not — this is the outage", () => {
		const context = {
			legalEntityId: undefined,
			organizationId: "organization_ws2_browser_0001",
		};
		let caught: unknown;
		try {
			requireLegalEntityScope({
				// The R2 wiring, reproduced verbatim: reads context.legalEntityId
				// directly instead of resolving it.
				contextLegalEntityId: context.legalEntityId,
				requestLegalEntityId: context.organizationId,
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

	test("THE FIX: a context with no legalEntityId (every real session today) resolves to organizationId, and a request matching the caller's own organization now succeeds", () => {
		const context = {
			legalEntityId: undefined,
			organizationId: "organization_ws2_browser_0001",
		};
		expect(() =>
			requireLegalEntityScope({
				contextLegalEntityId: resolveContextLegalEntityId(context),
				requestLegalEntityId: "organization_ws2_browser_0001",
			})
		).not.toThrow();
	});

	test("THE FIX preserves Finding K's original protection: a legalEntityId that does not match the caller's own organization is still rejected (fails closed), not silently accepted as it was before R2", () => {
		const context = {
			legalEntityId: undefined,
			organizationId: "organization_ws2_browser_0001",
		};
		let caught: unknown;
		try {
			requireLegalEntityScope({
				contextLegalEntityId: resolveContextLegalEntityId(context),
				requestLegalEntityId: "legal_entity_spoofed_by_attacker",
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

	test("forward compatibility: a real (future) context.legalEntityId is preferred over organizationId, unchanged from R2 behavior", () => {
		const context = {
			legalEntityId: "legal_entity_real_0001",
			organizationId: "organization_ws2_browser_0001",
		};
		expect(resolveContextLegalEntityId(context)).toBe("legal_entity_real_0001");
	});

	test("resolveContextLegalEntityId falls back to organizationId for null legalEntityId too, matching requireLegalEntityScope's own null handling", () => {
		const context = {
			legalEntityId: null,
			organizationId: "organization_ws2_browser_0001",
		};
		expect(resolveContextLegalEntityId(context)).toBe(
			"organization_ws2_browser_0001"
		);
	});

	test("resolveContextLegalEntityId falls back to organizationId for an empty-string legalEntityId too", () => {
		const context = {
			legalEntityId: "",
			organizationId: "organization_ws2_browser_0001",
		};
		expect(resolveContextLegalEntityId(context)).toBe(
			"organization_ws2_browser_0001"
		);
	});
});

/**
 * WS3 remediation R4B, item 1 (export read isolation, lead-session finding,
 * NOT part of the original A-L directive). `requireExportRecordScope` is
 * the exact function `finance-handoff.ts`'s `getAccountantHandoffExport`
 * now calls after its tenant-scoped repository fetch, before returning the
 * record to the caller.
 *
 * PRE-FIX REPRODUCTION: before this stage, `getAccountantHandoffExport`
 * called NO function of this shape at all — it fetched the tenant-scoped
 * record and returned `exportView(record)` unconditionally. The first test
 * below proves the exact scenario the directive describes (same tenant,
 * different organization, a real known export id) would have gone
 * straight through with the pre-fix code: nothing in the pre-fix call
 * chain ever compared `record.organizationId` to the caller's context, so
 * there was no failure mode to reach — the read simply succeeded. This
 * test demonstrates that `requireExportRecordScope` is what makes that
 * scenario throw now; run it against the current (post-fix) code below to
 * see the denial, and note that deleting the `requireExportRecordScope`
 * call from `finance-handoff.ts` (the literal pre-fix state) makes this
 * exact request path return the cross-org record with no error at all.
 */
describe("legal-entity-scope: WS3 remediation R4B item 1 (export read isolation)", () => {
	test("THE FIX: denies a same-tenant, different-organization read of a real record with the SAME non-disclosing not_found shape a genuinely missing export uses", () => {
		const record = {
			legalEntityId: "organization_finance_handoff_org_a",
			organizationId: "organization_finance_handoff_org_a",
		};
		const context = {
			legalEntityId: undefined,
			organizationId: "organization_finance_handoff_org_b",
		};
		let caught: unknown;
		try {
			requireExportRecordScope({ context, record });
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({
			code: "not_found",
			message: "Export was not found",
			name: "ExportError",
		});
	});

	test("a legitimate same-organization read succeeds (no throw), record unchanged", () => {
		const record = {
			legalEntityId: "organization_finance_handoff_org_a",
			organizationId: "organization_finance_handoff_org_a",
		};
		const context = {
			legalEntityId: undefined,
			organizationId: "organization_finance_handoff_org_a",
		};
		expect(() => requireExportRecordScope({ context, record })).not.toThrow();
	});

	test("denies when organizationId matches but legalEntityId (a real, distinct future value) does not — defense in depth beyond today's organizationId-only reality", () => {
		const record = {
			legalEntityId: "legal_entity_real_0002",
			organizationId: "organization_finance_handoff_org_a",
		};
		const context = {
			legalEntityId: "legal_entity_real_0001",
			organizationId: "organization_finance_handoff_org_a",
		};
		let caught: unknown;
		try {
			requireExportRecordScope({ context, record });
		} catch (error) {
			caught = error;
		}
		expect(caught).toMatchObject({ code: "not_found", name: "ExportError" });
	});

	test("succeeds when both organizationId and a real context legalEntityId match the record", () => {
		const record = {
			legalEntityId: "legal_entity_real_0001",
			organizationId: "organization_finance_handoff_org_a",
		};
		const context = {
			legalEntityId: "legal_entity_real_0001",
			organizationId: "organization_finance_handoff_org_a",
		};
		expect(() => requireExportRecordScope({ context, record })).not.toThrow();
	});
});
