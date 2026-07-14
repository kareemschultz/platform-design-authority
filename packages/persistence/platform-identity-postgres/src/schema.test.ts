import { describe, expect, test } from "bun:test";
import { getTableName } from "drizzle-orm";
import {
	account,
	identitySessionCommandReceipt,
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
	test("declares the selected Better Auth tables and Identity command receipt", () => {
		const tableNames = [
			account,
			invitation,
			identitySessionCommandReceipt,
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
			"platform_identity_session_command_receipt",
			"session",
			"two_factor",
			"user",
			"verification",
		]);
	});
});
