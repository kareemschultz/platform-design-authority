import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import { eventOutbox } from "./schema";

describe("Platform Event Backbone PostgreSQL ownership", () => {
	test("declares the canonical outbox identity and discriminated scope columns", () => {
		expect(getTableName(eventOutbox)).toBe("platform_event_outbox");
		const columns = getTableColumns(eventOutbox);
		expect(columns.id.primary).toBe(true);
		expect(columns.scopeType.notNull).toBe(true);
		expect(columns.scopeKey.notNull).toBe(true);
		expect(columns.tenantId.notNull).toBe(false);
		expect(columns.data.notNull).toBe(true);
		expect(columns.publishedAt.notNull).toBe(false);
		expect(columns.status.notNull).toBe(true);
	});
});
