import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
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

const classification = () =>
	text("classification").default("Confidential").notNull();
const createdAt = () =>
	timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
	timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
/** Minor-unit money column (CLAUDE.md §7: explicit currency, integer
 * minor-unit semantics, never binary floating point) — matches the already
 * frozen `commerce.register.*`/`commerce.cash-movement.*` event schemas'
 * `*Minor` integer fields exactly. */
const minorAmount = (name: string) => bigint(name, { mode: "number" });

/**
 * `pos_register_session` is the RegisterSession aggregate (WS3 PR1). A CHECK
 * constraint cannot reference the row's prior value, so the closed-session
 * immutability the stage packet asks for "where expressible" is enforced at
 * the application boundary instead: `updateSession` only ever runs from
 * `closeRegister` (current state `Open`) or `approveCashVariance` (current
 * state `Closing`) after loading and re-validating current state inside the
 * same transaction — there is no code path that issues an UPDATE against a
 * `Closed` row. The partial unique index below is the one invariant that
 * genuinely IS expressible as a CHECK-equivalent constraint (a Postgres
 * unique index), and it is the authoritative double-open guard under
 * concurrency, not the application-level pre-check.
 */
export const posRegisterSessions = pgTable(
	"pos_register_session",
	{
		classification: classification(),
		closedAt: timestamp("closed_at", { withTimezone: true }),
		closedByActorUserId: text("closed_by_actor_user_id"),
		closedByPartyId: text("closed_by_party_id"),
		closeReason: text("close_reason"),
		closeRequestedAt: timestamp("close_requested_at", { withTimezone: true }),
		countedCashMinor: minorAmount("counted_cash_minor"),
		createdAt: createdAt(),
		currency: text("currency").notNull(),
		expectedCashMinor: minorAmount("expected_cash_minor"),
		id: text("id").notNull(),
		locationId: text("location_id").notNull(),
		openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
		openedByActorUserId: text("opened_by_actor_user_id").notNull(),
		openedByPartyId: text("opened_by_party_id").notNull(),
		openingFloatMinor: minorAmount("opening_float_minor").notNull(),
		organizationId: text("organization_id").notNull(),
		registerId: text("register_id").notNull(),
		state: text("state").default("Open").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: updatedAt(),
		varianceApprovalRequired: boolean("variance_approval_required")
			.default(false)
			.notNull(),
		varianceApprovedAt: timestamp("variance_approved_at", {
			withTimezone: true,
		}),
		varianceApprovedByActorUserId: text("variance_approved_by_actor_user_id"),
		varianceApprovedByPartyId: text("variance_approved_by_party_id"),
		varianceMinor: minorAmount("variance_minor"),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"pos_register_session_currency_check",
			sql`${table.currency} ~ '^[A-Z]{3}$'`
		),
		check(
			"pos_register_session_state_check",
			sql`${table.state} in ('Open', 'Closing', 'Closed')`
		),
		check(
			"pos_register_session_opening_float_check",
			sql`${table.openingFloatMinor} >= 0`
		),
		check(
			"pos_register_session_close_fields_check",
			sql`(${table.state} = 'Open' and ${table.closedByActorUserId} is null and ${table.closedByPartyId} is null and ${table.countedCashMinor} is null and ${table.expectedCashMinor} is null and ${table.varianceMinor} is null and ${table.closeRequestedAt} is null and ${table.closedAt} is null) or (${table.state} in ('Closing', 'Closed') and ${table.closedByActorUserId} is not null and ${table.closedByPartyId} is not null and ${table.countedCashMinor} is not null and ${table.expectedCashMinor} is not null and ${table.varianceMinor} is not null and ${table.closeRequestedAt} is not null)`
		),
		check(
			"pos_register_session_closed_at_check",
			sql`(${table.state} = 'Closed') = (${table.closedAt} is not null)`
		),
		check(
			"pos_register_session_variance_approval_check",
			sql`(${table.varianceApprovedAt} is null and ${table.varianceApprovedByActorUserId} is null and ${table.varianceApprovedByPartyId} is null) or (${table.varianceApprovedAt} is not null and ${table.varianceApprovedByActorUserId} is not null and ${table.varianceApprovedByPartyId} is not null and ${table.state} = 'Closed')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_register_session_pk",
		}),
		uniqueIndex("pos_register_session_open_register_uidx")
			.on(table.tenantId, table.registerId)
			.where(sql`${table.state} = 'Open'`),
		index("pos_register_session_tenant_register_idx").on(
			table.tenantId,
			table.registerId,
			table.id
		),
	]
);

export const posCashMovements = pgTable(
	"pos_cash_movement",
	{
		actorPartyId: text("actor_party_id").notNull(),
		actorUserId: text("actor_user_id").notNull(),
		amountMinor: minorAmount("amount_minor").notNull(),
		classification: classification(),
		createdAt: createdAt(),
		currency: text("currency").notNull(),
		direction: text("direction").notNull(),
		id: text("id").notNull(),
		note: text("note"),
		organizationId: text("organization_id").notNull(),
		reasonCode: text("reason_code").notNull(),
		referenceId: text("reference_id"),
		registerId: text("register_id").notNull(),
		sessionId: text("session_id").notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		check(
			"pos_cash_movement_currency_check",
			sql`${table.currency} ~ '^[A-Z]{3}$'`
		),
		check("pos_cash_movement_amount_check", sql`${table.amountMinor} > 0`),
		check(
			"pos_cash_movement_direction_check",
			sql`${table.direction} in ('PaidIn', 'PaidOut')`
		),
		check(
			"pos_cash_movement_reason_code_check",
			sql`${table.reasonCode} in ('PaidIn', 'PaidOut', 'SafeDrop', 'Refund', 'Other')`
		),
		check(
			"pos_cash_movement_direction_reason_pairing_check",
			sql`(${table.reasonCode} = 'PaidIn' and ${table.direction} = 'PaidIn') or (${table.reasonCode} = 'PaidOut' and ${table.direction} = 'PaidOut') or (${table.reasonCode} = 'SafeDrop' and ${table.direction} = 'PaidOut') or (${table.reasonCode} = 'Refund' and ${table.direction} = 'PaidOut') or (${table.reasonCode} = 'Other')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_cash_movement_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.sessionId],
			foreignColumns: [posRegisterSessions.tenantId, posRegisterSessions.id],
			name: "pos_cash_movement_session_fk",
		}),
		index("pos_cash_movement_tenant_session_idx").on(
			table.tenantId,
			table.sessionId,
			table.createdAt,
			table.id
		),
		index("pos_cash_movement_tenant_register_idx").on(
			table.tenantId,
			table.registerId,
			table.createdAt
		),
	]
);

export const posCommandReceipts = pgTable(
	"pos_command_receipt",
	{
		createdAt: createdAt(),
		idempotencyKey: text("idempotency_key").notNull(),
		operation: text("operation").notNull(),
		requestFingerprint: text("request_fingerprint").notNull(),
		resourceId: text("resource_id").notNull(),
		result: jsonb("result").$type<unknown>().notNull(),
		tenantId: text("tenant_id").notNull(),
	},
	(table) => [
		primaryKey({
			columns: [table.tenantId, table.operation, table.idempotencyKey],
			name: "pos_command_receipt_pk",
		}),
		index("pos_command_receipt_resource_idx").on(
			table.tenantId,
			table.operation,
			table.resourceId
		),
	]
);
