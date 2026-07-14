import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	bindIdentityPersistence,
	type IdentityDirectoryPort,
	type IdentityOrganizationProjection,
	type IdentityPersistence,
} from "@meridian/platform-identity";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

// biome-ignore lint/performance/noNamespaceImport: Better Auth's Drizzle adapter expects a schema object namespace.
import * as schema from "./schema";

export type IdentityPostgresConnection = Pool | PoolClient;

export function createIdentityPersistence(
	connection: IdentityPostgresConnection
): IdentityPersistence {
	const database = drizzle(connection, { schema });
	return bindIdentityPersistence(
		drizzleAdapter(database, {
			provider: "pg",
			schema,
		})
	);
}

export function createIdentityDirectory(
	connection: IdentityPostgresConnection
): IdentityDirectoryPort {
	const database = drizzle(connection, { schema });
	return {
		async findUsers(authUserIds) {
			if (authUserIds.length === 0) {
				return [];
			}
			const rows = await database
				.select({
					banned: schema.user.banned,
					email: schema.user.email,
					id: schema.user.id,
					name: schema.user.name,
				})
				.from(schema.user)
				.where(inArray(schema.user.id, [...authUserIds]));
			return rows.map((row) => ({
				authenticationState: row.banned ? "Suspended" : "Active",
				authUserId: row.id,
				displayName: row.name,
				email: row.email,
			}));
		},
	};
}

export function createIdentityOrganizationProjection(
	connection: IdentityPostgresConnection
): IdentityOrganizationProjection {
	const database = drizzle(connection, { schema });
	return {
		async projectInvitation(input) {
			await database
				.insert(schema.invitation)
				.values({
					createdAt: new Date(),
					email: input.email,
					expiresAt: input.expiresAt,
					id: input.invitationId,
					inviterId: input.inviterAuthUserId,
					organizationId: input.organizationId,
					role: "member",
					status: "pending",
				})
				.onConflictDoNothing({ target: schema.invitation.id });
		},

		async projectMembership(input) {
			await database
				.insert(schema.member)
				.values({
					createdAt: new Date(),
					id: input.membershipId,
					organizationId: input.organizationId,
					role: "member",
					userId: input.authUserId,
				})
				.onConflictDoUpdate({
					set: {
						organizationId: input.organizationId,
						role: "member",
						userId: input.authUserId,
					},
					target: schema.member.id,
				});
		},

		async projectOrganization(input) {
			await database
				.insert(schema.organization)
				.values({
					createdAt: new Date(),
					id: input.canonicalOrganizationId,
					metadata: JSON.stringify({
						canonicalOrganizationId: input.canonicalOrganizationId,
						tenantId: input.tenantId,
					}),
					name: input.name,
					slug: `${input.tenantId}-${input.canonicalOrganizationId}`.toLowerCase(),
				})
				.onConflictDoUpdate({
					set: { name: input.name },
					target: schema.organization.id,
				});
		},

		async removeMembership(membershipId) {
			await database
				.delete(schema.member)
				.where(eq(schema.member.id, membershipId));
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformIdentity(pool: Pool): Promise<void> {
	await migrate(drizzle(pool, { schema }), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_identity_migrations",
	});
}
