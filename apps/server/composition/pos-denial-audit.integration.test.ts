import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { createHash, randomUUID } from "node:crypto";
import { PosError } from "@meridian/domain-pos";
import {
	createAuditRepository,
	migratePlatformAudit,
} from "@meridian/persistence-platform-audit-postgres";
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
 * WS3 remediation R4, P2 item 3 / Finding C's own closing criterion
 * ("denial produces the required Audit evidence but no business effect").
 *
 * Adversarial framing: before this fix, NOTHING in the repository ever
 * persisted `outcome: "denied"` to Platform Audit (verified: `grep -rn
 * "outcome: \"denied\"" apps/server packages` returned zero matches on
 * the pre-fix tree, and none of the WS3 maker/checker test files —
 * `packages/domains/pos/src/index.test.ts`, `pos.integration.test.ts`,
 * `returns.integration.test.ts`, `deposits.integration.test.ts` — contain
 * the word "audit" at all). A self-approval or permission denial left
 * ZERO evidentiary trace. This test proves a REAL row lands in the real
 * Platform Audit table (`createAuditRepository`/`migratePlatformAudit`
 * against live PostgreSQL, not a mock), with the correct scope, outcome,
 * action, and target — and that the caller still sees the original
 * denial error, not an audit-plumbing error.
 */

const databaseName = `meridian_pos_denial_audit_${randomUUID().replaceAll("-", "")}`;
const adminUrl = new URL(env.DATABASE_URL);
adminUrl.pathname = "/postgres";
const testUrl = new URL(env.DATABASE_URL);
testUrl.pathname = `/${databaseName}`;
const adminPool = new Pool({ connectionString: adminUrl.toString() });
let pool: Pool;

function quoteIdentifier(value: string): string {
	return `"${value.replaceAll('"', '""')}"`;
}

beforeAll(async () => {
	await adminPool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
	pool = new Pool({
		allowExitOnIdle: true,
		connectionString: testUrl.toString(),
		max: 4,
	});
	await migratePlatformAudit(pool);
});

afterAll(async () => {
	await pool.end();
	await adminPool.query(
		`DROP DATABASE ${quoteIdentifier(databaseName)} WITH (FORCE)`
	);
	await adminPool.end();
});

function realAuditApplication() {
	return createAuditApplication({
		clock: () => new Date(),
		hasher: {
			digest: (value) =>
				Promise.resolve(createHash("sha256").update(value).digest("hex")),
		},
		ids: {
			create: (kind) => `audit_${kind.replace("-", "_")}_${randomUUID()}`,
		},
		repository: createAuditRepository(pool),
		unitOfWork: createPostgresUnitOfWork(pool, (client) =>
			createAuditRepository(client)
		),
	});
}

describe("WS3 remediation R4, P2 item 3: real Platform Audit denial evidence", () => {
	test("a self-approval denial (approval_separation) persists exactly one REAL Audit row, outcome=denied, and rethrows the ORIGINAL error unchanged", async () => {
		const audit = realAuditApplication();
		const tenantId = `tenant_${randomUUID().replaceAll("-", "")}`;
		const organizationId = `org_${randomUUID().replaceAll("-", "")}`;
		const refundId = `refund_${randomUUID().replaceAll("-", "")}`;
		const denialError = new PosError(
			"approval_separation",
			"The requester cannot approve their own refund"
		);
		const contexts: DenialAuditContextResolver = {
			requireContext: async () => ({ organizationId, tenantId }),
		};

		const wrapped = withApprovalDenialAudit({
			action: "commerce.refund.approve.denied",
			audit,
			contexts,
			fn: () => Promise.reject(denialError),
			targetId: () => refundId,
			targetType: "Refund",
		});

		await expect(
			wrapped({
				actorUserId: "auth_user_1",
				contextId: "context_1",
				correlationId: "correlation_1",
				sessionId: "session_1",
			})
		).rejects.toBe(denialError);

		// Independently read back the row using the REPOSITORY directly (not
		// the same append path) — proves the record was truly persisted, not
		// just that `append` resolved without throwing.
		const repository = createAuditRepository(pool);
		const records = await repository.listTenant({ tenantId });
		expect(records).toHaveLength(1);
		expect(records[0]?.outcome).toBe("denied");
		expect(records[0]?.action).toBe("commerce.refund.approve.denied");
		expect(records[0]?.targetId).toBe(refundId);
		expect(records[0]?.targetType).toBe("Refund");
		expect(records[0]?.tenantId).toBe(tenantId);
		expect(records[0]?.organizationId).toBe(organizationId);
		expect(records[0]?.reasonCode).toBe("approval_separation");
		// Hash-chained, tamper-evident record — proves this used the real
		// append pipeline (`recordHash`/`previousHash`), not a bare insert.
		expect(records[0]?.recordHash).toBeTruthy();
	});

	test("a denied permission attempt (AuthorizationError) ALSO persists a real Audit row with reasonCode permission_denied, scoped to a DIFFERENT tenant with zero cross-tenant leakage", async () => {
		const audit = realAuditApplication();
		const tenantId = `tenant_${randomUUID().replaceAll("-", "")}`;
		const otherTenantId = `tenant_${randomUUID().replaceAll("-", "")}`;
		const organizationId = `org_${randomUUID().replaceAll("-", "")}`;
		const depositId = `deposit_${randomUUID().replaceAll("-", "")}`;
		const decision = {
			outcome: "deny" as const,
			reason: "no_assignment" as const,
		};
		const denialError = new AuthorizationError(decision);
		const contexts: DenialAuditContextResolver = {
			requireContext: async () => ({ organizationId, tenantId }),
		};

		const wrapped = withApprovalDenialAudit({
			action: "commerce.deposit.confirm.denied",
			audit,
			contexts,
			fn: () => Promise.reject(denialError),
			targetId: () => depositId,
			targetType: "Deposit",
		});

		await expect(
			wrapped({
				actorUserId: "auth_user_2",
				contextId: "context_2",
				correlationId: "correlation_2",
				sessionId: "session_2",
			})
		).rejects.toBe(denialError);

		const repository = createAuditRepository(pool);
		const scoped = await repository.listTenant({ tenantId });
		expect(scoped).toHaveLength(1);
		expect(scoped[0]?.reasonCode).toBe("permission_denied");
		expect(scoped[0]?.outcome).toBe("denied");

		// The SAME query against the OTHER tenant sees nothing — the denial
		// audit record is tenant-scoped exactly like every other WS3 read.
		const unrelated = await repository.listTenant({ tenantId: otherTenantId });
		expect(unrelated).toHaveLength(0);
	});

	test("classifyApprovalDenial correctly distinguishes denial errors from ordinary business errors (not_found does NOT count as a denial)", () => {
		expect(
			classifyApprovalDenial(
				new PosError("approval_separation", "self-approval")
			)
		).toBe("approval_separation");
		expect(
			classifyApprovalDenial(new PosError("not_found", "missing"))
		).toBeNull();
		expect(
			classifyApprovalDenial(
				new AuthorizationError({
					outcome: "deny",
					reason: "no_assignment",
				})
			)
		).toBe("permission_denied");
	});
});
