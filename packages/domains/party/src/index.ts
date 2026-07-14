import type { EventEnvelope } from "@meridian/contracts-events";
import type {
	CreateOrganizationParty,
	CreatePartyIdentityLinkRequest,
	CreatePersonParty,
	Party,
	PlatformIdentityLink,
	UpdatePartyRequest,
} from "@meridian/contracts-platform-api";

export interface PartyRecord extends Party {
	createdAt: Date;
	privacyState: "Normal" | "Restricted" | "Pseudonymized";
	provenance: "Manual" | "IdentityOnboarding" | "Import" | "Reconciliation";
	updatedAt: Date;
}

export interface PersonDetailRecord {
	partyId: string;
	tenantId: string;
}

export interface OrganizationDetailRecord {
	partyId: string;
	registeredName: string | null;
	tenantId: string;
}

export interface ContactPointRecord {
	classification: "Confidential";
	displayValue: string;
	id: string;
	normalizedValue: string;
	partyId: string;
	retentionClass: "party-profile";
	tenantId: string;
	type: "Email" | "Phone";
	verificationState: "Unverified";
}

export interface IdentityLinkRecord extends PlatformIdentityLink {
	organizationId: string;
	provenance: "AuthenticatedMembershipReconciliation";
}

export type PartyCommandOperation =
	| "party.create-person"
	| "party.create-organization"
	| "party.update"
	| "party.identity-link.create";

export interface PartyCommandReceipt {
	idempotencyKey: string;
	operation: PartyCommandOperation;
	requestFingerprint: string;
	resourceId: string;
	result: unknown;
	tenantId: string;
}

export interface PageRequest {
	cursor?: string;
	limit: number;
	query?: string;
}

export interface Page<T> {
	items: T[];
	nextCursor: string | null;
}

export interface PartyRepository {
	createIdentityLink: (
		record: IdentityLinkRecord
	) => Promise<IdentityLinkRecord>;
	createOrganization: (input: {
		contacts: ContactPointRecord[];
		detail: OrganizationDetailRecord;
		party: PartyRecord;
	}) => Promise<PartyRecord>;
	createPerson: (input: {
		contacts: ContactPointRecord[];
		detail: PersonDetailRecord;
		party: PartyRecord;
	}) => Promise<PartyRecord>;
	getCommandReceipt: (
		tenantId: string,
		operation: PartyCommandOperation,
		idempotencyKey: string
	) => Promise<PartyCommandReceipt | null>;
	getIdentityLinkForMembership: (
		tenantId: string,
		membershipId: string
	) => Promise<IdentityLinkRecord | null>;
	getParty: (tenantId: string, partyId: string) => Promise<PartyRecord | null>;
	listParties: (
		tenantId: string,
		page: PageRequest
	) => Promise<Page<PartyRecord>>;
	recordCommandReceipt: (
		receipt: PartyCommandReceipt
	) => Promise<{ inserted: boolean; record: PartyCommandReceipt }>;
	updateParty: (input: {
		displayName?: string;
		partyId: string;
		state?: "Active" | "Inactive" | "Restricted";
		tenantId: string;
		version: number;
	}) => Promise<PartyRecord | "version_conflict">;
}

export type PendingEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;

export interface EventAppendPort {
	append: (event: PendingEvent) => Promise<"inserted" | "duplicate">;
}

export interface PartyTransactionScope {
	events: EventAppendPort;
	repository: PartyRepository;
}

export interface PartyUnitOfWork {
	execute: <TResult>(
		operation: (scope: PartyTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

/** Published query port implemented by Platform Tenancy at the composition root. */
export interface MembershipAuthorityPort {
	requireActiveMembership: (input: {
		authUserId: string;
		membershipId: string;
		organizationId: string;
		tenantId: string;
	}) => Promise<void>;
}

/** Published active-context port implemented by Platform Tenancy at composition. */
export interface ActiveContextAuthorityPort {
	requireActiveContext: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<{ organizationId: string; tenantId: string }>;
}

/** Published permission port bound to Platform Authorization at composition. */
export interface PartyPermissionAuthorityPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission:
			| "party.record.create"
			| "party.record.read"
			| "party.record.update";
		sessionId: string;
	}) => Promise<unknown>;
}

export interface PartyIdFactory {
	create: (
		kind: "contact-point" | "event" | "identity-link" | "party"
	) => string;
}

export class PartyError extends Error {
	readonly code:
		| "idempotency_conflict"
		| "identity_link_conflict"
		| "not_found"
		| "version_conflict"
		| "wrong_tenant";

