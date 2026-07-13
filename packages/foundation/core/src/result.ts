/**
 * Result and platform error taxonomy.
 *
 * Foundation is dependency-light per `ARCHITECTURE_DEPENDENCY_RULES.md` §Foundation:
 * "Contains dependency-light value objects and utilities such as identifiers,
 * money, quantity, time, result types, validation primitives, and telemetry
 * contracts." This module supplies the `Result` and `PlatformError` value
 * objects every other Foundation module (and every higher family) uses instead
 * of throwing for expected failure paths.
 */

/**
 * A successful result carrying `value`.
 */
export interface Ok<T> {
	ok: true;
	value: T;
}

/**
 * A failed result carrying `error`.
 */
export interface Err<E> {
	error: E;
	ok: false;
}

/**
 * Discriminated union representing either success (`ok: true`) or failure
 * (`ok: false`). Foundation code returns `Result` instead of throwing for any
 * failure that is part of a function's normal contract (validation, currency
 * mismatch, parse failure, etc.) so callers are forced to branch on the
 * discriminant rather than relying on implicit exception propagation.
 */
export type Result<T, E> = Ok<T> | Err<E>;

/**
 * Construct a successful {@link Result}.
 */
export function ok<T>(value: T): Ok<T> {
	return { ok: true, value };
}

/**
 * Construct a failed {@link Result}.
 */
export function err<E>(error: E): Err<E> {
	return { error, ok: false };
}

/**
 * Type guard narrowing a {@link Result} to its {@link Ok} branch.
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
	return result.ok;
}

/**
 * Type guard narrowing a {@link Result} to its {@link Err} branch.
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
	return !result.ok;
}

/**
 * Transform the success value of a {@link Result}, passing through any error
 * untouched.
 */
export function map<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => U
): Result<U, E> {
	return result.ok ? ok(fn(result.value)) : result;
}

/**
 * Transform the error value of a {@link Result}, passing through any success
 * untouched.
 */
export function mapErr<T, E, F>(
	result: Result<T, E>,
	fn: (error: E) => F
): Result<T, F> {
	return result.ok ? result : err(fn(result.error));
}

/**
 * Chain a {@link Result}-returning function onto a successful result
 * (a.k.a. `flatMap`/`bind`). Short-circuits on the first error.
 */
export function andThen<T, U, E>(
	result: Result<T, E>,
	fn: (value: T) => Result<U, E>
): Result<U, E> {
	return result.ok ? fn(result.value) : result;
}

/**
 * Extract the success value, or `fallback` when the result is an error.
 */
export function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
	return result.ok ? result.value : fallback;
}

/**
 * Extract the success value, or compute a fallback from the error.
 */
export function unwrapOrElse<T, E>(
	result: Result<T, E>,
	fallback: (error: E) => T
): T {
	return result.ok ? result.value : fallback(result.error);
}

/**
 * Closed set of platform error codes. Every higher family (platform, engines,
 * domains, applications) is expected to raise failures using one of these
 * codes so cross-cutting concerns (HTTP status mapping, retry policy,
 * observability) can be driven off a single, stable taxonomy instead of
 * ad hoc string codes invented per call site.
 */
export type PlatformErrorCode =
	| "validation"
	| "authorization"
	| "authentication"
	| "not-found"
	| "conflict"
	| "idempotency-replay"
	| "entitlement"
	| "rate-limited"
	| "provider-uncertain"
	| "internal";

/**
 * Codes that default to `retriable: true` when a caller does not specify the
 * flag explicitly. `rate-limited` (the caller should back off and retry) and
 * `provider-uncertain` (an external call's outcome could not be confirmed,
 * so retrying — typically guarded by idempotency — is the safer default) are
 * the only codes with this default; every other code defaults to
 * non-retriable because retrying a validation, authorization, or not-found
 * failure without changing the request cannot succeed.
 */
const DEFAULT_RETRIABLE_CODES: ReadonlySet<PlatformErrorCode> = new Set([
	"rate-limited",
	"provider-uncertain",
]);

/**
 * The platform-wide error shape. `code` is drawn from {@link PlatformErrorCode},
 * `message` is a human-readable (not necessarily end-user-facing) summary,
 * `details` carries optional structured context, and `retriable` tells a
 * caller whether re-issuing the same request could plausibly succeed without
 * any change on the caller's part.
 */
export interface PlatformError {
	readonly code: PlatformErrorCode;
	readonly details?: Readonly<Record<string, unknown>>;
	readonly message: string;
	readonly retriable: boolean;
}

/**
 * Options accepted by every {@link PlatformError} constructor. `retriable`
 * overrides the per-code default from {@link DEFAULT_RETRIABLE_CODES}.
 */
export interface PlatformErrorOptions {
	details?: Readonly<Record<string, unknown>>;
	retriable?: boolean;
}

/**
 * Construct a {@link PlatformError} for `code`, applying the default
 * `retriable` flag unless `options.retriable` overrides it.
 */
export function platformError(
	code: PlatformErrorCode,
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return {
		code,
		message,
		...(options?.details === undefined ? {} : { details: options.details }),
		retriable: options?.retriable ?? DEFAULT_RETRIABLE_CODES.has(code),
	};
}

/** Construct a `validation` {@link PlatformError}. Never retriable by default. */
export function validationError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("validation", message, options);
}

/** Construct an `authorization` {@link PlatformError}. Never retriable by default. */
export function authorizationError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("authorization", message, options);
}

/** Construct an `authentication` {@link PlatformError}. Never retriable by default. */
export function authenticationError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("authentication", message, options);
}

/** Construct a `not-found` {@link PlatformError}. Never retriable by default. */
export function notFoundError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("not-found", message, options);
}

/** Construct a `conflict` {@link PlatformError}. Never retriable by default. */
export function conflictError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("conflict", message, options);
}

/** Construct an `idempotency-replay` {@link PlatformError}. Never retriable by default. */
export function idempotencyReplayError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("idempotency-replay", message, options);
}

/** Construct an `entitlement` {@link PlatformError}. Never retriable by default. */
export function entitlementError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("entitlement", message, options);
}

/** Construct a `rate-limited` {@link PlatformError}. Retriable by default. */
export function rateLimitedError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("rate-limited", message, options);
}

/** Construct a `provider-uncertain` {@link PlatformError}. Retriable by default. */
export function providerUncertainError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("provider-uncertain", message, options);
}

/** Construct an `internal` {@link PlatformError}. Never retriable by default. */
export function internalError(
	message: string,
	options?: PlatformErrorOptions
): PlatformError {
	return platformError("internal", message, options);
}
