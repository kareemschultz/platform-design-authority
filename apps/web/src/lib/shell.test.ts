import { describe, expect, test } from "bun:test";

import {
	ADMINISTRATION_NAVIGATION,
	classifyShellFailure,
	isNavigationCurrent,
	OPERATIONS_NAVIGATION,
	safeReturnPath,
	sectionOverviewPath,
} from "./shell";

describe("application shell", () => {
	test("keeps administration at two persistent navigation levels", () => {
		expect(
			ADMINISTRATION_NAVIGATION.every(
				(item) => item.href.split("/").filter(Boolean).length <= 2
			)
		).toBe(true);
	});

	test("does not accept an external return target", () => {
		expect(safeReturnPath("//attacker.example/path")).toBe("/administration");
		expect(safeReturnPath("https://attacker.example/path")).toBe(
			"/administration"
		);
		expect(safeReturnPath("/administration/sessions")).toBe(
			"/administration/sessions"
		);
	});

	test("distinguishes authority and availability failures", () => {
		expect(
			classifyShellFailure({
				code: "FORBIDDEN",
				data: { code: "authorization" },
			})
		).toBe("permission-denied");
		expect(classifyShellFailure({ data: { code: "entitlement" } })).toBe(
			"entitlement-unavailable"
		);
		expect(classifyShellFailure({ data: { nextAction: "step_up" } })).toBe(
			"step-up-required"
		);
		expect(classifyShellFailure(new Error("network"), false)).toBe("offline");
		expect(classifyShellFailure(null)).toBe("unavailable");
	});

	test("marks only the matching administration branch as current", () => {
		expect(
			isNavigationCurrent("/administration/roles", "/administration/roles")
		).toBe(true);
		expect(
			isNavigationCurrent("/administration/users", "/administration")
		).toBe(false);
		expect(isNavigationCurrent("/operations/products", "/operations")).toBe(
			false
		);
		expect(
			isNavigationCurrent("/operations/products/new", "/operations/products")
		).toBe(true);
	});

	test("does not render dead navigation for seam-only Inventory capabilities", () => {
		const navigation = OPERATIONS_NAVIGATION.map((item) =>
			`${item.label} ${item.href}`.toLowerCase()
		);
		expect(navigation.some((item) => item.includes("reservation"))).toBe(false);
		expect(navigation.some((item) => item.includes("offline"))).toBe(false);
		expect(navigation.some((item) => item.includes("stock-ledger"))).toBe(
			false
		);
		expect(classifyShellFailure(new Error("offline"), false)).toBe("offline");
	});
});

describe("sectionOverviewPath", () => {
	test("Operations routes recover into the Operations overview", () => {
		expect(sectionOverviewPath("/operations/inventory/counts")).toBe(
			"/operations"
		);
		expect(sectionOverviewPath("/operations")).toBe("/operations");
	});

	test("non-Operations and unknown routes recover into Administration", () => {
		expect(sectionOverviewPath("/administration/users")).toBe(
			"/administration"
		);
		expect(sectionOverviewPath(null)).toBe("/administration");
		expect(sectionOverviewPath(undefined)).toBe("/administration");
	});
});
