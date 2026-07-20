import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	ImportFinding,
	ImportJobRecord,
	ImportRepository,
	ImportRowRecord,
	ImportTarget,
} from "@meridian/platform-import-export";
import { and, eq, gt, isNull, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import {
	importCommandReceipts,
	importFindings,
	importJobs,
	importRows,
	importWaves,
} from "./schema/import-export";

export const PLATFORM_IMPORT_EXPORT_MIGRATION_TABLE =
	"platform_import_export_migrations";

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformImportExport(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: PLATFORM_IMPORT_EXPORT_MIGRATION_TABLE,
	});
}

function mapJob(row: typeof importJobs.$inferSelect): ImportJobRecord {
	return {
		acceptedAt: row.acceptedAt,
		acceptedByUserId: row.acceptedByUserId,
		approvedAt: row.approvedAt,
		approvedByUserId: row.approvedByUserId,
		cancelledAt: row.cancelledAt,
		cancelledByUserId: row.cancelledByUserId,
		completedAt: row.completedAt,
		counts: {
			applied: row.appliedRows,
			failed: row.failedRows,
			rejected: row.rejectedRows,
			skipped: row.skippedRows,
			total: row.totalRows,
			valid: row.validRows,
			warning: row.warningRows,
		},
		createdAt: row.createdAt,
		createdByUserId: row.createdByUserId,
		createIdempotencyKey: row.createIdempotencyKey,
		failureCode: row.failureCode,
		humanReference: row.humanReference,
		id: row.id,
		lastCompletedRow: row.lastCompletedRow,
		manifest: row.manifest as ImportJobRecord["manifest"],
		numberAllocationId: row.numberAllocationId,
		numberSequenceVersion: row.numberSequenceVersion,
		organizationId: row.organizationId,
		reconciliationState:
			row.reconciliationState as ImportJobRecord["reconciliationState"],
		requestFingerprint: row.requestFingerprint,
		scannerResult: row.scannerResult as ImportJobRecord["scannerResult"],
		sourceFileName: row.sourceFileName,
		sourceSha256: row.sourceSha256,
		state: row.state as ImportJobRecord["state"],
		target: row.targetType as ImportTarget,
		tenantId: row.tenantId,
		updatedAt: row.updatedAt,
		version: row.version,
	};
}

function mapRow(row: typeof importRows.$inferSelect): ImportRowRecord {
	return {
		id: row.id,
		importId: row.importId,
		normalizedData: row.normalizedData as ImportRowRecord["normalizedData"],
		rowFingerprint: row.rowFingerprint,
		rowNumber: row.rowNumber,
		sourceKey: row.sourceKey,
		state: row.state as ImportRowRecord["state"],
		targetId: row.targetId,
		tenantId: row.tenantId,
	};
}

function mapFinding(row: typeof importFindings.$inferSelect): ImportFinding {
	return {
		code: row.code,
		field: row.field,
		id: row.id,
		importId: row.importId,
		rowId: row.rowId,
		rowNumber: row.rowNumber,
		severity: row.severity as ImportFinding["severity"],
		sourceKey: row.sourceKey,
		tenantId: row.tenantId,
	};
}

