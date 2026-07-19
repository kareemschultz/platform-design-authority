import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createInventoryService,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import {
	createPosApplication,
	createPosService,
	type PosIdFactory,
	type ReturnInventoryMovementPort,
	type SaleInventoryMovementPort,
} from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import {
	createInventoryRepository,
	migrateInventory,
} from "@meridian/persistence-inventory-postgres";
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
import { Pool, type PoolClient } from "pg";

import { createReceiptNumberAllocator } from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

/**
 * WS3 PR3's own isolated-per-file database, mirroring `pos.integration.
 * test.ts`'s `CREATE DATABASE`/`migrate*` pattern exactly (frozen control
 * plan §9 lane-command table: "PR3 live-PG lane ... same isolated-database
 * pattern"). Kept as a SEPARATE file/database from PR1/PR2's rather than a
 * third `describe.serial` block in the already-large `pos.integration.
 * test.ts`, for the same reason PR6's worker-replay lane gets its own
 * database: independently runnable, independently diagnosable.
 */
const databaseName = `meridian_returns_${crypto.randomUUID().replaceAll("-", "")}`;
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

const inventoryIds: InventoryIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

/** Rebuilt against THIS file's isolated database rather than importing
 * `./inventory`'s real adapters, exactly as `pos.integration.test.ts`'s own
 * `createTestSaleInventoryAdapter` does — `references` are stubbed since
 * this lane never exercises Catalog/Tenancy. */
function createTestSaleInventoryAdapter(
	client: PoolClient
): SaleInventoryMovementPort {
	const inventory = createInventoryService({
		clock: () => new Date(),
		ids: inventoryIds,
		references: {
			requireLocation: () => Promise.resolve(),
			requireProduct: () => Promise.resolve(),
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createInventoryRepository(client),
				}),
		},
	});
	return {
		async recordSaleMovement(input) {
			const result = await inventory.recordSaleMovement(input);
			if (result === "negative_stock") {
				return "negative_stock";
			}
			return { movementId: result.id };
		},
	};
}

/** WS3 PR3's compensating-movement mirror of the adapter above — see
 * `./inventory`'s `createReturnInventoryMovementAdapter` (this is the
 * isolated-database rebuild of that same composition, per this file's own
 * doc comment above). */
function createTestReturnInventoryAdapter(
	client: PoolClient
): ReturnInventoryMovementPort {
	const inventory = createInventoryService({
		clock: () => new Date(),
		ids: inventoryIds,
		references: {
			requireLocation: () => Promise.resolve(),
			requireProduct: () => Promise.resolve(),
		},
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createInventoryRepository(client),
				}),
		},
	});
	return {
		async recordReturnMovement(input) {
			const result = await inventory.recordReturnMovement(input);
			return { movementId: result.id };
		},
	};
}

/**
 * A REAL POS service wired to `saleUnitOfWork` (to create the original
 * sales returns reference) and `returnUnitOfWork` (the frozen control
 * plan's ONE shared unit of work for `return.approve`/`voidReceipt`/
 * `reissueReceipt` — one `createPostgresUnitOfWork`, one client, one
 * transaction spanning the compensating Inventory movement, receipt
 * numbering, and the outbox writes). `failEventName` injects a rejection at
 * a named outbox append to exercise the atomicity rollback path, mirroring
 * PR2's `saleService({ failEventName })`.
 */
function posService(options: { failEventName?: string } = {}) {
	return createPosService({
		clock: () => new Date(),
		depositUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error(
						"depositUnitOfWork is not exercised by this lane — see deposits.integration.test.ts for PR4's own lane"
					)
				),
		},
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		pricing: createPricingEngine(),
		products: {
			requireProduct: ({ productId }) =>
				Promise.resolve({ productName: `Product ${productId}` }),
		},
		returnUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: {
				append: (pendingEvent) => {
					if (
						options.failEventName &&
						pendingEvent.name === options.failEventName
					) {
						return Promise.reject(
							new Error(`injected pre-commit failure at ${pendingEvent.name}`)
						);
					}
					return createPostgresOutbox(client).append(pendingEvent);
				},
			},
			inventory: createTestReturnInventoryAdapter(client),
			numbering: createReceiptNumberAllocator(client),
			repository: createPosRepository(client),
		})),
		saleUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			inventory: createTestSaleInventoryAdapter(client),
			numbering: createReceiptNumberAllocator(client),
			repository: createPosRepository(client),
		})),
		tax: createTaxEngine(),
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});
}

