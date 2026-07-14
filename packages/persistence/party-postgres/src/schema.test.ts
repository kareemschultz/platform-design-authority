import { describe, expect, test } from "bun:test";
import { getTableColumns, getTableName } from "drizzle-orm";

import {
	commandReceipts,
	contactPoints,
	identityLinks,
	organizationDetails,
	parties,
	personDetails,
} from "./schema";

describe("Party PostgreSQL ownership", () => {
	test("declares only the registered Party-owned tables", () => {
		expect(
			[
				commandReceipts,
				contactPoints,
				identityLinks,
				organizationDetails,
				parties,
				personDetails,
			]
				.map(getTableName)
				.toSorted((left, right) => left.localeCompare(right))
		).toEqual([
			"party_command_receipt",
			"party_contact_point",
			"party_identity_link",
			"party_organization_detail",
			"party_person_detail",
			"party_record",
		]);
	});

	test("requires tenant scope on every Party table", () => {
		for (const table of [
			commandReceipts,
			contactPoints,
			identityLinks,
			organizationDetails,
			parties,
			personDetails,
		]) {
			const { tenantId } = getTableColumns(table);
			expect(tenantId).toBeDefined();
			expect(tenantId?.notNull).toBe(true);
		}
	});
});
