import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createPosService, type PosIdFactory } from "@meridian/domain-pos";
import { createPricingEngine } from "@meridian/engine-pricing";
import { createTaxEngine } from "@meridian/engine-tax";
import {
	createPostgresOutbox,
	migratePlatformEvents,
} from "@meridian/persistence-platform-events-postgres";
import {
	createExportRepository,
	migratePlatformImportExport,
} from "@meridian/persistence-platform-import-export-postgres";
import { migratePlatformNumbering } from "@meridian/persistence-platform-numbering-postgres";
import {
	createPosRepository,
	migratePos,
} from "@meridian/persistence-pos-postgres";
import {
	canonicalJsonStringify,
	createExportService,
} from "@meridian/platform-import-export";
import { env } from "@meridian/tooling-env/server";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { Pool } from "pg";

import { createDepositReferenceAllocator } from "./numbering";
import { createPostgresUnitOfWork } from "./postgres-unit-of-work";

/**
 * WS3 PR4's accountant-handoff export live-PG lane (frozen control plan §9
 * lane-command table), its own isolated database — mirrors `deposits.
 * integration.test.ts`'s pattern. Additionally migrates `platform-import-
 * export-postgres` for `platform_export_job`.
 *
 * Scope note (PR4 contract-coverage enumeration): this lane's fixtures use
 * completed Sales and a Deposit only. Refund/cash-variance posting-rule
 * correctness (Debit/Credit pairing, balance) is already proven at the
 * payload-builder unit level in `packages/platform/import-export/src/
 * index.test.ts` (pure logic, no DB dependency) — duplicating those fixtures
 * here would not add coverage, only cost. This lane instead proves the
 * properties that genuinely require a real database: schema conformance of
 * a REAL generated export, determinism/idempotency against real generation,
 * timezone-aware date-boundary correctness, completeness reconciliation
 * against independently-computed raw SQL, and cross-tenant isolation.
 */
