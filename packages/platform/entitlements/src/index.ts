import {
	CAPABILITY_IDS,
	type CapabilityId,
} from "@meridian/contracts-capabilities";
import type { EventEnvelope } from "@meridian/contracts-events";
import type { PermissionId } from "@meridian/contracts-permissions";
import type {
	AuthorizationDecision,
	Entitlement,
} from "@meridian/contracts-platform-api";

export type EntitlementState =
	| "Pending"
	| "Trial"
	| "Active"
	| "Grace"
	| "Suspended"
	| "Expired"
	| "Revoked"
	| "Archived";

export type EntitlementSource =
	| "PlatformSubscription"
	| "ManualGrant"
	| "Trial"
	| "Migration"
	| "AddOn"
	| "Contract"
	| "PartnerPolicy";

export interface EntitlementRecord {
	capabilityId: CapabilityId;
	dependencies: CapabilityId[];
	endsAt?: Date;
	exclusions: CapabilityId[];
	id: string;
	limits: Record<string, number>;
	organizationId?: string;
	source: EntitlementSource;
	startsAt: Date;
	state: EntitlementState;
	tenantId: string;
	version: number;
}

export interface EntitlementChangeRecord {
	actorId: string;
	changedFields: string[];
	entitlementId: string;
	entitlementVersion: number;
	id: string;
	newState: EntitlementState;
	occurredAt: Date;
	previousState?: EntitlementState;
	reason: string;
	snapshot: EntitlementRecord;
	tenantId: string;
}

export interface EntitlementCommandReceipt {
	idempotencyKey: string;
	operation: "entitlement.change";
	requestFingerprint: string;
	resourceId: string;
	result: Record<string, unknown>;
	tenantId: string;
}

export interface EntitlementPageRequest {
	cursor?: string;
	limit: number;
}

export interface EntitlementPage {
	items: EntitlementRecord[];
	nextCursor: string | null;
}

export interface EntitlementRepository {
	completeCommandReceipt: (
		record: EntitlementCommandReceipt
	) => Promise<EntitlementCommandReceipt>;
	getByScope: (input: {
		capabilityId: CapabilityId;
		organizationId?: string;
		tenantId: string;
	}) => Promise<EntitlementRecord | null>;
	getCommandReceipt: (input: {
		idempotencyKey: string;
		operation: EntitlementCommandReceipt["operation"];
		tenantId: string;
	}) => Promise<EntitlementCommandReceipt | null>;
	list: (
		tenantId: string,
		page: EntitlementPageRequest
	) => Promise<EntitlementPage>;
	listCurrent: (input: {
		organizationId?: string;
		tenantId: string;
	}) => Promise<EntitlementRecord[]>;
	recordChange: (record: EntitlementChangeRecord) => Promise<void>;
	recordCommandReceipt: (
		record: EntitlementCommandReceipt
	) => Promise<{ inserted: boolean; record: EntitlementCommandReceipt }>;
	save: (
		record: EntitlementRecord,
		expectedVersion: number | null
	) => Promise<EntitlementRecord | "version_conflict">;
}

export type PendingEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;

export interface EntitlementTransactionScope {
	events: {
		append: (event: PendingEvent) => Promise<"inserted" | "duplicate">;
	};
	repository: EntitlementRepository;
}

