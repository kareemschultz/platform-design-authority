import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
	type CatalogIdFactory,
	createCatalogService,
} from "@meridian/domain-catalog";
import {
	createCatalogRepository,
	migrateCatalog,
} from "@meridian/persistence-catalog-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_catalog_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;

const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function percentile(values: number[], fraction: number): number {
	const ordered = values.toSorted((left, right) => left - right);
	return ordered[Math.ceil(ordered.length * fraction) - 1] ?? 0;
}

async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
		return null;
	} catch (error) {
		return error;
	}
}

const ids: CatalogIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

function service(failEvents = false, clock: () => Date = () => new Date()) {
	return createCatalogService({
		clock,
		ids,
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: failEvents
				? {
						append: () => Promise.reject(new Error("injected outbox failure")),
					}
				: createPostgresOutbox(client),
			repository: createCatalogRepository(client),
		})),
	});
}

const productInput = {
	actorUserId: "user_catalog_integration",
	body: {
		name: "Ground Coffee",
		variants: [
			{
				identifiers: [
					{
						scheme: "GTIN-12" as const,
						type: "UPC" as const,
						value: "012345678905",
					},
				],
				name: "500g",
			},
		],
	},
	correlationId: "correlation_catalog_integration",
	idempotencyKey: "idempotency_catalog_integration_create",
	organizationId: "organization_catalog_integration",
	tenantId: "tenant_catalog_integration_a",
};

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 4 });
	await migratePlatformEvents(testPool);
	await migrateCatalog(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("Catalog PostgreSQL controlled prototype", () => {
	test("migrates cleanly and repeats through its owner-specific history", async () => {
		await migrateCatalog(testPool);
		const tables = await testPool.query<{ table_name: string }>(
			"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name LIKE 'catalog_%' ORDER BY table_name"
		);
		expect(tables.rows.map((row) => row.table_name)).toEqual([
			"catalog_identifier",
			"catalog_product",
			"catalog_product_command_receipt",
			"catalog_product_search_projection",
			"catalog_variant",
		]);
	});

	test("persists a Product plus outbox events and replays without duplicate effects", async () => {
		const catalog = service();
		const created = await catalog.createProduct(productInput);
		const replay = await catalog.createProduct(productInput);

		expect(replay).toEqual(created);
		const counts = await testPool.query<{
			identifiers: string;
			outbox: string;
			products: string;
			receipts: string;
			variants: string;
		}>(`SELECT
			(SELECT count(*) FROM catalog_product)::text AS products,
			(SELECT count(*) FROM catalog_variant)::text AS variants,
			(SELECT count(*) FROM catalog_identifier)::text AS identifiers,
			(SELECT count(*) FROM catalog_product_command_receipt)::text AS receipts,
			(SELECT count(*) FROM platform_event_outbox)::text AS outbox`);
		expect(counts.rows[0]).toEqual({
			identifiers: "1",
			outbox: "3",
			products: "1",
			receipts: "1",
			variants: "1",
		});
	});

	test("enforces tenant isolation and tenant-local normalized uniqueness", async () => {
		const catalog = service();
		const first = await catalog.listProducts(productInput.tenantId, {
			limit: 50,
		});
		expect(first.items).toHaveLength(1);
		expect(
			await captureError(
				catalog.getProduct(
					"tenant_catalog_integration_b",
					first.items[0]?.id ?? ""
				)
			)
		).toMatchObject({ code: "not_found" });

		expect(
			await captureError(
				catalog.createProduct({
					...productInput,
					body: { ...productInput.body, name: "Duplicate Coffee" },
					idempotencyKey: "idempotency_catalog_integration_duplicate",
				})
			)
		).toMatchObject({ code: "identifier_conflict" });

		const tenantB = await catalog.createProduct({
			...productInput,
			idempotencyKey: "idempotency_catalog_integration_tenant_b",
			tenantId: "tenant_catalog_integration_b",
		});
		expect(tenantB.name).toBe("Ground Coffee");
	});

	test("preserves child identity on name update and enforces expected versions", async () => {
		const catalog = service();
		const [current] = (
			await catalog.listProducts(productInput.tenantId, { limit: 50 })
		).items;
		if (!current) {
			throw new Error("expected seeded Product");
		}
		const [variant] = current.variants;
		const [identifier] = variant?.identifiers ?? [];
		if (!(variant && identifier)) {
			throw new Error("expected seeded Variant and Identifier");
		}
		const updated = await catalog.updateProduct({
			...productInput,
			body: {
				name: "Ground Coffee Dark Roast",
				variants: [
					{
						id: variant.id,
						identifiers: [
							{ ...identifier },
							{ scheme: "Tenant", type: "Alias", value: "Dark Roast Bag" },
						],
						name: "500g dark roast",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_integration_update",
			productId: current.id,
			version: current.version,
		});
		expect(updated.variants[0]?.id).toBe(variant.id);
		expect(updated.variants[0]?.identifiers).toHaveLength(2);
		expect(
			updated.variants[0]?.identifiers.find(
				(candidate) => candidate.id === identifier.id
			)
		).toMatchObject({
			id: identifier.id,
			scheme: identifier.scheme,
			type: identifier.type,
			value: identifier.value,
		});
		expect(updated.version).toBe(current.version + 1);

		expect(
			await captureError(
				catalog.updateProduct({
					...productInput,
					body: { name: "Stale" },
					idempotencyKey: "idempotency_catalog_integration_stale",
					productId: current.id,
					version: current.version,
				})
			)
		).toMatchObject({ code: "version_conflict" });
	});

	test("rejects invalid lifecycle transitions through preconditioned commands", async () => {
		const catalog = service();
		const created = await catalog.createProduct({
			...productInput,
			body: {
				name: "Lifecycle Product",
				variants: [
					{
						identifiers: [
							{
								scheme: "Tenant",
								type: "SKU",
								value: "LIFECYCLE-SKU",
							},
						],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_lifecycle_create",
		});
		const active = await catalog.activateProduct({
			...productInput,
			idempotencyKey: "idempotency_catalog_lifecycle_activate",
			productId: created.id,
			version: created.version,
		});

		expect(
			await captureError(
				catalog.activateProduct({
					...productInput,
					idempotencyKey: "idempotency_catalog_lifecycle_reactivate",
					productId: active.id,
					version: active.version,
				})
			)
		).toMatchObject({
			code: "invalid_state",
			message: "Only Draft or Suspended Products may be activated",
		});

		const archived = await catalog.archiveProduct({
			...productInput,
			body: { reason: "Lifecycle evidence" },
			idempotencyKey: "idempotency_catalog_lifecycle_archive",
			productId: active.id,
			version: active.version,
		});
		expect(
			await captureError(
				catalog.archiveProduct({
					...productInput,
					body: { reason: "Duplicate archive" },
					idempotencyKey: "idempotency_catalog_lifecycle_rearchive",
					productId: archived.id,
					version: archived.version,
				})
			)
		).toMatchObject({
			code: "invalid_state",
			message: "The Product is already archived",
		});
	});

	test("enforces Catalog enum invariants at the database boundary", async () => {
		const invalidState = await captureError(
			testPool.query(
				"UPDATE catalog_product SET state = 'Unknown' WHERE tenant_id = $1",
				[productInput.tenantId]
			)
		);
		expect(invalidState).toMatchObject({
			code: "23514",
			constraint: "catalog_product_state_check",
		});

		const invalidType = await captureError(
			testPool.query(
				"UPDATE catalog_identifier SET type = 'Unknown' WHERE tenant_id = $1",
				[productInput.tenantId]
			)
		);
		expect(invalidType).toMatchObject({
			code: "23514",
			constraint: "catalog_identifier_type_check",
		});

		const invalidScheme = await captureError(
			testPool.query(
				"UPDATE catalog_identifier SET scheme = 'Unknown' WHERE tenant_id = $1",
				[productInput.tenantId]
			)
		);
		expect(invalidScheme).toMatchObject({
			code: "23514",
			constraint: "catalog_identifier_scheme_check",
		});
	});

	test("does not disclose another tenant's barcode through lookup", async () => {
		const catalog = service();
		const tenantB = "tenant_catalog_integration_b";
		const tenantBOnlyBarcode = "4006381333931";
		await catalog.createProduct({
			...productInput,
			body: {
				name: "Tenant B Barcode Product",
				variants: [
					{
						identifiers: [
							{
								scheme: "GTIN-13",
								type: "EAN",
								value: tenantBOnlyBarcode,
							},
						],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_tenant_b_barcode",
			tenantId: tenantB,
		});

		expect(
			await catalog.listProducts(tenantB, {
				barcode: tenantBOnlyBarcode,
				limit: 50,
			})
		).toHaveProperty("items.length", 1);
		expect(
			await catalog.listProducts(productInput.tenantId, {
				barcode: tenantBOnlyBarcode,
				limit: 50,
			})
		).toEqual({ items: [], nextCursor: null });
		expect(
			await catalog.listProducts(productInput.tenantId, {
				barcode: "9999999999999",
				limit: 50,
			})
		).toEqual({ items: [], nextCursor: null });
	});

	test("does not disclose exact SKUs across tenants and filters by governed state", async () => {
		const catalog = service();
		const tenantB = "tenant_catalog_integration_b";
		const tenantBProduct = await catalog.createProduct({
			...productInput,
			body: {
				name: "Tenant B SKU Product",
				variants: [
					{
						identifiers: [
							{ scheme: "Tenant", type: "SKU", value: "TENANT-B-ONLY" },
						],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_tenant_b_sku",
			tenantId: tenantB,
		});
		expect(
			await catalog.listProducts(tenantB, {
				limit: 50,
				sku: " tenant-b-only ",
			})
		).toHaveProperty("items.0.id", tenantBProduct.id);
		expect(
			await catalog.listProducts(productInput.tenantId, {
				limit: 50,
				sku: "TENANT-B-ONLY",
			})
		).toEqual({ items: [], nextCursor: null });

		const draft = await catalog.createProduct({
			...productInput,
			body: {
				name: "State Filter Draft",
				variants: [
					{
						identifiers: [
							{ scheme: "Tenant", type: "SKU", value: "STATE-DRAFT" },
						],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_state_draft",
		});
		const activeCandidate = await catalog.createProduct({
			...productInput,
			body: {
				name: "State Filter Active",
				variants: [
					{
						identifiers: [
							{ scheme: "Tenant", type: "SKU", value: "STATE-ACTIVE" },
						],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_state_active_create",
		});
		const active = await catalog.activateProduct({
			...productInput,
			idempotencyKey: "idempotency_catalog_state_active",
			productId: activeCandidate.id,
			version: activeCandidate.version,
		});
		const activeResults = await catalog.listProducts(productInput.tenantId, {
			limit: 50,
			state: "Active",
		});
		expect(activeResults.items.map((item) => item.id)).toContain(active.id);
		expect(activeResults.items.every((item) => item.state === "Active")).toBe(
			true
		);
		const draftResults = await catalog.listProducts(productInput.tenantId, {
			limit: 50,
			state: "Draft",
		});
		expect(draftResults.items.map((item) => item.id)).toContain(draft.id);
		expect(draftResults.items.every((item) => item.state === "Draft")).toBe(
			true
		);
	});

	test("walks newest-first cursor pages with no duplicate or skipped Products, exercises the same-instant id tiebreak, and rejects a malformed cursor", async () => {
		// A deterministic, strictly increasing clock (rather than the shared
		// `service()` helper's wall clock) proves two things a wall-clock test
		// cannot: (1) newest-first order is driven by `createdAt`, not creation
		// sequence coincidentally matching `id` order — the regression this
		// guards is apps/web/e2e/authenticated-operations.spec.ts's "create a
		// Product, return to the list, find it" scenario silently regressing to
		// the old id-only sort; (2) the id tiebreak fires and is deterministic
		// for two Products created in the exact same instant (the last two
		// created below share one timestamp), which a wall clock would only
		// exercise by chance.
		let tick = 0;
		const clock = () => {
			const at = new Date(2025, 0, 1, 0, 0, 0, tick);
			tick += 1;
			return at;
		};
		const catalog = service(false, clock);
		const tenantId = "tenant_catalog_cursor_walk";
		const createdIds: string[] = [];
		for (let index = 0; index < 5; index += 1) {
			const sameInstantAsPrevious = index === 4;
			if (sameInstantAsPrevious) {
				tick -= 1;
			}
			// biome-ignore lint/performance/noAwaitInLoops: each create must land before the next so the injected clock produces a deterministic, strictly ordered (bar the final intentional tie) createdAt sequence.
			const created = await catalog.createProduct({
				...productInput,
				body: {
					name: `Cursor Walk Product ${index}`,
					variants: [
						{
							identifiers: [
								{
									scheme: "Tenant",
									type: "SKU",
									value: `CURSOR-WALK-${index}`,
								},
							],
							name: "Default",
						},
					],
				},
				idempotencyKey: `idempotency_catalog_cursor_walk_${index}`,
				tenantId,
			});
			createdIds.push(created.id);
		}
		// The last two Products share a createdAt instant; the id tiebreak
		// (descending) resolves their relative order deterministically.
		const [tiedFirst, tiedSecond] = [...createdIds.slice(3)].sort().reverse();
		if (!(tiedFirst && tiedSecond)) {
			throw new Error("expected two tied Products");
		}

		const pages: string[][] = [];
		let cursor: string | undefined;
		do {
			// biome-ignore lint/performance/noAwaitInLoops: each page's cursor comes from the previous page's response.
			const page = await catalog.listProducts(tenantId, { cursor, limit: 2 });
			pages.push(page.items.map((item) => item.id));
			cursor = page.nextCursor ?? undefined;
		} while (cursor);

		const walked = pages.flat();
		expect(pages.map((page) => page.length)).toEqual([2, 2, 1]);
		expect(walked).toHaveLength(createdIds.length);
		expect(new Set(walked).size).toBe(createdIds.length);
		expect(walked).toEqual([
			tiedFirst,
			tiedSecond,
			...[...createdIds.slice(0, 3)].reverse(),
		]);

		expect(
			await captureError(
				catalog.listProducts(tenantId, {
					cursor: "not-a-real-cursor",
					limit: 2,
				})
			)
		).toMatchObject({ message: "Catalog product cursor is invalid" });
	});

	test("stores and finds numeric tenant SKUs without removing separators", async () => {
		const catalog = service();
		const tenantId = "tenant_catalog_separator_sku";
		const created = await catalog.createProduct({
			...productInput,
			body: {
				name: "Separator SKU Product",
				variants: [
					{
						identifiers: [{ scheme: "Tenant", type: "SKU", value: "12-34" }],
						name: "Default",
					},
				],
			},
			idempotencyKey: "idempotency_catalog_separator_sku",
			tenantId,
		});
		const stored = await testPool.query<{ normalized_value: string }>(
			"SELECT normalized_value FROM catalog_identifier WHERE tenant_id = $1 AND type = 'SKU'",
			[tenantId]
		);

		expect(stored.rows).toEqual([{ normalized_value: "12-34" }]);
		expect(
			await catalog.listProducts(tenantId, { limit: 50, sku: " 12-34 " })
		).toHaveProperty("items.0.id", created.id);
		expect(
			await catalog.listProducts(tenantId, { limit: 50, sku: "1234" })
		).toEqual({ items: [], nextCursor: null });
		expect(
			await captureError(
				catalog.listProducts(tenantId, { limit: 50, sku: "   " })
			)
		).toMatchObject({
			code: "invalid_identifier",
			message: "SKU lookup is empty",
		});
		expect(
			await createCatalogRepository(testPool).listProducts(tenantId, {
				limit: 50,
				sku: "",
			})
		).toEqual({ items: [], nextCursor: null });
	});

	test("rolls Product, receipt, and outbox state back together on append failure", async () => {
		const before = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM catalog_product"
		);
		let caught: unknown;
		try {
			await service(true).createProduct({
				...productInput,
				body: {
					name: "Rollback Product",
					variants: [
						{
							identifiers: [
								{ scheme: "Tenant", type: "SKU", value: "ROLLBACK-SKU" },
							],
							name: "Default",
						},
					],
				},
				idempotencyKey: "idempotency_catalog_integration_rollback",
			});
		} catch (error) {
			caught = error;
		}
		expect(caught).toBeInstanceOf(Error);
		const after = await testPool.query<{ count: string }>(
			"SELECT count(*)::text AS count FROM catalog_product"
		);
		expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
		expect(
			await testPool.query(
				"SELECT 1 FROM catalog_product_command_receipt WHERE idempotency_key = $1",
				["idempotency_catalog_integration_rollback"]
			)
		).toHaveProperty("rowCount", 0);
	});

	test("meets provisional warm barcode and text-query budgets on representative data", async () => {
		const catalog = service();
		const barcodeDurations: number[] = [];
		const searchDurations: number[] = [];
		for (let index = 0; index < 30; index += 1) {
			let startedAt = performance.now();
			// biome-ignore lint/performance/noAwaitInLoops: sequential samples measure one representative client without pool fan-out.
			const barcode = await catalog.listProducts(productInput.tenantId, {
				barcode: "012345678905",
				limit: 50,
			});
			barcodeDurations.push(performance.now() - startedAt);
			expect(barcode.items).toHaveLength(1);

			startedAt = performance.now();
			const search = await catalog.listProducts(productInput.tenantId, {
				limit: 50,
				query: "Dark Roast",
			});
			searchDurations.push(performance.now() - startedAt);
			expect(search.items).toHaveLength(1);
		}
		expect(percentile(barcodeDurations, 0.95)).toBeLessThanOrEqual(300);
		expect(percentile(searchDurations, 0.95)).toBeLessThanOrEqual(800);
	});

	test("records bounded aggregate command samples for Variant, Identifier, and lifecycle paths", async () => {
		const catalog = service();
		const durations: number[] = [];
		for (let index = 0; index < 5; index += 1) {
			const suffix = crypto.randomUUID().slice(0, 8);
			const startedAt = performance.now();
			// biome-ignore lint/performance/noAwaitInLoops: the diagnostic samples preserve command order and version preconditions.
			const created = await catalog.createProduct({
				...productInput,
				body: {
					name: `Closeout aggregate ${suffix}`,
					variants: [
						{
							identifiers: [
								{
									scheme: "Tenant",
									type: "SKU",
									value: `CLOSEOUT-${suffix}`,
								},
							],
							name: "Default",
						},
					],
				},
				idempotencyKey: `closeout-create-${suffix}`,
			});
			const active = await catalog.activateProduct({
				...productInput,
				idempotencyKey: `closeout-activate-${suffix}`,
				productId: created.id,
				version: created.version,
			});
			await catalog.archiveProduct({
				...productInput,
				body: { reason: "Controlled closeout diagnostic" },
				idempotencyKey: `closeout-archive-${suffix}`,
				productId: active.id,
				version: active.version,
			});
			durations.push(performance.now() - startedAt);
		}
		expect(durations).toHaveLength(5);
		expect(percentile(durations, 0.95)).toBeLessThan(5000);
	});
});
