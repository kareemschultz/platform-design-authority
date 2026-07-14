import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { migratePlatformIdentity } from "@meridian/persistence-platform-identity-postgres";
import {
	createTenancyRepository,
	migratePlatformTenancy,
} from "@meridian/persistence-platform-tenancy-postgres";
import type { OutboxEvent } from "@meridian/platform-events";
import {
	createTenancyService,
	type IdFactory,
} from "@meridian/platform-tenancy";
import { env } from "@meridian/tooling-env/server";
import { Pool, type PoolClient } from "pg";
import {
	type MigrationStream,
	runMigrationStreams,
	WS1_MIGRATION_STREAMS,
} from "./migrations";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr2_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;

const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

async function createDatabase(name: string): Promise<Pool> {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
	const url = new URL(env.DATABASE_URL);
	url.pathname = `/${name}`;
	return new Pool({ connectionString: url.toString(), max: 4 });
}

async function dropDatabase(name: string, pool: Pool): Promise<void> {
	await pool.end();
	await adminPool.query(`DROP DATABASE ${quoteIdentifier(name)} WITH (FORCE)`);
}

function event(id: string): OutboxEvent<{ change: string }> {
	return {
		actorId: "user_pr2",
		classification: "Internal",
		data: { change: "persistence-proof" },
		id,
		name: "platform.membership.activated.v1",
		occurredAt: "2026-07-13T00:00:00.000Z",
		producerNamespace: "platform",
		retentionClass: "platform-security-evidence",
		schemaRef: "schemas/events/platform.membership.activated.v1.schema.json",
		schemaVersion: "1.0.0",
		sourceChannel: "test",
		tenantId: "tenant_pr2",
	};
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 4 });
	await runMigrationStreams(testPool);
});

afterAll(async () => {
	await dropDatabase(databaseName, testPool);
	await adminPool.end();
});

