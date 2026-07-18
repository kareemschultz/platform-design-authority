/**
 * WS3 PR0 published only the runtime-neutral contract boundary for the POS
 * domain. WS3 PR1 (this file) implements the RegisterSession/CashMovement
 * behavior the frozen WS3 control plan
 * (docs/blueprint/17-Roadmap/WS3_POS_CASH_IMPLEMENTATION_PLAN.md) assigns to
 * this stage: `commerce.register.open`, `commerce.register.close`,
 * `commerce.cash-movement.create`, and `commerce.cash-variance.approve`.
 * Sale, return, refund, and deposit behavior remain WS3 PR2-PR4, never here.
 *
 * Runtime-neutral per ADR-0020: no Bun globals, `bun:*` imports, Hono
 * context types, oRPC transport objects, or database adapters. Concrete
 * Postgres adapters live in `@meridian/persistence-pos-postgres`.
 */

import type { EventEnvelope } from "@meridian/contracts-events";

/**
 * RegisterSession lifecycle (PR1): a session opens with a counted float and
 * closes with a counted drawer. There is no reopen transition — a new
 * session is opened instead. `Closing` is the state a non-zero-variance
 * close occupies while `commerce.cash-variance.approve` is pending; it is
 * never externally observable as a completed close.
 */
export const REGISTER_SESSION_STATES = ["Open", "Closing", "Closed"] as const;

export type RegisterSessionState = (typeof REGISTER_SESSION_STATES)[number];

/**
 * Sale lifecycle (PR2): a sale accumulates lines while `Open`, may be
 * parked to `Held` via `commerce.sale.hold` and resumed by any further
 * authorized mutation, and becomes `Completed` only through
 * `commerce.sale.complete`. A `Completed` sale is append-only; returns and
 * voids are PR3 compensating records, never edits of this state.
 */
export const SALE_STATES = ["Open", "Held", "Completed"] as const;

export type SaleState = (typeof SALE_STATES)[number];

/**
 * Maker/checker pending states shared by the five WS3 create/approve pairs
 * (cash-variance, price-override, return, refund, deposit-confirm). A
 * `Pending` request carries no irreversible cash, inventory, or outbox
 * effect; only `Approved` may. The requesting actor may never also be the
 * approving actor (self-approval is denied at the application boundary).
 */
export const APPROVAL_STATES = ["Pending", "Approved"] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

/**
 * Runtime-neutral persistence boundary. Concrete Postgres adapters live in
 * `@meridian/persistence-pos-postgres`; this core never imports Drizzle,
 * `pg`, migrations, environment access, Hono, oRPC transports, or Bun
 * globals (ADR-0020).
 */
export interface PosPersistencePort {
	readonly owner: "pos";
}

// ---------------------------------------------------------------------------
// Money (CLAUDE.md §7: explicit currency, integer minor-unit semantics —
// never binary floating point. Matches the already-frozen event schemas'
// `*Minor` integer fields exactly.)
// ---------------------------------------------------------------------------

const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const MAX_MINOR_AMOUNT = Number.MAX_SAFE_INTEGER;

export class PosError extends Error {
	readonly code:
		| "approval_separation"
		| "idempotency_conflict"
		| "invalid_reference"
		| "invalid_state"
		| "not_found"
		| "validation"
		| "version_conflict";
	constructor(code: PosError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "PosError";
	}
}

function requireCurrency(value: string): void {
	if (!CURRENCY_PATTERN.test(value)) {
		throw new PosError(
			"validation",
			"Currency must be a three-letter ISO 4217 alphabetic code"
		);
	}
}

function requireMatchingCurrency(expected: string, actual: string): void {
	requireCurrency(actual);
	if (actual !== expected) {
		throw new PosError(
			"validation",
			"Amount currency does not match the register session currency"
		);
	}
}

function requireNonNegativeMinor(value: number, field: string): void {
	if (!Number.isInteger(value) || value < 0 || value > MAX_MINOR_AMOUNT) {
		throw new PosError(
			"validation",
			`${field} must be a non-negative integer minor-unit amount`
		);
	}
}

