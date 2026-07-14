import { describe, expect, test } from "bun:test";
import { call, ORPCError } from "@orpc/server";
import type { Context } from "./context";
import { appRouter } from "./router";

const now = new Date("2026-07-13T12:00:00.000Z");
const authenticatedSession = {
	session: {
		createdAt: now,
		expiresAt: new Date(now.getTime() + 60_000),
		id: "session_unit_test_0001",
		token: "unit-test-session-token",
		updatedAt: now,
		userId: "user_unit_test_000001",
	},
	user: {
		createdAt: now,
		email: "test.user@example.com",
		emailVerified: true,
		id: "user_unit_test_000001",
		image: null,
		name: "Test User",
		updatedAt: now,
	},
} as unknown as NonNullable<Context["session"]>;

function context(input?: {
	allowed?: boolean;
	application?: Partial<Context["application"]>;
	session?: Context["session"];
}): Context {
	return {
		application: {
			createIdentityLink: () => Promise.reject(new Error("not used")),
			createOrganizationParty: () => Promise.reject(new Error("not used")),
			createPersonParty: () => Promise.reject(new Error("not used")),
			createRoleAssignment: () => Promise.reject(new Error("not used")),
			getCurrentIdentity: async ({
				activeContextId,
				authUserId,
				sessionId,
			}) => ({
				activeContext: activeContextId
					? {
							authUserId,
							contextId: activeContextId,
							expiresAt: "2026-07-13T13:00:00.000Z",
							issuedAt: "2026-07-13T12:00:00.000Z",
							organizationId: "organization_unit_0001",
							tenantId: "tenant_unit_test_0001",
						}
					: null,
				assuranceLevel: "aal1",
				authUserId,
				memberships: [],
				partyId: null,
				sessionId,
			}),
			getOrganization: () => Promise.reject(new Error("not used")),
			getParty: () => Promise.reject(new Error("not used")),
			inviteUser: () => Promise.reject(new Error("not used")),
			listEntitlements: async () => ({ items: [], nextCursor: null }),
			listLocations: async () => ({ items: [], nextCursor: null }),
			listOrganizations: async () => ({ items: [], nextCursor: null }),
			listParties: async () => ({ items: [], nextCursor: null }),
			listRoles: async () => ({ items: [], nextCursor: null }),
			listUsers: async () => ({ items: [], nextCursor: null }),
			setActiveContext: async ({ authUserId, body }) => ({
				authUserId,
				contextId: "context_unit_test_0001",
				expiresAt: "2026-07-13T13:00:00.000Z",
				issuedAt: "2026-07-13T12:00:00.000Z",
				organizationId: body.organizationId,
				tenantId: "tenant_unit_test_0001",
			}),
			suspendMembership: () => Promise.reject(new Error("not used")),
			updateOrganization: () => Promise.reject(new Error("not used")),
			updateParty: () => Promise.reject(new Error("not used")),
			...input?.application,
		},
		authorizer: {
			decide: async ({ permission }) =>
				input?.allowed
					? { matchedAssignments: [], outcome: "allow" as const, permission }
					: { outcome: "deny" as const, reason: "no_assignment" as const },
			requirePermission: async ({ permission }) =>
				input?.allowed
					? { matchedAssignments: [], outcome: "allow" as const, permission }
					: { outcome: "deny" as const, reason: "no_assignment" as const },
		},
		correlationId: "00000000-0000-4000-8000-000000000001",
		session: input?.session ?? null,
	};
}