	constructor(code: PartyError["code"], message: string) {
		super(message);
		this.code = code;
		this.name = "PartyError";
	}
}

function normalizeEmail(value: string): string {
	return value.trim().toLowerCase();
}

function normalizePhone(value: string): string {
	return value.replaceAll(/[^0-9+]/g, "");
}

async function fingerprint(value: Record<string, unknown>): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(value));
	const digest = await crypto.subtle.digest("SHA-256", bytes);
	return [...new Uint8Array(digest)]
		.map((byte) => byte.toString(16).padStart(2, "0"))
		.join("");
}

function receiptMatches(
	receipt: PartyCommandReceipt,
	requestFingerprint: string
): void {
	if (receipt.requestFingerprint !== requestFingerprint) {
		throw new PartyError(
			"idempotency_conflict",
			"The idempotency key is already bound to another Party command"
		);
	}
}

async function replay<TResult>(
	repository: PartyRepository,
	input: {
		idempotencyKey: string;
		operation: PartyCommandOperation;
		requestFingerprint: string;
		tenantId: string;
	}
): Promise<TResult | null> {
	const receipt = await repository.getCommandReceipt(
		input.tenantId,
		input.operation,
		input.idempotencyKey
	);
	if (!receipt) {
		return null;
	}
	receiptMatches(receipt, input.requestFingerprint);
	return receipt.result as TResult;
}