describe.serial("WS1 persistence orchestration", () => {
	test("uses a deterministic, owner-qualified stream order", () => {
		expect(WS1_MIGRATION_STREAMS.map((stream) => stream.id)).toEqual([
			"platform.identity",
			"platform.tenancy",
			"platform.events",
		]);
	});

	test("migrates an empty database and repeats without schema drift", async () => {
		await runMigrationStreams(testPool);
		await runMigrationStreams(testPool);

		const tables = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"account",
			"invitation",
			"member",
			"organization",
			"passkey",
			"platform_active_context",
			"platform_event_outbox",
			"platform_location",
			"platform_membership",
			"platform_membership_invitation",
			"platform_organization",
			"platform_tenancy_command_receipt",
			"platform_tenant",
			"session",
			"two_factor",
			"user",
			"verification",
		]);

		const histories = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'drizzle' ORDER BY table_name"
		);
		expect(histories.rows.map((row) => row.table_name)).toEqual([
			"platform_events_migrations",
			"platform_identity_migrations",
			"platform_tenancy_migrations",
		]);
	});

	test("upgrades a representative identity-only database", async () => {
		const name = `${databaseName}_upgrade`;
		const pool = await createDatabase(name);
		try {
			await migratePlatformIdentity(pool);
			const before = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS value"
			);
			expect(before.rows[0]?.value).toBeNull();

			await runMigrationStreams(pool);
			const after = await pool.query<{
				events: string | null;
				tenancy: string | null;
			}>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS events, to_regclass('public.platform_tenant')::text AS tenancy"
			);
			expect(after.rows[0]).toEqual({
				events: "platform_event_outbox",
				tenancy: "platform_tenant",
			});
		} finally {
			await dropDatabase(name, pool);
		}
	});

	test("recovers after a failed serial stream without partial state", async () => {
		const name = `${databaseName}_failure`;
		const pool = await createDatabase(name);
		const failingStream: MigrationStream = {
			id: "test.deliberate-failure",
			async migrate(target) {
				const client = await target.connect();
				try {
					await client.query("BEGIN");
					await client.query(
						"CREATE TABLE pr2_failed_migration_fixture (id text PRIMARY KEY)"
					);
					throw new Error("deliberate migration failure");
				} catch (error) {
					await client.query("ROLLBACK");
					throw error;
				} finally {
					client.release();
				}
			},
		};

		try {
			let migrationError: unknown;
			try {
				await runMigrationStreams(pool, [
					{ id: "platform.identity", migrate: migratePlatformIdentity },
					{ id: "platform.tenancy", migrate: migratePlatformTenancy },
					failingStream,
					{ id: "platform.events", migrate: migratePlatformEvents },
				]);
			} catch (error) {
				migrationError = error;
			}
			expect((migrationError as Error).message).toBe(
				"Migration stream test.deliberate-failure failed"
			);
			const partial = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.pr2_failed_migration_fixture')::text AS value"
			);
			expect(partial.rows[0]?.value).toBeNull();

			await runMigrationStreams(pool);
			const recovered = await pool.query<{ value: string | null }>(
				"SELECT to_regclass('public.platform_event_outbox')::text AS value"
			);
			expect(recovered.rows[0]?.value).toBe("platform_event_outbox");
		} finally {
			await dropDatabase(name, pool);
		}
	});

	test("enforces two-tenant isolation, context binding, and composite ownership", async () => {
		const repository = createTenancyRepository(testPool);
		await repository.seed({
			locations: [
				{
					id: "location_demerara_store",
					name: "Demerara Test Store",
					organizationId: "organization_demerara",
					state: "Active",
					tenantId: "tenant_demerara",
					timezone: "America/Guyana",
					type: "Store",
					version: 1,
				},
				{
					id: "location_demerara_east_bank",
					name: "East Bank Test Store",
					organizationId: "organization_demerara",
					state: "Active",
					tenantId: "tenant_demerara",
					timezone: "America/Guyana",
					type: "Store",
					version: 1,
				},
			],
			memberships: [
				{
					authUserId: "user_multitenant",
					id: "membership_demerara",
					organizationId: "organization_demerara",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_demerara",
					version: 1,
				},
			],
			organizations: [
				{
					id: "organization_demerara",
					name: "Demerara Retail Test Organization",
					state: "Active",
					tenantId: "tenant_demerara",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_demerara",
				name: "Demerara Retail Test Group",
				state: "Active",
				version: 1,
			},
		});
		await repository.seed({
			locations: [],
			memberships: [
				{
					authUserId: "user_essequibo_admin",
					id: "membership_essequibo",
					organizationId: "organization_essequibo",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_essequibo",
					version: 1,
				},
			],
			organizations: [
				{
					id: "organization_essequibo",
					name: "Essequibo Isolation Organization",
					state: "Active",
					tenantId: "tenant_essequibo",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_essequibo",
				name: "Essequibo Isolation Test Tenant",
				state: "Active",
				version: 1,
			},
		});

		let sequence = 0;
		const ids: IdFactory = {
			create(kind) {
				sequence += 1;
				return `${kind}_isolation_${sequence}`;
			},
		};
		const service = createTenancyService({
			clock: () => new Date("2026-07-13T12:00:00.000Z"),
			contextTtlMs: 60_000,
			ids,
			unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
				events: createPostgresOutbox(client),
				repository: createTenancyRepository(client),
			})),
		});

		const demeraraContext = await service.setActiveContext({
			authUserId: "user_multitenant",
			idempotencyKey: "context-demerara-0001",
			locationId: "location_demerara_store",
			organizationId: "organization_demerara",
			sessionId: "session_multi_tab",
		});
		const secondTabContext = await service.setActiveContext({
			authUserId: "user_multitenant",
			idempotencyKey: "context-demerara-0002",
			locationId: "location_demerara_east_bank",
			organizationId: "organization_demerara",
			sessionId: "session_multi_tab",
		});

		expect(demeraraContext.contextId).not.toBe(secondTabContext.contextId);
		expect(
			(
				await repository.getActiveContext(
					demeraraContext.contextId,
					"session_multi_tab"
				)
			)?.tenantId
		).toBe("tenant_demerara");
		expect(
			(
				await repository.getActiveContext(
					secondTabContext.contextId,
					"session_multi_tab"
				)
			)?.tenantId
		).toBe("tenant_demerara");
		const organizationUpdate = {
			authUserId: "user_multitenant",
			contextId: demeraraContext.contextId,
			idempotencyKey: "organization-update-0001",
			name: "Demerara Retail Test Organization Updated",
			organizationId: "organization_demerara",
			sessionId: "session_multi_tab",
			version: 1,
		};
		const updatedOrganization =
			await service.updateOrganization(organizationUpdate);
		expect(await service.updateOrganization(organizationUpdate)).toEqual(
			updatedOrganization
		);
		let organizationKeyReuseError: unknown;
		try {
			await service.updateOrganization({
				...organizationUpdate,
				name: "Conflicting update",
			});
		} catch (error) {
			organizationKeyReuseError = error;
		}
		expect(organizationKeyReuseError).toMatchObject({
			code: "idempotency_conflict",
		});
		let crossTenantContextError: unknown;
		try {
			await service.setActiveContext({
				authUserId: "user_multitenant",
				idempotencyKey: "context-cross-tenant-denied",
				organizationId: "organization_essequibo",
				sessionId: "session_multi_tab",
			});
		} catch (error) {
			crossTenantContextError = error;
		}
		expect(crossTenantContextError).toMatchObject({
			code: "membership_inactive",
		});
		let organizationError: unknown;
		try {
			await service.getOrganization({
				authUserId: "user_multitenant",
				contextId: demeraraContext.contextId,
				organizationId: "organization_essequibo",
				sessionId: "session_multi_tab",
			});
		} catch (error) {
			organizationError = error;
		}
		expect((organizationError as Error).message).toContain(
			"outside the active context"
		);
		expect(
			await repository.getOrganization(
				"tenant_demerara",
				"organization_essequibo"
			)
		).toBeNull();
		expect(
			(
				await repository.listTenantMemberships("tenant_demerara", { limit: 20 })
			).items.map((membership) => membership.id)
		).toEqual(["membership_demerara"]);

		let crossTenantWriteError: unknown;
		try {
			await testPool.query(
				"INSERT INTO platform_location (id, name, organization_id, state, tenant_id, timezone, type, version) VALUES ('location_cross_tenant', 'Invalid', 'organization_essequibo', 'Active', 'tenant_demerara', 'America/Guyana', 'Store', 1)"
			);
		} catch (error) {
			crossTenantWriteError = error;
		}
		expect(crossTenantWriteError).toBeInstanceOf(Error);
	});

	test("keeps invitation events private and tenant state atomic with the outbox", async () => {
		const repository = createTenancyRepository(testPool);
		let sequence = 0;
		const ids: IdFactory = {
			create(kind) {
				sequence += 1;
				return `${kind}_atomic_${sequence}`;
			},
		};
		const unitOfWork = createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createTenancyRepository(client),
		}));
		const service = createTenancyService({
			clock: () => new Date("2026-07-13T13:00:00.000Z"),
			contextTtlMs: 60_000,
			ids,
			unitOfWork,
		});

		const invitation = await service.createInvitation({
			actorUserId: "user_tenant_admin",
			correlationId: "correlation_invitation",
			email: "invitee@example.test",
			idempotencyKey: "invitation-idempotency-0001",
			organizationId: "organization_demerara",
			roleIds: ["role_cashier"],
			tenantId: "tenant_demerara",
		});
		const repeated = await service.createInvitation({
			actorUserId: "user_tenant_admin",
			correlationId: "correlation_invitation_repeat",
			email: "invitee@example.test",
			idempotencyKey: "invitation-idempotency-0001",
			organizationId: "organization_demerara",
			roleIds: ["role_cashier"],
			tenantId: "tenant_demerara",
		});
		expect(repeated.id).toBe(invitation.id);
		const invitationEvents = await testPool.query<{
			data: Record<string, unknown>;
		}>(
			"SELECT data FROM platform_event_outbox WHERE name = 'platform.membership.invited.v1' AND tenant_id = 'tenant_demerara'"
		);
		expect(invitationEvents.rows).toHaveLength(1);
		expect(invitationEvents.rows[0]?.data).not.toHaveProperty("email");

		await repository.seed({
			locations: [],
			memberships: [
				{
					authUserId: "user_suspend_commit",
					id: "membership_suspend_commit",
					organizationId: "organization_demerara",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_demerara",
					version: 1,
				},
				{
					authUserId: "user_suspend_rollback",
					id: "membership_suspend_rollback",
					organizationId: "organization_demerara",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_demerara",
					version: 1,
				},
			],
			organizations: [],
			tenant: {
				id: "tenant_demerara",
				name: "Demerara Retail Test Group",
				state: "Active",
				version: 1,
			},
		});
		const suspendInput = {
			actorUserId: "user_tenant_admin",
			correlationId: "correlation_suspend_commit",
			idempotencyKey: "suspend-idempotency-commit",
			membershipId: "membership_suspend_commit",
			reason: "controlled integration proof",
			revokeSessionsWhenNoActiveMembershipsRemain: true,
			targetAuthUserId: "user_suspend_commit",
			tenantId: "tenant_demerara",
			version: 1,
		};
		const suspended = await service.suspendMembership(suspendInput);
		const repeatedSuspension = await service.suspendMembership(suspendInput);
		expect(repeatedSuspension).toEqual(suspended);
		expect(
			(
				await repository.getMembership(
					"tenant_demerara",
					"membership_suspend_commit"
				)
			)?.state
		).toBe("Suspended");
		let reusedSuspensionKeyError: unknown;
		try {
			await service.suspendMembership({
				...suspendInput,
				membershipId: "membership_suspend_rollback",
				targetAuthUserId: "user_suspend_rollback",
			});
		} catch (error) {
			reusedSuspensionKeyError = error;
		}
		expect(reusedSuspensionKeyError).toMatchObject({
			code: "idempotency_conflict",
		});
		expect(
			(
				await repository.getMembership(
					"tenant_demerara",
					"membership_suspend_rollback"
				)
			)?.state
		).toBe("Active");

		const rollbackService = createTenancyService({
			clock: () => new Date("2026-07-13T13:05:00.000Z"),
			contextTtlMs: 60_000,
			ids: { create: (kind) => `${kind}_forced_rollback` },
			unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
				events: {
					async append(eventRecord) {
						await createPostgresOutbox(client).append(eventRecord);
						throw new Error("forced outbox failure");
					},
				},
				repository: createTenancyRepository(client),
			})),
		});
		let forcedRollbackError: unknown;
		try {
			await rollbackService.suspendMembership({
				actorUserId: "user_tenant_admin",
				correlationId: "correlation_suspend_rollback",
				idempotencyKey: "suspend-idempotency-rollback",
				membershipId: "membership_suspend_rollback",
				reason: "forced rollback proof",
				revokeSessionsWhenNoActiveMembershipsRemain: true,
				targetAuthUserId: "user_suspend_rollback",
				tenantId: "tenant_demerara",
				version: 1,
			});
		} catch (error) {
			forcedRollbackError = error;
		}
		expect((forcedRollbackError as Error).message).toBe(
			"forced outbox failure"
		);
		expect(
			(
				await repository.getMembership(
					"tenant_demerara",
					"membership_suspend_rollback"
				)
			)?.state
		).toBe("Active");
		expect(
			(
				await testPool.query<{ id: string }>(
					"SELECT id FROM platform_event_outbox WHERE id = 'event_forced_rollback'"
				)
			).rows
		).toHaveLength(0);
		expect(
			await repository.getCommandReceipt(
				"tenant_demerara",
				"membership.suspend",
				"suspend-idempotency-rollback"
			)
		).toBeNull();
	});

	test("commits and rolls back owner state with its outbox record", async () => {
		await testPool.query(
			"CREATE TABLE pr2_identity_state_fixture (id text PRIMARY KEY, revision integer NOT NULL)"
		);
		await testPool.query(
			"INSERT INTO pr2_identity_state_fixture (id, revision) VALUES ('identity_pr2', 0)"
		);

		const bindScope = (client: PoolClient) => ({
			outbox: createPostgresOutbox(client),
			state: {
				increment: () =>
					client.query(
						"UPDATE pr2_identity_state_fixture SET revision = revision + 1 WHERE id = 'identity_pr2'"
					),
			},
		});
		const unitOfWork = createPostgresUnitOfWork(testPool, bindScope);

		await unitOfWork.execute(async ({ outbox, state }) => {
			await state.increment();
			expect(await outbox.append(event("evt_pr2_atomic_commit"))).toBe(
				"inserted"
			);
		});

		let rollbackError: unknown;
		try {
			await unitOfWork.execute(async ({ outbox, state }) => {
				await state.increment();
				await outbox.append(event("evt_pr2_atomic_rollback"));
				throw new Error("rollback proof");
			});
		} catch (error) {
			rollbackError = error;
		}
		expect(rollbackError).toBeInstanceOf(Error);
		expect((rollbackError as Error).message).toBe("rollback proof");

		const stateResult = await testPool.query<{ revision: number }>(
			"SELECT revision FROM pr2_identity_state_fixture WHERE id = 'identity_pr2'"
		);
		expect(stateResult.rows[0]?.revision).toBe(1);
		const outboxRecords = await testPool.query<{ id: string }>(
			"SELECT id FROM platform_event_outbox WHERE id LIKE 'evt_pr2_atomic_%' ORDER BY id"
		);
		expect(outboxRecords.rows.map((row) => row.id)).toEqual([
			"evt_pr2_atomic_commit",
		]);
		expect(
			await createPostgresOutbox(testPool).append(
				event("evt_pr2_atomic_commit")
			)
		).toBe("duplicate");
		const logicalOutbox = createPostgresOutbox(testPool);
		expect(
			await logicalOutbox.append({
				...event("evt_pr3_logical_0001"),
				idempotencyKey: "logical-idempotency-pr3-0001",
			})
		).toBe("inserted");
		expect(
			await logicalOutbox.append({
				...event("evt_pr3_logical_0002"),
				idempotencyKey: "logical-idempotency-pr3-0001",
			})
		).toBe("duplicate");
	});
});
