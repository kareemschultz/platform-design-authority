import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createPosApplication,
	createPosService,
	type PosIdFactory,
} from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { migratePlatformNumbering } from "@meridian/persistence-platform-numbering-postgres";
import {
	createPosRepository,
	migratePos,
} from "@meridian/persistence-pos-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import { createDepositReferenceAllocator } from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

/**
 * WS3 PR4's own isolated-per-file database (frozen control plan §9 lane-
 * command table: "PR4 live-PG lane ... same isolated-database pattern"),
 * mirroring `returns.integration.test.ts`'s `CREATE DATABASE`/`migrate*`
 * pattern exactly. Deposit-only lane — export coverage lives in
 * `finance-handoff.integration.test.ts`, its own separate database.
 */
const databaseName = `meridian_deposits_${crypto.randomUUID().replaceAll("-", "")}`;
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

const depositsBase = {
	actorUserId: "deposits_preparer",
	correlationId: "correlation_pos_deposits",
	organizationId: "organization_pos_deposits",
};

/**
 * A REAL POS service wired to the real `depositUnitOfWork` (organization-
 * scoped deposit-reference allocation, frozen control plan §6.6) and the
 * plain `unitOfWork` (confirm/queries). `saleUnitOfWork`/`returnUnitOfWork`
 * are structural stubs never invoked by this lane — deposits draw safe
 * custody from `SafeDrop` cash movements posted through `createCashMovement`
 * (PR1), not from sales.
 */
function posService() {
	return createPosService({
		clock: () => new Date(),
		depositUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			numbering: createDepositReferenceAllocator(client),
			repository: createPosRepository(client),
		})),
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		pricing: createPricingEngine(),
		products: {
			requireProduct: () =>
				Promise.reject(
					new Error("products port is not exercised by the PR4 deposit lane")
				),
		},
		returnUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("returnUnitOfWork is not exercised by the PR4 deposit lane")
				),
		},
		saleUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("saleUnitOfWork is not exercised by the PR4 deposit lane")
				),
		},
		tax: createTaxEngine(),
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});
}

function posApplication(pos: ReturnType<typeof posService>) {
	return createPosApplication({
		activeContexts: {
			requireActiveContext: () =>
				Promise.resolve({
					organizationId: depositsBase.organizationId,
					tenantId: "tenant_deposits_app",
				}),
		},
		entitlements: { requireEntitlement: () => Promise.resolve() },
		permissions: { requirePermission: () => Promise.resolve() },
		service: pos,
	});
}

/** Opens a register and posts one SafeDrop cash movement of `amountMinor`,
 * returning the session id the deposit's `sourceShiftIds` names. */
