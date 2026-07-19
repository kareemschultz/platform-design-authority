import { oc } from "@orpc/contract";
import { z } from "zod";

import { OPENAPI_OPERATION_METADATA } from "./generated";
import {
	AccountantHandoffExportSchema,
	AccountantHandoffRequestSchema,
	ActiveContextRequestSchema,
	ActiveContextSchema,
	CashMovementSchema,
	CloseRegisterRequestSchema,
	CompleteSaleRequestSchema,
	CreateCashMovementRequestSchema,
	CreateCsvImportSchema,
	CreateDepositSchema,
	CreateEventReplayRequestSchema,
	CreateInventoryAdjustmentSchema,
	CreateOrganizationPartySchema,
	CreatePartyIdentityLinkRequestSchema,
	CreatePersonPartySchema,
	CreateProductSchema,
	CreateRefundSchema,
	CreateReturnSchema,
	CreateRoleAssignmentRequestSchema,
	CreateSafeDropRequestSchema,
	CreateSaleSchema,
	CreateStockCountSchema,
	CreateStockTransferSchema,
	CreateUserInvitationRequestSchema,
	CurrentIdentitySchema,
	DepositSchema,
	EventReplayRequestSchema,
	IdentifierSchema,
	ImportCorrectionReportSchema,
	ImportFindingsSchema,
	ImportJobSchema,
	ImportPurgeResultSchema,
	InventoryAdjustmentSchema,
	OpenRegisterRequestSchema,
	OrganizationSchema,
	PagedAuditRecordsSchema,
	PagedEntitlementsSchema,
	PagedImportsSchema,
	PagedInventoryAdjustmentsSchema,
	PagedLocationsSchema,
	PagedOrganizationsSchema,
	PagedPartiesSchema,
	PagedProductsSchema,
	PagedRolesSchema,
	PagedSessionsSchema,
	PagedStockBalancesSchema,
	PagedStockCountsSchema,
	PagedStockTransfersSchema,
	PagedUsersSchema,
	PartySchema,
	PlatformIdentityLinkSchema,
	ProblemSchema,
	ProductSchema,
	ProductStateSchema,
	ReceiptSchema,
	ReceiveStockTransferSchema,
	RefundSchema,
	RegisterSessionSchema,
	ReissueReceiptRequestSchema,
	RequestPriceOverrideSchema,
	ReturnSchema,
	RoleAssignmentSchema,
	SaleSchema,
	SaveStockCountDraftLinesSchema,
	StockCountSchema,
	StockTransferSchema,
	SubmitStockCountSchema,
	SuspendTenantMembershipRequestSchema,
	TransitionReasonSchema,
	UpdateOrganizationRequestSchema,
	UpdatePartyRequestSchema,
	UpdateProductSchema,
	UserInvitationSchema,
	UserSummarySchema,
	VoidReceiptRequestSchema,
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
export const CatalogSkuLookupSchema = z.string().max(64).trim().min(1);
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
const VersionedTenantCommandHeadersSchema = TenantCommandHeadersSchema.extend({
	"if-match": z.string().regex(/^[1-9][0-9]*$/),
});

export const createEventReplayContract = base
	.route({ method: "POST", path: "/v1/event-replays", successStatus: 202 })
	.meta({
		operationId: "createEventReplay",
		permission: "platform.event.replay",
		requestRef: "#/components/schemas/CreateEventReplayRequest",
		responseRef: "#/components/schemas/EventReplayRequest",
		successStatus: 202,
	})
	.input(
		z.object({
			body: CreateEventReplayRequestSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(EventReplayRequestSchema);

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

export const listProductsContract = base
	.route({ method: "GET", path: "/v1/products", successStatus: 200 })
	.meta({
		operationId: "listProducts",
		permission: "catalog.product.read",
		responseRef: "#/components/schemas/PagedProducts",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				barcode: z.string().max(64).optional(),
				query: z.string().max(200).optional(),
				sku: CatalogSkuLookupSchema.optional(),
				state: ProductStateSchema.optional(),
			}),
		})
	)
	.output(PagedProductsSchema);

export const getProductContract = base
	.route({
		method: "GET",
		path: "/v1/products/{productId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getProductsByProductId",
		permission: "catalog.product.read",
		responseRef: "#/components/schemas/Product",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ productId: IdentifierSchema }),
		})
	)
	.output(ProductSchema);

export const createProductContract = base
	.route({ method: "POST", path: "/v1/products", successStatus: 201 })
	.meta({
		operationId: "createProduct",
		permission: "catalog.product.create",
		requestRef: "#/components/schemas/CreateProduct",
		responseRef: "#/components/schemas/Product",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateProductSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(ProductSchema);

export const updateProductContract = base
	.route({
		method: "PATCH",
		path: "/v1/products/{productId}",
		successStatus: 200,
	})
	.meta({
		operationId: "patchProductsByProductId",
		permission: "catalog.product.update",
		requestRef: "#/components/schemas/UpdateProduct",
		responseRef: "#/components/schemas/Product",
		successStatus: 200,
	})
	.input(
		z.object({
			body: UpdateProductSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ productId: IdentifierSchema }),
		})
	)
	.output(ProductSchema);

