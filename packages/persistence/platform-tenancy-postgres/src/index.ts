import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ActiveContextRecord,
	CommandReceiptRecord,
	InvitationRecord,
	LocationRecord,
	MembershipRecord,
	OrganizationRecord,
	Page,
	TenancyRepository,
	TenantSeed,
} from "@meridian/platform-tenancy";
import { and, asc, eq, gt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	activeContexts,
	commandReceipts,
	invitations,
	locations,
	memberships,
	organizations,
	tenants,
} from "./schema";

export type TenancyPostgresConnection = Pool | PoolClient;

function pageRows<T extends { id: string }>(rows: T[], limit: number): Page<T> {
	const hasMore = rows.length > limit;
	const items = hasMore ? rows.slice(0, limit) : rows;
	return {
		items,
		nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
	};
}

function mapOrganization(
	row: typeof organizations.$inferSelect
): OrganizationRecord {
	return {
		id: row.id,
		...(row.locale ? { locale: row.locale } : {}),
		name: row.name,
		state: row.state as OrganizationRecord["state"],
		tenantId: row.tenantId,
		...(row.timezone ? { timezone: row.timezone } : {}),
		version: row.version,
	};
}

function mapLocation(row: typeof locations.$inferSelect): LocationRecord {
	return {
		id: row.id,
		name: row.name,
		organizationId: row.organizationId,
		state: row.state as LocationRecord["state"],
		tenantId: row.tenantId,
		timezone: row.timezone,
		type: row.type as LocationRecord["type"],
		version: row.version,
	};
}

function mapMembership(row: typeof memberships.$inferSelect): MembershipRecord {
	return {
		authUserId: row.authUserId,
		id: row.id,
		organizationId: row.organizationId,
		roleAssignmentIds: row.roleAssignmentIds,
		state: row.state as MembershipRecord["state"],
		tenantId: row.tenantId,
		version: row.version,
	};
}

function mapInvitation(row: typeof invitations.$inferSelect): InvitationRecord {
	return {
		createdAt: row.createdAt,
		email: row.email,
		expiresAt: row.expiresAt,
		...(row.failureCode ? { failureCode: row.failureCode } : {}),
		id: row.id,
		inviteeReference: row.inviteeReference,
		organizationId: row.organizationId,
		...(row.partyId ? { partyId: row.partyId } : {}),
		roleIds: row.roleIds,
		state: row.state as InvitationRecord["state"],
		tenantId: row.tenantId,
	};
}

function mapActiveContext(
	row: typeof activeContexts.$inferSelect
): ActiveContextRecord {
	return {
		authUserId: row.authUserId,
		...(row.branchId ? { branchId: row.branchId } : {}),
		contextId: row.contextId,
		...(row.delegationId ? { delegationId: row.delegationId } : {}),
		expiresAt: row.expiresAt,
		idempotencyKey: row.idempotencyKey,
		issuedAt: row.issuedAt,
		...(row.legalEntityId ? { legalEntityId: row.legalEntityId } : {}),
		...(row.locationId ? { locationId: row.locationId } : {}),
		organizationId: row.organizationId,
		...(row.partyId ? { partyId: row.partyId } : {}),
		sessionId: row.sessionId,
		tenantId: row.tenantId,
	};
}

function mapCommandReceipt(
	row: typeof commandReceipts.$inferSelect
): CommandReceiptRecord {
	return {
		idempotencyKey: row.idempotencyKey,
		operation: row.operation as CommandReceiptRecord["operation"],
		requestFingerprint: row.requestFingerprint,
		resourceId: row.resourceId,
		result: row.result,
		tenantId: row.tenantId,
	};
}

function cursorCondition<TColumn>(cursor: string | undefined, column: TColumn) {
	return cursor ? gt(column as never, cursor) : undefined;
}

