import { describe, expect, test } from "bun:test";

import { reauthenticateLinkClassName } from "./query-state";

describe("query failure controls", () => {
	test("keeps the reauthentication action at the governed minimum height", () => {
		expect(reauthenticateLinkClassName.split(" ")).toContain("min-h-10");
	});
});
