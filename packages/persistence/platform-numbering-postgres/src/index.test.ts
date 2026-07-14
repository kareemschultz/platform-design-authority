import { describe, expect, test } from "bun:test";
import { PLATFORM_NUMBERING_MIGRATION_TABLE } from ".";

describe("Platform Numbering persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(PLATFORM_NUMBERING_MIGRATION_TABLE).toBe(
			"platform_numbering_migrations"
		);
	});
});
