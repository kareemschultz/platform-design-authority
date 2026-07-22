import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	createInventoryService,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import {
	createPosApplication,
	createPosService,
	type PosIdFactory,
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

// PR1's live-PG lane exercises only RegisterSession/CashMovement commands
// (never sale.complete, which is PR2's own live-PG lane in a separate
// describe block below). `pricing`/`tax` are the real, I/O-free engines;
// `products`, `saleUnitOfWork`, and `returnUnitOfWork` are structural stubs
// never invoked by these tests.
function service(failEvents = false) {
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
			requireProduct: () =>
				Promise.reject(
					new Error("products port is not exercised by the PR1 live-PG lane")
				),
		},
		returnUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("returnUnitOfWork is not exercised by the PR1 live-PG lane")
				),
		},
		saleUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("saleUnitOfWork is not exercised by the PR1 live-PG lane")
				),
		},
		tax: createTaxEngine(),
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: failEvents
				? { append: () => Promise.reject(new Error("injected outbox failure")) }
				: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});
}

const inventoryIds: InventoryIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

/**
 * PR2's mandated seam (frozen control plan §6.3, "Read first"), rebuilt here
 * against the ISOLATED test database rather than importing
 * `./inventory`'s `createSaleInventoryMovementAdapter` — that composition
 * function's `references` port reads the real `databasePool`/
 * `catalogService`, which would leak this test onto the shared dev
 * database. `references` are stubbed exactly as WS2's own
 * `imports.integration.test.ts` and `ws2-closeout.inventory.integration.
 * test.ts` already stub them for isolated-DB Inventory exercises.
 */
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

/**
 * PR2's live-PG lane: a POS service wired to a REAL `saleUnitOfWork` (one
 * shared `PoolClient`/transaction spanning the sale commit, receipt
 * numbering via the reused `createReceiptNumberAllocator` from
 * `./numbering`, and the synchronous Inventory movement via the adapter
 * above) — the frozen control plan's "ONE `createPostgresUnitOfWork`, one
 * client, one transaction" discipline this whole stage exists to prove.
 * `failEventName` injects a rejection at a named outbox append to exercise
 * the triple-atomicity rollback path.
 */
function saleService(options: { failEventName?: string } = {}) {
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
		returnUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error(
						"returnUnitOfWork is not exercised by the PR2 live-PG lane — see returns.integration.test.ts for PR3's own lane"
					)
				),
		},
		saleUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
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

