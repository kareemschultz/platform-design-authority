import { describe, expect, test } from "bun:test";

import {
	outstandingTransferLineId,
	receiptIntentAfterDraftReset,
} from "./inventory-transfers";

describe("transfer receipt selection", () => {
	test("retains an outstanding selection across a data refresh", () => {
		expect(
			outstandingTransferLineId(
				[
					{ id: "line-a", remainingQuantity: "2" },
					{ id: "line-b", remainingQuantity: "4" },
				],
				"line-b"
			)
		).toBe("line-b");
	});

	test("moves to the next outstanding line after a partial receipt refresh", () => {
		expect(
			outstandingTransferLineId(
				[
					{ id: "line-a", remainingQuantity: "0" },
					{ id: "line-b", remainingQuantity: "4" },
				],
				"line-a"
			)
		).toBe("line-b");
	});

	test("clears selection when no receipt line remains", () => {
		expect(
			outstandingTransferLineId(
				[
					{ id: "line-a", remainingQuantity: "0" },
					{ id: "line-b", remainingQuantity: "0" },
				],
				"line-a"
			)
		).toBe("");
	});

	test("retains ambiguous receipt intent until authoritative success", () => {
		const intent = { key: "receipt-key", signature: "receipt-signature" };

		expect(receiptIntentAfterDraftReset(intent, false)).toBe(intent);
		expect(receiptIntentAfterDraftReset(intent, true)).toBeNull();
	});
});
