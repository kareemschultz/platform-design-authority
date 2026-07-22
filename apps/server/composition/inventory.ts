import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
	createInventoryApplication,
	createInventoryService,
	InventoryError,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import type {
	ReturnInventoryMovementPort,
	SaleInventoryMovementPort,
} from "@meridian/domain-pos";
import {
	createInventoryRepository,
	parseInventoryStockBalanceCursor,
	serializeInventoryStockBalanceCursor,
} from "@meridian/persistence-inventory-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";
import type { PoolClient } from "pg";

import { permissionAuthorizer } from "./authorization";
import { catalogService } from "./catalog";
import { entitlementEvaluator } from "./entitlements";
import { databasePool } from "./postgres";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";
import { tenancyService } from "./tenancy";

const ids: InventoryIdFactory = {
	create(kind) {
		return `${kind}_${randomUUID().replaceAll("-", "")}`;
	},
};

const STOCK_BALANCE_CURSOR_PREFIX = "sb1_";
const STOCK_BALANCE_CURSOR_PATTERN = /^sb1_[A-Za-z0-9_-]+$/;

export const encodeStockBalanceCursor = (
	cursor: string | null
): string | null => {
	if (cursor === null) {
		return null;
	}
	const value = parseInventoryStockBalanceCursor(cursor);
	if (!value) {
		throw new InventoryError(
			"invalid_reference",
			"Stock balance cursor is invalid"
		);
	}
	const canonical = serializeInventoryStockBalanceCursor(value);
	return `${STOCK_BALANCE_CURSOR_PREFIX}${Buffer.from(canonical, "utf8").toString("base64url")}`;
};

export const decodeStockBalanceCursor = (
	cursor: string | undefined
): string | undefined => {
	if (cursor === undefined) {
		return;
	}
	if (cursor.length > 1024 || !STOCK_BALANCE_CURSOR_PATTERN.test(cursor)) {
		throw new InventoryError(
			"invalid_reference",
			"Stock balance cursor is invalid"
		);
	}
	const encoded = cursor.slice(STOCK_BALANCE_CURSOR_PREFIX.length);
	const decoded = Buffer.from(encoded, "base64url").toString("utf8");
	const value = parseInventoryStockBalanceCursor(decoded);
	if (
		Buffer.from(decoded, "utf8").toString("base64url") !== encoded ||
		!value
	) {
		throw new InventoryError(
			"invalid_reference",
			"Stock balance cursor is invalid"
		);
	}
	return serializeInventoryStockBalanceCursor(value);
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createInventoryRepository(client),
}));

/** Read-only reference checks against the same top-level pools every other
 * Inventory command already uses (not the sale's transactional client —
 * these are cross-domain reads, not writes participating in the sale's
 * atomicity). Shared by `inventoryService` and
 * `createSaleInventoryMovementAdapter` below. */
const references = {
	async requireLocation(input: {
		locationId: string;
		organizationId: string;
		tenantId: string;
	}) {
		const location = await createTenancyRepository(databasePool).getLocation(
			input.tenantId,
			input.locationId
		);
		if (!location || location.organizationId !== input.organizationId) {
			throw new InventoryError(
				"invalid_reference",
				"Location is outside the active tenant and organization"
			);
		}
	},
	async requireProduct(input: {
		productId: string;
		tenantId: string;
		variantId?: string | null;
	}) {
		const product = await catalogService.getProduct(
			input.tenantId,
			input.productId
		);
		if (
			input.variantId &&
			!product.variants.some((variant) => variant.id === input.variantId)
		) {
			throw new InventoryError(
				"invalid_reference",
				"Variant does not belong to the Product"
			);
		}
	},
};

export const inventoryService = createInventoryService({
	clock: () => new Date(),
	ids,
	references,
	unitOfWork,
});

/**
 * WS3 PR2's mandated seam (frozen control plan §6.3, "Read first"): builds
 * an Inventory service instance bound to the SAME transactional
 * `PoolClient` as the sale's own unit of work — mirroring
 * `createImportReferenceAllocator` (numbering.ts), never the `imports.ts`
 * `OpeningStock` target's separate-transaction pattern. Only
 * `recordSaleMovement` is exposed; POS's domain package never imports
 * `@meridian/domain-inventory` directly (composition-only, per
 * `registry/architecture-rules.json`'s `domains` family, which does not
 * list `domains` among its own allowed dependencies).
 */
