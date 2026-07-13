import { describe, expect, test } from "bun:test";
import {
	andThen,
	authenticationError,
	authorizationError,
	conflictError,
	entitlementError,
	err,
	idempotencyReplayError,
	internalError,
	isErr,
	isOk,
	map,
	mapErr,
	notFoundError,
	ok,
	platformError,
	providerUncertainError,
	type Result,
	rateLimitedError,
	unwrapOr,
	unwrapOrElse,
	validationError,
} from "./result";

describe("ok/err constructors", () => {
	test("ok() produces a discriminated success", () => {
		const result = ok(42);
		expect(result.ok).toBe(true);
		expect(result).toEqual({ ok: true, value: 42 });
	});

	test("err() produces a discriminated failure", () => {
		const result = err("boom");
		expect(result.ok).toBe(false);
		expect(result).toEqual({ error: "boom", ok: false });
	});
});

describe("isOk / isErr", () => {
	test("narrow the union correctly", () => {
		const success = ok(1);
		const failure = err("nope");
		expect(isOk(success)).toBe(true);
		expect(isErr(success)).toBe(false);
		expect(isOk(failure)).toBe(false);
		expect(isErr(failure)).toBe(true);
	});
});

describe("map", () => {
	test("transforms the success value", () => {
		const result = map(ok(2), (n) => n * 10);
		expect(result).toEqual({ ok: true, value: 20 });
	});

	test("passes through an error untouched", () => {
		const failure: Result<number, string> = err("boom");
		const result = map(failure, (n: number) => n * 10);
		expect(result).toEqual({ error: "boom", ok: false });
	});
});

describe("mapErr", () => {
	test("transforms the error value", () => {
		const result = mapErr(err("boom"), (e) => `wrapped:${e}`);
		expect(result).toEqual({ error: "wrapped:boom", ok: false });
	});

	test("passes through a success untouched", () => {
		const result = mapErr(ok(5), (e: string) => `wrapped:${e}`);
		expect(result).toEqual({ ok: true, value: 5 });
	});
});

describe("andThen", () => {
	test("chains a Result-returning function on success", () => {
		const parseEven = (n: number) => (n % 2 === 0 ? ok(n / 2) : err("odd"));
		const result = andThen(ok(4), parseEven);
		expect(result).toEqual({ ok: true, value: 2 });
	});

	test("short-circuits on the first error", () => {
		const failure: Result<number, string> = err("already failed");
		const shouldNotRun = (n: number) => {
			throw new Error(`should not run with ${n}`);
		};
		const result = andThen(failure, shouldNotRun);
		expect(result).toEqual({ error: "already failed", ok: false });
	});
});

describe("unwrapOr / unwrapOrElse", () => {
	test("unwrapOr returns the value on success", () => {
		expect(unwrapOr(ok(9), 0)).toBe(9);
	});

	test("unwrapOr returns the fallback on error", () => {
		expect(unwrapOr(err("boom"), 0)).toBe(0);
	});

	test("unwrapOrElse computes the fallback from the error", () => {
		expect(unwrapOrElse(err("boom"), (e) => e.length)).toBe(4);
	});

	test("unwrapOrElse returns the value on success without invoking the fallback", () => {
		const fallback = () => {
			throw new Error("should not be called");
		};
		expect(unwrapOrElse(ok(9), fallback)).toBe(9);
	});
});

describe("PlatformError taxonomy", () => {
	test("rate-limited defaults to retriable: true", () => {
		expect(rateLimitedError("slow down").retriable).toBe(true);
	});

	test("provider-uncertain defaults to retriable: true", () => {
		expect(providerUncertainError("provider timed out").retriable).toBe(true);
	});

	test("validation defaults to retriable: false", () => {
		expect(validationError("bad input").retriable).toBe(false);
	});

	test("authorization, authentication, not-found, conflict, idempotency-replay, entitlement, internal all default to non-retriable", () => {
		expect(authorizationError("no").retriable).toBe(false);
		expect(authenticationError("no").retriable).toBe(false);
		expect(notFoundError("no").retriable).toBe(false);
		expect(conflictError("no").retriable).toBe(false);
		expect(idempotencyReplayError("no").retriable).toBe(false);
		expect(entitlementError("no").retriable).toBe(false);
		expect(internalError("no").retriable).toBe(false);
	});

	test("an explicit retriable option overrides the per-code default", () => {
		expect(validationError("bad", { retriable: true }).retriable).toBe(true);
		expect(rateLimitedError("slow", { retriable: false }).retriable).toBe(
			false
		);
	});

	test("carries the requested code and message", () => {
		const e = platformError("conflict", "duplicate booking");
		expect(e.code).toBe("conflict");
		expect(e.message).toBe("duplicate booking");
	});

	test("details are attached only when provided", () => {
		const withDetails = validationError("bad", { details: { field: "x" } });
		expect(withDetails.details).toEqual({ field: "x" });

		const withoutDetails = validationError("bad");
		expect(withoutDetails.details).toBeUndefined();
	});

	test("every constructor stamps the matching code", () => {
		expect(authenticationError("x").code).toBe("authentication");
		expect(authorizationError("x").code).toBe("authorization");
		expect(notFoundError("x").code).toBe("not-found");
		expect(conflictError("x").code).toBe("conflict");
		expect(idempotencyReplayError("x").code).toBe("idempotency-replay");
		expect(entitlementError("x").code).toBe("entitlement");
		expect(rateLimitedError("x").code).toBe("rate-limited");
		expect(providerUncertainError("x").code).toBe("provider-uncertain");
		expect(internalError("x").code).toBe("internal");
	});
});
