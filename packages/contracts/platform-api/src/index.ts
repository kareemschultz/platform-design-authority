import { oc } from "@orpc/contract";
import { z } from "zod";

import { OPENAPI_OPERATION_METADATA } from "./generated";
import {
	ActiveContextRequestSchema,
	ActiveContextSchema,
	CreateOrganizationPartySchema,
	CreatePartyIdentityLinkRequestSchema,
	CreatePersonPartySchema,
	CreateRoleAssignmentRequestSchema,
	CreateUserInvitationRequestSchema,
	CurrentIdentitySchema,
	IdentifierSchema,
	OrganizationSchema,
	PagedAuditRecordsSchema,
	PagedEntitlementsSchema,
	PagedLocationsSchema,
	PagedOrganizationsSchema,
	PagedPartiesSchema,
	PagedRolesSchema,
	PagedSessionsSchema,
	PagedUsersSchema,
	PartySchema,
	PlatformIdentityLinkSchema,
	ProblemSchema,
	RoleAssignmentSchema,
	SuspendTenantMembershipRequestSchema,
	UpdateOrganizationRequestSchema,
	UpdatePartyRequestSchema,
	UserInvitationSchema,
	UserSummarySchema,
} from "./schemas";

// biome-ignore lint/performance/noBarrelFile: this is the deliberate public contract-package entry point.
export * from "./generated";
export * from "./schemas";

export interface PlatformContractMeta {
	authorization?: "authenticated_session" | "authenticated_membership";
	operationId: string;
	permission?: string;
	requestRef?: string;
	responseRef?: string;
	successStatus: number;
}

const base = oc
	.$meta<PlatformContractMeta>({
		operationId: "",
		successStatus: 200,
	})
	.$route({ inputStructure: "detailed" })
	.errors({
		BAD_REQUEST: { data: ProblemSchema },
		CONFLICT: { data: ProblemSchema },
		FORBIDDEN: { data: ProblemSchema },
		INTERNAL_SERVER_ERROR: { data: ProblemSchema },
		NOT_FOUND: { data: ProblemSchema },
		SERVICE_UNAVAILABLE: { data: ProblemSchema },
		TOO_MANY_REQUESTS: { data: ProblemSchema },
		UNAUTHORIZED: { data: ProblemSchema },
	});

const PageQuerySchema = z.object({
	cursor: z.string().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(50),
});
const IdempotencyHeadersSchema = z.object({
	"idempotency-key": z.string().min(16).max(128),
});
const ActiveContextHeadersSchema = z.object({
	"x-active-context-id": IdentifierSchema.optional(),
});
const RequiredActiveContextHeadersSchema = z.object({
	"x-active-context-id": IdentifierSchema,
});
const TenantCommandHeadersSchema = IdempotencyHeadersSchema.extend({
	"x-active-context-id": IdentifierSchema,
});

export const getCurrentIdentityContract = base
	.route({ method: "GET", path: "/v1/me", successStatus: 200 })
	.meta({
		authorization: "authenticated_session",
		operationId: "getCurrentIdentity",
		responseRef: "#/components/schemas/CurrentIdentity",
		successStatus: 200,
	})
	.input(z.object({ headers: ActiveContextHeadersSchema }))
	.output(CurrentIdentitySchema);

export const listOrganizationsContract = base
	.route({ method: "GET", path: "/v1/organizations", successStatus: 200 })
	.meta({
		operationId: "listOrganizations",
		permission: "platform.organization.read",
		responseRef: "#/components/responses/PagedOrganizations",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema,
		})
	)
	.output(PagedOrganizationsSchema);

export const getOrganizationContract = base
	.route({
		method: "GET",
		path: "/v1/organizations/{organizationId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getOrganization",
		permission: "platform.organization.read",
		responseRef: "#/components/schemas/Organization",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ organizationId: IdentifierSchema }),
		})
	)
	.output(OrganizationSchema);

export const updateOrganizationContract = base
	.route({
		method: "PATCH",
		path: "/v1/organizations/{organizationId}",
		successStatus: 200,
	})
	.meta({
		operationId: "updateOrganization",
		permission: "platform.organization.update",
		requestRef: "#/components/schemas/UpdateOrganizationRequest",
		responseRef: "#/components/schemas/Organization",
		successStatus: 200,
	})
	.input(
		z.object({
			body: UpdateOrganizationRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ organizationId: IdentifierSchema }),
		})
	)
	.output(OrganizationSchema);

export const listLocationsContract = base
	.route({ method: "GET", path: "/v1/locations", successStatus: 200 })
	.meta({
		operationId: "listLocations",
		permission: "platform.organization.read",
		responseRef: "#/components/schemas/PagedLocations",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({ organizationId: IdentifierSchema }),
		})
	)
	.output(PagedLocationsSchema);

