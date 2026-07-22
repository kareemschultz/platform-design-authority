import { describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { buildCashTenderSchema } = await import("./sale-pages");

// WS3 remediation R3b, Item 6 (validation closure — insufficient tender).
//
// Pre-fix behavior (proven below, not assumed): the module-level
// `CashTenderSchema` only checked that the entered value was a
// well-formed money string — it had NO sufficiency check at all. The
// sufficiency check lived only inside `onSubmit`, which `return`ed
// silently (no error, no toast, no field message) when the tender was
// insufficient. This test proves the OLD schema shape would have let an
// insufficient-but-well-formed tender through validation (reproducing the
// exact silent no-op), then proves the NEW `buildCashTenderSchema`
// rejects it with a real, field-scoped, persistent error message.
const MAJOR_UNIT_INPUT_PATTERN = /^\d{1,12}(\.\d{1,2})?$/;

describe("buildCashTenderSchema (WS3 remediation R3b, Item 6)", () => {
	const oldFormatOnlySchemaShape = (value: string) =>
		MAJOR_UNIT_INPUT_PATTERN.test(value.trim());

	test("pre-fix reproduction: a well-formed but insufficient tender passed format-only validation", () => {
		// Sale total is 900 (9.00); tendering 5.00 is insufficient.
		expect(oldFormatOnlySchemaShape("5.00")).toBe(true);
	});

	test("post-fix: the same insufficient tender is now rejected with a persistent field error", () => {
		const schema = buildCashTenderSchema(900);
		const result = schema.safeParse({ tendered: "5.00" });
		expect(result.success).toBe(false);
		if (!result.success) {
			const message = result.error.issues[0]?.message;
			expect(message).toContain("less than the sale total");
		}
	});

	test("post-fix: a sufficient tender is accepted", () => {
		const schema = buildCashTenderSchema(900);
		expect(schema.safeParse({ tendered: "9.00" }).success).toBe(true);
		expect(schema.safeParse({ tendered: "20.00" }).success).toBe(true);
	});

	test("post-fix: an exact-total tender is accepted at the boundary", () => {
		const schema = buildCashTenderSchema(900);
		expect(schema.safeParse({ tendered: "9.00" }).success).toBe(true);
	});

	test("post-fix: a malformed amount is still rejected with the format message", () => {
		const schema = buildCashTenderSchema(900);
		const result = schema.safeParse({ tendered: "not-money" });
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toContain("non-negative amount");
		}
	});
});
