import type { EventEnvelope } from "@meridian/contracts-events";
import type { AuditRecord } from "@meridian/contracts-platform-api";

export type AuditScope =
	| {
			locationId?: string | null;
			organizationId?: string | null;
			scopeType: "Tenant";
			tenantId: string;
	  }
	| {
			locationId?: null;
			organizationId?: null;
			scopeType: "Platform";
			tenantId?: null;
	  };

export interface AuditCommonInput {
	action: string;
	actorPartyId?: string | null;
	actorType:
		| "human"
		| "service"
		| "device"
		| "integration"
		| "automation"
		| "ai"
		| "support";
	actorUserId?: string | null;
	approvalId?: string | null;
	causationId?: string | null;
	changeSummary?: Record<string, unknown> | null;
	classification: "Internal" | "Confidential" | "Restricted";
	correlationId: string;
	delegationId?: string | null;
	legalHoldId?: string | null;
	metadata?: Record<string, unknown>;
	occurredAt: Date;
	originalActorId?: string | null;
	outcome: "success" | "denied" | "failure";
	privacyCaseId?: string | null;
	privacyTransformationVersion?: string | null;
	reasonCode?: string | null;
	retentionClass: string;
	retentionUntil?: Date | null;
	sourceChannel: string;
	sourceEventId?: string | null;
	targetId?: string | null;
	targetType: string;
}

export type AppendAuditInput = AuditCommonInput & AuditScope;

export type AuditStoredRecord = AuditCommonInput &
	AuditScope & {
		id: string;
		metadata: Record<string, unknown>;
		previousHash: string | null;
		recordedAt: Date;
		recordHash: string;
		scopeKey: string;
		sequence: number;
	};

export interface AuditPrivacyOverlay {
	id: string;
	occurredAt: Date;
	privacyCaseId: string;
	pseudonym: string;
	scopeKey: string;
	subjectDigest: string;
	subjectType: "AuthUser" | "Party" | "OriginalActor";
	transformationVersion: string;
}

export interface AuditQuery {
	action?: string;
	actorUserId?: string;
	occurredAfter?: Date;
	occurredBefore?: Date;
	tenantId: string;
}

export interface AuditRepository {
	addPrivacyOverlay: (overlay: AuditPrivacyOverlay) => Promise<void>;
	findBySourceEvent: (
		sourceEventId: string
	) => Promise<AuditStoredRecord | null>;
	getScopeHead: (scopeKey: string) => Promise<AuditStoredRecord | null>;
	insert: (record: AuditStoredRecord) => Promise<"inserted" | "duplicate">;
	listPrivacyOverlays: (scopeKey: string) => Promise<AuditPrivacyOverlay[]>;
	listScopeRecords: (scopeKey: string) => Promise<AuditStoredRecord[]>;
	listTenant: (query: AuditQuery) => Promise<AuditStoredRecord[]>;
	lockScope: (scopeKey: string) => Promise<void>;
}

export interface AuditUnitOfWork {
	execute: <TResult>(
		operation: (repository: AuditRepository) => Promise<TResult>
	) => Promise<TResult>;
}

export interface AuditHasher {
	digest: (value: string) => Promise<string>;
}

export interface AuditIdFactory {
	create: (kind: "record" | "privacy-overlay") => string;
}

const REDACTED = "[REDACTED]";
const PROHIBITED_KEY =
	/(authorization|cookie|password|secret|token|cvv|cvc|otp|recovery.?code|backup.?code|factor)/iu;
const SECRET_VALUE = /(bearer\s+[a-z0-9._~+/-]+=*|basic\s+[a-z0-9+/]+=*)/iu;
const OVERLAY_FIELDS = [
	["actorUserId", "AuthUser"],
	["actorPartyId", "Party"],
	["originalActorId", "OriginalActor"],
] as const;

function safeValue(value: unknown, depth = 0): unknown {
	if (depth > 8) {
		return "[TRUNCATED]";
	}
	if (
		value === null ||
		typeof value === "boolean" ||
		typeof value === "number"
	) {
		return value;
	}
	if (typeof value === "string") {
		return SECRET_VALUE.test(value) ? REDACTED : value.slice(0, 2000);
	}
	if (Array.isArray(value)) {
		return value.slice(0, 100).map((item) => safeValue(item, depth + 1));
	}
	if (typeof value === "object") {
		const result: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) {
			result[key] = PROHIBITED_KEY.test(key)
				? REDACTED
				: safeValue(child, depth + 1);
		}
		return result;
	}
	return String(value).slice(0, 2000);
}