export const setActiveContextContract = base
	.route({
		method: "POST",
		path: "/v1/session/active-context",
		successStatus: 201,
	})
	.meta({
		authorization: "authenticated_membership",
		operationId: "setActiveContext",
		requestRef: "#/components/schemas/ActiveContextRequest",
		responseRef: "#/components/schemas/ActiveContext",
		successStatus: 201,
	})
	.input(
		z.object({
			body: ActiveContextRequestSchema,
			headers: IdempotencyHeadersSchema,
		})
	)
	.output(ActiveContextSchema);

export const listCurrentUserSessionsContract = base
	.route({ method: "GET", path: "/v1/sessions", successStatus: 200 })
	.meta({
		authorization: "authenticated_session",
		operationId: "listCurrentUserSessions",
		responseRef: "#/components/schemas/PagedSessions",
		successStatus: 200,
	})
	.input(z.object({ query: PageQuerySchema }))
	.output(PagedSessionsSchema);

export const revokeCurrentUserSessionContract = base
	.route({
		method: "DELETE",
		path: "/v1/sessions/{sessionId}",
		successStatus: 204,
	})
	.meta({
		authorization: "authenticated_session",
		operationId: "revokeCurrentUserSession",
		successStatus: 204,
	})
	.input(
		z.object({
			headers: IdempotencyHeadersSchema,
			params: z.object({ sessionId: IdentifierSchema }),
		})
	)
	.output(z.void());

export const listUsersContract = base
	.route({ method: "GET", path: "/v1/users", successStatus: 200 })
	.meta({
		operationId: "getUsers",
		permission: "platform.user.read",
		responseRef: "#/components/schemas/PagedUsers",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({ query: z.string().max(200).optional() }),
		})
	)
	.output(PagedUsersSchema);

export const createUserInvitationContract = base
	.route({ method: "POST", path: "/v1/users/invitations", successStatus: 202 })
	.meta({
		operationId: "postUsersInvitations",
		permission: "platform.user.invite",
		requestRef: "#/components/schemas/CreateUserInvitationRequest",
		responseRef: "#/components/schemas/UserInvitation",
		successStatus: 202,
	})
	.input(
		z.object({
			body: CreateUserInvitationRequestSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(UserInvitationSchema);

export const suspendTenantMembershipContract = base
	.route({
		method: "POST",
		path: "/v1/users/{userId}/suspend",
		successStatus: 200,
	})
	.meta({
		operationId: "suspendTenantMembership",
		permission: "platform.user.suspend",
		requestRef: "#/components/schemas/SuspendTenantMembershipRequest",
		responseRef: "#/components/schemas/UserSummary",
		successStatus: 200,
	})
	.input(
		z.object({
			body: SuspendTenantMembershipRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ userId: IdentifierSchema }),
		})
	)
	.output(UserSummarySchema);

export const listRolesContract = base
	.route({ method: "GET", path: "/v1/roles", successStatus: 200 })
	.meta({
		operationId: "getRoles",
		permission: "platform.role.read",
		responseRef: "#/components/schemas/PagedRoles",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema,
		})
	)
	.output(PagedRolesSchema);

export const createRoleAssignmentContract = base
	.route({ method: "POST", path: "/v1/role-assignments", successStatus: 201 })
	.meta({
		operationId: "postRoleAssignments",
		permission: "platform.role.assign",
		requestRef: "#/components/schemas/CreateRoleAssignmentRequest",
		responseRef: "#/components/schemas/RoleAssignment",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateRoleAssignmentRequestSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(RoleAssignmentSchema);

export const listEntitlementsContract = base
	.route({ method: "GET", path: "/v1/entitlements", successStatus: 200 })
	.meta({
		operationId: "getEntitlements",
		permission: "platform.entitlement.read",
		responseRef: "#/components/schemas/PagedEntitlements",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema,
		})
	)
	.output(PagedEntitlementsSchema);

export const listAuditRecordsContract = base
	.route({ method: "GET", path: "/v1/audit-records", successStatus: 200 })
	.meta({
		operationId: "getAuditRecords",
		permission: "platform.audit.read",
		responseRef: "#/components/schemas/PagedAuditRecords",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				action: z.string().max(200).optional(),
				actorUserId: IdentifierSchema.optional(),
				occurredAfter: z.iso.datetime({ offset: true }).optional(),
				occurredBefore: z.iso.datetime({ offset: true }).optional(),
			}),
		})
	)
	.output(PagedAuditRecordsSchema);

