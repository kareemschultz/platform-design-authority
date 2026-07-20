import { describe, expect, test } from "bun:test";

import {
	ADMINISTRATION_NAVIGATION,
	classifyShellFailure,
	currentNavigationItem,
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

// WS3 remediation R3b, Item 9 (POS workspace/navigation — "exactly one
// correct current item on deep routes").
describe("POS navigation (WS3 remediation R3b, Item 9)", () => {
	test("pre-fix reproduction: /operations/pos was entirely absent from OPERATIONS_NAVIGATION", () => {
		// The pre-fix list was exactly these four entries — POS was missing.
		const preFixOperationsNavigation = [
			{ href: "/operations", label: "Overview" },
			{ href: "/operations/products", label: "Products" },
			{ href: "/operations/inventory", label: "Inventory" },
			{ href: "/operations/imports", label: "Imports" },
		];
		expect(
			preFixOperationsNavigation.some((item) => item.href === "/operations/pos")
		).toBe(false);
		// Reproduces the pre-fix bug directly: with POS absent, the mobile
		// select's fallback-to-first-item logic resolves to "Overview" for a
		// POS deep route it has no entry for at all.
		const wrongFallback =
			preFixOperationsNavigation.find((item) =>
				isNavigationCurrent("/operations/pos/sales/abc123", item.href)
			) ?? preFixOperationsNavigation[0];
		expect(wrongFallback.label).toBe("Overview");
	});

	test("post-fix: OPERATIONS_NAVIGATION includes a POS entry", () => {
		expect(
			OPERATIONS_NAVIGATION.some((item) => item.href === "/operations/pos")
		).toBe(true);
	});

	test("post-fix: a deep POS route resolves POS as current in OPERATIONS_NAVIGATION, not Overview", () => {
		const current = currentNavigationItem(
			"/operations/pos/sales/abc123",
			OPERATIONS_NAVIGATION
		);
		expect(current.label).toBe("POS");
	});

	test("currentNavigationItem resolves exactly one item even when hrefs nest (Overview is a prefix of every POS section)", () => {
		const posNavigation = [
			{ href: "/operations/pos", label: "Overview" },
			{ href: "/operations/pos/registers", label: "Registers" },
			{ href: "/operations/pos/sales", label: "Sales" },
			{ href: "/operations/pos/returns", label: "Returns" },
		] as const;

		// A naive per-item independent check would match BOTH "Overview" and
		// "Sales" for this pathname (Overview's href is a literal prefix of
		// Sales's) — that is the exact bug this function fixes.
		const naiveMatches = posNavigation.filter((item) =>
			isNavigationCurrent("/operations/pos/sales/abc123", item.href)
		);
		expect(naiveMatches.length).toBeGreaterThan(1);

		const resolved = currentNavigationItem(
			"/operations/pos/sales/abc123",
			posNavigation
		);
		expect(resolved.label).toBe("Sales");
	});

	test("currentNavigationItem resolves the overview item itself as current when on the overview route", () => {
		const posNavigation = [
			{ href: "/operations/pos", label: "Overview" },
			{ href: "/operations/pos/registers", label: "Registers" },
		] as const;
		expect(currentNavigationItem("/operations/pos", posNavigation).label).toBe(
			"Overview"
		);
	});

	test("currentNavigationItem falls back to the first item when nothing matches", () => {
		const posNavigation = [
			{ href: "/operations/pos", label: "Overview" },
			{ href: "/operations/pos/registers", label: "Registers" },
		] as const;
		expect(
			currentNavigationItem("/operations/products", posNavigation).label
		).toBe("Overview");
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

	test("near-prefix routes that only share the literal string do not collide with Operations (second-review F-H-001)", () => {
		expect(sectionOverviewPath("/operations-evil")).toBe("/administration");
		expect(sectionOverviewPath("/operationsx")).toBe("/administration");
		expect(sectionOverviewPath("/operations-export")).toBe("/administration");
	});
});
