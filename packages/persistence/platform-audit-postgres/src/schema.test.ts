import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import { auditPrivacyOverlay, auditRecord } from "./schema";

describe("Platform Audit PostgreSQL ownership", () => {
	test("uses append-oriented discriminated-scope records and separate privacy overlays", () => {
		expect(getTableName(auditRecord)).toBe("platform_audit_record");
		const columns = getTableColumns(auditRecord);
		expect(columns.id.primary).toBe(true);
		expect(columns.scopeType.notNull).toBe(true);
		expect(columns.scopeKey.notNull).toBe(true);
		expect(columns.tenantId.notNull).toBe(false);
		expect(columns.recordHash.notNull).toBe(true);
		expect(columns.previousHash.notNull).toBe(false);
		expect(getTableName(auditPrivacyOverlay)).toBe(
			"platform_audit_privacy_overlay"
		);
	});
});
