import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { createCatalogService } from "@meridian/domain-catalog";
import { createInventoryService } from "@meridian/domain-inventory";
import {
	createCatalogRepository,
	migrateCatalog,
} from "@meridian/persistence-catalog-postgres";
import {
	createInventoryRepository,
	migrateInventory,
} from "@meridian/persistence-inventory-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	createImportRepository,
	migratePlatformImportExport,
} from "@meridian/persistence-platform-import-export-postgres";
import {
	createImportService,
	type ImportTargetPort,
} from "@meridian/platform-import-export";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_imports_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string) {
	return `"${value.replaceAll('"', '""')}"`;
}
function idFactory() {
	return {
		create(kind: string) {
			return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
		},
	};
}

function fullEvent(event: Record<string, unknown>) {
	const name = String(event.name);
	return {
		actorId: "system:import-test",
		aggregateId: String(event.aggregateId),
		capabilityId: "platform.import-export",
		classification: "Confidential" as const,
		correlationId: String(event.correlationId),
		data: (event.data ?? {}) as Record<string, unknown>,
		id: String(event.id),
		idempotencyKey: `${event.aggregateId}:${name}`,
		name,
		occurredAt: new Date().toISOString(),
		producerNamespace: "platform",
		purpose: "bounded-data-import",
		retentionClass: "platform-import-operational-event",
		schemaRef: `schemas/events/${name}.schema.json`,
		schemaVersion: "1.0.0",
		scopeType: "Tenant" as const,
		sourceChannel: "test" as const,
		tenantId: String(event.tenantId),
	};
}

function createServices(options: { failAfterProductSourceKey?: string } = {}) {
	let injectedFailure = false;
	const catalog = createCatalogService({
		clock: () => new Date(),
		ids: idFactory(),
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createCatalogRepository(client),
		})),
	});
	const inventory = createInventoryService({
		clock: () => new Date(),
		ids: idFactory(),
		references: {
			requireLocation: () => Promise.resolve(),
			requireProduct: () => Promise.resolve(),
		},
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createInventoryRepository(client),
		})),
	});
	const targets: Record<"Product" | "OpeningStock", ImportTargetPort> = {
		OpeningStock: {
			async commit(input) {
				const data = input.row.normalizedData;
				const adjustment = await inventory.createAdjustment({
					actorUserId: input.createdByUserId,
					body: {
						locationId: data.location_id ?? "",
						productId: data.product_id ?? "",
						quantity: data.quantity ?? "0",
						reason: `Opening stock import ${input.row.importId}`,
						unit: data.unit ?? "",
						variantId: data.variant_id,
					},
					correlationId: input.correlationId,
					idempotencyKey: `${input.idempotencyKey}:create`,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const posted = await inventory.approveAdjustment({
					actorUserId: input.actorUserId,
					adjustmentId: adjustment.id,
					correlationId: input.correlationId,
					idempotencyKey: `${input.idempotencyKey}:approve`,
					tenantId: input.tenantId,
					version: adjustment.version,
				});
				return { targetId: posted.id };
			},
		},
		Product: {
			async commit(input) {
				const data = input.row.normalizedData;
				const product = await catalog.createProduct({
					actorUserId: input.actorUserId,
					body: {
						name: data.name ?? "",
						variants: [
							{
								identifiers: data.sku
									? [{ scheme: "Tenant", type: "SKU", value: data.sku }]
									: [],
								name: data.variant_name ?? "Default",
							},
						],
					},
					correlationId: input.correlationId,
					idempotencyKey: input.idempotencyKey,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				if (
					options.failAfterProductSourceKey === input.row.sourceKey &&
					!injectedFailure
				) {
					injectedFailure = true;
					throw new Error("injected failure after owner command commit");
				}
				return { targetId: product.id };
			},
		},
	};
	return createImportService({
		clock: () => new Date(),
		hash: {
			sha256: (content) =>
				Promise.resolve(createHash("sha256").update(content).digest("hex")),
		},
		ids: idFactory(),
		scanner: { scan: () => Promise.resolve("Clean") },
		targets,
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: {
				append: (event) =>
					createPostgresOutbox(client).append(fullEvent(event)),
			},
			repository: createImportRepository(client),
		})),
	});
}