function requirePositiveMinor(value: number, field: string): void {
	if (!Number.isInteger(value) || value <= 0 || value > MAX_MINOR_AMOUNT) {
		throw new PosError(
			"validation",
			`${field} must be a positive integer minor-unit amount`
		);
	}
}

// ---------------------------------------------------------------------------
// Cash movements
// ---------------------------------------------------------------------------

export const CASH_MOVEMENT_DIRECTIONS = ["PaidIn", "PaidOut"] as const;
export type CashMovementDirection = (typeof CASH_MOVEMENT_DIRECTIONS)[number];

export const CASH_MOVEMENT_REASON_CODES = [
	"PaidIn",
	"PaidOut",
	"SafeDrop",
	"Refund",
	"Other",
] as const;
export type CashMovementReasonCode =
	(typeof CASH_MOVEMENT_REASON_CODES)[number];

/**
 * The direction/reason-code pairing every cash movement (paid-in, paid-out,
 * safe drop, and PR3's refund posting) must satisfy. `Other` is the only
 * reason code that tolerates either direction; every other reason code has
 * exactly one legal direction (CLAUDE.md §5 corrections are reversal/
 * compensation only — a mismatched pairing is rejected outright, not
 * silently corrected).
 */
function requireDirectionReasonPairing(
	direction: CashMovementDirection,
	reasonCode: CashMovementReasonCode
): void {
	const requiredDirection: Record<
		Exclude<CashMovementReasonCode, "Other">,
		CashMovementDirection
	> = {
		PaidIn: "PaidIn",
		PaidOut: "PaidOut",
		Refund: "PaidOut",
		SafeDrop: "PaidOut",
	};
	if (reasonCode === "Other") {
		return;
	}
	if (requiredDirection[reasonCode] !== direction) {
		throw new PosError(
			"validation",
			`Reason code ${reasonCode} requires direction ${requiredDirection[reasonCode]}`
		);
	}
}

export interface RegisterSessionRecord {
	closedAt: Date | null;
	closedByActorUserId: string | null;
	closedByPartyId: string | null;
	closeReason: string | null;
	closeRequestedAt: Date | null;
	countedCashMinor: number | null;
	createdAt: Date;
	currency: string;
	expectedCashMinor: number | null;
	id: string;
	locationId: string;
	openedAt: Date;
	openedByActorUserId: string;
	openedByPartyId: string;
	openingFloatMinor: number;
	organizationId: string;
	registerId: string;
	state: RegisterSessionState;
	tenantId: string;
	updatedAt: Date;
	varianceApprovalRequired: boolean;
	varianceApprovedAt: Date | null;
	varianceApprovedByActorUserId: string | null;
	varianceApprovedByPartyId: string | null;
	varianceMinor: number | null;
	version: number;
}

export interface RegisterSessionView {
	closedAt: string | null;
	closeReason: string | null;
	countedCash: { amountMinor: number; currency: string } | null;
	currency: string;
	expectedCash: { amountMinor: number; currency: string } | null;
	id: string;
	locationId: string;
	openedAt: string;
	openerPartyId: string;
	openingFloat: { amountMinor: number; currency: string };
	registerId: string;
	state: RegisterSessionState;
	variance: { amountMinor: number; currency: string } | null;
	varianceApprovalRequired: boolean;
	varianceApprovedAt: string | null;
	varianceApproverPartyId: string | null;
	version: number;
}

export interface CashMovementRecord {
	actorPartyId: string;
	actorUserId: string;
	amountMinor: number;
	createdAt: Date;
	currency: string;
	direction: CashMovementDirection;
	id: string;
	note: string | null;
	organizationId: string;
	reasonCode: CashMovementReasonCode;
	referenceId: string | null;
	registerId: string;
	sessionId: string;
	tenantId: string;
}

export interface CashMovementView {
	amount: { amountMinor: number; currency: string };
	createdAt: string;
	direction: CashMovementDirection;
	id: string;
	note: string | null;
	reasonCode: CashMovementReasonCode;
	referenceId: string | null;
	registerId: string;
	sessionId: string;
}

export interface CashMovementNetTotals {
	paidInMinor: number;
	paidOutMinor: number;
}

