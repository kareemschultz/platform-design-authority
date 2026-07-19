import type { PermissionId } from "@meridian/contracts-permissions";
import {
	acceptOpeningStockImportContract,
	acceptProductImportContract,
	activateProductContract,
	approveCashVarianceContract,
	approveInventoryAdjustmentContract,
	approveOpeningStockImportContract,
	approveProductImportContract,
	approveRefundContract,
	approveReturnContract,
	approveSalePriceOverrideContract,
	approveStockCountContract,
	archiveProductContract,
	cancelOpeningStockImportContract,
	cancelProductImportContract,
	closeRegisterContract,
	completeSaleContract,
	confirmDepositContract,
	createAccountantHandoffExportContract,
	createCashMovementContract,
	createDepositContract,
	createEventReplayContract,
	createInventoryAdjustmentContract,
	createOpeningStockImportContract,
	createOrganizationPartyContract,
	createPartyIdentityLinkContract,
	createPersonPartyContract,
	createProductContract,
	createProductImportContract,
	createRefundContract,
	createReturnContract,
	createRoleAssignmentContract,
	createSafeDropContract,
	createSaleContract,
	createStockCountContract,
	createStockTransferContract,
	createUserInvitationContract,
	dispatchStockTransferContract,
	getCashVarianceContract,
	getCurrentIdentityContract,
	getDepositContract,
	getExportContract,
	getInventoryAdjustmentContract,
	getOpeningStockImportContract,
	getOpeningStockImportCorrectionReportContract,
	getOrganizationContract,
	getPartyContract,
	getProductContract,
	getProductImportContract,
	getProductImportCorrectionReportContract,
	getReceiptByNumberContract,
	getReceiptContract,
	getRefundContract,
	getRegisterSessionContract,
	getReturnContract,
	getSaleForReturnContract,
	getStockCountContract,
	getStockTransferContract,
	holdSaleContract,
	listAuditRecordsContract,
	listCurrentUserSessionsContract,
	listEntitlementsContract,
	listInventoryAdjustmentsContract,
	listLocationsContract,
	listOpeningStockImportFindingsContract,
	listOpeningStockImportsContract,
	listOrganizationsContract,
	listPartiesContract,
	listProductImportFindingsContract,
	listProductImportsContract,
	listProductsContract,
	listRolesContract,
	listStockBalancesContract,
	listStockCountsContract,
	listStockTransfersContract,
	listUsersContract,
	openRegisterContract,
	purgeOpeningStockImportStagingContract,
	purgeProductImportStagingContract,
	receiveStockTransferContract,
	reissueReceiptContract,
	requestSalePriceOverrideContract,
	reverseInventoryAdjustmentContract,
	revokeCurrentUserSessionContract,
	saveStockCountDraftLinesContract,
	setActiveContextContract,
	submitStockCountContract,
	suspendTenantMembershipContract,
	updateOrganizationContract,
	updatePartyContract,
	updateProductContract,
	voidReceiptContract,
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

function validationProblemTitle(code: string): string {
	if (code === "invalid_reference") {
		return "Resource reference is invalid";
	}
	if (code === "invalid_quantity") {
		return "Quantity is invalid";
	}
	if (
		code === "validation" ||
		code === "invalid_csv" ||
		code === "hash_mismatch" ||
		code === "blocked_content"
	) {
		return "Request is invalid";
	}
	return "Identifier is invalid";
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
	if (
		code === "invalid_identifier" ||
		code === "invalid_quantity" ||
		code === "invalid_csv" ||
		code === "hash_mismatch" ||
		code === "blocked_content" ||
		code === "invalid_reference" ||
		code === "validation"
	) {
		throw new ORPCError("BAD_REQUEST", {
			data: problem(context, {
				code: "validation",
				status: 400,
				title: validationProblemTitle(code),
			}),
		});
	}
	if (
		code === "approval_separation" ||
		code === "segregation_of_duties" ||
		code === "invalid_state" ||
		code === "negative_stock" ||
		code === "insufficient_cash"
	) {
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

const createProductImport = implement(createProductImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createImport({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listProductImports = implement(listProductImportsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listImports({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				cursor: input.query.cursor,
				limit: input.query.limit,
				sessionId: session.session.id,
				state: input.query.state,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getProductImport = implement(getProductImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listProductImportFindings = implement(listProductImportFindingsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listImportFindings({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				cursor: input.query.cursor,
				importId: input.params.importId,
				limit: input.query.limit,
				sessionId: session.session.id,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const acceptProductImport = implement(acceptProductImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.acceptImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const cancelProductImport = implement(cancelProductImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.cancelImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const purgeProductImportStaging = implement(purgeProductImportStagingContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.purge",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.purgeImportStaging({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveProductImport = implement(approveProductImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getProductImportCorrectionReport = implement(
	getProductImportCorrectionReportContract
)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"catalog.import.download",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getImportCorrectionReport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "Product",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createOpeningStockImport = implement(createOpeningStockImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createImport({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listOpeningStockImports = implement(listOpeningStockImportsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listImports({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				cursor: input.query.cursor,
				limit: input.query.limit,
				sessionId: session.session.id,
				state: input.query.state,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getOpeningStockImport = implement(getOpeningStockImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listOpeningStockImportFindings = implement(
	listOpeningStockImportFindingsContract
)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listImportFindings({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				cursor: input.query.cursor,
				importId: input.params.importId,
				limit: input.query.limit,
				sessionId: session.session.id,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const acceptOpeningStockImport = implement(acceptOpeningStockImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.acceptImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const cancelOpeningStockImport = implement(cancelOpeningStockImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.cancelImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const purgeOpeningStockImportStaging = implement(
	purgeOpeningStockImportStagingContract
)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.purge",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.purgeImportStaging({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveOpeningStockImport = implement(approveOpeningStockImportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveImport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getOpeningStockImportCorrectionReport = implement(
	getOpeningStockImportCorrectionReportContract
)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.import.download",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getImportCorrectionReport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				importId: input.params.importId,
				sessionId: session.session.id,
				target: "OpeningStock",
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listStockBalances = implement(listStockBalancesContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.balance.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listStockBalances({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				query: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listInventoryAdjustments = implement(listInventoryAdjustmentsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.adjustment.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listInventoryAdjustments({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getInventoryAdjustment = implement(getInventoryAdjustmentContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.adjustment.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getInventoryAdjustment({
				adjustmentId: input.params.id,
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createInventoryAdjustment = implement(createInventoryAdjustmentContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.adjustment.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createInventoryAdjustment({
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

// ---------------------------------------------------------------------------
// WS3 PR1: registers, cash movements, safe drops, cash-variance approval.
// Every procedure revalidates active context and enforces its declared
// permission BEFORE application dispatch (WS1/WS2 pattern); the POS
// application layer independently re-enforces the same checks in depth.
// ---------------------------------------------------------------------------

const openRegister = implement(openRegisterContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.register.open",
			input.headers["x-active-context-id"]
		);
		if (!activeContext.locationId) {
			throw new ORPCError("BAD_REQUEST", {
				data: problem(context, {
					code: "validation",
					status: 400,
					title: "Register open requires a location-scoped active context",
				}),
			});
		}
		try {
			return await context.application.openRegister({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				currency: input.body.currency,
				idempotencyKey: input.headers["idempotency-key"],
				locationId: activeContext.locationId,
				openingFloat: input.body.openingFloat,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const closeRegister = implement(closeRegisterContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.register.close",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.closeRegister({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				countedCash: input.body.countedCash,
				idempotencyKey: input.headers["idempotency-key"],
				reason: input.body.reason ?? null,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createCashMovement = implement(createCashMovementContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.cash-movement.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createCashMovement({
				actorUserId: session.user.id,
				amount: input.body.amount,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				direction: input.body.direction,
				idempotencyKey: input.headers["idempotency-key"],
				note: input.body.note ?? null,
				reasonCode: input.body.reasonCode,
				referenceId: input.body.referenceId ?? null,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createSafeDrop = implement(createSafeDropContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.cash-movement.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createSafeDrop({
				actorUserId: session.user.id,
				amount: input.body.amount,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				note: input.body.note ?? null,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveCashVariance = implement(approveCashVarianceContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.cash-variance.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveCashVariance({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				registerSessionId: input.params.varianceId,
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.cash-variance.approve` — same underlying register session
 * `getRegisterSession` below reads, gated on the variance-approver's own
 * permission instead of the closer's. */
const getCashVariance = implement(getCashVarianceContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.cash-variance.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getCashVariance({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				sessionId: session.session.id,
				varianceId: input.params.varianceId,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.register.close` (the closer's own upcoming action). */
const getRegisterSession = implement(getRegisterSessionContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.register.close",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getRegisterSession({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				registerSessionId: input.params.sessionId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

// ---------------------------------------------------------------------------
// WS3 PR2: sales, receipts, price overrides. Every procedure revalidates
// active context and enforces its declared permission BEFORE application
// dispatch (WS1/WS2 pattern, matching PR1 above); the POS application
// layer independently re-enforces the same checks in depth.
// ---------------------------------------------------------------------------

const createSale = implement(createSaleContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.sale.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createSale({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				currency: input.body.currency,
				customerPartyId: input.body.customerPartyId,
				idempotencyKey: input.headers["idempotency-key"],
				lines: input.body.lines,
				registerId: input.body.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const completeSale = implement(completeSaleContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.sale.complete",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.completeSale({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				exchangeOfReturnId: input.body.exchangeOfReturnId,
				idempotencyKey: input.headers["idempotency-key"],
				saleId: input.params.saleId,
				sessionId: session.session.id,
				tenders: input.body.tenders.map((tender) => ({
					amountMinor: tender.amount.amountMinor,
					currency: tender.amount.currency,
					referenceId: tender.referenceId,
					type: tender.type,
				})),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const holdSale = implement(holdSaleContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.sale.hold",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.holdSale({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				saleId: input.params.saleId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const requestSalePriceOverride = implement(requestSalePriceOverrideContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.price-override.request",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.requestSalePriceOverride({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				lineId: input.body.lineId,
				reason: input.body.reason,
				requestedPrice: input.body.requestedPrice,
				saleId: input.params.saleId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveSalePriceOverride = implement(approveSalePriceOverrideContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.price-override.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveSalePriceOverride({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				overrideId: input.params.overrideId,
				saleId: input.params.saleId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getReceipt = implement(getReceiptContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.receipt.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getReceipt({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				receiptId: input.params.receiptId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding J. */
const getReceiptByNumber = implement(getReceiptByNumberContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.receipt.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getReceiptByNumber({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				receiptNumber: input.params.receiptNumber,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding J (part 2): completes the receipt-to-return
 * path — gated on `commerce.return.create`, not `commerce.receipt.read`. */
const getSaleForReturn = implement(getSaleForReturnContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.return.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getSaleForReturn({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				receiptNumber: input.params.receiptNumber,
				registerId: input.params.registerId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

// ---------------------------------------------------------------------------
// WS3 PR3: Return, Refund, Void, Reissue. Exchange has no dedicated
// procedure — it rides `completeSale`'s `exchangeOfReturnId` above.
// ---------------------------------------------------------------------------

const createReturn = implement(createReturnContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.return.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createReturn({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				lines: input.body.lines,
				reason: input.body.reason,
				saleId: input.body.saleId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.return.approve`, gated on that exact permission. */
const getReturn = implement(getReturnContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.return.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getReturn({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				returnId: input.params.returnId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveReturn = implement(approveReturnContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.return.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveReturn({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				returnId: input.params.returnId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createRefund = implement(createRefundContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.refund.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createRefund({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				returnId: input.body.returnId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.refund.approve`, gated on that exact permission. */
const getRefund = implement(getRefundContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.refund.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getRefund({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				refundId: input.params.refundId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveRefund = implement(approveRefundContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.refund.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveRefund({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				refundId: input.params.refundId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const reissueReceipt = implement(reissueReceiptContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.receipt.reissue",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.reissueReceipt({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				priceSuppressed: input.body.priceSuppressed,
				receiptId: input.params.receiptId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const voidReceipt = implement(voidReceiptContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.receipt.void",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.voidReceipt({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				reason: input.body.reason,
				receiptId: input.params.receiptId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

// ---------------------------------------------------------------------------
// WS3 PR4: Deposit (commerce.deposit.create/.confirm) and the accountant
// handoff export (platform.export.create/.read).
// ---------------------------------------------------------------------------

const createDeposit = implement(createDepositContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.deposit.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createDeposit({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				countedAmountMinor: input.body.countedAmount.amountMinor,
				currency: input.body.currency,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				sourceShiftIds: input.body.sourceShiftIds,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.deposit.confirm`, gated on that exact permission. */
const getDeposit = implement(getDepositContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.deposit.confirm",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getDeposit({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				depositId: input.params.depositId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const confirmDeposit = implement(confirmDepositContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"commerce.deposit.confirm",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.confirmDeposit({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				depositId: input.params.depositId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createAccountantHandoffExport = implement(
	createAccountantHandoffExportContract
)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.export.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createAccountantHandoffExport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				currency: input.body.currency,
				idempotencyKey: input.headers["idempotency-key"],
				legalEntityId: input.body.legalEntityId,
				periodEnd: input.body.periodEnd,
				periodStart: input.body.periodStart,
				sessionId: session.session.id,
				timezone: input.body.timezone,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getExport = implement(getExportContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.export.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getAccountantHandoffExport({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				exportId: input.params.exportId,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveInventoryAdjustment = implement(approveInventoryAdjustmentContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.adjustment.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveInventoryAdjustment({
				actorUserId: session.user.id,
				adjustmentId: input.params.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const reverseInventoryAdjustment = implement(reverseInventoryAdjustmentContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.adjustment.reverse",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.reverseInventoryAdjustment({
				actorUserId: session.user.id,
				adjustmentId: input.params.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listStockCounts = implement(listStockCountsContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listStockCounts({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getStockCount = implement(getStockCountContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getStockCount({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				countId: input.params.id,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createStockCount = implement(createStockCountContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createStockCount({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const saveStockCountDraft = implement(saveStockCountDraftLinesContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.saveStockCountDraft({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				countId: input.params.id,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const submitStockCount = implement(submitStockCountContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.submit",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.submitStockCount({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				countId: input.params.id,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const approveStockCount = implement(approveStockCountContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.count.approve",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.approveStockCount({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				countId: input.params.id,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const listStockTransfers = implement(listStockTransfersContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.transfer.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.listStockTransfers({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				page: input.query,
				sessionId: session.session.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const getStockTransfer = implement(getStockTransferContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.transfer.read",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.getStockTransfer({
				authUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				sessionId: session.session.id,
				transferId: input.params.id,
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const createStockTransfer = implement(createStockTransferContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.transfer.create",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createStockTransfer({
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

const dispatchStockTransfer = implement(dispatchStockTransferContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.transfer.dispatch",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.dispatchStockTransfer({
				actorUserId: session.user.id,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				transferId: input.params.id,
				version: Number(input.headers["if-match"]),
			});
		} catch (error) {
			return mapApplicationError(context, error);
		}
	});

const receiveStockTransfer = implement(receiveStockTransferContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"inventory.transfer.receive",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.receiveStockTransfer({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				transferId: input.params.id,
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

const createEventReplay = implement(createEventReplayContract)
	.$context<Context>()
	.handler(async ({ context, input }) => {
		const { activeContext, session } = await requireActiveIdentity(
			context,
			input.headers["x-active-context-id"]
		);
		await requirePermission(
			context,
			"platform.event.replay",
			input.headers["x-active-context-id"]
		);
		try {
			return await context.application.createEventReplay({
				actorUserId: session.user.id,
				body: input.body,
				contextId: input.headers["x-active-context-id"],
				correlationId: context.correlationId,
				idempotencyKey: input.headers["idempotency-key"],
				sessionId: session.session.id,
				tenantId: activeContext.tenantId,
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

/** Extracted from `appRouter` below (rather than inlined) so its type is
 * resolved and named once — adding Finding I/J's 6 new procedures pushed
 * the single giant `appRouter` object literal over TS's type-serialization
 * limit (TS7056, "type too complex to serialize"); splitting the largest
 * sub-tree into its own named const keeps the top-level `typeof appRouter`
 * cheap to re-derive. Purely a compiler-ergonomics split — the router
 * shape (and `AppRouterClient`) is unchanged. */
export const commerceRouter = {
	cashMovements: { create: createCashMovement },
	cashVariances: { approve: approveCashVariance, get: getCashVariance },
	deposits: {
		confirm: confirmDeposit,
		create: createDeposit,
		get: getDeposit,
	},
	priceOverrides: {
		approve: approveSalePriceOverride,
		request: requestSalePriceOverride,
	},
	receipts: {
		get: getReceipt,
		getByNumber: getReceiptByNumber,
		reissue: reissueReceipt,
		void: voidReceipt,
	},
	refunds: {
		approve: approveRefund,
		create: createRefund,
		get: getRefund,
	},
	registerSessions: { get: getRegisterSession },
	registers: {
		close: closeRegister,
		open: openRegister,
	},
	returns: {
		approve: approveReturn,
		create: createReturn,
		get: getReturn,
	},
	safeDrops: { create: createSafeDrop },
	sales: {
		complete: completeSale,
		create: createSale,
		getForReturn: getSaleForReturn,
		hold: holdSale,
	},
};

export const catalogRouter = {
	imports: {
		accept: acceptProductImport,
		approve: approveProductImport,
		cancel: cancelProductImport,
		correctionReport: getProductImportCorrectionReport,
		create: createProductImport,
		findings: listProductImportFindings,
		get: getProductImport,
		list: listProductImports,
		purgeStaging: purgeProductImportStaging,
	},
	products: {
		activate: activateProduct,
		archive: archiveProduct,
		create: createProduct,
		get: getProduct,
		list: listProducts,
		update: updateProduct,
	},
};

export const inventoryRouter = {
	adjustments: {
		approve: approveInventoryAdjustment,
		create: createInventoryAdjustment,
		get: getInventoryAdjustment,
		list: listInventoryAdjustments,
		reverse: reverseInventoryAdjustment,
	},
	balances: { list: listStockBalances },
	counts: {
		approve: approveStockCount,
		create: createStockCount,
		get: getStockCount,
		list: listStockCounts,
		saveDraft: saveStockCountDraft,
		submit: submitStockCount,
	},
	imports: {
		acceptOpeningStock: acceptOpeningStockImport,
		approveOpeningStock: approveOpeningStockImport,
		cancelOpeningStock: cancelOpeningStockImport,
		createOpeningStock: createOpeningStockImport,
		getOpeningStock: getOpeningStockImport,
		listOpeningStock: listOpeningStockImports,
		openingStockCorrectionReport: getOpeningStockImportCorrectionReport,
		openingStockFindings: listOpeningStockImportFindings,
		purgeOpeningStockStaging: purgeOpeningStockImportStaging,
	},
	transfers: {
		create: createStockTransfer,
		dispatch: dispatchStockTransfer,
		get: getStockTransfer,
		list: listStockTransfers,
		receive: receiveStockTransfer,
	},
};

const auditRouter = { list: listAuditRecords };
const entitlementsRouter = { list: listEntitlements };
const eventsRouter = { createReplay: createEventReplay };
const exportsRouter = {
	createAccountantHandoff: createAccountantHandoffExport,
	get: getExport,
};
const healthCheckProcedure = publicProcedure.handler(() => "OK");
const identityRouter = {
	getCurrent: currentIdentity,
	setActiveContext,
};
const organizationsRouter = {
	get: getOrganization,
	list: listOrganizations,
	listLocations,
	update: updateOrganization,
};
const partiesRouter = {
	createIdentityLink: createPartyIdentityLink,
	createOrganization: createOrganizationParty,
	createPerson: createPersonParty,
	get: getParty,
	list: listParties,
	update: updateParty,
};
const privateDataProcedure = protectedProcedure.handler(({ context }) => ({
	message: "This is private",
	user: context.session.user,
}));
const rolesRouter = {
	assign: createRoleAssignment,
	list: listRoles,
};
const sessionsRouter = {
	list: listCurrentUserSessions,
	revoke: revokeCurrentUserSession,
};
const usersRouter = {
	invite: inviteUser,
	list: listUsers,
	suspendMembership,
};

/** WS3 remediation R3: adding Findings I/J's 6 new procedures pushed the
 * top-level router object past TS7056's "type too complex to serialize"
 * limit under `apps/server`'s `composite: true` (declaration-emission)
 * tsconfig. Every branch above is now a separately named const (instead of
 * one giant inline nested literal) SPECIFICALLY so `typeof appRouter`
 * below only has to reference each already-resolved named type instead of
 * re-inferring and re-printing the whole tree as one anonymous structural
 * type in one pass — this alone (no explicit annotation, no `Router<...>`
 * cast) is what keeps the checker under the limit. `AppRouterClient` (the
 * typed API client apps/web consumes) is unchanged in shape. */
export const appRouter = {
	audit: auditRouter,
	catalog: catalogRouter,
	commerce: commerceRouter,
	entitlements: entitlementsRouter,
	events: eventsRouter,
	exports: exportsRouter,
	healthCheck: healthCheckProcedure,
	identity: identityRouter,
	inventory: inventoryRouter,
	organizations: organizationsRouter,
	parties: partiesRouter,
	privateData: privateDataProcedure,
	roles: rolesRouter,
	sessions: sessionsRouter,
	users: usersRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
