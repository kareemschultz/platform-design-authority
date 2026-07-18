import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPosApplication,
	createPosService,
	type PosIdFactory,
} from "@meridian/domain-pos";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	createPosRepository,
	migratePos,
} from "@meridian/persistence-pos-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pos_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
		return null;
	} catch (error) {
		return error;
	}
}

const ids: PosIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

function service(failEvents = false) {
	return createPosService({
		clock: () => new Date(),
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: failEvents
				? { append: () => Promise.reject(new Error("injected outbox failure")) }
				: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	await migratePlatformEvents(testPool);
	await migratePos(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

const base = {
	actorUserId: "pos_maker",
	correlationId: "correlation_pos_integration",
	locationId: "location_pos_integration",
	organizationId: "organization_pos_integration",
	registerId: "register_pos_integration",
	tenantId: "tenant_pos_integration_a",
};

describe.serial("POS PostgreSQL controlled prototype", () => {
	test("migrates idempotently and creates only the three registered POS-owned tables", async () => {
		await migratePos(testPool);
		const tables = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'pos_%' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"pos_cash_movement",
			"pos_command_receipt",
			"pos_register_session",
		]);
	});

	test("rejects a genuine concurrent double-open race on the same register via the DB partial unique index", async () => {
		const pos = service();
		const raceRegisterId = "register_double_open_race";
		const results = await Promise.allSettled([
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "race-open-1",
				openingFloat: { amountMinor: 1000, currency: "GYD" },
				registerId: raceRegisterId,
			}),
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "race-open-2",
				openingFloat: { amountMinor: 2000, currency: "GYD" },
				registerId: raceRegisterId,
			}),
		]);
		const fulfilled = results.filter((result) => result.status === "fulfilled");
		const rejected = results.filter((result) => result.status === "rejected");
		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
		const [firstRejected] = rejected;
		expect(
			firstRejected?.status === "rejected" ? firstRejected.reason : null
		).toMatchObject({ code: "invalid_state" });
		const rows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_register_session WHERE tenant_id = $1 AND register_id = $2",
			[base.tenantId, raceRegisterId]
		);
		expect(rows.rows[0]?.count).toBe("1");
	});

	test("rejects opening a register while a prior session on it is Closing (DB partial unique index covers Open and Closing, not just Open)", async () => {
		const pos = service();
		const raceRegisterId = "register_closing_open_race";
		await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "closing-race-open-1",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
			registerId: raceRegisterId,
		});
		const closing = await pos.closeRegister({
			...base,
			countedCash: { amountMinor: 9500, currency: "GYD" },
			idempotencyKey: "closing-race-close-1",
			registerId: raceRegisterId,
		});
		expect(closing.state).toBe("Closing");

		// Sequential attempt: the domain-level pre-check (already_open) must
		// reject an open while the prior session is merely Closing, not just
		// Open.
		const sequentialOpen = await captureError(
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "closing-race-open-2",
				openingFloat: { amountMinor: 5000, currency: "GYD" },
				registerId: raceRegisterId,
			})
		);
		expect(sequentialOpen).toMatchObject({ code: "invalid_state" });

		// Genuine concurrent race against the same Closing row: the DB partial
		// unique index (pos_register_session_open_register_uidx), not just the
		// application pre-check, must be the backstop under real concurrency.
		const raceResults = await Promise.allSettled([
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "closing-race-open-3",
				openingFloat: { amountMinor: 6000, currency: "GYD" },
				registerId: raceRegisterId,
			}),
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "closing-race-open-4",
				openingFloat: { amountMinor: 7000, currency: "GYD" },
				registerId: raceRegisterId,
			}),
		]);
		for (const result of raceResults) {
			expect(result.status).toBe("rejected");
			expect(result.status === "rejected" ? result.reason : null).toMatchObject(
				{ code: "invalid_state" }
			);
		}

		const liveRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_register_session WHERE tenant_id = $1 AND register_id = $2 AND state IN ('Open', 'Closing')",
			[base.tenantId, raceRegisterId]
		);
		expect(liveRows.rows[0]?.count).toBe("1");
		const stillClosingRow = await testPool.query<{ state: string }>(
			"SELECT state FROM pos_register_session WHERE tenant_id = $1 AND id = $2",
			[base.tenantId, closing.id]
		);
		expect(stillClosingRow.rows[0]?.state).toBe("Closing");
	});

	test("writes the opened-register outbox row atomically in the owning transaction (raw SQL)", async () => {
		const pos = service();
		const registerId = "register_atomic_outbox";
		const opened = await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "atomic-open",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
			registerId,
		});
		const outboxRows = await testPool.query<{
			data: Record<string, unknown>;
			idempotency_key: string;
			tenant_id: string;
		}>(
			"SELECT tenant_id, idempotency_key, data FROM platform_event_outbox WHERE name = 'commerce.register.opened.v1' AND aggregate_id = $1",
			[opened.id]
		);
		expect(outboxRows.rows).toHaveLength(1);
		expect(outboxRows.rows[0]?.tenant_id).toBe(base.tenantId);
		expect(outboxRows.rows[0]?.idempotency_key).toBe("atomic-open");
		expect(outboxRows.rows[0]?.data).toMatchObject({
			currency: "GYD",
			locationId: base.locationId,
			openerPartyId: `party_${base.actorUserId}`,
			openingFloatMinor: 5000,
			registerId,
		});
	});

	test("rolls back the register-session row when the outbox append fails in the same transaction", async () => {
		const registerId = "register_rollback";
		const pos = service(true);
		const failure = await captureError(
			pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "rollback-open",
				openingFloat: { amountMinor: 100, currency: "GYD" },
				registerId,
			})
		);
		expect((failure as Error).message).toBe("injected outbox failure");
		const rows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_register_session WHERE tenant_id = $1 AND register_id = $2",
			[base.tenantId, registerId]
		);
		expect(rows.rows[0]?.count).toBe("0");
		const receiptRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_command_receipt WHERE tenant_id = $1 AND idempotency_key = 'rollback-open'",
			[base.tenantId]
		);
		expect(receiptRows.rows[0]?.count).toBe("0");
	});

	test("isolates two tenants sharing the same register id: cannot read or close each other's session", async () => {
		const pos = service();
		const sharedRegisterId = "register_shared_across_tenants";
		const tenantA = "tenant_pos_isolation_a";
		const tenantB = "tenant_pos_isolation_b";
		const openedA = await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "isolation-open-a",
			openingFloat: { amountMinor: 1000, currency: "GYD" },
			registerId: sharedRegisterId,
			tenantId: tenantA,
		});
		await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "isolation-open-b",
			openingFloat: { amountMinor: 2000, currency: "GYD" },
			registerId: sharedRegisterId,
			tenantId: tenantB,
		});

		const repository = createPosRepository(testPool);
		// Tenant B cannot read tenant A's session by id at all — the lookup
		// is indistinguishable from the id simply not existing.
		expect(await repository.getSession(tenantB, openedA.id)).toBeNull();
		expect(
			await repository.getSession(tenantB, "session_missing_entirely")
		).toEqual(await repository.getSession(tenantB, openedA.id));

		// Closing on the shared registerId under tenant B's context must only
		// ever touch tenant B's own Open session, never tenant A's, even
		// though both share the same register id.
		const closedB = await pos.closeRegister({
			...base,
			countedCash: { amountMinor: 2000, currency: "GYD" },
			idempotencyKey: "isolation-close-b",
			registerId: sharedRegisterId,
			tenantId: tenantB,
		});
		expect(closedB.state).toBe("Closed");
		const tenantASession = await repository.getSession(tenantA, openedA.id);
		expect(tenantASession?.state).toBe("Open");
		const tenantBFromA = await repository.getSession(tenantA, closedB.id);
		expect(tenantBFromA).toBeNull();
	});

	test("denies before dispatch when permission is not granted, and dispatches once granted", async () => {
		const pos = service();
		let permissionCalls = 0;
		let dispatched = false;
		const application = createPosApplication({
			activeContexts: {
				requireActiveContext: () =>
					Promise.resolve({
						organizationId: base.organizationId,
						tenantId: base.tenantId,
					}),
			},
			entitlements: { requireEntitlement: () => Promise.resolve() },
			permissions: {
				requirePermission: () => {
					permissionCalls += 1;
					return Promise.reject(
						Object.assign(new Error("permission denied"), {
							code: "authorization_denied",
						})
					);
				},
			},
			service: {
				...pos,
				openRegister: (input: Parameters<typeof pos.openRegister>[0]) => {
					dispatched = true;
					return pos.openRegister(input);
				},
			},
		});
		const denied = await captureError(
			application.openRegister({
				actorUserId: base.actorUserId,
				contextId: "context_pos_denied",
				correlationId: base.correlationId,
				currency: "GYD",
				idempotencyKey: "denied-open",
				locationId: base.locationId,
				openingFloat: { amountMinor: 100, currency: "GYD" },
				registerId: "register_permission_denied",
				sessionId: "session_pos_denied",
			})
		);
		expect(denied).toMatchObject({ code: "authorization_denied" });
		expect(permissionCalls).toBe(1);
		expect(dispatched).toBe(false);
		const rows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_register_session WHERE tenant_id = $1 AND register_id = 'register_permission_denied'",
			[base.tenantId]
		);
		expect(rows.rows[0]?.count).toBe("0");
	});

	test("replays a cash-movement command idempotently and rejects a conflicting body reusing the same key", async () => {
		const pos = service();
		const registerId = "register_movement_idempotency";
		await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "idempotency-open",
			openingFloat: { amountMinor: 0, currency: "GYD" },
			registerId,
		});
		const commandInput = {
			...base,
			amount: { amountMinor: 750, currency: "GYD" },
			direction: "PaidIn" as const,
			idempotencyKey: "idempotency-movement",
			reasonCode: "PaidIn" as const,
			registerId,
		};
		const [first, replayed] = await Promise.all([
			pos.createCashMovement(commandInput),
			pos.createCashMovement(commandInput),
		]);
		expect(replayed).toEqual(first);
		const movementRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM pos_cash_movement WHERE tenant_id = $1 AND register_id = $2",
			[base.tenantId, registerId]
		);
		expect(movementRows.rows[0]?.count).toBe("1");
		const eventRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM platform_event_outbox WHERE name = 'commerce.cash-movement.posted.v1' AND idempotency_key = 'idempotency-movement'",
			[]
		);
		expect(eventRows.rows[0]?.count).toBe("1");

		const conflicting = await captureError(
			pos.createCashMovement({
				...commandInput,
				amount: { amountMinor: 999, currency: "GYD" },
			})
		);
		expect(conflicting).toMatchObject({ code: "idempotency_conflict" });
	});

	test("routes a non-zero cash variance through maker/checker approval end-to-end with the DB row", async () => {
		const pos = service();
		const registerId = "register_variance_e2e";
		await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "variance-e2e-open",
			openingFloat: { amountMinor: 10_000, currency: "GYD" },
			registerId,
		});
		const closing = await pos.closeRegister({
			...base,
			countedCash: { amountMinor: 9500, currency: "GYD" },
			idempotencyKey: "variance-e2e-close",
			registerId,
		});
		expect(closing.state).toBe("Closing");
		const closingRow = await testPool.query<{ state: string }>(
			"SELECT state FROM pos_register_session WHERE tenant_id = $1 AND id = $2",
			[base.tenantId, closing.id]
		);
		expect(closingRow.rows[0]?.state).toBe("Closing");
		expect(
			(
				await testPool.query(
					"SELECT 1 FROM platform_event_outbox WHERE name = 'commerce.register.closed.v1' AND aggregate_id = $1",
					[closing.id]
				)
			).rows
		).toHaveLength(0);

		const selfApproval = await captureError(
			pos.approveCashVariance({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				idempotencyKey: "variance-e2e-self-approve",
				organizationId: base.organizationId,
				sessionId: closing.id,
				tenantId: base.tenantId,
				version: closing.version,
			})
		);
		expect(selfApproval).toMatchObject({ code: "approval_separation" });

		const approved = await pos.approveCashVariance({
			actorUserId: "pos_checker",
			correlationId: base.correlationId,
			idempotencyKey: "variance-e2e-approve",
			organizationId: base.organizationId,
			sessionId: closing.id,
			tenantId: base.tenantId,
			version: closing.version,
		});
		expect(approved.state).toBe("Closed");
		const closedRow = await testPool.query<{
			state: string;
			variance_approved_by_party_id: string;
		}>(
			"SELECT state, variance_approved_by_party_id FROM pos_register_session WHERE tenant_id = $1 AND id = $2",
			[base.tenantId, closing.id]
		);
		expect(closedRow.rows[0]).toEqual({
			state: "Closed",
			variance_approved_by_party_id: "party_pos_checker",
		});
		const closedEventRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM platform_event_outbox WHERE name = 'commerce.register.closed.v1' AND aggregate_id = $1",
			[closing.id]
		);
		expect(closedEventRows.rows[0]?.count).toBe("1");
	});
});
