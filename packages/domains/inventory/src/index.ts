import type { EventEnvelope } from "@meridian/contracts-events";
import type {
	CreateInventoryAdjustment,
	CreateStockCount,
	CreateStockTransfer,
	InventoryAdjustment,
	ReceiveStockTransfer,
	SaveStockCountDraftLines,
	StockBalance,
	StockCount,
	StockTransfer,
	SubmitStockCount,
	TransitionReason,
} from "@meridian/contracts-platform-api";

export const DECIMAL_QUANTITY_PATTERN =
	/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;
export const NON_NEGATIVE_DECIMAL_QUANTITY_PATTERN =
	/^(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;
export const POSITIVE_DECIMAL_QUANTITY_PATTERN =
	/^(?!0(?:\.0{1,6})?$)(?:0|[1-9][0-9]*)(?:\.[0-9]{1,6})?$/;

const QUANTITY_SCALE = 1_000_000n;
const TRAILING_ZERO_PATTERN = /0+$/;

export type DecimalQuantity = string;

export interface QuantityContract {
	conversionSourceId?: string | null;
	unit: string;
	value: DecimalQuantity;
}

export function quantityToMinor(value: DecimalQuantity): bigint {
	if (!DECIMAL_QUANTITY_PATTERN.test(value)) {
		throw new InventoryError(
			"invalid_quantity",
			"Quantity must be an exact decimal with at most six places"
		);
	}
	const negative = value.startsWith("-");
	const unsigned = negative ? value.slice(1) : value;
	const [whole = "0", fraction = ""] = unsigned.split(".");
	const minor =
		BigInt(whole) * QUANTITY_SCALE + BigInt(fraction.padEnd(6, "0"));
	return negative ? -minor : minor;
}

export function minorToQuantity(value: bigint): DecimalQuantity {
	const negative = value < 0n;
	const absolute = negative ? -value : value;
	const whole = absolute / QUANTITY_SCALE;
	const fraction = (absolute % QUANTITY_SCALE)
		.toString()
		.padStart(6, "0")
		.replace(TRAILING_ZERO_PATTERN, "");
	return `${negative ? "-" : ""}${whole}${fraction ? `.${fraction}` : ""}`;
}

export function addQuantities(
	left: DecimalQuantity,
	right: DecimalQuantity
): DecimalQuantity {
	return minorToQuantity(quantityToMinor(left) + quantityToMinor(right));
}

export function subtractQuantities(
	left: DecimalQuantity,
	right: DecimalQuantity
): DecimalQuantity {
	return minorToQuantity(quantityToMinor(left) - quantityToMinor(right));
}

function negateQuantity(value: DecimalQuantity): DecimalQuantity {
	return minorToQuantity(-quantityToMinor(value));
}

function requirePositive(value: DecimalQuantity): void {
	if (quantityToMinor(value) <= 0n) {
		throw new InventoryError("invalid_quantity", "Quantity must be positive");
	}
}

export type InventoryMovementType =
	| "Adjustment"
	| "CountVariance"
	| "TransferOut"
	| "TransferIn"
	| "Reversal"
	| "Offline"
	| "Sale";

export interface InventoryMovementRecord {
	actorUserId: string;
	causationId: string | null;
	classification: "Confidential";
	conversionSourceId: string | null;
	correlationId: string;
	createdAt: Date;
	decisionId: string | null;
	id: string;
	itemKey: string;
	locationId: string;
	movementType: InventoryMovementType;
	occurredAt: Date;
	organizationId: string;
	productId: string;
	quantity: DecimalQuantity;
	reversalOfMovementId: string | null;
	sourceId: string;
	sourceType: "Adjustment" | "Count" | "Transfer" | "OfflineCommand" | "Sale";
	tenantId: string;
	unit: string;
	variantId: string | null;
}

export interface InventoryBalanceRecord {
	asOf: Date;
	classification: "Confidential";
	itemKey: string;
	locationId: string;
	onHand: DecimalQuantity;
	organizationId: string;
	productId: string;
	reconciliationState: "Current" | "RequiresReview";
	tenantId: string;
	unit: string;
	updatedAt: Date;
	variantId: string | null;
	version: number;
}

export interface InventoryReservationRecord {
	classification: "Confidential";
	createdAt: Date;
	createdByUserId: string;
	expiresAt: Date | null;
	id: string;
	itemKey: string;
	locationId: string;
	organizationId: string;
	productId: string;
	quantity: DecimalQuantity;
	reason: string | null;
	releasedAt: Date | null;
	sourceId: string | null;
	state: "Active" | "Released" | "Expired";
	tenantId: string;
	unit: string;
	updatedAt: Date;
	variantId: string | null;
	version: number;
}

export interface InventoryAdjustmentRecord
	extends Omit<InventoryAdjustment, "createdAt" | "postedAt" | "updatedAt"> {
	approvedByUserId: string | null;
	classification: "Confidential";
	createdAt: Date;
	createdByUserId: string;
	organizationId: string;
	postedAt: Date | null;
	tenantId: string;
	updatedAt: Date;
}

export interface InventoryCountLineRecord {
	classification: "Confidential";
	conversionSourceId: string | null;
	countId: string;
	createdAt: Date;
	expectedQuantity: DecimalQuantity | null;
	id: string;
	itemKey: string;
	movementId: string | null;
	observedQuantity: DecimalQuantity;
	productId: string;
	tenantId: string;
	unit: string;
	updatedAt: Date;
	varianceQuantity: DecimalQuantity | null;
	variantId: string | null;
}

export interface InventoryCountRecord
	extends Omit<StockCount, "createdAt" | "lines" | "postedAt" | "updatedAt"> {
	approvedByUserId: string | null;
	classification: "Confidential";
	createdAt: Date;
	createdByUserId: string;
	lines: InventoryCountLineRecord[];
	locationId: string;
	organizationId: string;
	postedAt: Date | null;
	submittedByUserId: string | null;
	tenantId: string;
	updatedAt: Date;
}

export interface InventoryTransferLineRecord {
	classification: "Confidential";
	conversionSourceId: string | null;
	createdAt: Date;
	dispatchedQuantity: DecimalQuantity;
	exceptionQuantity: DecimalQuantity;
	id: string;
	itemKey: string;
	productId: string;
	receivedQuantity: DecimalQuantity;
	requestedQuantity: DecimalQuantity;
	sourceMovementId: string | null;
	tenantId: string;
	transferId: string;
	unit: string;
	updatedAt: Date;
	variantId: string | null;
}

export interface InventoryTransferRecord
	extends Omit<
		StockTransfer,
		"createdAt" | "dispatchedAt" | "lines" | "receivedAt" | "updatedAt"
	> {
	classification: "Confidential";
	createdAt: Date;
	createdByUserId: string;
	dispatchedAt: Date | null;
	dispatchedByUserId: string | null;
	lines: InventoryTransferLineRecord[];
	organizationId: string;
	receivedAt: Date | null;
	receivedByUserId: string | null;
	tenantId: string;
	updatedAt: Date;
}

export type OfflineOutcome =
	| "accepted"
	| "duplicate"
	| "rejected"
	| "conflict"
	| "review_required";

export interface OfflineInventoryResult {
	movementId?: string;
	outcome: OfflineOutcome;
}

export interface InventoryCommandReceipt {
	createdAt: Date;
	idempotencyKey: string;
	operation: InventoryCommandOperation;
	requestFingerprint: string;
	resourceId: string;
	result: unknown;
	sourceChannel: "api" | "offline";
	sourceCommandId: string | null;
	sourceSequence: number | null;
	tenantId: string;
}

export type InventoryCommandOperation =
	| "inventory.adjustment.create"
	| "inventory.adjustment.approve"
	| "inventory.adjustment.reverse"
	| "inventory.count.create"
	| "inventory.count.draft.save"
	| "inventory.count.submit"
	| "inventory.count.approve"
	| "inventory.transfer.create"
	| "inventory.transfer.dispatch"
	| "inventory.transfer.receive"
	| "inventory.reservation.create"
	| "inventory.reservation.release"
	| "inventory.offline.apply";

export interface InventoryPageRequest {
	cursor?: string;
	limit: number;
}
export interface InventoryPage<T> {
	items: T[];
	nextCursor: string | null;
}

export interface InventoryBalanceFilters {
	locationId?: string;
	productId?: string;
}

export interface InventoryAdjustmentFilters {
	locationId?: string;
	state?: InventoryAdjustmentRecord["state"];
}

export interface InventoryCountFilters {
	locationId?: string;
	state?: InventoryCountRecord["state"];
}

export interface InventoryTransferFilters {
	locationId?: string;
	state?: InventoryTransferRecord["state"];
}

export interface ApplyMovementResult {
	balance: InventoryBalanceRecord;
	movement: InventoryMovementRecord;
}

export interface InventoryRepository {
	/** Serialize one command identity for the enclosing transaction. */
	acquireCommandLock: (
		tenantId: string,
		operation: InventoryCommandOperation,
		idempotencyKey: string
	) => Promise<void>;
	applyMovement: (
		movement: InventoryMovementRecord
	) => Promise<ApplyMovementResult | "negative_stock">;
	createAdjustment: (
		record: InventoryAdjustmentRecord
	) => Promise<InventoryAdjustmentRecord>;
	createCount: (record: InventoryCountRecord) => Promise<InventoryCountRecord>;
	createReservation: (
		record: InventoryReservationRecord
	) => Promise<InventoryReservationRecord>;
	createTransfer: (
		record: InventoryTransferRecord
	) => Promise<InventoryTransferRecord>;
	/** WS3 remediation R2, Finding B: `organizationId` is REQUIRED (not
	 * optional) — filtered in the SQL `WHERE` clause itself, mirroring
	 * `@meridian/domain-pos`'s `PosRepository` fix for the same class of
	 * defect. A row that exists but belongs to a different organization in
	 * the same tenant is indistinguishable from a nonexistent one: both
	 * return `null`, and callers reject with the SAME governed
	 * `InventoryError("not_found", ...)` denial (non-disclosing). */
	getAdjustment: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<InventoryAdjustmentRecord | null>;
	getBalance: (
		tenantId: string,
		locationId: string,
		itemKey: string,
		unit: string
	) => Promise<InventoryBalanceRecord | null>;
	getCommandReceipt: (
		tenantId: string,
		operation: InventoryCommandOperation,
		idempotencyKey: string
	) => Promise<InventoryCommandReceipt | null>;
	getCount: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<InventoryCountRecord | null>;
	getTransfer: (
		tenantId: string,
		organizationId: string,
		id: string
	) => Promise<InventoryTransferRecord | null>;
	/** WS3 remediation R2 cycle 2, Finding B (list surface): `organizationId`
	 * is REQUIRED (not optional) and filtered in the SQL `WHERE` clause
	 * itself, mirroring the `get*` fix immediately above. Without it, any
	 * actor holding the read permission in their OWN organization could omit
	 * `filters.locationId` (or supply another organization's `locationId`)
	 * and receive every organization's rows in the same tenant. */
	listAdjustments: (
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: InventoryAdjustmentFilters
	) => Promise<InventoryPage<InventoryAdjustmentRecord>>;
	listBalances: (
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: InventoryBalanceFilters
	) => Promise<InventoryPage<InventoryBalanceRecord>>;
	listCounts: (
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: InventoryCountFilters
	) => Promise<InventoryPage<InventoryCountRecord>>;
	listTransfers: (
		tenantId: string,
		organizationId: string,
		page: InventoryPageRequest,
		filters?: InventoryTransferFilters
	) => Promise<InventoryPage<InventoryTransferRecord>>;
	rebuildBalances: (tenantId: string, rebuiltAt: Date) => Promise<number>;
	recordCommandReceipt: (
		receipt: InventoryCommandReceipt
	) => Promise<{ inserted: boolean; record: InventoryCommandReceipt }>;
	releaseReservation: (input: {
		id: string;
		organizationId: string;
		reason: string;
		releasedAt: Date;
		state: "Expired" | "Released";
		tenantId: string;
		version: number;
	}) => Promise<InventoryReservationRecord | "version_conflict">;
	reservedQuantity: (
		tenantId: string,
		locationId: string,
		itemKey: string,
		unit: string,
		at: Date
	) => Promise<DecimalQuantity>;
	updateAdjustment: (
		record: InventoryAdjustmentRecord,
		expectedVersion: number
	) => Promise<InventoryAdjustmentRecord | "version_conflict">;
	updateCount: (
		record: InventoryCountRecord,
		expectedVersion: number
	) => Promise<InventoryCountRecord | "version_conflict">;
	updateTransfer: (
		record: InventoryTransferRecord,
		expectedVersion: number
	) => Promise<InventoryTransferRecord | "version_conflict">;
}

export type PendingInventoryEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;
export interface InventoryEventAppendPort {
	append: (event: PendingInventoryEvent) => Promise<"inserted" | "duplicate">;
}
export interface InventoryTransactionScope {
	events: InventoryEventAppendPort;
	repository: InventoryRepository;
}
export interface InventoryUnitOfWork {
	execute: <T>(
		operation: (scope: InventoryTransactionScope) => Promise<T>
	) => Promise<T>;
}

export interface InventoryIdFactory {
	create: (
		kind:
			| "adjustment"
			| "count"
			| "count-line"
			| "event"
			| "movement"
			| "receipt"
			| "reservation"
			| "transfer"
			| "transfer-line"
	) => string;
}

export interface InventoryReferencePort {
	requireLocation: (input: {
		organizationId: string;
		locationId: string;
		tenantId: string;
	}) => Promise<void>;
	requireProduct: (input: {
		productId: string;
		tenantId: string;
		variantId?: string | null;
	}) => Promise<void>;
}

export class InventoryError extends Error {
	readonly code:
		| "approval_separation"
		| "idempotency_conflict"
		| "invalid_quantity"
		| "invalid_reference"
		| "invalid_state"
		| "negative_stock"
		| "not_found"
		| "offline_conflict"
		| "version_conflict";
	constructor(code: InventoryError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "InventoryError";
	}
}

function itemKey(productId: string, variantId?: string | null): string {
	return variantId ? `${productId}:${variantId}` : productId;
}

/**
 * WS3 remediation R4B, item 2 (idempotency replay scope, lead-session
 * finding, NOT part of the original A-L directive). Every
 * `requestFingerprint` computed below MUST include `tenantId`,
 * `organizationId`, and (for a location-scoped command) `locationId` — not
 * only the command's own business fields. `replay()` below runs BEFORE the
 * org/location-scoped aggregate lookup, keyed only by `(tenantId,
 * operation, idempotencyKey)`. See the matching comment above
 * `packages/domains/pos/src/index.ts`'s own `fingerprint()` for the full
 * disposition — the same class of gap, fixed the same way, in this
 * package's command set.
 */
async function fingerprint(value: unknown): Promise<string> {
	const digest = await crypto.subtle.digest(
		"SHA-256",
		new TextEncoder().encode(JSON.stringify(value))
	);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function adjustmentView(
	record: InventoryAdjustmentRecord
): InventoryAdjustment {
	return {
		approvedByUserId: record.approvedByUserId,
		conversionSourceId: record.conversionSourceId ?? null,
		createdAt: record.createdAt.toISOString(),
		createdByUserId: record.createdByUserId,
		id: record.id,
		locationId: record.locationId,
		movementId: record.movementId ?? null,
		postedAt: record.postedAt?.toISOString() ?? null,
		productId: record.productId,
		quantity: record.quantity,
		reason: record.reason,
		reversalMovementId: record.reversalMovementId ?? null,
		state: record.state,
		unit: record.unit,
		updatedAt: record.updatedAt.toISOString(),
		variantId: record.variantId ?? null,
		version: record.version,
	};
}

function countView(record: InventoryCountRecord): StockCount {
	return {
		approvedByUserId: record.approvedByUserId,
		blind: record.blind,
		createdAt: record.createdAt.toISOString(),
		createdByUserId: record.createdByUserId,
		id: record.id,
		lines: record.lines.map((line) => ({
			conversionSourceId: line.conversionSourceId,
			expectedQuantity: line.expectedQuantity,
			id: line.id,
			movementId: line.movementId,
			observedQuantity: line.observedQuantity,
			productId: line.productId,
			unit: line.unit,
			varianceQuantity: line.varianceQuantity,
			variantId: line.variantId,
		})),
		locationId: record.locationId,
		postedAt: record.postedAt?.toISOString() ?? null,
		state: record.state,
		submittedByUserId: record.submittedByUserId,
		updatedAt: record.updatedAt.toISOString(),
		version: record.version,
	};
}

function transferView(record: InventoryTransferRecord): StockTransfer {
	return {
		createdAt: record.createdAt.toISOString(),
		createdByUserId: record.createdByUserId,
		destinationLocationId: record.destinationLocationId,
		dispatchedAt: record.dispatchedAt?.toISOString() ?? null,
		dispatchedByUserId: record.dispatchedByUserId,
		exceptionReason: record.exceptionReason,
		id: record.id,
		lines: record.lines.map((line) => ({
			conversionSourceId: line.conversionSourceId,
			dispatchedQuantity: line.dispatchedQuantity,
			exceptionQuantity: line.exceptionQuantity,
			id: line.id,
			productId: line.productId,
			receivedQuantity: line.receivedQuantity,
			remainingQuantity: subtractQuantities(
				subtractQuantities(line.dispatchedQuantity, line.receivedQuantity),
				line.exceptionQuantity
			),
			requestedQuantity: line.requestedQuantity,
			unit: line.unit,
			variantId: line.variantId,
		})),
		receivedAt: record.receivedAt?.toISOString() ?? null,
		receivedByUserId: record.receivedByUserId,
		sourceLocationId: record.sourceLocationId,
		state: record.state,
		updatedAt: record.updatedAt.toISOString(),
		version: record.version,
	};
}

function event(input: {
	actorUserId: string;
	aggregateId: string;
	correlationId: string;
	data: Record<string, unknown>;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	tenantId: string;
}): PendingInventoryEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: "inventory.stock-ledger",
		classification: "Confidential",
		correlationId: input.correlationId,
		data: input.data,
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "inventory",
		purpose: "tenant-inventory-operations",
		retentionClass: "inventory-operational-event",
		schemaRef: `schemas/events/${input.name}.schema.json`,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

async function replay<T>(
	repository: InventoryRepository,
	input: {
		idempotencyKey: string;
		operation: InventoryCommandOperation;
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
		throw new InventoryError(
			"idempotency_conflict",
			"Idempotency key is bound to another Inventory command"
		);
	}
	return receipt.result as T;
}

async function recordResult<T>(
	repository: InventoryRepository,
	input: {
		idempotencyKey: string;
		operation: InventoryCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		sourceChannel?: "api" | "offline";
		sourceCommandId?: string | null;
		sourceSequence?: number | null;
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
		sourceChannel: input.sourceChannel ?? "api",
		sourceCommandId: input.sourceCommandId ?? null,
		sourceSequence: input.sourceSequence ?? null,
		tenantId: input.tenantId,
	});
	if (claim.record.requestFingerprint !== input.requestFingerprint) {
		throw new InventoryError(
			"idempotency_conflict",
			"Idempotency key is bound to another Inventory command"
		);
	}
	if (!claim.inserted) {
		throw new Error(
			"Inventory command identity was claimed after command side effects began"
		);
	}
	return claim.record.result as T;
}

function requireVersion(record: { version: number }, expected: number): void {
	if (record.version !== expected) {
		throw new InventoryError(
			"version_conflict",
			"Inventory aggregate version is stale"
		);
	}
}

export interface InventoryServiceOptions {
	clock: () => Date;
	ids: InventoryIdFactory;
	references: InventoryReferencePort;
	unitOfWork: InventoryUnitOfWork;
}

export function createInventoryService(options: InventoryServiceOptions) {
	const movement = (input: {
		actorUserId: string;
		causationId?: string | null;
		conversionSourceId?: string | null;
		correlationId: string;
		locationId: string;
		movementType: InventoryMovementType;
		organizationId: string;
		productId: string;
		quantity: string;
		reversalOfMovementId?: string | null;
		sourceId: string;
		sourceType: InventoryMovementRecord["sourceType"];
		tenantId: string;
		unit: string;
		variantId?: string | null;
	}): InventoryMovementRecord => ({
		actorUserId: input.actorUserId,
		causationId: input.causationId ?? null,
		classification: "Confidential",
		conversionSourceId: input.conversionSourceId ?? null,
		correlationId: input.correlationId,
		createdAt: options.clock(),
		decisionId: null,
		id: options.ids.create("movement"),
		itemKey: itemKey(input.productId, input.variantId),
		locationId: input.locationId,
		movementType: input.movementType,
		occurredAt: options.clock(),
		organizationId: input.organizationId,
		productId: input.productId,
		quantity: input.quantity,
		reversalOfMovementId: input.reversalOfMovementId ?? null,
		sourceId: input.sourceId,
		sourceType: input.sourceType,
		tenantId: input.tenantId,
		unit: input.unit,
		variantId: input.variantId ?? null,
	});

	return {
		async applyOfflineMovement(input: {
			actorUserId: string;
			correlationId: string;
			expectedNextSequence: number;
			facts: VerifiedOfflineLeaseFacts;
			locationId: string;
			organizationId: string;
			productId: string;
			quantity: DecimalQuantity;
			tenantId: string;
			unit: string;
			variantId?: string | null;
		}): Promise<OfflineInventoryResult> {
			const now = options.clock();
			const outcome = evaluateOfflineCommand({
				at: now,
				expectedNextSequence: input.expectedNextSequence,
				facts: input.facts,
				tenantId: input.tenantId,
			});
			if (outcome !== "accepted") {
				return { outcome };
			}
			quantityToMinor(input.quantity);
			await Promise.all([
				options.references.requireLocation({
					locationId: input.locationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireProduct({
					productId: input.productId,
					tenantId: input.tenantId,
					variantId: input.variantId,
				}),
			]);
			const requestFingerprint = await fingerprint({
				facts: input.facts,
				locationId: input.locationId,
				organizationId: input.organizationId,
				productId: input.productId,
				quantity: input.quantity,
				tenantId: input.tenantId,
				unit: input.unit,
				variantId: input.variantId ?? null,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				await repository.acquireCommandLock(
					input.tenantId,
					"inventory.offline.apply",
					input.facts.commandId
				);
				const prior = await repository.getCommandReceipt(
					input.tenantId,
					"inventory.offline.apply",
					input.facts.commandId
				);
				if (prior) {
					if (prior.requestFingerprint !== requestFingerprint) {
						throw new InventoryError(
							"idempotency_conflict",
							"Offline command identity is bound to different content"
						);
					}
					return {
						...(prior.result as OfflineInventoryResult),
						outcome: "duplicate",
					};
				}
				const posted = movement({
					actorUserId: input.actorUserId,
					correlationId: input.correlationId,
					locationId: input.locationId,
					movementType: "Offline",
					organizationId: input.organizationId,
					productId: input.productId,
					quantity: input.quantity,
					sourceId: input.facts.commandId,
					sourceType: "OfflineCommand",
					tenantId: input.tenantId,
					unit: input.unit,
					variantId: input.variantId,
				});
				const applied = await repository.applyMovement(posted);
				const result: OfflineInventoryResult =
					applied === "negative_stock"
						? { outcome: "rejected" }
						: { movementId: posted.id, outcome: "accepted" };
				return recordResult(
					repository,
					{
						idempotencyKey: input.facts.commandId,
						operation: "inventory.offline.apply",
						requestFingerprint,
						resourceId: posted.id,
						sourceChannel: "offline",
						sourceCommandId: input.facts.commandId,
						sourceSequence: input.facts.sequence,
						tenantId: input.tenantId,
					},
					result,
					now
				);
			});
		},
		async approveAdjustment(input: {
			actorUserId: string;
			adjustmentId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			version: number;
		}): Promise<InventoryAdjustment> {
			const requestFingerprint = await fingerprint({
				adjustmentId: input.adjustmentId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<InventoryAdjustment>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.adjustment.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getAdjustment(
					input.tenantId,
					input.organizationId,
					input.adjustmentId
				);
				if (!current) {
					throw new InventoryError("not_found", "Adjustment was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "PendingApproval") {
					throw new InventoryError(
						"invalid_state",
						"Only pending Adjustments can be approved"
					);
				}
				if (current.createdByUserId === input.actorUserId) {
					throw new InventoryError(
						"approval_separation",
						"Adjustment creator cannot approve the same Adjustment"
					);
				}
				const now = options.clock();
				const postedMovement = movement({
					actorUserId: input.actorUserId,
					conversionSourceId: current.conversionSourceId,
					correlationId: input.correlationId,
					locationId: current.locationId,
					movementType: "Adjustment",
					organizationId: current.organizationId,
					productId: current.productId,
					quantity: current.quantity,
					sourceId: current.id,
					sourceType: "Adjustment",
					tenantId: current.tenantId,
					unit: current.unit,
					variantId: current.variantId,
				});
				const applied = await repository.applyMovement(postedMovement);
				if (applied === "negative_stock") {
					throw new InventoryError(
						"negative_stock",
						"Adjustment would make stock negative"
					);
				}
				const updated: InventoryAdjustmentRecord = {
					...current,
					approvedByUserId: input.actorUserId,
					movementId: postedMovement.id,
					postedAt: now,
					state: "Posted",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateAdjustment(
					updated,
					current.version
				);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Adjustment version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: current.id,
						correlationId: input.correlationId,
						data: {
							adjustmentId: current.id,
							approvalId: input.idempotencyKey,
							conversionSourceId: current.conversionSourceId,
							ledgerEntryId: postedMovement.id,
							locationId: current.locationId,
							lotId: null,
							productId: current.productId,
							quantity: current.quantity,
							reason: current.reason,
							serialId: null,
							sourceOperationId: input.idempotencyKey,
							unit: current.unit,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock.adjusted.v1",
						now,
						organizationId: current.organizationId,
						tenantId: current.tenantId,
					})
				);
				const result = adjustmentView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.adjustment.approve",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},

		async approveCount(input: {
			actorUserId: string;
			correlationId: string;
			countId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			version: number;
		}): Promise<StockCount> {
			const requestFingerprint = await fingerprint({
				countId: input.countId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				version: input.version,
			});
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: count posting deliberately keeps validation, balance derivation, movement creation, and aggregate transition in one atomic command.
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<StockCount>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.count.approve",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getCount(
					input.tenantId,
					input.organizationId,
					input.countId
				);
				if (!current) {
					throw new InventoryError("not_found", "Stock Count was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Submitted") {
					throw new InventoryError(
						"invalid_state",
						"Only submitted Stock Counts can be approved"
					);
				}
				if (
					current.createdByUserId === input.actorUserId ||
					current.submittedByUserId === input.actorUserId
				) {
					throw new InventoryError(
						"approval_separation",
						"Stock Count creator or submitter cannot approve it"
					);
				}
				const now = options.clock();
				const movementIds: string[] = [];
				const lines: InventoryCountLineRecord[] = [];
				for (const line of current.lines) {
					// biome-ignore lint/performance/noAwaitInLoops: each count line is applied in deterministic order inside the transaction.
					const balance = await repository.getBalance(
						current.tenantId,
						current.locationId,
						line.itemKey,
						line.unit
					);
					const expected = balance?.onHand ?? "0";
					const variance = subtractQuantities(line.observedQuantity, expected);
					let movementId: string | null = null;
					if (quantityToMinor(variance) !== 0n) {
						const posted = movement({
							actorUserId: input.actorUserId,
							conversionSourceId: line.conversionSourceId,
							correlationId: input.correlationId,
							locationId: current.locationId,
							movementType: "CountVariance",
							organizationId: current.organizationId,
							productId: line.productId,
							quantity: variance,
							sourceId: current.id,
							sourceType: "Count",
							tenantId: current.tenantId,
							unit: line.unit,
							variantId: line.variantId,
						});
						const applied = await repository.applyMovement(posted);
						if (applied === "negative_stock") {
							throw new InventoryError(
								"negative_stock",
								"Count observation cannot produce negative stock"
							);
						}
						movementId = posted.id;
						movementIds.push(posted.id);
					}
					lines.push({
						...line,
						expectedQuantity: expected,
						movementId,
						updatedAt: now,
						varianceQuantity: variance,
					});
				}
				const updated: InventoryCountRecord = {
					...current,
					approvedByUserId: input.actorUserId,
					lines,
					postedAt: now,
					state: "Posted",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateCount(updated, current.version);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Stock Count version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: current.id,
						correlationId: input.correlationId,
						data: {
							countId: current.id,
							locationId: current.locationId,
							movementIds,
							varianceLineCount: movementIds.length,
							version: saved.version,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock-count.posted.v1",
						now,
						organizationId: current.organizationId,
						tenantId: current.tenantId,
					})
				);
				const result = countView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.count.approve",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},

		async createAdjustment(input: {
			actorUserId: string;
			body: CreateInventoryAdjustment;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<InventoryAdjustment> {
			quantityToMinor(input.body.quantity);
			await Promise.all([
				options.references.requireLocation({
					locationId: input.body.locationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireProduct({
					productId: input.body.productId,
					tenantId: input.tenantId,
					variantId: input.body.variantId,
				}),
			]);
			const requestFingerprint = await fingerprint({
				body: input.body,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<InventoryAdjustment>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.adjustment.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const id = options.ids.create("adjustment");
				const record: InventoryAdjustmentRecord = {
					approvedByUserId: null,
					classification: "Confidential",
					conversionSourceId: input.body.conversionSourceId ?? null,
					createdAt: now,
					createdByUserId: input.actorUserId,
					id,
					locationId: input.body.locationId,
					movementId: null,
					organizationId: input.organizationId,
					postedAt: null,
					productId: input.body.productId,
					quantity: input.body.quantity,
					reason: input.body.reason,
					reversalMovementId: null,
					state: "PendingApproval",
					tenantId: input.tenantId,
					unit: input.body.unit,
					updatedAt: now,
					variantId: input.body.variantId ?? null,
					version: 1,
				};
				const result = adjustmentView(
					await repository.createAdjustment(record)
				);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.adjustment.create",
						requestFingerprint,
						resourceId: id,
						tenantId: input.tenantId,
					},
					result,
					now
				);
			});
		},

		async createCount(input: {
			actorUserId: string;
			body: CreateStockCount;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<StockCount> {
			await options.references.requireLocation({
				locationId: input.body.locationId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
			});
			const requestFingerprint = await fingerprint({
				body: input.body,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<StockCount>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.count.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const id = options.ids.create("count");
				const record: InventoryCountRecord = {
					approvedByUserId: null,
					blind: input.body.blind,
					classification: "Confidential",
					createdAt: now,
					createdByUserId: input.actorUserId,
					id,
					lines: [],
					locationId: input.body.locationId,
					organizationId: input.organizationId,
					postedAt: null,
					state: "Draft",
					submittedByUserId: null,
					tenantId: input.tenantId,
					updatedAt: now,
					version: 1,
				};
				const result = countView(await repository.createCount(record));
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.count.create",
						requestFingerprint,
						resourceId: id,
						tenantId: input.tenantId,
					},
					result,
					now
				);
			});
		},
		async createReservation(input: {
			actorUserId: string;
			correlationId: string;
			expiresAt: Date;
			idempotencyKey: string;
			locationId: string;
			organizationId: string;
			productId: string;
			quantity: DecimalQuantity;
			sourceId?: string;
			tenantId: string;
			unit: string;
			variantId?: string | null;
		}): Promise<InventoryReservationRecord> {
			requirePositive(input.quantity);
			await Promise.all([
				options.references.requireLocation({
					locationId: input.locationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireProduct({
					productId: input.productId,
					tenantId: input.tenantId,
					variantId: input.variantId,
				}),
			]);
			const requestFingerprint = await fingerprint(input);
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<InventoryReservationRecord>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.reservation.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				if (input.expiresAt <= now) {
					throw new InventoryError(
						"invalid_state",
						"Reservation expiry must be in the future"
					);
				}
				const id = options.ids.create("reservation");
				const record: InventoryReservationRecord = {
					classification: "Confidential",
					createdAt: now,
					createdByUserId: input.actorUserId,
					expiresAt: input.expiresAt,
					id,
					itemKey: itemKey(input.productId, input.variantId),
					locationId: input.locationId,
					organizationId: input.organizationId,
					productId: input.productId,
					quantity: input.quantity,
					reason: null,
					releasedAt: null,
					sourceId: input.sourceId ?? null,
					state: "Active",
					tenantId: input.tenantId,
					unit: input.unit,
					updatedAt: now,
					variantId: input.variantId ?? null,
					version: 1,
				};
				const saved = await repository.createReservation(record);
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: id,
						correlationId: input.correlationId,
						data: {
							expiresAt: input.expiresAt.toISOString(),
							locationId: input.locationId,
							productId: input.productId,
							quantity: input.quantity,
							reservationId: id,
							unit: input.unit,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.reservation.created.v1",
						now,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					})
				);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.reservation.create",
						requestFingerprint,
						resourceId: id,
						tenantId: input.tenantId,
					},
					saved,
					now
				);
			});
		},

		async createTransfer(input: {
			actorUserId: string;
			body: CreateStockTransfer;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<StockTransfer> {
			await Promise.all([
				options.references.requireLocation({
					locationId: input.body.sourceLocationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireLocation({
					locationId: input.body.destinationLocationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				...input.body.lines.map((line) =>
					options.references.requireProduct({
						productId: line.productId,
						tenantId: input.tenantId,
						variantId: line.variantId,
					})
				),
			]);
			for (const line of input.body.lines) {
				requirePositive(line.quantity);
			}
			const requestFingerprint = await fingerprint({
				body: input.body,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<StockTransfer>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.transfer.create",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const now = options.clock();
				const id = options.ids.create("transfer");
				const seen = new Set<string>();
				const lines = input.body.lines.map((line) => {
					const key = `${itemKey(line.productId, line.variantId)}:${line.unit}`;
					if (seen.has(key)) {
						throw new InventoryError(
							"invalid_reference",
							"Transfer contains a duplicate item and unit"
						);
					}
					seen.add(key);
					return {
						classification: "Confidential" as const,
						conversionSourceId: line.conversionSourceId ?? null,
						createdAt: now,
						dispatchedQuantity: "0",
						exceptionQuantity: "0",
						id: options.ids.create("transfer-line"),
						itemKey: itemKey(line.productId, line.variantId),
						productId: line.productId,
						receivedQuantity: "0",
						requestedQuantity: line.quantity,
						sourceMovementId: null,
						tenantId: input.tenantId,
						transferId: id,
						unit: line.unit,
						updatedAt: now,
						variantId: line.variantId ?? null,
					};
				});
				const record: InventoryTransferRecord = {
					classification: "Confidential",
					createdAt: now,
					createdByUserId: input.actorUserId,
					destinationLocationId: input.body.destinationLocationId,
					dispatchedAt: null,
					dispatchedByUserId: null,
					exceptionReason: null,
					id,
					lines,
					organizationId: input.organizationId,
					receivedAt: null,
					receivedByUserId: null,
					sourceLocationId: input.body.sourceLocationId,
					state: "Draft",
					tenantId: input.tenantId,
					updatedAt: now,
					version: 1,
				};
				const saved = await repository.createTransfer(record);
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: id,
						correlationId: input.correlationId,
						data: {
							destinationLocationId: record.destinationLocationId,
							lineCount: record.lines.length,
							sourceLocationId: record.sourceLocationId,
							transferId: id,
							version: 1,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock-transfer.created.v1",
						now,
						organizationId: input.organizationId,
						tenantId: input.tenantId,
					})
				);
				const result = transferView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.transfer.create",
						requestFingerprint,
						resourceId: id,
						tenantId: input.tenantId,
					},
					result,
					now
				);
			});
		},

		async dispatchTransfer(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			transferId: string;
			version: number;
		}): Promise<StockTransfer> {
			const requestFingerprint = await fingerprint({
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				transferId: input.transferId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<StockTransfer>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.transfer.dispatch",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getTransfer(
					input.tenantId,
					input.organizationId,
					input.transferId
				);
				if (!current) {
					throw new InventoryError("not_found", "Transfer was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Draft") {
					throw new InventoryError(
						"invalid_state",
						"Only Draft Transfers can be dispatched"
					);
				}
				const now = options.clock();
				const movementIds: string[] = [];
				const lines: InventoryTransferLineRecord[] = [];
				for (const line of current.lines) {
					const out = movement({
						actorUserId: input.actorUserId,
						conversionSourceId: line.conversionSourceId,
						correlationId: input.correlationId,
						locationId: current.sourceLocationId,
						movementType: "TransferOut",
						organizationId: current.organizationId,
						productId: line.productId,
						quantity: negateQuantity(line.requestedQuantity),
						sourceId: current.id,
						sourceType: "Transfer",
						tenantId: current.tenantId,
						unit: line.unit,
						variantId: line.variantId,
					});
					// biome-ignore lint/performance/noAwaitInLoops: balance keys are locked and mutated in deterministic transfer-line order.
					const applied = await repository.applyMovement(out);
					if (applied === "negative_stock") {
						throw new InventoryError(
							"negative_stock",
							"Transfer dispatch would make source stock negative"
						);
					}
					movementIds.push(out.id);
					lines.push({
						...line,
						dispatchedQuantity: line.requestedQuantity,
						sourceMovementId: out.id,
						updatedAt: now,
					});
				}
				const updated: InventoryTransferRecord = {
					...current,
					dispatchedAt: now,
					dispatchedByUserId: input.actorUserId,
					lines,
					state: "Dispatched",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateTransfer(updated, current.version);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Transfer version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: current.id,
						correlationId: input.correlationId,
						data: {
							destinationLocationId: current.destinationLocationId,
							movementIds,
							sourceLocationId: current.sourceLocationId,
							transferId: current.id,
							version: saved.version,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock-transfer.dispatched.v1",
						now,
						organizationId: current.organizationId,
						tenantId: current.tenantId,
					})
				);
				const result = transferView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.transfer.dispatch",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},

		async getAdjustment(
			tenantId: string,
			organizationId: string,
			id: string
		): Promise<InventoryAdjustment> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getAdjustment(tenantId, organizationId, id)
			);
			if (!record) {
				throw new InventoryError("not_found", "Adjustment was not found");
			}
			return adjustmentView(record);
		},
		async getCount(
			tenantId: string,
			organizationId: string,
			id: string
		): Promise<StockCount> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getCount(tenantId, organizationId, id)
			);
			if (!record) {
				throw new InventoryError("not_found", "Stock Count was not found");
			}
			return countView(record);
		},
		async getTransfer(
			tenantId: string,
			organizationId: string,
			id: string
		): Promise<StockTransfer> {
			const record = await options.unitOfWork.execute(({ repository }) =>
				repository.getTransfer(tenantId, organizationId, id)
			);
			if (!record) {
				throw new InventoryError("not_found", "Transfer was not found");
			}
			return transferView(record);
		},
		async listAdjustments(input: {
			filters?: InventoryAdjustmentFilters;
			organizationId: string;
			page: InventoryPageRequest;
			tenantId: string;
		}): Promise<InventoryPage<InventoryAdjustment>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listAdjustments(
					input.tenantId,
					input.organizationId,
					input.page,
					input.filters
				)
			);
			return {
				items: result.items.map(adjustmentView),
				nextCursor: result.nextCursor,
			};
		},
		listBalances(input: {
			filters?: InventoryBalanceFilters;
			organizationId: string;
			tenantId: string;
			page: InventoryPageRequest;
		}): Promise<InventoryPage<StockBalance>> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const page = await repository.listBalances(
					input.tenantId,
					input.organizationId,
					input.page,
					input.filters
				);
				const now = options.clock();
				const items: StockBalance[] = [];
				for (const balance of page.items) {
					// biome-ignore lint/performance/noAwaitInLoops: one transaction client cannot safely execute concurrent PostgreSQL queries.
					const reserved = await repository.reservedQuantity(
						balance.tenantId,
						balance.locationId,
						balance.itemKey,
						balance.unit,
						now
					);
					items.push({
						asOf: balance.asOf.toISOString(),
						available: subtractQuantities(balance.onHand, reserved),
						locationId: balance.locationId,
						onHand: balance.onHand,
						productId: balance.productId,
						reconciled: balance.reconciliationState === "Current",
						reconciliationState: balance.reconciliationState,
						reserved,
						source: "InventoryLedgerProjection",
						unit: balance.unit,
						variantId: balance.variantId,
					});
				}
				return {
					items,
					nextCursor: page.nextCursor,
				};
			});
		},
		async listCounts(input: {
			filters?: InventoryCountFilters;
			organizationId: string;
			page: InventoryPageRequest;
			tenantId: string;
		}): Promise<InventoryPage<StockCount>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listCounts(
					input.tenantId,
					input.organizationId,
					input.page,
					input.filters
				)
			);
			return {
				items: result.items.map(countView),
				nextCursor: result.nextCursor,
			};
		},
		async listTransfers(input: {
			filters?: InventoryTransferFilters;
			organizationId: string;
			page: InventoryPageRequest;
			tenantId: string;
		}): Promise<InventoryPage<StockTransfer>> {
			const result = await options.unitOfWork.execute(({ repository }) =>
				repository.listTransfers(
					input.tenantId,
					input.organizationId,
					input.page,
					input.filters
				)
			);
			return {
				items: result.items.map(transferView),
				nextCursor: result.nextCursor,
			};
		},

		rebuildBalances(tenantId: string): Promise<number> {
			return options.unitOfWork.execute(({ repository }) =>
				repository.rebuildBalances(tenantId, options.clock())
			);
		},
		async receiveTransfer(input: {
			actorUserId: string;
			body: ReceiveStockTransfer;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			transferId: string;
			version: number;
		}): Promise<StockTransfer> {
			const requestFingerprint = await fingerprint({
				body: input.body,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				transferId: input.transferId,
				version: input.version,
			});
			// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: receipt reconciliation is one atomic invariant across validation, movements, cumulative quantities, and terminal state.
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<StockTransfer>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.transfer.receive",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getTransfer(
					input.tenantId,
					input.organizationId,
					input.transferId
				);
				if (!current) {
					throw new InventoryError("not_found", "Transfer was not found");
				}
				requireVersion(current, input.version);
				if (!["Dispatched", "PartiallyReceived"].includes(current.state)) {
					throw new InventoryError(
						"invalid_state",
						"Transfer is not awaiting receipt"
					);
				}
				const now = options.clock();
				const updates = new Map(
					input.body.lines.map((line) => [line.lineId, line.receivedQuantity])
				);
				if (updates.size !== input.body.lines.length) {
					throw new InventoryError(
						"invalid_reference",
						"Receipt contains duplicate Transfer lines"
					);
				}
				const movementIds: string[] = [];
				const lines: InventoryTransferLineRecord[] = [];
				for (const line of current.lines) {
					const received = updates.get(line.id);
					if (!received) {
						lines.push(line);
						continue;
					}
					requirePositive(received);
					const remaining = subtractQuantities(
						line.dispatchedQuantity,
						addQuantities(line.receivedQuantity, line.exceptionQuantity)
					);
					if (quantityToMinor(received) > quantityToMinor(remaining)) {
						throw new InventoryError(
							"invalid_quantity",
							"Receipt exceeds the dispatched remainder"
						);
					}
					const inbound = movement({
						actorUserId: input.actorUserId,
						conversionSourceId: line.conversionSourceId,
						correlationId: input.correlationId,
						locationId: current.destinationLocationId,
						movementType: "TransferIn",
						organizationId: current.organizationId,
						productId: line.productId,
						quantity: received,
						sourceId: current.id,
						sourceType: "Transfer",
						tenantId: current.tenantId,
						unit: line.unit,
						variantId: line.variantId,
					});
					// biome-ignore lint/performance/noAwaitInLoops: destination balances are locked and applied in stable transfer-line order.
					const applied = await repository.applyMovement(inbound);
					if (applied === "negative_stock") {
						throw new Error(
							"Positive transfer receipt cannot make stock negative"
						);
					}
					movementIds.push(inbound.id);
					lines.push({
						...line,
						receivedQuantity: addQuantities(line.receivedQuantity, received),
						updatedAt: now,
					});
				}
				if (
					updates.size !== input.body.lines.length ||
					input.body.lines.some(
						(candidate) =>
							!current.lines.some((line) => line.id === candidate.lineId)
					)
				) {
					throw new InventoryError(
						"invalid_reference",
						"Receipt references a line outside the Transfer"
					);
				}
				let hasRemaining = lines.some(
					(line) =>
						quantityToMinor(
							subtractQuantities(
								line.dispatchedQuantity,
								addQuantities(line.receivedQuantity, line.exceptionQuantity)
							)
						) > 0n
				);
				let finalLines = lines;
				let state: InventoryTransferRecord["state"];
				if (input.body.outcome === "Exception") {
					finalLines = lines.map((line) => ({
						...line,
						exceptionQuantity: addQuantities(
							line.exceptionQuantity,
							subtractQuantities(
								line.dispatchedQuantity,
								addQuantities(line.receivedQuantity, line.exceptionQuantity)
							)
						),
						updatedAt: now,
					}));
					state = "Exception";
					hasRemaining = false;
				} else {
					state = hasRemaining ? "PartiallyReceived" : "Received";
				}
				const updated: InventoryTransferRecord = {
					...current,
					exceptionReason: input.body.exceptionReason ?? null,
					lines: finalLines,
					receivedAt: hasRemaining ? null : now,
					receivedByUserId: input.actorUserId,
					state,
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateTransfer(updated, current.version);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Transfer version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: current.id,
						correlationId: input.correlationId,
						data: {
							destinationLocationId: current.destinationLocationId,
							movementIds,
							receiptId: options.ids.create("receipt"),
							state,
							transferId: current.id,
							version: saved.version,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock-transfer.received.v1",
						now,
						organizationId: current.organizationId,
						tenantId: current.tenantId,
					})
				);
				const result = transferView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.transfer.receive",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},
		/**
		 * WS3 PR3's compensating stock effect (frozen control plan §6.3, "Read
		 * first" — "via the same Inventory contract path PR2 chose"). Mirrors
		 * `recordSaleMovement` exactly, except the posted quantity is
		 * POSITIVE (stock comes back in) and the movement is typed
		 * `Reversal` with a mandatory `reversalOfMovementId` pointing at the
		 * ORIGINAL `Sale` movement it compensates — required by this table's
		 * own `inventory_stock_movement_reversal_check` CHECK constraint
		 * (`movementType = 'Reversal'` requires a non-null
		 * `reversalOfMovementId`; see `@meridian/persistence-inventory-postgres`'s
		 * schema). `sourceType` stays `"Sale"` (no dedicated "Return" source
		 * type is registered on this table, and none is invented — the
		 * compensating fact is still "about" the original Sale). Like
		 * `recordSaleMovement`, this runs INSIDE the caller's own
		 * transaction and does not use Inventory's own idempotency wrapper:
		 * POS's `return.approve` already claims idempotency once for the
		 * whole Return before this runs.
		 */
		async recordReturnMovement(input: {
			actorUserId: string;
			correlationId: string;
			locationId: string;
			organizationId: string;
			productId: string;
			quantity: DecimalQuantity;
			returnId: string;
			reversalOfMovementId: string;
			tenantId: string;
			unit: string;
			variantId?: string | null;
		}): Promise<InventoryMovementRecord> {
			requirePositive(input.quantity);
			await Promise.all([
				options.references.requireLocation({
					locationId: input.locationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireProduct({
					productId: input.productId,
					tenantId: input.tenantId,
					variantId: input.variantId,
				}),
			]);
			const posted = movement({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				locationId: input.locationId,
				movementType: "Reversal",
				organizationId: input.organizationId,
				productId: input.productId,
				quantity: input.quantity,
				reversalOfMovementId: input.reversalOfMovementId,
				sourceId: input.returnId,
				sourceType: "Sale",
				tenantId: input.tenantId,
				unit: input.unit,
				variantId: input.variantId,
			});
			const applied = await options.unitOfWork.execute(({ repository }) =>
				repository.applyMovement(posted)
			);
			if (applied === "negative_stock") {
				// Unreachable in practice — the posted quantity is always
				// positive, and `applyMovement` only ever returns
				// `"negative_stock"` on the negative-quantity branch. Guarded
				// explicitly rather than asserted away, so a future change to
				// `applyMovement`'s balance semantics fails loudly here
				// instead of silently returning a malformed
				// `InventoryMovementRecord`.
				throw new InventoryError(
					"invalid_state",
					"Return movement unexpectedly reported negative stock"
				);
			}
			return applied.movement;
		},
		/**
		 * WS3 PR2's mandated synchronous stock effect (frozen control plan §6.3,
		 * "Read first"): a completed cash sale posts an immediate,
		 * single-actor `Sale` movement decrementing on-hand stock, run inside
		 * the SAME transaction as the sale commit, receipt numbering, and
		 * outbox write. This is deliberately NOT the `Adjustment`
		 * maker/checker pair (creator cannot approve their own Adjustment —
		 * wrong fit for a single cashier completing one sale) and NOT
		 * `applyOfflineMovement` (WS5 lease-facts only). It also does not run
		 * Inventory's own idempotency wrapper (`replay`/`recordResult`): the
		 * caller (POS `sale.complete`) already claims idempotency once for
		 * the whole sale before this runs, inside the same transaction, so a
		 * retried or concurrently-raced command rolls back the entire
		 * transaction (including this movement) rather than needing a second
		 * command-receipt here. No dedicated Inventory event is registered
		 * for a sale movement (`registry/events.json` has no
		 * `inventory.stock-movement.sale.*` entry); the movement ledger row
		 * itself is the durable record, and `commerce.sale.completed.v1` is
		 * the outbox fact downstream consumers observe.
		 */
		async recordSaleMovement(input: {
			actorUserId: string;
			correlationId: string;
			locationId: string;
			organizationId: string;
			productId: string;
			quantity: DecimalQuantity;
			saleId: string;
			tenantId: string;
			unit: string;
			variantId?: string | null;
		}): Promise<InventoryMovementRecord | "negative_stock"> {
			requirePositive(input.quantity);
			await Promise.all([
				options.references.requireLocation({
					locationId: input.locationId,
					organizationId: input.organizationId,
					tenantId: input.tenantId,
				}),
				options.references.requireProduct({
					productId: input.productId,
					tenantId: input.tenantId,
					variantId: input.variantId,
				}),
			]);
			const posted = movement({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				locationId: input.locationId,
				movementType: "Sale",
				organizationId: input.organizationId,
				productId: input.productId,
				quantity: negateQuantity(input.quantity),
				sourceId: input.saleId,
				sourceType: "Sale",
				tenantId: input.tenantId,
				unit: input.unit,
				variantId: input.variantId,
			});
			const applied = await options.unitOfWork.execute(({ repository }) =>
				repository.applyMovement(posted)
			);
			return applied === "negative_stock" ? applied : applied.movement;
		},
		async releaseReservation(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			reason: "Fulfilled" | "Cancelled" | "Expired" | "Superseded";
			reservation: InventoryReservationRecord;
		}): Promise<InventoryReservationRecord> {
			const requestFingerprint = await fingerprint({
				locationId: input.reservation.locationId,
				organizationId: input.reservation.organizationId,
				reason: input.reason,
				reservationId: input.reservation.id,
				tenantId: input.reservation.tenantId,
				version: input.reservation.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<InventoryReservationRecord>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.reservation.release",
					requestFingerprint,
					tenantId: input.reservation.tenantId,
				});
				if (prior) {
					return prior;
				}
				if (input.reservation.state !== "Active") {
					throw new InventoryError(
						"invalid_state",
						"Only active Reservations can be released"
					);
				}
				const now = options.clock();
				const expiryInstant =
					input.reservation.expiresAt instanceof Date
						? input.reservation.expiresAt.getTime()
						: Date.parse(String(input.reservation.expiresAt));
				if (
					input.reason === "Expired" &&
					(!Number.isFinite(expiryInstant) || expiryInstant > now.getTime())
				) {
					throw new InventoryError(
						"invalid_state",
						"Reservation cannot expire before its expiry instant"
					);
				}
				const saved = await repository.releaseReservation({
					id: input.reservation.id,
					organizationId: input.reservation.organizationId,
					reason: input.reason,
					releasedAt: now,
					state: input.reason === "Expired" ? "Expired" : "Released",
					tenantId: input.reservation.tenantId,
					version: input.reservation.version,
				});
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Reservation version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: saved.id,
						correlationId: input.correlationId,
						data: {
							reason: input.reason,
							releasedAt: now.toISOString(),
							reservationId: saved.id,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.reservation.released.v1",
						now,
						organizationId: saved.organizationId,
						tenantId: saved.tenantId,
					})
				);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.reservation.release",
						requestFingerprint,
						resourceId: saved.id,
						tenantId: saved.tenantId,
					},
					saved,
					now
				);
			});
		},

		async reverseAdjustment(input: {
			actorUserId: string;
			adjustmentId: string;
			body: TransitionReason;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			version: number;
		}): Promise<InventoryAdjustment> {
			const requestFingerprint = await fingerprint({
				adjustmentId: input.adjustmentId,
				body: input.body,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<InventoryAdjustment>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.adjustment.reverse",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getAdjustment(
					input.tenantId,
					input.organizationId,
					input.adjustmentId
				);
				if (!current) {
					throw new InventoryError("not_found", "Adjustment was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Posted" || !current.movementId) {
					throw new InventoryError(
						"invalid_state",
						"Only posted Adjustments can be reversed"
					);
				}
				const now = options.clock();
				const reversal = movement({
					actorUserId: input.actorUserId,
					causationId: current.movementId,
					conversionSourceId: current.conversionSourceId,
					correlationId: input.correlationId,
					locationId: current.locationId,
					movementType: "Reversal",
					organizationId: current.organizationId,
					productId: current.productId,
					quantity: negateQuantity(current.quantity),
					reversalOfMovementId: current.movementId,
					sourceId: current.id,
					sourceType: "Adjustment",
					tenantId: current.tenantId,
					unit: current.unit,
					variantId: current.variantId,
				});
				const applied = await repository.applyMovement(reversal);
				if (applied === "negative_stock") {
					throw new InventoryError(
						"negative_stock",
						"Reversal would make stock negative"
					);
				}
				const updated: InventoryAdjustmentRecord = {
					...current,
					reversalMovementId: reversal.id,
					state: "Reversed",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateAdjustment(
					updated,
					current.version
				);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Adjustment version is stale"
					);
				}
				await events.append(
					event({
						actorUserId: input.actorUserId,
						aggregateId: reversal.id,
						correlationId: input.correlationId,
						data: {
							locationId: current.locationId,
							originalMovementId: current.movementId,
							productId: current.productId,
							quantity: reversal.quantity,
							reason: input.body.reason,
							reversalMovementId: reversal.id,
							unit: current.unit,
						},
						eventId: options.ids.create("event"),
						idempotencyKey: input.idempotencyKey,
						name: "inventory.stock-movement.reversed.v1",
						now,
						organizationId: current.organizationId,
						tenantId: current.tenantId,
					})
				);
				const result = adjustmentView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.adjustment.reverse",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},

		async saveCountDraft(input: {
			actorUserId: string;
			body: SaveStockCountDraftLines;
			countId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			version: number;
		}): Promise<StockCount> {
			for (const line of input.body.lines) {
				quantityToMinor(line.observedQuantity);
				// biome-ignore lint/performance/noAwaitInLoops: published Catalog references are checked before the transaction begins.
				await options.references.requireProduct({
					productId: line.productId,
					tenantId: input.tenantId,
					variantId: line.variantId,
				});
			}
			const requestFingerprint = await fingerprint({
				body: input.body,
				countId: input.countId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<StockCount>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.count.draft.save",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getCount(
					input.tenantId,
					input.organizationId,
					input.countId
				);
				if (!current) {
					throw new InventoryError("not_found", "Stock Count was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Draft" && current.state !== "InProgress") {
					throw new InventoryError(
						"invalid_state",
						"Only an open Stock Count draft can be changed"
					);
				}
				const now = options.clock();
				const seen = new Set<string>();
				const lines = input.body.lines.map((line) => {
					const key = `${itemKey(line.productId, line.variantId)}:${line.unit}`;
					if (seen.has(key)) {
						throw new InventoryError(
							"invalid_reference",
							"Stock Count contains a duplicate item and unit"
						);
					}
					seen.add(key);
					return {
						classification: "Confidential" as const,
						conversionSourceId: line.conversionSourceId ?? null,
						countId: current.id,
						createdAt: now,
						expectedQuantity: null,
						id: options.ids.create("count-line"),
						itemKey: itemKey(line.productId, line.variantId),
						movementId: null,
						observedQuantity: line.observedQuantity,
						productId: line.productId,
						tenantId: current.tenantId,
						unit: line.unit,
						updatedAt: now,
						varianceQuantity: null,
						variantId: line.variantId ?? null,
					};
				});
				const updated: InventoryCountRecord = {
					...current,
					lines,
					state: lines.length > 0 ? "InProgress" : "Draft",
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateCount(updated, current.version);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Stock Count version is stale"
					);
				}
				const result = countView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.count.draft.save",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},

		async submitCount(input: {
			actorUserId: string;
			body: SubmitStockCount;
			countId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
			version: number;
		}): Promise<StockCount> {
			for (const line of input.body.lines) {
				quantityToMinor(line.observedQuantity);
				// biome-ignore lint/performance/noAwaitInLoops: published Catalog references are checked before the transaction begins.
				await options.references.requireProduct({
					productId: line.productId,
					tenantId: input.tenantId,
					variantId: line.variantId,
				});
			}
			const requestFingerprint = await fingerprint({
				body: input.body,
				countId: input.countId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
				version: input.version,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<StockCount>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation: "inventory.count.submit",
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const current = await repository.getCount(
					input.tenantId,
					input.organizationId,
					input.countId
				);
				if (!current) {
					throw new InventoryError("not_found", "Stock Count was not found");
				}
				requireVersion(current, input.version);
				if (current.state !== "Draft" && current.state !== "InProgress") {
					throw new InventoryError(
						"invalid_state",
						"Only an open Stock Count can be submitted"
					);
				}
				const now = options.clock();
				const seen = new Set<string>();
				const lines = input.body.lines.map((line) => {
					const key = `${itemKey(line.productId, line.variantId)}:${line.unit}`;
					if (seen.has(key)) {
						throw new InventoryError(
							"invalid_reference",
							"Stock Count contains a duplicate item and unit"
						);
					}
					seen.add(key);
					return {
						classification: "Confidential" as const,
						conversionSourceId: line.conversionSourceId ?? null,
						countId: current.id,
						createdAt: now,
						expectedQuantity: null,
						id: options.ids.create("count-line"),
						itemKey: itemKey(line.productId, line.variantId),
						movementId: null,
						observedQuantity: line.observedQuantity,
						productId: line.productId,
						tenantId: current.tenantId,
						unit: line.unit,
						updatedAt: now,
						varianceQuantity: null,
						variantId: line.variantId ?? null,
					};
				});
				const updated: InventoryCountRecord = {
					...current,
					lines,
					state: "Submitted",
					submittedByUserId: input.actorUserId,
					updatedAt: now,
					version: current.version + 1,
				};
				const saved = await repository.updateCount(updated, current.version);
				if (saved === "version_conflict") {
					throw new InventoryError(
						"version_conflict",
						"Stock Count version is stale"
					);
				}
				const result = countView(saved);
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation: "inventory.count.submit",
						requestFingerprint,
						resourceId: current.id,
						tenantId: current.tenantId,
					},
					result,
					now
				);
			});
		},
	};
}

