import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	inventoryAdjustments,
	inventoryCommandReceipts,
	inventoryCountLines,
	inventoryCounts,
	inventoryReservations,
	inventoryStockBalances,
	inventoryStockMovements,
	inventoryTransferLines,
	inventoryTransfers,
} from "./schema";

const tables = [
	inventoryAdjustments,
	inventoryCommandReceipts,
	inventoryCountLines,
	inventoryCounts,
	inventoryReservations,
	inventoryStockBalances,
	inventoryStockMovements,
	inventoryTransferLines,
	inventoryTransfers,
];

describe("Inventory PostgreSQL ownership", () => {
	test("declares exactly the nine registered Inventory-owned PR3 tables", () => {
		expect(
			tables
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"inventory_adjustment",
			"inventory_command_receipt",
			"inventory_count",
			"inventory_count_line",
			"inventory_reservation",
			"inventory_stock_balance",
			"inventory_stock_movement",
			"inventory_transfer",
			"inventory_transfer_line",
		]);
	});

	test("requires tenant scope on every authoritative Inventory table", () => {
		for (const table of tables) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});

	test("uses exact numeric(38,6), version, timestamp, and JSON types", () => {
		const movement = getTableColumns(inventoryStockMovements);
		const balance = getTableColumns(inventoryStockBalances);
		const receipt = getTableColumns(inventoryCommandReceipts);
		expect(movement.quantity.getSQLType()).toBe("numeric(38, 6)");
		expect(balance.onHand.getSQLType()).toBe("numeric(38, 6)");
		expect(balance.version.dataType).toBe("number");
		expect(balance.asOf.dataType).toBe("date");
		expect(receipt.result.dataType).toBe("json");
	});
});
