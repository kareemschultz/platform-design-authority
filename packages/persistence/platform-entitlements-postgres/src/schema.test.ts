import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	entitlementChanges,
	entitlementCommandReceipts,
	entitlements,
} from "./schema";

describe("Platform Entitlements PostgreSQL ownership", () => {
	test("declares only the registered entitlement tables", () => {
		expect(
			[entitlements, entitlementChanges, entitlementCommandReceipts]
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"platform_entitlement",
			"platform_entitlement_change",
			"platform_entitlement_command_receipt",
		]);
	});

	test("tenant-scopes every authoritative table", () => {
		for (const table of [
			entitlements,
			entitlementChanges,
			entitlementCommandReceipts,
		]) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});
});