export interface VerifiedOfflineLeaseFacts {
	commandId: string;
	expiresAt: Date;
	sequence: number;
	startsAt: Date;
	tenantId: string;
	verified: true;
}
export function evaluateOfflineCommand(input: {
	at: Date;
	expectedNextSequence: number;
	facts: VerifiedOfflineLeaseFacts;
	tenantId: string;
}): OfflineOutcome {
	if (input.facts.tenantId !== input.tenantId) {
		return "rejected";
	}
	if (input.at < input.facts.startsAt || input.at > input.facts.expiresAt) {
		return "review_required";
	}
	if (input.facts.sequence < input.expectedNextSequence) {
		return "duplicate";
	}
	if (input.facts.sequence > input.expectedNextSequence) {
		return "conflict";
	}
	return "accepted";
}

export interface InventoryActiveContextPort {
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}
export type InventoryPermission =
	| "inventory.balance.read"
	| "inventory.adjustment.read"
	| "inventory.adjustment.create"
	| "inventory.adjustment.approve"
	| "inventory.adjustment.reverse"
	| "inventory.count.read"
	| "inventory.count.create"
	| "inventory.count.submit"
	| "inventory.count.approve"
	| "inventory.reservation.create"
	| "inventory.reservation.release"
	| "inventory.transfer.read"
	| "inventory.transfer.create"
	| "inventory.transfer.dispatch"
	| "inventory.transfer.receive";
