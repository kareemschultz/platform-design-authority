import { sql } from "drizzle-orm";
import {
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
} from "drizzle-orm/pg-core";

export const importJobs = pgTable(
	"platform_import_job",
	{
		acceptedAt: timestamp("accepted_at", { withTimezone: true }),
		acceptedByUserId: text("accepted_by_user_id"),
		appliedRows: integer("applied_rows").default(0).notNull(),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		approvedByUserId: text("approved_by_user_id"),
		auditRecordId: text("audit_record_id"),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		cancelledByUserId: text("cancelled_by_user_id"),
		classification: text("classification").default("Confidential").notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		createdByUserId: text("created_by_user_id").notNull(),
		createIdempotencyKey: text("create_idempotency_key").notNull(),
		failedRows: integer("failed_rows").default(0).notNull(),
		failureCode: text("failure_code"),
		humanReference: text("human_reference").notNull(),
		id: text("id").notNull(),
		lastCompletedRow: integer("last_completed_row").default(0).notNull(),
		manifest: jsonb("manifest").notNull(),
		numberAllocationId: text("number_allocation_id").notNull(),
		numberSequenceVersion: integer("number_sequence_version").notNull(),
		organizationId: text("organization_id").notNull(),
		reconciliationState: text("reconciliation_state")
			.default("Pending")
			.notNull(),
		rejectedRows: integer("rejected_rows").default(0).notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		scannerResult: text("scanner_result").notNull(),
		skippedRows: integer("skipped_rows").default(0).notNull(),
		sourceContentType: text("source_content_type").notNull(),
		sourceFileName: text("source_file_name").notNull(),
		sourceSha256: text("source_sha256").notNull(),
		stagingPurgedAt: timestamp("staging_purged_at", { withTimezone: true }),
		state: text("state").notNull(),
		targetCapability: text("target_capability").notNull(),
		targetType: text("target_type").notNull(),
		tenantId: text("tenant_id").notNull(),
		totalRows: integer("total_rows").default(0).notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
		validRows: integer("valid_rows").default(0).notNull(),
		version: integer("version").default(1).notNull(),
		warningRows: integer("warning_rows").default(0).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_import_job_pk",
		}),
		uniqueIndex("platform_import_job_create_uidx").on(
			table.tenantId,
			table.targetType,
			table.createIdempotencyKey
		),
		uniqueIndex("platform_import_job_reference_uidx").on(
			table.tenantId,
			table.organizationId,
			table.humanReference
		),
		index("platform_import_job_status_idx").on(
			table.tenantId,
			table.targetType,
			table.state,
			table.updatedAt
		),
		check(
			"platform_import_job_target_ck",
			sql`${table.targetType} IN ('Product','OpeningStock')`
		),
		check(
			"platform_import_job_scanner_ck",
			sql`${table.scannerResult} IN ('Clean','Blocked','Unavailable')`
		),
		check(
			"platform_import_job_state_ck",
			sql`${table.state} IN ('Uploaded','Validating','ReadyForApproval','Approved','Committing','Completed','Failed','Cancelled')`
		),
		check(
			"platform_import_job_reconciliation_state_ck",
			sql`${table.reconciliationState} IN ('Pending','Reconciled','Mismatch','Accepted')`
		),
		check(
			"platform_import_job_acceptance_ck",
			sql`(${table.reconciliationState} = 'Accepted' AND ${table.acceptedAt} IS NOT NULL AND ${table.acceptedByUserId} IS NOT NULL) OR (${table.reconciliationState} <> 'Accepted' AND ${table.acceptedAt} IS NULL AND ${table.acceptedByUserId} IS NULL)`
		),
		check(
			"platform_import_job_cancellation_ck",
			sql`(${table.state} = 'Cancelled' AND ${table.cancelledAt} IS NOT NULL AND ${table.cancelledByUserId} IS NOT NULL) OR (${table.state} <> 'Cancelled' AND ${table.cancelledAt} IS NULL AND ${table.cancelledByUserId} IS NULL)`
		),
		check(
			"platform_import_job_counts_ck",
			sql`${table.totalRows} >= 0 AND ${table.validRows} >= 0 AND ${table.warningRows} >= 0 AND ${table.rejectedRows} >= 0 AND ${table.appliedRows} >= 0 AND ${table.skippedRows} >= 0 AND ${table.failedRows} >= 0 AND ${table.lastCompletedRow} >= 0`
		),
		check(
			"platform_import_job_purge_state_ck",
			sql`${table.stagingPurgedAt} IS NULL OR ${table.state} IN ('Completed','Failed','Cancelled')`
		),
		check(
			"platform_import_job_version_ck",
			sql`${table.version} > 0 AND ${table.numberSequenceVersion} > 0`
		),
		check(
			"platform_import_job_reference_ck",
			sql`length(${table.humanReference}) BETWEEN 1 AND 100 AND length(${table.numberAllocationId}) BETWEEN 1 AND 128`
		),
	]
);

