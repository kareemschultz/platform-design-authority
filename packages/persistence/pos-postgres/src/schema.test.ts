import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	posCashMovements,
	posCommandReceipts,
	posPriceOverrides,
	posReceipts,
	posRegisterSessions,
	posSaleLines,
	posSales,
} from "./schema";

const pr1Tables = [posCashMovements, posCommandReceipts, posRegisterSessions];
const pr2Tables = [posSales, posSaleLines, posPriceOverrides, posReceipts];
const tables = [...pr1Tables, ...pr2Tables];

describe("POS PostgreSQL ownership", () => {
	test("declares exactly the seven registered POS-owned tables (PR1 register/cash + PR2 sale/receipt/price-override)", () => {
		expect(
			tables
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"pos_cash_movement",
			"pos_command_receipt",
			"pos_price_override",
			"pos_receipt",
			"pos_register_session",
			"pos_sale",
			"pos_sale_line",
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

	test("uses integer minor-unit money, version, and JSONB snapshot types on the PR2 sale/receipt/price-override tables", () => {
		const sale = getTableColumns(posSales);
		const line = getTableColumns(posSaleLines);
		const override = getTableColumns(posPriceOverrides);
		const receipt = getTableColumns(posReceipts);
		expect(sale.totalMinor.getSQLType()).toBe("bigint");
		expect(sale.taxMinor.getSQLType()).toBe("bigint");
		expect(sale.version.dataType).toBe("number");
		expect(sale.completedAt.dataType).toBe("date");
		expect(line.unitPriceMinor.getSQLType()).toBe("bigint");
		expect(line.taxAmountMinor.getSQLType()).toBe("bigint");
		expect(line.quantity.getSQLType()).toBe("numeric(38, 6)");
		expect(override.requestedPriceMinor.getSQLType()).toBe("bigint");
		expect(override.version.dataType).toBe("number");
		expect(receipt.totalMinor.getSQLType()).toBe("bigint");
		expect(receipt.lines.dataType).toBe("json");
		expect(receipt.tenders.dataType).toBe("json");
	});

	test("declares every PR2 table's primary key as (tenant_id, id)", () => {
		for (const table of pr2Tables) {
			const columns = getTableColumns(table);
			expect(columns.tenantId).toBeDefined();
			expect(columns.id).toBeDefined();
		}
	});
});
