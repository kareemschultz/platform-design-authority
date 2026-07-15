import { describe, expect, test } from "bun:test";
import type { PermissionId } from "@meridian/contracts-permissions";

import {
	type AuthorizationRequest,
	type AuthorizationState,
	createAuthorizationService,
} from "./index";

const now = new Date("2026-07-14T12:00:00.000Z");
const request: AuthorizationRequest = {
	assuranceLevel: "aal1",
	authUserId: "user_authorization_unit_0001",
	contextId: "context_authorization_unit_0001",
	permission: "platform.role.read",
	sessionId: "session_authorization_unit_0001",
};

function currentState(
	permissionIds: readonly PermissionId[] = ["platform.role.read"]
): AuthorizationState {
	return {
		assignments: [
			{
				assignment: {
					id: "assignment_authorization_unit_0001",
					membershipId: "membership_authorization_unit_0001",
					roleId: "role_authorization_unit_0001",
					scopeType: "Tenant",
					startsAt: new Date("2026-07-14T00:00:00.000Z"),
					state: "Active",
					tenantId: "tenant_authorization_unit_0001",
				},
				role: {
					id: "role_authorization_unit_0001",
					permissionIds,
					state: "Active",
					tenantId: "tenant_authorization_unit_0001",
				},
			},
		],
		context: {
			authUserId: request.authUserId,
			contextId: request.contextId,
			expiresAt: new Date("2026-07-14T13:00:00.000Z"),
			organizationId: "organization_authorization_unit_0001",
			sessionId: request.sessionId,
			tenantId: "tenant_authorization_unit_0001",
		},
		delegation: null,
		membership: {
			id: "membership_authorization_unit_0001",
			state: "Active",
			tenantId: "tenant_authorization_unit_0001",
		},
	};
}

function serviceWith(load: () => Promise<AuthorizationState | null>) {
	return createAuthorizationService({ clock: () => now, state: { load } });
}

function firstAssignment(state: AuthorizationState) {
	const [entry] = state.assignments;
	if (!entry) {
		throw new Error("authorization fixture requires an assignment");
	}
	return entry;
}

describe("Platform Authorization current policy", () => {
	test("allows only a current canonical assignment in the active scope", async () => {
		const service = serviceWith(async () => currentState());
		await expect(service.decide(request)).resolves.toEqual({
			matchedAssignments: ["assignment_authorization_unit_0001"],
			outcome: "allow",
			permission: "platform.role.read",
		});

		const state = currentState();
		const scoped = firstAssignment(state);
		scoped.assignment.scopeType = "Location";
		scoped.assignment.scopeId = "location_other_0001";
		await expect(
			serviceWith(async () => state).decide(request)
		).resolves.toEqual({
			outcome: "deny",
			reason: "scope_mismatch",
		});
	});

	test("keeps transfer dispatch separate from create and receive authority", async () => {
		const state = currentState(["inventory.transfer.dispatch"]);
		const service = serviceWith(async () => state);
		await expect(
			service.decide({ ...request, permission: "inventory.transfer.dispatch" })
		).resolves.toMatchObject({
			outcome: "allow",
			permission: "inventory.transfer.dispatch",
		});
		await expect(
			service.decide({ ...request, permission: "inventory.transfer.receive" })
		).resolves.toEqual({ outcome: "deny", reason: "no_assignment" });
	});

	test("distinguishes absent, inactive, and cross-session authority", async () => {
		await expect(
			serviceWith(async () => currentState([])).decide(request)
		).resolves.toEqual({ outcome: "deny", reason: "no_assignment" });

		const inactive = currentState();
		firstAssignment(inactive).assignment.state = "Revoked";
		await expect(
			serviceWith(async () => inactive).decide(request)
		).resolves.toEqual({ outcome: "deny", reason: "assignment_inactive" });

		const substituted = currentState();
		substituted.context.sessionId = "session_other_0001";
		await expect(
			serviceWith(async () => substituted).decide(request)
		).resolves.toEqual({ outcome: "deny", reason: "wrong_tenant" });
	});

	test("requires a current, scoped delegation when the context selects one", async () => {
		const state = currentState([]);
		if (!state.membership) {
			throw new Error("authorization fixture requires a membership");
		}
		state.context.delegationId = "delegation_authorization_unit_0001";
		state.delegation = {
			delegateMembershipId: state.membership.id,
			endsAt: new Date("2026-07-14T12:30:00.000Z"),
			id: state.context.delegationId,
			permissionIds: ["platform.role.read"],
			scopeId: state.context.organizationId,
			scopeType: "Organization",
			startsAt: new Date("2026-07-14T11:00:00.000Z"),
			state: "Active",
			tenantId: state.context.tenantId,
		};
		await expect(
			serviceWith(async () => state).decide(request)
		).resolves.toEqual({
			matchedAssignments: [],
			outcome: "allow",
			permission: "platform.role.read",
		});

		state.delegation.endsAt = new Date("2026-07-14T11:59:59.000Z");
		const ordinaryRole = firstAssignment(state).role;
		if (!ordinaryRole) {
			throw new Error("authorization fixture requires an ordinary role");
		}
		ordinaryRole.permissionIds = ["platform.role.read"];
		await expect(
			serviceWith(async () => state).decide(request)
		).resolves.toEqual({
			outcome: "deny",
			reason: "scope_mismatch",
		});
	});

	test("does not let organization authority reach sibling or tenant scope", async () => {
		const state = currentState();
		const scoped = firstAssignment(state);
		scoped.assignment.scopeId = state.context.organizationId;
		scoped.assignment.scopeType = "Organization";
		const service = serviceWith(async () => state);

		await expect(
			service.decide({
				...request,
				resourceScope: {
					scopeId: state.context.organizationId,
					scopeType: "Organization",
				},
			})
		).resolves.toMatchObject({ outcome: "allow" });
		await expect(
			service.decide({
				...request,
				resourceScope: { scopeType: "Tenant" },
			})
		).resolves.toEqual({ outcome: "deny", reason: "scope_mismatch" });
		await expect(
			service.decide({
				...request,
				resourceScope: {
					scopeId: "organization_authorization_sibling_0001",
					scopeType: "Organization",
				},
			})
		).resolves.toEqual({ outcome: "deny", reason: "scope_mismatch" });
	});

	test("preserves conditional policy outcomes instead of flattening to boolean", async () => {
		const service = createAuthorizationService({
			clock: () => now,
			policies: [
				{
					evaluate: () => ({
						assuranceLevel: "aal2",
						outcome: "require_step_up",
					}),
					id: "policy_step_up_role_read",
				},
			],
			state: { load: async () => currentState() },
		});
		await expect(service.decide(request)).resolves.toEqual({
			assuranceLevel: "aal2",
			outcome: "require_step_up",
		});
		await expect(service.requirePermission(request)).rejects.toMatchObject({
			code: "authorization_denied",
			decision: { outcome: "require_step_up" },
		});
	});

	test("re-evaluates current assignment state on every decision", async () => {
		const state = currentState();
		let loads = 0;
		const service = serviceWith(() => {
			loads += 1;
			return Promise.resolve(state);
		});
		await expect(service.decide(request)).resolves.toMatchObject({
			outcome: "allow",
		});
		const { role } = firstAssignment(state);
		if (!role) {
			throw new Error("authorization fixture requires a role");
		}
		role.state = "Inactive";
		await expect(service.decide(request)).resolves.toEqual({
			outcome: "deny",
			reason: "assignment_inactive",
		});
		expect(loads).toBe(2);
	});
});