export const importRows = pgTable(
	"platform_import_row",
	{
		classification: text("classification").default("Confidential").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		id: text("id").notNull(),
		importId: text("import_id").notNull(),
		normalizedData: jsonb("normalized_data").notNull(),
		rowFingerprint: text("row_fingerprint").notNull(),
		rowNumber: integer("row_number").notNull(),
		sourceKey: text("source_key").notNull(),
		state: text("state").notNull(),
		targetId: text("target_id"),
		tenantId: text("tenant_id").notNull(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_import_row_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.importId],
			foreignColumns: [importJobs.tenantId, importJobs.id],
			name: "platform_import_row_job_fk",
		}).onDelete("cascade"),
		uniqueIndex("platform_import_row_number_uidx").on(
			table.tenantId,
			table.importId,
			table.rowNumber
		),
		check("platform_import_row_number_ck", sql`${table.rowNumber} > 0`),
		check(
			"platform_import_row_state_ck",
			sql`${table.state} IN ('Valid','Warning','Rejected','Applied','Skipped','Failed')`
		),
	]
);

export const importFindings = pgTable(
	"platform_import_finding",
	{
		classification: text("classification").default("Confidential").notNull(),
		code: text("code").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		field: text("field"),
		id: text("id").notNull(),
		importId: text("import_id").notNull(),
		rowId: text("row_id").notNull(),
		rowNumber: integer("row_number").notNull(),
		severity: text("severity").notNull(),
		sourceKey: text("source_key").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_import_finding_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.importId],
			foreignColumns: [importJobs.tenantId, importJobs.id],
			name: "platform_import_finding_job_fk",
		}).onDelete("cascade"),
		foreignKey({
			columns: [table.tenantId, table.rowId],
			foreignColumns: [importRows.tenantId, importRows.id],
			name: "platform_import_finding_row_fk",
		}).onDelete("cascade"),
		index("platform_import_finding_list_idx").on(
			table.tenantId,
			table.importId,
			table.rowNumber
		),
		check(
			"platform_import_finding_severity_ck",
			sql`${table.severity} IN ('Info','Warning','Error')`
		),
	]
);

export const importWaves = pgTable(
	"platform_import_wave",
	{
		classification: text("classification").default("Confidential").notNull(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		completedRows: integer("completed_rows").default(0).notNull(),
		failureCode: text("failure_code"),
		firstRowNumber: integer("first_row_number").notNull(),
		id: text("id").notNull(),
		importId: text("import_id").notNull(),
		lastCompletedRow: integer("last_completed_row").default(0).notNull(),
		lastRowNumber: integer("last_row_number").notNull(),
		startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
		state: text("state").notNull(),
		tenantId: text("tenant_id").notNull(),
		waveNumber: integer("wave_number").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_import_wave_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.importId],
			foreignColumns: [importJobs.tenantId, importJobs.id],
			name: "platform_import_wave_job_fk",
		}).onDelete("cascade"),
		uniqueIndex("platform_import_wave_number_uidx").on(
			table.tenantId,
			table.importId,
			table.waveNumber
		),
		check(
			"platform_import_wave_range_ck",
			sql`${table.waveNumber} > 0 AND ${table.firstRowNumber} > 0 AND ${table.lastRowNumber} >= ${table.firstRowNumber} AND ${table.completedRows} >= 0 AND ${table.lastCompletedRow} >= 0`
		),
		check(
			"platform_import_wave_state_ck",
			sql`${table.state} IN ('Pending','Running','Completed','Failed')`
		),
	]
);

