import { randomUUID } from "node:crypto";
import {
	createPosApplication,
	createPosService,
	type PosCatalogPort,
	PosError,
	type PosIdFactory,
} from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createPosRepository } from "@meridian/persistence-pos-postgres";

import { permissionAuthorizer } from "./authorization";
import { catalogService } from "./catalog";
import { entitlementEvaluator } from "./entitlements";
import {
	createReturnInventoryMovementAdapter,
	createSaleInventoryMovementAdapter,
} from "./inventory";
import {
	createDepositReferenceAllocator,
	createReceiptNumberAllocator,
} from "./numbering";
import { partyIdentityLinkDirectory } from "./party";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: PosIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR2's ONE shared unit of work for `sale.complete` (frozen control
 * plan "Read first"): one `createPostgresUnitOfWork`, one `PoolClient`,
 * one transaction spanning the sale commit, receipt numbering, and the
 * synchronous Inventory stock movement — never split across separate
 * transactions the way `platform-import-export`'s `OpeningStock` target
 * commit is. Every other POS command keeps using the plain `unitOfWork`
 * above.
 */
const saleUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	inventory: createSaleInventoryMovementAdapter(client),
	numbering: createReceiptNumberAllocator(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR3's shared unit of work for `return.approve`, `voidReceipt`, and
 * `reissueReceipt` (frozen control plan §6.3, "Read first" — mirrors
 * `saleUnitOfWork` exactly): one `createPostgresUnitOfWork`, one
 * `PoolClient`, one transaction spanning the Return/Void commit, receipt
 * numbering, and the synchronous compensating Inventory movement.
 * `reissueReceipt` never invokes `inventory`; it shares this unit of work
 * anyway rather than standing up a third transactional wiring point purely
 * to omit one unused port (see the domain package's `PosServiceOptions.
 * returnUnitOfWork` doc comment).
 */
const returnUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	inventory: createReturnInventoryMovementAdapter(client),
	numbering: createReceiptNumberAllocator(client),
	repository: createPosRepository(client),
}));

/**
 * WS3 PR4's shared unit of work for `deposit.create` ONLY (frozen control
 * plan §6.6, mirrors `saleUnitOfWork`'s "one shared unit of work"
 * discipline): one `createPostgresUnitOfWork`, one `PoolClient`, one
 * transaction spanning the deposit-reservation commit and the
 * organization-scoped deposit-reference allocation. `confirmDeposit` never
 * touches Numbering — it uses the plain `unitOfWork` above.
 */
const depositUnitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	numbering: createDepositReferenceAllocator(client),
	repository: createPosRepository(client),
}));

const parties = {
	async requireActorPartyId(input: {
		authUserId: string;
		organizationId: string;
		tenantId: string;
	}) {
		const partyId = await partyIdentityLinkDirectory.findActivePartyId(input);
		if (!partyId) {
			throw new PosError(
				"invalid_reference",
				"Actor has no active Party identity link for the active organization"
			);
		}
		return partyId;
	},
};

/** Product name/reference lookup for the sale-line snapshot. Reads go
 * through the same `catalogService` Inventory's own `references` port
 * already uses (top-level pool, not the sale's transactional client — a
 * cross-domain READ, not a write participating in the sale's atomicity). */
const products: PosCatalogPort = {
	async requireProduct(input) {
		const product = await catalogService.getProduct(
			input.tenantId,
			input.productId
		);
		if (!input.variantId) {
			return { productName: product.name };
		}
		const variant = product.variants.find(
			(candidate) => candidate.id === input.variantId
		);
		if (!variant) {
			throw new PosError(
				"invalid_reference",
				"Variant does not belong to the Product"
			);
		}
		return { productName: `${product.name} — ${variant.name}` };
	},
};

export const posService = createPosService({
	clock: () => new Date(),
	depositUnitOfWork,
	ids,
	parties,
	pricing: createPricingEngine(),
	products,
	returnUnitOfWork,
	saleUnitOfWork,
	tax: createTaxEngine(),
	unitOfWork,
});

export const posApplication = createPosApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
				// WS3 remediation R2, Finding B: previously dropped here even
				// though `tenancyService.requireContext` already resolves it
				// (`ActiveContextRecord.locationId`, set by `switchContext`) —
				// the domain layer's by-ID lookups now use this to additionally
				// scope session/sale reads and mutations to the caller's active
				// location, on top of organization scope, for a location-scoped
				// actor. `undefined` for an organization-scoped-only actor is a
				// no-op filter, never a deny-everything or allow-everything.
				locationId: context.locationId,
				organizationId: context.organizationId,
				tenantId: context.tenantId,
			};
		},
	},
	entitlements: entitlementEvaluator,
	permissions: permissionAuthorizer,
	service: posService,
});

/**
 * `/registers/{registerId}/safe-drops` and `/registers/{registerId}/cash-
 * movements` share one permission and one domain command
 * (`commerce.cash-movement.create`) per the frozen WS3 control plan §4/§6 —
 * a safe drop is a cash movement with the `SafeDrop` reason code and
 * `PaidOut` direction fixed by the transport, not a caller choice.
 */
export const posTransportApplication = {
	approveCashVariance: posApplication.approveCashVariance,
	approveRefund: posApplication.approveRefund,
	approveReturn: posApplication.approveReturn,
	approveSalePriceOverride: posApplication.approvePriceOverride,
	closeRegister: posApplication.closeRegister,
	completeSale: posApplication.completeSale,
	confirmDeposit: posApplication.confirmDeposit,
	createCashMovement: posApplication.createCashMovement,
	createDeposit: posApplication.createDeposit,
	createRefund: posApplication.createRefund,
	createReturn: posApplication.createReturn,
	createSafeDrop: (
		input: Omit<
			Parameters<typeof posApplication.createCashMovement>[0],
			"direction" | "reasonCode"
		>
	) =>
		posApplication.createCashMovement({
			...input,
			direction: "PaidOut",
			reasonCode: "SafeDrop",
		}),
	createSale: posApplication.createSale,
	getCashVariance: posApplication.getCashVariance,
	getDeposit: posApplication.getDeposit,
	getReceipt: posApplication.getReceipt,
	getReceiptByNumber: posApplication.getReceiptByNumber,
	getRefund: posApplication.getRefund,
	getRegisterSession: posApplication.getRegisterSession,
	getReturn: posApplication.getReturn,
	getSaleForReturn: posApplication.getSaleForReturn,
	holdSale: posApplication.holdSale,
	// WS3 remediation R3b, Item 7 (server-backed discovery): each wrapper
	// below reshapes the router's flat `input.query` (cursor/limit/state/
	// locationId, matching `PageQuerySchema` in `packages/contracts/
	// platform-api`) into the domain application layer's `{page, filters}`
	// split — the SAME reshaping `listInventoryAdjustments` already does in
	// this same pattern, applied to POS's five pending-approval/
	// confirmation queues.
	listCashVariances: (
		input: Omit<
			Parameters<typeof posApplication.listCashVariances>[0],
			"filters" | "page"
		> & {
			page: {
				cursor?: string;
				limit: number;
				locationId?: string;
				state?: "Open" | "Closing" | "Closed";
			};
		}
	) => {
		const { locationId, state, ...page } = input.page;
		return posApplication.listCashVariances({
			...input,
			filters: { locationId, state },
			page,
		});
	},
	listDeposits: (
		input: Omit<
			Parameters<typeof posApplication.listDeposits>[0],
			"filters" | "page"
		> & {
			page: {
				cursor?: string;
				limit: number;
				state?: "Prepared" | "Reconciled";
			};
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listDeposits({ ...input, filters: { state }, page });
	},
	listPriceOverrides: (
		input: Omit<
			Parameters<typeof posApplication.listPriceOverrides>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Pending" | "Approved" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listPriceOverrides({
			...input,
			filters: { state },
			page,
		});
	},
	listRefunds: (
		input: Omit<
			Parameters<typeof posApplication.listRefunds>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Requested" | "Posted" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listRefunds({ ...input, filters: { state }, page });
	},
	listReturns: (
		input: Omit<
			Parameters<typeof posApplication.listReturns>[0],
			"filters" | "page"
		> & {
			page: { cursor?: string; limit: number; state?: "Pending" | "Completed" };
		}
	) => {
		const { state, ...page } = input.page;
		return posApplication.listReturns({ ...input, filters: { state }, page });
	},
	openRegister: posApplication.openRegister,
	reissueReceipt: posApplication.reissueReceipt,
	requestSalePriceOverride: posApplication.requestPriceOverride,
	voidReceipt: posApplication.voidReceipt,
};