const databaseName = `meridian_finance_handoff_${crypto.randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let testPool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

async function captureError(operation: Promise<unknown>): Promise<unknown> {
	try {
		await operation;
		return null;
	} catch (error) {
		return error;
	}
}

const ids: PosIdFactory = {
	create(kind) {
		return `${kind}_${crypto.randomUUID().replaceAll("-", "")}`;
	},
};

const financeHandoffBase = {
	actorUserId: "finance_handoff_cashier",
	correlationId: "correlation_pos_finance_handoff",
	organizationId: "organization_pos_finance_handoff",
};

function posService() {
	return createPosService({
		clock: () => new Date(),
		depositUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			numbering: createDepositReferenceAllocator(client),
			repository: createPosRepository(client),
		})),
		ids,
		parties: {
			requireActorPartyId: ({ authUserId }) =>
				Promise.resolve(`party_${authUserId}`),
		},
		pricing: createPricingEngine(),
		products: {
			requireProduct: ({ productId }) =>
				Promise.resolve({ productName: `Product ${productId}` }),
		},
		returnUnitOfWork: {
			execute: () =>
				Promise.reject(
					new Error(
						"returnUnitOfWork is not exercised by the PR4 finance-handoff lane"
					)
				),
		},
		saleUnitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			inventory: {
				recordSaleMovement: () =>
					Promise.resolve({ movementId: `movement_${crypto.randomUUID()}` }),
			},
			numbering: {
				allocate: (input) =>
					Promise.resolve({
						value: `R-${input.registerId}-${crypto.randomUUID().slice(0, 6)}`,
					}),
			},
			repository: createPosRepository(client),
		})),
		tax: createTaxEngine(),
		unitOfWork: createPostgresUnitOfWork(testPool, (client) => ({
			events: createPostgresOutbox(client),
			repository: createPosRepository(client),
		})),
	});
}

function exportService() {
	return createExportService({
		clock: () => new Date(),
		hash: {
			sha256: (content) =>
				Promise.resolve(
					createHash("sha256").update(content, "utf8").digest("hex")
				),
		},
		ids: {
			create: (kind) => `${kind}_${crypto.randomUUID().replaceAll("-", "")}`,
		},
		repository: createExportRepository(testPool),
	});
}

/** GYD is UTC-4 with no DST — a fixed offset (America/Guyana). Local
 * midnight on `localDate` is `04:00:00Z` the same calendar day. */
function guyanaLocalMidnightUtc(localDate: string): Date {
	return new Date(`${localDate}T04:00:00.000Z`);
}

async function openRegisterAndCompleteSale(
	pos: ReturnType<typeof posService>,
	input: {
		completedAtOverride?: Date;
		grossMinorPerUnit: number;
		idempotencyPrefix: string;
		quantity: string;
		registerId: string;
		tenantId: string;
	}
) {
	const sessionOpened = await pos.openRegister({
		actorUserId: financeHandoffBase.actorUserId,
		correlationId: financeHandoffBase.correlationId,
		currency: "GYD",
		idempotencyKey: `${input.idempotencyPrefix}-open`,
		locationId: `location_${input.registerId}`,
		openingFloat: { amountMinor: 500_000, currency: "GYD" },
		organizationId: financeHandoffBase.organizationId,
		registerId: input.registerId,
		tenantId: input.tenantId,
	});
	const created = await pos.createSale({
		actorUserId: financeHandoffBase.actorUserId,
		correlationId: financeHandoffBase.correlationId,
		currency: "GYD",
		idempotencyKey: `${input.idempotencyPrefix}-sale-create`,
		lines: [
			{
				productId: "product_finance_handoff",
				quantity: input.quantity,
				unit: "each",
				unitPrice: { amountMinor: input.grossMinorPerUnit, currency: "GYD" },
			},
		],
		organizationId: financeHandoffBase.organizationId,
		registerId: input.registerId,
		tenantId: input.tenantId,
	});
	const completed = await pos.completeSale({
		actorUserId: financeHandoffBase.actorUserId,
		correlationId: financeHandoffBase.correlationId,
		idempotencyKey: `${input.idempotencyPrefix}-sale-complete`,
		organizationId: financeHandoffBase.organizationId,
		saleId: created.id,
		tenantId: input.tenantId,
		tenders: [
			{ amountMinor: created.total.amountMinor, currency: "GYD", type: "Cash" },
		],
	});
	if (input.completedAtOverride) {
		await testPool.query(
			"UPDATE pos_sale SET completed_at = $1 WHERE tenant_id = $2 AND id = $3",
			[input.completedAtOverride, input.tenantId, completed.id]
		);
	}
	return { completed, sessionOpened };
}

async function openRegisterSafeDropAndConfirmDeposit(
	pos: ReturnType<typeof posService>,
	input: {
		amountMinor: number;
		idempotencyPrefix: string;
		registerId: string;
		tenantId: string;
	}
) {
	await pos.openRegister({
		actorUserId: financeHandoffBase.actorUserId,
		correlationId: financeHandoffBase.correlationId,
		currency: "GYD",
		idempotencyKey: `${input.idempotencyPrefix}-open`,
		locationId: `location_${input.registerId}`,
		openingFloat: { amountMinor: 500_000, currency: "GYD" },
		organizationId: financeHandoffBase.organizationId,
		registerId: input.registerId,
		tenantId: input.tenantId,
	});
	const movement = await pos.createCashMovement({
		actorUserId: financeHandoffBase.actorUserId,
		amount: { amountMinor: input.amountMinor, currency: "GYD" },
		correlationId: financeHandoffBase.correlationId,
		direction: "PaidOut",
		idempotencyKey: `${input.idempotencyPrefix}-safedrop`,
		organizationId: financeHandoffBase.organizationId,
		reasonCode: "SafeDrop",
		registerId: input.registerId,
		tenantId: input.tenantId,
	});
	const prepared = await pos.createDeposit({
		actorUserId: financeHandoffBase.actorUserId,
		correlationId: financeHandoffBase.correlationId,
		countedAmountMinor: input.amountMinor,
		currency: "GYD",
		idempotencyKey: `${input.idempotencyPrefix}-deposit-create`,
		organizationId: financeHandoffBase.organizationId,
		sourceShiftIds: [movement.sessionId],
		tenantId: input.tenantId,
	});
	const confirmed = await pos.confirmDeposit({
		actorUserId: `${financeHandoffBase.actorUserId}_confirmer`,
		correlationId: financeHandoffBase.correlationId,
		depositId: prepared.id,
		idempotencyKey: `${input.idempotencyPrefix}-deposit-confirm`,
		organizationId: financeHandoffBase.organizationId,
		tenantId: input.tenantId,
	});
	return confirmed;
}

let financeHandoffSchema: unknown;
let validatePostingBatch: ((data: unknown) => boolean) & { errors?: unknown };

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	testPool = new Pool({ connectionString: testUrl.toString(), max: 8 });
	await migratePlatformEvents(testPool);
	await migratePlatformNumbering(testPool);
	await migratePos(testPool);
	await migratePlatformImportExport(testPool);

	const schemaPath = join(
		dirname(fileURLToPath(import.meta.url)),
		"..",
		"..",
		"..",
		"schemas",
		"finance",
		"finance-handoff-v1.schema.json"
	);
	financeHandoffSchema = JSON.parse(readFileSync(schemaPath, "utf8"));
	const ajv = new Ajv2020({ allErrors: true, strict: true });
	addFormats(ajv);
	validatePostingBatch = ajv.compile(
		financeHandoffSchema as Record<string, unknown>
	) as typeof validatePostingBatch;
});

afterAll(async () => {
	await testPool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

describe.serial(
	"WS3 PR4 accountant handoff export PostgreSQL controlled prototype",
	() => {
		test("migrates idempotently and creates platform_export_job", async () => {
			await migratePlatformImportExport(testPool);
			const tables = await testPool.query<{ table_name: string }>(
				"SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'platform_export_job'"
			);
			expect(tables.rows).toHaveLength(1);
		});

		test("generates an export whose postingBatch validates against the real finance-handoff-v1 JSON schema", async () => {
			const tenantId = "tenant_finance_handoff_schema";
			const pos = posService();
			// WS3 PR6 fix: the sale below completes at the REAL wall-clock "now"
			// (no `completedAtOverride`), so the query period must be anchored
			// to `Date.now()` rather than a hardcoded calendar date — a fixed
			// "2026-07-17..2026-07-19" window is a time bomb that silently
			// empties `source.sales` (and therefore `postingBatch.lines`) the
			// moment a real run crosses the hardcoded end date, exactly as
			// happened here once wall-clock time passed 2026-07-19T00:00Z.
			const periodStartUtc = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const periodEndUtc = new Date(Date.now() + 24 * 60 * 60 * 1000);
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 100_000,
				idempotencyPrefix: "schema",
				quantity: "2",
				registerId: "register_finance_handoff_schema",
				tenantId,
			});

			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			const record = await exportService().createAccountantHandoffExport({
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				idempotencyKey: "schema-export",
				legalEntityId: "legal_entity_finance_handoff_schema",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			});

			const valid = validatePostingBatch(record.payload.postingBatch);
			if (!valid) {
				throw new Error(
					`postingBatch failed finance-handoff-v1 validation: ${JSON.stringify(validatePostingBatch.errors)}`
				);
			}
			expect(valid).toBe(true);
			expect(record.payload.postingBatch.lines.length).toBeGreaterThan(0);
		});

		test("export determinism: two generations with DIFFERENT idempotency keys over identical data produce byte-identical content and hash", async () => {
			const tenantId = "tenant_finance_handoff_determinism";
			const pos = posService();
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 50_000,
				idempotencyPrefix: "determinism",
				quantity: "3",
				registerId: "register_finance_handoff_determinism",
				tenantId,
			});

			// WS3 PR6 fix: same wall-clock time-bomb as the schema-validation
			// test above — anchor to `Date.now()`, not a hardcoded calendar
			// date, so this determinism proof runs over REAL non-empty source
			// data instead of silently passing over an empty `source.sales`.
			const periodStartUtc = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const periodEndUtc = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			expect(source.sales.length).toBeGreaterThan(0);
			const requestBase = {
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				legalEntityId: "legal_entity_finance_handoff_determinism",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			};
			const first = await exportService().createAccountantHandoffExport({
				...requestBase,
				idempotencyKey: "determinism-export-a",
			});
			const second = await exportService().createAccountantHandoffExport({
				...requestBase,
				idempotencyKey: "determinism-export-b",
			});

			expect(first.id).not.toBe(second.id);
			expect(second.contentHash).toBe(first.contentHash);
			expect(canonicalJsonStringify(second.payload)).toBe(
				canonicalJsonStringify(first.payload)
			);
		});

		test("date-boundary correctness: a sale at local midnight (America/Guyana, UTC-4) lands in the correct local day", async () => {
			const tenantId = "tenant_finance_handoff_boundary";
			const pos = posService();
			// Local midnight of 2026-07-17 in America/Guyana (UTC-4) is
			// 2026-07-17T04:00:00.000Z -- the exact left (inclusive) edge of
			// that local day's period.
			const localMidnight = guyanaLocalMidnightUtc("2026-07-17");
			await openRegisterAndCompleteSale(pos, {
				completedAtOverride: localMidnight,
				grossMinorPerUnit: 70_000,
				idempotencyPrefix: "boundary-in",
				quantity: "1",
				registerId: "register_finance_handoff_boundary_in",
				tenantId,
			});
			// One millisecond before local midnight -- belongs to the PRIOR
			// local day, must be EXCLUDED from the 07-17 period.
			await openRegisterAndCompleteSale(pos, {
				completedAtOverride: new Date(localMidnight.getTime() - 1),
				grossMinorPerUnit: 90_000,
				idempotencyPrefix: "boundary-out",
				quantity: "1",
				registerId: "register_finance_handoff_boundary_out",
				tenantId,
			});

			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc: guyanaLocalMidnightUtc("2026-07-18"),
				periodStartUtc: localMidnight,
				tenantId,
			});
			expect(source.sales).toHaveLength(1);
			expect(source.sales[0]?.grossMinor).toBe(70_000);
		});

		test("completeness reconciliation: exported control totals equal independently-computed raw SQL sums", async () => {
			const tenantId = "tenant_finance_handoff_completeness";
			const pos = posService();
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 40_000,
				idempotencyPrefix: "completeness-1",
				quantity: "2",
				registerId: "register_finance_handoff_completeness_1",
				tenantId,
			});
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 25_000,
				idempotencyPrefix: "completeness-2",
				quantity: "5",
				registerId: "register_finance_handoff_completeness_2",
				tenantId,
			});
			const deposit = await openRegisterSafeDropAndConfirmDeposit(pos, {
				amountMinor: 30_000,
				idempotencyPrefix: "completeness-deposit",
				registerId: "register_finance_handoff_completeness_deposit",
				tenantId,
			});
			expect(deposit.state).toBe("Reconciled");

			const periodStartUtc = new Date("2026-07-01T00:00:00.000Z");
			const periodEndUtc = new Date("2026-08-01T00:00:00.000Z");
			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			const record = await exportService().createAccountantHandoffExport({
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				idempotencyKey: "completeness-export",
				legalEntityId: "legal_entity_finance_handoff_completeness",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			});

			const independentSums = await testPool.query<{
				gross_sales_minor: string;
				tax_minor: string;
				cash_minor: string;
			}>(
				"SELECT coalesce(sum(gross_minor), 0)::text AS gross_sales_minor, coalesce(sum(tax_minor), 0)::text AS tax_minor, coalesce(sum(total_minor), 0)::text AS cash_minor FROM pos_sale WHERE tenant_id = $1 AND organization_id = $2 AND state = 'Completed' AND completed_at >= $3 AND completed_at < $4",
				[
					tenantId,
					financeHandoffBase.organizationId,
					periodStartUtc,
					periodEndUtc,
				]
			);
			const independentDepositSum = await testPool.query<{ total: string }>(
				"SELECT coalesce(sum(amount_minor), 0)::text AS total FROM pos_deposit WHERE tenant_id = $1 AND organization_id = $2 AND state = 'Reconciled' AND confirmed_at >= $3 AND confirmed_at < $4",
				[
					tenantId,
					financeHandoffBase.organizationId,
					periodStartUtc,
					periodEndUtc,
				]
			);
			const independentQuantitySum = await testPool.query<{ total: string }>(
				"SELECT coalesce(sum(l.quantity), 0)::text AS total FROM pos_sale_line l JOIN pos_sale s ON s.tenant_id = l.tenant_id AND s.id = l.sale_id WHERE s.tenant_id = $1 AND s.organization_id = $2 AND s.state = 'Completed' AND s.completed_at >= $3 AND s.completed_at < $4",
				[
					tenantId,
					financeHandoffBase.organizationId,
					periodStartUtc,
					periodEndUtc,
				]
			);

			expect(record.payload.postingBatch.controlTotals.grossSalesMinor).toBe(
				Number(independentSums.rows[0]?.gross_sales_minor ?? "0")
			);
			expect(record.payload.postingBatch.controlTotals.taxMinor).toBe(
				Number(independentSums.rows[0]?.tax_minor ?? "0")
			);
			expect(record.payload.postingBatch.controlTotals.cashMinor).toBe(
				Number(independentSums.rows[0]?.cash_minor ?? "0")
			);
			expect(record.payload.postingBatch.controlTotals.depositMinor).toBe(
				Number(independentDepositSum.rows[0]?.total ?? "0")
			);
			// No returns in this fixture, so the net signed quantity (scale
			// 1,000,000) equals the sale-line quantity sum alone, scaled.
			const expectedQuantityScaled = Math.round(
				Number(independentQuantitySum.rows[0]?.total ?? "0") * 1_000_000
			);
			expect(
				record.payload.postingBatch.controlTotals.inventoryQuantityInMinorUnits
			).toBe(expectedQuantityScaled);
		});

		test("cross-tenant isolation: an export for one tenant never includes another tenant's sales, and reads deny across tenants", async () => {
			const tenantA = "tenant_finance_handoff_iso_a";
			const tenantB = "tenant_finance_handoff_iso_b";
			const pos = posService();
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 60_000,
				idempotencyPrefix: "iso-a",
				quantity: "1",
				registerId: "register_finance_handoff_iso_a",
				tenantId: tenantA,
			});
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 999_000,
				idempotencyPrefix: "iso-b",
				quantity: "1",
				registerId: "register_finance_handoff_iso_b",
				tenantId: tenantB,
			});

			const periodStartUtc = new Date("2026-07-01T00:00:00.000Z");
			const periodEndUtc = new Date("2026-08-01T00:00:00.000Z");
			const sourceA = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId: tenantA,
			});
			expect(sourceA.sales).toHaveLength(1);
			expect(sourceA.sales[0]?.grossMinor).toBe(60_000);

			const svc = exportService();
			const recordA = await svc.createAccountantHandoffExport({
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				idempotencyKey: "iso-export-a",
				legalEntityId: "legal_entity_finance_handoff_iso_a",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source: sourceA,
				tenantId: tenantA,
				timezone: "America/Guyana",
			});
			expect(recordA.payload.postingBatch.controlTotals.grossSalesMinor).toBe(
				60_000
			);

			// Reading tenant A's export under tenant B's tenant scope must
			// deny, not silently return tenant A's data (explicit awaited
			// try/catch per TECH-LESSON-036/044, never `.rejects` chained
			// directly to the live-PG-backed service call).
			const crossTenantError = await captureError(
				svc.getAccountantHandoffExport({
					exportId: recordA.id,
					tenantId: tenantB,
				})
			);
			expect(crossTenantError).toMatchObject({ code: "not_found" });

			const foundOwnTenant = await svc.getAccountantHandoffExport({
				exportId: recordA.id,
				tenantId: tenantA,
			});
			expect(foundOwnTenant.id).toBe(recordA.id);
		});

		test("WS3 remediation R2, Finding D: same idempotency key + a genuinely different request (different period) is denied as a real live-PG idempotency_conflict, not a silent wrong export", async () => {
			const tenantId = "tenant_finance_handoff_finding_d_conflict";
			const pos = posService();
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 10_000,
				idempotencyPrefix: "finding-d-conflict",
				quantity: "1",
				registerId: "register_finance_handoff_finding_d_conflict",
				tenantId,
			});
			const periodStartUtc = new Date("2026-07-01T00:00:00.000Z");
			const periodEndUtc = new Date("2026-08-01T00:00:00.000Z");
			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			const svc = exportService();
			const requestBase = {
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				idempotencyKey: "finding-d-conflict-key",
				legalEntityId: "legal_entity_finding_d_conflict",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			};
			const first = await svc.createAccountantHandoffExport(requestBase);

			// Same key, a DIFFERENT period end -- a genuinely different
			// request. Pre-fix, `createExportJob`'s onConflictDoNothing simply
			// returned the FIRST export's row (the January-scoped export)
			// silently, as if it satisfied this differently-scoped request.
			const conflictingError = await captureError(
				svc.createAccountantHandoffExport({
					...requestBase,
					periodEndUtc: new Date("2026-09-01T00:00:00.000Z"),
				})
			);
			expect(conflictingError).toMatchObject({ code: "idempotency_conflict" });

			// Exactly one row exists for this idempotency key -- the
			// conflicting request never got written, silently or otherwise.
			const rows = await testPool.query<{ period_end_utc: Date }>(
				"SELECT period_end_utc FROM platform_export_job WHERE tenant_id = $1 AND idempotency_key = $2",
				[tenantId, requestBase.idempotencyKey]
			);
			expect(rows.rows).toHaveLength(1);
			expect(rows.rows[0]?.period_end_utc.toISOString()).toBe(
				periodEndUtc.toISOString()
			);

			// The SAME exact request still replays cleanly (non-regression).
			const replayed = await svc.createAccountantHandoffExport(requestBase);
			expect(replayed).toEqual(first);
		});

		test("WS3 remediation R2, Finding D: two truly concurrent live-PG requests with the same key and same fingerprint create exactly ONE export row and both callers receive the identical result", async () => {
			const tenantId = "tenant_finance_handoff_finding_d_concurrent";
			const pos = posService();
			await openRegisterAndCompleteSale(pos, {
				grossMinorPerUnit: 15_000,
				idempotencyPrefix: "finding-d-concurrent",
				quantity: "1",
				registerId: "register_finance_handoff_finding_d_concurrent",
				tenantId,
			});
			const periodStartUtc = new Date("2026-07-01T00:00:00.000Z");
			const periodEndUtc = new Date("2026-08-01T00:00:00.000Z");
			const source = await pos.queryFinanceHandoffSourceData({
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				tenantId,
			});
			const request = {
				actorUserId: financeHandoffBase.actorUserId,
				currency: "GYD",
				idempotencyKey: "finding-d-concurrent-key",
				legalEntityId: "legal_entity_finding_d_concurrent",
				organizationId: financeHandoffBase.organizationId,
				periodEndUtc,
				periodStartUtc,
				source,
				tenantId,
				timezone: "America/Guyana",
			};
			// Two genuinely separate `exportService()` instances (separate
			// closures, same live pool) issuing the same request at the same
			// time -- the real unique-index race, not a mock's single-threaded
			// interleaving.
			const [first, second] = await Promise.all([
				exportService().createAccountantHandoffExport(request),
				exportService().createAccountantHandoffExport(request),
			]);
			expect(second).toEqual(first);
			const rows = await testPool.query(
				"SELECT id FROM platform_export_job WHERE tenant_id = $1 AND idempotency_key = $2",
				[tenantId, request.idempotencyKey]
			);
			expect(rows.rows).toHaveLength(1);
		});
	}
);