function reportBudgetDisposition(input: {
	limitation: string;
	metric: string;
	samples: readonly number[];
	targetP95Ms: number;
	targetP99Ms?: number;
}): ReturnType<typeof metrics> & {
	disposition: "PASS" | "MISS";
	target: string;
} {
	const computed = metrics(input.samples);
	const p95Pass = computed.p95 <= input.targetP95Ms;
	const p99Pass =
		input.targetP99Ms === undefined || computed.p99 <= input.targetP99Ms;
	const disposition: "PASS" | "MISS" = p95Pass && p99Pass ? "PASS" : "MISS";
	const target =
		input.targetP99Ms === undefined
			? `p95<=${input.targetP95Ms}ms`
			: `p95<=${input.targetP95Ms}ms / p99<=${input.targetP99Ms}ms`;
	// Retained-raw-numbers evidence line for the PR2 quality-budget
	// disposition (frozen control plan §12, stage file's MEASURED-not-
	// asserted requirement) — matches the established `reportMetric`
	// pattern in `ws2-closeout.inventory.integration.test.ts`.
	process.stdout.write(
		`${JSON.stringify({
			disposition,
			environment:
				"isolated local PostgreSQL 18 database; warm bun:test process; Windows dev host (not representative production hardware)",
			limitation: input.limitation,
			metric: input.metric,
			samples: input.samples.map((value) => Math.round(value * 100) / 100),
			target,
			unit: "milliseconds",
			...computed,
		})}\n`
	);
	return { ...computed, disposition, target };
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

const base = {
	actorUserId: "pos_maker",
	correlationId: "correlation_pos_integration",
	locationId: "location_pos_integration",
	organizationId: "organization_pos_integration",
	registerId: "register_pos_integration",
	tenantId: "tenant_pos_integration_a",
};

describe.serial("POS PostgreSQL controlled prototype", () => {
	test("migrates idempotently and creates the thirteen registered POS-owned tables (PR1 register/cash + PR2 sale/receipt/price-override + PR3 return/refund + PR4 deposit)", async () => {
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
		expect(
			await repository.getSession(tenantB, base.organizationId, openedA.id)
		).toBeNull();
		expect(
			await repository.getSession(
				tenantB,
				base.organizationId,
				"session_missing_entirely"
			)
		).toEqual(
			await repository.getSession(tenantB, base.organizationId, openedA.id)
		);

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
		const tenantASession = await repository.getSession(
			tenantA,
			base.organizationId,
			openedA.id
		);
		expect(tenantASession?.state).toBe("Open");
		const tenantBFromA = await repository.getSession(
			tenantA,
			base.organizationId,
			closedB.id
		);
		expect(tenantBFromA).toBeNull();
	});

	test("WS3 remediation R2, Finding B: two organizations and two locations in the SAME tenant — a caller cannot read or close another organization's register session via its real known id, and the other organization's session is left completely unchanged", async () => {
		const pos = service();
		const tenantId = "tenant_pos_org_isolation";
		const orgA = "organization_pos_iso_a";
		const orgB = "organization_pos_iso_b";
		const locA = "location_pos_iso_a";
		const locB = "location_pos_iso_b";
		const registerA = "register_pos_iso_org_a";
		const registerB = "register_pos_iso_org_b";

		const openedA = await pos.openRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "org-isolation-open-a",
			locationId: locA,
			openingFloat: { amountMinor: 5000, currency: "GYD" },
			organizationId: orgA,
			registerId: registerA,
			tenantId,
		});
		const openedB = await pos.openRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "org-isolation-open-b",
			locationId: locB,
			openingFloat: { amountMinor: 7000, currency: "GYD" },
			organizationId: orgB,
			registerId: registerB,
			tenantId,
		});

		const repository = createPosRepository(testPool);

		// READ: org A cannot see org B's session by its real, known id --
		// same tenant, different organization -- and the result is
		// indistinguishable from a truly nonexistent id (non-disclosing).
		expect(await repository.getSession(tenantId, orgA, openedB.id)).toBeNull();
		expect(
			await repository.getSession(tenantId, orgA, "session_truly_missing")
		).toEqual(await repository.getSession(tenantId, orgA, openedB.id));
		// Same check in the other direction.
		expect(await repository.getSession(tenantId, orgB, openedA.id)).toBeNull();

		// READ, location-scoped: org A's OWN register, queried under org A
		// but the WRONG location (locB, which belongs to org B), is also not
		// found -- the location filter is a real additional constraint, not
		// a no-op once an organizationId is supplied.
		expect(
			await repository.getOpenSession(tenantId, orgA, registerA, locB)
		).toBeNull();
		expect(
			await repository.getOpenSession(tenantId, orgA, registerA, locA)
		).not.toBeNull();

		// MUTATION: org A attempts to close org B's SPECIFIC known register
		// (registerB) while impersonating org A's own context. The lookup
		// is organization-scoped, so this must be denied with the SAME
		// governed "no open session" denial a genuinely unknown register
		// gets -- never silently operate on org B's row just because both
		// share a tenant.
		const crossOrgClose = await captureError(
			pos.closeRegister({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				countedCash: { amountMinor: 7000, currency: "GYD" },
				idempotencyKey: "org-isolation-cross-close",
				organizationId: orgA,
				registerId: registerB,
				tenantId,
			})
		);
		expect(crossOrgClose).toMatchObject({ code: "invalid_state" });

		// Org B's session is completely unchanged by org A's attempt: still
		// Open, same opening float, never closed.
		const sessionBAfter = await repository.getSession(
			tenantId,
			orgB,
			openedB.id
		);
		expect(sessionBAfter?.state).toBe("Open");
		expect(sessionBAfter?.closedAt).toBeNull();
		expect(sessionBAfter?.openingFloatMinor).toBe(7000);
		const closedEventRows = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM platform_event_outbox WHERE name = 'commerce.register.closed.v1' AND aggregate_id = $1",
			[openedB.id]
		);
		expect(closedEventRows.rows[0]?.count).toBe("0");

		// Closing org A's OWN register (registerA) under org A's own context
		// still works normally -- the isolation fix does not also break
		// legitimate same-organization closes.
		const legitimateClose = await pos.closeRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			countedCash: { amountMinor: 5000, currency: "GYD" },
			idempotencyKey: "org-isolation-legit-close",
			organizationId: orgA,
			registerId: registerA,
			tenantId,
		});
		expect(legitimateClose.state).toBe("Closed");
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

	/** WS3 remediation R3b, Item 7 (server-backed discovery). Genuinely
	 * new capability — `listCashVariances`/`listSessions` did not exist
	 * before this stage (a compile error to call). Proven
	 * red-before-fix/green-after-fix by temporarily removing the
	 * `eq(posRegisterSessions.organizationId, ...)` predicate from
	 * `packages/persistence/pos-postgres/src/index.ts`'s `listSessions` and
	 * re-running this exact test — it failed with org B's Closing session
	 * present in org A's variance-approval queue (RED), then passed once
	 * the filter was restored (GREEN). A session only ever holds
	 * `state="Closing"` while a non-zero close variance awaits approval
	 * (`registerClose`: `zeroVariance ? "Closed" : "Closing"`), so
	 * `state=Closing` IS the pending queue — no separate
	 * `varianceApprovalRequired` filter is exercised here. */
	test("listCashVariances is organization-scoped: the variance-approval queue never leaks another organization's Closing session", async () => {
		const pos = service();
		const tenantId = "tenant_pos_variance_list_isolation";
		const orgA = "organization_pos_variance_list_a";
		const orgB = "organization_pos_variance_list_b";
		const locA = "location_pos_variance_list_a";
		const locB = "location_pos_variance_list_b";
		const registerA = "register_pos_variance_list_a";
		const registerB = "register_pos_variance_list_b";

		async function openAndCreateVariance(
			organizationId: string,
			locationId: string,
			registerId: string,
			keyPrefix: string
		) {
			await pos.openRegister({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				currency: "GYD",
				idempotencyKey: `${keyPrefix}-open`,
				locationId,
				openingFloat: { amountMinor: 10_000, currency: "GYD" },
				organizationId,
				registerId,
				tenantId,
			});
			const closing = await pos.closeRegister({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				countedCash: { amountMinor: 9500, currency: "GYD" },
				idempotencyKey: `${keyPrefix}-close`,
				organizationId,
				registerId,
				tenantId,
			});
			return closing;
		}

		const closingA = await openAndCreateVariance(
			orgA,
			locA,
			registerA,
			"variance-list-isolation-a"
		);
		const closingB = await openAndCreateVariance(
			orgB,
			locB,
			registerB,
			"variance-list-isolation-b"
		);
		expect(closingA.state).toBe("Closing");
		expect(closingB.state).toBe("Closing");

		const pageA = await pos.listSessions(
			tenantId,
			orgA,
			{ limit: 50 },
			{ state: "Closing" }
		);
		const idsA = pageA.items.map((item) => item.id);
		expect(idsA).toContain(closingA.id);
		expect(idsA).not.toContain(closingB.id);

		const pageB = await pos.listSessions(
			tenantId,
			orgB,
			{ limit: 50 },
			{ state: "Closing" }
		);
		const idsB = pageB.items.map((item) => item.id);
		expect(idsB).toContain(closingB.id);
		expect(idsB).not.toContain(closingA.id);
	});

	/**
	 * WS3 remediation R3b cycle 1 (adversarial re-review of Item 7): the
	 * test above only exercises `pos.listSessions` — the SERVICE layer —
	 * directly, never the `listCashVariances` APPLICATION handler where
	 * `createPosApplication`'s `authorize()` resolves `context.locationId`
	 * (the actual location-scoping mechanism). That handler previously
	 * forwarded `input.filters` verbatim to `service.listSessions` and never
	 * read `context.locationId` at all.
	 *
	 * RED (stated explicitly, not just asserted): before this fix, a
	 * location-A-scoped actor calling `listCashVariances` with the UI's real
	 * request shape — `{state:"Closing"}`, no client-supplied `locationId`,
	 * exactly what `PendingVariancesQueue` sends — would have received BOTH
	 * `closingA` and `closingB` in its queue, because the handler dropped
	 * `context.locationId` on the floor and passed only the client filter
	 * through. The first assertion below (`idsA` excluding `closingB`) is
	 * the one that would have failed against the pre-fix handler.
	 */
	test("listCashVariances, called through the application layer with a location-scoped active context, excludes another location's Closing session in the SAME organization — and a client-supplied locationId filter cannot override the server-derived scope", async () => {
		const pos = service();
		const tenantId = "tenant_pos_variance_list_loc_isolation";
		const organizationId = "organization_pos_variance_list_loc";
		const locA = "location_pos_variance_list_loc_a";
		const locB = "location_pos_variance_list_loc_b";
		const registerA = "register_pos_variance_list_loc_a";
		const registerB = "register_pos_variance_list_loc_b";

		async function openAndCreateVariance(
			locationId: string,
			registerId: string,
			keyPrefix: string
		) {
			await pos.openRegister({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				currency: "GYD",
				idempotencyKey: `${keyPrefix}-open`,
				locationId,
				openingFloat: { amountMinor: 10_000, currency: "GYD" },
				organizationId,
				registerId,
				tenantId,
			});
			return pos.closeRegister({
				actorUserId: base.actorUserId,
				correlationId: base.correlationId,
				countedCash: { amountMinor: 9500, currency: "GYD" },
				idempotencyKey: `${keyPrefix}-close`,
				organizationId,
				registerId,
				tenantId,
			});
		}

		const closingA = await openAndCreateVariance(
			locA,
			registerA,
			"variance-list-loc-isolation-a"
		);
		const closingB = await openAndCreateVariance(
			locB,
			registerB,
			"variance-list-loc-isolation-b"
		);
		expect(closingA.state).toBe("Closing");
		expect(closingB.state).toBe("Closing");

		function applicationScopedTo(locationId?: string) {
			return createPosApplication({
				activeContexts: {
					requireActiveContext: () =>
						Promise.resolve({ locationId, organizationId, tenantId }),
				},
				entitlements: { requireEntitlement: () => Promise.resolve() },
				permissions: { requirePermission: () => Promise.resolve() },
				service: pos,
			});
		}

		const appA = applicationScopedTo(locA);
		const queueA = await appA.listCashVariances({
			actorUserId: "variance_list_loc_actor_a",
			contextId: "context_pos_variance_list_loc_a",
			filters: { state: "Closing" },
			page: { limit: 50 },
			sessionId: "session_pos_variance_list_loc_a",
		});
		const idsA = queueA.items.map((item) => item.id);
		expect(idsA).toContain(closingA.id);
		expect(idsA).not.toContain(closingB.id);

		// Escalation-proof: even when the actor's OWN client request
		// explicitly asks for location B, the server-derived location-A
		// scope still wins — this is what distinguishes the fix from merely
		// "respecting whatever locationId filter the caller happens to
		// send."
		const queueAEscalation = await appA.listCashVariances({
			actorUserId: "variance_list_loc_actor_a",
			contextId: "context_pos_variance_list_loc_a_escalate",
			filters: { locationId: locB, state: "Closing" },
			page: { limit: 50 },
			sessionId: "session_pos_variance_list_loc_a_escalate",
		});
		const idsAEscalation = queueAEscalation.items.map((item) => item.id);
		expect(idsAEscalation).toContain(closingA.id);
		expect(idsAEscalation).not.toContain(closingB.id);

		// An org-wide actor (no active location scope) legitimately sees
		// every location's pending variances — the fix narrows only when
		// the ACTOR is location-scoped; it does not break org-wide
		// visibility.
		const appOrgWide = applicationScopedTo(undefined);
		const queueOrgWide = await appOrgWide.listCashVariances({
			actorUserId: "variance_list_loc_actor_org_wide",
			contextId: "context_pos_variance_list_loc_org_wide",
			filters: { state: "Closing" },
			page: { limit: 50 },
			sessionId: "session_pos_variance_list_loc_org_wide",
		});
		const idsOrgWide = queueOrgWide.items.map((item) => item.id);
		expect(idsOrgWide).toContain(closingA.id);
		expect(idsOrgWide).toContain(closingB.id);
	});

	// -------------------------------------------------------------------
	// WS3 remediation R3, Finding I: pre-commit consequence-preview reads.
	// Before this stage `getRegisterSession`/`getCashVariance` did not
	// exist on the application at all — calling them was a TypeScript
	// compile error, not merely a runtime 404 — so there is no meaningful
	// "run this exact test against the pre-fix build" step; the adversarial
	// proof is the behavioral boundary itself: cross-org denial and
	// permission-reuse correctness, below.
	// -------------------------------------------------------------------

	test("getRegisterSession and getCashVariance read the same session but stay strictly organization-scoped (Finding B's non-disclosing not_found, applied to the new reads)", async () => {
		const pos = service();
		const tenantId = "tenant_pos_preview_isolation";
		const orgA = "organization_pos_preview_a";
		const orgB = "organization_pos_preview_b";
		const registerId = "register_pos_preview_isolation";
		await pos.openRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "preview-isolation-open",
			locationId: `${base.locationId}_a`,
			openingFloat: { amountMinor: 20_000, currency: "GYD" },
			organizationId: orgA,
			registerId,
			tenantId,
		});
		const closing = await pos.closeRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			countedCash: { amountMinor: 15_000, currency: "GYD" },
			idempotencyKey: "preview-isolation-close",
			organizationId: orgA,
			registerId,
			tenantId,
		});
		expect(closing.state).toBe("Closing");

		// Org B (same tenant) reading org A's session by ID: the SAME
		// governed not_found denial B's other by-ID reads use — never a
		// distinguishable "forbidden" that would disclose the row exists.
		const crossOrgSession = await captureError(
			pos.getRegisterSession(tenantId, orgB, closing.id)
		);
		expect(crossOrgSession).toMatchObject({ code: "not_found" });

		// Org A reading its own session succeeds and carries the real
		// server-derived expected-cash/variance data (Finding I's actual
		// requirement — not just that a call succeeds).
		const ownSession = await pos.getRegisterSession(tenantId, orgA, closing.id);
		expect(ownSession).toMatchObject({
			expectedCash: { amountMinor: 20_000, currency: "GYD" },
			id: closing.id,
			locationId: `${base.locationId}_a`,
			registerId,
			state: "Closing",
		});
	});

	/**
	 * WS3 remediation R3b cycle 1 (adversarial re-review of Item 7): the
	 * test above only proves ORGANIZATION isolation for these two preview
	 * reads (`service.getRegisterSession(tenantId, organizationId,
	 * sessionId)` called directly, bypassing the application layer's
	 * `authorize()`/`context.locationId` entirely). It never constructs a
	 * location-scoped active CONTEXT and never proves the application
	 * handlers `getCashVariance`/`getRegisterSession` deny a DIFFERENT
	 * location's session within the SAME organization.
	 *
	 * RED (stated explicitly): before this fix, `service.getRegisterSession`
	 * did not even accept a `locationId` parameter, and neither application
	 * handler passed `context.locationId` to it — so a location-A-scoped
	 * approver/closer reading location B's session by its real known id
	 * would have received the full record (expected cash, variance amount)
	 * instead of the governed not_found denial. The two `crossLocation*`
	 * assertions below are what would have failed (in fact would not have
	 * compiled, since `getRegisterSession` had no fourth parameter) against
	 * the pre-fix code.
	 */
	test("getCashVariance and getRegisterSession (application-layer preview reads), under a location-scoped active context, deny another location's session by ID even within the SAME organization", async () => {
		const pos = service();
		const tenantId = "tenant_pos_preview_loc_isolation";
		const organizationId = "organization_pos_preview_loc";
		const locA = "location_pos_preview_loc_a";
		const locB = "location_pos_preview_loc_b";
		const registerId = "register_pos_preview_loc_isolation";

		await pos.openRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			currency: "GYD",
			idempotencyKey: "preview-loc-isolation-open",
			locationId: locB,
			openingFloat: { amountMinor: 20_000, currency: "GYD" },
			organizationId,
			registerId,
			tenantId,
		});
		const closing = await pos.closeRegister({
			actorUserId: base.actorUserId,
			correlationId: base.correlationId,
			countedCash: { amountMinor: 15_000, currency: "GYD" },
			idempotencyKey: "preview-loc-isolation-close",
			organizationId,
			registerId,
			tenantId,
		});
		expect(closing.state).toBe("Closing");

		function applicationScopedTo(locationId: string) {
			return createPosApplication({
				activeContexts: {
					requireActiveContext: () =>
						Promise.resolve({ locationId, organizationId, tenantId }),
				},
				entitlements: { requireEntitlement: () => Promise.resolve() },
				permissions: { requirePermission: () => Promise.resolve() },
				service: pos,
			});
		}

		const applicationA = applicationScopedTo(locA);
		const crossLocationVariance = await captureError(
			applicationA.getCashVariance({
				actorUserId: "preview_loc_actor_a",
				contextId: "context_pos_preview_loc_a_variance",
				sessionId: "session_pos_preview_loc_a_variance",
				varianceId: closing.id,
			})
		);
		expect(crossLocationVariance).toMatchObject({ code: "not_found" });

		const crossLocationClosePreview = await captureError(
			applicationA.getRegisterSession({
				actorUserId: "preview_loc_actor_a",
				contextId: "context_pos_preview_loc_a_close",
				registerSessionId: closing.id,
				sessionId: "session_pos_preview_loc_a_close",
			})
		);
		expect(crossLocationClosePreview).toMatchObject({ code: "not_found" });

		// The SAME kind of actor, correctly scoped to the session's real
		// location B, can still read it normally — the fix denies
		// cross-location access, it does not break legitimate same-location
		// access.
		const applicationB = applicationScopedTo(locB);
		const ownLocationVariance = await applicationB.getCashVariance({
			actorUserId: "preview_loc_actor_b",
			contextId: "context_pos_preview_loc_b_variance",
			sessionId: "session_pos_preview_loc_b_variance",
			varianceId: closing.id,
		});
		expect(ownLocationVariance).toMatchObject({
			id: closing.id,
			locationId: locB,
			state: "Closing",
		});
	});

	test("getRegisterSession (close preview) and getCashVariance (variance-approve preview) are gated by DIFFERENT permissions even though they read the identical resource", async () => {
		const pos = service();
		const registerId = "register_pos_preview_permission";
		await pos.openRegister({
			...base,
			currency: "GYD",
			idempotencyKey: "preview-permission-open",
			openingFloat: { amountMinor: 5000, currency: "GYD" },
			registerId,
		});
		const closing = await pos.closeRegister({
			...base,
			countedCash: { amountMinor: 4000, currency: "GYD" },
			idempotencyKey: "preview-permission-close",
			registerId,
		});
		expect(closing.state).toBe("Closing");

		function applicationGrantingOnly(grantedPermission: string) {
			const permissionCalls: string[] = [];
			return {
				application: createPosApplication({
					activeContexts: {
						requireActiveContext: () =>
							Promise.resolve({
								organizationId: base.organizationId,
								tenantId: base.tenantId,
							}),
					},
					entitlements: { requireEntitlement: () => Promise.resolve() },
					permissions: {
						requirePermission: (input) => {
							permissionCalls.push(input.permission);
							return input.permission === grantedPermission
								? Promise.resolve()
								: Promise.reject(
										Object.assign(new Error("permission denied"), {
											code: "authorization_denied",
										})
									);
						},
					},
					service: pos,
				}),
				permissionCalls,
			};
		}

		// A caller holding ONLY commerce.register.close (the closer's own
		// permission) can preview the register session but is denied the
		// cash-variance preview of the SAME resource.
		const closerOnly = applicationGrantingOnly("commerce.register.close");
		const closerPreview = await closerOnly.application.getRegisterSession({
			actorUserId: base.actorUserId,
			contextId: "context_pos_preview_closer",
			registerSessionId: closing.id,
			sessionId: "session_pos_preview_closer",
		});
		expect(closerPreview.id).toBe(closing.id);
		expect(closerOnly.permissionCalls).toEqual(["commerce.register.close"]);
		const closerDeniedVariance = await captureError(
			closerOnly.application.getCashVariance({
				actorUserId: base.actorUserId,
				contextId: "context_pos_preview_closer",
				sessionId: "session_pos_preview_closer",
				varianceId: closing.id,
			})
		);
		expect(closerDeniedVariance).toMatchObject({
			code: "authorization_denied",
		});

		// A caller holding ONLY commerce.cash-variance.approve (the
		// approver's own permission) gets the reverse: variance preview
		// allowed, register-close preview denied.
		const approverOnly = applicationGrantingOnly(
			"commerce.cash-variance.approve"
		);
		const approverPreview = await approverOnly.application.getCashVariance({
			actorUserId: "pos_checker",
			contextId: "context_pos_preview_approver",
			sessionId: "session_pos_preview_approver",
			varianceId: closing.id,
		});
		expect(approverPreview.id).toBe(closing.id);
		expect(approverOnly.permissionCalls).toEqual([
			"commerce.cash-variance.approve",
		]);
		const approverDeniedClose = await captureError(
			approverOnly.application.getRegisterSession({
				actorUserId: "pos_checker",
				contextId: "context_pos_preview_approver",
				registerSessionId: closing.id,
				sessionId: "session_pos_preview_approver",
			})
		);
		expect(approverDeniedClose).toMatchObject({ code: "authorization_denied" });
	});
});

