import type { EventEnvelope } from "@meridian/contracts-events";
import type { PermissionId } from "@meridian/contracts-permissions";
import type {
	ActiveContext,
	ActiveContextRequest,
	AuthorizationDecision,
	CreateRoleAssignmentRequest,
	CreateUserInvitationRequest,
	CurrentIdentity,
	Role,
	RoleAssignment,
	SuspendTenantMembershipRequest,
	UpdateOrganizationRequest,
	UserSummary,
} from "@meridian/contracts-platform-api";

export type TenantState = "Provisioning" | "Active" | "Suspended" | "Archived";
export type OrganizationState = TenantState;
export type LocationState = "Active" | "Suspended" | "Archived";
export type LocationType =
	| "Store"
	| "Warehouse"
	| "Office"
	| "Mobile"
	| "Virtual"
	| "Other";
export type MembershipState =
	| "Invited"
	| "Provisioning"
	| "Active"
	| "Suspended"
	| "Ended";
export type InvitationState =
	| "Pending"
	| "Provisioning"
	| "Delivered"
	| "Accepted"
	| "Failed"
	| "Cancelled"
	| "Expired";
export type RoleState = "Active" | "Inactive";
export type RoleAssignmentState = "Active" | "Revoked" | "Expired";
export type DelegationState = "Active" | "Revoked" | "Expired";
export type AuthorizationScopeType =
	| "Tenant"
	| "Organization"
	| "LegalEntity"
	| "Branch"
	| "Location";

export interface TenantRecord {
	id: string;
	name: string;
	state: TenantState;
	version: number;
}

export interface OrganizationRecord {
	id: string;
	locale?: string;
	name: string;
	state: OrganizationState;
	tenantId: string;
	timezone?: string;
	version: number;
}

export interface LocationRecord {
	id: string;
	name: string;
	organizationId: string;
	state: LocationState;
	tenantId: string;
	timezone: string;
	type: LocationType;
	version: number;
}

export interface MembershipRecord {
	authUserId: string;
	id: string;
	organizationId: string;
	roleAssignmentIds: string[];
	state: MembershipState;
	tenantId: string;
	version: number;
}

export interface RoleRecord extends Omit<Role, "permissionIds"> {
	permissionIds: PermissionId[];
}

export interface RoleAssignmentRecord
	extends Omit<RoleAssignment, "endsAt" | "scopeId" | "startsAt"> {
	endsAt?: Date;
	scopeId?: string;
	startsAt: Date;
}

export interface DelegationRecord {
	allowFurtherDelegation: boolean;
	delegateMembershipId: string;
	delegatorMembershipId: string;
	endsAt: Date;
	id: string;
	permissionIds: PermissionId[];
	reason: string;
	scopeId?: string;
	scopeType: AuthorizationScopeType;
	startsAt: Date;
	state: DelegationState;
	tenantId: string;
	version: number;
}

export interface TenancyAuthorizationState {
	assignments: {
		assignment: RoleAssignmentRecord;
		role: RoleRecord | null;
	}[];
	context: ActiveContextRecord;
	delegation: DelegationRecord | null;
	membership: MembershipRecord | null;
}

export interface InvitationRecord {
	createdAt: Date;
	email: string;
	expiresAt: Date;
	failureCode?: string;
	id: string;
	inviteeReference: string;
	organizationId: string;
	partyId?: string;
	roleIds: string[];
	state: InvitationState;
	tenantId: string;
}

export interface ActiveContextRecord
	extends Omit<
		ActiveContext,
		| "branchId"
		| "delegationId"
		| "expiresAt"
		| "issuedAt"
		| "legalEntityId"
		| "locationId"
		| "partyId"
	> {
	branchId?: string;
	delegationId?: string;
	expiresAt: Date;
	idempotencyKey: string;
	issuedAt: Date;
	legalEntityId?: string;
	locationId?: string;
	partyId?: string;
	sessionId: string;
}

export interface CommandReceiptRecord {
	idempotencyKey: string;
	operation:
		| "membership.suspend"
		| "organization.update"
		| "role-assignment.grant";
	requestFingerprint: string;
	resourceId: string;
	result: Record<string, unknown>;
	tenantId: string;
}

export interface PageRequest {
	cursor?: string;
	limit: number;
}

export interface Page<T> {
	items: T[];
	nextCursor: string | null;
}

export interface TenantSeed {
	delegations?: DelegationRecord[];
	locations: LocationRecord[];
	memberships: MembershipRecord[];
	organizations: OrganizationRecord[];
	roleAssignments?: RoleAssignmentRecord[];
	roles?: RoleRecord[];
	tenant: TenantRecord;
}

