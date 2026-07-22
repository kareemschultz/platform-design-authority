import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
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
import {
	createExportRepository,
	migratePlatformImportExport,
} from "@meridian/persistence-platform-import-export-postgres";
import { migratePlatformNumbering } from "@meridian/persistence-platform-numbering-postgres";
import {
	createPosRepository,
	migratePos,
} from "@meridian/persistence-pos-postgres";
import { createExportService } from "@meridian/platform-import-export";
import { env } from "@meridian/tooling-env/server";
import { Pool, type PoolClient } from "pg";

import {
	createDepositReferenceAllocator,
	createReceiptNumberAllocator,
} from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

/**
 * WS3 PR6's own isolated-per-file database (frozen control plan §9 lane-
 * command table pattern; PR6 stage spec item 3). Unlike PR1-PR4's own lanes
 * — each of which stubs the unit-of-work slots it does not exercise — this
 * file wires a FULL real `PosService` (register + sale + return + refund +
 * deposit + export) against ONE isolated database, mirroring
 * `apps/server/composition/pos.ts`'s real production wiring, because the
 * five FIRST_SLICE_MANIFEST.md scenarios this file demonstrates each chain
 * multiple PR1-PR4 commands together.
 */
const databaseName = `meridian_ws3_closeout_${crypto.randomUUID().replaceAll("-", "")}`;
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

const base = {
	actorUserId: "ws3_closeout_cashier",
	correlationId: "correlation_ws3_closeout",
	organizationId: "organization_ws3_closeout",
};

const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

/** Rebuilt against THIS file's isolated database, exactly as `pos.
 * integration.test.ts`/`returns.integration.test.ts` rebuild their own
 * adapters rather than importing `./inventory`'s dev-pool composition. */
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

/** A REAL POS service wired to every unit-of-work slot against the shared
 * isolated database — the frozen control plan's ONE `createPostgresUnitOfWork`
 * per sale/return/deposit command discipline, exactly as `apps/server/
 * composition/pos.ts` wires the real dev-pool composition. */
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
			requireProduct: ({ productId }) =>
				Promise.resolve({ productName: `Product ${productId}` }),
		},
		returnUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
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

function exportService() {
	return createExportService({
		clock: () => new Date(),
		hash: {
			sha256: (content) =>
				Promise.resolve(
					createHash("sha256").update(content, "utf8").digest("hex")
				),
		},
		ids: {
			create: (kind) => `${kind}_${crypto.randomUUID().replaceAll("-", "")}`,
		},
		repository: createExportRepository(testPool),
	});
}

async function seedStock(input: {
	locationId: string;
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
		actorUserId: "ws3_closeout_stock_seeder",
		body: {
			locationId: input.locationId,
			productId: input.productId,
			quantity: input.quantity,
			reason: "WS3 PR6 scenario-lane stock seed",
			unit: "each",
		},
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_create_${key}`,
		organizationId: base.organizationId,
		tenantId: input.tenantId,
	});
	await inventory.approveAdjustment({
		actorUserId: "ws3_closeout_stock_seeder_approver",
		adjustmentId: adjustment.id,
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_approve_${key}`,
		organizationId: base.organizationId,
		tenantId: input.tenantId,
		version: adjustment.version,
	});
}

