import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
	AuditPrivacyOverlay,
	AuditQuery,
	AuditRepository,
	AuditStoredRecord,
} from "@meridian/platform-audit";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import type { Pool, PoolClient } from "pg";

import { auditPrivacyOverlay, auditRecord } from "./schema";

export type AuditPostgresConnection = Pool | PoolClient;

function stored(row: typeof auditRecord.$inferSelect): AuditStoredRecord {
	const common = {
		action: row.action,
		actorPartyId: row.actorPartyId,
		actorType: row.actorType as AuditStoredRecord["actorType"],
		actorUserId: row.actorUserId,
		approvalId: row.approvalId,
		causationId: row.causationId,
		changeSummary: row.changeSummary as Record<string, unknown> | null,
		classification: row.classification as AuditStoredRecord["classification"],
		correlationId: row.correlationId,
		delegationId: row.delegationId,
		id: row.id,
		legalHoldId: row.legalHoldId,
		metadata: row.metadata as Record<string, unknown>,
		occurredAt: row.occurredAt,
		originalActorId: row.originalActorId,
		outcome: row.outcome as AuditStoredRecord["outcome"],
		previousHash: row.previousHash,
		privacyCaseId: row.privacyCaseId,
		privacyTransformationVersion: row.privacyTransformationVersion,
		reasonCode: row.reasonCode,
		recordedAt: row.recordedAt,
		recordHash: row.recordHash,
		retentionClass: row.retentionClass,
		retentionUntil: row.retentionUntil,
		scopeKey: row.scopeKey,
		sequence: row.sequence,
		sourceChannel: row.sourceChannel,
		sourceEventId: row.sourceEventId,
		targetId: row.targetId,
		targetType: row.targetType,
	};
	return row.scopeType === "Tenant" && row.tenantId
		? {
				...common,
				locationId: row.locationId,
				organizationId: row.organizationId,
				scopeType: "Tenant",
				tenantId: row.tenantId,
			}
		: { ...common, scopeType: "Platform" };
}

function overlay(
	row: typeof auditPrivacyOverlay.$inferSelect
): AuditPrivacyOverlay {
	return {
		...row,
		subjectType: row.subjectType as AuditPrivacyOverlay["subjectType"],
	};
}

export function createAuditRepository(
	connection: AuditPostgresConnection
): AuditRepository {
	const database = drizzle(connection);
	return {
		async addPrivacyOverlay(value) {
			await database
				.insert(auditPrivacyOverlay)
				.values(value)
				.onConflictDoUpdate({
					set: {
						id: value.id,
						occurredAt: value.occurredAt,
						privacyCaseId: value.privacyCaseId,
						pseudonym: value.pseudonym,
						transformationVersion: value.transformationVersion,
					},
					target: [
						auditPrivacyOverlay.scopeKey,
						auditPrivacyOverlay.subjectType,
						auditPrivacyOverlay.subjectDigest,
					],
				});
		},

		async findBySourceEvent(sourceEventId) {
			const rows = await database
				.select()
				.from(auditRecord)
				.where(eq(auditRecord.sourceEventId, sourceEventId))
				.limit(1);
			return rows[0] ? stored(rows[0]) : null;
		},

		async getScopeHead(scopeKey) {
			const rows = await database
				.select()
				.from(auditRecord)
				.where(eq(auditRecord.scopeKey, scopeKey))
				.orderBy(desc(auditRecord.sequence))
				.limit(1);
			return rows[0] ? stored(rows[0]) : null;
		},

		async insert(record) {
			const inserted = await database
				.insert(auditRecord)
				.values(record)
				.onConflictDoNothing()
				.returning({ id: auditRecord.id });
			return inserted.length > 0 ? "inserted" : "duplicate";
		},

		async listPrivacyOverlays(scopeKey) {
			const rows = await database
				.select()
				.from(auditPrivacyOverlay)
				.where(eq(auditPrivacyOverlay.scopeKey, scopeKey));
			return rows.map(overlay);
		},

		async listScopeRecords(scopeKey) {
			const rows = await database
				.select()
				.from(auditRecord)
				.where(eq(auditRecord.scopeKey, scopeKey));
			return rows.map(stored);
		},

		async listTenant(query: AuditQuery) {
			const conditions = [
				eq(auditRecord.scopeType, "Tenant"),
				eq(auditRecord.tenantId, query.tenantId),
			];
			if (query.action) {
				conditions.push(eq(auditRecord.action, query.action));
			}
			if (query.actorUserId) {
				conditions.push(eq(auditRecord.actorUserId, query.actorUserId));
			}
			if (query.occurredAfter) {
				conditions.push(gte(auditRecord.occurredAt, query.occurredAfter));
			}
			if (query.occurredBefore) {
				conditions.push(lte(auditRecord.occurredAt, query.occurredBefore));
			}
			const rows = await database
				.select()
				.from(auditRecord)
				.where(and(...conditions));
			return rows.map(stored);
		},

		async lockScope(scopeKey) {
			await connection.query(
				"SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
				[scopeKey]
			);
		},
	};
}

const migrationsFolder = join(
	dirname(fileURLToPath(import.meta.url)),
	"migrations"
);

export async function migratePlatformAudit(pool: Pool): Promise<void> {
	await migrate(drizzle(pool), {
		migrationsFolder,
		migrationsSchema: "drizzle",
		migrationsTable: "platform_audit_migrations",
	});
}
