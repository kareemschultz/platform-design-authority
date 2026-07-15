import type { PermissionId } from "@meridian/contracts-permissions";
import {
	activateProductContract,
	archiveProductContract,
	createOrganizationPartyContract,
	createPartyIdentityLinkContract,
	createPersonPartyContract,
	createProductContract,
	createRoleAssignmentContract,
	createUserInvitationContract,
	getCurrentIdentityContract,
	getOrganizationContract,
	getPartyContract,
	getProductContract,
	listAuditRecordsContract,
	listCurrentUserSessionsContract,
	listEntitlementsContract,
	listLocationsContract,
	listOrganizationsContract,
	listPartiesContract,
	listProductsContract,
	listRolesContract,
	listUsersContract,
	revokeCurrentUserSessionContract,
	setActiveContextContract,
	suspendTenantMembershipContract,
	updateOrganizationContract,
	updatePartyContract,
	updateProductContract,
} from "@meridian/contracts-platform-api";
import type { RouterClient } from "@orpc/server";
import { implement, ORPCError } from "@orpc/server";

import type { Context } from "./context";
import { protectedProcedure, publicProcedure } from "./procedures";

type ProblemCode =
	| "authentication"
	| "authorization"
	| "conflict"
	| "dependency_unavailable"
	| "entitlement"
	| "internal_failure"
	| "state_transition"
	| "validation";

function problem(
	context: Context,
	input: {
		code: ProblemCode;
		detail?: string;
		nextAction?:
			| "retry"
			| "reauthenticate"
			| "step_up"
			| "request_approval"
			| "contact_support";
		retryable?: boolean;
		status: number;
		title: string;
	}
) {
	return {
		code: input.code,
		correlationId: context.correlationId,
		detail: input.detail ?? null,
		nextAction: input.nextAction ?? null,
		retryable: input.retryable ?? false,
		safeMessageKey: `problem.${input.code}`,
		status: input.status,
		title: input.title,
		type: `https://problems.example.invalid/${input.code}`,
		uncertainty: input.code === "dependency_unavailable",
	};
}

function requireSession(context: Context) {
	if (!context.session?.user) {
		throw new ORPCError("UNAUTHORIZED", {
			data: problem(context, {
				code: "authentication",
				nextAction: "reauthenticate",
				status: 401,
				title: "Authentication required",
			}),
		});
	}
	return context.session;
}

async function requirePermission(
	context: Context,
	permission: PermissionId,
	contextId: string,
	resourceScope?: {
		scopeId?: string;
		scopeType:
			| "Tenant"
			| "Organization"
			| "LegalEntity"
			| "Branch"
			| "Location";
	}
) {
	const session = requireSession(context);
	const decision = await context.authorizer.decide({
		assuranceLevel: "aal1",
		authUserId: session.user.id,
		contextId,
		permission,
		...(resourceScope ? { resourceScope } : {}),
		sessionId: session.session.id,
	});
	if (decision.outcome !== "allow") {
		let nextAction: "request_approval" | "step_up" | undefined;
		let title = "Permission denied";
		if (decision.outcome === "require_approval") {
			nextAction = "request_approval";
			title = "Approval required";
		} else if (decision.outcome === "require_step_up") {
			nextAction = "step_up";
			title = "Stronger authentication required";
		}
		throw new ORPCError("FORBIDDEN", {
			data: problem(context, {
				code: "authorization",
				...(nextAction ? { nextAction } : {}),
				status: 403,
				title,
			}),
		});
	}
	return session;
}

async function requireActiveIdentity(context: Context, contextId: string) {
	const session = requireSession(context);
	const identity = await context.application.getCurrentIdentity({
		activeContextId: contextId,
		assuranceLevel: "aal1",
		authUserId: session.user.id,
		sessionId: session.session.id,
	});
	if (!identity.activeContext) {
		throw new ORPCError("FORBIDDEN", {
			data: problem(context, {
				code: "authorization",
				status: 403,
				title: "Active membership context required",
			}),
		});
	}
	return { activeContext: identity.activeContext, identity, session };
}

