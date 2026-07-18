import { sql } from "drizzle-orm";
import {
	bigint,
	boolean,
	check,
	foreignKey,
	index,
	integer,
	jsonb,
	numeric,
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
 * concurrency, not the application-level pre-check. Its predicate covers
 * both `Open` and `Closing`: a `Closing` session still holds an
 * unreconciled custody position (no `commerce.register.closed.v1` yet, cash
 * movements already refused) pending `commerce.cash-variance.approve`, so a
 * register may not be opened again until that prior session reaches
 * `Closed` — otherwise two live custody sessions could coexist on the same
 * register.
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
			.where(sql`${table.state} in ('Open', 'Closing')`),
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

/**
 * `pos_sale` is the Sale aggregate header (WS3 PR2). Lines live in the
 * sibling `pos_sale_line` table (normalized, not embedded JSONB) —
 * matching the existing `inventory_count`/`inventory_count_line` split in
 * `@meridian/persistence-inventory-postgres`'s owned schema rather than
 * introducing a new storage convention for this branch. A completed sale
 * is append-only (stage file): no code path issues an UPDATE against a
 * `Completed` row.
 */
export const posSales = pgTable(
	"pos_sale",
	{
		changeMinor: minorAmount("change_minor"),
		classification: classification(),
		completedAt: timestamp("completed_at", { withTimezone: true }),
		createdAt: createdAt(),
		createdByActorUserId: text("created_by_actor_user_id").notNull(),
		createdByPartyId: text("created_by_party_id").notNull(),
		currency: text("currency").notNull(),
		customerPartyId: text("customer_party_id"),
		discountMinor: minorAmount("discount_minor").notNull(),
		grossMinor: minorAmount("gross_minor").notNull(),
		heldAt: timestamp("held_at", { withTimezone: true }),
		id: text("id").notNull(),
		locationId: text("location_id").notNull(),
		organizationId: text("organization_id").notNull(),
		receiptId: text("receipt_id"),
		registerId: text("register_id").notNull(),
		sessionId: text("session_id").notNull(),
		state: text("state").default("Open").notNull(),
		taxMinor: minorAmount("tax_minor").notNull(),
		tenantId: text("tenant_id").notNull(),
		tenderedMinor: minorAmount("tendered_minor"),
		tendersMinor:
			jsonb("tenders").$type<
				Array<{ amountMinor: number; referenceId: string | null; type: string }>
			>(),
		totalMinor: minorAmount("total_minor").notNull(),
		updatedAt: updatedAt(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check("pos_sale_currency_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
		check(
			"pos_sale_state_check",
			sql`${table.state} in ('Open', 'Held', 'Completed')`
		),
		check(
			"pos_sale_held_check",
			sql`(${table.state} <> 'Held') or (${table.heldAt} is not null)`
		),
		check(
			"pos_sale_completed_check",
			sql`(${table.state} = 'Completed') = (${table.completedAt} is not null and ${table.receiptId} is not null and ${table.tenderedMinor} is not null and ${table.changeMinor} is not null)`
		),
		primaryKey({ columns: [table.tenantId, table.id], name: "pos_sale_pk" }),
		foreignKey({
			columns: [table.tenantId, table.sessionId],
			foreignColumns: [posRegisterSessions.tenantId, posRegisterSessions.id],
			name: "pos_sale_session_fk",
		}),
		index("pos_sale_tenant_register_state_idx").on(
			table.tenantId,
			table.registerId,
			table.state,
			table.id
		),
	]
);

export const posSaleLines = pgTable(
	"pos_sale_line",
	{
		classification: classification(),
		createdAt: createdAt(),
		discountMinor: minorAmount("discount_minor").notNull(),
		grossMinor: minorAmount("gross_minor").notNull(),
		id: text("id").notNull(),
		/** The Inventory `Sale` movement id `sale.complete` posted for this
		 * line (WS3 PR3, frozen control plan §6.3). No foreign key: Inventory
		 * owns `inventory_stock_movement`, and a domain may not reference
		 * another domain's tables (ADR-0002/0003). `null` only while the sale
		 * has not yet completed. */
		inventoryMovementId: text("inventory_movement_id"),
		lineTotalMinor: minorAmount("line_total_minor").notNull(),
		nonStatutory: boolean("non_statutory").default(true).notNull(),
		priceOverrideId: text("price_override_id"),
		priceOverrideState: text("price_override_state"),
		productId: text("product_id").notNull(),
		productName: text("product_name").notNull(),
		quantity: numeric("quantity", { precision: 38, scale: 6 }).notNull(),
		saleId: text("sale_id").notNull(),
		taxAmountMinor: minorAmount("tax_amount_minor").notNull(),
		taxableBaseMinor: minorAmount("taxable_base_minor").notNull(),
		taxCategory: text("tax_category").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		unitPriceMinor: minorAmount("unit_price_minor").notNull(),
		updatedAt: updatedAt(),
		variantId: text("variant_id"),
	},
	(table) => [
		check("pos_sale_line_quantity_check", sql`${table.quantity} > 0`),
		check(
			"pos_sale_line_tax_category_check",
			sql`${table.taxCategory} in ('GY_STANDARD_14', 'GY_ZERO_RATED', 'GY_EXEMPT', 'GY_OUT_OF_SCOPE')`
		),
		check(
			"pos_sale_line_price_override_state_check",
			sql`${table.priceOverrideState} is null or ${table.priceOverrideState} in ('Pending', 'Approved')`
		),
		// `engine.tax` is registered at `prototype` depth only (stage packet,
		// `NON_STATUTORY_NOTICE`): every tax line PR2's tax engine produces
		// carries `nonStatutory: true` as a literal type, so the column can
		// never legitimately hold `false` on this branch — the CHECK makes
		// that invariant a database-level backstop, not just a TypeScript one.
		check(
			"pos_sale_line_non_statutory_check",
			sql`${table.nonStatutory} = true`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_sale_line_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.saleId],
			foreignColumns: [posSales.tenantId, posSales.id],
			name: "pos_sale_line_sale_fk",
		}),
		index("pos_sale_line_tenant_sale_idx").on(table.tenantId, table.saleId),
	]
);

/**
 * `pos_price_override` implements the price-override maker/checker pair
 * (frozen control plan §6.2): the requester and the approver actor ids are
 * distinct columns so `approvePriceOverride`'s self-approval check can
 * compare them without re-reading the Sale.
 */
export const posPriceOverrides = pgTable(
	"pos_price_override",
	{
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		approvedByActorUserId: text("approved_by_actor_user_id"),
		approvedByPartyId: text("approved_by_party_id"),
		classification: classification(),
		currency: text("currency").notNull(),
		id: text("id").notNull(),
		lineId: text("line_id").notNull(),
		organizationId: text("organization_id").notNull(),
		reason: text("reason").notNull(),
		requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
		requestedByActorUserId: text("requested_by_actor_user_id").notNull(),
		requestedByPartyId: text("requested_by_party_id").notNull(),
		requestedPriceMinor: minorAmount("requested_price_minor").notNull(),
		saleId: text("sale_id").notNull(),
		state: text("state").default("Pending").notNull(),
		tenantId: text("tenant_id").notNull(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check(
			"pos_price_override_currency_check",
			sql`${table.currency} ~ '^[A-Z]{3}$'`
		),
		check(
			"pos_price_override_state_check",
			sql`${table.state} in ('Pending', 'Approved')`
		),
		check(
			"pos_price_override_requested_price_check",
			sql`${table.requestedPriceMinor} > 0`
		),
		check(
			"pos_price_override_approval_check",
			sql`(${table.state} = 'Approved') = (${table.approvedAt} is not null and ${table.approvedByActorUserId} is not null and ${table.approvedByPartyId} is not null)`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_price_override_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.saleId],
			foreignColumns: [posSales.tenantId, posSales.id],
			name: "pos_price_override_sale_fk",
		}),
		index("pos_price_override_tenant_sale_state_idx").on(
			table.tenantId,
			table.saleId,
			table.state
		),
	]
);

