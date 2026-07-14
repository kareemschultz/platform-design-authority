import assert from "node:assert/strict";
import {
	ActiveContextRequestSchema,
	WS1_OPENAPI_OPERATION_METADATA,
	WS1_OPERATION_IDS,
} from "@meridian/contracts-platform-api";
import { retentionDisposition } from "@meridian/platform-audit";
import {
	type AuthorizationState,
	createAuthorizationService,
} from "@meridian/platform-authorization";
import {
	createEntitlementEvaluator,
	type EntitlementRecord,
} from "@meridian/platform-entitlements";
import { isBlockedNativeAuthHttpRoute } from "@meridian/platform-identity";
import {
	createTenancyService,
	type EventAppendPort,
	type MembershipRecord,
	type TenancyRepository,
} from "@meridian/platform-tenancy";

assert.deepEqual(
	WS1_OPENAPI_OPERATION_METADATA.map(
		(operation) => operation.operationId
	).sort(),
	[...WS1_OPERATION_IDS].sort()
);
const activeContextInput = ActiveContextRequestSchema.parse({
	organizationId: crypto.randomUUID(),
	tenantId: crypto.randomUUID(),
});
assert.equal("tenantId" in activeContextInput, false);

assert.equal(
	isBlockedNativeAuthHttpRoute(
		new Request("https://example.test/api/auth/organization/create")
	),
	true
);
assert.equal(
	isBlockedNativeAuthHttpRoute(
		new Request("https://example.test/api/auth/get-session")
	),
	false
);

const now = new Date("2026-07-14T12:00:00.000Z");
const authorizationState: AuthorizationState = {
	assignments: [
		{
			assignment: {
				id: "assignment_node_0001",
				membershipId: "membership_node_0001",
				roleId: "role_node_0001",
				scopeType: "Tenant",
				startsAt: new Date("2026-07-14T00:00:00.000Z"),
				state: "Active",
				tenantId: "tenant_node_0001",
			},
			role: {
				id: "role_node_0001",
				permissionIds: ["platform.role.read"],
				state: "Active",
				tenantId: "tenant_node_0001",
			},
		},
	],
	context: {
		authUserId: "user_node_0001",
		contextId: "context_node_0001",
		expiresAt: new Date("2026-07-14T13:00:00.000Z"),
		organizationId: "organization_node_0001",
		sessionId: "session_node_0001",
		tenantId: "tenant_node_0001",
	},
	delegation: null,
	membership: {
		id: "membership_node_0001",
		state: "Active",
		tenantId: "tenant_node_0001",
	},
};
const authorization = createAuthorizationService({
	clock: () => now,
	state: { load: async () => authorizationState },
});
const authorizationRequest = {
	assuranceLevel: "aal1",
	authUserId: "user_node_0001",
	contextId: "context_node_0001",
	permission: "platform.role.read" as const,
	sessionId: "session_node_0001",
};
assert.equal(
	(await authorization.decide(authorizationRequest)).outcome,
	"allow"
);
if (authorizationState.membership) {
	authorizationState.membership.state = "Suspended";
}
assert.deepEqual(await authorization.decide(authorizationRequest), {
	outcome: "deny",
	reason: "assignment_inactive",
});

const entitlement: EntitlementRecord = {
	capabilityId: "platform.authorization",
	dependencies: [],
	exclusions: [],
	id: "entitlement_node_0001",
	limits: {},
	source: "ManualGrant",
	startsAt: new Date("2026-07-14T00:00:00.000Z"),
	state: "Active",
	tenantId: "tenant_node_0001",
	version: 1,
};
const entitlements = createEntitlementEvaluator({
	clock: () => now,
	state: {
		load: async ({ tenantId }) =>
			tenantId === entitlement.tenantId ? [entitlement] : [],
	},
});
assert.equal(
	(
		await entitlements.decide({
			access: "Read",
			capabilityId: entitlement.capabilityId,
			tenantId: entitlement.tenantId,
		})
	).outcome,
	"allow"
);
assert.deepEqual(
	await entitlements.decide({
		access: "Read",
		capabilityId: entitlement.capabilityId,
		tenantId: "tenant_node_0002",
	}),
	{
		capabilityId: "platform.authorization",
		outcome: "deny",
		reason: "not_entitled",
	}
);

const membership: MembershipRecord = {
	authUserId: "user_node_0001",
	id: "membership_node_0001",
	organizationId: "organization_node_0001",
	roleAssignmentIds: [],
	state: "Active",
	tenantId: "tenant_node_0001",
	version: 1,
};
const context = {
	authUserId: membership.authUserId,
	contextId: "context_node_0001",
	expiresAt: new Date("2026-07-14T13:00:00.000Z"),
	idempotencyKey: "context-node-idempotency-0001",
	issuedAt: now,
	organizationId: membership.organizationId,
	sessionId: "session_node_0001",
	tenantId: membership.tenantId,
};
const repository = {
	getActiveContext: async () => context,
	getMembershipForOrganization: async () => membership,
	getOrganization: async () => ({
		id: membership.organizationId,
		name: "Node Organization",
		state: "Active" as const,
		tenantId: membership.tenantId,
		version: 1,
	}),
	getTenant: async () => ({
		id: membership.tenantId,
		name: "Node Tenant",
		state: "Active" as const,
		version: 1,
	}),
} as unknown as TenancyRepository;
const events: EventAppendPort = {
	append: async () => "inserted",
};
const tenancy = createTenancyService({
	clock: () => now,
	contextTtlMs: 60_000,
	ids: { create: (kind) => `${kind}_node_0001` },
	unitOfWork: {
		execute: (operation) => operation({ events, repository }),
	},
});
assert.equal(
	(
		await tenancy.requireContext({
			authUserId: membership.authUserId,
			contextId: context.contextId,
			sessionId: context.sessionId,
		})
	).tenantId,
	membership.tenantId
);
membership.state = "Suspended";
await assert.rejects(
	tenancy.requireContext({
		authUserId: membership.authUserId,
		contextId: context.contextId,
		sessionId: context.sessionId,
	}),
	(error: unknown) =>
		Boolean(
			error &&
				typeof error === "object" &&
				"code" in error &&
				error.code === "membership_inactive"
		)
);

assert.equal(
	retentionDisposition(
		{ legalHoldId: "hold_node_0001", retentionUntil: null },
		now
	),
	"legal_hold"
);