function mapApplicationError(context: Context, error: unknown): never {
	if (error instanceof ORPCError) {
		throw error;
	}
	const code =
		typeof error === "object" && error !== null && "code" in error
			? String(error.code)
			: "";
	if (code === "not_found") {
		throw new ORPCError("NOT_FOUND", {
			data: problem(context, {
				code: "state_transition",
				status: 404,
				title: "Resource not found",
			}),
		});
	}
	if (
		code === "version_conflict" ||
		code === "idempotency_conflict" ||
		code === "identity_link_conflict" ||
		code === "identifier_conflict"
	) {
		throw new ORPCError("CONFLICT", {
			data: problem(context, {
				code: "conflict",
				retryable: code === "version_conflict",
				status: 409,
				title: "Request conflicts with current state",
			}),
		});
	}
	if (code === "invalid_identifier" || code === "invalid_reference") {
		throw new ORPCError("BAD_REQUEST", {
			data: problem(context, {
				code: "validation",
				status: 400,
				title:
					code === "invalid_reference"
						? "Catalog child reference is invalid"
						: "Identifier is invalid",
			}),
		});
	}
	if (code === "invalid_state") {
		throw new ORPCError("CONFLICT", {
			data: problem(context, {
				code: "state_transition",
				status: 409,
				title: "State transition is not allowed",
			}),
		});
	}
	if (code === "dependency_unavailable") {
		throw new ORPCError("SERVICE_UNAVAILABLE", {
			data: problem(context, {
				code: "dependency_unavailable",
				nextAction: "retry",
				retryable: true,
				status: 503,
				title: "Dependency temporarily unavailable",
			}),
		});
	}
	if (
		code === "authorization_denied" ||
		code === "wrong_tenant" ||
		code === "membership_inactive" ||
		code === "context_expired"
	) {
		throw new ORPCError("FORBIDDEN", {
			data: problem(context, {
				code: "authorization",
				status: 403,
				title: "Tenant context denied",
			}),
		});
	}
	if (code === "entitlement_denied") {
		throw new ORPCError("FORBIDDEN", {
			data: problem(context, {
				code: "entitlement",
				status: 403,
				title: "Capability entitlement denied",
			}),
		});
	}
	throw new ORPCError("INTERNAL_SERVER_ERROR", {
		cause: error,
		data: problem(context, {
			code: "internal_failure",
			nextAction: "contact_support",
			status: 500,
			title: "Request failed",
		}),
	});
}

