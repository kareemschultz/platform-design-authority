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
	onDecide?: (request: Parameters<Context["authorizer"]["decide"]>[0]) => void;
	session?: Context["session"];
}): Context {
	return {
		application: {
			acceptImport: () => Promise.reject(new Error("not used")),
			activateProduct: () => Promise.reject(new Error("not used")),
			approveImport: () => Promise.reject(new Error("not used")),
			approveInventoryAdjustment: () => Promise.reject(new Error("not used")),
			approveStockCount: () => Promise.reject(new Error("not used")),
			archiveProduct: () => Promise.reject(new Error("not used")),
			cancelImport: () => Promise.reject(new Error("not used")),
			createEventReplay: () => Promise.reject(new Error("not used")),
			createIdentityLink: () => Promise.reject(new Error("not used")),
			createImport: () => Promise.reject(new Error("not used")),
			createInventoryAdjustment: () => Promise.reject(new Error("not used")),
			createOrganizationParty: () => Promise.reject(new Error("not used")),
			createPersonParty: () => Promise.reject(new Error("not used")),
			createProduct: () => Promise.reject(new Error("not used")),
			createRoleAssignment: () => Promise.reject(new Error("not used")),
			createStockCount: () => Promise.reject(new Error("not used")),
			createStockTransfer: () => Promise.reject(new Error("not used")),
			dispatchStockTransfer: () => Promise.reject(new Error("not used")),
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
			getImport: () => Promise.reject(new Error("not used")),
			getImportCorrectionReport: () => Promise.reject(new Error("not used")),
			getInventoryAdjustment: () => Promise.reject(new Error("not used")),
			getOrganization: () => Promise.reject(new Error("not used")),
			getParty: () => Promise.reject(new Error("not used")),
			getProduct: () => Promise.reject(new Error("not used")),
			getStockCount: () => Promise.reject(new Error("not used")),
			getStockTransfer: () => Promise.reject(new Error("not used")),
			inviteUser: () => Promise.reject(new Error("not used")),
			listAuditRecords: async () => ({ items: [], nextCursor: null }),
			listCurrentUserSessions: async () => ({ items: [], nextCursor: null }),
			listEntitlements: async () => ({ items: [], nextCursor: null }),
			listImportFindings: () => Promise.reject(new Error("not used")),
			listImports: async () => ({ items: [], nextCursor: null }),
			listInventoryAdjustments: async () => ({ items: [], nextCursor: null }),
			listLocations: async () => ({ items: [], nextCursor: null }),
			listOrganizations: async () => ({ items: [], nextCursor: null }),
			listParties: async () => ({ items: [], nextCursor: null }),
			listProducts: async () => ({ items: [], nextCursor: null }),
			listRoles: async () => ({ items: [], nextCursor: null }),
			listStockBalances: async () => ({ items: [], nextCursor: null }),
			listStockCounts: async () => ({ items: [], nextCursor: null }),
			listStockTransfers: async () => ({ items: [], nextCursor: null }),
			listUsers: async () => ({ items: [], nextCursor: null }),
			purgeImportStaging: async () => ({ findings: 0, rows: 0, waves: 0 }),
			receiveStockTransfer: () => Promise.reject(new Error("not used")),
			reverseInventoryAdjustment: () => Promise.reject(new Error("not used")),
			revokeCurrentUserSession: () => Promise.resolve(),
			saveStockCountDraft: () => Promise.reject(new Error("not used")),
			setActiveContext: async ({ authUserId, body }) => ({
				authUserId,
				contextId: "context_unit_test_0001",
				expiresAt: "2026-07-13T13:00:00.000Z",
				issuedAt: "2026-07-13T12:00:00.000Z",
				organizationId: body.organizationId,
				tenantId: "tenant_unit_test_0001",
			}),
			submitStockCount: () => Promise.reject(new Error("not used")),
			suspendMembership: () => Promise.reject(new Error("not used")),
			updateOrganization: () => Promise.reject(new Error("not used")),
			updateParty: () => Promise.reject(new Error("not used")),
			updateProduct: () => Promise.reject(new Error("not used")),
			...input?.application,
		},
		authorizer: {
			decide: (request) => {
				input?.onDecide?.(request);
				return Promise.resolve(
					input?.allowed
						? {
								matchedAssignments: [],
								outcome: "allow" as const,
								permission: request.permission,
							}
						: { outcome: "deny" as const, reason: "no_assignment" as const }
				);
			},
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
	test("exposes the governed PR3 through PR7 procedure families", () => {
		expect(Object.keys(appRouter).sort()).toEqual([
			"audit",
			"catalog",
			"entitlements",
			"events",
			"healthCheck",
			"identity",
			"inventory",
			"organizations",
			"parties",
			"privateData",
			"roles",
			"sessions",
			"users",
		]);
		expect(Object.keys(appRouter.catalog).sort()).toEqual([
			"imports",
			"products",
		]);
		expect(Object.keys(appRouter.catalog.products).sort()).toEqual([
			"activate",
			"archive",
			"create",
			"get",
			"list",
			"update",
		]);
		expect(Object.keys(appRouter.catalog.imports).sort()).toEqual([
			"accept",
			"approve",
			"cancel",
			"correctionReport",
			"create",
			"findings",
			"get",
			"list",
			"purgeStaging",
		]);
		expect(Object.keys(appRouter.entitlements).sort()).toEqual(["list"]);
		expect(Object.keys(appRouter.events).sort()).toEqual(["createReplay"]);
		expect(Object.keys(appRouter.inventory).sort()).toEqual([
			"adjustments",
			"balances",
			"counts",
			"imports",
			"transfers",
		]);
		expect(Object.keys(appRouter.inventory.imports).sort()).toEqual([
			"acceptOpeningStock",
			"approveOpeningStock",
			"cancelOpeningStock",
			"createOpeningStock",
			"getOpeningStock",
			"listOpeningStock",
			"openingStockCorrectionReport",
			"openingStockFindings",
			"purgeOpeningStockStaging",
		]);
		expect(Object.keys(appRouter.audit).sort()).toEqual(["list"]);
		expect(Object.keys(appRouter.sessions).sort()).toEqual(["list", "revoke"]);
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

	test("dispatches a validated Catalog Product command with current context and permission", async () => {
		let received:
			| Parameters<Context["application"]["createProduct"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.catalog.products.create,
			{
				body: {
					name: "Ground Coffee",
					variants: [
						{
							identifiers: [
								{
									scheme: "Tenant",
									type: "SKU",
									value: "COFFEE-500",
								},
							],
							name: "500g",
						},
					],
				},
				headers: {
					"idempotency-key": "idempotency-catalog-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createProduct(input) {
							received = input;
							return Promise.resolve({
								archivedAt: null,
								archiveReason: null,
								createdAt: "2026-07-13T12:00:00.000Z",
								id: "product_unit_test_0001",
								name: input.body.name,
								state: "Draft",
								updatedAt: "2026-07-13T12:00:00.000Z",
								variants: [
									{
										id: "variant_unit_test_0001",
										identifiers: [
											{
												id: "identifier_unit_test_0001",
												scheme: "Tenant",
												type: "SKU",
												value: "COFFEE-500",
											},
										],
										name: "500g",
									},
								],
								version: 1,
							});
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);

		expect(result.id).toBe("product_unit_test_0001");
		expect(permission).toBe("catalog.product.create");
		expect(received).toMatchObject({
			actorUserId: "user_unit_test_000001",
			contextId: "context_unit_test_0001",
			idempotencyKey: "idempotency-catalog-unit-0001",
			sessionId: "session_unit_test_0001",
		});
	});

	test("dispatches retention purge only through the dedicated current-context permission", async () => {
		let received:
			| Parameters<Context["application"]["purgeImportStaging"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.catalog.imports.purgeStaging,
			{
				headers: {
					"idempotency-key": "idempotency-import-purge-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { importId: "import_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						purgeImportStaging(input) {
							received = input;
							return Promise.resolve({ findings: 2, rows: 1, waves: 1 });
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toEqual({ findings: 2, rows: 1, waves: 1 });
		expect(permission).toBe("catalog.import.purge");
		expect(received).toMatchObject({
			actorUserId: "user_unit_test_000001",
			contextId: "context_unit_test_0001",
			idempotencyKey: "idempotency-import-purge-0001",
			importId: "import_unit_test_0001",
			sessionId: "session_unit_test_0001",
			target: "Product",
		});
	});

	test("dispatches Inventory Adjustment only after current-context permission enforcement", async () => {
		let received:
			| Parameters<Context["application"]["createInventoryAdjustment"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.inventory.adjustments.create,
			{
				body: {
					locationId: "location_unit_0001",
					productId: "product_unit_0001",
					quantity: "2.500001",
					reason: "controlled correction",
					unit: "each",
				},
				headers: {
					"idempotency-key": "idempotency-inventory-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createInventoryAdjustment(input) {
							received = input;
							return Promise.resolve({
								...input.body,
								approvedByUserId: null,
								createdAt: "2026-07-13T12:00:00.000Z",
								createdByUserId: input.actorUserId,
								id: "adjustment_unit_0001",
								movementId: null,
								postedAt: null,
								reversalMovementId: null,
								state: "PendingApproval",
								updatedAt: "2026-07-13T12:00:00.000Z",
								version: 1,
							});
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({
			id: "adjustment_unit_0001",
			quantity: "2.500001",
			state: "PendingApproval",
		});
		expect(permission).toBe("inventory.adjustment.create");
		expect(received).toMatchObject({
			actorUserId: "user_unit_test_000001",
			contextId: "context_unit_test_0001",
			idempotencyKey: "idempotency-inventory-unit-0001",
			sessionId: "session_unit_test_0001",
		});
	});

	test("returns paged stock balances without exposing repository cursors", async () => {
		let received:
			| Parameters<Context["application"]["listStockBalances"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.inventory.balances.list,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				query: {
					cursor: "sb1_b3BhcXVlLWN1cnNvcg",
					limit: 25,
					locationId: "location_unit_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						listStockBalances(input) {
							received = input;
							return Promise.resolve({
								items: [
									{
										asOf: "2026-07-16T12:00:00.000Z",
										available: "8",
										locationId: "location_unit_0001",
										onHand: "10",
										productId: "product_unit_0001",
										reconciled: true,
										reconciliationState: "Current",
										reserved: "2",
										source: "InventoryLedgerProjection",
										unit: "EA",
									},
								],
								nextCursor: "sb1_bmV4dC1jdXJzb3I",
							});
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({
			items: [{ reconciled: true, source: "InventoryLedgerProjection" }],
			nextCursor: "sb1_bmV4dC1jdXJzb3I",
		});
		expect(permission).toBe("inventory.balance.read");
		expect(received?.query).toEqual({
			cursor: "sb1_b3BhcXVlLWN1cnNvcg",
			limit: 25,
			locationId: "location_unit_0001",
		});
	});

	test("dispatches versioned draft count lines through count-create authority", async () => {
		let received:
			| Parameters<Context["application"]["saveStockCountDraft"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.inventory.counts.saveDraft,
			{
				body: {
					lines: [
						{
							observedQuantity: "4.500001",
							productId: "product_unit_0001",
							unit: "EA",
						},
					],
				},
				headers: {
					"idempotency-key": "count-draft-save-unit-0001",
					"if-match": "3",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { id: "count_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						saveStockCountDraft(input) {
							received = input;
							return Promise.resolve({
								approvedByUserId: null,
								blind: true,
								createdAt: "2026-07-16T12:00:00.000Z",
								createdByUserId: input.actorUserId,
								id: input.countId,
								lines: [],
								locationId: "location_unit_0001",
								postedAt: null,
								state: "InProgress",
								submittedByUserId: null,
								updatedAt: "2026-07-16T12:05:00.000Z",
								version: input.version + 1,
							});
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "InProgress", version: 4 });
		expect(permission).toBe("inventory.count.create");
		expect(received).toMatchObject({
			actorUserId: "user_unit_test_000001",
			countId: "count_unit_test_0001",
			idempotencyKey: "count-draft-save-unit-0001",
			version: 3,
		});
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
		let authorizationRequest:
			| Parameters<Context["authorizer"]["decide"]>[0]
			| undefined;
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
					onDecide: (request) => {
						authorizationRequest = request;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result.items[0]?.capabilityId).toBe("platform.entitlements");
		expect(authorizationRequest?.resourceScope).toEqual({
			scopeType: "Tenant",
		});
	});

	test("denies entitlement inspection at the transport boundary before dispatch", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.entitlements.list,
				{
					headers: { "x-active-context-id": "context_unit_test_0001" },
					query: { limit: 50 },
				},
				{
					context: context({
						application: {
							listEntitlements: () => {
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

	test("lists only the authenticated account's safe session summaries", async () => {
		let observedUserId = "";
		const result = await call(
			appRouter.sessions.list,
			{ query: { limit: 50 } },
			{
				context: context({
					application: {
						listCurrentUserSessions: ({ authUserId }) => {
							observedUserId = authUserId;
							return Promise.resolve({
								items: [
									{
										createdAt: "2026-07-13T12:00:00.000Z",
										current: true,
										deviceLabel: "Windows device",
										expiresAt: "2026-07-13T13:00:00.000Z",
										id: "session_unit_test_0001",
										ipAddressMasked: "203.0.113.x",
										updatedAt: "2026-07-13T12:00:00.000Z",
										userAgentSummary: "Chrome on Windows device",
									},
								],
								nextCursor: null,
							});
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(observedUserId).toBe("user_unit_test_000001");
		expect(result.items[0]?.current).toBe(true);
	});

	test("revokes an owned session through the idempotent account command", async () => {
		let observedSessionId = "";
		await call(
			appRouter.sessions.revoke,
			{
				headers: { "idempotency-key": "idempotency-session-unit-0001" },
				params: { sessionId: "session_unit_test_0001" },
			},
			{
				context: context({
					application: {
						revokeCurrentUserSession: ({ sessionId }) => {
							observedSessionId = sessionId;
							return Promise.resolve();
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(observedSessionId).toBe("session_unit_test_0001");
	});

	test("denies unauthenticated session enumeration", async () => {
		await expect(
			call(
				appRouter.sessions.list,
				{ query: { limit: 50 } },
				{ context: context() }
			)
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});

	test("derives Audit query tenant from revalidated active context", async () => {
		let observedTenantId = "";
		const result = await call(
			appRouter.audit.list,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				query: { limit: 50 },
			},
			{
				context: context({
					allowed: true,
					application: {
						listAuditRecords: ({ page }) => {
							observedTenantId = page.tenantId;
							return Promise.resolve({ items: [], nextCursor: null });
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(observedTenantId).toBe("tenant_unit_test_0001");
		expect(result).toEqual({ items: [], nextCursor: null });
	});

	test("denies Audit access before application dispatch when permission fails", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.audit.list,
				{
					headers: { "x-active-context-id": "context_unit_test_0001" },
					query: { limit: 50 },
				},
				{
					context: context({
						application: {
							listAuditRecords: () => {
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

	test("derives replay tenant and actor from the revalidated active context", async () => {
		let observedTenantId = "";
		const result = await call(
			appRouter.events.createReplay,
			{
				body: {
					consumerId: "catalog-search-projection",
					consumerSchemaVersion: "1.0.0",
					eventNames: ["catalog.product.created.v1"],
					firstSequence: "1",
					lastSequence: "2",
					purpose: "Rebuild a verified bounded projection.",
				},
				headers: {
					"idempotency-key": "event-replay-unit-test-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createEventReplay: ({ tenantId }) => {
							observedTenantId = tenantId;
							return Promise.resolve({
								consumerId: "catalog-search-projection",
								consumerSchemaVersion: "1.0.0",
								eventNames: ["catalog.product.created.v1"],
								firstSequence: "1",
								id: "event_replay_unit_test_0001",
								lastSequence: "2",
								requestedAt: "2026-07-15T12:00:00.000Z",
								state: "Pending",
							});
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(observedTenantId).toBe("tenant_unit_test_0001");
		expect(result.state).toBe("Pending");
	});

	test("denies replay at the transport boundary before application dispatch", async () => {
		let dispatched = false;
		await expect(
			call(
				appRouter.events.createReplay,
				{
					body: {
						consumerId: "catalog-search-projection",
						consumerSchemaVersion: "1.0.0",
						eventNames: ["catalog.product.created.v1"],
						firstSequence: "1",
						lastSequence: "2",
						purpose: "Rebuild a verified bounded projection.",
					},
					headers: {
						"idempotency-key": "event-replay-unit-test-0002",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createEventReplay: () => {
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