export type PosCommandOperation =
	| "commerce.cash-movement.create"
	| "commerce.cash-variance.approve"
	| "commerce.register.close"
	| "commerce.register.open";

export interface PosCommandReceipt {
	createdAt: Date;
	idempotencyKey: string;
	operation: PosCommandOperation;
	requestFingerprint: string;
	resourceId: string;
	result: unknown;
	tenantId: string;
}

export interface PosRepository {
	acquireCommandLock: (
		tenantId: string,
		operation: PosCommandOperation,
		idempotencyKey: string
	) => Promise<void>;
	createCashMovement: (
		record: CashMovementRecord
	) => Promise<CashMovementRecord>;
	getCommandReceipt: (
		tenantId: string,
		operation: PosCommandOperation,
		idempotencyKey: string
	) => Promise<PosCommandReceipt | null>;
	/** Locks the row (SELECT ... FOR UPDATE) inside the enclosing transaction. */
	getOpenSession: (
		tenantId: string,
		registerId: string
	) => Promise<RegisterSessionRecord | null>;
	getSession: (
		tenantId: string,
		sessionId: string
	) => Promise<RegisterSessionRecord | null>;
	netCashMovements: (
		tenantId: string,
		sessionId: string
	) => Promise<CashMovementNetTotals>;
	/** Inserts the session row; the owning schema's partial unique index
	 * (tenant_id, register_id) WHERE state IN ('Open', 'Closing') is the
	 * authoritative double-open guard under genuine concurrency — this
	 * return value reports that constraint's outcome, it does not itself
	 * enforce it. A `Closing` session (non-zero variance, pending
	 * `commerce.cash-variance.approve`) still holds an unreconciled custody
	 * position, so it blocks a new open on the same register exactly like an
	 * `Open` one does. */
	openRegister: (
		record: RegisterSessionRecord
	) => Promise<RegisterSessionRecord | "already_open">;
	recordCommandReceipt: (
		receipt: PosCommandReceipt
	) => Promise<{ inserted: boolean; record: PosCommandReceipt }>;
	updateSession: (
		record: RegisterSessionRecord,
		expectedVersion: number
	) => Promise<RegisterSessionRecord | "version_conflict">;
}

export type PendingPosEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;
export interface PosEventAppendPort {
	append: (event: PendingPosEvent) => Promise<"inserted" | "duplicate">;
}
export interface PosTransactionScope {
	events: PosEventAppendPort;
	repository: PosRepository;
}
export interface PosUnitOfWork {
	execute: <T>(
		operation: (scope: PosTransactionScope) => Promise<T>
	) => Promise<T>;
}

export interface PosIdFactory {
	create: (kind: "event" | "movement" | "session") => string;
}

export interface PosPartyPort {
	/** Resolves the acting auth user to their canonical Party identity for
	 * the active tenant/organization context. Commerce owns customer stored
	 * value and cash custody facts against Party identity, never the Better
	 * Auth user id, per CLAUDE.md §5/§7. */
	requireActorPartyId: (input: {
		authUserId: string;
		organizationId: string;
		tenantId: string;
	}) => Promise<string>;
}

async function fingerprint(value: unknown): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(JSON.stringify(value))
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