export const importCommandReceipts = pgTable(
	"platform_import_command_receipt",
	{
		classification: text("classification").default("Confidential").notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		importId: text("import_id").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		result: jsonb("result").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "platform_import_command_receipt_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.importId],
			foreignColumns: [importJobs.tenantId, importJobs.id],
			name: "platform_import_command_receipt_job_fk",
		}).onDelete("cascade"),
		check(
			"platform_import_command_receipt_operation_ck",
			sql`${table.operation} IN ('create:Product','create:OpeningStock','approve:Product','approve:OpeningStock','commit:Product','commit:OpeningStock','accept:Product','accept:OpeningStock','cancel:Product','cancel:OpeningStock','purge:Product','purge:OpeningStock')`
		),
		check(
			"platform_import_command_receipt_classification_ck",
			sql`${table.classification} = 'Confidential'`
		),
	]
);

/**
 * `platform_export_job` (WS3 PR4, frozen control plan §8.1 / PDA-DOM-026)
 * is the durable record of a generated accountant-handoff export. No
 * `platform.export.*` event is registered (WS3 control plan §4: "the
 * export artifact and its manifest/hash are the durable record") — this
 * row IS the record, not a projection of an event. `payload` is the full
 * deterministic `AccountantHandoffPayload` (posting batch + package
 * siblings); `content_hash` is `sha256(canonicalJsonStringify(payload))`,
 * reproducible for identical inputs regardless of `generated_at`/`id`
 * (frozen control plan Tests: "export determinism").
 */
export const exportJobs = pgTable(
	"platform_export_job",
	{
		classification: text("classification").default("Confidential").notNull(),
		contentHash: text("content_hash").notNull(),
		createdByActorUserId: text("created_by_actor_user_id").notNull(),
		currency: text("currency").notNull(),
		generatedAt: timestamp("generated_at", { withTimezone: true }).notNull(),
		id: text("id").notNull(),
		idempotencyKey: text("idempotency_key").notNull(),
		kind: text("kind").notNull(),
		legalEntityId: text("legal_entity_id").notNull(),
		organizationId: text("organization_id").notNull(),
		payload: jsonb("payload").notNull(),
		periodEndUtc: timestamp("period_end_utc", {
			withTimezone: true,
		}).notNull(),
		periodStartUtc: timestamp("period_start_utc", {
			withTimezone: true,
		}).notNull(),
		ruleVersion: text("rule_version").notNull(),
		schemaVersion: text("schema_version").notNull(),
		tenantId: text("tenant_id").notNull(),
		timezone: text("timezone").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "platform_export_job_pk",
		}),
		uniqueIndex("platform_export_job_idempotency_uidx").on(
			table.tenantId,
			table.idempotencyKey
		),
		index("platform_export_job_tenant_org_period_idx").on(
			table.tenantId,
			table.organizationId,
			table.periodStartUtc
		),
		check(
			"platform_export_job_kind_ck",
			sql`${table.kind} IN ('AccountantHandoff')`
		),
		check(
			"platform_export_job_currency_ck",
			sql`${table.currency} ~ '^[A-Z]{3}$'`
		),
		check(
			"platform_export_job_period_ck",
			sql`${table.periodStartUtc} < ${table.periodEndUtc}`
		),
	]
);