export const activateProductContract = base
	.route({
		method: "POST",
		path: "/v1/products/{productId}/activate",
		successStatus: 200,
	})
	.meta({
		operationId: "activateProduct",
		permission: "catalog.product.activate",
		responseRef: "#/components/schemas/Product",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ productId: IdentifierSchema }),
		})
	)
	.output(ProductSchema);

export const archiveProductContract = base
	.route({
		method: "POST",
		path: "/v1/products/{productId}/archive",
		successStatus: 200,
	})
	.meta({
		operationId: "archiveProduct",
		permission: "catalog.product.archive",
		requestRef: "#/components/schemas/TransitionReason",
		responseRef: "#/components/schemas/Product",
		successStatus: 200,
	})
	.input(
		z.object({
			body: TransitionReasonSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ productId: IdentifierSchema }),
		})
	)
	.output(ProductSchema);

export const createProductImportContract = base
	.route({ method: "POST", path: "/v1/product-imports", successStatus: 202 })
	.meta({
		operationId: "postProductImports",
		permission: "catalog.import.create",
		requestRef: "#/components/schemas/CreateCsvImport",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 202,
	})
	.input(
		z.object({
			body: CreateCsvImportSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(ImportJobSchema);

export const listProductImportsContract = base
	.route({ method: "GET", path: "/v1/product-imports", successStatus: 200 })
	.meta({
		operationId: "listProductImports",
		permission: "catalog.import.read",
		responseRef: "#/components/schemas/PagedImports",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				state: ImportJobSchema.shape.state.optional(),
			}),
		})
	)
	.output(PagedImportsSchema);

