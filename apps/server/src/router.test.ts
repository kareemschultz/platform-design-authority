import { describe, expect, test } from "bun:test";
import type {
	AccountantHandoffExport,
	Deposit,
	Receipt,
	Refund,
	Return,
	Sale,
} from "@meridian/contracts-platform-api";
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
			approveCashVariance: () => Promise.reject(new Error("not used")),
			approveImport: () => Promise.reject(new Error("not used")),
			approveInventoryAdjustment: () => Promise.reject(new Error("not used")),
			approveRefund: () => Promise.reject(new Error("not used")),
			approveReturn: () => Promise.reject(new Error("not used")),
			approveSalePriceOverride: () => Promise.reject(new Error("not used")),
			approveStockCount: () => Promise.reject(new Error("not used")),
			archiveProduct: () => Promise.reject(new Error("not used")),
			cancelImport: () => Promise.reject(new Error("not used")),
			closeRegister: () => Promise.reject(new Error("not used")),
			completeSale: () => Promise.reject(new Error("not used")),
			confirmDeposit: () => Promise.reject(new Error("not used")),
			createAccountantHandoffExport: () =>
				Promise.reject(new Error("not used")),
			createCashMovement: () => Promise.reject(new Error("not used")),
			createDeposit: () => Promise.reject(new Error("not used")),
			createEventReplay: () => Promise.reject(new Error("not used")),
			createIdentityLink: () => Promise.reject(new Error("not used")),
			createImport: () => Promise.reject(new Error("not used")),
			createInventoryAdjustment: () => Promise.reject(new Error("not used")),
			createOrganizationParty: () => Promise.reject(new Error("not used")),
			createPersonParty: () => Promise.reject(new Error("not used")),
			createProduct: () => Promise.reject(new Error("not used")),
			createRefund: () => Promise.reject(new Error("not used")),
			createReturn: () => Promise.reject(new Error("not used")),
			createRoleAssignment: () => Promise.reject(new Error("not used")),
			createSafeDrop: () => Promise.reject(new Error("not used")),
			createSale: () => Promise.reject(new Error("not used")),
			createStockCount: () => Promise.reject(new Error("not used")),
			createStockTransfer: () => Promise.reject(new Error("not used")),
			dispatchStockTransfer: () => Promise.reject(new Error("not used")),
			getAccountantHandoffExport: () => Promise.reject(new Error("not used")),
			getCashVariance: () => Promise.reject(new Error("not used")),
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
			getDeposit: () => Promise.reject(new Error("not used")),
			getImport: () => Promise.reject(new Error("not used")),
			getImportCorrectionReport: () => Promise.reject(new Error("not used")),
			getInventoryAdjustment: () => Promise.reject(new Error("not used")),
			getOrganization: () => Promise.reject(new Error("not used")),
			getParty: () => Promise.reject(new Error("not used")),
			getProduct: () => Promise.reject(new Error("not used")),
			getReceipt: () => Promise.reject(new Error("not used")),
			getReceiptByNumber: () => Promise.reject(new Error("not used")),
			getRefund: () => Promise.reject(new Error("not used")),
			getRegisterSession: () => Promise.reject(new Error("not used")),
			getReturn: () => Promise.reject(new Error("not used")),
			getSaleForReturn: () => Promise.reject(new Error("not used")),
			getStockCount: () => Promise.reject(new Error("not used")),
			getStockTransfer: () => Promise.reject(new Error("not used")),
			holdSale: () => Promise.reject(new Error("not used")),
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
			openRegister: () => Promise.reject(new Error("not used")),
			purgeImportStaging: async () => ({ findings: 0, rows: 0, waves: 0 }),
			receiveStockTransfer: () => Promise.reject(new Error("not used")),
			reissueReceipt: () => Promise.reject(new Error("not used")),
			requestSalePriceOverride: () => Promise.reject(new Error("not used")),
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
			voidReceipt: () => Promise.reject(new Error("not used")),
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

async function captureOrpcError(
	operation: Promise<unknown>
): Promise<ORPCError<string, unknown>> {
	try {
		await operation;
		throw new Error("Expected an oRPC error");
	} catch (error) {
		if (error instanceof ORPCError) {
			return error as ORPCError<string, unknown>;
		}
		throw error;
	}
}

