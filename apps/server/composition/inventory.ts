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

const unitOfWork = createPostgresUnitOfWork(databasePool, (client) => ({
	events: createPostgresOutbox(client),
	repository: createInventoryRepository(client),
}));

export const inventoryService = createInventoryService({
	clock: () => new Date(),
	ids,
	references: {
		async requireLocation(input) {
			const page = await createTenancyRepository(databasePool).listLocations(
				input.tenantId,
				input.organizationId,
				{ limit: 500 }
			);
			if (!page.items.some((location) => location.id === input.locationId)) {
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
	listInventoryAdjustments: async (
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
		const result = await inventoryApplication.listAdjustments({
			...input,
			page,
		});
		return {
			...result,
			items: result.items.filter(
				(record) =>
					(!locationId || record.locationId === locationId) &&
					(!state || record.state === state)
			),
		};
	},
	listStockBalances: async (input: {
		authUserId: string;
		contextId: string;
		query: { locationId: string; productId?: string };
		sessionId: string;
	}) => {
		const page = await inventoryApplication.listBalances({
			authUserId: input.authUserId,
			contextId: input.contextId,
			filters: {
				locationId: input.query.locationId,
				productId: input.query.productId,
			},
			page: { limit: 5000 },
			sessionId: input.sessionId,
		});
		return page.items;
	},
	listStockCounts: async (
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
		const result = await inventoryApplication.listCounts({ ...input, page });
		return {
			...result,
			items: result.items.filter(
				(record) =>
					(!locationId || record.locationId === locationId) &&
					(!state || record.state === state)
			),
		};
	},
	listStockTransfers: async (
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
		const result = await inventoryApplication.listTransfers({ ...input, page });
		return {
			...result,
			items: result.items.filter(
				(record) =>
					(!locationId ||
						record.sourceLocationId === locationId ||
						record.destinationLocationId === locationId) &&
					(!state || record.state === state)
			),
		};
	},
	receiveStockTransfer: inventoryApplication.receiveTransfer,
	reverseInventoryAdjustment: inventoryApplication.reverseAdjustment,
	submitStockCount: inventoryApplication.submitCount,
};