export const getProductImportContract = base
	.route({
		method: "GET",
		path: "/v1/product-imports/{importId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getProductImport",
		permission: "catalog.import.read",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const acceptProductImportContract = base
	.route({
		method: "POST",
		path: "/v1/product-imports/{importId}/accept",
		successStatus: 200,
	})
	.meta({
		operationId: "acceptProductImport",
		permission: "catalog.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const cancelProductImportContract = base
	.route({
		method: "POST",
		path: "/v1/product-imports/{importId}/cancel",
		successStatus: 200,
	})
	.meta({
		operationId: "cancelProductImport",
		permission: "catalog.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const purgeProductImportStagingContract = base
	.route({
		method: "POST",
		path: "/v1/product-imports/{importId}/purge-staging",
		successStatus: 200,
	})
	.meta({
		operationId: "purgeProductImportStaging",
		permission: "catalog.import.purge",
		responseRef: "#/components/schemas/ImportPurgeResult",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportPurgeResultSchema);

export const listProductImportFindingsContract = base
	.route({
		method: "GET",
		path: "/v1/product-imports/{importId}/findings",
		successStatus: 200,
	})
	.meta({
		operationId: "getProductImportFindings",
		permission: "catalog.import.read",
		responseRef: "#/components/schemas/ImportFindings",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
			query: PageQuerySchema,
		})
	)
	.output(ImportFindingsSchema);

export const approveProductImportContract = base
	.route({
		method: "POST",
		path: "/v1/product-imports/{importId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postProductImportsByImportIdApprove",
		permission: "catalog.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const getProductImportCorrectionReportContract = base
	.route({
		method: "GET",
		path: "/v1/product-imports/{importId}/correction-report",
		successStatus: 200,
	})
	.meta({
		operationId: "getProductImportCorrectionReport",
		permission: "catalog.import.download",
		responseRef: "#/components/schemas/ImportCorrectionReport",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportCorrectionReportSchema);

export const listStockBalancesContract = base
	.route({ method: "GET", path: "/v1/stock-balances", successStatus: 200 })
	.meta({
		operationId: "listStockBalances",
		permission: "inventory.balance.read",
		responseRef: "#/components/schemas/PagedStockBalances",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				locationId: IdentifierSchema,
				productId: IdentifierSchema.optional(),
			}),
		})
	)
	.output(PagedStockBalancesSchema);

export const listInventoryAdjustmentsContract = base
	.route({
		method: "GET",
		path: "/v1/inventory-adjustments",
		successStatus: 200,
	})
	.meta({
		operationId: "listInventoryAdjustments",
		permission: "inventory.adjustment.read",
		responseRef: "#/components/schemas/PagedInventoryAdjustments",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				locationId: IdentifierSchema.optional(),
				state: InventoryAdjustmentSchema.shape.state.optional(),
			}),
		})
	)
	.output(PagedInventoryAdjustmentsSchema);

export const createInventoryAdjustmentContract = base
	.route({
		method: "POST",
		path: "/v1/inventory-adjustments",
		successStatus: 202,
	})
	.meta({
		operationId: "createInventoryAdjustment",
		permission: "inventory.adjustment.create",
		requestRef: "#/components/schemas/CreateInventoryAdjustment",
		responseRef: "#/components/schemas/InventoryAdjustment",
		successStatus: 202,
	})
	.input(
		z.object({
			body: CreateInventoryAdjustmentSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(InventoryAdjustmentSchema);

export const getInventoryAdjustmentContract = base
	.route({
		method: "GET",
		path: "/v1/inventory-adjustments/{id}",
		successStatus: 200,
	})
	.meta({
		operationId: "getInventoryAdjustment",
		permission: "inventory.adjustment.read",
		responseRef: "#/components/schemas/InventoryAdjustment",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(InventoryAdjustmentSchema);

export const approveInventoryAdjustmentContract = base
	.route({
		method: "POST",
		path: "/v1/inventory-adjustments/{id}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postInventoryAdjustmentsByIdApprove",
		permission: "inventory.adjustment.approve",
		responseRef: "#/components/schemas/InventoryAdjustment",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(InventoryAdjustmentSchema);

export const reverseInventoryAdjustmentContract = base
	.route({
		method: "POST",
		path: "/v1/inventory-adjustments/{id}/reverse",
		successStatus: 200,
	})
	.meta({
		operationId: "reverseInventoryAdjustment",
		permission: "inventory.adjustment.reverse",
		requestRef: "#/components/schemas/TransitionReason",
		responseRef: "#/components/schemas/InventoryAdjustment",
		successStatus: 200,
	})
	.input(
		z.object({
			body: TransitionReasonSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(InventoryAdjustmentSchema);

// ---------------------------------------------------------------------------
// WS3 PR1: registers, cash movements, safe drops, cash-variance approval.
// ---------------------------------------------------------------------------

export const openRegisterContract = base
	.route({
		method: "POST",
		path: "/v1/registers/{registerId}/open",
		successStatus: 200,
	})
	.meta({
		operationId: "openRegister",
		permission: "commerce.register.open",
		requestRef: "#/components/schemas/OpenRegisterRequest",
		responseRef: "#/components/schemas/RegisterSession",
		successStatus: 200,
	})
	.input(
		z.object({
			body: OpenRegisterRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ registerId: IdentifierSchema }),
		})
	)
	.output(RegisterSessionSchema);

export const closeRegisterContract = base
	.route({
		method: "POST",
		path: "/v1/registers/{registerId}/close",
		successStatus: 200,
	})
	.meta({
		operationId: "closeRegister",
		permission: "commerce.register.close",
		requestRef: "#/components/schemas/CloseRegisterRequest",
		responseRef: "#/components/schemas/RegisterSession",
		successStatus: 200,
	})
	.input(
		z.object({
			body: CloseRegisterRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ registerId: IdentifierSchema }),
		})
	)
	.output(RegisterSessionSchema);

export const createCashMovementContract = base
	.route({
		method: "POST",
		path: "/v1/registers/{registerId}/cash-movements",
		successStatus: 200,
	})
	.meta({
		operationId: "postRegistersByRegisterIdCashMovements",
		permission: "commerce.cash-movement.create",
		requestRef: "#/components/schemas/CreateCashMovementRequest",
		responseRef: "#/components/schemas/CashMovement",
		successStatus: 200,
	})
	.input(
		z.object({
			body: CreateCashMovementRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ registerId: IdentifierSchema }),
		})
	)
	.output(CashMovementSchema);

export const createSafeDropContract = base
	.route({
		method: "POST",
		path: "/v1/registers/{registerId}/safe-drops",
		successStatus: 200,
	})
	.meta({
		operationId: "postRegistersByRegisterIdSafeDrops",
		permission: "commerce.cash-movement.create",
		requestRef: "#/components/schemas/CreateSafeDropRequest",
		responseRef: "#/components/schemas/CashMovement",
		successStatus: 200,
	})
	.input(
		z.object({
			body: CreateSafeDropRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ registerId: IdentifierSchema }),
		})
	)
	.output(CashMovementSchema);

export const approveCashVarianceContract = base
	.route({
		method: "POST",
		path: "/v1/cash-variances/{varianceId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postCashVariancesByVarianceIdApprove",
		permission: "commerce.cash-variance.approve",
		responseRef: "#/components/schemas/RegisterSession",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ varianceId: IdentifierSchema }),
		})
	)
	.output(RegisterSessionSchema);

// ---------------------------------------------------------------------------
// WS3 PR2: Sale, PriceOverride, Receipt.
// ---------------------------------------------------------------------------

export const createSaleContract = base
	.route({
		method: "POST",
		path: "/v1/sales",
		successStatus: 201,
	})
	.meta({
		operationId: "createSale",
		permission: "commerce.sale.create",
		requestRef: "#/components/schemas/CreateSale",
		responseRef: "#/components/schemas/Sale",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateSaleSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(SaleSchema);

export const completeSaleContract = base
	.route({
		method: "POST",
		path: "/v1/sales/{saleId}/complete",
		successStatus: 200,
	})
	.meta({
		operationId: "completeSale",
		permission: "commerce.sale.complete",
		requestRef: "#/components/schemas/CompleteSaleRequest",
		responseRef: "#/components/schemas/Sale",
		successStatus: 200,
	})
	.input(
		z.object({
			body: CompleteSaleRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ saleId: IdentifierSchema }),
		})
	)
	.output(SaleSchema);

export const holdSaleContract = base
	.route({
		method: "POST",
		path: "/v1/sales/{saleId}/hold",
		successStatus: 200,
	})
	.meta({
		operationId: "postSalesBySaleIdHold",
		permission: "commerce.sale.hold",
		responseRef: "#/components/schemas/Sale",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ saleId: IdentifierSchema }),
		})
	)
	.output(SaleSchema);

