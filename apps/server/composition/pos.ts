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
import { createSaleInventoryMovementAdapter } from "./inventory";
import { createReceiptNumberAllocator } from "./numbering";
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
	ids,
	parties,
	pricing: createPricingEngine(),
	products,
	saleUnitOfWork,
	tax: createTaxEngine(),
	unitOfWork,
});

export const posApplication = createPosApplication({
	activeContexts: {
		async requireActiveContext(input) {
			const context = await tenancyService.requireContext(input);
			return {
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
	approveSalePriceOverride: posApplication.approvePriceOverride,
	closeRegister: posApplication.closeRegister,
	completeSale: posApplication.completeSale,
	createCashMovement: posApplication.createCashMovement,
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
	getReceipt: posApplication.getReceipt,
	holdSale: posApplication.holdSale,
	openRegister: posApplication.openRegister,
	requestSalePriceOverride: posApplication.requestPriceOverride,
};
