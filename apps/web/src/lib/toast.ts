/**
 * WS3 remediation R3b, Item 11 (status/error discipline — "sanitize
 * foreground/background errors and avoid raw duplicate toasts").
 *
 * Two concrete gaps this closes:
 *
 * 1. Raw error text: `sign-in-form.tsx` / `sign-up-form.tsx` passed
 *    `error.error.message || error.error.statusText` straight into
 *    `toast.error(...)` — an arbitrary, unbounded, provider-controlled
 *    string with no governed fallback, unlike every POS mutation surface
 *    in this app (which routes through `mutationFailurePresentation` /
 *    `MutationError`'s curated copy). `sanitizeErrorMessage` bounds
 *    length and guarantees a non-empty, governed fallback instead of
 *    ever showing blank/undefined or an unbounded raw string.
 *
 * 2. Duplicate toasts: nothing in this app previously prevented the SAME
 *    error message from stacking multiple identical toasts in a short
 *    window (e.g. a rapid double `Enter` on an unmatched barcode, or a
 *    slow network causing two failed submits before a button's disabled
 *    state catches up). `dedupedToastError` suppresses an identical
 *    message fired again within `windowMs` of the last one, so the user
 *    sees ONE toast per distinct failure instead of a stack of the same
 *    text.
 */

const MAX_TOAST_MESSAGE_LENGTH = 200;

/** Bounds and guarantees non-empty error text for user-facing display.
 * Never returns raw text longer than `MAX_TOAST_MESSAGE_LENGTH`, and
 * never returns an empty/whitespace-only string — falls back to the
 * caller-supplied governed message instead. */
export function sanitizeErrorMessage(
	raw: string | null | undefined,
	fallback: string
): string {
	const trimmed = (raw ?? "").trim();
	if (!trimmed) {
		return fallback;
	}
	if (trimmed.length > MAX_TOAST_MESSAGE_LENGTH) {
		return `${trimmed.slice(0, MAX_TOAST_MESSAGE_LENGTH - 1)}…`;
	}
	return trimmed;
}

const DEFAULT_DEDUPE_WINDOW_MS = 1500;
const recentToastMessages = new Map<string, number>();

/** Fires `showToast(message)` unless the EXACT same message was already
 * shown within `windowMs` (default 1.5s) — a real, testable de-duplication
 * guard, not a visual coincidence. `now` is injectable so this is
 * deterministically testable without real timers. */
export function dedupedToastError(
	message: string,
	showToast: (message: string) => void,
	windowMs: number = DEFAULT_DEDUPE_WINDOW_MS,
	now: () => number = Date.now
): boolean {
	const currentTime = now();
	const lastShownAt = recentToastMessages.get(message);
	if (lastShownAt !== undefined && currentTime - lastShownAt < windowMs) {
		return false;
	}
	recentToastMessages.set(message, currentTime);
	showToast(message);
	return true;
}

/** Test-only reset of the module-level dedupe cache so tests do not leak
 * state into one another. */
export function resetToastDedupeCacheForTests(): void {
	recentToastMessages.clear();
}
