import { describe, expect, test } from "bun:test";

import {
	getTrustedOrigins,
	toExactOrigin,
	validateRedirectPath,
} from "./security";

describe("auth security helpers", () => {
	test("requires exact URL origins", () => {
		expect(toExactOrigin("https://app.example.test")).toBe(
			"https://app.example.test"
		);
		expect(() => toExactOrigin("https://app.example.test/path")).toThrow(
			"exact origin"
		);
	});

	test("rejects non-https production trusted origins", () => {
		expect(() =>
			getTrustedOrigins({
				authUrl: "https://auth.example.test",
				configuredOrigins: [],
				corsOrigin: "http://localhost:3001",
				nodeEnv: "production",
			})
		).toThrow("https");
	});

	test("accepts only same-origin redirect paths", () => {
		expect(validateRedirectPath("/dashboard?tab=home")).toBe(
			"/dashboard?tab=home"
		);
		expect(() => validateRedirectPath("https://evil.example.test")).toThrow(
			"same-origin"
		);
		expect(() => validateRedirectPath("//evil.example.test")).toThrow(
			"same-origin"
		);
	});
});