export function redactAuditMap(
	value?: Record<string, unknown> | null
): Record<string, unknown> | null {
	return value ? (safeValue(value) as Record<string, unknown>) : null;
}

function stableValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(stableValue);
	}
	if (value && typeof value === "object") {
		return Object.fromEntries(
			Object.entries(value)
				.sort(([left], [right]) => left.localeCompare(right))
				.map(([key, child]) => [key, stableValue(child)])
		);
	}
	return value;
}

function stableSerialize(value: unknown): string {
	return JSON.stringify(stableValue(value));
}

function scopeKey(scope: AuditScope): string {
	return scope.scopeType === "Tenant" ? scope.tenantId : "platform";
}

function hashMaterial(record: Omit<AuditStoredRecord, "recordHash">) {
	return {
		...record,
		occurredAt: record.occurredAt.toISOString(),
		recordedAt: record.recordedAt.toISOString(),
		retentionUntil: record.retentionUntil?.toISOString() ?? null,
	};
}

function findSourceRecord(
	repository: AuditRepository,
	sourceEventId?: string | null
): Promise<AuditStoredRecord | null> {
	return sourceEventId
		? repository.findBySourceEvent(sourceEventId)
		: Promise.resolve(null);
}

function normalizedRecordFields(
	options: { clock: () => Date; ids: AuditIdFactory },
	input: AppendAuditInput,
	key: string,
	head: AuditStoredRecord | null
) {
	return {
		action: input.action,
		actorPartyId: input.actorPartyId ?? null,
		actorType: input.actorType,
		actorUserId: input.actorUserId ?? null,
		approvalId: input.approvalId ?? null,
		causationId: input.causationId ?? null,
		changeSummary: redactAuditMap(input.changeSummary),
		classification: input.classification,
		correlationId: input.correlationId,
		delegationId: input.delegationId ?? null,
		id: options.ids.create("record"),
		legalHoldId: input.legalHoldId ?? null,
		metadata: redactAuditMap(input.metadata) ?? {},
		occurredAt: input.occurredAt,
		originalActorId: input.originalActorId ?? null,
		outcome: input.outcome,
		previousHash: head?.recordHash ?? null,
		privacyCaseId: input.privacyCaseId ?? null,
		privacyTransformationVersion: input.privacyTransformationVersion ?? null,
		reasonCode: input.reasonCode ?? null,
		recordedAt: options.clock(),
		retentionClass: input.retentionClass,
		retentionUntil: input.retentionUntil ?? null,
		scopeKey: key,
		sequence: (head?.sequence ?? 0) + 1,
		sourceChannel: input.sourceChannel,
		sourceEventId: input.sourceEventId ?? null,
		targetId: input.targetId ?? null,
		targetType: input.targetType,
	};
}

async function appendWithRepository(
	options: {
		clock: () => Date;
		hasher: AuditHasher;
		ids: AuditIdFactory;
	},
	repository: AuditRepository,
	input: AppendAuditInput
): Promise<AuditStoredRecord> {
	const initialExisting = await findSourceRecord(
		repository,
		input.sourceEventId
	);
	if (initialExisting) {
		return initialExisting;
	}
	const key = scopeKey(input);
	await repository.lockScope(key);
	const lockedExisting = await findSourceRecord(
		repository,
		input.sourceEventId
	);
	if (lockedExisting) {
		return lockedExisting;
	}
	const head = await repository.getScopeHead(key);
	const normalizedCommon = normalizedRecordFields(options, input, key, head);
	const recordWithoutHash = (
		input.scopeType === "Tenant"
			? {
					...normalizedCommon,
					locationId: input.locationId ?? null,
					organizationId: input.organizationId ?? null,
					scopeType: "Tenant" as const,
					tenantId: input.tenantId,
				}
			: { ...normalizedCommon, scopeType: "Platform" as const }
	) as Omit<AuditStoredRecord, "recordHash">;
	const record = {
		...recordWithoutHash,
		recordHash: await options.hasher.digest(
			stableSerialize(hashMaterial(recordWithoutHash))
		),
	} as AuditStoredRecord;
	const inserted = await repository.insert(record);
	const duplicate =
		inserted === "duplicate"
			? await findSourceRecord(repository, input.sourceEventId)
			: null;
	if (duplicate) {
		return duplicate;
	}
	return record;
}

