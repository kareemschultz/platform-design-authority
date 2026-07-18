import type { PermissionId } from "@meridian/contracts-permissions";
import type {
	AccountantHandoffExport,
	ActiveContext,
	ActiveContextRequest,
	AuditRecord,
	AuthorizationDecision,
	CashMovement,
	CreateCsvImport,
	CreateEventReplayRequest,
	CreateInventoryAdjustment,
	CreateOrganizationParty,
	CreatePartyIdentityLinkRequest,
	CreatePersonParty,
	CreateProduct,
	CreateRoleAssignmentRequest,
	CreateStockCount,
	CreateStockTransfer,
	CreateUserInvitationRequest,
	CurrentIdentity,
	Deposit,
	Entitlement,
	EventReplayRequest,
	ImportCorrectionReport,
	ImportFindings,
	ImportJob,
	ImportPurgeResult,
	InventoryAdjustment,
	Location,
	Money,
	Organization,
	PagedImports,
	Party,
	PlatformIdentityLink,
	Product,
	Receipt,
	ReceiveStockTransfer,
	Refund,
	RegisterSession,
	Return,
	Role,
	RoleAssignment,
	Sale,
	SaveStockCountDraftLines,
	SessionSummary,
	StockBalance,
	StockCount,
	StockTransfer,
	SubmitStockCount,
	SuspendTenantMembershipRequest,
	TransitionReason,
	UpdateOrganizationRequest,
	UpdatePartyRequest,
	UpdateProduct,
	UserInvitation,
	UserSummary,
} from "@meridian/contracts-platform-api";
import type { Context as HonoContext } from "hono";

export interface IdentitySessionService {
	getSession: (input: { headers: Headers }) => Promise<IdentitySession | null>;
}

export interface IdentitySession {
	session: {
		createdAt: Date;
		expiresAt: Date;
		id: string;
		token: string;
		updatedAt: Date;
		userId: string;
		[key: string]: unknown;
	};
	user: {
		createdAt: Date;
		email: string;
		emailVerified: boolean;
		id: string;
		image?: string | null;
		name: string;
		updatedAt: Date;
		[key: string]: unknown;
	};
}

export interface CreateContextOptions {
	application: ServerApplication;
	authorizer: PermissionAuthorizer;
	context: HonoContext;
	identity: IdentitySessionService;
}

export interface Page<T> {
	items: T[];
	nextCursor: string | null;
}

export interface EventReplayApplication {
	createEventReplay: (input: {
		actorUserId: string;
		body: CreateEventReplayRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		tenantId: string;
	}) => Promise<EventReplayRequest>;
}

