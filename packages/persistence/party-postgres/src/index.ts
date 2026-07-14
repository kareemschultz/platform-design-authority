import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ContactPointRecord,
	IdentityLinkRecord,
	OrganizationDetailRecord,
	Page,
	PageRequest,
	PartyCommandOperation,
	PartyCommandReceipt,
	PartyRecord,
	PartyRepository,
	PersonDetailRecord,
} from "@meridian/domain-party";
import { and, asc, eq, gt, ilike, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	commandReceipts,
	contactPoints,
	identityLinks,
	organizationDetails,
	parties,
	personDetails,
} from "./schema";

export type PartyPostgresConnection = Pool | PoolClient;

function mapParty(row: typeof parties.$inferSelect): PartyRecord {
	return {
		classification: row.classification as PartyRecord["classification"],
		createdAt: row.createdAt,
		displayName: row.displayName,
		id: row.id,
		privacyState: row.privacyState as PartyRecord["privacyState"],
		provenance: row.provenance as PartyRecord["provenance"],
		state: row.state as PartyRecord["state"],
		tenantId: row.tenantId,
		type: row.type as PartyRecord["type"],
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function mapIdentityLink(
	row: typeof identityLinks.$inferSelect
): IdentityLinkRecord {
	return {
		authUserId: row.authUserId,
		createdAt: row.createdAt.toISOString(),
		id: row.id,
		membershipId: row.membershipId,
		organizationId: row.organizationId,
		partyId: row.partyId,
		provenance: row.provenance as IdentityLinkRecord["provenance"],
		state: row.state as IdentityLinkRecord["state"],
		tenantId: row.tenantId,
		version: row.version,
	};
}

function mapReceipt(
	row: typeof commandReceipts.$inferSelect
): PartyCommandReceipt {
	return {
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as PartyCommandOperation,
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result,
		tenantId: row.tenantId,
	};
}

export function createPartyRepository(
	connection: PartyPostgresConnection
): PartyRepository {
	const database = drizzle(connection);

	async function insertContacts(records: ContactPointRecord[]): Promise<void> {
		if (records.length > 0) {
			await database.insert(contactPoints).values(records);
		}
	}

	return {
		async createIdentityLink(record) {
			const [row] = await database
				.insert(identityLinks)
				.values({ ...record, createdAt: new Date(record.createdAt) })
				.onConflictDoNothing()
				.returning();
			if (row) {
				return mapIdentityLink(row);
			}
			const existing = await this.getIdentityLinkForMembership(
				record.tenantId,
				record.membershipId
			);
			if (!existing) {
				throw new Error("Party identity link conflict could not be loaded");
			}
			return existing;
		},

		async createOrganization(input: {
			contacts: ContactPointRecord[];
			detail: OrganizationDetailRecord;
			party: PartyRecord;
		}) {
			const [row] = await database
				.insert(parties)
				.values(input.party)
				.returning();
			if (!row) {
				throw new Error("Organization Party insert returned no row");
			}
			await database.insert(organizationDetails).values(input.detail);
			await insertContacts(input.contacts);
			return mapParty(row);
		},

		async createPerson(input: {
			contacts: ContactPointRecord[];
			detail: PersonDetailRecord;
			party: PartyRecord;
		}) {
			const [row] = await database
				.insert(parties)
				.values(input.party)
				.returning();
			if (!row) {
				throw new Error("Person Party insert returned no row");
			}
			await database.insert(personDetails).values(input.detail);
			await insertContacts(input.contacts);
			return mapParty(row);
		},

		async getCommandReceipt(tenantId, operation, idempotencyKey) {
			const [row] = await database
				.select()
				.from(commandReceipts)
				.where(
					and(
						eq(commandReceipts.tenantId, tenantId),
						eq(commandReceipts.operation, operation),
						eq(commandReceipts.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return row ? mapReceipt(row) : null;
		},

		async getIdentityLinkForMembership(tenantId, membershipId) {
			const [row] = await database
				.select()
				.from(identityLinks)
				.where(
					and(
						eq(identityLinks.tenantId, tenantId),
						eq(identityLinks.membershipId, membershipId)
					)
				)
				.limit(1);
			return row ? mapIdentityLink(row) : null;
		},

		async getParty(tenantId, partyId) {
			const [row] = await database
				.select()
				.from(parties)
				.where(and(eq(parties.tenantId, tenantId), eq(parties.id, partyId)))
				.limit(1);
			return row ? mapParty(row) : null;
		},

		async listParties(
			tenantId: string,
			page: PageRequest
		): Promise<Page<PartyRecord>> {
			const search = page.query?.trim();
			const rows = await database
				.select()
				.from(parties)
				.where(
					and(
						eq(parties.tenantId, tenantId),
						page.cursor ? gt(parties.id, page.cursor) : undefined,
						search
							? or(
									ilike(parties.displayName, `%${search}%`),
									eq(parties.id, search)
								)
							: undefined
					)
				)
				.orderBy(asc(parties.id))
				.limit(page.limit + 1);
			return {
				items: rows.slice(0, page.limit).map(mapParty),
				nextCursor:
					rows.length > page.limit ? (rows[page.limit - 1]?.id ?? null) : null,
			};
		},

		async recordCommandReceipt(receipt) {
			const inserted = await database
				.insert(commandReceipts)
				.values(receipt)
				.onConflictDoNothing()
				.returning();
			if (inserted[0]) {
				return { inserted: true, record: mapReceipt(inserted[0]) };
			}
			const existing = await this.getCommandReceipt(
				receipt.tenantId,
				receipt.operation,
				receipt.idempotencyKey
			);
			if (!existing) {
				throw new Error("Party command receipt conflict could not be loaded");
			}
			return { inserted: false, record: existing };
		},

		async updateParty(input) {
			const set: Partial<typeof parties.$inferInsert> = {
				updatedAt: new Date(),
				version: input.version + 1,
			};
			if (input.displayName !== undefined) {
				set.displayName = input.displayName;
			}
			if (input.state !== undefined) {
				set.state = input.state;
			}
			const [row] = await database
				.update(parties)
				.set(set)
				.where(
					and(
						eq(parties.tenantId, input.tenantId),
						eq(parties.id, input.partyId),
						eq(parties.version, input.version)
					)
				)
				.returning();
			return row ? mapParty(row) : "version_conflict";
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migrateParty(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "party_migrations",
	});
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema";