const manifest = {
	decimalSeparator: "." as const,
	delimiter: "," as const,
	encoding: "UTF-8" as const,
	locale: "en-GY",
	newline: "LF" as const,
	quote: '"' as const,
	timezone: "America/Guyana",
};

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	await migratePlatformEvents(testPool);
	await migratePlatformImportExport(testPool);
	await migrateCatalog(testPool);
	await migrateInventory(testPool);
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial("WS2 bounded import PostgreSQL prototype", () => {
	test("dry-runs mixed Tenant A Product rows, commits accepted rows, and replays without duplicates", async () => {
		const service = createServices();
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nvalid-1,Ground Coffee,500g,SKU-IMPORT-1,,\nwarning-1,Identifierless Tea,Default,,,\nrejected-1,,Default,SKU-REJECTED,,\nduplicate-1,First Duplicate,Default,SKU-DUP-1,,\nduplicate-1,Second Duplicate,Default,SKU-DUP-2,,";
		const job = await service.create({
			actorUserId: "import_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_import_create",
			fileName: "products.csv",
			idempotencyKey: "product-import-create",
			manifest,
			organizationId: "organization_demerara",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_demerara_retail_test_group",
		});
		expect(job.counts).toEqual({
			applied: 0,
			failed: 0,
			rejected: 2,
			skipped: 0,
			total: 5,
			valid: 2,
			warning: 1,
		});
		expect(
			(
				await testPool.query(
					"SELECT count(*)::int AS count FROM catalog_product"
				)
			).rows[0]?.count
		).toBe(0);
		const completed = await service.approve({
			actorUserId: "import_approver",
			contextId: "context_demerara",
			correlationId: "correlation_import_approve",
			idempotencyKey: "product-import-approve",
			importId: job.id,
			sessionId: "session_demerara",
			target: "Product",
			tenantId: "tenant_demerara_retail_test_group",
			version: 1,
		});
		expect(completed.state).toBe("Completed");
		const replay = await service.approve({
			actorUserId: "import_approver",
			contextId: "context_demerara",
			correlationId: "correlation_import_replay",
			idempotencyKey: "product-import-approve",
			importId: job.id,
			sessionId: "session_demerara",
			target: "Product",
			tenantId: "tenant_demerara_retail_test_group",
			version: 1,
		});
		expect(replay.id).toBe(completed.id);
		const facts = await testPool.query<{
			events: number;
			products: number;
			receipts: number;
		}>(
			"SELECT (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_demerara_retail_test_group') AS products, (SELECT count(*)::int FROM catalog_product_command_receipt WHERE tenant_id = 'tenant_demerara_retail_test_group') AS receipts, (SELECT count(*)::int FROM platform_event_outbox WHERE tenant_id = 'tenant_demerara_retail_test_group') AS events"
		);
		expect(facts.rows[0]).toEqual({ events: 11, products: 3, receipts: 3 });
	});

	test("accepts a corrected Tenant B row without disclosing either tenant's import", async () => {
		const service = createServices();
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nrejected-1,Corrected Essequibo Tea,Default,ESQ-CORRECTED-1,,";
		const job = await service.create({
			actorUserId: "essequibo_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_essequibo_create",
			fileName: "corrected-products.csv",
			idempotencyKey: "essequibo-corrected-create",
			manifest,
			organizationId: "organization_essequibo_isolation",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_essequibo_isolation_test",
		});
		expect(job.counts).toMatchObject({ rejected: 0, total: 1, valid: 1 });
		expect(
			await service.get("tenant_demerara_retail_test_group", job.id, "Product")
		).toBeNull();
		await service.approve({
			actorUserId: "essequibo_approver",
			contextId: "context_essequibo",
			correlationId: "correlation_essequibo_approve",
			idempotencyKey: "essequibo-corrected-approve",
			importId: job.id,
			sessionId: "session_essequibo",
			target: "Product",
			tenantId: "tenant_essequibo_isolation_test",
			version: 1,
		});
		const product = await testPool.query<{ count: number }>(
			"SELECT count(*)::int AS count FROM catalog_product WHERE tenant_id = 'tenant_essequibo_isolation_test'"
		);
		expect(product.rows[0]?.count).toBe(1);
	});

	test("resumes after an owner effect/checkpoint crash and purges only terminal staging", async () => {
		const service = createServices({ failAfterProductSourceKey: "recover-2" });
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nrecover-1,Recovery One,Default,RECOVER-1,,\nrecover-2,Recovery Two,Default,RECOVER-2,,";
		const job = await service.create({
			actorUserId: "recovery_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_recovery_create",
			fileName: "recovery.csv",
			idempotencyKey: "recovery-create",
			manifest,
			organizationId: "organization_recovery",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_recovery",
		});
		const approval = {
			actorUserId: "recovery_approver",
			contextId: "context_recovery",
			correlationId: "correlation_recovery_approve",
			idempotencyKey: "recovery-approve",
			importId: job.id,
			sessionId: "session_recovery",
			target: "Product" as const,
			tenantId: "tenant_recovery",
			version: 1,
		};
		let injectedFailure: unknown;
		try {
			await service.approve(approval);
		} catch (error) {
			injectedFailure = error;
		}
		expect(injectedFailure).toMatchObject({
			message: "injected failure after owner command commit",
		});
		const checkpoint = await testPool.query<{
			last_completed_row: number;
			products: number;
			state: string;
		}>(
			"SELECT last_completed_row, state, (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_recovery') AS products FROM platform_import_job WHERE tenant_id = 'tenant_recovery' AND id = $1",
			[job.id]
		);
		expect(checkpoint.rows[0]).toEqual({
			last_completed_row: 1,
			products: 2,
			state: "Committing",
		});
		const completed = await service.approve(approval);
		expect(completed.state).toBe("Completed");
		const beforePurge = await testPool.query<{
			events: number;
			products: number;
			receipts: number;
		}>(
			"SELECT (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_recovery') AS products, (SELECT count(*)::int FROM catalog_product_command_receipt WHERE tenant_id = 'tenant_recovery') AS receipts, (SELECT count(*)::int FROM platform_event_outbox WHERE tenant_id = 'tenant_recovery') AS events"
		);
		expect(beforePurge.rows[0]).toEqual({
			events: 9,
			products: 2,
			receipts: 2,
		});
		expect(
			await service.purgeStaging({
				importId: job.id,
				purgedAt: new Date("2026-08-16T00:00:00Z"),
				target: "Product",
				tenantId: "tenant_recovery",
			})
		).toEqual({ findings: 0, rows: 2, waves: 1 });
		const afterPurge = await testPool.query<{
			events: number;
			jobs: number;
			products: number;
			rows: number;
		}>(
			"SELECT (SELECT count(*)::int FROM platform_import_row WHERE tenant_id = 'tenant_recovery') AS rows, (SELECT count(*)::int FROM platform_import_job WHERE tenant_id = 'tenant_recovery' AND staging_purged_at IS NOT NULL) AS jobs, (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_recovery') AS products, (SELECT count(*)::int FROM platform_event_outbox WHERE tenant_id = 'tenant_recovery') AS events"
		);
		expect(afterPurge.rows[0]).toEqual({
			events: 9,
			jobs: 1,
			products: 2,
			rows: 0,
		});
	});

	test("posts opening stock through the immutable Inventory adjustment workflow", async () => {
		const service = createServices();
		const content =
			"source_key,location_id,product_id,variant_id,quantity,unit\nstock-1,location-1,product-1,,12.500000,each";
		const job = await service.create({
			actorUserId: "stock_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_stock_create",
			fileName: "opening-stock.csv",
			idempotencyKey: "stock-import-create",
			manifest,
			organizationId: "organization_import",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "OpeningStock",
			tenantId: "tenant_import_a",
		});
		expect(
			(
				await testPool.query(
					"SELECT count(*)::int AS count FROM inventory_stock_movement"
				)
			).rows[0]?.count
		).toBe(0);
		await service.approve({
			actorUserId: "stock_approver",
			contextId: "context_import_a",
			correlationId: "correlation_stock_approve",
			idempotencyKey: "stock-import-approve",
			importId: job.id,
			sessionId: "session_import_a",
			target: "OpeningStock",
			tenantId: "tenant_import_a",
			version: 1,
		});
		const facts = await testPool.query<{
			adjustments: number;
			movements: number;
			quantity: string;
		}>(
			"SELECT (SELECT count(*)::int FROM inventory_adjustment) AS adjustments, (SELECT count(*)::int FROM inventory_stock_movement) AS movements, (SELECT on_hand FROM inventory_stock_balance WHERE tenant_id = 'tenant_import_a' LIMIT 1) AS quantity"
		);
		expect(facts.rows[0]).toEqual({
			adjustments: 1,
			movements: 1,
			quantity: "12.500000",
		});
	});

	test("does not disclose foreign-tenant import state and never persists raw CSV", async () => {
		const service = createServices();
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nprivate-source,Private Product,Default,PRIVATE-SKU,,";
		const job = await service.create({
			actorUserId: "private_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_private",
			fileName: "private.csv",
			idempotencyKey: "private-import-create",
			manifest,
			organizationId: "organization_private",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_import_private",
		});
		expect(
			await service.get("tenant_import_foreign", job.id, "Product")
		).toBeNull();
		const rawLeak = await testPool.query<{ leaked: boolean }>(
			"SELECT EXISTS (SELECT 1 FROM platform_import_job WHERE row_to_json(platform_import_job)::text LIKE '%Private Product%') OR EXISTS (SELECT 1 FROM platform_event_outbox WHERE row_to_json(platform_event_outbox)::text LIKE '%Private Product%') AS leaked"
		);
		expect(rawLeak.rows[0]?.leaked).toBeFalse();
	});
});
