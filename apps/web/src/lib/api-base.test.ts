import { describe, expect, test } from "bun:test";

import { resolveApiBase } from "./api-base";

describe("web API topology", () => {
	test("keeps browser auth and RPC on the web origin", () => {
		expect(
			resolveApiBase({
				browserOrigin: "http://localhost:3001",
				configuredUrl: "http://127.0.0.1:3000",
				internalUrl: "http://server:3000",
			})
		).toBe("http://localhost:3001");
	});

	test("uses the private composition address during server rendering", () => {
		expect(
			resolveApiBase({
				configuredUrl: "http://localhost:3000/",
				internalUrl: "http://server:3000/",
			})
		).toBe("http://server:3000");
	});
});