async function replay<T>(
	repository: PosRepository,
	input: {
		idempotencyKey: string;
		operation: PosCommandOperation;
		requestFingerprint: string;
		tenantId: string;
	}
): Promise<T | null> {
	await repository.acquireCommandLock(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	const receipt = await repository.getCommandReceipt(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	if (!receipt) {
		return null;
	}
	if (receipt.requestFingerprint !== input.requestFingerprint) {
		throw new PosError(
			"idempotency_conflict",
			"Idempotency key is bound to another POS command"
		);
	}
	return receipt.result as T;
}

async function recordResult<T>(
	repository: PosRepository,
	input: {
		idempotencyKey: string;
		operation: PosCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: T,
	now: Date
): Promise<T> {
	const claim = await repository.recordCommandReceipt({
		createdAt: now,
		idempotencyKey: input.idempotencyKey,
		operation: input.operation,
		requestFingerprint: input.requestFingerprint,
		resourceId: input.resourceId,
		result,
		tenantId: input.tenantId,
	});
	if (claim.record.requestFingerprint !== input.requestFingerprint) {
		throw new PosError(
			"idempotency_conflict",
			"Idempotency key is bound to another POS command"
		);
	}
	if (!claim.inserted) {
		throw new Error(
			"POS command identity was claimed after command side effects began"
		);
	}
	return claim.record.result as T;
}

function requireVersion(record: { version: number }, expected: number): void {
	if (record.version !== expected) {
		throw new PosError("version_conflict", "Register session version is stale");
	}
}

function money(currency: string, amountMinor: number | null) {
	return amountMinor === null ? null : { amountMinor, currency };
}

function registerSessionView(
	record: RegisterSessionRecord
): RegisterSessionView {
	return {
		closedAt: record.closedAt?.toISOString() ?? null,
		closeReason: record.closeReason,
		countedCash: money(record.currency, record.countedCashMinor),
		currency: record.currency,
		expectedCash: money(record.currency, record.expectedCashMinor),
		id: record.id,
		locationId: record.locationId,
		openedAt: record.openedAt.toISOString(),
		openerPartyId: record.openedByPartyId,
		openingFloat: {
			amountMinor: record.openingFloatMinor,
			currency: record.currency,
		},
		registerId: record.registerId,
		state: record.state,
		variance: money(record.currency, record.varianceMinor),
		varianceApprovalRequired: record.varianceApprovalRequired,
		varianceApprovedAt: record.varianceApprovedAt?.toISOString() ?? null,
		varianceApproverPartyId: record.varianceApprovedByPartyId,
		version: record.version,
	};
}

function cashMovementView(record: CashMovementRecord): CashMovementView {
	return {
		amount: { amountMinor: record.amountMinor, currency: record.currency },
		createdAt: record.createdAt.toISOString(),
		direction: record.direction,
		id: record.id,
		note: record.note,
		reasonCode: record.reasonCode,
		referenceId: record.referenceId,
		registerId: record.registerId,
		sessionId: record.sessionId,
	};
}

function event(input: {
	actorUserId: string;
	aggregateId: string;
	capabilityId: "commerce.cash-management" | "commerce.register-management";
	correlationId: string;
	data: Record<string, unknown>;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	schemaRef: string;
	tenantId: string;
}): PendingPosEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: input.capabilityId,
		classification: "Confidential",
		correlationId: input.correlationId,
		data: input.data,
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "commerce",
		purpose: "tenant-cash-custody-operations",
		retentionClass: "commerce-cash-custody-event",
		schemaRef: input.schemaRef,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

export interface PosServiceOptions {
	clock: () => Date;
	ids: PosIdFactory;
	parties: PosPartyPort;
	unitOfWork: PosUnitOfWork;
}

export function createPosService(options: PosServiceOptions) {
	return {
		async approveCashVariance(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			sessionId: string;
			tenantId: string;
			version: number;
		}): Promise<RegisterSessionView> {
			const requestFingerprint = await fingerprint({
				sessionId: input.sessionId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.cash-variance.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getSession(
					input.tenantId,
					input.sessionId
				);
				if (!current) {
					throw new PosError("not_found", "Register session was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Closing") {
					throw new PosError(
						"invalid_state",
						"Only a session pending variance approval can be approved"
					);
				}
				if (current.closedByActorUserId === input.actorUserId) {
					throw new PosError(
						"approval_separation",
						"The closer cannot approve their own cash variance"
					);
				}
				const now = options.clock();
				const approverPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const updated: RegisterSessionRecord = {
					...current,
					closedAt: now,
					state: "Closed",
					updatedAt: now,
					varianceApprovedAt: now,
					varianceApprovedByActorUserId: input.actorUserId,
					varianceApprovedByPartyId: approverPartyId,
					version: current.version + 1,
				};
				const saved = await repository.updateSession(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError(
						"version_conflict",
						"Register session version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.register-management",
						correlationId: input.correlationId,
						data: {
							closerPartyId: saved.closedByPartyId,
							countedCashMinor: saved.countedCashMinor,
							currency: saved.currency,
							expectedCashMinor: saved.expectedCashMinor,
							registerId: saved.registerId,
							varianceApprovalRequired: true,
							varianceApproverPartyId: approverPartyId,
							varianceMinor: saved.varianceMinor,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.register.closed.v1",
						now,
						organizationId: saved.organizationId,
						schemaRef: "schemas/events/commerce.register.closed.v1.schema.json",
						tenantId: saved.tenantId,
					})
				);
				const result = registerSessionView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.cash-variance.approve",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async closeRegister(input: {
			actorUserId: string;
			correlationId: string;
			countedCash: { amountMinor: number; currency: string };
			idempotencyKey: string;
			organizationId: string;
			reason?: string | null;
			registerId: string;
			tenantId: string;
		}): Promise<RegisterSessionView> {
			requireNonNegativeMinor(
				input.countedCash.amountMinor,
				"countedCash.amountMinor"
			);
			const requestFingerprint = await fingerprint({
				countedCash: input.countedCash,
				reason: input.reason ?? null,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.register.close",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getOpenSession(
					input.tenantId,
					input.registerId
				);
				if (!current) {
					throw new PosError(
						"invalid_state",
						"Register has no open session to close"
					);
				}
				requireMatchingCurrency(current.currency, input.countedCash.currency);
				const totals = await repository.netCashMovements(
					input.tenantId,
					current.id
				);
				const expectedCashMinor =
					current.openingFloatMinor + totals.paidInMinor - totals.paidOutMinor;
				const varianceMinor = input.countedCash.amountMinor - expectedCashMinor;
				const now = options.clock();
				const closerPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const zeroVariance = varianceMinor === 0;
				const updated: RegisterSessionRecord = {
					...current,
					closedAt: zeroVariance ? now : null,
					closedByActorUserId: input.actorUserId,
					closedByPartyId: closerPartyId,
					closeReason: input.reason ?? null,
					closeRequestedAt: now,
					countedCashMinor: input.countedCash.amountMinor,
					expectedCashMinor,
					state: zeroVariance ? "Closed" : "Closing",
					updatedAt: now,
					varianceApprovalRequired: !zeroVariance,
					varianceMinor,
					version: current.version + 1,
				};
				const saved = await repository.updateSession(updated, current.version);
				if (saved === "version_conflict") {
					throw new PosError(
						"version_conflict",
						"Register session version is stale"
					);
				}
				if (zeroVariance) {
					await events.append(
						event({
							actorUserId: input.actorUserId,
							aggregateId: saved.id,
							capabilityId: "commerce.register-management",
							correlationId: input.correlationId,
							data: {
								closerPartyId,
								countedCashMinor: saved.countedCashMinor,
								currency: saved.currency,
								expectedCashMinor: saved.expectedCashMinor,
								registerId: saved.registerId,
								varianceApprovalRequired: false,
								varianceApproverPartyId: null,
								varianceMinor: saved.varianceMinor,
							},
							eventId: options.ids.create("event"),
							idempotencyKey: input.idempotencyKey,
							name: "commerce.register.closed.v1",
							now,
							organizationId: saved.organizationId,
							schemaRef:
								"schemas/events/commerce.register.closed.v1.schema.json",
							tenantId: saved.tenantId,
						})
					);
				}
				const result = registerSessionView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.register.close",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async createCashMovement(input: {
			actorUserId: string;
			amount: { amountMinor: number; currency: string };
			correlationId: string;
			direction: CashMovementDirection;
			idempotencyKey: string;
			note?: string | null;
			organizationId: string;
			reasonCode: CashMovementReasonCode;
			referenceId?: string | null;
			registerId: string;
			tenantId: string;
		}): Promise<CashMovementView> {
			requirePositiveMinor(input.amount.amountMinor, "amount.amountMinor");
			requireDirectionReasonPairing(input.direction, input.reasonCode);
			const requestFingerprint = await fingerprint({
				amount: input.amount,
				direction: input.direction,
				note: input.note ?? null,
				reasonCode: input.reasonCode,
				referenceId: input.referenceId ?? null,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<CashMovementView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.cash-movement.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const session = await repository.getOpenSession(
					input.tenantId,
					input.registerId
				);
				if (!session) {
					throw new PosError(
						"invalid_state",
						"Register has no open session accepting cash movements"
					);
				}
				requireMatchingCurrency(session.currency, input.amount.currency);
				const now = options.clock();
				const actorPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const record: CashMovementRecord = {
					actorPartyId,
					actorUserId: input.actorUserId,
					amountMinor: input.amount.amountMinor,
					createdAt: now,
					currency: input.amount.currency,
					direction: input.direction,
					id: options.ids.create("movement"),
					note: input.note ?? null,
					organizationId: input.organizationId,
					reasonCode: input.reasonCode,
					referenceId: input.referenceId ?? null,
					registerId: input.registerId,
					sessionId: session.id,
					tenantId: input.tenantId,
				};
				const saved = await repository.createCashMovement(record);
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						capabilityId: "commerce.cash-management",
						correlationId: input.correlationId,
						data: {
							actorPartyId,
							amountMinor: saved.amountMinor,
							currency: saved.currency,
							direction: saved.direction,
							movementId: saved.id,
							reasonCode: saved.reasonCode,
							referenceId: saved.referenceId,
							registerId: saved.registerId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.cash-movement.posted.v1",
						now,
						organizationId: saved.organizationId,
						schemaRef:
							"schemas/events/commerce.cash-movement.posted.v1.schema.json",
						tenantId: saved.tenantId,
					})
				);
				const result = cashMovementView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.cash-movement.create",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					result,
					now
				);
			});
		},

		async getRegisterSession(
			tenantId: string,
			sessionId: string
		): Promise<RegisterSessionView> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getSession(tenantId, sessionId)
			);
			if (!record) {
				throw new PosError("not_found", "Register session was not found");
			}
			return registerSessionView(record);
		},

		async openRegister(input: {
			actorUserId: string;
			correlationId: string;
			currency: string;
			idempotencyKey: string;
			locationId: string;
			openingFloat: { amountMinor: number; currency: string };
			organizationId: string;
			registerId: string;
			tenantId: string;
		}): Promise<RegisterSessionView> {
			requireCurrency(input.currency);
			requireMatchingCurrency(input.currency, input.openingFloat.currency);
			requireNonNegativeMinor(
				input.openingFloat.amountMinor,
				"openingFloat.amountMinor"
			);
			const requestFingerprint = await fingerprint({
				currency: input.currency,
				locationId: input.locationId,
				openingFloat: input.openingFloat,
				registerId: input.registerId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<RegisterSessionView>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "commerce.register.open",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const openerPartyId = await options.parties.requireActorPartyId({
					authUserId: input.actorUserId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				});
				const id = options.ids.create("session");
				const record: RegisterSessionRecord = {
					closedAt: null,
					closedByActorUserId: null,
					closedByPartyId: null,
					closeReason: null,
					closeRequestedAt: null,
					countedCashMinor: null,
					createdAt: now,
					currency: input.currency,
					expectedCashMinor: null,
					id,
					locationId: input.locationId,
					openedAt: now,
					openedByActorUserId: input.actorUserId,
					openedByPartyId: openerPartyId,
					openingFloatMinor: input.openingFloat.amountMinor,
					organizationId: input.organizationId,
					registerId: input.registerId,
					state: "Open",
					tenantId: input.tenantId,
					updatedAt: now,
					varianceApprovalRequired: false,
					varianceApprovedAt: null,
					varianceApprovedByActorUserId: null,
					varianceApprovedByPartyId: null,
					varianceMinor: null,
					version: 1,
				};
				const inserted = await repository.openRegister(record);
				if (inserted === "already_open") {
					throw new PosError(
						"invalid_state",
						"Register already has an open session"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: inserted.id,
						capabilityId: "commerce.register-management",
						correlationId: input.correlationId,
						data: {
							currency: inserted.currency,
							locationId: inserted.locationId,
							openerPartyId,
							openingFloatMinor: inserted.openingFloatMinor,
							registerId: inserted.registerId,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "commerce.register.opened.v1",
						now,
						organizationId: inserted.organizationId,
						schemaRef: "schemas/events/commerce.register.opened.v1.schema.json",
						tenantId: inserted.tenantId,
					})
				);
				const result = registerSessionView(inserted);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "commerce.register.open",
						requestFingerprint,
						resourceId: inserted.id,
						tenantId: inserted.tenantId,
					},
					result,
					now
				);
			});
		},
	};
}

