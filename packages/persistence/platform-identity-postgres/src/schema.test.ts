import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import { account, session, user, verification } from "./schema";

describe("Platform Identity PostgreSQL ownership", () => {
	test("declares only the four Better Auth owner tables", () => {
		const tableNames = [account, session, user, verification]
			.map(getTableName)
			.toSorted((left, right) => left.localeCompare(right));

		expect(tableNames).toEqual(["account", "session", "user", "verification"]);
	});
});
