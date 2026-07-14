import type { PermissionId } from "@meridian/contracts-permissions";
import type {
	ActiveContext,
	ActiveContextRequest,
	AuthorizationDecision,
	CreateOrganizationParty,
	CreatePartyIdentityLinkRequest,
	CreatePersonParty,
	CreateRoleAssignmentRequest,
	CreateUserInvitationRequest,
	CurrentIdentity,
	Entitlement,
	Location,
	Organization,
	Party,
	PlatformIdentityLink,
	Role,
	RoleAssignment,
	SuspendTenantMembershipRequest,
	UpdateOrganizationRequest,
	UpdatePartyRequest,
	UserInvitation,
	UserSummary,
} from "@meridian/contracts-platform-api";
import type { Context as HonoContext } from "hono";

export interface IdentitySessionService {
	getSession: (input: { headers: Headers }) => Promise<IdentitySession | null>;
}

export interface IdentitySession {
	session: {
		createdAt: Date;
		expiresAt: Date;
		id: string;
		token: string;
		updatedAt: Date;
		userId: string;
		[key: string]: unknown;
	};
	user: {
		createdAt: Date;
		email: string;
		emailVerified: boolean;
		id: string;
		image?: string | null;
		name: string;
		updatedAt: Date;
		[key: string]: unknown;
	};
}

export interface CreateContextOptions {
	application: ServerApplication;
	authorizer: PermissionAuthorizer;
	context: HonoContext;
	identity: IdentitySessionService;
}

export interface Page<T> {
	items: T[];
	nextCursor: string | null;
}

export interface TenancyApplication {
	createRoleAssignment: (input: {
		actorUserId: string;
		body: CreateRoleAssignmentRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<RoleAssignment>;
	getCurrentIdentity: (input: {
		activeContextId?: string;
		assuranceLevel: CurrentIdentity["assuranceLevel"];
		authUserId: string;
		sessionId: string;
	}) => Promise<CurrentIdentity>;
	getOrganization: (input: {
		authUserId: string;
		contextId: string;
		organizationId: string;
		sessionId: string;
	}) => Promise<Organization>;
	inviteUser: (input: {
		actorUserId: string;
		body: CreateUserInvitationRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<UserInvitation>;
	listLocations: (input: {
		authUserId: string;
		contextId: string;
		organizationId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Location>>;
	listOrganizations: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Organization>>;
	listRoles: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Role>>;
	listUsers: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<UserSummary>>;
	setActiveContext: (input: {
		authUserId: string;
		body: ActiveContextRequest;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<ActiveContext>;
	suspendMembership: (input: {
		actorUserId: string;
		body: SuspendTenantMembershipRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		targetAuthUserId: string;
	}) => Promise<UserSummary>;
	updateOrganization: (input: {
		authUserId: string;
		body: UpdateOrganizationRequest;
		contextId: string;
		idempotencyKey: string;
		organizationId: string;
		sessionId: string;
	}) => Promise<Organization>;
}

export interface PartyApplication {
	createIdentityLink: (input: {
		actorUserId: string;
		body: CreatePartyIdentityLinkRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<PlatformIdentityLink>;
	createOrganizationParty: (input: {
		actorUserId: string;
		body: CreateOrganizationParty;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Party>;
	createPersonParty: (input: {
		actorUserId: string;
		body: CreatePersonParty;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Party>;
	getParty: (input: {
		authUserId: string;
		contextId: string;
		partyId: string;
		sessionId: string;
	}) => Promise<Party>;
	listParties: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number; query?: string };
		sessionId: string;
	}) => Promise<Page<Party>>;
	updateParty: (input: {
		actorUserId: string;
		body: UpdatePartyRequest;
		contextId: string;
		idempotencyKey: string;
		partyId: string;
		sessionId: string;
	}) => Promise<Party>;
}

export interface EntitlementsApplication {
	listEntitlements: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Entitlement>>;
}

export interface ServerApplication
	extends EntitlementsApplication,
		PartyApplication,
		TenancyApplication {}

export interface PermissionAuthorizer {
	decide: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PermissionId;
		resourceScope?: {
			scopeId?: string;
			scopeType:
				| "Tenant"
				| "Organization"
				| "LegalEntity"
				| "Branch"
				| "Location";
		};
		sessionId: string;
	}) => Promise<AuthorizationDecision>;
	requirePermission: PermissionAuthorizer["decide"];
}

export async function createContext({
	application,
	authorizer,
	context,
	identity,
}: CreateContextOptions) {
	const session = await identity.getSession({
		headers: context.req.raw.headers,
	});
	return {
		application,
		authorizer,
		correlationId: crypto.randomUUID(),
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
