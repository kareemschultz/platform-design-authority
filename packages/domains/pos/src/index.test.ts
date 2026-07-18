import { describe, expect, test } from "bun:test";
import { APPROVAL_STATES, REGISTER_SESSION_STATES, SALE_STATES } from ".";

describe("POS contract scaffold", () => {
	test("register sessions have no reopen transition", () => {
		expect(REGISTER_SESSION_STATES).toEqual(["Open", "Closing", "Closed"]);
		expect(REGISTER_SESSION_STATES).not.toContain("Reopened");
	});

	test("a variance close occupies a distinct pending state from a completed close", () => {
		expect(REGISTER_SESSION_STATES).toContain("Closing");
		expect(REGISTER_SESSION_STATES.indexOf("Closing")).toBeLessThan(
			REGISTER_SESSION_STATES.indexOf("Closed")
		);
	});

	test("a held sale is distinct from a completed sale", () => {
		expect(SALE_STATES).toContain("Held");
		expect(SALE_STATES).toContain("Completed");
		expect(SALE_STATES.indexOf("Held")).toBeLessThan(
			SALE_STATES.indexOf("Completed")
		);
	});

	test("maker/checker approval never starts pre-approved", () => {
		expect(APPROVAL_STATES[0]).toBe("Pending");
		expect(APPROVAL_STATES).toContain("Approved");
	});
});
