import { ExportError } from "@meridian/platform-import-export";

/**
 * WS3 remediation R2, Finding K (legal-entity export scope). The directive
 * frames K as a PARTIAL finding and PRE-RESOLVED — not an open founder/
 * authority policy question:
 * `docs/blueprint/04-Business-Domains/FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md`'s
 * Quality Gates section lists "Tenant and legal-entity isolation" as a
 * mandatory, always-required property of the finance handoff contract — an
 * export proceeding without enforced legal-entity isolation is a
 * conformance bug against an already-approved contract, not a business
 * decision this run needs to invent. See `remediation-dispositions.md`
 * "## K — Legal-entity export scope" for the full disposition.
 *
 * This is a standalone module (no other imports) deliberately: it is
 * exercised by a plain `bun:test` unit test
 * (`apps/server/src/legal-entity-scope.test.ts`) that must never require a
 * live database connection, and `apps/server/composition/*.ts` modules
 * generally DO pull in `@meridian/tooling-env/server`'s validated
 * `DATABASE_URL` at import time via `./postgres` — importing THIS file
 * alone from a `src/*.test.ts` unit test avoids that transitive
 * dependency entirely.
 *
 * Fails CLOSED, preserving the existing mismatch-denial behavior: an
 * export request that declares a `requestLegalEntityId` (currently only
 * `createAccountantHandoffExport` — `getAccountantHandoffExport` never
 * calls this at all, unchanged) requires the active tenancy context to ALSO
 * carry a `contextLegalEntityId`, and the two must match. Previously, when
 * `contextLegalEntityId` was unset, the check short-circuited to a no-op
 * and the caller-supplied `requestLegalEntityId` flowed straight into the
 * export record UNVERIFIED — the real gap this closes. When BOTH are
 * present and equal, the export proceeds exactly as before.
 *
 * Defense in depth (raised on advisor review of this stage): the ONLY
 * real caller today, `createAccountantHandoffExportContract`'s oRPC
 * contract, already rejects an empty-string `legalEntityId` before this
 * function is ever reached (`AccountantHandoffRequestSchema.legalEntityId`
 * is `IdentifierSchema`, a `^[A-Za-z0-9_-]{12,64}$` regex — an empty
 * string cannot pass it). This function does not rely on that upstream
 * guard staying in place: `requestLegalEntityId` is validated for falsy
 * values (empty string included) exactly like `contextLegalEntityId`, so
 * "legalEntityId unset on either side is now REJECTED" (the directive's
 * own wording) holds even if a future caller reaches this function through
 * a path that skips the transport-level schema.
 */
export function requireLegalEntityScope(input: {
	contextLegalEntityId?: string | null;
	requestLegalEntityId: string;
}): void {
	if (!input.requestLegalEntityId) {
		throw new ExportError(
			"validation",
			"legalEntityId is required for this export"
		);
	}
	if (!input.contextLegalEntityId) {
		throw new ExportError(
			"validation",
			"Legal-entity scope is required for this export and the active context carries none"
		);
	}
	if (input.contextLegalEntityId !== input.requestLegalEntityId) {
		throw new ExportError(
			"validation",
			"legalEntityId does not match the active context"
		);
	}
}

/**
 * WS3 remediation R3, cycle 1 (remediation-of-remediation). `requireLegal
 * EntityScope` above is unchanged and still fails closed on a falsy
 * `contextLegalEntityId` — that policy is correct and frozen. The bug was
 * one layer up, in what `finance-handoff.ts`'s `requireExportContext` PASSED
 * as `contextLegalEntityId`: it read `context.legalEntityId` directly, and
 * NO code path in this system can ever populate that field for a real
 * session. `packages/platform/tenancy/src/index.ts`'s `setActiveContext` —
 * the only writer of an `ActiveContextRecord` — unconditionally throws
 * `TenancyError("not_found", "Legal-entity and branch context are not
 * implemented in PR3")` the instant a caller supplies `legalEntityId`, so
 * `context.legalEntityId` is always `undefined` in production, dev, and
 * every e2e/browser session today. The R2 fix therefore rejected every real
 * call to `createAccountantHandoffExport`, not merely unverified ones — a
 * total outage of the transport path, invisible to R2's own DB-free
 * pure-function unit test of `requireLegalEntityScope` alone (which never
 * exercises `requireExportContext`'s wiring).
 *
 * This function is the fix: derive the effective legal-entity scope from
 * `context.organizationId` whenever `context.legalEntityId` is unset. This
 * is the directive's own documented alternative for Finding K ("prove the
 * requested legal entity belongs to the active organization and actor
 * authority") and matches `finance-handoff.ts`'s long-standing comment that
 * "single legal entity per organization is the deployed reality this
 * branch proves." `context.organizationId` is populated on every real
 * active context (it is not optional, unlike `legalEntityId`) and cannot be
 * forged by the caller — it comes from the verified tenancy context, never
 * from request input — so a caller-supplied `legalEntityId` that does not
 * match their own organization is still rejected by `requireLegalEntity
 * Scope` exactly as R2 intended. If a real Legal Entity domain later lets
 * `setActiveContext` populate `legalEntityId` for real, that value is
 * preferred first and this fallback becomes a no-op automatically.
 */
export function resolveContextLegalEntityId(context: {
	legalEntityId?: string | null;
	organizationId: string;
}): string {
	return context.legalEntityId || context.organizationId;
}
