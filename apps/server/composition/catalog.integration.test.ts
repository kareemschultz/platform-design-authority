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

function service(failEvents = false) {
	return createCatalogService({
		clock: () => new Date(),
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
		expect(updated.variants[0]?.identifiers[0]?.id).toBe(identifier.id);
		expect(updated.variants[0]?.identifiers).toHaveLength(2);
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
});
