import assert from "node:assert/strict";
import {
	createPosApplication,
	createPosService,
	PosError,
	type PosIdFactory,
} from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import {
	createAuditRepository,
	migratePlatformAudit,
} from "@meridian/persistence-platform-audit-postgres";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	createPosRepository,
	migratePos,
} from "@meridian/persistence-pos-postgres";
import { createAuditApplication } from "@meridian/platform-audit";
import { AuthorizationError } from "@meridian/platform-authorization";
import { env } from "@meridian/tooling-env/server";
import { Pool } from "pg";

import {
	classifyApprovalDenial,
	type DenialAuditContextResolver,
	withApprovalDenialAudit,
} from "./pos";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

/**
 * WS3 remediation R4, P2 item 12 ("Extend the Node fallback with
 * meaningful WS3 critical-path coverage or correct every document that
 * currently claims it exists.").
 *
 * Pre-fix state: `db:test:node` ran ONLY `persistence.node-check.ts`
 * (WS2-owned Catalog/Inventory/Import persistence) and
 * `ws1-critical.node-check.ts` (WS1 identity/tenancy/authorization) —
 * confirmed by reading both files and `package.json`'s `db:test:node`
 * script; neither exercises any `@meridian/domain-pos`,
 * `@meridian/persistence-pos-postgres`, or WS3 composition code at all.
 * ADR-0020 requires domain/application/contract/authorization code stay
 * runtime-neutral (no Bun-only globals or APIs); WS3 had never actually
 * been PROVEN to run under plain Node, only asserted to. This file closes
 * that gap with two real, Postgres-backed critical paths run under Node:
 *
 * 1. Finding A's own closing criterion (register cash-ledger integrity —
 *    opening float + a posted PaidIn cash movement compose into the
 *    correct authoritative expected cash, and a register closes cleanly
 *    at zero variance), using the SAME `createPosService`/
 *    `createPosRepository` construction `pos.integration.test.ts`'s PR1
 *    live-PG lane uses (proven pattern, not reinvented).
 * 2. This stage's own P2 item 3 fix (real Platform Audit denial evidence)
 *    — `classifyApprovalDenial`/`withApprovalDenialAudit`, imported
 *    directly from the real composition module `./pos.ts` (not
 *    reimplemented), against a real Postgres-backed
 *    `createAuditApplication`, exactly mirroring
 *    `pos-denial-audit.integration.test.ts`'s Bun-side proof so the SAME
 *    code path is now proven under both runtimes.
 */