async function currentStockBalance(input: {
	locationId: string;
	productId: string;
	tenantId: string;
}): Promise<string> {
	const rows = await testPool.query<{ on_hand: string }>(
		"SELECT on_hand::text FROM inventory_stock_balance WHERE tenant_id = $1 AND location_id = $2 AND product_id = $3",
		[input.tenantId, input.locationId, input.productId]
	);
	return rows.rows[0]?.on_hand ?? "0";
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 12 });
	await migratePlatformEvents(testPool);
	await migratePlatformNumbering(testPool);
	await migrateInventory(testPool);
	await migratePos(testPool);
	await migratePlatformImportExport(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial(
	"WS3 PR6 closeout: FIRST_SLICE_MANIFEST.md scenario demonstrations",
	() => {
		test('Scenario 3 ("Open a register and complete GYD cash and mixed-tender sales"): a real cash sale moves real Inventory stock, and a mixed-tender attempt is explicitly denied (PENDING WS6, not silently dropped)', async () => {
			const tenantId = "tenant_ws3_scenario3";
			const registerId = "register_ws3_scenario3";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_scenario3";
			const pos = posService();

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario3-open",
				locationId,
				openingFloat: { amountMinor: 50_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			await seedStock({ locationId, productId, quantity: "10", tenantId });
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("10.000000");

			const created = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario3-sale-create",
				lines: [
					{
						productId,
						quantity: "3",
						unit: "each",
						unitPrice: { amountMinor: 100_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId,
			});
			const completed = await pos.completeSale({
				...base,
				idempotencyKey: "scenario3-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [
					{
						amountMinor: created.total.amountMinor,
						currency: "GYD",
						type: "Cash",
					},
				],
			});
			expect(completed.state).toBe("Completed");

			// The real Inventory ledger moved synchronously in the sale's own
			// transaction (frozen control plan §6.2/§7): 10 - 3 = 7 remaining.
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("7.000000");
			const movementRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2 AND source_type = 'Sale'",
				[tenantId, completed.id]
			);
			expect(movementRows.rows[0]?.count).toBe("1");

			// Mixed-tender (any non-Cash tender type) is explicitly denied at the
			// completion boundary — WS3 proves GYD cash only; electronic-tender
			// orchestration through a payment provider rail is WS6 scope (frozen
			// control plan §5's `payment.refunds` row and stage packet framing).
			const secondSale = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario3-mixed-sale-create",
				lines: [
					{
						productId,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 100_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId,
			});
			const mixedTenderAttempt = await captureError(
				pos.completeSale({
					...base,
					idempotencyKey: "scenario3-mixed-sale-complete",
					saleId: secondSale.id,
					tenantId,
					tenders: [
						{ amountMinor: 60_000, currency: "GYD", type: "Cash" },
						{ amountMinor: 54_000, currency: "GYD", type: "StoredValue" },
					],
				})
			);
			expect(mixedTenderAttempt).toMatchObject({ code: "validation" });
			// The denied attempt left the stock ledger unmoved (no partial effect).
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("7.000000");
		});

		test('Scenario 4 ("Issue a receipt using offline-safe numbering"): a completed sale receives a monotonic, non-duplicate receipt number online (offline-safe allocation is PENDING WS5, not claimed here)', async () => {
			const tenantId = "tenant_ws3_scenario4";
			const registerId = "register_ws3_scenario4";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_scenario4";
			const pos = posService();

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario4-open",
				locationId,
				openingFloat: { amountMinor: 50_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			await seedStock({ locationId, productId, quantity: "5", tenantId });

			const receiptNumbers: string[] = [];
			for (let index = 0; index < 3; index += 1) {
				// biome-ignore lint/performance/noAwaitInLoops: measures three sequential receipt numbers in order; a bounded n=3 diagnostic, not a hot loop.
				const created = await pos.createSale({
					...base,
					currency: "GYD",
					idempotencyKey: `scenario4-sale-create-${index}`,
					lines: [
						{
							productId,
							quantity: "1",
							unit: "each",
							unitPrice: { amountMinor: 50_000, currency: "GYD" },
						},
					],
					registerId,
					tenantId,
				});
				const completed = await pos.completeSale({
					...base,
					idempotencyKey: `scenario4-sale-complete-${index}`,
					saleId: created.id,
					tenantId,
					tenders: [{ amountMinor: 57_000, currency: "GYD", type: "Cash" }],
				});
				expect(completed.receiptId).not.toBeNull();
				const receipt = await pos.getReceipt(
					tenantId,
					base.organizationId,
					completed.receiptId as string
				);
				receiptNumbers.push(receipt.receiptNumber);
			}

			// Monotonic and non-duplicate per register — the property the frozen
			// control plan §5.1 records as proven ONLINE only on this branch.
			expect(new Set(receiptNumbers).size).toBe(3);
			expect([...receiptNumbers].sort()).toEqual(receiptNumbers);
		});

		test('Scenario 6 ("Return a sale to original tender or Commerce-owned store credit"): a completed sale is returned to its original cash tender end to end (store-credit is WS4 stored-value scope, not claimed here)', async () => {
			const tenantId = "tenant_ws3_scenario6";
			const registerId = "register_ws3_scenario6";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_scenario6";
			const pos = posService();

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario6-open",
				locationId,
				openingFloat: { amountMinor: 50_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			await seedStock({ locationId, productId, quantity: "5", tenantId });

			const created = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario6-sale-create",
				lines: [
					{
						productId,
						quantity: "2",
						unit: "each",
						unitPrice: { amountMinor: 100_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId,
			});
			const completed = await pos.completeSale({
				...base,
				idempotencyKey: "scenario6-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [{ amountMinor: 228_000, currency: "GYD", type: "Cash" }],
			});
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("3.000000");

			const saleLineId = completed.lines[0]?.id as string;
			const returnCreated = await pos.createReturn({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				idempotencyKey: "scenario6-return-create",
				lines: [{ quantity: "1", saleLineId }],
				organizationId: base.organizationId,
				reason: "Scenario 6: customer changed mind",
				saleId: completed.id,
				tenantId,
			});
			expect(returnCreated.state).toBe("Pending");
			// No inventory effect yet at Pending (frozen control plan §6.3).
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("3.000000");

			const returnApproved = await pos.approveReturn({
				actorUserId: "ws3_scenario6_return_checker",
				correlationId: base.correlationId,
				idempotencyKey: "scenario6-return-approve",
				organizationId: base.organizationId,
				returnId: returnCreated.id,
				tenantId,
			});
			expect(returnApproved.state).toBe("Completed");
			// Compensating movement posts on approval: 3 + 1 = 4.
			expect(
				await currentStockBalance({ locationId, productId, tenantId })
			).toBe("4.000000");

			// Original tender (cash) refund: the separate refund maker/checker
			// pair posts the paid-out cash movement on the still-open register.
			const refundCreated = await pos.createRefund({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				idempotencyKey: "scenario6-refund-create",
				organizationId: base.organizationId,
				returnId: returnApproved.id,
				tenantId,
			});
			expect(refundCreated.state).toBe("Requested");
			expect(refundCreated.amount).toEqual(returnApproved.totalRefundable);

			const refundApproved = await pos.approveRefund({
				actorUserId: "ws3_scenario6_refund_checker",
				correlationId: base.correlationId,
				idempotencyKey: "scenario6-refund-approve",
				organizationId: base.organizationId,
				refundId: refundCreated.id,
				tenantId,
			});
			expect(refundApproved.state).toBe("Posted");
			expect(refundApproved.cashMovementId).not.toBeNull();

			const cashMovementRow = await testPool.query<{
				direction: string;
				reason_code: string;
			}>(
				"SELECT direction, reason_code FROM pos_cash_movement WHERE tenant_id = $1 AND id = $2",
				[tenantId, refundApproved.cashMovementId]
			);
			expect(cashMovementRow.rows[0]).toEqual({
				direction: "PaidOut",
				reason_code: "Refund",
			});
		});

		test('Scenario 9 ("Close the register, count cash, prepare a deposit, and explain variance"): a mismatched count routes through the cash-variance checker before Closed, then the reconciled safe custody is deposited and confirmed', async () => {
			const tenantId = "tenant_ws3_scenario9";
			const registerId = "register_ws3_scenario9";
			const locationId = `location_${registerId}`;
			const pos = posService();

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario9-open",
				locationId,
				openingFloat: { amountMinor: 100_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			const safeDrop = await pos.createCashMovement({
				actorUserId: base.actorUserId,
				amount: { amountMinor: 40_000, currency: "GYD" },
				correlationId: base.correlationId,
				direction: "PaidOut",
				idempotencyKey: "scenario9-safedrop",
				organizationId: base.organizationId,
				reasonCode: "SafeDrop",
				registerId,
				tenantId,
			});

			// Counted cash (55,000) mismatches expected cash (100,000 - 40,000 =
			// 60,000): a non-zero variance that must be explained/approved before
			// the session reaches Closed (frozen control plan §6.1).
			const closing = await pos.closeRegister({
				...base,
				countedCash: { amountMinor: 55_000, currency: "GYD" },
				idempotencyKey: "scenario9-close",
				registerId,
				tenantId,
			});
			expect(closing.state).toBe("Closing");
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
					idempotencyKey: "scenario9-self-approve",
					organizationId: base.organizationId,
					sessionId: closing.id,
					tenantId,
					version: closing.version,
				})
			);
			expect(selfApproval).toMatchObject({ code: "approval_separation" });

			const varianceApproved = await pos.approveCashVariance({
				actorUserId: "ws3_scenario9_variance_checker",
				correlationId: base.correlationId,
				idempotencyKey: "scenario9-approve",
				organizationId: base.organizationId,
				sessionId: closing.id,
				tenantId,
				version: closing.version,
			});
			expect(varianceApproved.state).toBe("Closed");

			// Deposit the safe-drop custody, sourced from the now-Closed session.
			const prepared = await pos.createDeposit({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				countedAmountMinor: 40_000,
				currency: "GYD",
				idempotencyKey: "scenario9-deposit-create",
				organizationId: base.organizationId,
				sourceShiftIds: [safeDrop.sessionId],
				tenantId,
			});
			expect(prepared.state).toBe("Prepared");
			const transferRowsBeforeConfirm = await testPool.query(
				"SELECT 1 FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRowsBeforeConfirm.rows).toHaveLength(0);

			const confirmSelfAttempt = await captureError(
				pos.confirmDeposit({
					actorUserId: base.actorUserId,
					correlationId: base.correlationId,
					depositId: prepared.id,
					idempotencyKey: "scenario9-self-confirm",
					organizationId: base.organizationId,
					tenantId,
				})
			);
			expect(confirmSelfAttempt).toMatchObject({ code: "approval_separation" });

			const confirmed = await pos.confirmDeposit({
				actorUserId: "ws3_scenario9_deposit_checker",
				correlationId: base.correlationId,
				depositId: prepared.id,
				idempotencyKey: "scenario9-confirm",
				organizationId: base.organizationId,
				tenantId,
			});
			expect(confirmed.state).toBe("Reconciled");
			const transferRows = await testPool.query<{ amount_minor: string }>(
				"SELECT amount_minor::text AS amount_minor FROM pos_deposit_custody_transfer WHERE tenant_id = $1 AND deposit_id = $2",
				[tenantId, prepared.id]
			);
			expect(transferRows.rows).toHaveLength(1);
			expect(transferRows.rows[0]?.amount_minor).toBe("40000");
		});

		test('Scenario 10 ("Export an accountant handoff with source references"): a generated export\'s control totals reconcile exactly to the completed sale and confirmed deposit it references', async () => {
			const tenantId = "tenant_ws3_scenario10";
			const registerId = "register_ws3_scenario10";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_scenario10";
			const pos = posService();

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario10-open",
				locationId,
				openingFloat: { amountMinor: 100_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			await seedStock({ locationId, productId, quantity: "5", tenantId });
			const created = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "scenario10-sale-create",
				lines: [
					{
						productId,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 70_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId,
			});
			const completed = await pos.completeSale({
				...base,
				idempotencyKey: "scenario10-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [{ amountMinor: 79_800, currency: "GYD", type: "Cash" }],
			});

			const periodStartUtc = new Date("2026-07-01T00:00:00.000Z");
			const periodEndUtc = new Date("2026-08-01T00:00:00.000Z");
			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: base.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			const record = await exportService().createAccountantHandoffExport({
				actorUserId: base.actorUserId,
				currency: "GYD",
				idempotencyKey: "scenario10-export",
				legalEntityId: "legal_entity_ws3_scenario10",
				organizationId: base.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			});

			expect(record.kind).toBe("AccountantHandoff");
			expect(record.contentHash).toMatch(SHA256_HEX_PATTERN);

			// "Source references": the export's control total is independently
			// re-derivable by raw SQL against the owning Sale table, and the
			// generated posting lines name the source sale by id, not an
			// aggregate a single command cannot reproduce.
			const rawGross = await testPool.query<{ gross_sales_minor: string }>(
				"SELECT coalesce(sum(gross_minor), 0)::text AS gross_sales_minor FROM pos_sale WHERE tenant_id = $1 AND state = 'Completed'",
				[tenantId]
			);
			const postingBatch = record.payload as unknown as {
				postingBatch: {
					controlTotals: { grossSalesMinor: number };
					lines: readonly { sourceId: string; sourceType: string }[];
				};
			};
			expect(Number(rawGross.rows[0]?.gross_sales_minor)).toBe(
				postingBatch.postingBatch.controlTotals.grossSalesMinor
			);
			expect(
				postingBatch.postingBatch.lines.some(
					(line) => line.sourceType === "Sale" && line.sourceId === completed.id
				)
			).toBe(true);
		});
	}
);

describe.serial(
	"WS3 PR6 closeout: two-tenant isolation for the return/refund/deposit cash pairs",
	() => {
		test("keeps refund and deposit strictly tenant-scoped: tenant B cannot reference or approve/confirm tenant A's refund or deposit", async () => {
			const tenantA = "tenant_ws3_closeout_isolation_a";
			const tenantB = "tenant_ws3_closeout_isolation_b";
			const registerId = "register_ws3_closeout_isolation";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_closeout_isolation";
			const pos = posService();

			for (const tenantId of [tenantA, tenantB]) {
				// biome-ignore lint/performance/noAwaitInLoops: sequential fixture setup across exactly two tenants, not a hot loop.
				await pos.openRegister({
					...base,
					currency: "GYD",
					idempotencyKey: `isolation-open-${tenantId}`,
					locationId,
					openingFloat: { amountMinor: 100_000, currency: "GYD" },
					registerId,
					tenantId,
				});
				await seedStock({ locationId, productId, quantity: "5", tenantId });
			}

			const created = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "isolation-sale-create-a",
				lines: [
					{
						productId,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 50_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId: tenantA,
			});
			const completedA = await pos.completeSale({
				...base,
				idempotencyKey: "isolation-sale-complete-a",
				saleId: created.id,
				tenantId: tenantA,
				tenders: [{ amountMinor: 57_000, currency: "GYD", type: "Cash" }],
			});
			const returnCreatedA = await pos.createReturn({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				idempotencyKey: "isolation-return-create-a",
				lines: [
					{ quantity: "1", saleLineId: completedA.lines[0]?.id as string },
				],
				organizationId: base.organizationId,
				reason: "Isolation fixture",
				saleId: completedA.id,
				tenantId: tenantA,
			});
			const returnApprovedA = await pos.approveReturn({
				actorUserId: "ws3_closeout_isolation_return_checker",
				correlationId: base.correlationId,
				idempotencyKey: "isolation-return-approve-a",
				organizationId: base.organizationId,
				returnId: returnCreatedA.id,
				tenantId: tenantA,
			});
			const refundCreatedA = await pos.createRefund({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				idempotencyKey: "isolation-refund-create-a",
				organizationId: base.organizationId,
				returnId: returnApprovedA.id,
				tenantId: tenantA,
			});

			const crossTenantRefundApprove = await captureError(
				pos.approveRefund({
					actorUserId: "ws3_closeout_isolation_refund_checker",
					correlationId: base.correlationId,
					idempotencyKey: "isolation-refund-approve-cross",
					organizationId: base.organizationId,
					refundId: refundCreatedA.id,
					tenantId: tenantB,
				})
			);
			expect(crossTenantRefundApprove).toMatchObject({ code: "not_found" });

			const refundApprovedA = await pos.approveRefund({
				actorUserId: "ws3_closeout_isolation_refund_checker",
				correlationId: base.correlationId,
				idempotencyKey: "isolation-refund-approve-a",
				organizationId: base.organizationId,
				refundId: refundCreatedA.id,
				tenantId: tenantA,
			});
			expect(refundApprovedA.state).toBe("Posted");

			const safeDropA = await pos.createCashMovement({
				actorUserId: base.actorUserId,
				amount: { amountMinor: 20_000, currency: "GYD" },
				correlationId: base.correlationId,
				direction: "PaidOut",
				idempotencyKey: "isolation-safedrop-a",
				organizationId: base.organizationId,
				reasonCode: "SafeDrop",
				registerId,
				tenantId: tenantA,
			});
			const depositPreparedA = await pos.createDeposit({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				countedAmountMinor: 20_000,
				currency: "GYD",
				idempotencyKey: "isolation-deposit-create-a",
				organizationId: base.organizationId,
				sourceShiftIds: [safeDropA.sessionId],
				tenantId: tenantA,
			});

			const crossTenantDepositConfirm = await captureError(
				pos.confirmDeposit({
					actorUserId: "ws3_closeout_isolation_deposit_checker",
					correlationId: base.correlationId,
					depositId: depositPreparedA.id,
					idempotencyKey: "isolation-deposit-confirm-cross",
					organizationId: base.organizationId,
					tenantId: tenantB,
				})
			);
			expect(crossTenantDepositConfirm).toMatchObject({ code: "not_found" });

			const depositConfirmedA = await pos.confirmDeposit({
				actorUserId: "ws3_closeout_isolation_deposit_checker",
				correlationId: base.correlationId,
				depositId: depositPreparedA.id,
				idempotencyKey: "isolation-deposit-confirm-a",
				organizationId: base.organizationId,
				tenantId: tenantA,
			});
			expect(depositConfirmedA.state).toBe("Reconciled");

			// Tenant B never sees tenant A's rows in its own tenant-scoped reads.
			const tenantBRefundRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM pos_refund WHERE tenant_id = $1",
				[tenantB]
			);
			expect(tenantBRefundRows.rows[0]?.count).toBe("0");
			const tenantBDepositRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM pos_deposit WHERE tenant_id = $1",
				[tenantB]
			);
			expect(tenantBDepositRows.rows[0]?.count).toBe("0");
		});
	}
);

describe.serial(
	"WS3 PR6 closeout: application-boundary permission dispatch for the deposit pair",
	() => {
		test("denies deposit creation and confirmation through the application layer before dispatch, and dispatches once granted", async () => {
			const tenantId = "tenant_ws3_closeout_application";
			const registerId = "register_ws3_closeout_application";
			const locationId = `location_${registerId}`;
			const pos = posService();
			let grantedPermissions = new Set<string>();
			const application = createPosApplication({
				activeContexts: {
					requireActiveContext: () =>
						Promise.resolve({
							organizationId: base.organizationId,
							tenantId,
						}),
				},
				entitlements: { requireEntitlement: () => Promise.resolve() },
				permissions: {
					requirePermission: ({ permission }) => {
						if (!grantedPermissions.has(permission)) {
							return Promise.reject(
								new Error(`permission_denied:${permission}`)
							);
						}
						return Promise.resolve();
					},
				},
				service: pos,
			});

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "application-open",
				locationId,
				openingFloat: { amountMinor: 50_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			const safeDrop = await pos.createCashMovement({
				actorUserId: base.actorUserId,
				amount: { amountMinor: 10_000, currency: "GYD" },
				correlationId: base.correlationId,
				direction: "PaidOut",
				idempotencyKey: "application-safedrop",
				organizationId: base.organizationId,
				reasonCode: "SafeDrop",
				registerId,
				tenantId,
			});

			const deniedCreate = await captureError(
				application.createDeposit({
					actorUserId: base.actorUserId,
					contextId: "context_application",
					correlationId: base.correlationId,
					countedAmountMinor: 10_000,
					currency: "GYD",
					idempotencyKey: "application-deposit-create-denied",
					sessionId: "session_application",
					sourceShiftIds: [safeDrop.sessionId],
				})
			);
			expect((deniedCreate as Error).message).toBe(
				"permission_denied:commerce.deposit.create"
			);
			const noRowYet = await testPool.query(
				"SELECT 1 FROM pos_deposit WHERE tenant_id = $1",
				[tenantId]
			);
			expect(noRowYet.rows).toHaveLength(0);

			grantedPermissions = new Set(["commerce.deposit.create"]);
			const prepared = await application.createDeposit({
				actorUserId: base.actorUserId,
				contextId: "context_application",
				correlationId: base.correlationId,
				countedAmountMinor: 10_000,
				currency: "GYD",
				idempotencyKey: "application-deposit-create",
				sessionId: "session_application",
				sourceShiftIds: [safeDrop.sessionId],
			});
			expect(prepared.state).toBe("Prepared");

			const deniedConfirm = await captureError(
				application.confirmDeposit({
					actorUserId: "ws3_closeout_application_confirmer",
					contextId: "context_application",
					correlationId: base.correlationId,
					depositId: prepared.id,
					idempotencyKey: "application-deposit-confirm-denied",
					sessionId: "session_application",
				})
			);
			expect((deniedConfirm as Error).message).toBe(
				"permission_denied:commerce.deposit.confirm"
			);

			grantedPermissions = new Set([
				"commerce.deposit.create",
				"commerce.deposit.confirm",
			]);
			const confirmed = await application.confirmDeposit({
				actorUserId: "ws3_closeout_application_confirmer",
				contextId: "context_application",
				correlationId: base.correlationId,
				depositId: prepared.id,
				idempotencyKey: "application-deposit-confirm",
				sessionId: "session_application",
			});
			expect(confirmed.state).toBe("Reconciled");
		});
	}
);

function percentile(samples: readonly number[], quantile: number): number {
	const sorted = [...samples].sort((left, right) => left - right);
	return sorted[Math.max(0, Math.ceil(sorted.length * quantile) - 1)] ?? 0;
}

function metrics(samples: readonly number[]) {
	return {
		count: samples.length,
		maximum: Math.max(...samples),
		p50: percentile(samples, 0.5),
		p95: percentile(samples, 0.95),
		p99: percentile(samples, 0.99),
	};
}

/** Mirrors `pos.integration.test.ts`'s own `reportBudgetDisposition`
 * (frozen control plan §12 MEASURED-not-asserted requirement) for the
 * three PR3/PR4 commands the PR2 lane's own budget test does not cover:
 * return approval, refund approval, and deposit confirmation. No governed
 * numeric target names these three commands specifically (§12 names only
 * "platform sale processing"), so this records real retained p50/p95/p99
 * samples as a DESIGN-budget-free measurement rather than asserting an
 * invented pass/fail threshold — satisfying `performance_and_capacity`
 * with real reproduced numbers, not a fabricated target. */
function reportMeasurement(metric: string, samples: readonly number[]): void {
	process.stdout.write(
		`${JSON.stringify({
			environment:
				"isolated local PostgreSQL 18 database; warm bun:test process; Windows dev host (not representative production hardware)",
			limitation:
				"service-to-owner-transaction timing for a bounded live command/read; excludes browser and network latency; no governed numeric target names this specific command",
			metric,
			samples: samples.map((value) => Math.round(value * 100) / 100),
			unit: "milliseconds",
			...metrics(samples),
		})}\n`
	);
}

describe.serial(
	"WS3 PR6 closeout: register open/close command latency measurement",
	() => {
		test("records bounded register-open and zero-variance register-close command samples (performance_and_capacity, real reproduced numbers)", async () => {
			const tenantId = "tenant_ws3_closeout_register_perf";
			const pos = posService();
			const sampleSize = 20;
			const openSamples: number[] = [];
			const closeSamples: number[] = [];
			for (let index = 0; index < sampleSize; index += 1) {
				const registerId = `register_ws3_closeout_register_perf_${index}`;
				const openStart = performance.now();
				// biome-ignore lint/performance/noAwaitInLoops: measures each sequential command's own latency; a bounded n=20 diagnostic, not a hot loop.
				await pos.openRegister({
					...base,
					currency: "GYD",
					idempotencyKey: `register-perf-open-${index}`,
					locationId: `location_${registerId}`,
					openingFloat: { amountMinor: 10_000, currency: "GYD" },
					registerId,
					tenantId,
				});
				openSamples.push(performance.now() - openStart);

				const closeStart = performance.now();
				const closed = await pos.closeRegister({
					...base,
					countedCash: { amountMinor: 10_000, currency: "GYD" },
					idempotencyKey: `register-perf-close-${index}`,
					registerId,
					tenantId,
				});
				closeSamples.push(performance.now() - closeStart);
				expect(closed.state).toBe("Closed");
			}
			reportMeasurement("pos-register-open", openSamples);
			reportMeasurement("pos-register-close-zero-variance", closeSamples);
			expect(openSamples).toHaveLength(sampleSize);
			expect(closeSamples).toHaveLength(sampleSize);
		}, 60_000);
	}
);

describe.serial(
	"WS3 PR6 closeout: return/refund/deposit command latency measurement",
	() => {
		test("records bounded return-approval, refund-approval, and deposit-confirmation command samples (performance_and_capacity, real reproduced numbers)", async () => {
			const tenantId = "tenant_ws3_closeout_perf";
			const registerId = "register_ws3_closeout_perf";
			const locationId = `location_${registerId}`;
			const productId = "product_ws3_closeout_perf";
			const pos = posService();
			const sampleSize = 20;

			await pos.openRegister({
				...base,
				currency: "GYD",
				idempotencyKey: "perf-open",
				locationId,
				openingFloat: { amountMinor: 5_000_000, currency: "GYD" },
				registerId,
				tenantId,
			});
			await seedStock({ locationId, productId, quantity: "1000", tenantId });

			const returnApprovalSamples: number[] = [];
			const refundApprovalSamples: number[] = [];
			for (let index = 0; index < sampleSize; index += 1) {
				const prefix = `perf-${index}`;
				// biome-ignore lint/performance/noAwaitInLoops: measures each sequential command's own latency; a bounded n=20 diagnostic, not a hot loop.
				const created = await pos.createSale({
					...base,
					currency: "GYD",
					idempotencyKey: `${prefix}-sale-create`,
					lines: [
						{
							productId,
							quantity: "1",
							unit: "each",
							unitPrice: { amountMinor: 10_000, currency: "GYD" },
						},
					],
					registerId,
					tenantId,
				});
				const completed = await pos.completeSale({
					...base,
					idempotencyKey: `${prefix}-sale-complete`,
					saleId: created.id,
					tenantId,
					tenders: [{ amountMinor: 11_400, currency: "GYD", type: "Cash" }],
				});
				const returnCreated = await pos.createReturn({
					actorUserId: base.actorUserId,
					correlationId: base.correlationId,
					idempotencyKey: `${prefix}-return-create`,
					lines: [
						{ quantity: "1", saleLineId: completed.lines[0]?.id as string },
					],
					organizationId: base.organizationId,
					reason: "Perf sample",
					saleId: completed.id,
					tenantId,
				});
				const returnStart = performance.now();
				const returnApproved = await pos.approveReturn({
					actorUserId: `perf_return_checker_${index}`,
					correlationId: base.correlationId,
					idempotencyKey: `${prefix}-return-approve`,
					organizationId: base.organizationId,
					returnId: returnCreated.id,
					tenantId,
				});
				returnApprovalSamples.push(performance.now() - returnStart);

				const refundCreated = await pos.createRefund({
					actorUserId: base.actorUserId,
					correlationId: base.correlationId,
					idempotencyKey: `${prefix}-refund-create`,
					organizationId: base.organizationId,
					returnId: returnApproved.id,
					tenantId,
				});
				const refundStart = performance.now();
				await pos.approveRefund({
					actorUserId: `perf_refund_checker_${index}`,
					correlationId: base.correlationId,
					idempotencyKey: `${prefix}-refund-approve`,
					organizationId: base.organizationId,
					refundId: refundCreated.id,
					tenantId,
				});
				refundApprovalSamples.push(performance.now() - refundStart);
			}
			reportMeasurement("pos-return-approval", returnApprovalSamples);
			reportMeasurement("pos-refund-approval", refundApprovalSamples);
			expect(returnApprovalSamples).toHaveLength(sampleSize);
			expect(refundApprovalSamples).toHaveLength(sampleSize);

			const depositConfirmSamples: number[] = [];
			for (let index = 0; index < sampleSize; index += 1) {
				const prefix = `perf-deposit-${index}`;
				// biome-ignore lint/performance/noAwaitInLoops: sequential by design.
				const safeDrop = await pos.createCashMovement({
					actorUserId: base.actorUserId,
					amount: { amountMinor: 1000, currency: "GYD" },
					correlationId: base.correlationId,
					direction: "PaidOut",
					idempotencyKey: `${prefix}-safedrop`,
					organizationId: base.organizationId,
					reasonCode: "SafeDrop",
					registerId,
					tenantId,
				});
				const prepared = await pos.createDeposit({
					actorUserId: base.actorUserId,
					correlationId: base.correlationId,
					countedAmountMinor: 1000,
					currency: "GYD",
					idempotencyKey: `${prefix}-deposit-create`,
					organizationId: base.organizationId,
					sourceShiftIds: [safeDrop.sessionId],
					tenantId,
				});
				const depositStart = performance.now();
				await pos.confirmDeposit({
					actorUserId: `perf_deposit_checker_${index}`,
					correlationId: base.correlationId,
					depositId: prepared.id,
					idempotencyKey: `${prefix}-deposit-confirm`,
					organizationId: base.organizationId,
					tenantId,
				});
				depositConfirmSamples.push(performance.now() - depositStart);
			}
			reportMeasurement("pos-deposit-confirm", depositConfirmSamples);
			expect(depositConfirmSamples).toHaveLength(sampleSize);

			// Gift-receipt reissue (`commerce.gift-receipts`' own realization,
			// frozen control plan §5: a `priceSuppressed: true` variant of
			// `commerce.receipt.issued.v1` produced through the reissue path)
			// and the exchange composition's own `approveReturn` leg (`commerce.
			// exchanges`' realization, §6.5) share their command family with the
			// samples already retained above (`pos-return-approval` measures the
			// exact `approveReturn` command an exchange's return leg also
			// invokes); this block retains the reissue-specific samples the
			// return/refund/deposit loop above does not exercise.
			const created = await pos.createSale({
				...base,
				currency: "GYD",
				idempotencyKey: "perf-reissue-sale-create",
				lines: [
					{
						productId,
						quantity: "1",
						unit: "each",
						unitPrice: { amountMinor: 10_000, currency: "GYD" },
					},
				],
				registerId,
				tenantId,
			});
			const completedForReissue = await pos.completeSale({
				...base,
				idempotencyKey: "perf-reissue-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [{ amountMinor: 11_400, currency: "GYD", type: "Cash" }],
			});
			const reissueSamples: number[] = [];
			for (let index = 0; index < sampleSize; index += 1) {
				const reissueStart = performance.now();
				// biome-ignore lint/performance/noAwaitInLoops: measures each sequential command's own latency; a bounded n=20 diagnostic, not a hot loop.
				await pos.reissueReceipt({
					actorUserId: base.actorUserId,
					correlationId: base.correlationId,
					idempotencyKey: `perf-reissue-${index}`,
					organizationId: base.organizationId,
					priceSuppressed: true,
					receiptId: completedForReissue.receiptId as string,
					tenantId,
				});
				reissueSamples.push(performance.now() - reissueStart);
			}
			reportMeasurement("pos-gift-receipt-reissue", reissueSamples);
			expect(reissueSamples).toHaveLength(sampleSize);
			// Explicit 60s test timeout (third test() argument), mirroring pos.
			// integration.test.ts's own perf-test override: this test runs three
			// n=20 sequential sale+return+refund+deposit round-trip chains
			// (well over 100 live PostgreSQL round trips total), which can
			// approach bun's default 5000ms per-test ceiling under load.
		}, 60_000);
	}
);