export const listPartiesContract = base
	.route({ method: "GET", path: "/v1/parties", successStatus: 200 })
	.meta({
		operationId: "listParties",
		permission: "party.record.read",
		responseRef: "#/components/schemas/PagedParties",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({ query: z.string().max(200).optional() }),
		})
	)
	.output(PagedPartiesSchema);

export const getPartyContract = base
	.route({ method: "GET", path: "/v1/parties/{partyId}", successStatus: 200 })
	.meta({
		operationId: "getParty",
		permission: "party.record.read",
		responseRef: "#/components/schemas/Party",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ partyId: IdentifierSchema }),
		})
	)
	.output(PartySchema);

export const createPersonPartyContract = base
	.route({ method: "POST", path: "/v1/parties/persons", successStatus: 201 })
	.meta({
		operationId: "createPersonParty",
		permission: "party.record.create",
		requestRef: "#/components/schemas/CreatePersonParty",
		responseRef: "#/components/schemas/Party",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreatePersonPartySchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(PartySchema);

export const createOrganizationPartyContract = base
	.route({
		method: "POST",
		path: "/v1/parties/organizations",
		successStatus: 201,
	})
	.meta({
		operationId: "postPartiesOrganizations",
		permission: "party.record.create",
		requestRef: "#/components/schemas/CreateOrganizationParty",
		responseRef: "#/components/schemas/Party",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateOrganizationPartySchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(PartySchema);

export const updatePartyContract = base
	.route({ method: "PATCH", path: "/v1/parties/{partyId}", successStatus: 200 })
	.meta({
		operationId: "patchPartiesByPartyId",
		permission: "party.record.update",
		requestRef: "#/components/schemas/UpdatePartyRequest",
		responseRef: "#/components/schemas/Party",
		successStatus: 200,
	})
	.input(
		z.object({
			body: UpdatePartyRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ partyId: IdentifierSchema }),
		})
	)
	.output(PartySchema);

export const createPartyIdentityLinkContract = base
	.route({
		method: "POST",
		path: "/v1/party-identity-links",
		successStatus: 201,
	})
	.meta({
		operationId: "createPartyIdentityLink",
		permission: "party.record.update",
		requestRef: "#/components/schemas/CreatePartyIdentityLinkRequest",
		responseRef: "#/components/schemas/PlatformIdentityLink",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreatePartyIdentityLinkRequestSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(PlatformIdentityLinkSchema);

export const platformApiContract = {
	audit: { list: listAuditRecordsContract },
	entitlements: { list: listEntitlementsContract },
	identity: {
		getCurrent: getCurrentIdentityContract,
		setActiveContext: setActiveContextContract,
	},
	organizations: {
		get: getOrganizationContract,
		list: listOrganizationsContract,
		listLocations: listLocationsContract,
		update: updateOrganizationContract,
	},
	parties: {
		createIdentityLink: createPartyIdentityLinkContract,
		createOrganization: createOrganizationPartyContract,
		createPerson: createPersonPartyContract,
		get: getPartyContract,
		list: listPartiesContract,
		update: updatePartyContract,
	},
	roles: {
		assign: createRoleAssignmentContract,
		list: listRolesContract,
	},
	sessions: {
		list: listCurrentUserSessionsContract,
		revoke: revokeCurrentUserSessionContract,
	},
	users: {
		invite: createUserInvitationContract,
		list: listUsersContract,
		suspendMembership: suspendTenantMembershipContract,
	},
};

/** Application-shell contract. The health probe is operational and is not a
 * governed first-slice business operation, so it stays outside the OpenAPI
 * parity set while sharing the same transport-neutral client shape. */
export const appApiContract = {
	healthCheck: oc.route({ method: "GET", path: "/" }).output(z.literal("OK")),
	privateData: oc.output(
		z.object({ message: z.literal("This is private"), user: z.unknown() })
	),
	...platformApiContract,
};

export const WS1_OPERATION_IDS = [
	"getAuditRecords",
	"getEntitlements",
	"listLocations",
	"getCurrentIdentity",
	"listOrganizations",
	"getOrganization",
	"updateOrganization",
	"listParties",
	"postPartiesOrganizations",
	"createPersonParty",
	"getParty",
	"patchPartiesByPartyId",
	"createPartyIdentityLink",
	"postRoleAssignments",
	"getRoles",
	"setActiveContext",
	"listCurrentUserSessions",
	"revokeCurrentUserSession",
	"getUsers",
	"postUsersInvitations",
	"suspendTenantMembership",
] as const;

export const WS1_OPENAPI_OPERATION_METADATA = OPENAPI_OPERATION_METADATA.filter(
	(operation) =>
		(WS1_OPERATION_IDS as readonly string[]).includes(operation.operationId)
);
