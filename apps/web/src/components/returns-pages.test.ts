import { describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { returnQuantityError } = await import("./returns-pages");

// WS3 remediation R3b, Item 6 (validation closure — return quantity).
//
// Pre-fix behavior (proven below, not assumed): `returnQuantityError` did
// not exist at all. `ReturnNewPage`'s only quantity guard was the HTML
// `max` attribute on a plain text-mode `<Input>` inside a `noValidate`
// form — neither of which browsers enforce (native constraint validation
// is explicitly disabled by `noValidate`, and `max` has no defined
// behavior on a non-numeric input type). A cashier typing "999" into a
// line sold in quantity "5" produced NO client-side error at all; the
// only thing that could stop it was a round trip to the server. This test
// suite proves the new bound function actually rejects an over-quantity
// entry and would have caught exactly that pre-fix gap.
describe("returnQuantityError (WS3 remediation R3b, Item 6)", () => {
	test("rejects a quantity that exceeds the outstanding bound", () => {
		// Sold 5, none returned yet in this browser => outstanding bound is 5.
		expect(returnQuantityError("9", 5)).not.toBeNull();
		expect(returnQuantityError("9", 5)).toContain("cannot exceed");
	});

	test("accepts a quantity within the outstanding bound", () => {
		expect(returnQuantityError("5", 5)).toBeNull();
		expect(returnQuantityError("0", 5)).toBeNull();
		expect(returnQuantityError("2.5", 5)).toBeNull();
	});

	test("rejects a negative or unparsable quantity", () => {
		expect(returnQuantityError("-1", 5)).not.toBeNull();
		expect(returnQuantityError("not-a-number", 5)).not.toBeNull();
	});

	test("boundary: exactly the outstanding quantity is valid, one over is not", () => {
		expect(returnQuantityError("5", 5)).toBeNull();
		expect(returnQuantityError("5.01", 5)).not.toBeNull();
	});
});