async function openRegisterAndSafeDrop(
	pos: ReturnType<typeof posService>,
	registerId: string,
	tenantId: string,
	amountMinor: number
): Promise<string> {
	await pos.openRegister({
		actorUserId: depositsBase.actorUserId,
		correlationId: depositsBase.correlationId,
		currency: "GYD",
		idempotencyKey: `open_${registerId}`,
		locationId: `location_${registerId}`,
		openingFloat: { amountMinor: 500_000, currency: "GYD" },
		organizationId: depositsBase.organizationId,
		registerId,
		tenantId,
	});
	const movement = await pos.createCashMovement({
		actorUserId: depositsBase.actorUserId,
		amount: { amountMinor, currency: "GYD" },
		correlationId: depositsBase.correlationId,
		direction: "PaidOut",
		idempotencyKey: `safedrop_${registerId}`,
		organizationId: depositsBase.organizationId,
		reasonCode: "SafeDrop",
		registerId,
		tenantId,
	});
	return movement.sessionId;
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	await migratePlatformEvents(testPool);
	await migratePlatformNumbering(testPool);
	await migratePos(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial(
	"WS3 PR4 deposit (prepare/confirm) PostgreSQL controlled prototype",
	() => {
		test("migrates idempotently and adds exactly the three PR4-owned tables to PR1-PR3's ten", async () => {
			await migratePos(testPool);
			const tables = await testPool.query<{ table_name: string }>(
				"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'pos_%' ORDER BY table_name"
			);
			expect(tables.rows.map((row) => row.table_name)).toEqual([
				"pos_cash_movement",
				"pos_command_receipt",
				"pos_deposit",
				"pos_deposit_custody_transfer",
				"pos_deposit_source_shift",
				"pos_price_override",
				"pos_receipt",
				"pos_refund",
				"pos_register_session",
				"pos_return",
				"pos_return_line",
				"pos_sale",
				"pos_sale_line",
			]);
		});

		test("prepares a deposit with NO custody-transfer row (effect-free preparation, raw SQL)", async () => {
			const tenantId = "tenant_deposits_effect_free";
			const registerId = "register_deposits_effect_free";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				100_000
			);
			const prepared = await pos.createDeposit({
				actorUserId: depositsBase.actorUserId,
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 100_000,
				currency: "GYD",
				idempotencyKey: "effect-free-create",
				organizationId: depositsBase.organizationId,
				sourceShiftIds: [sessionId],
				tenantId,
			});
			expect(prepared.state).toBe("Prepared");

			const depositRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_deposit WHERE tenant_id = $1 AND id = $2",
				[tenantId, prepared.id]
			);
			expect(depositRow.rows).toHaveLength(1);
			expect(depositRow.rows[0]?.state).toBe("Prepared");

			const transferRows = await testPool.query(
				"SELECT id FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRows.rows).toHaveLength(0);
		});

		test("posts exactly one custody-transfer row on confirm, atomic with the state transition", async () => {
			const tenantId = "tenant_deposits_confirm_atomic";
			const registerId = "register_deposits_confirm_atomic";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				50_000
			);
			const prepared = await pos.createDeposit({
				actorUserId: depositsBase.actorUserId,
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 50_000,
				currency: "GYD",
				idempotencyKey: "confirm-atomic-create",
				organizationId: depositsBase.organizationId,
				sourceShiftIds: [sessionId],
				tenantId,
			});
			const confirmed = await pos.confirmDeposit({
				actorUserId: "deposits_confirmer",
				correlationId: depositsBase.correlationId,
				depositId: prepared.id,
				idempotencyKey: "confirm-atomic-confirm",
				organizationId: depositsBase.organizationId,
				tenantId,
			});
			expect(confirmed.state).toBe("Reconciled");

			const transferRows = await testPool.query<{ amount_minor: string }>(
				"SELECT amount_minor FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRows.rows).toHaveLength(1);
			expect(Number(transferRows.rows[0]?.amount_minor)).toBe(50_000);

			const outboxRows = await testPool.query(
				"SELECT id FROM platform_event_outbox WHERE tenant_id = $1 AND name = 'commerce.deposit.reconciled.v1' AND aggregate_id = $2",
				[tenantId, prepared.id]
			);
			expect(outboxRows.rows).toHaveLength(1);
		});

		test("concurrent double-confirm of the same deposit: exactly one posts (round-3 P1-4)", async () => {
			const tenantId = "tenant_deposits_double_confirm";
			const registerId = "register_deposits_double_confirm";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				40_000
			);
			const prepared = await pos.createDeposit({
				actorUserId: depositsBase.actorUserId,
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 40_000,
				currency: "GYD",
				idempotencyKey: "double-confirm-create",
				organizationId: depositsBase.organizationId,
				sourceShiftIds: [sessionId],
				tenantId,
			});

			const [first, second] = await Promise.all([
				captureError(
					pos.confirmDeposit({
						actorUserId: "confirmer_a",
						correlationId: depositsBase.correlationId,
						depositId: prepared.id,
						idempotencyKey: "double-confirm-a",
						organizationId: depositsBase.organizationId,
						tenantId,
					})
				),
				captureError(
					pos.confirmDeposit({
						actorUserId: "confirmer_b",
						correlationId: depositsBase.correlationId,
						depositId: prepared.id,
						idempotencyKey: "double-confirm-b",
						organizationId: depositsBase.organizationId,
						tenantId,
					})
				),
			]);
			const outcomes = [first, second];
			const successes = outcomes.filter((outcome) => outcome === null);
			const failures = outcomes.filter((outcome) => outcome !== null);
			expect(successes).toHaveLength(1);
			expect(failures).toHaveLength(1);
			expect(failures[0]).toMatchObject({ code: "invalid_state" });

			const transferRows = await testPool.query(
				"SELECT id FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRows.rows).toHaveLength(1);
		});

		test("concurrent preparations over-reserving the same safe balance: the cumulative cap holds (round-3 P1-4)", async () => {
			const tenantId = "tenant_deposits_over_reserve";
			const registerId = "register_deposits_over_reserve";
			const pos = posService();
			// Exactly 100,000 minor available; two concurrent 60,000 requests
			// against the SAME session sum to 120,000 -- strictly more than
			// available, so at most one may succeed.
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				100_000
			);

			const [first, second] = await Promise.all([
				captureError(
					pos.createDeposit({
						actorUserId: depositsBase.actorUserId,
						correlationId: depositsBase.correlationId,
						countedAmountMinor: 60_000,
						currency: "GYD",
						idempotencyKey: "over-reserve-a",
						organizationId: depositsBase.organizationId,
						sourceShiftIds: [sessionId],
						tenantId,
					})
				),
				captureError(
					pos.createDeposit({
						actorUserId: depositsBase.actorUserId,
						correlationId: depositsBase.correlationId,
						countedAmountMinor: 60_000,
						currency: "GYD",
						idempotencyKey: "over-reserve-b",
						organizationId: depositsBase.organizationId,
						sourceShiftIds: [sessionId],
						tenantId,
					})
				),
			]);
			const outcomes = [first, second];
			const successes = outcomes.filter((outcome) => outcome === null);
			expect(successes.length).toBeLessThanOrEqual(1);

			const reservedRows = await testPool.query<{ total: string }>(
				"SELECT coalesce(sum(amount_minor), 0)::text AS total FROM pos_deposit WHERE tenant_id = $1 AND state IN ('Prepared', 'Reconciled')",
				[tenantId]
			);
			expect(Number(reservedRows.rows[0]?.total ?? "0")).toBeLessThanOrEqual(
				100_000
			);
		});

		test("idempotency-key replay on prepare returns the identical deposit, inserting no second row", async () => {
			const tenantId = "tenant_deposits_replay_prepare";
			const registerId = "register_deposits_replay_prepare";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				30_000
			);
			const input = {
				actorUserId: depositsBase.actorUserId,
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 30_000,
				currency: "GYD",
				idempotencyKey: "replay-prepare-key",
				organizationId: depositsBase.organizationId,
				sourceShiftIds: [sessionId],
				tenantId,
			};
			const first = await pos.createDeposit(input);
			const replayed = await pos.createDeposit(input);
			expect(replayed).toEqual(first);

			const rows = await testPool.query(
				"SELECT id FROM pos_deposit WHERE tenant_id = $1 AND organization_id = $2",
				[tenantId, depositsBase.organizationId]
			);
			expect(rows.rows).toHaveLength(1);
		});

		test("idempotency-key replay on confirm returns the identical result, posting no second custody transfer", async () => {
			const tenantId = "tenant_deposits_replay_confirm";
			const registerId = "register_deposits_replay_confirm";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				25_000
			);
			const prepared = await pos.createDeposit({
				actorUserId: depositsBase.actorUserId,
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 25_000,
				currency: "GYD",
				idempotencyKey: "replay-confirm-create",
				organizationId: depositsBase.organizationId,
				sourceShiftIds: [sessionId],
				tenantId,
			});
			const confirmInput = {
				actorUserId: "deposits_confirmer_replay",
				correlationId: depositsBase.correlationId,
				depositId: prepared.id,
				idempotencyKey: "replay-confirm-key",
				organizationId: depositsBase.organizationId,
				tenantId,
			};
			const first = await pos.confirmDeposit(confirmInput);
			const replayed = await pos.confirmDeposit(confirmInput);
			expect(replayed).toEqual(first);

			const transferRows = await testPool.query(
				"SELECT id FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRows.rows).toHaveLength(1);
		});

		test("rejects a deposit that exceeds available safe custody (live-PG custody conservation)", async () => {
			const tenantId = "tenant_deposits_custody_conservation";
			const registerId = "register_deposits_custody_conservation";
			const pos = posService();
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				tenantId,
				10_000
			);
			// Explicit awaited try/catch (TECH-LESSON-036/044): chaining Bun
			// Test's `.rejects.toMatchObject()` directly onto a
			// node-postgres transaction promise leaves the operation
			// pending until timeout on Bun 1.3.14/Windows, even though the
			// rollback and client release complete correctly server-side.
			const error = await captureError(
				pos.createDeposit({
					actorUserId: depositsBase.actorUserId,
					correlationId: depositsBase.correlationId,
					countedAmountMinor: 10_001,
					currency: "GYD",
					idempotencyKey: "conservation-create",
					organizationId: depositsBase.organizationId,
					sourceShiftIds: [sessionId],
					tenantId,
				})
			);
			expect(error).toMatchObject({ code: "validation" });

			const rows = await testPool.query(
				"SELECT id FROM pos_deposit WHERE tenant_id = $1",
				[tenantId]
			);
			expect(rows.rows).toHaveLength(0);
		});

		test("denies self-confirmation through the application layer and never dispatches", async () => {
			const registerId = "register_deposits_app_self";
			const pos = posService();
			const application = posApplication(pos);
			// The application harness's fixed active-context tenant/
			// organization is "tenant_deposits_app"/`depositsBase.
			// organizationId` (see `posApplication` above).
			const appTenantId = "tenant_deposits_app";
			const sessionId = await openRegisterAndSafeDrop(
				pos,
				registerId,
				appTenantId,
				15_000
			);

			const prepared = await application.createDeposit({
				actorUserId: depositsBase.actorUserId,
				contextId: "context_deposits_app_self",
				correlationId: depositsBase.correlationId,
				countedAmountMinor: 15_000,
				currency: "GYD",
				idempotencyKey: "app-self-create",
				sessionId: "auth_session_deposits_app_self",
				sourceShiftIds: [sessionId],
			});

			// Explicit awaited try/catch (TECH-LESSON-036/044) — see the
			// custody-conservation test above for the full rationale.
			const error = await captureError(
				application.confirmDeposit({
					actorUserId: depositsBase.actorUserId,
					contextId: "context_deposits_app_self",
					correlationId: depositsBase.correlationId,
					depositId: prepared.id,
					idempotencyKey: "app-self-confirm",
					sessionId: "auth_session_deposits_app_self",
				})
			);
			expect(error).toMatchObject({ code: "approval_separation" });
		});
	}
);