export function createTenancyRepository(
	connection: TenancyPostgresConnection
): TenancyRepository {
	const database = drizzle(connection);
	return {
		async activateMembership(record) {
			const [row] = await database
				.insert(memberships)
				.values(record)
				.onConflictDoUpdate({
					set: {
						roleAssignmentIds: record.roleAssignmentIds,
						state: "Active",
						version: record.version,
					},
					target: memberships.id,
				})
				.returning();
			if (!row) {
				throw new Error("Membership activation did not return a row");
			}
			return mapMembership(row);
		},

		async createInvitation(record, idempotencyKey) {
			const [inserted] = await database
				.insert(invitations)
				.values({ ...record, idempotencyKey })
				.onConflictDoNothing({
					target: [invitations.tenantId, invitations.idempotencyKey],
				})
				.returning();
			if (inserted) {
				return mapInvitation(inserted);
			}
			const [existing] = await database
				.select()
				.from(invitations)
				.where(
					and(
						eq(invitations.tenantId, record.tenantId),
						eq(invitations.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			if (!existing) {
				throw new Error("Invitation idempotency lookup failed");
			}
			return mapInvitation(existing);
		},

		async getActiveContext(contextId, sessionId) {
			const [row] = await database
				.select()
				.from(activeContexts)
				.where(
					and(
						eq(activeContexts.contextId, contextId),
						eq(activeContexts.sessionId, sessionId)
					)
				)
				.limit(1);
			return row ? mapActiveContext(row) : null;
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
			return row ? mapCommandReceipt(row) : null;
		},

		async getInvitationByIdempotency(tenantId, idempotencyKey) {
			const [row] = await database
				.select()
				.from(invitations)
				.where(
					and(
						eq(invitations.tenantId, tenantId),
						eq(invitations.idempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return row ? mapInvitation(row) : null;
		},

		async getLocation(tenantId, locationId) {
			const [row] = await database
				.select()
				.from(locations)
				.where(
					and(eq(locations.tenantId, tenantId), eq(locations.id, locationId))
				)
				.limit(1);
			return row ? mapLocation(row) : null;
		},

		async getMembership(tenantId, membershipId) {
			const [row] = await database
				.select()
				.from(memberships)
				.where(
					and(
						eq(memberships.tenantId, tenantId),
						eq(memberships.id, membershipId)
					)
				)
				.limit(1);
			return row ? mapMembership(row) : null;
		},

		async getMembershipForOrganization(authUserId, organizationId) {
			const [row] = await database
				.select()
				.from(memberships)
				.where(
					and(
						eq(memberships.authUserId, authUserId),
						eq(memberships.organizationId, organizationId)
					)
				)
				.limit(1);
			return row ? mapMembership(row) : null;
		},

		async getOrganization(tenantId, organizationId) {
			const [row] = await database
				.select()
				.from(organizations)
				.where(
					and(
						eq(organizations.tenantId, tenantId),
						eq(organizations.id, organizationId)
					)
				)
				.limit(1);
			return row ? mapOrganization(row) : null;
		},

		async getTenant(tenantId) {
			const [row] = await database
				.select()
				.from(tenants)
				.where(eq(tenants.id, tenantId))
				.limit(1);
			return row
				? {
						id: row.id,
						name: row.name,
						state: row.state as TenantSeed["tenant"]["state"],
						version: row.version,
					}
				: null;
		},

		async issueActiveContext(record) {
			const [inserted] = await database
				.insert(activeContexts)
				.values(record)
				.onConflictDoNothing({
					target: [activeContexts.sessionId, activeContexts.idempotencyKey],
				})
				.returning();
			if (inserted) {
				return mapActiveContext(inserted);
			}
			const [existing] = await database
				.select()
				.from(activeContexts)
				.where(
					and(
						eq(activeContexts.sessionId, record.sessionId),
						eq(activeContexts.idempotencyKey, record.idempotencyKey)
					)
				)
				.limit(1);
			if (!existing) {
				throw new Error("Active-context idempotency lookup failed");
			}
			return mapActiveContext(existing);
		},

		async listLocations(tenantId, organizationId, page) {
			const rows = await database
				.select()
				.from(locations)
				.where(
					and(
						eq(locations.tenantId, tenantId),
						eq(locations.organizationId, organizationId),
						cursorCondition(page.cursor, locations.id)
					)
				)
				.orderBy(asc(locations.id))
				.limit(page.limit + 1);
			return pageRows(rows.map(mapLocation), page.limit);
		},

		async listMemberships(authUserId) {
			const rows = await database
				.select()
				.from(memberships)
				.where(eq(memberships.authUserId, authUserId))
				.orderBy(asc(memberships.id));
			return rows.map(mapMembership);
		},

		async listOrganizations(authUserId, page) {
			const rows = await database
				.select({ organization: organizations })
				.from(memberships)
				.innerJoin(
					organizations,
					and(
						eq(organizations.tenantId, memberships.tenantId),
						eq(organizations.id, memberships.organizationId)
					)
				)
				.where(
					and(
						eq(memberships.authUserId, authUserId),
						eq(memberships.state, "Active"),
						cursorCondition(page.cursor, organizations.id)
					)
				)
				.orderBy(asc(organizations.id))
				.limit(page.limit + 1);
			return pageRows(
				rows.map(({ organization }) => mapOrganization(organization)),
				page.limit
			);
		},

		async listTenantMemberships(tenantId, page) {
			const rows = await database
				.select()
				.from(memberships)
				.where(
					and(
						eq(memberships.tenantId, tenantId),
						cursorCondition(page.cursor, memberships.id)
					)
				)
				.orderBy(asc(memberships.id))
				.limit(page.limit + 1);
			return pageRows(rows.map(mapMembership), page.limit);
		},

		async recordCommandReceipt(record) {
			const [inserted] = await database
				.insert(commandReceipts)
				.values(record)
				.onConflictDoNothing({
					target: [
						commandReceipts.tenantId,
						commandReceipts.operation,
						commandReceipts.idempotencyKey,
					],
				})
				.returning();
			if (inserted) {
				return { inserted: true, record: mapCommandReceipt(inserted) };
			}
			const existing = await this.getCommandReceipt(
				record.tenantId,
				record.operation,
				record.idempotencyKey
			);
			if (!existing) {
				throw new Error("Tenancy command-receipt lookup failed");
			}
			return { inserted: false, record: existing };
		},

		async seed(seed: TenantSeed) {
			await database.insert(tenants).values(seed.tenant).onConflictDoNothing();
			if (seed.organizations.length > 0) {
				await database
					.insert(organizations)
					.values(seed.organizations)
					.onConflictDoNothing();
			}
			if (seed.locations.length > 0) {
				await database
					.insert(locations)
					.values(seed.locations)
					.onConflictDoNothing();
			}
			if (seed.memberships.length > 0) {
				await database
					.insert(memberships)
					.values(seed.memberships)
					.onConflictDoNothing();
			}
		},

		async suspendMembership(input) {
			const [row] = await database
				.update(memberships)
				.set({
					state: "Suspended",
					suspensionReason: input.reason,
					version: input.version + 1,
				})
				.where(
					and(
						eq(memberships.tenantId, input.tenantId),
						eq(memberships.id, input.membershipId),
						eq(memberships.version, input.version)
					)
				)
				.returning();
			return row ? mapMembership(row) : "version_conflict";
		},

		async updateOrganization(input) {
			const set: Partial<typeof organizations.$inferInsert> = {
				version: input.version + 1,
			};
			if (input.locale !== undefined) {
				set.locale = input.locale;
			}
			if (input.name !== undefined) {
				set.name = input.name;
			}
			if (input.timezone !== undefined) {
				set.timezone = input.timezone;
			}
			const [row] = await database
				.update(organizations)
				.set(set)
				.where(
					and(
						eq(organizations.tenantId, input.tenantId),
						eq(organizations.id, input.organizationId),
						eq(organizations.version, input.version)
					)
				)
				.returning();
			return row ? mapOrganization(row) : "version_conflict";
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformTenancy(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_tenancy_migrations",
	});
}

// biome-ignore lint/performance/noBarrelFile: this is the persistence package's deliberate public schema and adapter surface.
export * from "./schema";
