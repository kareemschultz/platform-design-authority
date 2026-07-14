import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPartyService,
	type PartyIdFactory,
} from "@meridian/domain-party";
import { createPartyRepository } from "@meridian/persistence-party-postgres";
import { createEntitlementRepository } from "@meridian/persistence-platform-entitlements-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { migratePlatformIdentity } from "@meridian/persistence-platform-identity-postgres";
import {
	createTenancyRepository,
	migratePlatformTenancy,
} from "@meridian/persistence-platform-tenancy-postgres";
import { createAuthorizationService } from "@meridian/platform-authorization";
import {
	createEntitlementEvaluator,
	createEntitlementService,
} from "@meridian/platform-entitlements";
import type { OutboxEvent } from "@meridian/platform-events";
import {
	createTenancyApplication,
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
		scopeType: "Tenant",
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
			"platform.entitlements",
			"platform.audit",
			"platform.events",
			"party.records",
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
			"party_command_receipt",
			"party_contact_point",
			"party_identity_link",
			"party_organization_detail",
			"party_person_detail",
			"party_record",
			"passkey",
			"platform_active_context",
			"platform_audit_privacy_overlay",
			"platform_audit_record",
			"platform_delegation",
			"platform_entitlement",
			"platform_entitlement_change",
			"platform_entitlement_command_receipt",
			"platform_event_outbox",
			"platform_identity_session_command_receipt",
			"platform_location",
			"platform_membership",
			"platform_membership_invitation",
			"platform_organization",
			"platform_role",
			"platform_role_assignment",
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
			"party_migrations",
			"platform_audit_migrations",
			"platform_entitlements_migrations",
			"platform_events_migrations",
			"platform_identity_migrations",
			"platform_tenancy_migrations",
		]);
	});

	test("enforces current scoped authorization and atomic role assignment", async () => {
		const repository = createTenancyRepository(testPool);
		await repository.seed({
			locations: [],
			memberships: [
				{
					authUserId: "user_authorization_admin_a",
					id: "membership_authorization_admin_a",
					organizationId: "organization_authorization_a",
					roleAssignmentIds: ["assignment_authorization_admin_a"],
					state: "Active",
					tenantId: "tenant_authorization_a",
					version: 1,
				},
				{
					authUserId: "user_authorization_target_a",
					id: "membership_authorization_target_a",
					organizationId: "organization_authorization_a",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_authorization_a",
					version: 1,
				},
			],
			organizations: [
				{
					id: "organization_authorization_a",
					name: "Demerara Authorization Test Organization",
					state: "Active",
					tenantId: "tenant_authorization_a",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			roleAssignments: [
				{
					id: "assignment_authorization_admin_a",
					membershipId: "membership_authorization_admin_a",
					roleId: "role_authorization_admin_a",
					scopeType: "Tenant",
					startsAt: new Date("2026-07-14T00:00:00.000Z"),
					state: "Active",
					tenantId: "tenant_authorization_a",
					version: 1,
				},
			],
			roles: [
				{
					description: "Authorization test administrator",
					id: "role_authorization_admin_a",
					name: "Tenant Administrator",
					permissionIds: ["platform.role.assign", "platform.role.read"],
					state: "Active",
					tenantId: "tenant_authorization_a",
					version: 1,
				},
				{
					description: "Authorization test cashier",
					id: "role_authorization_cashier_a",
					name: "Cashier",
					permissionIds: ["commerce.sale.create"],
					state: "Active",
					tenantId: "tenant_authorization_a",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_authorization_a",
				name: "Demerara Authorization Test Tenant",
				state: "Active",
				version: 1,
			},
		});
		await repository.seed({
			locations: [],
			memberships: [
				{
					authUserId: "user_authorization_admin_b",
					id: "membership_authorization_admin_b",
					organizationId: "organization_authorization_b",
					roleAssignmentIds: [],
					state: "Active",
					tenantId: "tenant_authorization_b",
					version: 1,
				},
			],
			organizations: [
				{
					id: "organization_authorization_b",
					name: "Essequibo Authorization Test Organization",
					state: "Active",
					tenantId: "tenant_authorization_b",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			roles: [
				{
					id: "role_authorization_admin_b",
					name: "Tenant B Administrator",
					permissionIds: ["platform.role.assign"],
					state: "Active",
					tenantId: "tenant_authorization_b",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_authorization_b",
				name: "Essequibo Authorization Test Tenant",
				state: "Active",
				version: 1,
			},
		});

		let sequence = 0;
		const service = createTenancyService({
			clock: () => new Date("2026-07-14T12:00:00.000Z"),
			contextTtlMs: 60 * 60 * 1000,
			ids: {
				create(kind) {
					sequence += 1;
					return `${kind}_authorization_integration_${sequence}`;
				},
			},
			unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
				events: createPostgresOutbox(client),
				repository: createTenancyRepository(client),
			})),
		});
		const context = await service.setActiveContext({
			authUserId: "user_authorization_admin_a",
			idempotencyKey: "idempotency_authorization_context_a",
			organizationId: "organization_authorization_a",
			sessionId: "session_authorization_admin_a",
		});
		const authorization = createAuthorizationService({
			clock: () => new Date("2026-07-14T12:00:00.000Z"),
			state: { load: (input) => service.resolveAuthorizationState(input) },
		});
		const application = createTenancyApplication({
			directory: { findUsers: async () => [] },
			permissions: authorization,
			projection: {
				projectInvitation: async () => undefined,
				projectOrganization: async () => undefined,
				removeMembership: async () => undefined,
			},
			service,
		});

		const roles = await application.listRoles({
			authUserId: "user_authorization_admin_a",
			contextId: context.contextId,
			page: { limit: 20 },
			sessionId: "session_authorization_admin_a",
		});
		expect(roles.items.map((role) => role.id)).toEqual([
			"role_authorization_admin_a",
			"role_authorization_cashier_a",
		]);

		const command = {
			actorUserId: "user_authorization_admin_a",
			body: {
				membershipId: "membership_authorization_target_a",
				roleId: "role_authorization_cashier_a",
				scopeType: "Tenant" as const,
				startsAt: "2026-07-14T12:00:00.000Z",
			},
			contextId: context.contextId,
			correlationId: "correlation_authorization_assignment_a",
			idempotencyKey: "idempotency_authorization_assignment_a",
			sessionId: "session_authorization_admin_a",
		};
		let crossTenantError: unknown;
		try {
			await application.createRoleAssignment({
				...command,
				body: {
					...command.body,
					membershipId: "membership_authorization_admin_b",
					roleId: "role_authorization_admin_b",
				},
				idempotencyKey: "idempotency_authorization_cross_tenant",
			});
		} catch (error) {
			crossTenantError = error;
		}
		expect(crossTenantError).toMatchObject({ code: "not_found" });

		await service.suspendMembership({
			actorUserId: "user_authorization_admin_a",
			correlationId: "correlation_authorization_suspend_a",
			idempotencyKey: "idempotency_authorization_suspend_a",
			membershipId: "membership_authorization_admin_a",
			reason: "current-authority invalidation proof",
			revokeSessionsWhenNoActiveMembershipsRemain: true,
			targetAuthUserId: "user_authorization_admin_a",
			tenantId: "tenant_authorization_a",
			version: 1,
		});
		expect(
			await authorization.decide({
				assuranceLevel: "aal1",
				authUserId: "user_authorization_admin_a",
				contextId: context.contextId,
				permission: "platform.role.read",
				sessionId: "session_authorization_admin_a",
			})
		).toEqual({ outcome: "deny", reason: "assignment_inactive" });

		const serviceCommand = {
			actorUserId: command.actorUserId,
			body: {
				...command.body,
				startsAt: new Date(command.body.startsAt),
			},
			correlationId: command.correlationId,
			idempotencyKey: command.idempotencyKey,
			tenantId: "tenant_authorization_a",
		};
		const [first, replayed] = await Promise.all([
			service.grantRoleAssignment(serviceCommand),
			service.grantRoleAssignment(serviceCommand),
		]);
		expect(replayed.id).toBe(first.id);
		const stored = await repository.listRoleAssignments(
			"tenant_authorization_a",
			"membership_authorization_target_a"
		);
		expect(stored).toHaveLength(1);
		const authorizationEvents = await testPool.query<{
			data: Record<string, unknown>;
		}>(
			"SELECT data FROM platform_event_outbox WHERE tenant_id = 'tenant_authorization_a' AND name = 'platform.role-assignment.granted.v1' AND idempotency_key = 'idempotency_authorization_assignment_a'"
		);
		expect(authorizationEvents.rows).toHaveLength(1);
		expect(authorizationEvents.rows[0]?.data).not.toHaveProperty(
			"permissionIds"
		);
	});

	test("persists tenant-isolated Party onboarding, reconciliation, and atomic events", async () => {
		const tenancyRepository = createTenancyRepository(testPool);
		await tenancyRepository.seed({
			locations: [],
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
					name: "Demerara Party Test Organization",
					state: "Active",
					tenantId: "tenant_demerara",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_demerara",
				name: "Demerara Party Test Tenant",
				state: "Active",
				version: 1,
			},
		});
		await tenancyRepository.seed({
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
					name: "Essequibo Party Test Organization",
					state: "Active",
					tenantId: "tenant_essequibo",
					timezone: "America/Guyana",
					version: 1,
				},
			],
			tenant: {
				id: "tenant_essequibo",
				name: "Essequibo Party Test Tenant",
				state: "Active",
				version: 1,
			},
		});
		let sequence = 0;
		const ids: PartyIdFactory = {
			create(kind) {
				sequence += 1;
				return `${kind}_party_integration_${sequence}`;
			},
		};
		const service = createPartyService({
			clock: () => new Date("2026-07-14T01:00:00.000Z"),
			ids,
			membershipAuthority: {
				async requireActiveMembership(input) {
					const membership = await createTenancyRepository(
						testPool
					).getMembership(input.tenantId, input.membershipId);
					if (
						membership?.state !== "Active" ||
						membership.authUserId !== input.authUserId ||
						membership.organizationId !== input.organizationId
					) {
						throw Object.assign(new Error("membership denied"), {
							code: "wrong_tenant",
						});
					}
				},
			},
			unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
				events: createPostgresOutbox(client),
				repository: createPartyRepository(client),
			})),
		});

		const person = await service.createPerson({
			actorUserId: "user_multitenant",
			body: {
				displayName: "Georgetown Test Person",
				email: "georgetown.person@example.test",
			},
			correlationId: "correlation_party_integration_0001",
			idempotencyKey: "party-person-integration-0001",
			organizationId: "organization_demerara",
			tenantId: "tenant_demerara",
		});
		const organization = await service.createOrganization({
			actorUserId: "user_essequibo_admin",
			body: {
				displayName: "Essequibo Retail Demo",
				registeredName: "Essequibo Retail Demo Inc.",
			},
			correlationId: "correlation_party_integration_0002",
			idempotencyKey: "party-organization-integration-0001",
			organizationId: "organization_essequibo",
			tenantId: "tenant_essequibo",
		});
		expect(person.classification).toBe("Confidential");
		expect(organization.tenantId).toBe("tenant_essequibo");

		const repository = createPartyRepository(testPool);
		expect(await repository.getParty("tenant_essequibo", person.id)).toBeNull();
		expect(
			await repository.getParty("tenant_demerara", organization.id)
		).toBeNull();
		expect(
			(
				await repository.listParties("tenant_demerara", { limit: 20 })
			).items.map((party) => party.id)
		).toEqual([person.id]);

		const link = await service.createIdentityLink({
			actorUserId: "user_multitenant",
			body: {
				authUserId: "user_multitenant",
				membershipId: "membership_demerara",
				partyId: person.id,
			},
			correlationId: "correlation_party_integration_0003",
			idempotencyKey: "party-link-integration-0001",
			organizationId: "organization_demerara",
			tenantId: "tenant_demerara",
		});
		expect(link.partyId).toBe(person.id);
		expect(
			await service.createIdentityLink({
				actorUserId: "user_multitenant",
				body: {
					authUserId: "user_multitenant",
					membershipId: "membership_demerara",
					partyId: person.id,
				},
				correlationId: "correlation_party_integration_replay",
				idempotencyKey: "party-link-integration-0001",
				organizationId: "organization_demerara",
				tenantId: "tenant_demerara",
			})
		).toEqual(link);

		const eventRows = await testPool.query<{
			data: Record<string, unknown>;
			name: string;
		}>(
			"SELECT name, data FROM platform_event_outbox WHERE producer_namespace = 'party' ORDER BY name"
		);
		expect(eventRows.rows.map((row) => row.name)).toEqual([
			"party.identity-link.created.v1",
			"party.organization.created.v1",
			"party.person.created.v1",
		]);
		expect(JSON.stringify(eventRows.rows)).not.toContain(
			"georgetown.person@example.test"
		);
		const concurrentCommand = {
			actorUserId: "user_multitenant",
			body: { displayName: "Concurrent Idempotent Party" },
			correlationId: "correlation_party_concurrent",
			idempotencyKey: "party-person-concurrent-0001",
			organizationId: "organization_demerara",
			tenantId: "tenant_demerara",
		};
		const [concurrentFirst, concurrentSecond] = await Promise.all([
			service.createPerson(concurrentCommand),
			service.createPerson(concurrentCommand),
		]);
		expect(concurrentSecond.id).toBe(concurrentFirst.id);
		const concurrentRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM party_record WHERE tenant_id = 'tenant_demerara' AND display_name = 'Concurrent Idempotent Party'"
		);
		expect(concurrentRows.rows[0]?.count).toBe("1");
		const concurrentEvents = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM platform_event_outbox WHERE tenant_id = 'tenant_demerara' AND name = 'party.person.created.v1' AND idempotency_key = 'party-person-concurrent-0001'"
		);
		expect(concurrentEvents.rows[0]?.count).toBe("1");

		const rollbackUnitOfWork = createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createPartyRepository(client),
		}));
		let partyRollbackError: unknown;
		try {
			await rollbackUnitOfWork.execute(
				async ({ events, repository: transactionRepository }) => {
					const now = new Date("2026-07-14T01:05:00.000Z");
					await transactionRepository.createPerson({
						contacts: [],
						detail: {
							partyId: "party_forced_rollback",
							tenantId: "tenant_demerara",
						},
						party: {
							classification: "Confidential",
							createdAt: now,
							displayName: "Rolled Back Party",
							id: "party_forced_rollback",
							privacyState: "Normal",
							provenance: "Manual",
							state: "Active",
							tenantId: "tenant_demerara",
							type: "Person",
							updatedAt: now,
							version: 1,
						},
					});
					await events.append({
						...event("evt_party_forced_rollback"),
						aggregateId: "party_forced_rollback",
						capabilityId: "party.records",
						data: { partyId: "party_forced_rollback" },
						name: "party.person.created.v1",
						producerNamespace: "party",
						schemaRef: "schemas/events/party.person.created.v1.schema.json",
						tenantId: "tenant_demerara",
					});
					throw new Error("forced Party transaction rollback");
				}
			);
		} catch (error) {
			partyRollbackError = error;
		}
		expect((partyRollbackError as Error).message).toBe(
			"forced Party transaction rollback"
		);
		expect(
			await repository.getParty("tenant_demerara", "party_forced_rollback")
		).toBeNull();
		expect(
			(
				await testPool.query<{ id: string }>(
					"SELECT id FROM platform_event_outbox WHERE id = 'evt_party_forced_rollback'"
				)
			).rows
		).toHaveLength(0);
		expect(
			(await repository.listParties("tenant_demerara", { limit: 20 })).items
		).toHaveLength(2);
	}, 30_000);

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
		expect(
			(
				await repository.listOrganizations(
					"user_multitenant",
					"tenant_demerara",
					{ limit: 20 }
				)
			).items.map((organization) => organization.id)
		).toEqual(["organization_demerara"]);
		expect(
			await repository.listOrganizations(
				"user_multitenant",
				"tenant_essequibo",
				{ limit: 20 }
			)
		).toEqual({ items: [], nextCursor: null });
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

	test("enforces tenant-isolated entitlements through the governed command", async () => {
		let sequence = 0;
		const ids = {
			create(kind: "change" | "entitlement" | "event") {
				sequence += 1;
				return `${kind}_integration_${sequence.toString().padStart(4, "0")}`;
			},
		};
		const unitOfWork = createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createEntitlementRepository(client),
		}));
		const service = createEntitlementService({
			clock: () => new Date("2026-07-14T12:00:00.000Z"),
			ids,
			unitOfWork,
		});
		const created = await service.change({
			actorId: "user_entitlement_admin",
			capabilityId: "platform.entitlements",
			correlationId: "correlation_entitlement_0001",
			endsAt: new Date("2026-08-14T12:00:00.000Z"),
			idempotencyKey: "entitlement-change-idempotency-0001",
			limits: { organizations: 2 },
			reason: "Time-bounded controlled prototype grant",
			source: "ManualGrant",
			startsAt: new Date("2026-07-14T00:00:00.000Z"),
			state: "Active",
			tenantId: "tenant_entitlement_a",
		});
		const replay = await service.change({
			actorId: "user_entitlement_admin",
			capabilityId: "platform.entitlements",
			correlationId: "correlation_entitlement_0001",
			endsAt: new Date("2026-08-14T12:00:00.000Z"),
			idempotencyKey: "entitlement-change-idempotency-0001",
			limits: { organizations: 2 },
			reason: "Time-bounded controlled prototype grant",
			source: "ManualGrant",
			startsAt: new Date("2026-07-14T00:00:00.000Z"),
			state: "Active",
			tenantId: "tenant_entitlement_a",
		});
		expect(replay).toEqual(created);

		const evaluator = createEntitlementEvaluator({
			clock: () => new Date("2026-07-14T12:00:00.000Z"),
			state: {
				load: (input) =>
					createEntitlementRepository(testPool).listCurrent(input),
			},
		});
		expect(
			await evaluator.decide({
				access: "Write",
				capabilityId: "platform.entitlements",
				projectedUsage: { organizations: 2 },
				tenantId: "tenant_entitlement_a",
			})
		).toMatchObject({ outcome: "allow" });
		expect(
			await evaluator.decide({
				access: "Read",
				capabilityId: "platform.entitlements",
				tenantId: "tenant_entitlement_b",
			})
		).toEqual({
			capabilityId: "platform.entitlements",
			outcome: "deny",
			reason: "not_entitled",
		});
		expect(
			await evaluator.decide({
				access: "Write",
				capabilityId: "platform.entitlements",
				projectedUsage: { organizations: 3 },
				tenantId: "tenant_entitlement_a",
			})
		).toMatchObject({ outcome: "deny", reason: "limit_reached" });

		const rollbackUnitOfWork = createPostgresUnitOfWork(testPool, (client) => ({
			events: {
				append() {
					return Promise.reject(new Error("entitlement outbox rollback proof"));
				},
			},
			repository: createEntitlementRepository(client),
		}));
		const rollbackService = createEntitlementService({
			clock: () => new Date("2026-07-14T12:00:00.000Z"),
			ids,
			unitOfWork: rollbackUnitOfWork,
		});
		let rollbackFailure: unknown;
		try {
			await rollbackService.change({
				actorId: "user_entitlement_admin",
				capabilityId: "platform.authorization",
				correlationId: "correlation_entitlement_rollback",
				idempotencyKey: "entitlement-change-rollback-0001",
				reason: "Rollback test",
				source: "Migration",
				startsAt: new Date("2026-07-14T00:00:00.000Z"),
				state: "Active",
				tenantId: "tenant_entitlement_a",
			});
		} catch (error) {
			rollbackFailure = error;
		}
		expect((rollbackFailure as Error).message).toBe(
			"entitlement outbox rollback proof"
		);
		expect(
			await createEntitlementRepository(testPool).getByScope({
				capabilityId: "platform.authorization",
				tenantId: "tenant_entitlement_a",
			})
		).toBeNull();
		const rollbackArtifacts = await testPool.query<{
			changes: number;
			outbox: number;
			receipts: number;
		}>(
			"SELECT (SELECT count(*)::int FROM platform_entitlement_change WHERE tenant_id = 'tenant_entitlement_a' AND entitlement_id LIKE 'entitlement_integration_%' AND snapshot->>'capabilityId' = 'platform.authorization') AS changes, (SELECT count(*)::int FROM platform_event_outbox WHERE idempotency_key = 'entitlement-change-rollback-0001') AS outbox, (SELECT count(*)::int FROM platform_entitlement_command_receipt WHERE tenant_id = 'tenant_entitlement_a' AND idempotency_key = 'entitlement-change-rollback-0001') AS receipts"
		);
		expect(rollbackArtifacts.rows[0]).toEqual({
			changes: 0,
			outbox: 0,
			receipts: 0,
		});
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