export const requestSalePriceOverrideContract = base
	.route({
		method: "POST",
		path: "/v1/sales/{saleId}/price-overrides",
		successStatus: 201,
	})
	.meta({
		operationId: "requestSalePriceOverride",
		permission: "commerce.price-override.request",
		requestRef: "#/components/schemas/RequestPriceOverride",
		responseRef: "#/components/schemas/Sale",
		successStatus: 201,
	})
	.input(
		z.object({
			body: RequestPriceOverrideSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ saleId: IdentifierSchema }),
		})
	)
	.output(SaleSchema);

export const approveSalePriceOverrideContract = base
	.route({
		method: "POST",
		path: "/v1/sales/{saleId}/price-overrides/{overrideId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "approveSalePriceOverride",
		permission: "commerce.price-override.approve",
		responseRef: "#/components/schemas/Sale",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({
				overrideId: IdentifierSchema,
				saleId: IdentifierSchema,
			}),
		})
	)
	.output(SaleSchema);

export const getReceiptContract = base
	.route({
		method: "GET",
		path: "/v1/receipts/{receiptId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getReceiptsByReceiptId",
		permission: "commerce.receipt.read",
		responseRef: "#/components/schemas/Receipt",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ receiptId: IdentifierSchema }),
		})
	)
	.output(ReceiptSchema);

/** WS3 remediation R3, Finding J: resolves a human-legible reference
 * actually printed on the receipt — `receiptNumber` and `registerId`, both
 * shown by `ReceiptLayout` (apps/web) — to the Receipt (and, via its
 * nullable `saleId`, the return path), instead of requiring the opaque Sale
 * ID a cashier can only have if it happens to still be cached in THEIR OWN
 * browser's sessionStorage. Reuses `commerce.receipt.read`, the same
 * permission `getReceiptContract` already requires — no new identifier
 * invented. `receiptNumber` is unique only per (tenantId, registerId) —
 * `pos_receipt_tenant_register_number_uidx` — so `registerId` is a required
 * path segment, not an optional disambiguator; both values are printed
 * together on every receipt. */
export const getReceiptByNumberContract = base
	.route({
		method: "GET",
		path: "/v1/registers/{registerId}/receipts/{receiptNumber}",
		successStatus: 200,
	})
	.meta({
		operationId: "getRegistersByRegisterIdReceiptsByReceiptNumber",
		permission: "commerce.receipt.read",
		responseRef: "#/components/schemas/Receipt",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({
				receiptNumber: z.string().min(1).max(200),
				registerId: IdentifierSchema,
			}),
		})
	)
	.output(ReceiptSchema);

/** WS3 remediation R3, Finding J (part 2): completes the receipt-to-return
 * path `getReceiptByNumberContract` starts. `CreateReturnSchema` requires a
 * real `saleLineId` per line (matched server-side against the Sale's own
 * line records — `buildReturnLines` in `packages/domains/pos/src/index.ts`),
 * and `ReceiptLineSnapshot` carries no line id (an immutable point-in-time
 * receipt snapshot, not a live Sale projection) — so a receiptNumber ->
 * Receipt resolution alone can never populate a return form. Gated on
 * `commerce.return.create`, the permission the return this preview leads to
 * actually requires (mirroring Finding I's "the consuming mutation's own
 * permission also authorizes the preview read" pattern), not
 * `commerce.receipt.read` — one permission covers the whole
 * receipt-to-return path, avoiding a second permission seam a
 * return-creating role might not separately hold. No new permission
 * invented; reuses the existing `commerce.return.create` from
 * `registry/permissions.json`. */
export const getSaleForReturnContract = base
	.route({
		method: "GET",
		path: "/v1/registers/{registerId}/receipts/{receiptNumber}/sale",
		successStatus: 200,
	})
	.meta({
		operationId: "getRegistersByRegisterIdReceiptsByReceiptNumberSale",
		permission: "commerce.return.create",
		responseRef: "#/components/schemas/Sale",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({
				receiptNumber: z.string().min(1).max(200),
				registerId: IdentifierSchema,
			}),
		})
	)
	.output(SaleSchema);

// ---------------------------------------------------------------------------
// WS3 PR3: Return, Refund, Void, Reissue. Exchange has no dedicated
// contract — it rides `completeSaleContract`'s `exchangeOfReturnId` (§6.5).
// ---------------------------------------------------------------------------

