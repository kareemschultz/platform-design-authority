import { describe, expect, test } from "bun:test";
import { PLATFORM_IMPORT_EXPORT_MIGRATION_TABLE } from ".";

describe("Platform Import/Export persistence registration", () => {
	test("uses an owner-specific migration history", () => {
		expect(PLATFORM_IMPORT_EXPORT_MIGRATION_TABLE).toBe(
			"platform_import_export_migrations"
		);
	});
});
