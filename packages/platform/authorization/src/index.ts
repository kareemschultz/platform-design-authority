import {
	PERMISSION_IDS,
	type PermissionId,
} from "@meridian/contracts-permissions";
import type { AuthorizationDecision } from "@meridian/contracts-platform-api";

export type AuthorizationScopeType =
	| "Tenant"
	| "Organization"
	| "LegalEntity"
	| "Branch"
	| "Location";

export interface AuthorizationContext {
	authUserId: string;
	branchId?: string;
	contextId: string;
	delegationId?: string;
	expiresAt: Date;
	legalEntityId?: string;
	locationId?: string;
	organizationId: string;
	sessionId: string;
	tenantId: string;
}

export interface AuthorizationMembership {
	id: string;
	state: "Invited" | "Provisioning" | "Active" | "Suspended" | "Ended";
	tenantId: string;
}

export interface AuthorizationRole {
	id: string;
	permissionIds: readonly PermissionId[];
	state: "Active" | "Inactive";
	tenantId: string;
}

export interface AuthorizationRoleAssignment {
	endsAt?: Date;
	id: string;
	membershipId: string;
	roleId: string;
	scopeId?: string;
	scopeType: AuthorizationScopeType;
	startsAt: Date;
	state: "Active" | "Revoked" | "Expired";
	tenantId: string;
}

export interface AuthorizationDelegation {
	delegateMembershipId: string;
	endsAt: Date;
	id: string;
	permissionIds: readonly PermissionId[];
	scopeId?: string;
	scopeType: AuthorizationScopeType;
	startsAt: Date;
	state: "Active" | "Revoked" | "Expired";
	tenantId: string;
}

export interface AuthorizationState {
	assignments: readonly {
		assignment: AuthorizationRoleAssignment;
		role: AuthorizationRole | null;
	}[];
	context: AuthorizationContext;
	delegation: AuthorizationDelegation | null;
	membership: AuthorizationMembership | null;
}

/** Current-authority port. Implementations must load authoritative state per call. */
export interface AuthorizationStateProvider {
	load: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<AuthorizationState | null>;
}

export interface AuthorizationRequest {
	assuranceLevel: string;
	authUserId: string;
	contextId: string;
	permission: PermissionId;
	resourceScope?: {
		scopeId?: string;
		scopeType: AuthorizationScopeType;
	};
	sessionId: string;
}

export interface PolicyRule {
	evaluate: (input: {
		permission: PermissionId;
		request: AuthorizationRequest;
		state: AuthorizationState;
	}) => Extract<
		AuthorizationDecision,
		{
			outcome:
				| "deny"
				| "require_approval"
				| "require_step_up"
				| "allow_masked"
				| "allow_with_limit"
				| "allow_read_only";
		}
	> | null;
	id: string;
}

export interface AuthorizationServiceOptions {
	clock: () => Date;
	policies?: readonly PolicyRule[];
	state: AuthorizationStateProvider;
}

const canonicalPermissions = new Set<string>(PERMISSION_IDS);

export function isPermissionId(value: string): value is PermissionId {
	return canonicalPermissions.has(value);
}

function isCurrent(
	record: {
		endsAt?: Date;
		startsAt: Date;
		state: "Active" | "Revoked" | "Expired";
	},
	now: Date
): boolean {
	return (
		record.state === "Active" &&
		record.startsAt <= now &&
		(record.endsAt === undefined || record.endsAt > now)
	);
}

function contextScopeId(
	context: AuthorizationContext,
	type: AuthorizationScopeType
): string | undefined {
	switch (type) {
		case "Tenant":
			return context.tenantId;
		case "Organization":
			return context.organizationId;
		case "LegalEntity":
			return context.legalEntityId;
		case "Branch":
			return context.branchId;
		case "Location":
			return context.locationId;
		default:
			return;
	}
}

function scopeMatches(
	context: AuthorizationContext,
	grant: { scopeId?: string; scopeType: AuthorizationScopeType },
	resource?: AuthorizationRequest["resourceScope"]
): boolean {
	if (grant.scopeType === "Tenant") {
		return grant.scopeId === undefined || grant.scopeId === context.tenantId;
	}
	const activeScopeId = contextScopeId(context, grant.scopeType);
	if (!grant.scopeId || grant.scopeId !== activeScopeId) {
		return false;
	}
	if (!resource) {
		return true;
	}
	if (resource.scopeType === "Tenant") {
		return false;
	}
	if (grant.scopeType !== resource.scopeType) {
		return (
			grant.scopeType === "Organization" && resource.scopeType === "Location"
		);
	}
	return resource.scopeId === undefined || resource.scopeId === grant.scopeId;
}

