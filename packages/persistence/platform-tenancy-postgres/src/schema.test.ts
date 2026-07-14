import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	activeContexts,
	commandReceipts,
	delegations,
	invitations,
	locations,
	memberships,
	organizations,
	roleAssignments,
	roles,
	tenants,
} from "./schema";

describe("Platform Tenancy PostgreSQL ownership", () => {
	test("declares only the registered authoritative tenancy tables", () => {
		expect(
			[
				activeContexts,
				commandReceipts,
				delegations,
				invitations,
				locations,
				memberships,
				organizations,
				roleAssignments,
				roles,
				tenants,
			]
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"platform_active_context",
			"platform_delegation",
			"platform_location",
			"platform_membership",
			"platform_membership_invitation",
			"platform_organization",
			"platform_role",
			"platform_role_assignment",
			"platform_tenancy_command_receipt",
			"platform_tenant",
		]);
	});

	test("requires a tenant column on every tenant-owned child table", () => {
		for (const table of [
			activeContexts,
			commandReceipts,
			delegations,
			invitations,
			locations,
			memberships,
			organizations,
			roleAssignments,
			roles,
		]) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});
});