export const createReturnContract = base
	.route({
		method: "POST",
		path: "/v1/returns",
		successStatus: 201,
	})
	.meta({
		operationId: "createReturn",
		permission: "commerce.return.create",
		requestRef: "#/components/schemas/CreateReturn",
		responseRef: "#/components/schemas/Return",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateReturnSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(ReturnSchema);

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.return.approve`. Reuses that exact permission — no new
 * identifier invented; an approver may, by definition, preview what they
 * can approve. */
export const getReturnContract = base
	.route({
		method: "GET",
		path: "/v1/returns/{returnId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getReturnsByReturnId",
		permission: "commerce.return.approve",
		responseRef: "#/components/schemas/Return",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ returnId: IdentifierSchema }),
		})
	)
	.output(ReturnSchema);

export const approveReturnContract = base
	.route({
		method: "POST",
		path: "/v1/returns/{returnId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postReturnsByReturnIdApprove",
		permission: "commerce.return.approve",
		responseRef: "#/components/schemas/Return",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ returnId: IdentifierSchema }),
		})
	)
	.output(ReturnSchema);

export const createRefundContract = base
	.route({
		method: "POST",
		path: "/v1/refunds",
		successStatus: 200,
	})
	.meta({
		operationId: "postRefunds",
		permission: "commerce.refund.create",
		requestRef: "#/components/schemas/CreateRefund",
		responseRef: "#/components/schemas/Refund",
		successStatus: 200,
	})
	.input(
		z.object({
			body: CreateRefundSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(RefundSchema);

/** WS3 remediation R3, Finding I. */
export const getRefundContract = base
	.route({
		method: "GET",
		path: "/v1/refunds/{refundId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getRefundsByRefundId",
		permission: "commerce.refund.approve",
		responseRef: "#/components/schemas/Refund",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ refundId: IdentifierSchema }),
		})
	)
	.output(RefundSchema);

export const approveRefundContract = base
	.route({
		method: "POST",
		path: "/v1/refunds/{refundId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postRefundsByRefundIdApprove",
		permission: "commerce.refund.approve",
		responseRef: "#/components/schemas/Refund",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ refundId: IdentifierSchema }),
		})
	)
	.output(RefundSchema);

export const reissueReceiptContract = base
	.route({
		method: "POST",
		path: "/v1/receipts/{receiptId}/reissue",
		successStatus: 200,
	})
	.meta({
		operationId: "postReceiptsByReceiptIdReissue",
		permission: "commerce.receipt.reissue",
		requestRef: "#/components/schemas/ReissueReceiptRequest",
		responseRef: "#/components/schemas/Receipt",
		successStatus: 200,
	})
	.input(
		z.object({
			body: ReissueReceiptRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ receiptId: IdentifierSchema }),
		})
	)
	.output(ReceiptSchema);

export const voidReceiptContract = base
	.route({
		method: "POST",
		path: "/v1/receipts/{receiptId}/void",
		successStatus: 200,
	})
	.meta({
		operationId: "postReceiptsByReceiptIdVoid",
		permission: "commerce.receipt.void",
		requestRef: "#/components/schemas/VoidReceiptRequest",
		responseRef: "#/components/schemas/Return",
		successStatus: 200,
	})
	.input(
		z.object({
			body: VoidReceiptRequestSchema,
			headers: TenantCommandHeadersSchema,
			params: z.object({ receiptId: IdentifierSchema }),
		})
	)
	.output(ReturnSchema);

// ---------------------------------------------------------------------------
// WS3 PR4: Deposit (commerce.deposit.create/.confirm) and the accountant
// handoff export (platform.export.create/.read).
// ---------------------------------------------------------------------------

export const createDepositContract = base
	.route({
		method: "POST",
		path: "/v1/deposits",
		successStatus: 201,
	})
	.meta({
		operationId: "createDeposit",
		permission: "commerce.deposit.create",
		requestRef: "#/components/schemas/CreateDeposit",
		responseRef: "#/components/schemas/Deposit",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateDepositSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(DepositSchema);

/** WS3 remediation R3, Finding I. */
export const getDepositContract = base
	.route({
		method: "GET",
		path: "/v1/deposits/{depositId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getDepositsByDepositId",
		permission: "commerce.deposit.confirm",
		responseRef: "#/components/schemas/Deposit",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ depositId: IdentifierSchema }),
		})
	)
	.output(DepositSchema);

export const confirmDepositContract = base
	.route({
		method: "POST",
		path: "/v1/deposits/{depositId}/confirm",
		successStatus: 200,
	})
	.meta({
		operationId: "postDepositsByDepositIdConfirm",
		permission: "commerce.deposit.confirm",
		responseRef: "#/components/schemas/Deposit",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ depositId: IdentifierSchema }),
		})
	)
	.output(DepositSchema);

/** WS3 remediation R3, Finding I: pre-commit consequence preview for
 * `commerce.register.close` (the closer's own upcoming action). */
export const getRegisterSessionContract = base
	.route({
		method: "GET",
		path: "/v1/register-sessions/{sessionId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getRegisterSessionsBySessionId",
		permission: "commerce.register.close",
		responseRef: "#/components/schemas/RegisterSession",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ sessionId: IdentifierSchema }),
		})
	)
	.output(RegisterSessionSchema);

/** WS3 remediation R3, Finding I: the SAME register-session read as
 * `getRegisterSessionContract` above, gated on `commerce.cash-variance.
 * approve` instead — the closer and the variance approver are different
 * Parties by Finding C's separation-of-duties rule and are not guaranteed
 * to hold each other's permission, so this is a second thin operation over
 * the identical underlying resource rather than one operation gated on
 * either permission (this contract surface authorizes one permission per
 * operation throughout). `varianceId` IS the register session id, matching
 * `approveCashVarianceContract`'s existing `{varianceId}` param exactly. */
export const getCashVarianceContract = base
	.route({
		method: "GET",
		path: "/v1/cash-variances/{varianceId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getCashVariancesByVarianceId",
		permission: "commerce.cash-variance.approve",
		responseRef: "#/components/schemas/RegisterSession",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ varianceId: IdentifierSchema }),
		})
	)
	.output(RegisterSessionSchema);

export const createAccountantHandoffExportContract = base
	.route({
		method: "POST",
		path: "/v1/exports/accountant-handoff",
		successStatus: 202,
	})
	.meta({
		operationId: "createAccountantHandoffExport",
		permission: "platform.export.create",
		requestRef: "#/components/schemas/AccountantHandoffRequest",
		responseRef: "#/components/schemas/AccountantHandoffExport",
		successStatus: 202,
	})
	.input(
		z.object({
			body: AccountantHandoffRequestSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(AccountantHandoffExportSchema);

export const getExportContract = base
	.route({
		method: "GET",
		path: "/v1/exports/{exportId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getExportsByExportId",
		permission: "platform.export.read",
		responseRef: "#/components/schemas/AccountantHandoffExport",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ exportId: IdentifierSchema }),
		})
	)
	.output(AccountantHandoffExportSchema);

export const createOpeningStockImportContract = base
	.route({
		method: "POST",
		path: "/v1/opening-stock-imports",
		successStatus: 202,
	})
	.meta({
		operationId: "postOpeningStockImports",
		permission: "inventory.import.create",
		requestRef: "#/components/schemas/CreateCsvImport",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 202,
	})
	.input(
		z.object({
			body: CreateCsvImportSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(ImportJobSchema);

export const listOpeningStockImportsContract = base
	.route({
		method: "GET",
		path: "/v1/opening-stock-imports",
		successStatus: 200,
	})
	.meta({
		operationId: "listOpeningStockImports",
		permission: "inventory.import.read",
		responseRef: "#/components/schemas/PagedImports",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				state: ImportJobSchema.shape.state.optional(),
			}),
		})
	)
	.output(PagedImportsSchema);

export const getOpeningStockImportContract = base
	.route({
		method: "GET",
		path: "/v1/opening-stock-imports/{importId}",
		successStatus: 200,
	})
	.meta({
		operationId: "getOpeningStockImport",
		permission: "inventory.import.read",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const acceptOpeningStockImportContract = base
	.route({
		method: "POST",
		path: "/v1/opening-stock-imports/{importId}/accept",
		successStatus: 200,
	})
	.meta({
		operationId: "acceptOpeningStockImport",
		permission: "inventory.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const cancelOpeningStockImportContract = base
	.route({
		method: "POST",
		path: "/v1/opening-stock-imports/{importId}/cancel",
		successStatus: 200,
	})
	.meta({
		operationId: "cancelOpeningStockImport",
		permission: "inventory.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const purgeOpeningStockImportStagingContract = base
	.route({
		method: "POST",
		path: "/v1/opening-stock-imports/{importId}/purge-staging",
		successStatus: 200,
	})
	.meta({
		operationId: "purgeOpeningStockImportStaging",
		permission: "inventory.import.purge",
		responseRef: "#/components/schemas/ImportPurgeResult",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: TenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportPurgeResultSchema);

export const listOpeningStockImportFindingsContract = base
	.route({
		method: "GET",
		path: "/v1/opening-stock-imports/{importId}/findings",
		successStatus: 200,
	})
	.meta({
		operationId: "getOpeningStockImportFindings",
		permission: "inventory.import.read",
		responseRef: "#/components/schemas/ImportFindings",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
			query: PageQuerySchema,
		})
	)
	.output(ImportFindingsSchema);

export const approveOpeningStockImportContract = base
	.route({
		method: "POST",
		path: "/v1/opening-stock-imports/{importId}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "approveOpeningStockImport",
		permission: "inventory.import.approve",
		responseRef: "#/components/schemas/ImportJob",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportJobSchema);

export const getOpeningStockImportCorrectionReportContract = base
	.route({
		method: "GET",
		path: "/v1/opening-stock-imports/{importId}/correction-report",
		successStatus: 200,
	})
	.meta({
		operationId: "getOpeningStockImportCorrectionReport",
		permission: "inventory.import.download",
		responseRef: "#/components/schemas/ImportCorrectionReport",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ importId: IdentifierSchema }),
		})
	)
	.output(ImportCorrectionReportSchema);

export const listStockCountsContract = base
	.route({ method: "GET", path: "/v1/stock-counts", successStatus: 200 })
	.meta({
		operationId: "listStockCounts",
		permission: "inventory.count.read",
		responseRef: "#/components/schemas/PagedStockCounts",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				locationId: IdentifierSchema.optional(),
				state: StockCountSchema.shape.state.optional(),
			}),
		})
	)
	.output(PagedStockCountsSchema);

export const createStockCountContract = base
	.route({ method: "POST", path: "/v1/stock-counts", successStatus: 201 })
	.meta({
		operationId: "createStockCount",
		permission: "inventory.count.create",
		requestRef: "#/components/schemas/CreateStockCount",
		responseRef: "#/components/schemas/StockCount",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateStockCountSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(StockCountSchema);

export const getStockCountContract = base
	.route({ method: "GET", path: "/v1/stock-counts/{id}", successStatus: 200 })
	.meta({
		operationId: "getStockCount",
		permission: "inventory.count.read",
		responseRef: "#/components/schemas/StockCount",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockCountSchema);

export const saveStockCountDraftLinesContract = base
	.route({
		method: "PUT",
		path: "/v1/stock-counts/{id}/draft-lines",
		successStatus: 200,
	})
	.meta({
		operationId: "saveStockCountDraftLines",
		permission: "inventory.count.create",
		requestRef: "#/components/schemas/SaveStockCountDraftLines",
		responseRef: "#/components/schemas/StockCount",
		successStatus: 200,
	})
	.input(
		z.object({
			body: SaveStockCountDraftLinesSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockCountSchema);

export const submitStockCountContract = base
	.route({
		method: "POST",
		path: "/v1/stock-counts/{id}/submit",
		successStatus: 200,
	})
	.meta({
		operationId: "postStockCountsByIdSubmit",
		permission: "inventory.count.submit",
		requestRef: "#/components/schemas/SubmitStockCount",
		responseRef: "#/components/schemas/StockCount",
		successStatus: 200,
	})
	.input(
		z.object({
			body: SubmitStockCountSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockCountSchema);

export const approveStockCountContract = base
	.route({
		method: "POST",
		path: "/v1/stock-counts/{id}/approve",
		successStatus: 200,
	})
	.meta({
		operationId: "postStockCountsByIdApprove",
		permission: "inventory.count.approve",
		responseRef: "#/components/schemas/StockCount",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockCountSchema);

export const listStockTransfersContract = base
	.route({ method: "GET", path: "/v1/stock-transfers", successStatus: 200 })
	.meta({
		operationId: "listStockTransfers",
		permission: "inventory.transfer.read",
		responseRef: "#/components/schemas/PagedStockTransfers",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			query: PageQuerySchema.extend({
				locationId: IdentifierSchema.optional(),
				state: StockTransferSchema.shape.state.optional(),
			}),
		})
	)
	.output(PagedStockTransfersSchema);

export const createStockTransferContract = base
	.route({ method: "POST", path: "/v1/stock-transfers", successStatus: 201 })
	.meta({
		operationId: "createStockTransfer",
		permission: "inventory.transfer.create",
		requestRef: "#/components/schemas/CreateStockTransfer",
		responseRef: "#/components/schemas/StockTransfer",
		successStatus: 201,
	})
	.input(
		z.object({
			body: CreateStockTransferSchema,
			headers: TenantCommandHeadersSchema,
		})
	)
	.output(StockTransferSchema);

export const getStockTransferContract = base
	.route({
		method: "GET",
		path: "/v1/stock-transfers/{id}",
		successStatus: 200,
	})
	.meta({
		operationId: "getStockTransfer",
		permission: "inventory.transfer.read",
		responseRef: "#/components/schemas/StockTransfer",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: RequiredActiveContextHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockTransferSchema);

export const dispatchStockTransferContract = base
	.route({
		method: "POST",
		path: "/v1/stock-transfers/{id}/dispatch",
		successStatus: 200,
	})
	.meta({
		operationId: "dispatchStockTransfer",
		permission: "inventory.transfer.dispatch",
		responseRef: "#/components/schemas/StockTransfer",
		successStatus: 200,
	})
	.input(
		z.object({
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockTransferSchema);

export const receiveStockTransferContract = base
	.route({
		method: "POST",
		path: "/v1/stock-transfers/{id}/receive",
		successStatus: 200,
	})
	.meta({
		operationId: "postStockTransfersByIdReceive",
		permission: "inventory.transfer.receive",
		requestRef: "#/components/schemas/ReceiveStockTransfer",
		responseRef: "#/components/schemas/StockTransfer",
		successStatus: 200,
	})
	.input(
		z.object({
			body: ReceiveStockTransferSchema,
			headers: VersionedTenantCommandHeadersSchema,
			params: z.object({ id: IdentifierSchema }),
		})
	)
	.output(StockTransferSchema);

export const ws2CatalogInventoryApiContract = {
	catalog: {
		imports: {
			accept: acceptProductImportContract,
			approve: approveProductImportContract,
			cancel: cancelProductImportContract,
			correctionReport: getProductImportCorrectionReportContract,
			create: createProductImportContract,
			findings: listProductImportFindingsContract,
			get: getProductImportContract,
			list: listProductImportsContract,
			purgeStaging: purgeProductImportStagingContract,
		},
		products: {
			activate: activateProductContract,
			archive: archiveProductContract,
			create: createProductContract,
			get: getProductContract,
			list: listProductsContract,
			update: updateProductContract,
		},
	},
	inventory: {
		adjustments: {
			approve: approveInventoryAdjustmentContract,
			create: createInventoryAdjustmentContract,
			get: getInventoryAdjustmentContract,
			list: listInventoryAdjustmentsContract,
			reverse: reverseInventoryAdjustmentContract,
		},
		balances: { list: listStockBalancesContract },
		counts: {
			approve: approveStockCountContract,
			create: createStockCountContract,
			get: getStockCountContract,
			list: listStockCountsContract,
			saveDraft: saveStockCountDraftLinesContract,
			submit: submitStockCountContract,
		},
		imports: {
			acceptOpeningStock: acceptOpeningStockImportContract,
			approveOpeningStock: approveOpeningStockImportContract,
			cancelOpeningStock: cancelOpeningStockImportContract,
			createOpeningStock: createOpeningStockImportContract,
			getOpeningStock: getOpeningStockImportContract,
			listOpeningStock: listOpeningStockImportsContract,
			openingStockCorrectionReport:
				getOpeningStockImportCorrectionReportContract,
			openingStockFindings: listOpeningStockImportFindingsContract,
			purgeOpeningStockStaging: purgeOpeningStockImportStagingContract,
		},
		transfers: {
			create: createStockTransferContract,
			dispatch: dispatchStockTransferContract,
			get: getStockTransferContract,
			list: listStockTransfersContract,
			receive: receiveStockTransferContract,
		},
	},
};

export const ws3PosApiContract = {
	commerce: {
		cashMovements: { create: createCashMovementContract },
		cashVariances: {
			approve: approveCashVarianceContract,
			get: getCashVarianceContract,
		},
		deposits: {
			confirm: confirmDepositContract,
			create: createDepositContract,
			get: getDepositContract,
		},
		priceOverrides: {
			approve: approveSalePriceOverrideContract,
			request: requestSalePriceOverrideContract,
		},
		receipts: {
			get: getReceiptContract,
			getByNumber: getReceiptByNumberContract,
			reissue: reissueReceiptContract,
			void: voidReceiptContract,
		},
		refunds: {
			approve: approveRefundContract,
			create: createRefundContract,
			get: getRefundContract,
		},
		registerSessions: { get: getRegisterSessionContract },
		registers: {
			close: closeRegisterContract,
			open: openRegisterContract,
		},
		returns: {
			approve: approveReturnContract,
			create: createReturnContract,
			get: getReturnContract,
		},
		safeDrops: { create: createSafeDropContract },
		sales: {
			complete: completeSaleContract,
			create: createSaleContract,
			getForReturn: getSaleForReturnContract,
			hold: holdSaleContract,
		},
	},
	exports: {
		createAccountantHandoff: createAccountantHandoffExportContract,
		get: getExportContract,
	},
};

export const platformApiContract = {
	audit: { list: listAuditRecordsContract },
	entitlements: { list: listEntitlementsContract },
	events: { createReplay: createEventReplayContract },
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
	...ws2CatalogInventoryApiContract,
	...ws3PosApiContract,
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

export const PLATFORM_OPENAPI_OPERATION_METADATA =
	OPENAPI_OPERATION_METADATA.filter(
		(operation) =>
			(WS1_OPERATION_IDS as readonly string[]).includes(
				operation.operationId
			) || operation.operationId === "createEventReplay"
	);

export const WS2_OPENAPI_OPERATION_METADATA = OPENAPI_OPERATION_METADATA.filter(
	(operation) =>
		"permission" in operation &&
		(operation.permission.startsWith("catalog.") ||
			operation.permission.startsWith("inventory."))
);

export const WS2_EVENT_OPENAPI_OPERATION_METADATA =
	OPENAPI_OPERATION_METADATA.filter(
		(operation) => operation.operationId === "createEventReplay"
	);

/** WS3 PR1 scope only (registers/cash-movements/safe-drops/cash-variance
 * approval); PR2-PR4 add the remaining `commerce.*` operations in later
 * stages and are not yet implemented behind this branch's router. */
export const WS3_PR1_OPERATION_IDS = [
	"openRegister",
	"closeRegister",
	"postRegistersByRegisterIdCashMovements",
	"postRegistersByRegisterIdSafeDrops",
	"postCashVariancesByVarianceIdApprove",
] as const;

export const WS3_PR1_OPENAPI_OPERATION_METADATA =
	OPENAPI_OPERATION_METADATA.filter((operation) =>
		(WS3_PR1_OPERATION_IDS as readonly string[]).includes(operation.operationId)
	);

/** WS3 PR1-PR4 scope: every `commerce.*`/`platform.export.*` operation
 * implemented behind this branch's router as of PR4 (registers/cash/sale/
 * receipt/return/refund/void/reissue/deposit/accountant-handoff export).
 * `ws3PosApiContract`'s procedure tree is asserted against exactly this
 * set (see `index.test.ts`), the same parity discipline
 * `PLATFORM_OPENAPI_OPERATION_METADATA` and `WS2_OPENAPI_OPERATION_
 * METADATA` already use. */
export const WS3_OPERATION_IDS = [
	...WS3_PR1_OPERATION_IDS,
	"createSale",
	"completeSale",
	"postSalesBySaleIdHold",
	"requestSalePriceOverride",
	"approveSalePriceOverride",
	"getReceiptsByReceiptId",
	"createReturn",
	"postReturnsByReturnIdApprove",
	"postRefunds",
	"postRefundsByRefundIdApprove",
	"postReceiptsByReceiptIdReissue",
	"postReceiptsByReceiptIdVoid",
	"createDeposit",
	"postDepositsByDepositIdConfirm",
	"createAccountantHandoffExport",
	"getExportsByExportId",
	// WS3 remediation R3: Findings I and J's pre-commit consequence-preview
	// and receipt-to-return server-lookup reads, all reusing an already-
	// registered commerce.* permission (no new identifier invented).
	"getReturnsByReturnId",
	"getRefundsByRefundId",
	"getDepositsByDepositId",
	"getRegisterSessionsBySessionId",
	"getCashVariancesByVarianceId",
	"getRegistersByRegisterIdReceiptsByReceiptNumber",
	"getRegistersByRegisterIdReceiptsByReceiptNumberSale",
] as const;

export const WS3_OPENAPI_OPERATION_METADATA = OPENAPI_OPERATION_METADATA.filter(
	(operation) =>
		(WS3_OPERATION_IDS as readonly string[]).includes(operation.operationId)
);
