import {
	afterAll,
	beforeAll,
	describe,
	expect,
	setDefaultTimeout,
	test,
} from "bun:test";
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
import { migratePlatformNumbering } from "@meridian/persistence-platform-numbering-postgres";
import {
	createImportService,
	IMPORT_STAGING_RETENTION_MS,
	ImportProcessInterruptedError,
	type ImportTargetPort,
} from "@meridian/platform-import-export";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";
import { controlledPrototypeContentScanner } from "./import-scanner";
import { createImportReferenceAllocator } from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

const databaseName = `meridian_imports_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

setDefaultTimeout(20_000);

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

function createServices(
	options: {
		failAfterProductSourceKey?: string;
		failValidatedEvent?: boolean;
		onProductCommit?: () => void;
		rejectProductSourceKey?: string;
	} = {}
) {
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
				options.onProductCommit?.();
				if (options.rejectProductSourceKey === input.row.sourceKey) {
					throw Object.assign(new Error("owner rejected the Product command"), {
						code: "invalid_reference",
					});
				}
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
					throw new ImportProcessInterruptedError(
						"injected failure after owner command commit"
					);
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
				append: (event) => {
					if (
						options.failValidatedEvent &&
						event.name === "platform.import.validated.v1"
					) {
						throw new Error("injected validated-event failure");
					}
					return createPostgresOutbox(client).append(fullEvent(event));
				},
			},
			references: createImportReferenceAllocator(client),
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
	await migratePlatformNumbering(testPool);
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
	test("wires the canonical EICAR test signature into the controlled-prototype scanner", async () => {
		const eicar =
			"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
		expect(
			await controlledPrototypeContentScanner.scan({
				content: eicar,
				fileName: "eicar.com.txt",
			})
		).toBe("Blocked");
		expect(
			await controlledPrototypeContentScanner.scan({
				content: "EICAR standard antivirus test documentation",
				fileName: "readme.txt",
			})
		).toBe("Clean");
	});

	test("rolls back the Number allocation, Import job, and events when atomic create fails", async () => {
		const service = createServices({ failValidatedEvent: true });
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nrollback-1,Rollback Product,Default,ROLLBACK-1,,";
		await expect(
			service.create({
				actorUserId: "rollback_uploader",
				content,
				contentType: "text/csv",
				correlationId: "correlation_rollback",
				fileName: "rollback.csv",
				idempotencyKey: "rollback-create",
				manifest,
				organizationId: "organization_rollback",
				sha256: createHash("sha256").update(content).digest("hex"),
				target: "Product",
				tenantId: "tenant_rollback",
			})
		).rejects.toThrow("injected validated-event failure");
		const facts = await testPool.query<{
			allocations: number;
			events: number;
			jobs: number;
		}>(
			"SELECT (SELECT count(*)::int FROM platform_number_allocation WHERE tenant_id = 'tenant_rollback') AS allocations, (SELECT count(*)::int FROM platform_import_job WHERE tenant_id = 'tenant_rollback') AS jobs, (SELECT count(*)::int FROM platform_event_outbox WHERE tenant_id = 'tenant_rollback') AS events"
		);
		expect(facts.rows[0]).toEqual({ allocations: 0, events: 0, jobs: 0 });
	});

	test("dry-runs mixed Tenant A Product rows, commits accepted rows, and replays without duplicates", async () => {
		const service = createServices();
		const startedAt = performance.now();
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
		expect(job).toMatchObject({
			humanReference: "IMP-000001",
			numberSequenceVersion: 1,
			reconciliationState: "Pending",
		});
		const referenceEvidence = await testPool.query<{
			allocation_id: string;
			business_record_id: string;
			sequence_version: number;
		}>(
			`SELECT allocation.id AS allocation_id, allocation.business_record_id, allocation.sequence_version
			 FROM platform_number_allocation allocation
			 WHERE allocation.tenant_id = $1 AND allocation.id = $2`,
			[job.tenantId, job.numberAllocationId]
		);
		expect(referenceEvidence.rows[0]).toEqual({
			allocation_id: job.numberAllocationId,
			business_record_id: job.id,
			sequence_version: 1,
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
		expect(completed.reconciliationState).toBe("Reconciled");
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
		expect(facts.rows[0]).toEqual({ events: 12, products: 3, receipts: 3 });
		const lifecycle = await testPool.query<{
			data: Record<string, unknown>;
			name: string;
		}>(
			"SELECT name, data FROM platform_event_outbox WHERE tenant_id = 'tenant_demerara_retail_test_group' AND aggregate_id = $1 AND name LIKE 'platform.import.%' ORDER BY name",
			[job.id]
		);
		expect(
			Object.fromEntries(
				lifecycle.rows.map((event) => [event.name, event.data])
			)
		).toEqual({
			"platform.import.approved.v1": {
				eligibleRows: 3,
				importId: job.id,
				target: "Product",
				version: 2,
			},
			"platform.import.completed.v1": {
				appliedRows: 3,
				failedRows: 0,
				importId: job.id,
				lastCompletedRow: 5,
				skippedRows: 0,
				target: "Product",
				version: 3,
			},
			"platform.import.validated.v1": {
				importId: job.id,
				rejectedRows: 2,
				target: "Product",
				totalRows: 5,
				validRows: 2,
				version: 1,
				warningRows: 1,
			},
		});
		expect(performance.now() - startedAt).toBeLessThan(10_000);
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
		expect(job.humanReference).toBe("IMP-000001");
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
		const tenantIsolation = await testPool.query<{ count: number }>(
			"SELECT count(*)::int AS count FROM platform_number_allocation WHERE tenant_id = 'tenant_demerara_retail_test_group' AND id = $1",
			[job.numberAllocationId]
		);
		expect(tenantIsolation.rows[0]?.count).toBe(0);
	});

	test("keeps one owner effect and one row receipt under concurrent approval resumes", async () => {
		const service = createServices();
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nrace-1,Race Product,Default,RACE-1,,";
		const job = await service.create({
			actorUserId: "race_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_race_create",
			fileName: "race.csv",
			idempotencyKey: "race-create",
			manifest,
			organizationId: "organization_race",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_race",
		});
		const base = {
			actorUserId: "race_approver",
			contextId: "context_race",
			correlationId: "correlation_race_approve",
			importId: job.id,
			sessionId: "session_race",
			target: "Product" as const,
			tenantId: "tenant_race",
			version: job.version,
		};
		const results = await Promise.allSettled([
			service.approve({ ...base, idempotencyKey: "race-approve-a" }),
			service.approve({ ...base, idempotencyKey: "race-approve-b" }),
		]);
		expect(results.some((result) => result.status === "fulfilled")).toBeTrue();
		const facts = await testPool.query<{
			import_receipts: number;
			products: number;
		}>(
			"SELECT (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_race') AS products, (SELECT count(*)::int FROM platform_import_command_receipt WHERE tenant_id = 'tenant_race' AND operation = 'commit:Product') AS import_receipts"
		);
		expect(facts.rows[0]).toEqual({ import_receipts: 1, products: 1 });
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
			events: 10,
			products: 2,
			receipts: 2,
		});
		const purgeCommand = {
			idempotencyKey: "purge-recovery-staging",
			importId: job.id,
			purgedAt: new Date(
				completed.updatedAt.getTime() + IMPORT_STAGING_RETENTION_MS + 1000
			),
			target: "Product" as const,
			tenantId: "tenant_recovery",
		};
		expect(
			await Promise.all([
				service.purgeStaging(purgeCommand),
				service.purgeStaging(purgeCommand),
			])
		).toEqual([
			{ findings: 0, rows: 2, waves: 1 },
			{ findings: 0, rows: 2, waves: 1 },
		]);
		const afterPurge = await testPool.query<{
			events: number;
			jobs: number;
			products: number;
			rows: number;
		}>(
			"SELECT (SELECT count(*)::int FROM platform_import_row WHERE tenant_id = 'tenant_recovery') AS rows, (SELECT count(*)::int FROM platform_import_job WHERE tenant_id = 'tenant_recovery' AND staging_purged_at IS NOT NULL) AS jobs, (SELECT count(*)::int FROM catalog_product WHERE tenant_id = 'tenant_recovery') AS products, (SELECT count(*)::int FROM platform_event_outbox WHERE tenant_id = 'tenant_recovery') AS events"
		);
		expect(afterPurge.rows[0]).toEqual({
			events: 10,
			jobs: 1,
			products: 2,
			rows: 0,
		});
	});

	test("records a terminal failed checkpoint and schema-shaped event when an owner rejects a row", async () => {
		let ownerCommandAttempts = 0;
		const service = createServices({
			onProductCommit: () => {
				ownerCommandAttempts += 1;
			},
			rejectProductSourceKey: "owner-reject",
		});
		const content =
			"source_key,name,variant_name,sku,barcode,barcode_scheme\nowner-reject,Rejected Owner Product,Default,OWNER-REJECT,,";
		const job = await service.create({
			actorUserId: "failure_uploader",
			content,
			contentType: "text/csv",
			correlationId: "correlation_failure_create",
			fileName: "failure.csv",
			idempotencyKey: "failure-create",
			manifest,
			organizationId: "organization_failure",
			sha256: createHash("sha256").update(content).digest("hex"),
			target: "Product",
			tenantId: "tenant_failure",
		});
		const approval = {
			actorUserId: "failure_approver",
			contextId: "context_failure",
			correlationId: "correlation_failure_approve",
			idempotencyKey: "failure-approve",
			importId: job.id,
			sessionId: "session_failure",
			target: "Product" as const,
			tenantId: "tenant_failure",
			version: 1,
		};
		let ownerFailure: unknown;
		try {
			await service.approve(approval);
		} catch (error) {
			ownerFailure = error;
		}
		expect(ownerFailure).toMatchObject({ code: "invalid_reference" });
		expect((await service.approve(approval)).state).toBe("Failed");
		expect(ownerCommandAttempts).toBe(1);
		const state = await testPool.query<{
			failed_rows: number;
			failure_code: string;
			job_state: string;
			last_completed_row: number;
			row_state: string;
			version: number;
			wave_state: string;
		}>(
			`SELECT job.state AS job_state, job.failure_code, job.failed_rows, job.last_completed_row, job.version,
			        row.state AS row_state, wave.state AS wave_state
			 FROM platform_import_job job
			 JOIN platform_import_row row ON row.tenant_id = job.tenant_id AND row.import_id = job.id
			 JOIN platform_import_wave wave ON wave.tenant_id = job.tenant_id AND wave.import_id = job.id
			 WHERE job.tenant_id = 'tenant_failure' AND job.id = $1`,
			[job.id]
		);
		expect(state.rows[0]).toEqual({
			failed_rows: 1,
			failure_code: "owner_invalid_reference",
			job_state: "Failed",
			last_completed_row: 0,
			row_state: "Failed",
			version: 3,
			wave_state: "Failed",
		});
		const failedRow = await testPool.query<{ id: string }>(
			"SELECT id FROM platform_import_row WHERE tenant_id = 'tenant_failure' AND import_id = $1",
			[job.id]
		);
		expect(
			await createPostgresUnitOfWork(testPool, (client) =>
				createImportRepository(client)
			).execute((repository) =>
				repository.markRowApplied({
					completedAt: new Date(),
					importId: job.id,
					rowId: failedRow.rows[0]?.id ?? "missing",
					targetId: "late-owner-result",
					tenantId: "tenant_failure",
				})
			)
		).toBe("state_conflict");
		expect(
			(
				await testPool.query<{ state: string }>(
					"SELECT state FROM platform_import_job WHERE tenant_id = 'tenant_failure' AND id = $1",
					[job.id]
				)
			).rows[0]?.state
		).toBe("Failed");
		const failedEvent = await testPool.query<{ data: Record<string, unknown> }>(
			"SELECT data FROM platform_event_outbox WHERE tenant_id = 'tenant_failure' AND aggregate_id = $1 AND name = 'platform.import.failed.v1'",
			[job.id]
		);
		expect(failedEvent.rows[0]?.data).toEqual({
			failureCode: "owner_invalid_reference",
			importId: job.id,
			lastCompletedRow: 0,
			target: "Product",
			version: 3,
		});
		expect(
			(
				await testPool.query<{ count: number }>(
					"SELECT count(*)::int AS count FROM catalog_product WHERE tenant_id = 'tenant_failure'"
				)
			).rows[0]?.count
		).toBe(0);
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
