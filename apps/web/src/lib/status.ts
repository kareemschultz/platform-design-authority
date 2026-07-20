/**
 * WS3 remediation R3b, Item 11 (status/error discipline).
 *
 * Before this fix, TWO independent, DIVERGENT regex-based classifiers
 * decided a status badge's color:
 *   - `operations-shared.tsx`'s `StateBadge`:
 *     POSITIVE = /active|posted|approved|completed|reconciled|received/u
 *     NEGATIVE = /failed|rejected|mismatch|reversed|exception|cancelled/u
 *   - `administration-pages.tsx`'s local `stateBadge`:
 *     POSITIVE = /active|success|trial/i
 *     NEGATIVE = /suspend|revoke|expired|failure|denied/i
 *
 * Both are substring matches against `state.toLowerCase()`, not exhaustive
 * maps over the actual known enum values in
 * `packages/contracts/platform-api/src/schemas.ts` — so a state that
 * merely CONTAINS a positive substring is colored positive regardless of
 * its real meaning. Concretely: "Inactive".toLowerCase() = "inactive",
 * which contains "active" — `RolesPage` and `PartiesPage`-style surfaces
 * rendering `Role.state` ("Active" | "Inactive") or `Party.state`
 * ("Active" | "Inactive" | "Merged" | "Restricted") colored a genuinely
 * INACTIVE role or party with the SAME "secondary" (success-styled)
 * variant as an active one — the exact bug this item names ("never mark
 * Inactive positive").
 *
 * This module replaces both regexes with ONE exhaustive, hand-classified
 * map over every distinct state/severity/reconciliation token that
 * appears in a `state`-shaped field anywhere in the platform-api contract
 * (cross-checked directly against `schemas.ts`, not guessed). An
 * unrecognized token is never silently guessed at — it renders the
 * neutral `outline` variant (never a false positive OR a false negative)
 * and logs loudly via `console.error` so an unmapped state introduced by
 * a future schema change is caught during development, not left to color
 * itself by accident.
 */

export type StatusCategory = "negative" | "neutral" | "positive";

/**
 * Every distinct token above was read directly out of a `state:`,
 * `severity:`, `reconciliationState:`, or `authenticationState:` field in
 * `packages/contracts/platform-api/src/schemas.ts`. Classification
 * rationale for the non-obvious ones:
 *   - "Inactive" is NEUTRAL, not positive or negative: a deactivated Role
 *     or Party is an intentional administrative state, not an error.
 *   - "Suspended" is NEGATIVE: unlike "Inactive", every entity that uses
 *     it (Organization, Location, Tenant, Entitlement, membership
 *     authentication) uses it to mean an enforced restriction, usually
 *     punitive or compliance-driven — a real attention-worthy state.
 *   - "Grace" (Entitlement) is NEUTRAL, not positive: the capability
 *     still works, but the state exists specifically to flag a lapsed
 *     renewal that needs attention before it becomes "Expired".
 *   - "Archived" / "Discontinued" are NEUTRAL: an intentional lifecycle
 *     end-state, not a failure.
 *   - "Trial" (Entitlement) is NEUTRAL: a normal, expected provisioning
 *     state, not a success or a problem.
 */
const STATUS_CATEGORY_BY_TOKEN: Readonly<Record<string, StatusCategory>> = {
	// Positive: a successful / normally-operating / terminal-success state.
	Accepted: "positive",
	Active: "positive",
	Approved: "positive",

	// Neutral: in-progress, intentional idle/administrative, or informational.
	Archived: "neutral",
	Blocked: "neutral",

	// Negative: a failure, rejection, or enforced restriction.
	Cancelled: "negative",
	Clean: "neutral",
	Closed: "neutral",
	Closing: "neutral",
	Committing: "neutral",
	Completed: "positive",
	Current: "positive",
	Delivered: "positive",
	Discontinued: "neutral",
	Dispatched: "neutral",
	Draft: "neutral",
	Ended: "neutral",
	Error: "negative",
	Exception: "negative",
	Expired: "negative",
	Failed: "negative",
	Grace: "neutral",
	Held: "neutral",
	Inactive: "neutral",
	Info: "neutral",
	InProgress: "neutral",
	Invited: "neutral",
	Merged: "neutral",
	Mismatch: "negative",
	Open: "neutral",
	PartiallyCompleted: "neutral",
	PartiallyReceived: "neutral",
	Pending: "neutral",
	PendingApproval: "neutral",
	Posted: "positive",
	Prepared: "neutral",
	Provisioning: "neutral",
	ReadyForApproval: "neutral",
	Received: "positive",
	Reconciled: "positive",
	Rejected: "negative",
	Requested: "neutral",
	RequiresReview: "negative",
	Restricted: "neutral",
	Reversed: "negative",
	Revoked: "negative",
	Running: "neutral",
	Submitted: "neutral",
	Suspended: "negative",
	Trial: "neutral",
	Unavailable: "neutral",
	Uploaded: "neutral",
	Validating: "neutral",
	Warning: "neutral",
} as const;

export type StatusBadgeVariant = "destructive" | "outline" | "secondary";

const CATEGORY_TO_VARIANT: Readonly<
	Record<StatusCategory, StatusBadgeVariant>
> = {
	negative: "destructive",
	neutral: "outline",
	positive: "secondary",
};

/** Looks up the exhaustive map above. An unrecognized token NEVER guesses
 * a color from its text — it fails loudly (via `onUnknown`, `console.error`
 * by default) and renders the safe neutral variant, rather than the prior
 * regex behavior of silently misclassifying anything that happened to
 * contain a recognized substring. */
export function statusBadgeVariant(
	state: string,
	onUnknown: (state: string) => void = (unknown) => {
		// Intentional loud failure signal for a genuinely unmapped status
		// token — same precedent as apps/web/src/app/error.tsx's
		// console.error in its client error boundary. This must never
		// silently default to a color.
		console.error(
			`statusBadgeVariant: unrecognized status token "${unknown}" has no entry in STATUS_CATEGORY_BY_TOKEN — rendering the neutral variant. Add this token to apps/web/src/lib/status.ts.`
		);
	}
): StatusBadgeVariant {
	const category = STATUS_CATEGORY_BY_TOKEN[state];
	if (!category) {
		onUnknown(state);
		return "outline";
	}
	return CATEGORY_TO_VARIANT[category];
}

export function knownStatusTokens(): string[] {
	return Object.keys(STATUS_CATEGORY_BY_TOKEN);
}