const currentIdentity = implement(getCurrentIdentityContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const session = requireSession(context);
		try {
			return await context.application.getCurrentIdentity({
				activeContextId: input.headers["x-active-context-id"],
				assuranceLevel: "aal1",
				authUserId: session.user.id,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const setActiveContext = implement(setActiveContextContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const session = requireSession(context);
		try {
			return await context.application.setActiveContext({
				authUserId: session.user.id,
				body: input.body,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listOrganizations = implement(listOrganizationsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listOrganizations({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getOrganization = implement(getOrganizationContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.read",
			input.headers["x-active-context-id"],
			{ scopeId: input.params.organizationId, scopeType: "Organization" }
		);
		try {
			return await context.application.getOrganization({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				organizationId: input.params.organizationId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const updateOrganization = implement(updateOrganizationContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.update",
			input.headers["x-active-context-id"],
			{ scopeId: input.params.organizationId, scopeType: "Organization" }
		);
		try {
			return await context.application.updateOrganization({
				authUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				idempotencyKey: input.headers["idempotency-key"],
				organizationId: input.params.organizationId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listLocations = implement(listLocationsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.read",
			input.headers["x-active-context-id"],
			{ scopeId: input.query.organizationId, scopeType: "Organization" }
		);
		try {
			return await context.application.listLocations({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				organizationId: input.query.organizationId,
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listUsers = implement(listUsersContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.user.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listUsers({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const inviteUser = implement(createUserInvitationContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		if (input.body.organizationId !== activeContext.organizationId) {
			throw new ORPCError("FORBIDDEN", {
				data: problem(context, {
					code: "authorization",
					status: 403,
					title: "Tenant context denied",
				}),
			});
		}
		await requirePermission(
			context,
			"platform.user.invite",
			input.headers["x-active-context-id"],
			{ scopeId: input.body.organizationId, scopeType: "Organization" }
		);
		try {
			return await context.application.inviteUser({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const suspendMembership = implement(suspendTenantMembershipContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.user.suspend",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.suspendMembership({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				targetAuthUserId: input.params.userId,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listRoles = implement(listRolesContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.role.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listRoles({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createRoleAssignment = implement(createRoleAssignmentContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.role.assign",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createRoleAssignment({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listParties = implement(listPartiesContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listParties({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getParty = implement(getPartyContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getParty({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				partyId: input.params.partyId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createPersonParty = implement(createPersonPartyContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createPersonParty({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createOrganizationParty = implement(createOrganizationPartyContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createOrganizationParty({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const updateParty = implement(updatePartyContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.update",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.updateParty({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				idempotencyKey: input.headers["idempotency-key"],
				partyId: input.params.partyId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createPartyIdentityLink = implement(createPartyIdentityLinkContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"party.record.update",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createIdentityLink({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listProducts = implement(listProductsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listProducts({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getProduct = implement(getProductContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getProduct({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				productId: input.params.productId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createProduct = implement(createProductContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createProduct({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const updateProduct = implement(updateProductContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.update",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.updateProduct({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				productId: input.params.productId,
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const activateProduct = implement(activateProductContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.activate",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.activateProduct({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				productId: input.params.productId,
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const archiveProduct = implement(archiveProductContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.product.archive",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.archiveProduct({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				productId: input.params.productId,
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listEntitlements = implement(listEntitlementsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.entitlement.read",
			input.headers["x-active-context-id"],
			{ scopeType: "Tenant" }
		);
		try {
			return await context.application.listEntitlements({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listCurrentUserSessions = implement(listCurrentUserSessionsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const session = requireSession(context);
		try {
			return await context.application.listCurrentUserSessions({
				authUserId: session.user.id,
				currentSessionId: session.session.id,
				page: input.query,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const revokeCurrentUserSession = implement(revokeCurrentUserSessionContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const session = requireSession(context);
		try {
			await context.application.revokeCurrentUserSession({
				authUserId: session.user.id,
				correlationId: context.correlationId,
				currentSessionId: session.session.id,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: input.params.sessionId,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listAuditRecords = implement(listAuditRecordsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.audit.read",
			input.headers["x-active-context-id"]
		);
		try {
			const { occurredAfter, occurredBefore, ...query } = input.query;
			return await context.application.listAuditRecords({
				actorUserId: session.user.id,
				correlationId: context.correlationId,
				page: {
					...query,
					...(occurredAfter ? { occurredAfter: new Date(occurredAfter) } : {}),
					...(occurredBefore
						? { occurredBefore: new Date(occurredBefore) }
						: {}),
					tenantId: activeContext.tenantId,
				},
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

export const appRouter = {
	audit: { list: listAuditRecords },
	catalog: {
		products: {
			activate: activateProduct,
			archive: archiveProduct,
			create: createProduct,
			get: getProduct,
			list: listProducts,
			update: updateProduct,
		},
	},
	entitlements: { list: listEntitlements },
	healthCheck: publicProcedure.handler(() => "OK"),
	identity: {
		getCurrent: currentIdentity,
		setActiveContext,
	},
	organizations: {
		get: getOrganization,
		list: listOrganizations,
		listLocations,
		update: updateOrganization,
	},
	parties: {
		createIdentityLink: createPartyIdentityLink,
		createOrganization: createOrganizationParty,
		createPerson: createPersonParty,
		get: getParty,
		list: listParties,
		update: updateParty,
	},
	privateData: protectedProcedure.handler(({ context }) => ({
		message: "This is private",
		user: context.session.user,
	})),
	roles: {
		assign: createRoleAssignment,
		list: listRoles,
	},
	sessions: {
		list: listCurrentUserSessions,
		revoke: revokeCurrentUserSession,
	},
	users: {
		invite: inviteUser,
		list: listUsers,
		suspendMembership,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
