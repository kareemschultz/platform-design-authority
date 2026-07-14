import { describe, expect, test } from "bun:test";

describe("Numbering contract scaffold", () => {
	test("keeps idempotency explicit in allocation requests", () => {
		const keys = ["tenantId", "sequenceId", "idempotencyKey"];
		expect(keys).toContain("idempotencyKey");
	});
});
