import { describe, expect, test } from "bun:test";

import {
	freshnessState,
	isVersionConflict,
	operationsHref,
	operationsScopeKey,
	safeDownloadName,
	safeOperationsReturn,
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