function publicRecord(record: AuditStoredRecord): AuditRecord {
	const common = {
		action: record.action,
		actorPartyId: record.actorPartyId ?? null,
		actorType: record.actorType,
		actorUserId: record.actorUserId ?? null,
		approvalId: record.approvalId ?? null,
		causationId: record.causationId ?? null,
		changeSummary: record.changeSummary ?? null,
		classification: record.classification,
		correlationId: record.correlationId,
		delegationId: record.delegationId ?? null,
		id: record.id,
		metadata: record.metadata ?? {},
		occurredAt: record.occurredAt.toISOString(),
		originalActorId: record.originalActorId ?? null,
		outcome: record.outcome,
		privacyCaseId: record.privacyCaseId ?? null,
		privacyTransformationVersion: record.privacyTransformationVersion ?? null,
		reasonCode: record.reasonCode ?? null,
		retentionClass: record.retentionClass,
		sourceChannel: record.sourceChannel,
		targetId: record.targetId ?? null,
		targetType: record.targetType,
	};
	return record.scopeType === "Tenant"
		? {
				...common,
				locationId: record.locationId ?? null,
				organizationId: record.organizationId ?? null,
				scopeType: "Tenant",
				tenantId: record.tenantId,
			}
		: {
				...common,
				locationId: null,
				organizationId: null,
				scopeType: "Platform",
				tenantId: null,
			};
}

function applyOverlays(
	hasher: AuditHasher,
	records: AuditStoredRecord[],
	overlays: AuditPrivacyOverlay[]
): Promise<AuditStoredRecord[]> {
	const byKey = new Map(
		overlays.map((overlay) => [
			`${overlay.subjectType}:${overlay.subjectDigest}`,
			overlay,
		])
	);
	return Promise.all(
		records.map(async (record) => {
			const next = { ...record };
			await Promise.all(
				OVERLAY_FIELDS.map(async ([field, subjectType]) => {
					const value = next[field];
					if (!value) {
						return;
					}
					const digest = await hasher.digest(`audit-subject:${value}`);
					const overlay = byKey.get(`${subjectType}:${digest}`);
					if (overlay) {
						next[field] = overlay.pseudonym;
						next.privacyCaseId = overlay.privacyCaseId;
						next.privacyTransformationVersion = overlay.transformationVersion;
					}
				})
			);
			return next;
		})
	);
}

function auditClassification(
	classification: EventEnvelope["classification"]
): AuditCommonInput["classification"] {
	if (classification === "Restricted") {
		return "Restricted";
	}
	return classification === "Confidential" ? "Confidential" : "Internal";
}

export function retentionDisposition(
	record: Pick<AuditStoredRecord, "legalHoldId" | "retentionUntil">,
	now: Date
): "legal_hold" | "retain" | "archive_review" {
	if (record.legalHoldId) {
		return "legal_hold";
	}
	return record.retentionUntil && record.retentionUntil > now
		? "retain"
		: "archive_review";
}

