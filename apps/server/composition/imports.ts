import { createHash, randomUUID } from "node:crypto";
import type { PermissionId } from "@meridian/contracts-permissions";
import type {
	CreateCsvImport,
	ImportCorrectionReport,
	ImportJob,
	PagedImports,
} from "@meridian/contracts-platform-api";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createImportRepository } from "@meridian/persistence-platform-import-export-postgres";
import {
	createImportService,
	ImportError,
	type ImportJobRecord,
	type ImportTarget,
} from "@meridian/platform-import-export";

import { auditApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { catalogApplication } from "./catalog";
import { entitlementEvaluator } from "./entitlements";
import { controlledPrototypeContentScanner } from "./import-scanner";
import { inventoryService } from "./inventory";
import { createImportReferenceAllocator } from "./numbering";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

function eventEnvelope(event: Record<string, unknown>) {
	const name = String(event.name);
	return {
		actorId: "system:import-orchestrator",
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
		sourceChannel: "api" as const,
		tenantId: String(event.tenantId),
	};
}

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: {
		append(event: Record<string, unknown>) {
			return createPostgresOutbox(client).append(eventEnvelope(event));
		},
	},
	references: createImportReferenceAllocator(client),
	repository: createImportRepository(client),
}));

const importService = createImportService({
	clock: () => new Date(),
	hash: {
		sha256: (content) =>
			Promise.resolve(
				createHash("sha256").update(content, "utf8").digest("hex")
			),
	},
	ids: {
		create: (kind) => `import_${kind}_${randomUUID().replaceAll("-", "")}`,
	},
	scanner: controlledPrototypeContentScanner,
	targets: {
		OpeningStock: {
			async commit(input) {
				const active = await tenancyService.requireContext({
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				});
				if (
					active.tenantId !== input.tenantId ||
					active.organizationId !== input.organizationId
				) {
					throw new ImportError(
						"invalid_state",
						"Import context changed before the owner command wave"
					);
				}
				await Promise.all([
					permissionAuthorizer.requirePermission({
						assuranceLevel: "aal1",
						authUserId: input.actorUserId,
						contextId: input.contextId,
						permission: "inventory.adjustment.create",
						sessionId: input.sessionId,
					}),
					permissionAuthorizer.requirePermission({
						assuranceLevel: "aal1",
						authUserId: input.actorUserId,
						contextId: input.contextId,
						permission: "inventory.adjustment.approve",
						sessionId: input.sessionId,
					}),
					entitlementEvaluator.requireEntitlement({
						access: "Write",
						capabilityId: "inventory.adjustments",
						organizationId: active.organizationId,
						tenantId: active.tenantId,
					}),
				]);
				const data = input.row.normalizedData;
				const adjustment = await inventoryService.createAdjustment({
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
				const posted = await inventoryService.approveAdjustment({
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
				const identifiers: Array<{
					scheme: "Tenant" | "GTIN-8" | "GTIN-12" | "GTIN-13" | "GTIN-14";
					type: "SKU" | "GTIN";
					value: string;
				}> = [];
				if (data.sku) {
					identifiers.push({ scheme: "Tenant", type: "SKU", value: data.sku });
				}
				if (data.barcode) {
					const scheme = data.barcode_scheme;
					if (
						!(
							scheme &&
							["GTIN-8", "GTIN-12", "GTIN-13", "GTIN-14"].includes(scheme)
						)
					) {
						throw new ImportError(
							"invalid_csv",
							"Barcode rows require a governed GTIN scheme"
						);
					}
					identifiers.push({
						scheme: scheme as "GTIN-8" | "GTIN-12" | "GTIN-13" | "GTIN-14",
						type: "GTIN",
						value: data.barcode,
					});
				}
				const product = await catalogApplication.create({
					actorUserId: input.actorUserId,
					body: {
						name: data.name ?? "",
						variants: [{ identifiers, name: data.variant_name ?? "Default" }],
					},
					contextId: input.contextId,
					correlationId: input.correlationId,
					idempotencyKey: input.idempotencyKey,
					sessionId: input.sessionId,
				});
				return { targetId: product.id };
			},
		},
	},
	unitOfWork,
});

function toApiJob(job: ImportJobRecord): ImportJob {
	return {
		acceptedAt: job.acceptedAt?.toISOString() ?? null,
		acceptedByUserId: job.acceptedByUserId,
		approvedAt: job.approvedAt?.toISOString() ?? null,
		approvedByUserId: job.approvedByUserId,
		cancelledAt: job.cancelledAt?.toISOString() ?? null,
		cancelledByUserId: job.cancelledByUserId,
		completedAt: job.completedAt?.toISOString() ?? null,
		counts: job.counts,
		createdAt: job.createdAt.toISOString(),
		createdByUserId: job.createdByUserId,
		failureCode: job.failureCode,
		humanReference: job.humanReference,
		id: job.id,
		lastCompletedRow: job.lastCompletedRow,
		manifest: job.manifest,
		numberAllocationId: job.numberAllocationId,
		numberSequenceVersion: job.numberSequenceVersion,
		reconciliationState: job.reconciliationState,
		scannerResult: job.scannerResult,
		sourceFileName: job.sourceFileName,
		sourceSha256: job.sourceSha256,
		state: job.state,
		target: job.target,
		updatedAt: job.updatedAt.toISOString(),
		version: job.version,
	};
}

const permissions = {
	OpeningStock: {
		approve: "inventory.import.approve",
		create: "inventory.import.create",
		download: "inventory.import.download",
		purge: "inventory.import.purge",
		read: "inventory.import.read",
	},
	Product: {
		approve: "catalog.import.approve",
		create: "catalog.import.create",
		download: "catalog.import.download",
		purge: "catalog.import.purge",
		read: "catalog.import.read",
	},
} as const;

async function authorize(
	input: {
		actorUserId: string;
		contextId: string;
		permission: PermissionId;
		sessionId: string;
		target: ImportTarget;
	},
	access: "Read" | "Write"
) {
	const context = await tenancyService.requireContext({
		authUserId: input.actorUserId,
		contextId: input.contextId,
		sessionId: input.sessionId,
	});
	await permissionAuthorizer.requirePermission({
		assuranceLevel: "aal1",
		authUserId: input.actorUserId,
		contextId: input.contextId,
		permission: input.permission,
		sessionId: input.sessionId,
	});
	await entitlementEvaluator.requireEntitlement({
		access,
		capabilityId:
			input.target === "Product"
				? "catalog.bulk-import"
				: "inventory.adjustments",
		organizationId: context.organizationId,
		tenantId: context.tenantId,
	});
	return { context };
}

async function getAuthorized(input: {
	actorUserId: string;
	contextId: string;
	importId: string;
	sessionId: string;
	target: ImportTarget;
}) {
	const { context } = await authorize(
		{ ...input, permission: permissions[input.target].read },
		"Read"
	);
	const job = await importService.get(
		context.tenantId,
		input.importId,
		input.target
	);
	if (!job) {
		throw new ImportError("not_found", "Import was not found");
	}
	return job;
}

export const importTransportApplication = {
	async acceptImport(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
		version: number;
	}) {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].approve },
			"Write"
		);
		const accepted = await importService.accept({
			actorUserId: input.actorUserId,
			idempotencyKey: input.idempotencyKey,
			importId: input.importId,
			target: input.target,
			tenantId: context.tenantId,
			version: input.version,
		});
		await auditApplication.append({
			action: "platform.import.accepted",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: { target: input.target },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: input.importId,
			targetType: "ImportJob",
			tenantId: context.tenantId,
		});
		return toApiJob(accepted);
	},
	async approveImport(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
		version: number;
	}) {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].approve },
			"Write"
		);
		const completed = await importService.approve({
			actorUserId: input.actorUserId,
			contextId: input.contextId,
			correlationId: input.correlationId,
			idempotencyKey: input.idempotencyKey,
			importId: input.importId,
			sessionId: input.sessionId,
			target: input.target,
			tenantId: context.tenantId,
			version: input.version,
		});
		await auditApplication.append({
			action: "platform.import.approved",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: { target: input.target },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			sourceEventId: `import-approve:${context.tenantId}:${input.idempotencyKey}`,
			targetId: input.importId,
			targetType: "ImportJob",
			tenantId: context.tenantId,
		});
		return toApiJob(completed);
	},
	async cancelImport(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
		version: number;
	}) {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].approve },
			"Write"
		);
		const cancelled = await importService.cancel({
			actorUserId: input.actorUserId,
			idempotencyKey: input.idempotencyKey,
			importId: input.importId,
			target: input.target,
			tenantId: context.tenantId,
			version: input.version,
		});
		await auditApplication.append({
			action: "platform.import.cancelled",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: { target: input.target },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: input.importId,
			targetType: "ImportJob",
			tenantId: context.tenantId,
		});
		return toApiJob(cancelled);
	},
	async createImport(input: {
		actorUserId: string;
		body: CreateCsvImport;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		target: ImportTarget;
	}) {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].create },
			"Write"
		);
		return toApiJob(
			await importService.create({
				...input.body,
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				target: input.target,
				tenantId: context.tenantId,
			})
		);
	},
	async getImport(input: {
		actorUserId: string;
		contextId: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
	}) {
		return toApiJob(await getAuthorized(input));
	},
	async getImportCorrectionReport(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
	}): Promise<ImportCorrectionReport> {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].download },
			"Read"
		);
		const job = await importService.get(
			context.tenantId,
			input.importId,
			input.target
		);
		if (!job) {
			throw new ImportError("not_found", "Import was not found");
		}
		const findings = await importService.findings(
			context.tenantId,
			job.id,
			input.target,
			{ limit: 1000 }
		);
		const content = [
			"row_number,source_key,field,severity,code",
			...findings.items.map(
				(item) =>
					`${item.rowNumber},${item.sourceKey},${item.field ?? ""},${item.severity},${item.code}`
			),
		].join("\n");
		await auditApplication.append({
			action: "platform.import.correction-report.read",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: { target: input.target },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: input.importId,
			targetType: "ImportCorrectionReport",
			tenantId: context.tenantId,
		});
		return {
			content,
			contentDisposition: `attachment; filename="${input.target === "Product" ? "product" : "opening-stock"}-import-${input.importId}-findings.csv"`,
			contentType: "text/csv",
			fileName: `${input.target === "Product" ? "product" : "opening-stock"}-import-${input.importId}-findings.csv`,
			schemaVersion: "1.0.0",
			sha256: createHash("sha256").update(content, "utf8").digest("hex"),
		};
	},
	async listImportFindings(input: {
		actorUserId: string;
		contextId: string;
		importId: string;
		cursor?: string;
		limit: number;
		sessionId: string;
		target: ImportTarget;
	}) {
		const job = await getAuthorized(input);
		const items = await importService.findings(
			job.tenantId,
			job.id,
			input.target,
			{ cursor: input.cursor, limit: input.limit }
		);
		return {
			importId: job.id,
			items: items.items.map(
				({ code, field, rowNumber, severity, sourceKey }) => ({
					code,
					field,
					rowNumber,
					severity,
					sourceKey,
				})
			),
			nextCursor: items.nextCursor,
		};
	},
	async listImports(input: {
		actorUserId: string;
		contextId: string;
		cursor?: string;
		limit: number;
		sessionId: string;
		state?: ImportJob["state"];
		target: ImportTarget;
	}): Promise<PagedImports> {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].read },
			"Read"
		);
		const page = await importService.list({
			cursor: input.cursor,
			limit: input.limit,
			organizationId: context.organizationId,
			state: input.state,
			target: input.target,
			tenantId: context.tenantId,
		});
		return { items: page.items.map(toApiJob), nextCursor: page.nextCursor };
	},
	async purgeImportStaging(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: ImportTarget;
	}) {
		const { context } = await authorize(
			{ ...input, permission: permissions[input.target].purge },
			"Write"
		);
		const result = await importService.purgeStaging({
			idempotencyKey: input.idempotencyKey,
			importId: input.importId,
			purgedAt: new Date(),
			target: input.target,
			tenantId: context.tenantId,
		});
		await auditApplication.append({
			action: "platform.import.staging-purged",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: { ...result, target: input.target },
			occurredAt: new Date(),
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			sourceEventId: `import-purge:${context.tenantId}:${input.idempotencyKey}`,
			targetId: input.importId,
			targetType: "ImportJob",
			tenantId: context.tenantId,
		});
		return result;
	},
};