const databaseName = `meridian_ws3_node_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const databaseUrl = new URL(env.DATABASE_URL);
databaseUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
const pool = new Pool({ connectionString: databaseUrl.toString(), max: 4 });

try {
	await migratePlatformEvents(pool);
	await migratePos(pool);
	await migratePlatformAudit(pool);

	const ids: PosIdFactory = {
		create(kind) {
			return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
		},
	};
	const posService = createPosService({
		clock: () => new Date(),
		depositUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("depositUnitOfWork not exercised by this check")
				),
		},
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		pricing: createPricingEngine(),
		products: {
			requireProduct: () =>
				Promise.reject(new Error("products port not exercised by this check")),
		},
		returnUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error("returnUnitOfWork not exercised by this check")
				),
		},
		saleUnitOfWork: {
			execute: () =>
				Promise.reject(new Error("saleUnitOfWork not exercised by this check")),
		},
		tax: createTaxEngine(),
		unitOfWork: createPostgresUnitOfWork(pool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});

	const base = {
		actorUserId: "node_pos_maker",
		correlationId: "correlation_ws3_node",
		locationId: "location_ws3_node",
		organizationId: "organization_ws3_node",
		registerId: "register_ws3_node",
		tenantId: "tenant_ws3_node",
	};

	await posService.openRegister({
		...base,
		currency: "GYD",
		idempotencyKey: "ws3-node-open",
		openingFloat: { amountMinor: 5000, currency: "GYD" },
	});
	await posService.createCashMovement({
		...base,
		amount: { amountMinor: 2000, currency: "GYD" },
		direction: "PaidIn",
		idempotencyKey: "ws3-node-paid-in",
		reasonCode: "PaidIn",
	});
	// Finding A: opening 5000 + a posted PaidIn of 2000 => authoritative
	// expected cash 7000. Counting exactly 7000 must close with ZERO
	// variance and no approval requirement — proving the ledger, not a
	// partial reconstruction, drives the real Postgres-backed close under
	// Node.
	const closed = await posService.closeRegister({
		...base,
		countedCash: { amountMinor: 7000, currency: "GYD" },
		idempotencyKey: "ws3-node-close",
	});
	assert.equal(closed.state, "Closed");
	assert.deepEqual(closed.variance, { amountMinor: 0, currency: "GYD" });
	assert.equal(closed.varianceApprovalRequired, false);

	const closedRow = await pool.query<{ state: string }>(
		"SELECT state FROM pos_register_session WHERE tenant_id = $1 AND id = $2",
		[base.tenantId, closed.id]
	);
	assert.equal(closedRow.rows[0]?.state, "Closed");

	// P2 item 3: real Platform Audit denial evidence, same code this
	// stage wired into the real `posApplication` composition, proven a
	// second time under Node against a real Postgres Audit table.
	const auditApplication = createAuditApplication({
		clock: () => new Date(),
		hasher: {
			digest: (value) =>
				import("node:crypto").then(({ createHash }) =>
					createHash("sha256").update(value).digest("hex")
				),
		},
		ids: {
			create: (kind) =>
				`audit_${kind.replace("-", "_")}_node_${crypto.randomUUID()}`,
		},
		repository: createAuditRepository(pool),
		unitOfWork: createPostgresUnitOfWork(pool, (client) =>
			createAuditRepository(client)
		),
	});
	const denialTenantId = "tenant_ws3_node_denial";
	const denialOrganizationId = "organization_ws3_node_denial";
	const contexts: DenialAuditContextResolver = {
		requireContext: () =>
			Promise.resolve({
				organizationId: denialOrganizationId,
				tenantId: denialTenantId,
			}),
	};
	const denialError = new PosError(
		"approval_separation",
		"The requester cannot approve their own refund"
	);
	const wrapped = withApprovalDenialAudit({
		action: "commerce.refund.approve.denied",
		audit: auditApplication,
		contexts,
		fn: () => Promise.reject(denialError),
		targetId: () => "refund_ws3_node_check",
		targetType: "Refund",
	});
	await assert.rejects(
		wrapped({
			actorUserId: "node_denial_actor",
			contextId: "context_ws3_node_denial",
			correlationId: "correlation_ws3_node_denial",
			sessionId: "session_ws3_node_denial",
		}),
		(error: unknown) => error === denialError
	);
	const auditRepository = createAuditRepository(pool);
	const auditRows = await auditRepository.listTenant({
		tenantId: denialTenantId,
	});
	assert.equal(auditRows.length, 1);
	assert.equal(auditRows[0]?.outcome, "denied");
	assert.equal(auditRows[0]?.action, "commerce.refund.approve.denied");
	assert.equal(auditRows[0]?.reasonCode, "approval_separation");

	// `classifyApprovalDenial` itself, exercised directly (no DB needed) —
	// same function, same two branches `pos.ts`'s real wiring depends on.
	assert.equal(
		classifyApprovalDenial(new PosError("approval_separation", "self")),
		"approval_separation"
	);
	assert.equal(
		classifyApprovalDenial(new PosError("not_found", "missing")),
		null
	);
	assert.equal(
		classifyApprovalDenial(
			new AuthorizationError({ outcome: "deny", reason: "no_assignment" })
		),
		"permission_denied"
	);

	// Every helper import used above (`createPosApplication`) must remain
	// a live, real export of the composition module under Node — a stale
	// re-export here would be a silent drift the type checker alone would
	// not necessarily catch across a runtime boundary.
	assert.equal(typeof createPosApplication, "function");
} finally {
	await pool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
}

// No console output on success, matching `persistence.node-check.ts` and
// `ws1-critical.node-check.ts`'s established convention (CLAUDE.md §11
// prohibits `console.log` in committed code) — a non-zero exit code from
// an uncaught `assert` failure is this script's only success/failure
// signal, exactly like its two siblings.
