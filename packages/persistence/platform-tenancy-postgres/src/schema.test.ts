import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	activeContexts,
	commandReceipts,
	invitations,
	locations,
	memberships,
	organizations,
	tenants,
} from "./schema";

describe("Platform Tenancy PostgreSQL ownership", () => {
	test("declares only the registered authoritative tenancy tables", () => {
		expect(
			[
				activeContexts,
				commandReceipts,
				invitations,
				locations,
				memberships,
				organizations,
				tenants,
			]
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"platform_active_context",
			"platform_location",
			"platform_membership",
			"platform_membership_invitation",
			"platform_organization",
			"platform_tenancy_command_receipt",
			"platform_tenant",
		]);
	});

	test("requires a tenant column on every tenant-owned child table", () => {
		for (const table of [
			activeContexts,
			commandReceipts,
			invitations,
			locations,
			memberships,
			organizations,
		]) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});
});