const returnsBase = {
	actorUserId: "returns_cashier",
	correlationId: "correlation_pos_returns",
	organizationId: "organization_pos_returns",
};

function locationFor(registerId: string): string {
	return `location_${registerId}`;
}

async function seedStock(input: {
	locationId: string;
	organizationId: string;
	productId: string;
	quantity: string;
	tenantId: string;
}) {
	const inventory = createInventoryService({
		clock: () => new Date(),
		ids: inventoryIds,
		references: {
			requireLocation: () => Promise.resolve(),
			requireProduct: () => Promise.resolve(),
		},
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createInventoryRepository(client),
		})),
	});
	const key = crypto.randomUUID().replaceAll("-", "");
	const adjustment = await inventory.createAdjustment({
		actorUserId: "returns_stock_seeder",
		body: {
			locationId: input.locationId,
			productId: input.productId,
			quantity: input.quantity,
			reason: "WS3 PR3 live-PG lane stock seed",
			unit: "each",
		},
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_create_${key}`,
		organizationId: input.organizationId,
		tenantId: input.tenantId,
	});
	await inventory.approveAdjustment({
		actorUserId: "returns_stock_seeder_approver",
		adjustmentId: adjustment.id,
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_approve_${key}`,
		organizationId: input.organizationId,
		tenantId: input.tenantId,
		version: adjustment.version,
	});
}

const RETURN_PRODUCT_ID = "product_pr3_returnable";

async function openRegisterAndSeedStock(
	pos: ReturnType<typeof posService>,
	registerId: string,
	tenantId: string,
	stockQuantity = "1000"
) {
	await pos.openRegister({
		actorUserId: returnsBase.actorUserId,
		correlationId: returnsBase.correlationId,
		currency: "GYD",
		idempotencyKey: `open_${registerId}`,
		locationId: locationFor(registerId),
		openingFloat: { amountMinor: 100_000, currency: "GYD" },
		organizationId: returnsBase.organizationId,
		registerId,
		tenantId,
	});
	await seedStock({
		locationId: locationFor(registerId),
		organizationId: returnsBase.organizationId,
		productId: RETURN_PRODUCT_ID,
		quantity: stockQuantity,
		tenantId,
	});
}

/** Creates and completes a 4-unit sale at 1000.00 GYD/unit (14% VAT), the
 * fixture every test below returns against. Total: 4 x 1000.00 = 4000.00
 * gross + 560.00 tax = 4560.00 -> 456_000 minor. */
