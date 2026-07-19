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
 */
export function requireLegalEntityScope(input: {
	contextLegalEntityId?: string | null;
	requestLegalEntityId: string;
}): void {
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
