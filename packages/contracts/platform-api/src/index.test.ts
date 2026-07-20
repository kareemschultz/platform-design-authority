import { describe, expect, test } from "bun:test";

import {
	ActiveContextRequestSchema,
	appApiContract,
	CatalogSkuLookupSchema,
	CreateCashMovementRequestSchema,
	CreateProductSchema,
	CurrentIdentitySchema,
	IdentifierSchema,
	PagedStockBalancesSchema,
	PLATFORM_OPENAPI_OPERATION_METADATA,
	PositiveDecimalQuantitySchema,
	ProductSchema,
	platformApiContract,
	ReceiveStockTransferSchema,
	SaveStockCountDraftLinesSchema,
	StockTransferSchema,
	SubmitStockCountSchema,
	UpdateProductSchema,
	WS2_EVENT_OPENAPI_OPERATION_METADATA,
	WS2_OPENAPI_OPERATION_METADATA,
	WS3_OPENAPI_OPERATION_METADATA,
	ws2CatalogInventoryApiContract,
	ws3PosApiContract,
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
	test("rejects empty exact SKU filters and canonicalizes surrounding whitespace", () => {
		expect(CatalogSkuLookupSchema.safeParse("   ").success).toBe(false);
		expect(CatalogSkuLookupSchema.safeParse(`${" ".repeat(64)}A`).success).toBe(
			false
		);
		expect(CatalogSkuLookupSchema.parse(" 12-34 ")).toBe("12-34");
	});

	test("is exposed through the transport-neutral application client contract", () => {
		expect(appApiContract.catalog).toBe(ws2CatalogInventoryApiContract.catalog);
		expect(appApiContract.inventory).toBe(
			ws2CatalogInventoryApiContract.inventory
		);
	});

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
		expect(actual).toHaveLength(41);
	});

	test("keeps seam-only Reservation, offline movement, and raw ledger commands out of public transport", () => {
		const exposed = WS2_OPENAPI_OPERATION_METADATA.map((operation) =>
			`${operation.operationId} ${operation.path}`.toLowerCase()
		);
		expect(exposed.some((operation) => operation.includes("reservation"))).toBe(
			false
		);
		expect(exposed.some((operation) => operation.includes("offline"))).toBe(
			false
		);
		expect(
			exposed.some((operation) => operation.includes("stock-ledger"))
		).toBe(false);
		expect(exposed.some((operation) => operation.includes("balances"))).toBe(
			true
		);
		expect(exposed.some((operation) => operation.includes("adjustment"))).toBe(
			true
		);
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
				archivedAt: null,
				archiveReason: null,
				createdAt: "2026-07-16T12:00:00.000Z",
				id: "product_catalog_01",
				name: create.name,
				state: "Draft",
				updatedAt: "2026-07-16T12:00:00.000Z",
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
		expect(
			SaveStockCountDraftLinesSchema.safeParse({ lines: [] }).success
		).toBe(true);
		expect(
			SaveStockCountDraftLinesSchema.safeParse({
				lines: [
					{
						expectedQuantity: "99",
						observedQuantity: "1",
						productId: "product_inventory_01",
						unit: "EA",
					},
				],
			}).success
		).toBe(false);
	});

	test("publishes paged balances with explicit projection evidence", () => {
		const parsed = PagedStockBalancesSchema.safeParse({
			items: [
				{
					asOf: "2026-07-16T12:00:00.000Z",
					available: "8",
					locationId: "location_inventory_01",
					onHand: "10",
					productId: "product_inventory_01",
					reconciled: true,
					reconciliationState: "Current",
					reserved: "2",
					source: "InventoryLedgerProjection",
					unit: "EA",
				},
			],
			nextCursor: "sb1_cHJvamVjdGlvbi1jdXJzb3I",
		});
		expect(parsed.success).toBe(true);
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
				createdAt: "2026-07-16T12:00:00.000Z",
				createdByUserId: "user_inventory_creator_01",
				destinationLocationId: "location_inventory_destination_01",
				dispatchedAt: "2026-07-16T12:05:00.000Z",
				dispatchedByUserId: "user_inventory_dispatcher_01",
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
				receivedAt: "2026-07-16T12:10:00.000Z",
				receivedByUserId: "user_inventory_receiver_01",
				sourceLocationId: "location_inventory_source_01",
				state: "PartiallyReceived",
				updatedAt: "2026-07-16T12:10:00.000Z",
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

const PR3_PERMISSION_NAMESPACE_PATTERN = /^commerce\.(receipt|refund|return)\./;

describe("WS3 POS Cash Workflow API contract", () => {
	test("is semantically aligned with every generated commerce.*/platform.export.* operation implemented through PR4", () => {
		const actual = collectProcedures(ws3PosApiContract)
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
		const expected = [...WS3_OPENAPI_OPERATION_METADATA].sort((left, right) =>
			left.operationId.localeCompare(right.operationId)
		);

		expect(actual).toEqual(expected);
		// WS3 remediation R3, Findings I and J: +7 pre-commit consequence-
		// preview / receipt-to-return-lookup reads (getReturnsByReturnId,
		// getRefundsByRefundId, getDepositsByDepositId,
		// getRegisterSessionsBySessionId, getCashVariancesByVarianceId,
		// getRegistersByRegisterIdReceiptsByReceiptNumber,
		// getRegistersByRegisterIdReceiptsByReceiptNumberSale), 21 -> 28.
		// WS3 remediation R3b, Item 7: +5 server-backed pending-approval/
		// confirmation queue reads (listPriceOverrides, listReturns,
		// listRefunds, listDeposits, listCashVariances), 28 -> 33.
		expect(actual).toHaveLength(33);
	});

	test("every PR3 operation declares a commerce.return/refund/receipt permission, never a bare authenticated-session read", () => {
		const pr3OperationIds = [
			"createReturn",
			"postReturnsByReturnIdApprove",
			"postRefunds",
			"postRefundsByRefundIdApprove",
			"postReceiptsByReceiptIdReissue",
			"postReceiptsByReceiptIdVoid",
		];
		const pr3Operations = WS3_OPENAPI_OPERATION_METADATA.filter((operation) =>
			pr3OperationIds.includes(operation.operationId)
		);
		expect(pr3Operations).toHaveLength(pr3OperationIds.length);
		for (const operation of pr3Operations) {
			expect("permission" in operation).toBe(true);
			expect((operation as { permission: string }).permission).toMatch(
				PR3_PERMISSION_NAMESPACE_PATTERN
			);
		}
	});

	test("WS3 remediation R1 cycle 2 (advisor-flagged load-bearing invariant): the manual cash-movement command's reasonCode CANNOT be 'Refund' or 'SafeDrop' — closes the load-bearing assumption behind queryFinanceHandoffSourceData's Refund-vs-Void classification (packages/persistence/pos-postgres/src/index.ts), which relies on 'approveRefund' and 'voidReceipt' being the ONLY two domain-internal producers of a reasonCode:'Refund' cash movement. If a caller could submit reasonCode:'Refund' through this manual endpoint with an arbitrary referenceId, that movement would be misclassified sourceKind:'Void' by the LEFT JOIN's not-a-real-refund fallback.", () => {
		const rejectedRefund = CreateCashMovementRequestSchema.safeParse({
			amount: { amountMinor: 1000, currency: "GYD" },
			direction: "PaidOut",
			reasonCode: "Refund",
			referenceId: "arbitrary_not_a_real_refund_id",
		});
		expect(rejectedRefund.success).toBe(false);

		const rejectedSafeDrop = CreateCashMovementRequestSchema.safeParse({
			amount: { amountMinor: 1000, currency: "GYD" },
			direction: "PaidOut",
			reasonCode: "SafeDrop",
		});
		expect(rejectedSafeDrop.success).toBe(false);

		// The only three reasonCode values the manual command accepts —
		// SafeDrop is fixed server-side by the dedicated safe-drops
		// endpoint (apps/server/composition/pos.ts), never caller-chosen.
		const acceptedPaidIn = CreateCashMovementRequestSchema.safeParse({
			amount: { amountMinor: 1000, currency: "GYD" },
			direction: "PaidIn",
			reasonCode: "PaidIn",
		});
		expect(acceptedPaidIn.success).toBe(true);
		const acceptedOther = CreateCashMovementRequestSchema.safeParse({
			amount: { amountMinor: 1000, currency: "GYD" },
			direction: "PaidOut",
			reasonCode: "Other",
		});
		expect(acceptedOther.success).toBe(true);
	});

	test("realizes maker/checker self-approval separation as an application-layer rule, not a distinct deny permission (frozen control plan §6)", () => {
		const operationIds = WS3_OPENAPI_OPERATION_METADATA.map(
			(operation) => operation.operationId
		);
		expect(operationIds).toContain("createReturn");
		expect(operationIds).toContain("postReturnsByReturnIdApprove");
		expect(operationIds).not.toContain("commerce.return.reject");
		expect(operationIds).toContain("postRefunds");
		expect(operationIds).toContain("postRefundsByRefundIdApprove");
		expect(operationIds).not.toContain("commerce.refund.reject");
	});

	test("realizes exchange composition and gift receipts without inventing a dedicated permission or endpoint (frozen control plan §5, §6.5)", () => {
		const paths = WS3_OPENAPI_OPERATION_METADATA.map(
			(operation) => operation.path
		);
		expect(paths.some((path) => path.includes("exchange"))).toBe(false);
		expect(paths.some((path) => path.includes("gift"))).toBe(false);
	});

	test("every PR4 deposit/export operation declares its exact frozen permission, never a bare authenticated-session read", () => {
		const expectedPermissions: Record<string, string> = {
			createAccountantHandoffExport: "platform.export.create",
			createDeposit: "commerce.deposit.create",
			getExportsByExportId: "platform.export.read",
			postDepositsByDepositIdConfirm: "commerce.deposit.confirm",
		};
		const pr4Operations = WS3_OPENAPI_OPERATION_METADATA.filter((operation) =>
			Object.keys(expectedPermissions).includes(operation.operationId)
		);
		expect(pr4Operations).toHaveLength(4);
		for (const operation of pr4Operations) {
			expect("permission" in operation).toBe(true);
			const expected: string | undefined =
				expectedPermissions[operation.operationId];
			expect(expected).toBeDefined();
			expect((operation as { permission: string }).permission).toBe(
				expected as string
			);
		}
	});

	test("realizes the deposit maker/checker pair as create/confirm (matching the registered permission pair exactly), self-approval separation an application-layer rule (frozen control plan §6.6)", () => {
		const operationIds = WS3_OPENAPI_OPERATION_METADATA.map(
			(operation) => operation.operationId
		);
		expect(operationIds).toContain("createDeposit");
		expect(operationIds).toContain("postDepositsByDepositIdConfirm");
		expect(operationIds).not.toContain("commerce.deposit.reject");
	});
});