/**
 * `pos_receipt` is issued once and never mutated (PR3 reissue/void create
 * their own new/updated rows, out of PR2 scope). Its `lines`/`tenders`
 * columns are the one deliberate JSONB use in this schema: an immutable
 * point-in-time snapshot, the same shape `platform_event_outbox.data` and
 * `platform_audit_record.change_summary` already use elsewhere in this
 * repository — never a live mutable aggregate child.
 */
export const posReceipts = pgTable(
	"pos_receipt",
	{
		cashierPartyId: text("cashier_party_id").notNull(),
		classification: classification(),
		createdAt: createdAt(),
		currency: text("currency").notNull(),
		id: text("id").notNull(),
		issuedAt: timestamp("issued_at", { withTimezone: true }).notNull(),
		kind: text("kind").notNull(),
		lines: jsonb("lines").$type<Record<string, unknown>[]>().notNull(),
		organizationId: text("organization_id").notNull(),
		originalReceiptId: text("original_receipt_id"),
		priceSuppressed: boolean("price_suppressed").default(false).notNull(),
		receiptNumber: text("receipt_number").notNull(),
		registerId: text("register_id").notNull(),
		returnId: text("return_id"),
		saleId: text("sale_id"),
		tenantId: text("tenant_id").notNull(),
		tenders: jsonb("tenders").$type<Record<string, unknown>[]>().notNull(),
		totalMinor: minorAmount("total_minor"),
	},
	(table) => [
		check("pos_receipt_currency_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
		check(
			"pos_receipt_kind_check",
			sql`${table.kind} in ('Sale', 'Return', 'Reissue')`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_receipt_pk",
		}),
		// The authoritative backstop for receipt-number uniqueness per
		// register under concurrency (frozen control plan Tests
		// requirement: "receipt-number monotonicity per register under
		// concurrency") — monotonic issuance order itself is guaranteed by
		// `platform/numbering`'s locked sequence counter; this constraint
		// guarantees no two concurrent completions can ever persist the
		// same number for the same register.
		uniqueIndex("pos_receipt_tenant_register_number_uidx").on(
			table.tenantId,
			table.registerId,
			table.receiptNumber
		),
		index("pos_receipt_tenant_sale_idx").on(table.tenantId, table.saleId),
	]
);