export class AuthorizationError extends Error {
	readonly code = "authorization_denied" as const;
	readonly decision: AuthorizationDecision;

	constructor(decision: AuthorizationDecision) {
		super("Current authorization policy denied the operation");
		this.decision = decision;
		this.name = "AuthorizationError";
	}
}

function contextDenial(
	state: AuthorizationState,
	request: AuthorizationRequest,
	now: Date
): AuthorizationDecision | null {
	if (
		state.context.authUserId !== request.authUserId ||
		state.context.contextId !== request.contextId ||
		state.context.sessionId !== request.sessionId ||
		state.context.expiresAt <= now
	) {
		return { outcome: "deny", reason: "wrong_tenant" };
	}
	const { membership } = state;
	if (
		!membership ||
		membership.tenantId !== state.context.tenantId ||
		membership.state !== "Active"
	) {
		return { outcome: "deny", reason: "assignment_inactive" };
	}
	return null;
}

function assignmentAuthority(
	state: AuthorizationState,
	request: AuthorizationRequest,
	now: Date,
	membershipId: string
) {
	const permissionAssignments = state.assignments.filter(({ role }) =>
		role?.permissionIds.includes(request.permission)
	);
	const currentAssignments = permissionAssignments.filter(
		({ assignment, role }) =>
			role?.state === "Active" &&
			role.tenantId === state.context.tenantId &&
			assignment.tenantId === state.context.tenantId &&
			assignment.membershipId === membershipId &&
			isCurrent(assignment, now)
	);
	const matchedAssignments = currentAssignments
		.filter(({ assignment }) =>
			scopeMatches(state.context, assignment, request.resourceScope)
		)
		.map(({ assignment }) => assignment.id);
	return {
		currentCount: currentAssignments.length,
		matchedAssignments,
		permissionCount: permissionAssignments.length,
	};
}

function delegatedAuthority(
	state: AuthorizationState,
	request: AuthorizationRequest,
	now: Date,
	membershipId: string
): boolean {
	if (!state.context.delegationId) {
		return false;
	}
	const { delegation } = state;
	return Boolean(
		delegation &&
			delegation.id === state.context.delegationId &&
			delegation.tenantId === state.context.tenantId &&
			delegation.delegateMembershipId === membershipId &&
			delegation.permissionIds.includes(request.permission) &&
			isCurrent(delegation, now) &&
			scopeMatches(state.context, delegation, request.resourceScope)
	);
}

function authorityDenial(
	state: AuthorizationState,
	evaluation: { currentCount: number; permissionCount: number }
): AuthorizationDecision {
	if (state.context.delegationId) {
		return { outcome: "deny", reason: "scope_mismatch" };
	}
	if (evaluation.permissionCount === 0) {
		return { outcome: "deny", reason: "no_assignment" };
	}
	if (evaluation.currentCount === 0) {
		return { outcome: "deny", reason: "assignment_inactive" };
	}
	return { outcome: "deny", reason: "scope_mismatch" };
}

function policyOutcome(
	policies: readonly PolicyRule[],
	state: AuthorizationState,
	request: AuthorizationRequest
): AuthorizationDecision | null {
	for (const policy of policies) {
		const outcome = policy.evaluate({
			permission: request.permission,
			request,
			state,
		});
		if (outcome) {
			return outcome;
		}
	}
	return null;
}

export function createAuthorizationService(
	options: AuthorizationServiceOptions
) {
	async function decide(
		request: AuthorizationRequest
	): Promise<AuthorizationDecision> {
		const state = await options.state.load(request);
		if (!state) {
			return { outcome: "deny", reason: "not_authenticated" };
		}
		const now = options.clock();
		const denied = contextDenial(state, request, now);
		if (denied || !state.membership) {
			return denied ?? { outcome: "deny", reason: "assignment_inactive" };
		}
		const evaluation = assignmentAuthority(
			state,
			request,
			now,
			state.membership.id
		);
		const delegated = delegatedAuthority(
			state,
			request,
			now,
			state.membership.id
		);
		if (evaluation.matchedAssignments.length === 0 && !delegated) {
			return authorityDenial(state, evaluation);
		}
		const policy = policyOutcome(options.policies ?? [], state, request);
		if (policy) {
			return policy;
		}

		return {
			matchedAssignments: evaluation.matchedAssignments,
			outcome: "allow",
			permission: request.permission,
		};
	}

	return {
		decide,
		async requirePermission(
			request: AuthorizationRequest
		): Promise<AuthorizationDecision> {
			const decision = await decide(request);
			if (decision.outcome !== "allow") {
				throw new AuthorizationError(decision);
			}
			return decision;
		},
	};
}