export interface InventoryPermissionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: InventoryPermission;
		sessionId: string;
	}) => Promise<unknown>;
}
export interface InventoryEntitlementPort {
	requireEntitlement: (input: {
		access: "Read" | "Write";
		capabilityId:
			| "inventory.stock-balances"
			| "inventory.adjustments"
			| "inventory.counts"
			| "inventory.reservations"
			| "inventory.transfers";
		organizationId: string;
		tenantId: string;
	}) => Promise<unknown>;
}

export function createInventoryApplication(options: {
	activeContexts: InventoryActiveContextPort;
	entitlements: InventoryEntitlementPort;
	permissions: InventoryPermissionPort;
	service: ReturnType<typeof createInventoryService>;
}) {
	async function authorize(input: {
		access: "Read" | "Write";
		assuranceLevel?: string;
		authUserId: string;
		capabilityId: Parameters<
			InventoryEntitlementPort["requireEntitlement"]
		>[0]["capabilityId"];
		contextId: string;
		permission: InventoryPermission;
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
			access: input.access,
			capabilityId: input.capabilityId,
			organizationId: context.organizationId,
			tenantId: context.tenantId,
		});
		return context;
	}
	return {
		async approveAdjustment(input: {
			actorUserId: string;
			adjustmentId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.adjustments",
				contextId: input.contextId,
				permission: "inventory.adjustment.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveAdjustment({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async approveCount(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			countId: string;
			idempotencyKey: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.approve",
				sessionId: input.sessionId,
			});
			return options.service.approveCount({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async createAdjustment(input: {
			actorUserId: string;
			body: CreateInventoryAdjustment;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.adjustments",
				contextId: input.contextId,
				permission: "inventory.adjustment.create",
				sessionId: input.sessionId,
			});
			return options.service.createAdjustment({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async createCount(input: {
			actorUserId: string;
			body: CreateStockCount;
			contextId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.create",
				sessionId: input.sessionId,
			});
			return options.service.createCount({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async createReservation(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			expiresAt: Date;
			idempotencyKey: string;
			locationId: string;
			productId: string;
			quantity: DecimalQuantity;
			sessionId: string;
			sourceId?: string;
			unit: string;
			variantId?: string | null;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.reservations",
				contextId: input.contextId,
				permission: "inventory.reservation.create",
				sessionId: input.sessionId,
			});
			return options.service.createReservation({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async createTransfer(input: {
			actorUserId: string;
			body: CreateStockTransfer;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.transfers",
				contextId: input.contextId,
				permission: "inventory.transfer.create",
				sessionId: input.sessionId,
			});
			return options.service.createTransfer({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async dispatchTransfer(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
			transferId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.transfers",
				contextId: input.contextId,
				permission: "inventory.transfer.dispatch",
				sessionId: input.sessionId,
			});
			return options.service.dispatchTransfer({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async getAdjustment(input: {
			authUserId: string;
			adjustmentId: string;
			contextId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.adjustments",
				contextId: input.contextId,
				permission: "inventory.adjustment.read",
				sessionId: input.sessionId,
			});
			return options.service.getAdjustment(
				context.tenantId,
				context.organizationId,
				input.adjustmentId
			);
		},
		async getCount(input: {
			authUserId: string;
			contextId: string;
			countId: string;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.read",
				sessionId: input.sessionId,
			});
			return options.service.getCount(
				context.tenantId,
				context.organizationId,
				input.countId
			);
		},
		async getTransfer(input: {
			authUserId: string;
			contextId: string;
			sessionId: string;
			transferId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.transfers",
				contextId: input.contextId,
				permission: "inventory.transfer.read",
				sessionId: input.sessionId,
			});
			return options.service.getTransfer(
				context.tenantId,
				context.organizationId,
				input.transferId
			);
		},
		async listAdjustments(input: {
			authUserId: string;
			contextId: string;
			filters?: InventoryAdjustmentFilters;
			page: InventoryPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.adjustments",
				contextId: input.contextId,
				permission: "inventory.adjustment.read",
				sessionId: input.sessionId,
			});
			return options.service.listAdjustments({
				filters: input.filters,
				organizationId: context.organizationId,
				page: input.page,
				tenantId: context.tenantId,
			});
		},
		async listBalances(input: {
			authUserId: string;
			contextId: string;
			filters?: InventoryBalanceFilters;
			page: InventoryPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.stock-balances",
				contextId: input.contextId,
				permission: "inventory.balance.read",
				sessionId: input.sessionId,
			});
			return options.service.listBalances({
				filters: input.filters,
				organizationId: context.organizationId,
				page: input.page,
				tenantId: context.tenantId,
			});
		},
		async listCounts(input: {
			authUserId: string;
			contextId: string;
			filters?: InventoryCountFilters;
			page: InventoryPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.read",
				sessionId: input.sessionId,
			});
			return options.service.listCounts({
				filters: input.filters,
				organizationId: context.organizationId,
				page: input.page,
				tenantId: context.tenantId,
			});
		},
		async listTransfers(input: {
			authUserId: string;
			contextId: string;
			filters?: InventoryTransferFilters;
			page: InventoryPageRequest;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Read",
				authUserId: input.authUserId,
				capabilityId: "inventory.transfers",
				contextId: input.contextId,
				permission: "inventory.transfer.read",
				sessionId: input.sessionId,
			});
			return options.service.listTransfers({
				filters: input.filters,
				organizationId: context.organizationId,
				page: input.page,
				tenantId: context.tenantId,
			});
		},
		async receiveTransfer(input: {
			actorUserId: string;
			body: ReceiveStockTransfer;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
			transferId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.transfers",
				contextId: input.contextId,
				permission: "inventory.transfer.receive",
				sessionId: input.sessionId,
			});
			return options.service.receiveTransfer({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async releaseReservation(input: {
			actorUserId: string;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			reason: "Fulfilled" | "Cancelled" | "Expired" | "Superseded";
			reservation: InventoryReservationRecord;
			sessionId: string;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.reservations",
				contextId: input.contextId,
				permission: "inventory.reservation.release",
				sessionId: input.sessionId,
			});
			if (
				input.reservation.tenantId !== context.tenantId ||
				input.reservation.organizationId !== context.organizationId
			) {
				throw new InventoryError("not_found", "Reservation was not found");
			}
			return options.service.releaseReservation(input);
		},
		async reverseAdjustment(input: {
			actorUserId: string;
			adjustmentId: string;
			body: TransitionReason;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.adjustments",
				contextId: input.contextId,
				permission: "inventory.adjustment.reverse",
				sessionId: input.sessionId,
			});
			return options.service.reverseAdjustment({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async saveCountDraft(input: {
			actorUserId: string;
			body: SaveStockCountDraftLines;
			contextId: string;
			countId: string;
			idempotencyKey: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.create",
				sessionId: input.sessionId,
			});
			return options.service.saveCountDraft({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
		async submitCount(input: {
			actorUserId: string;
			body: SubmitStockCount;
			contextId: string;
			countId: string;
			idempotencyKey: string;
			sessionId: string;
			version: number;
		}) {
			const context = await authorize({
				access: "Write",
				authUserId: input.actorUserId,
				capabilityId: "inventory.counts",
				contextId: input.contextId,
				permission: "inventory.count.submit",
				sessionId: input.sessionId,
			});
			return options.service.submitCount({
				...input,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			});
		},
	};
}

/** Runtime-neutral owner marker retained for architecture discovery. */
export interface InventoryPersistencePort {
	readonly owner: "inventory";
}
