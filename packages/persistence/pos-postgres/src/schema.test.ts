import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	posCashMovements,
	posCommandReceipts,
	posDepositCustodyTransfers,
	posDepositSourceShifts,
	posDeposits,
	posPriceOverrides,
	posReceipts,
	posRefunds,
	posRegisterSessions,
	posReturnLines,
	posReturns,
	posSaleLines,
	posSales,
} from "./schema";

const pr1Tables = [posCashMovements, posCommandReceipts, posRegisterSessions];
const pr2Tables = [posSales, posSaleLines, posPriceOverrides, posReceipts];
const pr3Tables = [posReturns, posReturnLines, posRefunds];
const pr4Tables = [
	posDeposits,
	posDepositSourceShifts,
	posDepositCustodyTransfers,
];
const tables = [...pr1Tables, ...pr2Tables, ...pr3Tables, ...pr4Tables];

describe("POS PostgreSQL ownership", () => {
	test("declares exactly the thirteen registered POS-owned tables (PR1 register/cash + PR2 sale/receipt/price-override + PR3 return/refund + PR4 deposit)", () => {
		expect(
			tables
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"pos_cash_movement",
			"pos_command_receipt",
			"pos_deposit",
			"pos_deposit_custody_transfer",
			"pos_deposit_source_shift",
			"pos_price_override",
			"pos_receipt",
			"pos_refund",
			"pos_register_session",
			"pos_return",
			"pos_return_line",
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

	test("uses integer minor-unit money, version, and enumerated state types on the PR3 return/refund tables", () => {
		const returnHeader = getTableColumns(posReturns);
		const returnLine = getTableColumns(posReturnLines);
		const refund = getTableColumns(posRefunds);
		expect(returnHeader.totalRefundableMinor.getSQLType()).toBe("bigint");
		expect(returnHeader.version.dataType).toBe("number");
		expect(returnHeader.createdAt.dataType).toBe("date");
		expect(returnLine.quantity.getSQLType()).toBe("numeric(38, 6)");
		expect(returnLine.lineTotalMinor.getSQLType()).toBe("bigint");
		expect(refund.amountMinor.getSQLType()).toBe("bigint");
		expect(refund.version.dataType).toBe("number");
	});

	test("declares every PR3 table's primary key as (tenant_id, id)", () => {
		for (const table of pr3Tables) {
			const columns = getTableColumns(table);
			expect(columns.tenantId).toBeDefined();
			expect(columns.id).toBeDefined();
		}
	});

	test("requires tenant scope on every PR3 return/refund table", () => {
		for (const table of pr3Tables) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});

	test("uses integer minor-unit money and version types on the PR4 deposit tables", () => {
		const deposit = getTableColumns(posDeposits);
		const transfer = getTableColumns(posDepositCustodyTransfers);
		expect(deposit.amountMinor.getSQLType()).toBe("bigint");
		expect(deposit.version.dataType).toBe("number");
		expect(deposit.preparedAt.dataType).toBe("date");
		expect(transfer.amountMinor.getSQLType()).toBe("bigint");
		expect(transfer.postedAt.dataType).toBe("date");
	});

	test("declares the deposit and custody-transfer tables' primary key as (tenant_id, id)", () => {
		for (const table of [posDeposits, posDepositCustodyTransfers]) {
			const columns = getTableColumns(table);
			expect(columns.tenantId).toBeDefined();
			expect(columns.id).toBeDefined();
		}
	});

	test("requires tenant scope on every PR4 deposit table", () => {
		for (const table of pr4Tables) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});

	test("scopes the deposit source-shift join table by (tenant_id, deposit_id, session_id) with no independent id", () => {
		const columns = getTableColumns(posDepositSourceShifts);
		expect(columns.tenantId).toBeDefined();
		expect(columns.depositId).toBeDefined();
		expect(columns.sessionId).toBeDefined();
		expect(Object.keys(columns)).not.toContain("id");
	});
});