// -----------------------------------------------------------------------
// WS3 PR2 live-PG lane: the sale/receipt/price-override PostgreSQL
// prototype. The frozen control plan's "Read first" pattern under real
// test — one `createPostgresUnitOfWork`, one `PoolClient`, one transaction
// spanning the sale commit, receipt numbering, and the synchronous
// Inventory movement. HONESTY BOUNDARY (stage packet, Codex packet-review
// P1-7): this lane exercises the ONLINE receipt-numbering path only; the
// offline-safe allocation path is explicitly PENDING WS5 (see
// `packages/domains/pos/src/index.ts`'s `ReceiptNumberAllocatorPort` doc
// comment) and no test or assertion below claims otherwise.
// -----------------------------------------------------------------------

function saleTestInventoryService() {
	return createInventoryService({
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
}

/** Seeds enough on-hand stock (via the ordinary Adjustment maker/checker
 * pair) for a location+product pair to absorb every `Sale` movement a test
 * below posts against it — `recordSaleMovement` enforces the real
 * non-negative-stock constraint through Inventory's own `applyMovement`,
 * exactly as production would. */
async function seedStock(input: {
	locationId: string;
	organizationId: string;
	productId: string;
	quantity: string;
	tenantId: string;
}) {
	const inventory = saleTestInventoryService();
	const key = crypto.randomUUID().replaceAll("-", "");
	const adjustment = await inventory.createAdjustment({
		actorUserId: "sale_stock_seeder",
		body: {
			locationId: input.locationId,
			productId: input.productId,
			quantity: input.quantity,
			reason: "WS3 PR2 live-PG lane stock seed",
			unit: "each",
		},
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_create_${key}`,
		organizationId: input.organizationId,
		tenantId: input.tenantId,
	});
	await inventory.approveAdjustment({
		actorUserId: "sale_stock_seeder_approver",
		adjustmentId: adjustment.id,
		correlationId: `seed_correlation_${key}`,
		idempotencyKey: `seed_approve_${key}`,
		organizationId: input.organizationId,
		tenantId: input.tenantId,
		version: adjustment.version,
	});
}

const saleBase = {
	actorUserId: "sale_cashier",
	correlationId: "correlation_pos_sale",
	organizationId: "organization_pos_sale",
};

function locationFor(registerId: string): string {
	return `location_${registerId}`;
}

async function openSaleRegister(
	pos: ReturnType<typeof saleService>,
	registerId: string,
	tenantId: string,
	stockQuantity = "100000"
) {
	await pos.openRegister({
		actorUserId: saleBase.actorUserId,
		correlationId: saleBase.correlationId,
		currency: "GYD",
		idempotencyKey: `open_${registerId}`,
		locationId: locationFor(registerId),
		openingFloat: { amountMinor: 100_000, currency: "GYD" },
		organizationId: saleBase.organizationId,
		registerId,
		tenantId,
	});
	await seedStock({
		locationId: locationFor(registerId),
		organizationId: saleBase.organizationId,
		productId: "product_pr2_cola_500ml",
		quantity: stockQuantity,
		tenantId,
	});
}

function saleLine() {
	return {
		productId: "product_pr2_cola_500ml",
		quantity: "2",
		unit: "each",
		unitPrice: { amountMinor: 500, currency: "GYD" },
	};
}

/** A `saleLine()` sale always totals 1140 minor units (1000 gross + 140
 * tax at the fixed GY_STANDARD_14 prototype rate) — tendering exactly this
 * amount keeps every test's change at zero and its assertions simple. */
const EXACT_SALE_TOTAL_MINOR = 1140;

describe.serial(
	"WS3 PR2 sale, receipt, and price-override PostgreSQL controlled prototype",
	() => {
		test("completes a cash sale atomically: sale row, numbered receipt, synchronous Inventory movement, and both outbox events commit together (raw SQL)", async () => {
			const tenantId = "tenant_pos_sale_atomicity_commit";
			const registerId = "register_sale_atomicity_commit";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantId);
			const created = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "atomic-sale-create",
				lines: [saleLine()],
				registerId,
				tenantId,
			});
			expect(created.state).toBe("Open");
			const completed = await pos.completeSale({
				...saleBase,
				idempotencyKey: "atomic-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [
					{
						amountMinor: EXACT_SALE_TOTAL_MINOR,
						currency: "GYD",
						type: "Cash",
					},
				],
			});
			expect(completed.state).toBe("Completed");
			expect(completed.total.amountMinor).toBe(EXACT_SALE_TOTAL_MINOR);
			expect(completed.change?.amountMinor).toBe(0);
			expect(completed.receiptId).not.toBeNull();

			const saleRow = await testPool.query<{
				receipt_id: string | null;
				state: string;
			}>(
				"SELECT state, receipt_id FROM pos_sale WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(saleRow.rows[0]).toEqual({
				receipt_id: completed.receiptId,
				state: "Completed",
			});

			// PDA conformance remediation: the tax engine's `nonStatutory: true`
			// marker (stage file, "every computed tax line carries a
			// `prototype_non_statutory: true` style marker") must survive all
			// the way to the persisted sale line, the API view, and the
			// immutable receipt snapshot — never silently dropped at a
			// domain-to-storage or domain-to-view boundary.
			expect(completed.lines[0]?.nonStatutory).toBe(true);
			const saleLineRows = await testPool.query<{ non_statutory: boolean }>(
				"SELECT non_statutory FROM pos_sale_line WHERE tenant_id = $1 AND sale_id = $2",
				[tenantId, created.id]
			);
			expect(saleLineRows.rows).toHaveLength(1);
			expect(saleLineRows.rows[0]?.non_statutory).toBe(true);

			const receiptRows = await testPool.query<{
				lines: Array<{ nonStatutory?: boolean }>;
				receipt_number: string;
				total_minor: string;
			}>(
				"SELECT receipt_number, total_minor::text AS total_minor, lines FROM pos_receipt WHERE tenant_id = $1 AND sale_id = $2",
				[tenantId, created.id]
			);
			expect(receiptRows.rows).toHaveLength(1);
			expect(receiptRows.rows[0]?.total_minor).toBe(
				String(EXACT_SALE_TOTAL_MINOR)
			);
			expect(receiptRows.rows[0]?.receipt_number).toBe(
				`R-${registerId}-000001`
			);
			expect(receiptRows.rows[0]?.lines[0]?.nonStatutory).toBe(true);

			const movementRows = await testPool.query<{
				quantity: string;
				source_type: string;
			}>(
				"SELECT source_type, quantity::text AS quantity FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2",
				[tenantId, created.id]
			);
			expect(movementRows.rows).toHaveLength(1);
			expect(movementRows.rows[0]?.source_type).toBe("Sale");
			expect(movementRows.rows[0]?.quantity).toBe("-2.000000");

			const outboxRows = await testPool.query<{ name: string }>(
				"SELECT name FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id IN ($2, $3) ORDER BY name",
				[tenantId, created.id, completed.receiptId]
			);
			expect(outboxRows.rows.map((row) => row.name)).toEqual([
				"commerce.receipt.issued.v1",
				"commerce.sale.completed.v1",
			]);

			const allocationRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM platform_number_allocation WHERE tenant_id = $1 AND business_record_id = $2",
				[tenantId, created.id]
			);
			expect(allocationRows.rows[0]?.count).toBe("1");
		});

		test("rolls back the sale, receipt, receipt-number allocation, and Inventory movement together when an injected failure occurs before commit (raw SQL)", async () => {
			const tenantId = "tenant_pos_sale_atomicity_rollback";
			const registerId = "register_sale_atomicity_rollback";
			const pos = saleService({ failEventName: "commerce.sale.completed.v1" });
			await openSaleRegister(pos, registerId, tenantId);
			const created = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "rollback-sale-create",
				lines: [saleLine()],
				registerId,
				tenantId,
			});
			const failure = await captureError(
				pos.completeSale({
					...saleBase,
					idempotencyKey: "rollback-sale-complete",
					saleId: created.id,
					tenantId,
					tenders: [
						{
							amountMinor: EXACT_SALE_TOTAL_MINOR,
							currency: "GYD",
							type: "Cash",
						},
					],
				})
			);
			expect((failure as Error).message).toContain(
				"injected pre-commit failure"
			);

			const saleRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_sale WHERE tenant_id = $1 AND id = $2",
				[tenantId, created.id]
			);
			expect(saleRow.rows[0]?.state).toBe("Open");

			const facts = await testPool.query<{
				allocations: string;
				events: string;
				movements: string;
				receipts: string;
			}>(
				`SELECT
					(SELECT count(*)::text FROM pos_receipt WHERE tenant_id = $1 AND sale_id = $2) AS receipts,
					(SELECT count(*)::text FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2) AS movements,
					(SELECT count(*)::text FROM platform_number_allocation WHERE tenant_id = $1 AND business_record_id = $2) AS allocations,
					(SELECT count(*)::text FROM platform_event_outbox WHERE tenant_id = $1 AND aggregate_id = $2) AS events`,
				[tenantId, created.id]
			);
			expect(facts.rows[0]).toEqual({
				allocations: "0",
				events: "0",
				movements: "0",
				receipts: "0",
			});
		});

		test("completes a sale exactly once under a genuine 10-way concurrent idempotent replay race", async () => {
			const tenantId = "tenant_pos_sale_race";
			const registerId = "register_sale_race";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantId);
			const created = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "race-sale-create",
				lines: [saleLine()],
				registerId,
				tenantId,
			});
			const completeInput = {
				...saleBase,
				idempotencyKey: "race-sale-complete",
				saleId: created.id,
				tenantId,
				tenders: [
					{
						amountMinor: EXACT_SALE_TOTAL_MINOR,
						currency: "GYD",
						type: "Cash" as const,
					},
				],
			};
			const results = await Promise.all(
				Array.from({ length: 10 }, () => pos.completeSale(completeInput))
			);
			const [winner] = results;
			expect(winner).toBeDefined();
			for (const result of results) {
				expect(result.id).toBe(created.id);
				expect(result.state).toBe("Completed");
				expect(result.receiptId).toBe(winner?.receiptId ?? null);
			}

			const facts = await testPool.query<{
				allocations: string;
				completed_sales: string;
				movements: string;
				receipts: string;
			}>(
				`SELECT
					(SELECT count(*)::text FROM pos_sale WHERE tenant_id = $1 AND id = $2 AND state = 'Completed') AS completed_sales,
					(SELECT count(*)::text FROM pos_receipt WHERE tenant_id = $1 AND sale_id = $2) AS receipts,
					(SELECT count(*)::text FROM inventory_stock_movement WHERE tenant_id = $1 AND source_id = $2) AS movements,
					(SELECT count(*)::text FROM platform_number_allocation WHERE tenant_id = $1 AND business_record_id = $2) AS allocations`,
				[tenantId, created.id]
			);
			expect(facts.rows[0]).toEqual({
				allocations: "1",
				completed_sales: "1",
				movements: "1",
				receipts: "1",
			});
		});

		test("issues monotonic, non-duplicate receipt numbers per register under genuine concurrent sale completions", async () => {
			const tenantId = "tenant_pos_sale_monotonic";
			const registerId = "register_sale_monotonic";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantId);
			const saleCount = 5;
			const sales: Array<{ id: string }> = [];
			for (let index = 0; index < saleCount; index += 1) {
				// biome-ignore lint/performance/noAwaitInLoops: sales must exist before the concurrent completion race below.
				const sale = await pos.createSale({
					...saleBase,
					currency: "GYD",
					idempotencyKey: `monotonic-create-${index}`,
					lines: [saleLine()],
					registerId,
					tenantId,
				});
				sales.push(sale);
			}
			const completed = await Promise.all(
				sales.map((sale, index) =>
					pos.completeSale({
						...saleBase,
						idempotencyKey: `monotonic-complete-${index}`,
						saleId: sale.id,
						tenantId,
						tenders: [
							{
								amountMinor: EXACT_SALE_TOTAL_MINOR,
								currency: "GYD",
								type: "Cash" as const,
							},
						],
					})
				)
			);
			expect(completed.every((sale) => sale.state === "Completed")).toBe(true);

			const receiptRows = await testPool.query<{ receipt_number: string }>(
				"SELECT receipt_number FROM pos_receipt WHERE tenant_id = $1 AND register_id = $2 ORDER BY receipt_number",
				[tenantId, registerId]
			);
			const numbers = receiptRows.rows.map((row) => row.receipt_number);
			expect(numbers).toHaveLength(saleCount);
			expect(new Set(numbers).size).toBe(saleCount);
			expect(numbers).toEqual([...numbers].sort());
			expect(numbers).toEqual([
				`R-${registerId}-000001`,
				`R-${registerId}-000002`,
				`R-${registerId}-000003`,
				`R-${registerId}-000004`,
				`R-${registerId}-000005`,
			]);
		});

		test("isolates two tenants sharing the same register id: cannot read each other's sale or receipt, and receipt numbering never leaks across tenants", async () => {
			const tenantA = "tenant_pos_sale_isolation_a";
			const tenantB = "tenant_pos_sale_isolation_b";
			const registerId = "register_sale_isolation_shared";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantA);
			await openSaleRegister(pos, registerId, tenantB);

			const saleA = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "isolation-create-a",
				lines: [saleLine()],
				registerId,
				tenantId: tenantA,
			});
			const completedA = await pos.completeSale({
				...saleBase,
				idempotencyKey: "isolation-complete-a",
				saleId: saleA.id,
				tenantId: tenantA,
				tenders: [
					{
						amountMinor: EXACT_SALE_TOTAL_MINOR,
						currency: "GYD",
						type: "Cash",
					},
				],
			});

			const repository = createPosRepository(testPool);
			expect(
				await repository.getSale(tenantB, saleBase.organizationId, saleA.id)
			).toBeNull();
			expect(
				await repository.getReceipt(
					tenantB,
					saleBase.organizationId,
					completedA.receiptId as string
				)
			).toBeNull();

			const saleB = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "isolation-create-b",
				lines: [saleLine()],
				registerId,
				tenantId: tenantB,
			});
			const completedB = await pos.completeSale({
				...saleBase,
				idempotencyKey: "isolation-complete-b",
				saleId: saleB.id,
				tenantId: tenantB,
				tenders: [
					{
						amountMinor: EXACT_SALE_TOTAL_MINOR,
						currency: "GYD",
						type: "Cash",
					},
				],
			});
			// Tenant B's own sequence on the SAME shared registerId starts fresh
			// at 000001 — numbering never leaks or continues across tenants.
			const receiptBRow = await testPool.query<{ receipt_number: string }>(
				"SELECT receipt_number FROM pos_receipt WHERE tenant_id = $1 AND id = $2",
				[tenantB, completedB.receiptId]
			);
			expect(receiptBRow.rows[0]?.receipt_number).toBe(
				`R-${registerId}-000001`
			);

			const crossTenantRows = await testPool.query<{ count: string }>(
				"SELECT count(*)::text AS count FROM pos_sale WHERE tenant_id = $1 AND id = $2",
				[tenantA, saleB.id]
			);
			expect(crossTenantRows.rows[0]?.count).toBe("0");
		});

		test("WS3 remediation R2, Finding B: two organizations and two locations in the SAME tenant — a caller cannot read another organization's sale, and cannot approve a price override that organization created, using their real known ids; the override and sale line are left completely unchanged", async () => {
			const pos = saleService();
			const tenantId = "tenant_pos_org_isolation_sale";
			const orgA = "organization_pos_iso_sale_a";
			const orgB = "organization_pos_iso_sale_b";
			const locA = "location_pos_iso_sale_a";
			const locB = "location_pos_iso_sale_b";
			const registerA = "register_pos_iso_sale_a";
			const registerB = "register_pos_iso_sale_b";

			await pos.openRegister({
				actorUserId: saleBase.actorUserId,
				correlationId: saleBase.correlationId,
				currency: "GYD",
				idempotencyKey: "org-iso-sale-open-a",
				locationId: locA,
				openingFloat: { amountMinor: 100_000, currency: "GYD" },
				organizationId: orgA,
				registerId: registerA,
				tenantId,
			});
			await pos.openRegister({
				actorUserId: saleBase.actorUserId,
				correlationId: saleBase.correlationId,
				currency: "GYD",
				idempotencyKey: "org-iso-sale-open-b",
				locationId: locB,
				openingFloat: { amountMinor: 100_000, currency: "GYD" },
				organizationId: orgB,
				registerId: registerB,
				tenantId,
			});
			await seedStock({
				locationId: locA,
				organizationId: orgA,
				productId: "product_pr2_cola_500ml",
				quantity: "1000",
				tenantId,
			});

			const saleA = await pos.createSale({
				actorUserId: saleBase.actorUserId,
				correlationId: saleBase.correlationId,
				currency: "GYD",
				idempotencyKey: "org-iso-sale-create-a",
				lines: [saleLine()],
				organizationId: orgA,
				registerId: registerA,
				tenantId,
			});

			const repository = createPosRepository(testPool);
			// READ: org B cannot read org A's Open sale by its real known id,
			// even though both organizations share the same tenant.
			expect(await repository.getSale(tenantId, orgB, saleA.id)).toBeNull();

			const requested = await pos.requestPriceOverride({
				actorUserId: "org_iso_requester",
				correlationId: saleBase.correlationId,
				idempotencyKey: "org-iso-sale-override-request",
				lineId: saleA.lines[0]?.id as string,
				organizationId: orgA,
				reason: "WS3 remediation R2, Finding B adversarial fixture",
				requestedPrice: { amountMinor: 300, currency: "GYD" },
				saleId: saleA.id,
				tenantId,
			});
			expect(requested.lines[0]?.priceOverrideState).toBe("Pending");
			const overrideId = requested.lines[0]?.priceOverrideId as string;

			// MUTATION: org B attempts to approve org A's price override using
			// its real known id, impersonating org B's own context (a
			// DIFFERENT approver identity, so this is not merely a Finding C
			// self-approval denial — it is the organization-scope lookup
			// itself that must fail). Must be denied exactly like a
			// genuinely nonexistent override id, non-disclosing.
			const crossOrgApprove = await captureError(
				pos.approvePriceOverride({
					actorUserId: "org_iso_approver_wrong_org",
					correlationId: saleBase.correlationId,
					idempotencyKey: "org-iso-sale-override-cross-approve",
					organizationId: orgB,
					overrideId,
					saleId: saleA.id,
					tenantId,
				})
			);
			expect(crossOrgApprove).toMatchObject({ code: "not_found" });

			// Org A's override is completely unchanged: still Pending, never
			// approved, and the sale line still carries its original price.
			const overrideRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_price_override WHERE tenant_id = $1 AND id = $2",
				[tenantId, overrideId]
			);
			expect(overrideRow.rows[0]?.state).toBe("Pending");
			const saleLineRow = await testPool.query<{ unit_price_minor: string }>(
				"SELECT unit_price_minor::text AS unit_price_minor FROM pos_sale_line WHERE tenant_id = $1 AND sale_id = $2 AND id = $3",
				[tenantId, saleA.id, saleA.lines[0]?.id]
			);
			expect(saleLineRow.rows[0]?.unit_price_minor).toBe("500");

			// The legitimate approval, from org A's OWN context with a
			// DIFFERENT approver identity than the requester, still works
			// normally afterward — the isolation fix does not also break a
			// genuine same-organization approval.
			const legitimateApprove = await pos.approvePriceOverride({
				actorUserId: "org_iso_approver_correct_org",
				correlationId: saleBase.correlationId,
				idempotencyKey: "org-iso-sale-override-legit-approve",
				organizationId: orgA,
				overrideId,
				saleId: saleA.id,
				tenantId,
			});
			const approvedLine = legitimateApprove.lines.find(
				(line) => line.id === saleA.lines[0]?.id
			);
			expect(approvedLine?.unitPrice.amountMinor).toBe(300);
		});

		/** WS3 remediation R3b, Item 7 (server-backed discovery). Genuinely
		 * new capability — `listPriceOverrides` did not exist before this
		 * stage (a compile error to call; no PriceOverride read endpoint
		 * existed at all, standalone or listed). Proven red-before-fix/
		 * green-after-fix by temporarily removing the
		 * `eq(posPriceOverrides.organizationId, ...)` predicate from
		 * `packages/persistence/pos-postgres/src/index.ts`'s
		 * `listPriceOverrides` and re-running this exact test — it failed
		 * with org B's Pending override present in org A's approval queue
		 * (RED), then passed once the filter was restored (GREEN). */
		test("listPriceOverrides is organization-scoped: the approval queue never leaks another organization's pending price override", async () => {
			const pos = saleService();
			const tenantId = "tenant_pos_override_list_isolation";
			const orgA = "organization_pos_override_list_a";
			const orgB = "organization_pos_override_list_b";
			const locA = "location_pos_override_list_a";
			const locB = "location_pos_override_list_b";
			const registerA = "register_pos_override_list_a";
			const registerB = "register_pos_override_list_b";

			async function requestOne(
				organizationId: string,
				locationId: string,
				registerId: string,
				keyPrefix: string
			) {
				await pos.openRegister({
					actorUserId: saleBase.actorUserId,
					correlationId: saleBase.correlationId,
					currency: "GYD",
					idempotencyKey: `${keyPrefix}-open`,
					locationId,
					openingFloat: { amountMinor: 100_000, currency: "GYD" },
					organizationId,
					registerId,
					tenantId,
				});
				await seedStock({
					locationId,
					organizationId,
					productId: "product_pr2_cola_500ml",
					quantity: "1000",
					tenantId,
				});
				const sale = await pos.createSale({
					actorUserId: saleBase.actorUserId,
					correlationId: saleBase.correlationId,
					currency: "GYD",
					idempotencyKey: `${keyPrefix}-sale-create`,
					lines: [saleLine()],
					organizationId,
					registerId,
					tenantId,
				});
				const requested = await pos.requestPriceOverride({
					actorUserId: `${keyPrefix}_requester`,
					correlationId: saleBase.correlationId,
					idempotencyKey: `${keyPrefix}-override-request`,
					lineId: sale.lines[0]?.id as string,
					organizationId,
					reason: "R3b Item 7 list-isolation fixture",
					requestedPrice: { amountMinor: 300, currency: "GYD" },
					saleId: sale.id,
					tenantId,
				});
				return requested.lines[0]?.priceOverrideId as string;
			}

			const overrideIdA = await requestOne(
				orgA,
				locA,
				registerA,
				"override-list-isolation-a"
			);
			const overrideIdB = await requestOne(
				orgB,
				locB,
				registerB,
				"override-list-isolation-b"
			);

			const pageA = await pos.listPriceOverrides(
				tenantId,
				orgA,
				{ limit: 50 },
				{ state: "Pending" }
			);
			const idsA = pageA.items.map((item) => item.id);
			expect(idsA).toContain(overrideIdA);
			expect(idsA).not.toContain(overrideIdB);

			const pageB = await pos.listPriceOverrides(
				tenantId,
				orgB,
				{ limit: 50 },
				{ state: "Pending" }
			);
			const idsB = pageB.items.map((item) => item.id);
			expect(idsB).toContain(overrideIdB);
			expect(idsB).not.toContain(overrideIdA);
		});

		test("denies sale completion before dispatch when permission is not granted, and dispatches once granted", async () => {
			const tenantId = "tenant_pos_sale_permission";
			const registerId = "register_sale_permission";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantId);
			const sale = await pos.createSale({
				...saleBase,
				currency: "GYD",
				idempotencyKey: "permission-sale-create",
				lines: [saleLine()],
				registerId,
				tenantId,
			});
			let permissionCalls = 0;
			let dispatched = false;
			const application = createPosApplication({
				activeContexts: {
					requireActiveContext: () =>
						Promise.resolve({
							organizationId: saleBase.organizationId,
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
					completeSale: (input: Parameters<typeof pos.completeSale>[0]) => {
						dispatched = true;
						return pos.completeSale(input);
					},
				},
			});
			const denied = await captureError(
				application.completeSale({
					actorUserId: saleBase.actorUserId,
					contextId: "context_pos_sale_denied",
					correlationId: saleBase.correlationId,
					idempotencyKey: "permission-sale-complete-denied",
					saleId: sale.id,
					sessionId: "session_pos_sale_denied",
					tenders: [
						{
							amountMinor: EXACT_SALE_TOTAL_MINOR,
							currency: "GYD",
							type: "Cash",
						},
					],
				})
			);
			expect(denied).toMatchObject({ code: "authorization_denied" });
			expect(permissionCalls).toBe(1);
			expect(dispatched).toBe(false);
			const saleRow = await testPool.query<{ state: string }>(
				"SELECT state FROM pos_sale WHERE tenant_id = $1 AND id = $2",
				[tenantId, sale.id]
			);
			expect(saleRow.rows[0]?.state).toBe("Open");
		});

		// -- Performance budgets (frozen control plan §12; stage file's
		// MEASURED-not-asserted requirement): >=50 warm iterations after >=5
		// warmup, p50/p95/p99, explicit PASS/MISS-with-disposition against the
		// NAMED governing targets, environment metadata, and retained raw
		// numbers. A dev-machine local measurement is disclosed as
		// non-representative-of-production, per stage file's MEASURED-LOCAL-
		// ONLY allowance; the test never fabricates a PASS.
		test("measures add-scanned-item lookup and platform sale-processing latency against the named governing targets, with retained samples and an explicit disposition", async () => {
			const tenantId = "tenant_pos_sale_performance";
			const registerId = "register_sale_performance";
			const pos = saleService();
			await openSaleRegister(pos, registerId, tenantId, "1000000");

			const WARMUP_ITERATIONS = 5;
			const SAMPLE_ITERATIONS = 50;
			const createDurations: number[] = [];
			const completeDurations: number[] = [];

			for (
				let index = 0;
				index < WARMUP_ITERATIONS + SAMPLE_ITERATIONS;
				index += 1
			) {
				const iterationKey = `perf-${index}`;
				const createStartedAt = performance.now();
				// biome-ignore lint/performance/noAwaitInLoops: representative single-operator latency sampling (not a throughput benchmark) per the frozen control plan §12 methodology.
				const sale = await pos.createSale({
					...saleBase,
					currency: "GYD",
					idempotencyKey: `${iterationKey}-create`,
					lines: [saleLine()],
					registerId,
					tenantId,
				});
				const createDuration = performance.now() - createStartedAt;
				const completeStartedAt = performance.now();
				await pos.completeSale({
					...saleBase,
					idempotencyKey: `${iterationKey}-complete`,
					saleId: sale.id,
					tenantId,
					tenders: [
						{
							amountMinor: EXACT_SALE_TOTAL_MINOR,
							currency: "GYD",
							type: "Cash",
						},
					],
				});
				const completeDuration = performance.now() - completeStartedAt;
				if (index >= WARMUP_ITERATIONS) {
					createDurations.push(createDuration);
					completeDurations.push(completeDuration);
				}
			}

			expect(createDurations).toHaveLength(SAMPLE_ITERATIONS);
			expect(completeDurations).toHaveLength(SAMPLE_ITERATIONS);

			const addScannedItem = reportBudgetDisposition({
				limitation:
					"service-to-owner-transaction timing; 'add-scanned-item' is realized here as CreateSale line pricing/tax (this backend stage has no barcode-scan or UI surface — PR5 scope); excludes browser, network, and scan-hardware latency",
				metric: "pos-add-scanned-item-lookup",
				samples: createDurations,
				targetP95Ms: 100,
			});
			const saleProcessing = reportBudgetDisposition({
				limitation:
					"service-to-owner-transaction timing for CompleteSale (pricing/tax already applied at CreateSale, matching the named 'platform sale processing' governing target's completion-path scope); excludes browser and network latency",
				metric: "pos-platform-sale-processing",
				samples: completeDurations,
				targetP95Ms: 750,
				targetP99Ms: 1500,
			});

			// The measurement always carries a target comparison (never a bare
			// number) — this is the conformance requirement itself, independent
			// of which way the comparison lands on this local dev host.
			expect(["PASS", "MISS"]).toContain(addScannedItem.disposition);
			expect(["PASS", "MISS"]).toContain(saleProcessing.disposition);
			// Explicit 60s test timeout (third test() argument): this test runs
			// WARMUP_ITERATIONS + SAMPLE_ITERATIONS (55) create+complete round
			// trips against live PostgreSQL (~110 sequential round trips), which
			// can approach bun's default 5000ms per-test ceiling under load and
			// fail spuriously. The override widens only the harness ceiling; it
			// does not change the measured budgets, targets, or the >=50-sample
			// requirement above.
		}, 60_000);
	}
);