export interface TenancyRepository {
	activateMembership: (record: MembershipRecord) => Promise<MembershipRecord>;
	completeCommandReceipt: (
		record: CommandReceiptRecord
	) => Promise<CommandReceiptRecord>;
	createInvitation: (
		record: InvitationRecord,
		idempotencyKey: string
	) => Promise<InvitationRecord>;
	createRoleAssignment: (
		record: RoleAssignmentRecord
	) => Promise<RoleAssignmentRecord>;
	getActiveContext: (
		contextId: string,
		sessionId: string
	) => Promise<ActiveContextRecord | null>;
	getCommandReceipt: (
		tenantId: string,
		operation: CommandReceiptRecord["operation"],
		idempotencyKey: string
	) => Promise<CommandReceiptRecord | null>;
	getDelegation: (
		tenantId: string,
		delegationId: string
	) => Promise<DelegationRecord | null>;
	getInvitationByIdempotency: (
		tenantId: string,
		idempotencyKey: string
	) => Promise<InvitationRecord | null>;
	getLocation: (
		tenantId: string,
		locationId: string
	) => Promise<LocationRecord | null>;
	getMembership: (
		tenantId: string,
		membershipId: string
	) => Promise<MembershipRecord | null>;
	getMembershipForOrganization: (
		authUserId: string,
		organizationId: string
	) => Promise<MembershipRecord | null>;
	getOrganization: (
		tenantId: string,
		organizationId: string
	) => Promise<OrganizationRecord | null>;
	getRole: (tenantId: string, roleId: string) => Promise<RoleRecord | null>;
	getTenant: (tenantId: string) => Promise<TenantRecord | null>;
	issueActiveContext: (
		record: ActiveContextRecord
	) => Promise<ActiveContextRecord>;
	listLocations: (
		tenantId: string,
		organizationId: string,
		page: PageRequest
	) => Promise<Page<LocationRecord>>;
	listMemberships: (authUserId: string) => Promise<MembershipRecord[]>;
	listOrganizations: (
		authUserId: string,
		tenantId: string,
		page: PageRequest
	) => Promise<Page<OrganizationRecord>>;
	listRoleAssignments: (
		tenantId: string,
		membershipId: string
	) => Promise<RoleAssignmentRecord[]>;
	listRoles: (tenantId: string, page: PageRequest) => Promise<Page<RoleRecord>>;
	listTenantMemberships: (
		tenantId: string,
		page: PageRequest
	) => Promise<Page<MembershipRecord>>;
	recordCommandReceipt: (
		record: CommandReceiptRecord
	) => Promise<{ inserted: boolean; record: CommandReceiptRecord }>;
	seed: (seed: TenantSeed) => Promise<void>;
	suspendMembership: (input: {
		membershipId: string;
		reason: string;
		tenantId: string;
		version: number;
	}) => Promise<MembershipRecord | "version_conflict">;
	updateOrganization: (input: {
		locale?: string;
		name?: string;
		organizationId: string;
		tenantId: string;
		timezone?: string;
		version: number;
	}) => Promise<OrganizationRecord | "version_conflict">;
}

export type PendingEvent = Omit<
	EventEnvelope<Record<string, unknown>>,
	"publishedAt"
>;

export interface EventAppendPort {
	append: (event: PendingEvent) => Promise<"inserted" | "duplicate">;
}

export interface TenancyTransactionScope {
	events: EventAppendPort;
	repository: TenancyRepository;
}

export interface TenancyUnitOfWork {
	execute: <TResult>(
		operation: (scope: TenancyTransactionScope) => Promise<TResult>
	) => Promise<TResult>;
}

export interface IdFactory {
	create: (
		kind:
			| "active-context"
			| "event"
			| "invitation"
			| "invitee-reference"
			| "role-assignment"
	) => string;
}

export class TenancyError extends Error {
	readonly code:
		| "authorization_denied"
		| "context_expired"
		| "idempotency_conflict"
		| "membership_inactive"
		| "not_found"
		| "version_conflict"
		| "wrong_tenant";

	constructor(
		code:
			| "authorization_denied"
			| "context_expired"
			| "idempotency_conflict"
			| "membership_inactive"
			| "not_found"
			| "version_conflict"
			| "wrong_tenant",
		message: string
	) {
		super(message);
		this.code = code;
		this.name = "TenancyError";
	}
}

export interface PermissionDecisionPort {
	requirePermission: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PermissionId;
		resourceScope?: {
			scopeId?: string;
			scopeType: AuthorizationScopeType;
		};
		sessionId: string;
	}) => Promise<AuthorizationDecision>;
}

function dependencyUnavailable(message: string, cause: unknown) {
	const error = new Error(message, { cause });
	return Object.assign(error, {
		code: "dependency_unavailable" as const,
		uncertainty: true as const,
	});
}

export interface TenancyServiceOptions {
	clock: () => Date;
	contextTtlMs: number;
	ids: IdFactory;
	unitOfWork: TenancyUnitOfWork;
}

function activeMembership(record: MembershipRecord | null): MembershipRecord {
	if (record?.state !== "Active") {
		throw new TenancyError(
			"membership_inactive",
			"An active membership is required"
		);
	}
	return record;
}

function assertReceiptMatches(
	receipt: CommandReceiptRecord,
	resourceId: string,
	requestFingerprint: string
): void {
	if (
		receipt.resourceId !== resourceId ||
		receipt.requestFingerprint !== requestFingerprint
	) {
		throw new TenancyError(
			"idempotency_conflict",
			"The idempotency key is already bound to another command"
		);
	}
}

function commandFingerprint(value: Record<string, unknown>): string {
	return JSON.stringify(value);
}

async function requireOperationalScope(
	repository: TenancyRepository,
	tenantId: string,
	organizationId: string,
	locationId?: string
): Promise<void> {
	const tenant = await repository.getTenant(tenantId);
	const organization = await repository.getOrganization(
		tenantId,
		organizationId
	);
	if (tenant?.state !== "Active" || organization?.state !== "Active") {
		throw new TenancyError(
			"membership_inactive",
			"Tenant or organization is not active"
		);
	}
	if (!locationId) {
		return;
	}
	const location = await repository.getLocation(tenantId, locationId);
	if (!location || location.organizationId !== organizationId) {
		throw new TenancyError(
			"wrong_tenant",
			"Location is outside the selected organization"
		);
	}
	if (location.state !== "Active") {
		throw new TenancyError(
			"membership_inactive",
			"Active-context location is not available"
		);
	}
}