// ---------------------------------------------------------------------------
// Application layer: active-context, permission, and entitlement enforcement
// BEFORE service dispatch (WS1/WS2 pattern; CLAUDE.md §5).
// ---------------------------------------------------------------------------

export interface PosActiveContextPort {
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}

export type PosPermission =
	| "commerce.cash-movement.create"
	| "commerce.cash-variance.approve"
	| "commerce.register.close"
	| "commerce.register.open";

export interface PosPermissionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PosPermission;
		sessionId: string;
	}) => Promise<unknown>;
}

export interface PosEntitlementPort {
	requireEntitlement: (input: {
		access: "Read" | "Write";
		capabilityId: "commerce.cash-management" | "commerce.register-management";
		organizationId: string;
		tenantId: string;
	}) => Promise<unknown>;
}

export function createPosApplication(options: {
	activeContexts: PosActiveContextPort;
	entitlements: PosEntitlementPort;
	permissions: PosPermissionPort;
	service: ReturnType<typeof createPosService>;
}) {
	async function authorize(input: {
		assuranceLevel?: string;
		authUserId: string;
		capabilityId: Parameters<
			PosEntitlementPort["requireEntitlement"]
		>[0]["capabilityId"];
		contextId: string;
		permission: PosPermission;
		sessionId: string;
	}) {
		const context = await options.activeContexts.requireActiveContext(input);
		await options.permissions.requirePermission({
			assuranceLevel: input.assuranceLevel ?? "aal1",
			authUserId: input.authUserId,
			contextId: input.contextId,
			permission: input.permission,
			sessionId: input.sessionId,
		});
		await options.entitlements.requireEntitlement({
			access: "Write",
			capabilityId: input.capabilityId,
			organizationId: context.organizationId,
			tenantId: context.tenantId,
		});
		return context;
	}

	return {
		async approveCashVariance(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			registerSessionId: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.cash-variance.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveCashVariance({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				sessionId: input.registerSessionId,
				tenantId: context.tenantId,
				version: input.version,
			});
		},
		async closeRegister(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			countedCash: { amountMinor: number; currency: string };
			idempotencyKey: string;
			reason?: string | null;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.register.close",
				sessionId: input.sessionId,
			});
			return options.service.closeRegister({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				countedCash: input.countedCash,
				idempotencyKey: input.idempotencyKey,
				organizationId: context.organizationId,
				reason: input.reason,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
		async createCashMovement(input: {
			actorUserId: string;
			amount: { amountMinor: number; currency: string };
			contextId: string;
			correlationId: string;
			direction: CashMovementDirection;
			idempotencyKey: string;
			note?: string | null;
			reasonCode: CashMovementReasonCode;
			referenceId?: string | null;
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.cash-management",
				contextId: input.contextId,
				permission: "commerce.cash-movement.create",
				sessionId: input.sessionId,
			});
			return options.service.createCashMovement({
				actorUserId: input.actorUserId,
				amount: input.amount,
				correlationId: input.correlationId,
				direction: input.direction,
				idempotencyKey: input.idempotencyKey,
				note: input.note,
				organizationId: context.organizationId,
				reasonCode: input.reasonCode,
				referenceId: input.referenceId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
		async openRegister(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			currency: string;
			idempotencyKey: string;
			locationId: string;
			openingFloat: { amountMinor: number; currency: string };
			registerId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				authUserId: input.actorUserId,
				capabilityId: "commerce.register-management",
				contextId: input.contextId,
				permission: "commerce.register.open",
				sessionId: input.sessionId,
			});
			return options.service.openRegister({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				currency: input.currency,
				idempotencyKey: input.idempotencyKey,
				locationId: input.locationId,
				openingFloat: input.openingFloat,
				organizationId: context.organizationId,
				registerId: input.registerId,
				tenantId: context.tenantId,
			});
		},
	};
}