export function createAuditApplication(options: {
	clock: () => Date;
	hasher: AuditHasher;
	ids: AuditIdFactory;
	repository: AuditRepository;
	unitOfWork: AuditUnitOfWork;
}) {
	return {
		append: (input: AppendAuditInput) =>
			options.unitOfWork.execute((repository) =>
				appendWithRepository(options, repository, input)
			),

		applyPrivacyTransformation(input: {
			actorUserId: string;
			correlationId: string;
			privacyCaseId: string;
			scope: AuditScope;
			subjectId: string;
			subjectType: AuditPrivacyOverlay["subjectType"];
			transformationVersion: string;
		}) {
			return options.unitOfWork.execute(async (repository) => {
				const key = scopeKey(input.scope);
				const subjectDigest = await options.hasher.digest(
					`audit-subject:${input.subjectId}`
				);
				const overlay: AuditPrivacyOverlay = {
					id: options.ids.create("privacy-overlay"),
					occurredAt: options.clock(),
					privacyCaseId: input.privacyCaseId,
					pseudonym: `erased_${subjectDigest.slice(0, 24)}`,
					scopeKey: key,
					subjectDigest,
					subjectType: input.subjectType,
					transformationVersion: input.transformationVersion,
				};
				await appendWithRepository(options, repository, {
					...input.scope,
					action: "platform.audit-identity.privacy-transformed",
					actorType: "human",
					actorUserId: input.actorUserId,
					classification: "Restricted",
					correlationId: input.correlationId,
					metadata: { subjectType: input.subjectType },
					occurredAt: overlay.occurredAt,
					outcome: "success",
					privacyCaseId: input.privacyCaseId,
					privacyTransformationVersion: input.transformationVersion,
					retentionClass: "privacy-case-evidence",
					sourceChannel: "privacy-workflow",
					targetType: "AuditIdentityReference",
				});
				await repository.addPrivacyOverlay(overlay);
				return overlay;
			});
		},

		ingestEvent(event: EventEnvelope): Promise<AuditStoredRecord> {
			const scope: AuditScope =
				event.scopeType === "Tenant"
					? {
							locationId: event.locationId,
							organizationId: event.organizationId,
							scopeType: "Tenant",
							tenantId: event.tenantId,
						}
					: { scopeType: "Platform" };
			return options.unitOfWork.execute((repository) =>
				appendWithRepository(options, repository, {
					...scope,
					action: event.name,
					actorType: event.actorId ? "human" : "service",
					actorUserId: event.actorId,
					causationId: event.causationId,
					changeSummary: event.data,
					classification: auditClassification(event.classification),
					correlationId: event.correlationId ?? event.id,
					metadata: { eventName: event.name, schemaRef: event.schemaRef },
					occurredAt: new Date(event.occurredAt),
					outcome: "success",
					retentionClass: event.retentionClass,
					sourceChannel: event.sourceChannel ?? "event",
					sourceEventId: event.id,
					targetId: event.aggregateId,
					targetType: event.name.split(".")[1] ?? "event",
				})
			);
		},

		listTenant(input: {
			actorUserId: string;
			correlationId: string;
			page: AuditQuery & { cursor?: string; limit: number };
		}) {
			return options.unitOfWork.execute(async (repository) => {
				await appendWithRepository(options, repository, {
					action: "platform.audit-records.read",
					actorType: "human",
					actorUserId: input.actorUserId,
					classification: "Restricted",
					correlationId: input.correlationId,
					metadata: {
						actionFilter: input.page.action ?? null,
						actorFilterApplied: Boolean(input.page.actorUserId),
					},
					occurredAt: options.clock(),
					outcome: "success",
					retentionClass: "platform-security-evidence",
					scopeType: "Tenant",
					sourceChannel: "api",
					targetType: "AuditRecordCollection",
					tenantId: input.page.tenantId,
				});
				const records = (await repository.listTenant(input.page)).sort(
					(left, right) =>
						right.occurredAt.getTime() - left.occurredAt.getTime() ||
						right.sequence - left.sequence
				);
				const start = input.page.cursor
					? Math.max(
							0,
							records.findIndex((record) => record.id === input.page.cursor) + 1
						)
					: 0;
				const window = records.slice(start, start + input.page.limit + 1);
				const visible = window.slice(0, input.page.limit);
				const overlays = await repository.listPrivacyOverlays(
					input.page.tenantId
				);
				const transformed = await applyOverlays(
					options.hasher,
					visible,
					overlays
				);
				return {
					items: transformed.map(publicRecord),
					nextCursor:
						window.length > input.page.limit
							? (visible.at(-1)?.id ?? null)
							: null,
				};
			});
		},

		async verifyScope(scope: AuditScope): Promise<boolean> {
			const records = (
				await options.repository.listScopeRecords(scopeKey(scope))
			).sort((left, right) => left.sequence - right.sequence);
			const expectedHashes = await Promise.all(
				records.map(({ recordHash: _recordHash, ...withoutHash }) =>
					options.hasher.digest(stableSerialize(hashMaterial(withoutHash)))
				)
			);
			let previousHash: string | null = null;
			for (const [index, record] of records.entries()) {
				if (record.previousHash !== previousHash) {
					return false;
				}
				if (expectedHashes[index] !== record.recordHash) {
					return false;
				}
				previousHash = record.recordHash;
			}
			return true;
		},
	};
}