export function createSaleInventoryMovementAdapter(
	client: PoolClient
): SaleInventoryMovementPort {
	const service = createInventoryService({
		clock: () => new Date(),
		ids,
		references,
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createInventoryRepository(client),
				}),
		},
	});
	return {
		async recordSaleMovement(input) {
			const result = await service.recordSaleMovement(input);
			if (result === "negative_stock") {
				return "negative_stock";
			}
			return { movementId: result.id };
		},
	};
}

/**
 * WS3 PR3's compensating-movement mirror of
 * `createSaleInventoryMovementAdapter` immediately above: an Inventory
 * service instance bound to the SAME transactional `PoolClient` as the
 * Return's own unit of work (`return.approve`/`voidReceipt`). Only
 * `recordReturnMovement` is exposed, for the same composition-only,
 * cross-domain-import discipline `SaleInventoryMovementPort` already
 * documents.
 */
export function createReturnInventoryMovementAdapter(
	client: PoolClient
): ReturnInventoryMovementPort {
	const service = createInventoryService({
		clock: () => new Date(),
		ids,
		references,
		unitOfWork: {
			execute: (operation) =>
				operation({
					events: createPostgresOutbox(client),
					repository: createInventoryRepository(client),
				}),
		},
	});
	return {
		async recordReturnMovement(input) {
			const result = await service.recordReturnMovement(input);
			return { movementId: result.id };
		},
	};
}

export const inventoryApplication = createInventoryApplication({
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
	service: inventoryService,
});

export const inventoryTransportApplication = {
	approveInventoryAdjustment: inventoryApplication.approveAdjustment,
	approveStockCount: inventoryApplication.approveCount,
	createInventoryAdjustment: inventoryApplication.createAdjustment,
	createStockCount: inventoryApplication.createCount,
	createStockTransfer: inventoryApplication.createTransfer,
	dispatchStockTransfer: inventoryApplication.dispatchTransfer,
	getInventoryAdjustment: inventoryApplication.getAdjustment,
	getStockCount: inventoryApplication.getCount,
	getStockTransfer: inventoryApplication.getTransfer,
	listInventoryAdjustments: (
		input: Parameters<typeof inventoryApplication.listAdjustments>[0] & {
			page: {
				cursor?: string;
				limit: number;
				locationId?: string;
				state?:
					| "Draft"
					| "PendingApproval"
					| "Approved"
					| "Posted"
					| "Reversed"
					| "Rejected";
			};
		}
	) => {
		const { locationId, state, ...page } = input.page;
		return inventoryApplication.listAdjustments({
			...input,
			filters: { locationId, state },
			page,
		});
	},
	listStockBalances: async (input: {
		authUserId: string;
		contextId: string;
		query: {
			cursor?: string;
			limit: number;
			locationId: string;
			productId?: string;
		};
		sessionId: string;
	}) => {
		const page = await inventoryApplication.listBalances({
			authUserId: input.authUserId,
			contextId: input.contextId,
			filters: {
				locationId: input.query.locationId,
				productId: input.query.productId,
			},
			page: {
				cursor: decodeStockBalanceCursor(input.query.cursor),
				limit: input.query.limit,
			},
			sessionId: input.sessionId,
		});
		return {
			items: page.items,
			nextCursor: encodeStockBalanceCursor(page.nextCursor),
		};
	},
	listStockCounts: (
		input: Parameters<typeof inventoryApplication.listCounts>[0] & {
			page: {
				cursor?: string;
				limit: number;
				locationId?: string;
				state?:
					| "Draft"
					| "InProgress"
					| "Submitted"
					| "Approved"
					| "Posted"
					| "Rejected";
			};
		}
	) => {
		const { locationId, state, ...page } = input.page;
		return inventoryApplication.listCounts({
			...input,
			filters: { locationId, state },
			page,
		});
	},
	listStockTransfers: (
		input: Parameters<typeof inventoryApplication.listTransfers>[0] & {
			page: {
				cursor?: string;
				limit: number;
				locationId?: string;
				state?:
					| "Draft"
					| "Dispatched"
					| "PartiallyReceived"
					| "Received"
					| "Exception"
					| "Cancelled";
			};
		}
	) => {
		const { locationId, state, ...page } = input.page;
		return inventoryApplication.listTransfers({
			...input,
			filters: { locationId, state },
			page,
		});
	},
	receiveStockTransfer: inventoryApplication.receiveTransfer,
	reverseInventoryAdjustment: inventoryApplication.reverseAdjustment,
	saveStockCountDraft: inventoryApplication.saveCountDraft,
	submitStockCount: inventoryApplication.submitCount,
};
