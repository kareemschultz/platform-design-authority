import type {
	ActiveContext,
	ActiveContextRequest,
	CreateOrganizationParty,
	CreatePartyIdentityLinkRequest,
	CreatePersonParty,
	CreateUserInvitationRequest,
	CurrentIdentity,
	Location,
	Organization,
	Party,
	PlatformIdentityLink,
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
		correlationId: string;
		idempotencyKey: string;
		tenantId: string;
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
		page: { cursor?: string; limit: number };
	}) => Promise<Page<Organization>>;
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
		correlationId: string;
		idempotencyKey: string;
		targetAuthUserId: string;
		tenantId: string;
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

export interface ServerApplication
	extends PartyApplication,
		TenancyApplication {}

export interface PermissionAuthorizer {
	can: (input: {
		authUserId: string;
		permission: string;
		tenantId?: string;
	}) => Promise<boolean>;
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
