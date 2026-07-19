import { createHash, randomUUID } from "node:crypto";
import type { AccountantHandoffExport } from "@meridian/contracts-platform-api";
import { createExportRepository } from "@meridian/persistence-platform-import-export-postgres";
import {
	createExportService,
	ExportError,
	type ExportJobRecord,
} from "@meridian/platform-import-export";

import { auditApplication } from "./audit";
import { permissionAuthorizer } from "./authorization";
import { entitlementEvaluator } from "./entitlements";
import { requireLegalEntityScope } from "./legal-entity-scope";
import { posService } from "./pos";
import { databasePool } from "./postgres";
import { tenancyService } from "./tenancy";

function exportView(record: ExportJobRecord): AccountantHandoffExport {
	return {
		contentHash: record.contentHash,
		currency: record.currency,
		generatedAt: record.generatedAt.toISOString(),
		id: record.id,
		idempotencyKey: record.idempotencyKey,
		kind: record.kind,
		legalEntityId: record.legalEntityId,
		organizationId: record.organizationId,
		payload: record.payload as unknown as Record<string, unknown>,
		periodEnd: record.periodEndUtc.toISOString(),
		periodStart: record.periodStartUtc.toISOString(),
		ruleVersion: record.ruleVersion,
		schemaVersion: record.schemaVersion,
		tenantId: record.tenantId,
		timezone: record.timezone,
	};
}

/**
 * WS3 PR4's accountant-handoff export composition (frozen control plan
 * §8.1, `FIRST_SLICE_FINANCE_HANDOFF_CONTRACT.md`/PDA-DOM-026). This is
 * the ONLY place `posService.queryFinanceHandoffSourceData(...)` (a
 * `@meridian/domain-pos` READ) is passed into
 * `createExportService`'s builder (a `@meridian/platform-import-export`
 * function) — the two packages are in different architecture-rules
 * families (`domains` and `platform`) and never import each other
 * directly; the values are structurally, not nominally, compatible
 * (`AccountantHandoffSourceData` mirrors `PosFinanceHandoffSourceData`
 * field-for-field). See ARCHITECTURE_DEPENDENCY_RULES.md 1.12.0.
 *
 * No transactional unit of work is needed: export generation is a single
 * idempotency-guarded insert with no outbox event (no `platform.export.*`
 * event is registered — the export job row is the durable record).
 */
const exportService = createExportService({
	clock: () => new Date(),
	hash: {
		sha256: (content) =>
			Promise.resolve(
				createHash("sha256").update(content, "utf8").digest("hex")
			),
	},
	ids: {
		create: (kind) => `${kind}_${randomUUID().replaceAll("-", "")}`,
	},
	repository: createExportRepository(databasePool),
});

async function requireExportContext(input: {
	actorUserId: string;
	contextId: string;
	legalEntityId?: string;
	permission: "platform.export.create" | "platform.export.read";
	sessionId: string;
}) {
	const context = await tenancyService.requireContext({
		authUserId: input.actorUserId,
		contextId: input.contextId,
		sessionId: input.sessionId,
	});
	await permissionAuthorizer.requirePermission({
		assuranceLevel: "aal1",
		authUserId: input.actorUserId,
		contextId: input.contextId,
		permission: input.permission,
		sessionId: input.sessionId,
	});
	// Realized under `commerce.cash-management` — the same registered
	// first-slice capability WS3 control plan §10.2 resolves deposits
	// under, since deposits are the newest and most custody-sensitive
	// data surface this export reads (PR4 contract-coverage enumeration).
	await entitlementEvaluator.requireEntitlement({
		access: input.permission === "platform.export.create" ? "Write" : "Read",
		capabilityId: "commerce.cash-management",
		organizationId: context.organizationId,
		tenantId: context.tenantId,
	});
	// Legal-entity isolation (PR4 contract-coverage enumeration; WS3
	// remediation R2, Finding K — see `remediation-dispositions.md` "## K").
	// POS records carry no `legalEntityId` in first slice (a governed
	// simplification — single legal entity per organization is the
	// deployed reality this branch proves). What IS enforced: a caller
	// may not request an export under a `legalEntityId` different from the
	// one bound to their active context — AND, fixing the Finding K gap,
	// a request that declares a `legalEntityId` at all now FAILS CLOSED if
	// the active context carries none, instead of silently proceeding with
	// the caller-supplied value unverified. Checked by PRESENCE
	// (`!== undefined`), not truthiness: `getAccountantHandoffExport` (a
	// read) never passes this field at all (parameter omitted, genuinely
	// `undefined`) and stays exempt, exactly as before; `createAccountant
	// HandoffExport`'s `legalEntityId` is a required `string` on its own
	// input type, so this branch always runs for creates, and
	// `requireLegalEntityScope` itself now rejects an empty-string
	// `requestLegalEntityId` as a defense-in-depth backstop to the
	// transport-level `IdentifierSchema` regex that already blocks one.
	if (input.legalEntityId !== undefined) {
		requireLegalEntityScope({
			contextLegalEntityId: context.legalEntityId,
			requestLegalEntityId: input.legalEntityId,
		});
	}
	return context;
}

