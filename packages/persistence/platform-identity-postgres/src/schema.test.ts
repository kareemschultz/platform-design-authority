import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import {
	account,
	invitation,
	member,
	organization,
	passkey,
	session,
	twoFactor,
	user,
	verification,
} from "./schema";

describe("Platform Identity PostgreSQL ownership", () => {
	test("declares only the selected Better Auth owner tables", () => {
		const tableNames = [
			account,
			invitation,
			member,
			organization,
			passkey,
			session,
			twoFactor,
			user,
			verification,
		]
			.map(getTableName)
			.toSorted((left, right) => left.localeCompare(right));

		expect(tableNames).toEqual([
			"account",
			"invitation",
			"member",
			"organization",
			"passkey",
			"session",
			"two_factor",
			"user",
			"verification",
		]);
	});
});