async function replayCommandReceipt<TResult>(
	repository: TenancyRepository,
	input: {
		idempotencyKey: string;
		operation: CommandReceiptRecord["operation"];
		requestFingerprint: string;
		resourceId: string;
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
	assertReceiptMatches(receipt, input.resourceId, input.requestFingerprint);
	return receipt.result as unknown as TResult;
}

async function recordCommandResult<TResult>(
	repository: TenancyRepository,
	input: {
		idempotencyKey: string;
		operation: CommandReceiptRecord["operation"];
		requestFingerprint: string;
		resourceId: string;
		tenantId: string;
	},
	result: TResult
): Promise<{ inserted: boolean; result: TResult }> {
	const receipt = await repository.recordCommandReceipt({
		...input,
		result: result as Record<string, unknown>,
	});
	assertReceiptMatches(
		receipt.record,
		input.resourceId,
		input.requestFingerprint
	);
	return {
		inserted: receipt.inserted,
		result: receipt.record.result as unknown as TResult,
	};
}

async function requireOwnedMembership(
	repository: TenancyRepository,
	tenantId: string,
	membershipId: string,
	targetAuthUserId: string
): Promise<MembershipRecord> {
	const membership = await repository.getMembership(tenantId, membershipId);
	if (!membership) {
		throw new TenancyError(
			"not_found",
			"Membership was not found in the active tenant"
		);
	}
	if (membership.authUserId !== targetAuthUserId) {
		throw new TenancyError(
			"wrong_tenant",
			"The user identifier does not match the tenant membership"
		);
	}
	return membership;
}

function invitationMatches(
	existing: InvitationRecord,
	input: {
		email: string;
		expiresAt?: Date;
		organizationId: string;
		partyId?: string;
		roleIds: string[];
	}
): boolean {
	const existingRoles = [...existing.roleIds].sort();
	const requestedRoles = [...input.roleIds].sort();
	return (
		existing.email === input.email.toLowerCase() &&
		existing.organizationId === input.organizationId &&
		(existing.partyId ?? undefined) === input.partyId &&
		existingRoles.length === requestedRoles.length &&
		existingRoles.every((roleId, index) => roleId === requestedRoles[index]) &&
		(!input.expiresAt ||
			existing.expiresAt.getTime() === input.expiresAt.getTime())
	);
}

function toMembershipSummary(record: MembershipRecord) {
	return {
		membershipId: record.id,
		organizationId: record.organizationId,
		roleAssignmentIds: record.roleAssignmentIds,
		state: record.state,
		tenantId: record.tenantId,
		version: record.version,
	};
}

function eventBase(input: {
	actorId: string;
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
		actorId: input.actorId,
		aggregateId: input.aggregateId,
		capabilityId: "platform.tenancy",
		classification: "Confidential",
		correlationId: input.correlationId,
		data: {},
		id: input.eventId,
		idempotencyKey: input.idempotencyKey,
		name: input.name,
		occurredAt: input.now.toISOString(),
		organizationId: input.organizationId,
		producerNamespace: "platform",
		purpose: "tenant-membership-administration",
		retentionClass: "platform-security-evidence",
		schemaRef: input.schemaRef,
		schemaVersion: "1.0.0",
		scopeType: "Tenant",
		sourceChannel: "api",
		tenantId: input.tenantId,
	};
}

export interface GrantRoleAssignmentInput {
	actorUserId: string;
	body: Omit<CreateRoleAssignmentRequest, "endsAt" | "scopeId" | "startsAt"> & {
		endsAt?: Date;
		scopeId?: string;
		startsAt: Date;
	};
	correlationId: string;
	idempotencyKey: string;
	tenantId: string;
}

function roleAssignmentFingerprint(input: GrantRoleAssignmentInput): string {
	if (input.body.endsAt && input.body.endsAt <= input.body.startsAt) {
		throw new TenancyError(
			"wrong_tenant",
			"Role assignment expiry must be after its start"
		);
	}
	return commandFingerprint({
		endsAt: input.body.endsAt?.toISOString() ?? null,
		membershipId: input.body.membershipId,
		roleId: input.body.roleId,
		scopeId: input.body.scopeId ?? null,
		scopeType: input.body.scopeType,
		startsAt: input.body.startsAt.toISOString(),
	});
}

function replayRoleAssignment(
	receipt: CommandReceiptRecord,
	requestFingerprint: string
): RoleAssignmentRecord {
	if (receipt.requestFingerprint !== requestFingerprint) {
		throw new TenancyError(
			"idempotency_conflict",
			"The idempotency key is already bound to another role assignment"
		);
	}
	const result = receipt.result as unknown as Omit<
		RoleAssignmentRecord,
		"endsAt" | "startsAt"
	> & {
		endsAt?: Date | string | null;
		startsAt: Date | string;
	};
	const { endsAt, startsAt, ...persisted } = result;
	return {
		...persisted,
		...(endsAt ? { endsAt: new Date(endsAt) } : {}),
		startsAt: new Date(startsAt),
	};
}

async function validateAssignmentScope(
	repository: TenancyRepository,
	input: GrantRoleAssignmentInput,
	membership: MembershipRecord
): Promise<void> {
	if (input.body.scopeType === "Tenant") {
		if (input.body.scopeId) {
			throw new TenancyError(
				"wrong_tenant",
				"Tenant scope cannot carry another scope identifier"
			);
		}
		return;
	}
	if (input.body.scopeType === "Organization") {
		if (input.body.scopeId !== membership.organizationId) {
			throw new TenancyError(
				"wrong_tenant",
				"Organization scope is outside the target membership"
			);
		}
		return;
	}
	if (input.body.scopeType === "Location") {
		const location = input.body.scopeId
			? await repository.getLocation(input.tenantId, input.body.scopeId)
			: null;
		if (location?.organizationId !== membership.organizationId) {
			throw new TenancyError(
				"wrong_tenant",
				"Location scope is outside the target membership"
			);
		}
		return;
	}
	throw new TenancyError(
		"not_found",
		"Legal-entity and branch assignment scopes remain seams"
	);
}

async function executeRoleAssignmentGrant(
	options: TenancyServiceOptions,
	input: GrantRoleAssignmentInput,
	requestFingerprint: string,
	scope: TenancyTransactionScope
): Promise<RoleAssignmentRecord> {
	const { events, repository } = scope;
	const existing = await repository.getCommandReceipt(
		input.tenantId,
		"role-assignment.grant",
		input.idempotencyKey
	);
	if (existing) {
		return replayRoleAssignment(existing, requestFingerprint);
	}
	const membership = activeMembership(
		await repository.getMembership(input.tenantId, input.body.membershipId)
	);
	const role = await repository.getRole(input.tenantId, input.body.roleId);
	if (role?.state !== "Active") {
		throw new TenancyError("not_found", "Active role was not found");
	}
	await validateAssignmentScope(repository, input, membership);
	const assignment: RoleAssignmentRecord = {
		endsAt: input.body.endsAt,
		id: options.ids.create("role-assignment"),
		membershipId: membership.id,
		roleId: role.id,
		scopeId: input.body.scopeId,
		scopeType: input.body.scopeType,
		startsAt: input.body.startsAt,
		state: "Active",
		tenantId: input.tenantId,
		version: 1,
	};
	const claimed = await repository.recordCommandReceipt({
		idempotencyKey: input.idempotencyKey,
		operation: "role-assignment.grant",
		requestFingerprint,
		resourceId: assignment.id,
		result: { pending: true },
		tenantId: input.tenantId,
	});
	if (!claimed.inserted) {
		return replayRoleAssignment(claimed.record, requestFingerprint);
	}
	const created = await repository.createRoleAssignment(assignment);
	await repository.completeCommandReceipt({
		...claimed.record,
		result: created as unknown as Record<string, unknown>,
	});
	const event = eventBase({
		actorId: input.actorUserId,
		aggregateId: created.id,
		correlationId: input.correlationId,
		eventId: options.ids.create("event"),
		idempotencyKey: input.idempotencyKey,
		name: "platform.role-assignment.granted.v1",
		now: options.clock(),
		organizationId: membership.organizationId,
		schemaRef: "schemas/events/platform.role-assignment.granted.v1.schema.json",
		tenantId: input.tenantId,
	});
	event.data = {
		endsAt: created.endsAt?.toISOString() ?? null,
		membershipId: created.membershipId,
		roleAssignmentId: created.id,
		roleId: created.roleId,
		scopeId: created.scopeId ?? null,
		scopeType: created.scopeType,
		startsAt: created.startsAt.toISOString(),
	};
	await events.append(event);
	return created;
}

export function createTenancyService(options: TenancyServiceOptions) {
	const inFlightRoleAssignmentGrants = new Map<
		string,
		{
			promise: Promise<RoleAssignmentRecord>;
			requestFingerprint: string;
		}
	>();
	return {
		activateMembership(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			membership: MembershipRecord;
		}): Promise<MembershipRecord> {
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const membership = await repository.activateMembership(
					input.membership
				);
				const event = eventBase({
					actorId: input.actorUserId,
					aggregateId: membership.id,
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "platform.membership.activated.v1",
					now: options.clock(),
					organizationId: membership.organizationId,
					schemaRef:
						"schemas/events/platform.membership.activated.v1.schema.json",
					tenantId: membership.tenantId,
				});
				event.data = {
					activatedAt: event.occurredAt,
					authUserId: membership.authUserId,
					membershipId: membership.id,
					organizationId: membership.organizationId,
				};
				await events.append(event);
				return membership;
			});
		},

		createInvitation(input: {
			actorUserId: string;
			correlationId: string;
			email: string;
			expiresAt?: Date;
			idempotencyKey: string;
			organizationId: string;
			partyId?: string;
			roleIds: string[];
			tenantId: string;
		}): Promise<InvitationRecord> {
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const existing = await repository.getInvitationByIdempotency(
					input.tenantId,
					input.idempotencyKey
				);
				if (existing) {
					if (!invitationMatches(existing, input)) {
						throw new TenancyError(
							"idempotency_conflict",
							"The idempotency key is already bound to another invitation"
						);
					}
					return existing;
				}

				const now = options.clock();
				const invitation = await repository.createInvitation(
					{
						createdAt: now,
						email: input.email.toLowerCase(),
						expiresAt:
							input.expiresAt ?? new Date(now.getTime() + 48 * 60 * 60 * 1000),
						id: options.ids.create("invitation"),
						inviteeReference: options.ids.create("invitee-reference"),
						organizationId: input.organizationId,
						partyId: input.partyId,
						roleIds: [...input.roleIds],
						state: "Pending",
						tenantId: input.tenantId,
					},
					input.idempotencyKey
				);
				if (!invitationMatches(invitation, input)) {
					throw new TenancyError(
						"idempotency_conflict",
						"The idempotency key is already bound to another invitation"
					);
				}
				const event = eventBase({
					actorId: input.actorUserId,
					aggregateId: invitation.id,
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "platform.membership.invited.v1",
					now,
					organizationId: invitation.organizationId,
					schemaRef:
						"schemas/events/platform.membership.invited.v1.schema.json",
					tenantId: invitation.tenantId,
				});
				event.data = {
					expiresAt: invitation.expiresAt.toISOString(),
					invitationId: invitation.id,
					inviteeReference: invitation.inviteeReference,
					organizationId: invitation.organizationId,
				};
				await events.append(event);
				return invitation;
			});
		},

		async getCurrentIdentity(input: {
			activeContextId?: string;
			assuranceLevel: CurrentIdentity["assuranceLevel"];
			authUserId: string;
			partyId?: string;
			sessionId: string;
		}): Promise<CurrentIdentity> {
			const activeContext = input.activeContextId
				? await this.requireContext({
						authUserId: input.authUserId,
						contextId: input.activeContextId,
						sessionId: input.sessionId,
					})
				: null;
			return options.unitOfWork.execute(async ({ repository }) => {
				const memberships = await repository.listMemberships(input.authUserId);
				return {
					activeContext: activeContext
						? {
								...activeContext,
								expiresAt: activeContext.expiresAt.toISOString(),
								issuedAt: activeContext.issuedAt.toISOString(),
							}
						: null,
					assuranceLevel: input.assuranceLevel,
					authUserId: input.authUserId,
					memberships: memberships.map(toMembershipSummary),
					partyId: input.partyId ?? null,
					sessionId: input.sessionId,
				};
			});
		},

		getMembershipForAdministration(input: {
			membershipId: string;
			tenantId: string;
		}): Promise<MembershipRecord> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const membership = await repository.getMembership(
					input.tenantId,
					input.membershipId
				);
				if (!membership) {
					throw new TenancyError("not_found", "Membership was not found");
				}
				return membership;
			});
		},

		async getOrganization(input: {
			authUserId: string;
			contextId: string;
			organizationId: string;
			sessionId: string;
		}): Promise<OrganizationRecord> {
			const context = await this.requireContext(input);
			if (context.organizationId !== input.organizationId) {
				throw new TenancyError(
					"wrong_tenant",
					"Organization is outside the active context"
				);
			}
			return options.unitOfWork.execute(async ({ repository }) => {
				const organization = await repository.getOrganization(
					context.tenantId,
					input.organizationId
				);
				if (!organization) {
					throw new TenancyError("not_found", "Organization was not found");
				}
				return organization;
			});
		},

		grantRoleAssignment(
			input: GrantRoleAssignmentInput
		): Promise<RoleAssignmentRecord> {
			const requestFingerprint = roleAssignmentFingerprint(input);
			const inFlightKey = JSON.stringify([
				input.tenantId,
				input.idempotencyKey,
			]);
			const inFlight = inFlightRoleAssignmentGrants.get(inFlightKey);
			if (inFlight) {
				if (inFlight.requestFingerprint !== requestFingerprint) {
					return Promise.reject(
						new TenancyError(
							"idempotency_conflict",
							"The idempotency key is already bound to another role assignment"
						)
					);
				}
				return inFlight.promise;
			}
			const promise = options.unitOfWork
				.execute((scope) =>
					executeRoleAssignmentGrant(options, input, requestFingerprint, scope)
				)
				.finally(() => {
					if (
						inFlightRoleAssignmentGrants.get(inFlightKey)?.promise === promise
					) {
						inFlightRoleAssignmentGrants.delete(inFlightKey);
					}
				});
			inFlightRoleAssignmentGrants.set(inFlightKey, {
				promise,
				requestFingerprint,
			});
			return promise;
		},

		async listLocations(input: {
			authUserId: string;
			contextId: string;
			organizationId: string;
			page: PageRequest;
			sessionId: string;
		}): Promise<Page<LocationRecord>> {
			const context = await this.requireContext(input);
			if (context.organizationId !== input.organizationId) {
				throw new TenancyError(
					"wrong_tenant",
					"Organization is outside the active context"
				);
			}
			return options.unitOfWork.execute(({ repository }) =>
				repository.listLocations(
					context.tenantId,
					input.organizationId,
					input.page
				)
			);
		},

		listOrganizations(input: {
			authUserId: string;
			page: PageRequest;
			tenantId: string;
		}): Promise<Page<OrganizationRecord>> {
			return options.unitOfWork.execute(({ repository }) =>
				repository.listOrganizations(
					input.authUserId,
					input.tenantId,
					input.page
				)
			);
		},

		listRoles(input: {
			page: PageRequest;
			tenantId: string;
		}): Promise<Page<RoleRecord>> {
			return options.unitOfWork.execute(({ repository }) =>
				repository.listRoles(input.tenantId, input.page)
			);
		},

		async listTenantMemberships(input: {
			authUserId: string;
			contextId: string;
			page: PageRequest;
			sessionId: string;
		}): Promise<Page<MembershipRecord>> {
			const context = await this.requireContext(input);
			return options.unitOfWork.execute(({ repository }) =>
				repository.listTenantMemberships(context.tenantId, input.page)
			);
		},

		requireContext(input: {
			authUserId: string;
			contextId: string;
			sessionId: string;
		}): Promise<ActiveContextRecord> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const context = await repository.getActiveContext(
					input.contextId,
					input.sessionId
				);
				if (!context || context.expiresAt <= options.clock()) {
					throw new TenancyError(
						"context_expired",
						"Active context is missing or expired"
					);
				}
				if (context.authUserId !== input.authUserId) {
					throw new TenancyError(
						"wrong_tenant",
						"Active context belongs to another user"
					);
				}
				const membership = activeMembership(
					await repository.getMembershipForOrganization(
						input.authUserId,
						context.organizationId
					)
				);
				if (membership.tenantId !== context.tenantId) {
					throw new TenancyError(
						"wrong_tenant",
						"Active membership belongs to another tenant"
					);
				}
				await requireOperationalScope(
					repository,
					context.tenantId,
					context.organizationId,
					context.locationId ?? undefined
				);
				return context;
			});
		},

		resolveAuthorizationState(input: {
			authUserId: string;
			contextId: string;
			sessionId: string;
		}): Promise<TenancyAuthorizationState | null> {
			return options.unitOfWork.execute(async ({ repository }) => {
				const context = await repository.getActiveContext(
					input.contextId,
					input.sessionId
				);
				if (!context || context.authUserId !== input.authUserId) {
					return null;
				}
				const membership = await repository.getMembershipForOrganization(
					input.authUserId,
					context.organizationId
				);
				const roleAssignments = membership
					? await repository.listRoleAssignments(
							context.tenantId,
							membership.id
						)
					: [];
				const assignments = await Promise.all(
					roleAssignments.map(async (assignment) => ({
						assignment,
						role: await repository.getRole(context.tenantId, assignment.roleId),
					}))
				);
				const delegation = context.delegationId
					? await repository.getDelegation(
							context.tenantId,
							context.delegationId
						)
					: null;
				return { assignments, context, delegation, membership };
			});
		},

		setActiveContext(input: {
			authUserId: string;
			branchId?: string;
			idempotencyKey: string;
			legalEntityId?: string;
			locationId?: string;
			organizationId: string;
			partyId?: string;
			sessionId: string;
		}): Promise<ActiveContextRecord> {
			return options.unitOfWork.execute(async ({ repository }) => {
				if (input.legalEntityId || input.branchId) {
					throw new TenancyError(
						"not_found",
						"Legal-entity and branch context are not implemented in PR3"
					);
				}
				const membership = activeMembership(
					await repository.getMembershipForOrganization(
						input.authUserId,
						input.organizationId
					)
				);
				await requireOperationalScope(
					repository,
					membership.tenantId,
					input.organizationId,
					input.locationId
				);
				const now = options.clock();
				const context = await repository.issueActiveContext({
					authUserId: input.authUserId,
					branchId: input.branchId,
					contextId: options.ids.create("active-context"),
					expiresAt: new Date(now.getTime() + options.contextTtlMs),
					idempotencyKey: input.idempotencyKey,
					issuedAt: now,
					legalEntityId: input.legalEntityId,
					locationId: input.locationId,
					organizationId: input.organizationId,
					partyId: input.partyId,
					sessionId: input.sessionId,
					tenantId: membership.tenantId,
				});
				if (
					context.authUserId !== input.authUserId ||
					context.organizationId !== input.organizationId ||
					(context.locationId ?? undefined) !== input.locationId ||
					(context.legalEntityId ?? undefined) !== input.legalEntityId ||
					(context.branchId ?? undefined) !== input.branchId
				) {
					throw new TenancyError(
						"idempotency_conflict",
						"The idempotency key is already bound to another active context"
					);
				}
				return context;
			});
		},

		suspendMembership(input: {
			actorUserId: string;
			correlationId: string;
			idempotencyKey: string;
			membershipId: string;
			reason: string;
			revokeSessionsWhenNoActiveMembershipsRemain: boolean;
			tenantId: string;
			targetAuthUserId: string;
			version: number;
		}): Promise<MembershipRecord> {
			return options.unitOfWork.execute(async ({ events, repository }) => {
				const requestFingerprint = commandFingerprint({
					membershipId: input.membershipId,
					reason: input.reason,
					revokeSessionsWhenNoActiveMembershipsRemain:
						input.revokeSessionsWhenNoActiveMembershipsRemain,
					targetAuthUserId: input.targetAuthUserId,
					version: input.version,
				});
				const receiptKey = {
					idempotencyKey: input.idempotencyKey,
					operation: "membership.suspend" as const,
					requestFingerprint,
					resourceId: input.membershipId,
					tenantId: input.tenantId,
				};
				const replayed = await replayCommandReceipt<MembershipRecord>(
					repository,
					receiptKey
				);
				if (replayed) {
					return replayed;
				}
				const current = await requireOwnedMembership(
					repository,
					input.tenantId,
					input.membershipId,
					input.targetAuthUserId
				);
				if (current.state === "Suspended") {
					return (await recordCommandResult(repository, receiptKey, current))
						.result;
				}
				const suspended = await repository.suspendMembership({
					membershipId: input.membershipId,
					reason: input.reason,
					tenantId: input.tenantId,
					version: input.version,
				});
				if (suspended === "version_conflict") {
					const concurrentResult = await replayCommandReceipt<MembershipRecord>(
						repository,
						receiptKey
					);
					if (concurrentResult) {
						return concurrentResult;
					}
					throw new TenancyError(
						"version_conflict",
						"Membership version changed"
					);
				}
				const recorded = await recordCommandResult(
					repository,
					receiptKey,
					suspended
				);
				if (!recorded.inserted) {
					return recorded.result;
				}
				const now = options.clock();
				const event = eventBase({
					actorId: input.actorUserId,
					aggregateId: suspended.id,
					correlationId: input.correlationId,
					eventId: options.ids.create("event"),
					idempotencyKey: input.idempotencyKey,
					name: "platform.membership.suspended.v1",
					now,
					organizationId: suspended.organizationId,
					schemaRef:
						"schemas/events/platform.membership.suspended.v1.schema.json",
					tenantId: suspended.tenantId,
				});
				event.data = {
					authUserId: suspended.authUserId,
					membershipId: suspended.id,
					organizationId: suspended.organizationId,
					reasonCode: "tenant_administrator_suspension",
					sessionRevocationRequested:
						input.revokeSessionsWhenNoActiveMembershipsRemain,
					suspendedAt: now.toISOString(),
				};
				await events.append(event);
				return suspended;
			});
		},

		async updateOrganization(input: {
			authUserId: string;
			contextId: string;
			idempotencyKey: string;
			locale?: string;
			name?: string;
			organizationId: string;
			sessionId: string;
			timezone?: string;
			version: number;
		}): Promise<OrganizationRecord> {
			const context = await this.requireContext(input);
			if (context.organizationId !== input.organizationId) {
				throw new TenancyError(
					"wrong_tenant",
					"Organization is outside the active context"
				);
			}
			return options.unitOfWork.execute(async ({ repository }) => {
				const requestFingerprint = commandFingerprint({
					locale: input.locale ?? null,
					name: input.name ?? null,
					timezone: input.timezone ?? null,
					version: input.version,
				});
				const receiptKey = {
					idempotencyKey: input.idempotencyKey,
					operation: "organization.update" as const,
					requestFingerprint,
					resourceId: input.organizationId,
					tenantId: context.tenantId,
				};
				const replayed = await replayCommandReceipt<OrganizationRecord>(
					repository,
					receiptKey
				);
				if (replayed) {
					return replayed;
				}
				const updated = await repository.updateOrganization({
					locale: input.locale,
					name: input.name,
					organizationId: input.organizationId,
					tenantId: context.tenantId,
					timezone: input.timezone,
					version: input.version,
				});
				if (updated === "version_conflict") {
					const concurrentResult =
						await replayCommandReceipt<OrganizationRecord>(
							repository,
							receiptKey
						);
					if (concurrentResult) {
						return concurrentResult;
					}
					throw new TenancyError(
						"version_conflict",
						"Organization version changed"
					);
				}
				return (await recordCommandResult(repository, receiptKey, updated))
					.result;
			});
		},
	};
}