describe("appRouter contract surface", () => {
	test("exposes the governed PR3 through PR6 procedure families", () => {
		expect(Object.keys(appRouter).sort()).toEqual([
			"entitlements",
			"healthCheck",
			"identity",
			"organizations",
			"parties",
			"privateData",
			"roles",
			"users",
		]);
		expect(Object.keys(appRouter.entitlements).sort()).toEqual(["list"]);
		expect(Object.keys(appRouter.identity).sort()).toEqual([
			"getCurrent",
			"setActiveContext",
		]);
		expect(Object.keys(appRouter.organizations).sort()).toEqual([
			"get",
			"list",
			"listLocations",
			"update",
		]);
		expect(Object.keys(appRouter.users).sort()).toEqual([
			"invite",
			"list",
			"suspendMembership",
		]);
		expect(Object.keys(appRouter.parties).sort()).toEqual([
			"createIdentityLink",
			"createOrganization",
			"createPerson",
			"get",
			"list",
			"update",
		]);
		expect(Object.keys(appRouter.roles).sort()).toEqual(["assign", "list"]);
	});

	test("healthCheck responds OK without a session", async () => {
		expect(
			await call(appRouter.healthCheck, undefined, { context: context() })
		).toBe("OK");
	});

	test("rejects anonymous identity requests", async () => {
		await expect(
			call(
				appRouter.identity.getCurrent,
				{ headers: {} },
				{ context: context() }
			)
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("returns current identity without treating tenant context as a request claim", async () => {
		const result = await call(
			appRouter.identity.getCurrent,
			{ headers: { "x-active-context-id": "context_unit_test_0001" } },
			{ context: context({ session: authenticatedSession }) }
		);
		expect(result.authUserId).toBe("user_unit_test_000001");
		expect(result.activeContext?.tenantId).toBe("tenant_unit_test_0001");
	});

	test("creates a session-bound active context for an authenticated membership", async () => {
		const result = await call(
			appRouter.identity.setActiveContext,
			{
				body: { organizationId: "organization_unit_0001" },
				headers: { "idempotency-key": "idempotency-unit-test-0001" },
			},
			{ context: context({ session: authenticatedSession }) }
		);
		expect(result.contextId).toBe("context_unit_test_0001");
		expect(result.authUserId).toBe("user_unit_test_000001");
	});

	test("fails closed when canonical authorization is not bound", async () => {
		try {
			await call(
				appRouter.organizations.list,
				{
					headers: { "x-active-context-id": "context_unit_test_0001" },
					query: { limit: 50 },
				},
				{ context: context({ session: authenticatedSession }) }
			);
			throw new Error("expected organization listing to fail closed");
		} catch (error) {
			expect(error).toBeInstanceOf(ORPCError);
			expect((error as ORPCError<string, unknown>).code).toBe("FORBIDDEN");
		}
	});

	test("rejects invitation organization substitution before application dispatch", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.users.invite,
				{
					body: {
						email: "invitee@example.test",
						organizationId: "organization_other_0001",
						roleIds: ["role_cashier_0001"],
					},
					headers: {
						"idempotency-key": "idempotency-unit-test-0002",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						allowed: true,
						application: {
							inviteUser: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(dispatched).toBe(false);
	});

	test("reports committed-state projection uncertainty as retryable", async () => {
		await expect(
			call(
				appRouter.users.invite,
				{
					body: {
						email: "invitee@example.test",
						organizationId: "organization_unit_0001",
						roleIds: ["role_cashier_0001"],
					},
					headers: {
						"idempotency-key": "idempotency-unit-test-0003",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						allowed: true,
						application: {
							inviteUser: () =>
								Promise.reject({ code: "dependency_unavailable" }),
						},
						session: authenticatedSession,
					}),
				}
			)
		).rejects.toMatchObject({
			code: "SERVICE_UNAVAILABLE",
			data: { retryable: true, uncertainty: true },
		});
	});

	test("derives Party list scope from the revalidated active context", async () => {
		let dispatchedContextId: string | undefined;
		const result = await call(
			appRouter.parties.list,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				query: { limit: 20, query: "Georgetown" },
			},
			{
				context: context({
					allowed: true,
					application: {
						listParties: ({ contextId }) => {
							dispatchedContextId = contextId;
							return Promise.resolve({ items: [], nextCursor: null });
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(dispatchedContextId).toBe("context_unit_test_0001");
		expect(result).toEqual({ items: [], nextCursor: null });
	});

	test("denies Party creation before application dispatch when permission fails", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.parties.createPerson,
				{
					body: { displayName: "Denied Party" },
					headers: {
						"idempotency-key": "idempotency-party-denied-0001",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createPersonParty: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(dispatched).toBe(false);
	});

	test("lists roles through the governed current-context contract", async () => {
		const result = await call(
			appRouter.roles.list,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				query: { limit: 50 },
			},
			{
				context: context({
					allowed: true,
					application: {
						listRoles: async () => ({
							items: [
								{
									id: "role_tenant_admin_0001",
									name: "Tenant Administrator",
									permissionIds: ["platform.role.read"],
									state: "Active",
									tenantId: "tenant_unit_test_0001",
									version: 1,
								},
							],
							nextCursor: null,
						}),
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result.items[0]?.permissionIds).toEqual(["platform.role.read"]);
	});

	test("lists current-tenant entitlements through the governed contract", async () => {
		const result = await call(
			appRouter.entitlements.list,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				query: { limit: 50 },
			},
			{
				context: context({
					allowed: true,
					application: {
						listEntitlements: async () => ({
							items: [
								{
									capabilityId: "platform.entitlements",
									dependencies: [],
									endsAt: null,
									exclusions: [],
									id: "entitlement_unit_0001",
									limits: {},
									organizationId: null,
									source: "Migration",
									startsAt: "2026-07-14T00:00:00.000Z",
									state: "Active",
									tenantId: "tenant_unit_test_0001",
									version: 1,
								},
							],
							nextCursor: null,
						}),
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result.items[0]?.capabilityId).toBe("platform.entitlements");
	});

	test("denies role assignment before application dispatch", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.roles.assign,
				{
					body: {
						membershipId: "membership_unit_0001",
						roleId: "role_tenant_admin_0001",
						scopeType: "Tenant",
						startsAt: "2026-07-14T12:00:00.000Z",
					},
					headers: {
						"idempotency-key": "idempotency-role-assignment-0001",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createRoleAssignment: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		).rejects.toMatchObject({ code: "FORBIDDEN" });
		expect(dispatched).toBe(false);
	});

	test("privateData returns the session user for authenticated callers", async () => {
		const result = await call(appRouter.privateData, undefined, {
			context: context({ session: authenticatedSession }),
		});
		expect(result.user?.id).toBe("user_unit_test_000001");
		expect(result.user?.email).toBe("test.user@example.com");
	});
});
