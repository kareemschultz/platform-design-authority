import { describe, expect, test } from "bun:test";

import {
	ActiveContextRequestSchema,
	CurrentIdentitySchema,
	IdentifierSchema,
	platformApiContract,
	WS1_OPENAPI_OPERATION_METADATA,
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
		const expected = [...WS1_OPENAPI_OPERATION_METADATA].sort((left, right) =>
			left.operationId.localeCompare(right.operationId)
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
		expect(actual).toHaveLength(24);
	});
});