export interface TenancyApplication {
	createRoleAssignment: (input: {
		actorUserId: string;
		body: CreateRoleAssignmentRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<RoleAssignment>;
	getCurrentIdentity: (input: {
		activeContextId?: string;
		assuranceLevel: CurrentIdentity["assuranceLevel"];
		authUserId: string;
		sessionId: string;
	}) => Promise<CurrentIdentity>;
	getOrganization: (input: {
		authUserId: string;
		contextId: string;
		organizationId: string;
		sessionId: string;
	}) => Promise<Organization>;
	inviteUser: (input: {
		actorUserId: string;
		body: CreateUserInvitationRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<UserInvitation>;
	listLocations: (input: {
		authUserId: string;
		contextId: string;
		organizationId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Location>>;
	listOrganizations: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Organization>>;
	listRoles: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Role>>;
	listUsers: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<UserSummary>>;
	setActiveContext: (input: {
		authUserId: string;
		body: ActiveContextRequest;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<ActiveContext>;
	suspendMembership: (input: {
		actorUserId: string;
		body: SuspendTenantMembershipRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		targetAuthUserId: string;
	}) => Promise<UserSummary>;
	updateOrganization: (input: {
		authUserId: string;
		body: UpdateOrganizationRequest;
		contextId: string;
		idempotencyKey: string;
		organizationId: string;
		sessionId: string;
	}) => Promise<Organization>;
}

export interface PartyApplication {
	createIdentityLink: (input: {
		actorUserId: string;
		body: CreatePartyIdentityLinkRequest;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<PlatformIdentityLink>;
	createOrganizationParty: (input: {
		actorUserId: string;
		body: CreateOrganizationParty;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Party>;
	createPersonParty: (input: {
		actorUserId: string;
		body: CreatePersonParty;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Party>;
	getParty: (input: {
		authUserId: string;
		contextId: string;
		partyId: string;
		sessionId: string;
	}) => Promise<Party>;
	listParties: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number; query?: string };
		sessionId: string;
	}) => Promise<Page<Party>>;
	updateParty: (input: {
		actorUserId: string;
		body: UpdatePartyRequest;
		contextId: string;
		idempotencyKey: string;
		partyId: string;
		sessionId: string;
	}) => Promise<Party>;
}

export interface EntitlementsApplication {
	listEntitlements: (input: {
		authUserId: string;
		contextId: string;
		page: { cursor?: string; limit: number };
		sessionId: string;
	}) => Promise<Page<Entitlement>>;
}

export interface IdentitySessionsApplication {
	listCurrentUserSessions: (input: {
		authUserId: string;
		currentSessionId: string;
		page: { cursor?: string; limit: number };
	}) => Promise<Page<SessionSummary>>;
	revokeCurrentUserSession: (input: {
		authUserId: string;
		correlationId: string;
		currentSessionId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<void>;
}

export interface AuditApplication {
	listAuditRecords: (input: {
		actorUserId: string;
		correlationId: string;
		page: {
			action?: string;
			actorUserId?: string;
			cursor?: string;
			limit: number;
			occurredAfter?: Date;
			occurredBefore?: Date;
			tenantId: string;
		};
	}) => Promise<Page<AuditRecord>>;
}

export interface CatalogApplication {
	activateProduct: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		productId: string;
		sessionId: string;
		version: number;
	}) => Promise<Product>;
	archiveProduct: (input: {
		actorUserId: string;
		body: TransitionReason;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		productId: string;
		sessionId: string;
		version: number;
	}) => Promise<Product>;
	createProduct: (input: {
		actorUserId: string;
		body: CreateProduct;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Product>;
	getProduct: (input: {
		authUserId: string;
		contextId: string;
		productId: string;
		sessionId: string;
	}) => Promise<Product>;
	listProducts: (input: {
		authUserId: string;
		contextId: string;
		page: {
			barcode?: string;
			cursor?: string;
			limit: number;
			query?: string;
			sku?: string;
			state?: Product["state"];
		};
		sessionId: string;
	}) => Promise<Page<Product>>;
	updateProduct: (input: {
		actorUserId: string;
		body: UpdateProduct;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		productId: string;
		sessionId: string;
		version: number;
	}) => Promise<Product>;
}

export interface InventoryApplication {
	approveInventoryAdjustment: (input: {
		actorUserId: string;
		adjustmentId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		version: number;
	}) => Promise<InventoryAdjustment>;
	approveStockCount: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		countId: string;
		idempotencyKey: string;
		sessionId: string;
		version: number;
	}) => Promise<StockCount>;
	createInventoryAdjustment: (input: {
		actorUserId: string;
		body: CreateInventoryAdjustment;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<InventoryAdjustment>;
	createStockCount: (input: {
		actorUserId: string;
		body: CreateStockCount;
		contextId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<StockCount>;
	createStockTransfer: (input: {
		actorUserId: string;
		body: CreateStockTransfer;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<StockTransfer>;
	dispatchStockTransfer: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		transferId: string;
		version: number;
	}) => Promise<StockTransfer>;
	getInventoryAdjustment: (input: {
		authUserId: string;
		adjustmentId: string;
		contextId: string;
		sessionId: string;
	}) => Promise<InventoryAdjustment>;
	getStockCount: (input: {
		authUserId: string;
		contextId: string;
		countId: string;
		sessionId: string;
	}) => Promise<StockCount>;
	getStockTransfer: (input: {
		authUserId: string;
		contextId: string;
		sessionId: string;
		transferId: string;
	}) => Promise<StockTransfer>;
	listInventoryAdjustments: (input: {
		authUserId: string;
		contextId: string;
		page: {
			cursor?: string;
			limit: number;
			locationId?: string;
			state?: InventoryAdjustment["state"];
		};
		sessionId: string;
	}) => Promise<Page<InventoryAdjustment>>;
	listStockBalances: (input: {
		authUserId: string;
		contextId: string;
		query: {
			cursor?: string;
			limit: number;
			locationId: string;
			productId?: string;
		};
		sessionId: string;
	}) => Promise<Page<StockBalance>>;
	listStockCounts: (input: {
		authUserId: string;
		contextId: string;
		page: {
			cursor?: string;
			limit: number;
			locationId?: string;
			state?: StockCount["state"];
		};
		sessionId: string;
	}) => Promise<Page<StockCount>>;
	listStockTransfers: (input: {
		authUserId: string;
		contextId: string;
		page: {
			cursor?: string;
			limit: number;
			locationId?: string;
			state?: StockTransfer["state"];
		};
		sessionId: string;
	}) => Promise<Page<StockTransfer>>;
	receiveStockTransfer: (input: {
		actorUserId: string;
		body: ReceiveStockTransfer;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		transferId: string;
		version: number;
	}) => Promise<StockTransfer>;
	reverseInventoryAdjustment: (input: {
		actorUserId: string;
		adjustmentId: string;
		body: TransitionReason;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		version: number;
	}) => Promise<InventoryAdjustment>;
	saveStockCountDraft: (input: {
		actorUserId: string;
		body: SaveStockCountDraftLines;
		contextId: string;
		countId: string;
		idempotencyKey: string;
		sessionId: string;
		version: number;
	}) => Promise<StockCount>;
	submitStockCount: (input: {
		actorUserId: string;
		body: SubmitStockCount;
		contextId: string;
		countId: string;
		idempotencyKey: string;
		sessionId: string;
		version: number;
	}) => Promise<StockCount>;
}

export interface PosApplication {
	approveCashVariance: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		registerSessionId: string;
		sessionId: string;
		version: number;
	}) => Promise<RegisterSession>;

	// -- WS3 PR3: Return, Refund, Void, Reissue ------------------------------
	approveRefund: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		refundId: string;
		sessionId: string;
	}) => Promise<Refund>;
	approveReturn: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		returnId: string;
		sessionId: string;
	}) => Promise<Return>;

	// -- WS3 PR2: Sale, PriceOverride, Receipt -------------------------------
	approveSalePriceOverride: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		overrideId: string;
		saleId: string;
		sessionId: string;
	}) => Promise<Sale>;
	closeRegister: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		countedCash: Money;
		idempotencyKey: string;
		reason?: string | null;
		registerId: string;
		sessionId: string;
	}) => Promise<RegisterSession>;
	completeSale: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		/** Realizes `commerce.exchanges` (frozen control plan §6.5) — see
		 * `CompleteSaleRequestSchema`'s doc comment. */
		exchangeOfReturnId?: string | null;
		idempotencyKey: string;
		saleId: string;
		sessionId: string;
		tenders: Array<{
			amountMinor: number;
			currency: string;
			referenceId?: string | null;
			type: "Cash" | "PaymentIntent" | "StoredValue";
		}>;
	}) => Promise<Sale>;

	// -- WS3 PR4: Deposit -----------------------------------------------------
	confirmDeposit: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		depositId: string;
		idempotencyKey: string;
		sessionId: string;
	}) => Promise<Deposit>;
	createCashMovement: (input: {
		actorUserId: string;
		amount: Money;
		contextId: string;
		correlationId: string;
		direction: "PaidIn" | "PaidOut";
		idempotencyKey: string;
		note?: string | null;
		reasonCode: "Other" | "PaidIn" | "PaidOut";
		referenceId?: string | null;
		registerId: string;
		sessionId: string;
	}) => Promise<CashMovement>;
	createDeposit: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		countedAmountMinor: number;
		currency: string;
		idempotencyKey: string;
		sessionId: string;
		sourceShiftIds: string[];
	}) => Promise<Deposit>;
	createRefund: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		returnId: string;
		sessionId: string;
	}) => Promise<Refund>;
	createReturn: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		lines: Array<{ quantity: string; saleLineId: string }>;
		reason: string;
		saleId: string;
		sessionId: string;
	}) => Promise<Return>;
	createSafeDrop: (input: {
		actorUserId: string;
		amount: Money;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		note?: string | null;
		registerId: string;
		sessionId: string;
	}) => Promise<CashMovement>;
	createSale: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		currency: string;
		customerPartyId?: string | null;
		idempotencyKey: string;
		lines: Array<{
			discountAmount?: Money | null;
			productId: string;
			quantity: string;
			taxCategory?:
				| "GY_STANDARD_14"
				| "GY_ZERO_RATED"
				| "GY_EXEMPT"
				| "GY_OUT_OF_SCOPE";
			unit: string;
			unitPrice: Money;
			variantId?: string | null;
		}>;
		registerId: string;
		sessionId: string;
	}) => Promise<Sale>;
	getReceipt: (input: {
		actorUserId: string;
		contextId: string;
		receiptId: string;
		sessionId: string;
	}) => Promise<Receipt>;
	holdSale: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		reason?: string | null;
		saleId: string;
		sessionId: string;
	}) => Promise<Sale>;
	openRegister: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		currency: string;
		idempotencyKey: string;
		locationId: string;
		openingFloat: Money;
		registerId: string;
		sessionId: string;
	}) => Promise<RegisterSession>;
	reissueReceipt: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		priceSuppressed?: boolean;
		receiptId: string;
		sessionId: string;
	}) => Promise<Receipt>;
	requestSalePriceOverride: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		lineId: string;
		reason: string;
		requestedPrice: Money;
		saleId: string;
		sessionId: string;
	}) => Promise<Sale>;
	voidReceipt: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		reason?: string | null;
		receiptId: string;
		sessionId: string;
	}) => Promise<Return>;
}