async function recordResult<TResult>(
	repository: PartyRepository,
	input: {
		idempotencyKey: string;
		operation: PartyCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: TResult
): Promise<TResult> {
	const receipt = await repository.recordCommandReceipt({ ...input, result });
	receiptMatches(receipt.record, input.requestFingerprint);
	return receipt.record.result as TResult;
}

async function claimResult<TResult>(
	repository: PartyRepository,
	input: {
		idempotencyKey: string;
		operation: PartyCommandOperation;
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: TResult
): Promise<{ claimed: boolean; result: TResult }> {
	const receipt = await repository.recordCommandReceipt({ ...input, result });
	receiptMatches(receipt.record, input.requestFingerprint);
	return {
		claimed: receipt.inserted,
		result: receipt.record.result as TResult,
	};
}

function partyView(record: PartyRecord): Party {
	return {
		classification: record.classification,
		displayName: record.displayName,
		id: record.id,
		state: record.state,
		tenantId: record.tenantId,
		type: record.type,
		version: record.version,
	};
}

function eventBase(input: {
	actorUserId: string;
	aggregateId: string;
	correlationId: string;
	eventId: string;
	idempotencyKey: string;
	name: string;
	now: Date;
	organizationId: string;
	schemaRef: string;
	tenantId: string;
}): PendingEvent {
	return {
		actorId: input.actorUserId,
		aggregateId: input.aggregateId,
		capabilityId: "party.records",
		classification: "Confidential",
		correlationId: input.correlationId,
		data: {},
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "party",
		purpose: "tenant-party-administration",
		retentionClass: "party-profile-event",
		schemaRef: input.schemaRef,
		schemaVersion: "1.0.0",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

function contacts(
	ids: PartyIdFactory,
	input: { email?: string | null; phone?: string | null },
	partyId: string,
	tenantId: string
): ContactPointRecord[] {
	const records: ContactPointRecord[] = [];
	if (input.email) {
		records.push({
			classification: "Confidential",
			displayValue: input.email,
			id: ids.create("contact-point"),
			normalizedValue: normalizeEmail(input.email),
			partyId,
			retentionClass: "party-profile",
			tenantId,
			type: "Email",
			verificationState: "Unverified",
		});
	}
	if (input.phone) {
		records.push({
			classification: "Confidential",
			displayValue: input.phone,
			id: ids.create("contact-point"),
			normalizedValue: normalizePhone(input.phone),
			partyId,
			retentionClass: "party-profile",
			tenantId,
			type: "Phone",
			verificationState: "Unverified",
		});
	}
	return records;
}

export interface PartyServiceOptions {
	clock: () => Date;
	ids: PartyIdFactory;
	membershipAuthority: MembershipAuthorityPort;
	unitOfWork: PartyUnitOfWork;
}

export function createPartyService(options: PartyServiceOptions) {
	async function createParty(input: {
		actorUserId: string;
		body: CreatePersonParty | CreateOrganizationParty;
		correlationId: string;
		idempotencyKey: string;
		organizationId: string;
		tenantId: string;
		type: "Person" | "Organization";
	}): Promise<Party> {
		const operation: PartyCommandOperation =
			input.type === "Person"
				? "party.create-person"
				: "party.create-organization";
		const requestFingerprint = await fingerprint({
			body: input.body,
			organizationId: input.organizationId,
			type: input.type,
		});
		return options.unitOfWork.execute(async ({ events, repository }) => {
			const prior = await replay<Party>(repository, {
				idempotencyKey: input.idempotencyKey,
				operation,
				requestFingerprint,
				tenantId: input.tenantId,
			});
			if (prior) {
				return prior;
			}
			const now = options.clock();
			const partyId = options.ids.create("party");
			const party: PartyRecord = {
				classification: "Confidential",
				createdAt: now,
				displayName: input.body.displayName,
				id: partyId,
				privacyState: "Normal",
				provenance: "Manual",
				state: "Active",
				tenantId: input.tenantId,
				type: input.type,
				updatedAt: now,
				version: 1,
			};
			const claim = await claimResult(
				repository,
				{
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					resourceId: party.id,
					tenantId: input.tenantId,
				},
				partyView(party)
			);
			if (!claim.claimed) {
				return claim.result;
			}
			const contactRecords = contacts(
				options.ids,
				input.body,
				partyId,
				input.tenantId
			);
			const created =
				input.type === "Person"
					? await repository.createPerson({
							contacts: contactRecords,
							detail: { partyId, tenantId: input.tenantId },
							party,
						})
					: await repository.createOrganization({
							contacts: contactRecords,
							detail: {
								partyId,
								registeredName:
									"registeredName" in input.body
										? (input.body.registeredName ?? null)
										: null,
								tenantId: input.tenantId,
							},
							party,
						});
			const eventName =
				input.type === "Person"
					? "party.person.created.v1"
					: "party.organization.created.v1";
			const event = eventBase({
				actorUserId: input.actorUserId,
				aggregateId: created.id,
				correlationId: input.correlationId,
				eventId: options.ids.create("event"),
				idempotencyKey: input.idempotencyKey,
				name: eventName,
				now,
				organizationId: input.organizationId,
				schemaRef: `schemas/events/${eventName}.schema.json`,
				tenantId: input.tenantId,
			});
			event.data = {
				classification: created.classification,
				createdAt: now.toISOString(),
				partyId: created.id,
			};
			await events.append(event);
			return partyView(created);
		});
	}

	return {
		async createIdentityLink(input: {
			actorUserId: string;
			body: CreatePartyIdentityLinkRequest;
			correlationId: string;
			idempotencyKey: string;
			organizationId: string;
			tenantId: string;
		}): Promise<PlatformIdentityLink> {
			const operation = "party.identity-link.create" as const;
			const requestFingerprint = await fingerprint({
				body: input.body,
				organizationId: input.organizationId,
			});
			await options.membershipAuthority.requireActiveMembership({
				authUserId: input.body.authUserId,
				membershipId: input.body.membershipId,
				organizationId: input.organizationId,
				tenantId: input.tenantId,
			});
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const prior = await replay<PlatformIdentityLink>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const party = await repository.getParty(
					input.tenantId,
					input.body.partyId
				);
				if (!party) {
					throw new PartyError(
						"not_found",
						"Party was not found in the active tenant"
					);
				}
				const existing = await repository.getIdentityLinkForMembership(
					input.tenantId,
					input.body.membershipId
				);
				if (existing) {
					throw new PartyError(
						"identity_link_conflict",
						"The membership is already linked to a Party"
					);
				}
				const now = options.clock();
				const candidate: IdentityLinkRecord = {
					...input.body,
					createdAt: now.toISOString(),
					id: options.ids.create("identity-link"),
					organizationId: input.organizationId,
					provenance: "AuthenticatedMembershipReconciliation",
					state: "Active",
					tenantId: input.tenantId,
					version: 1,
				};
				const claim = await claimResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: candidate.id,
						tenantId: input.tenantId,
					},
					candidate
				);
				if (!claim.claimed) {
					return claim.result;
				}
				const link = await repository.createIdentityLink(candidate);
				if (link.id !== candidate.id) {
					throw new PartyError(
						"identity_link_conflict",
						"The membership is already linked to a Party"
					);
				}
				const event = eventBase({
					actorUserId: input.actorUserId,
					aggregateId: link.id,
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "party.identity-link.created.v1",
					now,
					organizationId: input.organizationId,
					schemaRef:
						"schemas/events/party.identity-link.created.v1.schema.json",
					tenantId: input.tenantId,
				});
				event.data = {
					authUserId: link.authUserId,
					identityLinkId: link.id,
					membershipId: link.membershipId,
					partyId: link.partyId,
				};
				await events.append(event);
				return link;
			});
		},

		createOrganization(input: Omit<Parameters<typeof createParty>[0], "type">) {
			return createParty({ ...input, type: "Organization" });
		},

		createPerson(input: Omit<Parameters<typeof createParty>[0], "type">) {
			return createParty({ ...input, type: "Person" });
		},

		getParty(tenantId: string, partyId: string): Promise<Party> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const party = await repository.getParty(tenantId, partyId);
				if (!party) {
					throw new PartyError(
						"not_found",
						"Party was not found in the active tenant"
					);
				}
				return party;
			});
		},

		listParties(tenantId: string, page: PageRequest): Promise<Page<Party>> {
			return options.unitOfWork.execute(({ repository }) =>
				repository.listParties(tenantId, page)
			);
		},

		async updateParty(input: {
			actorUserId: string;
			body: UpdatePartyRequest;
			idempotencyKey: string;
			partyId: string;
			tenantId: string;
		}): Promise<Party> {
			const operation = "party.update" as const;
			const requestFingerprint = await fingerprint({
				body: input.body,
				partyId: input.partyId,
			});
			return options.unitOfWork.execute(async ({ repository }) => {
				const prior = await replay<Party>(repository, {
					idempotencyKey: input.idempotencyKey,
					operation,
					requestFingerprint,
					tenantId: input.tenantId,
				});
				if (prior) {
					return prior;
				}
				const updated = await repository.updateParty({
					displayName: input.body.displayName,
					partyId: input.partyId,
					state: input.body.state,
					tenantId: input.tenantId,
					version: input.body.version,
				});
				if (updated === "version_conflict") {
					const existing = await repository.getParty(
						input.tenantId,
						input.partyId
					);
					throw new PartyError(
						existing ? "version_conflict" : "not_found",
						existing ? "Party version is stale" : "Party was not found"
					);
				}
				return recordResult(
					repository,
					{
						idempotencyKey: input.idempotencyKey,
						operation,
						requestFingerprint,
						resourceId: updated.id,
						tenantId: input.tenantId,
					},
					partyView(updated)
				);
			});
		},
	};
}

