import assert from "node:assert/strict";
import {
	type CatalogIdFactory,
	createCatalogService,
} from "@meridian/domain-catalog";
import {
	createInventoryService,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import { createCatalogRepository } from "@meridian/persistence-catalog-postgres";
import { createInventoryRepository } from "@meridian/persistence-inventory-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createImportRepository } from "@meridian/persistence-platform-import-export-postgres";
import { createNumberingRepository } from "@meridian/persistence-platform-numbering-postgres";
import type { OutboxEvent } from "@meridian/platform-events";
import {
	CSV_IMPORT_LIMITS,
	createImportService,
} from "@meridian/platform-import-export";
import { createNumberingService } from "@meridian/platform-numbering";
import { env } from "@meridian/tooling-env/server";
import { Pool, type PoolClient } from "pg";
import { type MigrationStream, runMigrationStreams } from "./migrations";
import { createImportReferenceAllocator } from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_pr2_node_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

function event(id: string): OutboxEvent<{ runtime: string }> {
	return {
		classification: "Internal",
		data: { runtime: "node" },
		id,
		name: "platform.membership.activated.v1",
		occurredAt: "2026-07-13T00:00:00.000Z",
		producerNamespace: "platform",
		retentionClass: "platform-security-evidence",
		schemaRef: "schemas/events/platform.membership.activated.v1.schema.json",
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		tenantId: "tenant_pr2_node",
	};
}

await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
const pool = new Pool({ connectionString: databaseUrl.toString(), max: 4 });

try {
	await runMigrationStreams(pool);
	await runMigrationStreams(pool);

	const ownerTables = await pool.query<{
		audit: string | null;
		catalog: string | null;
		outbox: string | null;
		entitlements: string | null;
		inventory: string | null;
		importJob: string | null;
		numberSequence: string | null;
		party: string | null;
		role: string | null;
		tenancy: string | null;
		tenancyReceipts: string | null;
	}>(
		"SELECT to_regclass('public.platform_audit_record')::text AS audit, to_regclass('public.catalog_product')::text AS catalog, to_regclass('public.inventory_stock_movement')::text AS inventory, to_regclass('public.platform_import_job')::text AS \"importJob\", to_regclass('public.platform_number_sequence')::text AS \"numberSequence\", to_regclass('public.platform_event_outbox')::text AS outbox, to_regclass('public.platform_entitlement')::text AS entitlements, to_regclass('public.party_record')::text AS party, to_regclass('public.platform_role')::text AS role, to_regclass('public.platform_tenant')::text AS tenancy, to_regclass('public.platform_tenancy_command_receipt')::text AS \"tenancyReceipts\""
	);
	assert.deepEqual(ownerTables.rows[0], {
		audit: "platform_audit_record",
		catalog: "catalog_product",
		entitlements: "platform_entitlement",
		importJob: "platform_import_job",
		inventory: "inventory_stock_movement",
		numberSequence: "platform_number_sequence",
		outbox: "platform_event_outbox",
		party: "party_record",
		role: "platform_role",
		tenancy: "platform_tenant",
		tenancyReceipts: "platform_tenancy_command_receipt",
	});

	assert.equal(CSV_IMPORT_LIMITS.rows, 1000);
	let importId = 0;
	const importService = createImportService({
		clock: () => new Date("2026-07-16T12:00:00.000Z"),
		hash: { sha256: () => Promise.resolve("a".repeat(64)) },
		ids: {
			create(kind) {
				importId += 1;
				return `node_${kind}_${importId}`;
			},
		},
		scanner: { scan: () => Promise.resolve("Clean") },
		targets: {
			OpeningStock: {
				commit: () => Promise.resolve({ targetId: "node_stock" }),
			},
			Product: { commit: () => Promise.resolve({ targetId: "node_product" }) },
		},
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: { append: () => Promise.resolve("inserted") },
			references: createImportReferenceAllocator(client),
			repository: createImportRepository(client),
		})),
	});
	const nodeCsv =
		"source_key,name,variant_name,sku,barcode,barcode_scheme\nnode-1,Node Product,Default,NODE-SKU,,";
	const nodeImport = await importService.create({
		actorUserId: "node_uploader",
		content: nodeCsv,
		contentType: "text/csv",
		correlationId: "correlation_node_import",
		fileName: "node.csv",
		idempotencyKey: "node-import-create",
		manifest: {
			decimalSeparator: ".",
			delimiter: ",",
			encoding: "UTF-8",
			locale: "en-GY",
			newline: "LF",
			quote: '"',
			timezone: "America/Guyana",
		},
		organizationId: "organization_node_import",
		sha256: "a".repeat(64),
		target: "Product",
		tenantId: "tenant_node_import",
	});
	assert.equal(nodeImport.state, "ReadyForApproval");

	await pool.query(
		"INSERT INTO platform_number_sequence (tenant_id, id, organization_id, owner_namespace, record_type, sequence_key, prefix, padding, current_value, next_value, state, version, classification, created_at, updated_at) VALUES ('tenant_node_numbering', 'sequence_node_numbering', 'organization_node_numbering', 'test', 'invoice', 'invoice', 'N-', 4, 0, 1, 'Active', 1, 'Confidential', now(), now())"
	);
	let numberingId = 0;
	const numbering = createNumberingService({
		clock: () => new Date(),
		ids: {
			create(kind) {
				numberingId += 1;
				return `node_numbering_${kind}_${numberingId}`;
			},
		},
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createNumberingRepository(client),
		})),
	});
	const nodeNumber = await numbering.allocate({
		actorUserId: "node_numbering_user",
		businessRecordId: "node_invoice_1",
		correlationId: "correlation_node_numbering",
		idempotencyKey: "node-number-allocation",
		organizationId: "organization_node_numbering",
		sequenceId: "sequence_node_numbering",
		sourceCommandId: "invoice.issue:node-number-allocation",
		tenantId: "tenant_node_numbering",
	});
	assert.equal(nodeNumber.value, "N-0001");

	const failingStream: MigrationStream = {
		id: "test.node-failure",
		async migrate(target) {
			const client = await target.connect();
			try {
				await client.query("BEGIN");
				await client.query(
					"CREATE TABLE pr2_node_failed_fixture (id text PRIMARY KEY)"
				);
				throw new Error("deliberate node migration failure");
			} catch (error) {
				await client.query("ROLLBACK");
				throw error;
			} finally {
				client.release();
			}
		},
	};
	await assert.rejects(
		runMigrationStreams(pool, [failingStream]),
		/Migration stream test\.node-failure failed/
	);
	const failedTable = await pool.query<{ value: string | null }>(
		"SELECT to_regclass('public.pr2_node_failed_fixture')::text AS value"
	);
	assert.equal(failedTable.rows[0]?.value, null);

	await pool.query(
		"CREATE TABLE pr2_node_state_fixture (id text PRIMARY KEY, revision integer NOT NULL)"
	);
	await pool.query(
		"INSERT INTO pr2_node_state_fixture (id, revision) VALUES ('identity_node', 0)"
	);
	const unitOfWork = createPostgresUnitOfWork(pool, (client: PoolClient) => ({
		outbox: createPostgresOutbox(client),
		state: {
			increment: () =>
				client.query(
					"UPDATE pr2_node_state_fixture SET revision = revision + 1 WHERE id = 'identity_node'"
				),
		},
	}));
	await unitOfWork.execute(async ({ outbox, state }) => {
		await state.increment();
		assert.equal(await outbox.append(event("evt_pr2_node_commit")), "inserted");
	});
	await assert.rejects(
		unitOfWork.execute(async ({ outbox, state }) => {
			await state.increment();
			await outbox.append(event("evt_pr2_node_rollback"));
			throw new Error("node rollback proof");
		}),
		/node rollback proof/
	);

	const stateResult = await pool.query<{ revision: number }>(
		"SELECT revision FROM pr2_node_state_fixture WHERE id = 'identity_node'"
	);
	assert.equal(stateResult.rows[0]?.revision, 1);
	const records = await pool.query<{ id: string }>(
		"SELECT id FROM platform_event_outbox WHERE id LIKE 'evt_pr2_node_%' ORDER BY id"
	);
	assert.deepEqual(
		records.rows.map((row) => row.id),
		["evt_pr2_node_commit"]
	);

	let catalogSequence = 0;
	const catalogIds: CatalogIdFactory = {
		create(kind) {
			catalogSequence += 1;
			return `${kind}_node_${catalogSequence}`;
		},
	};
	const catalog = createCatalogService({
		clock: () => new Date("2026-07-14T12:00:00.000Z"),
		ids: catalogIds,
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createCatalogRepository(client),
		})),
	});
	const product = await catalog.createProduct({
		actorUserId: "user_catalog_node",
		body: {
			name: "Node Catalog Product",
			variants: [
				{
					identifiers: [{ scheme: "Tenant", type: "SKU", value: "NODE-SKU-1" }],
					name: "Default",
				},
			],
		},
		correlationId: "correlation_catalog_node",
		idempotencyKey: "idempotency_catalog_node_create",
		organizationId: "organization_catalog_node",
		tenantId: "tenant_catalog_node",
	});
	assert.equal(product.state, "Draft");
	assert.equal(product.createdAt, "2026-07-14T12:00:00.000Z");
	assert.equal(product.updatedAt, "2026-07-14T12:00:00.000Z");
	assert.equal(
		(await catalog.getProduct("tenant_catalog_node", product.id)).name,
		"Node Catalog Product"
	);
	await assert.rejects(
		catalog.getProduct("tenant_catalog_node_other", product.id),
		(error) =>
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "not_found"
	);

	let inventorySequence = 0;
	const inventoryIds: InventoryIdFactory = {
		create(kind) {
			inventorySequence += 1;
			return `${kind}_node_${inventorySequence}`;
		},
	};
	const inventory = createInventoryService({
		clock: () => new Date("2026-07-15T12:00:00.000Z"),
		ids: inventoryIds,
		references: {
			requireLocation: async () => undefined,
			requireProduct: async () => undefined,
		},
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createInventoryRepository(client),
		})),
	});
	const adjustment = await inventory.createAdjustment({
		actorUserId: "user_inventory_node_creator",
		body: {
			locationId: "location_inventory_node",
			productId: product.id,
			quantity: "3.000001",
			reason: "Node fallback proof",
			unit: "each",
		},
		correlationId: "correlation_inventory_node",
		idempotencyKey: "idempotency_inventory_node_create",
		organizationId: "organization_catalog_node",
		tenantId: "tenant_catalog_node",
	});
	const posted = await inventory.approveAdjustment({
		actorUserId: "user_inventory_node_approver",
		adjustmentId: adjustment.id,
		correlationId: "correlation_inventory_node",
		idempotencyKey: "idempotency_inventory_node_approve",
		organizationId: "organization_catalog_node",
		tenantId: "tenant_catalog_node",
		version: 1,
	});
	assert.equal(posted.state, "Posted");
	assert.equal(posted.createdByUserId, "user_inventory_node_creator");
	assert.equal(posted.approvedByUserId, "user_inventory_node_approver");
	assert.equal(posted.postedAt, "2026-07-15T12:00:00.000Z");
	assert.equal(
		(
			await inventory.listBalances({
				page: { limit: 50 },
				tenantId: "tenant_catalog_node",
			})
		).items[0]?.onHand,
		"3.000001"
	);
	await assert.rejects(
		inventory.getAdjustment(
			"tenant_catalog_node_other",
			"organization_catalog_node",
			adjustment.id
		),
		(error) =>
			typeof error === "object" &&
			error !== null &&
			"code" in error &&
			error.code === "not_found"
	);
	const count = await inventory.createCount({
		actorUserId: "user_inventory_node_counter",
		body: { blind: true, locationId: "location_inventory_node" },
		idempotencyKey: "idempotency_inventory_node_count_create",
		organizationId: "organization_catalog_node",
		tenantId: "tenant_catalog_node",
	});
	const savedDraft = await inventory.saveCountDraft({
		actorUserId: "user_inventory_node_counter",
		body: {
			lines: [
				{
					observedQuantity: "3.000001",
					productId: product.id,
					unit: "each",
				},
			],
		},
		countId: count.id,
		idempotencyKey: "idempotency_inventory_node_count_draft",
		organizationId: "organization_catalog_node",
		tenantId: "tenant_catalog_node",
		version: 1,
	});
	assert.equal(savedDraft.state, "InProgress");
	assert.equal(savedDraft.version, 2);
	assert.deepEqual(
		(
			await inventory.getCount(
				"tenant_catalog_node",
				"organization_catalog_node",
				count.id
			)
		).lines,
		savedDraft.lines
	);
} finally {
	await pool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
}