/** WS3 PR4: accountant-handoff export (`platform.export.create`/`.read`). */
export interface FinanceHandoffApplication {
	createAccountantHandoffExport: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		currency: string;
		idempotencyKey: string;
		legalEntityId: string;
		periodEnd: string;
		periodStart: string;
		sessionId: string;
		timezone: string;
	}) => Promise<AccountantHandoffExport>;
	getAccountantHandoffExport: (input: {
		actorUserId: string;
		contextId: string;
		exportId: string;
		sessionId: string;
	}) => Promise<AccountantHandoffExport>;
}

export interface ImportApplication {
	acceptImport: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
		version: number;
	}) => Promise<ImportJob>;
	approveImport: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
		version: number;
	}) => Promise<ImportJob>;
	cancelImport: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
		version: number;
	}) => Promise<ImportJob>;
	createImport: (input: {
		actorUserId: string;
		body: CreateCsvImport;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
	}) => Promise<ImportJob>;
	getImport: (input: {
		actorUserId: string;
		contextId: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
	}) => Promise<ImportJob>;
	getImportCorrectionReport: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
	}) => Promise<ImportCorrectionReport>;
	listImportFindings: (input: {
		actorUserId: string;
		contextId: string;
		importId: string;
		cursor?: string;
		limit: number;
		sessionId: string;
		target: "Product" | "OpeningStock";
	}) => Promise<ImportFindings>;
	listImports: (input: {
		actorUserId: string;
		contextId: string;
		cursor?: string;
		limit: number;
		sessionId: string;
		state?: ImportJob["state"];
		target: "Product" | "OpeningStock";
	}) => Promise<PagedImports>;
	purgeImportStaging: (input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		idempotencyKey: string;
		importId: string;
		sessionId: string;
		target: "Product" | "OpeningStock";
	}) => Promise<ImportPurgeResult>;
}

export interface ServerApplication
	extends AuditApplication,
		CatalogApplication,
		EntitlementsApplication,
		EventReplayApplication,
		FinanceHandoffApplication,
		IdentitySessionsApplication,
		ImportApplication,
		InventoryApplication,
		PartyApplication,
		PosApplication,
		TenancyApplication {}

export interface PermissionAuthorizer {
	decide: (input: {
		assuranceLevel: string;
		authUserId: string;
		contextId: string;
		permission: PermissionId;
		resourceScope?: {
			scopeId?: string;
			scopeType:
				| "Tenant"
				| "Organization"
				| "LegalEntity"
				| "Branch"
				| "Location";
		};
		sessionId: string;
	}) => Promise<AuthorizationDecision>;
	requirePermission: PermissionAuthorizer["decide"];
}

export async function createContext({
	application,
	authorizer,
	context,
	identity,
}: CreateContextOptions) {
	const session = await identity.getSession({
		headers: context.req.raw.headers,
	});
	return {
		application,
		authorizer,
		correlationId: crypto.randomUUID(),
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