/**
 * `pos_return` is the Return maker/checker aggregate (WS3 PR3, frozen
 * control plan §6.3). `mode` distinguishes an ordinary partial/full return
 * from a same-day/open-session Void (own permission `commerce.receipt.void`,
 * no maker/checker separation — a Void row's `createdBy*`/`approvedBy*` MAY
 * be the same actor, never a `Return` row's; enforced at the application
 * boundary the same way the price-override/cash-variance pairs are, not by
 * a CHECK that cannot see which permission was invoked). `registerId` is
 * always inherited from the referenced Sale — there is no caller-supplied
 * register on `return.create`, which structurally forecloses a
 * cross-register return rather than validating one after the fact.
 * `exchangeSaleId` links a Return later consumed as the compensating leg of
 * an Exchange (frozen control plan §6.5) to its replacement Sale —
 * populated by `sale.complete`'s `exchangeOfReturnId` input, never by
 * `return.approve` itself, since the replacement sale does not exist yet at
 * that point (see the domain package's `commerce.exchange.completed.v1`
 * emission comment for the full disposition of why this column's value is
 * never mirrored onto the frozen `commerce.return.completed.v1` payload).
 */
export const posReturns = pgTable(
	"pos_return",
	{
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		approvedByActorUserId: text("approved_by_actor_user_id"),
		approvedByPartyId: text("approved_by_party_id"),
		classification: classification(),
		createdAt: createdAt(),
		createdByActorUserId: text("created_by_actor_user_id").notNull(),
		createdByPartyId: text("created_by_party_id").notNull(),
		currency: text("currency").notNull(),
		exchangeSaleId: text("exchange_sale_id"),
		id: text("id").notNull(),
		mode: text("mode").default("Return").notNull(),
		organizationId: text("organization_id").notNull(),
		reason: text("reason").notNull(),
		receiptId: text("receipt_id"),
		registerId: text("register_id").notNull(),
		saleId: text("sale_id").notNull(),
		state: text("state").default("Pending").notNull(),
		tenantId: text("tenant_id").notNull(),
		totalRefundableMinor: minorAmount("total_refundable_minor").notNull(),
		updatedAt: updatedAt(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check("pos_return_currency_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
		check("pos_return_mode_check", sql`${table.mode} in ('Return', 'Void')`),
		check(
			"pos_return_state_check",
			sql`${table.state} in ('Pending', 'Completed')`
		),
		check(
			"pos_return_completed_check",
			sql`(${table.state} = 'Completed') = (${table.approvedAt} is not null and ${table.approvedByActorUserId} is not null and ${table.approvedByPartyId} is not null and ${table.receiptId} is not null)`
		),
		check(
			"pos_return_total_refundable_check",
			sql`${table.totalRefundableMinor} >= 0`
		),
		primaryKey({ columns: [table.tenantId, table.id], name: "pos_return_pk" }),
		foreignKey({
			columns: [table.tenantId, table.saleId],
			foreignColumns: [posSales.tenantId, posSales.id],
			name: "pos_return_sale_fk",
		}),
		index("pos_return_tenant_sale_idx").on(
			table.tenantId,
			table.saleId,
			table.state
		),
	]
);

export const posReturnLines = pgTable(
	"pos_return_line",
	{
		classification: classification(),
		createdAt: createdAt(),
		discountMinor: minorAmount("discount_minor").notNull(),
		grossMinor: minorAmount("gross_minor").notNull(),
		id: text("id").notNull(),
		lineTotalMinor: minorAmount("line_total_minor").notNull(),
		nonStatutory: boolean("non_statutory").default(true).notNull(),
		productId: text("product_id").notNull(),
		productName: text("product_name").notNull(),
		quantity: numeric("quantity", { precision: 38, scale: 6 }).notNull(),
		returnId: text("return_id").notNull(),
		saleLineId: text("sale_line_id").notNull(),
		taxAmountMinor: minorAmount("tax_amount_minor").notNull(),
		taxableBaseMinor: minorAmount("taxable_base_minor").notNull(),
		taxCategory: text("tax_category").notNull(),
		tenantId: text("tenant_id").notNull(),
		unit: text("unit").notNull(),
		unitPriceMinor: minorAmount("unit_price_minor").notNull(),
		variantId: text("variant_id"),
	},
	(table) => [
		check("pos_return_line_quantity_check", sql`${table.quantity} > 0`),
		check(
			"pos_return_line_tax_category_check",
			sql`${table.taxCategory} in ('GY_STANDARD_14', 'GY_ZERO_RATED', 'GY_EXEMPT', 'GY_OUT_OF_SCOPE')`
		),
		check(
			"pos_return_line_non_statutory_check",
			sql`${table.nonStatutory} = true`
		),
		primaryKey({
			columns: [table.tenantId, table.id],
			name: "pos_return_line_pk",
		}),
		foreignKey({
			columns: [table.tenantId, table.returnId],
			foreignColumns: [posReturns.tenantId, posReturns.id],
			name: "pos_return_line_return_fk",
		}),
		foreignKey({
			columns: [table.tenantId, table.saleLineId],
			foreignColumns: [posSaleLines.tenantId, posSaleLines.id],
			name: "pos_return_line_sale_line_fk",
		}),
		index("pos_return_line_tenant_return_idx").on(
			table.tenantId,
			table.returnId
		),
		// Query-performance backstop for the cumulative-returned-quantity sum
		// (frozen control plan Tests requirement: "over-return prevention ...
		// concurrent double-return race ... exactly one succeeds or
		// cumulative cap holds"). The authoritative concurrency guard is
		// `return.create` locking the parent Sale row (`SELECT ... FOR
		// UPDATE`, `PosRepository.getSale`) for the whole transaction BEFORE
		// summing prior returned quantity against this table, which
		// serializes concurrent `return.create` calls against the SAME sale
		// — no single-row uniqueness can express a cumulative-quantity cap,
		// so this index is not itself a uniqueness backstop the way the
		// register/receipt tables' unique indexes are.
		index("pos_return_line_tenant_sale_line_idx").on(
			table.tenantId,
			table.saleLineId
		),
	]
);

/**
 * `pos_refund` is the Refund maker/checker aggregate (WS3 PR3, frozen
 * control plan §6.4). `registerId` is inherited from the referenced
 * Return's `registerId` (itself inherited from the original Sale) — there
 * is no caller-supplied register on `refund.create`, structurally
 * foreclosing a cross-register refund. The unique index on `returnId`
 * caps a Return at exactly one Refund ever (its full refundable amount,
 * frozen control plan §6.4 — `refund.create` derives `amountMinor` from
 * the Return, never from caller input, so there is no partial-refund
 * amount to reconcile against repeat requests).
 */
export const posRefunds = pgTable(
	"pos_refund",
	{
		amountMinor: minorAmount("amount_minor").notNull(),
		approvedAt: timestamp("approved_at", { withTimezone: true }),
		approvedByActorUserId: text("approved_by_actor_user_id"),
		approvedByPartyId: text("approved_by_party_id"),
		cashMovementId: text("cash_movement_id"),
		classification: classification(),
		createdAt: createdAt(),
		currency: text("currency").notNull(),
		id: text("id").notNull(),
		organizationId: text("organization_id").notNull(),
		registerId: text("register_id").notNull(),
		requestedAt: timestamp("requested_at", { withTimezone: true }).notNull(),
		requestedByActorUserId: text("requested_by_actor_user_id").notNull(),
		requestedByPartyId: text("requested_by_party_id").notNull(),
		returnId: text("return_id").notNull(),
		state: text("state").default("Requested").notNull(),
		tenantId: text("tenant_id").notNull(),
		updatedAt: updatedAt(),
		version: integer("version").default(1).notNull(),
	},
	(table) => [
		check("pos_refund_currency_check", sql`${table.currency} ~ '^[A-Z]{3}$'`),
		check("pos_refund_amount_check", sql`${table.amountMinor} > 0`),
		check(
			"pos_refund_state_check",
			sql`${table.state} in ('Requested', 'Posted')`
		),
		check(
			"pos_refund_posted_check",
			sql`(${table.state} = 'Posted') = (${table.approvedAt} is not null and ${table.approvedByActorUserId} is not null and ${table.approvedByPartyId} is not null and ${table.cashMovementId} is not null)`
		),
		primaryKey({ columns: [table.tenantId, table.id], name: "pos_refund_pk" }),
		foreignKey({
			columns: [table.tenantId, table.returnId],
			foreignColumns: [posReturns.tenantId, posReturns.id],
			name: "pos_refund_return_fk",
		}),
		uniqueIndex("pos_refund_tenant_return_uidx").on(
			table.tenantId,
			table.returnId
		),
	]
);
