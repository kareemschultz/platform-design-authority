import { describe, expect, test } from "bun:test";

import {
	appendCursorTrail,
	freshnessState,
	isVersionConflict,
	mutationFailurePresentation,
	operationsHref,
	operationsScopeKey,
	parseCursorTrail,
	previousCursorState,
	safeDownloadName,
	safeOperationsReturn,
	stableIntentKey,
} from "./operations";

describe("operations client state", () => {
	test("preserves shareable filters while replacing cursor state", () => {
		const current = new URLSearchParams("query=rice&state=Active&cursor=old");
		expect(
			operationsHref("/operations/products", current, {
				cursor: "next/cursor",
				query: "brown rice",
			})
		).toBe(
			"/operations/products?query=brown+rice&state=Active&cursor=next%2Fcursor"
		);
		expect(
			operationsHref("/operations/products", current, {
				cursor: null,
				query: null,
			})
		).toBe("/operations/products?state=Active");
	});

	test("keys interactive state by every current authority dimension", () => {
		expect(
			operationsScopeKey({
				contextId: "context-a",
				locationId: "location-a",
				organizationId: "organization-a",
				tenantId: "tenant-a",
			})
		).toEqual([
			"operations-scope",
			"tenant-a",
			"organization-a",
			"location-a",
			"context-a",
		]);
		expect(
			operationsScopeKey({
				contextId: "context-b",
				locationId: null,
				organizationId: "organization-b",
				tenantId: "tenant-b",
			})
		).not.toEqual([
			"operations-scope",
			"tenant-a",
			"organization-a",
			"location-a",
			"context-a",
		]);
	});

	test("keeps projection freshness separate from current authority", () => {
		const now = Date.parse("2026-07-16T12:00:10.000Z");
		expect(freshnessState("2026-07-16T12:00:08.000Z", true, now)).toBe(
			"current"
		);
		expect(freshnessState("2026-07-16T12:00:00.000Z", true, now)).toBe("stale");
		expect(freshnessState("2026-07-16T12:00:09.000Z", false, now)).toBe(
			"unreconciled"
		);
	});

	test("recognizes version conflicts without treating denial as conflict", () => {
		expect(isVersionConflict({ code: "CONFLICT" })).toBe(true);
		expect(isVersionConflict({ data: { code: "conflict" } })).toBe(true);
		expect(isVersionConflict({ code: "FORBIDDEN" })).toBe(false);
	});

	test("keeps a bounded cursor trail in the URL for cold previous navigation", () => {
		const firstTrail = appendCursorTrail([], null);
		expect(parseCursorTrail(firstTrail)).toEqual([""]);
		const secondTrail = appendCursorTrail(
			parseCursorTrail(firstTrail),
			"cursor-a"
		);
		expect(previousCursorState(parseCursorTrail(secondTrail))).toEqual({
			cursor: "cursor-a",
			cursorTrail: '[""]',
		});
		expect(previousCursorState([""])).toEqual({
			cursor: null,
			cursorTrail: null,
		});
		expect(parseCursorTrail('{"not":"a trail"}')).toEqual([]);
	});

	test("retains one idempotency key until success or material intent change", () => {
		let generated = 0;
		const create = () => {
			generated += 1;
			return `intent-${generated}`;
		};
		const first = stableIntentKey(null, "body-a", create);
		expect(stableIntentKey(first, "body-a", create)).toBe(first);
		expect(generated).toBe(1);
		expect(stableIntentKey(first, "body-b", create)).toEqual({
			key: "intent-2",
			signature: "body-b",
		});
		expect(stableIntentKey(null, "body-b", create)).toEqual({
			key: "intent-3",
			signature: "body-b",
		});
	});

	test("classifies mutation authority and recovery states with a safe reference", () => {
		expect(
			mutationFailurePresentation({
				code: "FORBIDDEN",
				data: {
					code: "authorization",
					correlationId: "correlation_123456",
				},
			})
		).toMatchObject({
			correlationId: "correlation_123456",
			kind: "permission",
		});
		expect(
			mutationFailurePresentation({
				code: "FORBIDDEN",
				data: { code: "entitlement" },
			})?.kind
		).toBe("entitlement");
		expect(
			mutationFailurePresentation({ data: { nextAction: "step_up" } })?.kind
		).toBe("step-up");
		expect(
			mutationFailurePresentation({
				code: "CONFLICT",
				data: { code: "state_transition", status: 409 },
			})?.kind
		).toBe("domain");
		expect(mutationFailurePresentation(new TypeError("fetch"))?.kind).toBe(
			"network"
		);
	});

	test("normalizes download names before creating a browser download", () => {
		expect(safeDownloadName("../../Tenant A report.csv")).toBe(
			"..-..-Tenant-A-report.csv"
		);
	});

	test("keeps return navigation inside the operations workspace", () => {
		expect(
			safeOperationsReturn("/operations/products?query=rice&cursor=next")
		).toBe("/operations/products?query=rice&cursor=next");
		expect(
			safeOperationsReturn("https://evil.test", "/operations/products")
		).toBe("/operations/products");
		for (const unsafe of [
			"//evil.test/operations",
			"/operations\\evil.test",
			"/operations/products#hidden",
			"/operations/products?token=secret",
			"/operations%00/products",
		]) {
			expect(safeOperationsReturn(unsafe, "/operations/products")).toBe(
				"/operations/products"
			);
		}
	});
});