describe("appRouter contract surface", () => {
	test("exposes the governed PR3 through PR7 procedure families", () => {
		expect(Object.keys(appRouter).sort()).toEqual([
			"audit",
			"catalog",
			"commerce",
			"entitlements",
			"events",
			"exports",
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
		expect(Object.keys(appRouter.commerce).sort()).toEqual([
			"cashMovements",
			"cashVariances",
			"deposits",
			"priceOverrides",
			"receipts",
			"refunds",
			"registerSessions",
			"registers",
			"returns",
			"safeDrops",
			"sales",
		]);
		expect(Object.keys(appRouter.commerce.deposits).sort()).toEqual([
			"confirm",
			"create",
			"get",
		]);
		expect(Object.keys(appRouter.exports).sort()).toEqual([
			"createAccountantHandoff",
			"get",
		]);
		expect(Object.keys(appRouter.commerce.registers).sort()).toEqual([
			"close",
			"open",
		]);
		// WS3 remediation R3, Finding I: `commerce.register.close`'s and
		// `commerce.cash-variance.approve`'s pre-commit consequence-preview
		// reads live under a dedicated `registerSessions`/`cashVariances`
		// namespace rather than `registers` — the resource being read is the
		// RegisterSession, not the register-open/close command surface.
		expect(Object.keys(appRouter.commerce.registerSessions).sort()).toEqual([
			"get",
		]);
		expect(Object.keys(appRouter.commerce.cashMovements).sort()).toEqual([
			"create",
		]);
		expect(Object.keys(appRouter.commerce.safeDrops).sort()).toEqual([
			"create",
		]);
		expect(Object.keys(appRouter.commerce.cashVariances).sort()).toEqual([
			"approve",
			"get",
		]);
		expect(Object.keys(appRouter.commerce.sales).sort()).toEqual([
			"complete",
			"create",
			"getForReturn",
			"hold",
		]);
		expect(Object.keys(appRouter.commerce.priceOverrides).sort()).toEqual([
			"approve",
			"request",
		]);
		expect(Object.keys(appRouter.commerce.receipts).sort()).toEqual([
			"get",
			"getByNumber",
			"reissue",
			"void",
		]);
		expect(Object.keys(appRouter.commerce.refunds).sort()).toEqual([
			"approve",
			"create",
			"get",
		]);
		expect(Object.keys(appRouter.commerce.returns).sort()).toEqual([
			"approve",
			"create",
			"get",
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

	test("denies a UI-hidden direct Adjustment approval before application dispatch", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.inventory.adjustments.approve,
				{
					headers: {
						"idempotency-key": "hidden-adjustment-approval-denied",
						"if-match": "1",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { id: "adjustment_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							approveInventoryAdjustment: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({
			code: "FORBIDDEN",
			data: {
				code: "authorization",
				detail: null,
				safeMessageKey: "problem.authorization",
				status: 403,
				title: "Permission denied",
			},
		});
		expect(JSON.stringify(error.data)).not.toContain(
			"inventory.adjustment.approve"
		);
	});

	test("maps a direct Adjustment entitlement denial without disclosing provisioning facts", async () => {
		const error = await captureOrpcError(
			call(
				appRouter.inventory.adjustments.approve,
				{
					headers: {
						"idempotency-key": "hidden-adjustment-entitlement-denied",
						"if-match": "1",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { id: "adjustment_hidden_unit_0001" },
				},
				{
					context: context({
						allowed: true,
						application: {
							approveInventoryAdjustment: () =>
								Promise.reject({
									code: "entitlement_denied",
									message:
										"tenant_secret_42 lacks inventory.adjustments under commercial plan premium-secret",
								}),
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(error).toMatchObject({
			code: "FORBIDDEN",
			data: {
				code: "entitlement",
				detail: null,
				safeMessageKey: "problem.entitlement",
				status: 403,
				title: "Capability entitlement denied",
			},
		});
		const serialized = JSON.stringify(error.data);
		expect(serialized).not.toContain("tenant_secret_42");
		expect(serialized).not.toContain("premium-secret");
		expect(serialized).not.toContain("inventory.adjustments");
	});

	test("dispatches openRegister only after permission enforcement, deriving locationId from the active context", async () => {
		let received:
			| Parameters<Context["application"]["openRegister"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.registers.open,
			{
				body: {
					currency: "GYD",
					openingFloat: { amountMinor: 50_000, currency: "GYD" },
				},
				headers: {
					"idempotency-key": "idempotency-register-open-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { registerId: "register_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
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
										locationId: "location_unit_test_0001",
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
						openRegister(input) {
							received = input;
							return Promise.resolve({
								closedAt: null,
								closeReason: null,
								countedCash: null,
								currency: "GYD",
								expectedCash: null,
								id: "session_unit_test_0001",
								locationId: "location_unit_test_0001",
								openedAt: "2026-07-13T12:00:00.000Z",
								openerPartyId: "party_unit_test_0001",
								openingFloat: input.openingFloat,
								registerId: input.registerId,
								state: "Open" as const,
								variance: null,
								varianceApprovalRequired: false,
								varianceApprovedAt: null,
								varianceApproverPartyId: null,
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
			id: "session_unit_test_0001",
			registerId: "register_unit_test_0001",
			state: "Open",
		});
		expect(permission).toBe("commerce.register.open");
		expect(received).toMatchObject({
			actorUserId: "user_unit_test_000001",
			contextId: "context_unit_test_0001",
			currency: "GYD",
			idempotencyKey: "idempotency-register-open-unit-0001",
			locationId: "location_unit_test_0001",
			openingFloat: { amountMinor: 50_000, currency: "GYD" },
			registerId: "register_unit_test_0001",
			sessionId: "session_unit_test_0001",
		});
	});

	test("denies register open before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.registers.open,
				{
					body: {
						currency: "GYD",
						openingFloat: { amountMinor: 0, currency: "GYD" },
					},
					headers: {
						"idempotency-key": "idempotency-register-open-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { registerId: "register_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							openRegister: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({
			code: "FORBIDDEN",
			data: {
				code: "authorization",
				status: 403,
				title: "Permission denied",
			},
		});
	});

	test("rejects register open when the active context carries no location, before application dispatch", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.registers.open,
				{
					body: {
						currency: "GYD",
						openingFloat: { amountMinor: 0, currency: "GYD" },
					},
					headers: {
						"idempotency-key": "idempotency-register-open-no-location",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { registerId: "register_no_location_unit_0001" },
				},
				{
					context: context({
						allowed: true,
						application: {
							openRegister: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({
			code: "BAD_REQUEST",
			data: {
				code: "validation",
				status: 400,
			},
		});
	});

	test("dispatches closeRegister with the counted cash and reason from the request body", async () => {
		let received:
			| Parameters<Context["application"]["closeRegister"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.registers.close,
			{
				body: {
					countedCash: { amountMinor: 9500, currency: "GYD" },
					reason: "end of shift count",
				},
				headers: {
					"idempotency-key": "idempotency-register-close-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { registerId: "register_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						closeRegister(input) {
							received = input;
							return Promise.resolve({
								closedAt: "2026-07-13T18:00:00.000Z",
								closeReason: input.reason ?? null,
								countedCash: input.countedCash,
								currency: "GYD",
								expectedCash: { amountMinor: 9500, currency: "GYD" },
								id: "session_unit_test_0001",
								locationId: "location_unit_test_0001",
								openedAt: "2026-07-13T12:00:00.000Z",
								openerPartyId: "party_unit_test_0001",
								openingFloat: { amountMinor: 10_000, currency: "GYD" },
								registerId: input.registerId,
								state: "Closed" as const,
								variance: { amountMinor: 0, currency: "GYD" },
								varianceApprovalRequired: false,
								varianceApprovedAt: null,
								varianceApproverPartyId: null,
								version: 2,
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
			id: "session_unit_test_0001",
			state: "Closed",
		});
		expect(permission).toBe("commerce.register.close");
		expect(received).toMatchObject({
			countedCash: { amountMinor: 9500, currency: "GYD" },
			reason: "end of shift count",
			registerId: "register_unit_test_0001",
		});
	});

	test("denies register close before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.registers.close,
				{
					body: { countedCash: { amountMinor: 0, currency: "GYD" } },
					headers: {
						"idempotency-key": "idempotency-register-close-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { registerId: "register_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							closeRegister: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches a cash movement with the direction, reason code, and amount from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createCashMovement"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.cashMovements.create,
			{
				body: {
					amount: { amountMinor: 2500, currency: "GYD" },
					direction: "PaidOut",
					reasonCode: "PaidOut",
				},
				headers: {
					"idempotency-key": "idempotency-cash-movement-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { registerId: "register_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						createCashMovement(input) {
							received = input;
							return Promise.resolve({
								amount: input.amount,
								createdAt: "2026-07-13T12:30:00.000Z",
								direction: input.direction,
								id: "movement_unit_test_0001",
								note: input.note ?? null,
								reasonCode: input.reasonCode,
								referenceId: input.referenceId ?? null,
								registerId: input.registerId,
								sessionId: "session_unit_test_0001",
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
			amount: { amountMinor: 2500, currency: "GYD" },
			direction: "PaidOut",
			id: "movement_unit_test_0001",
		});
		expect(permission).toBe("commerce.cash-movement.create");
		expect(received).toMatchObject({
			amount: { amountMinor: 2500, currency: "GYD" },
			direction: "PaidOut",
			reasonCode: "PaidOut",
			registerId: "register_unit_test_0001",
		});
	});

	test("denies a cash movement before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.cashMovements.create,
				{
					body: {
						amount: { amountMinor: 100, currency: "GYD" },
						direction: "PaidIn",
						reasonCode: "PaidIn",
					},
					headers: {
						"idempotency-key": "idempotency-cash-movement-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { registerId: "register_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							createCashMovement: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches a safe drop through the dedicated transport method, not the general cash-movement one", async () => {
		let receivedSafeDrop:
			| Parameters<Context["application"]["createSafeDrop"]>[0]
			| undefined;
		let generalMovementCalled = false;
		const result = await call(
			appRouter.commerce.safeDrops.create,
			{
				body: {
					amount: { amountMinor: 15_000, currency: "GYD" },
					note: "midday safe drop",
				},
				headers: {
					"idempotency-key": "idempotency-safe-drop-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { registerId: "register_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						createCashMovement: () => {
							generalMovementCalled = true;
							return Promise.reject(new Error("must not be called"));
						},
						createSafeDrop(input) {
							receivedSafeDrop = input;
							return Promise.resolve({
								amount: input.amount,
								createdAt: "2026-07-13T12:45:00.000Z",
								direction: "PaidOut" as const,
								id: "movement_unit_test_safe_drop",
								note: input.note ?? null,
								reasonCode: "SafeDrop" as const,
								referenceId: null,
								registerId: input.registerId,
								sessionId: "session_unit_test_0001",
							});
						},
					},
					onDecide: () => undefined,
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({
			direction: "PaidOut",
			reasonCode: "SafeDrop",
		});
		expect(generalMovementCalled).toBe(false);
		expect(receivedSafeDrop).toMatchObject({
			amount: { amountMinor: 15_000, currency: "GYD" },
			note: "midday safe drop",
			registerId: "register_unit_test_0001",
		});
	});

	test("dispatches cash-variance approval with the varianceId and If-Match version from the request", async () => {
		let received:
			| Parameters<Context["application"]["approveCashVariance"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.cashVariances.approve,
			{
				headers: {
					"idempotency-key": "idempotency-cash-variance-unit-0001",
					"if-match": "2",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { varianceId: "session_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						approveCashVariance(input) {
							received = input;
							return Promise.resolve({
								closedAt: "2026-07-13T18:05:00.000Z",
								closeReason: "end of shift count",
								countedCash: { amountMinor: 9500, currency: "GYD" },
								currency: "GYD",
								expectedCash: { amountMinor: 10_000, currency: "GYD" },
								id: input.registerSessionId,
								locationId: "location_unit_test_0001",
								openedAt: "2026-07-13T12:00:00.000Z",
								openerPartyId: "party_unit_test_0001",
								openingFloat: { amountMinor: 10_000, currency: "GYD" },
								registerId: "register_unit_test_0001",
								state: "Closed" as const,
								variance: { amountMinor: -500, currency: "GYD" },
								varianceApprovalRequired: true,
								varianceApprovedAt: "2026-07-13T18:05:00.000Z",
								varianceApproverPartyId: "party_unit_test_checker",
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
		expect(result).toMatchObject({
			id: "session_unit_test_0001",
			state: "Closed",
		});
		expect(permission).toBe("commerce.cash-variance.approve");
		expect(received).toMatchObject({
			registerSessionId: "session_unit_test_0001",
			version: 2,
		});
	});

	test("denies cash-variance approval before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.cashVariances.approve,
				{
					headers: {
						"idempotency-key": "idempotency-cash-variance-denied",
						"if-match": "1",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { varianceId: "session_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							approveCashVariance: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	// -- WS3 PR2: sales, price overrides, receipts --------------------------

	function fakeSale(overrides: Partial<Sale> = {}) {
		return {
			change: null,
			completedAt: null,
			currency: "GYD",
			customerPartyId: null,
			discount: { amountMinor: 0, currency: "GYD" },
			gross: { amountMinor: 100_000, currency: "GYD" },
			heldAt: null,
			id: "sale_unit_test_0001",
			lines: [],
			receiptId: null,
			registerId: "register_unit_test_0001",
			sessionId: "session_unit_test_0001",
			state: "Open" as const,
			tax: { amountMinor: 14_000, currency: "GYD" },
			tendered: null,
			total: { amountMinor: 114_000, currency: "GYD" },
			version: 1,
			...overrides,
		};
	}

	test("dispatches sale creation with the register, currency, and lines from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createSale"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.sales.create,
			{
				body: {
					currency: "GYD",
					lines: [
						{
							productId: "product_unit_test_0001",
							quantity: "2",
							unit: "each",
							unitPrice: { amountMinor: 50_000, currency: "GYD" },
						},
					],
					registerId: "register_unit_test_0001",
				},
				headers: {
					"idempotency-key": "idempotency-sale-create-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createSale(input) {
							received = input;
							return Promise.resolve(fakeSale());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ id: "sale_unit_test_0001", state: "Open" });
		expect(permission).toBe("commerce.sale.create");
		expect(received).toMatchObject({
			currency: "GYD",
			lines: [
				{
					productId: "product_unit_test_0001",
					quantity: "2",
					unit: "each",
					unitPrice: { amountMinor: 50_000, currency: "GYD" },
				},
			],
			registerId: "register_unit_test_0001",
		});
	});

	test("denies sale creation before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.sales.create,
				{
					body: {
						currency: "GYD",
						lines: [
							{
								productId: "product_unit_test_0001",
								quantity: "1",
								unit: "each",
								unitPrice: { amountMinor: 10_000, currency: "GYD" },
							},
						],
						registerId: "register_hidden_unit_0001",
					},
					headers: {
						"idempotency-key": "idempotency-sale-create-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createSale: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches sale completion with the saleId and flattened cash tenders from the request", async () => {
		let received:
			| Parameters<Context["application"]["completeSale"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.sales.complete,
			{
				body: {
					tenders: [
						{
							amount: { amountMinor: 114_000, currency: "GYD" },
							type: "Cash" as const,
						},
					],
				},
				headers: {
					"idempotency-key": "idempotency-sale-complete-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { saleId: "sale_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						completeSale(input) {
							received = input;
							return Promise.resolve(
								fakeSale({
									change: { amountMinor: 0, currency: "GYD" },
									completedAt: "2026-07-13T12:30:00.000Z",
									receiptId: "receipt_unit_test_0001",
									state: "Completed",
									tendered: { amountMinor: 114_000, currency: "GYD" },
								})
							);
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
			receiptId: "receipt_unit_test_0001",
			state: "Completed",
		});
		expect(permission).toBe("commerce.sale.complete");
		expect(received).toMatchObject({
			saleId: "sale_unit_test_0001",
			tenders: [{ amountMinor: 114_000, currency: "GYD", type: "Cash" }],
		});
	});

	test("denies sale completion before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.sales.complete,
				{
					body: {
						tenders: [
							{
								amount: { amountMinor: 1000, currency: "GYD" },
								type: "Cash" as const,
							},
						],
					},
					headers: {
						"idempotency-key": "idempotency-sale-complete-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { saleId: "sale_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							completeSale: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches sale hold with the saleId from the request path", async () => {
		let received: Parameters<Context["application"]["holdSale"]>[0] | undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.sales.hold,
			{
				headers: {
					"idempotency-key": "idempotency-sale-hold-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { saleId: "sale_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						holdSale(input) {
							received = input;
							return Promise.resolve(
								fakeSale({
									heldAt: "2026-07-13T12:15:00.000Z",
									state: "Held",
								})
							);
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Held" });
		expect(permission).toBe("commerce.sale.hold");
		expect(received).toMatchObject({ saleId: "sale_unit_test_0001" });
	});

	test("denies sale hold before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.sales.hold,
				{
					headers: {
						"idempotency-key": "idempotency-sale-hold-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { saleId: "sale_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							holdSale: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches a price-override request with the lineId, requestedPrice, and reason from the request body", async () => {
		let received:
			| Parameters<Context["application"]["requestSalePriceOverride"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.priceOverrides.request,
			{
				body: {
					lineId: "sale_line_unit_test_0001",
					reason: "Manager-approved discount",
					requestedPrice: { amountMinor: 40_000, currency: "GYD" },
				},
				headers: {
					"idempotency-key": "idempotency-price-override-request-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { saleId: "sale_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						requestSalePriceOverride(input) {
							received = input;
							return Promise.resolve(fakeSale());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ id: "sale_unit_test_0001" });
		expect(permission).toBe("commerce.price-override.request");
		expect(received).toMatchObject({
			lineId: "sale_line_unit_test_0001",
			reason: "Manager-approved discount",
			requestedPrice: { amountMinor: 40_000, currency: "GYD" },
			saleId: "sale_unit_test_0001",
		});
	});

	test("denies a price-override request before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.priceOverrides.request,
				{
					body: {
						lineId: "sale_line_unit_test_0001",
						reason: "Manager-approved discount",
						requestedPrice: { amountMinor: 40_000, currency: "GYD" },
					},
					headers: {
						"idempotency-key": "idempotency-price-override-request-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { saleId: "sale_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							requestSalePriceOverride: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches a price-override approval with the saleId and overrideId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["approveSalePriceOverride"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.priceOverrides.approve,
			{
				headers: {
					"idempotency-key": "idempotency-price-override-approve-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: {
					overrideId: "price_override_unit_test_0001",
					saleId: "sale_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						approveSalePriceOverride(input) {
							received = input;
							return Promise.resolve(fakeSale());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ id: "sale_unit_test_0001" });
		expect(permission).toBe("commerce.price-override.approve");
		expect(received).toMatchObject({
			overrideId: "price_override_unit_test_0001",
			saleId: "sale_unit_test_0001",
		});
	});

	test("denies a price-override approval before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.priceOverrides.approve,
				{
					headers: {
						"idempotency-key": "idempotency-price-override-approve-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: {
						overrideId: "price_override_hidden_unit_0001",
						saleId: "sale_hidden_unit_0001",
					},
				},
				{
					context: context({
						application: {
							approveSalePriceOverride: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches a receipt read with the receiptId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["getReceipt"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.receipts.get,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				params: { receiptId: "receipt_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						getReceipt(input) {
							received = input;
							return Promise.resolve({
								cashierPartyId: "party_unit_test_cashier",
								currency: "GYD",
								id: input.receiptId,
								issuedAt: "2026-07-13T12:30:00.000Z",
								kind: "Sale" as const,
								lines: [],
								originalReceiptId: null,
								priceSuppressed: false,
								receiptNumber: "R-register_unit_test_0001-000001",
								registerId: "register_unit_test_0001",
								returnId: null,
								saleId: "sale_unit_test_0001",
								tenders: [],
								total: { amountMinor: 114_000, currency: "GYD" },
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
			id: "receipt_unit_test_0001",
			receiptNumber: "R-register_unit_test_0001-000001",
		});
		expect(permission).toBe("commerce.receipt.read");
		expect(received).toMatchObject({ receiptId: "receipt_unit_test_0001" });
	});

	test("denies a receipt read before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.receipts.get,
				{
					headers: { "x-active-context-id": "context_unit_test_0001" },
					params: { receiptId: "receipt_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							getReceipt: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("maps Import boundary failures to stable non-disclosing HTTP semantics", async () => {
		const body = {
			content:
				"source_key,name,variant_name,sku,barcode,barcode_scheme\nrow-1,Tea,Default,SKU-1,,",
			contentType: "text/csv" as const,
			fileName: "sensitive-tenant-file.csv",
			manifest: {
				decimalSeparator: "." as const,
				delimiter: "," as const,
				encoding: "UTF-8" as const,
				locale: "en-GY",
				newline: "LF" as const,
				quote: '"' as const,
				timezone: "America/Guyana",
			},
			sha256: "a".repeat(64),
		};
		await Promise.all(
			(["invalid_csv", "blocked_content"] as const).map(async (code) => {
				const error = await captureOrpcError(
					call(
						appRouter.catalog.imports.create,
						{
							body,
							headers: {
								"idempotency-key": `safe-import-${code}`,
								"x-active-context-id": "context_unit_test_0001",
							},
						},
						{
							context: context({
								allowed: true,
								application: {
									createImport: () =>
										Promise.reject({
											code,
											message:
												"scanner-vendor-secret found EICAR-STANDARD-ANTIVIRUS-TEST-FILE in sensitive-tenant-file.csv",
										}),
								},
								session: authenticatedSession,
							}),
						}
					)
				);
				expect(error).toMatchObject({
					code: "BAD_REQUEST",
					data: {
						code: "validation",
						detail: null,
						safeMessageKey: "problem.validation",
						status: 400,
						title: "Request is invalid",
					},
				});
				const serialized = JSON.stringify(error.data);
				expect(serialized).not.toContain("scanner-vendor-secret");
				expect(serialized).not.toContain("EICAR");
				expect(serialized).not.toContain(body.fileName);
			})
		);
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

	// -- WS3 PR3: Return, Refund, Void, Reissue, Exchange ----------------------

	function fakeReturn(overrides: Partial<Return> = {}): Return {
		return {
			approvedAt: null,
			createdAt: "2026-07-18T12:00:00.000Z",
			currency: "GYD",
			exchangeSaleId: null,
			id: "return_unit_test_0001",
			lines: [],
			mode: "Return",
			reason: "Customer changed mind",
			receiptId: null,
			registerId: "register_unit_test_0001",
			saleId: "sale_unit_test_0001",
			state: "Pending",
			totalRefundable: { amountMinor: 10_000, currency: "GYD" },
			version: 1,
			...overrides,
		};
	}

	function fakeRefund(overrides: Partial<Refund> = {}): Refund {
		return {
			amount: { amountMinor: 10_000, currency: "GYD" },
			approvedAt: null,
			cashMovementId: null,
			id: "refund_unit_test_0001",
			registerId: "register_unit_test_0001",
			requestedAt: "2026-07-18T12:00:00.000Z",
			returnId: "return_unit_test_0001",
			state: "Requested",
			version: 1,
			...overrides,
		};
	}

	function fakeReceipt(overrides: Partial<Receipt> = {}): Receipt {
		return {
			cashierPartyId: "party_unit_test_0001",
			currency: "GYD",
			id: "receipt_unit_test_0001",
			issuedAt: "2026-07-18T12:00:00.000Z",
			kind: "Sale",
			lines: [],
			originalReceiptId: null,
			priceSuppressed: false,
			receiptNumber: "R-register_unit_test_0001-000001",
			registerId: "register_unit_test_0001",
			returnId: null,
			saleId: "sale_unit_test_0001",
			tenders: [],
			total: { amountMinor: 10_000, currency: "GYD" },
			...overrides,
		};
	}

	test("dispatches return creation with the sale, lines, and reason from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createReturn"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.returns.create,
			{
				body: {
					lines: [{ quantity: "1", saleLineId: "sale_line_unit_test_0001" }],
					reason: "Customer changed mind",
					saleId: "sale_unit_test_0001",
				},
				headers: {
					"idempotency-key": "idempotency-return-create-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createReturn(input) {
							received = input;
							return Promise.resolve(fakeReturn());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Pending" });
		expect(permission).toBe("commerce.return.create");
		expect(received).toMatchObject({
			lines: [{ quantity: "1", saleLineId: "sale_line_unit_test_0001" }],
			reason: "Customer changed mind",
			saleId: "sale_unit_test_0001",
		});
	});

	test("denies return creation before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.returns.create,
				{
					body: {
						lines: [{ quantity: "1", saleLineId: "sale_line_hidden_0001" }],
						reason: "Denied",
						saleId: "sale_hidden_unit_0001",
					},
					headers: {
						"idempotency-key": "idempotency-return-create-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createReturn: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches return approval with the returnId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["approveReturn"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.returns.approve,
			{
				headers: {
					"idempotency-key": "idempotency-return-approve-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { returnId: "return_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						approveReturn(input) {
							received = input;
							return Promise.resolve(fakeReturn({ state: "Completed" }));
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Completed" });
		expect(permission).toBe("commerce.return.approve");
		expect(received).toMatchObject({ returnId: "return_unit_test_0001" });
	});

	test("dispatches refund creation with the returnId from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createRefund"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.refunds.create,
			{
				body: { returnId: "return_unit_test_0001" },
				headers: {
					"idempotency-key": "idempotency-refund-create-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createRefund(input) {
							received = input;
							return Promise.resolve(fakeRefund());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Requested" });
		expect(permission).toBe("commerce.refund.create");
		expect(received).toMatchObject({ returnId: "return_unit_test_0001" });
	});

	test("dispatches refund approval with the refundId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["approveRefund"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.refunds.approve,
			{
				headers: {
					"idempotency-key": "idempotency-refund-approve-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { refundId: "refund_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						approveRefund(input) {
							received = input;
							return Promise.resolve(fakeRefund({ state: "Posted" }));
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Posted" });
		expect(permission).toBe("commerce.refund.approve");
		expect(received).toMatchObject({ refundId: "refund_unit_test_0001" });
	});

	test("dispatches receipt reissue with priceSuppressed from the request body (gift-receipt variant)", async () => {
		let received:
			| Parameters<Context["application"]["reissueReceipt"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.receipts.reissue,
			{
				body: { priceSuppressed: true },
				headers: {
					"idempotency-key": "idempotency-reissue-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { receiptId: "receipt_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						reissueReceipt(input) {
							received = input;
							return Promise.resolve(
								fakeReceipt({ kind: "Reissue", priceSuppressed: true })
							);
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ kind: "Reissue", priceSuppressed: true });
		expect(permission).toBe("commerce.receipt.reissue");
		expect(received).toMatchObject({
			priceSuppressed: true,
			receiptId: "receipt_unit_test_0001",
		});
	});

	test("dispatches receipt void with the reason from the request body and the receiptId from the path", async () => {
		let received:
			| Parameters<Context["application"]["voidReceipt"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.receipts.void,
			{
				body: { reason: "Cashier error" },
				headers: {
					"idempotency-key": "idempotency-void-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { receiptId: "receipt_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						voidReceipt(input) {
							received = input;
							return Promise.resolve(
								fakeReturn({ mode: "Void", state: "Completed" })
							);
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ mode: "Void", state: "Completed" });
		expect(permission).toBe("commerce.receipt.void");
		expect(received).toMatchObject({
			reason: "Cashier error",
			receiptId: "receipt_unit_test_0001",
		});
	});

	test("denies receipt void before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.receipts.void,
				{
					body: {},
					headers: {
						"idempotency-key": "idempotency-void-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { receiptId: "receipt_hidden_unit_0001" },
				},
				{
					context: context({
						application: {
							voidReceipt: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("realizes commerce.exchanges by threading exchangeOfReturnId from completeSale's request body (frozen control plan §6.5)", async () => {
		let received:
			| Parameters<Context["application"]["completeSale"]>[0]
			| undefined;
		const result = await call(
			appRouter.commerce.sales.complete,
			{
				body: {
					exchangeOfReturnId: "return_unit_test_0001",
					tenders: [
						{ amount: { amountMinor: 114_000, currency: "GYD" }, type: "Cash" },
					],
				},
				headers: {
					"idempotency-key": "idempotency-sale-complete-exchange-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { saleId: "sale_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						completeSale(input) {
							received = input;
							return Promise.resolve(
								fakeSale({ state: "Completed", version: 2 })
							);
						},
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Completed" });
		expect(received).toMatchObject({
			exchangeOfReturnId: "return_unit_test_0001",
			saleId: "sale_unit_test_0001",
		});
	});

	function fakeDeposit(overrides: Partial<Deposit> = {}): Deposit {
		return {
			amount: { amountMinor: 20_000, currency: "GYD" },
			confirmedAt: null,
			confirmerPartyId: null,
			depositReference: "DEP-000001",
			id: "deposit_unit_test_0001",
			preparedAt: "2026-07-18T12:00:00.000Z",
			preparerPartyId: "party_unit_test_0001",
			sourceShiftIds: ["session_unit_test_0001"],
			state: "Prepared",
			version: 1,
			...overrides,
		};
	}

	function fakeExport(
		overrides: Partial<AccountantHandoffExport> = {}
	): AccountantHandoffExport {
		return {
			contentHash: "a".repeat(64),
			currency: "GYD",
			generatedAt: "2026-07-18T12:00:00.000Z",
			id: "export_unit_test_0001",
			idempotencyKey: "idempotency-export-unit-0001",
			kind: "AccountantHandoff",
			legalEntityId: "legal_entity_unit_test_0001",
			organizationId: "organization_unit_0001",
			payload: {},
			periodEnd: "2026-07-18T04:00:00.000Z",
			periodStart: "2026-07-17T04:00:00.000Z",
			ruleVersion: "ws3-pr4-prototype-1",
			schemaVersion: "1.0.0",
			tenantId: "tenant_unit_test_0001",
			timezone: "America/Guyana",
			...overrides,
		};
	}

	test("dispatches deposit creation with the currency, countedAmount, and sourceShiftIds from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createDeposit"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.deposits.create,
			{
				body: {
					countedAmount: { amountMinor: 20_000, currency: "GYD" },
					currency: "GYD",
					sourceShiftIds: ["session_unit_test_0001"],
				},
				headers: {
					"idempotency-key": "idempotency-deposit-create-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createDeposit(input) {
							received = input;
							return Promise.resolve(fakeDeposit());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Prepared" });
		expect(permission).toBe("commerce.deposit.create");
		expect(received).toMatchObject({
			countedAmountMinor: 20_000,
			currency: "GYD",
			sourceShiftIds: ["session_unit_test_0001"],
		});
	});

	test("denies deposit creation before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.deposits.create,
				{
					body: {
						countedAmount: { amountMinor: 20_000, currency: "GYD" },
						currency: "GYD",
						sourceShiftIds: ["session_hidden_0001"],
					},
					headers: {
						"idempotency-key": "idempotency-deposit-create-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createDeposit: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches deposit confirmation with the depositId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["confirmDeposit"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.commerce.deposits.confirm,
			{
				headers: {
					"idempotency-key": "idempotency-deposit-confirm-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
				params: { depositId: "deposit_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						confirmDeposit(input) {
							received = input;
							return Promise.resolve(
								fakeDeposit({
									confirmedAt: "2026-07-18T13:00:00.000Z",
									state: "Reconciled",
								})
							);
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ state: "Reconciled" });
		expect(permission).toBe("commerce.deposit.confirm");
		expect(received).toMatchObject({ depositId: "deposit_unit_test_0001" });
	});

	test("denies deposit confirmation before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.commerce.deposits.confirm,
				{
					headers: {
						"idempotency-key": "idempotency-deposit-confirm-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
					params: { depositId: "deposit_hidden_0001" },
				},
				{
					context: context({
						application: {
							confirmDeposit: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches the accountant handoff export request with legalEntityId, period, currency, and timezone from the request body", async () => {
		let received:
			| Parameters<Context["application"]["createAccountantHandoffExport"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.exports.createAccountantHandoff,
			{
				body: {
					currency: "GYD",
					legalEntityId: "legal_entity_unit_test_0001",
					periodEnd: "2026-07-18T04:00:00.000Z",
					periodStart: "2026-07-17T04:00:00.000Z",
					timezone: "America/Guyana",
				},
				headers: {
					"idempotency-key": "idempotency-export-create-unit-0001",
					"x-active-context-id": "context_unit_test_0001",
				},
			},
			{
				context: context({
					allowed: true,
					application: {
						createAccountantHandoffExport(input) {
							received = input;
							return Promise.resolve(fakeExport());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ kind: "AccountantHandoff" });
		expect(permission).toBe("platform.export.create");
		expect(received).toMatchObject({
			currency: "GYD",
			legalEntityId: "legal_entity_unit_test_0001",
			periodEnd: "2026-07-18T04:00:00.000Z",
			periodStart: "2026-07-17T04:00:00.000Z",
			timezone: "America/Guyana",
		});
	});

	test("denies the accountant handoff export request before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.exports.createAccountantHandoff,
				{
					body: {
						currency: "GYD",
						legalEntityId: "legal_entity_hidden_0001",
						periodEnd: "2026-07-18T04:00:00.000Z",
						periodStart: "2026-07-17T04:00:00.000Z",
						timezone: "America/Guyana",
					},
					headers: {
						"idempotency-key": "idempotency-export-create-denied",
						"x-active-context-id": "context_unit_test_0001",
					},
				},
				{
					context: context({
						application: {
							createAccountantHandoffExport: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});

	test("dispatches export read with the exportId from the request path", async () => {
		let received:
			| Parameters<Context["application"]["getAccountantHandoffExport"]>[0]
			| undefined;
		let permission: string | undefined;
		const result = await call(
			appRouter.exports.get,
			{
				headers: { "x-active-context-id": "context_unit_test_0001" },
				params: { exportId: "export_unit_test_0001" },
			},
			{
				context: context({
					allowed: true,
					application: {
						getAccountantHandoffExport(input) {
							received = input;
							return Promise.resolve(fakeExport());
						},
					},
					onDecide({ permission: decidedPermission }) {
						permission = decidedPermission;
					},
					session: authenticatedSession,
				}),
			}
		);
		expect(result).toMatchObject({ id: "export_unit_test_0001" });
		expect(permission).toBe("platform.export.read");
		expect(received).toMatchObject({ exportId: "export_unit_test_0001" });
	});

	test("denies export read before application dispatch when permission fails", async () => {
		let dispatched = false;
		const error = await captureOrpcError(
			call(
				appRouter.exports.get,
				{
					headers: { "x-active-context-id": "context_unit_test_0001" },
					params: { exportId: "export_hidden_0001" },
				},
				{
					context: context({
						application: {
							getAccountantHandoffExport: () => {
								dispatched = true;
								return Promise.reject(new Error("must not dispatch"));
							},
						},
						session: authenticatedSession,
					}),
				}
			)
		);
		expect(dispatched).toBe(false);
		expect(error).toMatchObject({ code: "FORBIDDEN" });
	});
});
