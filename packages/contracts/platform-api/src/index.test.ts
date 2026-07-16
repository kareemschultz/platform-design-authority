import { describe, expect, test } from "bun:test";

import {
	ActiveContextRequestSchema,
	CreateProductSchema,
	CurrentIdentitySchema,
	IdentifierSchema,
	PLATFORM_OPENAPI_OPERATION_METADATA,
	PositiveDecimalQuantitySchema,
	ProductSchema,
	platformApiContract,
	ReceiveStockTransferSchema,
	StockTransferSchema,
	SubmitStockCountSchema,
	UpdateProductSchema,
	WS2_EVENT_OPENAPI_OPERATION_METADATA,
	WS2_OPENAPI_OPERATION_METADATA,
	ws2CatalogInventoryApiContract,
} from "./index";

interface ContractProcedureShape {
	"~orpc": {
		meta: Record<string, unknown>;
		route: Record<string, unknown>;
	};
}

function isProcedure(value: unknown): value is ContractProcedureShape {
	return (
		typeof value === "object" &&
		value !== null &&
		"~orpc" in value &&
		typeof (value as ContractProcedureShape)["~orpc"] === "object"
	);
}

function collectProcedures(
	value: unknown,
	result: ContractProcedureShape[] = []
): ContractProcedureShape[] {
	if (isProcedure(value)) {
		result.push(value);
		return result;
	}
	if (typeof value !== "object" || value === null) {
		return result;
	}
	for (const child of Object.values(value)) {
		collectProcedures(child, result);
	}
	return result;
}

describe("WS1 platform API contract", () => {
	test("is semantically aligned with generated canonical OpenAPI metadata", () => {
		const actual = collectProcedures(platformApiContract)
			.map((procedure) => ({
				...procedure["~orpc"].meta,
				method: procedure["~orpc"].route.method,
				path: procedure["~orpc"].route.path,
			}))
			.sort((left, right) =>
				String((left as Record<string, unknown>).operationId).localeCompare(
					String((right as Record<string, unknown>).operationId)
				)
			);
		const expected = [...PLATFORM_OPENAPI_OPERATION_METADATA].sort(
			(left, right) => left.operationId.localeCompare(right.operationId)
		);

		expect(actual).toEqual(expected);
	});

	test("never accepts tenant authority in the active-context request body", () => {
		const parsed = ActiveContextRequestSchema.safeParse({
			organizationId: "organization_demo_01",
			tenantId: "tenant_attacker_01",
		});
		expect(parsed.success).toBe(true);
		if (parsed.success) {
			expect(parsed.data).not.toHaveProperty("tenantId");
		}
	});

	test("permits authentication before a Party link is provisioned", () => {
		const parsed = CurrentIdentitySchema.safeParse({
			activeContext: null,
			assuranceLevel: "aal1",
			authUserId: "auth_user_demo_01",
			memberships: [],
			partyId: null,
			sessionId: "session_demo_001",
		});
		expect(parsed.success).toBe(true);
	});

	test("rejects identifiers outside the governed opaque shape", () => {
		expect(IdentifierSchema.safeParse("short").success).toBe(false);
		expect(IdentifierSchema.safeParse("../tenant").success).toBe(false);
	});
});

describe("WS2 Catalog and Inventory API contract", () => {
	test("is semantically aligned with every generated Catalog and Inventory operation", () => {
		const actual = collectProcedures(ws2CatalogInventoryApiContract)
			.map((procedure) => ({
				...procedure["~orpc"].meta,
				method: procedure["~orpc"].route.method,
				path: procedure["~orpc"].route.path,
			}))
			.sort((left, right) =>
				String((left as Record<string, unknown>).operationId).localeCompare(
					String((right as Record<string, unknown>).operationId)
				)
			);
		const expected = [...WS2_OPENAPI_OPERATION_METADATA].sort((left, right) =>
			left.operationId.localeCompare(right.operationId)
		);

		expect(actual).toEqual(expected);
		expect(actual).toHaveLength(32);
	});

	test("requires positive directional quantities while signed adjustment quantities remain separate", () => {
		expect(PositiveDecimalQuantitySchema.safeParse("0.000001").success).toBe(
			true
		);
		expect(PositiveDecimalQuantitySchema.safeParse("0").success).toBe(false);
		expect(PositiveDecimalQuantitySchema.safeParse("0.000000").success).toBe(
			false
		);
		expect(PositiveDecimalQuantitySchema.safeParse("-1").success).toBe(false);
	});

	test("represents governed Variants with zero identifiers", () => {
		const create = {
			name: "Unidentified Product",
			variants: [{ identifiers: [], name: "Default" }],
		};
		expect(CreateProductSchema.safeParse(create).success).toBe(true);
		expect(
			UpdateProductSchema.safeParse({
				variants: [
					{
						id: "variant_catalog_01",
						identifiers: [],
						name: "Default",
					},
				],
			}).success
		).toBe(true);
		expect(
			ProductSchema.safeParse({
				id: "product_catalog_01",
				name: create.name,
				state: "Draft",
				variants: [
					{
						id: "variant_catalog_01",
						identifiers: [],
						name: "Default",
					},
				],
				version: 1,
			}).success
		).toBe(true);
	});

	test("accepts blind-count observations without accepting expected authority", () => {
		const parsed = SubmitStockCountSchema.safeParse({
			lines: [
				{
					expectedQuantity: "99",
					observedQuantity: "0",
					productId: "product_inventory_01",
					unit: "EA",
				},
			],
		});
		expect(parsed.success).toBe(false);
	});

	test("requires an explicit reason for transfer exception receipts", () => {
		const line = {
			lineId: "transfer_line_inventory_01",
			receivedQuantity: "1.5",
		};
		expect(
			ReceiveStockTransferSchema.safeParse({
				lines: [line],
				outcome: "Exception",
			}).success
		).toBe(false);
		expect(
			ReceiveStockTransferSchema.safeParse({
				exceptionReason: "One unit damaged in transit",
				lines: [line],
				outcome: "Exception",
			}).success
		).toBe(true);
	});

	test("represents stable transfer lines and cumulative custody quantities", () => {
		expect(
			StockTransferSchema.safeParse({
				destinationLocationId: "location_inventory_destination_01",
				exceptionReason: null,
				id: "transfer_inventory_01",
				lines: [
					{
						dispatchedQuantity: "5",
						exceptionQuantity: "0",
						id: "transfer_line_inventory_01",
						productId: "product_inventory_01",
						receivedQuantity: "2",
						remainingQuantity: "3",
						requestedQuantity: "5",
						unit: "EA",
					},
				],
				sourceLocationId: "location_inventory_source_01",
				state: "PartiallyReceived",
				version: 3,
			}).success
		).toBe(true);
	});
});

describe("WS2 Event Backbone API contract", () => {
	test("keeps the replay enforcement point aligned with generated OpenAPI", () => {
		const actual = collectProcedures({ replay: platformApiContract.events })
			.map((procedure) => ({
				...procedure["~orpc"].meta,
				method: procedure["~orpc"].route.method,
				path: procedure["~orpc"].route.path,
			}))
			.sort((left, right) =>
				String((left as Record<string, unknown>).operationId).localeCompare(
					String((right as Record<string, unknown>).operationId)
				)
			);
		expect(actual).toEqual(WS2_EVENT_OPENAPI_OPERATION_METADATA);
		expect(actual).toHaveLength(1);
	});
});
