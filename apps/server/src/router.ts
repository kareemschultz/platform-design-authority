import {
	createUserInvitationContract,
	getCurrentIdentityContract,
	getOrganizationContract,
	listLocationsContract,
	listOrganizationsContract,
	listUsersContract,
	setActiveContextContract,
	suspendTenantMembershipContract,
	updateOrganizationContract,
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
	permission: string,
	tenantId?: string
) {
	const session = requireSession(context);
	const allowed = await context.authorizer.can({
		authUserId: session.user.id,
		permission,
		...(tenantId ? { tenantId } : {}),
	});
	if (!allowed) {
		throw new ORPCError("FORBIDDEN", {
			data: problem(context, {
				code: "authorization",
				status: 403,
				title: "Permission denied",
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
	if (code === "version_conflict" || code === "idempotency_conflict") {
		throw new ORPCError("CONFLICT", {
			data: problem(context, {
				code: "conflict",
				retryable: code === "version_conflict",
				status: 409,
				title: "Request conflicts with current state",
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
		const session = await requirePermission(
			context,
			"platform.organization.read"
		);
		try {
			return await context.application.listOrganizations({
				authUserId: session.user.id,
				page: input.query,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getOrganization = implement(getOrganizationContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.read",
			activeContext.tenantId
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
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.update",
			activeContext.tenantId
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
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.organization.read",
			activeContext.tenantId
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
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.user.read",
			activeContext.tenantId
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
		const { tenantId } = activeContext;
		if (input.body.organizationId !== activeContext.organizationId) {
			throw new ORPCError("FORBIDDEN", {
				data: problem(context, {
					code: "authorization",
					status: 403,
					title: "Tenant context denied",
				}),
			});
		}
		await requirePermission(context, "platform.user.invite", tenantId);
		try {
			return await context.application.inviteUser({
				actorUserId: session.user.id,
				body: input.body,
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				tenantId,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const suspendMembership = implement(suspendTenantMembershipContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		const { tenantId } = activeContext;
		await requirePermission(context, "platform.user.suspend", tenantId);
		try {
			return await context.application.suspendMembership({
				actorUserId: session.user.id,
				body: input.body,
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				targetAuthUserId: input.params.userId,
				tenantId,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

export const appRouter = {
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
	privateData: protectedProcedure.handler(({ context }) => ({
		message: "This is private",
		user: context.session.user,
	})),
	users: {
		invite: inviteUser,
		list: listUsers,
		suspendMembership,
	},
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