export function createImportRepository(client: PoolClient): ImportRepository {
	const database = drizzle(client);
	return {
		async create(input) {
			await database.insert(importJobs).values({
				acceptedAt: input.job.acceptedAt,
				acceptedByUserId: input.job.acceptedByUserId,
				appliedRows: input.job.counts.applied,
				approvedAt: input.job.approvedAt,
				approvedByUserId: input.job.approvedByUserId,
				cancelledAt: input.job.cancelledAt,
				cancelledByUserId: input.job.cancelledByUserId,
				completedAt: input.job.completedAt,
				createdAt: input.job.createdAt,
				createdByUserId: input.job.createdByUserId,
				createIdempotencyKey: input.job.createIdempotencyKey,
				failedRows: input.job.counts.failed,
				failureCode: input.job.failureCode,
				humanReference: input.job.humanReference,
				id: input.job.id,
				lastCompletedRow: input.job.lastCompletedRow,
				manifest: input.job.manifest,
				numberAllocationId: input.job.numberAllocationId,
				numberSequenceVersion: input.job.numberSequenceVersion,
				organizationId: input.job.organizationId,
				reconciliationState: input.job.reconciliationState,
				rejectedRows: input.job.counts.rejected,
				requestFingerprint: input.job.requestFingerprint,
				scannerResult: input.job.scannerResult,
				skippedRows: input.job.counts.skipped,
				sourceContentType: "text/csv",
				sourceFileName: input.job.sourceFileName,
				sourceSha256: input.job.sourceSha256,
				state: input.job.state,
				targetCapability:
					input.job.target === "Product"
						? "catalog.bulk-import"
						: "inventory.adjustments",
				targetType: input.job.target,
				tenantId: input.job.tenantId,
				totalRows: input.job.counts.total,
				updatedAt: input.job.updatedAt,
				validRows: input.job.counts.valid,
				version: input.job.version,
				warningRows: input.job.counts.warning,
			});
			if (input.rows.length) {
				await database.insert(importRows).values(
					input.rows.map((row) => ({
						...row,
						createdAt: input.job.createdAt,
						updatedAt: input.job.updatedAt,
					}))
				);
			}
			if (input.findings.length) {
				await database.insert(importFindings).values(
					input.findings.map((finding) => ({
						...finding,
						classification: "Confidential" as const,
						createdAt: input.job.createdAt,
					}))
				);
			}
			if (input.rows.length) {
				await database.insert(importWaves).values({
					completedRows: 0,
					firstRowNumber: input.rows[0]?.rowNumber ?? 1,
					id: `${input.job.id}:wave:1`,
					importId: input.job.id,
					lastCompletedRow: 0,
					lastRowNumber: input.rows.at(-1)?.rowNumber ?? 1,
					startedAt: input.job.createdAt,
					state: "Pending",
					tenantId: input.job.tenantId,
					waveNumber: 1,
				});
			}
		},
		async findByCreateKey(tenantId, target, idempotencyKey) {
			const rows = await database
				.select()
				.from(importJobs)
				.where(
					and(
						eq(importJobs.tenantId, tenantId),
						eq(importJobs.targetType, target),
						eq(importJobs.createIdempotencyKey, idempotencyKey)
					)
				)
				.limit(1);
			return rows[0] ? mapJob(rows[0]) : null;
		},
		async findCommandReceipt(input) {
			const rows = await database
				.select({
					importId: importCommandReceipts.importId,
					requestFingerprint: importCommandReceipts.requestFingerprint,
					result: importCommandReceipts.result,
				})
				.from(importCommandReceipts)
				.where(
					and(
						eq(importCommandReceipts.tenantId, input.tenantId),
						eq(importCommandReceipts.operation, input.operation),
						eq(importCommandReceipts.idempotencyKey, input.idempotencyKey)
					)
				)
				.limit(1);
			const [receipt] = rows;
			if (!receipt) {
				return null;
			}
			const result = receipt.result as {
				purgeResult?: unknown;
				targetId?: unknown;
			};
			return {
				importId: receipt.importId,
				purgeResult:
					result.purgeResult && typeof result.purgeResult === "object"
						? (result.purgeResult as {
								findings: number;
								rows: number;
								waves: number;
							})
						: null,
				requestFingerprint: receipt.requestFingerprint,
				targetId: typeof result.targetId === "string" ? result.targetId : null,
			};
		},
		async get(tenantId, importId, target) {
			const rows = await database
				.select()
				.from(importJobs)
				.where(
					and(
						eq(importJobs.tenantId, tenantId),
						eq(importJobs.id, importId),
						eq(importJobs.targetType, target)
					)
				)
				.limit(1);
			return rows[0] ? mapJob(rows[0]) : null;
		},
		async list(input) {
			const rows = await database
				.select()
				.from(importJobs)
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.organizationId, input.organizationId),
						eq(importJobs.targetType, input.target),
						input.state ? eq(importJobs.state, input.state) : undefined,
						input.cursor ? gt(importJobs.id, input.cursor) : undefined
					)
				)
				.orderBy(importJobs.id)
				.limit(input.limit + 1);
			const hasMore = rows.length > input.limit;
			const items = rows.slice(0, input.limit);
			return {
				items: items.map(mapJob),
				nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
			};
		},
		async listFindings(tenantId, importId, page) {
			const rows = await database
				.select()
				.from(importFindings)
				.where(
					and(
						eq(importFindings.tenantId, tenantId),
						eq(importFindings.importId, importId),
						page.cursor ? gt(importFindings.id, page.cursor) : undefined
					)
				)
				.orderBy(importFindings.id)
				.limit(page.limit + 1);
			const hasMore = rows.length > page.limit;
			const items = rows.slice(0, page.limit);
			return {
				items: items.map(mapFinding),
				nextCursor: hasMore ? (items.at(-1)?.id ?? null) : null,
			};
		},
		async listRows(tenantId, importId) {
			return (
				await database
					.select()
					.from(importRows)
					.where(
						and(
							eq(importRows.tenantId, tenantId),
							eq(importRows.importId, importId)
						)
					)
					.orderBy(importRows.rowNumber)
			).map(mapRow);
		},
		async markAccepted(input) {
			const rows = await database
				.update(importJobs)
				.set({
					acceptedAt: input.acceptedAt,
					acceptedByUserId: input.acceptedByUserId,
					reconciliationState: "Accepted",
					updatedAt: input.acceptedAt,
					version: sql`${importJobs.version} + 1`,
				})
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						eq(importJobs.version, input.version),
						eq(importJobs.state, "Completed"),
						eq(importJobs.reconciliationState, "Reconciled")
					)
				)
				.returning();
			return rows[0] ? mapJob(rows[0]) : "version_conflict";
		},
		async markApproved(input) {
			const rows = await database
				.update(importJobs)
				.set({
					approvedAt: input.approvedAt,
					approvedByUserId: input.approvedByUserId,
					state: "Approved",
					updatedAt: input.approvedAt,
					version: sql`${importJobs.version} + 1`,
				})
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						eq(importJobs.version, input.version),
						eq(importJobs.state, "ReadyForApproval")
					)
				)
				.returning();
			const [approved] = rows;
			if (!approved) {
				return "version_conflict";
			}
			await database
				.update(importWaves)
				.set({ startedAt: input.approvedAt, state: "Running" })
				.where(
					and(
						eq(importWaves.tenantId, input.tenantId),
						eq(importWaves.importId, input.importId),
						eq(importWaves.waveNumber, 1)
					)
				);
			return mapJob(approved);
		},
		async markCancelled(input) {
			const rows = await database
				.update(importJobs)
				.set({
					cancelledAt: input.cancelledAt,
					cancelledByUserId: input.cancelledByUserId,
					state: "Cancelled",
					updatedAt: input.cancelledAt,
					version: sql`${importJobs.version} + 1`,
				})
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						eq(importJobs.version, input.version),
						eq(importJobs.state, "ReadyForApproval")
					)
				)
				.returning();
			return rows[0] ? mapJob(rows[0]) : "version_conflict";
		},
		async markCompleted(input) {
			for (const row of input.rows) {
				// biome-ignore lint/performance/noAwaitInLoops: one transaction client preserves deterministic checkpoint order and forbids overlapping pg queries.
				await database
					.update(importRows)
					.set({
						state: row.state,
						targetId: row.targetId,
						updatedAt: input.completedAt,
					})
					.where(
						and(
							eq(importRows.tenantId, input.tenantId),
							eq(importRows.id, row.id)
						)
					);
			}
			const applied = input.rows.filter(
				(row) => row.state === "Applied"
			).length;
			const rows = await database
				.update(importJobs)
				.set({
					appliedRows: applied,
					completedAt: input.completedAt,
					lastCompletedRow: input.rows.at(-1)?.rowNumber ?? 0,
					reconciliationState: input.rows.some((row) => row.state === "Failed")
						? "Mismatch"
						: "Reconciled",
					state: "Completed",
					updatedAt: input.completedAt,
					version: sql`${importJobs.version} + 1`,
				})
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						eq(importJobs.version, input.version),
						sql`${importJobs.state} IN ('Approved','Committing')`
					)
				)
				.returning();
			const [completed] = rows;
			if (!completed) {
				return "version_conflict";
			}
			await database
				.update(importWaves)
				.set({ completedAt: input.completedAt, state: "Completed" })
				.where(
					and(
						eq(importWaves.tenantId, input.tenantId),
						eq(importWaves.importId, input.importId),
						eq(importWaves.waveNumber, 1)
					)
				);
			return mapJob(completed);
		},
		async markFailed(input) {
			const jobs = await database
				.update(importJobs)
				.set({
					failedRows: sql`${importJobs.failedRows} + 1`,
					failureCode: input.failureCode,
					state: "Failed",
					updatedAt: input.failedAt,
					version: sql`${importJobs.version} + 1`,
				})
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						eq(importJobs.version, input.version),
						sql`${importJobs.state} IN ('Approved','Committing')`
					)
				)
				.returning();
			const [failed] = jobs;
			if (!failed) {
				return "version_conflict";
			}
			const failedRows = await database
				.update(importRows)
				.set({ state: "Failed", updatedAt: input.failedAt })
				.where(
					and(
						eq(importRows.tenantId, input.tenantId),
						eq(importRows.importId, input.importId),
						eq(importRows.id, input.rowId),
						sql`${importRows.state} IN ('Valid','Warning')`
					)
				)
				.returning({ id: importRows.id });
			if (!failedRows[0]) {
				throw new Error(
					"Failed import row was not eligible for failure marking"
				);
			}
			await database
				.update(importWaves)
				.set({ failureCode: input.failureCode, state: "Failed" })
				.where(
					and(
						eq(importWaves.tenantId, input.tenantId),
						eq(importWaves.importId, input.importId),
						eq(importWaves.waveNumber, 1)
					)
				);
			return mapJob(failed);
		},
		async markRowApplied(input) {
			const locked = await client.query<{ state: string }>(
				`SELECT state
				 FROM platform_import_job
				 WHERE tenant_id = $1 AND id = $2
				 FOR UPDATE`,
				[input.tenantId, input.importId]
			);
			const [job] = locked.rows;
			if (!(job && ["Approved", "Committing"].includes(job.state))) {
				return "state_conflict";
			}
			const changed = await database
				.update(importRows)
				.set({
					state: "Applied",
					targetId: input.targetId,
					updatedAt: input.completedAt,
				})
				.where(
					and(
						eq(importRows.tenantId, input.tenantId),
						eq(importRows.importId, input.importId),
						eq(importRows.id, input.rowId),
						sql`${importRows.state} IN ('Valid','Warning')`
					)
				)
				.returning();
			const [applied] = changed;
			if (applied) {
				await database
					.update(importJobs)
					.set({
						appliedRows: sql`${importJobs.appliedRows} + 1`,
						lastCompletedRow: sql`GREATEST(${importJobs.lastCompletedRow}, ${applied.rowNumber})`,
						state: "Committing",
						updatedAt: input.completedAt,
					})
					.where(
						and(
							eq(importJobs.tenantId, input.tenantId),
							eq(importJobs.id, input.importId)
						)
					);
				await database
					.update(importWaves)
					.set({
						completedRows: sql`${importWaves.completedRows} + 1`,
						lastCompletedRow: sql`GREATEST(${importWaves.lastCompletedRow}, ${applied.rowNumber})`,
					})
					.where(
						and(
							eq(importWaves.tenantId, input.tenantId),
							eq(importWaves.importId, input.importId),
							eq(importWaves.waveNumber, 1)
						)
					);
				return mapRow(applied);
			}
			const current = await database
				.select()
				.from(importRows)
				.where(
					and(
						eq(importRows.tenantId, input.tenantId),
						eq(importRows.importId, input.importId),
						eq(importRows.id, input.rowId)
					)
				)
				.limit(1);
			if (!current[0]) {
				throw new Error("Import row checkpoint was not found");
			}
			return mapRow(current[0]);
		},
		async purgeStaging(input) {
			const job = await database
				.update(importJobs)
				.set({ stagingPurgedAt: input.purgedAt, updatedAt: input.purgedAt })
				.where(
					and(
						eq(importJobs.tenantId, input.tenantId),
						eq(importJobs.id, input.importId),
						isNull(importJobs.stagingPurgedAt),
						lte(importJobs.updatedAt, input.eligibleBefore),
						sql`${importJobs.state} IN ('Completed','Failed','Cancelled')`
					)
				)
				.returning({ id: importJobs.id });
			if (!job[0]) {
				return "not_found";
			}
			const findings = await database
				.delete(importFindings)
				.where(
					and(
						eq(importFindings.tenantId, input.tenantId),
						eq(importFindings.importId, input.importId)
					)
				)
				.returning({ id: importFindings.id });
			const rows = await database
				.delete(importRows)
				.where(
					and(
						eq(importRows.tenantId, input.tenantId),
						eq(importRows.importId, input.importId)
					)
				)
				.returning({ id: importRows.id });
			const waves = await database
				.delete(importWaves)
				.where(
					and(
						eq(importWaves.tenantId, input.tenantId),
						eq(importWaves.importId, input.importId)
					)
				)
				.returning({ id: importWaves.id });
			return {
				findings: findings.length,
				rows: rows.length,
				waves: waves.length,
			};
		},
		async recordCommandReceipt(input) {
			await database
				.insert(importCommandReceipts)
				.values({
					classification: "Confidential",
					createdAt: input.createdAt,
					idempotencyKey: input.idempotencyKey,
					importId: input.importId,
					operation: input.operation,
					requestFingerprint: input.requestFingerprint,
					result: {
						importId: input.importId,
						purgeResult: input.purgeResult ?? null,
						targetId: input.targetId,
					},
					tenantId: input.tenantId,
				})
				.onConflictDoNothing();
		},
	};
}

// biome-ignore lint/performance/noBarrelFile: persistence package public schema and adapter surface.
export * from "./schema/import-export";
