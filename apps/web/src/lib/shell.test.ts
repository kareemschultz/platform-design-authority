import { describe, expect, test } from "bun:test";

import {
	ADMINISTRATION_NAVIGATION,
	classifyShellFailure,
	isNavigationCurrent,
	safeReturnPath,
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
	});

	test("marks only the matching administration branch as current", () => {
		expect(
			isNavigationCurrent("/administration/roles", "/administration/roles")
		).toBe(true);
		expect(
			isNavigationCurrent("/administration/users", "/administration")
		).toBe(false);
	});
});