export interface EntitlementUnitOfWork {
	execute: <TResult>(
		operation: (scope: EntitlementTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export interface EntitlementIdFactory {
	create: (kind: "change" | "entitlement" | "event") => string;
}

export class EntitlementError extends Error {
	readonly code:
		| "authorization_denied"
		| "entitlement_denied"
		| "idempotency_conflict"
		| "invalid_entitlement"
		| "version_conflict";

	constructor(code: EntitlementError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "EntitlementError";
	}
}

const canonicalCapabilities = new Set<string>(CAPABILITY_IDS);

export function isCapabilityId(value: string): value is CapabilityId {
	return canonicalCapabilities.has(value);
}

export type EntitlementDenyReason =
	| "not_entitled"
	| "inactive"
	| "not_started"
	| "expired"
	| "dependency_missing"
	| "excluded"
	| "limit_reached";

export type EntitlementDecision =
	| {
			capabilityId: CapabilityId;
			entitlementId: string;
			limits: Record<string, number>;
			outcome: "allow" | "allow_read_only";
	  }
	| {
			capabilityId: CapabilityId;
			outcome: "deny";
			reason: EntitlementDenyReason;
	  };

export interface EntitlementRequest {
	access: "Read" | "Write";
	capabilityId: CapabilityId;
	organizationId?: string;
	projectedUsage?: Record<string, number>;
	tenantId: string;
}

export interface EntitlementStateProvider {
	load: (input: {
		organizationId?: string;
		tenantId: string;
	}) => Promise<EntitlementRecord[]>;
}

function effectiveRecord(
	records: readonly EntitlementRecord[],
	capabilityId: CapabilityId,
	organizationId?: string
): EntitlementRecord | undefined {
	const exact = organizationId
		? records.find(
				(record) =>
					record.capabilityId === capabilityId &&
					record.organizationId === organizationId
			)
		: undefined;
	return (
		exact ??
		records.find(
			(record) => record.capabilityId === capabilityId && !record.organizationId
		)
	);
}

function accessStatus(record: EntitlementRecord, now: Date) {
	if (record.startsAt > now) {
		return "not_started" as const;
	}
	if (record.endsAt && record.endsAt <= now) {
		return "expired" as const;
	}
	if (record.state === "Trial" || record.state === "Active") {
		return "allow" as const;
	}
	if (record.state === "Grace") {
		return "read_only" as const;
	}
	if (record.state === "Expired") {
		return "expired" as const;
	}
	return "inactive" as const;
}

function capabilityAvailable(
	records: readonly EntitlementRecord[],
	capabilityId: CapabilityId,
	organizationId: string | undefined,
	access: EntitlementRequest["access"],
	now: Date,
	visiting: Set<CapabilityId>
): boolean {
	if (visiting.has(capabilityId)) {
		return false;
	}
	const record = effectiveRecord(records, capabilityId, organizationId);
	const status = record ? accessStatus(record, now) : "inactive";
	if (
		!record ||
		status === "inactive" ||
		status === "not_started" ||
		status === "expired" ||
		(status === "read_only" && access === "Write")
	) {
		return false;
	}
	visiting.add(capabilityId);
	const available = record.dependencies.every((dependency) =>
		capabilityAvailable(
			records,
			dependency,
			organizationId,
			access,
			now,
			visiting
		)
	);
	visiting.delete(capabilityId);
	return available;
}

export function createEntitlementEvaluator(options: {
	clock: () => Date;
	state: EntitlementStateProvider;
}) {
	return {
		async decide(input: EntitlementRequest): Promise<EntitlementDecision> {
			const records = await options.state.load({
				...(input.organizationId
					? { organizationId: input.organizationId }
					: {}),
				tenantId: input.tenantId,
			});
			const record = effectiveRecord(
				records,
				input.capabilityId,
				input.organizationId
			);
			if (!record) {
				return {
					capabilityId: input.capabilityId,
					outcome: "deny",
					reason: "not_entitled",
				};
			}
			const now = options.clock();
			const status = accessStatus(record, now);
			if (status !== "allow" && status !== "read_only") {
				return {
					capabilityId: input.capabilityId,
					outcome: "deny",
					reason: status,
				};
			}
			const excluded = record.exclusions.some((exclusion) =>
				capabilityAvailable(
					records,
					exclusion,
					input.organizationId,
					"Read",
					now,
					new Set()
				)
			);
			if (excluded) {
				return {
					capabilityId: input.capabilityId,
					outcome: "deny",
					reason: "excluded",
				};
			}
			const missingDependency = record.dependencies.some(
				(dependency) =>
					!capabilityAvailable(
						records,
						dependency,
						input.organizationId,
						input.access,
						now,
						new Set([record.capabilityId])
					)
			);
			if (missingDependency) {
				return {
					capabilityId: input.capabilityId,
					outcome: "deny",
					reason: "dependency_missing",
				};
			}
			const exceeded = Object.entries(input.projectedUsage ?? {}).some(
				([meter, usage]) =>
					record.limits[meter] !== undefined && usage > record.limits[meter]
			);
			if (exceeded) {
				return {
					capabilityId: input.capabilityId,
					outcome: "deny",
					reason: "limit_reached",
				};
			}
			return {
				capabilityId: input.capabilityId,
				entitlementId: record.id,
				limits: record.limits,
				outcome:
					status === "read_only" && input.access === "Write"
						? "allow_read_only"
						: "allow",
			};
		},
		async requireEntitlement(input: EntitlementRequest) {
			const decision = await this.decide(input);
			if (
				decision.outcome === "deny" ||
				(decision.outcome === "allow_read_only" && input.access === "Write")
			) {
				throw new EntitlementError(
					"entitlement_denied",
					"The requested capability is not currently available"
				);
			}
			return decision;
		},
	};
}

export interface ChangeEntitlementInput {
	actorId: string;
	capabilityId: CapabilityId;
	correlationId: string;
	dependencies?: CapabilityId[];
	endsAt?: Date;
	exclusions?: CapabilityId[];
	idempotencyKey: string;
	limits?: Record<string, number>;
	organizationId?: string;
	reason: string;
	source: EntitlementSource;
	startsAt: Date;
	state: EntitlementState;
	tenantId: string;
	version?: number;
}

function validateChange(input: ChangeEntitlementInput): void {
	if (!isCapabilityId(input.capabilityId)) {
		throw new EntitlementError(
			"invalid_entitlement",
			"Unknown capability identifier"
		);
	}
	for (const capability of [
		...(input.dependencies ?? []),
		...(input.exclusions ?? []),
	]) {
		if (!isCapabilityId(capability)) {
			throw new EntitlementError(
				"invalid_entitlement",
				"Unknown dependency or exclusion capability"
			);
		}
	}
	if (input.endsAt && input.endsAt <= input.startsAt) {
		throw new EntitlementError(
			"invalid_entitlement",
			"Entitlement expiry must be after its start"
		);
	}
	if (
		input.source === "ManualGrant" &&
		!(input.endsAt && input.reason.trim())
	) {
		throw new EntitlementError(
			"invalid_entitlement",
			"Manual grants require a reason and expiry"
		);
	}
	if (
		Object.values(input.limits ?? {}).some(
			(value) => !Number.isInteger(value) || value < 0
		)
	) {
		throw new EntitlementError(
			"invalid_entitlement",
			"Hard limits must be non-negative integers"
		);
	}
}

function changeFingerprint(input: ChangeEntitlementInput): string {
	return JSON.stringify({
		capabilityId: input.capabilityId,
		dependencies: [...(input.dependencies ?? [])].sort(),
		endsAt: input.endsAt?.toISOString() ?? null,
		exclusions: [...(input.exclusions ?? [])].sort(),
		limits: input.limits ?? {},
		organizationId: input.organizationId ?? null,
		reason: input.reason,
		source: input.source,
		startsAt: input.startsAt.toISOString(),
		state: input.state,
		version: input.version ?? null,
	});
}

function publicEntitlement(record: EntitlementRecord): Entitlement {
	return {
		capabilityId: record.capabilityId,
		dependencies: record.dependencies,
		endsAt: record.endsAt?.toISOString() ?? null,
		exclusions: record.exclusions,
		id: record.id,
		limits: record.limits,
		organizationId: record.organizationId ?? null,
		source: record.source,
		startsAt: record.startsAt.toISOString(),
		state: record.state,
		tenantId: record.tenantId,
		version: record.version,
	};
}

function replayReceipt(
	receipt: EntitlementCommandReceipt,
	fingerprint: string
): EntitlementRecord {
	if (receipt.requestFingerprint !== fingerprint) {
		throw new EntitlementError(
			"idempotency_conflict",
			"The idempotency key is bound to another entitlement change"
		);
	}
	const value = receipt.result as unknown as Entitlement;
	const { endsAt, organizationId, startsAt, ...persisted } = value;
	return {
		...persisted,
		capabilityId: value.capabilityId as CapabilityId,
		dependencies: value.dependencies as CapabilityId[],
		...(endsAt ? { endsAt: new Date(endsAt) } : {}),
		exclusions: value.exclusions as CapabilityId[],
		...(organizationId ? { organizationId } : {}),
		startsAt: new Date(startsAt),
	};
}

function changedRecordFields(
	existing: EntitlementRecord | null,
	next: EntitlementRecord
): string[] {
	if (!existing) {
		return ["created"];
	}
	const fields = [
		"state",
		"source",
		"startsAt",
		"endsAt",
		"limits",
		"dependencies",
		"exclusions",
	] as const;
	const changed = fields.filter((field) => {
		const previous = existing[field];
		const current = next[field];
		return JSON.stringify(previous) !== JSON.stringify(current);
	});
	return changed.length > 0 ? changed : ["reason"];
}

function validateExpectedVersion(
	existing: EntitlementRecord | null,
	input: ChangeEntitlementInput
): void {
	if (existing && input.version !== existing.version) {
		throw new EntitlementError(
			"version_conflict",
			"Entitlement version is stale"
		);
	}
	if (!existing && input.version !== undefined) {
		throw new EntitlementError(
			"version_conflict",
			"A new entitlement cannot declare an existing version"
		);
	}
}

function nextRecord(
	input: ChangeEntitlementInput,
	existing: EntitlementRecord | null,
	ids: EntitlementIdFactory
): EntitlementRecord {
	const id = existing === null ? ids.create("entitlement") : existing.id;
	const version = existing === null ? 1 : existing.version + 1;
	return {
		capabilityId: input.capabilityId,
		dependencies: input.dependencies ?? [],
		...(input.endsAt ? { endsAt: input.endsAt } : {}),
		exclusions: input.exclusions ?? [],
		id,
		limits: input.limits ?? {},
		...(input.organizationId ? { organizationId: input.organizationId } : {}),
		source: input.source,
		startsAt: input.startsAt,
		state: input.state,
		tenantId: input.tenantId,
		version,
	};
}

function eventNameFor(
	existing: EntitlementRecord | null,
	saved: EntitlementRecord
): string {
	if (saved.state === "Expired") {
		return "platform.entitlement.expired.v1";
	}
	if (!existing && ["Trial", "Active", "Grace"].includes(saved.state)) {
		return "platform.entitlement.activated.v1";
	}
	return "platform.entitlement.changed.v1";
}

async function executeEntitlementChange(
	options: { clock: () => Date; ids: EntitlementIdFactory },
	input: ChangeEntitlementInput,
	fingerprint: string,
	scope: EntitlementTransactionScope
): Promise<EntitlementRecord> {
	const { events, repository } = scope;
	const priorReceipt = await repository.getCommandReceipt({
		idempotencyKey: input.idempotencyKey,
		operation: "entitlement.change",
		tenantId: input.tenantId,
	});
	if (priorReceipt) {
		return replayReceipt(priorReceipt, fingerprint);
	}
	const existing = await repository.getByScope({
		capabilityId: input.capabilityId,
		...(input.organizationId ? { organizationId: input.organizationId } : {}),
		tenantId: input.tenantId,
	});
	validateExpectedVersion(existing, input);
	const record = nextRecord(input, existing, options.ids);
	const claimed = await repository.recordCommandReceipt({
		idempotencyKey: input.idempotencyKey,
		operation: "entitlement.change",
		requestFingerprint: fingerprint,
		resourceId: record.id,
		result: { pending: true },
		tenantId: input.tenantId,
	});
	if (!claimed.inserted) {
		return replayReceipt(claimed.record, fingerprint);
	}
	const saved = await repository.save(record, existing?.version ?? null);
	if (saved === "version_conflict") {
		throw new EntitlementError(
			"version_conflict",
			"Entitlement changed concurrently"
		);
	}
	const changedFields = changedRecordFields(existing, saved);
	const now = options.clock();
	await repository.recordChange({
		actorId: input.actorId,
		changedFields,
		entitlementId: saved.id,
		entitlementVersion: saved.version,
		id: options.ids.create("change"),
		newState: saved.state,
		occurredAt: now,
		...(existing ? { previousState: existing.state } : {}),
		reason: input.reason,
		snapshot: saved,
		tenantId: saved.tenantId,
	});
	const eventName = eventNameFor(existing, saved);
	await events.append({
		actorId: input.actorId,
		aggregateId: saved.id,
		capabilityId: saved.capabilityId,
		classification: "Internal",
		correlationId: input.correlationId,
		data: {
			capabilityId: saved.capabilityId,
			...(eventName.endsWith("changed.v1") ? { changedFields } : {}),
			endsAt: saved.endsAt?.toISOString() ?? null,
			entitlementId: saved.id,
			organizationId: saved.organizationId ?? null,
			startsAt: saved.startsAt.toISOString(),
			state: saved.state,
			version: saved.version,
		},
		id: options.ids.create("event"),
		idempotencyKey: input.idempotencyKey,
		name: eventName,
		occurredAt: now.toISOString(),
		organizationId: saved.organizationId ?? null,
		producerNamespace: "platform",
		purpose: "runtime-capability-control",
		retentionClass: "platform-security-evidence",
		schemaRef: `schemas/events/${eventName}.schema.json`,
		schemaVersion: "1.0.0",
		sourceChannel: "internal-command",
		tenantId: saved.tenantId,
	});
	await repository.completeCommandReceipt({
		...claimed.record,
		result: publicEntitlement(saved) as unknown as Record<string, unknown>,
	});
	return saved;
}

export function createEntitlementService(options: {
	clock: () => Date;
	ids: EntitlementIdFactory;
	unitOfWork: EntitlementUnitOfWork;
}) {
	return {
		change(input: ChangeEntitlementInput): Promise<EntitlementRecord> {
			validateChange(input);
			const fingerprint = changeFingerprint(input);
			return options.unitOfWork.execute((scope) =>
				executeEntitlementChange(options, input, fingerprint, scope)
			);
		},
	};
}

export interface EntitlementActiveContextPort {
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}

export interface EntitlementPermissionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PermissionId;
		resourceScope?: { scopeId?: string; scopeType: "Tenant" | "Organization" };
		sessionId: string;
	}) => Promise<AuthorizationDecision>;
}

export function createEntitlementApplication(options: {
	activeContexts: EntitlementActiveContextPort;
	permissions: EntitlementPermissionPort;
	repository: EntitlementRepository;
}) {
	return {
		async list(input: {
			authUserId: string;
			contextId: string;
			page: EntitlementPageRequest;
			sessionId: string;
		}) {
			const context = await options.activeContexts.requireActiveContext(input);
			const decision = await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.entitlement.read",
				resourceScope: { scopeType: "Tenant" },
				sessionId: input.sessionId,
			});
			if (decision.outcome !== "allow") {
				throw new EntitlementError(
					"authorization_denied",
					"Permission to inspect entitlements was denied"
				);
			}
			const page = await options.repository.list(context.tenantId, input.page);
			return {
				items: page.items.map(publicEntitlement),
				nextCursor: page.nextCursor,
			};
		},
	};
}

export type EntitlementApplication = ReturnType<
	typeof createEntitlementApplication
>;
