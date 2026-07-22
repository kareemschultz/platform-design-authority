import { describe, expect, test } from "bun:test";

process.env.SKIP_ENV_VALIDATION = "true";
process.env.NEXT_PUBLIC_SERVER_URL = "http://localhost:3000";
const { ExportValuesSchema } = await import("./export-pages");

const VALID_BASE = {
	currency: "GYD",
	legalEntityId: "legal_entity_000000000001",
	timezone: "America/Guyana",
};

// WS3 remediation R3b, Item 6 (validation closure — export dates), schema
// integration level. Pre-fix, this schema had no date-shape or
// cross-field check at all — `periodStart`/`periodEnd` were only
// `z.string().min(1)`, so "not-a-date" and an inverted range both passed
// validation and reached the `new Date(...).toISOString()` call in
// `onSubmit`, which would then throw.
describe("ExportValuesSchema (WS3 remediation R3b, Item 6)", () => {
	test("rejects an unparsable period start with a field-scoped error", () => {
		const result = ExportValuesSchema.safeParse({
			...VALID_BASE,
			periodEnd: "2026-07-18",
			periodStart: "not-a-date",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find((candidate) =>
				candidate.path.includes("periodStart")
			);
			expect(issue).toBeDefined();
		}
	});

	test("rejects an inverted date range with a field-scoped error on periodEnd", () => {
		const result = ExportValuesSchema.safeParse({
			...VALID_BASE,
			periodEnd: "2026-07-01",
			periodStart: "2026-07-18",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find((candidate) =>
				candidate.path.includes("periodEnd")
			);
			expect(issue?.message).toContain("must not be before");
		}
	});

	test("accepts a well-formed, non-inverted range", () => {
		const result = ExportValuesSchema.safeParse({
			...VALID_BASE,
			periodEnd: "2026-07-18",
			periodStart: "2026-07-01",
		});
		expect(result.success).toBe(true);
	});
});