async function completedFixtureSale(
	pos: ReturnType<typeof posService>,
	registerId: string,
	tenantId: string,
	idempotencyPrefix: string
) {
	const created = await pos.createSale({
		actorUserId: returnsBase.actorUserId,
		correlationId: returnsBase.correlationId,
		currency: "GYD",
		idempotencyKey: `${idempotencyPrefix}-sale-create`,
		lines: [
			{
				productId: RETURN_PRODUCT_ID,
				quantity: "4",
				unit: "each",
				unitPrice: { amountMinor: 100_000, currency: "GYD" },
			},
		],
		organizationId: returnsBase.organizationId,
		registerId,
		tenantId,
	});
	const completed = await pos.completeSale({
		actorUserId: returnsBase.actorUserId,
		correlationId: returnsBase.correlationId,
		idempotencyKey: `${idempotencyPrefix}-sale-complete`,
		organizationId: returnsBase.organizationId,
		saleId: created.id,
		tenantId,
		tenders: [{ amountMinor: 456_000, currency: "GYD", type: "Cash" }],
	});
	return completed;
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	await migratePlatformEvents(testPool);
	await migratePlatformNumbering(testPool);
	await migrateInventory(testPool);
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
	"WS3 PR3 return, refund, void, reissue, exchange PostgreSQL controlled prototype",
	() => {
		test("migrates idempotently: the single shared pos-postgres migration stream now carries all thirteen tables through PR4 (this file's own tests exercise only PR3 behavior)", async () => {
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

		test("completes return -> refund atomically end to end: Return/lines, compensating Inventory movement, Return receipt, Refund, cash movement, and every outbox event commit together (raw SQL)", async () => {
			const tenantId = "tenant_returns_atomicity";
			const registerId = "register_returns_atomicity";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"atomic"
			);
			const saleLineId = sale.lines[0]?.id as string;

			const created = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "atomic-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Customer changed mind",
				saleId: sale.id,
				tenantId,
			});
			expect(created.state).toBe("Pending");

			const approved = await pos.approveReturn({
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "atomic-return-approve",
				organizationId: returnsBase.organizationId,
				returnId: created.id,
				tenantId,
			});
			expect(approved.state).toBe("Completed");
			expect(approved.receiptId).not.toBeNull();

			const returnRow = await testPool.query<{
				receipt_id: string | null;
				state: string;
			}>(
				"SELECT state, receipt_id FROM pos_return WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(returnRow.rows[0]).toEqual({
				receipt_id: approved.receiptId,
				state: "Completed",
			});
			const returnLineRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM pos_return_line WHERE tenant_id = $1 AND return_id = $2",
				[tenantId, created.id]
			);
			expect(returnLineRows.rows[0]?.count).toBe("1");

			const compensatingMovementRows = await testPool.query<{
				movement_type: string;
				quantity: string;
				reversal_of_movement_id: string | null;
				source_type: string;
			}>(
				"SELECT movement_type, source_type, quantity::text AS quantity, reversal_of_movement_id FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2",
				[tenantId, created.id]
			);
			expect(compensatingMovementRows.rows).toHaveLength(1);
			expect(compensatingMovementRows.rows[0]?.movement_type).toBe("Reversal");
			expect(compensatingMovementRows.rows[0]?.source_type).toBe("Sale");
			expect(compensatingMovementRows.rows[0]?.quantity).toBe("1.000000");
			expect(
				compensatingMovementRows.rows[0]?.reversal_of_movement_id
			).not.toBeNull();

			const returnReceiptRows = await testPool.query<{
				kind: string;
				original_receipt_id: string | null;
			}>(
				"SELECT kind, original_receipt_id FROM pos_receipt WHERE tenant_id = $1 AND return_id = $2",
				[tenantId, created.id]
			);
			expect(returnReceiptRows.rows).toHaveLength(1);
			expect(returnReceiptRows.rows[0]?.kind).toBe("Return");
			expect(returnReceiptRows.rows[0]?.original_receipt_id).toBe(
				sale.receiptId
			);

			const returnOutboxRows = await testPool.query<{ name: string }>(
				"SELECT name FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id IN ($2, $3) ORDER BY name",
				[tenantId, created.id, approved.receiptId]
			);
			expect(returnOutboxRows.rows.map((row) => row.name)).toEqual([
				"commerce.receipt.issued.v1",
				"commerce.return.completed.v1",
			]);

			// Refund leg: cash compensation only, referencing the Completed
			// Return (§6.3/§6.4 — the two maker/checker pairs never conflate
			// an inventory approval with a cash approval).
			const refundCreated = await pos.createRefund({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "atomic-refund-create",
				organizationId: returnsBase.organizationId,
				returnId: approved.id,
				tenantId,
			});
			expect(refundCreated.state).toBe("Requested");
			expect(refundCreated.amount).toEqual(approved.totalRefundable);

			const refundApproved = await pos.approveRefund({
				actorUserId: "returns_refund_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "atomic-refund-approve",
				organizationId: returnsBase.organizationId,
				refundId: refundCreated.id,
				tenantId,
			});
			expect(refundApproved.state).toBe("Posted");
			expect(refundApproved.cashMovementId).not.toBeNull();

			const refundRow = await testPool.query<{
				cash_movement_id: string | null;
				state: string;
			}>(
				"SELECT state, cash_movement_id FROM pos_refund WHERE tenant_id = $1 AND id = $2",
				[tenantId, refundCreated.id]
			);
			expect(refundRow.rows[0]).toEqual({
				cash_movement_id: refundApproved.cashMovementId,
				state: "Posted",
			});
			const cashMovementRows = await testPool.query<{
				amount_minor: string;
				direction: string;
				reason_code: string;
				reference_id: string | null;
			}>(
				"SELECT direction, reason_code, amount_minor::text AS amount_minor, reference_id FROM pos_cash_movement WHERE tenant_id = $1 AND id = $2",
				[tenantId, refundApproved.cashMovementId]
			);
			expect(cashMovementRows.rows[0]).toEqual({
				amount_minor: String(refundApproved.amount.amountMinor),
				direction: "PaidOut",
				reason_code: "Refund",
				reference_id: refundCreated.id,
			});

			// WS3 remediation R1 cycle 2 counter-case: a REAL refund (a genuine
			// `pos_refund` row exists) must classify `sourceKind: "Refund"`
			// against the same live LEFT JOIN the void counter-case above
			// proves classifies `"Void"` — the join distinguishes both
			// directions correctly, not just defaulting everything one way.
			const financeSourceForRefund = await pos.queryFinanceHandoffSourceData({
				organizationId: returnsBase.organizationId,
				periodEndUtc: new Date(Date.now() + 24 * 60 * 60 * 1000),
				periodStartUtc: new Date(Date.now() - 24 * 60 * 60 * 1000),
				tenantId,
			});
			const refundFact = financeSourceForRefund.refunds.find(
				(refund) => refund.refundId === refundCreated.id
			);
			expect(refundFact).toMatchObject({
				refundId: refundCreated.id,
				sourceKind: "Refund",
			});

			const refundOutboxRows = await testPool.query<{ name: string }>(
				"SELECT name FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id IN ($2, $3) ORDER BY name",
				[tenantId, refundCreated.id, refundApproved.cashMovementId]
			);
			expect(refundOutboxRows.rows.map((row) => row.name)).toEqual([
				"commerce.cash-movement.posted.v1",
				"commerce.refund.requested.v1",
			]);
		});

		test("posts two SEPARATE compensating movements for two sequential partial returns against the SAME original sale movement (Inventory's per-original one-reversal cap is scoped to Adjustment, not Sale)", async () => {
			const tenantId = "tenant_returns_sequential_partial";
			const registerId = "register_returns_sequential_partial";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"sequential-partial"
			);
			const saleLineId = sale.lines[0]?.id as string;

			const firstReturn = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "sequential-partial-return-1-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "First partial return",
				saleId: sale.id,
				tenantId,
			});
			const firstApproved = await pos.approveReturn({
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "sequential-partial-return-1-approve",
				organizationId: returnsBase.organizationId,
				returnId: firstReturn.id,
				tenantId,
			});
			expect(firstApproved.state).toBe("Completed");

			// A SEPARATE, later return against the SAME sale line — both
			// compensating movements reference the SAME original Sale
			// movement id (one sale line has exactly one posted movement),
			// which would violate a naive "at most one reversal per
			// original movement" constraint if Inventory's own uidx were
			// not scoped away from `sourceType = 'Sale'`.
			const secondReturn = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "sequential-partial-return-2-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Second partial return, same line",
				saleId: sale.id,
				tenantId,
			});
			const secondApproved = await pos.approveReturn({
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "sequential-partial-return-2-approve",
				organizationId: returnsBase.organizationId,
				returnId: secondReturn.id,
				tenantId,
			});
			expect(secondApproved.state).toBe("Completed");

			const movementRows = await testPool.query<{
				reversal_of_movement_id: string | null;
			}>(
				"SELECT reversal_of_movement_id FROM inventory_stock_movement WHERE tenant_id = $1 AND movement_type = 'Reversal' AND source_type = 'Sale' ORDER BY created_at",
				[tenantId]
			);
			expect(movementRows.rows).toHaveLength(2);
			expect(movementRows.rows[0]?.reversal_of_movement_id).toBe(
				movementRows.rows[1]?.reversal_of_movement_id
			);
			expect(movementRows.rows[0]?.reversal_of_movement_id).not.toBeNull();

			// A third return exceeding what remains (4 - 1 - 1 = 2 left) is
			// still rejected — this exemption is scoped to allowing MULTIPLE
			// legitimate partial-return movements, not an over-return.
			const overReturn = await captureError(
				pos.createReturn({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					idempotencyKey: "sequential-partial-return-3-create",
					lines: [{ quantity: "3", saleLineId }],
					organizationId: returnsBase.organizationId,
					reason: "Should exceed remaining quantity",
					saleId: sale.id,
					tenantId,
				})
			);
			expect(overReturn).toMatchObject({ code: "validation" });
		});

		test("rolls back the compensating Inventory movement, Return receipt, and Return state together when an injected failure occurs before commit (raw SQL)", async () => {
			const tenantId = "tenant_returns_rollback";
			const registerId = "register_returns_rollback";
			const pos = posService({
				failEventName: "commerce.return.completed.v1",
			});
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"rollback"
			);
			const saleLineId = sale.lines[0]?.id as string;
			const created = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "rollback-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Rollback test",
				saleId: sale.id,
				tenantId,
			});
			const failure = await captureError(
				pos.approveReturn({
					actorUserId: "returns_checker",
					correlationId: returnsBase.correlationId,
					idempotencyKey: "rollback-return-approve",
					organizationId: returnsBase.organizationId,
					returnId: created.id,
					tenantId,
				})
			);
			expect((failure as Error).message).toContain(
				"injected pre-commit failure"
			);

			const returnRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_return WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(returnRow.rows[0]?.state).toBe("Pending");

			const facts = await testPool.query<{
				movements: string;
				receipts: string;
			}>(
				`SELECT
					(SELECT count(*)::text FROM pos_receipt WHERE tenant_id = $1 AND return_id = $2) AS receipts,
					(SELECT count(*)::text FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2) AS movements`,
				[tenantId, created.id]
			);
			expect(facts.rows[0]).toEqual({ movements: "0", receipts: "0" });
		});

		test("prevents an over-return under a genuine concurrent double-return race: the cumulative cap holds across both attempts", async () => {
			const tenantId = "tenant_returns_race";
			const registerId = "register_returns_race";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"race"
			);
			const saleLineId = sale.lines[0]?.id as string;

			// The 4-unit line cannot absorb two concurrent 3-unit return
			// requests (6 > 4): the Sale row lock (`getSale`'s `SELECT ...
			// FOR UPDATE`) serializes these two `return.create` calls against
			// the SAME sale, so the cumulative-quantity check the second one
			// runs must observe the first one's already-committed line.
			const results = await Promise.allSettled([
				pos.createReturn({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					idempotencyKey: "race-return-1",
					lines: [{ quantity: "3", saleLineId }],
					organizationId: returnsBase.organizationId,
					reason: "Race attempt 1",
					saleId: sale.id,
					tenantId,
				}),
				pos.createReturn({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					idempotencyKey: "race-return-2",
					lines: [{ quantity: "3", saleLineId }],
					organizationId: returnsBase.organizationId,
					reason: "Race attempt 2",
					saleId: sale.id,
					tenantId,
				}),
			]);
			const fulfilled = results.filter(
				(result) => result.status === "fulfilled"
			);
			const rejected = results.filter((result) => result.status === "rejected");
			expect(fulfilled).toHaveLength(1);
			expect(rejected).toHaveLength(1);
			const [firstRejected] = rejected;
			expect(
				firstRejected?.status === "rejected" ? firstRejected.reason : null
			).toMatchObject({ code: "validation" });

			// The cumulative cap holds at the database level too: total
			// returned quantity for this line never exceeds the original 4.
			const totalReturned = await testPool.query<{ total: string }>(
				"SELECT coalesce(sum(quantity), 0)::text AS total FROM pos_return_line WHERE tenant_id = $1 AND sale_line_id = $2",
				[tenantId, saleLineId]
			);
			expect(Number(totalReturned.rows[0]?.total ?? "0")).toBeLessThanOrEqual(
				4
			);
			expect(Number(totalReturned.rows[0]?.total ?? "0")).toBe(3);
		});

		test("replays a return-approval command idempotently under a genuine concurrent race: exactly one compensating movement, one receipt", async () => {
			const tenantId = "tenant_returns_approve_race";
			const registerId = "register_returns_approve_race";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"approve-race"
			);
			const saleLineId = sale.lines[0]?.id as string;
			const created = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "approve-race-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Idempotency replay",
				saleId: sale.id,
				tenantId,
			});
			const approveInput = {
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "approve-race-return-approve",
				organizationId: returnsBase.organizationId,
				returnId: created.id,
				tenantId,
			};
			const results = await Promise.all(
				Array.from({ length: 5 }, () => pos.approveReturn(approveInput))
			);
			const [winner] = results;
			for (const result of results) {
				expect(result.id).toBe(created.id);
				expect(result.state).toBe("Completed");
				expect(result.receiptId).toBe(winner?.receiptId ?? null);
			}
			const facts = await testPool.query<{
				completed_returns: string;
				movements: string;
				receipts: string;
			}>(
				`SELECT
					(SELECT count(*)::text FROM pos_return WHERE tenant_id = $1 AND id = $2 AND state = 'Completed') AS completed_returns,
					(SELECT count(*)::text FROM pos_receipt WHERE tenant_id = $1 AND return_id = $2) AS receipts,
					(SELECT count(*)::text FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2) AS movements`,
				[tenantId, created.id]
			);
			expect(facts.rows[0]).toEqual({
				completed_returns: "1",
				movements: "1",
				receipts: "1",
			});
		});

		test("keeps returns strictly tenant-scoped: tenant B cannot reference tenant A's sale, and cannot see or approve tenant A's return", async () => {
			const tenantA = "tenant_returns_isolation_a";
			const tenantB = "tenant_returns_isolation_b";
			const registerId = "register_returns_isolation";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantA);
			await openRegisterAndSeedStock(pos, registerId, tenantB);
			const saleA = await completedFixtureSale(
				pos,
				registerId,
				tenantA,
				"isolation-a"
			);
			const saleLineIdA = saleA.lines[0]?.id as string;

			const crossTenantCreate = await captureError(
				pos.createReturn({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					idempotencyKey: "isolation-cross-tenant-create",
					lines: [{ quantity: "1", saleLineId: saleLineIdA }],
					organizationId: returnsBase.organizationId,
					reason: "Cross-tenant attempt",
					saleId: saleA.id,
					tenantId: tenantB,
				})
			);
			expect(crossTenantCreate).toMatchObject({ code: "not_found" });

			const createdA = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "isolation-a-return-create",
				lines: [{ quantity: "1", saleLineId: saleLineIdA }],
				organizationId: returnsBase.organizationId,
				reason: "Tenant A's own return",
				saleId: saleA.id,
				tenantId: tenantA,
			});

			const crossTenantApprove = await captureError(
				pos.approveReturn({
					actorUserId: "returns_checker",
					correlationId: returnsBase.correlationId,
					idempotencyKey: "isolation-cross-tenant-approve",
					organizationId: returnsBase.organizationId,
					returnId: createdA.id,
					tenantId: tenantB,
				})
			);
			expect(crossTenantApprove).toMatchObject({ code: "not_found" });

			const approvedA = await pos.approveReturn({
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "isolation-a-return-approve",
				organizationId: returnsBase.organizationId,
				returnId: createdA.id,
				tenantId: tenantA,
			});
			expect(approvedA.state).toBe("Completed");
		});

		test("denies return approval before application dispatch when permission is not granted, and dispatches once granted", async () => {
			const tenantId = "tenant_returns_permission";
			const registerId = "register_returns_permission";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"permission"
			);
			const saleLineId = sale.lines[0]?.id as string;
			const created = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "permission-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Permission denial test",
				saleId: sale.id,
				tenantId,
			});

			let permissionCalls = 0;
			let dispatched = false;
			const application = createPosApplication({
				activeContexts: {
					requireActiveContext: () =>
						Promise.resolve({
							organizationId: returnsBase.organizationId,
							tenantId,
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
					approveReturn: (input: Parameters<typeof pos.approveReturn>[0]) => {
						dispatched = true;
						return pos.approveReturn(input);
					},
				},
			});
			const denied = await captureError(
				application.approveReturn({
					actorUserId: "returns_checker",
					contextId: "context_returns_denied",
					correlationId: returnsBase.correlationId,
					idempotencyKey: "permission-return-approve-denied",
					returnId: created.id,
					sessionId: "session_returns_denied",
				})
			);
			expect(denied).toMatchObject({ code: "authorization_denied" });
			expect(permissionCalls).toBe(1);
			expect(dispatched).toBe(false);
			const returnRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_return WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(returnRow.rows[0]?.state).toBe("Pending");
		});

		test("realizes an exchange atomically: the replacement sale completes, the Return is marked consumed, and commerce.exchange.completed.v1 commits together with the sale (raw SQL)", async () => {
			const tenantId = "tenant_returns_exchange";
			const registerId = "register_returns_exchange";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"exchange"
			);
			const saleLineId = sale.lines[0]?.id as string;
			const created = await pos.createReturn({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "exchange-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: returnsBase.organizationId,
				reason: "Exchange for a different item",
				saleId: sale.id,
				tenantId,
			});
			const approved = await pos.approveReturn({
				actorUserId: "returns_checker",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "exchange-return-approve",
				organizationId: returnsBase.organizationId,
				returnId: created.id,
				tenantId,
			});

			const replacement = await pos.createSale({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				currency: "GYD",
				idempotencyKey: "exchange-replacement-create",
				lines: [
					{
						productId: RETURN_PRODUCT_ID,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 150_000, currency: "GYD" },
					},
				],
				organizationId: returnsBase.organizationId,
				registerId,
				tenantId,
			});
			const completedReplacement = await pos.completeSale({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				exchangeOfReturnId: approved.id,
				idempotencyKey: "exchange-replacement-complete",
				organizationId: returnsBase.organizationId,
				saleId: replacement.id,
				tenantId,
				tenders: [
					{
						amountMinor: replacement.total.amountMinor,
						currency: "GYD",
						type: "Cash",
					},
				],
			});
			expect(completedReplacement.state).toBe("Completed");

			const returnRow = await testPool.query<{
				exchange_sale_id: string | null;
			}>(
				"SELECT exchange_sale_id FROM pos_return WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(returnRow.rows[0]?.exchange_sale_id).toBe(completedReplacement.id);

			const exchangeOutboxRows = await testPool.query<{
				data: { newSaleId?: string; returnId?: string };
				name: string;
			}>(
				"SELECT name, data FROM platform_event_outbox WHERE tenant_id = $1 AND name = 'commerce.exchange.completed.v1'",
				[tenantId]
			);
			expect(exchangeOutboxRows.rows).toHaveLength(1);
			expect(exchangeOutboxRows.rows[0]?.data).toMatchObject({
				newSaleId: completedReplacement.id,
				returnId: approved.id,
			});

			// The Return can never be consumed by a second exchange.
			const anotherReplacement = await pos.createSale({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				currency: "GYD",
				idempotencyKey: "exchange-second-replacement-create",
				lines: [
					{
						productId: RETURN_PRODUCT_ID,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 1000, currency: "GYD" },
					},
				],
				organizationId: returnsBase.organizationId,
				registerId,
				tenantId,
			});
			const secondAttempt = await captureError(
				pos.completeSale({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					exchangeOfReturnId: approved.id,
					idempotencyKey: "exchange-second-replacement-complete",
					organizationId: returnsBase.organizationId,
					saleId: anotherReplacement.id,
					tenantId,
					tenders: [{ amountMinor: 1140, currency: "GYD", type: "Cash" }],
				})
			);
			expect(secondAttempt).toMatchObject({ code: "invalid_state" });
		});

		test("voids a completed sale on an open session atomically — including its own compensating cash-ledger entry (WS3 remediation R1 cycle 2, closing the gap adversarial re-review found in the original Finding A fix) — and rejects the void once the register session has closed", async () => {
			const tenantId = "tenant_returns_void";
			const registerId = "register_returns_void";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"void"
			);

			const voided = await pos.voidReceipt({
				actorUserId: "returns_void_actor",
				correlationId: returnsBase.correlationId,
				idempotencyKey: "void-1",
				organizationId: returnsBase.organizationId,
				reason: "Cashier error",
				receiptId: sale.receiptId as string,
				tenantId,
			});
			expect(voided.mode).toBe("Void");
			expect(voided.state).toBe("Completed");

			const movementRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2",
				[tenantId, voided.id]
			);
			expect(movementRows.rows[0]?.count).toBe("1");

			// WS3 remediation R1 cycle 2: `voidReceipt` now posts its own
			// compensating `PaidOut`/`Refund` cash-ledger entry, atomically in
			// the SAME transaction as the Inventory reversal and Return/
			// receipt above — mirroring `approveRefund`'s posting, since
			// every voidable sale is by construction a completed Cash sale
			// (`requireCashOnlyTenders`). PROVEN failing pre-fix: before this
			// cycle, no row existed here at all (`rows[0]` was `undefined`,
			// this assertion would have thrown a matcher error against
			// `undefined`), and `closeRegister` below at `countedCash:
			// 100_000` would have landed on `state: "Closing"` with
			// `variance: -456_000` instead of `"Closed"`/`variance: 0`,
			// because the voided sale's Finding A `PaidIn` proceeds were
			// never reversed.
			const cashMovementRows = await testPool.query<{
				amount_minor: string;
				direction: string;
				reason_code: string;
				reference_id: string | null;
			}>(
				"SELECT direction, reason_code, amount_minor::text AS amount_minor, reference_id FROM pos_cash_movement WHERE tenant_id = $1 AND reference_id = $2",
				[tenantId, voided.id]
			);
			expect(cashMovementRows.rows[0]).toEqual({
				amount_minor: "456000",
				direction: "PaidOut",
				reason_code: "Refund",
				reference_id: voided.id,
			});

			// WS3 remediation R1 cycle 2 (advisor-flagged follow-up): the void's
			// reasonCode-"Refund" cash movement must NOT be misreported to
			// Finance as pointing to a real `pos_refund` row — none exists for
			// a Void. `queryFinanceHandoffSourceData`'s LEFT JOIN against
			// `pos_refund` (packages/persistence/pos-postgres/src/index.ts)
			// must classify it `sourceKind: "Void"` with `refundId` naming the
			// Return, against the REAL Postgres join (not just the in-memory
			// unit-test mock or the pure payload-builder unit test). PROVEN
			// failing pre-fix: before this cycle, `queryFinanceHandoffSourceData`
			// selected `posCashMovements.*` directly with no join at all and no
			// `sourceKind` field existed on the returned fact — this exact
			// assertion could not even compile against the prior type.
			const financeSource = await pos.queryFinanceHandoffSourceData({
				organizationId: returnsBase.organizationId,
				periodEndUtc: new Date(Date.now() + 24 * 60 * 60 * 1000),
				periodStartUtc: new Date(Date.now() - 24 * 60 * 60 * 1000),
				tenantId,
			});
			const voidRefundFact = financeSource.refunds.find(
				(refund) => refund.refundId === voided.id
			);
			expect(voidRefundFact).toMatchObject({
				amountMinor: 456_000,
				refundId: voided.id,
				sourceKind: "Void",
			});

			// The actual boundary this cycle closes: closing at exactly the
			// ORIGINAL opening float (100,000) — not float-plus-unreversed-
			// sale-proceeds (556,000) — now lands at zero variance, because
			// the sale's proceeds and the void's reversal net to zero on the
			// authoritative ledger `closeRegister` reads.
			const closed = await pos.closeRegister({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				countedCash: { amountMinor: 100_000, currency: "GYD" },
				idempotencyKey: "void-close-register",
				organizationId: returnsBase.organizationId,
				registerId,
				tenantId,
			});
			expect(closed.expectedCash).toEqual({
				amountMinor: 100_000,
				currency: "GYD",
			});
			expect(closed.variance).toEqual({ amountMinor: 0, currency: "GYD" });
			expect(closed.state).toBe("Closed");

			const sale2 = await (async () => {
				await pos.openRegister({
					actorUserId: returnsBase.actorUserId,
					correlationId: returnsBase.correlationId,
					currency: "GYD",
					idempotencyKey: "void-reopen",
					locationId: locationFor(registerId),
					openingFloat: { amountMinor: 0, currency: "GYD" },
					organizationId: returnsBase.organizationId,
					registerId,
					tenantId,
				});
				return completedFixtureSale(pos, registerId, tenantId, "void-2");
			})();

			// This second session opened at float 0, so expected cash is
			// exactly sale2's own 456,000 proceeds (Finding A).
			await pos.closeRegister({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				countedCash: { amountMinor: 456_000, currency: "GYD" },
				idempotencyKey: "void-close-register-2",
				organizationId: returnsBase.organizationId,
				registerId,
				tenantId,
			});
			const voidAfterClose = await captureError(
				pos.voidReceipt({
					actorUserId: "returns_void_actor",
					correlationId: returnsBase.correlationId,
					idempotencyKey: "void-after-close-1",
					organizationId: returnsBase.organizationId,
					receiptId: sale2.receiptId as string,
					tenantId,
				})
			);
			expect(voidAfterClose).toMatchObject({ code: "invalid_state" });
		});

		test("reissues a receipt with no monetary effect, and priceSuppressed realizes a gift receipt", async () => {
			const tenantId = "tenant_returns_reissue";
			const registerId = "register_returns_reissue";
			const pos = posService();
			await openRegisterAndSeedStock(pos, registerId, tenantId);
			const sale = await completedFixtureSale(
				pos,
				registerId,
				tenantId,
				"reissue"
			);

			const reissued = await pos.reissueReceipt({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "reissue-1",
				organizationId: returnsBase.organizationId,
				receiptId: sale.receiptId as string,
				tenantId,
			});
			expect(reissued.kind).toBe("Reissue");
			expect(reissued.total).toEqual({ amountMinor: 456_000, currency: "GYD" });

			const gift = await pos.reissueReceipt({
				actorUserId: returnsBase.actorUserId,
				correlationId: returnsBase.correlationId,
				idempotencyKey: "reissue-gift-1",
				organizationId: returnsBase.organizationId,
				priceSuppressed: true,
				receiptId: sale.receiptId as string,
				tenantId,
			});
			expect(gift.priceSuppressed).toBe(true);
			expect(gift.total).toBeNull();

			const saleRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_sale WHERE tenant_id = $1 AND id = $2",
				[tenantId, sale.id]
			);
			expect(saleRow.rows[0]?.state).toBe("Completed");
		});
	}
);