export const financeHandoffTransportApplication = {
	async createAccountantHandoffExport(input: {
		actorUserId: string;
		contextId: string;
		correlationId: string;
		currency: string;
		idempotencyKey: string;
		legalEntityId: string;
		periodEnd: string;
		periodStart: string;
		sessionId: string;
		timezone: string;
	}) {
		const context = await requireExportContext({
			actorUserId: input.actorUserId,
			contextId: input.contextId,
			legalEntityId: input.legalEntityId,
			permission: "platform.export.create",
			sessionId: input.sessionId,
		});
		const periodStartUtc = new Date(input.periodStart);
		const periodEndUtc = new Date(input.periodEnd);
		if (
			Number.isNaN(periodStartUtc.getTime()) ||
			Number.isNaN(periodEndUtc.getTime())
		) {
			throw new ExportError(
				"validation",
				"periodStart/periodEnd must be valid ISO 8601 date-times"
			);
		}
		const source = await posService.queryFinanceHandoffSourceData({
			organizationId: context.organizationId,
			periodEndUtc,
			periodStartUtc,
			tenantId: context.tenantId,
		});
		const record = await exportService.createAccountantHandoffExport({
			actorUserId: input.actorUserId,
			currency: input.currency,
			idempotencyKey: input.idempotencyKey,
			legalEntityId: input.legalEntityId,
			organizationId: context.organizationId,
			periodEndUtc,
			periodStartUtc,
			source,
			tenantId: context.tenantId,
			timezone: input.timezone,
		});
		// "The export is permissioned, encrypted in transit and at rest,
		// time-limited, auditable, and reproducible" (PDA-DOM-026) — the
		// permission/reproducibility properties are enforced/proven above
		// and by the export-determinism live-PG test; this is the
		// "auditable" half, mirroring the import command's own
		// `auditApplication.append` call in `./imports.ts`.
		await auditApplication.append({
			action: "platform.export.created",
			actorType: "human",
			actorUserId: input.actorUserId,
			classification: "Confidential",
			correlationId: input.correlationId,
			metadata: {
				contentHash: record.contentHash,
				kind: record.kind,
				legalEntityId: record.legalEntityId,
			},
			occurredAt: record.generatedAt,
			outcome: "success",
			retentionClass: "platform-security-evidence",
			scopeType: "Tenant",
			sourceChannel: "api",
			targetId: record.id,
			targetType: "AccountantHandoffExport",
			tenantId: context.tenantId,
		});
		return exportView(record);
	},

	async getAccountantHandoffExport(input: {
		actorUserId: string;
		contextId: string;
		exportId: string;
		sessionId: string;
	}) {
		const context = await requireExportContext({
			actorUserId: input.actorUserId,
			contextId: input.contextId,
			permission: "platform.export.read",
			sessionId: input.sessionId,
		});
		const record = await exportService.getAccountantHandoffExport({
			exportId: input.exportId,
			tenantId: context.tenantId,
		});
		return exportView(record);
	},
};