export interface PartyApplicationOptions {
	activeContexts: ActiveContextAuthorityPort;
	permissions: PartyPermissionAuthorityPort;
	service: ReturnType<typeof createPartyService>;
}

export function createPartyApplication(options: PartyApplicationOptions) {
	function scope(input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) {
		return options.activeContexts.requireActiveContext(input);
	}

	async function authorize(
		input: { authUserId: string; contextId: string; sessionId: string },
		permission:
			| "party.record.create"
			| "party.record.read"
			| "party.record.update"
	) {
		await options.permissions.requirePermission({
			assuranceLevel: "aal1",
			...input,
			permission,
		});
	}

	return {
		async createIdentityLink(input: {
			actorUserId: string;
			body: CreatePartyIdentityLinkRequest;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"party.record.update"
			);
			const active = await scope({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			return options.service.createIdentityLink({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async createOrganization(input: {
			actorUserId: string;
			body: CreateOrganizationParty;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"party.record.create"
			);
			const active = await scope({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			return options.service.createOrganization({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async createPerson(input: {
			actorUserId: string;
			body: CreatePersonParty;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"party.record.create"
			);
			const active = await scope({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			return options.service.createPerson({
				...input,
				organizationId: active.organizationId,
				tenantId: active.tenantId,
			});
		},
		async get(input: {
			authUserId: string;
			contextId: string;
			partyId: string;
			sessionId: string;
		}) {
			await authorize(input, "party.record.read");
			const active = await scope(input);
			return options.service.getParty(active.tenantId, input.partyId);
		},
		async list(input: {
			authUserId: string;
			contextId: string;
			page: PageRequest;
			sessionId: string;
		}) {
			await authorize(input, "party.record.read");
			const active = await scope(input);
			return options.service.listParties(active.tenantId, input.page);
		},
		async update(input: {
			actorUserId: string;
			body: UpdatePartyRequest;
			contextId: string;
			idempotencyKey: string;
			partyId: string;
			sessionId: string;
		}) {
			await authorize(
				{
					authUserId: input.actorUserId,
					contextId: input.contextId,
					sessionId: input.sessionId,
				},
				"party.record.update"
			);
			const active = await scope({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			return options.service.updateParty({
				...input,
				tenantId: active.tenantId,
			});
		},
	};
}
