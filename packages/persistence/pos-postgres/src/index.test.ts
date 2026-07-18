import { describe, expect, test } from "bun:test";
import { POS_MIGRATION_TABLE } from ".";

describe("POS persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(POS_MIGRATION_TABLE).toBe("pos_migrations");
	});
});
