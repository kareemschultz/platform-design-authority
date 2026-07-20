import { describe, expect, test } from "bun:test";

import { isValidExportDateRange, parseDateInputToIsoInstant } from "./pos";

// WS3 remediation R3b, Item 6 (validation closure — export dates).
//
// Pre-fix behavior (proven below, not assumed): `ExportCreatePage` called
// `new Date(value.periodStart).toISOString()` directly on unvalidated form
// input. `Invalid Date#toISOString()` THROWS a `RangeError`, not a
// validation error — this test reproduces that exact throw for the same
// input the old code path would have received, then proves the new safe
// parser never throws and instead returns null so a schema-level
// validation error can be shown instead.
describe("parseDateInputToIsoInstant (WS3 remediation R3b, Item 6)", () => {
	test("pre-fix reproduction: the naive `new Date(...).toISOString()` call throws on an unparsable date", () => {
		// Message text is JS-engine-specific ("Invalid time value" on V8,
		// "Invalid Date" on JavaScriptCore/bun); what matters — and what the
		// pre-fix `onSubmit` handler did not guard against — is that it
		// throws at all instead of producing a validation error.
		expect(() => new Date("not-a-date").toISOString()).toThrow();
		expect(() => new Date("").toISOString()).toThrow();
	});

	test("post-fix: the safe parser never throws and returns null for the same unparsable inputs", () => {
		expect(parseDateInputToIsoInstant("not-a-date")).toBeNull();
		expect(parseDateInputToIsoInstant("")).toBeNull();
		expect(parseDateInputToIsoInstant("   ")).toBeNull();
	});

	test("post-fix: a well-formed date parses to an ISO instant", () => {
		expect(parseDateInputToIsoInstant("2026-07-01")).toBe(
			new Date("2026-07-01").toISOString()
		);
	});
});

describe("isValidExportDateRange (WS3 remediation R3b, Item 6)", () => {
	test("rejects an inverted range (end before start) even though both dates individually parse", () => {
		expect(isValidExportDateRange("2026-07-18", "2026-07-01")).toBe(false);
	});

	test("accepts a well-formed, non-inverted range", () => {
		expect(isValidExportDateRange("2026-07-01", "2026-07-18")).toBe(true);
	});

	test("accepts an equal start and end (a single-day period)", () => {
		expect(isValidExportDateRange("2026-07-01", "2026-07-01")).toBe(true);
	});

	test("rejects when either side fails to parse", () => {
		expect(isValidExportDateRange("not-a-date", "2026-07-18")).toBe(false);
		expect(isValidExportDateRange("2026-07-01", "not-a-date")).toBe(false);
	});
});
