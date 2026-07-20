import { beforeEach, describe, expect, test } from "bun:test";

import {
	dedupedToastError,
	resetToastDedupeCacheForTests,
	sanitizeErrorMessage,
} from "./toast";

// WS3 remediation R3b, Item 11 (status/error discipline — sanitize raw
// errors, avoid raw duplicate toasts).
describe("sanitizeErrorMessage", () => {
	test("pre-fix reproduction: sign-in-form.tsx passed raw provider text straight through with no bound and no fallback for empty text", () => {
		// The pre-fix call site was: `toast.error(error.error.message ||
		// error.error.statusText)` — if BOTH were empty strings, `toast.error`
		// received an empty string; if either was arbitrarily long internal
		// diagnostic text, it went straight to the toast unbounded.
		const preFixBehavior = (message: string, statusText: string) =>
			message || statusText;
		expect(preFixBehavior("", "")).toBe("");
		const longRaw = "x".repeat(5000);
		expect(preFixBehavior(longRaw, "")).toBe(longRaw);
	});

	test("post-fix: empty/blank raw text falls back to the governed message", () => {
		expect(sanitizeErrorMessage("", "Sign in failed.")).toBe("Sign in failed.");
		expect(sanitizeErrorMessage("   ", "Sign in failed.")).toBe(
			"Sign in failed."
		);
		expect(sanitizeErrorMessage(null, "Sign in failed.")).toBe(
			"Sign in failed."
		);
		expect(sanitizeErrorMessage(undefined, "Sign in failed.")).toBe(
			"Sign in failed."
		);
	});

	test("post-fix: an ordinary, well-formed message passes through trimmed", () => {
		expect(sanitizeErrorMessage("  Invalid credentials  ", "fallback")).toBe(
			"Invalid credentials"
		);
	});

	test("post-fix: an unbounded raw message is truncated to a fixed length", () => {
		const longRaw = "x".repeat(5000);
		const result = sanitizeErrorMessage(longRaw, "fallback");
		expect(result.length).toBeLessThanOrEqual(200);
		expect(result.endsWith("…")).toBe(true);
	});
});

describe("dedupedToastError", () => {
	beforeEach(() => {
		resetToastDedupeCacheForTests();
	});

	test("pre-fix reproduction: nothing prevented the same message from firing twice in immediate succession", () => {
		const shown: string[] = [];
		const naiveShow = (message: string) => shown.push(message);
		naiveShow("No matching product for barcode 123");
		naiveShow("No matching product for barcode 123");
		expect(shown).toHaveLength(2);
	});

	test("post-fix: an identical message within the dedupe window fires only once", () => {
		const shown: string[] = [];
		let clock = 1000;
		const now = () => clock;
		const showToast = (message: string) => shown.push(message);

		const first = dedupedToastError(
			"No matching product for barcode 123",
			showToast,
			1500,
			now
		);
		clock += 200;
		const second = dedupedToastError(
			"No matching product for barcode 123",
			showToast,
			1500,
			now
		);

		expect(first).toBe(true);
		expect(second).toBe(false);
		expect(shown).toEqual(["No matching product for barcode 123"]);
	});

	test("post-fix: the same message fires again once the dedupe window has elapsed", () => {
		const shown: string[] = [];
		let clock = 1000;
		const now = () => clock;
		const showToast = (message: string) => shown.push(message);

		dedupedToastError(
			"Product lookup failed. Scan again.",
			showToast,
			1500,
			now
		);
		clock += 2000;
		const secondFired = dedupedToastError(
			"Product lookup failed. Scan again.",
			showToast,
			1500,
			now
		);

		expect(secondFired).toBe(true);
		expect(shown).toHaveLength(2);
	});

	test("post-fix: two DIFFERENT messages are never deduplicated against each other", () => {
		const shown: string[] = [];
		const clock = 1000;
		const now = () => clock;
		const showToast = (message: string) => shown.push(message);

		dedupedToastError(
			"No matching product for barcode 123",
			showToast,
			1500,
			now
		);
		dedupedToastError(
			"No matching product for barcode 456",
			showToast,
			1500,
			now
		);

		expect(shown).toEqual([
			"No matching product for barcode 123",
			"No matching product for barcode 456",
		]);
	});
});