export interface IdentityDirectoryView {
	findUsers: (authUserIds: readonly string[]) => Promise<
		{
			authenticationState: "Active" | "Suspended";
			authUserId: string;
			displayName: string;
			email: string;
		}[]
	>;
}

export interface IdentityProjectionPort {
	projectInvitation: (input: {
		email: string;
		expiresAt: Date;
		invitationId: string;
		inviterAuthUserId: string;
		organizationId: string;
	}) => Promise<void>;
	projectOrganization: (input: {
		canonicalOrganizationId: string;
		name: string;
		tenantId: string;
	}) => Promise<void>;
	removeMembership: (membershipId: string) => Promise<void>;
}

export interface TenancyApplicationOptions {
	directory: IdentityDirectoryView;
	permissions: PermissionDecisionPort;
	projection: IdentityProjectionPort;
	service: ReturnType<typeof createTenancyService>;
}

export function createTenancyApplication(options: TenancyApplicationOptions) {
	return {
		async createRoleAssignment(input: {
			actorUserId: string;
			body: CreateRoleAssignmentRequest;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await options.service.requireContext({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			const targetMembership =
				await options.service.getMembershipForAdministration({
					membershipId: input.body.membershipId,
					tenantId: context.tenantId,
				});
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.actorUserId,
				contextId: input.contextId,
				permission: "platform.role.assign",
				resourceScope: {
					scopeId: targetMembership.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.actorUserId,
				contextId: input.contextId,
				permission: "platform.role.assign",
				resourceScope: {
					scopeId: input.body.scopeId ?? undefined,
					scopeType: input.body.scopeType,
				},
				sessionId: input.sessionId,
			});
			const assignment = await options.service.grantRoleAssignment({
				actorUserId: input.actorUserId,
				body: {
					endsAt: input.body.endsAt ? new Date(input.body.endsAt) : undefined,
					membershipId: input.body.membershipId,
					roleId: input.body.roleId,
					scopeId: input.body.scopeId ?? undefined,
					scopeType: input.body.scopeType,
					startsAt: new Date(input.body.startsAt),
				},
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				tenantId: context.tenantId,
			});
			return {
				...assignment,
				endsAt: assignment.endsAt?.toISOString() ?? null,
				startsAt: assignment.startsAt.toISOString(),
			};
		},
		getCurrentIdentity(input: {
			activeContextId?: string;
			assuranceLevel: CurrentIdentity["assuranceLevel"];
			authUserId: string;
			sessionId: string;
		}) {
			return options.service.getCurrentIdentity(input);
		},

		async getOrganization(input: {
			authUserId: string;
			contextId: string;
			organizationId: string;
			sessionId: string;
		}) {
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.organization.read",
				resourceScope: {
					scopeId: input.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			return options.service.getOrganization(input);
		},

		async inviteUser(input: {
			actorUserId: string;
			body: CreateUserInvitationRequest;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await options.service.requireContext({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.actorUserId,
				contextId: input.contextId,
				permission: "platform.user.invite",
				resourceScope: {
					scopeId: input.body.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			const invitation = await options.service.createInvitation({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				email: input.body.email,
				expiresAt: input.body.expiresAt
					? new Date(input.body.expiresAt)
					: undefined,
				idempotencyKey: input.idempotencyKey,
				organizationId: input.body.organizationId,
				partyId: input.body.partyId ?? undefined,
				roleIds: input.body.roleIds,
				tenantId: context.tenantId,
			});
			try {
				await options.projection.projectInvitation({
					email: invitation.email,
					expiresAt: invitation.expiresAt,
					invitationId: invitation.id,
					inviterAuthUserId: input.actorUserId,
					organizationId: invitation.organizationId,
				});
			} catch (error) {
				throw dependencyUnavailable(
					"Identity invitation projection is unavailable",
					error
				);
			}
			return {
				createdAt: invitation.createdAt.toISOString(),
				email: invitation.email,
				expiresAt: invitation.expiresAt.toISOString(),
				failureCode: invitation.failureCode ?? null,
				id: invitation.id,
				organizationId: invitation.organizationId,
				state: invitation.state,
				tenantId: invitation.tenantId,
			};
		},

		async listLocations(input: {
			authUserId: string;
			contextId: string;
			organizationId: string;
			page: PageRequest;
			sessionId: string;
		}) {
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.organization.read",
				resourceScope: {
					scopeId: input.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			return options.service.listLocations(input);
		},

		async listOrganizations(input: {
			authUserId: string;
			contextId: string;
			page: PageRequest;
			sessionId: string;
		}) {
			const context = await options.service.requireContext(input);
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.organization.read",
				resourceScope: {
					scopeId: context.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			return options.service.listOrganizations({
				authUserId: input.authUserId,
				page: input.page,
				tenantId: context.tenantId,
			});
		},

		async listRoles(input: {
			authUserId: string;
			contextId: string;
			page: PageRequest;
			sessionId: string;
		}) {
			const context = await options.service.requireContext(input);
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.role.read",
				sessionId: input.sessionId,
			});
			return options.service.listRoles({
				page: input.page,
				tenantId: context.tenantId,
			});
		},

		async listUsers(input: {
			authUserId: string;
			contextId: string;
			page: PageRequest;
			sessionId: string;
		}): Promise<Page<UserSummary>> {
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.user.read",
				sessionId: input.sessionId,
			});
			const memberships = await options.service.listTenantMemberships(input);
			const users = await options.directory.findUsers(
				memberships.items.map((membership) => membership.authUserId)
			);
			const byId = new Map(users.map((user) => [user.authUserId, user]));
			return {
				items: users.map((user) => ({
					authenticationState: user.authenticationState,
					authUserId: user.authUserId,
					displayName: user.displayName,
					email: user.email,
					memberships: memberships.items
						.filter((membership) => membership.authUserId === user.authUserId)
						.map(toMembershipSummary),
					partyId: null,
				})),
				nextCursor:
					memberships.nextCursor && byId.size > 0
						? memberships.nextCursor
						: null,
			};
		},

		async setActiveContext(input: {
			authUserId: string;
			body: ActiveContextRequest;
			idempotencyKey: string;
			sessionId: string;
		}) {
			const context = await options.service.setActiveContext({
				authUserId: input.authUserId,
				branchId: input.body.branchId ?? undefined,
				idempotencyKey: input.idempotencyKey,
				legalEntityId: input.body.legalEntityId ?? undefined,
				locationId: input.body.locationId ?? undefined,
				organizationId: input.body.organizationId,
				sessionId: input.sessionId,
			});
			return {
				...context,
				expiresAt: context.expiresAt.toISOString(),
				issuedAt: context.issuedAt.toISOString(),
			};
		},

		async suspendMembership(input: {
			actorUserId: string;
			body: SuspendTenantMembershipRequest;
			contextId: string;
			correlationId: string;
			idempotencyKey: string;
			sessionId: string;
			targetAuthUserId: string;
		}) {
			const context = await options.service.requireContext({
				authUserId: input.actorUserId,
				contextId: input.contextId,
				sessionId: input.sessionId,
			});
			const targetMembership =
				await options.service.getMembershipForAdministration({
					membershipId: input.body.membershipId,
					tenantId: context.tenantId,
				});
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.actorUserId,
				contextId: input.contextId,
				permission: "platform.user.suspend",
				resourceScope: {
					scopeId: targetMembership.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			const membership = await options.service.suspendMembership({
				actorUserId: input.actorUserId,
				correlationId: input.correlationId,
				idempotencyKey: input.idempotencyKey,
				membershipId: input.body.membershipId,
				reason: input.body.reason,
				revokeSessionsWhenNoActiveMembershipsRemain:
					input.body.revokeSessionsWhenNoActiveMembershipsRemain,
				targetAuthUserId: input.targetAuthUserId,
				tenantId: context.tenantId,
				version: input.body.version,
			});
			let user:
				| Awaited<ReturnType<IdentityDirectoryView["findUsers"]>>[number]
				| undefined;
			try {
				await options.projection.removeMembership(membership.id);
				[user] = await options.directory.findUsers([membership.authUserId]);
			} catch (error) {
				throw dependencyUnavailable(
					"Identity membership projection is unavailable",
					error
				);
			}
			if (!user) {
				throw new TenancyError(
					"not_found",
					"Authentication account was not found"
				);
			}
			return {
				authenticationState: user.authenticationState,
				authUserId: user.authUserId,
				displayName: user.displayName,
				email: user.email,
				memberships: [toMembershipSummary(membership)],
				partyId: null,
			};
		},

		async updateOrganization(input: {
			authUserId: string;
			body: UpdateOrganizationRequest;
			contextId: string;
			idempotencyKey: string;
			organizationId: string;
			sessionId: string;
		}) {
			await options.permissions.requirePermission({
				assuranceLevel: "aal1",
				authUserId: input.authUserId,
				contextId: input.contextId,
				permission: "platform.organization.update",
				resourceScope: {
					scopeId: input.organizationId,
					scopeType: "Organization",
				},
				sessionId: input.sessionId,
			});
			const organization = await options.service.updateOrganization({
				authUserId: input.authUserId,
				contextId: input.contextId,
				idempotencyKey: input.idempotencyKey,
				locale: input.body.locale,
				name: input.body.name,
				organizationId: input.organizationId,
				sessionId: input.sessionId,
				timezone: input.body.timezone,
				version: input.body.version,
			});
			try {
				await options.projection.projectOrganization({
					canonicalOrganizationId: organization.id,
					name: organization.name,
					tenantId: organization.tenantId,
				});
			} catch (error) {
				throw dependencyUnavailable(
					"Identity organization projection is unavailable",
					error
				);
			}
			return organization;
		},
	};
}
