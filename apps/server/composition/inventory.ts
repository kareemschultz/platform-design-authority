import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";
import {
	createInventoryApplication,
	createInventoryService,
	InventoryError,
	type InventoryIdFactory,
} from "@meridian/domain-inventory";
import { createInventoryRepository } from "@meridian/persistence-inventory-postgres";
import { createPostgresOutbox } from "@meridian/persistence-platform-events-postgres";
import { createTenancyRepository } from "@meridian/persistence-platform-tenancy-postgres";

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
): string | null =>
	cursor === null
		? null
		: `${STOCK_BALANCE_CURSOR_PREFIX}${Buffer.from(cursor, "utf8").toString("base64url")}`;

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
	if (
		Buffer.from(decoded, "utf8").toString("base64url") !== encoded ||
		decoded.split("\u001f").length !== 3 ||
		decoded.split("\u001f").some((part) => part.length === 0)
	) {
		throw new InventoryError(
			"invalid_reference",
			"Stock balance cursor is invalid"
		);
	}
	return decoded;
};

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createInventoryRepository(client),
}));

export const inventoryService = createInventoryService({
	clock: () => new Date(),
	ids,
	references: {
		async requireLocation(input) {
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
		async requireProduct(input) {
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
	},
	unitOfWork,
});

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
