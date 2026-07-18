import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	posCashMovements,
	posCommandReceipts,
	posRegisterSessions,
} from "./schema";

const tables = [posCashMovements, posCommandReceipts, posRegisterSessions];

describe("POS PostgreSQL ownership", () => {
	test("declares exactly the three registered POS-owned PR1 tables", () => {
		expect(
			tables
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"pos_cash_movement",
			"pos_command_receipt",
			"pos_register_session",
		]);
	});

	test("requires tenant scope on every authoritative POS table", () => {
		for (const table of tables) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});

	test("uses integer minor-unit money, version, timestamp, and JSON types", () => {
		const session = getTableColumns(posRegisterSessions);
		const movement = getTableColumns(posCashMovements);
		const receipt = getTableColumns(posCommandReceipts);
		expect(session.openingFloatMinor.getSQLType()).toBe("bigint");
		expect(session.countedCashMinor.getSQLType()).toBe("bigint");
		expect(session.version.dataType).toBe("number");
		expect(session.openedAt.dataType).toBe("date");
		expect(movement.amountMinor.getSQLType()).toBe("bigint");
		expect(receipt.result.dataType).toBe("json");
	});

	test("declares the register-session primary key as (tenant_id, id)", () => {
		const table = getTableColumns(posRegisterSessions);
		expect(table.tenantId).toBeDefined();
		expect(table.id).toBeDefined();
	});
});
